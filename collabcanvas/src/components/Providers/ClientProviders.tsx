"use client";

import React from "react";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/UI/ToastContainer";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        {children}
        <ToastContainer />
      </ToastProvider>
    </ErrorBoundary>
  );
}
