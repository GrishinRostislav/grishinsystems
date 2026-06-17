import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const budgets = await prisma.budget.findMany({ include: { categories: true } });
  console.log("BUDGETS:", JSON.stringify(budgets, null, 2));
  
  const sched = await prisma.scheduledTransaction.findMany();
  console.log("SCHEDULED:", JSON.stringify(sched, null, 2));
}

main().finally(() => prisma.$disconnect());
