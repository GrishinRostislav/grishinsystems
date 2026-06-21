"use client";

import { useEffect, useState, use } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import TransactionModal from "@/components/TransactionModal";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/utils/format";

function getProgressBarColor(percent: number) {
  if (percent >= 100) return "#e11d48";
  if (percent >= 85) return "#fb923c";
  return "var(--sporty-teal)";
}

export default function BudgetDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);



  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/cashFlow/api/budgets/${resolvedParams.id}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [resolvedParams.id]);

  const handleTransactionSave = () => {
    setIsTxnModalOpen(false);
    setSelectedTxn(null);
    fetchBudgetData();
  };

  const openTxnEditModal = (txn: any) => {
    setSelectedTxn(txn);
    setIsTxnModalOpen(true);
  };

  if (!loading && (!data || data.error)) return <div className={styles.container}><h1>Budget Not Found</h1></div>;

  const { budget, transactions, homeCurrency } = data || {};

  const spentPercent = budget?.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
  const projectedPercent = budget?.amount > 0 ? ((budget.projected || 0) / budget.amount) * 100 : 0;
  const remaining = budget ? budget.amount - budget.spent : 0;
  const isOverBudget = remaining < 0;

  return (
    <div className={styles.container}>
      <Link href="/budgets" className={styles.backLink}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Back to Budgets
      </Link>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ margin: 0 }}>
            {budget?.name || "Loading..."}
          </h1>
          {budget && (
            <p className={styles.subtitle} style={{ marginTop: '8px' }}>
              {formatDate(budget.currentPeriodStart)} - {formatDate(budget.currentPeriodEnd)} ({budget.period})
            </p>
          )}
        </div>
      </div>

      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading Budget Data...</div>
      ) : budget && (
        <>
          <div style={{ marginBottom: '32px', background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(budget.spent, homeCurrency)}</span>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginLeft: '8px' }}>of {formatCurrency(budget.amount, homeCurrency)}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 600, color: isOverBudget ? '#e11d48' : 'var(--sporty-teal)', fontSize: '1.1rem' }}>
                  {isOverBudget ? `${formatCurrency(Math.abs(remaining), homeCurrency)} over limit` : `${formatCurrency(remaining, homeCurrency)} remaining`}
                </span>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {Math.round(spentPercent)}% used {projectedPercent > 0 && `(+${Math.round(projectedPercent)}% planned)`}
                </div>
              </div>
            </div>
            
            <div style={{ height: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
              <div 
                style={{ 
                  position: 'absolute', top: 0, left: 0, height: '100%',
                  width: `${Math.min(spentPercent, 100)}%`, 
                  background: getProgressBarColor(spentPercent),
                  transition: 'width 0.5s ease-out'
                }} 
              />
              {(projectedPercent > 0 && spentPercent < 100) && (
                <div 
                  style={{ 
                    position: 'absolute', top: 0, height: '100%',
                    width: `${Math.min(projectedPercent, 100 - spentPercent)}%`, 
                    left: `${Math.min(spentPercent, 100)}%`,
                    background: 'repeating-linear-gradient(45deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.3) 10px, rgba(16, 185, 129, 0.5) 10px, rgba(16, 185, 129, 0.5) 20px)'
                  }} 
                />
              )}
            </div>
          </div>

          <div>
            <h2 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Budget Transactions</h2>
            {transactions && transactions.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Merchant</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn: any) => (
                      <tr key={txn.id} onClick={() => openTxnEditModal(txn)} style={{ cursor: 'pointer' }} className={styles.tableRow}>
                        <td>{formatDate(txn.date)}</td>
                        <td>{txn.merchant || "-"}</td>
                        <td>{txn.notes || "-"}</td>
                        <td>{txn.category?.name || "Uncategorized"}</td>
                        <td className={txn.amount >= 0 ? styles.amountIncome : styles.amountExpense}>
                          {txn.amount >= 0 ? "+" : ""}{formatCurrency(txn.amount, homeCurrency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Spent:</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {formatCurrency(transactions.reduce((sum: number, t: any) => sum + t.amount, 0), homeCurrency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className={styles.emptyState}>No transactions found for this budget period.</div>
            )}
          </div>
        </>
      )}



      {isTxnModalOpen && selectedTxn && (
        <TransactionModal
          isOpen={isTxnModalOpen}
          onClose={() => { setIsTxnModalOpen(false); setSelectedTxn(null); }}
          onSave={handleTransactionSave}
          transaction={selectedTxn}
        />
      )}
    </div>
  );
}
