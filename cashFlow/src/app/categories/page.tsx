"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

import CategoryModal from "@/components/CategoryModal";

type Category = {
  id: string;
  name: string;
  parentId: string | null;
  subcategories?: Category[];
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/cashFlow/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSaveCategory = async (data: any) => {
    try {
      const isEdit = !!data.id;
      const url = isEdit ? `/api/categories/${data.id}` : "/api/categories";
      const method = isEdit ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingCategory(null);
        fetchCategories();
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
        fetchCategories();
      }
    } catch (err) {
      console.error("Failed to delete category", err);
    }
  };

  // Only top level categories
  const topLevelCategories = categories.filter(c => !c.parentId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Categories</h1>
          <p>Manage your expense and income categories.</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}>
          + Add Category
        </button>
      </div>

      <div className={styles.categoryList}>
        {loading ? (
          <div>Loading categories...</div>
        ) : topLevelCategories.length === 0 ? (
          <div>No categories found. Create one to get started!</div>
        ) : (
          topLevelCategories.map(cat => (
            <div key={cat.id} className={styles.categoryItem}>
              <div className={styles.categoryName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href={`/categories/${cat.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  📁 <span style={{ cursor: 'pointer' }}>{cat.name}</span>
                </Link>
                <button 
                  onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }}
                  style={{ background: 'none', border: 'none', color: 'var(--unique-blue)', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Edit
                </button>
              </div>
              {cat.subcategories && cat.subcategories.length > 0 && (
                <div className={styles.subcategories}>
                  {cat.subcategories.map(sub => (
                    <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Link href={`/categories/${sub.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                        <div className={styles.subcategoryItem} style={{ cursor: 'pointer', margin: 0 }}>
                          {sub.name}
                        </div>
                      </Link>
                      <button 
                        onClick={() => { setEditingCategory(sub); setIsModalOpen(true); }}
                        style={{ background: 'none', border: 'none', color: 'var(--unique-blue)', cursor: 'pointer', fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCategory(null); }}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
        category={editingCategory}
        categories={categories}
      />
    </div>
  );
}

