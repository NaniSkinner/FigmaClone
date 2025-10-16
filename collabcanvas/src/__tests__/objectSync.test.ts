/**
 * Object Synchronization Tests
 * PR #5: Object Creation & Synchronization
 *
 * Test object creation, movement, and real-time sync
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useCanvasStore } from "@/store";
import { CanvasObject } from "@/types";

describe("Object Synchronization Tests", () => {
  beforeEach(() => {
    // Clear canvas store before each test
    const { clearObjects } = useCanvasStore.getState();
    clearObjects();
  });

  describe("Canvas Store Object Management", () => {
    it("should add an object to the store", () => {
      const { result } = renderHook(() => useCanvasStore());

      const testObject: CanvasObject = {
        id: "rect-1",
        type: "rectangle",
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        fill: "#D4E7C5",
        stroke: "#B4A7D6",
        strokeWidth: 2,
        userId: "user-1",
        createdAt: new Date(),
      };

      act(() => {
        result.current.addObject(testObject);
      });

      expect(result.current.objects.has(testObject.id)).toBe(true);
      expect(result.current.objects.get(testObject.id)).toEqual(testObject);
    });

    it("should update an existing object", () => {
      const { result } = renderHook(() => useCanvasStore());

      const testObject: CanvasObject = {
        id: "rect-1",
        type: "rectangle",
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        fill: "#D4E7C5",
        stroke: "#B4A7D6",
        strokeWidth: 2,
        userId: "user-1",
        createdAt: new Date(),
      };

      act(() => {
        result.current.addObject(testObject);
      });

      const updates = { x: 200, y: 200 };

      act(() => {
        result.current.updateObject(testObject.id, updates);
      });

      const updatedObject = result.current.objects.get(testObject.id);
      expect(updatedObject?.x).toBe(200);
      expect(updatedObject?.y).toBe(200);
      expect(updatedObject?.width).toBe(100); // Unchanged properties remain
    });

    it("should remove an object from the store", () => {
      const { result } = renderHook(() => useCanvasStore());

      const testObject: CanvasObject = {
        id: "rect-1",
        type: "rectangle",
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        fill: "#D4E7C5",
        stroke: "#B4A7D6",
        strokeWidth: 2,
        userId: "user-1",
        createdAt: new Date(),
      };

      act(() => {
        result.current.addObject(testObject);
      });

      expect(result.current.objects.has(testObject.id)).toBe(true);

      act(() => {
        result.current.removeObject(testObject.id);
      });

      expect(result.current.objects.has(testObject.id)).toBe(false);
    });

    it("should set multiple objects at once", () => {
      const { result } = renderHook(() => useCanvasStore());

      const objects: CanvasObject[] = [
        {
          id: "rect-1",
          type: "rectangle",
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          fill: "#D4E7C5",
          stroke: "#B4A7D6",
          strokeWidth: 2,
          userId: "user-1",
          createdAt: new Date(),
        },
        {
          id: "rect-2",
          type: "rectangle",
          x: 200,
          y: 200,
          width: 150,
          height: 150,
          fill: "#D4E7C5",
          stroke: "#B4A7D6",
          strokeWidth: 2,
          userId: "user-1",
          createdAt: new Date(),
        },
      ];

      act(() => {
        result.current.setObjects(objects);
      });

      expect(result.current.objects.size).toBe(2);
      expect(result.current.objects.has("rect-1")).toBe(true);
      expect(result.current.objects.has("rect-2")).toBe(true);
    });

    it("should handle object selection", () => {
      const { result } = renderHook(() => useCanvasStore());

      expect(result.current.selectedObjectIds.size).toBe(0);

      act(() => {
        result.current.addToSelection("rect-1");
      });

      expect(result.current.selectedObjectIds.has("rect-1")).toBe(true);
      expect(result.current.selectedObjectIds.size).toBe(1);

      act(() => {
        result.current.addToSelection("rect-2");
      });

      expect(result.current.selectedObjectIds.has("rect-2")).toBe(true);
      expect(result.current.selectedObjectIds.size).toBe(2);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedObjectIds.size).toBe(0);
    });

    it("should maintain object count under load", () => {
      const { result } = renderHook(() => useCanvasStore());

      // Create 50 objects
      for (let i = 0; i < 50; i++) {
        const object: CanvasObject = {
          id: `rect-${i}`,
          type: "rectangle",
          x: i * 10,
          y: i * 10,
          width: 100,
          height: 100,
          fill: "#D4E7C5",
          stroke: "#B4A7D6",
          strokeWidth: 2,
          userId: "user-1",
          createdAt: new Date(),
        };

        act(() => {
          result.current.addObject(object);
        });
      }

      expect(result.current.objects.size).toBe(50);
    });
  });

  describe("Object Validation", () => {
    it("should create objects with minimum dimensions", () => {
      const { result } = renderHook(() => useCanvasStore());

      const smallObject: CanvasObject = {
        id: "rect-small",
        type: "rectangle",
        x: 0,
        y: 0,
        width: 5,
        height: 5,
        fill: "#D4E7C5",
        stroke: "#B4A7D6",
        strokeWidth: 2,
        userId: "user-1",
        createdAt: new Date(),
      };

      act(() => {
        result.current.addObject(smallObject);
      });

      const object = result.current.objects.get("rect-small");
      expect(object).toBeDefined();
      expect(object?.width).toBe(5);
      expect(object?.height).toBe(5);
    });

    it("should create objects with correct styling", () => {
      const { result } = renderHook(() => useCanvasStore());

      const styledObject: CanvasObject = {
        id: "rect-styled",
        type: "rectangle",
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        fill: "#D4E7C5", // Matcha latte
        stroke: "#B4A7D6", // Lavender purple
        strokeWidth: 2,
        userId: "user-1",
        createdAt: new Date(),
      };

      act(() => {
        result.current.addObject(styledObject);
      });

      const object = result.current.objects.get("rect-styled");
      expect(object?.fill).toBe("#D4E7C5");
      expect(object?.stroke).toBe("#B4A7D6");
      expect(object?.strokeWidth).toBe(2);
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle simultaneous updates (last write wins)", () => {
      const { result } = renderHook(() => useCanvasStore());

      const testObject: CanvasObject = {
        id: "rect-conflict",
        type: "rectangle",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: "#D4E7C5",
        stroke: "#B4A7D6",
        strokeWidth: 2,
        userId: "user-1",
        createdAt: new Date(),
      };

      act(() => {
        result.current.addObject(testObject);
      });

      // Simulate two users updating the same object
      act(() => {
        result.current.updateObject("rect-conflict", { x: 100, y: 100 });
      });

      act(() => {
        result.current.updateObject("rect-conflict", { x: 200, y: 200 });
      });

      const finalObject = result.current.objects.get("rect-conflict");
      // Last update should win
      expect(finalObject?.x).toBe(200);
      expect(finalObject?.y).toBe(200);
    });

    it("should handle rapid object creation", () => {
      const { result } = renderHook(() => useCanvasStore());

      // Rapidly create 10 objects
      const objects: CanvasObject[] = [];
      for (let i = 0; i < 10; i++) {
        objects.push({
          id: `rapid-${i}`,
          type: "rectangle",
          x: i * 50,
          y: i * 50,
          width: 100,
          height: 100,
          fill: "#D4E7C5",
          stroke: "#B4A7D6",
          strokeWidth: 2,
          userId: "user-1",
          createdAt: new Date(),
        });
      }

      act(() => {
        objects.forEach((obj) => result.current.addObject(obj));
      });

      expect(result.current.objects.size).toBe(10);
    });
  });

  describe("Object Persistence", () => {
    it("should maintain object properties after updates", () => {
      const { result } = renderHook(() => useCanvasStore());

      const originalObject: CanvasObject = {
        id: "rect-persist",
        type: "rectangle",
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        fill: "#D4E7C5",
        stroke: "#B4A7D6",
        strokeWidth: 2,
        userId: "user-1",
        createdAt: new Date(),
      };

      act(() => {
        result.current.addObject(originalObject);
      });

      // Update only position
      act(() => {
        result.current.updateObject("rect-persist", { x: 200 });
      });

      const updatedObject = result.current.objects.get("rect-persist");
      expect(updatedObject?.x).toBe(200);
      expect(updatedObject?.y).toBe(100); // Original value
      expect(updatedObject?.width).toBe(100); // Original value
      expect(updatedObject?.fill).toBe("#D4E7C5"); // Original styling
    });
  });
});
