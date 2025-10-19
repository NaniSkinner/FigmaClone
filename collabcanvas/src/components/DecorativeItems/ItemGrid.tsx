"use client";

import React from "react";
import { DecorativeItem } from "@/types/decorativeItems";
import { DecorativeItemThumbnail } from "./DecorativeItemThumbnail";

interface ItemGridProps {
  items: DecorativeItem[];
  onDragStart: (item: DecorativeItem) => void;
  onClick: (item: DecorativeItem) => void;
}

export const ItemGrid: React.FC<ItemGridProps> = ({
  items,
  onDragStart,
  onClick,
}) => {
  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-gray-400 text-4xl mb-3">🔍</div>
        <p className="text-gray-500 text-sm text-center mb-2">No items found</p>
        <p className="text-gray-400 text-xs text-center">
          Try a different search or category
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      {items.map((item) => (
        <DecorativeItemThumbnail
          key={item.id}
          item={item}
          onDragStart={onDragStart}
          onClick={onClick}
        />
      ))}
    </div>
  );
};
