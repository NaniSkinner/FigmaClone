"use client";

import { memo } from "react";
import { CanvasObject } from "@/types";
import Rectangle from "./Rectangle";
import { ToolMode } from "@/components/Canvas/CanvasControls";

interface ObjectRendererProps {
  objects: CanvasObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onObjectChange: (id: string, attrs: Partial<CanvasObject>) => void;
  tool: ToolMode;
  onDelete: (id: string) => void;
}

function ObjectRenderer({
  objects,
  selectedId,
  onSelect,
  onObjectChange,
  tool,
  onDelete,
}: ObjectRendererProps) {
  return (
    <>
      {objects.map((obj) => {
        if (obj.type === "rectangle") {
          return (
            <Rectangle
              key={obj.id}
              object={obj}
              isSelected={obj.id === selectedId}
              onSelect={() => onSelect(obj.id)}
              onDragEnd={(x, y) => onObjectChange(obj.id, { x, y })}
              onChange={(attrs) => onObjectChange(obj.id, attrs)}
              tool={tool}
              onDelete={() => onDelete(obj.id)}
            />
          );
        }
        return null;
      })}
    </>
  );
}

export default memo(ObjectRenderer);
