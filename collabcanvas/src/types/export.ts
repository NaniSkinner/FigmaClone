/**
 * PNG Export Feature - Type Definitions
 *
 * Defines interfaces for export configuration, progress tracking, and bounding calculations.
 */

/**
 * Export configuration options
 */
export interface ExportOptions {
  resolution: number; // Pixel ratio multiplier (1, 2, 4)
  backgroundColor: string; // 'white', 'transparent', or hex color
  autoCrop: boolean; // Trim empty space around content
  // Note: Filenames are auto-generated via generateExportFilename()
}

/**
 * Export progress stages and status
 */
export interface ExportProgress {
  stage: "preparing" | "rendering" | "encoding" | "complete";
  progress: number; // 0-100
  message: string; // User-friendly status message
}

/**
 * Bounding box for auto-crop calculation
 */
export interface Bounds {
  x: number; // Top-left X coordinate
  y: number; // Top-left Y coordinate
  width: number; // Bounding box width
  height: number; // Bounding box height
}
