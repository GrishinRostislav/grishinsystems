import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [latestTx, latestAcc, latestBudget, latestSt] = await Promise.all([
      prisma.transaction.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true }
      }),
      prisma.account.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true }
      }),
      prisma.budget.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true }
      }),
      prisma.scheduledTransaction.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true }
      })
    ]);

    const dates = [
      latestTx?.updatedAt?.getTime() || 0,
      latestAcc?.updatedAt?.getTime() || 0,
      latestBudget?.updatedAt?.getTime() || 0,
      latestSt?.updatedAt?.getTime() || 0
    ];

    const lastUpdated = Math.max(...dates, 0);

    return NextResponse.json({ lastUpdated });
  } catch (error) {
    console.error("Sync status error:", error);
    return NextResponse.json({ lastUpdated: Date.now() }, { status: 500 });
  }
}
