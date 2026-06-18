import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExchangeRates, convertAmount } from "@/lib/currency";

function addFrequency(date: Date, frequency: string): Date {
  const next = new Date(date);
  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}

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
    const pastMonths = 12; // Always show 1 year of history

    // 1. Get current balance
    const accounts = await prisma.account.findMany({
      where: { includeInTotal: true, isArchived: false }
    });
    const currentBalance = accounts.reduce((acc, account) => acc + convertAmount(account.balance, account.currency, homeCurrency, rates), 0);

    // 2. Get historical transactions (last 12 months)
    const now = new Date();
    const historyStart = new Date(now.getFullYear(), now.getMonth() - pastMonths, 1);
    
    // We want the net flow per month to reconstruct historical balances
    // Since currentBalance is NOW, balance at the end of last month = currentBalance - (net flow this month so far)
    // To make it simple, let's group all transactions by month/year.
    const allTransactions = await prisma.transaction.findMany({
      where: {
        account: { includeInTotal: true, isArchived: false }
      },
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
    let totalSpecificBudget = 0;
    let globalBudgetLimit = 0;

    for (const b of budgets) {
      let monthly = b.amount;
      if (b.period === 'weekly') monthly = b.amount * (52 / 12);
      if (b.period === 'yearly') monthly = b.amount / 12;
      
      if (b.isGlobal) {
        globalBudgetLimit = Math.max(globalBudgetLimit, monthly);
      } else {
        totalSpecificBudget += monthly;
      }
    }
    // We assume the user spends the maximum of their specific budgets or their global limit
    const finalBudgetExpense = Math.max(totalSpecificBudget, globalBudgetLimit);

    // We need to simulate instances of scheduled transactions
    const futureMap = new Map<string, { income: number, expense: number, net: number, scenarioIncome: number, scenarioExpense: number, scenarioNet: number }>();
    
    const endDate = new Date(now.getFullYear(), now.getMonth() + futureMonths + 1, 1);

    for (const st of scheduledTxs) {
      if (st.account && !st.account.includeInTotal) continue;

      let simDate = new Date(st.nextRunDate);
      if (st.type === 'transfer') continue; 

      while (simDate < endDate) {
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
        const convertedStAmt = st.account ? convertAmount(st.amount, st.account.currency, homeCurrency, rates) : st.amount;
        stats.net += convertedStAmt;
        if (convertedStAmt > 0) stats.income += convertedStAmt;
        else stats.expense += Math.abs(convertedStAmt);

        simDate = addFrequency(simDate, st.frequency);
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
          const amt = item.type === 'expense' ? -Math.abs(item.amount) : Math.abs(item.amount);
          
          stats.scenarioNet += amt;
          if (amt > 0) stats.scenarioIncome += amt;
          else stats.scenarioExpense += Math.abs(amt);

          if (item.frequency === 'ONCE') break;
          simDate = addFrequency(simDate, item.frequency);
        }
      }
    }

    const projectedPoints = [];
    let runningBalanceForward = currentBalance;
    let runningSimulatedBalance = currentBalance;
    
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
      
      // Calculate how much "unplanned" variable expense to add based on the budget
      // The budget specifies the MAXIMUM or EXPECTED total monthly expense.
      // If the scheduled expenses are less than the budget, we add the difference.
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
