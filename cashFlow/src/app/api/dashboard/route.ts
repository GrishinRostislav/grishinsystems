import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExchangeRates, convertAmount } from "@/lib/currency";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let settings = await prisma.settings.findUnique({ where: { id: "global" } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: "global", homeCurrency: "CAD" } });
    }
    const homeCurrency = settings.homeCurrency;
    const rates = await getExchangeRates(homeCurrency);

    // 1. Total Balance of Included Accounts
    const accounts = await prisma.account.findMany({
      where: { includeInTotal: true, isArchived: false }
    });
    
    let totalBalance = 0;
    for (const acc of accounts) {
      totalBalance += convertAmount(acc.balance, acc.currency, homeCurrency, rates);
    }

    // 2. Transactions for calculations
    const now = new Date();
    let startDate = new Date(0); // default all time
    let endDate = new Date();    // default now
    
    if (startDateParam) startDate = new Date(startDateParam);
    if (endDateParam) {
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999); // end of the selected day
    }

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const offset = diffDays * 24 * 60 * 60 * 1000;

    const metricsStart = new Date(startDate);
    const metricsEnd = new Date(endDate);
    const prevMetricsStart = new Date(metricsStart.getTime() - offset);
    const prevMetricsEnd = new Date(metricsEnd.getTime() - offset);

    // Chart Timeframe anchored to today
    const paddingDays = diffDays <= 35 ? 2 : 0;
    const chartEnd = new Date();
    chartEnd.setHours(23, 59, 59, 999);
    chartEnd.setDate(chartEnd.getDate() + paddingDays);
    
    const chartStart = new Date(chartEnd);
    chartStart.setDate(chartStart.getDate() - diffDays - paddingDays);
    chartStart.setHours(0, 0, 0, 0);

    const prevChartStart = new Date(chartStart.getTime() - offset);
    const prevChartEnd = new Date(chartEnd.getTime() - offset);

    const queryStart = new Date(Math.min(metricsStart.getTime(), chartStart.getTime(), prevMetricsStart.getTime(), prevChartStart.getTime()));
    const queryEnd = new Date(Math.max(metricsEnd.getTime(), chartEnd.getTime(), prevMetricsEnd.getTime(), prevChartEnd.getTime()));

    const allTransactions = await prisma.transaction.findMany({
      where: {
        date: { gte: queryStart, lte: queryEnd }
      },
      include: { category: true, account: true },
      orderBy: { date: "asc" }
    });

    const transactionsForMetrics = allTransactions.filter(t => t.date >= metricsStart && t.date <= metricsEnd);
    const prevTransactionsForMetrics = allTransactions.filter(t => t.date >= prevMetricsStart && t.date <= prevMetricsEnd);
    
    const transactionsForChart = allTransactions.filter(t => t.date >= chartStart && t.date <= chartEnd);
    const prevTransactionsForChart = allTransactions.filter(t => t.date >= prevChartStart && t.date <= prevChartEnd);

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    const chartMap: Record<string, { income: number; expenses: number; prevIncome: number; prevExpenses: number; isFuture: boolean }> = {};
    const categoryExpenseMap: Record<string, { value: number; id: string | null }> = {};

    // chartEnd already includes paddingDays
    let currDate = new Date(chartStart);
    currDate.setHours(12, 0, 0, 0);
    const endBound = new Date(chartEnd);
    endBound.setHours(12, 0, 0, 0);
    
    // We want to know what "today" is, to mark future days as empty
    const realToday = new Date();
    realToday.setHours(23, 59, 59, 999);

    while (currDate <= endBound) {
      let chartKey = "";
      if (diffDays <= 35) {
        chartKey = currDate.toLocaleString('default', { month: 'short', day: 'numeric' });
      } else {
        chartKey = currDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      }
      if (!chartMap[chartKey]) {
        chartMap[chartKey] = { 
          income: 0, 
          expenses: 0, 
          prevIncome: 0, 
          prevExpenses: 0,
          isFuture: currDate > realToday
        };
      } else {
        chartMap[chartKey].isFuture = currDate > realToday;
      }
      currDate.setDate(currDate.getDate() + 1);
    }

    // Metrics calculations
    for (const txn of transactionsForMetrics) {
      if ((txn as any).isTransfer) continue;
      const txnAmount = convertAmount(txn.amount, txn.account.currency, homeCurrency, rates);

      if (txnAmount > 0) {
        monthlyIncome += txnAmount;
      } else {
        const absAmount = Math.abs(txnAmount);
        monthlyExpenses += absAmount;
        
        const catName = txn.category?.name || 'Uncategorized';
        const catId = txn.category?.id || null;
        if (!categoryExpenseMap[catName]) {
          categoryExpenseMap[catName] = { value: 0, id: catId };
        }
        categoryExpenseMap[catName].value += absAmount;
      }
    }

    // Chart calculations
    for (const txn of transactionsForChart) {
      const txnDate = new Date(txn.date);
      let chartKey = "";
      if (diffDays <= 35) {
        chartKey = txnDate.toLocaleString('default', { month: 'short', day: 'numeric' });
      } else {
        chartKey = txnDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      }
      if (!chartMap[chartKey]) {
        chartMap[chartKey] = { income: 0, expenses: 0, prevIncome: 0, prevExpenses: 0, isFuture: false };
      }
      if ((txn as any).isTransfer) continue;

      const txnAmount = convertAmount(txn.amount, txn.account.currency, homeCurrency, rates);
      if (txnAmount > 0) {
        chartMap[chartKey].income += txnAmount;
      } else {
        chartMap[chartKey].expenses += Math.abs(txnAmount);
      }
    }

    for (const txn of prevTransactionsForChart) {
      const mappedDate = new Date(txn.date.getTime() + offset);
      let chartKey = "";
      if (diffDays <= 35) {
        chartKey = mappedDate.toLocaleString('default', { month: 'short', day: 'numeric' });
      } else {
        chartKey = mappedDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      }
      if (!chartMap[chartKey]) {
        chartMap[chartKey] = { income: 0, expenses: 0, prevIncome: 0, prevExpenses: 0, isFuture: false };
      }
      if ((txn as any).isTransfer) continue;

      const txnAmount = convertAmount(txn.amount, txn.account.currency, homeCurrency, rates);
      if (txnAmount > 0) {
        chartMap[chartKey].prevIncome += txnAmount;
      } else {
        chartMap[chartKey].prevExpenses += Math.abs(txnAmount);
      }
    }

    // Sort chart keys chronologically by assuming they were inserted roughly chronologically
    // A more robust way is to sort by parsing the date, but for now we rely on the DB order
    const sortedChartKeys = Object.keys(chartMap).sort((a, b) => {
       const dateA = new Date(a + (diffDays > 35 ? "" : ` ${endDate.getFullYear()}`));
       const dateB = new Date(b + (diffDays > 35 ? "" : ` ${endDate.getFullYear()}`));
       return dateA.getTime() - dateB.getTime();
    });

    const chartData = sortedChartKeys.map(name => ({
      name,
      income: chartMap[name].isFuture ? null : chartMap[name].income,
      expenses: chartMap[name].isFuture ? null : chartMap[name].expenses,
      prevIncome: chartMap[name].prevIncome,
      prevExpenses: chartMap[name].prevExpenses,
    }));

    const pieData = Object.keys(categoryExpenseMap).map(name => ({
      name,
      value: categoryExpenseMap[name].value,
      id: categoryExpenseMap[name].id
    })).sort((a, b) => b.value - a.value);

    // 3. Balance Trend Calculation
    // We can't do aggregate directly in the DB anymore because amounts need currency conversion.
    // We must fetch them and convert in memory.
    const futureTransactionsData = await prisma.transaction.findMany({
      where: { date: { gt: chartEnd }, account: { includeInTotal: true, isArchived: false } },
      include: { account: true }
    });
    const futureNet = futureTransactionsData.reduce((sum, t) => sum + convertAmount(t.amount, t.account.currency, homeCurrency, rates), 0);
    const rangeNet = transactionsForChart.filter(t => accounts.some(a => a.id === t.accountId)).reduce((sum, t) => sum + convertAmount(t.amount, t.account.currency, homeCurrency, rates), 0);
    
    let runningBalance = totalBalance - futureNet - rangeNet;

    const prevFutureTransactionsData = await prisma.transaction.findMany({
      where: { date: { gt: prevChartEnd }, account: { includeInTotal: true, isArchived: false } },
      include: { account: true }
    });
    const prevFutureNet = prevFutureTransactionsData.reduce((sum, t) => sum + convertAmount(t.amount, t.account.currency, homeCurrency, rates), 0);
    const prevRangeNet = prevTransactionsForChart.filter(t => accounts.some(a => a.id === t.accountId)).reduce((sum, t) => sum + convertAmount(t.amount, t.account.currency, homeCurrency, rates), 0);
    
    let prevRunningBalance = totalBalance - prevFutureNet - prevRangeNet;

    const balanceTrendMap: Record<string, number> = {};
    for (const txn of transactionsForChart) {
      if (accounts.some(a => a.id === txn.accountId)) {
        const txnDate = new Date(txn.date);
        let chartKey = "";
        if (diffDays <= 35) {
          chartKey = txnDate.toLocaleString('default', { month: 'short', day: 'numeric' });
        } else {
          chartKey = txnDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        }
        balanceTrendMap[chartKey] = (balanceTrendMap[chartKey] || 0) + convertAmount(txn.amount, txn.account.currency, homeCurrency, rates);
      }
    }

    const prevBalanceTrendMap: Record<string, number> = {};
    for (const txn of prevTransactionsForChart) {
      if (accounts.some(a => a.id === txn.accountId)) {
        const mappedDate = new Date(txn.date.getTime() + offset);
        let chartKey = "";
        if (diffDays <= 35) {
          chartKey = mappedDate.toLocaleString('default', { month: 'short', day: 'numeric' });
        } else {
          chartKey = mappedDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        }
        prevBalanceTrendMap[chartKey] = (prevBalanceTrendMap[chartKey] || 0) + convertAmount(txn.amount, txn.account.currency, homeCurrency, rates);
      }
    }

    const balanceTrendData = [];
    for (const key of sortedChartKeys) {
      const netChange = balanceTrendMap[key] || 0;
      const isFuture = chartMap[key]?.isFuture;
      
      // Only carry over running balance if it's not in the future
      if (!isFuture) {
        runningBalance += netChange;
      }

      const prevNetChange = prevBalanceTrendMap[key] || 0;
      prevRunningBalance += prevNetChange;

      balanceTrendData.push({
        name: key,
        balance: isFuture ? null : runningBalance,
        prevBalance: prevRunningBalance
      });
    }

    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: {
        category: true,
        account: true
      }
    });

    return NextResponse.json({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      chartData,
      pieData,
      balanceTrendData,
      recentTransactions,
      homeCurrency
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
