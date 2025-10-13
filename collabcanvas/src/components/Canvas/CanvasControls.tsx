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
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg p-3 flex items-center gap-3 z-40 border border-gray-200">
      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center font-bold text-gray-700"
        title="Zoom Out"
      >
        −
      </button>

      {/* Zoom Level */}
      <button
        onClick={onResetZoom}
        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-semibold text-gray-700 min-w-[80px]"
        title="Reset Zoom (100%)"
      >
        {zoomPercentage}%
      </button>

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center font-bold text-gray-700"
        title="Zoom In"
      >
        +
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-300"></div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 px-2">
        <div>🖱️ Drag to pan</div>
        <div>⚙️ Scroll to zoom</div>
      </div>
    </div>
  );
}
