"use client";

import { useState, useEffect } from "react";
import styles from "./SettingsModal.module.css";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type RuleItem = {
  id: string;
  text: string;
};

function parseRules(stored: string | null | undefined): RuleItem[] {
  if (!stored || !stored.trim()) return [];
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => {
        if (typeof item === 'string') return { id: `rule-${idx}-${Date.now()}`, text: item };
        if (item && typeof item === 'object' && item.text) return { id: item.id || `rule-${idx}-${Date.now()}`, text: String(item.text) };
        return null;
      }).filter(Boolean) as RuleItem[];
    }
  } catch {
    // Fallback: split legacy newline-separated string
  }

  return stored
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map((text, idx) => ({ id: `rule-${idx}-${Date.now()}`, text }));
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [homeCurrency, setHomeCurrency] = useState("CAD");
  const [appPassword, setAppPassword] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [customModelInput, setCustomModelInput] = useState("");
  const [aiFinancialGoal, setAiFinancialGoal] = useState("balanced");
  const [aiAuditTone, setAiAuditTone] = useState("strict");
  const [aiMinBufferMonths, setAiMinBufferMonths] = useState(3);
  const [saving, setSaving] = useState(false);

  // Custom AI Rules as separate cards (плашки)
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [newRuleText, setNewRuleText] = useState("");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingRuleText, setEditingRuleText] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetch("/cashFlow/api/settings")
        .then(res => res.json())
        .then(data => {
          if (data.homeCurrency) setHomeCurrency(data.homeCurrency);
          if (data.appPassword !== undefined && data.appPassword !== null) {
            setAppPassword(data.appPassword);
          } else {
            setAppPassword("");
          }
          if (data.geminiApiKey !== undefined && data.geminiApiKey !== null) {
            setGeminiApiKey(data.geminiApiKey);
          } else {
            setGeminiApiKey("");
          }
          if (data.aiModel) {
            const predefined = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "o3-mini", "gemini-2.0-flash", "gemini-1.5-pro"];
            if (predefined.includes(data.aiModel)) {
              setAiModel(data.aiModel);
              setCustomModelInput("");
            } else {
              setAiModel("custom");
              setCustomModelInput(data.aiModel);
            }
          } else {
            setAiModel("gpt-4o-mini");
            setCustomModelInput("");
          }
          if (data.aiCustomInstructions !== undefined && data.aiCustomInstructions !== null) {
            setRules(parseRules(data.aiCustomInstructions));
          } else {
            setRules([]);
          }
          if (data.aiFinancialGoal) setAiFinancialGoal(data.aiFinancialGoal);
          if (data.aiAuditTone) setAiAuditTone(data.aiAuditTone);
          if (data.aiMinBufferMonths) setAiMinBufferMonths(data.aiMinBufferMonths);
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleAddRule = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newRuleText.trim();
    if (!trimmed) return;
    setRules(prev => [...prev, { id: `rule-${Date.now()}`, text: trimmed }]);
    setNewRuleText("");
  };

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleStartEdit = (rule: RuleItem) => {
    setEditingRuleId(rule.id);
    setEditingRuleText(rule.text);
  };

  const handleSaveEdit = (id: string) => {
    const trimmed = editingRuleText.trim();
    if (trimmed) {
      setRules(prev => prev.map(r => r.id === id ? { ...r, text: trimmed } : r));
    }
    setEditingRuleId(null);
    setEditingRuleText("");
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setEditingRuleText("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const formattedInstructions = JSON.stringify(rules.map(r => r.text.trim()).filter(Boolean));
    const effectiveModel = aiModel === "custom" ? (customModelInput.trim() || "gpt-4o-mini") : aiModel;

    try {
      const res = await fetch("/cashFlow/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeCurrency,
          appPassword,
          geminiApiKey,
          aiModel: effectiveModel,
          aiCustomInstructions: formattedInstructions,
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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
            <h3>🔐 Безопасность и Пароль</h3>
            <p className={styles.description}>
              Установите новый пароль для входа. Оставьте поле пустым, если хотите отключить запрос пароля при входе.
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Пароль приложения</label>
            <input 
              type="text"
              value={appPassword}
              onChange={e => setAppPassword(e.target.value)}
              placeholder="Оставьте пустым для отключения пароля"
              className={styles.select}
            />
          </div>

          <div className={styles.divider} />

          <div className={styles.sectionHeader}>
            <h3>🤖 Настройки ИИ-Советника и Модель</h3>
            <p className={styles.description}>
              Укажите API Key (OpenAI ChatGPT или Google Gemini), выберите модель ИИ и личные критерии анализа.
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>AI API Key (OpenAI ChatGPT или Google Gemini)</label>
            <p className={styles.description}>
              Поддерживается <strong>OpenAI (ChatGPT)</strong> (ключ <code>sk-...</code> из <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: 'var(--unique-blue)', textDecoration: 'underline' }}>OpenAI Platform</a>) или <strong>Google Gemini</strong> (ключ <code>AIzaSy...</code> из <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--unique-blue)', textDecoration: 'underline' }}>Google AI Studio</a>).
            </p>
            <input 
              type="password"
              value={geminiApiKey}
              onChange={e => setGeminiApiKey(e.target.value)}
              placeholder="sk-... или AIzaSy..."
              className={styles.select}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Модель ИИ (AI Model)</label>
            <p className={styles.description}>
              Выберите модель ИИ для диалогового финансового советника и аудита.
            </p>
            <select 
              value={aiModel} 
              onChange={e => setAiModel(e.target.value)}
              className={styles.select}
            >
              <option value="gpt-4o-mini">⚡ OpenAI gpt-4o-mini (Быстрая, экономная, по умолчанию)</option>
              <option value="gpt-4o">🧠 OpenAI gpt-4o (Флагманская высокоточная модель)</option>
              <option value="gpt-4-turbo">🚀 OpenAI gpt-4-turbo</option>
              <option value="o3-mini">💡 OpenAI o3-mini (Reasoning Model)</option>
              <option value="gemini-2.0-flash">✨ Google gemini-2.0-flash</option>
              <option value="gemini-1.5-pro">💎 Google gemini-1.5-pro</option>
              <option value="custom">✏️ Своё название модели (Write custom model name...)</option>
            </select>

            {aiModel === "custom" && (
              <input
                type="text"
                value={customModelInput}
                onChange={e => setCustomModelInput(e.target.value)}
                placeholder="Введите название модели (например: gpt-5.6-luna-light или fine-tuned ID)..."
                className={styles.select}
                style={{ marginTop: '10px' }}
              />
            )}
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
              Каждое правило хранится в виде отдельной плашки. Вы можете добавлять, редактировать ✏️ и удалять 🗑️ правила.
            </p>

            <div className={styles.rulesList}>
              {rules.length === 0 ? (
                <div className={styles.noRulesText}>У вас пока нет сохраненных правил. Добавьте первое правило ниже!</div>
              ) : (
                rules.map((rule, idx) => (
                  <div key={rule.id} className={styles.ruleCard}>
                    {editingRuleId === rule.id ? (
                      <div className={styles.editRuleRow}>
                        <input
                          type="text"
                          value={editingRuleText}
                          onChange={e => setEditingRuleText(e.target.value)}
                          className={styles.ruleInput}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEdit(rule.id);
                            }
                            if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(rule.id)}
                          className={styles.iconBtnCheck}
                          title="Сохранить"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className={styles.iconBtnCancel}
                          title="Отмена"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className={styles.ruleContent}>
                        <span className={styles.ruleBadge}>{idx + 1}</span>
                        <span className={styles.ruleText}>{rule.text}</span>
                        <div className={styles.ruleActions}>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(rule)}
                            className={styles.ruleActionBtn}
                            title="Изменить правило"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id)}
                            className={styles.ruleActionBtn}
                            title="Удалить правило"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className={styles.addRuleRow}>
              <input
                type="text"
                value={newRuleText}
                onChange={e => setNewRuleText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRule();
                  }
                }}
                placeholder="Например: Не учитывай расходы на путешествия в июне..."
                className={styles.addRuleInput}
              />
              <button
                type="button"
                onClick={() => handleAddRule()}
                disabled={!newRuleText.trim()}
                className={styles.addRuleBtn}
              >
                + Добавить
              </button>
            </div>
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
