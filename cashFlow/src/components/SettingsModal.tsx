"use client";

import { useState, useEffect } from "react";
import styles from "./SettingsModal.module.css";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [homeCurrency, setHomeCurrency] = useState("CAD");
  const [aiCustomInstructions, setAiCustomInstructions] = useState("");
  const [aiFinancialGoal, setAiFinancialGoal] = useState("balanced");
  const [aiAuditTone, setAiAuditTone] = useState("strict");
  const [aiMinBufferMonths, setAiMinBufferMonths] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings")
        .then(res => res.json())
        .then(data => {
          if (data.homeCurrency) setHomeCurrency(data.homeCurrency);
          if (data.aiCustomInstructions !== undefined && data.aiCustomInstructions !== null) {
            setAiCustomInstructions(data.aiCustomInstructions);
          }
          if (data.aiFinancialGoal) setAiFinancialGoal(data.aiFinancialGoal);
          if (data.aiAuditTone) setAiAuditTone(data.aiAuditTone);
          if (data.aiMinBufferMonths) setAiMinBufferMonths(data.aiMinBufferMonths);
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeCurrency,
          aiCustomInstructions,
          aiFinancialGoal,
          aiAuditTone,
          aiMinBufferMonths: Number(aiMinBufferMonths)
        })
      });
      if (res.ok) {
        onClose();
        window.location.reload(); // Reload to apply new settings everywhere
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
        <h2 className={styles.title}>⚙️ Настройки и Правила ИИ</h2>
        <form onSubmit={handleSave}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Основная Валюта (Home Currency)</label>
            <p className={styles.description}>
              Валюта для агрегирования отчетов на дашборде, в бюджетах и ответах ИИ.
            </p>
            <select 
              value={homeCurrency} 
              onChange={e => setHomeCurrency(e.target.value)}
              className={styles.select}
            >
              <option value="CAD">CAD - Canadian Dollar ($)</option>
              <option value="USD">USD - US Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="RUB">RUB - Российский Рубль (₽)</option>
              <option value="KZT">KZT - Казахстаский Тенге (₸)</option>
              <option value="GBP">GBP - British Pound (£)</option>
              <option value="AUD">AUD - Australian Dollar ($)</option>
            </select>
          </div>

          <div className={styles.divider} />

          <div className={styles.sectionHeader}>
            <h3>🤖 Настройки ИИ-Советника и Правила Аудита</h3>
            <p className={styles.description}>
              Укажите ваши личные условия и критерии анализа, чтобы ИИ давал максимально точные советы.
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Финансовая цель</label>
            <select 
              value={aiFinancialGoal} 
              onChange={e => setAiFinancialGoal(e.target.value)}
              className={styles.select}
            >
              <option value="accumulation">💰 Быстрое накопление и жесткая экономия</option>
              <option value="balanced">⚖️ Баланс между комфортной жизнью и накоплениями</option>
              <option value="investing">📈 Активное инвестирование и развитие бизнеса</option>
              <option value="debt_payoff">🛡️ Досрочное гашение кредитов и долгов</option>
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label className={styles.label}>Тональность аудита</label>
              <select 
                value={aiAuditTone} 
                onChange={e => setAiAuditTone(e.target.value)}
                className={styles.select}
              >
                <option value="strict">⚡ Строгая (критика трат, жесткий аудит)</option>
                <option value="supportive">🤝 Поддерживающая (мягкие советы)</option>
                <option value="analytical">📊 Аналитическая (только факты и цифры)</option>
              </select>
            </div>

            <div className={styles.formGroupHalf}>
              <label className={styles.label}>Размер подушки (мес)</label>
              <select 
                value={aiMinBufferMonths} 
                onChange={e => setAiMinBufferMonths(Number(e.target.value))}
                className={styles.select}
              >
                <option value={1}>1 месяц расходов</option>
                <option value={3}>3 месяца (Стандарт)</option>
                <option value={6}>6 месяцев (Надежная защита)</option>
                <option value={12}>12 месяцев (Полная автономия)</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Персональные условия и правила для ИИ</label>
            <p className={styles.description}>
              Опишите своими словами особые условия (например: &quot;Не учитывай расходы на путешествия в июне&quot;, &quot;Всегда предупреждай если расходы на кофе превышают 100$&quot;).
            </p>
            <textarea
              value={aiCustomInstructions}
              onChange={e => setAiCustomInstructions(e.target.value)}
              placeholder="Введите особые указания для ИИ..."
              className={styles.textarea}
              rows={3}
            />
          </div>
          
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>Отмена</button>
            <button type="submit" disabled={saving} className={styles.btnPrimary}>
              {saving ? "Сохранение..." : "Сохранить настройки"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
