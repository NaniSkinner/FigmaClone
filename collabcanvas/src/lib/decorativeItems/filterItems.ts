import { DecorativeItem } from "@/types/decorativeItems";

/**
 * Filter decorative items by category and search query
 * @param items - Array of all decorative items
 * @param category - Category to filter by (null for all)
 * @param searchQuery - Search string to match against name and tags
 * @returns Filtered array of decorative items
 */
export function filterItems(
  items: DecorativeItem[],
  category: string | null,
  searchQuery: string
): DecorativeItem[] {
  return items.filter((item) => {
    // Filter by category (if specified)
    if (category && item.category !== category) {
      return false;
    }

    // Filter by search query (if specified)
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();

      // Search in item name
      if (item.name.toLowerCase().includes(query)) {
        return true;
      }

      // Search in tags
      if (item.tags.some((tag) => tag.toLowerCase().includes(query))) {
        return true;
      }

      // No match found
      return false;
    }

    // Pass all filters
    return true;
  });
}
