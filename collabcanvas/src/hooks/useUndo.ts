"use client";

/**
 * useUndo Hook
 *
 * Provides undo/redo functionality with Firestore sync.
 * Integrates with canvas store and realtime sync to ensure
 * undo/redo operations are persisted and synchronized.
 *
 * Reference: aiTasks.md Task 11 - Undo Implementation
 */

import { useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { CanvasObject } from "@/types/canvas";
import { UndoOperation } from "@/types/ai";

interface UseUndoProps {
  onCreateObject?: (object: CanvasObject) => void;
  onUpdateObject?: (id: string, updates: Partial<CanvasObject>) => void;
  onDeleteObject?: (id: string) => void;
}

export function useUndo({
  onCreateObject,
  onUpdateObject,
  onDeleteObject,
}: UseUndoProps = {}) {
  const {
    undo: undoFromStore,
    redo: redoFromStore,
    canUndo: canUndoFromStore,
    canRedo: canRedoFromStore,
    pushToUndoStack,
    objects,
    addObject,
    updateObject,
    removeObject,
  } = useCanvasStore();

  /**
   * Record a create operation for undo
   * @param objectIdsOrObjects - Either object IDs (will look up from store) or actual CanvasObject array
   * @param source - Source of the operation ("ai" or "manual")
   * @param aiOperationId - Optional AI operation ID for grouping
   */
  const recordCreate = useCallback(
    (
      objectIdsOrObjects: string[] | CanvasObject[],
      source: "ai" | "manual" = "manual",
      aiOperationId?: string
    ) => {
      // Determine if we received IDs or actual objects
      let createdObjects: CanvasObject[];

      if (
        objectIdsOrObjects.length > 0 &&
        typeof objectIdsOrObjects[0] === "string"
      ) {
        // We received IDs - look them up from store
        const objectIds = objectIdsOrObjects as string[];
        createdObjects = objectIds
          .map((id) => objects.get(id))
          .filter((obj): obj is CanvasObject => obj !== undefined);
      } else {
        // We received actual objects - use them directly
        createdObjects = objectIdsOrObjects as CanvasObject[];
      }

      if (createdObjects.length === 0) {
        return;
      }

      const operation: UndoOperation = {
        id: crypto.randomUUID(),
        type: "create",
        timestamp: new Date(),
        source,
        aiOperationId,
        affectedObjectIds: createdObjects.map((obj) => obj.id),
        previousState: undefined, // No previous state for create
        newState: createdObjects,
      };

      pushToUndoStack(operation);
    },
    [objects, pushToUndoStack]
  );

  /**
   * Record an update operation for undo
   */
  const recordUpdate = useCallback(
    (
      objectIds: string[],
      previousStates: CanvasObject[],
      source: "ai" | "manual" = "manual",
      aiOperationId?: string
    ) => {
      // Get current state of updated objects
      const newStates = objectIds
        .map((id) => objects.get(id))
        .filter((obj): obj is CanvasObject => obj !== undefined);

      if (newStates.length === 0) {
        return;
      }

      const operation: UndoOperation = {
        id: crypto.randomUUID(),
        type: "update",
        timestamp: new Date(),
        source,
        aiOperationId,
        affectedObjectIds: objectIds,
        previousState: previousStates,
        newState: newStates,
      };

      pushToUndoStack(operation);
    },
    [objects, pushToUndoStack]
  );

  /**
   * Record a delete operation for undo
   */
  const recordDelete = useCallback(
    (
      deletedObjects: CanvasObject[],
      source: "ai" | "manual" = "manual",
      aiOperationId?: string
    ) => {
      const operation: UndoOperation = {
        id: crypto.randomUUID(),
        type: "delete",
        timestamp: new Date(),
        source,
        aiOperationId,
        affectedObjectIds: deletedObjects.map((obj) => obj.id),
        previousState: deletedObjects,
        newState: undefined, // No new state for delete
      };

      pushToUndoStack(operation);
    },
    [pushToUndoStack]
  );

  /**
   * Perform undo operation
   */
  const performUndo = useCallback(() => {
    const operation = undoFromStore();
    if (!operation) {
      return false;
    }

    try {
      if (operation.type === "create") {
        // Undo create = delete objects
        operation.affectedObjectIds.forEach((id) => {
          removeObject(id);
          if (onDeleteObject) {
            onDeleteObject(id);
          }
        });
      } else if (operation.type === "delete") {
        // Undo delete = recreate objects
        operation.previousState?.forEach((obj) => {
          addObject(obj);
          if (onCreateObject) {
            onCreateObject(obj);
          }
        });
      } else if (operation.type === "update") {
        // Undo update = restore previous state
        operation.previousState?.forEach((obj) => {
          updateObject(obj.id, obj);
          if (onUpdateObject) {
            onUpdateObject(obj.id, obj);
          }
        });
      }

      return true;
    } catch (error) {
      console.error("Undo failed:", error);
      return false;
    }
  }, [
    undoFromStore,
    addObject,
    updateObject,
    removeObject,
    onCreateObject,
    onUpdateObject,
    onDeleteObject,
  ]);

  /**
   * Perform redo operation
   */
  const performRedo = useCallback(() => {
    const operation = redoFromStore();
    if (!operation) {
      return false;
    }

    try {
      if (operation.type === "create") {
        // Redo create = recreate objects
        operation.newState?.forEach((obj) => {
          addObject(obj);
          if (onCreateObject) {
            onCreateObject(obj);
          }
        });
      } else if (operation.type === "delete") {
        // Redo delete = delete objects again
        operation.affectedObjectIds.forEach((id) => {
          removeObject(id);
          if (onDeleteObject) {
            onDeleteObject(id);
          }
        });
      } else if (operation.type === "update") {
        // Redo update = apply new state
        operation.newState?.forEach((obj) => {
          updateObject(obj.id, obj);
          if (onUpdateObject) {
            onUpdateObject(obj.id, obj);
          }
        });
      }

      return true;
    } catch (error) {
      console.error("Redo failed:", error);
      return false;
    }
  }, [
    redoFromStore,
    addObject,
    updateObject,
    removeObject,
    onCreateObject,
    onUpdateObject,
    onDeleteObject,
  ]);

  // CRITICAL FIX: Use reactive Zustand selectors instead of function calls
  // This ensures the component re-renders when undo/redo stacks change
  const canUndo = useCanvasStore((state) => state.undoStack.length > 0);
  const canRedo = useCanvasStore((state) => state.redoStack.length > 0);

  return {
    // Actions
    undo: performUndo,
    redo: performRedo,
    recordCreate,
    recordUpdate,
    recordDelete,

    // State (now reactive!)
    canUndo,
    canRedo,
  };
}
