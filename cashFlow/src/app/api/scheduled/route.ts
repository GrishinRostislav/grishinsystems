import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toTitleCase } from "@/utils/format";

export async function GET() {
  try {
    const scheduled = await prisma.scheduledTransaction.findMany({
      include: {
        account: true,
        toAccount: true,
        category: true,
      },
      orderBy: [
        { nextRunDate: 'asc' },
        { id: 'asc' }
      ]
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
    const { amount, merchant, paymentMethod, notes, accountId, toAccountId, categoryId, nextRunDate, frequency, interval, endDate, autoApprove, type, inflationRate } = body;

    if (amount === undefined || amount === null || !accountId || !nextRunDate || !frequency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let finalAmount = Math.abs(parseFloat(amount));
    if (type === 'expense') {
      finalAmount = -finalAmount;
    }

    let finalPayeeId = null;
    let finalMerchantName = merchant || '';

    if (merchant && merchant.trim() !== '') {
      const formattedMerchant = toTitleCase(merchant.trim());
      let payee = await prisma.merchant.findFirst({ 
        where: { name: { equals: formattedMerchant, mode: 'insensitive' } } 
      });
      if (!payee) {
        payee = await prisma.merchant.create({ data: { name: formattedMerchant } });
      } else if (payee.name !== formattedMerchant) {
        payee = await prisma.merchant.update({
          where: { id: payee.id },
          data: { name: formattedMerchant }
        });
      }
      finalPayeeId = payee.id;
      finalMerchantName = payee.name;
    }

    const scheduled = await prisma.scheduledTransaction.create({
      data: {
        amount: finalAmount,
        merchant: finalMerchantName,
        paymentMethod: paymentMethod || null,
        payeeId: finalPayeeId || null,
        notes: notes || '',
        accountId: accountId || undefined,
        toAccountId: type === 'transfer' ? (toAccountId || null) : null,
        categoryId: type === 'transfer' ? null : (categoryId || null),
        nextRunDate: new Date(nextRunDate),
        frequency,
        interval: interval ? parseInt(interval) : 1,
        endDate: endDate ? new Date(endDate) : null,
        autoApprove: Boolean(autoApprove),
        isActive: true,
        type: type || 'expense',
        inflationRate: inflationRate ? parseFloat(inflationRate) : null,
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
