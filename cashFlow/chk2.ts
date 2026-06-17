import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany();
  console.log(accounts.map(a => ({ id: a.id, name: a.name, includeInTotal: a.includeInTotal, isArchived: a.isArchived })));
}
main();
