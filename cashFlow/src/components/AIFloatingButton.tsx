"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./AIFloatingButton.module.css";

import SettingsModal from "./SettingsModal";

interface AlertItem {
  id: string;
  type: 'PAYMENT' | 'SPIKE' | 'BUDGET';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AIFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: '👋 Hello! I am your Personal AI Financial Advisor in CashFlow. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/cashFlow/api/ai/alerts');
      if (res.ok) {
        const json = await res.json();
        setAlerts(json.alerts || []);
      }
    } catch (err) {
      console.error("Failed to fetch AI alerts", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh alerts every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch('/cashFlow/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: updatedMessages.slice(1, -1) // Send conversation context (excluding initial greeting and current msg)
        })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || `Server status ${res.status}`);
      }

      setMessages([
        ...updatedMessages,
        { role: 'model', content: json.reply || 'Failed to get a response from AI.' }
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages([
        ...updatedMessages,
        { role: 'model', content: `⚠️ ${err?.message || 'An error occurred while connecting to AI Assistant. Please try again.'}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Top Center AI Pill Button */}
      <button 
        className={styles.floatingBtn}
        onClick={() => setIsOpen(true)}
        title="AI Financial Advisor"
        aria-label="AI Financial Advisor"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" fill="url(#aiBtnGrad)" />
          <path d="M12 5.5L13.8 9.5L17.8 11.3L13.8 13.1L12 17.1L10.2 13.1L6.2 11.3L10.2 9.5L12 5.5Z" fill="white" />
          <path d="M17.5 4.5L18.2 6.1L19.8 6.8L18.2 7.5L17.5 9.1L16.8 7.5L15.2 6.8L16.8 6.1L17.5 4.5Z" fill="#a7f3d0" />
          <defs>
            <linearGradient id="aiBtnGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#059669" />
              <stop offset="0.5" stopColor="#0284c7" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
        <span style={{ fontWeight: 700, letterSpacing: '-0.2px' }}>AI Copilot</span>
        {alerts.length > 0 && (
          <span className={styles.badge}>
            {alerts.length}
          </span>
        )}
      </button>

      {/* Floating AI Chat Window Modal */}
      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.chatWindow} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatTitleGroup}>
                <div className={styles.chatAvatar}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5.5L13.8 9.5L17.8 11.3L13.8 13.1L12 17.1L10.2 13.1L6.2 11.3L10.2 9.5L12 5.5Z" fill="#10b981" />
                    <path d="M17.5 4.5L18.2 6.1L19.8 6.8L18.2 7.5L17.5 9.1L16.8 7.5L15.2 6.8L16.8 6.1L17.5 4.5Z" fill="#38bdf8" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.chatTitle}>AI Financial Advisor</h3>
                  <span className={styles.chatSubtitle}>CashFlow Copilot • Online</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  className={styles.closeBtn} 
                  style={{ fontSize: '1.1rem', padding: '4px 8px' }}
                  onClick={() => setMessages([{
                    role: 'model',
                    content: '👋 Hello! I am your Personal AI Financial Advisor in CashFlow. How can I help you today?'
                  }])}
                  title="Clear Chat History (New Session)"
                >
                  🔄
                </button>
                <button 
                  className={styles.closeBtn} 
                  style={{ fontSize: '1.2rem', padding: '4px 8px' }}
                  onClick={() => setIsSettingsOpen(true)}
                  title="AI Settings"
                >
                  ⚙️
                </button>
                <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                  &times;
                </button>
              </div>
            </div>

            {/* Proactive Alerts Section */}
            {alerts.length > 0 && (
              <div className={styles.alertsSection}>
                {alerts.map((alert) => {
                  let alertClass = styles.alertInfo;
                  if (alert.severity === 'warning') alertClass = styles.alertWarning;
                  if (alert.severity === 'danger') alertClass = styles.alertDanger;

                  return (
                    <div key={alert.id} className={`${styles.alertItem} ${alertClass}`}>
                      <strong>{alert.title}:</strong> {alert.message}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Messages Body */}
            <div className={styles.messagesBody}>
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`${styles.messageBubble} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage}`}
                >
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className={`${styles.messageBubble} ${styles.aiMessage}`} style={{ fontStyle: 'italic', opacity: 0.8 }}>
                  🧠 Analyzing database transactions...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className={styles.chipsContainer}>
              <button 
                className={styles.chip}
                onClick={() => handleSend("Perform a detailed audit of my expenses for this month.")}
              >
                 Audit Expenses
              </button>
              <button 
                className={styles.chip}
                onClick={() => handleSend("Where can I optimize my spending and save money?")}
              >
                💡 Where to Save
              </button>
              <button 
                className={styles.chip}
                onClick={() => handleSend("Give me a full breakdown of my monthly cash flow.")}
              >
                 Cash Flow Summary
              </button>
              <button 
                className={styles.chip}
                onClick={() => handleSend("What upcoming scheduled bills or payments do I have?")}
              >
                 Upcoming Payments
              </button>
            </div>

            {/* Input Form */}
            <form 
              className={styles.inputForm}
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input 
                type="text"
                className={styles.input}
                placeholder="Ask AI about your finances..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit" 
                className={styles.sendBtn}
                disabled={loading || !input.trim()}
              >
                Send
              </button>
            </form>

          </div>
        </div>
      )}

      {/* AI & Global Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
}
