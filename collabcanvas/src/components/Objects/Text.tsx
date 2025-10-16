"use client";

import { Text as KonvaText, Transformer } from "react-konva";
import { useRef, useEffect, memo } from "react";
import Konva from "konva";
import type { Text as TextType } from "@/types/canvas";
import { CANVAS_SIZE } from "@/lib/constants";
import { ToolMode } from "@/components/Canvas/CanvasControls";
import { useObjectLock } from "@/hooks/useObjectLock";
import { useUserStore } from "@/store";

interface TextProps {
  object: TextType;
  isSelected: boolean;
  onSelect: (shiftKey: boolean) => void;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onChange: (attrs: Partial<TextType>) => void;
  tool: ToolMode;
  onDelete: () => void;
  onDoubleClick: () => void;
  userId: string | null;
  canvasId: string;
}

function Text({
  object,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onChange,
  tool,
  onDelete,
  onDoubleClick,
  userId,
  canvasId,
}: TextProps) {
  const shapeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const { currentUser } = useUserStore();
  const { acquireLock, releaseLock, stopRenew } = useObjectLock(
    canvasId,
    currentUser
      ? { id: currentUser.id, name: currentUser.name, color: currentUser.color }
      : null
  );

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

  // Handle drag start - acquire edit lock
  const handleDragStart = async () => {
    const got = await acquireLock(object.id, "edit");
    if (!got) {
      // Failed to acquire lock, stop drag
      stopRenew();
      shapeRef.current?.stopDrag();
      return;
    }
    onDragStart?.();
  };

  // Handle drag move - enforce boundaries in real-time
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target as Konva.Text;
    const x = node.x();
    const y = node.y();
    const width = node.width();
    const height = node.height();

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
    const node = e.target as Konva.Text;
    const x = node.x();
    const y = node.y();
    const width = node.width();
    const height = node.height();

    const clampedX = Math.max(0, Math.min(x, CANVAS_SIZE.width - width));
    const clampedY = Math.max(0, Math.min(y, CANVAS_SIZE.height - height));

    onDragEnd(clampedX, clampedY);

    // Release lock after drag
    await releaseLock(object.id);
  };

  const handleTransformStart = async () => {
    const got = await acquireLock(object.id, "edit");
    if (!got) {
      // Failed to acquire lock
      stopRenew();
      return;
    }
  };

  const handleTransformEnd = async () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Reset scale to 1
    node.scaleX(1);
    node.scaleY(1);

    // Calculate new font size based on scale
    const newFontSize = Math.max(8, object.fontSize * scaleY);

    // Get new dimensions
    let x = node.x();
    let y = node.y();
    const width = node.width() * scaleX;

    // Ensure the text stays within canvas bounds
    x = Math.max(0, Math.min(x, CANVAS_SIZE.width - width));
    y = Math.max(0, Math.min(y, CANVAS_SIZE.height - node.height()));

    onChange({
      x,
      y,
      fontSize: newFontSize,
      width: width > 20 ? width : undefined,
      rotation,
    });

    // Release lock after transform
    await releaseLock(object.id);
  };

  // Handle click based on tool mode
  const handleClick = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === "delete") {
      onDelete();
    } else if (tool === "select") {
      // Try to acquire selection lock
      await acquireLock(object.id, "select");
      onSelect(e.evt.shiftKey);
    }
  };

  // Handle double-click to enter edit mode
  const handleDoubleClick = () => {
    if (tool === "select") {
      onDoubleClick();
    }
  };

  // Determine if object should be draggable based on tool and lock status
  const isDraggable =
    tool === "select" && object.locked !== true && !lockActiveByOther;
  // Show transformer only in select mode when selected and not locked by another user
  const showTransformer =
    isSelected &&
    tool === "select" &&
    object.locked !== true &&
    !lockActiveByOther;

  return (
    <>
      <KonvaText
        ref={shapeRef}
        x={object.x}
        y={object.y}
        text={object.text}
        fontSize={object.fontSize}
        fontFamily={object.fontFamily}
        fontStyle={object.fontStyle || "normal"}
        fill={object.fill}
        width={object.width}
        rotation={object.rotation || 0}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        onDragEnd={handleDragEnd}
        onTransformStart={handleTransformStart}
        onTransformEnd={handleTransformEnd}
        wrap="word"
      />
      {showTransformer && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={5}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (newBox.width < 20 || newBox.height < 10) {
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

export default memo(Text);
