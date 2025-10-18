/**
 * PNG Export Feature - Core Export Engine
 *
 * Provides functions to export canvas objects to PNG format with auto-crop and progress tracking.
 */

import Konva from "konva";
import { CanvasObject, Rectangle, Circle, Line, Text } from "@/types/canvas";
import { ExportOptions, ExportProgress, Bounds } from "@/types/export";

/**
 * Calculate bounds of a single object considering rotation
 */
function getObjectBounds(obj: CanvasObject): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  switch (obj.type) {
    case "rectangle": {
      const rect = obj as Rectangle;
      // For simplicity, we'll use axis-aligned bounding box
      // (rotation handled by Konva during render)
      return {
        left: rect.x,
        top: rect.y,
        right: rect.x + rect.width,
        bottom: rect.y + rect.height,
      };
    }

    case "circle": {
      const circle = obj as Circle;
      return {
        left: circle.x - circle.radius,
        top: circle.y - circle.radius,
        right: circle.x + circle.radius,
        bottom: circle.y + circle.radius,
      };
    }

    case "line": {
      const line = obj as Line;
      const [x1, y1, x2, y2] = line.points;
      return {
        left: Math.min(x1, x2),
        top: Math.min(y1, y2),
        right: Math.max(x1, x2),
        bottom: Math.max(y1, y2),
      };
    }

    case "text": {
      const text = obj as Text;
      // Estimate text width if not provided
      const textWidth = text.width || text.text.length * text.fontSize * 0.6;
      return {
        left: text.x,
        top: text.y,
        right: text.x + textWidth,
        bottom: text.y + text.fontSize * 1.2, // Height with line height
      };
    }

    default:
      return { left: 0, top: 0, right: 0, bottom: 0 };
  }
}

/**
 * Calculate bounding box for all objects with padding
 */
