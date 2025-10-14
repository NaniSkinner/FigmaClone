"use client";

import { useState, useEffect } from "react";

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-hide "back online" message after 3 seconds
  useEffect(() => {
    if (isOnline && showOffline) {
      const timer = setTimeout(() => {
        setShowOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOffline]);

  // Only show when offline or when coming back online
  if (!showOffline && isOnline) return null;

  return (
    <div
      className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border-2 transition-all duration-300 ${
        isOnline
          ? "bg-emerald-50 border-emerald-500 text-emerald-700"
          : "bg-red-50 border-red-500 text-red-700"
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold">Back Online</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm font-semibold">Connection Lost</span>
          </>
        )}
      </div>
      {!isOnline && (
        <p className="text-xs mt-1">Changes will sync when reconnected</p>
      )}
    </div>
  );
}
