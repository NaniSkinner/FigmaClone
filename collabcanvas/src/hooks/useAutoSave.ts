"use client";

import { useEffect, useState, useRef } from "react";
import { useProjectStore } from "@/store/projectStore";
import { useCanvasStore } from "@/store/canvasStore";

/**
 * Auto-Save Hook
 *
 * Automatically saves the current project when changes are detected.
 * - Debounces saves by 2 seconds after last change
 * - Also performs periodic saves every 30 seconds
 * - Skips save if AI is processing or no project is loaded
 */
export function useAutoSave() {
  // Use proper Zustand selectors to avoid infinite loops
  const currentProject = useProjectStore((state) => state.currentProject);
  const isDirty = useProjectStore((state) => state.isDirty);
  const saveCurrentProject = useProjectStore(
    (state) => state.saveCurrentProject
  );
  const isAIProcessing = useCanvasStore((state) => state.isAIProcessing);
  const canvasIsDirty = useCanvasStore((state) => state.isDirty);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const periodicTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced auto-save (triggers 2 seconds after last change)
  useEffect(() => {
    // Only auto-save if:
    // 1. We have a current project loaded
    // 2. Canvas has unsaved changes
    // 3. AI is not currently processing
    if (!currentProject || (!isDirty && !canvasIsDirty) || isAIProcessing) {
      return;
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer (2 seconds)
    debounceTimerRef.current = setTimeout(async () => {
      if (currentProject && (isDirty || canvasIsDirty) && !isAIProcessing) {
        setIsSaving(true);
        try {
          await saveCurrentProject();
          setLastSaved(new Date());
        } catch (error) {
          console.error("Auto-save failed:", error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 2000); // 2 second debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    currentProject,
    isDirty,
    canvasIsDirty,
    isAIProcessing,
    saveCurrentProject,
  ]);

  // Periodic auto-save (every 30 seconds)
  useEffect(() => {
    periodicTimerRef.current = setInterval(async () => {
      if (
        currentProject &&
        (isDirty || canvasIsDirty) &&
        !isAIProcessing &&
        !isSaving
      ) {
        setIsSaving(true);
        try {
          await saveCurrentProject();
          setLastSaved(new Date());
        } catch (error) {
          console.error("Periodic auto-save failed:", error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 30000); // 30 seconds

    return () => {
      if (periodicTimerRef.current) {
        clearInterval(periodicTimerRef.current);
      }
    };
  }, [
    currentProject,
    isDirty,
    canvasIsDirty,
    isAIProcessing,
    isSaving,
    saveCurrentProject,
  ]);

  return {
    isSaving,
    lastSaved,
    isAutoSaveEnabled: !!currentProject && (isDirty || canvasIsDirty),
  };
}
