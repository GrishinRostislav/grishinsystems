const Database = require("better-sqlite3");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const db = new Database("C:/Users/Ross/Documents/Projects/cashFlow/prisma/dev.db");

async function main() {
  console.log("Reading Accounts from SQLite...");
  const accounts = db.prepare("SELECT * FROM Account").all();
  for (const acc of accounts) {
    await prisma.account.create({ data: {
      id: acc.id, name: acc.name, type: acc.type, balance: acc.balance,
      currency: acc.currency, includeInTotal: acc.includeInTotal === 1,
      isArchived: acc.isArchived === 1,
      createdAt: new Date(acc.createdAt), updatedAt: new Date(acc.updatedAt)
    }});
  }
  console.log("Accounts transferred:", accounts.length);

  console.log("Reading Categories from SQLite...");
  const categories = db.prepare("SELECT * FROM Category").all();
  for (const cat of categories) {
    await prisma.category.create({ data: {
      id: cat.id, name: cat.name, type: cat.type, color: cat.color, icon: cat.icon,
      createdAt: new Date(cat.createdAt), updatedAt: new Date(cat.updatedAt)
    }});
  }
  console.log("Categories transferred:", categories.length);

  console.log("Reading Merchants from SQLite...");
  const merchants = db.prepare("SELECT * FROM Merchant").all();
  for (const m of merchants) {
    await prisma.merchant.create({ data: {
      id: m.id, name: m.name, defaultCategoryId: m.defaultCategoryId,
      createdAt: new Date(m.createdAt), updatedAt: new Date(m.updatedAt)
    }});
  }
  console.log("Merchants transferred:", merchants.length);

  console.log("Reading Transactions from SQLite...");
  const txs = db.prepare("SELECT * FROM \"Transaction\"").all();
  for (const tx of txs) {
    await prisma.transaction.create({ data: {
      id: tx.id, amount: tx.amount, date: new Date(tx.date), merchant: tx.merchant,
      paymentMethod: tx.paymentMethod, notes: tx.notes, accountId: tx.accountId,
      categoryId: tx.categoryId, payeeId: tx.payeeId,
      createdAt: new Date(tx.createdAt), updatedAt: new Date(tx.updatedAt)
    }});
  }
  console.log("Transactions transferred:", txs.length);

  console.log("Reading ScheduledTransactions from SQLite...");
  const scheds = db.prepare("SELECT * FROM ScheduledTransaction").all();
  for (const s of scheds) {
    await prisma.scheduledTransaction.create({ data: {
      id: s.id, amount: s.amount, merchant: s.merchant, paymentMethod: s.paymentMethod,
      notes: s.notes, frequency: s.frequency, nextRunDate: new Date(s.nextRunDate),
      autoApprove: s.autoApprove === 1, isActive: s.isActive === 1, type: s.type,
      accountId: s.accountId, toAccountId: s.toAccountId, categoryId: s.categoryId,
      payeeId: s.payeeId, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt)
    }});
  }
  console.log("Scheduled transferred:", scheds.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());

