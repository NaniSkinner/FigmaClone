/**
 * Check User Emails - Browser Console Helper
 *
 * Run this in your browser console to check which users have emails
 * and which need to be updated.
 *
 * USAGE:
 * 1. Open your app in browser
 * 2. Open Developer Console (F12)
 * 3. Copy and paste this entire file
 * 4. Run: checkUserEmails()
 */

async function checkUserEmails() {
  console.log("🔍 Checking user emails in Firestore...\n");

  try {
    // Import Firebase functions
    const { db } = await import("/src/lib/firebase.ts");
    const { collection, getDocs } = await import("firebase/firestore");

    // Get all users
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    console.log(`📊 Found ${snapshot.size} total users\n`);

    let hasEmail = 0;
    let missingEmail = 0;
    let anonymous = 0;

    const usersNeedingEmail = [];

    snapshot.docs.forEach((userDoc) => {
      const userData = userDoc.data();

      if (userData.isAnonymous) {
        console.log(`🎭 ${userData.name} - Anonymous (no email needed)`);
        anonymous++;
      } else if (userData.email) {
        console.log(`✅ ${userData.name} - Email: ${userData.email}`);
        hasEmail++;
      } else {
        console.log(`❌ ${userData.name} - MISSING EMAIL`);
        usersNeedingEmail.push({
          id: userData.id,
          name: userData.name,
        });
        missingEmail++;
      }
    });

    console.log("\n📊 Summary:");
    console.log(`   ✅ Users with email: ${hasEmail}`);
    console.log(`   ❌ Users missing email: ${missingEmail}`);
    console.log(`   🎭 Anonymous users: ${anonymous}`);

    if (usersNeedingEmail.length > 0) {
      console.log("\n⚠️  Users that need email update:");
      usersNeedingEmail.forEach((user) => {
        console.log(`   - ${user.name} (${user.id})`);
      });
      console.log("\n💡 Fix: These users need to log out and log back in.");
      console.log(
        "   The system will automatically update their email on next login."
      );
    } else {
      console.log("\n✅ All non-anonymous users have emails!");
    }
  } catch (error) {
    console.error("❌ Error checking users:", error);
  }
}

// Also expose a function to manually trigger email update for current user
async function updateMyEmail() {
  console.log("🔄 Updating email for current user...\n");

  try {
    const { auth, db } = await import("/src/lib/firebase.ts");
    const { doc, updateDoc } = await import("firebase/firestore");

    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("❌ No user logged in");
      return;
    }

    if (currentUser.isAnonymous) {
      console.log("⚠️  You're logged in anonymously, no email to update");
      return;
    }

    if (!currentUser.email) {
      console.error("❌ Current user has no email in Firebase Auth");
      return;
    }

    // Update Firestore user document
    await updateDoc(doc(db, "users", currentUser.uid), {
      email: currentUser.email,
    });

    console.log(`✅ Email updated successfully: ${currentUser.email}`);
    console.log("🔄 Please refresh the page for changes to take effect.");
  } catch (error) {
    console.error("❌ Error updating email:", error);
  }
}

console.log("📋 User Email Checker loaded!");
console.log("📝 Available commands:");
console.log("   checkUserEmails() - Check all users");
console.log("   updateMyEmail()   - Update current user's email");
console.log("\nRun: checkUserEmails()");
