"use client";

import { useState, useCallback } from "react";
import { ZOOM_LIMITS, CANVAS_SIZE } from "@/lib/constants";

export const useCanvas = () => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Zoom in
  const zoomIn = useCallback(() => {
    setScale((prevScale) => Math.min(prevScale * 1.2, ZOOM_LIMITS.max));
  }, []);

  // Zoom out
  const zoomOut = useCallback(() => {
    setScale((prevScale) => Math.max(prevScale * 0.8, ZOOM_LIMITS.min));
  }, []);

  // Reset zoom to 100%
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const scaleBy = 1.05;
      const stage = e.currentTarget as any;
      const oldScale = scale;

      // Get pointer position
      const pointer = {
        x: e.clientX,
        y: e.clientY,
      };

      const mousePointTo = {
        x: (pointer.x - position.x) / oldScale,
        y: (pointer.y - position.y) / oldScale,
      };

      // Calculate new scale
      const newScale =
        e.deltaY > 0
          ? Math.max(oldScale / scaleBy, ZOOM_LIMITS.min)
          : Math.min(oldScale * scaleBy, ZOOM_LIMITS.max);

      // Calculate new position to zoom towards pointer
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setScale(newScale);
      setPosition(newPos);
    },
    [scale, position]
  );

  // Handle drag
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDragMove = useCallback((e: any) => {
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  }, []);

  return {
    scale,
    position,
    isDragging,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
    canvasSize: CANVAS_SIZE,
  };
};
