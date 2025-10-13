"use client";

import { Rect, Transformer } from "react-konva";
import { useRef, useEffect } from "react";
import Konva from "konva";
import { CanvasObject } from "@/types";

interface RectangleProps {
  object: CanvasObject;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onChange: (attrs: Partial<CanvasObject>) => void;
}

export default function Rectangle({
  object,
  isSelected,
  onSelect,
  onDragEnd,
  onChange,
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

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(e.target.x(), e.target.y());
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and adjust width/height instead
    node.scaleX(1);
    node.scaleY(1);

    onChange({
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
    });
  };

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
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum size
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
