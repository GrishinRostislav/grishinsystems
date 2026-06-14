"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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
      setData(dashboardData);
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

  const { totalBalance = 0, monthlyIncome = 0, monthlyExpenses = 0, chartData = [], pieData = [], balanceTrendData = [], recentTransactions = [] } = data || {};

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
              <span className={styles.icon}>💰</span>
            </div>
            <div className={styles.amount}>
              {formatCurrency(totalBalance)}
            </div>
            <div className={styles.subtitle}>Included accounts only</div>
          </div>
        </Link>

        {/* Monthly Income Card */}
        <Link href="/transactions" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.card} style={{ cursor: 'pointer' }}>
            <div className={styles.cardHeader}>
              <h3>Period Income</h3>
              <span className={styles.icon}>📈</span>
            </div>
            <div className={styles.amount} style={{ color: 'var(--sporty-teal)' }}>+{formatCurrency(monthlyIncome)}</div>
            <div className={styles.subtitle}>Selected Period</div>
          </div>
        </Link>

        {/* Monthly Expenses Card */}
        <Link href="/transactions" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.card} style={{ cursor: 'pointer' }}>
            <div className={styles.cardHeader}>
              <h3>Period Expenses</h3>
              <span className={styles.icon}>📉</span>
            </div>
            <div className={styles.amount} style={{ color: '#e11d48' }}>-{formatCurrency(monthlyExpenses)}</div>
            <div className={styles.subtitle}>Selected Period</div>
          </div>
        </Link>
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
                  formatter={(val: any) => formatCurrency(Number(val))} 
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
                    formatter={(value: any) => formatCurrency(Number(value))}
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
        <Link href="/categories" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div className={styles.chartCard} style={{ cursor: 'pointer', height: '100%' }}>
            <h3 style={{ marginBottom: isMobile ? '8px' : '16px' }}>Expenses by Category</h3>
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
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
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
        </Link>
      </div>

      <div className={styles.chartCard} style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Last Records</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recentTransactions && recentTransactions.length > 0 ? (
            recentTransactions.map((txn: any) => {
              const isIncome = txn.amount >= 0;
              const catLetter = txn.category?.name ? txn.category.name.charAt(0).toUpperCase() : "?";
              const catColor = getCategoryColor(txn.category?.name);
              
              return (
                <div key={txn.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 8px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className={styles.categoryIconSmall} style={{ background: catColor }}>
                      {catLetter}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {txn.notes || txn.category?.name || "Transaction"}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {txn.account?.name || "Unknown"} • {formatDate(txn.date)}
                        {txn.merchant && ` • ${txn.merchant}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ fontWeight: 600, color: isIncome ? 'var(--sporty-teal)' : '#e11d48', fontSize: '14px' }}>
                      {isIncome ? "+" : ""}{formatCurrency(txn.amount)}
                    </div>
                    {txn.paymentMethod && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {txn.paymentMethod}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
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

