"use client";

import { useEffect, useState, use } from "react";
import styles from "./page.module.css";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlobalDateFilter from "@/components/GlobalDateFilter";
import TransactionModal from "@/components/TransactionModal";
import { formatCurrency, formatDate } from "@/utils/format";

export default function AccountDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBalance, setEditBalance] = useState("");
  const [editCurrency, setEditCurrency] = useState("CAD");
  const [editInclude, setEditInclude] = useState(true);
  
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const openTransactionModal = (txn: any) => {
    setSelectedTransaction(txn);
    setIsTxnModalOpen(true);
  };

  const handleDatesChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const openEditModal = () => {
    setEditName(data.account.name);
    setEditBalance(data.account.balance.toString());
    setEditCurrency(data.account.currency);
    setEditInclude(data.account.includeInTotal);
    setIsEditModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/cashFlow/api/accounts/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: editName, 
          balance: parseFloat(editBalance),
          currency: editCurrency,
          includeInTotal: editInclude
        })
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        // re-fetch to reflect changes
        const res2 = await fetch(`/cashFlow/api/accounts/${resolvedParams.id}?startDate=${startDate}&endDate=${endDate}`);
        setData(await res2.json());
      }
    } catch (error) {
      console.error("Failed to save account", error);
    }
  };

  const handleArchiveAccount = async () => {
    if (!confirm("Are you sure you want to archive this account? It will be hidden from new transactions but past history will be preserved.")) return;
    try {
      const res = await fetch(`/cashFlow/api/accounts/${resolvedParams.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAccountData();
      }
    } catch (error) {
      console.error("Failed to archive account", error);
    }
  };

  const handleRestoreAccount = async () => {
    try {
      const res = await fetch(`/cashFlow/api/accounts/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" })
      });
      if (res.ok) {
        fetchAccountData();
      }
    } catch (error) {
      console.error("Failed to restore account", error);
    }
  };

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/cashFlow/api/accounts/${resolvedParams.id}?startDate=${startDate}&endDate=${endDate}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchAccountData();
    }
  }, [resolvedParams.id, startDate, endDate]);

  if (!loading && (!data || data.error)) return <div className={styles.container}><h1>Account Not Found</h1></div>;

  const { account, periodIncome, periodExpenses, chartData, transactions } = data || {};

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 className={styles.title}>{account?.name || "Loading..."}</h1>
            {account && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={openEditModal} style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                  Edit
                </button>
                {account.isArchived ? (
                  <button onClick={handleRestoreAccount} style={{ background: '#ecfdf5', border: '1px solid #10b981', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: '#047857', whiteSpace: 'nowrap' }}>
                    Restore Account
                  </button>
                ) : (
                  <button onClick={handleArchiveAccount} style={{ background: '#fff1f2', border: '1px solid #f43f5e', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: '#be123c', whiteSpace: 'nowrap' }}>
                    Delete Account
                  </button>
                )}
              </div>
            )}
          </div>
          {account && <p className={styles.subtitle}>{account.type} • {account.currency}</p>}
        </div>
        <GlobalDateFilter onDatesChange={handleDatesChange} />
      </div>

      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading Account Details...</div>
      ) : (
        <>

      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '400px', maxWidth: '90%' }}>
            <h2>Edit Account</h2>
            <form onSubmit={handleSaveAccount}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Account Name</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Current Balance (Any change adds a correction transaction)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={editBalance} 
                  onChange={e => setEditBalance(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Currency</label>
                <select 
                  value={editCurrency} 
                  onChange={e => setEditCurrency(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white' }}
                >
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="RUB">RUB - Russian Ruble</option>
                  <option value="KZT">KZT - Kazakhstani Tenge</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="editInclude"
                  checked={editInclude} 
                  onChange={e => setEditInclude(e.target.checked)} 
                />
                <label htmlFor="editInclude" style={{ color: 'var(--text-main)', cursor: 'pointer' }}>Include in total balance</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--unique-blue)', color: 'white', border: 'none', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Current Balance</h3>
          </div>
          <div className={styles.amount}>
            {formatCurrency(account.balance, account.currency)}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Period Income</h3>
          </div>
          <div className={styles.amount} style={{ color: 'var(--sporty-teal)' }}>
            +{formatCurrency(periodIncome, account.currency)}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Period Expenses</h3>
          </div>
          <div className={styles.amount} style={{ color: '#e11d48' }}>
            -{formatCurrency(periodExpenses, account.currency)}
          </div>
        </div>
      </div>

      <div className={styles.chartCard}>
        <h3 style={{ marginBottom: '16px' }}>Balance History</h3>
        <div className={styles.chartWrapper}>
          {chartData.length > 0 ? (
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D5D7B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2D5D7B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${Number(val).toFixed(0)}`} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => formatCurrency(Number(val), account.currency)} />
                <Area type="monotone" dataKey="balance" stroke="#2D5D7B" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.emptyState}>No balance history for this period.</div>
          )}
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Merchant</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((txn: any) => (
                <tr key={txn.id} onClick={() => openTransactionModal(txn)} style={{ cursor: 'pointer' }}>
                  <td>{formatDate(txn.date)}</td>
                  <td>{txn.merchant}</td>
                  <td>{txn.category?.name || "Uncategorized"}</td>
                  <td className={txn.amount >= 0 ? styles.amountIncome : styles.amountExpense}>
                    {txn.amount >= 0 ? "+" : ""}{formatCurrency(txn.amount, account.currency)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className={styles.emptyState}>
                  No transactions found in this date range.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot style={{ background: 'var(--bg-secondary)', fontWeight: 600 }}>
            <tr>
              <td colSpan={3} style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Total for Period:</td>
              <td style={{ padding: '12px 16px', color: (periodIncome - periodExpenses) >= 0 ? 'var(--sporty-teal)' : '#e11d48' }}>
                {(periodIncome - periodExpenses) >= 0 ? "+" : ""}{formatCurrency(periodIncome - periodExpenses, account.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <TransactionModal 
        isOpen={isTxnModalOpen} 
        onClose={() => setIsTxnModalOpen(false)} 
        transaction={selectedTransaction} 
        onSave={fetchAccountData} 
      />
        </>
      )}
    </div>
  );
}
