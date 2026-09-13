import { prisma } from "@/lib/prisma";
import { convertAmount } from "@/lib/currency";
import { getCurrentPeriodDates, addFrequency, getCategoryDescendantIds } from "@/lib/budgetUtils";

export interface ComputedBudgetMetrics {
  spent: number;
  projected: number;
  remaining: number;
  spentPercent: number;
  projectedPercent: number;
  isOverBudget: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export async function calculateBudgetMetrics(
  budget: any,
  homeCurrency: string,
  rates: Record<string, number>
): Promise<ComputedBudgetMetrics> {
  const { start, end } = getCurrentPeriodDates(budget.period, budget.startDate, budget.endDate);

  // Find all descendant categories to include in budget
  const selectedCategoryIds = (budget.categories || []).map((c: any) => c.id);
  const allTargetCategoryIds = budget.isGlobal ? [] : await getCategoryDescendantIds(selectedCategoryIds);

  // Fetch expense transactions (amount < 0) in the category set, excluding transfers
  const txns = await prisma.transaction.findMany({
    where: {
      isTransfer: false,
      date: {
        gte: start,
        lte: end
      },
      amount: {
        lt: 0
      },
      ...(!budget.isGlobal ? {
        categoryId: {
          in: allTargetCategoryIds
        }
      } : {})
    },
    include: { account: true }
  });

  let spent = 0;
  for (const t of txns) {
    spent += Math.abs(convertAmount(t.amount, t.account.currency, homeCurrency, rates));
  }

  // Calculate projected from ScheduledTransactions
  let projected = 0;
  const now = new Date();
  if (end > now) {
    const scheduledTxs = await prisma.scheduledTransaction.findMany({
      where: {
        isActive: true,
        type: 'expense',
        account: { includeInTotal: true, isArchived: false },
        ...(!budget.isGlobal ? {
          categoryId: {
            in: allTargetCategoryIds
          }
        } : {})
      },
      include: { account: true }
    });

    for (const st of scheduledTxs) {
      let simDate = new Date(st.nextRunDate);
      while (simDate <= end) {
        // Only count future scheduled occurrences in this period to avoid double counting executed transactions
        if (simDate >= now && simDate >= start) {
          const convertedAmt = convertAmount(st.amount, st.account?.currency || homeCurrency, homeCurrency, rates);
          projected += Math.abs(convertedAmt);
        }
        simDate = addFrequency(simDate, st.frequency);
      }
    }
  }

  const remaining = budget.amount - spent;
  const spentPercent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const projectedPercent = budget.amount > 0 ? (projected / budget.amount) * 100 : 0;
  const isOverBudget = remaining < 0;

  return {
    spent,
    projected,
    remaining,
    spentPercent,
    projectedPercent,
    isOverBudget,
    currentPeriodStart: start.toISOString(),
    currentPeriodEnd: end.toISOString()
  };
}
