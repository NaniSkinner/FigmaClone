/**
 * useCanvasContext Hook
 *
 * Provides canvas state context for AI operations.
 * Converts canvas state into structured JSON that the AI can understand.
 *
 * Reference: aiPRD.md Section 3.2.2 - JSON Structure
 */

import { useCallback, useMemo } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { CanvasObject } from "@/types/canvas";
import { CanvasContext, CanvasContextObject } from "@/types/ai";

// Canvas constants - Physical canvas dimensions
const CANVAS_WIDTH = 8000;
const CANVAS_HEIGHT = 8000;
const GRID_SIZE = 50;

/**
 * Main hook to get canvas context for AI
 */
export function useCanvasContext() {
  const objects = useCanvasStore((state) => state.objects);
  const selectedObjectIds = useCanvasStore((state) => state.selectedObjectIds);
  const scale = useCanvasStore((state) => state.scale);
  const position = useCanvasStore((state) => state.position);

  /**
   * Get current canvas context as structured JSON
   * This is what gets sent to the AI
   * Memoized to prevent unnecessary recalculations
   */
  const getCanvasContext = useCallback((): CanvasContext => {
    const objectsArray = Array.from(objects.values());

    return {
      timestamp: new Date().toISOString(),
      canvasInfo: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        objectCount: objectsArray.length,
        gridSize: GRID_SIZE,
      },
      objects: objectsArray.map(describeObject),
      selection: Array.from(selectedObjectIds),
      viewport: {
        scale,
        position: { x: position.x, y: position.y },
      },
    };
  }, [objects, selectedObjectIds, scale, position]);

  /**
   * Describe a canvas object in AI-friendly format
   * Simplifies the object structure for AI context
   */
  const describeObject = (obj: CanvasObject): CanvasContextObject => {
    // Helper to convert Firestore Timestamp or Date to ISO string
    const toISOString = (date: any): string => {
      if (!date) return new Date().toISOString();
      // Handle Firestore Timestamp
      if (date.toDate && typeof date.toDate === "function") {
        return date.toDate().toISOString();
      }
      // Handle Date object
      if (date instanceof Date) {
        return date.toISOString();
      }
      // Handle string
      if (typeof date === "string") {
        return new Date(date).toISOString();
      }
      // Fallback
      return new Date().toISOString();
    };

    const baseDescription: CanvasContextObject = {
      id: obj.id,
      type: obj.type,
      position: { x: 0, y: 0 },
      properties: {
        zIndex: obj.zIndex,
      },
      metadata: {
        createdBy: obj.userId,
        createdAt: toISOString(obj.createdAt),
        lastModified: obj.updatedAt ? toISOString(obj.updatedAt) : undefined,
      },
    };

    // Type-specific properties
    switch (obj.type) {
      case "rectangle":
        return {
          ...baseDescription,
          position: { x: obj.x, y: obj.y },
          dimensions: {
            width: obj.width,
            height: obj.height,
          },
          properties: {
            ...baseDescription.properties,
            fill: obj.fill,
            stroke: obj.stroke,
            rotation: obj.rotation,
          },
        };

      case "circle":
        return {
          ...baseDescription,
          position: { x: obj.x, y: obj.y },
          dimensions: {
            radius: obj.radius,
          },
          properties: {
            ...baseDescription.properties,
            fill: obj.fill,
            stroke: obj.stroke,
            rotation: obj.rotation,
          },
        };

      case "line":
        return {
          ...baseDescription,
          position: {
            x: obj.points[0],
            y: obj.points[1],
          },
          dimensions: {
            width: Math.abs(obj.points[2] - obj.points[0]),
            height: Math.abs(obj.points[3] - obj.points[1]),
          },
          properties: {
            ...baseDescription.properties,
            stroke: obj.stroke,
            rotation: obj.rotation,
          },
        };

      case "text":
        return {
          ...baseDescription,
          position: { x: obj.x, y: obj.y },
          dimensions: {
            width: obj.width,
          },
          properties: {
            ...baseDescription.properties,
            text: obj.text,
            fontSize: obj.fontSize,
            fill: obj.fill,
            rotation: obj.rotation,
          },
        };
    }
  };

  /**
   * Find objects by natural language description
   * Supports: color, position, size, type, text content
   *
   * Examples:
   * - "blue rectangle" → finds rectangles with blue fill
   * - "center" → finds objects near canvas center
   * - "largest" → finds object with max area
   * - "Login" → finds text with "Login" content
   */
  const findObjectByDescription = (description: string): CanvasObject[] => {
    const objectsArray = Array.from(objects.values());
    const lowerDesc = description.toLowerCase();

    let results: CanvasObject[] = [];

    // Match by color (simple color name matching)
    const colorMatch = lowerDesc.match(
      /(red|blue|green|yellow|purple|orange|white|black|gray|grey|matcha|lavender)/
    );
    if (colorMatch) {
      results = objectsArray.filter((obj) => {
        if (obj.type === "line") return false;
        const fill = obj.fill?.toLowerCase() || "";
        const color = colorMatch[1];

        // Color name to hex mapping (common colors)
        const colorMap: Record<string, string[]> = {
          red: ["#ff", "#f00", "red"],
          blue: ["#00", "#0000ff", "blue"],
          green: ["#0f", "#00ff00", "green", "#d4e7c5"], // Include matcha
          yellow: ["#ff", "yellow"],
          purple: ["#b4a7d6", "purple", "lavender"],
          white: ["#fff", "white"],
          black: ["#000", "black"],
          matcha: ["#d4e7c5"],
          lavender: ["#b4a7d6"],
        };

        const patterns = colorMap[color] || [];
        return patterns.some((pattern) => fill.includes(pattern.toLowerCase()));
      });
    }

    // Match by type
    const typeMatch = lowerDesc.match(/(rectangle|circle|line|text)/);
    if (typeMatch) {
      const type = typeMatch[1] as "rectangle" | "circle" | "line" | "text";
      const typeResults = objectsArray.filter((obj) => obj.type === type);
      results =
        results.length > 0
          ? results.filter((obj) => typeResults.includes(obj))
          : typeResults;
    }

    // Match by position
    if (lowerDesc.includes("center")) {
      const centerX = CANVAS_WIDTH / 2;
      const centerY = CANVAS_HEIGHT / 2;
      const threshold = 200; // Within 200px of center

      const centerResults = objectsArray.filter((obj) => {
        const objX = obj.type === "line" ? obj.points[0] : obj.x;
        const objY = obj.type === "line" ? obj.points[1] : obj.y;
        const distX = Math.abs(objX - centerX);
        const distY = Math.abs(objY - centerY);
        return distX < threshold && distY < threshold;
      });

      results =
        results.length > 0
          ? results.filter((obj) => centerResults.includes(obj))
          : centerResults;
    }

    // Match by position quadrants
    if (lowerDesc.includes("top-left") || lowerDesc.includes("top left")) {
      results = filterByQuadrant(objectsArray, "top-left");
    }
    if (lowerDesc.includes("top-right") || lowerDesc.includes("top right")) {
      results = filterByQuadrant(objectsArray, "top-right");
    }
    if (
      lowerDesc.includes("bottom-left") ||
      lowerDesc.includes("bottom left")
    ) {
      results = filterByQuadrant(objectsArray, "bottom-left");
    }
    if (
      lowerDesc.includes("bottom-right") ||
      lowerDesc.includes("bottom right")
    ) {
      results = filterByQuadrant(objectsArray, "bottom-right");
    }

    // Match by size
    if (lowerDesc.includes("largest")) {
      const largest = objectsArray.reduce((prev, current) => {
        const prevArea = getObjectArea(prev);
        const currentArea = getObjectArea(current);
        return currentArea > prevArea ? current : prev;
      });
      results = [largest];
    }

    if (lowerDesc.includes("smallest")) {
      const smallest = objectsArray.reduce((prev, current) => {
        const prevArea = getObjectArea(prev);
        const currentArea = getObjectArea(current);
        return currentArea < prevArea ? current : prev;
      });
      results = [smallest];
    }

    // Match by text content
    if (lowerDesc && !colorMatch && !typeMatch) {
      const textResults = objectsArray.filter((obj) => {
        if (obj.type !== "text") return false;
        return obj.text.toLowerCase().includes(lowerDesc);
      });

      if (textResults.length > 0) {
        results = textResults;
      }
    }

    return results;
  };

  /**
   * Filter objects by quadrant position
   */
  const filterByQuadrant = (
    objectsArray: CanvasObject[],
    quadrant: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  ): CanvasObject[] => {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    return objectsArray.filter((obj) => {
      const objX = obj.type === "line" ? obj.points[0] : obj.x;
      const objY = obj.type === "line" ? obj.points[1] : obj.y;

      switch (quadrant) {
        case "top-left":
          return objX < centerX && objY < centerY;
        case "top-right":
          return objX >= centerX && objY < centerY;
        case "bottom-left":
          return objX < centerX && objY >= centerY;
        case "bottom-right":
          return objX >= centerX && objY >= centerY;
      }
    });
  };

  /**
   * Calculate approximate area of an object
   */
  const getObjectArea = (obj: CanvasObject): number => {
    switch (obj.type) {
      case "rectangle":
        return obj.width * obj.height;
      case "circle":
        return Math.PI * obj.radius * obj.radius;
      case "line":
        // Use bounding box area
        const width = Math.abs(obj.points[2] - obj.points[0]);
        const height = Math.abs(obj.points[3] - obj.points[1]);
        return width * height;
      case "text":
        return (obj.width || 100) * (obj.fontSize * 1.2); // Estimate
    }
  };

  return {
    getCanvasContext,
    describeObject,
    findObjectByDescription,
  };
}
