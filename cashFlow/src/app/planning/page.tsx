"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import ScheduledTransactionModal from '@/components/ScheduledTransactionModal';
import ConfirmPaymentModal from '@/components/ConfirmPaymentModal';
import { formatCurrency, formatDate } from '@/utils/format';
import { Suspense } from 'react';

function PlanningContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'payments' | 'calendar' | 'subscriptions'>('payments');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSched, setEditingSched] = useState<any | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmingSched, setConfirmingSched] = useState<any | null>(null);
  
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

  const handleConfirmPayment = async (data: any) => {
    if (!confirmingSched) return;
    const res = await fetch(`/cashFlow/api/scheduled/${confirmingSched.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      await fetchData();
      setIsConfirmModalOpen(false);
      setConfirmingSched(null);
    } else {
      alert("Failed to process payment.");
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
    return s.isActive && (!(!s.autoApprove && new Date(s.nextRunDate) <= now));
  });

  // Calendar Helpers
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Subscriptions filtering (recurring monthly/yearly items or auto-pay items)
  const subscriptions = scheduled.filter(s => 
    s.isActive && (s.frequency === 'MONTHLY' || s.frequency === 'YEARLY' || s.autoApprove)
  );

  const totalMonthlySubscriptions = subscriptions.reduce((acc, s) => {
    const amt = Math.abs(s.amount);
    if (s.frequency === 'YEARLY') return acc + amt / 12;
    if (s.frequency === 'WEEKLY') return acc + amt * 4.33;
    return acc + amt;
  }, 0);

  if (loading) {
    return <div className={styles.container}>Loading planning data...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Financial Planning</h1>
          <p className={styles.subtitle}>Schedule, calendarize, and track your recurring bills & subscriptions.</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => { setEditingSched(null); setIsModalOpen(true); }}>
          + Add Scheduled Transaction
        </button>
      </div>

      {/* Sub-Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            background: activeTab === 'payments' ? 'var(--unique-blue)' : 'var(--bg-secondary)',
            color: activeTab === 'payments' ? 'white' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          💳 Payments ({scheduled.length})
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            background: activeTab === 'calendar' ? 'var(--unique-blue)' : 'var(--bg-secondary)',
            color: activeTab === 'calendar' ? 'white' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📅 Calendar
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            background: activeTab === 'subscriptions' ? 'var(--unique-blue)' : 'var(--bg-secondary)',
            color: activeTab === 'subscriptions' ? 'white' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🔄 Subscriptions ({subscriptions.length})
        </button>
      </div>

      {activeTab === 'payments' && (
        <>
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
                      <br/>
                      Category: {s.category?.name || (s.type === 'transfer' ? 'Transfer' : 'Uncategorized')}
                      <br/>
                      Frequency: {s.frequency}
                    </div>
                    <div className={styles.actions}>
                      <button className={`${styles.btn} ${styles.btnApprove}`} onClick={() => { setConfirmingSched(s); setIsConfirmModalOpen(true); }}>Pay Now</button>
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
                      <br/>
                      Category: {s.category?.name || (s.type === 'transfer' ? 'Transfer' : 'Uncategorized')}
                      <br/>
                      Frequency: {s.frequency} • {s.autoApprove ? 'Auto-pay' : 'Manual'}
                    </div>
                    <div className={styles.actions}>
                      <button className={`${styles.btn} ${styles.btnApprove}`} onClick={() => { setConfirmingSched(s); setIsConfirmModalOpen(true); }}>Pay Now</button>
                      <button className={`${styles.btn} ${styles.btnEdit}`} onClick={() => { setEditingSched(s); setIsModalOpen(true); }}>Edit</button>
                      <button className={`${styles.btn} ${styles.btnDelete}`} onClick={() => handleDelete(s.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'calendar' && (
        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          {/* Calendar Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>
              {currentCalendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }}
              >
                ← Prev
              </button>
              <button 
                onClick={() => setCurrentCalendarDate(new Date())}
                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }}
              >
                Today
              </button>
              <button 
                onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }}
              >
                Next →
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.85rem' }}>
            <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ minHeight: '80px', background: 'transparent' }} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              
              const dayItems = scheduled.filter(s => {
                if (!s.nextRunDate) return false;
                const rDate = new Date(s.nextRunDate);
                return rDate.getFullYear() === year && rDate.getMonth() === month && rDate.getDate() === dayNum;
              });

              const isToday = now.getFullYear() === year && now.getMonth() === month && now.getDate() === dayNum;

              return (
                <div 
                  key={dayNum} 
                  style={{
                    minHeight: '80px',
                    padding: '8px',
                    borderRadius: '8px',
                    background: isToday ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-primary)',
                    border: isToday ? '2px solid var(--unique-blue)' : '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--unique-blue)' : 'var(--text-main)' }}>
                    {dayNum}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    {dayItems.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => { setEditingSched(item); setIsModalOpen(true); }}
                        style={{ 
                          fontSize: '0.72rem', 
                          padding: '2px 4px', 
                          borderRadius: '4px', 
                          background: item.amount < 0 ? 'rgba(225, 29, 72, 0.15)' : 'rgba(20, 184, 166, 0.15)',
                          color: item.amount < 0 ? '#e11d48' : 'var(--sporty-teal)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.merchant || 'Payment'}: {formatCurrency(item.amount)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Subscriptions Overhead Summary */}
          <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Recurring Subscriptions</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--unique-blue)', marginTop: '4px' }}>
                {formatCurrency(totalMonthlySubscriptions)} / month
              </div>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              💡 {subscriptions.length} active recurring service{subscriptions.length !== 1 ? 's' : ''} tracked
            </div>
          </div>

          {/* Subscriptions Grid */}
          <div className={styles.grid}>
            {subscriptions.map(s => {
              const rDate = new Date(s.nextRunDate);
              const daysLeft = Math.ceil((rDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div key={s.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3 className={styles.merchant}>{s.merchant || 'Subscription'}</h3>
                      <div className={styles.amount}>
                        {formatCurrency(Math.abs(s.amount))} / {s.frequency.toLowerCase()}
                      </div>
                    </div>
                    {s.autoApprove ? (
                      <span className={styles.badge} style={{ background: 'rgba(20, 184, 166, 0.15)', color: 'var(--sporty-teal)' }}>
                        ⚡ Auto-Pay
                      </span>
                    ) : (
                      <span className={styles.badge}>
                        Manual Approval
                      </span>
                    )}
                  </div>
                  <div className={styles.meta}>
                    Payment Method: {s.account?.name}
                    <br/>
                    Renews: {formatDate(s.nextRunDate)} ({daysLeft <= 0 ? 'Today' : `in ${daysLeft} days`})
                  </div>
                  <div className={styles.actions}>
                    <button className={`${styles.btn} ${styles.btnEdit}`} onClick={() => { setEditingSched(s); setIsModalOpen(true); }}>Manage</button>
                    <button className={`${styles.btn} ${styles.btnDelete}`} onClick={() => handleDelete(s.id)}>Cancel</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ScheduledTransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        transaction={editingSched}
        accounts={accounts}
        categories={categories}
      />
      <ConfirmPaymentModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmPayment}
        transaction={confirmingSched}
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

