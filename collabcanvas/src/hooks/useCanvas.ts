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
    handleWheel,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
    canvasSize: CANVAS_SIZE,
  };
};
