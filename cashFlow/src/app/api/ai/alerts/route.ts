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
    const accounts = await prisma.account.findMany({ where: { isArchived: false, includeInTotal: true } });
    const totalBalance = accounts.reduce((sum, account) => sum + convertAmount(account.balance, account.currency, homeCurrency, rates), 0);

    const now = new Date();
    const alerts: Array<{ id: string; type: 'PAYMENT' | 'SPIKE' | 'BUDGET'; title: string; message: string; severity: 'info' | 'warning' | 'danger' }> = [];
    let topBudget: { name: string; usage: number; spent: number; amount: number } | null = null;

    // 1. Check upcoming scheduled payments in next 7 days
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const scheduledTxs = await prisma.scheduledTransaction.findMany({
      where: {
        isActive: true,
        nextRunDate: { lte: in7Days }
      },
      include: { account: true, category: true }
    });

    for (const st of scheduledTxs) {
      const amt = st.account ? convertAmount(st.amount, st.account.currency, homeCurrency, rates) : st.amount;
      const dateStr = new Date(st.nextRunDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      alerts.push({
        id: `sched-${st.id}`,
        type: 'PAYMENT',
        title: ' Предстоящий платеж',
        message: `${st.merchant || 'Платеж'}: ${Math.abs(amt).toFixed(2)} ${homeCurrency} (${dateStr})`,
        severity: 'info'
      });
    }

    // 2. Check recent spending spikes (last 7 days vs past 30-day baseline)
    const past7DaysStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const past37DaysStart = new Date(now.getTime() - 37 * 24 * 60 * 60 * 1000);

    const recentTxs = await prisma.transaction.findMany({
      where: {
        date: { gte: past37DaysStart },
        isTransfer: false
      },
      include: { account: true, category: true }
    });

    let spentLast7 = 0;
    let spentPrior30 = 0;
    let income30 = 0;
    let expense30 = 0;
    const incomeBySource: Record<string, number> = {};
    const expenseByTarget: Record<string, number> = {};
    let essential30 = 0;

    for (const tx of recentTxs) {
      const convertedAmt = convertAmount(tx.amount, tx.account.currency, homeCurrency, rates);
      if (tx.date >= monthStart && tx.date <= now) {
        const label = tx.merchant || tx.category?.name || 'Other';
        if (convertedAmt > 0) {
          income30 += convertedAmt;
          incomeBySource[label] = (incomeBySource[label] || 0) + convertedAmt;
        } else if (convertedAmt < 0) {
          const expense = Math.abs(convertedAmt);
          expense30 += expense;
          expenseByTarget[label] = (expenseByTarget[label] || 0) + expense;
          const category = (tx.category?.name || '').toLowerCase();
          if (/rent|mortgage|housing|utility|bill|insurance|grocery|food|health|medical|transport|gas|fuel|debt|аренд|ипотек|коммун|страх|продукт|еда|медиц|транспорт|бензин|долг/.test(category)) essential30 += expense;
        }
      }
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
        title: '⚡ Всплеск расходов',
        message: `За последние 7 дней расходы выше обычного темпа на ${pctIncrease}% (${Math.round(spentLast7)} ${homeCurrency}).`,
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
        if (!topBudget || usage > topBudget.usage) topBudget = { name: budget.name, usage, spent, amount: budget.amount };
        if (usage >= 100) {
          alerts.push({
            id: `budget-${budget.id}`,
            type: 'BUDGET',
            title: ' Превышен бюджет',
            message: `Бюджет "${budget.name}" израсходован на ${Math.round(usage)}% (${Math.round(spent)} / ${Math.round(budget.amount)} ${homeCurrency}).`,
            severity: 'danger'
          });
        } else if (usage >= 80) {
          alerts.push({
            id: `budget-${budget.id}`,
            type: 'BUDGET',
            title: ' Предупреждение по бюджету',
            message: `Бюджет "${budget.name}" израсходован на ${Math.round(usage)}% (${Math.round(spent)} / ${Math.round(budget.amount)} ${homeCurrency}).`,
            severity: 'warning'
          });
        }
      }
    }

    const daysElapsed = Math.max(1, now.getDate());
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(0, daysInMonth - daysElapsed);
    const dailyNet = (income30 - expense30) / daysElapsed;
    const projectedBalance = totalBalance + dailyNet * daysRemaining;
    const trend = dailyNet > 0 ? 'growing' : dailyNet < 0 ? 'declining' : 'flat';
    const monthName = now.toLocaleDateString('en-CA', { month: 'long' });
    const budgetSummary = topBudget
      ? `Budget: ${topBudget.name} — ${Math.round(topBudget.usage)}% used (${Math.round(topBudget.spent)} / ${Math.round(topBudget.amount)} ${homeCurrency}).`
      : 'Budget: no active budgets.';
    const attentionSummary = alerts.length > 0
      ? `Attention: ${alerts[0].message}`
      : 'Attention: no urgent issues detected.';

    const topExpenses = Object.entries(expenseByTarget).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => `${name} ${Math.round(value)} ${homeCurrency}`).join('; ') || 'none';
    const topIncome = Object.entries(incomeBySource).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, value]) => `${name} ${Math.round(value)} ${homeCurrency}`).join('; ') || 'none';
    const spendingComment = expense30 > 0 ? `Comment: ${Math.round((essential30 / expense30) * 100)}% of spending looks essential; review the rest.` : 'Comment: no spending recorded.';
    const summary = `${monthName}\nReceived: ${Math.round(income30)} ${homeCurrency} — ${topIncome}\nSpent: ${Math.round(expense30)} ${homeCurrency}\nTop 5 expenses: ${topExpenses}\n${spendingComment}\nTotal balance: ${Math.round(totalBalance)} ${homeCurrency} — trend ${trend}.\nIf nothing changes: ~${Math.round(projectedBalance)} ${homeCurrency} by month end.\n${budgetSummary}\n${attentionSummary}`;

    return NextResponse.json({ alerts, count: alerts.length, summary });
  } catch (error) {
    console.error("Alerts API Error:", error);
    return NextResponse.json({ alerts: [], count: 0 });
  }
}
