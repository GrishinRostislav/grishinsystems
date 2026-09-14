"use client";

import { useState, useEffect } from "react";
import styles from "./Topbar.module.css";
import SettingsModal from "../SettingsModal";

export default function Topbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const closeDropdown = () => setDropdownOpen(false);
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, [dropdownOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const handleSyncMerchants = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/cashFlow/api/merchants/sync", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Successfully synced ${data.updatedCount} transactions!`);
      } else {
        alert("Failed to sync merchants");
      }
    } catch (err) {
      console.error(err);
      alert("Error syncing merchants");
    } finally {
      setIsSyncing(false);
      setDropdownOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/cashFlow/api/auth", {
        method: "DELETE"
      });
      if (res.ok) {
        window.location.href = "/cashFlow/login";
      } else {
        alert("Logout failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error logging out");
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.title}>
        Overview
      </div>
      <div className={styles.actions}>
        <div className={styles.profileContainer}>
          <div 
            className={styles.avatar} 
            onClick={toggleDropdown}
          >
            ME
          </div>
          {dropdownOpen && (
            <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
              <div 
                className={styles.dropdownItem} 
                onClick={handleSyncMerchants}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
                </svg>
                {isSyncing ? "Syncing..." : "Sync Merchants"}
              </div>
              <div 
                className={styles.dropdownItem} 
                onClick={() => { setIsSettingsOpen(true); setDropdownOpen(false); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                  <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Settings
              </div>
              <div className={styles.dropdownDivider}></div>
              <div className={styles.dropdownItem} onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </div>
            </div>
          )}
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
}
