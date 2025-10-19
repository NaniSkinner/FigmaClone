// Decorative Items Type Definitions

export interface Attribution {
  author: string;
  source: string;
  license: string;
  url: string;
}

export interface DecorativeItem {
  id: string;
  name: string;
  category: string;
  filePath: string;
  tags: string[];
  defaultWidth: number;
  defaultHeight: number;
  aspectRatio: number;
  thumbnail?: string;
  isPremium?: boolean;
  attribution?: Attribution;
}

export interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface DecorativeMetadata {
  version: string;
  categories: CategoryInfo[];
  items: DecorativeItem[];
}

// Type for decorative items store
export interface DecorativeItemsStore {
  // State
  items: DecorativeItem[];
  categories: CategoryInfo[];
  selectedCategory: string | null;
  searchQuery: string;
  recentItems: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadItems: () => Promise<void>;
  setCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  addToRecent: (itemId: string) => void;
  clearRecent: () => void;
  getFilteredItems: () => DecorativeItem[];
  getItemById: (id: string) => DecorativeItem | undefined;
}
