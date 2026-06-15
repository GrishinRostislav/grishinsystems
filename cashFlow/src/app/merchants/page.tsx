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

  useEffect(() => {
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
  }, []);

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Merchants / Payees</h1>
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
    </div>
  );
}
