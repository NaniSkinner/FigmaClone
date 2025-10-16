"use client";

import { memo } from "react";
import { CanvasObject } from "@/types";
import Rectangle from "./Rectangle";
import Circle from "./Circle";
import Line from "./Line";
import Text from "./Text";
import { ToolMode } from "@/components/Canvas/CanvasControls";
import { useCanvasStore } from "@/store";

interface ObjectRendererProps {
  objects: CanvasObject[];
  selectedIds: Set<string>;
  onObjectChange: (id: string, attrs: Partial<CanvasObject>) => void;
  onGroupDragStart: (id: string) => void;
  onGroupDragMove: (id: string, x: number, y: number) => void;
  onGroupDragEnd: () => void;
  tool: ToolMode;
  onDelete: (id: string) => void;
  onTextDoubleClick?: (id: string) => void;
}

function ObjectRenderer({
  objects,
  selectedIds,
  onObjectChange,
  onGroupDragStart,
  onGroupDragMove,
  onGroupDragEnd,
  tool,
  onDelete,
  onTextDoubleClick,
}: ObjectRendererProps) {
  const { addToSelection, clearSelection, toggleSelection } = useCanvasStore();

  const handleSelect = (id: string, shiftKey: boolean) => {
    if (shiftKey) {
      // Shift+Click: Toggle selection
      toggleSelection(id);
    } else {
      // Regular click: Select only this object
      clearSelection();
      addToSelection(id);
    }
  };

  // Sort objects by zIndex (lower zIndex renders first, higher zIndex on top)
  const sortedObjects = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <>
      {sortedObjects.map((obj) => {
        const isSelected = selectedIds.has(obj.id);
        const onSelectHandler = (shiftKey: boolean = false) =>
          handleSelect(obj.id, shiftKey);
        const onDeleteHandler = () => onDelete(obj.id);

        const isMultiSelected = selectedIds.size > 1 && isSelected;

        switch (obj.type) {
          case "rectangle":
            return (
              <Rectangle
                key={obj.id}
                object={obj}
                isSelected={isSelected}
                onSelect={onSelectHandler}
                onDragStart={() => onGroupDragStart(obj.id)}
                onDragMove={(x, y) =>
                  isMultiSelected && onGroupDragMove(obj.id, x, y)
                }
                onDragEnd={(x, y) => {
                  onObjectChange(obj.id, { x, y });
                  if (isMultiSelected) onGroupDragEnd();
                }}
                onChange={(attrs) => onObjectChange(obj.id, attrs)}
                tool={tool}
                onDelete={onDeleteHandler}
              />
            );

          case "circle":
            return (
              <Circle
                key={obj.id}
                object={obj}
                isSelected={isSelected}
                onSelect={onSelectHandler}
                onDragStart={() => onGroupDragStart(obj.id)}
                onDragMove={(x, y) =>
                  isMultiSelected && onGroupDragMove(obj.id, x, y)
                }
                onDragEnd={(x, y) => {
                  onObjectChange(obj.id, { x, y });
                  if (isMultiSelected) onGroupDragEnd();
                }}
                onChange={(attrs) => onObjectChange(obj.id, attrs)}
                tool={tool}
                onDelete={onDeleteHandler}
              />
            );

          case "line":
            return (
              <Line
                key={obj.id}
                object={obj}
                isSelected={isSelected}
                onSelect={onSelectHandler}
                onDragStart={() => onGroupDragStart(obj.id)}
                onDragMove={(points) =>
                  isMultiSelected &&
                  onGroupDragMove(obj.id, points[0], points[1])
                }
                onDragEnd={(points) => {
                  onObjectChange(obj.id, { points });
                  if (isMultiSelected) onGroupDragEnd();
                }}
                onChange={(attrs) => onObjectChange(obj.id, attrs)}
                tool={tool}
                onDelete={onDeleteHandler}
              />
            );

          case "text":
            return (
              <Text
                key={obj.id}
                object={obj}
                isSelected={isSelected}
                onSelect={onSelectHandler}
                onDragStart={() => onGroupDragStart(obj.id)}
                onDragMove={(x, y) =>
                  isMultiSelected && onGroupDragMove(obj.id, x, y)
                }
                onDragEnd={(x, y) => {
                  onObjectChange(obj.id, { x, y });
                  if (isMultiSelected) onGroupDragEnd();
                }}
                onChange={(attrs) => onObjectChange(obj.id, attrs)}
                tool={tool}
                onDelete={onDeleteHandler}
                onDoubleClick={() => onTextDoubleClick?.(obj.id)}
              />
            );

          default:
            return null;
        }
      })}
    </>
  );
}

export default memo(ObjectRenderer);
