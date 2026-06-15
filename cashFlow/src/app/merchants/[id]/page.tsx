"use client";

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/utils/format';
import GlobalDateFilter from '@/components/GlobalDateFilter';
import styles from '../page.module.css';

export default function MerchantDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleDatesChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

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

  return (
    <div className={styles.container}>
      <Link href="/merchants" className={styles.backLink}>
        &larr; Back to Merchants
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>{merchant?.name || 'Merchant Details'}</h1>
        <GlobalDateFilter onDatesChange={handleDatesChange} />
      </div>

      {loading && !merchant ? (
        <div className={styles.emptyState}>Loading...</div>
      ) : !merchant ? (
        <div className={styles.emptyState}>Merchant not found</div>
      ) : (
        <>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: '8px 0 0 0' }}>Transaction History</h2>
          
          {merchant.transactions && merchant.transactions.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Category</th>
                      <th>Account</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchant.transactions.map((tx: any) => (
                      <tr key={tx.id}>
                        <td>{formatDate(tx.date)}</td>
                        <td style={{ color: tx.amount < 0 ? '#e11d48' : 'var(--sporty-teal)', fontWeight: 600 }}>
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </td>
                        <td>
                          {tx.category ? <span style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>{tx.category.name}</span> : <span style={{ color: 'var(--text-muted)' }}>Uncategorized</span>}
                        </td>
                        <td>{tx.account?.name}</td>
                        <td>{tx.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ background: 'var(--bg-secondary)', fontWeight: 600 }}>
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'right', padding: '16px', color: 'var(--text-muted)' }}>Total for Period:</td>
                      <td style={{ padding: '16px', color: totalAmount >= 0 ? 'var(--sporty-teal)' : '#e11d48', fontWeight: 600 }}>
                        {totalAmount >= 0 ? "+" : ""}{formatCurrency(totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile Card Feed View */}
              <div className={styles.mobileListContainer}>
                {merchant.transactions.map((tx: any) => {
                  const isIncome = tx.amount >= 0;
                  return (
                    <div key={tx.id} className={styles.mobileCard}>
                      <div className={styles.mobileLeft}>
                        <div className={styles.mobileNotes}>{tx.notes || "Transaction"}</div>
                        <div className={styles.mobileMeta}>{formatDate(tx.date)}</div>
                        {tx.category ? (
                          <div className={styles.mobileCategoryBadge}>{tx.category.name}</div>
                        ) : (
                          <div className={styles.mobileCategoryBadge}>Uncategorized</div>
                        )}
                      </div>
                      <div className={styles.mobileRight}>
                        <div className={isIncome ? styles.mobileAmountIncome : styles.mobileAmountExpense}>
                          {isIncome ? "+" : ""}{formatCurrency(tx.amount)}
                        </div>
                        <div className={styles.mobileAccount}>
                          {tx.account?.name || "Unknown"}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Mobile Period Total */}
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total for Period:</span>
                  <span style={{ color: totalAmount >= 0 ? 'var(--sporty-teal)' : '#e11d48', fontSize: '15px' }}>
                    {totalAmount >= 0 ? "+" : ""}{formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>No transactions found for this merchant.</div>
          )}
        </>
      )}
    </div>
  );
}
