"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { formatCurrency } from "@/utils/format";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  includeInTotal: boolean;
  isArchived: boolean;
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("");
  const [includeInTotal, setIncludeInTotal] = useState(true);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`/api/accounts?includeArchived=${showArchived}`);
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to fetch accounts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [showArchived]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          type, 
          balance: parseFloat(balance) || 0,
          includeInTotal 
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName("");
        setType("checking");
        setBalance("");
        setIncludeInTotal(true);
        fetchAccounts();
      }
    } catch (err) {
      console.error("Failed to create account", err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Accounts</h1>
          <p>Manage your bank accounts, credit cards, and cash.</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
          + Add Account
        </button>
      </div>

      <div className={styles.grid}>
        {loading ? (
          <div>Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div>No accounts found. Create one to get started!</div>
        ) : (
          accounts.map((account) => (
            <Link href={`/accounts/${account.id}`} key={account.id} className={styles.cardLink} style={{ opacity: account.isArchived ? 0.6 : 1 }}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>{account.name} {account.isArchived && <span style={{fontSize: '0.8rem', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px'}}>Archived</span>}</h2>
                  <span className={styles.typeBadge}>{account.type}</span>
                </div>
                <div className={styles.balance}>
                  {formatCurrency(account.balance)}
                </div>
                <div className={styles.footer}>
                  <span>{account.currency}</span>
                  {account.includeInTotal ? (
                    <span className={styles.included}>Included in total</span>
                  ) : (
                    <span className={styles.excluded}>Excluded from total</span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button 
          onClick={() => setShowArchived(!showArchived)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {showArchived ? "Hide Archived Accounts" : "Show Archived Accounts"}
        </button>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Create New Account</h2>
            <form onSubmit={handleCreateAccount}>
              <div className={styles.formGroup}>
                <label>Account Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  placeholder="e.g. TD Checking"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Type</label>
                <select value={type} onChange={e => setType(e.target.value)}>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Initial Balance</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={balance} 
                  onChange={e => setBalance(e.target.value)} 
                  placeholder="0.00"
                />
              </div>
              <div className={styles.checkboxGroup}>
                <input 
                  type="checkbox" 
                  id="includeInTotal"
                  checked={includeInTotal}
                  onChange={e => setIncludeInTotal(e.target.checked)}
                />
                <label htmlFor="includeInTotal" style={{ margin: 0 }}>Include in total balance</label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
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
