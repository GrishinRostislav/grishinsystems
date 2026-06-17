import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const { searchParams } = new URL(request.url);
    const monthsParam = searchParams.get('months') || '60'; // Default 5 years
    const futureMonths = parseInt(monthsParam, 10);
    const pastMonths = 12; // Always show 1 year of history

    // 1. Get current balance
    const accounts = await prisma.account.findMany({
      where: { includeInTotal: true, isArchived: false }
    });
    const currentBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

    // 2. Get historical transactions (last 12 months)
    const now = new Date();
    const historyStart = new Date(now.getFullYear(), now.getMonth() - pastMonths, 1);
    
    // We want the net flow per month to reconstruct historical balances
    // Since currentBalance is NOW, balance at the end of last month = currentBalance - (net flow this month so far)
    // To make it simple, let's group all transactions by month/year.
    const allTransactions = await prisma.transaction.findMany({
      where: {
        account: { includeInTotal: true }
      },
      select: { amount: true, date: true }
    });

    // Calculate historical monthly net flow
    const historyMap = new Map<string, number>(); // format: "YYYY-MM" -> net flow
    for (const tx of allTransactions) {
      const year = tx.date.getFullYear();
      const month = String(tx.date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      historyMap.set(key, (historyMap.get(key) || 0) + tx.amount);
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
    const futureMap = new Map<string, { income: number, expense: number, net: number }>();
    
    const endDate = new Date(now.getFullYear(), now.getMonth() + futureMonths, 1);

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
          futureMap.set(key, { income: 0, expense: 0, net: 0 });
        }

        const stats = futureMap.get(key)!;
        stats.net += st.amount;
        if (st.amount > 0) stats.income += st.amount;
        else stats.expense += Math.abs(st.amount);

        simDate = addFrequency(simDate, st.frequency);
      }
    }

    const projectedPoints = [];
    let runningBalanceForward = currentBalance;
    
    // Average metrics
    let totalProjectedIncome = 0;
    let totalProjectedExpense = 0;
    let projectionMonthCount = 0;

    for (let i = 1; i <= futureMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${monthStr}`;

      const flow = futureMap.get(key) || { income: 0, expense: 0, net: 0 };
      
      // Calculate how much "unplanned" variable expense to add based on the budget
      // The budget specifies the MAXIMUM or EXPECTED total monthly expense.
      // If the scheduled expenses are less than the budget, we add the difference.
      const unplannedExpense = Math.max(0, finalBudgetExpense - flow.expense);
      
      const totalMonthExpense = flow.expense + unplannedExpense;
      const totalMonthNet = flow.income - totalMonthExpense;

      runningBalanceForward += totalMonthNet;
      
      totalProjectedIncome += flow.income;
      totalProjectedExpense += totalMonthExpense;
      projectionMonthCount++;

      projectedPoints.push({
        date: key,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        balance: runningBalanceForward,
        isHistory: false,
      });
    }

    // 4. Combine data
    const chartData = [...historicalPoints, ...projectedPoints];

    return NextResponse.json({
      currentBalance,
      avgMonthlyIncome: projectionMonthCount ? (totalProjectedIncome / projectionMonthCount) : 0,
      avgMonthlyExpense: projectionMonthCount ? (totalProjectedExpense / projectionMonthCount) : 0,
      futureBalance: runningBalanceForward,
      chartData
    });

  } catch (error) {
    console.error("Forecast Error:", error);
    return NextResponse.json({ error: "Failed to generate forecast" }, { status: 500 });
  }
}
