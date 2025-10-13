"use client";

import { useEffect, useCallback } from "react";
import {
  collection,
  doc,
  setDoc,
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

  // Subscribe to object changes from Firestore
  useEffect(() => {
    if (!canvasId) return;

    const objectsRef = collection(db, `canvas/${canvasId}/objects`);
    const q = query(objectsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data() as CanvasObject;

        if (change.type === "added") {
          addObject(data);
        } else if (change.type === "modified") {
          updateObject(data.id, data);
        } else if (change.type === "removed") {
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

      const objectRef = doc(db, `canvas/${canvasId}/objects`, object.id);
      await setDoc(objectRef, {
        ...object,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    [canvasId, userId]
  );

  // Update an existing object in Firestore (throttled)
  const updateObjectInFirestore = useCallback(
    throttle(async (id: string, updates: Partial<CanvasObject>) => {
      if (!canvasId) return;

      const objectRef = doc(db, `canvas/${canvasId}/objects`, id);
      await setDoc(
        objectRef,
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }, OBJECT_UPDATE_THROTTLE),
    [canvasId]
  );

  // Delete an object from Firestore
  const deleteObject = useCallback(
    async (id: string) => {
      if (!canvasId) return;

      const objectRef = doc(db, `canvas/${canvasId}/objects`, id);
      await deleteDoc(objectRef);
    },
    [canvasId]
  );

  return {
    createObject,
    updateObjectInFirestore,
    deleteObject,
  };
};
