import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/format";
import { buildCategoryTree, flattenCategoryTree } from "@/utils/categories";

type TransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  transaction?: any | null; // null means create new
  onSave: () => void; // callback after save/delete to refresh data
};

export default function TransactionModal({ isOpen, onClose, transaction, onSave }: TransactionModalProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [merchantsList, setMerchantsList] = useState<any[]>([]);
  const [paymentMethodsList, setPaymentMethodsList] = useState<string[]>([]);
  
  const [amount, setAmount] = useState("");
  const router = require('next/navigation').useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [merchant, setMerchant] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [notes, setNotes] = useState("");
  const [transactionType, setTransactionType] = useState<"expense" | "income" | "transfer">("expense");
  const [toAccountId, setToAccountId] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    
    // Fetch accounts, categories, and merchants
    Promise.all([fetch("/cashFlow/api/accounts"), fetch("/cashFlow/api/categories"), fetch("/cashFlow/api/merchants"), fetch("/cashFlow/api/payment-methods")])
      .then(async ([accRes, catRes, merchRes, pmRes]) => {
        const accData = await accRes.json();
        const catData = await catRes.json();
        const merchData = merchRes.ok ? await merchRes.json() : [];
        const pmData = pmRes.ok ? await pmRes.json() : [];
        setAccounts(accData);
        setCategories(catData);
        setMerchantsList(merchData);
        setPaymentMethodsList(pmData);
        
        if (transaction) {
          setTransactionType(transaction.amount < 0 ? "expense" : "income");
          setAmount(Math.abs(transaction.amount).toFixed(2));
          setDate(new Date(transaction.date).toISOString().slice(0, 10));
          setMerchant(transaction.merchant || "");
          setAccountId(transaction.account?.id || transaction.accountId || (accData.length > 0 ? accData[0].id : ""));
          setCategoryId(transaction.category?.id || transaction.categoryId || "");
          setPaymentMethod(transaction.paymentMethod || "");
          setNotes(transaction.notes || "");
        } else {
          setTransactionType("expense");
          setAmount("");
          setDate(new Date().toISOString().slice(0, 10));
          setMerchant("");
          setAccountId(accData.length > 0 ? accData[0].id : "");
          setToAccountId(accData.length > 1 ? accData[1].id : (accData.length > 0 ? accData[0].id : ""));
          setCategoryId("");
          setPaymentMethod("Credit Card");
          setNotes("");
        }
      })
      .catch(err => console.error("Failed to fetch dropdown data", err));
  }, [isOpen, transaction]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      alert("Please select an account.");
      return;
    }
    
    let parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return;
    if (transactionType === "expense") {
      parsedAmount = -Math.abs(parsedAmount);
    } else if (transactionType === "income") {
      parsedAmount = Math.abs(parsedAmount);
    }
    
    const payload = {
      amount: parsedAmount,
      date: new Date(date).toISOString(),
      merchant,
      accountId,
      categoryId: categoryId || null,
      paymentMethod,
      notes,
      type: transactionType,
      toAccountId: transactionType === "transfer" ? toAccountId : undefined
    };

    try {
      let res;
      if (transaction) {
        // Pass toAccountId and type even if it's an update, so the backend can create the second leg
        const updatePayload = { ...payload };
        res = await fetch(`/cashFlow/api/transactions/${transaction.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload)
        });
      } else {
        res = await fetch("/cashFlow/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        onSave();
        onClose();
      } else {
        const err = await res.json();
        alert("Failed to save transaction: " + err.error);
      }
    } catch (err) {
      console.error("Failed to save transaction", err);
    }
  };

  const handleDelete = async () => {
    if (!transaction || !window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const res = await fetch(`/cashFlow/api/transactions/${transaction.id}`, { method: "DELETE" });
      if (res.ok) {
        onSave();
        onClose();
      } else {
        alert("Failed to delete transaction.");
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  if (!isOpen) return null;

  const categoryTree = buildCategoryTree(categories);
  const flatCategories = flattenCategoryTree(categoryTree);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', zIndex: 1000, overflowY: 'auto', padding: '40px 20px' }} onClick={onClose}>
      <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '100%', margin: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>{transaction ? "Edit Transaction" : "Add Transaction"}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-muted)' }}>&times;</button>
        </div>
        
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button type="button" onClick={() => setTransactionType("expense")} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: transactionType === 'expense' ? '#ffe4e6' : 'white', color: transactionType === 'expense' ? '#e11d48' : 'var(--text-muted)', fontWeight: transactionType === 'expense' ? 600 : 400 }}>Expense</button>
            <button type="button" onClick={() => setTransactionType("income")} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: transactionType === 'income' ? '#ccfbf1' : 'white', color: transactionType === 'income' ? 'var(--sporty-teal)' : 'var(--text-muted)', fontWeight: transactionType === 'income' ? 600 : 400 }}>Income</button>
            <button type="button" onClick={() => setTransactionType("transfer")} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: transactionType === 'transfer' ? '#f1f5f9' : 'white', color: transactionType === 'transfer' ? 'var(--silent-dark-blue)' : 'var(--text-muted)', fontWeight: transactionType === 'transfer' ? 600 : 400 }}>Transfer</button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Amount</label>
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Merchant / Payee</label>
            <input type="text" list="merchants-list" value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="e.g. Costco, Telus" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            <datalist id="merchants-list">
              {merchantsList.map(m => (
                <option key={m.id} value={m.name} />
              ))}
            </datalist>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>{transactionType === "transfer" ? "From Account" : "Account"}</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <option value="" disabled>Select Account</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
              ))}
            </select>
          </div>

          {transactionType === "transfer" && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>To Account</label>
              <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <option value="" disabled>Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                ))}
              </select>
            </div>
          )}

          {transactionType !== "transfer" && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <option value="">Uncategorized</option>
                {flatCategories.map((cat: any) => (
                  <option key={cat.id} value={cat.id} style={{ fontWeight: cat.depth === 0 ? 600 : 400 }}>
                    {'\u00A0\u00A0'.repeat(cat.depth)}{cat.depth > 0 ? '└ ' : ''}{cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Payment Method</label>
            <input type="text" list="payment-methods-list" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} placeholder="e.g. Credit Card, Cash" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            <datalist id="payment-methods-list">
              {paymentMethodsList.map((pm, idx) => (
                <option key={idx} value={pm} />
              ))}
            </datalist>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', minHeight: '80px', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {transaction && (
                <>
                  <button type="button" onClick={handleDelete} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e11d48', color: '#e11d48', background: 'transparent', cursor: 'pointer' }}>Delete</button>
                  <button type="button" onClick={() => {
                    const params = new URLSearchParams();
                    if (amount) params.set('amount', amount);
                    if (merchant) params.set('merchant', merchant);
                    if (categoryId) params.set('categoryId', categoryId);
                    if (accountId) params.set('accountId', accountId);
                    if (transactionType) params.set('type', transactionType);
                    if (transactionType === 'transfer' && toAccountId) params.set('toAccountId', toAccountId);
                    router.push(`/planning?createFrom=${encodeURIComponent(params.toString())}`);
                  }} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--unique-blue)', color: 'var(--unique-blue)', background: '#e0f2fe', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔄 Schedule
                  </button>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }}>Cancel</button>
              <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--unique-blue)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

