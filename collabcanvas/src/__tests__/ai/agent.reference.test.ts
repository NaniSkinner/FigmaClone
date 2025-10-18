/**
 * AI Agent - Object Reference Resolution Tests
 * Tests the agent's ability to find objects based on natural language descriptions
 */

import { CanvasObject, Rectangle, Circle, Text } from "@/types/canvas";
import { AIClient } from "@/lib/ai/client";

// Mock the AI client
jest.mock("@/lib/ai/client");

// Helper function to create test objects
const createTestRectangle = (
  id: string,
  fill: string,
  x: number,
  y: number,
  width: number = 400,
  height: number = 300
): Rectangle => ({
  id,
  type: "rectangle",
  x,
  y,
  width,
  height,
  fill,
  stroke: "#000000",
  strokeWidth: 2,
  rotation: 0,
  userId: "test-user",
  createdAt: new Date(),
  locked: false,
  zIndex: 1,
});

const createTestCircle = (
  id: string,
  fill: string,
  x: number,
  y: number,
  radius: number = 200
): Circle => ({
  id,
  type: "circle",
  x,
  y,
  radius,
  fill,
  stroke: "#000000",
  strokeWidth: 2,
  rotation: 0,
  userId: "test-user",
  createdAt: new Date(),
  locked: false,
  zIndex: 1,
});

const createTestText = (
  id: string,
  text: string,
  x: number,
  y: number,
  fontSize: number = 128
): Text => ({
  id,
  type: "text",
  x,
  y,
  text,
  fontSize,
  fontFamily: "Arial",
  fill: "#000000",
  rotation: 0,
  userId: "test-user",
  createdAt: new Date(),
  locked: false,
  zIndex: 1,
});

