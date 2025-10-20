"use client";

import React, { useState } from "react";
import { GhibliStyle } from "@/types/ai";
import { CanvasObject } from "@/types/canvas";
import {
  generateGhibliVariant,
  getStyleDisplayName,
  getStyleDescription,
} from "@/lib/ai/ghibliGenerator";
import { useToast } from "@/contexts/ToastContext";
import { useUserStore } from "@/store/userStore";
import { useCanvasStore } from "@/store/canvasStore";

interface GhibliTransformButtonProps {
  imageId: string;
  createObject: (object: CanvasObject) => Promise<void>;
  updateObjectInFirestore: (id: string, updates: Partial<CanvasObject>) => void;
}

export const GhibliTransformButton: React.FC<GhibliTransformButtonProps> = ({
  imageId,
  createObject,
  updateObjectInFirestore,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<GhibliStyle>("anime");
  const [keepOriginal, setKeepOriginal] = useState(true);

  const { addToast } = useToast();
  const { currentUser } = useUserStore();
  const { currentProjectId } = useCanvasStore();

  const styles: GhibliStyle[] = ["anime", "ghibli", "spirited_away", "totoro"];

  const handleGenerate = async () => {
    if (!currentUser) {
      addToast("Please log in to use AI features", "error");
      return;
    }

    if (!currentProjectId) {
      addToast("Please save project first", "error");
      return;
    }

    setIsGenerating(true);
    setShowStylePicker(false);

    // Show initial toast
    const toastId = `ghibli-${Date.now()}`;
    let currentStage = "Starting...";
    addToast("🎨 Starting Ghibli transformation...", "info", 0);

    try {
      const result = await generateGhibliVariant({
        imageId,
        style: selectedStyle,
        keepOriginal,
        userId: currentUser.id,
        projectId: currentProjectId,
        createObject,
        updateObjectInFirestore,
        onProgress: (stage) => {
          currentStage = stage;
          // Update progress in console (toast updates are tricky with auto-dismiss)
          console.log(`[Ghibli] ${stage}`);
        },
      });

      if (result.success) {
        const costStr = result.cost ? `$${result.cost.toFixed(4)}` : "";
        const durationStr = result.duration
          ? `${(result.duration / 1000).toFixed(1)}s`
          : "";

        addToast(
          `✅ Ghibli transformation complete! ${costStr} • ${durationStr}`,
          "success",
          5000
        );
      } else {
        addToast(`❌ Generation failed: ${result.error}`, "error", 5000);
      }
    } catch (error) {
      console.error("Generation error:", error);
      addToast(
        `❌ Generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error",
        5000
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Main Button */}
      <button
        onClick={() => setShowStylePicker(!showStylePicker)}
        disabled={isGenerating}
        className={`
          w-full px-4 py-2 rounded-lg font-medium text-sm
          transition-all duration-200
          ${
            isGenerating
              ? "bg-gray-400 cursor-not-allowed text-gray-700"
              : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl"
          }
        `}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating...
          </span>
        ) : (
          "✨ Ghibli Transform"
        )}
      </button>

      {/* Style Picker Panel */}
      {showStylePicker && !isGenerating && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-lg space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Choose Style</h3>

          {/* Style Options */}
          <div className="space-y-2">
            {styles.map((style) => (
              <label
                key={style}
                className={`
                  flex items-start gap-3 p-3 rounded-lg cursor-pointer
                  transition-all duration-150
                  ${
                    selectedStyle === style
                      ? "bg-purple-50 border-2 border-purple-500"
                      : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                  }
                `}
              >
                <input
                  type="radio"
                  name="ghibli-style"
                  value={style}
                  checked={selectedStyle === style}
                  onChange={(e) =>
                    setSelectedStyle(e.target.value as GhibliStyle)
                  }
                  className="mt-1 text-purple-500 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">
                    {getStyleDisplayName(style)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {getStyleDescription(style)}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Keep Original Option */}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={keepOriginal}
              onChange={(e) => setKeepOriginal(e.target.checked)}
              className="text-purple-500 focus:ring-purple-500 rounded"
            />
            <span>Keep original image</span>
          </label>

          {/* Cost/Time Estimate */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            💡 Estimated: ~$0.05 • 20-30 seconds
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Generate
          </button>

          {/* Cancel Button */}
          <button
            onClick={() => setShowStylePicker(false)}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
