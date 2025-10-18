/**
 * Font Preloader Utility
 * Ensures fonts are loaded before canvas export to prevent rendering issues
 */

/**
 * Web-safe fonts that should be available in all browsers
 */
const WEB_SAFE_FONTS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Courier New",
  "Comic Sans MS",
  "Impact",
  "Trebuchet MS",
  "Arial Black",
];

/**
 * Preload all web-safe fonts
 * @returns Promise that resolves when all fonts are loaded
 */
export async function preloadWebFonts(): Promise<void> {
  const promises = WEB_SAFE_FONTS.map((font) => {
    return document.fonts.load(`16px "${font}"`).catch((err) => {
      console.warn(`Failed to preload font "${font}":`, err);
      return null; // Continue even if one font fails
    });
  });

  await Promise.all(promises);
}

/**
 * Check if a specific font is loaded
 * @param fontFamily - Font family name to check
 * @returns true if font is loaded, false otherwise
 */
export function isFontLoaded(fontFamily: string): boolean {
  return document.fonts.check(`16px "${fontFamily}"`);
}

/**
 * Get a fallback font if the requested font is not available
 * @param fontFamily - Requested font family
 * @returns The requested font if available, otherwise Arial
 */
export function getFallbackFont(fontFamily: string): string {
  if (!fontFamily) {
    return "Arial";
  }

  // Check if the font is loaded
  if (isFontLoaded(fontFamily)) {
    return fontFamily;
  }

  // Check if it's a web-safe font that might just need loading
  if (WEB_SAFE_FONTS.includes(fontFamily)) {
    console.warn(
      `Font "${fontFamily}" is web-safe but not loaded yet, using Arial fallback`
    );
  } else {
    console.warn(
      `Font "${fontFamily}" not loaded or not available, using Arial fallback`
    );
  }

  return "Arial";
}

/**
 * Preload a specific custom font
 * @param fontFamily - Font family name to preload
 * @returns Promise that resolves when font is loaded
 */
export async function preloadFont(fontFamily: string): Promise<void> {
  try {
    await document.fonts.load(`16px "${fontFamily}"`);
  } catch (err) {
    console.warn(`Failed to preload font "${fontFamily}":`, err);
  }
}

/**
 * Wait for all fonts in the document to be ready
 * @returns Promise that resolves when all fonts are ready
 */
export async function waitForFontsReady(): Promise<void> {
  try {
    await document.fonts.ready;
  } catch (err) {
    console.warn("Error waiting for fonts ready:", err);
  }
}
