"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/utils/format';
import GlobalDateFilter from '@/components/GlobalDateFilter';

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
      fetch(`/api/merchants/${id}?startDate=${startDate}&endDate=${endDate}`)
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
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Link href="/merchants" style={{ color: 'var(--unique-blue)', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
        &larr; Back to Merchants
      </Link>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--text-primary)' }}>{merchant?.name || 'Merchant Details'}</h1>
        <GlobalDateFilter onDatesChange={handleDatesChange} />
      </div>

      {loading && !merchant ? (
        <div style={{ padding: '24px' }}>Loading...</div>
      ) : !merchant ? (
        <div style={{ padding: '24px' }}>Merchant not found</div>
      ) : (
      <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)' }}>Transaction History</h2>
        
        {merchant.transactions && merchant.transactions.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 8px' }}>Date</th>
                <th style={{ padding: '12px 8px' }}>Amount</th>
                <th style={{ padding: '12px 8px' }}>Category</th>
                <th style={{ padding: '12px 8px' }}>Account</th>
                <th style={{ padding: '12px 8px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {merchant.transactions.map((tx: any) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 8px' }}>{new Date(tx.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 8px', color: tx.amount < 0 ? '#e11d48' : 'var(--sporty-teal)', fontWeight: 600 }}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {tx.category ? <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>{tx.category.name}</span> : <span style={{ color: 'var(--text-muted)' }}>Uncategorized</span>}
                  </td>
                  <td style={{ padding: '12px 8px' }}>{tx.account?.name}</td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{tx.notes}</td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ background: 'var(--bg-secondary)', fontWeight: 600 }}>
              <tr>
                <td style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--text-muted)' }}>Total for Period:</td>
                <td style={{ padding: '12px 8px', color: totalAmount >= 0 ? 'var(--sporty-teal)' : '#e11d48', fontWeight: 600 }}>
                  {totalAmount >= 0 ? "+" : ""}{formatCurrency(totalAmount)}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No transactions found for this merchant.</p>
        )}
      </div>
      )}
    </div>
  );
}
