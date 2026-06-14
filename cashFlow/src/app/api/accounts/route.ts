import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const accounts = await prisma.account.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, balance, currency, includeInTotal } = body;

    const account = await prisma.account.create({
      data: {
        name,
        type,
        balance: balance ? parseFloat(balance) : 0,
        currency: currency || "CAD",
        includeInTotal: includeInTotal !== undefined ? includeInTotal : true,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
