"use client";

import { useEffect, useState, use } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import CategoryModal from "@/components/CategoryModal";
import TransactionModal from "@/components/TransactionModal";
import TransactionList from "@/components/TransactionList";
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



  return (
    <div className={styles.container}>
      <Link href="/categories" className={styles.backLink}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Back to Categories
      </Link>
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
            <TransactionList
              transactions={transactions || []}
              onTransactionClick={(txn) => { setSelectedTxn(txn); setIsTxnModalOpen(true); }}
              onTransactionsUpdated={fetchCategoryData}
              emptyMessage="No transactions found for this category."
              totalLabel="Total for Category:"
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
        onSave={fetchCategoryData} 
      />
    </div>
  );
}
