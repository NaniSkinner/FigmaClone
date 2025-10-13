/**
 * Canvas Implementation Tests
 * PR #4: Canvas Implementation
 *
 * Test viewport calculations, zoom functionality, and pan behavior
 */

import { renderHook, act } from "@testing-library/react";
import { useCanvas } from "@/hooks/useCanvas";
import { ZOOM_LIMITS } from "@/lib/constants";

describe("Canvas Viewport Tests", () => {
  describe("useCanvas Hook", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useCanvas());

      expect(result.current.scale).toBe(1);
      expect(result.current.position).toEqual({ x: 0, y: 0 });
      expect(result.current.isDragging).toBe(false);
    });

    it("should zoom in correctly", () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.scale).toBeCloseTo(1.2);
    });

    it("should zoom out correctly", () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.zoomOut();
      });

      expect(result.current.scale).toBeCloseTo(0.8);
    });

    it("should respect maximum zoom limit", () => {
      const { result } = renderHook(() => useCanvas());

      // Zoom in multiple times to exceed max
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.zoomIn();
        }
      });

      expect(result.current.scale).toBeLessThanOrEqual(ZOOM_LIMITS.max);
      expect(result.current.scale).toBe(ZOOM_LIMITS.max);
    });

    it("should respect minimum zoom limit", () => {
      const { result } = renderHook(() => useCanvas());

      // Zoom out multiple times to exceed min
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.zoomOut();
        }
      });

      expect(result.current.scale).toBeGreaterThanOrEqual(ZOOM_LIMITS.min);
      expect(result.current.scale).toBe(ZOOM_LIMITS.min);
    });

    it("should reset zoom to default", () => {
      const { result } = renderHook(() => useCanvas());

      // Zoom in first
      act(() => {
        result.current.zoomIn();
        result.current.zoomIn();
      });

      expect(result.current.scale).not.toBe(1);

      // Reset
      act(() => {
        result.current.resetZoom();
      });

      expect(result.current.scale).toBe(1);
      expect(result.current.position).toEqual({ x: 0, y: 0 });
    });

    it("should handle drag start", () => {
      const { result } = renderHook(() => useCanvas());

      expect(result.current.isDragging).toBe(false);

      act(() => {
        result.current.handleDragStart();
      });

      expect(result.current.isDragging).toBe(true);
    });

    it("should handle drag end", () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.handleDragStart();
      });

      expect(result.current.isDragging).toBe(true);

      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.isDragging).toBe(false);
    });

    it("should update position on drag move", () => {
      const { result } = renderHook(() => useCanvas());

      const mockEvent = {
        target: {
          x: () => 100,
          y: () => 200,
        },
      };

      act(() => {
        result.current.handleDragMove(mockEvent);
      });

      expect(result.current.position).toEqual({ x: 100, y: 200 });
    });
  });

  describe("Viewport Calculations", () => {
    it("should calculate correct zoom percentage", () => {
      const { result } = renderHook(() => useCanvas());

      const getZoomPercentage = (scale: number) => Math.round(scale * 100);

      expect(getZoomPercentage(result.current.scale)).toBe(100);

      act(() => {
        result.current.zoomIn();
      });

      expect(getZoomPercentage(result.current.scale)).toBe(120);

      act(() => {
        result.current.zoomOut();
        result.current.zoomOut();
      });

      // 1.0 * 1.2 * 0.8 * 0.8 = 0.768 = 77%
      expect(getZoomPercentage(result.current.scale)).toBe(77);
    });

    it("should maintain aspect ratio during zoom", () => {
      const { result } = renderHook(() => useCanvas());

      const initialScale = result.current.scale;

      act(() => {
        result.current.zoomIn();
      });

      const zoomRatio = result.current.scale / initialScale;

      // For a proper aspect ratio, the scale should be uniform (not stretched)
      expect(zoomRatio).toBeCloseTo(1.2);
    });

    it("should allow chaining zoom operations", () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.zoomIn();
        result.current.zoomIn();
        result.current.zoomOut();
      });

      // 1 * 1.2 * 1.2 * 0.8 = 1.152
      expect(result.current.scale).toBeCloseTo(1.152, 2);
    });
  });

  describe("Canvas Size and Bounds", () => {
    it("should have canvas size defined", () => {
      const { result } = renderHook(() => useCanvas());

      expect(result.current.canvasSize).toBeDefined();
      expect(result.current.canvasSize.width).toBeGreaterThan(0);
      expect(result.current.canvasSize.height).toBeGreaterThan(0);
    });
  });
});
