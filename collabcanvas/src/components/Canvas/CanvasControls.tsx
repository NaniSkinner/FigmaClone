"use client";

interface CanvasControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export default function CanvasControls({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: CanvasControlsProps) {
  const zoomPercentage = Math.round(scale * 100);

  return (
    <div className="fixed bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg sm:rounded-xl shadow-lg px-3 py-2 sm:px-6 sm:py-3 flex items-center justify-center gap-3 sm:gap-6 md:gap-8 z-40 border border-gray-200 w-[98%] sm:w-[95%] md:w-[90%] max-w-5xl overflow-x-auto">
      {/* Zoom Controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button
          onClick={onZoomOut}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center font-bold text-gray-700 text-lg sm:text-xl"
          title="Zoom Out"
        >
          −
        </button>

        <button
          onClick={onResetZoom}
          className="px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm sm:text-base font-semibold text-gray-700 min-w-[70px] sm:min-w-[90px]"
          title="Reset Zoom (100%)"
        >
          {zoomPercentage}%
        </button>

        <button
          onClick={onZoomIn}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center font-bold text-gray-700 text-lg sm:text-xl"
          title="Zoom In"
        >
          +
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-8 sm:h-10 md:h-12 bg-gray-300 flex-shrink-0"></div>

      {/* Help Text */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 lg:gap-8 text-xs sm:text-sm md:text-base text-gray-700">
        {/* Draw */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
          <span className="text-base sm:text-lg md:text-xl">✏️</span>
          <span className="hidden md:inline whitespace-nowrap">
            Click & drag to draw
          </span>
          <span className="hidden sm:inline md:hidden whitespace-nowrap">
            Draw
          </span>
        </div>
        {/* Pan */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
          <span className="text-base sm:text-lg md:text-xl">🤚</span>
          <span className="hidden md:inline whitespace-nowrap">
            Drag grid to pan
          </span>
          <span className="hidden sm:inline md:hidden whitespace-nowrap">
            Pan
          </span>
        </div>
        {/* Select */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
          <span className="text-base sm:text-lg md:text-xl">↖️</span>
          <span className="hidden md:inline whitespace-nowrap">
            Click to select
          </span>
          <span className="hidden sm:inline md:hidden whitespace-nowrap">
            Select
          </span>
        </div>
        {/* Delete */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
          <span className="text-base sm:text-lg md:text-xl">🗑️</span>
          <span className="hidden lg:inline whitespace-nowrap">
            Delete/Backspace to delete
          </span>
          <span className="hidden md:inline lg:hidden whitespace-nowrap">
            Delete key
          </span>
          <span className="hidden sm:inline md:hidden whitespace-nowrap">
            Delete
          </span>
        </div>
      </div>
    </div>
  );
}
