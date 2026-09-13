"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/utils/format";
import styles from "@/app/budgets/page.module.css";

interface Category {
  id: string;
  name: string;
}

interface BudgetCardProps {
  budget: {
    id: string;
    name: string;
    amount: number;
    spent: number;
    projected?: number;
    remaining?: number;
    period: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    isGlobal?: boolean;
    categories?: Category[];
  };
  homeCurrency: string;
  showPeriodLabel?: boolean;
}

export default function BudgetCard({ budget, homeCurrency, showPeriodLabel = true }: BudgetCardProps) {
  const spentPercent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
  const projectedPercent = budget.amount > 0 ? ((budget.projected || 0) / budget.amount) * 100 : 0;
  const remaining = budget.remaining !== undefined ? budget.remaining : (budget.amount - budget.spent);
  const isOverBudget = remaining < 0;

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return "linear-gradient(90deg, #ef4444, #b91c1c)"; // Red
    if (percentage >= 80) return "linear-gradient(90deg, #f59e0b, #d97706)";  // Amber
    return "linear-gradient(90deg, #008080, #14b8a6)";                       // Teal
  };

  return (
    <Link href={`/budgets/${budget.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                  {budget.categories?.slice(0, 3).map((c) => (
                    <span key={c.id} className={styles.categoryBadge}>{c.name}</span>
                  ))}
                  {budget.categories && budget.categories.length > 3 && (
                    <span className={styles.categoryBadgeMore}>+{budget.categories.length - 3} more</span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className={styles.cardStats}>
            <span className={styles.spentAmount}>{formatCurrency(budget.spent, homeCurrency)}</span>
            <span className={styles.limitAmount}>
              of {formatCurrency(budget.amount, homeCurrency)} {showPeriodLabel ? budget.period : ''}
            </span>
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
          <span className={styles.percentageText}>
            {Math.round(spentPercent)}% used {projectedPercent > 0 && `(+${Math.round(projectedPercent)}% planned)`}
          </span>
          <span className={isOverBudget ? styles.remainingOver : styles.remainingUnder}>
            {isOverBudget 
              ? `${formatCurrency(Math.abs(remaining), homeCurrency)} over limit` 
              : `${formatCurrency(remaining, homeCurrency)} remaining`}
          </span>
        </div>
      </div>
    </Link>
  );
}
