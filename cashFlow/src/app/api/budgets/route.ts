import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExchangeRates, convertAmount } from "@/lib/currency";

function getCurrentPeriodDates(period: string, budgetStartDate: Date, budgetEndDate: Date | null) {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  if (period === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === 'yearly') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    start = new Date(budgetStartDate);
    end = budgetEndDate ? new Date(budgetEndDate) : new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

function addFrequency(date: Date, freq: string): Date {
  const next = new Date(date);
  switch (freq) {
    case 'DAILY': next.setDate(next.getDate() + 1); break;
    case 'WEEKLY': next.setDate(next.getDate() + 7); break;
    case 'BIWEEKLY': next.setDate(next.getDate() + 14); break;
    case 'MONTHLY': next.setMonth(next.getMonth() + 1); break;
    case 'YEARLY': next.setFullYear(next.getFullYear() + 1); break;
  }
  return next;
}

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: "global" } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: "global", homeCurrency: "CAD" } });
    }
    const homeCurrency = settings.homeCurrency;
    const rates = await getExchangeRates(homeCurrency);

    const budgets = await prisma.budget.findMany({
      include: {
        categories: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const allCategories = await prisma.category.findMany({ select: { id: true, parentId: true } });
    
    // Build adjacency list for children
    const childrenMap = new Map<string, string[]>();
    for (const cat of allCategories) {
      if (cat.parentId) {
        if (!childrenMap.has(cat.parentId)) childrenMap.set(cat.parentId, []);
        childrenMap.get(cat.parentId)!.push(cat.id);
      }
    }

    // Helper to get all descendant IDs including self
    const getDescendantIds = (rootIds: string[]) => {
      const result = new Set<string>(rootIds);
      const queue = [...rootIds];
      while (queue.length > 0) {
        const current = queue.shift()!;
        const children = childrenMap.get(current) || [];
        for (const child of children) {
          if (!result.has(child)) {
            result.add(child);
            queue.push(child);
          }
        }
      }
      return Array.from(result);
    };

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const { start, end } = getCurrentPeriodDates(budget.period, budget.startDate, budget.endDate);

        // Find all descendant categories to include in budget
        const selectedCategoryIds = budget.categories.map(c => c.id);
        const allTargetCategoryIds = budget.isGlobal ? [] : getDescendantIds(selectedCategoryIds);

        // Fetch expense transactions (amount < 0) in the category set
        const txns = await prisma.transaction.findMany({
          where: {
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
          const simStart = start > now ? start : now;
          
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
              if (simDate >= simStart) {
                const convertedAmt = convertAmount(st.amount, st.account?.currency || homeCurrency, homeCurrency, rates);
                projected += Math.abs(convertedAmt);
              }
              simDate = addFrequency(simDate, st.frequency);
            }
          }
        }

        return {
          ...budget,
          spent,
          projected,
          currentPeriodStart: start.toISOString(),
          currentPeriodEnd: end.toISOString()
        };
      })
    );

    return NextResponse.json({ budgets: budgetsWithSpent, homeCurrency });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, amount, period, startDate, endDate, isGlobal, categoryIds, inflationRate } = body;

    const budget = await prisma.budget.create({
      data: {
        name,
        amount: parseFloat(amount),
        period,
        startDate: new Date(startDate || new Date()),
        endDate: endDate ? new Date(endDate) : null,
        isGlobal: !!isGlobal,
        inflationRate: inflationRate ? parseFloat(inflationRate) : null,
        categories: {
          connect: (categoryIds || []).map((id: string) => ({ id }))
        }
      },
      include: {
        categories: true
      }
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
  }
}
