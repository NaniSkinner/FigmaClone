/**
 * Manual cleanup utility for stale presence documents
 * Can be called from browser console or added as an admin button
 */

import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PRESENCE_TIMEOUT } from "@/lib/constants";

export async function cleanupStalePresence() {
  console.log("🧹 Starting stale presence cleanup...");

  try {
    const presenceCollection = collection(db, "presence");
    const snapshot = await getDocs(presenceCollection);
    const now = Date.now();
    const staleDocIds: Array<{ id: string; name: string; age: number }> = [];

    console.log(`📊 Found ${snapshot.size} total presence documents`);

    snapshot.forEach((document) => {
      const data = document.data();
      const lastSeenDate = data.lastSeen?.toDate() || new Date(0);
      const timeSinceLastSeen = now - lastSeenDate.getTime();

      if (timeSinceLastSeen > PRESENCE_TIMEOUT) {
        staleDocIds.push({
          id: document.id,
          name: data.name || "Unknown",
          age: Math.round(timeSinceLastSeen / 1000),
        });
      }
    });

    if (staleDocIds.length === 0) {
      console.log("✅ No stale presence documents found!");
      return { success: true, cleaned: 0 };
    }

    console.log(`❌ Found ${staleDocIds.length} stale presence documents:`);
    staleDocIds.forEach((doc) => {
      console.log(`   - ${doc.name} (${doc.id}) - ${doc.age}s old`);
    });

    console.log("🗑️  Deleting stale documents...");
    await Promise.all(
      staleDocIds.map((staleDoc) => deleteDoc(doc(db, "presence", staleDoc.id)))
    );

    console.log(
      `✅ Cleaned up ${staleDocIds.length} stale presence documents!`
    );
    return { success: true, cleaned: staleDocIds.length };
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    return { success: false, error };
  }
}

// Export for use in browser console
if (typeof window !== "undefined") {
  (window as any).cleanupStalePresence = cleanupStalePresence;
}
