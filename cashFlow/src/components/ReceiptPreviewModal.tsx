import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/format";
import { buildCategoryTree, flattenCategoryTree, type Category } from "@/utils/categories";

type ReceiptPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  scanData: {
    date: string;
    merchant: string;
    items: Array<{
      code?: string | null;
      rawName?: string;
      description: string;
      amount: number;
      categoryId: string | null;
    }>;
    gst: { amount: number; categoryId: string | null } | null;
    _warning?: string;
  } | null;
  onSave: () => void;
};

export default function ReceiptPreviewModal({ isOpen, onClose, scanData, onSave }: ReceiptPreviewModalProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethodsList, setPaymentMethodsList] = useState<string[]>([]);
  
  const [date, setDate] = useState("");
  const [merchant, setMerchant] = useState("");
  const [accountId, setAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [notes, setNotes] = useState("");
  
  // Scanned items state
  const [items, setItems] = useState<Array<{
    code?: string | null;
    rawName?: string;
    description: string;
    amount: number;
    categoryId: string | null;
  }>>([]);
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [gstCategoryId, setGstCategoryId] = useState<string>("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch accounts, categories and payment methods
    Promise.all([
      fetch("/cashFlow/api/accounts"),
      fetch("/cashFlow/api/categories"),
      fetch("/cashFlow/api/payment-methods")
    ])
      .then(async ([accRes, catRes, pmRes]) => {
        const accData = await accRes.json();
        const catData = await catRes.json();
        const pmData = pmRes.ok ? await pmRes.json() : [];
        
        setAccounts(accData);
        setCategories(catData);
        setPaymentMethodsList(pmData);

        // Pre-select first account
        if (accData.length > 0) setAccountId(accData[0].id);

        // Populate scan data
        if (scanData) {
          setDate(scanData.date || new Date().toISOString().slice(0, 10));
          setMerchant(scanData.merchant || "");
          setItems((scanData.items || []).map(item => ({
            ...item,
            amount: parseFloat(Number(item.amount || 0).toFixed(2))
          })));
          if (scanData.gst) {
            setGstAmount(parseFloat(Number(scanData.gst.amount || 0).toFixed(2)));
            setGstCategoryId(scanData.gst.categoryId || "");
          } else {
            setGstAmount(0);
            setGstCategoryId("");
          }
        }
      })
      .catch(err => console.error("Failed to fetch lookup data", err));
  }, [isOpen, scanData]);

  // Find tax category ID automatically if not set by AI
  useEffect(() => {
    if (!gstCategoryId && categories.length > 0) {
      // Find a category containing "tax" or "fees" case-insensitively
      const taxCat = categories.find(c => c.name.toLowerCase().includes("tax") || c.name.toLowerCase().includes("fee"));
      if (taxCat) {
        setGstCategoryId(taxCat.id);
      }
    }
  }, [categories, gstCategoryId]);

  if (!isOpen || !scanData) return null;

  const categoryTree = buildCategoryTree(categories as Category[]);
  const flatCategories = flattenCategoryTree(categoryTree);

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount as any) || 0), 0);
    return itemsTotal + gstAmount;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      alert("Please select an account.");
      return;
    }

    setSaving(true);
    try {
      // Build transactions array
      const transactionsToSave = [
        ...items.map(item => ({
          date: new Date(date).toISOString(),
          amount: parseFloat(item.amount as any) || 0,
          merchant,
          paymentMethod,
          notes: notes ? `${item.description} - ${notes}` : item.description,
          categoryId: item.categoryId || null,
          code: item.code || null,
          rawName: item.rawName || null,
          friendlyName: item.description,
        })),
        ...(gstAmount !== 0 ? [{
          date: new Date(date).toISOString(),
          amount: gstAmount,
          merchant,
          paymentMethod,
          notes: `GST / Sales Tax${notes ? ` - ${notes}` : ''}`,
          categoryId: gstCategoryId || null
        }] : [])
      ];

      const res = await fetch("/cashFlow/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          transactions: transactionsToSave
        })
      });

      if (res.ok) {
        onSave();
        onClose();
      } else {
        const err = await res.json();
        alert("Failed to save transactions: " + err.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving transactions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', zIndex: 1000, overflowY: 'auto', padding: '20px 10px' }} 
      onClick={onClose}
    >
      <div 
        style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '750px', maxWidth: '100%', margin: 'auto' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: 'var(--tranquil-dark-blue)' }}>Verify Receipt Split</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '24px', color: 'var(--text-muted)' }}>&times;</button>
        </div>

        {scanData._warning && (
          <div style={{ background: '#fff9db', border: '1px solid #ffe066', color: '#856404', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', lineHeight: '1.5' }}>
            ⚠️ <strong>Demo Mode:</strong> {scanData._warning}
            <br/><br/>
            Get a free API key from <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: '#856404', fontWeight: 600 }}>Google AI Studio</a> and set <code>GEMINI_API_KEY</code> on Vercel to use actual AI scanning.
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* General Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>Merchant</label>
              <input type="text" value={merchant} onChange={e => setMerchant(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>Account Paid From</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white' }}>
                <option value="" disabled>Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>Payment Method</label>
              <input type="text" list="receipt-payment-methods" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
              <datalist id="receipt-payment-methods">
                {paymentMethodsList.map((pm, idx) => (
                  <option key={idx} value={pm} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '16px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '10px 12px' }}>Item Description</th>
                  <th style={{ padding: '10px 12px', width: '220px' }}>Category</th>
                  <th style={{ padding: '10px 12px', width: '120px' }}>Amount</th>
                  <th style={{ padding: '10px 12px', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <input 
                        type="text" 
                        value={item.description} 
                        onChange={e => handleItemChange(idx, "description", e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }} 
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <select 
                        value={item.categoryId || ""} 
                        onChange={e => handleItemChange(idx, "categoryId", e.target.value || null)} 
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'white' }}
                      >
                        <option value="">Uncategorized</option>
                        {flatCategories.map(cat => (
                          <option key={cat.id} value={cat.id} style={{ fontWeight: cat.depth === 0 ? 600 : 400 }}>
                            {'\u00A0\u00A0'.repeat(cat.depth)}{cat.depth > 0 ? '└ ' : ''}{cat.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={item.amount} 
                        onChange={e => handleItemChange(idx, "amount", parseFloat(e.target.value) || 0)} 
                        required 
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', textAlign: 'right' }} 
                      />
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(idx)} 
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}

                {/* GST / Tax row */}
                {gstAmount !== 0 && (
                  <tr style={{ background: '#fcf8e3', borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>GST / Sales Tax</td>
                    <td style={{ padding: '8px 12px' }}>
                      <select 
                        value={gstCategoryId} 
                        onChange={e => setGstCategoryId(e.target.value)} 
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'white' }}
                      >
                        <option value="">Uncategorized</option>
                        {flatCategories.map(cat => (
                          <option key={cat.id} value={cat.id} style={{ fontWeight: cat.depth === 0 ? 600 : 400 }}>
                            {'\u00A0\u00A0'.repeat(cat.depth)}{cat.depth > 0 ? '└ ' : ''}{cat.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={gstAmount} 
                        onChange={e => setGstAmount(parseFloat(e.target.value) || 0)} 
                        required 
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', textAlign: 'right', fontWeight: 500 }} 
                      />
                    </td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Notes & Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>Additional Notes (appended to all items)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Weekly grocery run" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>
            <div style={{ width: '200px', background: '#f1f5f9', padding: '12px', borderRadius: '8px', textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Deducted:</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#e11d48' }}>{formatCurrency(calculateTotal())}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button type="button" onClick={onClose} disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving || items.length === 0} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--unique-blue)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
              {saving ? "Saving..." : `Save Split (${items.length + (gstAmount !== 0 ? 1 : 0)} Txns)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
