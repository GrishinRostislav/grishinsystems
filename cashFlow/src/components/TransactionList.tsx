"use client";

import { formatCurrency, formatDate } from "@/utils/format";
import styles from "./TransactionList.module.css";

function getCategoryColor(name?: string) {
  if (!name) return '#94a3b8';
  const colors = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface TransactionListProps {
  transactions: any[];
  onTransactionClick?: (txn: any) => void;
  emptyMessage?: string;
  showTotal?: boolean;
  totalLabel?: string;
}

export default function TransactionList({ 
  transactions, 
  onTransactionClick, 
  emptyMessage = "No transactions found.",
  showTotal = true,
  totalLabel = "Total:"
}: TransactionListProps) {
  if (!transactions || transactions.length === 0) {
    return <div className={styles.emptyState}>{emptyMessage}</div>;
  }

  // Group transactions by date
  const grouped = transactions.reduce((acc: Record<string, any[]>, txn: any) => {
    const dateStr = formatDate(txn.date);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(txn);
    return acc;
  }, {});

  const total = transactions.reduce((acc: number, txn: any) => acc + txn.amount, 0);

  return (
    <div className={styles.listContainer}>
      {Object.keys(grouped).map(dateStr => (
        <div key={dateStr} className={styles.dateGroup}>
          <div className={styles.dateHeader}>{dateStr}</div>
          <div className={styles.groupItems}>
            {grouped[dateStr].map((txn: any) => {
              const isIncome = txn.amount >= 0;
              const catLetter = txn.category?.name ? txn.category.name.charAt(0).toUpperCase() : "?";
              const catColor = getCategoryColor(txn.category?.name);

              return (
                <div 
                  key={txn.id} 
                  className={styles.txnCard} 
                  onClick={() => onTransactionClick?.(txn)}
                  style={{ cursor: onTransactionClick ? 'pointer' : 'default' }}
                >
                  <div className={styles.txnLeft}>
                    <div className={styles.categoryIcon} style={{ background: catColor }}>
                      {catLetter}
                    </div>
                    <div className={styles.txnMeta}>
                      <div className={styles.txnTitle}>
                        {txn.notes || txn.category?.name || "Transaction"}
                      </div>
                      <div className={styles.txnSubtitle}>
                        {txn.account?.name || "Unknown"}
                      </div>
                      {txn.merchant && (
                        <div className={styles.merchantBadge}>
                          {txn.merchant}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.txnRight}>
                    <div className={isIncome ? styles.amountIncome : styles.amountExpense}>
                      {isIncome ? "+" : ""}{formatCurrency(txn.amount, txn.account?.currency)}
                    </div>
                    {txn.paymentMethod && (
                      <div className={styles.paymentMethod}>
                        {txn.paymentMethod}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {showTotal && (
        <div className={styles.totalBar}>
          <span className={styles.totalLabel}>{totalLabel}</span>
          <span className={total >= 0 ? styles.amountIncome : styles.amountExpense} style={{ fontSize: '14px' }}>
            {total >= 0 ? "+" : ""}{formatCurrency(total)}
          </span>
        </div>
      )}
    </div>
  );
}
