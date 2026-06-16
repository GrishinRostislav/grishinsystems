import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { amount, merchant, paymentMethod, notes, accountId, toAccountId, categoryId, nextRunDate, frequency, autoApprove, isActive, type } = body;

    let finalAmount = amount !== undefined ? Math.abs(parseFloat(amount)) : undefined;
    if (finalAmount !== undefined && type === 'expense') {
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
