"use client";

import { createPortal } from "react-dom";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onDontSave: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function UnsavedChangesDialog({
  isOpen,
  onDontSave,
  onCancel,
  onSave,
}: UnsavedChangesDialogProps) {
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
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4">💾 Unsaved Changes</h2>
        <p className="text-gray-700 mb-6">
          You have unsaved changes. Would you like to save before switching
          projects?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onDontSave}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            Don&apos;t Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
