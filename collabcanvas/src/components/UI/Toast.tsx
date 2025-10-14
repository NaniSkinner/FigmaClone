"use client";

import React, { useEffect, useState } from "react";
import { Toast as ToastType } from "@/contexts/ToastContext";
import { useToast } from "@/contexts/ToastContext";

interface ToastProps {
  toast: ToastType;
}

export default function Toast({ toast }: ToastProps) {
  const { removeToast } = useToast();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit animation before removal
    if (toast.duration && toast.duration > 0) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, toast.duration - 300); // Start exit 300ms before removal

      return () => clearTimeout(exitTimer);
    }
  }, [toast.duration]);

  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-[#6B8E4E] text-white"; // Dark matcha green for success
      case "error":
        return "bg-red-500 text-white";
      case "warning":
        return "bg-[#B4A7D6] text-gray-900"; // Lavender purple for warnings
      case "info":
      default:
        return "bg-[#7BA05B] text-white"; // Matcha green for info
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
      default:
        return "ℹ";
    }
  };

  return (
    <div
      className={`
        ${getToastStyles()}
        px-4 py-3 rounded-lg shadow-xl border-2 border-white/20
        flex items-center gap-3
        min-w-[280px] max-w-[400px]
        pointer-events-auto
        transition-all duration-300 ease-in-out
        backdrop-blur-sm
        ${
          isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
        }
      `}
      style={{
        animation: isExiting
          ? "slideOut 0.3s ease-out forwards"
          : "slideIn 0.3s ease-out",
      }}
    >
      <span className="text-xl font-bold flex-shrink-0">{getIcon()}</span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-white hover:text-gray-200 transition-colors flex-shrink-0 ml-2"
        aria-label="Close notification"
      >
        ✕
      </button>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
