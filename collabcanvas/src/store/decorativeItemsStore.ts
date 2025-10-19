import { create } from "zustand";
import type { DecorativeItemsStore } from "@/types/decorativeItems";
import { loadDecorativeItems } from "@/lib/decorativeItems/loadItems";
import { filterItems } from "@/lib/decorativeItems/filterItems";

// LocalStorage key for recent items
const RECENT_ITEMS_KEY = "decorativeItems_recent";

// Load recent items from localStorage
const loadRecentItems = (): string[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error("Failed to load recent items from localStorage:", error);
  }
  return [];
};

// Save recent items to localStorage
const saveRecentItems = (items: string[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save recent items to localStorage:", error);
  }
};

export const useDecorativeItemsStore = create<DecorativeItemsStore>(
  (set, get) => ({
    // Initial State
    items: [],
    categories: [],
    selectedCategory: null,
    searchQuery: "",
    recentItems: loadRecentItems(),
    isLoading: false,
    error: null,

    // Load items from JSON
    loadItems: async () => {
      set({ isLoading: true, error: null });

      try {
        const data = await loadDecorativeItems();

        set({
          items: data.items,
          categories: data.categories,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Failed to load decorative items:", error);
        set({
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load decorative items",
        });
      }
    },

    // Set selected category filter
    setCategory: (category) => {
      set({ selectedCategory: category });
    },

    // Set search query
    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },

    // Add item to recent items
    addToRecent: (itemId) => {
      const { recentItems } = get();

      // Remove if already exists, then add to front
      const updated = [
        itemId,
        ...recentItems.filter((id) => id !== itemId),
      ].slice(0, 5); // Keep only last 5

      set({ recentItems: updated });
      saveRecentItems(updated);
    },

    // Clear recent items
    clearRecent: () => {
      set({ recentItems: [] });
      saveRecentItems([]);
    },

    // Get filtered items based on current category and search query
    getFilteredItems: () => {
      const { items, selectedCategory, searchQuery } = get();
      return filterItems(items, selectedCategory, searchQuery);
    },

    // Get item by ID
    getItemById: (id) => {
      const { items } = get();
      return items.find((item) => item.id === id);
    },
  })
);
