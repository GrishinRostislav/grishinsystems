"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import ScheduledTransactionModal from '@/components/ScheduledTransactionModal';
import { formatCurrency, formatDate } from '@/utils/format';
import { Suspense } from 'react';

function PlanningContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSched, setEditingSched] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    // Process autos first
    await fetch('/cashFlow/api/scheduled/process', { method: 'POST' });
    
    // Then fetch
    const [schedRes, accRes, catRes] = await Promise.all([
      fetch('/cashFlow/api/scheduled'),
      fetch('/cashFlow/api/accounts'),
      fetch('/cashFlow/api/categories')
    ]);
    
    if (schedRes.ok) setScheduled(await schedRes.json());
    if (accRes.ok) setAccounts(await accRes.json());
    if (catRes.ok) setCategories(await catRes.json());
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData().then(() => {
      const createFrom = searchParams.get('createFrom');
      if (createFrom) {
        const params = new URLSearchParams(createFrom);
        setEditingSched({
          amount: params.get('amount') || '',
          merchant: params.get('merchant') || '',
          categoryId: params.get('categoryId') || '',
          accountId: params.get('accountId') || '',
          toAccountId: params.get('toAccountId') || '',
          type: params.get('type') || 'expense',
        });
        setIsModalOpen(true);
        // Clear param so it doesn't reopen on refresh
        router.replace('/planning');
      }
    });
  }, [searchParams, router]);

  const handleSave = async (data: any) => {
    const url = data.id ? `/cashFlow/api/scheduled/${data.id}` : '/cashFlow/api/scheduled';
    const method = data.id ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      await fetchData();
    } else {
      alert("Failed to save scheduled transaction");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scheduled transaction?")) return;
    const res = await fetch(`/cashFlow/api/scheduled/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchData();
    }
  };

  const handleApprove = async (id: string) => {
    const res = await fetch(`/cashFlow/api/scheduled/${id}/approve`, { method: 'POST' });
    if (res.ok) {
      await fetchData();
    } else {
      alert("Failed to approve transaction.");
    }
  };

  const handleSkip = async (id: string) => {
    const res = await fetch(`/cashFlow/api/scheduled/${id}/skip`, { method: 'POST' });
    if (res.ok) {
      await fetchData();
    } else {
      alert("Failed to skip transaction.");
    }
  };

  const now = new Date();
  
  const pending = scheduled.filter(s => {
    return !s.autoApprove && new Date(s.nextRunDate) <= now && s.isActive;
  });

  const active = scheduled.filter(s => {
    // If it's pending, don't show it in the regular list unless we want to
    return s.isActive && (!(!s.autoApprove && new Date(s.nextRunDate) <= now));
  });

  if (loading) {
    return <div className={styles.container}>Loading planning data...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Financial Planning</h1>
          <p className={styles.subtitle}>Schedule and manage your recurring bills and income.</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => { setEditingSched(null); setIsModalOpen(true); }}>
          + Add Scheduled Transaction
        </button>
      </div>

      {pending.length > 0 && (
        <div className={styles.pendingSection}>
          <h2 className={styles.pendingTitle}>Action Required: Pending Approvals</h2>
          <div className={styles.grid}>
            {pending.map(s => (
              <div key={s.id} className={styles.card} style={{ border: '2px solid #fcd34d' }}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.merchant}>{s.merchant || 'Scheduled'}</h3>
                    <div className={s.amount > 0 ? styles.amountIncome : styles.amount}>
                      {s.amount > 0 ? '+' : ''}{formatCurrency(s.amount)}
                    </div>
                  </div>
                  <span className={styles.badge} style={{ background: '#fef3c7', color: '#b45309' }}>
                    DUE: {formatDate(s.nextRunDate)}
                  </span>
                </div>
                <div className={styles.meta}>
                  From: {s.account?.name}
                  {(s.account?.isArchived || s.toAccount?.isArchived) && (
                    <span title="The linked account has been deleted. Please edit to select a new active account." style={{ cursor: 'help', marginLeft: '8px', color: '#dc2626', fontWeight: 'bold' }}>
                      ⚠️
                    </span>
                  )}
                  <br/>
                  Category: {s.category ? (
                    <span style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', display: 'inline-block', marginTop: '4px' }}>
                      {s.category.name}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>
                      {s.type === 'transfer' ? 'Transfer' : 'Uncategorized'}
                    </span>
                  )}
                  <br/>
                  Frequency: {s.frequency}
                </div>
                <div className={styles.actions}>
                  <button className={`${styles.btn} ${styles.btnApprove}`} onClick={() => handleApprove(s.id)}>Approve</button>
                  <button className={`${styles.btn} ${styles.btnSkip}`} onClick={() => handleSkip(s.id)}>Skip</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Active Scheduled Transactions</h2>
        {active.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No active scheduled transactions.</p>
        ) : (
          <div className={styles.grid}>
            {active.map(s => (
              <div key={s.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.merchant}>{s.merchant || 'Scheduled'}</h3>
                    <div className={s.amount > 0 ? styles.amountIncome : styles.amount}>
                      {s.amount > 0 ? '+' : ''}{formatCurrency(s.amount)}
                    </div>
                  </div>
                  <span className={styles.badge}>
                    NEXT: {formatDate(s.nextRunDate)}
                  </span>
                </div>
                <div className={styles.meta}>
                  From: {s.account?.name}
                  {(s.account?.isArchived || s.toAccount?.isArchived) && (
                    <span title="The linked account has been deleted. Please edit to select a new active account." style={{ cursor: 'help', marginLeft: '8px', color: '#dc2626', fontWeight: 'bold' }}>
                      ⚠️
                    </span>
                  )}
                  <br/>
                  Category: {s.category ? (
                    <span style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', display: 'inline-block', marginTop: '4px' }}>
                      {s.category.name}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>
                      {s.type === 'transfer' ? 'Transfer' : 'Uncategorized'}
                    </span>
                  )}
                  <br/>
                  Frequency: {s.frequency}
                  <br/>
                  Mode: {s.autoApprove ? 'Auto' : 'Manual'}
                </div>
                <div className={styles.actions}>
                  <button className={`${styles.btn} ${styles.btnEdit}`} onClick={() => { setEditingSched(s); setIsModalOpen(true); }}>Edit</button>
                  <button className={`${styles.btn} ${styles.btnDelete}`} onClick={() => handleDelete(s.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      <ScheduledTransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        transaction={editingSched}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}

export default function PlanningPage() {
  return (
    <Suspense fallback={<div>Loading planning data...</div>}>
      <PlanningContent />
    </Suspense>
  );
}

