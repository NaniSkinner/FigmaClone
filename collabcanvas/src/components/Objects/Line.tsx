"use client";

import { Line as KonvaLine, Transformer } from "react-konva";
import { useRef, useEffect, memo } from "react";
import Konva from "konva";
import { Line as LineType } from "@/types";
import { CANVAS_SIZE } from "@/lib/constants";
import { ToolMode } from "@/components/Canvas/CanvasControls";

interface LineProps {
  object: LineType;
  isSelected: boolean;
  onSelect: (shiftKey: boolean) => void;
  onDragStart?: () => void;
  onDragMove?: (points: [number, number, number, number]) => void;
  onDragEnd: (points: [number, number, number, number]) => void;
  onChange: (attrs: Partial<LineType>) => void;
  tool: ToolMode;
  onDelete: () => void;
}

function Line({
  object,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onChange,
  tool,
  onDelete,
}: LineProps) {
  const shapeRef = useRef<Konva.Line>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      // Attach transformer to the selected shape
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle drag start
  const handleDragStart = () => {
    onDragStart?.();
  };

  // Handle drag move - enforce boundaries in real-time
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const x = node.x();
    const y = node.y();
    const points = object.points;

    // Calculate line bounds
    const x1 = points[0];
    const y1 = points[1];
    const x2 = points[2];
    const y2 = points[3];

    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    const lineWidth = maxX - minX;
    const lineHeight = maxY - minY;

    // Clamp position to canvas bounds
    const clampedX = Math.max(-minX, Math.min(x, CANVAS_SIZE.width - maxX));
    const clampedY = Math.max(-minY, Math.min(y, CANVAS_SIZE.height - maxY));

    // Apply clamped position if it differs
    if (x !== clampedX || y !== clampedY) {
      node.x(clampedX);
      node.y(clampedY);
    }

    // Calculate new absolute positions for group drag
    const newPoints: [number, number, number, number] = [
      points[0] + clampedX,
      points[1] + clampedY,
      points[2] + clampedX,
      points[3] + clampedY,
    ];
    onDragMove?.(newPoints);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const x = node.x();
    const y = node.y();

    // Calculate new absolute positions
    const newPoints: [number, number, number, number] = [
      object.points[0] + x,
      object.points[1] + y,
      object.points[2] + x,
      object.points[3] + y,
    ];

    // Clamp points to canvas bounds
    newPoints[0] = Math.max(0, Math.min(newPoints[0], CANVAS_SIZE.width));
    newPoints[1] = Math.max(0, Math.min(newPoints[1], CANVAS_SIZE.height));
    newPoints[2] = Math.max(0, Math.min(newPoints[2], CANVAS_SIZE.width));
    newPoints[3] = Math.max(0, Math.min(newPoints[3], CANVAS_SIZE.height));

    // Reset position and update points
    node.x(0);
    node.y(0);

    onDragEnd(newPoints);
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Reset scale
    node.scaleX(1);
    node.scaleY(1);

    // Calculate new points with scale applied
    const newPoints: [number, number, number, number] = [
      object.points[0] * scaleX,
      object.points[1] * scaleY,
      object.points[2] * scaleX,
      object.points[3] * scaleY,
    ];

    // Clamp points to canvas bounds
    newPoints[0] = Math.max(0, Math.min(newPoints[0], CANVAS_SIZE.width));
    newPoints[1] = Math.max(0, Math.min(newPoints[1], CANVAS_SIZE.height));
    newPoints[2] = Math.max(0, Math.min(newPoints[2], CANVAS_SIZE.width));
    newPoints[3] = Math.max(0, Math.min(newPoints[3], CANVAS_SIZE.height));

    onChange({
      points: newPoints,
      rotation,
    });
  };

  // Handle click based on tool mode
  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === "delete") {
      onDelete();
    } else if (tool === "select") {
      onSelect(e.evt.shiftKey);
    }
  };

  // Determine if object should be draggable based on tool
  const isDraggable = tool === "select";
  // Show transformer only in select mode when selected
  const showTransformer = isSelected && tool === "select";

  return (
    <>
      <KonvaLine
        ref={shapeRef}
        points={object.points}
        stroke={object.stroke}
        strokeWidth={object.strokeWidth}
        rotation={object.rotation || 0}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        lineCap="round"
        lineJoin="round"
      />
      {showTransformer && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={5}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            
            // Maximum size constraints
            if (newBox.width > CANVAS_SIZE.width || newBox.height > CANVAS_SIZE.height) {
              return oldBox;
            }
            
            return newBox;
          }}
        />
      )}
    </>
  );
}

export default memo(Line);
