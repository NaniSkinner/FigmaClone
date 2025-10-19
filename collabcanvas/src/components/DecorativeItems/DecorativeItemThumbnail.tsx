"use client";

import React from "react";
import { DecorativeItem } from "@/types/decorativeItems";

interface DecorativeItemThumbnailProps {
  item: DecorativeItem;
  onDragStart: (item: DecorativeItem) => void;
  onClick: (item: DecorativeItem) => void;
}

export const DecorativeItemThumbnail: React.FC<
  DecorativeItemThumbnailProps
> = ({ item, onDragStart, onClick }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // Set drag data
    e.dataTransfer.setData("decorative-item", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
    onDragStart(item);
  };

  const handleClick = () => {
    onClick(item);
  };

  return (
    <div
      className="cursor-grab active:cursor-grabbing hover:bg-gray-50 rounded-lg p-2 transition-colors group"
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
    >
      {/* Thumbnail container */}
      <div className="aspect-square bg-white rounded-md flex items-center justify-center mb-2 border border-gray-200 group-hover:border-blue-300 transition-colors">
        <img
          src={item.filePath}
          alt={item.name}
          className="max-w-[80%] max-h-[80%] object-contain pointer-events-none select-none"
          draggable={false}
        />
      </div>

      {/* Item name */}
      <p className="text-xs text-center text-gray-600 truncate px-1">
        {item.name}
      </p>
    </div>
  );
};
