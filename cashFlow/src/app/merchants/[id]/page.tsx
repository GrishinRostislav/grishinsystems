"use client";

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/utils/format';
import GlobalDateFilter from '@/components/GlobalDateFilter';
import TransactionModal from '@/components/TransactionModal';
import TransactionList from '@/components/TransactionList';
import styles from '../page.module.css';

export default function MerchantDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);

  const openTxnModal = (txn: any) => {
    setSelectedTxn(txn);
    setIsTxnModalOpen(true);
  };

  const handleTxnSave = () => {
    setIsTxnModalOpen(false);
    setSelectedTxn(null);
    // Re-fetch merchant data
    if (id && startDate && endDate) {
      fetch(`/cashFlow/api/merchants/${id}?startDate=${startDate}&endDate=${endDate}`)
        .then(res => res.json())
        .then(data => setMerchant(data))
        .catch(console.error);
    }
  };
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleDatesChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id && startDate && endDate) {
      setLoading(true);
      fetch(`/cashFlow/api/merchants/${id}?startDate=${startDate}&endDate=${endDate}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => {
          setMerchant(data);
          setNewName(data.name);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id, startDate, endDate]);

  const totalAmount = merchant?.transactions 
    ? merchant.transactions.reduce((acc: number, tx: any) => acc + tx.amount, 0)
    : 0;

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === merchant.name) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/cashFlow/api/merchants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        const updated = await res.json();
        setMerchant((prev: any) => ({ ...prev, name: updated.name }));
        setIsRenameModalOpen(false);
      } else {
        alert("Failed to rename merchant");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to rename merchant");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this merchant? This will NOT delete the associated transactions, but they will be marked as uncategorized/no merchant.")) return;
    try {
      const res = await fetch(`/cashFlow/api/merchants/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.push("/merchants");
      } else {
        alert("Failed to delete merchant");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete merchant");
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/merchants" className={styles.backLink}>
        &larr; Back to Merchants
      </Link>
      
      <div className={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className={styles.title} style={{ margin: 0 }}>{merchant?.name || 'Merchant Details'}</h1>
            {merchant && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setNewName(merchant.name); setIsRenameModalOpen(true); }} style={{ padding: '4px 12px', borderRadius: '6px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.85rem' }}>Rename</button>
                <button onClick={handleDelete} style={{ padding: '4px 12px', borderRadius: '6px', background: '#ffe4e6', color: '#e11d48', border: '1px solid #fda4af', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
              </div>
            )}
          </div>
        </div>
        <GlobalDateFilter onDatesChange={handleDatesChange} />
      </div>

      {isRenameModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsRenameModalOpen(false)}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '24px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Rename Merchant</h2>
            <form onSubmit={handleRename}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Name</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  required 
                  autoFocus
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }} onClick={() => setIsRenameModalOpen(false)}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--unique-blue)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && !merchant ? (
        <div className={styles.emptyState}>Loading...</div>
      ) : !merchant ? (
        <div className={styles.emptyState}>Merchant not found</div>
      ) : (
        <>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: '8px 0 0 0' }}>Transaction History</h2>
          
          <TransactionList
            transactions={merchant.transactions}
            onTransactionClick={(tx) => openTxnModal(tx)}
            emptyMessage="No transactions found for this merchant."
            totalLabel="Total for Period:"
          />
        </>
      )}
      <TransactionModal
        isOpen={isTxnModalOpen}
        onClose={() => { setIsTxnModalOpen(false); setSelectedTxn(null); }}
        transaction={selectedTxn}
        onSave={handleTxnSave}
      />
    </div>
  );
}
