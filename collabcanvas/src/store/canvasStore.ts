import { create } from "zustand";
import { CanvasObject, Point, SelectionBox } from "@/types";
import { AIOperation, UndoOperation } from "@/types/ai";

interface CanvasStore {
  canvasId: string | null;
  scale: number;
  position: Point;
  objects: Map<string, CanvasObject>;

  // Multi-selection support
  selectedObjectIds: Set<string>;
  selectionBox: SelectionBox | null;
  isSelecting: boolean;

  // Pending objects tracking (for real-time sync)
  pendingObjects: Set<string>;

  // AI-specific state
  lastAICommand: string | null;
  aiOperationHistory: AIOperation[];
  isAIProcessing: boolean;

  // Undo/Redo state
  undoStack: UndoOperation[];
  redoStack: UndoOperation[];
  maxUndoSize: number;

  // Project management state
  currentProjectId: string | null;
  projectName: string;
  isDirty: boolean;

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

  // Pending objects management
  addPendingObject: (id: string) => void;
  removePendingObject: (id: string) => void;
  isPending: (id: string) => boolean;

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

  // AI-specific methods
  setLastAICommand: (command: string | null) => void;
  setIsAIProcessing: (isProcessing: boolean) => void;
  storeAIOperation: (operation: AIOperation) => void;
  batchCreateObjects: (objects: CanvasObject[]) => void;
  findObjectsByType: (type: string) => CanvasObject[];
  getObjectsByDescription: (desc: string) => CanvasObject[];

  // Undo/Redo methods
  pushToUndoStack: (operation: UndoOperation) => void;
  undo: () => UndoOperation | null;
  redo: () => UndoOperation | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearUndoHistory: () => void;

  // Project management methods
  setCurrentProjectId: (projectId: string | null, name: string) => void;
  clearCanvas: () => void;
  markDirty: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  canvasId: null,
  scale: 1,
  position: { x: 0, y: 0 },
  objects: new Map(),
  selectedObjectIds: new Set(),
  selectionBox: null,
  isSelecting: false,
  pendingObjects: new Set(),

  // AI state
  lastAICommand: null,
  aiOperationHistory: [],
  isAIProcessing: false,

  // Undo/Redo state
  undoStack: [],
  redoStack: [],
  maxUndoSize: 50,

  // Project management state
  currentProjectId: null,
  projectName: "",
  isDirty: false,

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

  // Pending objects management
  addPendingObject: (id) =>
    set((state) => {
      const newSet = new Set(state.pendingObjects);
      newSet.add(id);
      return { pendingObjects: newSet };
    }),

  removePendingObject: (id) =>
    set((state) => {
      const newSet = new Set(state.pendingObjects);
      newSet.delete(id);
      return { pendingObjects: newSet };
    }),

  isPending: (id) => get().pendingObjects.has(id),

  addObject: (object) =>
    set((state) => {
      const newMap = new Map(state.objects);
      newMap.set(object.id, object);
      return { objects: newMap, isDirty: true };
    }),

  updateObject: (id, updates) =>
    set((state) => {
      const existing = state.objects.get(id);
      if (!existing) return state;

      const newMap = new Map(state.objects);
      newMap.set(id, { ...existing, ...updates } as CanvasObject);
      return { objects: newMap, isDirty: true };
    }),

  removeObject: (id) =>
    set((state) => {
      const newMap = new Map(state.objects);
      newMap.delete(id);
      // Also remove from selection if present
      const newSelection = new Set(state.selectedObjectIds);
      newSelection.delete(id);
      return {
        objects: newMap,
        selectedObjectIds: newSelection,
        isDirty: true,
      };
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

  // AI-specific methods
  setLastAICommand: (command) => set({ lastAICommand: command }),

  setIsAIProcessing: (isProcessing) => set({ isAIProcessing: isProcessing }),

  storeAIOperation: (operation) =>
    set((state) => ({
      aiOperationHistory: [...state.aiOperationHistory, operation].slice(-50), // Keep last 50 operations
    })),

  batchCreateObjects: (objects) =>
    set((state) => {
      const newMap = new Map(state.objects);
      objects.forEach((obj) => {
        newMap.set(obj.id, obj);
      });
      return { objects: newMap };
    }),

  findObjectsByType: (type) => {
    const state = useCanvasStore.getState() as CanvasStore;
    return Array.from(state.objects.values()).filter(
      (obj) => obj.type === type
    );
  },

  getObjectsByDescription: (desc) => {
    const state = useCanvasStore.getState() as CanvasStore;
    const lowerDesc = desc.toLowerCase();

    // Simple text matching for now
    return Array.from(state.objects.values()).filter((obj) => {
      if (obj.type === "text") {
        return obj.text.toLowerCase().includes(lowerDesc);
      }
      return false;
    });
  },

  // Undo/Redo methods
  pushToUndoStack: (operation) =>
    set((state) => {
      const newUndoStack = [...state.undoStack, operation];
      // Limit stack size
      if (newUndoStack.length > state.maxUndoSize) {
        newUndoStack.shift(); // Remove oldest
      }
      // Clear redo stack on new operation
      return { undoStack: newUndoStack, redoStack: [] };
    }),

  undo: () => {
    const state = useCanvasStore.getState() as CanvasStore;
    if (state.undoStack.length === 0) return null;

    const operation = state.undoStack[state.undoStack.length - 1];

    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, operation],
    }));

    return operation;
  },

  redo: () => {
    const state = useCanvasStore.getState() as CanvasStore;
    if (state.redoStack.length === 0) return null;

    const operation = state.redoStack[state.redoStack.length - 1];

    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, operation],
    }));

    return operation;
  },

  canUndo: () => {
    const state = useCanvasStore.getState() as CanvasStore;
    return state.undoStack.length > 0;
  },

  canRedo: () => {
    const state = useCanvasStore.getState() as CanvasStore;
    return state.redoStack.length > 0;
  },

  clearUndoHistory: () => set({ undoStack: [], redoStack: [] }),

  // Project management methods
  setCurrentProjectId: (projectId, name) =>
    set({
      currentProjectId: projectId,
      projectName: name,
    }),

  clearCanvas: () =>
    set({
      objects: new Map(),
      selectedObjectIds: new Set(),
    }),

  markDirty: () => set({ isDirty: true }),
}));
