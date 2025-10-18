"use client";

import { createPortal } from "react-dom";
import { ExportProgress } from "@/types/export";

interface ExportProgressModalProps {
  isOpen: boolean;
  progress: ExportProgress;
  onCancel?: () => void;
}

export default function ExportProgressModal({
  isOpen,
  progress,
  onCancel,
}: ExportProgressModalProps) {
  if (!isOpen) return null;

  // Get stage-specific icon
  const getStageIcon = () => {
    switch (progress.stage) {
      case "preparing":
        return "⚙️";
      case "rendering":
        return "🎨";
      case "encoding":
        return "📦";
      case "complete":
        return "✅";
    }
  };

  // Get stage-specific label
  const getStageLabel = () => {
    switch (progress.stage) {
      case "preparing":
        return "Preparing Export";
      case "rendering":
        return "Rendering Canvas";
      case "encoding":
        return "Encoding PNG";
      case "complete":
        return "Export Complete";
    }
  };

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
        {/* Icon and Title */}
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{getStageIcon()}</div>
          <h2 className="text-xl font-bold">{getStageLabel()}</h2>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress.progress}%` }}
            />
          </div>

          {/* Progress Message */}
          <p className="text-sm text-gray-600 mt-2 text-center">
            {progress.message}
          </p>

          {/* Progress Percentage */}
          <p className="text-xs text-gray-400 text-center mt-1">
            {Math.round(progress.progress)}%
          </p>
        </div>

        {/* Cancel Button (only before complete) */}
        {progress.stage !== "complete" && onCancel && (
          <div className="flex justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Auto-close message */}
        {progress.stage === "complete" && (
          <p className="text-sm text-green-600 text-center">
            Download started automatically
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
