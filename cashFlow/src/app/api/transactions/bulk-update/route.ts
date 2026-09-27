import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { transactionIds, data } = body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json({ error: "Missing or invalid transactionIds" }, { status: 400 });
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: "Missing or invalid data payload" }, { status: 400 });
    }

    // Build the update payload, allowing only specific safe fields
    const updateData: any = {};
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.merchant !== undefined) updateData.merchant = data.merchant;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;

    const newAccountId = data.accountId || null;
    if (newAccountId) {
      const transactions = await prisma.transaction.findMany({
        where: { id: { in: transactionIds } },
        select: { id: true, accountId: true, amount: true },
      });

      await prisma.$transaction(async (tx) => {
        for (const transaction of transactions) {
          if (transaction.accountId === newAccountId) continue;

          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { decrement: transaction.amount } },
          });
          await tx.account.update({
            where: { id: newAccountId },
            data: { balance: { increment: transaction.amount } },
          });
        }

        await tx.transaction.updateMany({
          where: { id: { in: transactions.map(transaction => transaction.id) } },
          data: { accountId: newAccountId },
        });
      });
    }

    if (Object.keys(updateData).length === 0 && !newAccountId) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const result = await prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds }
      },
      data: updateData
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Bulk update failed:", error);
    return NextResponse.json({ error: "Failed to bulk update transactions" }, { status: 500 });
  }
}
