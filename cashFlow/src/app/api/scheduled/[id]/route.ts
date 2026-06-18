import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toTitleCase } from "@/utils/format";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { amount, merchant, paymentMethod, notes, accountId, toAccountId, categoryId, nextRunDate, frequency, autoApprove, isActive, type, inflationRate } = body;

    let finalAmount = amount !== undefined ? Math.abs(parseFloat(amount)) : undefined;
    if (finalAmount !== undefined && type === 'expense') {
      finalAmount = -finalAmount;
    }

    let finalPayeeId = null;
    let finalMerchantName = merchant;

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

    const scheduled = await prisma.scheduledTransaction.update({
      where: { id },
      data: {
        amount: finalAmount,
        merchant: finalMerchantName,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : undefined,
        payeeId: finalPayeeId,
        notes,
        accountId: accountId === '' ? undefined : accountId,
        toAccountId: type === 'transfer' ? (toAccountId === '' ? null : toAccountId) : null,
        categoryId: type === 'transfer' ? null : (categoryId === '' ? null : categoryId),
        nextRunDate: nextRunDate ? new Date(nextRunDate) : undefined,
        frequency,
        autoApprove: autoApprove !== undefined ? Boolean(autoApprove) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        type: type !== undefined ? type : undefined,
        inflationRate: inflationRate !== undefined ? (inflationRate === '' ? null : parseFloat(inflationRate)) : undefined,
      },
      include: {
        account: true,
        category: true
      }
    });

    return NextResponse.json(scheduled);
  } catch (error: any) {
    console.error("Failed to update scheduled transaction:", error.message || error);
    return NextResponse.json({ error: "Failed to update scheduled transaction" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    await prisma.scheduledTransaction.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete scheduled transaction:", error);
    return NextResponse.json({ error: "Failed to delete scheduled transaction" }, { status: 500 });
  }
}
