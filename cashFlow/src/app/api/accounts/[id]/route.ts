import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHistoricalExchangeRates, getExchangeRates } from "@/lib/currency";

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

    let settings = await prisma.settings.findUnique({ where: { id: "global" } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: "global", homeCurrency: "CAD" } });
    }
    const homeCurrency = settings.homeCurrency;

    let loopStart = new Date(startDate);
    if (loopStart.getFullYear() < 2000) {
      if (transactions.length > 0) {
        loopStart = new Date(transactions[0].date);
        loopStart.setHours(0, 0, 0, 0);
      } else {
        loopStart = new Date();
        loopStart.setDate(loopStart.getDate() - 365);
      }
    }
    
    // Cap end date to today to avoid plotting future empty days unless explicitly requested
    const today = new Date();
    const loopEnd = endDate > today ? today : endDate;

    let historicalRates: Record<string, number> = {};
    if (account.currency !== homeCurrency) {
      historicalRates = await getHistoricalExchangeRates(account.currency, homeCurrency, loopStart, loopEnd);
    } else {
      // Rates are 1:1
      const curr = new Date(loopStart);
      while (curr <= loopEnd) {
        historicalRates[curr.toISOString().slice(0, 10)] = 1;
        curr.setDate(curr.getDate() + 1);
      }
    }

    const chartData = [];
    let income = 0;
    let expenses = 0;
    
    // Calculate total income and expenses across all transactions in range
    for (const txn of transactions) {
      if (txn.amount > 0) income += txn.amount;
      else expenses += Math.abs(txn.amount);
    }

    let txnIndex = 0;
    const currDate = new Date(loopStart);
    
    while (currDate <= loopEnd) {
      const dStr = currDate.toISOString().slice(0, 10);
      
      // Process transactions for this day
      let dayTransactions = [];
      while (txnIndex < transactions.length) {
        const txnDate = new Date(transactions[txnIndex].date);
        const tStr = txnDate.toISOString().slice(0, 10);
        
        if (tStr === dStr) {
          runningBalance += transactions[txnIndex].amount;
          dayTransactions.push(transactions[txnIndex]);
          txnIndex++;
        } else if (txnDate < currDate) {
          // Catch-up if any transactions slipped through
          runningBalance += transactions[txnIndex].amount;
          txnIndex++;
        } else {
          break; // Next transaction is in the future
        }
      }

      const rate = historicalRates[dStr] || 1;
      
      chartData.push({
        date: currDate.toLocaleDateString("en-US", { timeZone: "UTC" }),
        balance: runningBalance * rate,
        originalBalance: runningBalance,
        rate: rate,
        transactions: dayTransactions.map(t => ({ amount: t.amount, merchant: t.merchant }))
      });

      currDate.setDate(currDate.getDate() + 1);
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
