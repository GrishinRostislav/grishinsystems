import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const accounts = await prisma.account.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" }
      ],
    });

    const flows = await prisma.transaction.groupBy({
      by: ['accountId'],
      where: {
        date: { gte: thirtyDaysAgo, lte: now }
      },
      _sum: {
        amount: true
      }
    });

    const flowMap = new Map();
    for (const f of flows) {
      flowMap.set(f.accountId, f._sum.amount || 0);
    }

    const enrichedAccounts = accounts.map(acc => {
      const netFlow = flowMap.get(acc.id) || 0;
      const prevBalance = acc.balance - netFlow;
      const changePercent = prevBalance !== 0 ? (netFlow / prevBalance) * 100 : 0;
      return {
        ...acc,
        flow30d: netFlow,
        flow30dPercent: changePercent
      };
    });

    return NextResponse.json(enrichedAccounts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, balance, currency, includeInTotal } = body;

    const maxOrderAccount = await prisma.account.findFirst({
      orderBy: { order: 'desc' },
    });
    const nextOrder = maxOrderAccount ? maxOrderAccount.order + 1 : 0;

    const account = await prisma.account.create({
      data: {
        name,
        type,
        balance: balance ? parseFloat(balance) : 0,
        currency: currency || "CAD",
        includeInTotal: includeInTotal !== undefined ? includeInTotal : true,
        order: nextOrder,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
