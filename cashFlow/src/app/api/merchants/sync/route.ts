import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toTitleCase } from "@/utils/format";

export async function POST(request: Request) {
  try {
    // Find all transactions that have a merchant name but no payeeId
    const transactions = await prisma.transaction.findMany({
      where: {
        merchant: {
          not: null,
          not: ""
        },
        payeeId: null,
        isTransfer: false
      }
    });

    let updatedCount = 0;

    for (const txn of transactions) {
      if (!txn.merchant) continue;
      
      const formattedMerchant = toTitleCase(txn.merchant.trim());
      
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

      await prisma.transaction.update({
        where: { id: txn.id },
        data: { payeeId: payee.id, merchant: payee.name }
      });
      
      updatedCount++;
    }

    return NextResponse.json({ success: true, updatedCount }, { status: 200 });
  } catch (error) {
    console.error("Sync merchants error:", error);
    return NextResponse.json({ error: "Failed to sync merchants" }, { status: 500 });
  }
}
