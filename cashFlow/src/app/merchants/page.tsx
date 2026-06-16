"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

function getMerchantColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "linear-gradient(135deg, #f87171, #ef4444)", // red
    "linear-gradient(135deg, #fb923c, #f97316)", // orange
    "linear-gradient(135deg, #fbbf24, #f59e0b)", // amber
    "linear-gradient(135deg, #34d399, #10b981)", // emerald
    "linear-gradient(135deg, #2dd4bf, #14b8a6)", // teal
    "linear-gradient(135deg, #60a5fa, #3b82f6)", // blue
    "linear-gradient(135deg, #818cf8, #6366f1)", // indigo
    "linear-gradient(135deg, #a78bfa, #8b5cf6)", // violet
    "linear-gradient(135deg, #f472b6, #ec4899)", // pink
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMerchantName, setNewMerchantName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchMerchants = () => {
    fetch('/cashFlow/api/merchants')
      .then(res => res.json())
      .then(data => {
        setMerchants(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchantName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/cashFlow/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMerchantName })
      });
      if (res.ok) {
        setNewMerchantName("");
        setIsCreateModalOpen(false);
        fetchMerchants();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to create merchant");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create merchant");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Merchants / Payees</h1>
        <button 
          className={styles.createButton} 
          onClick={() => setIsCreateModalOpen(true)}
          style={{ padding: '8px 16px', background: 'var(--unique-blue)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
        >
          + New Merchant
        </button>
      </div>

      {merchants.length === 0 ? (
        <div className={styles.emptyState}>
          No merchants found. Create a transaction and enter a merchant name to automatically create one.
        </div>
      ) : (
        <div className={styles.merchantsGrid}>
          {merchants.map(merchant => (
            <Link key={merchant.id} href={`/merchants/${merchant.id}`} style={{ textDecoration: 'none' }}>
              <div className={styles.merchantCard}>
                <div className={styles.merchantLeft}>
                  <div className={styles.merchantAvatar} style={{ background: getMerchantColor(merchant.name) }}>
                    {merchant.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className={styles.merchantName}>{merchant.name}</h3>
                </div>
                <div className={styles.entriesBadge}>
                  {merchant._count?.transactions || 0} entries
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsCreateModalOpen(false)}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '24px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>New Merchant</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Name</label>
                <input 
                  type="text" 
                  value={newMerchantName} 
                  onChange={e => setNewMerchantName(e.target.value)} 
                  required 
                  autoFocus
                  placeholder="e.g. Costco, Amazon"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }} onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--unique-blue)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
