"use client";

import { CanvasObject } from "@/types";

interface LayerItemProps {
  object: CanvasObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onVisibilityToggle: (id: string, visible: boolean) => void;
  onLockToggle: (id: string, locked: boolean) => void;
}

export default function LayerItem({
  object,
  isSelected,
  onSelect,
  onVisibilityToggle,
  onLockToggle,
}: LayerItemProps) {
  // Use object's actual visibility and lock state (default to true/false)
  const isVisible = object.visible !== false; // Default to visible if undefined
  const isLocked = object.locked === true; // Default to unlocked if undefined

  // Get icon based on object type
  const getObjectIcon = () => {
    switch (object.type) {
      case "rectangle":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="2"
              y="3"
              width="12"
              height="10"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        );
      case "circle":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="8"
              cy="8"
              r="5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        );
      case "line":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1="2"
              y1="12"
              x2="14"
              y2="4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        );
      case "text":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 3h10M8 3v10M6 13h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  // Get display name for object
  const getObjectName = () => {
    const typeName = object.type.charAt(0).toUpperCase() + object.type.slice(1);
    return `${typeName}`;
  };

  const handleVisibilityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVisible = !isVisible;
    onVisibilityToggle(object.id, newVisible);
  };

  const handleLockToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLocked = !isLocked;
    onLockToggle(object.id, newLocked);
  };

  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2.5 cursor-pointer
        hover:bg-gray-50 transition-all border-l-4
        ${
          isSelected
            ? "bg-blue-50 border-l-blue-500 hover:bg-blue-100"
            : "border-l-transparent"
        }
        ${isLocked ? "opacity-60" : ""}
      `}
      onClick={() => onSelect(object.id)}
    >
      {/* Object Icon */}
      <div className="flex-shrink-0 text-gray-600">{getObjectIcon()}</div>

      {/* Object Name */}
      <div className="flex-1 text-sm font-medium text-gray-700 truncate">
        {getObjectName()}
      </div>

      {/* Visibility Toggle */}
      <button
        onClick={handleVisibilityToggle}
        className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-md transition-all hover:scale-110 text-base"
        title={isVisible ? "Hide layer" : "Show layer"}
      >
        {isVisible ? "👁️" : "🙈"}
      </button>

      {/* Lock Toggle */}
      <button
        onClick={handleLockToggle}
        className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-md transition-all hover:scale-110 text-base"
        title={isLocked ? "Unlock layer" : "Lock layer"}
      >
        {isLocked ? "🔒" : "🔓"}
      </button>
    </div>
  );
}
