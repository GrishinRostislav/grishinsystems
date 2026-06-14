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
      where: { id }
    });

    if (!sched) {
      return NextResponse.json({ error: "Scheduled transaction not found" }, { status: 404 });
    }

    const runDate = new Date(sched.nextRunDate);
    
    // Just advance to next date
    const nextDate = getNextDate(runDate, sched.frequency);
    
    const updatedSched = await prisma.scheduledTransaction.update({
      where: { id: sched.id },
      data: { nextRunDate: nextDate },
      include: { account: true, category: true }
    });

    return NextResponse.json({ success: true, scheduled: updatedSched });
  } catch (error) {
    console.error("Failed to skip scheduled transaction:", error);
    return NextResponse.json({ error: "Failed to skip scheduled transaction" }, { status: 500 });
  }
}
