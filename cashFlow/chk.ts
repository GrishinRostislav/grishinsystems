import { PrismaClient } from '@prisma/client';
import { getExchangeRates, convertAmount } from './src/lib/currency';

const prisma = new PrismaClient();

async function main() {
  let settings = await prisma.settings.findUnique({ where: { id: "global" } });
  const homeCurrency = settings?.homeCurrency || "CAD";
  const rates = await getExchangeRates(homeCurrency);

  const accounts = await prisma.account.findMany({
    where: { includeInTotal: true, isArchived: false }
  });
  
  const allIncluded = await prisma.account.findMany({
    where: { includeInTotal: true }
  });

  const b1 = accounts.reduce((acc, account) => acc + convertAmount(account.balance, account.currency, homeCurrency, rates), 0);
  const b2 = allIncluded.reduce((acc, account) => acc + convertAmount(account.balance, account.currency, homeCurrency, rates), 0);

  console.log("With isArchived: false =>", b1);
  console.log("Without isArchived: false =>", b2);
  console.log("homeCurrency:", homeCurrency);
}
main();
