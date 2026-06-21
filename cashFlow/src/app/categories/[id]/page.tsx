"use client";

import { useEffect, useState, use } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import CategoryModal from "@/components/CategoryModal";
import TransactionModal from "@/components/TransactionModal";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/utils/format";

export default function CategoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      const [resDetail, resAll] = await Promise.all([
        fetch(`/cashFlow/api/categories/${resolvedParams.id}`),
        fetch("/cashFlow/api/categories")
      ]);
      const result = await resDetail.json();
      const allResult = await resAll.json();
      setData(result);
      setAllCategories(allResult);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryData();
  }, [resolvedParams.id]);

  const handleSaveCategory = async (catData: any) => {
    try {
      const isEdit = !!catData.id;
      const url = isEdit ? `/cashFlow/api/categories/${catData.id}` : "/cashFlow/api/categories";
      const method = isEdit ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingCategory(null);
        fetchCategoryData();
      }
    } catch (err) {
      console.error("Failed to save category", err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/cashFlow/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingCategory(null);
        if (id === resolvedParams.id) {
          router.push('/categories');
        } else {
          fetchCategoryData();
        }
      }
    } catch (err) {
      console.error("Failed to delete category", err);
    }
  };

  if (!loading && (!data || data.error)) return <div className={styles.container}><h1>Category Not Found</h1></div>;

  const { category, transactions } = data || {};

  const groupedTransactions = transactions?.reduce((acc: any, txn: any) => {
    const dateStr = formatDate(txn.date);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(txn);
    return acc;
  }, {}) || {};

  const getCategoryColor = (name: string) => {
    if (!name) return '#94a3b8'; // default gray
    const colors = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {category?.name || "Loading..."}
            {category && (
              <button 
                onClick={() => { setEditingCategory(category); setIsModalOpen(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--unique-blue)', cursor: 'pointer', fontSize: '1rem', padding: '4px 8px' }}
              >
                Edit
              </button>
            )}
          </h1>
          {category?.parentCategory && (
            <p className={styles.subtitle}>
              Subcategory of <Link href={`/categories/${category.parentCategory.id}`} style={{ color: 'var(--unique-blue)', textDecoration: 'none' }}>{category.parentCategory.name}</Link>
            </p>
          )}
        </div>
        <button 
          className={styles.btnPrimary} 
          onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
        >
          + Add Subcategory
        </button>
      </div>

      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading Category Structure...</div>
      ) : (
        <>
          {category?.subcategories && category.subcategories.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Subcategories</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {category.subcategories.map((sub: any) => (
                  <div key={sub.id} className={styles.card} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
                    <Link href={`/categories/${sub.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                      <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', cursor: 'pointer' }}>📁 {sub.name}</h3>
                    </Link>
                    <button 
                      onClick={() => { setEditingCategory(sub); setIsModalOpen(true); }}
                      style={{ background: 'none', border: 'none', color: 'var(--unique-blue)', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Recent Transactions</h2>
            {transactions && transactions.length > 0 ? (
              <>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Merchant</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Account</th>
                        <th>Payment Method</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn: any) => (
                        <tr key={txn.id} onClick={() => { setSelectedTxn(txn); setIsTxnModalOpen(true); }} style={{ cursor: 'pointer' }} className={styles.tableRow}>
                          <td>{formatDate(txn.date)}</td>
                          <td>{txn.merchant || "-"}</td>
                          <td>{txn.notes || "-"}</td>
                          <td>{txn.category?.name || "Uncategorized"}</td>
                          <td>{txn.account?.name || "Unknown"}</td>
                          <td>{txn.paymentMethod || "-"}</td>
                          <td className={txn.amount >= 0 ? styles.amountIncome : styles.amountExpense}>
                            {txn.amount >= 0 ? "+" : ""}{formatCurrency(txn.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot style={{ background: 'var(--bg-secondary)', fontWeight: 600 }}>
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Total for Category:</td>
                        <td style={{ padding: '12px 16px', color: transactions.reduce((acc: any, txn: any) => acc + txn.amount, 0) >= 0 ? 'var(--sporty-teal)' : '#e11d48' }}>
                          {transactions.reduce((acc: any, txn: any) => acc + txn.amount, 0) >= 0 ? "+" : ""}{formatCurrency(transactions.reduce((acc: any, txn: any) => acc + txn.amount, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className={styles.mobileListContainer}>
                  {Object.keys(groupedTransactions).map(dateStr => (
                    <div key={dateStr} className={styles.mobileDateGroup}>
                      <div className={styles.mobileDateHeader}>{dateStr}</div>
                      <div className={styles.mobileGroupItems}>
                        {groupedTransactions[dateStr].map((txn: any) => {
                          const isIncome = txn.amount >= 0;
                          const catLetter = txn.category?.name ? txn.category.name.charAt(0).toUpperCase() : "?";
                          const catColor = getCategoryColor(txn.category?.name);
                          
                          return (
                            <div key={txn.id} className={styles.mobileTxnCard} onClick={() => { setSelectedTxn(txn); setIsTxnModalOpen(true); }}>
                              <div className={styles.mobileTxnLeft}>
                                <div className={styles.categoryIcon} style={{ background: catColor }}>
                                  {catLetter}
                                </div>
                                <div className={styles.mobileTxnMeta}>
                                  <div className={styles.mobileTxnTitle}>
                                    {txn.notes || txn.category?.name || "Transaction"}
                                  </div>
                                  <div className={styles.mobileTxnSubtitle}>
                                    {txn.account?.name || "Unknown Account"}
                                  </div>
                                  {txn.merchant && (
                                    <div className={styles.merchantBadge}>
                                      {txn.merchant}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className={styles.mobileTxnRight}>
                                <div className={isIncome ? styles.mobileAmountIncome : styles.mobileAmountExpense}>
                                  {isIncome ? "+" : ""}{formatCurrency(txn.amount)}
                                </div>
                                {txn.paymentMethod && (
                                  <div className={styles.mobilePaymentMethod}>
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
                  
                  <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total for Category:</span>
                    <span style={{ color: transactions.reduce((acc: any, txn: any) => acc + txn.amount, 0) >= 0 ? 'var(--sporty-teal)' : '#e11d48', fontSize: '16px' }}>
                      {transactions.reduce((acc: any, txn: any) => acc + txn.amount, 0) >= 0 ? "+" : ""}{formatCurrency(transactions.reduce((acc: any, txn: any) => acc + txn.amount, 0))}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>No transactions found for this category.</p>
              </div>
            )}
          </div>
        </>
      )}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCategory(null); }}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
        category={editingCategory}
        categories={allCategories}
        defaultParentId={resolvedParams.id}
      />

      <TransactionModal 
        isOpen={isTxnModalOpen} 
        onClose={() => setIsTxnModalOpen(false)} 
        transaction={selectedTxn} 
        onSave={fetchCategoryData} 
      />
    </div>
  );
}
