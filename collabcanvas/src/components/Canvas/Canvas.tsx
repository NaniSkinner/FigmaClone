"use client";

import { useRef, useEffect } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import { useCanvas } from "@/hooks/useCanvas";

interface CanvasProps {
  width: number;
  height: number;
}

export default function Canvas({ width, height }: CanvasProps) {
  const stageRef = useRef<any>(null);
  const {
    scale,
    position,
    handleWheel,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
    canvasSize,
  } = useCanvas();

  // Add wheel event listener for zoom
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const container = stage.container();
    container.addEventListener("wheel", handleWheel);

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  // Generate grid lines
  const gridLines = [];
  const gridSize = 50;
  const padding = 200;

  // Vertical lines
  for (let i = -padding; i < canvasSize.width + padding; i += gridSize) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[i, -padding, i, canvasSize.height + padding]}
        stroke="#E0E0E0"
        strokeWidth={1}
      />
    );
  }

  // Horizontal lines
  for (let i = -padding; i < canvasSize.height + padding; i += gridSize) {
    gridLines.push(
      <Line
        key={`h-${i}`}
        points={[-padding, i, canvasSize.width + padding, i]}
        stroke="#E0E0E0"
        strokeWidth={1}
      />
    );
  }

  return (
    <div className="w-full h-full overflow-hidden bg-gray-50">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
      >
        <Layer>
          {/* Background */}
          <Rect
            x={-1000}
            y={-1000}
            width={canvasSize.width + 2000}
            height={canvasSize.height + 2000}
            fill="#F5F5F5"
          />

          {/* Grid */}
          {gridLines}

          {/* Canvas boundary */}
          <Rect
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            stroke="#D0D0D0"
            strokeWidth={2}
            fill="white"
          />
        </Layer>
      </Stage>
    </div>
  );
}
