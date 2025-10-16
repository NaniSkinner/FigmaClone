"use client";

import { Circle as KonvaCircle, Transformer } from "react-konva";
import { useRef, useEffect, memo } from "react";
import Konva from "konva";
import { Circle as CircleType } from "@/types";
import { CANVAS_SIZE } from "@/lib/constants";
import { ToolMode } from "@/components/Canvas/CanvasControls";

interface CircleProps {
  object: CircleType;
  isSelected: boolean;
  onSelect: (shiftKey: boolean) => void;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onChange: (attrs: Partial<CircleType>) => void;
  tool: ToolMode;
  onDelete: () => void;
}

function Circle({
  object,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onChange,
  tool,
  onDelete,
}: CircleProps) {
  const shapeRef = useRef<Konva.Circle>(null);
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
    const radius = object.radius;

    // Clamp position to canvas bounds (accounting for radius)
    const clampedX = Math.max(radius, Math.min(x, CANVAS_SIZE.width - radius));
    const clampedY = Math.max(radius, Math.min(y, CANVAS_SIZE.height - radius));

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
    const radius = object.radius;

    const clampedX = Math.max(radius, Math.min(x, CANVAS_SIZE.width - radius));
    const clampedY = Math.max(radius, Math.min(y, CANVAS_SIZE.height - radius));

    onDragEnd(clampedX, clampedY);
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Use average scale to maintain circle shape
    const avgScale = (scaleX + scaleY) / 2;

    // Reset scale to 1
    node.scaleX(1);
    node.scaleY(1);

    // Calculate new radius
    let x = node.x();
    let y = node.y();
    let radius = Math.max(5, node.radius() * avgScale);

    // Ensure the resized circle stays within canvas bounds
    x = Math.max(radius, Math.min(x, CANVAS_SIZE.width - radius));
    y = Math.max(radius, Math.min(y, CANVAS_SIZE.height - radius));
    radius = Math.min(
      radius,
      Math.min(CANVAS_SIZE.width - x, CANVAS_SIZE.height - y, x, y)
    );

    onChange({
      x,
      y,
      radius,
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
      <KonvaCircle
        ref={shapeRef}
        x={object.x}
        y={object.y}
        radius={object.radius}
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
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }

            // Constrain to canvas bounds
            const radius = Math.min(newBox.width, newBox.height) / 2;
            let x = newBox.x + newBox.width / 2;
            let y = newBox.y + newBox.height / 2;

            // Ensure circle stays within bounds
            x = Math.max(radius, Math.min(x, CANVAS_SIZE.width - radius));
            y = Math.max(radius, Math.min(y, CANVAS_SIZE.height - radius));

            return newBox;
          }}
          // Keep aspect ratio for circles
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
          rotateEnabled={false}
        />
      )}
    </>
  );
}

export default memo(Circle);