export function calculateBounds(objects: CanvasObject[]): Bounds {
  if (objects.length === 0) {
    // Return default bounds for empty canvas
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  objects.forEach((obj) => {
    const bounds = getObjectBounds(obj);
    minX = Math.min(minX, bounds.left);
    minY = Math.min(minY, bounds.top);
    maxX = Math.max(maxX, bounds.right);
    maxY = Math.max(maxY, bounds.bottom);
  });

  // Add 10% padding (20% for single object for better centering)
  const paddingPercent = objects.length === 1 ? 0.2 : 0.1;
  const paddingX = (maxX - minX) * paddingPercent;
  const paddingY = (maxY - minY) * paddingPercent;

  return {
    x: minX - paddingX,
    y: minY - paddingY,
    width: maxX - minX + paddingX * 2,
    height: maxY - minY + paddingY * 2,
  };
}

/**
 * Generate sanitized filename with timestamp
 */
export function generateExportFilename(projectName: string): string {
  const timestamp = Date.now();
  const safeName = projectName
    .replace(/[^a-z0-9]/gi, "_") // Replace special chars with underscore
    .toLowerCase()
    .substring(0, 50); // Max 50 chars

  return `${safeName}_${timestamp}.png`;
}

/**
 * Trigger browser download of PNG data URL
 */
export function downloadPNG(dataURL: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Estimate file size in MB for warning purposes
 */
function estimateFileSize(width: number, height: number): number {
  // Rough estimate: width * height * 4 bytes (RGBA) / 1024 / 1024
  return (width * height * 4) / 1024 / 1024;
}

/**
 * Create Konva shape from canvas object
 */
function createKonvaShape(obj: CanvasObject): Konva.Shape | null {
  switch (obj.type) {
    case "rectangle": {
      const rect = obj as Rectangle;
      return new Konva.Rect({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        fill: rect.fill,
        stroke: rect.stroke,
        strokeWidth: rect.strokeWidth,
        rotation: rect.rotation || 0,
      });
    }

    case "circle": {
      const circle = obj as Circle;
      return new Konva.Circle({
        x: circle.x,
        y: circle.y,
        radius: circle.radius,
        fill: circle.fill,
        stroke: circle.stroke,
        strokeWidth: circle.strokeWidth,
        rotation: circle.rotation || 0,
      });
    }

    case "line": {
      const line = obj as Line;
      return new Konva.Line({
        points: Array.from(line.points),
        stroke: line.stroke,
        strokeWidth: line.strokeWidth,
        lineCap: "round",
        lineJoin: "round",
        rotation: line.rotation || 0,
      });
    }

    case "text": {
      const text = obj as Text;
      return new Konva.Text({
        x: text.x,
        y: text.y,
        text: text.text,
        fontSize: text.fontSize,
        fontFamily: text.fontFamily || "Arial",
        fontStyle: text.fontStyle || "normal",
        fill: text.fill,
        width: text.width,
        rotation: text.rotation || 0,
      });
    }

    default:
      console.warn(`Unknown object type: ${(obj as any).type}`);
      return null;
  }
}

/**
 * Placeholder for font preloading (implemented in Phase 3)
 */
async function preloadFonts(objects: CanvasObject[]): Promise<void> {
  // Collect unique fonts from text objects
  const fonts = new Set<string>();
  objects.forEach((obj) => {
    if (obj.type === "text") {
      fonts.add(obj.fontFamily || "Arial");
    }
  });

  // Preload each font
  const fontPromises = Array.from(fonts).map((font) => {
    return document.fonts.load(`16px ${font}`).catch((err) => {
      console.warn(`Failed to load font ${font}:`, err);
    });
  });

  await Promise.all(fontPromises);
  await document.fonts.ready;
}

/**
 * Main PNG export function
 * Exports canvas objects to PNG data URL with progress tracking
 */
export async function exportToPNG(
  objects: CanvasObject[],
  options: ExportOptions = {
    resolution: 2,
    backgroundColor: "white",
    autoCrop: true,
  },
  onProgress?: (progress: ExportProgress) => void
): Promise<string> {
  // Debug: Log export start
  console.log(`[PNG Export] Starting export of ${objects.length} objects`);

  // Stage 1: Preparing (0-20%)
  onProgress?.({
    stage: "preparing",
    progress: 10,
    message: "Preparing canvas...",
  });

  // Calculate bounds
  const bounds = options.autoCrop
    ? calculateBounds(objects)
    : { x: 0, y: 0, width: 8000, height: 8000 };

  onProgress?.({
    stage: "preparing",
    progress: 15,
    message: "Loading fonts...",
  });

  // Preload fonts
  await preloadFonts(objects);

  onProgress?.({
    stage: "preparing",
    progress: 20,
    message: "Fonts loaded",
  });

  // Stage 2: Rendering (20-70%)
  onProgress?.({
    stage: "rendering",
    progress: 30,
    message: "Creating render surface...",
  });

  // Create temporary hidden container
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  document.body.appendChild(container);

  try {
    // Calculate export dimensions
    const exportWidth = bounds.width * options.resolution;
    const exportHeight = bounds.height * options.resolution;

    // Check file size and warn if too large
    const estimatedSize = estimateFileSize(exportWidth, exportHeight);
    if (estimatedSize > 10) {
      const proceed = confirm(
        `This export will be approximately ${estimatedSize.toFixed(
          1
        )}MB. Continue?`
      );

      if (!proceed) {
        document.body.removeChild(container);
        throw new Error("Export cancelled by user");
      }
    }

    // Create Konva stage
    const stage = new Konva.Stage({
      container,
      width: exportWidth,
      height: exportHeight,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // Apply scale and offset to center content
    layer.scale({
      x: options.resolution,
      y: options.resolution,
    });
    layer.position({
      x: -bounds.x * options.resolution,
      y: -bounds.y * options.resolution,
    });

    onProgress?.({
      stage: "rendering",
      progress: 40,
      message: "Rendering objects...",
    });

    // Render all objects
    objects.forEach((obj, index) => {
      // Progress update for large canvases
      if (objects.length > 50 && index % 10 === 0) {
        const progress = 40 + (index / objects.length) * 30;
        onProgress?.({
          stage: "rendering",
          progress,
          message: `Rendering object ${index + 1}/${objects.length}...`,
        });
      }

      const shape = createKonvaShape(obj);
      if (shape) {
        layer.add(shape);
      } else {
        console.warn(`[PNG Export] Failed to create shape for object:`, obj);
      }
    });

    // Draw the layer
    layer.draw();

    onProgress?.({
      stage: "rendering",
      progress: 70,
      message: "Finalizing render...",
    });

    // Stage 3: Encoding (70-90%)
    onProgress?.({
      stage: "encoding",
      progress: 75,
      message: "Encoding PNG...",
    });

    // Export to PNG data URL
    const dataURL = stage.toDataURL({
      mimeType: "image/png",
      quality: 1,
      pixelRatio: 1, // Already scaled via layer.scale()
      ...(options.backgroundColor !== "transparent" && {
        backgroundColor: options.backgroundColor,
      }),
    });

    onProgress?.({
      stage: "encoding",
      progress: 90,
      message: "Preparing download...",
    });

    // Cleanup
    stage.destroy();
    document.body.removeChild(container);

    // Stage 4: Complete (90-100%)
    onProgress?.({
      stage: "complete",
      progress: 100,
      message: "Export complete!",
    });

    return dataURL;
  } catch (error) {
    // Cleanup on error
    if (container.parentNode) {
      document.body.removeChild(container);
    }

    console.error("PNG export failed:", error);

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes("cancelled")) {
        throw new Error("Export cancelled by user");
      } else if (error.message.includes("memory")) {
        throw new Error(
          "Export failed: Not enough memory. Try reducing resolution or object count."
        );
      } else if (error.message.includes("quota")) {
        throw new Error("Export failed: Browser storage limit reached.");
      }
    }

    throw error;
  }
}
