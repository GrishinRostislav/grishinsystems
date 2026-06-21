import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toTitleCase } from "@/utils/format";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transactions, accountId } = body;
    
    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Process transactions sequentially to safely update balance
    // In a real app with high concurrency, use a transaction block (prisma.$transaction)
    let totalAmount = 0;
    const createdTransactions = [];

    for (const txn of transactions) {
      const parsedAmount = parseFloat(txn.amount);
      totalAmount += parsedAmount;
      
      let finalPayeeId = null;
      let finalMerchantName = txn.merchant;

      if (txn.merchant && txn.merchant.trim() !== '') {
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
        finalPayeeId = payee.id;
        finalMerchantName = payee.name;
      }

      const newTxn = await prisma.transaction.create({
        data: {
          amount: parsedAmount,
          date: new Date(txn.date),
          merchant: finalMerchantName || null,
          payeeId: finalPayeeId,
          paymentMethod: txn.paymentMethod || null,
          notes: txn.notes || null,
          accountId,
          categoryId: txn.categoryId || null,
        },
      });
      createdTransactions.push(newTxn);

      // Save or update ProductMapping if rawName is provided (scanned receipt items)
      if (txn.rawName) {
        try {
          const existingByRaw = await prisma.productMapping.findUnique({
            where: { rawName: txn.rawName }
          });

          const existingByCode = txn.code ? await prisma.productMapping.findUnique({
            where: { code: txn.code }
          }) : null;

          if (existingByRaw) {
            await prisma.productMapping.update({
              where: { id: existingByRaw.id },
              data: {
                friendlyName: txn.friendlyName || txn.notes || txn.rawName,
                categoryId: txn.categoryId || null,
                code: txn.code || existingByRaw.code || null,
              }
            });
          } else if (existingByCode) {
            await prisma.productMapping.update({
              where: { id: existingByCode.id },
              data: {
                friendlyName: txn.friendlyName || txn.notes || txn.rawName,
                categoryId: txn.categoryId || null,
                rawName: txn.rawName,
              }
            });
          } else {
            await prisma.productMapping.create({
              data: {
                rawName: txn.rawName,
                code: txn.code || null,
                friendlyName: txn.friendlyName || txn.notes || txn.rawName,
                categoryId: txn.categoryId || null,
              }
            });
          }
        } catch (mapErr) {
          console.error("Failed to save product mapping:", mapErr);
        }
      }
    }

    if (totalAmount !== 0) {
      await prisma.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: totalAmount,
          },
        },
      });
    }

    return NextResponse.json({ success: true, count: createdTransactions.length }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to import transactions" }, { status: 500 });
  }
}
