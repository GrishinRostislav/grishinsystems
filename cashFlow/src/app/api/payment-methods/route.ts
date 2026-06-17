import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [txPms, schedPms] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['paymentMethod'],
        where: { paymentMethod: { not: null } }
      }),
      prisma.scheduledTransaction.groupBy({
        by: ['paymentMethod'],
        where: { paymentMethod: { not: null } }
      })
    ]);
    
    // Combine, remove duplicates, filter out empty strings, and sort
    const allPms = new Set([
      ...txPms.map(p => p.paymentMethod),
      ...schedPms.map(p => p.paymentMethod)
    ]);

    const result = Array.from(allPms)
      .filter(pm => pm && typeof pm === 'string' && pm.trim() !== "")
      .sort((a, b) => (a as string).localeCompare(b as string));

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 });
  }
}
