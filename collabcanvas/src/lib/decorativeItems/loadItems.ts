import { DecorativeMetadata } from "@/types/decorativeItems";

/**
 * Load decorative items metadata from JSON file
 * @returns Promise<DecorativeMetadata> The metadata containing categories and items
 * @throws Error if loading fails
 */
export async function loadDecorativeItems(): Promise<DecorativeMetadata> {
  try {
    const response = await fetch("/decorative-items/decorative-items.json");

    if (!response.ok) {
      throw new Error(
        `Failed to load decorative items: ${response.statusText}`
      );
    }

    const data: DecorativeMetadata = await response.json();

    // Validate the data structure
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Invalid decorative items data: missing items array");
    }

    if (!data.categories || !Array.isArray(data.categories)) {
      throw new Error(
        "Invalid decorative items data: missing categories array"
      );
    }

    return data;
  } catch (error) {
    console.error("Error loading decorative items:", error);
    throw error;
  }
}
