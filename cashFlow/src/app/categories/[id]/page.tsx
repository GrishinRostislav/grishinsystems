"use client";

import { useEffect, useState, use } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import CategoryModal from "@/components/CategoryModal";
import TransactionModal from "@/components/TransactionModal";
import TransactionList from "@/components/TransactionList";
import GlobalDateFilter from "@/components/GlobalDateFilter";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import { useAutoSync } from "@/hooks/useAutoSync";

export default function CategoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);

  const handleDatesChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const fetchCategoryData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);

      const queryParams = new URLSearchParams();
      if (startDate && endDate) {
        queryParams.set("startDate", startDate);
        queryParams.set("endDate", endDate);
      }

      const [resDetail, resAll] = await Promise.all([
        fetch(`/cashFlow/api/categories/${resolvedParams.id}?${queryParams.toString()}`),
        fetch("/cashFlow/api/categories")
      ]);
      const result = await resDetail.json();
      const allResult = await resAll.json();
      setData(result);
      setAllCategories(allResult);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate && resolvedParams.id) {
      fetchCategoryData();
    }
  }, [resolvedParams.id, startDate, endDate]);

  useAutoSync(() => {
    if (startDate && endDate && resolvedParams.id) {
      fetchCategoryData(true);
    }
  });

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

  const { category, transactions, totalSpending = 0 } = data || {};

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <Link href="/categories" className={styles.backLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to Categories
        </Link>
        <GlobalDateFilter onDatesChange={handleDatesChange} />
      </div>

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
          <div style={{ marginTop: '12px', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'inline-block' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Period Total Spent</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: totalSpending > 0 ? '#e11d48' : 'var(--unique-blue)', marginTop: '2px' }}>
              {formatCurrency(totalSpending)}
            </div>
          </div>
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
            <h2 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Period Transactions</h2>
            <TransactionList
              transactions={transactions || []}
              onTransactionClick={(txn) => { setSelectedTxn(txn); setIsTxnModalOpen(true); }}
              onTransactionsUpdated={() => fetchCategoryData()}
              emptyMessage="No transactions found for this category in selected period."
              totalLabel="Total for Period:"
            />
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
        onSave={() => fetchCategoryData()} 
      />
    </div>
  );
}
