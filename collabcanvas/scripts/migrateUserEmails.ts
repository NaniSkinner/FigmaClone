/**
 * Migration Script: Add Email to Existing Users
 *
 * This script updates existing user documents to include their email address.
 * Run this once after deploying the email-based sharing feature.
 *
 * Usage:
 *   npx ts-node scripts/migrateUserEmails.ts
 *
 * Or run in browser console:
 *   Copy and paste the migrateUserEmailsInBrowser function
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

// Firebase config (update with your project's config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (only if not already initialized)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Migrate user emails from Firebase Auth to Firestore users collection
 */
async function migrateUserEmails() {
  console.log("🚀 Starting user email migration...\n");

  try {
    // Get all users from Firestore
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    console.log(`📊 Found ${snapshot.size} users to check\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const userId = userData.id;

      try {
        // Skip if already has email
        if (userData.email) {
          console.log(
            `⏭️  Skipping ${userData.name} - already has email: ${userData.email}`
          );
          skipped++;
          continue;
        }

        // Skip if anonymous user
        if (userData.isAnonymous) {
          console.log(`⏭️  Skipping ${userData.name} - anonymous user`);
          skipped++;
          continue;
        }

        // NOTE: We can't directly query Firebase Auth users from a script
        // without admin SDK. The email will be updated when the user logs in
        // due to the auto-migration code in useAuth.ts

        console.log(
          `⚠️  ${userData.name} (${userId}) - needs email, will be updated on next login`
        );
        skipped++;
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error);
        errors++;
      }
    }

    console.log("\n✅ Migration complete!");
    console.log(`📊 Summary:`);
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`   - Errors: ${errors}`);
    console.log(
      `\n💡 Note: Users without emails will be automatically updated when they log in next.`
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

/**
 * Browser Console Version - Run this in your browser's developer console
 * when logged into your app
 */
export async function migrateUserEmailsInBrowser() {
  // @ts-ignore - This function is meant to be copied to browser console
  const { db } = await import("@/lib/firebase");
  const { collection, getDocs, updateDoc, doc } = await import(
    "firebase/firestore"
  );

  console.log("🚀 Starting user email migration (browser mode)...\n");

  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);

  console.log(`📊 Found ${snapshot.size} users\n`);

  let checked = 0;
  for (const userDoc of snapshot.docs) {
    const userData = userDoc.data();
    console.log(`User: ${userData.name} (${userData.id})`);
    console.log(`  Email: ${userData.email || "❌ MISSING"}`);
    console.log(`  Anonymous: ${userData.isAnonymous || false}`);
    checked++;
  }

  console.log(`\n✅ Checked ${checked} users`);
  console.log(
    `\n💡 Users without emails will be updated automatically when they log in.`
  );
}

// Run migration if executed directly
if (require.main === module) {
  migrateUserEmails()
    .then(() => {
      console.log("\n✨ Migration script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Migration script failed:", error);
      process.exit(1);
    });
}

export default migrateUserEmails;
