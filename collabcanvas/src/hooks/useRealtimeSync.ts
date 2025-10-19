"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CanvasObject } from "@/types";
import { useCanvasStore } from "@/store";
import { throttle } from "@/lib/utils";
import { OBJECT_UPDATE_THROTTLE } from "@/lib/constants";

export const useRealtimeSync = (canvasId: string, userId: string | null) => {
  const { addObject, updateObject, removeObject, setObjects } =
    useCanvasStore();

  // Track objects being deleted to prevent re-adding from snapshot
  const deletingObjects = useRef<Set<string>>(new Set());

  // Subscribe to object changes from Firestore
  useEffect(() => {
    if (!canvasId) return;

    const objectsRef = collection(db, `canvas/${canvasId}/objects`);
    const q = query(objectsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data() as CanvasObject;

        // Handle legacy objects without zIndex (assign a default value)
        if (data.zIndex === undefined) {
          data.zIndex = 0;
        }

        if (change.type === "added") {
          // Don't re-add objects that are being deleted
          if (!deletingObjects.current.has(data.id)) {
            addObject(data);
          }
        } else if (change.type === "modified") {
          // Don't update objects that are being deleted
          if (!deletingObjects.current.has(data.id)) {
            updateObject(data.id, data);
          }
        } else if (change.type === "removed") {
          // Remove from deletingObjects set once confirmed deleted
          deletingObjects.current.delete(data.id);
          removeObject(data.id);
        }
      });
    });

    return () => unsubscribe();
  }, [canvasId, addObject, updateObject, removeObject]);

  // Create a new object in Firestore
  const createObject = useCallback(
    async (object: CanvasObject) => {
      if (!canvasId || !userId) return;

      const { addPendingObject, removePendingObject, addObject, removeObject } =
        useCanvasStore.getState();

      try {
        // Mark as pending
        addPendingObject(object.id);

        // Add to local state immediately for responsive UI
        addObject(object);

        // Write to Firestore
        const objectRef = doc(db, `canvas/${canvasId}/objects`, object.id);
        await setDoc(objectRef, {
          ...object,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        console.log(`[Sync] Object ${object.id} created in Firestore`);

        // Remove from pending after successful write
        removePendingObject(object.id);
      } catch (error) {
        console.error(`[Sync] Failed to create object ${object.id}:`, error);

        // Rollback: remove from local state and pending
        removePendingObject(object.id);
        removeObject(object.id);

        throw error;
      }
    },
    [canvasId, userId]
  );

  // Update an existing object in Firestore (throttled)
  const updateObjectInFirestore = useCallback(
    throttle(async (id: string, updates: Partial<CanvasObject>) => {
      if (!canvasId) return;

      const { isPending } = useCanvasStore.getState();

      // Skip updates on pending objects
      if (isPending(id)) {
        console.log(`[Sync] Skipping update for pending object ${id}`);
        return;
      }

      try {
        const objectRef = doc(db, `canvas/${canvasId}/objects`, id);

        // Use updateDoc instead of setDoc to avoid create validation
        await updateDoc(objectRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error(`[Sync] Failed to update object ${id}:`, error);
        // Don't throw - updates are throttled and can fail gracefully
      }
    }, OBJECT_UPDATE_THROTTLE),
    [canvasId]
  );

  // Delete an object from Firestore
  const deleteObject = useCallback(
    async (id: string) => {
      if (!canvasId) return;

      // Mark as deleting to prevent re-adding from snapshot
      deletingObjects.current.add(id);

      // Remove from local state immediately for responsive UX
      removeObject(id);

      try {
        const objectRef = doc(db, `canvas/${canvasId}/objects`, id);

        // First, try to remove any lock on the object to ensure deletion succeeds
        // This handles edge cases where locks might prevent deletion
        try {
          await setDoc(objectRef, { lock: null }, { merge: true });
        } catch (lockError) {
          console.warn(
            "Could not release lock before deletion (non-fatal):",
            lockError
          );
          // Continue with deletion anyway - Firestore rules should allow deletion by lock owner
        }

        // Now delete the object
        await deleteDoc(objectRef);
        console.log(`Successfully deleted object ${id}`);
      } catch (error) {
        console.error("Error deleting object:", error);
        // Remove from deletingObjects set on error
        deletingObjects.current.delete(id);
        // Note: object already removed from local state, Firestore sync will fix if needed
      }
    },
    [canvasId, removeObject]
  );

  return {
    createObject,
    updateObjectInFirestore,
    deleteObject,
  };
};
