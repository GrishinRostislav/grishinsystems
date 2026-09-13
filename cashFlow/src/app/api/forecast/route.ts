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
    const pastMonthsParam = searchParams.get('pastMonths') || '12';
    const pastMonths = parseInt(pastMonthsParam, 10);
    
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

    // Calculate historical monthly net flow, income, and expenses
    const historyMap = new Map<string, number>(); // format: "YYYY-MM" -> net flow
    const historyIncomeMap = new Map<string, number>();
    const historyExpenseMap = new Map<string, number>();

    for (const tx of allTransactions) {
      const year = tx.date.getFullYear();
      const month = String(tx.date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      const convertedAmt = convertAmount(tx.amount, tx.account.currency, homeCurrency, rates);
      historyMap.set(key, (historyMap.get(key) || 0) + convertedAmt);

      if (convertedAmt > 0) {
        historyIncomeMap.set(key, (historyIncomeMap.get(key) || 0) + convertedAmt);
      } else {
        historyExpenseMap.set(key, (historyExpenseMap.get(key) || 0) + Math.abs(convertedAmt));
      }
    }

    // Calculate weighted historical baseline (recent months weighted more heavily)
    // Weights: Month -1 (40%), Month -2 (30%), Month -3 (20%), Month -4..6 (10% total)
    const pastMonthWeights = [0.40, 0.30, 0.20, 0.0333, 0.0333, 0.0334];
    let weightedPastIncome = 0;
    let weightedPastExpense = 0;
    let totalWeight = 0;

    for (let i = 1; i <= Math.min(6, pastMonths); i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${monthStr}`;
      
      const inc = historyIncomeMap.get(key) || 0;
      const exp = historyExpenseMap.get(key) || 0;
      const weight = pastMonthWeights[i - 1] || 0.05;
      
      if (inc > 0 || exp > 0) {
        weightedPastIncome += inc * weight;
        weightedPastExpense += exp * weight;
        totalWeight += weight;
      }
    }

    const historicalBaselineIncome = totalWeight > 0 ? (weightedPastIncome / totalWeight) : 0;
    const historicalBaselineExpense = totalWeight > 0 ? (weightedPastExpense / totalWeight) : 0;

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
    interface MonthFlow {
      income: number;
      expense: number;
      net: number;
      scenarioRecurringIncome: number;
      scenarioRecurringExpense: number;
      scenarioRecurringNet: number;
      scenarioOneTimeIncome: number;
      scenarioOneTimeExpense: number;
      scenarioOneTimeNet: number;
    }

    const futureMap = new Map<string, MonthFlow>();
    const getOrInitMonthFlow = (key: string): MonthFlow => {
      if (!futureMap.has(key)) {
        futureMap.set(key, {
          income: 0, expense: 0, net: 0,
          scenarioRecurringIncome: 0, scenarioRecurringExpense: 0, scenarioRecurringNet: 0,
          scenarioOneTimeIncome: 0, scenarioOneTimeExpense: 0, scenarioOneTimeNet: 0
        });
      }
      return futureMap.get(key)!;
    };

    const endDate = new Date(now.getFullYear(), now.getMonth() + futureMonths + 1, 1);

    // Process Scheduled Transactions
    for (const st of scheduledTxs) {
      if (selectedAccountIds) {
        if (!st.accountId || !selectedAccountIds.includes(st.accountId)) continue;
      } else {
        if (st.account && !st.account.includeInTotal) continue;
      }

      if (st.type === 'transfer') continue;

      let simDate = new Date(st.nextRunDate);

      // Fast-forward simDate if it's in the past to avoid double counting executed transactions
      while (simDate < now && st.frequency !== 'ONCE') {
        const nextDate = addFrequency(simDate, st.frequency, st.interval || 1, st.daysOfWeek, st.monthsOfYear);
        if (nextDate.getTime() === simDate.getTime()) break;
        simDate = nextDate;
      }

      while (simDate < endDate) {
        if (st.endDate && simDate > new Date(st.endDate)) break;
        if (simDate < now) {
          if (st.frequency === 'ONCE') break;
          simDate = addFrequency(simDate, st.frequency, st.interval || 1, st.daysOfWeek, st.monthsOfYear);
          continue;
        }

        const year = simDate.getFullYear();
        const monthStr = String(simDate.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${monthStr}`;

        const stats = getOrInitMonthFlow(key);
        let convertedStAmt = st.account ? convertAmount(st.amount, st.account.currency, homeCurrency, rates) : st.amount;
        
        if (st.inflationRate) {
          const yearsDiff = (simDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          if (yearsDiff > 0) {
            convertedStAmt = convertedStAmt * Math.pow(1 + (st.inflationRate / 100), yearsDiff);
          }
        }

        stats.net += convertedStAmt;
        if (convertedStAmt > 0) stats.income += convertedStAmt;
        else stats.expense += Math.abs(convertedStAmt);

        if (st.frequency === 'ONCE') break;
        simDate = addFrequency(simDate, st.frequency, st.interval || 1, st.daysOfWeek, st.monthsOfYear);
      }
    }

    // Process Active Scenarios
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

          if (simDate < now) simDate = new Date(now);

          let monthIter = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          while (monthIter <= endDate) {
            const year = monthIter.getFullYear();
            const monthStr = String(monthIter.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${monthStr}`;
            
            const stats = getOrInitMonthFlow(key);
            let depositsThisMonth = 0;
            const currentMonthStart = new Date(monthIter.getFullYear(), monthIter.getMonth() - 1, 1);
            
            while (simDate < monthIter && simDate <= itemEndDate) {
              if (simDate >= currentMonthStart) {
                depositsThisMonth += Math.abs(item.amount);
              }
              if (item.frequency === 'ONCE') {
                simDate = new Date(8640000000000000);
              } else {
                simDate = addFrequency(simDate, item.frequency, item.interval || 1, item.daysOfWeek, item.monthsOfYear);
              }
            }

            balance += depositsThisMonth;
            const interest = balance * monthlyRate;
            balance += interest;

            stats.scenarioRecurringNet += interest;
            stats.scenarioRecurringIncome += interest;

            monthIter = new Date(monthIter.getFullYear(), monthIter.getMonth() + 1, 1);
          }
        } else {
          let simDate = new Date(item.date);
          const itemEndDate = item.endDate ? new Date(item.endDate) : endDate;

          while (simDate < endDate && simDate <= itemEndDate) {
            if (simDate < now && item.frequency === 'ONCE') break;
            
            let effectDate = new Date(simDate);
            if (effectDate < now) effectDate = new Date(now);

            const year = effectDate.getFullYear();
            const monthStr = String(effectDate.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${monthStr}`;

            const stats = getOrInitMonthFlow(key);
            let rawAmt = item.amount;
            if (item.annualRate) {
              const yearsDiff = (effectDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
              if (yearsDiff > 0) {
                rawAmt = rawAmt * Math.pow(1 + (item.annualRate / 100), yearsDiff);
              }
            }
            const amt = item.type === 'expense' ? -Math.abs(rawAmt) : Math.abs(rawAmt);
            
            const isOneTime = item.frequency === 'ONCE';
            if (isOneTime) {
              stats.scenarioOneTimeNet += amt;
              if (amt > 0) stats.scenarioOneTimeIncome += amt;
              else stats.scenarioOneTimeExpense += Math.abs(amt);
              break;
            } else {
              stats.scenarioRecurringNet += amt;
              if (amt > 0) stats.scenarioRecurringIncome += amt;
              else stats.scenarioRecurringExpense += Math.abs(amt);
            }

            simDate = addFrequency(simDate, item.frequency, item.interval || 1, item.daysOfWeek, item.monthsOfYear);
          }
        }
      }
    }

    const projectedPoints = [];
    let runningBalanceForward = currentBalance;
    let runningSimulatedBalance = currentBalance;
    
    // Apply remaining scheduled/scenario flows for the current month
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthFlow = futureMap.get(currentMonthKey);
    if (currentMonthFlow) {
      runningBalanceForward += currentMonthFlow.net;
      runningSimulatedBalance += currentMonthFlow.net + currentMonthFlow.scenarioRecurringNet + currentMonthFlow.scenarioOneTimeNet;
    }

    // Daily Pacing: Extrapolate remaining unscheduled daily spending for the rest of the current month
    const dayOfMonth = now.getDate();
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemainingInMonth = totalDaysInMonth - dayOfMonth;

    if (dayOfMonth > 0 && daysRemainingInMonth > 0) {
      const currentMonthSpentSoFar = historyExpenseMap.get(currentMonthKey) || 0;
      const dailyExpensePace = currentMonthSpentSoFar / dayOfMonth;
      const estimatedUnscheduledExpenseRemaining = dailyExpensePace * daysRemainingInMonth;
      
      // Deduct estimated remaining unscheduled daily expense from starting balance trajectory
      runningBalanceForward -= estimatedUnscheduledExpenseRemaining;
      runningSimulatedBalance -= estimatedUnscheduledExpenseRemaining;
    }

    // Calculate monthly averages and future points
    let totalProjectedIncome = 0;
    let totalProjectedExpense = 0;
    let projectionMonthCount = 0;

    for (let i = 1; i <= futureMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${monthStr}`;

      const flow = futureMap.get(key) || {
        income: 0, expense: 0, net: 0,
        scenarioRecurringIncome: 0, scenarioRecurringExpense: 0, scenarioRecurringNet: 0,
        scenarioOneTimeIncome: 0, scenarioOneTimeExpense: 0, scenarioOneTimeNet: 0
      };
      
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
      
      // Calculate projected income by blending scheduled items with historical baseline
      const totalMonthIncome = Math.max(flow.income, historicalBaselineIncome);

      // Calculate projected expense by blending scheduled items, budgets, and historical baseline
      const unscheduledExpenseEstimate = Math.max(
        finalBudgetExpense - flow.expense,
        historicalBaselineExpense - flow.expense,
        0
      );
      const totalMonthExpense = Math.max(flow.expense + unscheduledExpenseEstimate, historicalBaselineExpense);
      const totalMonthNet = totalMonthIncome - totalMonthExpense;

      // Baseline running balance
      runningBalanceForward += totalMonthNet;
      
      // Simulated running balance includes baseline net + scenario recurring net + scenario one-time net
      runningSimulatedBalance += totalMonthNet + flow.scenarioRecurringNet + flow.scenarioOneTimeNet;
      
      // Averages ONLY include recurring income and recurring expenses (NOT one-time scenario spikes)
      totalProjectedIncome += totalMonthIncome + (hasActiveScenarios ? flow.scenarioRecurringIncome : 0);
      totalProjectedExpense += totalMonthExpense + (hasActiveScenarios ? flow.scenarioRecurringExpense : 0);
      projectionMonthCount++;

      projectedPoints.push({
        date: key,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        balance: runningBalanceForward,
        simulatedBalance: hasActiveScenarios ? runningSimulatedBalance : null,
        isHistory: false,
      });
    }

    const formattedHistoricalPoints = historicalPoints.map((p, index) => {
      if (index === historicalPoints.length - 1 && hasActiveScenarios) {
        return { ...p, simulatedBalance: p.balance };
      }
      return { ...p, simulatedBalance: null };
    });
    const chartData = [...formattedHistoricalPoints, ...projectedPoints];

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
