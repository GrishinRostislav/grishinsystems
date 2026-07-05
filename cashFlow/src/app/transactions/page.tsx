"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Papa from "papaparse";
import GlobalDateFilter from "@/components/GlobalDateFilter";
import TransactionModal from "@/components/TransactionModal";
import TransactionList from "@/components/TransactionList";
import ReceiptPreviewModal from "@/components/ReceiptPreviewModal";
import BulkEditModal from "@/components/BulkEditModal";
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

  // Bulk Edit State
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditTransactions, setBulkEditTransactions] = useState<any[]>([]);

  const handleBulkEditSave = async (transactionIds: string[], data: any) => {
    const res = await fetch("/cashFlow/api/transactions/bulk-update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionIds, data })
    });
    if (res.ok) {
      await fetchData();
    } else {
      const err = await res.json();
      alert("Bulk update failed: " + err.error);
    }
  };

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
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const typeParam = searchParams.get("type");
      
      const queryParams = new URLSearchParams();
      if (startDate && endDate) {
        queryParams.set("startDate", startDate);
        queryParams.set("endDate", endDate);
      }
      if (typeParam) queryParams.set("type", typeParam);
      
      const url = `/cashFlow/api/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const [txRes] = await Promise.all([
        fetch(url)
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

      {loading && !transactions.length ? (
        <div className={styles.emptyState}>Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className={styles.emptyState}>No transactions found. Add one or upload a CSV.</div>
      ) : (
        <TransactionList
          transactions={filteredTransactions}
          onTransactionClick={(txn) => openEditModal(txn)}
          onEditGroupClick={(txns) => {
            setBulkEditTransactions(txns);
            setIsBulkEditOpen(true);
          }}
          emptyMessage="No transactions match your search query."
          totalLabel="Total for Period:"
        />
      )}

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

      <BulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        onSave={handleBulkEditSave}
        transactions={bulkEditTransactions}
      />
    </div>
  );
}
