"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./AIFloatingButton.module.css";

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
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: '👋 Здравствуйте! Я ваш ИИ-Финансовый Советник в CashFlow. Чем могу помочь прямо сейчас?'
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

      if (!res.ok) throw new Error("AI API request failed");
      const json = await res.json();

      setMessages([
        ...updatedMessages,
        { role: 'model', content: json.reply || 'Не удалось получить ответ от ИИ.' }
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...updatedMessages,
        { role: 'model', content: '⚠️ Произошла ошибка при обращении к ИИ-Ассистенту. Попробуйте еще раз.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <button 
        className={styles.floatingBtn}
        onClick={() => setIsOpen(true)}
        title="ИИ-Финансовый Советник"
        aria-label="ИИ-Финансовый Советник"
      >
        <span style={{ fontSize: '26px' }}>🤖</span>
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
                <div className={styles.chatAvatar}>🤖</div>
                <div>
                  <h3 className={styles.chatTitle}>ИИ-Финансовый Советник</h3>
                  <span className={styles.chatSubtitle}>CashFlow Copilot • Онлайн</span>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                &times;
              </button>
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
                  🧠 Анализирую данные из базы...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className={styles.chipsContainer}>
              <button 
                className={styles.chip}
                onClick={() => handleSend("Проведи глубокий аудит моих трат за этот месяц.")}
              >
                 Аудит трат
              </button>
              <button 
                className={styles.chip}
                onClick={() => handleSend("Где я могу сэкономить больше всего денег?")}
              >
                💡 Где сэкономить
              </button>
              <button 
                className={styles.chip}
                onClick={() => handleSend("Оцени мою подушку безопасности и финансовое здоровье.")}
              >
                 Подушка 3-Mo
              </button>
              <button 
                className={styles.chip}
                onClick={() => handleSend("Какие платежи мне предстоят в ближайшее время?")}
              >
                 Счета и платежи
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
                placeholder="Спросите ИИ о ваших финансах..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit" 
                className={styles.sendBtn}
                disabled={loading || !input.trim()}
              >
                Отправить
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
