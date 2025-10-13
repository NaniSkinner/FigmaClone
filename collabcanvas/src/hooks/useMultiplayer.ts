"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserPresence } from "@/types";
import { throttle } from "@/lib/utils";
import { CURSOR_UPDATE_THROTTLE } from "@/lib/constants";

export const useMultiplayer = (canvasId: string, userId: string | null) => {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserPresence>>(
    new Map()
  );

  // Update cursor position in Firestore
  const updateCursorPosition = useCallback(
    throttle((x: number, y: number) => {
      if (!userId) return;

      const presenceRef = doc(db, "presence", userId);
      setDoc(
        presenceRef,
        {
          cursor: { x, y },
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      );
    }, CURSOR_UPDATE_THROTTLE),
    [userId]
  );

  // Set user as present when component mounts
  useEffect(() => {
    if (!userId) return;

    const presenceRef = doc(db, "presence", userId);

    // Get user data from users collection and set presence
    const initializePresence = async () => {
      try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await import("firebase/firestore").then(({ getDoc }) =>
          getDoc(userDocRef)
        );

        const userData = userDoc.exists() ? userDoc.data() : null;

        // Set initial presence with user info
        await setDoc(
          presenceRef,
          {
            userId,
            lastSeen: serverTimestamp(),
            cursor: { x: 0, y: 0 },
            name: userData?.name || "Anonymous",
            color: userData?.color || "#999",
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Error initializing presence:", err);
      }
    };

    initializePresence();

    // Update lastSeen periodically to show user is still active
    const interval = setInterval(() => {
      setDoc(
        presenceRef,
        {
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      );
    }, 10000); // Update every 10 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      deleteDoc(presenceRef).catch((err) =>
        console.error("Error removing presence:", err)
      );
    };
  }, [userId]);

  // Listen to other users' presence
  useEffect(() => {
    if (!userId) return;

    const presenceQuery = query(collection(db, "presence"));

    const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
      const users = new Map<string, UserPresence>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Don't include current user in the list
        if (doc.id !== userId) {
          users.set(doc.id, {
            userId: doc.id,
            cursor: data.cursor || { x: 0, y: 0 },
            lastSeen: data.lastSeen?.toDate() || new Date(),
            user: {
              id: doc.id,
              name: data.name || "Anonymous",
              color: data.color || "#999",
            },
          });
        }
      });

      setOnlineUsers(users);
    });

    return () => unsubscribe();
  }, [userId]);

  return {
    onlineUsers,
    updateCursorPosition,
  };
};
