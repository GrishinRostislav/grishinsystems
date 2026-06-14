import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const category = await prisma.category.findUnique({
      where: { id },
      include: { subcategories: true }
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    let startDate = new Date(0);
    let endDate = new Date();
    
    if (startDateParam) startDate = new Date(startDateParam);
    if (endDateParam) {
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    }

    // Include transactions for this category AND its subcategories
    const categoryIds = [id];
    if (category.subcategories) {
      category.subcategories.forEach(sub => categoryIds.push(sub.id));
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        categoryId: { in: categoryIds },
        date: { 
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        account: true,
      },
      orderBy: { date: "asc" }
    });

    // Determine interval dynamically based on range
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const chartMap: Record<string, number> = {};
    let totalSpending = 0;

    for (const txn of transactions) {
      // Typically categories are expenses, but could be income
      const amount = Math.abs(txn.amount);
      totalSpending += amount;

      const txnDate = new Date(txn.date);
      let chartKey = "";
      if (diffDays <= 35) {
        chartKey = txnDate.toLocaleString('default', { month: 'short', day: 'numeric' });
      } else {
        chartKey = txnDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      }

      chartMap[chartKey] = (chartMap[chartKey] || 0) + amount;
    }

    const chartData = Object.keys(chartMap).map(date => ({
      date,
      amount: chartMap[date]
    }));

    // Reverse for the table
    const tableTransactions = [...transactions].reverse();

    return NextResponse.json({
      category,
      totalSpending,
      chartData,
      transactions: tableTransactions
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch category details" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { name, parentId } = body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        parentId: parentId || null
      }
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // First update all children to have no parent, or cascade delete.
    // Given the schema, onDelete is probably SetNull or Cascade.
    // If we just delete, Prisma handles it based on schema.
    await prisma.category.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
