"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { formatCurrency } from "@/utils/format";
import ScenarioModal from "@/components/ScenarioModal";
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
          <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: dataPoint.isHistory ? 'var(--text-main)' : 'var(--unique-blue)' }}>
            {formatCurrency(dataPoint.balance, data?.homeCurrency)}
          </p>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {dataPoint.isHistory ? "Historical" : "Projected"}
          </span>
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
              <div className={styles.cardValue} style={{ color: 'var(--unique-blue)' }}>
                {formatCurrency(data?.futureBalance || 0, data?.homeCurrency)}
              </div>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <h2 className={styles.chartTitle}>Wealth Trajectory</h2>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <AreaChart data={data?.chartData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--unique-blue)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--unique-blue)" stopOpacity={0}/>
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
                  
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="var(--unique-blue)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                    activeDot={{ r: 8, strokeWidth: 0, fill: 'var(--unique-blue)' }}
                  />
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
                    <div className={styles.scenarioItemsCount}>
                      {scenario.items.length} impact item{scenario.items.length !== 1 ? 's' : ''}
                    </div>
                    <button 
                      onClick={() => { setEditingScenario(scenario); setScenarioModalOpen(true); }}
                      className={styles.btnOutline}
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
