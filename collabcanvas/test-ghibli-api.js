/**
 * Quick API Test Script for Ghibli Transformation
 *
 * Usage:
 *   1. Make sure dev server is running: npm run dev
 *   2. Replace TEST_IMAGE_URL with your Firebase Storage URL
 *   3. Run: node test-ghibli-api.js
 */

// For testing, you can use any publicly accessible image URL
// Option 1: Use a sample test image (landscape photo)
const TEST_IMAGE_URL =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800";

// Option 2: Or replace with your own Firebase Storage URL
// const TEST_IMAGE_URL = "YOUR_FIREBASE_STORAGE_IMAGE_URL_HERE";

const API_URL = "http://localhost:3000/api/ai/ghibli";

async function testGhibliAPI(style) {
  console.log(`\n🎨 Testing ${style} style...`);
  console.log("━".repeat(60));

  const startTime = Date.now();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: TEST_IMAGE_URL,
        style: style,
      }),
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (data.success) {
      console.log("✅ SUCCESS!");
      console.log(`   Style: ${data.style}`);
      console.log(`   Cost: $${data.cost.toFixed(4)}`);
      console.log(`   API Duration: ${(data.duration / 1000).toFixed(1)}s`);
      console.log(`   Total Duration: ${(duration / 1000).toFixed(1)}s`);
      console.log(
        `   Generated URL: ${data.generatedImageUrl?.substring(0, 60)}...`
      );
      console.log(
        `   Description Length: ${data.description?.length || 0} chars`
      );
    } else {
      console.log("❌ FAILED!");
      console.log(`   Error: ${data.error}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
    }

    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log("❌ REQUEST FAILED!");
    console.log(`   Error: ${error.message}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
    return null;
  }
}

async function runAllTests() {
  console.log("\n" + "═".repeat(60));
  console.log("  GHIBLI AI TRANSFORMATION API - TEST SUITE");
  console.log("═".repeat(60));

  if (TEST_IMAGE_URL === "YOUR_FIREBASE_STORAGE_IMAGE_URL_HERE") {
    console.log("\n⚠️  Please update TEST_IMAGE_URL in the script first!");
    console.log(
      "   Add a Firebase Storage URL for an image you want to test.\n"
    );
    return;
  }

  const styles = ["ghibli", "spirited_away", "totoro", "howls"];
  const results = [];
  let totalCost = 0;

  for (const style of styles) {
    const result = await testGhibliAPI(style);
    results.push({
      style,
      success: result?.success || false,
      cost: result?.cost || 0,
    });
    if (result?.cost) {
      totalCost += result.cost;
    }

    // Wait 2 seconds between tests to avoid rate limits
    if (style !== styles[styles.length - 1]) {
      console.log("\n⏳ Waiting 2 seconds before next test...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("  TEST SUMMARY");
  console.log("═".repeat(60));

  results.forEach((result) => {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(
      `${status}  ${result.style.padEnd(15)}  Cost: $${result.cost.toFixed(4)}`
    );
  });

  const passCount = results.filter((r) => r.success).length;
  console.log("\n" + "─".repeat(60));
  console.log(`Tests Passed: ${passCount}/${results.length}`);
  console.log(`Total Cost: $${totalCost.toFixed(4)}`);
  console.log("═".repeat(60) + "\n");
}

// Run tests
runAllTests().catch((error) => {
  console.error("\n❌ Test suite failed:", error);
  process.exit(1);
});
