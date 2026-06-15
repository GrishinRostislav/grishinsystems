import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
  try {
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

        // Fetch sum of expense transactions (amount < 0) in the category set
        const aggregation = await prisma.transaction.aggregate({
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
          _sum: {
            amount: true
          }
        });

        const spent = Math.abs(aggregation._sum.amount || 0);

        return {
          ...budget,
          spent,
          currentPeriodStart: start.toISOString(),
          currentPeriodEnd: end.toISOString()
        };
      })
    );

    return NextResponse.json(budgetsWithSpent);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, amount, period, startDate, endDate, isGlobal, categoryIds } = body;

    const budget = await prisma.budget.create({
      data: {
        name,
        amount: parseFloat(amount),
        period,
        startDate: new Date(startDate || new Date()),
        endDate: endDate ? new Date(endDate) : null,
        isGlobal: !!isGlobal,
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
