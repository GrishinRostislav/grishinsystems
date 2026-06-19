"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { formatCurrency } from "@/utils/format";
import { getChartDomain } from "@/utils/chart";
import ScenarioModal from "@/components/ScenarioModal";
import { addFrequency } from "@/utils/recurrence";
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

  const fetchForecast = async (m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/cashFlow/api/forecast?months=${m}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchForecast(months);
    fetchScenarios();
  }, [months]);

  const handleToggleScenario = async (id: string, currentActive: boolean) => {
    try {
      // optimistic UI update
      setScenarios(scenarios.map(s => s.id === id ? { ...s, isActive: !currentActive } : s));
      await fetch(`/cashFlow/api/scenarios/${id}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive })
      });
      fetchForecast(months); // refetch forecast
    } catch (err) {
      console.error(err);
      fetchScenarios(); // revert on fail
    }
  };

  const handleSaveScenario = () => {
    fetchScenarios();
    fetchForecast(months);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div style={{ background: 'var(--bg-primary)', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: 'var(--text-secondary)' }}>{dataPoint.displayDate}</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>
                {dataPoint.isHistory ? "Historical Balance" : "Baseline Forecast"}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: dataPoint.isHistory ? 'var(--text-main)' : 'var(--unique-blue)' }}>
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

      <div className={styles.controls}>
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

      {loading && !data ? (
        <div className={styles.loading}>Generating your financial forecast...</div>
      ) : (
        <>
          <div className={styles.summaryCards}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Current Total Balance</div>
              <div className={styles.cardValue}>
                {formatCurrency(data?.currentBalance || 0, data?.homeCurrency)}
              </div>
            </div>
            
            <div className={styles.card}>
              <div className={styles.cardTitle}>Avg. Projected Monthly Income</div>
              <div className={`${styles.cardValue} ${styles.cardValueIncome}`}>
                +{formatCurrency(data?.avgMonthlyIncome || 0, data?.homeCurrency)}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Avg. Projected Monthly Expenses</div>
              <div className={`${styles.cardValue} ${styles.cardValueExpense}`}>
                -{formatCurrency(data?.avgMonthlyExpense || 0, data?.homeCurrency)}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Projected Balance in {months >= 12 ? `${months/12} Years` : `${months} Months`}</div>
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
            <h2 className={styles.chartTitle}>Wealth Trajectory</h2>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer>
                <AreaChart data={data?.chartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--unique-blue)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--unique-blue)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSimulated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--sporty-teal)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--sporty-teal)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                    minTickGap={30}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => {
                      const prefix = data?.homeCurrency === 'EUR' ? '€' : (data?.homeCurrency === 'GBP' ? '£' : '$');
                      return `${prefix}${(val / 1000).toFixed(0)}k`;
                    }}
                    domain={getChartDomain}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Find the index where future starts to draw a reference line */}
                  {data?.chartData && (
                    <ReferenceLine 
                      x={data.chartData.find((d: any) => !d.isHistory)?.displayDate} 
                      stroke="var(--sporty-teal)" 
                      strokeDasharray="3 3" 
                      label={{ position: 'top', value: 'Today', fill: 'var(--sporty-teal)', fontSize: 12, fontWeight: 600 }}
                    />
                  )}
                  
                  {/* BASELINE: Always Unique Blue */}
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="var(--unique-blue)" 
                    strokeWidth={data?.hasActiveScenarios ? 2 : 3}
                    strokeDasharray={data?.hasActiveScenarios ? "5 5" : undefined}
                    fillOpacity={data?.hasActiveScenarios ? 0 : 1} 
                    fill={data?.hasActiveScenarios ? "transparent" : "url(#colorBalance)"} 
                    activeDot={{ r: data?.hasActiveScenarios ? 4 : 8, strokeWidth: 0, fill: 'var(--unique-blue)' }}
                  />
                  
                  {/* SIMULATION: Red if negative impact, Green if positive impact */}
                  {data?.hasActiveScenarios && (() => {
                    const isPositive = data.futureBalance >= data.baselineFutureBalance;
                    const simColor = isPositive ? "var(--sporty-teal)" : "#b91c1c"; // Darkish red
                    
                    return (
                      <Area 
                        type="monotone" 
                        dataKey="simulatedBalance" 
                        stroke={simColor} 
                        strokeWidth={3}
                        fillOpacity={0.15} 
                        fill={simColor} 
                        activeDot={{ r: 8, strokeWidth: 0, fill: simColor }}
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
                {scenarios.map((scenario) => (
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
                    <button 
                      onClick={() => { setEditingScenario(scenario); setScenarioModalOpen(true); }}
                      className={styles.btnOutline}
                      style={{ marginTop: '16px' }}
                    >
                      Edit Details
                    </button>
                  </div>
                ))}
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
      />
    </div>
  );
}
