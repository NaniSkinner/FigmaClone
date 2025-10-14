"use client";

import { memo } from "react";

export type ToolMode = "draw" | "pan" | "select" | "delete";

interface CanvasControlsProps {
  scale: number;
  tool: ToolMode;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onSetTool: (tool: ToolMode) => void;
}

function CanvasControls({
  scale,
  tool,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSetTool,
}: CanvasControlsProps) {
  const zoomPercentage = Math.round(scale * 100);

  // Helper to get button styles based on active state
  const getToolButtonStyles = (toolMode: ToolMode) => {
    const isActive = tool === toolMode;
    return `flex items-center gap-0.5 sm:gap-1 px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
      isActive
        ? "bg-emerald-100 text-emerald-700 shadow-sm"
        : "hover:bg-gray-100"
    }`;
  };

  return (
    <div className="fixed bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg sm:rounded-xl shadow-lg px-2 py-2 sm:px-4 sm:py-2.5 flex items-center justify-center gap-2 sm:gap-3 md:gap-4 z-40 border border-gray-200 max-w-[95vw] sm:max-w-[600px] md:max-w-[700px] lg:max-w-[850px]">
      {/* Zoom Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={onZoomOut}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center font-bold text-gray-700 text-base sm:text-lg"
          title="Zoom Out"
        >
          −
        </button>

        <button
          onClick={onResetZoom}
          className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-xs sm:text-sm font-semibold text-gray-700 min-w-[60px] sm:min-w-[75px]"
          title="Reset Zoom (100%)"
        >
          {zoomPercentage}%
        </button>

        <button
          onClick={onZoomIn}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center font-bold text-gray-700 text-base sm:text-lg"
          title="Zoom In"
        >
          +
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-7 sm:h-8 md:h-9 bg-gray-300 flex-shrink-0"></div>

      {/* Tool Buttons */}
      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 flex-shrink-0">
        {/* Draw */}
        <button
          onClick={() => onSetTool("draw")}
          className={getToolButtonStyles("draw")}
          title="Draw Tool - Click & drag to draw rectangles"
        >
          <span className="text-sm sm:text-base md:text-lg">✏️</span>
          <span className="hidden lg:inline whitespace-nowrap text-xs md:text-sm">
            Draw
          </span>
          <span className="hidden sm:inline lg:hidden whitespace-nowrap text-xs">
            Draw
          </span>
        </button>
        {/* Pan */}
        <button
          onClick={() => onSetTool("pan")}
          className={getToolButtonStyles("pan")}
          title="Pan Tool - Drag to pan the canvas"
        >
          <span className="text-sm sm:text-base md:text-lg">🤚</span>
          <span className="hidden lg:inline whitespace-nowrap text-xs md:text-sm">
            Pan
          </span>
          <span className="hidden sm:inline lg:hidden whitespace-nowrap text-xs">
            Pan
          </span>
        </button>
        {/* Select */}
        <button
          onClick={() => onSetTool("select")}
          className={getToolButtonStyles("select")}
          title="Select Tool - Click to select objects"
        >
          <span className="text-sm sm:text-base md:text-lg">↖️</span>
          <span className="hidden lg:inline whitespace-nowrap text-xs md:text-sm">
            Select
          </span>
          <span className="hidden sm:inline lg:hidden whitespace-nowrap text-xs">
            Select
          </span>
        </button>
        {/* Delete */}
        <button
          onClick={() => onSetTool("delete")}
          className={getToolButtonStyles("delete")}
          title="Delete Tool - Click objects to delete them"
        >
          <span className="text-sm sm:text-base md:text-lg">🗑️</span>
          <span className="hidden lg:inline whitespace-nowrap text-xs md:text-sm">
            Delete
          </span>
          <span className="hidden sm:inline lg:hidden whitespace-nowrap text-xs">
            Delete
          </span>
        </button>
      </div>
    </div>
  );
}

export default memo(CanvasControls);
