import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toTitleCase } from "@/utils/format";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate ? {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: {
        transactions: {
          where: dateFilter,
          include: { account: true, category: true },
          orderBy: { date: 'desc' }
        },
        scheduledTransactions: {
          include: { account: true, category: true }
        }
      }
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    return NextResponse.json(merchant);
  } catch (error) {
    console.error("Failed to fetch merchant:", error);
    return NextResponse.json({ error: "Failed to fetch merchant details" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const formattedName = toTitleCase(name.trim());

    const merchant = await prisma.merchant.update({
      where: { id },
      data: { name: formattedName }
    });

    return NextResponse.json(merchant);
  } catch (error) {
    console.error("Failed to update merchant:", error);
    return NextResponse.json({ error: "Failed to update merchant" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    await prisma.merchant.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete merchant:", error);
    return NextResponse.json({ error: "Failed to delete merchant" }, { status: 500 });
  }
}
