"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

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
    </aside>
  );
}
