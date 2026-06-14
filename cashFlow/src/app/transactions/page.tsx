"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Papa from "papaparse";
import GlobalDateFilter from "@/components/GlobalDateFilter";
import TransactionModal from "@/components/TransactionModal";
import ReceiptPreviewModal from "@/components/ReceiptPreviewModal";
import { formatCurrency, formatDate } from "@/utils/format";

type Transaction = {
  id: string;
  amount: number;
  date: string;
  merchant: string | null;
  paymentMethod: string | null;
  notes: string | null;
  account: { name: string } | null;
  category: { name: string } | null;
};

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredTransactions = transactions.filter(txn => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (txn.merchant?.toLowerCase() || "").includes(query) ||
      (txn.notes?.toLowerCase() || "").includes(query) ||
      (txn.category?.name?.toLowerCase() || "").includes(query) ||
      (txn.paymentMethod?.toLowerCase() || "").includes(query) ||
      (txn.account?.name?.toLowerCase() || "").includes(query)
    );
  });

  // Group transactions by date string for mobile list view
  const groupedTransactions: { [dateStr: string]: Transaction[] } = {};
  filteredTransactions.forEach(txn => {
    const formattedDate = formatDate(txn.date);
    if (!groupedTransactions[formattedDate]) {
      groupedTransactions[formattedDate] = [];
    }
    groupedTransactions[formattedDate].push(txn);
  });

  const handleDatesChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Scan State
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanData, setScanData] = useState<any | null>(null);
  const [scanning, setScanning] = useState(false);

  const openCreateModal = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const openEditModal = (txn: Transaction) => {
    setSelectedTransaction(txn);
    setIsModalOpen(true);
  };

  const fetchData = async () => {
    try {
      const [txRes] = await Promise.all([
        fetch(startDate && endDate ? `/cashFlow/api/transactions?startDate=${startDate}&endDate=${endDate}` : "/cashFlow/api/transactions")
      ]);
      const txData = await txRes.json();
      
      setTransactions(txData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        // Here we map the CSV headers to our API schema
        const parsedData = results.data.map((row: any) => ({
          date: new Date(row.date || new Date()).toISOString(),
          amount: parseFloat(row.amount || 0),
          merchant: row.merchant || "",
          paymentMethod: row.paymentMethod || "",
          notes: row.notes || "",
          accountId: "TODO_ACCOUNT_ID" 
        }));

        console.log("Parsed CSV:", parsedData);
        alert("CSV parsed! Ready to send to API once we add an Account selector.");
      }
    });
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Transactions</h1>
          <p>Manage and import your financial records.</p>
        </div>
        <div className={styles.headerRight}>
          <GlobalDateFilter onDatesChange={handleDatesChange} />
          <div className={styles.actions}>
            <label className={`${styles.btnSecondary} ${scanning ? styles.disabled : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: scanning ? 'not-allowed' : 'pointer' }}>
              {scanning ? "🤖 Analyzing..." : "📸 Scan Receipt"}
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: "none" }} 
                onChange={handleReceiptUpload} 
                disabled={scanning}
              />
            </label>
            <label className={styles.btnSecondary}>
              Upload CSV
              <input 
                type="file" 
                accept=".csv" 
                style={{ display: "none" }} 
                onChange={handleFileUpload} 
              />
            </label>
            <button className={styles.btnPrimary} onClick={openCreateModal}>
              + Add Manual
            </button>
          </div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <input 
          type="text" 
          placeholder="Search by merchant, description, category, account or payment method..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableContainer}>
        {loading && !transactions.length ? (
          <div className={styles.emptyState}>Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className={styles.emptyState}>No transactions found. Add one or upload a CSV.</div>
        ) : filteredTransactions.length === 0 ? (
          <div className={styles.emptyState}>No transactions match your search query.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Merchant</th>
                <th>Description</th>
                <th>Category</th>
                <th>Account</th>
                <th>Payment Method</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn: any) => (
                <tr key={txn.id} onClick={() => openEditModal(txn)} style={{ cursor: 'pointer' }} className={styles.tableRow}>
                  <td>{formatDate(txn.date)}</td>
                  <td>{txn.merchant || "-"}</td>
                  <td>{txn.notes || "-"}</td>
                  <td>{txn.category?.name || "Uncategorized"}</td>
                  <td>{txn.account?.name || "Unknown"}</td>
                  <td>{txn.paymentMethod || "-"}</td>
                  <td className={txn.amount >= 0 ? styles.amountIncome : styles.amountExpense}>
                    {txn.amount >= 0 ? "+" : ""}{formatCurrency(txn.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ background: 'var(--bg-secondary)', fontWeight: 600 }}>
              <tr>
                <td colSpan={6} style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Total for Period:</td>
                <td style={{ padding: '12px 16px', color: filteredTransactions.reduce((acc, txn) => acc + txn.amount, 0) >= 0 ? 'var(--sporty-teal)' : '#e11d48' }}>
                  {filteredTransactions.reduce((acc, txn) => acc + txn.amount, 0) >= 0 ? "+" : ""}{formatCurrency(filteredTransactions.reduce((acc, txn) => acc + txn.amount, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <div className={styles.mobileListContainer}>
        {loading && !transactions.length ? (
          <div className={styles.emptyState}>Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className={styles.emptyState}>No transactions found. Add one or upload a CSV.</div>
        ) : filteredTransactions.length === 0 ? (
          <div className={styles.emptyState}>No transactions match your search query.</div>
        ) : (
          Object.keys(groupedTransactions).map(dateStr => (
            <div key={dateStr} className={styles.mobileDateGroup}>
              <div className={styles.mobileDateHeader}>{dateStr}</div>
              <div className={styles.mobileGroupItems}>
                {groupedTransactions[dateStr].map(txn => {
                  const isIncome = txn.amount >= 0;
                  const catLetter = txn.category?.name ? txn.category.name.charAt(0).toUpperCase() : "?";
                  const catColor = getCategoryColor(txn.category?.name);
                  
                  return (
                    <div key={txn.id} className={styles.mobileTxnCard} onClick={() => openEditModal(txn)}>
                      <div className={styles.mobileTxnLeft}>
                        <div className={styles.categoryIcon} style={{ background: catColor }}>
                          {catLetter}
                        </div>
                        <div className={styles.mobileTxnMeta}>
                          <div className={styles.mobileTxnTitle}>
                            {txn.notes || txn.category?.name || "Transaction"}
                          </div>
                          <div className={styles.mobileTxnSubtitle}>
                            {txn.account?.name || "Unknown Account"}
                          </div>
                          {txn.merchant && (
                            <div className={styles.merchantBadge}>
                              {txn.merchant}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className={styles.mobileTxnRight}>
                        <div className={isIncome ? styles.mobileAmountIncome : styles.mobileAmountExpense}>
                          {isIncome ? "+" : ""}{formatCurrency(txn.amount)}
                        </div>
                        {txn.paymentMethod && (
                          <div className={styles.mobilePaymentMethod}>
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
        )}
        
        {filteredTransactions.length > 0 && (
          <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
            <span style={{ color: 'var(--text-muted)' }}>Total for Period:</span>
            <span style={{ color: filteredTransactions.reduce((acc, txn) => acc + txn.amount, 0) >= 0 ? 'var(--sporty-teal)' : '#e11d48', fontSize: '16px' }}>
              {filteredTransactions.reduce((acc, txn) => acc + txn.amount, 0) >= 0 ? "+" : ""}{formatCurrency(filteredTransactions.reduce((acc, txn) => acc + txn.amount, 0))}
            </span>
          </div>
        )}
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        transaction={selectedTransaction} 
        onSave={fetchData} 
      />

      <ReceiptPreviewModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        scanData={scanData}
        onSave={fetchData}
      />
    </div>
  );
}
