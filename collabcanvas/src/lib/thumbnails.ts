import Konva from "konva";
import { CanvasObject } from "@/types/canvas";

/**
 * Calculate bounding box for all objects on canvas
 */
function calculateBounds(objects: CanvasObject[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (objects.length === 0) {
    return { minX: 0, minY: 0, maxX: 256, maxY: 256, width: 256, height: 256 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  objects.forEach((obj) => {
    if (obj.type === "rectangle") {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    } else if (obj.type === "circle") {
      minX = Math.min(minX, obj.x - obj.radius);
      minY = Math.min(minY, obj.y - obj.radius);
      maxX = Math.max(maxX, obj.x + obj.radius);
      maxY = Math.max(maxY, obj.y + obj.radius);
    } else if (obj.type === "line") {
      const [x1, y1, x2, y2] = obj.points;
      minX = Math.min(minX, x1, x2);
      minY = Math.min(minY, y1, y2);
      maxX = Math.max(maxX, x1, x2);
      maxY = Math.max(maxY, y1, y2);
    } else if (obj.type === "text") {
      // Approximate text bounds
      const textWidth = obj.width || obj.text.length * obj.fontSize * 0.6;
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + textWidth);
      maxY = Math.max(maxY, obj.y + obj.fontSize * 1.2);
    }
  });

  const width = maxX - minX;
  const height = maxY - minY;

  return { minX, minY, maxX, maxY, width, height };
}

/**
 * Generate a thumbnail image from canvas objects
 * @param objects - Array of canvas objects to render
 * @returns Base64 JPEG data URL (256x256)
 */
export async function generateThumbnail(
  objects: CanvasObject[]
): Promise<string> {
  // Empty canvas - return placeholder
  if (objects.length === 0) {
    return generateEmptyThumbnail();
  }

  try {
    // Calculate bounds of all objects
    const bounds = calculateBounds(objects);

    // Add padding (10% of size)
    const padding = Math.max(bounds.width, bounds.height) * 0.1;
    const contentWidth = bounds.width + padding * 2;
    const contentHeight = bounds.height + padding * 2;

    // Calculate scale to fit in 256x256
    const thumbnailSize = 256;
    const scale = Math.min(
      thumbnailSize / contentWidth,
      thumbnailSize / contentHeight,
      1 // Don't scale up, only down
    );

    // Create temporary container (hidden)
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.width = `${thumbnailSize}px`;
    container.style.height = `${thumbnailSize}px`;
    document.body.appendChild(container);

    // Create Konva stage
    const stage = new Konva.Stage({
      container: container,
      width: thumbnailSize,
      height: thumbnailSize,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // Calculate offset to center content
    const offsetX =
      (thumbnailSize - contentWidth * scale) / 2 -
      bounds.minX * scale +
      padding * scale;
    const offsetY =
      (thumbnailSize - contentHeight * scale) / 2 -
      bounds.minY * scale +
      padding * scale;

    // Render each object
    objects.forEach((obj) => {
      let shape: Konva.Shape | null = null;

      if (obj.type === "rectangle") {
        shape = new Konva.Rect({
          x: obj.x * scale + offsetX,
          y: obj.y * scale + offsetY,
          width: obj.width * scale,
          height: obj.height * scale,
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth * scale,
          rotation: obj.rotation || 0,
        });
      } else if (obj.type === "circle") {
        shape = new Konva.Circle({
          x: obj.x * scale + offsetX,
          y: obj.y * scale + offsetY,
          radius: obj.radius * scale,
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth * scale,
          rotation: obj.rotation || 0,
        });
      } else if (obj.type === "line") {
        const [x1, y1, x2, y2] = obj.points;
        shape = new Konva.Line({
          points: [
            x1 * scale + offsetX,
            y1 * scale + offsetY,
            x2 * scale + offsetX,
            y2 * scale + offsetY,
          ],
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth * scale,
          rotation: obj.rotation || 0,
        });
      } else if (obj.type === "text") {
        shape = new Konva.Text({
          x: obj.x * scale + offsetX,
          y: obj.y * scale + offsetY,
          text: obj.text,
          fontSize: obj.fontSize * scale,
          fontFamily: obj.fontFamily,
          fontStyle: obj.fontStyle || "normal",
          fill: obj.fill,
          rotation: obj.rotation || 0,
        });
      }

      if (shape) {
        layer.add(shape);
      }
    });

    // Draw the layer
    layer.draw();

    // Convert to base64 JPEG (quality 0.7 for smaller file size)
    const dataURL = stage.toDataURL({
      mimeType: "image/jpeg",
      quality: 0.7,
      pixelRatio: 1,
    });

    // Cleanup
    stage.destroy();
    document.body.removeChild(container);

    return dataURL;
  } catch (error) {
    console.error("Failed to generate thumbnail:", error);
    return generateEmptyThumbnail();
  }
}

/**
 * Generate placeholder thumbnail for empty canvas
 */
function generateEmptyThumbnail(): string {
  try {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.width = "256px";
    container.style.height = "256px";
    document.body.appendChild(container);

    const stage = new Konva.Stage({
      container: container,
      width: 256,
      height: 256,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // Add background
    const bg = new Konva.Rect({
      x: 0,
      y: 0,
      width: 256,
      height: 256,
      fill: "#f5f5f5",
    });
    layer.add(bg);

    // Add placeholder text
    const text = new Konva.Text({
      x: 0,
      y: 118,
      width: 256,
      text: "Empty Canvas",
      fontSize: 20,
      fontFamily: "Arial",
      fill: "#999999",
      align: "center",
    });
    layer.add(text);

    layer.draw();

    const dataURL = stage.toDataURL({
      mimeType: "image/jpeg",
      quality: 0.7,
    });

    stage.destroy();
    document.body.removeChild(container);

    return dataURL;
  } catch (error) {
    console.error("Failed to generate empty thumbnail:", error);
    // Return a minimal base64 placeholder
    return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABhA//Z";
  }
}
