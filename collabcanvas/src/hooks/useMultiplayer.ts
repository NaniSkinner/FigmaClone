"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { CURSOR_UPDATE_THROTTLE } from "@/lib/constants";

export const useMultiplayer = (
  canvasId: string,
  userId: string | null,
  onUserJoined?: (userName: string) => void,
  onUserLeft?: (userName: string) => void
) => {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserPresence>>(
    new Map()
  );
  const previousUsersRef = useRef<Set<string>>(new Set());
  const lastUpdateTimeRef = useRef<number>(0);

  // Update cursor position in Firestore with proper throttling
  const updateCursorPosition = useCallback(
    (x: number, y: number) => {
      if (!userId) {
        console.log("[Cursor] No userId, skipping update");
        return;
      }

      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

      // Throttle: only update if enough time has passed
      if (timeSinceLastUpdate < CURSOR_UPDATE_THROTTLE) {
        return;
      }

      lastUpdateTimeRef.current = now;

      console.log(`[Cursor] Updating position for user ${userId}:`, { x, y });

      const presenceRef = doc(db, "presence", userId);
      setDoc(
        presenceRef,
        {
          cursor: { x, y },
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      )
        .then(() => {
          console.log(`[Cursor] Successfully updated cursor to (${x}, ${y})`);
        })
        .catch((error) => {
          console.error("[Cursor] Error updating cursor position:", error);
        });
    },
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
      const currentUserIds = new Set<string>();

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Don't include current user in the list
        if (doc.id !== userId) {
          const userPresence: UserPresence = {
            userId: doc.id,
            cursor: data.cursor || { x: 0, y: 0 },
            lastSeen: data.lastSeen?.toDate() || new Date(),
            user: {
              id: doc.id,
              name: data.name || "Anonymous",
              color: data.color || "#999",
            },
          };
          users.set(doc.id, userPresence);
          currentUserIds.add(doc.id);
        }
      });

      // Detect new users (joined)
      if (onUserJoined) {
        currentUserIds.forEach((id) => {
          if (!previousUsersRef.current.has(id)) {
            const user = users.get(id);
            if (user) {
              onUserJoined(user.user.name);
            }
          }
        });
      }

      // Detect users who left
      if (onUserLeft) {
        previousUsersRef.current.forEach((id) => {
          if (!currentUserIds.has(id)) {
            const user = onlineUsers.get(id);
            if (user) {
              onUserLeft(user.user.name);
            }
          }
        });
      }

      // Update ref with current users
      previousUsersRef.current = currentUserIds;

      setOnlineUsers(users);
    });

    return () => unsubscribe();
  }, [userId, onUserJoined, onUserLeft]);

  return {
    onlineUsers,
    updateCursorPosition,
  };
};
