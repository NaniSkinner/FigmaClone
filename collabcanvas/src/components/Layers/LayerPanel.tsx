"use client";

import { useState } from "react";
import { useCanvasStore } from "@/store";
import LayerItem from "./LayerItem";
import { useLayerManagement } from "@/hooks/useLayerManagement";

interface LayerPanelProps {
  canvasId: string;
  userId: string | null;
}

export default function LayerPanel({ canvasId, userId }: LayerPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { objects, selectedObjectIds, addToSelection, clearSelection } =
    useCanvasStore();
  const { bringToFront, sendToBack, bringForward, sendBackward } =
    useLayerManagement(canvasId, userId);

  // Sort objects by zIndex (highest first for top-to-bottom display)
  const sortedObjects = Array.from(objects.values()).sort(
    (a, b) => b.zIndex - a.zIndex
  );

  const handleLayerSelect = (id: string) => {
    // Click to select single layer
    clearSelection();
    addToSelection(id);
  };

  const handleVisibilityToggle = (id: string, visible: boolean) => {
    // TODO: Implement visibility toggle in PR #13 Task 13.6
    console.log(`Toggle visibility for ${id}: ${visible}`);
  };

  const handleLockToggle = (id: string, locked: boolean) => {
    // TODO: Implement lock toggle in PR #13 Task 13.6
    console.log(`Toggle lock for ${id}: ${locked}`);
  };

  return (
    <div
      className={`
        fixed right-4 bg-white rounded-lg
        shadow-xl transition-all duration-300 z-40
        ${isCollapsed ? "w-12" : "w-64"}
      `}
      style={{
        top: "140px",
        height: "calc(100vh - 160px)",
        maxHeight: "calc(100vh - 160px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
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

      {/* Layer Actions (when expanded) */}
      {!isCollapsed && selectedObjectIds.size > 0 && (
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

      {/* Layer List */}
      {!isCollapsed && (
        <div
          className="overflow-y-auto"
          style={{ height: "calc(100% - 120px)" }}
        >
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
      )}

      {/* Collapsed State - Mini Icons */}
      {isCollapsed && (
        <div className="flex flex-col items-center gap-2 p-2">
          <div className="text-xs text-gray-500 transform -rotate-90 whitespace-nowrap origin-center mt-8">
            Layers ({sortedObjects.length})
          </div>
        </div>
      )}
    </div>
  );
}
