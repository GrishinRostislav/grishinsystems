import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const scheduled = await prisma.scheduledTransaction.findMany({
      include: {
        account: true,
        toAccount: true,
        category: true,
      },
      orderBy: {
        nextRunDate: 'asc'
      }
    });
    return NextResponse.json(scheduled);
  } catch (error) {
    console.error("Failed to fetch scheduled transactions:", error);
    return NextResponse.json({ error: "Failed to fetch scheduled transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, merchant, paymentMethod, notes, accountId, toAccountId, categoryId, nextRunDate, frequency, autoApprove, type } = body;

    if (!amount || !accountId || !nextRunDate || !frequency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let finalAmount = Math.abs(parseFloat(amount));
    if (type === 'expense') {
      finalAmount = -finalAmount;
    }

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

    const scheduled = await prisma.scheduledTransaction.create({
      data: {
        amount: finalAmount,
        merchant: finalMerchantName,
        paymentMethod: paymentMethod || null,
        payeeId: finalPayeeId,
        notes,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : null,
        categoryId: type === 'transfer' ? null : (categoryId || null),
        nextRunDate: new Date(nextRunDate),
        frequency,
        autoApprove: Boolean(autoApprove),
        isActive: true,
        type: type || 'expense',
      },
      include: {
        account: true,
        category: true
      }
    });

    return NextResponse.json(scheduled);
  } catch (error) {
    console.error("Failed to create scheduled transaction:", error);
    return NextResponse.json({ error: "Failed to create scheduled transaction" }, { status: 500 });
  }
}
