"use client";

import { Rect, Transformer } from "react-konva";
import { useRef, useEffect, memo } from "react";
import Konva from "konva";
import { Rectangle as RectangleType } from "@/types";
import { CANVAS_SIZE } from "@/lib/constants";
import { ToolMode } from "@/components/Canvas/CanvasControls";
import { useObjectLock } from "@/hooks/useObjectLock";
import { useUserStore, useCanvasStore } from "@/store";
import { useToast } from "@/contexts/ToastContext";

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
  userId: string | null;
  canvasId: string;
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
  userId,
  canvasId,
}: RectangleProps) {
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const { currentUser } = useUserStore();
  const { addToast } = useToast();
  const { acquireLock, releaseLock, stopRenew } = useObjectLock(
    canvasId,
    currentUser
      ? { id: currentUser.id, name: currentUser.name, color: currentUser.color }
      : null
  );
  const { isPending } = useCanvasStore();

  // Check if object is locked by another user
  const lockActiveByOther =
    object.lock &&
    object.lock.userId !== userId &&
    new Date(object.lock.expiresAt) > new Date();

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      // Attach transformer to the selected shape
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle drag start - acquire edit lock (advisory only)
  const handleDragStart = async () => {
    // Don't attempt to lock pending objects
    if (isPending(object.id)) {
      console.log(`[Rectangle] Object ${object.id} is pending, skipping lock`);
      onDragStart?.();
      return;
    }

    const got = await acquireLock(object.id, "edit");
    if (!got && lockActiveByOther) {
      // Show warning but allow operation
      addToast(
        `${object.lock?.userName || "Another user"} is editing this`,
        "warning"
      );
    }
    onDragStart?.(); // Always proceed
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

  const handleDragEnd = async (e: Konva.KonvaEventObject<DragEvent>) => {
    // Final clamp on drag end for safety
    const node = e.target;
    const x = node.x();
    const y = node.y();
    const width = object.width;
    const height = object.height;

    const clampedX = Math.max(0, Math.min(x, CANVAS_SIZE.width - width));
    const clampedY = Math.max(0, Math.min(y, CANVAS_SIZE.height - height));

    onDragEnd(clampedX, clampedY);

    // Release lock after drag
    await releaseLock(object.id);
  };

  const handleTransformStart = async () => {
    // Don't attempt to lock pending objects
    if (isPending(object.id)) {
      console.log(`[Rectangle] Object ${object.id} is pending, skipping lock`);
      return;
    }

    const got = await acquireLock(object.id, "edit");
    if (!got && lockActiveByOther) {
      // Show warning but allow operation
      addToast(
        `${object.lock?.userName || "Another user"} is editing this`,
        "warning"
      );
    }
    // Always proceed with transform
  };

  const handleTransformEnd = async () => {
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

    // Release lock after transform
    await releaseLock(object.id);
  };

  // Handle click based on tool mode
  const handleClick = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === "delete") {
      // Don't acquire lock when deleting - just delete immediately
      onDelete();
    } else if (tool === "select") {
      // Don't attempt to lock pending objects
      if (!isPending(object.id)) {
        // Try to acquire selection lock
        await acquireLock(object.id, "select");
      }
      onSelect(e.evt.shiftKey);
    }
    // In draw and pan mode, don't do anything on click
  };

  // Determine if object should be draggable based on tool (locks are advisory only)
  const isDraggable = tool === "select" && object.locked !== true;
  // Show transformer only in select mode when selected
  const showTransformer =
    isSelected && tool === "select" && object.locked !== true;

  // Visual lock indicators
  const lockBorderColor = lockActiveByOther ? object.lock?.userColor : null;
  const effectiveStroke = lockBorderColor || object.stroke;
  const effectiveStrokeWidth = lockBorderColor ? 3 : object.strokeWidth;

  return (
    <>
      <Rect
        ref={shapeRef}
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        fill={object.fill}
        stroke={effectiveStroke}
        strokeWidth={effectiveStrokeWidth}
        rotation={object.rotation || 0}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={handleDragEnd}
        onTransformStart={handleTransformStart}
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
