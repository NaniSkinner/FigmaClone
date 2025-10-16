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

  // Duplicate functionality
  duplicateObjects: (ids: string[], userId: string) => CanvasObject[];

  // Copy/Paste functionality
  copyObjects: (ids: string[]) => CanvasObject[];
  pasteObjects: (
    copiedObjects: CanvasObject[],
    userId: string,
    offsetX?: number,
    offsetY?: number
  ) => CanvasObject[];
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

  // Duplicate selected objects with 10px offset
  duplicateObjects: (ids: string[], userId: string): CanvasObject[] => {
    const state = useCanvasStore.getState() as CanvasStore;
    const duplicates: CanvasObject[] = [];

    // Get all objects to duplicate, sorted by zIndex to maintain order
    const objectsToDuplicate = Array.from(ids)
      .map((id) => state.objects.get(id))
      .filter((obj): obj is CanvasObject => obj !== undefined)
      .sort((a, b) => a.zIndex - b.zIndex);

    objectsToDuplicate.forEach((obj) => {
      // Generate new ID
      const newId = crypto.randomUUID();
      const newZIndex = state.getNextZIndex();

      // Clone object with offset and new properties
      const duplicate: CanvasObject = {
        ...obj,
        id: newId,
        userId,
        zIndex: newZIndex,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CanvasObject;

      // Apply 10px offset based on object type
      if (duplicate.type === "rectangle") {
        duplicate.x += 10;
        duplicate.y += 10;
      } else if (duplicate.type === "circle") {
        duplicate.x += 10;
        duplicate.y += 10;
      } else if (duplicate.type === "text") {
        duplicate.x += 10;
        duplicate.y += 10;
      } else if (duplicate.type === "line") {
        // Offset both points of the line
        duplicate.points = [
          duplicate.points[0] + 10,
          duplicate.points[1] + 10,
          duplicate.points[2] + 10,
          duplicate.points[3] + 10,
        ];
      }

      duplicates.push(duplicate);

      // Add to local state
      set((state) => {
        const newMap = new Map(state.objects);
        newMap.set(newId, duplicate);
        return { objects: newMap };
      });
    });

    return duplicates;
  },

  // Copy selected objects (returns copies for clipboard)
  copyObjects: (ids: string[]): CanvasObject[] => {
    const state = useCanvasStore.getState() as CanvasStore;
    const copies: CanvasObject[] = [];

    ids.forEach((id) => {
      const obj = state.objects.get(id);
      if (obj) {
        // Create a deep copy of the object
        copies.push(JSON.parse(JSON.stringify(obj)));
      }
    });

    return copies;
  },

  // Paste objects from clipboard with offset
  pasteObjects: (
    copiedObjects: CanvasObject[],
    userId: string,
    offsetX: number = 20,
    offsetY: number = 20
  ): CanvasObject[] => {
    const state = useCanvasStore.getState() as CanvasStore;
    const pastedObjects: CanvasObject[] = [];

    // Sort by zIndex to maintain relative order
    const sortedCopies = [...copiedObjects].sort((a, b) => a.zIndex - b.zIndex);

    sortedCopies.forEach((obj) => {
      // Generate new ID and zIndex
      const newId = crypto.randomUUID();
      const newZIndex = state.getNextZIndex();

      // Clone object with new properties
      const pasted: CanvasObject = {
        ...obj,
        id: newId,
        userId,
        zIndex: newZIndex,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CanvasObject;

      // Apply offset based on object type
      if (pasted.type === "rectangle") {
        pasted.x += offsetX;
        pasted.y += offsetY;
      } else if (pasted.type === "circle") {
        pasted.x += offsetX;
        pasted.y += offsetY;
      } else if (pasted.type === "text") {
        pasted.x += offsetX;
        pasted.y += offsetY;
      } else if (pasted.type === "line") {
        // Offset both points of the line
        pasted.points = [
          pasted.points[0] + offsetX,
          pasted.points[1] + offsetY,
          pasted.points[2] + offsetX,
          pasted.points[3] + offsetY,
        ];
      }

      pastedObjects.push(pasted);

      // Add to local state
      set((state) => {
        const newMap = new Map(state.objects);
        newMap.set(newId, pasted);
        return { objects: newMap };
      });
    });

    return pastedObjects;
  },
}));
