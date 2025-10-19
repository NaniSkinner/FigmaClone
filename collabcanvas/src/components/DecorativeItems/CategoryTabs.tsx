"use client";

import React from "react";
import { CategoryInfo } from "@/types/decorativeItems";

interface CategoryTabsProps {
  categories: CategoryInfo[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {/* All button */}
      <button
        onClick={() => onSelectCategory(null)}
        className={`
          px-3 py-1.5 rounded-full text-xs font-medium transition-all
          ${
            selectedCategory === null
              ? "bg-blue-500 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }
        `}
      >
        All
      </button>

      {/* Category buttons */}
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1
            ${
              selectedCategory === cat.id
                ? "text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }
          `}
          style={{
            backgroundColor:
              selectedCategory === cat.id ? cat.color : undefined,
          }}
        >
          <span>{cat.icon}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
};