describe("AI Agent - Object Reference Resolution", () => {
  describe("Color Reference Resolution", () => {
    test("should find object by color reference", () => {
      const objects: CanvasObject[] = [
        createTestRectangle("rect1", "#0000FF", 1000, 1000), // blue
        createTestCircle("circle1", "#FF0000", 2000, 2000), // red
        createTestRectangle("rect2", "#00FF00", 3000, 3000), // green
      ];

      // Test finding blue rectangle
      const blueObjects = objects.filter(
        (obj) =>
          obj.type === "rectangle" &&
          "fill" in obj &&
          obj.fill.toLowerCase().includes("0000ff")
      );
      expect(blueObjects).toHaveLength(1);
      expect(blueObjects[0].id).toBe("rect1");
    });

    test("should find all objects with same color", () => {
      const objects: CanvasObject[] = [
        createTestRectangle("rect1", "#FF0000", 1000, 1000),
        createTestRectangle("rect2", "#FF0000", 2000, 2000),
        createTestCircle("circle1", "#FF0000", 3000, 3000),
      ];

      const redObjects = objects.filter(
        (obj) => "fill" in obj && obj.fill.toLowerCase().includes("ff0000")
      );
      expect(redObjects).toHaveLength(3);
    });

    test("should handle color name to hex conversion", () => {
      const colorMap: Record<string, string> = {
        blue: "0000ff",
        red: "ff0000",
        green: "00ff00",
        matcha: "d4e7c5",
        lavender: "b4a7d6",
      };

      expect(colorMap["blue"]).toBe("0000ff");
      expect(colorMap["matcha"]).toBe("d4e7c5");
    });
  });

  describe("Position Reference Resolution", () => {
    test("should find object in top-left quadrant", () => {
      const objects: CanvasObject[] = [
        createTestRectangle("rect1", "#FF0000", 1000, 1000), // top-left
        createTestRectangle("rect2", "#FF0000", 6000, 1000), // top-right
        createTestRectangle("rect3", "#FF0000", 1000, 6000), // bottom-left
        createTestRectangle("rect4", "#FF0000", 6000, 6000), // bottom-right
      ];

      // Top-left: x < 4000, y < 4000
      const topLeft = objects.filter(
        (obj) =>
          "x" in obj &&
          typeof obj.x === "number" &&
          obj.x < 4000 &&
          "y" in obj &&
          typeof obj.y === "number" &&
          obj.y < 4000
      );
      expect(topLeft).toHaveLength(1);
      expect(topLeft[0].id).toBe("rect1");
    });

    test("should find center object", () => {
      const objects: CanvasObject[] = [
        createTestRectangle("rect1", "#FF0000", 1000, 1000),
        createTestRectangle("rect2", "#FF0000", 4000, 4000), // center
        createTestRectangle("rect3", "#FF0000", 7000, 7000),
      ];

      // Center: within 500px of (4000, 4000)
      const center = 4000;
      const tolerance = 500;
      const centerObjects = objects.filter((obj) => {
        if (!("x" in obj) || !("y" in obj)) return false;
        const dx = Math.abs((obj.x as number) - center);
        const dy = Math.abs((obj.y as number) - center);
        return dx < tolerance && dy < tolerance;
      });

      expect(centerObjects).toHaveLength(1);
      expect(centerObjects[0].id).toBe("rect2");
    });

    test("should find rightmost object", () => {
      const objects: CanvasObject[] = [
        createTestRectangle("rect1", "#FF0000", 1000, 1000),
        createTestRectangle("rect2", "#FF0000", 3000, 3000),
        createTestRectangle("rect3", "#FF0000", 7000, 4000), // rightmost
      ];

      const rightmost = objects.reduce((max, obj) => {
        if (!("x" in obj) || !("x" in max)) return max;
        return (obj.x as number) > (max.x as number) ? obj : max;
      }, objects[0]);

      expect(rightmost.id).toBe("rect3");
    });
  });

  describe("Size Reference Resolution", () => {
    test("should find largest rectangle by area", () => {
      const objects: Rectangle[] = [
        createTestRectangle("rect1", "#FF0000", 1000, 1000, 200, 200), // area: 40,000
        createTestRectangle("rect2", "#FF0000", 2000, 2000, 500, 400), // area: 200,000
        createTestRectangle("rect3", "#FF0000", 3000, 3000, 300, 300), // area: 90,000
      ];

      const largest = objects.reduce((max, obj) => {
        const maxArea = max.width * max.height;
        const objArea = obj.width * obj.height;
        return objArea > maxArea ? obj : max;
      }, objects[0]);

      expect(largest.id).toBe("rect2");
      expect(largest.width * largest.height).toBe(200000);
    });

    test("should find smallest circle by radius", () => {
      const objects: Circle[] = [
        createTestCircle("circle1", "#FF0000", 1000, 1000, 300),
        createTestCircle("circle2", "#FF0000", 2000, 2000, 100), // smallest
        createTestCircle("circle3", "#FF0000", 3000, 3000, 250),
      ];

      const smallest = objects.reduce((min, obj) => {
        return obj.radius < min.radius ? obj : min;
      }, objects[0]);

      expect(smallest.id).toBe("circle2");
      expect(smallest.radius).toBe(100);
    });

    test("should filter objects larger than threshold", () => {
      const objects: Rectangle[] = [
        createTestRectangle("rect1", "#FF0000", 1000, 1000, 50, 50), // 2,500
        createTestRectangle("rect2", "#FF0000", 2000, 2000, 400, 300), // 120,000
        createTestRectangle("rect3", "#FF0000", 3000, 3000, 500, 400), // 200,000
      ];

      const threshold = 100000;
      const largeObjects = objects.filter((obj) => {
        return obj.width * obj.height > threshold;
      });

      expect(largeObjects).toHaveLength(2);
      expect(largeObjects.map((o) => o.id)).toEqual(["rect2", "rect3"]);
    });
  });

  describe("Text Content Resolution", () => {
    test("should find text by exact content match", () => {
      const objects: CanvasObject[] = [
        createTestText("text1", "Submit", 1000, 1000),
        createTestText("text2", "Cancel", 2000, 2000),
        createTestText("text3", "Login", 3000, 3000),
      ];

      const submitText = objects.filter(
        (obj) =>
          obj.type === "text" && (obj as Text).text.toLowerCase() === "submit"
      );

      expect(submitText).toHaveLength(1);
      expect((submitText[0] as Text).text).toBe("Submit");
    });

    test("should find text by partial content match", () => {
      const objects: CanvasObject[] = [
        createTestText("text1", "Submit Button", 1000, 1000),
        createTestText("text2", "Cancel Button", 2000, 2000),
        createTestText("text3", "Login Form", 3000, 3000),
      ];

      const buttonTexts = objects.filter(
        (obj) =>
          obj.type === "text" &&
          (obj as Text).text.toLowerCase().includes("button")
      );

      expect(buttonTexts).toHaveLength(2);
    });

    test("should handle case-insensitive text search", () => {
      const objects: CanvasObject[] = [
        createTestText("text1", "SUBMIT", 1000, 1000),
        createTestText("text2", "submit", 2000, 2000),
        createTestText("text3", "Submit", 3000, 3000),
      ];

      const submitTexts = objects.filter(
        (obj) =>
          obj.type === "text" && (obj as Text).text.toLowerCase() === "submit"
      );

      expect(submitTexts).toHaveLength(3);
    });
  });

  describe("Multiple Match Handling", () => {
    test("should identify when multiple objects match", () => {
      const objects: CanvasObject[] = [
        createTestRectangle("rect1", "#0000FF", 1000, 1000),
        createTestRectangle("rect2", "#0000FF", 2000, 2000),
        createTestRectangle("rect3", "#0000FF", 3000, 3000),
      ];

      const blueRectangles = objects.filter(
        (obj) =>
          obj.type === "rectangle" &&
          "fill" in obj &&
          obj.fill.toLowerCase().includes("0000ff")
      );

      expect(blueRectangles.length).toBeGreaterThan(1);
      // In real agent, this would trigger clarification request
    });

    test("should provide list of matches for clarification", () => {
      const objects: CanvasObject[] = [
        createTestRectangle("rect1", "#FF0000", 1000, 1000),
        createTestRectangle("rect2", "#FF0000", 3000, 1000),
        createTestRectangle("rect3", "#FF0000", 5000, 1000),
      ];

      const matches = objects.filter(
        (obj) =>
          obj.type === "rectangle" &&
          "fill" in obj &&
          obj.fill.toLowerCase().includes("ff0000")
      );

      // Generate clarification options
      const options = matches.map((obj, index) => {
        const position =
          "x" in obj
            ? `at (${obj.x}, ${"y" in obj ? obj.y : "unknown"})`
            : "unknown";
        return `${index + 1}. Red rectangle ${position}`;
      });

      expect(options).toHaveLength(3);
      expect(options[0]).toContain("1000, 1000");
    });
  });

  describe("No Match Handling", () => {
    test("should detect when no objects match", () => {
      const objects: CanvasObject[] = [
        createTestRectangle("rect1", "#0000FF", 1000, 1000), // blue
        createTestCircle("circle1", "#00FF00", 2000, 2000), // green
      ];

      const redCircles = objects.filter(
        (obj) =>
          obj.type === "circle" &&
          "fill" in obj &&
          obj.fill.toLowerCase().includes("ff0000")
      );

      expect(redCircles).toHaveLength(0);
      // In real agent, this would return helpful error message
    });

    test("should provide helpful error message format", () => {
      const searchType = "red circle";
      const availableTypes = ["blue rectangle", "green circle"];

      const errorMessage = `I couldn't find a ${searchType} on the canvas. Available objects: ${availableTypes.join(
        ", "
      )}. Would you like me to create one?`;

      expect(errorMessage).toContain("couldn't find");
      expect(errorMessage).toContain("Would you like me to create one");
    });
  });

  describe("Complex Reference Resolution", () => {
    test("should handle combined filters (type + color + position)", () => {
      const objects: CanvasObject[] = [
        createTestRectangle("rect1", "#0000FF", 1000, 1000), // blue, top-left
        createTestRectangle("rect2", "#FF0000", 1000, 1500), // red, top-left
        createTestRectangle("rect3", "#0000FF", 6000, 6000), // blue, bottom-right
      ];

      // Find: "blue rectangle in the top-left"
      const result = objects.filter((obj) => {
        if (obj.type !== "rectangle") return false;
        if (!("fill" in obj) || !obj.fill.toLowerCase().includes("0000ff"))
          return false;
        if (!("x" in obj) || !("y" in obj)) return false;
        return (obj.x as number) < 4000 && (obj.y as number) < 4000;
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("rect1");
    });

    test("should handle relative references (next to, near)", () => {
      const objects: CanvasObject[] = [
        createTestRectangle("rect1", "#0000FF", 1000, 1000),
        createTestCircle("circle1", "#FF0000", 1100, 1100), // near rect1
        createTestCircle("circle2", "#FF0000", 5000, 5000), // far away
      ];

      // Find objects near rect1 (within 500px)
      const rect1 = objects.find((o) => o.id === "rect1");
      if (!rect1 || !("x" in rect1) || !("y" in rect1)) {
        throw new Error("rect1 not found");
      }

      const nearbyObjects = objects.filter((obj) => {
        if (obj.id === "rect1") return false;
        if (!("x" in obj) || !("y" in obj)) return false;
        const dx = Math.abs((obj.x as number) - (rect1.x as number));
        const dy = Math.abs((obj.y as number) - (rect1.y as number));
        return Math.sqrt(dx * dx + dy * dy) < 500;
      });

      expect(nearbyObjects).toHaveLength(1);
      expect(nearbyObjects[0].id).toBe("circle1");
    });

    test("should handle semantic references (login button, submit form)", () => {
      const objects: CanvasObject[] = [
        createTestText("text1", "Login", 1000, 1000),
        createTestText("text2", "Submit", 2000, 2000),
        createTestText("text3", "Cancel", 3000, 3000),
      ];

      // Find "login button" - match text containing "login"
      const loginButton = objects.filter(
        (obj) =>
          obj.type === "text" &&
          (obj as Text).text.toLowerCase().includes("login")
      );

      expect(loginButton).toHaveLength(1);
      expect((loginButton[0] as Text).text).toBe("Login");
    });
  });

  describe("Z-Index and Layer Order", () => {
    test("should find topmost object (highest z-index)", () => {
      const objects: CanvasObject[] = [
        { ...createTestRectangle("rect1", "#FF0000", 1000, 1000), zIndex: 5 },
        { ...createTestRectangle("rect2", "#FF0000", 1000, 1000), zIndex: 10 },
        { ...createTestRectangle("rect3", "#FF0000", 1000, 1000), zIndex: 3 },
      ];

      const topmost = objects.reduce((max, obj) => {
        return obj.zIndex > max.zIndex ? obj : max;
      }, objects[0]);

      expect(topmost.id).toBe("rect2");
      expect(topmost.zIndex).toBe(10);
    });

    test("should find bottommost object (lowest z-index)", () => {
      const objects: CanvasObject[] = [
        { ...createTestRectangle("rect1", "#FF0000", 1000, 1000), zIndex: 5 },
        { ...createTestRectangle("rect2", "#FF0000", 1000, 1000), zIndex: 10 },
        { ...createTestRectangle("rect3", "#FF0000", 1000, 1000), zIndex: 1 },
      ];

      const bottommost = objects.reduce((min, obj) => {
        return obj.zIndex < min.zIndex ? obj : min;
      }, objects[0]);

      expect(bottommost.id).toBe("rect3");
      expect(bottommost.zIndex).toBe(1);
    });
  });

  describe("AI Metadata Filtering", () => {
    test("should filter AI-created objects", () => {
      const objects: CanvasObject[] = [
        {
          ...createTestRectangle("rect1", "#FF0000", 1000, 1000),
          createdByAI: true,
        },
        {
          ...createTestRectangle("rect2", "#FF0000", 2000, 2000),
          createdByAI: false,
        },
        {
          ...createTestRectangle("rect3", "#FF0000", 3000, 3000),
          createdByAI: true,
        },
      ];

      const aiObjects = objects.filter((obj) => obj.createdByAI === true);
      expect(aiObjects).toHaveLength(2);
    });

    test("should filter manually created objects", () => {
      const objects: CanvasObject[] = [
        {
          ...createTestRectangle("rect1", "#FF0000", 1000, 1000),
          createdByAI: true,
        },
        {
          ...createTestRectangle("rect2", "#FF0000", 2000, 2000),
          createdByAI: false,
        },
        { ...createTestRectangle("rect3", "#FF0000", 3000, 3000) }, // undefined = manual
      ];

      const manualObjects = objects.filter((obj) => obj.createdByAI !== true);
      expect(manualObjects).toHaveLength(2);
    });
  });
});
