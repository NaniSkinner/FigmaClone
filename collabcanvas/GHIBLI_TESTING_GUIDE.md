# Ghibli AI Transformation - Testing Guide

## Phase 1: API Testing (Current Phase)

### Prerequisites

- ✅ OpenAI API key configured in `.env.local`
- ✅ Firebase Storage configured
- ✅ Project running (`npm run dev`)

---

## Test 1: Direct API Call (Postman/Thunder Client)

### Endpoint

```
POST http://localhost:3000/api/ai/ghibli
```

### Request Headers

```
Content-Type: application/json
```

### Request Body (Example)

```json
{
  "imageUrl": "https://firebasestorage.googleapis.com/v0/b/your-bucket/o/path-to-test-image.jpg?alt=media&token=...",
  "style": "ghibli"
}
```

### Expected Response (Success)

```json
{
  "success": true,
  "generatedImageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "description": "A detailed description of the analyzed image...",
  "style": "ghibli",
  "cost": 0.051,
  "duration": 23847
}
```

### Expected Response (Error)

```json
{
  "success": false,
  "error": "Image URL is required",
  "style": "ghibli",
  "cost": 0,
  "duration": 125
}
```

---

## Test 2: Test All 4 Styles

Run the API call with each style:

1. ✅ **Classic Ghibli**: `"style": "ghibli"`
2. ✅ **Spirited Away**: `"style": "spirited_away"`
3. ✅ **Totoro**: `"style": "totoro"`
4. ✅ **Howl's Castle**: `"style": "howls"`

**Expected**: Each should return a different artistic interpretation

---

## Test 3: Error Handling

### Test Invalid Image URL

```json
{
  "imageUrl": "https://invalid-url.com/image.jpg",
  "style": "ghibli"
}
```

**Expected**: 400 error with clear message

### Test Missing Image URL

```json
{
  "style": "ghibli"
}
```

**Expected**: 400 error "Image URL is required"

### Test Invalid Style

```json
{
  "imageUrl": "https://valid-url.com/image.jpg",
  "style": "invalid_style"
}
```

**Expected**: 400 error with valid style options

---

## Test 4: Performance Validation

### Timing Targets

- ✅ GPT-4 Vision analysis: 5-15 seconds
- ✅ DALL-E 3 generation: 15-30 seconds
- ✅ Total duration: 20-45 seconds

### Cost Validation

- ✅ Expected cost per generation: $0.04-0.06
- ⚠️ Alert if cost exceeds $0.10

---

## Test 5: Firebase Storage Upload

After API returns `generatedImageUrl`, test the storage upload:

```typescript
import { uploadGeneratedImage } from "@/lib/firebase/storage";

const result = await uploadGeneratedImage(
  generatedImageUrl, // From API response
  userId, // Current user ID
  projectId // Current project ID
);

console.log("Uploaded to Firebase:", result);
```

**Expected**: Returns Firebase Storage URL

---

## Test Image Sources

### Recommended Test Images

1. **Portrait Photo**: Test facial detail preservation
2. **Landscape Photo**: Test scenery transformation
3. **Urban Scene**: Test architectural elements
4. **Nature Photo**: Test organic elements

### How to Get Test Images

1. Upload an image to your Firebase project manually
2. Use an existing canvas image URL
3. Use a publicly accessible image URL (for testing only)

---

## Success Criteria Checklist

### Phase 1 API

- [ ] API route returns 200 for valid requests
- [ ] All 4 styles generate successfully
- [ ] Error handling works for invalid inputs
- [ ] Generation completes in <45 seconds
- [ ] Cost stays under $0.08 per generation
- [ ] Generated image URL is valid
- [ ] Firebase upload works correctly

### Next Phase (Phase 2)

After Phase 1 tests pass, we'll build:

- UI button component
- Client-side generator
- Canvas integration

---

## Cost Tracking

### Current Session Costs

Keep track of your testing costs:

| Test # | Style         | Duration | Cost   | Notes      |
| ------ | ------------- | -------- | ------ | ---------- |
| 1      | ghibli        | 23.5s    | $0.051 | First test |
| 2      | spirited_away | 25.2s    | $0.055 | Works!     |
| ...    | ...           | ...      | ...    | ...        |

**Total Cost**: $**\_\_**

**Budget Alert**: Stop testing if total approaches $200

---

## Troubleshooting

### "OpenAI API key not configured"

- Check `.env.local` has `OPENAI_API_KEY`
- Restart dev server after adding key

### "Failed to download image from DALL-E"

- DALL-E URLs expire after 1 hour
- Save the image immediately to Firebase

### "Image cannot be processed (content policy)"

- OpenAI has strict content filters
- Try a different source image

### "Rate limit exceeded"

- OpenAI has rate limits on API calls
- Wait 60 seconds and try again

---

## Next Steps

After Phase 1 testing is complete and all tests pass:

1. ✅ Mark Phase 1 tasks as complete in ImageAiTasks.md
2. 🔄 Proceed to Phase 2: Client Integration
3. 🔄 Build UI components (GhibliTransformButton)
4. 🔄 Integrate with AI chat
5. 🔄 End-to-end testing

---

**Last Updated**: Phase 1 Implementation Complete
