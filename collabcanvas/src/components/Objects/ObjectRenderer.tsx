"use client";

import { memo } from "react";
import { Group } from "react-konva";
import { CanvasObject, UserPresence } from "@/types";
import Rectangle from "./Rectangle";
import Circle from "./Circle";
import Line from "./Line";
import Text from "./Text";
import SelectionBadge from "@/components/Canvas/SelectionBadge";
import { ToolMode } from "@/components/Canvas/CanvasControls";
import { useCanvasStore } from "@/store";

interface ObjectRendererProps {
  objects: CanvasObject[];
  selectedIds: Set<string>;
  onlineUsers: Map<string, UserPresence>;
  onObjectChange: (id: string, attrs: Partial<CanvasObject>) => void;
  onGroupDragStart: (id: string) => void;
  onGroupDragMove: (id: string, x: number, y: number) => void;
  onGroupDragEnd: () => void;
  tool: ToolMode;
  onDelete: (id: string) => void;
  onTextDoubleClick?: (id: string) => void;
  userId: string | null;
  canvasId: string;
}

function ObjectRenderer({
  objects,
  selectedIds,
  onlineUsers,
  onObjectChange,
  onGroupDragStart,
  onGroupDragMove,
  onGroupDragEnd,
  tool,
  onDelete,
  onTextDoubleClick,
  userId,
  canvasId,
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

  // Helper function to find users who have selected a specific object
  const getUsersSelectingObject = (objectId: string): UserPresence[] => {
    const users: UserPresence[] = [];
    onlineUsers.forEach((presence) => {
      if (
        presence.selectedObjectIds &&
        presence.selectedObjectIds.includes(objectId)
      ) {
        users.push(presence);
      }
    });
    return users;
  };

  // Sort objects by zIndex (lower zIndex renders first, higher zIndex on top)
  const sortedObjects = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <>
      {sortedObjects
        .filter((obj) => obj.visible !== false) // Filter out invisible objects
        .map((obj) => {
          const isSelected = selectedIds.has(obj.id);
          const onSelectHandler = (shiftKey: boolean = false) =>
            handleSelect(obj.id, shiftKey);
          const onDeleteHandler = () => onDelete(obj.id);

          const isMultiSelected = selectedIds.size > 1 && isSelected;

          // Disable interactions for locked objects
          const isLocked = obj.locked === true;

          // Get users who have selected this object
          const selectingUsers = getUsersSelectingObject(obj.id);

          switch (obj.type) {
            case "rectangle":
              return (
                <Group key={obj.id}>
                  <Rectangle
                    object={obj}
                    isSelected={isSelected}
                    onSelect={onSelectHandler}
                    onDragStart={() => !isLocked && onGroupDragStart(obj.id)}
                    onDragMove={(x, y) =>
                      !isLocked &&
                      isMultiSelected &&
                      onGroupDragMove(obj.id, x, y)
                    }
                    onDragEnd={(x, y) => {
                      if (!isLocked) {
                        onObjectChange(obj.id, { x, y });
                        if (isMultiSelected) onGroupDragEnd();
                      }
                    }}
                    onChange={(attrs) =>
                      !isLocked && onObjectChange(obj.id, attrs)
                    }
                    tool={tool}
                    onDelete={onDeleteHandler}
                    userId={userId}
                    canvasId={canvasId}
                  />
                  {/* Render selection badges for other users */}
                  {selectingUsers.map((user) => (
                    <SelectionBadge
                      key={`${obj.id}-${user.userId}`}
                      object={obj}
                      userName={user.user.name}
                      userColor={user.user.color}
                    />
                  ))}
                </Group>
              );

            case "circle":
              return (
                <Group key={obj.id}>
                  <Circle
                    object={obj}
                    isSelected={isSelected}
                    onSelect={onSelectHandler}
                    onDragStart={() => !isLocked && onGroupDragStart(obj.id)}
                    onDragMove={(x, y) =>
                      !isLocked &&
                      isMultiSelected &&
                      onGroupDragMove(obj.id, x, y)
                    }
                    onDragEnd={(x, y) => {
                      if (!isLocked) {
                        onObjectChange(obj.id, { x, y });
                        if (isMultiSelected) onGroupDragEnd();
                      }
                    }}
                    onChange={(attrs) =>
                      !isLocked && onObjectChange(obj.id, attrs)
                    }
                    tool={tool}
                    onDelete={onDeleteHandler}
                    userId={userId}
                    canvasId={canvasId}
                  />
                  {/* Render selection badges for other users */}
                  {selectingUsers.map((user) => (
                    <SelectionBadge
                      key={`${obj.id}-${user.userId}`}
                      object={obj}
                      userName={user.user.name}
                      userColor={user.user.color}
                    />
                  ))}
                </Group>
              );

            case "line":
              return (
                <Group key={obj.id}>
                  <Line
                    object={obj}
                    isSelected={isSelected}
                    onSelect={onSelectHandler}
                    onDragStart={() => !isLocked && onGroupDragStart(obj.id)}
                    onDragMove={(points) =>
                      !isLocked &&
                      isMultiSelected &&
                      onGroupDragMove(obj.id, points[0], points[1])
                    }
                    onDragEnd={(points) => {
                      if (!isLocked) {
                        onObjectChange(obj.id, { points });
                        if (isMultiSelected) onGroupDragEnd();
                      }
                    }}
                    onChange={(attrs) =>
                      !isLocked && onObjectChange(obj.id, attrs)
                    }
                    tool={tool}
                    onDelete={onDeleteHandler}
                    userId={userId}
                    canvasId={canvasId}
                  />
                  {/* Render selection badges for other users */}
                  {selectingUsers.map((user) => (
                    <SelectionBadge
                      key={`${obj.id}-${user.userId}`}
                      object={obj}
                      userName={user.user.name}
                      userColor={user.user.color}
                    />
                  ))}
                </Group>
              );

            case "text":
              return (
                <Group key={obj.id}>
                  <Text
                    object={obj}
                    isSelected={isSelected}
                    onSelect={onSelectHandler}
                    onDragStart={() => !isLocked && onGroupDragStart(obj.id)}
                    onDragMove={(x, y) =>
                      !isLocked &&
                      isMultiSelected &&
                      onGroupDragMove(obj.id, x, y)
                    }
                    onDragEnd={(x, y) => {
                      if (!isLocked) {
                        onObjectChange(obj.id, { x, y });
                        if (isMultiSelected) onGroupDragEnd();
                      }
                    }}
                    onChange={(attrs) =>
                      !isLocked && onObjectChange(obj.id, attrs)
                    }
                    tool={tool}
                    onDelete={onDeleteHandler}
                    onDoubleClick={() =>
                      !isLocked && onTextDoubleClick?.(obj.id)
                    }
                    userId={userId}
                    canvasId={canvasId}
                  />
                  {/* Render selection badges for other users */}
                  {selectingUsers.map((user) => (
                    <SelectionBadge
                      key={`${obj.id}-${user.userId}`}
                      object={obj}
                      userName={user.user.name}
                      userColor={user.user.color}
                    />
                  ))}
                </Group>
              );

            default:
              return null;
          }
        })}
    </>
  );
}

export default memo(ObjectRenderer);
