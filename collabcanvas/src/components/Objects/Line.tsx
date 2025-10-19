"use client";

import { Line as KonvaLine, Transformer } from "react-konva";
import { useRef, useEffect, memo } from "react";
import Konva from "konva";
import { Line as LineType } from "@/types";
import { CANVAS_SIZE } from "@/lib/constants";
import { ToolMode } from "@/components/Canvas/CanvasControls";
import { useObjectLock } from "@/hooks/useObjectLock";
import { useUserStore, useCanvasStore } from "@/store";
import { useToast } from "@/contexts/ToastContext";

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
  userId: string | null;
  canvasId: string;
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
  userId,
  canvasId,
}: LineProps) {
  const shapeRef = useRef<Konva.Line>(null);
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
      console.log(`[Line] Object ${object.id} is pending, skipping lock`);
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

  const handleDragEnd = async (e: Konva.KonvaEventObject<DragEvent>) => {
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

    // Release lock after drag
    await releaseLock(object.id);
  };

  const handleTransformStart = async () => {
    // Don't attempt to lock pending objects
    if (isPending(object.id)) {
      console.log(`[Line] Object ${object.id} is pending, skipping lock`);
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
    const x = node.x();
    const y = node.y();

    // Get the current points
    const points = object.points;

    // Calculate the center of the line
    const centerX = (points[0] + points[2]) / 2;
    const centerY = (points[1] + points[3]) / 2;

    // Calculate scaled deltas from center
    const dx1 = (points[0] - centerX) * scaleX;
    const dy1 = (points[1] - centerY) * scaleY;
    const dx2 = (points[2] - centerX) * scaleX;
    const dy2 = (points[3] - centerY) * scaleY;

    // Calculate new absolute points including position offset
    const newPoints: [number, number, number, number] = [
      centerX + dx1 + x,
      centerY + dy1 + y,
      centerX + dx2 + x,
      centerY + dy2 + y,
    ];

    // Clamp points to canvas bounds
    newPoints[0] = Math.max(0, Math.min(newPoints[0], CANVAS_SIZE.width));
    newPoints[1] = Math.max(0, Math.min(newPoints[1], CANVAS_SIZE.height));
    newPoints[2] = Math.max(0, Math.min(newPoints[2], CANVAS_SIZE.width));
    newPoints[3] = Math.max(0, Math.min(newPoints[3], CANVAS_SIZE.height));

    // Reset transforms
    node.scaleX(1);
    node.scaleY(1);
    node.x(0);
    node.y(0);

    onChange({
      points: newPoints,
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
      <KonvaLine
        ref={shapeRef}
        points={object.points}
        stroke={effectiveStroke}
        strokeWidth={effectiveStrokeWidth}
        hitStrokeWidth={Math.max(20, effectiveStrokeWidth * 3)}
        rotation={object.rotation || 0}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={handleDragEnd}
        onTransformStart={handleTransformStart}
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
            if (
              newBox.width > CANVAS_SIZE.width ||
              newBox.height > CANVAS_SIZE.height
            ) {
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
