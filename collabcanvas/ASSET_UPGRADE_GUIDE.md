# Decorative Assets Upgrade Guide

**Date:** October 19, 2025  
**Status:** In Progress

## Quick Start

This guide will help you upgrade the decorative assets from 20 to 70-75 high-quality SVG items.

## Phase 1: Asset Sourcing (Manual Step)

### Recommended Sources

#### Option A: Flaticon (Primary - Recommended)

**URL:** https://www.flaticon.com

**Free Tier:**

- Create free account
- Download up to 10 icons/day
- Requires attribution
- Perfect for MVP/testing

**Premium ($9.99/month):**

- Unlimited downloads
- No attribution required
- Priority support

**Search Terms by Category:**

- **Balloons:** "party balloons sticker", "celebration balloon", "birthday balloon"
- **Axolotl:** "axolotl cute", "kawaii axolotl", "pink axolotl sticker"
- **Matcha:** "matcha tea", "green tea sticker", "matcha latte kawaii"
- **Hockey:** "hockey equipment", "ice hockey sticker", "hockey stick"
- **Animals:** "cute animal stickers", "kawaii pets", "friendly animals"

#### Option B: SVG Repo (Secondary)

**URL:** https://www.svgrepo.com

**Benefits:**

- Completely free
- 500K+ SVGs
- Commercial-friendly licenses
- No account required

**Usage:**

- Search by category
- Download individual SVGs
- Check license for each (most are CC0/MIT)

#### Option C: unDraw (Complementary)

**URL:** https://undraw.co/illustrations

**Benefits:**

- Open source
- No attribution required
- Customizable colors
- Modern aesthetic

**Best For:**

- Larger decorative elements
- Illustrative scenes
- Background elements

### Sourcing Checklist

For each category, download 10-15 assets:

- [ ] **Balloons** (10-15 items)

  - Various shapes: round, heart, star, animal shapes
  - Different colors: primary colors, pastels, metallics
  - Styles: single, clusters, with strings

- [ ] **Axolotl** (10-15 items)

  - Different poses: happy, sleeping, waving, playing
  - Different colors: pink, blue, purple, white
  - Accessories: hats, flowers, hearts

- [ ] **Matcha** (10-15 items)

  - Drinks: tea cups, lattes, boba, iced drinks
  - Items: whisk, powder, leaves, bowl
  - Treats: matcha cakes, cookies, ice cream

- [ ] **Hockey** (10-15 items)

  - Equipment: sticks, pucks, skates, helmets, pads
  - Elements: goals, rinks, ice, jerseys
  - Actions: shooting, skating poses

- [ ] **Animals** (10-15 items)
  - Variety: cats, dogs, bunnies, bears, birds, foxes
  - Poses: sitting, playing, sleeping, jumping
  - Styles: cute, kawaii, friendly

### File Naming Convention

Use kebab-case with category prefix:

```
{category}-{descriptor}-{variation}.svg

Examples:
balloon-heart-red.svg
balloon-star-gold.svg
axolotl-happy-pink.svg
axolotl-sleeping-blue.svg
matcha-latte-kawaii.svg
matcha-cup-traditional.svg
hockey-stick-blue.svg
hockey-puck-realistic.svg
cat-sitting-orange.svg
dog-happy-brown.svg
```

### Quality Checklist

Before adding any asset, verify:

- ✓ **Format:** SVG (not PNG/JPG converted to SVG)
- ✓ **Size:** Under 50KB per file
- ✓ **Viewbox:** Properly set (check in code editor)
- ✓ **Clean paths:** No unnecessary complexity
- ✓ **No raster:** No embedded PNG/JPG images
- ✓ **License:** Commercial use permitted
- ✓ **Attribution:** Document if required

## Phase 2: Asset Integration

### Step 1: Organize Files

Place downloaded SVG files in their category folders:

```
/collabcanvas/public/decorative-items/
├── balloons/
│   ├── balloon-heart-red.svg
│   ├── balloon-star-gold.svg
│   └── ... (10-15 more)
├── axolotl/
│   ├── axolotl-happy-pink.svg
│   └── ... (10-15 more)
├── matcha/
├── hockey/
└── animals/
```

### Step 2: Update JSON Metadata

Open: `/collabcanvas/public/decorative-items/decorative-items.json`

For each new asset, add an entry in the `items` array:

```json
{
  "id": "unique-id-here",
  "name": "Display Name",
  "category": "category-name",
  "filePath": "/decorative-items/category/filename.svg",
  "tags": ["relevant", "search", "tags"],
  "defaultWidth": 100,
  "defaultHeight": 100,
  "aspectRatio": 1.0,
  "isPremium": false,
  "attribution": {
    "author": "Source Name",
    "source": "Platform Name",
    "license": "License Type",
    "url": "https://source-url.com"
  }
}
```

