import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transactions, accountId } = body;
    
    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Process transactions sequentially to safely update balance
    // In a real app with high concurrency, use a transaction block (prisma.$transaction)
    let totalAmount = 0;
    const createdTransactions = [];

    for (const txn of transactions) {
      const parsedAmount = parseFloat(txn.amount);
      totalAmount += parsedAmount;
      
      const newTxn = await prisma.transaction.create({
        data: {
          amount: parsedAmount,
          date: new Date(txn.date),
          merchant: txn.merchant || null,
          paymentMethod: txn.paymentMethod || null,
          notes: txn.notes || null,
          accountId,
          categoryId: txn.categoryId || null,
        },
      });
      createdTransactions.push(newTxn);
    }

    if (totalAmount !== 0) {
      await prisma.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: totalAmount,
          },
        },
      });
    }

    return NextResponse.json({ success: true, count: createdTransactions.length }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to import transactions" }, { status: 500 });
  }
}
