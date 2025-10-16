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
    const rotation = node.rotation();

    // Reset scale to 1 and adjust width/height instead
    node.scaleX(1);
    node.scaleY(1);

    // Calculate new dimensions
    let x = node.x();
    let y = node.y();
    let width = Math.max(10, node.width() * scaleX);
    let height = Math.max(10, node.height() * scaleY);

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
    // In draw and pan mode, don't do anything on click
  };

  // Determine if object should be draggable based on tool
  const isDraggable = tool === "select" && object.locked !== true;
  // Show transformer only in select mode when selected and not locked
  const showTransformer =
    isSelected && tool === "select" && object.locked !== true;

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
        rotation={object.rotation || 0}
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
          rotateEnabled={true}
          enabledAnchors={[
            "top-left",
            "top-center",
            "top-right",
            "middle-right",
            "middle-left",
            "bottom-left",
            "bottom-center",
            "bottom-right",
          ]}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={5}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }

            // Maximum size constraints
            const maxWidth = CANVAS_SIZE.width;
            const maxHeight = CANVAS_SIZE.height;

            if (newBox.width > maxWidth || newBox.height > maxHeight) {
              return oldBox;
            }

            return newBox;
          }}
        />
      )}
    </>
  );
}

export default memo(Rectangle);
