"use client";

import { useEffect, useRef } from "react";

interface UseAutoSyncOptions {
  intervalMs?: number;
  enabled?: boolean;
}

export function useAutoSync(
  onSync: () => void | Promise<void>,
  options: UseAutoSyncOptions = {}
) {
  const { intervalMs = 12000, enabled = true } = options;
  const lastSyncTimestampRef = useRef<number>(0);
  const onSyncRef = useRef(onSync);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const checkSyncStatus = async () => {
      try {
        const res = await fetch("/api/sync/status");
        if (res.ok) {
          const { lastUpdated } = await res.json();
          if (lastSyncTimestampRef.current === 0) {
            lastSyncTimestampRef.current = lastUpdated;
          } else if (lastUpdated > lastSyncTimestampRef.current) {
            lastSyncTimestampRef.current = lastUpdated;
            if (isMounted) {
              await onSyncRef.current();
            }
          }
        }
      } catch (err) {
        console.error("AutoSync check failed", err);
      }
    };

    // Immediate check on initial mount
    checkSyncStatus();

    // Setup periodic polling interval
    const timer = setInterval(() => {
      checkSyncStatus();
    }, intervalMs);

    // Setup focus and visibility change listeners (e.g., when switching back to tab or unlocking phone)
    const handleFocus = () => {
      checkSyncStatus();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSyncStatus();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
