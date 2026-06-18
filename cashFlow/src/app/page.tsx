"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import budgetStyles from "./budgets/page.module.css";
import GlobalDateFilter from "@/components/GlobalDateFilter";
import TransactionModal from "@/components/TransactionModal";
import ReceiptPreviewModal from "@/components/ReceiptPreviewModal";
import { formatCurrency, formatDate } from "@/utils/format";

function getCategoryColor(categoryName: string | null | undefined) {
  if (!categoryName) return "linear-gradient(135deg, #94a3b8, #64748b)"; // slate gray
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "linear-gradient(135deg, #f87171, #ef4444)", // red
    "linear-gradient(135deg, #fb923c, #f97316)", // orange
    "linear-gradient(135deg, #fbbf24, #f59e0b)", // amber
    "linear-gradient(135deg, #34d399, #10b981)", // emerald
    "linear-gradient(135deg, #2dd4bf, #14b8a6)", // teal
    "linear-gradient(135deg, #60a5fa, #3b82f6)", // blue
    "linear-gradient(135deg, #818cf8, #6366f1)", // indigo
    "linear-gradient(135deg, #a78bfa, #8b5cf6)", // violet
    "linear-gradient(135deg, #f472b6, #ec4899)", // pink
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

const formatYAxis = (val: number) => {
  const absVal = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (absVal >= 1000000) {
    return `${sign}$${(absVal / 1000000).toFixed(1)}M`;
  }
  if (absVal >= 1000) {
    return `${sign}$${(absVal / 1000).toFixed(0)}k`;
  }
  return `${sign}$${absVal}`;
};

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [isCumulative, setIsCumulativeState] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dashboard_cumulative");
      return stored !== null ? stored === "true" : true;
    }
    return true;
  });

  const handleDatesChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleCumulativeChange = (val: boolean) => {
    setIsCumulativeState(val);
    if (typeof window !== "undefined") localStorage.setItem("dashboard_cumulative", String(val));
  };

  const COLORS = ['#008080', '#4F9D9D', '#005A5A', '#2D5D7B', '#e11d48', '#f59e0b', '#3b82f6', '#8b5cf6'];

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  // Scan receipt states
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanData, setScanData] = useState<any | null>(null);
  const [scanning, setScanning] = useState(false);

  // Popover menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openCreateModal = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
    setIsMenuOpen(false);
  };

  const openEditModal = (txn: any) => {
    setSelectedTransaction(txn);
    setIsModalOpen(true);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setIsMenuOpen(false);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/cashFlow/api/transactions/scan", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setScanData(data);
        setIsScanModalOpen(true);
      } else {
        const err = await res.json();
        alert("Scan failed: " + err.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error scanning receipt");
    } finally {
      setScanning(false);
      e.target.value = "";
    }
  };

  const fetchDashboardData = async () => {
    if (!startDate || !endDate) return;
    try {
      setLoading(true);
      // Process any due scheduled transactions first so dashboard is accurate
      await fetch('/cashFlow/api/scheduled/process', { method: 'POST' });

      const res = await fetch(`/cashFlow/api/dashboard?startDate=${startDate}&endDate=${endDate}`);
      const dashboardData = await res.json();
      
      let budgetsData = [];
      try {
        const budgetsRes = await fetch('/cashFlow/api/budgets');
        if (budgetsRes.ok) {
          const parsed = await budgetsRes.json();
          budgetsData = parsed.budgets || [];
        }
      } catch (err) {
        console.error("Failed to fetch budgets data", err);
      }

      let forecastData = null;
      try {
        const forecastRes = await fetch('/cashFlow/api/forecast?months=1');
        if (forecastRes.ok) {
          forecastData = await forecastRes.json();
        }
      } catch(err) {
        console.error("Failed to fetch forecast data", err);
      }

      setData({ ...dashboardData, budgets: budgetsData, forecast: forecastData });
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { totalBalance = 0, monthlyIncome = 0, monthlyExpenses = 0, chartData = [], pieData = [], balanceTrendData = [], recentTransactions = [], budgets = [], forecast = null, homeCurrency = "CAD" } = data || {};

  const processedChartData = isCumulative ? chartData.reduce((acc: any[], curr: any, index: number) => {
    if (index === 0) {
      acc.push(curr);
    } else {
      acc.push({
        name: curr.name,
        income: acc[index - 1].income + curr.income,
        expenses: acc[index - 1].expenses + curr.expenses,
        prevIncome: acc[index - 1].prevIncome + curr.prevIncome,
        prevExpenses: acc[index - 1].prevExpenses + curr.prevExpenses
      });
    }
    return acc;
  }, []) : chartData;

  // Group recent transactions by date for dashboard feed
  const groupedRecentTransactions: { [dateStr: string]: any[] } = {};
  recentTransactions.forEach((txn: any) => {
    const formattedDate = formatDate(txn.date);
    if (!groupedRecentTransactions[formattedDate]) {
      groupedRecentTransactions[formattedDate] = [];
    }
    groupedRecentTransactions[formattedDate].push(txn);
  });

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return "linear-gradient(90deg, #ef4444, #b91c1c)"; // Red
    if (percentage >= 80) return "linear-gradient(90deg, #f59e0b, #d97706)";  // Orange/Amber
    return "linear-gradient(90deg, #008080, #14b8a6)";                       // Teal
  };

  const activeBudgets = (budgets || []).map((b: any) => ({
    ...b,
    percentage: b.amount > 0 ? (b.spent / b.amount) * 100 : 0,
    remaining: b.amount - b.spent
  })).sort((a: any, b: any) => b.percentage - a.percentage).slice(0, 3);

  return (
    <div className={styles.dashboard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className={styles.title} style={{ marginBottom: 0 }}>Dashboard Overview</h1>
        <GlobalDateFilter onDatesChange={handleDatesChange} />
      </div>
      
      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading Dashboard...</div>
      ) : (
        <>
          <div className={styles.grid}>
            {/* Total Balance Card */}
        <Link href="/accounts" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.card} style={{ cursor: 'pointer' }}>
            <div className={styles.cardHeader}>
              <h3>Total Balance</h3>
              <span className={styles.icon} style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--unique-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </span>
            </div>
            <div className={styles.amount}>
              {formatCurrency(totalBalance, homeCurrency)}
            </div>
            <div className={styles.subtitle}>Included accounts only</div>
          </div>
        </Link>

        {/* Monthly Income Card */}
        <Link href="/transactions" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.card} style={{ cursor: 'pointer' }}>
            <div className={styles.cardHeader}>
              <h3>Period Income</h3>
              <span className={styles.icon} style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sporty-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </span>
            </div>
            <div className={styles.amount} style={{ color: 'var(--sporty-teal)' }}>+{formatCurrency(monthlyIncome, homeCurrency)}</div>
            <div className={styles.subtitle}>Selected Period</div>
          </div>
        </Link>

        {/* Monthly Expenses Card */}
        <Link href="/transactions" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.card} style={{ cursor: 'pointer' }}>
            <div className={styles.cardHeader}>
              <h3>Period Expenses</h3>
              <span className={styles.icon} style={{ background: 'rgba(225, 29, 72, 0.1)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                  <polyline points="16 17 22 17 22 11" />
                </svg>
              </span>
            </div>
            <div className={styles.amount} style={{ color: '#e11d48' }}>-{formatCurrency(monthlyExpenses, homeCurrency)}</div>
            <div className={styles.subtitle}>Selected Period</div>
          </div>
        </Link>

        {/* Planned Cash Flow Card */}
        {forecast && (
        <Link href="/forecast" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.card} style={{ cursor: 'pointer' }}>
            <div className={styles.cardHeader}>
              <h3>Planned (30 days)</h3>
              <span className={styles.icon} style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Income</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sporty-teal)' }}>+{formatCurrency(forecast.avgMonthlyIncome, homeCurrency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Expenses</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e11d48' }}>-{formatCurrency(forecast.avgMonthlyExpense, homeCurrency)}</span>
              </div>
            </div>
          </div>
        </Link>
        )}
      </div>

      <div className={styles.chartCard} style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: isMobile ? '8px' : '16px' }}>Balance Trend</h3>
        <div style={{ width: '100%', height: isMobile ? 220 : 300 }}>
          {balanceTrendData && balanceTrendData.length > 0 ? (
            <ResponsiveContainer>
              <AreaChart 
                data={balanceTrendData} 
                margin={isMobile ? { top: 10, right: 10, left: -20, bottom: 0 } : { top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBalanceTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D5D7B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2D5D7B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={isMobile ? 10 : 12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={isMobile ? 10 : 12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  formatter={(val: any) => formatCurrency(Number(val), homeCurrency)} 
                />
                <Legend verticalAlign="top" height={isMobile ? 24 : 36} wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }} />
                <Area type="monotone" dataKey="prevBalance" name="Previous Balance" stroke="#cbd5e1" strokeDasharray="5 5" strokeWidth={2} fill="none" />
                <Area type="monotone" dataKey="balance" name="Balance" stroke="#2D5D7B" strokeWidth={3} fillOpacity={1} fill="url(#colorBalanceTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
              No balance data available.
            </div>
          )}
        </div>
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '8px' : '12px' }}>
            <h3 style={{ margin: 0 }}>Income vs Expenses</h3>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: isMobile ? '12px' : '14px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isCumulative} 
                onChange={(e) => handleCumulativeChange(e.target.checked)} 
                style={{ marginRight: '6px' }}
              />
              Cumulative
            </label>
          </div>
          <div style={{ width: '100%', height: isMobile ? 220 : 300 }}>
            {processedChartData && processedChartData.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart 
                  data={processedChartData} 
                  margin={isMobile ? { top: 10, right: 10, left: -20, bottom: 0 } : { top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={isMobile ? 10 : 12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={isMobile ? 10 : 12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => formatCurrency(Number(value), homeCurrency)}
                  />
                  <Legend verticalAlign="top" height={isMobile ? 24 : 36} wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }} />
                  <Area type="monotone" name="Prev Income" dataKey="prevIncome" stroke="#99f6e4" strokeDasharray="4 4" strokeWidth={2} fill="none" />
                  <Area type="monotone" name="Prev Expenses" dataKey="prevExpenses" stroke="#fecdd3" strokeDasharray="4 4" strokeWidth={2} fill="none" />
                  <Area type="monotone" name="Income" dataKey="income" stroke="#008080" fill="#008080" fillOpacity={0.1} />
                  <Area type="monotone" name="Expenses" dataKey="expenses" stroke="#e11d48" fill="#e11d48" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                No transaction data available.
              </div>
            )}
          </div>
        </div>
        <div className={styles.chartCard} style={{ height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '8px' : '16px' }}>
            <h3 style={{ margin: 0 }}>Expenses by Category</h3>
            <Link href="/categories" style={{ textDecoration: 'none', color: 'var(--unique-blue)', fontSize: '14px', fontWeight: 600 }}>
              View All &rarr;
            </Link>
          </div>
          <div style={{ width: '100%', height: isMobile ? 240 : 300, display: 'flex', justifyContent: 'center' }}>
            {pieData && pieData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={isMobile ? 30 : 40}
                    outerRadius={isMobile ? 60 : 80}
                    paddingAngle={5}
                    dataKey="value"
                    labelLine={true}
                    onClick={(data) => {
                      if (data.payload && data.payload.id) {
                        router.push(`/categories/${data.payload.id}`);
                      } else {
                        router.push(`/categories`);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                    label={isMobile 
                      ? ({ percent, x, y, cx }) => (
                          <text 
                            x={x} 
                            y={y} 
                            fill="#1A2B4C" 
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central" 
                            fontSize={9}
                            fontWeight={500}
                          >
                            {`${((percent || 0) * 100).toFixed(0)}%`}
                          </text>
                        )
                      : ({ name, percent, x, y, cx }) => (
                          <text 
                            x={x} 
                            y={y} 
                            fill="#1A2B4C" 
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central" 
                            fontSize={11}
                            fontWeight={500}
                          >
                            {`${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                          </text>
                        )
                    }
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value), homeCurrency)} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: isMobile ? '10px' : '11px', marginTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                No expenses this month.
              </div>
            )}
          </div>
        </div>
      </div>

      {activeBudgets.length > 0 && (
        <div className={styles.chartCard} style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Active Budgets</h3>
            <Link href="/budgets" style={{ textDecoration: 'none', color: 'var(--unique-blue)', fontSize: '14px', fontWeight: 600 }}>
              View All &rarr;
            </Link>
          </div>
          <div className={budgetStyles.budgetsGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {activeBudgets.map((budget: any) => {
              const spentPercent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
              const projectedPercent = budget.amount > 0 ? ((budget.projected || 0) / budget.amount) * 100 : 0;
              const isOverBudget = budget.remaining < 0;
              return (
                <div key={budget.id} className={budgetStyles.budgetCard}>
                  <div className={budgetStyles.cardTop}>
                    <div>
                      <h3 className={budgetStyles.budgetName}>{budget.name}</h3>
                      <span className={budgetStyles.cardInterval}>
                        {formatDate(budget.currentPeriodStart)} - {formatDate(budget.currentPeriodEnd)}
                      </span>
                    </div>
                    <div className={budgetStyles.cardStats}>
                      <span className={budgetStyles.spentAmount}>{formatCurrency(budget.spent, homeCurrency)}</span>
                      <span className={budgetStyles.limitAmount}>of {formatCurrency(budget.amount, homeCurrency)}</span>
                    </div>
                  </div>
                  <div className={budgetStyles.progressContainer}>
                    <div
                      className={budgetStyles.progressBar}
                      style={{
                        width: `${Math.min(spentPercent, 100)}%`,
                        background: getProgressBarColor(spentPercent),
                      }}
                    />
                    {(projectedPercent > 0 && spentPercent < 100) && (
                      <div 
                        className={budgetStyles.progressBarProjected} 
                        style={{ 
                          width: `${Math.min(projectedPercent, 100 - spentPercent)}%`, 
                          left: `${Math.min(spentPercent, 100)}%`,
                          background: 'repeating-linear-gradient(45deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.3) 10px, rgba(16, 185, 129, 0.5) 10px, rgba(16, 185, 129, 0.5) 20px)'
                        }} 
                      />
                    )}
                  </div>
                  <div className={budgetStyles.cardFooter}>
                    <span className={budgetStyles.percentageText}>{Math.round(spentPercent)}% used {projectedPercent > 0 && `(+${Math.round(projectedPercent)}% planned)`}</span>
                    <span className={isOverBudget ? budgetStyles.remainingOver : budgetStyles.remainingUnder}>
                      {isOverBudget ? `${formatCurrency(Math.abs(budget.remaining), homeCurrency)} over limit` : `${formatCurrency(budget.remaining, homeCurrency)} remaining`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.chartCard} style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Last Records</h3>
        <div>
          {recentTransactions && recentTransactions.length > 0 ? (
            Object.keys(groupedRecentTransactions).map(dateStr => (
              <div key={dateStr} className={styles.recentDateGroup}>
                <div className={styles.recentDateHeader}>{dateStr}</div>
                <div className={styles.recentGroupItems}>
                  {groupedRecentTransactions[dateStr].map(txn => {
                    const isIncome = txn.amount >= 0;
                    const catLetter = txn.category?.name ? txn.category.name.charAt(0).toUpperCase() : "?";
                    const catColor = getCategoryColor(txn.category?.name);
                    
                    return (
                      <div key={txn.id} className={styles.recentTxnCard} onClick={() => openEditModal(txn)} style={{ cursor: 'pointer' }}>
                        <div className={styles.recentTxnLeft}>
                          <div className={styles.categoryIconSmall} style={{ background: catColor }}>
                            {catLetter}
                          </div>
                          <div className={styles.recentTxnMeta}>
                            <div className={styles.recentTxnTitle}>
                              {txn.notes || txn.category?.name || "Transaction"}
                            </div>
                            <div className={styles.recentTxnSubtitle}>
                              {txn.account?.name || "Unknown"}
                            </div>
                            {txn.merchant && (
                              <div className={styles.merchantBadge}>
                                {txn.merchant}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={styles.recentTxnRight}>
                          <div className={isIncome ? styles.recentAmountIncome : styles.recentAmountExpense}>
                            {isIncome ? "+" : ""}{formatCurrency(txn.amount, txn.account?.currency)}
                          </div>
                          {txn.paymentMethod && (
                            <div className={styles.recentPaymentMethod}>
                              {txn.paymentMethod}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent transactions found.</div>
          )}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <Link href="/transactions" style={{ textDecoration: 'none', color: 'var(--unique-blue)', fontWeight: 600, fontSize: '14px' }}>
            Show More &rarr;
          </Link>
        </div>
      </div>
      {/* Floating Action Button (FAB) */}
      <div className={styles.fabContainer}>
        {isMenuOpen && (
          <div className={styles.fabMenu}>
            <button className={styles.fabMenuItem} onClick={openCreateModal}>
              ✍️ Manual Entry
            </button>
            <label className={styles.fabMenuItem} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              📸 Scan Receipt
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: "none" }} 
                onChange={handleReceiptUpload} 
                disabled={scanning}
              />
            </label>
          </div>
        )}
        <button 
          className={`${styles.fabButton} ${scanning ? styles.fabLoading : ''}`} 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {scanning ? "🤖" : (isMenuOpen ? "×" : "+")}
        </button>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        transaction={selectedTransaction} 
        onSave={fetchDashboardData} 
      />

      <ReceiptPreviewModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        scanData={scanData}
        onSave={fetchDashboardData}
      />
        </>
      )}
    </div>
  );
}

