"use client";

/**
 * CanvasStatePanel Component
 *
 * Displays real-time canvas state as JSON for AI context visibility.
 * Features:
 * - Draggable positioning
 * - Collapsible panel
 * - Copy to clipboard
 * - AI context indicator
 * - Auto-update every 500ms when expanded
 *
 * Reference: aiPRD.md Section 3 - Canvas State Context Window
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useCanvasContext } from "@/hooks/useCanvasContext";

export function CanvasStatePanel() {
  const { getCanvasContext } = useCanvasContext();

  // Panel state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Dragging state
  const [position, setPosition] = useState({
    x: window.innerWidth - 420,
    y: 20,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Context state
  const [contextJson, setContextJson] = useState("");
  const [objectCount, setObjectCount] = useState(0);

  const panelRef = useRef<HTMLDivElement>(null);

  // Update context JSON periodically when expanded
  useEffect(() => {
    if (!isExpanded || isPaused) return;

    const updateContext = () => {
      try {
        const context = getCanvasContext();
        const json = isCompact
          ? JSON.stringify(context)
          : JSON.stringify(context, null, 2);
        setContextJson(json);
        setObjectCount(context.objects.length);
      } catch (error) {
        console.error("Error updating canvas context:", error);
      }
    };

    // Initial update
    updateContext();

    // Auto-update every 1000ms (reduced from 500ms to reduce interference)
    const interval = setInterval(updateContext, 1000);

    return () => clearInterval(interval);
  }, [isExpanded, isPaused, isCompact, getCanvasContext]);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return; // Don't drag when clicking buttons

    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Constrain to viewport
      const maxX = window.innerWidth - (isExpanded ? 400 : 48);
      const maxY = window.innerHeight - 48;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, isExpanded]);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contextJson);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Toggle expand/collapse
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Update position when expanding to ensure it fits
      const maxX = window.innerWidth - 400;
      if (position.x > maxX) {
        setPosition({ ...position, x: maxX });
      }
    }
  };

  if (!isExpanded) {
    // Collapsed state: Icon button
    return (
      <div
        ref={panelRef}
        className="fixed z-50 cursor-move"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={toggleExpand}
          className="bg-[#D4E7C5] hover:bg-[#c4d7b5] text-gray-800 p-3 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2"
          title="Open Canvas State Panel"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-xs font-medium">{}</span>
        </button>
      </div>
    );
  }

  // Expanded state: Full panel
  return (
    <div
      ref={panelRef}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "400px",
        maxHeight: "600px",
      }}
    >
      {/* Header */}
      <div
        className="bg-[#D4E7C5] px-4 py-3 cursor-move border-b border-gray-200"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800">Canvas State</h3>
            <div
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                objectCount > 0
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {objectCount > 0 ? "✓ AI Ready" : "No Objects"}
            </div>
          </div>
          <button
            onClick={toggleExpand}
            className="text-gray-600 hover:text-gray-800 transition-colors"
            title="Collapse panel"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-300 transition-colors"
            title="Copy JSON to clipboard"
          >
            {copiedSuccess ? "✓ Copied!" : "📋 Copy"}
          </button>
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="px-2 py-1 text-xs bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-300 transition-colors"
            title={isCompact ? "Expand JSON" : "Compact JSON"}
          >
            {isCompact ? "{ } Expand" : "─ Compact"}
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-2 py-1 text-xs bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-300 transition-colors"
            title={isPaused ? "Resume updates" : "Pause updates"}
          >
            {isPaused ? "▶️ Resume" : "⏸️ Pause"}
          </button>
          <span className="text-xs text-gray-600 ml-auto">
            {objectCount} objects
          </span>
        </div>
      </div>

      {/* JSON Content */}
      <div className="bg-gray-50 overflow-auto" style={{ maxHeight: "500px" }}>
        <pre className="p-4 text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
          {contextJson || "No canvas data available"}
        </pre>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span>
            {isPaused ? "⏸️ Updates paused" : "🔄 Auto-updating (500ms)"}
          </span>
          <span className="text-gray-500">AI Context Window</span>
        </div>
      </div>
    </div>
  );
}
