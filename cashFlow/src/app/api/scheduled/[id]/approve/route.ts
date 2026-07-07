import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getNextDate(date: Date, frequency: string): Date {
  const next = new Date(date);
  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Find the scheduled transaction
    const sched = await prisma.scheduledTransaction.findUnique({
      where: { id },
      include: { account: true }
    });

    if (!sched) {
      return NextResponse.json({ error: "Scheduled transaction not found" }, { status: 404 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // ignore
    }

    const amountRaw = body.amount !== undefined ? Math.abs(Number(body.amount)) : Math.abs(sched.amount);
    const finalType = body.type || sched.type;
    const finalDate = body.date ? new Date(body.date) : new Date();
    const finalMerchant = body.merchant !== undefined ? body.merchant : sched.merchant;
    const finalAccountId = body.accountId || sched.accountId;
    const finalToAccountId = body.toAccountId !== undefined ? body.toAccountId : sched.toAccountId;
    const finalCategoryId = body.categoryId !== undefined ? body.categoryId : sched.categoryId;
    const finalNotes = body.notes !== undefined ? body.notes : sched.notes;

    const runDate = new Date(sched.nextRunDate);
    
    // 1. Create the transaction(s)
    if (finalType === 'transfer' && finalToAccountId) {
      // OUT transaction
      await prisma.transaction.create({
        data: {
          amount: -amountRaw,
          date: finalDate,
          merchant: finalMerchant || "Transfer Out",
          payeeId: sched.payeeId,
          notes: finalNotes ? `[Manual Approve] ${finalNotes}` : '[Manual Approve Transfer]',
          accountId: finalAccountId,
          paymentMethod: sched.paymentMethod || 'Manual-Scheduled'
        }
      });
      // IN transaction
      await prisma.transaction.create({
        data: {
          amount: amountRaw,
          date: finalDate,
          merchant: finalMerchant || "Transfer In",
          payeeId: sched.payeeId,
          notes: finalNotes ? `[Manual Approve] ${finalNotes}` : '[Manual Approve Transfer]',
          accountId: finalToAccountId,
          paymentMethod: sched.paymentMethod || 'Manual-Scheduled'
        }
      });

      // Update balances
      await prisma.account.update({
        where: { id: finalAccountId },
        data: { balance: { increment: -amountRaw } }
      });

      await prisma.account.update({
        where: { id: finalToAccountId },
        data: { balance: { increment: amountRaw } }
      });

    } else {
      const finalAmount = finalType === 'expense' ? -amountRaw : amountRaw;

      await prisma.transaction.create({
        data: {
          amount: finalAmount,
          date: finalDate,
          merchant: finalMerchant,
          payeeId: sched.payeeId,
          notes: finalNotes ? `[Manual Approve] ${finalNotes}` : '[Manual Approve]',
          accountId: finalAccountId,
          categoryId: finalCategoryId,
          paymentMethod: sched.paymentMethod || 'Manual-Scheduled'
        }
      });

      // 2. Update balance
      await prisma.account.update({
        where: { id: finalAccountId },
        data: { balance: { increment: finalAmount } }
      });
    }
    // 3. Advance to next date
    const nextDate = getNextDate(runDate, sched.frequency);
    
    const updatedSched = await prisma.scheduledTransaction.update({
      where: { id: sched.id },
      data: { nextRunDate: nextDate },
      include: { account: true, category: true }
    });

    return NextResponse.json({ success: true, scheduled: updatedSched });
  } catch (error) {
    console.error("Failed to approve scheduled transaction:", error);
    return NextResponse.json({ error: "Failed to approve scheduled transaction" }, { status: 500 });
  }
}
