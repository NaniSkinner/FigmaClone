"use client";

import { Rect } from "react-konva";
import { memo } from "react";
import { SelectionBox as SelectionBoxType } from "@/types";

interface SelectionBoxProps {
  selectionBox: SelectionBoxType;
}

function SelectionBox({ selectionBox }: SelectionBoxProps) {
  const { startX, startY, currentX, currentY } = selectionBox;

  // Calculate rectangle dimensions
  // Handle negative dimensions (when dragging up-left)
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(0, 123, 255, 0.1)" // Semi-transparent blue
      stroke="rgba(0, 123, 255, 0.5)" // Blue border
      strokeWidth={1}
      dash={[5, 5]} // Dashed border style
      listening={false} // Don't capture events
    />
  );
}

export default memo(SelectionBox);
