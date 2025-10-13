import { create } from "zustand";
import { CanvasObject, Point } from "@/types";

interface CanvasStore {
  canvasId: string | null;
  scale: number;
  position: Point;
  objects: Map<string, CanvasObject>;
  selectedObjectId: string | null;

  setCanvasId: (id: string) => void;
  setScale: (scale: number) => void;
  setPosition: (position: Point) => void;
  setSelectedObjectId: (id: string | null) => void;

  addObject: (object: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  removeObject: (id: string) => void;
  setObjects: (objects: CanvasObject[]) => void;
  clearObjects: () => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  canvasId: null,
  scale: 1,
  position: { x: 0, y: 0 },
  objects: new Map(),
  selectedObjectId: null,

  setCanvasId: (id) => set({ canvasId: id }),

  setScale: (scale) => set({ scale }),

  setPosition: (position) => set({ position }),

  setSelectedObjectId: (id) => set({ selectedObjectId: id }),

  addObject: (object) =>
    set((state) => {
      const newMap = new Map(state.objects);
      newMap.set(object.id, object);
      return { objects: newMap };
    }),

  updateObject: (id, updates) =>
    set((state) => {
      const existing = state.objects.get(id);
      if (!existing) return state;

      const newMap = new Map(state.objects);
      newMap.set(id, { ...existing, ...updates });
      return { objects: newMap };
    }),

  removeObject: (id) =>
    set((state) => {
      const newMap = new Map(state.objects);
      newMap.delete(id);
      return { objects: newMap };
    }),

  setObjects: (objects) =>
    set({ objects: new Map(objects.map((obj) => [obj.id, obj])) }),

  clearObjects: () => set({ objects: new Map() }),
}));
