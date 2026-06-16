"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const navItems = [
  { name: "Dashboard", path: "/", color: "#008080", icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
  { name: "Planning", path: "/planning", color: "#6366f1", icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </svg>
  )},
  { name: "Accounts", path: "/accounts", color: "#0ea5e9", icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </svg>
  )},
  { name: "Transactions", path: "/transactions", color: "#f59e0b", icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3L21 7L17 11"/>
      <line x1="21" y1="7" x2="9" y2="7"/>
      <path d="M7 13L3 17L7 21"/>
      <line x1="3" y1="17" x2="15" y2="17"/>
    </svg>
  )},
  { name: "Budgets", path: "/budgets", color: "#10b981", icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  )},
  { name: "Categories", path: "/categories", color: "#ec4899", icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/>
      <circle cx="7.5" cy="7.5" r="1"/>
    </svg>
  )},
  { name: "Merchants", path: "/merchants", color: "#8b5cf6", icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  )},
];

export default function Sidebar() {
  const pathname = usePathname();
  const [fabOpen, setFabOpen] = useState(false);

  // Close FAB when navigating
  useEffect(() => {
    setFabOpen(false);
  }, [pathname]);

  // Close on escape
  useEffect(() => {
    if (!fabOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setFabOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [fabOpen]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>CashFlow</div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                href={item.path}
                key={item.name}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile FAB Navigation */}
      <div className={styles.fabContainer}>
        {/* Backdrop */}
        {fabOpen && (
          <div className={styles.fabBackdrop} onClick={() => setFabOpen(false)} />
        )}

        {/* Menu Items */}
        <div className={`${styles.fabMenu} ${fabOpen ? styles.fabMenuOpen : ""}`}>
          {navItems.map((item, index) => {
            const isActive = pathname === item.path;
            // Arrange items in a semi-circle arc above the FAB
            const totalItems = navItems.length;
            const angleSpread = 140; // degrees of spread
            const startAngle = (180 + (180 - angleSpread) / 2); // center the arc
            const angleStep = angleSpread / (totalItems - 1);
            const angle = (startAngle + angleStep * index) * (Math.PI / 180);
            const radius = 165;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <Link
                href={item.path}
                key={item.name}
                className={`${styles.fabItem} ${isActive ? styles.fabItemActive : ""}`}
                style={{
                  '--fab-x': `${x}px`,
                  '--fab-y': `${y}px`,
                  '--fab-delay': `${index * 40}ms`,
                  '--fab-color': item.color,
                } as React.CSSProperties}
                onClick={() => setFabOpen(false)}
              >
                <div className={styles.fabItemIcon}>{item.icon}</div>
                <span className={styles.fabItemLabel}>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Glassmorphic Dock Background */}
        <div className={styles.fabDock} />

        {/* FAB Button */}
        <button
          className={`${styles.fab} ${fabOpen ? styles.fabActive : ""}`}
          onClick={() => setFabOpen(!fabOpen)}
          aria-label="Navigation menu"
        >
          <svg
            className={styles.fabIconMenu}
            width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="19" r="1"/>
            <circle cx="5" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="5" r="1"/>
            <circle cx="19" cy="19" r="1"/>
          </svg>
          <svg
            className={styles.fabIconClose}
            width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </>
  );
}
