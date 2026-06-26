import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExchangeRates, convertAmount } from "@/lib/currency";
import { getCurrentPeriodDates, addFrequency, getCategoryDescendantIds } from "@/lib/budgetUtils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    let settings = await prisma.settings.findUnique({ where: { id: "global" } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: "global", homeCurrency: "CAD" } });
    }
    const homeCurrency = settings.homeCurrency;
    const rates = await getExchangeRates(homeCurrency);

    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        categories: {
          select: { id: true, name: true }
        }
      }
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const { start, end } = getCurrentPeriodDates(budget.period, budget.startDate, budget.endDate);

    const selectedCategoryIds = budget.categories.map(c => c.id);
    const allTargetCategoryIds = budget.isGlobal ? [] : await getCategoryDescendantIds(selectedCategoryIds);

    const transactions = await prisma.transaction.findMany({
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
      include: { account: true, category: true },
      orderBy: { date: "desc" }
    });

    let spent = 0;
    for (const t of transactions) {
      spent += Math.abs(convertAmount(t.amount, t.account.currency, homeCurrency, rates));
    }

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

    const budgetWithSpent = {
      ...budget,
      spent,
      projected,
      currentPeriodStart: start.toISOString(),
      currentPeriodEnd: end.toISOString()
    };

    return NextResponse.json({ budget: budgetWithSpent, transactions, homeCurrency });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch budget" }, { status: 500 });
  }
}


export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, amount, period, startDate, endDate, isGlobal, categoryIds, inflationRate } = body;

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        name,
        amount: parseFloat(amount),
        period,
        startDate: new Date(startDate || new Date()),
        endDate: endDate ? new Date(endDate) : null,
        isGlobal: !!isGlobal,
        inflationRate: inflationRate !== undefined ? (inflationRate === '' ? null : parseFloat(inflationRate)) : undefined,
        categories: {
          set: (categoryIds || []).map((cid: string) => ({ id: cid }))
        }
      },
      include: {
        categories: true
      }
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.budget.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
