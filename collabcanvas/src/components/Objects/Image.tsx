"use client";

import { Image as KonvaImage, Transformer, Rect } from "react-konva";
import { useRef, useEffect, memo } from "react";
import Konva from "konva";
import useImage from "use-image";
import { ImageObject } from "@/types";
import { CANVAS_SIZE } from "@/lib/constants";
import { ToolMode } from "@/components/Canvas/CanvasControls";
import { useObjectLock } from "@/hooks/useObjectLock";
import { useUserStore, useCanvasStore } from "@/store";
import { useToast } from "@/contexts/ToastContext";

interface ImageProps {
  object: ImageObject;
  isSelected: boolean;
  onSelect: (shiftKey: boolean) => void;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onChange: (attrs: Partial<ImageObject>) => void;
  tool: ToolMode;
  onDelete: () => void;
  userId: string | null;
  canvasId: string;
}

function Image({
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
}: ImageProps) {
  const imageRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const { currentUser } = useUserStore();
  const { addToast } = useToast();
  const { acquireLock, releaseLock } = useObjectLock(
    canvasId,
    currentUser
      ? { id: currentUser.id, name: currentUser.name, color: currentUser.color }
      : null
  );
  const { isPending } = useCanvasStore();

  // Load image with CORS support
  const [image, status] = useImage(object.src, "anonymous");

  // Check if object is locked by another user
  const lockActiveByOther =
    object.lock &&
    object.lock.userId !== userId &&
    new Date(object.lock.expiresAt) > new Date();

  // Transformer setup
  useEffect(() => {
    if (isSelected && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Apply filters
  useEffect(() => {
    if (!imageRef.current || !object.filters?.length || !image) return;

    const filters: any[] = [];
    object.filters.forEach((filter) => {
      switch (filter.type) {
        case "grayscale":
          filters.push(Konva.Filters.Grayscale);
          break;
        case "blur":
          filters.push(Konva.Filters.Blur);
          if (imageRef.current) {
            imageRef.current.blurRadius(filter.radius);
          }
          break;
        case "brightness":
          filters.push(Konva.Filters.Brighten);
          if (imageRef.current) {
            imageRef.current.brightness(filter.value);
          }
          break;
        case "contrast":
          filters.push(Konva.Filters.Contrast);
          if (imageRef.current) {
            imageRef.current.contrast(filter.value);
          }
          break;
      }
    });

    if (imageRef.current) {
      imageRef.current.filters(filters);
      imageRef.current.cache(); // Required for filters
      imageRef.current.getLayer()?.batchDraw();
    }
  }, [object.filters, image]);

  // Handle drag start - acquire edit lock
  const handleDragStart = async () => {
    if (isPending(object.id)) {
      console.log(`[Image] Object ${object.id} is pending, skipping lock`);
      onDragStart?.();
      return;
    }

    const got = await acquireLock(object.id, "edit");
    if (!got && lockActiveByOther) {
      addToast(
        `${object.lock?.userName || "Another user"} is editing this`,
        "warning"
      );
    }
    onDragStart?.();
  };

  // Handle drag move - enforce boundaries
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

    onDragMove?.(clampedX, clampedY);
  };

  const handleDragEnd = async (e: Konva.KonvaEventObject<DragEvent>) => {
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
    if (isPending(object.id)) {
      console.log(`[Image] Object ${object.id} is pending, skipping lock`);
      return;
    }

    const got = await acquireLock(object.id, "edit");
    if (!got && lockActiveByOther) {
      addToast(
        `${object.lock?.userName || "Another user"} is editing this`,
        "warning"
      );
    }
  };

  const handleTransformEnd = async () => {
    const node = imageRef.current;
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
    let width = Math.max(20, node.width() * Math.abs(scaleX));
    let height = Math.max(20, node.height() * Math.abs(scaleY));

    // Ensure the resized image stays within canvas bounds
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
      onDelete();
    } else if (tool === "select") {
      if (!isPending(object.id)) {
        await acquireLock(object.id, "select");
      }
      onSelect(e.evt.shiftKey);
    }
  };

  // Determine if object should be draggable based on tool
  const isDraggable = tool === "select" && object.locked !== true;
  // Show transformer only in select mode when selected
  const showTransformer =
    isSelected && tool === "select" && object.locked !== true;

  // Show loading placeholder while image loads
  if (status === "loading" || !image) {
    return (
      <Rect
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        fill="#e0e0e0"
        stroke="#999"
        strokeWidth={1}
        dash={[5, 5]}
      />
    );
  }

  // Show error placeholder if image failed to load
  if (status === "failed") {
    return (
      <Rect
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        fill="#ffebee"
        stroke="#f44336"
        strokeWidth={2}
        dash={[5, 5]}
      />
    );
  }

  // Visual lock indicators
  const lockBorderColor = lockActiveByOther ? object.lock?.userColor : null;
  const strokeColor = lockBorderColor || (isSelected ? "#4A90E2" : undefined);
  const strokeWidth = lockBorderColor ? 3 : isSelected ? 2 : 0;

  return (
    <>
      <KonvaImage
        ref={imageRef}
        id={object.id}
        image={image}
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        rotation={object.rotation || 0}
        opacity={object.opacity ?? 1}
        scaleX={object.scaleX ?? 1}
        scaleY={object.scaleY ?? 1}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        draggable={isDraggable}
        onClick={handleClick}
        onTap={handleClick}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
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
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={5}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (newBox.width < 20 || newBox.height < 20) {
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
          keepRatio={true} // Maintain aspect ratio by default
        />
      )}
    </>
  );
}

export default memo(Image);
