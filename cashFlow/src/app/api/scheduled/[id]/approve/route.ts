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

    const runDate = new Date(sched.nextRunDate);
    
    // 1. Create the transaction(s)
    if (sched.type === 'transfer' && sched.toAccountId) {
      // OUT transaction
      await prisma.transaction.create({
        data: {
          amount: -Math.abs(sched.amount),
          date: new Date(runDate),
          merchant: sched.merchant || "Transfer Out",
          payeeId: sched.payeeId,
          notes: sched.notes ? `[Manual Approve] ${sched.notes}` : '[Manual Approve Transfer]',
          accountId: sched.accountId,
          paymentMethod: sched.paymentMethod || 'Manual-Scheduled'
        }
      });
      // IN transaction
      await prisma.transaction.create({
        data: {
          amount: Math.abs(sched.amount),
          date: new Date(runDate),
          merchant: sched.merchant || "Transfer In",
          payeeId: sched.payeeId,
          notes: sched.notes ? `[Manual Approve] ${sched.notes}` : '[Manual Approve Transfer]',
          accountId: sched.toAccountId,
          paymentMethod: sched.paymentMethod || 'Manual-Scheduled'
        }
      });

      // Update balances
      await prisma.account.update({
        where: { id: sched.accountId },
        data: { balance: sched.account.balance - Math.abs(sched.amount) }
      });

      const toAccount = await prisma.account.findUnique({ where: { id: sched.toAccountId }});
      if (toAccount) {
        await prisma.account.update({
          where: { id: sched.toAccountId },
          data: { balance: toAccount.balance + Math.abs(sched.amount) }
        });
      }

    } else {
      await prisma.transaction.create({
        data: {
          amount: sched.amount,
          date: new Date(runDate),
          merchant: sched.merchant,
          payeeId: sched.payeeId,
          notes: sched.notes ? `[Manual Approve] ${sched.notes}` : '[Manual Approve]',
          accountId: sched.accountId,
          categoryId: sched.categoryId,
          paymentMethod: sched.paymentMethod || 'Manual-Scheduled'
        }
      });

      // 2. Update balance
      const newBalance = sched.account.balance + sched.amount;
      await prisma.account.update({
        where: { id: sched.accountId },
        data: { balance: newBalance }
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
