import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addFrequency } from "@/utils/recurrence";

export async function POST() {
  try {
    const now = new Date();
    
    // Find all due and active scheduled transactions
    const dueTransactions = await prisma.scheduledTransaction.findMany({
      where: {
        isActive: true,
        nextRunDate: {
          lte: now
        },
        autoApprove: true
      },
      include: {
        account: true
      }
    });

    let processedCount = 0;

    for (const sched of dueTransactions) {
      let runDate = new Date(sched.nextRunDate);
      let newBalance = sched.account.balance;
      let shouldDeactivate = false;

      // In case it's been a long time, loop until the next run date is in the future
      while (runDate <= now) {
        if (sched.endDate && runDate > new Date(sched.endDate)) {
          shouldDeactivate = true;
          break;
        }

        if (sched.type === 'transfer' && sched.toAccountId) {
          // OUT transaction
          await prisma.transaction.create({
            data: {
              amount: -Math.abs(sched.amount),
              date: new Date(runDate),
              merchant: sched.merchant || "Transfer Out",
              payeeId: sched.payeeId,
              notes: sched.notes ? `[Auto] ${sched.notes}` : '[Auto Transfer]',
              accountId: sched.accountId,
              paymentMethod: sched.paymentMethod || 'Auto-Scheduled'
            }
          });
          // IN transaction
          await prisma.transaction.create({
            data: {
              amount: Math.abs(sched.amount),
              date: new Date(runDate),
              merchant: sched.merchant || "Transfer In",
              payeeId: sched.payeeId,
              notes: sched.notes ? `[Auto] ${sched.notes}` : '[Auto Transfer]',
              accountId: sched.toAccountId,
              paymentMethod: sched.paymentMethod || 'Auto-Scheduled'
            }
          });

          // Update balances
          newBalance -= Math.abs(sched.amount);
          
          const toAccount = await prisma.account.findUnique({ where: { id: sched.toAccountId }});
          if (toAccount) {
            await prisma.account.update({
              where: { id: sched.toAccountId },
              data: { balance: toAccount.balance + Math.abs(sched.amount) }
            });
          }

        } else {
          // Normal Expense/Income
          await prisma.transaction.create({
            data: {
              amount: sched.amount,
              date: new Date(runDate),
              merchant: sched.merchant,
              payeeId: sched.payeeId,
              notes: sched.notes ? `[Auto] ${sched.notes}` : '[Auto]',
              accountId: sched.accountId,
              categoryId: sched.categoryId,
              paymentMethod: sched.paymentMethod || 'Auto-Scheduled'
            }
          });
          newBalance += sched.amount;
        }

        processedCount++;

        if (sched.frequency === 'ONCE') {
          shouldDeactivate = true;
          break;
        }
        
        // Advance to next date
        runDate = addFrequency(runDate, sched.frequency, sched.interval || 1, sched.daysOfWeek, sched.monthsOfYear);
      }

      // If the next run date exceeds the end date, deactivate it
      if (sched.endDate && runDate > new Date(sched.endDate)) {
        shouldDeactivate = true;
      }

      // Update the scheduled transaction's next run date and active status
      await prisma.scheduledTransaction.update({
        where: { id: sched.id },
        data: { 
          nextRunDate: runDate,
          isActive: !shouldDeactivate
        }
      });

      // Update the main account balance
      await prisma.account.update({
        where: { id: sched.accountId },
        data: { balance: newBalance }
      });
    }

    return NextResponse.json({ success: true, processedCount });
  } catch (error) {
    console.error("Failed to process scheduled transactions:", error);
    return NextResponse.json({ error: "Failed to process scheduled transactions" }, { status: 500 });
  }
}
