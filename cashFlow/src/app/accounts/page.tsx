"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { formatCurrency } from "@/utils/format";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  includeInTotal: boolean;
  isArchived: boolean;
  order: number;
};

function SortableAccountCard({ account, isReordering }: { account: Account, isReordering: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: account.id, disabled: !isReordering });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: account.isArchived ? 0.6 : 1,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as const,
  };

  const cardContent = (
    <div className={styles.card} style={{ cursor: isReordering ? 'grab' : 'pointer', boxShadow: isDragging ? 'var(--shadow-lg)' : undefined }}>
      <div className={styles.cardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isReordering && (
            <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </div>
          )}
          <h2>{account.name} {account.isArchived && <span style={{fontSize: '0.8rem', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px'}}>Archived</span>}</h2>
        </div>
        <span className={styles.typeBadge}>{account.type}</span>
      </div>
      <div className={styles.balance}>
        {formatCurrency(account.balance, account.currency)}
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
  );

  return (
    <div ref={setNodeRef} style={style}>
      {isReordering ? (
        cardContent
      ) : (
        <Link href={`/accounts/${account.id}`} className={styles.cardLink}>
          {cardContent}
        </Link>
      )}
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("CAD");
  const [includeInTotal, setIncludeInTotal] = useState(true);

  // Global settings
  const [homeCurrency, setHomeCurrency] = useState("CAD");
  const [totalBalance, setTotalBalance] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetch("/cashFlow/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.homeCurrency) {
          setHomeCurrency(data.homeCurrency);
          setCurrency(data.homeCurrency);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const fetchAccounts = async () => {
    try {
      const [accRes, dashRes] = await Promise.all([
        fetch(`/cashFlow/api/accounts?includeArchived=${showArchived}`),
        fetch("/cashFlow/api/dashboard")
      ]);
      const accData = await accRes.json();
      const dashData = await dashRes.json();
      setAccounts(accData);
      if (dashData && dashData.totalBalance !== undefined) {
        setTotalBalance(dashData.totalBalance);
      }
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
      const res = await fetch("/cashFlow/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          type, 
          balance: parseFloat(balance) || 0,
          currency,
          includeInTotal 
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName("");
        setType("checking");
        setBalance("");
        setCurrency(homeCurrency);
        setIncludeInTotal(true);
        fetchAccounts();
      }
    } catch (err) {
      console.error("Failed to create account", err);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setAccounts((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const orderedIds = accounts.map(a => a.id);
      await fetch("/cashFlow/api/accounts/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds })
      });
    } catch (err) {
      console.error("Failed to save order", err);
    } finally {
      setIsSavingOrder(false);
      setIsReordering(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header} style={{ alignItems: 'flex-start' }}>
        <div>
          <h1>Accounts</h1>
          <p>Manage your bank accounts, credit cards, and cash.</p>
          {totalBalance !== null && (
            <div style={{ marginTop: '16px', padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: '12px', display: 'inline-block', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Balance</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--unique-blue)' }}>{formatCurrency(totalBalance, homeCurrency)}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
          {isReordering ? (
            <button className={styles.btnPrimary} onClick={saveOrder} disabled={isSavingOrder}>
              {isSavingOrder ? 'Saving...' : 'Save Order'}
            </button>
          ) : (
            <button className={styles.btnSecondary} onClick={() => setIsReordering(true)} disabled={accounts.length === 0}>
              Reorder
            </button>
          )}
          <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
            + Add Account
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className={styles.grid}>
          {loading ? (
            <div>Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div>No accounts found. Create one to get started!</div>
          ) : (
            <SortableContext items={accounts.map(a => a.id)} strategy={rectSortingStrategy}>
              {accounts.map((account) => (
                <SortableAccountCard key={account.id} account={account} isReordering={isReordering} />
              ))}
            </SortableContext>
          )}
        </div>
      </DndContext>

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
                <label>Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="RUB">RUB - Russian Ruble</option>
                  <option value="KZT">KZT - Kazakhstani Tenge</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AUD">AUD - Australian Dollar</option>
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

