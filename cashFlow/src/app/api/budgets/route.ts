import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExchangeRates } from "@/lib/currency";
import { calculateBudgetMetrics } from "@/lib/services/budgetService";

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

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const metrics = await calculateBudgetMetrics(budget, homeCurrency, rates);
        return {
          ...budget,
          ...metrics
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
