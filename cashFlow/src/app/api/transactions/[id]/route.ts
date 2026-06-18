import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toTitleCase } from "@/utils/format";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { amount, date, merchant, paymentMethod, notes, accountId, categoryId, type, toAccountId } = body;

    const oldTx = await prisma.transaction.findUnique({ where: { id } });
    if (!oldTx) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Reverse old effect
    await prisma.account.update({
      where: { id: oldTx.accountId },
      data: { balance: { decrement: oldTx.amount } }
    });

    const parsedAmount = Math.abs(parseFloat(amount));
    const newAmount = type === 'expense' ? -parsedAmount : (type === 'transfer' ? -parsedAmount : parsedAmount);

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

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        amount: newAmount,
        date: new Date(date),
        merchant: finalMerchantName,
        payeeId: finalPayeeId,
        paymentMethod,
        notes,
        accountId,
        categoryId: type === 'transfer' ? null : (categoryId || null),
        isTransfer: type === 'transfer',
      },
    });

    // Apply new effect for source account
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: newAmount } }
    });

    // If changing to transfer, spawn the second leg
    if (type === 'transfer' && toAccountId) {
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
          isTransfer: true,
        },
      });

      await prisma.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: parsedAmount } },
      });

      return NextResponse.json({ outTx: transaction, inTx });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const oldTx = await prisma.transaction.findUnique({ where: { id } });
    if (!oldTx) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Reverse effect
    await prisma.account.update({
      where: { id: oldTx.accountId },
      data: { balance: { decrement: oldTx.amount } }
    });

    await prisma.transaction.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
