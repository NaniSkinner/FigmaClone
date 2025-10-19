"use client";

import { Circle as KonvaCircle, Transformer } from "react-konva";
import { useRef, useEffect, memo } from "react";
import Konva from "konva";
import { Circle as CircleType } from "@/types";
import { CANVAS_SIZE } from "@/lib/constants";
import { ToolMode } from "@/components/Canvas/CanvasControls";
import { useObjectLock } from "@/hooks/useObjectLock";
import { useUserStore, useCanvasStore } from "@/store";
import { useToast } from "@/contexts/ToastContext";

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
  userId: string | null;
  canvasId: string;
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
  userId,
  canvasId,
}: CircleProps) {
  const shapeRef = useRef<Konva.Circle>(null);
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
      console.log(`[Circle] Object ${object.id} is pending, skipping lock`);
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

  const handleDragEnd = async (e: Konva.KonvaEventObject<DragEvent>) => {
    // Final clamp on drag end for safety
    const node = e.target;
    const x = node.x();
    const y = node.y();
    const radius = object.radius;

    const clampedX = Math.max(radius, Math.min(x, CANVAS_SIZE.width - radius));
    const clampedY = Math.max(radius, Math.min(y, CANVAS_SIZE.height - radius));

    onDragEnd(clampedX, clampedY);

    // Release lock after drag
    await releaseLock(object.id);
  };

  const handleTransformStart = async () => {
    // Don't attempt to lock pending objects
    if (isPending(object.id)) {
      console.log(`[Circle] Object ${object.id} is pending, skipping lock`);
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

    // Use average scale to maintain circle shape
    const avgScale = (scaleX + scaleY) / 2;

    // Reset scale to 1
    node.scaleX(1);
    node.scaleY(1);

    // Calculate new radius
    let x = node.x();
    let y = node.y();
    let radius = Math.max(10, node.radius() * avgScale);

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
      <KonvaCircle
        ref={shapeRef}
        x={object.x}
        y={object.y}
        radius={object.radius}
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
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={5}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox;
            }

            // Maximum size constraints
            const maxSize = Math.min(CANVAS_SIZE.width, CANVAS_SIZE.height);

            if (newBox.width > maxSize || newBox.height > maxSize) {
              return oldBox;
            }

            return newBox;
          }}
          // Keep aspect ratio for circles
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
        />
      )}
    </>
  );
}

export default memo(Circle);
