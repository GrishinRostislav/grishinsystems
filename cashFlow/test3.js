const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.scheduledTransaction.findFirst();
  if(!t) return;
  const a = await prisma.account.findFirst({ where: { id: { not: t.accountId } } });
  if(!a) return;

  const body = {
    amount: Math.abs(t.amount),
    merchant: t.merchant,
    paymentMethod: t.paymentMethod,
    notes: t.notes,
    accountId: a.id,
    toAccountId: t.toAccountId || '',
    categoryId: t.categoryId || '',
    nextRunDate: t.nextRunDate.toISOString().split('T')[0],
    frequency: t.frequency,
    autoApprove: t.autoApprove,
    isActive: t.isActive,
    type: t.type
  };

  const res = await fetch('http://localhost:3001/cashFlow/api/scheduled/' + t.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  console.log('Status:', res.status, text);
}
main().finally(()=>prisma.$disconnect());
