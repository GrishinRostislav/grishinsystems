"use client";

import styles from "./Layout.module.css";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Topbar />
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
