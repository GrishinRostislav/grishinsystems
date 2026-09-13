"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { formatCurrency } from "@/utils/format";
import { getChartDomain } from "@/utils/chart";
import ScenarioModal from "@/components/ScenarioModal";
import { addFrequency } from "@/utils/recurrence";
import { useAutoSync } from "@/hooks/useAutoSync";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

export default function ForecastPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(60); // Default 5 years
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isAccountsDropdownOpen, setIsAccountsDropdownOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Scenarios state
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [isScenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<any>(null);

  const getScenarioSummary = (scenario: any) => {
    let monthlyNet = 0;
    let oneTimeNet = 0;
    let investmentMonthly = 0;
    let investmentOneTime = 0;

    let exactTotalNet = 0;
    let exactTotalInvestment = 0;
    let exactInterestEarned = 0;
    const now = new Date();
    // Use the currently selected 'months' horizon
    const endDate = new Date(now.getFullYear(), now.getMonth() + months + 1, 1);

    scenario.items.forEach((item: any) => {
      const amt = Number(item.amount);
      const sign = item.type === 'expense' ? -1 : 1;
      const value = amt * sign;

      const interval = item.interval || 1;
      if (item.type === 'investment') {
        if (item.frequency === 'ONCE') investmentOneTime += amt;
        else if (item.frequency === 'MONTHLY') investmentMonthly += amt / interval;
        else if (item.frequency === 'YEARLY') investmentMonthly += amt / 12 / interval;
        else if (item.frequency === 'WEEKLY') {
          const days = item.daysOfWeek?.length || 1;
          investmentMonthly += (amt * days * 4.33) / interval;
        }
        else if (item.frequency === 'DAILY') investmentMonthly += (amt * 30.44) / interval;
      } else {
        if (item.frequency === 'ONCE') oneTimeNet += value;
        else if (item.frequency === 'MONTHLY') monthlyNet += value / interval;
        else if (item.frequency === 'YEARLY') monthlyNet += value / 12 / interval;
        else if (item.frequency === 'WEEKLY') {
          const days = item.daysOfWeek?.length || 1;
          monthlyNet += (value * days * 4.33) / interval;
        }
        else if (item.frequency === 'DAILY') monthlyNet += (value * 30.44) / interval;
      }

      // Calculate exact total over the projection interval
      if (item.type === 'investment') {
        const monthlyRate = (item.annualRate || 0) / 100 / 12;
        let balance = 0;
        let simDate = new Date(item.date);
        if (simDate < now) simDate = new Date(now);
        const itemEndDate = item.endDate ? new Date(item.endDate) : endDate;
        
        let monthIter = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        while (monthIter <= endDate) {
          let depositsThisMonth = 0;
          const currentMonthStart = new Date(monthIter.getFullYear(), monthIter.getMonth() - 1, 1);
          
          while (simDate < monthIter && simDate <= itemEndDate) {
            if (simDate >= currentMonthStart) {
              depositsThisMonth += amt;
            }
            if (item.frequency === 'ONCE') {
              simDate = new Date(8640000000000000);
            } else {
              simDate = addFrequency(simDate, item.frequency, item.interval || 1, item.daysOfWeek, item.monthsOfYear);
            }
          }
          
          balance += depositsThisMonth;
          const interest = balance * monthlyRate;
          balance += interest;
          
          exactInterestEarned += interest;
          exactTotalInvestment += depositsThisMonth;
          monthIter = new Date(monthIter.getFullYear(), monthIter.getMonth() + 1, 1);
        }
      } else {
        let simDate = new Date(item.date);
        if (simDate < now) simDate = new Date(now);
        const itemEndDate = item.endDate ? new Date(item.endDate) : endDate;
        
        let occurrences = 0;
        while(simDate < endDate && simDate <= itemEndDate) {
          occurrences++;
          if (item.frequency === 'ONCE') break;
          simDate = addFrequency(simDate, item.frequency, item.interval || 1, item.daysOfWeek, item.monthsOfYear);
        }
        exactTotalNet += amt * sign * occurrences;
      }
    });

    const parts = [];
    if (monthlyNet !== 0) {
      parts.push(<span key="m" style={{ color: monthlyNet > 0 ? 'var(--sporty-teal)' : '#b91c1c', fontWeight: 600 }}>{monthlyNet > 0 ? '+' : ''}{formatCurrency(Math.abs(monthlyNet), data?.homeCurrency)}/mo</span>);
    }
    if (oneTimeNet !== 0) {
      parts.push(<span key="o" style={{ color: oneTimeNet > 0 ? 'var(--sporty-teal)' : '#b91c1c', fontWeight: 600 }}>{oneTimeNet > 0 ? '+' : ''}{formatCurrency(Math.abs(oneTimeNet), data?.homeCurrency)} (once)</span>);
    }
    if (investmentMonthly !== 0 || investmentOneTime !== 0) {
      parts.push(<span key="i" style={{ color: 'var(--unique-blue)', fontWeight: 600 }}>Inv: {investmentMonthly > 0 ? `${formatCurrency(investmentMonthly, data?.homeCurrency)}/mo` : `${formatCurrency(investmentOneTime, data?.homeCurrency)} (once)`}</span>);
    }

    if (parts.length === 0) return <span style={{ color: 'var(--text-muted)' }}>No financial impact</span>;
    
    return (
      <div style={{ marginTop: '4px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
          {parts.map((part, i) => (
            <span key={i}>
              {i > 0 && <span style={{ color: 'var(--border-color)', margin: '0 4px' }}>|</span>}
              {part}
            </span>
          ))}
        </div>
        
        {(exactTotalNet !== 0 || exactTotalInvestment !== 0) && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', marginBottom: '2px' }}>Total impact over {months >= 12 ? `${months/12} yrs` : `${months} mo`}:</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {exactTotalNet !== 0 && (
                <span style={{ color: exactTotalNet > 0 ? 'var(--sporty-teal)' : '#b91c1c', fontWeight: 600 }}>
                  {exactTotalNet > 0 ? 'Earned: +' : 'Spent: -'}{formatCurrency(Math.abs(exactTotalNet), data?.homeCurrency)}
                </span>
              )}
              {exactTotalInvestment !== 0 && (
                <span style={{ color: 'var(--unique-blue)', fontWeight: 600 }}>
                  Invested: {formatCurrency(exactTotalInvestment, data?.homeCurrency)}
                  {exactInterestEarned > 0 && (
                    <span style={{ color: 'var(--sporty-teal)', marginLeft: '6px' }}>
                      (+{formatCurrency(exactInterestEarned, data?.homeCurrency)} interest)
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const [pastMonths, setPastMonths] = useState(6);

  const fetchForecast = async (m: number, pastM: number, accountsFilter: string[], isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      let url = `/cashFlow/api/forecast?months=${m}&pastMonths=${pastM}`;
      if (accountsFilter.length > 0) {
        url += `&accountIds=${accountsFilter.join(',')}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const fetchScenarios = async () => {
    try {
      const res = await fetch("/cashFlow/api/scenarios");
      const json = await res.json();
      setScenarios(json.scenarios || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/cashFlow/api/accounts");
      const json = await res.json();
      setAvailableAccounts(json);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchScenarios();

    // Load saved preferences
    const savedMonths = localStorage.getItem("forecast_months");
    if (savedMonths) setMonths(Number(savedMonths));

    const savedAccounts = localStorage.getItem("forecast_accounts");
    if (savedAccounts) {
      try {
        setSelectedAccounts(JSON.parse(savedAccounts));
      } catch (e) {
        console.error("Failed to parse saved accounts", e);
      }
    }
    
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("forecast_months", months.toString());
      localStorage.setItem("forecast_accounts", JSON.stringify(selectedAccounts));
      fetchForecast(months, pastMonths, selectedAccounts);
    }
  }, [months, pastMonths, selectedAccounts, isInitialized]);

  useAutoSync(() => {
    if (isInitialized) {
      fetchForecast(months, pastMonths, selectedAccounts, true);
    }
  });

  const handleToggleScenario = async (id: string, currentActive: boolean) => {
    try {
      setScenarios(scenarios.map(s => s.id === id ? { ...s, isActive: !currentActive } : s));
      await fetch(`/cashFlow/api/scenarios/${id}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive })
      });
      fetchForecast(months, pastMonths, selectedAccounts);
    } catch (err) {
      console.error(err);
      fetchScenarios();
    }
  };

  const handleDeleteScenario = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scenario?")) return;
    try {
      await fetch(`/cashFlow/api/scenarios/${id}`, {
        method: 'DELETE'
      });
      setScenarioModalOpen(false);
      fetchScenarios();
      fetchForecast(months, pastMonths, selectedAccounts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveScenario = () => {
    fetchScenarios();
    fetchForecast(months, pastMonths, selectedAccounts);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const isHistory = dataPoint.isHistory;

      return (
        <div style={{ background: 'var(--bg-primary)', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              textTransform: 'uppercase',
              background: isHistory ? 'rgba(99, 102, 241, 0.15)' : 'rgba(37, 99, 235, 0.15)',
              color: isHistory ? '#6366f1' : 'var(--unique-blue)'
            }}>
              {isHistory ? "Past History" : "Forecast"}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{dataPoint.displayDate}</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                {isHistory ? "Recorded Balance" : "Baseline Forecast"}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: isHistory ? '#6366f1' : 'var(--unique-blue)' }}>
                {formatCurrency(dataPoint.balance, data?.homeCurrency)}
              </span>
            </div>

            {dataPoint.simulatedBalance !== null && dataPoint.simulatedBalance !== undefined && (() => {
              const isPositive = data?.futureBalance >= data?.baselineFutureBalance;
              const simColor = isPositive ? "var(--sporty-teal)" : "#b91c1c";
              
              return (
                <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.8rem', color: simColor, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                    Simulated Balance
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: simColor }}>
                    {formatCurrency(dataPoint.simulatedBalance, data?.homeCurrency)}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Financial Forecast</h1>
        <p>See your projected wealth based on past trends and future plans.</p>
      </div>

      <div className={styles.controls} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Past History:</span>
          <select 
            className={styles.select} 
            value={pastMonths} 
            onChange={(e) => setPastMonths(Number(e.target.value))}
          >
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>1 Year</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Projection Horizon:</span>
          <select 
            className={styles.select} 
            value={months} 
            onChange={(e) => setMonths(Number(e.target.value))}
          >
            <option value={6}>6 Months</option>
            <option value={12}>1 Year</option>
            <option value={36}>3 Years</option>
            <option value={60}>5 Years</option>
            <option value={120}>10 Years</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Accounts:</span>
          <div 
            className={styles.select}
            style={{ cursor: 'pointer', minWidth: '200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => setIsAccountsDropdownOpen(!isAccountsDropdownOpen)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedAccounts.length === 0 
                ? 'All Included Accounts' 
                : `${selectedAccounts.length} Account(s) Selected`}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          {isAccountsDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '80px',
              marginTop: '4px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: 'var(--shadow-md)',
              zIndex: 100,
              minWidth: '220px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <div 
                style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                onClick={() => setSelectedAccounts([])}
              >
                <input 
                  type="checkbox" 
                  checked={selectedAccounts.length === 0} 
                  readOnly 
                />
                <span style={{ fontWeight: 600 }}>All Included Accounts</span>
              </div>
              {availableAccounts.map(acc => {
                const isSelected = selectedAccounts.includes(acc.id);
                return (
                  <div 
                    key={acc.id} 
                    style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedAccounts(selectedAccounts.filter(id => id !== acc.id));
                      } else {
                        setSelectedAccounts([...selectedAccounts, acc.id]);
                      }
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      readOnly 
                    />
                    <span>{acc.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Calculating financial trajectory...</div>
      ) : (
        <>
          <div className={styles.summaryCards}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Current Total Balance</div>
              <div className={styles.cardValue} style={{ color: 'var(--unique-blue)' }}>
                {formatCurrency(data?.currentBalance || 0, data?.homeCurrency)}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Avg Monthly Income</div>
              <div className={styles.cardValue} style={{ color: 'var(--sporty-teal)' }}>
                {formatCurrency(data?.avgMonthlyIncome || 0, data?.homeCurrency)}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Avg Monthly Expense</div>
              <div className={styles.cardValue} style={{ color: '#ef4444' }}>
                {formatCurrency(data?.avgMonthlyExpense || 0, data?.homeCurrency)}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Projected Net Monthly</div>
              <div className={styles.cardValue} style={{ 
                color: ((data?.avgMonthlyIncome || 0) - (data?.avgMonthlyExpense || 0)) >= 0 ? 'var(--sporty-teal)' : '#b91c1c' 
              }}>
                {formatCurrency((data?.avgMonthlyIncome || 0) - (data?.avgMonthlyExpense || 0), data?.homeCurrency)}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>3-Mo Safety Cushion</div>
              <div className={styles.cardValue} style={{ color: '#6366f1' }}>
                {formatCurrency(data?.emergencyBuffer || ((data?.avgMonthlyExpense || 0) * 3), data?.homeCurrency)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                3x avg monthly expenses
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Projected Balance in {months >= 12 ? `${months/12} Yrs` : `${months} Mo`}</div>
              <div className={styles.cardValue} style={{ 
                color: data?.hasActiveScenarios 
                  ? (data?.futureBalance >= data?.baselineFutureBalance ? 'var(--sporty-teal)' : '#b91c1c') 
                  : 'var(--unique-blue)' 
              }}>
                {formatCurrency(data?.futureBalance || 0, data?.homeCurrency)}
              </div>
              {data?.hasActiveScenarios && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Baseline: {formatCurrency(data?.baselineFutureBalance || 0, data?.homeCurrency)}
                </div>
              )}
            </div>
          </div>

          <div className={styles.chartContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <h2 className={styles.chartTitle} style={{ margin: 0 }}>Wealth Trajectory</h2>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '3px', background: '#6366f1', borderRadius: '2px' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Past History</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '3px', background: 'var(--unique-blue)', borderRadius: '2px' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Forecast</span>
                </div>
                {data?.hasActiveScenarios && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '3px', background: data?.futureBalance >= data?.baselineFutureBalance ? 'var(--sporty-teal)' : '#b91c1c', borderRadius: '2px' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Simulation</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.chartWrapper}>
              <ResponsiveContainer>
                <AreaChart data={data?.chartData || []} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--unique-blue)" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="var(--unique-blue)" stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="colorSimulated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--sporty-teal)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--sporty-teal)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false}
                    minTickGap={25}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => {
                      const prefix = data?.homeCurrency === 'EUR' ? '€' : (data?.homeCurrency === 'GBP' ? '£' : '$');
                      return `${prefix}${(val / 1000).toFixed(0)}k`;
                    }}
                    domain={getChartDomain}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Vertical TODAY Divider */}
                  {data?.chartData && (
                    <ReferenceLine 
                      x={data.chartData.find((d: any) => !d.isHistory)?.displayDate} 
                      stroke="#10b981" 
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      label={{ position: 'top', value: 'TODAY', fill: '#10b981', fontSize: 11, fontWeight: 700 }}
                    />
                  )}
                  
                  {/* PAST HISTORY: Indigo/Slate Solid Area */}
                  <Area 
                    type="monotone" 
                    dataKey="historyBalance" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorHistory)" 
                    activeDot={{ r: 6, fill: '#6366f1' }}
                    connectNulls
                  />
                  
                  {/* FORECAST BASELINE: Dashed Unique Blue Area */}
                  <Area 
                    type="monotone" 
                    dataKey="forecastBalance" 
                    stroke="var(--unique-blue)" 
                    strokeWidth={3}
                    strokeDasharray={data?.hasActiveScenarios ? "5 5" : undefined}
                    fillOpacity={data?.hasActiveScenarios ? 0 : 1} 
                    fill={data?.hasActiveScenarios ? "transparent" : "url(#colorBalance)"} 
                    activeDot={{ r: 7, fill: 'var(--unique-blue)' }}
                    connectNulls
                  />
                  
                  {/* SIMULATION: Active Scenarios */}
                  {data?.hasActiveScenarios && (() => {
                    const isPositive = data.futureBalance >= data.baselineFutureBalance;
                    const simColor = isPositive ? "var(--sporty-teal)" : "#b91c1c";
                    
                    return (
                      <Area 
                        type="monotone" 
                        dataKey="simulatedBalance" 
                        stroke={simColor} 
                        strokeWidth={3}
                        fillOpacity={0.2} 
                        fill={simColor} 
                        activeDot={{ r: 7, fill: simColor }}
                        connectNulls
                      />
                    );
                  })()}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartContainer} style={{ marginTop: '32px' }}>
            <div className={styles.scenariosHeader}>
              <div>
                <h2 className={styles.chartTitle} style={{ marginBottom: '8px' }}>Simulation Scenarios</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
                  Toggle potential future plans (like buying a car) to see how they impact your forecast.
                </p>
              </div>
              <button 
                onClick={() => { setEditingScenario(null); setScenarioModalOpen(true); }}
                className={styles.btnScenario}
              >
                + New Scenario
              </button>
            </div>

            {scenarios.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)' }}>You haven't created any scenarios yet.</p>
              </div>
            ) : (
              <div className={styles.scenariosGrid}>
                {scenarios.map((scenario) => {
                  const rec = data?.scenarioRecommendations?.[scenario.id];

                  return (
                    <div 
                      key={scenario.id} 
                      className={`${styles.scenarioCard} ${scenario.isActive ? styles.scenarioCardActive : ''}`}
                    >
                      <div className={styles.scenarioHeader}>
                        <h3 className={styles.scenarioTitle}>{scenario.name}</h3>
                        <label className={styles.switch}>
                          <input 
                            type="checkbox" 
                            checked={scenario.isActive}
                            onChange={() => handleToggleScenario(scenario.id, scenario.isActive)}
                          />
                          <span className={styles.slider}></span>
                        </label>
                      </div>
                      <div className={styles.scenarioItemsCount} style={{ marginBottom: '0' }}>
                        {scenario.items.length} impact item{scenario.items.length !== 1 ? 's' : ''}
                      </div>
                      {getScenarioSummary(scenario)}

                      {/* Smart Purchase Timing Advisor Box */}
                      {rec && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px',
                          borderRadius: '10px',
                          fontSize: '0.85rem',
                          background: rec.status === 'OPTIMAL' 
                            ? 'rgba(16, 185, 129, 0.08)' 
                            : (rec.status === 'WAIT_AND_SAVE' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)'),
                          border: `1px solid ${
                            rec.status === 'OPTIMAL' 
                              ? 'rgba(16, 185, 129, 0.3)' 
                              : (rec.status === 'WAIT_AND_SAVE' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)')
                          }`,
                          color: 'var(--text-main)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px', color: rec.status === 'OPTIMAL' ? '#059669' : (rec.status === 'WAIT_AND_SAVE' ? '#d97706' : '#dc2626') }}>
                            <span>
                              {rec.status === 'OPTIMAL' ? '💡 Советник: Отличный момент' : (rec.status === 'WAIT_AND_SAVE' ? '⏳ Советник: Рекомендуется накопить' : '⚠️ Советник: Высокий риск')}
                            </span>
                          </div>
                          <div style={{ lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                            {rec.recommendationText}
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={() => { setEditingScenario(scenario); setScenarioModalOpen(true); }}
                        className={styles.btnOutline}
                        style={{ marginTop: '16px' }}
                      >
                        Edit Details
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <ScenarioModal 
        isOpen={isScenarioModalOpen}
        onClose={() => setScenarioModalOpen(false)}
        scenario={editingScenario}
        onSave={handleSaveScenario}
        onDelete={editingScenario ? () => handleDeleteScenario(editingScenario.id) : undefined}
      />
    </div>
  );
}
