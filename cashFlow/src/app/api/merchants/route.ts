import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toTitleCase } from "@/utils/format";

export async function GET() {
  try {
    const merchants = await prisma.merchant.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { transactions: true, scheduledTransactions: true }
        }
      }
    });
    return NextResponse.json(merchants);
  } catch (error) {
    console.error("Failed to fetch merchants:", error);
    return NextResponse.json({ error: "Failed to fetch merchants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const formattedName = toTitleCase(name.trim());

    const merchant = await prisma.merchant.create({
      data: { name: formattedName }
    });

    return NextResponse.json(merchant, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create merchant:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Merchant already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create merchant" }, { status: 500 });
  }
}
