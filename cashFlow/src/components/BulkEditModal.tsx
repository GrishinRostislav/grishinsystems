"use client";

import React, { useEffect, useState } from "react";

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: any[]) => Promise<void>;
  transactions: any[];
  accounts: any[];
  categories?: any[];
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "0.9rem", boxSizing: "border-box" };

export default function BulkEditModal({ isOpen, onClose, onSave, transactions, accounts, categories = [] }: BulkEditModalProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setItems(transactions.map(tx => ({ id: tx.id, date: tx.date ? new Date(tx.date).toISOString().split("T")[0] : "", merchant: tx.merchant || "", amount: Math.abs(Number(tx.amount) || 0), accountId: tx.accountId || tx.account?.id || "", categoryId: tx.categoryId || tx.category?.id || "", notes: tx.notes || "", isExpense: Number(tx.amount) < 0 })));
  }, [isOpen, transactions]);

  if (!isOpen || items.length === 0) return null;

  const updateItem = (id: string, field: string, value: any) => setItems(current => current.map(item => item.id === id ? { ...item, [field]: value } : item));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await onSave(items.map(item => ({ id: item.id, date: item.date, merchant: item.merchant, amount: item.isExpense ? -Math.abs(Number(item.amount)) : Math.abs(Number(item.amount)), accountId: item.accountId, categoryId: item.categoryId || null, notes: item.notes })));
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.58)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 12 }}>
      <div style={{ background: "var(--bg-primary)", borderRadius: 18, width: "100%", maxWidth: 760, maxHeight: "94vh", overflowY: "auto", boxShadow: "var(--shadow-xl)" }}>
        <div style={{ padding: "22px 24px 14px", borderBottom: "1px solid var(--border-color)" }}>
          <h2 style={{ margin: 0, color: "var(--text-main)", fontSize: "1.35rem" }}>Edit purchase</h2>
          <p style={{ margin: "6px 0 0", color: "var(--text-muted)" }}>{items.length} items. Change each product, merchant, price, date, account or category separately.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: 16, display: "grid", gap: 12 }}>
            {items.map((item, index) => (
              <div key={item.id} style={{ border: "1px solid var(--border-color)", borderRadius: 12, padding: 12, background: "var(--bg-secondary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "var(--text-muted)", fontSize: ".8rem" }}><span>Item {index + 1}</span><label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={item.isExpense} onChange={e => updateItem(item.id, "isExpense", e.target.checked)} /> Expense</label></div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(150px, 1.5fr) minmax(90px, .6fr) minmax(130px, 1fr)", gap: 8 }}>
                  <input aria-label="Merchant" style={inputStyle} value={item.merchant} onChange={e => updateItem(item.id, "merchant", e.target.value)} placeholder="Merchant" />
                  <input aria-label="Amount" style={inputStyle} type="number" step="0.01" value={item.amount} onChange={e => updateItem(item.id, "amount", e.target.value)} placeholder="Price" />
                  <input aria-label="Date" style={inputStyle} type="date" value={item.date} onChange={e => updateItem(item.id, "date", e.target.value)} />
                  <select aria-label="Account" style={inputStyle} value={item.accountId} onChange={e => updateItem(item.id, "accountId", e.target.value)}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select>
                  <select aria-label="Category" style={inputStyle} value={item.categoryId} onChange={e => updateItem(item.id, "categoryId", e.target.value)}><option value="">Uncategorized</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
                  <input aria-label="Notes" style={inputStyle} value={item.notes} onChange={e => updateItem(item.id, "notes", e.target.value)} placeholder="What was bought / notes" />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "0 24px 22px" }}><button type="button" onClick={onClose} disabled={loading} style={{ padding: "11px 20px", borderRadius: 8, border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-main)", fontWeight: 600 }}>Cancel</button><button type="submit" disabled={loading} style={{ padding: "11px 20px", borderRadius: 8, border: 0, background: "var(--sporty-teal)", color: "white", fontWeight: 600 }}>{loading ? "Saving..." : "Save purchase"}</button></div>
        </form>
      </div>
    </div>
  );
}
