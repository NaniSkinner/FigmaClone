"use client";

import { useRef, useCallback } from "react";
import {
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  LOCK_SELECTION_TTL_SEC,
  LOCK_EDIT_TTL_SEC,
  LOCK_RENEW_INTERVAL_MS,
} from "@/lib/constants";

interface User {
  id: string;
  name: string;
  color?: string;
}

export function useObjectLock(canvasId: string, user: User | null) {
  const renewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentLockObjectIdRef = useRef<string | null>(null);

  const ref = useCallback(
    (id: string) => doc(db, `canvas/${canvasId}/objects`, id),
    [canvasId]
  );

  const expiryFromNow = (sec: number): Timestamp => {
    const date = new Date(Date.now() + sec * 1000);
    return Timestamp.fromDate(date);
  };

  // Attempt to acquire a lock; returns true if acquired
  const acquireLock = useCallback(
    async (objectId: string, mode: "select" | "edit"): Promise<boolean> => {
      if (!canvasId || !user) {
        console.log("[Lock] Cannot acquire: no canvasId or user");
        return false;
      }

      const ttl = mode === "edit" ? LOCK_EDIT_TTL_SEC : LOCK_SELECTION_TTL_SEC;
      const expiresAt = expiryFromNow(ttl);

      console.log(`[Lock] Attempting to acquire ${mode} lock for object ${objectId}`);

      try {
        const ok = await runTransaction(db, async (tx) => {
          const snap = await tx.get(ref(objectId));
          if (!snap.exists()) {
            console.log("[Lock] Object does not exist");
            return false;
          }

          const data = snap.data() as any;

          const hasLock = data?.lock && data.lock.userId && data.lock.expiresAt;
          const now = new Date();
          const isExpired =
            !hasLock ||
            (data.lock.expiresAt instanceof Timestamp
              ? data.lock.expiresAt.toDate() <= now
              : new Date(data.lock.expiresAt) <= now);
          const heldByMe =
            hasLock &&
            data.lock.userId === user.id &&
            (data.lock.expiresAt instanceof Timestamp
              ? data.lock.expiresAt.toDate() > now
              : new Date(data.lock.expiresAt) > now);

          // Can acquire if: no lock, expired, or already held by me
          if (!hasLock || isExpired || heldByMe) {
            tx.set(
              ref(objectId),
              {
                lock: {
                  userId: user.id,
                  userName: user.name,
                  userColor: user.color || "#999",
                  acquiredAt: serverTimestamp(),
                  expiresAt: expiresAt,
                },
              },
              { merge: true }
            );
            console.log(`[Lock] Successfully acquired ${mode} lock`);
            return true;
          }

          console.log(
            `[Lock] Failed to acquire - lock held by ${data.lock.userId}`
          );
          return false;
        });

        if (ok && mode === "edit") {
          // Start renew loop during active edit
          stopRenew();
          currentLockObjectIdRef.current = objectId;
          renewTimerRef.current = setInterval(() => {
            extendLock(objectId);
          }, LOCK_RENEW_INTERVAL_MS);
          console.log(`[Lock] Started auto-renewal for object ${objectId}`);
        }

        return ok;
      } catch (error) {
        console.error("[Lock] Error acquiring lock:", error);
        return false;
      }
    },
    [canvasId, user, ref, expiryFromNow]
  );

  const extendLock = useCallback(
    async (objectId: string) => {
      if (!canvasId || !user) return;

      const expiresAt = expiryFromNow(LOCK_EDIT_TTL_SEC);

      try {
        await setDoc(
          ref(objectId),
          {
            lock: {
              userId: user.id,
              userName: user.name,
              userColor: user.color || "#999",
              acquiredAt: serverTimestamp(),
              expiresAt: expiresAt,
            },
          },
          { merge: true }
        );
        console.log(`[Lock] Extended lock for object ${objectId}`);
      } catch (error) {
        console.error("[Lock] Error extending lock:", error);
      }
    },
    [canvasId, user, ref, expiryFromNow]
  );

  const releaseLock = useCallback(
    async (objectId: string) => {
      if (!canvasId || !user) return;

      stopRenew();
      console.log(`[Lock] Releasing lock for object ${objectId}`);

      try {
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(ref(objectId));
          if (!snap.exists()) return;

          const data = snap.data() as any;

          // Only release if I hold the lock
          if (data?.lock?.userId === user.id) {
            const updated = { ...data };
            delete updated.lock;
            tx.set(ref(objectId), updated);
            console.log(`[Lock] Successfully released lock`);
          }
        });
      } catch (error) {
        console.error("[Lock] Error releasing lock:", error);
      }
    },
    [canvasId, user, ref]
  );

  const stopRenew = useCallback(() => {
    if (renewTimerRef.current) {
      clearInterval(renewTimerRef.current);
      renewTimerRef.current = null;
      currentLockObjectIdRef.current = null;
      console.log("[Lock] Stopped auto-renewal");
    }
  }, []);

  return { acquireLock, extendLock, releaseLock, stopRenew };
}

