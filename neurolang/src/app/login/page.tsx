'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/neurolang/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Connection error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div className="glass glow-primary" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
        borderRadius: 'var(--radius)',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '2.2rem',
          fontWeight: 800,
          background: 'linear-gradient(to right, #a78bfa, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
        }}>NeuroLang</h1>
        <p style={{
          fontSize: '0.95rem',
          color: 'hsl(var(--muted-foreground))',
          marginBottom: '2rem',
        }}>Enter your credentials to continue learning</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="you@example.com"
              required
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.6rem',
                padding: '0.8rem 1rem',
                color: '#fff',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              required
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.6rem',
                padding: '0.8rem 1rem',
                color: '#fff',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
            />
          </div>

          {error && (
            <div style={{
              color: 'hsl(var(--destructive))',
              fontSize: '0.85rem',
              textAlign: 'left',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '0.6rem 0.8rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glass-interactive"
            style={{
              background: 'hsl(var(--primary))',
              color: '#fff',
              border: 'none',
              borderRadius: '0.6rem',
              padding: '0.9rem',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{
          fontSize: '0.9rem',
          color: 'hsl(var(--muted-foreground))',
          marginTop: '2rem',
        }}>
          Don't have an account?{' '}
          <Link href="/register" style={{
            color: 'hsl(var(--primary))',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
