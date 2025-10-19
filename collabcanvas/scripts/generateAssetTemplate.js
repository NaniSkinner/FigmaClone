#!/usr/bin/env node

/**
 * Asset Template Generator
 *
 * Generates JSON templates for adding new decorative items
 * Run: node scripts/generateAssetTemplate.js [category] [count]
 * Example: node scripts/generateAssetTemplate.js balloons 5
 */

const args = process.argv.slice(2);
const category = args[0] || "category-name";
const count = parseInt(args[1]) || 1;

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
};

console.log(
  `${colors.cyan}🎨 Generating ${count} asset template(s) for "${category}"...${colors.reset}\n`
);

const templates = [];

for (let i = 1; i <= count; i++) {
  const template = {
    id: `${category}-item-${i}`,
    name: `${category.charAt(0).toUpperCase() + category.slice(1)} Item ${i}`,
    category: category,
    filePath: `/decorative-items/${category}/${category}-item-${i}.svg`,
    tags: [category, "tag1", "tag2"],
    defaultWidth: 100,
    defaultHeight: 100,
    aspectRatio: 1.0,
    isPremium: false,
    attribution: {
      author: "Source Author",
      source: "Source Platform",
      license: "License Type",
      url: "https://source-url.com",
    },
  };

  templates.push(template);
}

console.log(JSON.stringify(templates, null, 2));

console.log(`\n${colors.green}✓ Generated ${count} template(s)${colors.reset}`);
console.log(
  `${colors.yellow}→ Copy the JSON above and add to decorative-items.json items array${colors.reset}`
);
console.log(
  `${colors.yellow}→ Remember to customize: id, name, filePath, tags, and attribution${colors.reset}\n`
);
