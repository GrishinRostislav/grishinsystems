import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pms = await prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: { 
        paymentMethod: { 
          not: null
        } 
      }
    });
    
    // Filter out empty strings in memory and sort
    const result = pms
      .map(p => p.paymentMethod)
      .filter(pm => pm && pm.trim() !== "")
      .sort((a, b) => (a as string).localeCompare(b as string));

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 });
  }
}
