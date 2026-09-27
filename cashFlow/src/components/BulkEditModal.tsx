"use client";

import React, { useEffect, useState } from "react";

interface Props { isOpen: boolean; onClose: () => void; onSave: (ids: string[], data: any) => Promise<void>; transactions: any[]; accounts: any[]; categories?: any[]; }
const field: React.CSSProperties = { width: "100%", padding: "12px", borderRadius: 9, border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "1rem", boxSizing: "border-box" };

export default function BulkEditModal({ isOpen, onClose, onSave, transactions, accounts, categories = [] }: Props) {
  const [form, setForm] = useState({ date: "", merchant: "", accountId: "", categoryId: "", notes: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && transactions.length) {
      const first = transactions[0];
      setForm({ date: first.date ? new Date(first.date).toISOString().split("T")[0] : "", merchant: first.merchant || "", accountId: "", categoryId: "", notes: "" });
    }
  }, [isOpen, transactions]);

  if (!isOpen || !transactions.length) return null;
  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true);
    try { await onSave(transactions.map(tx => tx.id), form); onClose(); } finally { setLoading(false); }
  };

  return <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.58)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
    <div style={{ background: "var(--bg-primary)", borderRadius: 18, width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", boxShadow: "var(--shadow-xl)" }}>
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border-color)" }}>
        <h2 style={{ margin: 0, color: "var(--text-main)", fontSize: "1.45rem" }}>Edit purchase</h2>
        <p style={{ margin: "8px 0 0", color: "var(--text-muted)", lineHeight: 1.4 }}>These changes will apply to all {transactions.length} items in this purchase.</p>
      </div>
      <form onSubmit={submit} style={{ padding: 24, display: "grid", gap: 16 }}>
        <label style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Merchant<input style={{ ...field, marginTop: 7 }} value={form.merchant} onChange={e => set("merchant", e.target.value)} /></label>
        <label style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Date<input required type="date" style={{ ...field, marginTop: 7 }} value={form.date} onChange={e => set("date", e.target.value)} /></label>
        <label style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Account<select style={{ ...field, marginTop: 7 }} value={form.accountId} onChange={e => set("accountId", e.target.value)}><option value="">Keep each current account</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <label style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Category<select style={{ ...field, marginTop: 7 }} value={form.categoryId} onChange={e => set("categoryId", e.target.value)}><option value="">Keep each current category</option><option value="__uncategorized">Set as uncategorized</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Notes<input style={{ ...field, marginTop: 7 }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Leave blank to keep each note" /></label>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}><button type="button" onClick={onClose} disabled={loading} style={{ padding: "12px 20px", borderRadius: 9, border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-main)", fontWeight: 600 }}>Cancel</button><button type="submit" disabled={loading} style={{ padding: "12px 20px", borderRadius: 9, border: 0, background: "var(--sporty-teal)", color: "white", fontWeight: 600 }}>{loading ? "Saving..." : "Apply to all items"}</button></div>
      </form>
    </div>
  </div>;
}
