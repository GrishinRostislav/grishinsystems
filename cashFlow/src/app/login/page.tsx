"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (frozen || !password) return;
    
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/cashFlow/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();
      
      if (res.status === 429) {
        setFrozen(true);
        setError("Превышено количество попыток. Доступ заблокирован на 10 минут.");
      } else if (!res.ok) {
        setError(data.error === "Invalid password" ? "Неверный пароль" : (data.error || "Неверный пароль"));
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>CashFlow</h1>
        <p className={styles.subtitle}>Введите пароль для доступа к финансам</p>

        {frozen ? (
          <div className={styles.frozen}>
            Превышено количество попыток входа (3).
            <br/><br/>
            Вход закрыт в целях безопасности. Повторите попытку через 10 минут.
          </div>
        ) : (
          <form onSubmit={handleLogin} className={styles.form}>
            <input
              type="password"
              placeholder="Пароль"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button type="submit" className={styles.button} disabled={loading || !password}>
              {loading ? "Проверка..." : "Войти"}
            </button>
            {error && <div className={styles.error}>{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
