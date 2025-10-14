"use client";

import { useState, useCallback } from "react";
import { ZOOM_LIMITS, CANVAS_SIZE } from "@/lib/constants";

export const useCanvas = () => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Calculate centered position for canvas
  const centerCanvas = useCallback(
    (
      viewportWidth: number,
      viewportHeight: number,
      currentScale: number = 1
    ) => {
      const centeredX = (viewportWidth - CANVAS_SIZE.width * currentScale) / 2;
      const centeredY =
        (viewportHeight - CANVAS_SIZE.height * currentScale) / 2;

      setPosition({ x: centeredX, y: centeredY });
    },
    []
  );

  // Fit entire canvas to screen with padding
  const fitToScreen = useCallback(
    (viewportWidth: number, viewportHeight: number) => {
      const padding = 100; // 100px padding on all sides
      const availableWidth = viewportWidth - padding * 2;
      const availableHeight = viewportHeight - padding * 2;

      // Calculate scale to fit both width and height
      const scaleX = availableWidth / CANVAS_SIZE.width;
      const scaleY = availableHeight / CANVAS_SIZE.height;

      // Use the smaller scale to ensure entire canvas is visible
      const fitScale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%
      const clampedScale = Math.max(fitScale, ZOOM_LIMITS.min); // Respect min zoom

      setScale(clampedScale);
      centerCanvas(viewportWidth, viewportHeight, clampedScale);
    },
    [centerCanvas]
  );

  // Zoom in
  const zoomIn = useCallback(() => {
    setScale((prevScale) => Math.min(prevScale * 1.2, ZOOM_LIMITS.max));
  }, []);

  // Zoom out
  const zoomOut = useCallback(() => {
    setScale((prevScale) => Math.max(prevScale * 0.8, ZOOM_LIMITS.min));
  }, []);

  // Reset zoom to 100% and center canvas
  const resetZoom = useCallback(
    (viewportWidth?: number, viewportHeight?: number) => {
      setScale(1);
      if (viewportWidth && viewportHeight) {
        centerCanvas(viewportWidth, viewportHeight, 1);
      } else {
        setPosition({ x: 0, y: 0 });
      }
    },
    [centerCanvas]
  );

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
    setPosition,
    isDragging,
    zoomIn,
    zoomOut,
    resetZoom,
    centerCanvas,
    fitToScreen,
    handleWheel,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
    canvasSize: CANVAS_SIZE,
  };
};
