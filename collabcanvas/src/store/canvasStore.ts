import { create } from "zustand";
import { CanvasObject, Point, SelectionBox } from "@/types";

interface CanvasStore {
  canvasId: string | null;
  scale: number;
  position: Point;
  objects: Map<string, CanvasObject>;

  // Multi-selection support
  selectedObjectIds: Set<string>;
  selectionBox: SelectionBox | null;
  isSelecting: boolean;

  setCanvasId: (id: string) => void;
  setScale: (scale: number) => void;
  setPosition: (position: Point) => void;

  // Selection management
  setSelectedObjectIds: (ids: Set<string>) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;

  // Selection box management
  setSelectionBox: (box: SelectionBox | null) => void;
  setIsSelecting: (isSelecting: boolean) => void;

  addObject: (object: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  removeObject: (id: string) => void;
  setObjects: (objects: CanvasObject[]) => void;
  clearObjects: () => void;

  // Z-index management
  getNextZIndex: () => number;
  getMaxZIndex: () => number;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  canvasId: null,
  scale: 1,
  position: { x: 0, y: 0 },
  objects: new Map(),
  selectedObjectIds: new Set(),
  selectionBox: null,
  isSelecting: false,

  setCanvasId: (id) => set({ canvasId: id }),

  setScale: (scale) => set({ scale }),

  setPosition: (position) => set({ position }),

  // Selection management
  setSelectedObjectIds: (ids) => set({ selectedObjectIds: new Set(ids) }),

  addToSelection: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedObjectIds);
      newSet.add(id);
      return { selectedObjectIds: newSet };
    }),

  removeFromSelection: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedObjectIds);
      newSet.delete(id);
      return { selectedObjectIds: newSet };
    }),

  clearSelection: () => set({ selectedObjectIds: new Set() }),

  toggleSelection: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedObjectIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedObjectIds: newSet };
    }),

  selectAll: () =>
    set((state) => ({
      selectedObjectIds: new Set(state.objects.keys()),
    })),

  // Selection box management
  setSelectionBox: (box) => set({ selectionBox: box }),

  setIsSelecting: (isSelecting) => set({ isSelecting }),

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
      newMap.set(id, { ...existing, ...updates } as CanvasObject);
      return { objects: newMap };
    }),

  removeObject: (id) =>
    set((state) => {
      const newMap = new Map(state.objects);
      newMap.delete(id);
      // Also remove from selection if present
      const newSelection = new Set(state.selectedObjectIds);
      newSelection.delete(id);
      return { objects: newMap, selectedObjectIds: newSelection };
    }),

  setObjects: (objects) =>
    set({ objects: new Map(objects.map((obj) => [obj.id, obj])) }),

  clearObjects: () => set({ objects: new Map(), selectedObjectIds: new Set() }),

  // Z-index management
  getMaxZIndex: () => {
    const state = useCanvasStore.getState() as CanvasStore;
    let maxZ = 0;
    state.objects.forEach((obj: CanvasObject) => {
      if (obj.zIndex > maxZ) {
        maxZ = obj.zIndex;
      }
    });
    return maxZ;
  },

  getNextZIndex: (): number => {
    const state = useCanvasStore.getState() as CanvasStore;
    return state.getMaxZIndex() + 1;
  },
}));
