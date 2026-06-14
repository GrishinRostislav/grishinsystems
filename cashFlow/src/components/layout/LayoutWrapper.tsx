"use client";

import { usePathname } from "next/navigation";
import styles from "./Layout.module.css";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide layout (sidebar, topbar, background containers) on the login page
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

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
