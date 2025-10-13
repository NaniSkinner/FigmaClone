"use client";

import { useEffect, useState } from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@/types";
import { generateUserColor, generateAnonymousName } from "@/lib/utils";
import { useUserStore } from "@/store";

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser, setCurrentUser } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get or create user document
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

          let userData: User;
          if (userDoc.exists()) {
            userData = userDoc.data() as User;
          } else {
            // Create new user document
            userData = {
              id: firebaseUser.uid,
              name: firebaseUser.isAnonymous
                ? generateAnonymousName()
                : firebaseUser.email?.split("@")[0] || "User",
              color: generateUserColor(firebaseUser.uid),
              isAnonymous: firebaseUser.isAnonymous,
            };

            await setDoc(doc(db, "users", firebaseUser.uid), {
              ...userData,
              createdAt: serverTimestamp(),
            });
          }

          setCurrentUser(userData);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setCurrentUser]);

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return result.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginAnonymously = async () => {
    try {
      setError(null);
      setLoading(true);
      const result = await signInAnonymously(auth);
      return result.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user: currentUser,
    loading,
    error,
    signUp,
    login,
    loginAnonymously,
    logout,
  };
};
