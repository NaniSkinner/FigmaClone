"use client";

import { memo } from "react";
import { CanvasObject } from "@/types";
import Rectangle from "./Rectangle";
import Circle from "./Circle";
import Line from "./Line";
import Text from "./Text";
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
        const isSelected = obj.id === selectedId;
        const onSelectHandler = () => onSelect(obj.id);
        const onDeleteHandler = () => onDelete(obj.id);

        switch (obj.type) {
          case "rectangle":
            return (
              <Rectangle
                key={obj.id}
                object={obj}
                isSelected={isSelected}
                onSelect={onSelectHandler}
                onDragEnd={(x, y) => onObjectChange(obj.id, { x, y })}
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
                onDragEnd={(x, y) => onObjectChange(obj.id, { x, y })}
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
                onDragEnd={(points) => onObjectChange(obj.id, { points })}
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
                onDragEnd={(x, y) => onObjectChange(obj.id, { x, y })}
                onChange={(attrs) => onObjectChange(obj.id, attrs)}
                tool={tool}
                onDelete={onDeleteHandler}
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
