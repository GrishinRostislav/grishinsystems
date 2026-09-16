"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import GlobalDateFilter from "@/components/GlobalDateFilter";
import CategoryModal from "@/components/CategoryModal";
import { buildCategoryTree, type Category } from "@/utils/categories";
import { formatCurrency } from "@/utils/format";
import { useAutoSync } from "@/hooks/useAutoSync";

function getCategoryColor(categoryName: string | null | undefined) {
  if (!categoryName) return "linear-gradient(135deg, #94a3b8, #64748b)";
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "linear-gradient(135deg, #f87171, #ef4444)",
    "linear-gradient(135deg, #fb923c, #f97316)",
    "linear-gradient(135deg, #fbbf24, #f59e0b)",
    "linear-gradient(135deg, #34d399, #10b981)",
    "linear-gradient(135deg, #2dd4bf, #14b8a6)",
    "linear-gradient(135deg, #60a5fa, #3b82f6)",
    "linear-gradient(135deg, #818cf8, #6366f1)",
    "linear-gradient(135deg, #a78bfa, #8b5cf6)",
    "linear-gradient(135deg, #f472b6, #ec4899)",
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySpending, setCategorySpending] = useState<Record<string, number>>({});
  const [homeCurrency, setHomeCurrency] = useState("CAD");
  const [loading, setLoading] = useState(true);

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupByParent, setGroupByParent] = useState(true);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleDatesChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const fetchData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);

      const queryParams = new URLSearchParams();
      if (startDate && endDate) {
        queryParams.set("startDate", startDate);
        queryParams.set("endDate", endDate);
      }

      const [catRes, dashRes] = await Promise.all([
        fetch("/cashFlow/api/categories"),
        fetch(`/cashFlow/api/dashboard?${queryParams.toString()}`)
      ]);

      const catData = await catRes.json();
      const dashData = await dashRes.json();

      setCategories(catData || []);
      if (dashData.homeCurrency) setHomeCurrency(dashData.homeCurrency);

      // Build map of category spending from dashData.pieData
      const spendingMap: Record<string, number> = {};
      if (dashData.pieData && Array.isArray(dashData.pieData)) {
        dashData.pieData.forEach((item: any) => {
          if (item.id) spendingMap[item.id] = item.value;
        });
      }
      setCategorySpending(spendingMap);
    } catch (err) {
      console.error("Failed to fetch categories data", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  useAutoSync(() => {
    if (startDate && endDate) fetchData(true);
  });

  const handleSaveCategory = async (data: any) => {
    try {
      const isEdit = !!data.id;
      const url = isEdit ? `/cashFlow/api/categories/${data.id}` : "/cashFlow/api/categories";
      const method = isEdit ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingCategory(null);
        fetchData();
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
        fetchData();
      }
    } catch (err) {
      console.error("Failed to delete category", err);
    }
  };

  const toggleParentExpand = (id: string) => {
    setExpandedParents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build category hierarchy
  const categoryTree = buildCategoryTree(categories);

  // Compute total expenses for the selected timeframe
  const totalPeriodExpenses = Object.values(categorySpending).reduce((acc, v) => acc + v, 0);

  // Helper to compute total spending of a category node (including subcategories)
  const getCategoryNodeSpent = (cat: Category): number => {
    let sum = categorySpending[cat.id] || 0;
    if (cat.subcategories && cat.subcategories.length > 0) {
      cat.subcategories.forEach(sub => {
        sum += getCategoryNodeSpent(sub);
      });
    }
    return sum;
  };

  // Build items depending on groupByParent mode
  let displayItems: Array<{
    category: Category;
    directSpent: number;
    totalSpent: number;
    subcategoriesSpent: number;
    subcategories: Category[];
  }> = [];

  if (groupByParent) {
    displayItems = categoryTree.map(parentCat => {
      const directSpent = categorySpending[parentCat.id] || 0;
      const totalSpent = getCategoryNodeSpent(parentCat);
      const subcategoriesSpent = totalSpent - directSpent;

      return {
        category: parentCat,
        directSpent,
        totalSpent,
        subcategoriesSpent,
        subcategories: parentCat.subcategories || []
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  } else {
    // All categories flat
    displayItems = categories.map(cat => {
      const spent = categorySpending[cat.id] || 0;
      return {
        category: cat,
        directSpent: spent,
        totalSpent: spent,
        subcategoriesSpent: 0,
        subcategories: []
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }

  const maxItemSpent = Math.max(...displayItems.map(i => i.totalSpent), 1);

  return (
    <div className={styles.container}>
      {/* Header & Controls */}
      <div className={styles.header} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px 0' }}>Expenses by Category</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Track category spending breakdown and manage hierarchy.
            </p>
          </div>
          <button className={styles.btnPrimary} onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}>
            + Add Category
          </button>
        </div>

        {/* Toolbar: Date filter & Group By Parent toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <GlobalDateFilter onDatesChange={handleDatesChange} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-hover)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setGroupByParent(true)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: groupByParent ? 'var(--unique-blue)' : 'transparent',
                color: groupByParent ? 'white' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📁 Parent Categories
            </button>
            <button
              onClick={() => setGroupByParent(false)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: !groupByParent ? 'var(--unique-blue)' : 'transparent',
                color: !groupByParent ? 'white' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📊 All Categories
            </button>
          </div>
        </div>
      </div>

      {/* Main Spending List */}
      <div className={styles.categoryList}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Category ({displayItems.length})
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Period Spent: <strong style={{ color: 'var(--unique-blue)' }}>{formatCurrency(totalPeriodExpenses, homeCurrency)}</strong>
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading category spending...</div>
        ) : displayItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No categories found. Create one to get started!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {displayItems.map(({ category, totalSpent, subcategories }) => {
              const pct = totalPeriodExpenses > 0 ? ((totalSpent / totalPeriodExpenses) * 100).toFixed(1) : '0';
              const barWidthPct = Math.min(100, Math.max(3, (totalSpent / maxItemSpent) * 100));
              const catColor = getCategoryColor(category.name);
              const isExpanded = !!expandedParents[category.id];

              return (
                <div 
                  key={category.id} 
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Category Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: catColor,
                        display: 'inline-block',
                        flexShrink: 0
                      }} />
                      <Link href={`/categories/${category.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}>
                          {category.name}
                        </span>
                      </Link>
                      {subcategories.length > 0 && groupByParent && (
                        <button
                          onClick={() => toggleParentExpand(category.id)}
                          style={{
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {subcategories.length} subcategorie{subcategories.length !== 1 ? 's' : ''} {isExpanded ? '▲' : '▼'}
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: totalSpent > 0 ? '#e11d48' : 'var(--text-muted)' }}>
                          {formatCurrency(totalSpent, homeCurrency)}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px', fontWeight: 500 }}>
                          ({pct}%)
                        </span>
                      </div>
                      <button
                        onClick={() => { setEditingCategory(category); setIsModalOpen(true); }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--unique-blue)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: 'rgba(100, 116, 139, 0.15)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${barWidthPct}%`,
                      height: '100%',
                      borderRadius: '4px',
                      background: catColor,
                      transition: 'width 0.3s ease-in-out'
                    }} />
                  </div>

                  {/* Expandable Subcategories Breakdown */}
                  {groupByParent && subcategories.length > 0 && isExpanded && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '16px' }}>
                      {subcategories.map(sub => {
                        const subSpent = categorySpending[sub.id] || 0;
                        const subPct = totalSpent > 0 ? ((subSpent / totalSpent) * 100).toFixed(1) : '0';
                        const subBarWidth = Math.min(100, Math.max(3, (subSpent / (totalSpent || 1)) * 100));

                        return (
                          <div key={sub.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                                ↳ {sub.name}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 600, color: subSpent > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                  {formatCurrency(subSpent, homeCurrency)}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                  ({subPct}% of parent)
                                </span>
                                <button
                                  onClick={() => { setEditingCategory(sub); setIsModalOpen(true); }}
                                  style={{ background: 'none', border: 'none', color: 'var(--unique-blue)', cursor: 'pointer', fontSize: '0.75rem' }}
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                            <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(100, 116, 139, 0.1)', overflow: 'hidden' }}>
                              <div style={{ width: `${subBarWidth}%`, height: '100%', borderRadius: '2px', background: catColor }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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

