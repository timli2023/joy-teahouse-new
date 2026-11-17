
"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          console.log("Joy Teahouse PWA registered");
        })
        .catch((error) => {
          console.error("PWA registration failed:", error);
        });
    }
  }, []);

  return null;
}