### JSON Entry Template Helper

Use this template for quick entry:

```json
{
  "id": "",
  "name": "",
  "category": "",
  "filePath": "/decorative-items//",
  "tags": [],
  "defaultWidth": 100,
  "defaultHeight": 100,
  "aspectRatio": 1.0,
  "isPremium": false,
  "attribution": {
    "author": "",
    "source": "",
    "license": "",
    "url": ""
  }
}
```

### Aspect Ratio Calculation

To calculate aspect ratio for non-square assets:

```
aspectRatio = width / height

Examples:
100x120 (tall) = 0.833
120x100 (wide) = 1.2
100x100 (square) = 1.0
```

### Step 3: Document Attribution

Create a tracking spreadsheet or note file:

| Asset ID          | Source   | Author      | License       | URL | Attribution Required |
| ----------------- | -------- | ----------- | ------------- | --- | -------------------- |
| balloon-heart-red | Flaticon | Freepik     | Flaticon Free | url | Yes                  |
| axolotl-happy     | SVG Repo | Open source | CC0           | url | No                   |

## Phase 3: UI Enhancements

### Attribution Display

The UI has been enhanced to show attribution in the panel footer when required.

### Premium Badge

Assets marked with `"isPremium": true` will display a premium badge.

### Lazy Loading

Asset images will load progressively to improve performance.

## Phase 4: Testing

### Pre-Launch Checklist

- [ ] All SVG files are in correct directories
- [ ] JSON file has no syntax errors
- [ ] All file paths are correct (test by opening in browser)
- [ ] Attribution information is complete
- [ ] Search tags are relevant and helpful
- [ ] Categories display correct number of items
- [ ] Search functionality works
- [ ] Drag and drop works
- [ ] Canvas rendering works
- [ ] No console errors

### Test Commands

```bash
# Verify JSON is valid
cd /Users/nanis/dev/Gauntlet/FigmaClone/collabcanvas
cat public/decorative-items/decorative-items.json | python -m json.tool > /dev/null && echo "✓ JSON is valid" || echo "✗ JSON has errors"

# Count assets per category
find public/decorative-items/balloons -name "*.svg" | wc -l
find public/decorative-items/axolotl -name "*.svg" | wc -l
find public/decorative-items/matcha -name "*.svg" | wc -l
find public/decorative-items/hockey -name "*.svg" | wc -l
find public/decorative-items/animals -name "*.svg" | wc -l

# Check file sizes
find public/decorative-items -name "*.svg" -exec ls -lh {} \; | awk '{print $5, $9}'
```

### Browser Testing

1. Start dev server: `npm run dev`
2. Open decorative items panel
3. Test each category
4. Test search with various keywords
5. Test drag and drop
6. Check console for errors
7. Verify attribution displays

### Performance Testing

- Panel should open in < 500ms
- Category switching should be instant
- Search should filter in < 100ms
- Image loading should be progressive

## Recommended Timeline

- **Day 1:** Source 30-40 assets from primary source (3-4 hours)
- **Day 2:** Source remaining 30-35 assets, organize files (3-4 hours)
- **Day 3:** Update JSON, test integration (2-3 hours)
- **Day 4:** Final testing and deployment (1-2 hours)

**Total:** 9-13 hours spread over 4 days

## Tips & Best Practices

1. **Batch Downloads:** Download all assets for one category before moving to next
2. **Consistent Style:** Stick to 1-2 art styles maximum for visual coherence
3. **Test Early:** Add 5 assets first, test, then add the rest
4. **Version Control:** Commit after each category is complete
5. **Documentation:** Keep attribution info in spreadsheet alongside work
6. **Backup:** Keep original downloads in separate folder before optimizing

## Troubleshooting

### SVG Not Displaying

- Check file path in JSON matches actual file location
- Verify SVG has proper viewBox attribute
- Check browser console for 404 errors

### JSON Syntax Error

- Use JSON validator: https://jsonlint.com
- Check for missing commas, quotes, brackets
- Ensure no trailing commas in arrays/objects

### Slow Loading

- Optimize SVG files (remove unnecessary elements)
- Check file sizes (should be < 50KB each)
- Ensure lazy loading is enabled

### Search Not Finding Items

- Add more tags to JSON entries
- Use lowercase tags
- Include synonyms and common misspellings

## Next Steps After Completion

1. Monitor usage metrics
2. Gather user feedback
3. Add more categories based on demand
4. Consider custom asset creation for brand identity
5. Explore color customization features

## Resources

- **SVG Optimization:** https://jakearchibald.github.io/svgomg/
- **JSON Validator:** https://jsonlint.com
- **Free SVG Collections:** Listed in Phase 1
- **License Reference:** https://creativecommons.org/licenses/

---

**Questions?** Refer to `/Documentation/Tasks.md` for detailed technical implementation notes.
