import React, { useState, useEffect } from 'react';
import styles from '@/app/page.module.css'; // Reusing global modal styles

interface ScenarioItem {
  id?: string;
  name: string;
  amount: number | string;
  type: 'expense' | 'income';
  date: string;
  frequency: string;
  endDate?: string | null;
}

interface Scenario {
  id?: string;
  name: string;
  isActive: boolean;
  items: ScenarioItem[];
}

export default function ScenarioModal({
  isOpen,
  onClose,
  scenario,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  scenario?: Scenario | null;
  onSave: () => void;
}) {
  const [name, setName] = useState("");
  const [items, setItems] = useState<ScenarioItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (scenario) {
        setName(scenario.name);
        setItems(
          scenario.items.map(item => ({
            ...item,
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
            endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : ''
          }))
        );
      } else {
        setName("");
        setItems([{
          name: "",
          amount: "",
          type: "expense",
          date: new Date().toISOString().split('T')[0],
          frequency: "ONCE",
          endDate: ""
        }]);
      }
    }
  }, [isOpen, scenario]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        name: "",
        amount: "",
        type: "expense",
        date: new Date().toISOString().split('T')[0],
        frequency: "ONCE",
        endDate: ""
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ScenarioItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Scenario name is required");
    for (let i = 0; i < items.length; i++) {
      if (!items[i].name.trim() || !items[i].amount) return alert("All items must have a name and amount");
    }

    setLoading(true);
    try {
      const url = scenario?.id ? `/cashFlow/api/scenarios/${scenario.id}` : `/cashFlow/api/scenarios`;
      const method = scenario?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          isActive: scenario ? scenario.isActive : false,
          items: items.map(item => ({
            ...item,
            amount: Number(item.amount),
            endDate: item.endDate || null
          }))
        })
      });

      if (!res.ok) throw new Error("Failed to save scenario");
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving scenario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '700px' }}>
        <h2 className={styles.modalTitle}>{scenario ? "Edit Scenario" : "Create Scenario"}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Simulate a hypothetical future event like buying a house or car.
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Scenario Name</label>
            <input 
              type="text" 
              className={styles.input} 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g., Buying a new car"
              required 
            />
          </div>

          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Financial Impact Items</h3>
            
            {items.map((item, index) => (
              <div key={index} style={{ background: 'var(--bg-hover)', padding: '16px', borderRadius: '12px', marginBottom: '16px', position: 'relative' }}>
                <button 
                  type="button" 
                  onClick={() => handleRemoveItem(index)}
                  style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}
                >
                  &times;
                </button>

                <div className={styles.formRow} style={{ marginBottom: '12px' }}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Item Name</label>
                    <input 
                      type="text" 
                      className={styles.input} 
                      value={item.name} 
                      onChange={e => handleItemChange(index, 'name', e.target.value)} 
                      placeholder="e.g., Downpayment"
                      required 
                    />
                  </div>
                  <div className={styles.formGroup} style={{ width: '120px' }}>
                    <label className={styles.label}>Type</label>
                    <select className={styles.select} value={item.type} onChange={e => handleItemChange(index, 'type', e.target.value)}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Amount</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className={styles.input} 
                      value={item.amount} 
                      onChange={e => handleItemChange(index, 'amount', e.target.value)} 
                      placeholder="0.00"
                      required 
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Date</label>
                    <input 
                      type="date" 
                      className={styles.input} 
                      value={item.date} 
                      onChange={e => handleItemChange(index, 'date', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Frequency</label>
                    <select className={styles.select} value={item.frequency} onChange={e => handleItemChange(index, 'frequency', e.target.value)}>
                      <option value="ONCE">Once</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                  {item.frequency !== 'ONCE' && (
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label className={styles.label}>End Date (Optional)</label>
                      <input 
                        type="date" 
                        className={styles.input} 
                        value={item.endDate || ''} 
                        onChange={e => handleItemChange(index, 'endDate', e.target.value)} 
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button 
              type="button" 
              onClick={handleAddItem}
              className={styles.btnSecondary}
              style={{ width: '100%', borderStyle: 'dashed' }}
            >
              + Add Item
            </button>
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? "Saving..." : "Save Scenario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
