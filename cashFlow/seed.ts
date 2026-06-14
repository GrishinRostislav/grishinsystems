import "dotenv/config";
import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Seeding database...");

  // 1. Create Account
  const account = await prisma.account.create({
    data: {
      name: "TD Checking",
      type: "checking",
      balance: 5000,
      currency: "CAD",
    },
  });
  console.log("Created Account:", account.name);

  // 2. Create Categories
  const catIncome = await prisma.category.create({ data: { name: "Income" } });
  const catSalary = await prisma.category.create({ data: { name: "Salary", parentId: catIncome.id } });
  
  const catFood = await prisma.category.create({ data: { name: "Food & Dining" } });
  const catGroceries = await prisma.category.create({ data: { name: "Groceries", parentId: catFood.id } });
  const catRestaurants = await prisma.category.create({ data: { name: "Restaurants", parentId: catFood.id } });

  const catAuto = await prisma.category.create({ data: { name: "Auto & Transport" } });
  const catGas = await prisma.category.create({ data: { name: "Gas", parentId: catAuto.id } });
  
  const catEntertainment = await prisma.category.create({ data: { name: "Entertainment" } });

  console.log("Created Categories");

  // 3. Create Transactions
  const now = new Date();
  
  const transactionsData = [
    { amount: 3500.00, merchant: "Company Corp", paymentMethod: "Direct Deposit", notes: "June Salary", categoryId: catSalary.id, daysAgo: 10 },
    { amount: -150.25, merchant: "Walmart", paymentMethod: "Debit Card", notes: "Weekly Groceries", categoryId: catGroceries.id, daysAgo: 9 },
    { amount: -45.00, merchant: "Shell", paymentMethod: "Credit Card", notes: "Gas", categoryId: catGas.id, daysAgo: 8 },
    { amount: -85.50, merchant: "The Keg Steakhouse", paymentMethod: "Credit Card", notes: "Dinner with friends", categoryId: catRestaurants.id, daysAgo: 7 },
    { amount: -12.99, merchant: "Netflix", paymentMethod: "Credit Card", notes: "Monthly Subscription", categoryId: catEntertainment.id, daysAgo: 6 },
    { amount: -210.00, merchant: "Costco", paymentMethod: "Debit Card", notes: "Bulk Groceries", categoryId: catGroceries.id, daysAgo: 5 },
    { amount: -55.00, merchant: "Petro Canada", paymentMethod: "Credit Card", notes: "Gas", categoryId: catGas.id, daysAgo: 4 },
    { amount: -32.50, merchant: "Starbucks", paymentMethod: "Debit Card", notes: "Coffee + Snacks", categoryId: catRestaurants.id, daysAgo: 4 },
    { amount: -15.99, merchant: "Spotify", paymentMethod: "Credit Card", notes: "Music", categoryId: catEntertainment.id, daysAgo: 3 },
    { amount: -180.00, merchant: "Loblaws", paymentMethod: "Debit Card", notes: "Groceries", categoryId: catGroceries.id, daysAgo: 2 },
    { amount: -65.00, merchant: "Cineplex", paymentMethod: "Credit Card", notes: "Movies", categoryId: catEntertainment.id, daysAgo: 1 },
    { amount: -40.00, merchant: "Uber", paymentMethod: "Credit Card", notes: "Ride to downtown", categoryId: catAuto.id, daysAgo: 0 },
  ];

  let currentBalance = account.balance;

  for (const t of transactionsData) {
    const d = new Date(now);
    d.setDate(d.getDate() - t.daysAgo);
    
    await prisma.transaction.create({
      data: {
        amount: t.amount,
        merchant: t.merchant,
        paymentMethod: t.paymentMethod,
        notes: t.notes,
        date: d,
        accountId: account.id,
        categoryId: t.categoryId,
      }
    });

    currentBalance += t.amount;
  }

  // Update final balance
  await prisma.account.update({
    where: { id: account.id },
    data: { balance: currentBalance }
  });

  console.log("Seeded transactions. Final balance:", currentBalance);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
