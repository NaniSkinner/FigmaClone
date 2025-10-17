"use client";

/**
 * useUndoKeyboard Hook
 *
 * Handles keyboard shortcuts for undo/redo operations.
 * - Ctrl+Z (or Cmd+Z on Mac): Undo
 * - Ctrl+Shift+Z (or Cmd+Shift+Z on Mac): Redo
 *
 * Reference: aiTasks.md Task 11.2.4 - Keyboard Shortcuts
 */

import { useEffect } from "react";

interface UseUndoKeyboardProps {
  onUndo: () => void;
  onRedo: () => void;
  enabled?: boolean;
}

export function useUndoKeyboard({
  onUndo,
  onRedo,
  enabled = true,
}: UseUndoKeyboardProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMod = event.metaKey || event.ctrlKey;

      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Redo: Ctrl+Shift+Z or Cmd+Shift+Z
      if (isMod && event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        onRedo();
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z
      if (isMod && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        onUndo();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onUndo, onRedo, enabled]);
}
