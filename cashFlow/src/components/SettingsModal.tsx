"use client";

import { useState, useEffect } from "react";
import styles from "./SettingsModal.module.css";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [homeCurrency, setHomeCurrency] = useState("CAD");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/cashFlow/api/settings")
        .then(res => res.json())
        .then(data => {
          if (data.homeCurrency) setHomeCurrency(data.homeCurrency);
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/cashFlow/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeCurrency })
      });
      if (res.ok) {
        onClose();
        window.location.reload(); // Reload to apply new home currency everywhere
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Global Settings</h2>
        <form onSubmit={handleSave}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Home Currency</label>
            <p className={styles.description}>
              This is the currency used to display aggregated totals on the Dashboard and Budgets. Account balances and transactions will be converted to this currency using live exchange rates.
            </p>
            <select 
              value={homeCurrency} 
              onChange={e => setHomeCurrency(e.target.value)}
              className={styles.select}
            >
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="RUB">RUB - Russian Ruble</option>
              <option value="KZT">KZT - Kazakhstani Tenge</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>
          
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>Cancel</button>
            <button type="submit" disabled={saving} className={styles.btnPrimary}>
              {saving ? "Saving..." : "Save & Reload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
