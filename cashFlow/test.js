const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.scheduledTransaction.findFirst();
  if(!t) { console.log('No scheduled transactions'); return; }
  const a = await prisma.account.findFirst({ where: { id: { not: t.accountId } } });
  if(!a) { console.log('No other account'); return; }
  console.log('Trying to update', t.id, 'to account', a.id);
  try {
    await prisma.scheduledTransaction.update({
      where: { id: t.id },
      data: { accountId: a.id }
    });
    console.log('Success!');
  } catch(e) {
    console.error('Error:', e);
  }
}
main().finally(()=>prisma.$disconnect());
