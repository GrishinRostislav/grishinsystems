"use client";

import { useState, useEffect } from "react";
import styles from "./Topbar.module.css";

export default function Topbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const handleLogout = async () => {
    try {
      const res = await fetch("/cashFlow/api/auth", {
        method: "DELETE"
      });
      if (res.ok) {
        // Perform a full reload to the login page to flush any local/cached state
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
              <div className={styles.dropdownItem} onClick={handleLogout}>
                Выйти (Logout)
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
