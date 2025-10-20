"use client";

import { useState } from "react";
import { useCanvasStore } from "@/store";
import LayerItem from "./LayerItem";
import { useLayerManagement } from "@/hooks/useLayerManagement";
import { CanvasObject, ImageObject, ImageFilter } from "@/types";
import { GhibliTransformButton } from "@/components/UI/GhibliTransformButton";

interface LayerPanelProps {
  canvasId: string;
  userId: string | null;
  updateObjectInFirestore: (id: string, updates: Partial<CanvasObject>) => void;
  createObject: (object: CanvasObject) => Promise<void>;
}

export default function LayerPanel({
  canvasId,
  userId,
  updateObjectInFirestore,
  createObject,
}: LayerPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { objects, selectedObjectIds, addToSelection, clearSelection } =
    useCanvasStore();
  const { bringToFront, sendToBack, bringForward, sendBackward } =
    useLayerManagement(updateObjectInFirestore);

  // Sort objects by zIndex (highest first for top-to-bottom display)
  const sortedObjects = Array.from(objects.values())
    .filter((obj) => obj && obj.type) // Filter out invalid objects
    .sort((a, b) => b.zIndex - a.zIndex);

  const handleLayerSelect = (id: string) => {
    // Click to select single layer
    clearSelection();
    addToSelection(id);
  };

  const handleVisibilityToggle = (id: string, visible: boolean) => {
    updateObjectInFirestore(id, { visible });
  };

  const handleLockToggle = (id: string, locked: boolean) => {
    updateObjectInFirestore(id, { locked });
  };

  // Check if a single image is selected
  const selectedImage =
    selectedObjectIds.size === 1
      ? (Array.from(objects.values()).find(
          (obj) => selectedObjectIds.has(obj.id) && obj.type === "image"
        ) as ImageObject | undefined)
      : undefined;

  // Get current blur value for selected image
  const getBlurValue = (img: ImageObject) => {
    const blurFilter = img.filters?.find((f) => f.type === "blur");
    return blurFilter && blurFilter.type === "blur" ? blurFilter.radius : 0;
  };

  // Handle blur change
  const handleBlurChange = (value: number) => {
    if (!selectedImage) return;

    const nonBlurFilters = (selectedImage.filters?.filter(
      (f) => f.type !== "blur"
    ) || []) as ImageFilter[];
    const newFilters: ImageFilter[] = [...nonBlurFilters];

    if (value > 0) {
      newFilters.push({ type: "blur", radius: value });
    }

    updateObjectInFirestore(selectedImage.id, {
      filters: newFilters.length > 0 ? newFilters : undefined,
    });
  };

  // Handle opacity change
  const handleOpacityChange = (value: number) => {
    if (!selectedImage) return;
    updateObjectInFirestore(selectedImage.id, { opacity: value });
  };

  return (
    <div
      className={`
        fixed right-4 top-4 bg-white rounded-lg
        shadow-xl transition-all duration-300 z-40 flex flex-col
        ${isCollapsed ? "w-12" : "w-64"}
      `}
      style={{
        height: "calc(100vh - 32px)",
        maxHeight: "calc(100vh - 32px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        {!isCollapsed && (
          <h2 className="text-base font-bold text-gray-800">Layers</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          title={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-transform text-gray-600 ${
              isCollapsed ? "rotate-180" : ""
            }`}
          >
            <path
              d="M12 8l-4 4 4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable Content Area */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Layer Actions (when expanded) */}
          {selectedObjectIds.size > 0 && (
            <div className="flex gap-2 p-3 border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white">
              <button
                onClick={bringToFront}
                className="flex-1 px-2 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                title="Bring to Front (Cmd/Ctrl + Shift + ])"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline mr-1"
                >
                  <rect
                    x="3"
                    y="3"
                    width="10"
                    height="10"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M8 10V6M6 8l2-2 2 2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Front
              </button>
              <button
                onClick={bringForward}
                className="flex-1 px-2 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                title="Bring Forward (Cmd/Ctrl + ])"
              >
                ↑
              </button>
              <button
                onClick={sendBackward}
                className="flex-1 px-2 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                title="Send Backward (Cmd/Ctrl + [)"
              >
                ↓
              </button>
              <button
                onClick={sendToBack}
                className="flex-1 px-2 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                title="Send to Back (Cmd/Ctrl + Shift + [)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline mr-1"
                >
                  <rect
                    x="3"
                    y="3"
                    width="10"
                    height="10"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M8 6v4M6 8l2 2 2-2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back
              </button>
            </div>
          )}

          {/* Image Effects Section (when single image is selected) */}
          {selectedImage && (
            <div className="p-3 border-b border-gray-200 bg-blue-50">
              <h3 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1">
                <span>🎨</span>
                <span>Image Effects</span>
              </h3>

              {/* Opacity (Fade) Control */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600">
                    Opacity
                  </label>
                  <span className="text-xs text-gray-500 font-mono">
                    {Math.round((selectedImage.opacity ?? 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selectedImage.opacity ?? 1}
                  onChange={(e) =>
                    handleOpacityChange(parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                      (selectedImage.opacity ?? 1) * 100
                    }%, #e5e7eb ${
                      (selectedImage.opacity ?? 1) * 100
                    }%, #e5e7eb 100%)`,
                  }}
                />
              </div>

              {/* Blur Control */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600">
                    Blur
                  </label>
                  <span className="text-xs text-gray-500 font-mono">
                    {getBlurValue(selectedImage)}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={getBlurValue(selectedImage)}
                  onChange={(e) => handleBlurChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                      (getBlurValue(selectedImage) / 40) * 100
                    }%, #e5e7eb ${
                      (getBlurValue(selectedImage) / 40) * 100
                    }%, #e5e7eb 100%)`,
                  }}
                />
              </div>
            </div>
          )}

          {/* AI Features Section (when single image is selected) */}
          {selectedImage && (
            <div className="p-3 border-b border-gray-200 bg-purple-50">
              <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <span>✨</span>
                <span>AI Features</span>
              </h3>
              <GhibliTransformButton
                imageId={selectedImage.id}
                createObject={createObject}
                updateObjectInFirestore={updateObjectInFirestore}
              />
            </div>
          )}

          {/* Layer List */}
          <div>
            {sortedObjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm p-4">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mb-2 opacity-50"
                >
                  <rect
                    x="12"
                    y="12"
                    width="24"
                    height="24"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
                <p>No layers yet</p>
                <p className="text-xs mt-1">Create shapes to see them here</p>
              </div>
            ) : (
              <div>
                {sortedObjects.map((obj) => (
                  <LayerItem
                    key={obj.id}
                    object={obj}
                    isSelected={selectedObjectIds.has(obj.id)}
                    onSelect={handleLayerSelect}
                    onVisibilityToggle={handleVisibilityToggle}
                    onLockToggle={handleLockToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsed State - Mini Icons */}
      {isCollapsed && (
        <div className="flex flex-col items-center gap-2 p-2 flex-1">
          <div className="text-xs text-gray-500 transform -rotate-90 whitespace-nowrap origin-center mt-8">
            Layers ({sortedObjects.length})
          </div>
        </div>
      )}
    </div>
  );
}
