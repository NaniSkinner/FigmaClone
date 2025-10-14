"use client";

import { memo } from "react";

interface CanvasControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

function CanvasControls({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: CanvasControlsProps) {
  const zoomPercentage = Math.round(scale * 100);

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

      {/* Help Text */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-700 flex-shrink-0">
        {/* Draw */}
        <div
          className="flex items-center gap-0.5 sm:gap-1"
          title="Click & drag to draw"
        >
          <span className="text-sm sm:text-base md:text-lg">✏️</span>
          <span className="hidden lg:inline whitespace-nowrap text-xs md:text-sm">
            Click & drag
          </span>
          <span className="hidden sm:inline lg:hidden whitespace-nowrap text-xs">
            Draw
          </span>
        </div>
        {/* Pan */}
        <div
          className="flex items-center gap-0.5 sm:gap-1"
          title="Drag grid to pan"
        >
          <span className="text-sm sm:text-base md:text-lg">🤚</span>
          <span className="hidden lg:inline whitespace-nowrap text-xs md:text-sm">
            Drag grid
          </span>
          <span className="hidden sm:inline lg:hidden whitespace-nowrap text-xs">
            Pan
          </span>
        </div>
        {/* Select */}
        <div
          className="flex items-center gap-0.5 sm:gap-1"
          title="Click to select"
        >
          <span className="text-sm sm:text-base md:text-lg">↖️</span>
          <span className="hidden lg:inline whitespace-nowrap text-xs md:text-sm">
            Click
          </span>
          <span className="hidden sm:inline lg:hidden whitespace-nowrap text-xs">
            Select
          </span>
        </div>
        {/* Delete */}
        <div
          className="flex items-center gap-0.5 sm:gap-1"
          title="Delete/Backspace to delete"
        >
          <span className="text-sm sm:text-base md:text-lg">🗑️</span>
          <span className="hidden lg:inline whitespace-nowrap text-xs md:text-sm">
            Delete key
          </span>
          <span className="hidden sm:inline lg:hidden whitespace-nowrap text-xs">
            Delete
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(CanvasControls);
