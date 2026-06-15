import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const account = await prisma.account.findUnique({
      where: { id }
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    let startDate = new Date(0); // default all time
    let endDate = new Date();    // default now
    
    if (startDateParam) startDate = new Date(startDateParam);
    if (endDateParam) {
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: id,
        date: { 
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        category: true,
      },
      orderBy: { date: "asc" } // chronological order for balance calculation
    });

    // Calculate historical balance points for the chart
    // To do this perfectly, we need the initial balance before startDate.
    // Account current balance = sum of ALL transactions + initial seeded balance.
    // But since the user seeds a specific balance, and transactions modify it...
    // Let's compute the total delta of all transactions before startDate, 
    // and subtract it from the current balance (or calculate forward).
    // The easiest way to get the starting balance of the period is:
    // (Current Balance) - (Sum of transactions AFTER startDate)
    
    // Fetch all transactions after startDate to determine starting balance of this period
    const futureTransactions = await prisma.transaction.findMany({
      where: {
        accountId: id,
        date: { gte: startDate }
      }
    });
    
    const futureDelta = futureTransactions.reduce((acc, txn) => acc + txn.amount, 0);
    let runningBalance = account.balance - futureDelta;

    const chartData = [];
    let income = 0;
    let expenses = 0;

    for (const txn of transactions) {
      runningBalance += txn.amount;
      if (txn.amount > 0) income += txn.amount;
      else expenses += Math.abs(txn.amount);

      chartData.push({
        date: new Date(txn.date).toLocaleDateString("en-US", { timeZone: "UTC" }),
        balance: runningBalance,
        amount: txn.amount,
        merchant: txn.merchant
      });
    }

    // reverse for the table view
    const tableTransactions = [...transactions].reverse();

    return NextResponse.json({
      account,
      periodIncome: income,
      periodExpenses: expenses,
      chartData,
      transactions: tableTransactions
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch account details" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { name, balance, currency, includeInTotal } = body;

    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updates: any = {};
    if (name) updates.name = name;
    if (currency) updates.currency = currency;
    if (includeInTotal !== undefined) updates.includeInTotal = includeInTotal;

    const newBalance = parseFloat(balance);
    const delta = newBalance - account.balance;
    if (Math.abs(delta) > 0.001) {
      // Create a correction transaction
      await prisma.transaction.create({
        data: {
          amount: delta,
          date: new Date(),
          merchant: "Balance Correction",
          paymentMethod: "Adjustment",
          accountId: id,
          categoryId: null
        }
      });
      updates.balance = newBalance;
    }

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: updates
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: { isArchived: true }
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    
    if (body.action === 'restore') {
      const updatedAccount = await prisma.account.update({
        where: { id },
        data: { isArchived: false }
      });
      return NextResponse.json(updatedAccount);
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
