"use client";

import { Rect, Transformer } from "react-konva";
import { useRef, useEffect, memo } from "react";
import Konva from "konva";
import { Rectangle as RectangleType } from "@/types";
import { CANVAS_SIZE } from "@/lib/constants";
import { ToolMode } from "@/components/Canvas/CanvasControls";

interface RectangleProps {
  object: RectangleType;
  isSelected: boolean;
  onSelect: (shiftKey: boolean) => void;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onChange: (attrs: Partial<RectangleType>) => void;
  tool: ToolMode;
  onDelete: () => void;
}

function Rectangle({
  object,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onChange,
  tool,
  onDelete,
}: RectangleProps) {
  const shapeRef = useRef<Konva.Rect>(null);
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
    const width = object.width;
    const height = object.height;

    // Clamp position to canvas bounds
    const clampedX = Math.max(0, Math.min(x, CANVAS_SIZE.width - width));
    const clampedY = Math.max(0, Math.min(y, CANVAS_SIZE.height - height));

    // Apply clamped position if it differs
    if (x !== clampedX || y !== clampedY) {
      node.x(clampedX);
      node.y(clampedY);
    }

    // Notify group drag
    onDragMove?.(clampedX, clampedY);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Final clamp on drag end for safety
    const node = e.target;
    const x = node.x();
    const y = node.y();
    const width = object.width;
    const height = object.height;

    const clampedX = Math.max(0, Math.min(x, CANVAS_SIZE.width - width));
    const clampedY = Math.max(0, Math.min(y, CANVAS_SIZE.height - height));

    onDragEnd(clampedX, clampedY);
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and adjust width/height instead
    node.scaleX(1);
    node.scaleY(1);

    // Calculate new dimensions
    let x = node.x();
    let y = node.y();
    let width = Math.max(5, node.width() * scaleX);
    let height = Math.max(5, node.height() * scaleY);

    // Ensure the resized rectangle stays within canvas bounds
    x = Math.max(0, Math.min(x, CANVAS_SIZE.width - width));
    y = Math.max(0, Math.min(y, CANVAS_SIZE.height - height));
    width = Math.min(width, CANVAS_SIZE.width - x);
    height = Math.min(height, CANVAS_SIZE.height - y);

    onChange({
      x,
      y,
      width,
      height,
    });
  };

  // Handle click based on tool mode
  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === "delete") {
      onDelete();
    } else if (tool === "select") {
      onSelect(e.evt.shiftKey);
    }
    // In draw and pan mode, don't do anything on click
  };

  // Determine if object should be draggable based on tool
  const isDraggable = tool === "select";
  // Show transformer only in select mode when selected
  const showTransformer = isSelected && tool === "select";

  return (
    <>
      <Rect
        ref={shapeRef}
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        fill={object.fill}
        stroke={object.stroke}
        strokeWidth={object.strokeWidth}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {showTransformer && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }

            // Constrain to canvas bounds
            let x = newBox.x;
            let y = newBox.y;
            let width = newBox.width;
            let height = newBox.height;

            // Ensure position is within bounds
            x = Math.max(0, x);
            y = Math.max(0, y);

            // Ensure size doesn't exceed canvas from current position
            const maxWidth = CANVAS_SIZE.width - x;
            const maxHeight = CANVAS_SIZE.height - y;
            width = Math.min(width, maxWidth);
            height = Math.min(height, maxHeight);

            // If any constraint was applied, return adjusted box
            if (
              x !== newBox.x ||
              y !== newBox.y ||
              width !== newBox.width ||
              height !== newBox.height
            ) {
              return {
                ...newBox,
                x,
                y,
                width,
                height,
              };
            }

            return newBox;
          }}
        />
      )}
    </>
  );
}

export default memo(Rectangle);
