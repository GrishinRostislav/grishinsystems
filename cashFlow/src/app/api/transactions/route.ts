import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate = new Date(0); // default all time
    let endDate = new Date();    // default now
    
    if (startDateParam) startDate = new Date(startDateParam);
    if (endDateParam) {
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, date, merchant, paymentMethod, notes, accountId, categoryId, transactionType, toAccountId } = body;

    let finalPayeeId = null;
    let finalMerchantName = merchant;

    if (merchant && merchant.trim() !== '') {
      let payee = await prisma.merchant.findUnique({ where: { name: merchant.trim() } });
      if (!payee) {
        payee = await prisma.merchant.create({ data: { name: merchant.trim() } });
      }
      finalPayeeId = payee.id;
      finalMerchantName = payee.name;
    }

    if (transactionType === "transfer") {
      const parsedAmount = Math.abs(parseFloat(amount));
      
      // 1. Create OUT transaction (Expense from source)
      const outTx = await prisma.transaction.create({
        data: {
          amount: -parsedAmount,
          date: new Date(date),
          merchant: finalMerchantName || "Transfer Out",
          payeeId: finalPayeeId,
          paymentMethod,
          notes,
          accountId,
          categoryId: null, // transfers typically don't have categories or use a specific transfer category
        },
      });

      await prisma.account.update({
        where: { id: accountId },
        data: { balance: { increment: -parsedAmount } },
      });

      // 2. Create IN transaction (Income to destination)
      const inTx = await prisma.transaction.create({
        data: {
          amount: parsedAmount,
          date: new Date(date),
          merchant: finalMerchantName || "Transfer In",
          payeeId: finalPayeeId,
          paymentMethod,
          notes,
          accountId: toAccountId,
          categoryId: null,
        },
      });

      await prisma.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: parsedAmount } },
      });

      return NextResponse.json({ outTx, inTx }, { status: 201 });
    } else {
      // Normal transaction (Expense or Income)
      const transaction = await prisma.transaction.create({
        data: {
          amount: parseFloat(amount),
          date: new Date(date),
          merchant: finalMerchantName,
          payeeId: finalPayeeId,
          paymentMethod,
          notes,
          accountId,
          categoryId: categoryId || null,
        },
      });

      await prisma.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: parseFloat(amount),
          },
        },
      });

      return NextResponse.json(transaction, { status: 201 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
