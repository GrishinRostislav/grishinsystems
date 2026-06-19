import React, { useState, useEffect } from 'react';
import styles from '@/app/page.module.css'; // Reusing global modal styles

interface ScenarioItem {
  id?: string;
  name: string;
  amount: number | string;
  type: 'expense' | 'income' | 'investment';
  date: string;
  frequency: string;
  interval: number;
  daysOfWeek: number[];
  monthsOfYear: number[];
  endDate?: string | null;
  annualRate?: number | string | null;
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
  onDelete?: () => void;
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
            interval: item.interval || 1,
            daysOfWeek: item.daysOfWeek || [],
            monthsOfYear: item.monthsOfYear || [],
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
          interval: 1,
          daysOfWeek: [],
          monthsOfYear: [],
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
        interval: 1,
        daysOfWeek: [],
        monthsOfYear: [],
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
                  <div className={styles.formGroup} style={{ flex: 2 }}>
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
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Type</label>
                    <select className={styles.select} value={item.type} onChange={e => handleItemChange(index, 'type', e.target.value)}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                      <option value="investment">Investment</option>
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
                  {item.type === 'investment' && (
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label className={styles.label}>Annual Rate (%)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        className={styles.input} 
                        value={item.annualRate || ''} 
                        onChange={e => handleItemChange(index, 'annualRate', e.target.value)} 
                        placeholder="e.g. 13"
                      />
                    </div>
                  )}
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
                    <label className={styles.label}>Repeat Every</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {item.frequency !== 'ONCE' && (
                        <input 
                          type="number" 
                          min="1"
                          value={item.interval} 
                          onChange={e => handleItemChange(index, 'interval', parseInt(e.target.value) || 1)} 
                          className={styles.input}
                          style={{ width: '60px' }}
                        />
                      )}
                      <select className={styles.select} value={item.frequency} onChange={e => handleItemChange(index, 'frequency', e.target.value)} style={{ flex: 1 }}>
                        <option value="ONCE">Once</option>
                        <option value="DAILY">Days</option>
                        <option value="WEEKLY">Weeks</option>
                        <option value="MONTHLY">Months</option>
                        <option value="YEARLY">Years</option>
                      </select>
                    </div>
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

                {item.frequency === 'WEEKLY' && (
                  <div style={{ marginTop: '12px' }}>
                    <label className={styles.label}>On Days</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                        const isChecked = (item.daysOfWeek || []).includes(idx);
                        return (
                        <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: isChecked ? 'var(--unique-blue)' : '#f1f5f9', color: isChecked ? 'white' : 'var(--text-main)', padding: '6px 10px', borderRadius: '16px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                          <input 
                            type="checkbox" 
                            style={{ display: 'none' }}
                            checked={isChecked}
                            onChange={(e) => {
                              const currentDays = item.daysOfWeek || [];
                              const newDays = e.target.checked 
                                ? [...currentDays, idx]
                                : currentDays.filter(d => d !== idx);
                              handleItemChange(index, 'daysOfWeek', newDays);
                            }}
                          />
                          {day}
                        </label>
                      )})}
                    </div>
                  </div>
                )}

                {(item.frequency === 'MONTHLY' || item.frequency === 'YEARLY') && (
                  <div style={{ marginTop: '12px' }}>
                    <label className={styles.label}>In Months <span style={{ fontSize: '0.75rem', color: '#64748b' }}>(Optional)</span></label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => {
                        const monthVal = i + 1;
                        const isChecked = (item.monthsOfYear || []).includes(monthVal);
                        return (
                          <label key={month} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: isChecked ? 'var(--unique-blue)' : '#f1f5f9', color: isChecked ? 'white' : 'var(--text-main)', padding: '6px 10px', borderRadius: '16px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                            <input 
                              type="checkbox" 
                              style={{ display: 'none' }}
                              checked={isChecked}
                              onChange={(e) => {
                                const currentMonths = item.monthsOfYear || [];
                                const newMonths = e.target.checked 
                                  ? [...currentMonths, monthVal]
                                  : currentMonths.filter(m => m !== monthVal);
                                handleItemChange(index, 'monthsOfYear', newMonths);
                              }}
                            />
                            {month}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
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
            {scenario && onDelete && (
              <button 
                type="button" 
                onClick={onDelete} 
                className={styles.btnOutline} 
                style={{ color: '#b91c1c', borderColor: '#b91c1c', marginRight: 'auto' }}
                disabled={loading}
              >
                Delete
              </button>
            )}
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
