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

  const amount = body.amount;
  const merchant = body.merchant;
  const paymentMethod = body.paymentMethod;
  const notes = body.notes;
  const accountId = body.accountId;
  const toAccountId = body.toAccountId;
  const categoryId = body.categoryId;
  const nextRunDate = body.nextRunDate;
  const frequency = body.frequency;
  const autoApprove = body.autoApprove;
  const isActive = body.isActive;
  const type = body.type;

  let finalAmount = amount !== undefined ? Math.abs(parseFloat(amount)) : undefined;
  if (finalAmount !== undefined && type === 'expense') {
    finalAmount = -finalAmount;
  }

  let finalPayeeId = null;
  let finalMerchantName = merchant;

  if (merchant && merchant.trim() !== '') {
    let payee = await prisma.merchant.findUnique({ where: { name: merchant.trim() } });
    if (!payee) {
      payee = await prisma.merchant.create({ data: { name: merchant.trim() } });
    }
    finalPayeeId = payee.id;
    finalMerchantName = payee.name;
  }

  try {
    const scheduled = await prisma.scheduledTransaction.update({
      where: { id: t.id },
      data: {
        amount: finalAmount,
        merchant: finalMerchantName,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : undefined,
        payeeId: finalPayeeId,
        notes,
        accountId,
        toAccountId: type === 'transfer' ? (toAccountId === '' ? null : toAccountId) : null,
        categoryId: type === 'transfer' ? null : (categoryId === '' ? null : categoryId),
        nextRunDate: nextRunDate ? new Date(nextRunDate) : undefined,
        frequency,
        autoApprove: autoApprove !== undefined ? Boolean(autoApprove) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        type: type !== undefined ? type : undefined,
      }
    });
    console.log('Success!', scheduled);
  } catch(e) {
    console.error('Error in Prisma:', e);
  }
}
main().finally(()=>prisma.$disconnect());
