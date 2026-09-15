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
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("gpt-5.6-luna");
  const [customModelInput, setCustomModelInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Custom AI Rules as separate cards
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
          if (data.openaiApiKey !== undefined && data.openaiApiKey !== null) {
            setOpenaiApiKey(data.openaiApiKey);
          } else {
            setOpenaiApiKey("");
          }
          if (data.geminiApiKey !== undefined && data.geminiApiKey !== null) {
            setGeminiApiKey(data.geminiApiKey);
          } else {
            setGeminiApiKey("");
          }
          if (data.aiModel) {
            const predefined = [
              "gpt-5.6-luna",
              "gpt-5.6-sol",
              "gpt-5.6-terra",
              "gpt-6-astra",
              "gpt-4o-mini",
              "gpt-4o",
              "gpt-4-turbo",
              "o3-mini",
              "gemini-3.5-flash-lite",
              "gemini-3.5-flash",
              "gemini-2.5-flash",
              "gemini-2.0-flash",
              "gemini-1.5-pro"
            ];
            if (predefined.includes(data.aiModel)) {
              setAiModel(data.aiModel);
              setCustomModelInput("");
            } else {
              setAiModel("custom");
              setCustomModelInput(data.aiModel);
            }
          } else {
            setAiModel("gpt-5.6-luna");
            setCustomModelInput("");
          }

          if (data.aiCustomInstructions !== undefined && data.aiCustomInstructions !== null) {
            setRules(parseRules(data.aiCustomInstructions));
          } else {
            setRules([]);
          }
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
    const effectiveModel = aiModel === "custom" ? (customModelInput.trim() || "gpt-5.6-luna") : aiModel;

    try {
      const res = await fetch("/cashFlow/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeCurrency,
          appPassword,
          openaiApiKey,
          geminiApiKey,
          aiModel: effectiveModel,
          aiCustomInstructions: formattedInstructions
        })
      });
      if (res.ok) {
        onClose();
        window.location.reload();
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(`Failed to save settings: ${errJson.error || res.statusText}`);
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
        <div className={styles.headerRow}>
          <h2 className={styles.title}>⚙️ Settings & AI Rules</h2>
          <button className={styles.closeBtnIcon} onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSave}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Primary Currency (Home Currency)</label>
            <p className={styles.description}>
              Consolidates reporting across your dashboard, budgets, and AI financial analysis.
            </p>
            <select 
              value={homeCurrency} 
              onChange={e => setHomeCurrency(e.target.value)}
              className={styles.select}
            >
              <option value="CAD">CAD - Canadian Dollar ($)</option>
              <option value="USD">USD - US Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="RUB">RUB - Russian Ruble (₽)</option>
              <option value="KZT">KZT - Kazakhstani Tenge (₸)</option>
              <option value="GBP">GBP - British Pound (£)</option>
              <option value="AUD">AUD - Australian Dollar ($)</option>
            </select>
          </div>

          <div className={styles.divider} />

          <div className={styles.sectionHeader}>
            <h3>🔐 Security & Passcode</h3>
            <p className={styles.description}>
              Set an app passcode to restrict access. Leave empty to disable security check on launch.
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>App Passcode</label>
            <input 
              type="text"
              value={appPassword}
              onChange={e => setAppPassword(e.target.value)}
              placeholder="Leave empty to disable passcode"
              className={styles.select}
            />
          </div>

          <div className={styles.divider} />

          <div className={styles.sectionHeader}>
            <h3>🤖 AI Assistant & Model Selection</h3>
            <p className={styles.description}>
              Configure your API keys for OpenAI and/or Google Gemini, select models, and manage custom rules.
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>🔑 OpenAI API Key (ChatGPT / GPT-5.6 / GPT-6 / o3-mini)</label>
            <p className={styles.description}>
              API Key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>OpenAI Platform</a> (starts with <code>sk-...</code> or <code>AQ...</code>).
            </p>
            <input 
              type="password"
              value={openaiApiKey}
              onChange={e => setOpenaiApiKey(e.target.value)}
              placeholder="sk-proj-..."
              className={styles.select}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>✨ Google Gemini API Key (Gemini 3.5 / 2.5)</label>
            <p className={styles.description}>
              API Key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>Google AI Studio</a> (starts with <code>AQ...</code> or <code>AIzaSy...</code>).
            </p>
            <input 
              type="password"
              value={geminiApiKey}
              onChange={e => setGeminiApiKey(e.target.value)}
              placeholder="AQ..."
              className={styles.select}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>AI Model</label>
            <p className={styles.description}>
              Select the default LLM model for your AI Financial Advisor and receipt scanner.
            </p>
            <select 
              value={aiModel} 
              onChange={e => setAiModel(e.target.value)}
              className={styles.select}
            >
              <option value="gpt-5.6-luna">🌙 OpenAI gpt-5.6-luna (Fast, cost-efficient 2026 default)</option>
              <option value="gpt-5.6-sol">☀️ OpenAI gpt-5.6-sol (High-precision professional model)</option>
              <option value="gpt-5.6-terra">🌍 OpenAI gpt-5.6-terra (Balanced intelligence & speed)</option>
              <option value="gpt-6-astra">🚀 OpenAI gpt-6-astra (Flagship 2026 next-gen model)</option>
              <option value="gpt-4o-mini">⚡ OpenAI gpt-4o-mini</option>
              <option value="gpt-4o">🧠 OpenAI gpt-4o</option>
              <option value="o3-mini">💡 OpenAI o3-mini (Reasoning Model)</option>
              <option value="gemini-3.5-flash-lite">✨ Google gemini-3.5-flash-lite (Recommended 2026)</option>
              <option value="gemini-3.5-flash">✨ Google gemini-3.5-flash</option>
              <option value="gemini-2.5-flash">✨ Google gemini-2.5-flash</option>
              <option value="gemini-2.0-flash">✨ Google gemini-2.0-flash</option>
              <option value="gemini-1.5-pro">💎 Google gemini-1.5-pro</option>
              <option value="custom">✏️ Custom Model Name (Type manually...)</option>
            </select>

            {aiModel === "custom" && (
              <input
                type="text"
                value={customModelInput}
                onChange={e => setCustomModelInput(e.target.value)}
                placeholder="Enter model name (e.g. gpt-5.6-luna-light or fine-tuned ID)..."
                className={styles.select}
                style={{ marginTop: '10px' }}
              />
            )}
          </div>

          <div className={styles.divider} />

          <div className={styles.formGroup}>
            <label className={styles.label}>Custom AI Rules & Directives</label>
            <p className={styles.description}>
              Each rule is stored as a distinct card. You can add, edit ✏️, and delete 🗑️ rules anytime.
            </p>

            <div className={styles.rulesList}>
              {rules.length === 0 ? (
                <div className={styles.noRulesText}>No custom rules saved yet. Add your first rule card below!</div>
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
                          title="Save Rule"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className={styles.iconBtnCancel}
                          title="Cancel"
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
                            title="Edit Rule"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id)}
                            className={styles.ruleActionBtn}
                            title="Delete Rule"
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
                placeholder="e.g. Analyze each month separately without year averaging..."
                className={styles.addRuleInput}
              />
              <button
                type="button"
                onClick={() => handleAddRule()}
                disabled={!newRuleText.trim()}
                className={styles.addRuleBtn}
              >
                + Add Rule
              </button>
            </div>
          </div>
          
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>Cancel</button>
            <button type="submit" disabled={saving} className={styles.btnPrimary}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

