import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExchangeRates, convertAmount } from "@/lib/currency";
import { getCurrentPeriodDates, addFrequency, getCategoryDescendantIds } from "@/lib/budgetUtils";

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

    const allTargetCategoryIdsByBudget = new Map();

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const { start, end } = getCurrentPeriodDates(budget.period, budget.startDate, budget.endDate);

        // Find all descendant categories to include in budget
        const selectedCategoryIds = budget.categories.map(c => c.id);
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
              if (simDate >= start) {
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
