import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExchangeRates, convertAmount } from "@/lib/currency";

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "global" },
      select: { homeCurrency: true }
    }).catch(() => null);
    const homeCurrency = settings?.homeCurrency || "CAD";
    const rates = await getExchangeRates(homeCurrency);

    const now = new Date();
    const alerts: Array<{ id: string; type: 'PAYMENT' | 'SPIKE' | 'BUDGET'; title: string; message: string; severity: 'info' | 'warning' | 'danger' }> = [];

    // 1. Check upcoming scheduled payments in next 7 days
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const scheduledTxs = await prisma.scheduledTransaction.findMany({
      where: {
        isActive: true,
        nextRunDate: { lte: in7Days }
      },
      include: { account: true }
    });

    for (const st of scheduledTxs) {
      const amt = st.account ? convertAmount(st.amount, st.account.currency, homeCurrency, rates) : st.amount;
      const dateStr = new Date(st.nextRunDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      alerts.push({
        id: `sched-${st.id}`,
        type: 'PAYMENT',
        title: 'Upcoming Payment',
        message: `${st.merchant || 'Scheduled Payment'}: ${Math.abs(amt).toFixed(2)} ${homeCurrency} (${dateStr})`,
        severity: 'info'
      });
    }

    // 2. Check recent spending spikes (last 7 days vs past 30-day baseline)
    const past7DaysStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const past37DaysStart = new Date(now.getTime() - 37 * 24 * 60 * 60 * 1000);

    const recentTxs = await prisma.transaction.findMany({
      where: {
        date: { gte: past37DaysStart },
        isTransfer: false
      },
      include: { account: true }
    });

    let spentLast7 = 0;
    let spentPrior30 = 0;

    for (const tx of recentTxs) {
      const convertedAmt = convertAmount(tx.amount, tx.account.currency, homeCurrency, rates);
      if (convertedAmt < 0) {
        const val = Math.abs(convertedAmt);
        if (tx.date >= past7DaysStart) {
          spentLast7 += val;
        } else {
          spentPrior30 += val;
        }
      }
    }

    const dailyAvgPrior30 = spentPrior30 / 30;
    const dailyAvgLast7 = spentLast7 / 7;

    if (dailyAvgPrior30 > 0 && dailyAvgLast7 > dailyAvgPrior30 * 1.35 && spentLast7 > 100) {
      const pctIncrease = Math.round(((dailyAvgLast7 - dailyAvgPrior30) / dailyAvgPrior30) * 100);
      alerts.push({
        id: 'spike-recent',
        type: 'SPIKE',
        title: '⚡ Spending Spike',
        message: `Spending over the last 7 days is ${pctIncrease}% higher than average (${Math.round(spentLast7)} ${homeCurrency}).`,
        severity: 'warning'
      });
    }

    // 3. Check Budgets near capacity (>80%)
    const budgets = await prisma.budget.findMany({
      include: { categories: true }
    });

    for (const budget of budgets) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      let spent = 0;
      if (budget.isGlobal) {
        const globalTxs = await prisma.transaction.findMany({
          where: { date: { gte: startOfMonth, lte: endOfMonth }, isTransfer: false },
          include: { account: true }
        });
        spent = globalTxs.reduce((acc, tx) => {
          const c = convertAmount(tx.amount, tx.account.currency, homeCurrency, rates);
          return c < 0 ? acc + Math.abs(c) : acc;
        }, 0);
      } else {
        const catIds = budget.categories.map(c => c.id);
        if (catIds.length > 0) {
          const catTxs = await prisma.transaction.findMany({
            where: { date: { gte: startOfMonth, lte: endOfMonth }, categoryId: { in: catIds }, isTransfer: false },
            include: { account: true }
          });
          spent = catTxs.reduce((acc, tx) => {
            const c = convertAmount(tx.amount, tx.account.currency, homeCurrency, rates);
            return c < 0 ? acc + Math.abs(c) : acc;
          }, 0);
        }
      }

      if (budget.amount > 0) {
        const usage = (spent / budget.amount) * 100;
        if (usage >= 100) {
          alerts.push({
            id: `budget-${budget.id}`,
            type: 'BUDGET',
            title: 'Budget Exceeded',
            message: `Budget "${budget.name}" has reached ${Math.round(usage)}% (${Math.round(spent)} / ${Math.round(budget.amount)} ${homeCurrency}).`,
            severity: 'danger'
          });
        } else if (usage >= 80) {
          alerts.push({
            id: `budget-${budget.id}`,
            type: 'BUDGET',
            title: 'Budget Warning',
            message: `Budget "${budget.name}" has reached ${Math.round(usage)}% (${Math.round(spent)} / ${Math.round(budget.amount)} ${homeCurrency}).`,
            severity: 'warning'
          });
        }
      }
    }

    return NextResponse.json({ alerts, count: alerts.length });
  } catch (error) {
    console.error("Alerts API Error:", error);
    return NextResponse.json({ alerts: [], count: 0 });
  }
}
