#!/usr/bin/env node

/**
 * Asset Validation Script
 *
 * Validates decorative items JSON and checks that all referenced SVG files exist
 * Run: node scripts/validateAssets.js
 */

const fs = require("fs");
const path = require("path");

const DECORATIVE_ITEMS_JSON = path.join(
  __dirname,
  "../public/decorative-items/decorative-items.json"
);
const PUBLIC_DIR = path.join(__dirname, "../public");

console.log("🔍 Validating Decorative Assets...\n");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

let errors = 0;
let warnings = 0;

// Check if JSON file exists
if (!fs.existsSync(DECORATIVE_ITEMS_JSON)) {
  console.error(
    `${colors.red}✗ decorative-items.json not found!${colors.reset}`
  );
  process.exit(1);
}

// Read and parse JSON
let data;
try {
  const jsonContent = fs.readFileSync(DECORATIVE_ITEMS_JSON, "utf8");
  data = JSON.parse(jsonContent);
  console.log(`${colors.green}✓ JSON file is valid${colors.reset}`);
} catch (error) {
  console.error(
    `${colors.red}✗ JSON parsing error: ${error.message}${colors.reset}`
  );
  process.exit(1);
}

// Validate structure
console.log("\n📋 Validating structure...");

if (!data.version) {
  console.warn(`${colors.yellow}⚠ Missing version field${colors.reset}`);
  warnings++;
}

if (!data.categories || !Array.isArray(data.categories)) {
  console.error(
    `${colors.red}✗ Missing or invalid categories array${colors.reset}`
  );
  errors++;
} else {
  console.log(
    `${colors.green}✓ Found ${data.categories.length} categories${colors.reset}`
  );
}

if (!data.items || !Array.isArray(data.items)) {
  console.error(`${colors.red}✗ Missing or invalid items array${colors.reset}`);
  errors++;
} else {
  console.log(
    `${colors.green}✓ Found ${data.items.length} items${colors.reset}`
  );
}

// Validate categories
console.log("\n📁 Validating categories...");

const categoryIds = new Set();
data.categories.forEach((category, index) => {
  const prefix = `  Category #${index + 1} (${category.id || "unnamed"})`;

  if (!category.id) {
    console.error(`${colors.red}${prefix}: Missing id${colors.reset}`);
    errors++;
  } else if (categoryIds.has(category.id)) {
    console.error(
      `${colors.red}${prefix}: Duplicate category id${colors.reset}`
    );
    errors++;
  } else {
    categoryIds.add(category.id);
  }

  if (!category.name) {
    console.error(`${colors.red}${prefix}: Missing name${colors.reset}`);
    errors++;
  }

  if (!category.icon) {
    console.warn(`${colors.yellow}${prefix}: Missing icon${colors.reset}`);
    warnings++;
  }

  if (!category.color) {
    console.warn(`${colors.yellow}${prefix}: Missing color${colors.reset}`);
    warnings++;
  }
});

console.log(`${colors.green}✓ All categories validated${colors.reset}`);

// Validate items
console.log("\n🎨 Validating items...");

const itemIds = new Set();
const itemsByCategory = {};

data.items.forEach((item, index) => {
  const prefix = `  Item #${index + 1} (${item.id || "unnamed"})`;

  // Check required fields
  if (!item.id) {
    console.error(`${colors.red}${prefix}: Missing id${colors.reset}`);
    errors++;
  } else if (itemIds.has(item.id)) {
    console.error(`${colors.red}${prefix}: Duplicate item id${colors.reset}`);
    errors++;
  } else {
    itemIds.add(item.id);
  }

  if (!item.name) {
    console.error(`${colors.red}${prefix}: Missing name${colors.reset}`);
    errors++;
  }

  if (!item.category) {
    console.error(`${colors.red}${prefix}: Missing category${colors.reset}`);
    errors++;
  } else if (!categoryIds.has(item.category)) {
    console.error(
      `${colors.red}${prefix}: Invalid category "${item.category}"${colors.reset}`
    );
    errors++;
  } else {
    // Count items per category
    itemsByCategory[item.category] = (itemsByCategory[item.category] || 0) + 1;
  }

  if (!item.filePath) {
    console.error(`${colors.red}${prefix}: Missing filePath${colors.reset}`);
    errors++;
  } else {
    // Check if file exists
    const fullPath = path.join(PUBLIC_DIR, item.filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(
        `${colors.red}${prefix}: File not found: ${item.filePath}${colors.reset}`
      );
      errors++;
    } else {
      // Check file size
      const stats = fs.statSync(fullPath);
      const sizeKB = stats.size / 1024;
      if (sizeKB > 50) {
        console.warn(
          `${colors.yellow}${prefix}: File size is large (${sizeKB.toFixed(
            1
          )}KB)${colors.reset}`
        );
        warnings++;
      }
    }
  }

  if (!item.tags || !Array.isArray(item.tags)) {
    console.warn(
      `${colors.yellow}${prefix}: Missing or invalid tags${colors.reset}`
    );
    warnings++;
  } else if (item.tags.length === 0) {
    console.warn(`${colors.yellow}${prefix}: No tags defined${colors.reset}`);
    warnings++;
  }

  if (typeof item.defaultWidth !== "number") {
    console.error(
      `${colors.red}${prefix}: Missing or invalid defaultWidth${colors.reset}`
    );
    errors++;
  }

  if (typeof item.defaultHeight !== "number") {
    console.error(
      `${colors.red}${prefix}: Missing or invalid defaultHeight${colors.reset}`
    );
    errors++;
  }

  if (typeof item.aspectRatio !== "number") {
    console.error(
      `${colors.red}${prefix}: Missing or invalid aspectRatio${colors.reset}`
    );
    errors++;
  }

  // Check attribution if present
  if (item.attribution) {
    if (!item.attribution.author) {
      console.warn(
        `${colors.yellow}${prefix}: Attribution missing author${colors.reset}`
      );
      warnings++;
    }
    if (!item.attribution.source) {
      console.warn(
        `${colors.yellow}${prefix}: Attribution missing source${colors.reset}`
      );
      warnings++;
    }
    if (!item.attribution.license) {
      console.warn(
        `${colors.yellow}${prefix}: Attribution missing license${colors.reset}`
      );
      warnings++;
    }
    if (!item.attribution.url) {
      console.warn(
        `${colors.yellow}${prefix}: Attribution missing url${colors.reset}`
      );
      warnings++;
    }
  }
});

console.log(`${colors.green}✓ All items validated${colors.reset}`);

// Display summary
console.log("\n📊 Summary:");
console.log(
  `${colors.cyan}Total Categories: ${data.categories.length}${colors.reset}`
);
console.log(`${colors.cyan}Total Items: ${data.items.length}${colors.reset}`);

console.log("\n📈 Items per category:");
data.categories.forEach((category) => {
  const count = itemsByCategory[category.id] || 0;
  console.log(`  ${category.icon} ${category.name}: ${count} items`);
});

// Final result
console.log("\n" + "=".repeat(50));
if (errors > 0) {
  console.error(
    `${colors.red}❌ Validation failed with ${errors} error(s) and ${warnings} warning(s)${colors.reset}`
  );
  process.exit(1);
} else if (warnings > 0) {
  console.log(
    `${colors.yellow}⚠️  Validation passed with ${warnings} warning(s)${colors.reset}`
  );
  process.exit(0);
} else {
  console.log(`${colors.green}✅ All validations passed!${colors.reset}`);
  process.exit(0);
}
