"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useProjectStore } from "@/store/projectStore";
import { useCanvasStore } from "@/store/canvasStore";

interface SaveProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectName: string) => void;
}

export default function SaveProjectDialog({
  isOpen,
  onClose,
  onSave,
}: SaveProjectDialogProps) {
  const [projectName, setProjectName] = useState("Untitled Project");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoize objects array to prevent infinite loops
  const objectsMap = useCanvasStore((state) => state.objects);
  const objects = useMemo(() => Array.from(objectsMap.values()), [objectsMap]);
  const isSaving = useProjectStore((state) => state.isSaving);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        const trimmedName = projectName.trim();
        if (trimmedName && trimmedName.length <= 50) {
          onSave(trimmedName);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, projectName, onClose, onSave]);

  const handleSave = async () => {
    // Validate name
    const trimmedName = projectName.trim();

    if (!trimmedName) {
      setError("Project name is required");
      return;
    }

    if (trimmedName.length > 50) {
      setError("Name is too long (max 50 characters)");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await onSave(trimmedName);
      setProjectName("Untitled Project"); // Reset for next time
    } catch (err) {
      setError("Failed to save project. Please try again.");
      console.error("Save error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed bg-black/50"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">💾 Save Project</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              setError(""); // Clear error on change
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            maxLength={50}
            disabled={isLoading || isSaving}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <p className="text-gray-500 text-xs mt-1">
            {projectName.length}/50 characters
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {objects.length} object{objects.length !== 1 ? "s" : ""} on canvas
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            disabled={isLoading || isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!projectName.trim() || isLoading || isSaving}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading || isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
