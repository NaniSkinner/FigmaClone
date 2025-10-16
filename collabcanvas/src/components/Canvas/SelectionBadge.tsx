"use client";

// Real-time selection badge component - EXTRA LARGE VERSION
import { Group, Rect, Text } from "react-konva";
import { CanvasObject } from "@/types";

interface SelectionBadgeProps {
  object: CanvasObject;
  userName: string;
  userColor: string;
}

export default function SelectionBadge({
  object,
  userName,
  userColor,
}: SelectionBadgeProps) {
  // Calculate badge position based on object type - HIGHER UP FOR VISIBILITY
  const getBadgePosition = () => {
    switch (object.type) {
      case "rectangle": {
        const rect = object as any;
        return {
          x: rect.x,
          y: rect.y - 60, // Position higher above the rectangle
          width: rect.width,
        };
      }
      case "circle": {
        const circle = object as any;
        return {
          x: circle.x - circle.radius,
          y: circle.y - circle.radius - 60, // Position higher above the circle
          width: circle.radius * 2,
        };
      }
      case "line": {
        const line = object as any;
        const points = line.points || [0, 0, 100, 100];
        const minX = Math.min(points[0], points[2]);
        const minY = Math.min(points[1], points[3]);
        return {
          x: minX,
          y: minY - 60,
          width: Math.abs(points[2] - points[0]),
        };
      }
      case "text": {
        const text = object as any;
        return {
          x: text.x,
          y: text.y - 60,
          width: text.width || 100,
        };
      }
      default:
        return { x: 0, y: -60, width: 100 };
    }
  };

  const position = getBadgePosition();

  // Render selection border around the object - THICKER AND MORE VISIBLE
  const renderSelectionBorder = () => {
    switch (object.type) {
      case "rectangle": {
        const rect = object as any;
        return (
          <Rect
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            stroke={userColor}
            strokeWidth={6}
            dash={[15, 8]}
            listening={false}
          />
        );
      }
      case "circle": {
        const circle = object as any;
        return (
          <Rect
            x={circle.x - circle.radius}
            y={circle.y - circle.radius}
            width={circle.radius * 2}
            height={circle.radius * 2}
            stroke={userColor}
            strokeWidth={6}
            dash={[15, 8]}
            listening={false}
          />
        );
      }
      case "line": {
        const line = object as any;
        const points = line.points || [0, 0, 100, 100];
        const minX = Math.min(points[0], points[2]);
        const minY = Math.min(points[1], points[3]);
        const maxX = Math.max(points[0], points[2]);
        const maxY = Math.max(points[1], points[3]);
        return (
          <Rect
            x={minX}
            y={minY}
            width={maxX - minX}
            height={maxY - minY}
            stroke={userColor}
            strokeWidth={6}
            dash={[15, 8]}
            listening={false}
          />
        );
      }
      case "text": {
        const text = object as any;
        return (
          <Rect
            x={text.x}
            y={text.y}
            width={text.width || 100}
            height={text.fontSize * 1.2 || 20}
            stroke={userColor}
            strokeWidth={6}
            dash={[15, 8]}
            listening={false}
          />
        );
      }
      default:
        return null;
    }
  };

  // Calculate badge dimensions - EXTRA LARGE AND SUPER PROMINENT
  const padding = 24;
  const fontSize = 28;
  const badgeWidth = userName.length * fontSize * 0.7 + padding * 2;
  const badgeHeight = fontSize + padding * 2;

  return (
    <Group listening={false}>
      {/* Selection border - THICKER */}
      {renderSelectionBorder()}

      {/* User badge background - EXTRA LARGE WITH SUPER STRONG SHADOW */}
      <Rect
        x={position.x}
        y={position.y}
        width={badgeWidth}
        height={badgeHeight}
        fill={userColor}
        cornerRadius={12}
        shadowColor="black"
        shadowBlur={15}
        shadowOpacity={0.7}
        shadowOffset={{ x: 0, y: 5 }}
      />

      {/* User badge text - EXTRA LARGE AND SUPER BOLD */}
      <Text
        x={position.x + padding}
        y={position.y + padding * 0.7}
        text={userName}
        fontSize={fontSize}
        fontFamily="Arial"
        fontStyle="bold"
        fill="white"
      />
    </Group>
  );
}
