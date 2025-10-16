"use client";

import { Text as KonvaText, Transformer } from "react-konva";
import { useRef, useEffect, memo } from "react";
import Konva from "konva";
import { Text as TextType } from "@/types";
import { CANVAS_SIZE } from "@/lib/constants";
import { ToolMode } from "@/components/Canvas/CanvasControls";

interface TextProps {
  object: TextType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onChange: (attrs: Partial<TextType>) => void;
  tool: ToolMode;
  onDelete: () => void;
  onDoubleClick: () => void;
}

function Text({
  object,
  isSelected,
  onSelect,
  onDragEnd,
  onChange,
  tool,
  onDelete,
  onDoubleClick,
}: TextProps) {
  const shapeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      // Attach transformer to the selected shape
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

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
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Final clamp on drag end for safety
    const node = e.target as Konva.Text;
    const x = node.x();
    const y = node.y();
    const width = node.width();
    const height = node.height();

    const clampedX = Math.max(0, Math.min(x, CANVAS_SIZE.width - width));
    const clampedY = Math.max(0, Math.min(y, CANVAS_SIZE.height - height));

    onDragEnd(clampedX, clampedY);
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1
    node.scaleX(1);
    node.scaleY(1);

    // Calculate new font size based on scale
    const newFontSize = Math.max(8, object.fontSize * scaleY);

    // Get new dimensions
    let x = node.x();
    let y = node.y();
    let width = node.width() * scaleX;

    // Ensure the text stays within canvas bounds
    x = Math.max(0, Math.min(x, CANVAS_SIZE.width - width));
    y = Math.max(0, Math.min(y, CANVAS_SIZE.height - node.height()));

    onChange({
      x,
      y,
      fontSize: newFontSize,
      width: width > 20 ? width : undefined,
    });
  };

  // Handle click based on tool mode
  const handleClick = () => {
    if (tool === "delete") {
      onDelete();
    } else if (tool === "select") {
      onSelect();
    }
  };

  // Handle double-click to enter edit mode
  const handleDoubleClick = () => {
    if (tool === "select") {
      onDoubleClick();
    }
  };

  // Determine if object should be draggable based on tool
  const isDraggable = tool === "select";
  // Show transformer only in select mode when selected
  const showTransformer = isSelected && tool === "select";

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
        draggable={isDraggable}
        onDragMove={handleDragMove}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        wrap="word"
      />
      {showTransformer && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (newBox.width < 20 || newBox.height < 10) {
              return oldBox;
            }

            // Ensure position is within bounds
            let x = newBox.x;
            let y = newBox.y;
            let width = newBox.width;
            let height = newBox.height;

            x = Math.max(0, x);
            y = Math.max(0, y);

            const maxWidth = CANVAS_SIZE.width - x;
            const maxHeight = CANVAS_SIZE.height - y;
            width = Math.min(width, maxWidth);
            height = Math.min(height, maxHeight);

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
          rotateEnabled={false}
        />
      )}
    </>
  );
}

export default memo(Text);
