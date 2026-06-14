import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up old data...");
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();

  console.log("Creating accounts...");
  const checking = await prisma.account.create({
    data: { name: "TD Checking", type: "checking", balance: 0, currency: "CAD" }
  });
  
  const creditCard = await prisma.account.create({
    data: { name: "CIBC Visa", type: "credit", balance: 0, currency: "CAD" }
  });

  const savings = await prisma.account.create({
    data: { name: "High Interest Savings", type: "savings", balance: 0, currency: "CAD" }
  });

  console.log("Creating categories...");
  const catIncome = await prisma.category.create({ data: { name: "Income" } });
  const catHousing = await prisma.category.create({ data: { name: "Housing" } });
  const catFood = await prisma.category.create({ data: { name: "Food & Dining" } });
  const catTransport = await prisma.category.create({ data: { name: "Transportation" } });
  const catEntertainment = await prisma.category.create({ data: { name: "Entertainment" } });
  const catUtilities = await prisma.category.create({ data: { name: "Utilities" } });
  const catShopping = await prisma.category.create({ data: { name: "Shopping" } });

  console.log("Generating transactions from Jan 2026 to Jun 2026...");
  
  const startDate = new Date("2026-01-01T12:00:00.000Z");
  const endDate = new Date("2026-06-13T12:00:00.000Z");

  let currentDate = new Date(startDate);
  
  const transactions = [];

  while (currentDate <= endDate) {
    const day = currentDate.getDate();
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

    // Bi-weekly Salary (1st and 15th)
    if (day === 1 || day === 15) {
      transactions.push({
        amount: 2500.00,
        date: new Date(currentDate),
        merchant: "Employer Inc",
        paymentMethod: "Direct Deposit",
        notes: "Salary",
        accountId: checking.id,
        categoryId: catIncome.id,
      });
    }

    // Rent (1st of month)
    if (day === 1) {
      transactions.push({
        amount: -1800.00,
        date: new Date(currentDate),
        merchant: "Landlord Management",
        paymentMethod: "E-Transfer",
        notes: "Monthly Rent",
        accountId: checking.id,
        categoryId: catHousing.id,
      });
    }

    // Utilities (10th of month)
    if (day === 10) {
      transactions.push({
        amount: -150.00,
        date: new Date(currentDate),
        merchant: "Hydro Provider",
        paymentMethod: "Auto-Pay",
        notes: "Electricity & Water",
        accountId: checking.id,
        categoryId: catUtilities.id,
      });
      transactions.push({
        amount: -85.00,
        date: new Date(currentDate),
        merchant: "Rogers Internet",
        paymentMethod: "Credit Card",
        notes: "Internet Bill",
        accountId: creditCard.id,
        categoryId: catUtilities.id,
      });
    }

    // Random Groceries (every 3-4 days)
    if (Math.random() > 0.7) {
      transactions.push({
        amount: -(Math.random() * 80 + 40), // 40 to 120
        date: new Date(currentDate),
        merchant: ["Loblaws", "Metro", "Walmart", "No Frills"][Math.floor(Math.random() * 4)],
        paymentMethod: "Credit Card",
        notes: "Groceries",
        accountId: creditCard.id,
        categoryId: catFood.id,
      });
    }

    // Random Dining Out (more likely on weekends)
    if ((isWeekend && Math.random() > 0.4) || (!isWeekend && Math.random() > 0.85)) {
      transactions.push({
        amount: -(Math.random() * 40 + 15), // 15 to 55
        date: new Date(currentDate),
        merchant: ["Starbucks", "Tim Hortons", "Local Cafe", "Pizza Pizza", "Sushi Place"][Math.floor(Math.random() * 5)],
        paymentMethod: "Credit Card",
        notes: "Dining out",
        accountId: creditCard.id,
        categoryId: catFood.id,
      });
    }

    // Gas / Transit (every 5-7 days)
    if (Math.random() > 0.8) {
      transactions.push({
        amount: -(Math.random() * 30 + 40), // 40 to 70
        date: new Date(currentDate),
        merchant: ["Shell", "Petro Canada", "Esso", "TTC Transit"][Math.floor(Math.random() * 4)],
        paymentMethod: "Credit Card",
        notes: "Commuting",
        accountId: creditCard.id,
        categoryId: catTransport.id,
      });
    }

    // Entertainment & Shopping
    if (Math.random() > 0.85) {
      transactions.push({
        amount: -(Math.random() * 100 + 20), // 20 to 120
        date: new Date(currentDate),
        merchant: ["Amazon", "Cineplex", "Best Buy", "Steam Games", "Zara"][Math.floor(Math.random() * 5)],
        paymentMethod: "Credit Card",
        notes: "Leisure",
        accountId: creditCard.id,
        categoryId: Math.random() > 0.5 ? catEntertainment.id : catShopping.id,
      });
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Insert all transactions
  console.log(`Inserting ${transactions.length} transactions...`);
  
  // We can't use createMany in SQLite with SQLite provider easily without checking version, but we can just loop create or use transaction
  await prisma.$transaction(
    transactions.map(txn => prisma.transaction.create({ data: txn }))
  );

  // Recalculate balances
  console.log("Updating account balances...");
  let chkBal = 0;
  let ccBal = 0;
  let savBal = 5000; // start with some savings

  for (const t of transactions) {
    if (t.accountId === checking.id) chkBal += t.amount;
    if (t.accountId === creditCard.id) ccBal += t.amount;
    if (t.accountId === savings.id) savBal += t.amount;
  }

  await prisma.account.update({ where: { id: checking.id }, data: { balance: chkBal } });
  await prisma.account.update({ where: { id: creditCard.id }, data: { balance: ccBal } });
  await prisma.account.update({ where: { id: savings.id }, data: { balance: savBal } });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
