"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const primaryTabs = [
    {
      name: "Main",
      path: "/",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    {
      name: "Txns",
      path: "/transactions",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      )
    },
    {
      name: "Plan",
      path: "/planning",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      )
    },
    {
      name: "Analytics",
      path: "/forecast",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      )
    }
  ];

  const secondaryTabs = [
    { name: "Accounts & Net Worth", path: "/accounts", icon: "🏦" },
    { name: "Budgets", path: "/budgets", icon: "📊" },
    { name: "Categories", path: "/categories", icon: "📁" },
    { name: "Payees & Merchants", path: "/merchants", icon: "🏪" },
  ];

  const isMoreActive = secondaryTabs.some(t => t.path === pathname);

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className={styles.bottomNav}>
        {primaryTabs.map(tab => {
          const isActive = pathname === tab.path;
          return (
            <Link
              href={tab.path}
              key={tab.name}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              onClick={() => setIsMoreOpen(false)}
            >
              <span className={styles.icon}>{tab.icon}</span>
              <span className={styles.label}>{tab.name}</span>
            </Link>
          );
        })}

        {/* More Tab Trigger */}
        <button
          type="button"
          className={`${styles.navItem} ${isMoreActive || isMoreOpen ? styles.active : ""}`}
          onClick={() => setIsMoreOpen(!isMoreOpen)}
        >
          <span className={styles.icon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="19" cy="12" r="1"/>
              <circle cx="5" cy="12" r="1"/>
            </svg>
          </span>
          <span className={styles.label}>More</span>
        </button>
      </nav>

      {/* Popover Sheet for "More" menu */}
      {isMoreOpen && (
        <div className={styles.overlay} onClick={() => setIsMoreOpen(false)}>
          <div className={styles.popoverSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <h4>More Features</h4>
              <button className={styles.closeBtn} onClick={() => setIsMoreOpen(false)}>&times;</button>
            </div>
            <div className={styles.sheetGrid}>
              {secondaryTabs.map(tab => {
                const isActive = pathname === tab.path;
                return (
                  <Link
                    key={tab.name}
                    href={tab.path}
                    className={`${styles.sheetItem} ${isActive ? styles.sheetItemActive : ""}`}
                    onClick={() => setIsMoreOpen(false)}
                  >
                    <span className={styles.sheetIcon}>{tab.icon}</span>
                    <span className={styles.sheetLabel}>{tab.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
