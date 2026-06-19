import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExchangeRates, convertAmount } from "@/lib/currency";

import { addFrequency } from "@/utils/recurrence";
export async function GET(request: Request) {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: "global" } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: "global", homeCurrency: "CAD" } });
    }
    const homeCurrency = settings.homeCurrency;
    const rates = await getExchangeRates(homeCurrency);

    const { searchParams } = new URL(request.url);
    const monthsParam = searchParams.get('months') || '60'; // Default 5 years
    const futureMonths = parseInt(monthsParam, 10);
    const pastMonths = 1; // Only show 1 month of history so 'Today' sits on the far left
    
    // Parse accountIds if provided
    const accountIdsParam = searchParams.get('accountIds');
    const selectedAccountIds = accountIdsParam ? accountIdsParam.split(',').filter(id => id.trim() !== '') : null;

    // 1. Get current balance
    const accounts = await prisma.account.findMany({
      where: selectedAccountIds ? { id: { in: selectedAccountIds }, isArchived: false } : { includeInTotal: true, isArchived: false }
    });
    const currentBalance = accounts.reduce((acc, account) => acc + convertAmount(account.balance, account.currency, homeCurrency, rates), 0);

    // 2. Get historical transactions (last 12 months)
    const now = new Date();
    const historyStart = new Date(now.getFullYear(), now.getMonth() - pastMonths, 1);
    
    // We want the net flow per month to reconstruct historical balances
    // Since currentBalance is NOW, balance at the end of last month = currentBalance - (net flow this month so far)
    // To make it simple, let's group all transactions by month/year.
    const allTransactions = await prisma.transaction.findMany({
      where: selectedAccountIds 
        ? { accountId: { in: selectedAccountIds } } 
        : { account: { includeInTotal: true, isArchived: false } },
      select: { amount: true, date: true, account: { select: { currency: true } } }
    });

    // Calculate historical monthly net flow
    const historyMap = new Map<string, number>(); // format: "YYYY-MM" -> net flow
    for (const tx of allTransactions) {
      const year = tx.date.getFullYear();
      const month = String(tx.date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      const convertedAmt = convertAmount(tx.amount, tx.account.currency, homeCurrency, rates);
      historyMap.set(key, (historyMap.get(key) || 0) + convertedAmt);
    }

    // Build historical balance points (backward calculation)
    let runningBalanceBackward = currentBalance;
    const historicalPoints = [];
    
    // Start from current month and go backward
    for (let i = 0; i <= pastMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${monthStr}`;
      
      historicalPoints.unshift({
        date: key,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        balance: runningBalanceBackward,
        isHistory: true,
      });

      // To get the balance at the end of the previous month, subtract this month's net flow
      const flowThisMonth = historyMap.get(key) || 0;
      runningBalanceBackward -= flowThisMonth;
    }

    // 3. Project future balances
    const scheduledTxs = await prisma.scheduledTransaction.findMany({
      where: { isActive: true },
      include: { account: true }
    });

    // Calculate baseline variable expenses from Budgets
    const budgets = await prisma.budget.findMany();
    // Baseline variable expenses from Budgets are now calculated dynamically per month to account for inflation

    // We need to simulate instances of scheduled transactions
    const futureMap = new Map<string, { income: number, expense: number, net: number, scenarioIncome: number, scenarioExpense: number, scenarioNet: number }>();
    
    const endDate = new Date(now.getFullYear(), now.getMonth() + futureMonths + 1, 1);

    for (const st of scheduledTxs) {
      if (selectedAccountIds) {
        if (!st.accountId || !selectedAccountIds.includes(st.accountId)) continue;
      } else {
        if (st.account && !st.account.includeInTotal) continue;
      }

      let simDate = new Date(st.nextRunDate);
      if (st.type === 'transfer') continue; 

      while (simDate < endDate) {
        if (st.endDate && simDate > new Date(st.endDate)) {
          break;
        }

        let effectDate = new Date(simDate);
        if (effectDate < now) {
          effectDate = new Date(now);
        }

        const year = effectDate.getFullYear();
        const monthStr = String(effectDate.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${monthStr}`;

        if (!futureMap.has(key)) {
          futureMap.set(key, { income: 0, expense: 0, net: 0, scenarioIncome: 0, scenarioExpense: 0, scenarioNet: 0 });
        }

        const stats = futureMap.get(key)!;
        let convertedStAmt = st.account ? convertAmount(st.amount, st.account.currency, homeCurrency, rates) : st.amount;
        
        if (st.inflationRate) {
          const yearsDiff = (effectDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          if (yearsDiff > 0) {
            convertedStAmt = convertedStAmt * Math.pow(1 + (st.inflationRate / 100), yearsDiff);
          }
        }

        stats.net += convertedStAmt;
        if (convertedStAmt > 0) stats.income += convertedStAmt;
        else stats.expense += Math.abs(convertedStAmt);

        simDate = addFrequency(simDate, st.frequency, st.interval || 1, st.daysOfWeek, st.monthsOfYear);
      }
    }

    // Include Active Simulated Scenarios
    const activeScenarios = await prisma.forecastScenario.findMany({
      where: { isActive: true },
      include: { items: true }
    });
    
    const hasActiveScenarios = activeScenarios.length > 0;

    for (const scenario of activeScenarios) {
      for (const item of scenario.items) {
        if (item.type === 'investment') {
          const monthlyRate = (item.annualRate || 0) / 100 / 12;
          let balance = 0;
          let simDate = new Date(item.date);
          const itemEndDate = item.endDate ? new Date(item.endDate) : endDate;

          // If the start date is in the past, we start calculating from 'now' 
          // but we shouldn't retroactively compound past years for a *forecast* scenario.
          // We will only compound future months.
          if (simDate < now) {
            simDate = new Date(now);
          }

          let monthIter = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          while (monthIter <= endDate) {
            const year = monthIter.getFullYear();
            const monthStr = String(monthIter.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${monthStr}`;
            
            if (!futureMap.has(key)) {
              futureMap.set(key, { income: 0, expense: 0, net: 0, scenarioIncome: 0, scenarioExpense: 0, scenarioNet: 0 });
            }
            const stats = futureMap.get(key)!;

            // 1. Accumulate deposits that happen in this specific month
            let depositsThisMonth = 0;
            const currentMonthStart = new Date(monthIter.getFullYear(), monthIter.getMonth() - 1, 1);
            
            while (simDate < monthIter && simDate <= itemEndDate) {
              if (simDate >= currentMonthStart) {
                depositsThisMonth += Math.abs(item.amount);
              }
              if (item.frequency === 'ONCE') {
                simDate = new Date(8640000000000000); // push far into future to break
              } else {
                simDate = addFrequency(simDate, item.frequency, item.interval || 1, item.daysOfWeek, item.monthsOfYear);
              }
            }

            balance += depositsThisMonth;

            // 2. Calculate interest on the new balance for this month
            const interest = balance * monthlyRate;
            balance += interest;

            // 3. Add ONLY the earned interest to the wealth trajectory
            // (Deposits themselves are just cash moving to investments, net wealth unchanged)
            stats.scenarioNet += interest;
            stats.scenarioIncome += interest;

            // Advance to next month
            monthIter = new Date(monthIter.getFullYear(), monthIter.getMonth() + 1, 1);
          }
        } else {
          let simDate = new Date(item.date);
          const itemEndDate = item.endDate ? new Date(item.endDate) : endDate;

          while (simDate < endDate && simDate <= itemEndDate) {
            let effectDate = new Date(simDate);
            if (effectDate < now) {
              effectDate = new Date(now);
            }

            const year = effectDate.getFullYear();
            const monthStr = String(effectDate.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${monthStr}`;

            if (!futureMap.has(key)) {
              futureMap.set(key, { income: 0, expense: 0, net: 0, scenarioIncome: 0, scenarioExpense: 0, scenarioNet: 0 });
            }

            const stats = futureMap.get(key)!;
            // All scenario amounts are assumed to be in homeCurrency as agreed
            let rawAmt = item.amount;
            if (item.annualRate) {
              const yearsDiff = (effectDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
              if (yearsDiff > 0) {
                rawAmt = rawAmt * Math.pow(1 + (item.annualRate / 100), yearsDiff);
              }
            }
            const amt = item.type === 'expense' ? -Math.abs(rawAmt) : Math.abs(rawAmt);
            
            stats.scenarioNet += amt;
            if (amt > 0) stats.scenarioIncome += amt;
            else stats.scenarioExpense += Math.abs(amt);

            if (item.frequency === 'ONCE') break;
            simDate = addFrequency(simDate, item.frequency, item.interval || 1, item.daysOfWeek, item.monthsOfYear);
          }
        }
      }
    }

    const projectedPoints = [];
    let runningBalanceForward = currentBalance;
    let runningSimulatedBalance = currentBalance;
    
    // Apply any future scheduled/scenario flows that occur in the current month but haven't been captured by the loop
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthFlow = futureMap.get(currentMonthKey);
    if (currentMonthFlow) {
      runningBalanceForward += currentMonthFlow.net;
      runningSimulatedBalance += currentMonthFlow.net + (currentMonthFlow.scenarioNet || 0);
    }

    // Average metrics
    let totalProjectedIncome = 0;
    let totalProjectedExpense = 0;
    let projectionMonthCount = 0;

    for (let i = 1; i <= futureMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${monthStr}`;

      const flow = futureMap.get(key) || { income: 0, expense: 0, net: 0, scenarioIncome: 0, scenarioExpense: 0, scenarioNet: 0 };
      
      const yearsDiff = i / 12;
      let monthSpecificBudget = 0;
      let monthGlobalBudget = 0;
      for (const b of budgets) {
        let monthly = b.amount;
        if (b.period === 'weekly') monthly = b.amount * (52 / 12);
        if (b.period === 'yearly') monthly = b.amount / 12;
        
        if (b.inflationRate) {
          monthly = monthly * Math.pow(1 + (b.inflationRate / 100), yearsDiff);
        }
        
        if (b.isGlobal) monthGlobalBudget = Math.max(monthGlobalBudget, monthly);
        else monthSpecificBudget += monthly;
      }
      const finalBudgetExpense = Math.max(monthSpecificBudget, monthGlobalBudget);
      const unplannedExpense = Math.max(0, finalBudgetExpense - flow.expense);
      
      const totalMonthExpense = flow.expense + unplannedExpense;
      const totalMonthNet = flow.income - totalMonthExpense;

      // Baseline running balance
      runningBalanceForward += totalMonthNet;
      
      // Simulated running balance
      runningSimulatedBalance += totalMonthNet + (flow.scenarioNet || 0);
      
      // We will report the scenario-affected averages if scenarios are active
      totalProjectedIncome += flow.income + (hasActiveScenarios ? (flow.scenarioIncome || 0) : 0);
      totalProjectedExpense += totalMonthExpense + (hasActiveScenarios ? (flow.scenarioExpense || 0) : 0);
      projectionMonthCount++;

      projectedPoints.push({
        date: key,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        balance: runningBalanceForward,
        simulatedBalance: hasActiveScenarios ? runningSimulatedBalance : null,
        isHistory: false,
      });
    }

    // 4. Combine data
    const chartData = [...historicalPoints.map(p => ({ ...p, simulatedBalance: null })), ...projectedPoints];

    return NextResponse.json({
      homeCurrency,
      currentBalance,
      avgMonthlyIncome: projectionMonthCount ? (totalProjectedIncome / projectionMonthCount) : 0,
      avgMonthlyExpense: projectionMonthCount ? (totalProjectedExpense / projectionMonthCount) : 0,
      futureBalance: hasActiveScenarios ? runningSimulatedBalance : runningBalanceForward,
      baselineFutureBalance: runningBalanceForward,
      hasActiveScenarios,
      chartData
    });

  } catch (error) {
    console.error("Forecast Error:", error);
    return NextResponse.json({ error: "Failed to generate forecast" }, { status: 500 });
  }
}
