"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { formatCurrency, formatDate } from "@/utils/format";
import { buildCategoryTree, flattenCategoryTree, type Category as CatType } from "@/utils/categories";

type Category = {
  id: string;
  name: string;
};

type Budget = {
  id: string;
  name: string;
  amount: number;
  spent: number;
  period: string;
  startDate: string;
  endDate: string | null;
  isGlobal: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  inflationRate?: number | null;
  categories: Category[];
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [homeCurrency, setHomeCurrency] = useState("CAD");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);
  const [inflationRate, setInflationRate] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        fetch("/cashFlow/api/budgets"),
        fetch("/cashFlow/api/categories"),
      ]);
      const data = await budgetsRes.json();
      const categoriesData = await categoriesRes.json();

      setBudgets(data.budgets || []);
      if (data.homeCurrency) setHomeCurrency(data.homeCurrency);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Failed to fetch budgets data", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBudget(null);
    setName("");
    setAmount("");
    setPeriod("monthly");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setIsGlobal(false);
    setInflationRate("");
    setSelectedCategoryIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setName(budget.name);
    setAmount(budget.amount.toString());
    setPeriod(budget.period);
    setStartDate(budget.startDate.split("T")[0]);
    setEndDate(budget.endDate ? budget.endDate.split("T")[0] : "");
    setIsGlobal(budget.isGlobal);
    setInflationRate(budget.inflationRate ? budget.inflationRate.toString() : "");
    setSelectedCategoryIds(budget.categories.map((c) => c.id));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    const payload = {
      name,
      amount: parseFloat(amount),
      period,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      isGlobal,
      inflationRate: inflationRate ? parseFloat(inflationRate) : null,
      categoryIds: isGlobal ? [] : selectedCategoryIds,
    };

    try {
      const url = editingBudget
        ? `/cashFlow/api/budgets/${editingBudget.id}`
        : "/cashFlow/api/budgets";
      const method = editingBudget ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        alert("Error saving budget: " + error.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving budget");
    }
  };

  const handleDelete = async () => {
    if (!editingBudget) return;
    if (!confirm(`Are you sure you want to delete the budget "${editingBudget.name}"?`)) return;

    try {
      const res = await fetch(`/cashFlow/api/budgets/${editingBudget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting budget");
    }
  };

  const handleCategoryToggle = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  // Group budgets by period
  const periods = ["weekly", "monthly", "yearly", "custom"];
  const groupedBudgets = periods.reduce((acc, p) => {
    acc[p] = budgets.filter((b) => b.period === p);
    return acc;
  }, {} as Record<string, Budget[]>);

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return "linear-gradient(90deg, #ef4444, #b91c1c)"; // Red
    if (percentage >= 80) return "linear-gradient(90deg, #f59e0b, #d97706)";  // Orange/Amber
    return "linear-gradient(90deg, #008080, #14b8a6)";                       // Teal
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Budgets</h1>
          <p className={styles.subtitle}>Set limits and track your active spending limits.</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreateModal}>
          + Add Budget
        </button>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className={styles.emptyState}>
          No budgets configured yet. Click "+ Add Budget" to set up your first spending limit.
        </div>
      ) : (
        <div className={styles.budgetSections}>
          {periods.map((p) => {
            const list = groupedBudgets[p];
            if (!list || list.length === 0) return null;

            return (
              <div key={p} className={styles.periodGroup}>
                <h2 className={styles.periodHeader}>
                  {p.charAt(0).toUpperCase() + p.slice(1)} Budgets
                </h2>
                <div className={styles.budgetsGrid}>
                  {list.map((budget: any) => {
                    const spentPercent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
                    const projectedPercent = budget.amount > 0 ? ((budget.projected || 0) / budget.amount) * 100 : 0;
                    const isOverBudget = budget.remaining < 0;

                    return (
                      <Link href={`/budgets/${budget.id}`} key={budget.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className={styles.budgetCard}>
                        <div className={styles.cardTop}>
                          <div>
                            <h3 className={styles.budgetName}>{budget.name}</h3>
                            <span className={styles.cardInterval}>
                              {formatDate(budget.currentPeriodStart)} - {formatDate(budget.currentPeriodEnd)}
                            </span>
                            <div className={styles.cardBadges}>
                              {budget.isGlobal ? (
                                <span className={styles.globalBadge}>Global Budget</span>
                              ) : (
                                <>
                                  {budget.categories.slice(0, 3).map((c: any) => (
                                    <span key={c.id} className={styles.categoryBadge}>{c.name}</span>
                                  ))}
                                  {budget.categories.length > 3 && (
                                    <span className={styles.categoryBadgeMore}>+{budget.categories.length - 3} more</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div className={styles.cardStats}>
                            <span className={styles.spentAmount}>{formatCurrency(budget.spent, homeCurrency)}</span>
                            <span className={styles.limitAmount}>of {formatCurrency(budget.amount, homeCurrency)} {budget.period}</span>
                          </div>
                        </div>

                        <div className={styles.progressContainer}>
                          <div 
                            className={styles.progressBar} 
                            style={{ 
                              width: `${Math.min(spentPercent, 100)}%`, 
                              background: getProgressBarColor(spentPercent) 
                            }} 
                          />
                          {(projectedPercent > 0 && spentPercent < 100) && (
                            <div 
                              className={styles.progressBarProjected} 
                              style={{ 
                                width: `${Math.min(projectedPercent, 100 - spentPercent)}%`, 
                                left: `${Math.min(spentPercent, 100)}%`,
                                background: 'repeating-linear-gradient(45deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.3) 10px, rgba(16, 185, 129, 0.5) 10px, rgba(16, 185, 129, 0.5) 20px)'
                              }} 
                            />
                          )}
                        </div>

                        <div className={styles.cardFooter}>
                          <span className={styles.percentageText}>{Math.round(spentPercent)}% used {projectedPercent > 0 && `(+${Math.round(projectedPercent)}% planned)`}</span>
                          <span className={isOverBudget ? styles.remainingOver : styles.remainingUnder}>
                            {isOverBudget ? `${formatCurrency(Math.abs(budget.remaining), homeCurrency)} over limit` : `${formatCurrency(budget.remaining, homeCurrency)} remaining`}
                          </span>
                        </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>
              {editingBudget ? "Edit Budget" : "Create Budget"}
            </h2>
            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Budget Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Groceries, Entertainment"
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>Spending Limit</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.input}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>Time Period</label>
                  <select
                    className={styles.select}
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              {period === "custom" && (
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Start Date</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>End Date</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className={styles.checkboxGroup} style={{ marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="isGlobal"
                  checked={isGlobal}
                  onChange={(e) => setIsGlobal(e.target.checked)}
                />
                <label htmlFor="isGlobal" className={styles.checkboxLabel}>
                  Global Budget (Track all transactions/expenses)
                </label>
              </div>

              <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                <label className={styles.label}>
                  Annual Growth/Inflation (%)
                  <span style={{ fontSize: '0.8rem', marginLeft: '8px', color: '#64748b', fontWeight: 'normal' }}>(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={styles.input}
                  value={inflationRate}
                  onChange={(e) => setInflationRate(e.target.value)}
                  placeholder="e.g. 5 for 5% per year"
                />
                <small style={{ display: 'block', marginTop: '4px', color: '#64748b' }}>
                  Used in forecasting to automatically increase this budget over time.
                </small>
              </div>

              {!isGlobal && (() => {
                const categoryTree = buildCategoryTree(categories as CatType[]);
                const flatCategories = flattenCategoryTree(categoryTree);
                return (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Include Categories</label>
                    <div className={styles.categorySelectionList}>
                      {flatCategories.map((c) => (
                        <label key={c.id} className={styles.categorySelectionItem} style={{ paddingLeft: `${c.depth * 16}px` }}>
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.includes(c.id)}
                            onChange={() => handleCategoryToggle(c.id)}
                          />
                          <span style={{ fontWeight: c.depth === 0 ? 600 : 400 }}>{c.name}</span>
                        </label>
                      ))}
                    </div>
                    {!isGlobal && selectedCategoryIds.length === 0 && (
                      <p className={styles.warningText}>
                        ⚠️ Please select at least one category to track.
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className={styles.modalActions}>
                {editingBudget && (
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={handleDelete}
                    style={{ marginRight: "auto" }}
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={!isGlobal && selectedCategoryIds.length === 0}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
