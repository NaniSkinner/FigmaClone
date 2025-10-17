"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/store";
import { CanvasObject } from "@/types";

/**
 * Hook for managing object layer ordering (z-index operations)
 * Provides functions to reorder objects: bring to front, send to back, etc.
 */
export const useLayerManagement = (
  updateObjectInFirestore: (id: string, updates: Partial<CanvasObject>) => void
) => {
  const { objects, selectedObjectIds, getMaxZIndex } = useCanvasStore();

  /**
   * Bring selected object(s) to the very front (highest z-index)
   */
  const bringToFront = useCallback(() => {
    if (selectedObjectIds.size === 0) return;

    const maxZ = getMaxZIndex();
    let newZIndex = maxZ + 1;

    // Sort selected objects by current zIndex to maintain relative order
    const selectedObjects = Array.from(selectedObjectIds)
      .map((id) => objects.get(id))
      .filter((obj) => obj !== undefined)
      .sort((a, b) => (a!.zIndex || 0) - (b!.zIndex || 0));

    // Assign new z-indices starting from maxZ + 1
    selectedObjects.forEach((obj) => {
      if (obj) {
        updateObjectInFirestore(obj.id, { zIndex: newZIndex });
        newZIndex++;
      }
    });
  }, [selectedObjectIds, objects, getMaxZIndex, updateObjectInFirestore]);

  /**
   * Send selected object(s) to the very back (lowest z-index)
   */
  const sendToBack = useCallback(() => {
    if (selectedObjectIds.size === 0) return;

    // Get all non-selected objects
    const nonSelectedObjects = Array.from(objects.values()).filter(
      (obj) => !selectedObjectIds.has(obj.id)
    );

    // Sort selected objects by current zIndex to maintain relative order
    const selectedObjects = Array.from(selectedObjectIds)
      .map((id) => objects.get(id))
      .filter((obj) => obj !== undefined)
      .sort((a, b) => (a!.zIndex || 0) - (b!.zIndex || 0));

    // Assign selected objects z-indices starting from 0
    let newZIndex = 0;
    selectedObjects.forEach((obj) => {
      if (obj) {
        updateObjectInFirestore(obj.id, { zIndex: newZIndex });
        newZIndex++;
      }
    });

    // Shift all non-selected objects up
    nonSelectedObjects.forEach((obj) => {
      updateObjectInFirestore(obj.id, { zIndex: newZIndex });
      newZIndex++;
    });
  }, [selectedObjectIds, objects, updateObjectInFirestore]);

  /**
   * Move selected object(s) forward by one layer
   */
  const bringForward = useCallback(() => {
    if (selectedObjectIds.size === 0) return;

    // Get all objects sorted by zIndex
    const allObjects = Array.from(objects.values()).sort(
      (a, b) => a.zIndex - b.zIndex
    );

    // Create a map of current positions
    const objectPositions = new Map<string, number>();
    allObjects.forEach((obj, index) => {
      objectPositions.set(obj.id, index);
    });

    // For each selected object, try to swap with the object above it
    const selectedIds = Array.from(selectedObjectIds);

    // Process from top to bottom to avoid conflicts
    selectedIds
      .map((id) => ({
        id,
        position: objectPositions.get(id) || 0,
      }))
      .sort((a, b) => b.position - a.position)
      .forEach(({ id, position }) => {
        const nextPosition = position + 1;
        if (nextPosition < allObjects.length) {
          const currentObj = allObjects[position];
          const nextObj = allObjects[nextPosition];

          // Only swap if the next object is not also selected
          if (!selectedObjectIds.has(nextObj.id)) {
            // Swap z-indices
            updateObjectInFirestore(currentObj.id, { zIndex: nextObj.zIndex });
            updateObjectInFirestore(nextObj.id, { zIndex: currentObj.zIndex });

            // Update our local array for subsequent iterations
            allObjects[position] = nextObj;
            allObjects[nextPosition] = currentObj;
            objectPositions.set(nextObj.id, position);
            objectPositions.set(currentObj.id, nextPosition);
          }
        }
      });
  }, [selectedObjectIds, objects, updateObjectInFirestore]);

  /**
   * Move selected object(s) backward by one layer
   */
  const sendBackward = useCallback(() => {
    if (selectedObjectIds.size === 0) return;

    // Get all objects sorted by zIndex
    const allObjects = Array.from(objects.values()).sort(
      (a, b) => a.zIndex - b.zIndex
    );

    // Create a map of current positions
    const objectPositions = new Map<string, number>();
    allObjects.forEach((obj, index) => {
      objectPositions.set(obj.id, index);
    });

    // For each selected object, try to swap with the object below it
    const selectedIds = Array.from(selectedObjectIds);

    // Process from bottom to top to avoid conflicts
    selectedIds
      .map((id) => ({
        id,
        position: objectPositions.get(id) || 0,
      }))
      .sort((a, b) => a.position - b.position)
      .forEach(({ id, position }) => {
        const prevPosition = position - 1;
        if (prevPosition >= 0) {
          const currentObj = allObjects[position];
          const prevObj = allObjects[prevPosition];

          // Only swap if the previous object is not also selected
          if (!selectedObjectIds.has(prevObj.id)) {
            // Swap z-indices
            updateObjectInFirestore(currentObj.id, { zIndex: prevObj.zIndex });
            updateObjectInFirestore(prevObj.id, { zIndex: currentObj.zIndex });

            // Update our local array for subsequent iterations
            allObjects[position] = prevObj;
            allObjects[prevPosition] = currentObj;
            objectPositions.set(prevObj.id, position);
            objectPositions.set(currentObj.id, prevPosition);
          }
        }
      });
  }, [selectedObjectIds, objects, updateObjectInFirestore]);

  return {
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
  };
};
