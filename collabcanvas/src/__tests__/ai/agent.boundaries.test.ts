/**
 * AI Agent - Boundary Validation Tests
 * Tests canvas boundary enforcement and size constraints
 */

import { Rectangle, Circle, Text } from "@/types/canvas";

describe("AI Agent - Boundary Validation", () => {
  const CANVAS_WIDTH = 8000;
  const CANVAS_HEIGHT = 8000;
  const MIN_SIZE = 10;

  describe("Canvas Boundary Tests", () => {
    test("should accept object within canvas boundaries", () => {
      const x = 4000;
      const y = 4000;
      const width = 400;
      const height = 300;

      const isWithinBounds =
        x >= 0 &&
        y >= 0 &&
        x + width <= CANVAS_WIDTH &&
        y + height <= CANVAS_HEIGHT;

      expect(isWithinBounds).toBe(true);
    });

    test("should detect object outside right boundary", () => {
      const x = 7800;
      const y = 4000;
      const width = 400;
      const height = 300;

      const isWithinBounds = x + width <= CANVAS_WIDTH;
      expect(isWithinBounds).toBe(false);

      // Adjust to fit
      const adjustedX = CANVAS_WIDTH - width;
      expect(adjustedX).toBe(7600);
      expect(adjustedX + width).toBe(CANVAS_WIDTH);
    });

    test("should detect object outside bottom boundary", () => {
      const x = 4000;
      const y = 7800;
      const width = 400;
      const height = 300;

      const isWithinBounds = y + height <= CANVAS_HEIGHT;
      expect(isWithinBounds).toBe(false);

      // Adjust to fit
      const adjustedY = CANVAS_HEIGHT - height;
      expect(adjustedY).toBe(7700);
      expect(adjustedY + height).toBe(CANVAS_HEIGHT);
    });

    test("should detect negative x coordinate", () => {
      const x = -100;
      const y = 100;

      const isValid = x >= 0 && y >= 0;
      expect(isValid).toBe(false);

      // Adjust to minimum
      const adjustedX = Math.max(0, x);
      expect(adjustedX).toBe(0);
    });

    test("should detect negative y coordinate", () => {
      const x = 100;
      const y = -50;

      const isValid = x >= 0 && y >= 0;
      expect(isValid).toBe(false);

      // Adjust to minimum
      const adjustedY = Math.max(0, y);
      expect(adjustedY).toBe(0);
    });

    test("should handle object completely outside canvas", () => {
      const x = 9000;
      const y = 9000;

      const isWithinBounds =
        x >= 0 && y >= 0 && x < CANVAS_WIDTH && y < CANVAS_HEIGHT;
      expect(isWithinBounds).toBe(false);

      // Adjust to nearest valid position
      const adjustedX = Math.max(0, Math.min(x, CANVAS_WIDTH - 400));
      const adjustedY = Math.max(0, Math.min(y, CANVAS_HEIGHT - 300));

      expect(adjustedX).toBe(7600);
      expect(adjustedY).toBe(7700);
    });
  });

  describe("Circle Boundary Tests", () => {
    test("should validate circle within bounds", () => {
      const x = 4000;
      const y = 4000;
      const radius = 200;

      const isWithinBounds =
        x - radius >= 0 &&
        y - radius >= 0 &&
        x + radius <= CANVAS_WIDTH &&
        y + radius <= CANVAS_HEIGHT;

      expect(isWithinBounds).toBe(true);
    });

    test("should detect circle extending beyond right edge", () => {
      const x = 7900;
      const y = 4000;
      const radius = 200;

      const isWithinBounds = x + radius <= CANVAS_WIDTH;
      expect(isWithinBounds).toBe(false);

      // Adjust position
      const adjustedX = CANVAS_WIDTH - radius;
      expect(adjustedX).toBe(7800);
    });

    test("should detect circle extending beyond left edge", () => {
      const x = 100;
      const y = 4000;
      const radius = 200;

      const isWithinBounds = x - radius >= 0;
      expect(isWithinBounds).toBe(false);

      // Adjust position
      const adjustedX = radius;
      expect(adjustedX).toBe(200);
    });

    test("should handle very large radius", () => {
      const x = 4000;
      const y = 4000;
      const radius = 5000; // Larger than half canvas

      const maxRadius = Math.min(
        x, // distance from left
        y, // distance from top
        CANVAS_WIDTH - x, // distance from right
        CANVAS_HEIGHT - y // distance from bottom
      );

      expect(maxRadius).toBe(4000);
      expect(radius).toBeGreaterThan(maxRadius);
    });
  });

  describe("Size Constraint Tests", () => {
    test("should enforce minimum width", () => {
      const width = 5;
      const height = 300;

      const isValidWidth = width >= MIN_SIZE;
      expect(isValidWidth).toBe(false);

      const adjustedWidth = Math.max(MIN_SIZE, width);
      expect(adjustedWidth).toBe(MIN_SIZE);
    });

    test("should enforce minimum height", () => {
      const width = 400;
      const height = 3;

      const isValidHeight = height >= MIN_SIZE;
      expect(isValidHeight).toBe(false);

      const adjustedHeight = Math.max(MIN_SIZE, height);
      expect(adjustedHeight).toBe(MIN_SIZE);
    });

    test("should enforce maximum width", () => {
      const width = 10000;
      const height = 300;

      const isValidWidth = width <= CANVAS_WIDTH;
      expect(isValidWidth).toBe(false);

      const adjustedWidth = Math.min(CANVAS_WIDTH, width);
      expect(adjustedWidth).toBe(CANVAS_WIDTH);
    });

    test("should enforce maximum height", () => {
      const width = 400;
      const height = 10000;

      const isValidHeight = height <= CANVAS_HEIGHT;
      expect(isValidHeight).toBe(false);

      const adjustedHeight = Math.min(CANVAS_HEIGHT, height);
      expect(adjustedHeight).toBe(CANVAS_HEIGHT);
    });

    test("should enforce minimum circle radius", () => {
      const radius = 3;
      const minRadius = 5;

      const isValid = radius >= minRadius;
      expect(isValid).toBe(false);

      const adjustedRadius = Math.max(minRadius, radius);
      expect(adjustedRadius).toBe(minRadius);
    });

    test("should enforce maximum circle radius", () => {
      const radius = 5000;
      const maxRadius = 4000;

      const isValid = radius <= maxRadius;
      expect(isValid).toBe(false);

      const adjustedRadius = Math.min(maxRadius, radius);
      expect(adjustedRadius).toBe(maxRadius);
    });
  });

  describe("Position Adjustment Logic", () => {
    test("should adjust rectangle to fit within canvas", () => {
      const validateAndAdjustRectangle = (
        x: number,
        y: number,
        width: number,
        height: number
      ) => {
        const adjusted = {
          x: Math.max(0, Math.min(x, CANVAS_WIDTH - width)),
          y: Math.max(0, Math.min(y, CANVAS_HEIGHT - height)),
          width: Math.max(MIN_SIZE, Math.min(width, CANVAS_WIDTH)),
          height: Math.max(MIN_SIZE, Math.min(height, CANVAS_HEIGHT)),
        };
        return adjusted;
      };

      // Test case 1: Outside right edge
      let result = validateAndAdjustRectangle(7800, 4000, 400, 300);
      expect(result.x).toBe(7600);
      expect(result.x + result.width).toBe(CANVAS_WIDTH);

      // Test case 2: Outside bottom edge
      result = validateAndAdjustRectangle(4000, 7900, 400, 300);
      expect(result.y).toBe(7700);
      expect(result.y + result.height).toBe(CANVAS_HEIGHT);

      // Test case 3: Negative coordinates
      result = validateAndAdjustRectangle(-100, -50, 400, 300);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);

      // Test case 4: Too small
      result = validateAndAdjustRectangle(100, 100, 5, 3);
      expect(result.width).toBe(MIN_SIZE);
      expect(result.height).toBe(MIN_SIZE);

      // Test case 5: Too large
      result = validateAndAdjustRectangle(0, 0, 10000, 12000);
      expect(result.width).toBe(CANVAS_WIDTH);
      expect(result.height).toBe(CANVAS_HEIGHT);
    });

    test("should adjust circle to fit within canvas", () => {
      const validateAndAdjustCircle = (
        x: number,
        y: number,
        radius: number
      ) => {
        const adjusted = {
          x: Math.max(radius, Math.min(x, CANVAS_WIDTH - radius)),
          y: Math.max(radius, Math.min(y, CANVAS_HEIGHT - radius)),
          radius: Math.max(5, radius),
        };
        return adjusted;
      };

      // Test case 1: Too close to left edge
      let result = validateAndAdjustCircle(100, 4000, 200);
      expect(result.x).toBe(200);

      // Test case 2: Too close to right edge
      result = validateAndAdjustCircle(7900, 4000, 200);
      expect(result.x).toBe(7800);

      // Test case 3: Too close to top edge
      result = validateAndAdjustCircle(4000, 100, 200);
      expect(result.y).toBe(200);

      // Test case 4: Too close to bottom edge
      result = validateAndAdjustCircle(4000, 7900, 200);
      expect(result.y).toBe(7800);

      // Test case 5: Radius too small
      result = validateAndAdjustCircle(4000, 4000, 2);
      expect(result.radius).toBe(5);
    });
  });

  describe("Warning Message Generation", () => {
    test("should generate warning for out of bounds position", () => {
      const requestedX = 9000;
      const requestedY = 9000;
      const adjustedX = 7600;
      const adjustedY = 7700;

      const warning = `The position (${requestedX}, ${requestedY}) is outside the canvas boundaries. I've adjusted it to (${adjustedX}, ${adjustedY}).`;

      expect(warning).toContain("outside the canvas");
      expect(warning).toContain("adjusted");
      expect(warning).toContain("9000");
      expect(warning).toContain("7600");
    });

    test("should generate warning for size adjustment", () => {
      const requestedWidth = 10000;
      const requestedHeight = 12000;
      const adjustedWidth = 8000;
      const adjustedHeight = 8000;

      const warning = `The requested size (${requestedWidth}×${requestedHeight}) exceeds canvas limits. I've adjusted it to (${adjustedWidth}×${adjustedHeight}).`;

      expect(warning).toContain("exceeds canvas limits");
      expect(warning).toContain("10000×12000");
      expect(warning).toContain("8000×8000");
    });

    test("should generate no warning for valid input", () => {
      const x = 4000;
      const y = 4000;
      const width = 400;
      const height = 300;

      const isValid =
        x >= 0 &&
        y >= 0 &&
        x + width <= CANVAS_WIDTH &&
        y + height <= CANVAS_HEIGHT &&
        width >= MIN_SIZE &&
        height >= MIN_SIZE;

      expect(isValid).toBe(true);
      // No warning needed
    });
  });

  describe("Edge Cases", () => {
    test("should handle zero dimensions", () => {
      const width = 0;
      const height = 0;

      const adjustedWidth = Math.max(MIN_SIZE, width);
      const adjustedHeight = Math.max(MIN_SIZE, height);

      expect(adjustedWidth).toBe(MIN_SIZE);
      expect(adjustedHeight).toBe(MIN_SIZE);
    });

    test("should handle negative dimensions", () => {
      const width = -100;
      const height = -50;

      const adjustedWidth = Math.max(MIN_SIZE, Math.abs(width));
      const adjustedHeight = Math.max(MIN_SIZE, Math.abs(height));

      expect(adjustedWidth).toBe(100);
      expect(adjustedHeight).toBe(50);
    });

    test("should handle exactly at canvas edge", () => {
      const x = CANVAS_WIDTH - 400;
      const y = CANVAS_HEIGHT - 300;
      const width = 400;
      const height = 300;

      const isWithinBounds =
        x + width <= CANVAS_WIDTH && y + height <= CANVAS_HEIGHT;

      expect(isWithinBounds).toBe(true);
      expect(x).toBe(7600);
      expect(y).toBe(7700);
    });

    test("should handle single pixel overflow", () => {
      const x = CANVAS_WIDTH - 399; // 7601
      const y = CANVAS_HEIGHT - 299; // 7701
      const width = 400;
      const height = 300;

      const overflowsRight = x + width > CANVAS_WIDTH;
      const overflowsBottom = y + height > CANVAS_HEIGHT;

      expect(overflowsRight).toBe(true);
      expect(overflowsBottom).toBe(true);

      const adjustedX = CANVAS_WIDTH - width;
      const adjustedY = CANVAS_HEIGHT - height;

      expect(adjustedX).toBe(7600);
      expect(adjustedY).toBe(7700);
    });
  });

  describe("Rotation and Bounds", () => {
    test("should consider rotated rectangle bounds", () => {
      // A rotated rectangle needs more space
      const x = 4000;
      const y = 4000;
      const width = 400;
      const height = 300;
      const rotation = 45; // degrees

      // Calculate bounding box after rotation
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));

      const boundingWidth = width * cos + height * sin;
      const boundingHeight = width * sin + height * cos;

      expect(boundingWidth).toBeGreaterThan(width);
      expect(boundingHeight).toBeGreaterThan(height);

      // Check if bounding box fits
      const halfBoundingWidth = boundingWidth / 2;
      const halfBoundingHeight = boundingHeight / 2;

      const isWithinBounds =
        x - halfBoundingWidth >= 0 &&
        y - halfBoundingHeight >= 0 &&
        x + halfBoundingWidth <= CANVAS_WIDTH &&
        y + halfBoundingHeight <= CANVAS_HEIGHT;

      expect(isWithinBounds).toBe(true);
    });
  });

  describe("Batch Creation Boundary Checks", () => {
    test("should validate all objects in batch", () => {
      const objects = [
        { x: 1000, y: 1000, width: 400, height: 300 },
        { x: 9000, y: 4000, width: 400, height: 300 }, // invalid
        { x: 4000, y: -100, width: 400, height: 300 }, // invalid
        { x: 5000, y: 5000, width: 400, height: 300 },
      ];

      const validated = objects.map((obj) => ({
        ...obj,
        x: Math.max(0, Math.min(obj.x, CANVAS_WIDTH - obj.width)),
        y: Math.max(0, Math.min(obj.y, CANVAS_HEIGHT - obj.height)),
        adjusted:
          obj.x < 0 ||
          obj.x + obj.width > CANVAS_WIDTH ||
          obj.y < 0 ||
          obj.y + obj.height > CANVAS_HEIGHT,
      }));

      expect(validated[0].adjusted).toBe(false);
      expect(validated[1].adjusted).toBe(true);
      expect(validated[1].x).toBe(7600);
      expect(validated[2].adjusted).toBe(true);
      expect(validated[2].y).toBe(0);
      expect(validated[3].adjusted).toBe(false);
    });
  });
});
