"use client";

import { useState } from "react";
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className={styles.listContainer}>
      {Object.keys(grouped).map(dateStr => {
        const dateTxns = grouped[dateStr];
        
        // Group by merchant
        const merchantGroups: Record<string, any[]> = {};
        const noMerchantTxns: any[] = [];
        
        dateTxns.forEach((txn: any) => {
          const merchantName = txn.merchant?.trim();
          if (!merchantName) {
            noMerchantTxns.push(txn);
          } else {
            if (!merchantGroups[merchantName]) {
              merchantGroups[merchantName] = [];
            }
            merchantGroups[merchantName].push(txn);
          }
        });
        
        // Build render items
        interface GroupedMerchant {
          isGroup: true;
          merchantName: string;
          transactions: any[];
          totalAmount: number;
        }
        
        type RenderItem = { isGroup: false; transaction: any } | GroupedMerchant;
        
        const renderItems: RenderItem[] = [];
        
        Object.entries(merchantGroups).forEach(([merchantName, txns]) => {
          if (txns.length > 1) {
            const totalAmount = txns.reduce((sum, t) => sum + t.amount, 0);
            renderItems.push({
              isGroup: true,
              merchantName,
              transactions: txns,
              totalAmount
            });
          } else {
            renderItems.push({
              isGroup: false,
              transaction: txns[0]
            });
          }
        });
        
        noMerchantTxns.forEach((txn: any) => {
          renderItems.push({
            isGroup: false,
            transaction: txn
          });
        });
        
        // Sort renderItems to preserve original chronological order
        const txIndexMap = new Map<any, number>();
        dateTxns.forEach((txn: any, index: number) => txIndexMap.set(txn, index));
        
        renderItems.sort((a, b) => {
          const indexA = a.isGroup ? txIndexMap.get(a.transactions[0])! : txIndexMap.get(a.transaction)!;
          const indexB = b.isGroup ? txIndexMap.get(b.transactions[0])! : txIndexMap.get(b.transaction)!;
          return indexA - indexB;
        });

        // Calculate total spent (expenses) for this day
        const daySpent = dateTxns
          .filter((t: any) => t.amount < 0)
          .reduce((sum: number, t: any) => sum + t.amount, 0);

        const currency = dateTxns[0]?.account?.currency;

        return (
          <div key={dateStr} className={styles.dateGroup}>
            <div className={styles.dateHeader}>
              <span>{dateStr}</span>
              {daySpent < 0 && (
                <span className={styles.daySpent}>
                  Spent: {formatCurrency(Math.abs(daySpent), currency)}
                </span>
              )}
            </div>
            <div className={styles.groupItems}>
              {renderItems.map((item) => {
                if (item.isGroup) {
                  const groupKey = `${dateStr}_${item.merchantName}`;
                  const isExpanded = !!expandedGroups[groupKey];
                  const totalIsIncome = item.totalAmount >= 0;
                  const currency = item.transactions[0]?.account?.currency;
                  
                  return (
                    <div key={groupKey} className={styles.merchantGroupWrapper}>
                      <div 
                        className={`${styles.merchantGroupHeader} ${isExpanded ? styles.expanded : ""}`}
                        onClick={() => toggleGroup(groupKey)}
                      >
                        <div className={styles.groupLeft}>
                          <div className={styles.receiptIconContainer}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/>
                              <path d="M16 8H8"/>
                              <path d="M16 12H8"/>
                              <path d="M15 16H8"/>
                            </svg>
                          </div>
                          <div className={styles.groupMeta}>
                            <div className={styles.groupTitle}>
                              {item.merchantName}
                            </div>
                            <div className={styles.groupSubtitle}>
                              {item.transactions.length} items • click to {isExpanded ? 'collapse' : 'expand'}
                            </div>
                          </div>
                        </div>
                        <div className={styles.groupRight}>
                          <div className={totalIsIncome ? styles.amountIncome : styles.amountExpense}>
                            {totalIsIncome ? "+" : ""}{formatCurrency(item.totalAmount, currency)}
                          </div>
                          <div className={styles.chevronIcon}>
                            {isExpanded ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="18 15 12 9 6 15"/>
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className={styles.nestedItemsList}>
                          {item.transactions.map((txn: any) => {
                            const isIncome = txn.amount >= 0;
                            const catLetter = txn.category?.name ? txn.category.name.charAt(0).toUpperCase() : "?";
                            const catColor = getCategoryColor(txn.category?.name);
                            
                            return (
                              <div 
                                key={txn.id} 
                                className={styles.nestedTxnCard} 
                                onClick={() => onTransactionClick?.(txn)}
                                style={{ cursor: onTransactionClick ? 'pointer' : 'default' }}
                              >
                                <div className={styles.txnLeft}>
                                  <div className={styles.categoryIconNested} style={{ background: catColor }}>
                                    {catLetter}
                                  </div>
                                  <div className={styles.txnMeta}>
                                    <div className={styles.txnTitleNested}>
                                      {txn.notes || txn.category?.name || "Transaction"}
                                    </div>
                                    <div className={styles.txnSubtitleNested}>
                                      {txn.account?.name || "Unknown"}
                                    </div>
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
                      )}
                    </div>
                  );
                } else {
                  // Standalone transaction
                  const txn = item.transaction;
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
                }
              })}
            </div>
          </div>
        );
      })}

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
