"use client";

// Real-time selection badge component - EXTRA LARGE VERSION with lock indicator
import { Group, Rect, Circle, Text, Line as KonvaLine } from "react-konva";
import { CanvasObject } from "@/types";

interface SelectionBadgeProps {
  object: CanvasObject;
  userName: string;
  userColor: string;
}

// Check if object is locked by this user and lock is still valid
function isLocked(object: CanvasObject, userName: string): boolean {
  return (
    !!object.lock &&
    object.lock.userName === userName &&
    new Date(object.lock.expiresAt) > new Date()
  );
}

export default function SelectionBadge({
  object,
  userName,
  userColor,
}: SelectionBadgeProps) {
  // Calculate badge position based on object type - MUCH HIGHER UP FOR VISIBILITY
  const getBadgePosition = () => {
    switch (object.type) {
      case "rectangle": {
        const rect = object as any;
        return {
          x: rect.x,
          y: rect.y - 90, // Position much higher above the rectangle to accommodate larger badge
          width: rect.width,
        };
      }
      case "circle": {
        const circle = object as any;
        return {
          x: circle.x - circle.radius,
          y: circle.y - circle.radius - 90, // Position much higher above the circle
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
          y: minY - 90,
          width: Math.abs(points[2] - points[0]),
        };
      }
      case "text": {
        const text = object as any;
        return {
          x: text.x,
          y: text.y - 90,
          width: text.width || 100,
        };
      }
      default:
        return { x: 0, y: -90, width: 100 };
    }
  };

  const position = getBadgePosition();

  // Render selection border around the object - MASSIVE AND SUPER BRIGHT
  const renderSelectionBorder = () => {
    switch (object.type) {
      case "rectangle": {
        const rect = object as any;
        return (
          <>
            {/* Outer glow effect layer - INTENSE */}
            <Rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              stroke={userColor}
              strokeWidth={28}
              dash={[25, 12]}
              opacity={0.5}
              listening={false}
              shadowColor={userColor}
              shadowBlur={35}
              shadowOpacity={0.9}
            />
            {/* Main border - SUPER THICK */}
            <Rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              stroke={userColor}
              strokeWidth={16}
              dash={[25, 12]}
              listening={false}
            />
          </>
        );
      }
      case "circle": {
        const circle = object as any;
        return (
          <>
            {/* Outer glow effect layer - INTENSE CIRCULAR */}
            <Circle
              x={circle.x}
              y={circle.y}
              radius={circle.radius}
              stroke={userColor}
              strokeWidth={28}
              dash={[25, 12]}
              opacity={0.5}
              listening={false}
              shadowColor={userColor}
              shadowBlur={35}
              shadowOpacity={0.9}
            />
            {/* Main border - SUPER THICK CIRCULAR */}
            <Circle
              x={circle.x}
              y={circle.y}
              radius={circle.radius}
              stroke={userColor}
              strokeWidth={16}
              dash={[25, 12]}
              listening={false}
            />
          </>
        );
      }
      case "line": {
        const line = object as any;
        const points = line.points || [0, 0, 100, 100];
        return (
          <>
            {/* Outer glow effect layer - INTENSE LINE */}
            <KonvaLine
              points={points}
              stroke={userColor}
              strokeWidth={28}
              dash={[25, 12]}
              opacity={0.5}
              listening={false}
              shadowColor={userColor}
              shadowBlur={35}
              shadowOpacity={0.9}
            />
            {/* Main border - SUPER THICK LINE */}
            <KonvaLine
              points={points}
              stroke={userColor}
              strokeWidth={16}
              dash={[25, 12]}
              listening={false}
            />
          </>
        );
      }
      case "text": {
        const text = object as any;
        return (
          <>
            {/* Outer glow effect layer - INTENSE */}
            <Rect
              x={text.x}
              y={text.y}
              width={text.width || 100}
              height={text.fontSize * 1.2 || 20}
              stroke={userColor}
              strokeWidth={28}
              dash={[25, 12]}
              opacity={0.5}
              listening={false}
              shadowColor={userColor}
              shadowBlur={35}
              shadowOpacity={0.9}
            />
            {/* Main border - SUPER THICK */}
            <Rect
              x={text.x}
              y={text.y}
              width={text.width || 100}
              height={text.fontSize * 1.2 || 20}
              stroke={userColor}
              strokeWidth={16}
              dash={[25, 12]}
              listening={false}
            />
          </>
        );
      }
      default:
        return null;
    }
  };

  // Check if this user has the object locked
  const locked = isLocked(object, userName);
  const displayText = locked ? `🔒 ${userName} (Editing)` : userName;

  // Calculate badge dimensions - MASSIVE AND UNMISSABLE
  const padding = 36;
  const fontSize = 48; // Increased from 36 to 48 - SUPER LARGE
  const badgeWidth = displayText.length * fontSize * 0.55 + padding * 2;
  const badgeHeight = fontSize + padding * 2;

  // Use a more prominent color for locked state
  const badgeColor = locked ? "#FF6B6B" : userColor;

  return (
    <Group listening={false}>
      {/* Selection border - MASSIVE WITH INTENSE GLOW */}
      {renderSelectionBorder()}

      {/* User badge background - MASSIVE WITH SUPER INTENSE SHADOW AND GLOW */}
      <Rect
        x={position.x}
        y={position.y}
        width={badgeWidth}
        height={badgeHeight}
        fill={badgeColor}
        cornerRadius={16}
        shadowColor="black"
        shadowBlur={30}
        shadowOpacity={0.9}
        shadowOffset={{ x: 0, y: 8 }}
      />

      {/* User badge text - MASSIVE AND ULTRA BOLD */}
      <Text
        x={position.x + padding}
        y={position.y + padding * 0.7}
        text={displayText}
        fontSize={fontSize}
        fontFamily="Arial"
        fontStyle="bold"
        fill="white"
        shadowColor="rgba(0,0,0,0.6)"
        shadowBlur={4}
        shadowOffset={{ x: 2, y: 2 }}
      />
    </Group>
  );
}
