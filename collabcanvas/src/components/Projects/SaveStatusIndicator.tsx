"use client";

import { useProjectStore } from "@/store/projectStore";
import { useAutoSave } from "@/hooks/useAutoSave";

/**
 * Format relative time for display
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export default function SaveStatusIndicator() {
  // Use proper Zustand selectors to avoid infinite loops
  const currentProject = useProjectStore((state) => state.currentProject);
  const projectIsDirty = useProjectStore((state) => state.isDirty);
  const isStoreSaving = useProjectStore((state) => state.isSaving);

  const { isSaving: isAutoSaving, lastSaved } = useAutoSave();

  const isSaving = isStoreSaving || isAutoSaving;
  const isDirty = projectIsDirty;

  // Don't show if no project loaded
  if (!currentProject) return null;

  const getStatusDisplay = () => {
    if (isSaving) {
      return {
        icon: "⏳",
        text: "Saving...",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    }

    if (isDirty) {
      return {
        icon: "●",
        text: "Unsaved changes",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      };
    }

    if (lastSaved) {
      return {
        icon: "✓",
        text: `Saved ${formatRelativeTime(lastSaved)}`,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      };
    }

    return {
      icon: "✓",
      text: "All changes saved",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    };
  };

  const status = getStatusDisplay();

  return (
    <div
      className={`
        fixed top-4 right-4 z-30
        flex items-center gap-2 px-3 py-2 rounded-lg border
        ${status.bgColor} ${status.color} ${status.borderColor}
        text-sm font-medium
        transition-all duration-200
        shadow-sm
      `}
    >
      <span className={isSaving ? "animate-spin inline-block" : ""}>
        {status.icon}
      </span>
      <span>{status.text}</span>
    </div>
  );
}
