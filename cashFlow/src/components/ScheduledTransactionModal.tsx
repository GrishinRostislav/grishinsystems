"use client";

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/format';

interface ScheduledTransaction {
  id?: string;
  amount: number;
  merchant: string;
  notes: string;
  accountId: string;
  categoryId: string;
  frequency: string;
  nextRunDate: string;
  autoApprove: boolean;
  isActive: boolean;
  paymentMethod: string;
  type: string;
  toAccountId: string;
}

interface ScheduledModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  transaction?: ScheduledTransaction | null;
  accounts: any[];
  categories: any[];
}

export default function ScheduledTransactionModal({ isOpen, onClose, onSave, transaction, accounts, categories }: ScheduledModalProps) {
  const [formData, setFormData] = useState<ScheduledTransaction>({
    amount: 0,
    merchant: '',
    notes: '',
    accountId: '',
    categoryId: '',
    paymentMethod: '',
    frequency: 'MONTHLY',
    nextRunDate: new Date().toISOString().split('T')[0],
    autoApprove: false,
    isActive: true,
    type: 'expense',
    toAccountId: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [merchantsList, setMerchantsList] = useState<any[]>([]);
  const [paymentMethodsList, setPaymentMethodsList] = useState<string[]>([]);

  const [type, setType] = useState('expense');

  useEffect(() => {
    Promise.all([fetch("/api/merchants"), fetch("/api/payment-methods")]).then(async ([mRes, pmRes]) => {
      if (mRes.ok) setMerchantsList(await mRes.json());
      if (pmRes.ok) setPaymentMethodsList(await pmRes.json());
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type || (transaction.toAccountId ? 'transfer' : (transaction.amount < 0 ? 'expense' : 'income')));
      setFormData({
        ...transaction,
        amount: Math.abs(transaction.amount),
        nextRunDate: transaction.nextRunDate ? new Date(transaction.nextRunDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMethod: transaction.paymentMethod || '',
        type: transaction.type || 'expense',
        toAccountId: transaction.toAccountId || '',
        autoApprove: transaction.autoApprove ?? false,
        isActive: transaction.isActive ?? true,
        frequency: transaction.frequency || 'MONTHLY',
        notes: transaction.notes || ''
      });
    } else {
      setType('expense');
      setFormData({
        amount: 0,
        merchant: '',
        notes: '',
        accountId: accounts[0]?.id || '',
        toAccountId: '',
        categoryId: '',
        frequency: 'MONTHLY',
        nextRunDate: new Date().toISOString().split('T')[0],
        autoApprove: false,
        isActive: true,
        paymentMethod: '',
        type: 'expense'
      });
    }
  }, [transaction, accounts, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave({ ...formData, type });
    setLoading(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{transaction ? 'Edit Scheduled Transaction' : 'New Scheduled Transaction'}</h2>
          <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose}>&times;</button>
        </div>
        <div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button type="button" onClick={() => setType("expense")} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: type === 'expense' ? '#ffe4e6' : 'white', color: type === 'expense' ? '#e11d48' : 'var(--text-muted)', fontWeight: type === 'expense' ? 600 : 400 }}>Expense</button>
              <button type="button" onClick={() => setType("income")} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: type === 'income' ? '#ccfbf1' : 'white', color: type === 'income' ? 'var(--sporty-teal)' : 'var(--text-muted)', fontWeight: type === 'income' ? 600 : 400 }}>Income</button>
              <button type="button" onClick={() => setType("transfer")} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: type === 'transfer' ? '#f1f5f9' : 'white', color: type === 'transfer' ? 'var(--silent-dark-blue)' : 'var(--text-muted)', fontWeight: type === 'transfer' ? 600 : 400 }}>Transfer</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Amount</label>
              <input 
                type="number" 
                step="0.01" 
                value={formData.amount || ''} 
                onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Merchant / Payee</label>
              <input 
                type="text" 
                list="scheduled-merchants-list"
                value={formData.merchant} 
                onChange={e => setFormData({...formData, merchant: e.target.value})} 
                required 
                placeholder="e.g. Costco, Telus"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
              <datalist id="scheduled-merchants-list">
                {merchantsList.map(m => (
                  <option key={m.id} value={m.name} />
                ))}
              </datalist>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>{type === 'transfer' ? 'From Account' : 'Account'}</label>
              <select 
                value={formData.accountId} 
                onChange={e => setFormData({...formData, accountId: e.target.value})}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              >
                <option value="" disabled>Select Account</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>)}
              </select>
            </div>

            {type === 'transfer' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>To Account</label>
                <select 
                  value={formData.toAccountId || ''} 
                  onChange={e => setFormData({...formData, toAccountId: e.target.value})}
                  required={type === 'transfer'}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                >
                  <option value="" disabled>Select Account</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>)}
                </select>
              </div>
            )}

            {type !== 'transfer' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Category</label>
                <select 
                  value={formData.categoryId} 
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                >
                  <option value="">Uncategorized</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Payment Method</label>
              <input 
                type="text" 
                list="scheduled-payment-methods-list" 
                value={formData.paymentMethod} 
                onChange={e => setFormData({...formData, paymentMethod: e.target.value})} 
                placeholder="e.g. Credit Card, Cash" 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
              />
              <datalist id="scheduled-payment-methods-list">
                {paymentMethodsList.map((pm, idx) => (
                  <option key={idx} value={pm} />
                ))}
              </datalist>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Frequency</label>
                <select 
                  value={formData.frequency} 
                  onChange={e => setFormData({...formData, frequency: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Next Run Date</label>
                <input 
                  type="date" 
                  value={formData.nextRunDate} 
                  onChange={e => setFormData({...formData, nextRunDate: e.target.value})} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Notes</label>
              <input 
                type="text" 
                value={formData.notes || ''} 
                onChange={e => setFormData({...formData, notes: e.target.value})} 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="checkbox" 
                id="autoApprove"
                checked={formData.autoApprove} 
                onChange={e => setFormData({...formData, autoApprove: e.target.checked})} 
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="autoApprove" style={{ margin: 0 }}>Auto-Approve Transaction</label>
            </div>
            <small style={{ display: 'block', marginBottom: '16px', color: '#64748b' }}>
              If checked, this will automatically create the transaction. If unchecked, it will prompt you to manually approve it.
            </small>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button type="button" style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }} onClick={onClose}>Cancel</button>
              <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--unique-blue)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
