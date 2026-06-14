"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import GlobalDateFilter from "@/components/GlobalDateFilter";
import { formatCurrency } from "@/utils/format";

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

  useEffect(() => {
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
    fetchDashboardData();
  }, [startDate, endDate]);

  const { totalBalance = 0, monthlyIncome = 0, monthlyExpenses = 0, chartData = [], pieData = [], balanceTrendData = [] } = data || {};

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
        <h3 style={{ marginBottom: '16px' }}>Balance Trend</h3>
        <div style={{ width: '100%', height: 300 }}>
          {balanceTrendData && balanceTrendData.length > 0 ? (
            <ResponsiveContainer>
              <AreaChart data={balanceTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalanceTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D5D7B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2D5D7B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${Number(val).toFixed(0)}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  formatter={(val: any) => formatCurrency(Number(val))} 
                />
                <Legend verticalAlign="top" height={36}/>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Income vs Expenses</h3>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isCumulative} 
                onChange={(e) => handleCumulativeChange(e.target.checked)} 
                style={{ marginRight: '8px' }}
              />
              Cumulative
            </label>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {processedChartData && processedChartData.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={processedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value).toFixed(0)}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Legend verticalAlign="top" height={36}/>
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
            <h3>Expenses by Category (This Month)</h3>
            <div style={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center' }}>
              {pieData && pieData.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={true}
                      label={({ name, percent, x, y, cx }) => (
                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                          {`${((percent || 0) * 100).toFixed(0)}%`}
                        </text>
                      )}
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
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
        </>
      )}
    </div>
  );
}

