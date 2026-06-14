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
        setError("Too many attempts. Access locked for 10 minutes.");
      } else if (!res.ok) {
        setError(data.error === "Invalid password" ? "Invalid password" : (data.error || "Invalid password"));
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>CashFlow</h1>
        <p className={styles.subtitle}>Enter password to access finances</p>

        {frozen ? (
          <div className={styles.frozen}>
            Too many failed login attempts (3).
            <br/><br/>
            Access is locked for security reasons. Please try again in 10 minutes.
          </div>
        ) : (
          <form onSubmit={handleLogin} className={styles.form}>
            <input
              type="password"
              placeholder="Password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button type="submit" className={styles.button} disabled={loading || !password}>
              {loading ? "Checking..." : "Log In"}
            </button>
            {error && <div className={styles.error}>{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
