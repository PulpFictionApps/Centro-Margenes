"use client";

import { useEffect } from "react";

/**
 * Registers the service worker once the app is mounted.
 * Must be a Client Component so it can access navigator.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] registered, scope:", reg.scope);
        })
        .catch((err) => {
          console.error("[SW] registration failed:", err);
        });
    }
  }, []);

  return null;
}
