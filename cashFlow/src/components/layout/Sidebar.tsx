"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import SettingsModal from "../SettingsModal";

const navItems = [
  { name: "Dashboard", path: "/", icon: "📊" },
  { name: "Planning", path: "/planning", icon: "📅" },
  { name: "Accounts", path: "/accounts", icon: "🏦" },
  { name: "Transactions", path: "/transactions", icon: "💸" },
  { name: "Budgets", path: "/budgets", icon: "👛" },
  { name: "Categories", path: "/categories", icon: "📁" },
  { name: "Merchants", path: "/merchants", icon: "🏪" },
  { name: "Simulator", path: "/simulator", icon: "🔮" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        CashFlow
      </div>
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
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div style={{ marginTop: 'auto', padding: '16px' }}>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className={styles.navItem}
          style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', opacity: 0.8 }}
        >
          <span className={styles.icon}>⚙️</span>
          Settings
        </button>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </aside>
  );
}
