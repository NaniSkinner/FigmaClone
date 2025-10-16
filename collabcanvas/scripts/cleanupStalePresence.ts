/**
 * Manual Cleanup Script for Stale Presence Documents
 *
 * This script removes all presence documents older than 30 seconds from Firestore.
 * Useful for cleaning up orphaned presence data when users are deleted from Auth.
 *
 * Usage:
 * npm install --save-dev ts-node
 * npx ts-node scripts/cleanupStalePresence.ts
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

// Firebase configuration - same as your app
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const PRESENCE_TIMEOUT = 30000; // 30 seconds

async function cleanupStalePresence() {
  console.log("🧹 Starting stale presence cleanup...");

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    // Fetch all presence documents
    const presenceCollection = collection(db, "presence");
    const snapshot = await getDocs(presenceCollection);
    const now = Date.now();
    const staleDocuments: Array<{ id: string; name: string; lastSeen: Date }> =
      [];

    console.log(`📊 Found ${snapshot.size} total presence documents`);

    // Identify stale documents
    snapshot.forEach((document) => {
      const data = document.data();
      const lastSeenDate = data.lastSeen?.toDate() || new Date(0);
      const timeSinceLastSeen = now - lastSeenDate.getTime();

      if (timeSinceLastSeen > PRESENCE_TIMEOUT) {
        staleDocuments.push({
          id: document.id,
          name: data.name || "Unknown",
          lastSeen: lastSeenDate,
        });
      }
    });

    // Display stale documents
    if (staleDocuments.length === 0) {
      console.log("✅ No stale presence documents found. All clean!");
      return;
    }

    console.log(
      `\n❌ Found ${staleDocuments.length} stale presence documents:`
    );
    staleDocuments.forEach((doc) => {
      const ageInSeconds = Math.round((now - doc.lastSeen.getTime()) / 1000);
      console.log(
        `   - ${doc.name} (${doc.id}) - last seen ${ageInSeconds}s ago`
      );
    });

    // Delete stale documents
    console.log("\n🗑️  Deleting stale presence documents...");
    await Promise.all(
      staleDocuments.map((staleDoc) =>
        deleteDoc(doc(db, "presence", staleDoc.id))
      )
    );

    console.log(
      `✅ Successfully deleted ${staleDocuments.length} stale presence documents!`
    );
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  }
}

// Run the cleanup
cleanupStalePresence()
  .then(() => {
    console.log("\n✨ Cleanup completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Cleanup failed:", error);
    process.exit(1);
  });
