"use client";

import React, { useState, useEffect } from 'react';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionIds: string[], data: any) => Promise<void>;
  transactions: any[];
}

export default function BulkEditModal({ isOpen, onClose, onSave, transactions }: BulkEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    date: '',
    merchant: '',
    categoryId: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/cashFlow/api/categories")
        .then(res => res.json())
        .then(data => setCategories(data))
        .catch(console.error);

      if (transactions.length > 0) {
        setFormData({
          date: transactions[0].date ? new Date(transactions[0].date).toISOString().split('T')[0] : '',
          merchant: transactions[0].merchant || '',
          categoryId: transactions[0].categoryId || ''
        });
      }
    }
  }, [isOpen, transactions]);

  if (!isOpen || transactions.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const transactionIds = transactions.map(t => t.id);
    
    try {
      await onSave(transactionIds, formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        padding: '30px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-xl)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.5rem', color: 'var(--text-main)' }}>
          Bulk Edit Transactions
        </h2>
        <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
          Editing {transactions.length} items from {transactions[0].merchant || 'Unknown'}.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Merchant / Title</label>
            <input
              type="text"
              value={formData.merchant}
              onChange={e => setFormData({ ...formData, merchant: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
            <select
              value={formData.categoryId}
              onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                fontSize: '1rem'
              }}
            >
              <option value="">No Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: 600
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--sporty-teal)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600
              }}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Apply to All'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
