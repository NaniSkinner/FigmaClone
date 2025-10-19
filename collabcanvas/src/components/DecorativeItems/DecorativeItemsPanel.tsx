"use client";

import React, { useEffect } from "react";
import { useDecorativeItemsStore } from "@/store/decorativeItemsStore";
import { useCanvasStore } from "@/store/canvasStore";
import { DecorativeItem } from "@/types/decorativeItems";
import { SearchBar } from "./SearchBar";
import { CategoryTabs } from "./CategoryTabs";
import { ItemGrid } from "./ItemGrid";

interface DecorativeItemsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  canvasId: string;
  userId: string | null;
  onAddItem: (item: DecorativeItem, position: { x: number; y: number }) => void;
}

export const DecorativeItemsPanel: React.FC<DecorativeItemsPanelProps> = ({
  isOpen,
  onClose,
  canvasId,
  userId,
  onAddItem,
}) => {
  const {
    loadItems,
    getFilteredItems,
    categories,
    selectedCategory,
    setCategory,
    searchQuery,
    setSearchQuery,
    addToRecent,
    isLoading,
    error,
  } = useDecorativeItemsStore();

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = getFilteredItems();

  // Handle drag start
  const handleDragStart = (item: DecorativeItem) => {
    console.log("Dragging item:", item.name);
  };

  // Handle click to add to canvas center
  const handleItemClick = (item: DecorativeItem) => {
    if (!userId) return;

    // Add to canvas center (position will be calculated by parent)
    onAddItem(item, { x: 0, y: 0 }); // Parent will center it

    // Add to recent items
    addToRecent(item.id);
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Panel - No backdrop, canvas remains visible */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col border-l-2 border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>🎨</span>
            <span>Decorative Items</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
            aria-label="Close panel"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search items..."
          />
        </div>

        {/* Category Tabs */}
        <div className="p-4 border-b border-gray-200">
          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setCategory}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-500">Loading items...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-red-400 text-4xl mb-3">⚠️</div>
              <p className="text-gray-700 text-sm mb-2">Failed to load items</p>
              <p className="text-gray-500 text-xs mb-4">{error}</p>
              <button
                onClick={loadItems}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Items Grid */}
        {!isLoading && !error && (
          <div className="flex-1 overflow-y-auto">
            <ItemGrid
              items={filteredItems}
              onDragStart={handleDragStart}
              onClick={handleItemClick}
            />
          </div>
        )}

        {/* Footer with item count */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}{" "}
            available
          </p>
        </div>
      </div>
    </>
  );
};
