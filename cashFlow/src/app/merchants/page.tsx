"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/merchants')
      .then(res => res.json())
      .then(data => {
        setMerchants(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--text-primary)' }}>Merchants / Payees</h1>
      </div>

      <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        {merchants.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No merchants found. Create a transaction and enter a merchant name to automatically create one.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {merchants.map(merchant => (
              <Link key={merchant.id} href={`/merchants/${merchant.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease', cursor: 'pointer', background: 'var(--bg-secondary)' }}
                     onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                     onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{merchant.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: '#e2e8f0', padding: '4px 8px', borderRadius: '12px' }}>
                    {merchant._count?.transactions || 0} entries
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
