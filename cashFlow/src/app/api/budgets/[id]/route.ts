import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
