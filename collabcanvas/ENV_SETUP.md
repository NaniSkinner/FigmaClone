# 🔐 Environment Variables Setup

## ⚠️ IMPORTANT: API Key Security Migration

Your OpenAI API key needs to be moved from client-side to server-side for security.

---

## 📝 Update Your `.env.local` File

### **Step 1: Open `.env.local`**

```bash
cd /Users/nanis/dev/Gauntlet/FigmaClone/collabcanvas
code .env.local  # or nano .env.local
```

### **Step 2: Update the File**

**BEFORE (❌ Insecure - exposed in browser):**

```bash
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-...
```

**AFTER (✅ Secure - kept on server):**

```bash
# Remove the NEXT_PUBLIC_ prefix to keep it secure!
OPENAI_API_KEY=sk-proj-your-actual-key-here

# Optional: Set client mode
NEXT_PUBLIC_AI_CLIENT_MODE=api
```

### **Step 3: Remove Old Variable**

Make sure to **DELETE** the old `NEXT_PUBLIC_OPENAI_API_KEY` line completely!

---

## 🔄 Complete `.env.local` Template

```bash
# Firebase Configuration (Public - safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI API Key (SERVER-SIDE ONLY - never expose!)
# ⚠️ NO "NEXT_PUBLIC_" prefix - this keeps it secure!
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# AI Client Mode (optional)
# - "api" = Use secure server-side API route (RECOMMENDED)
# - "direct" = Direct browser calls (DEVELOPMENT ONLY)
NEXT_PUBLIC_AI_CLIENT_MODE=api
```

---

## ✅ Verify Setup

After updating `.env.local`:

1. **Restart dev server:**

   ```bash
   npm run dev
   ```

2. **Test in browser console:**

   ```javascript
   // This should return undefined (key is hidden!)
   console.log(process.env.NEXT_PUBLIC_OPENAI_API_KEY); // undefined ✅

   // This should return "api"
   console.log(process.env.NEXT_PUBLIC_AI_CLIENT_MODE); // "api" ✅
   ```

3. **Test AI command:**
   - Open AI chat panel
   - Run: "create a test circle"
   - Should work via secure API route! 🎉

---

## 🔒 Security Benefits

### Before (Insecure):

- ❌ API key visible in browser DevTools
- ❌ Anyone can steal your key from JavaScript files
- ❌ Key exposed in Network tab
- ❌ Unlimited usage by malicious users

### After (Secure):

- ✅ API key never leaves the server
- ✅ Hidden from browser and DevTools
- ✅ Protected by authentication
- ✅ Rate limiting possible
- ✅ Usage tracking enabled

---

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY is not set"

**Solution:** Make sure your `.env.local` has:

```bash
OPENAI_API_KEY=sk-proj-...  # No NEXT_PUBLIC_ prefix!
```

### Error: "Unauthorized: User ID not provided"

**Solution:** Make sure you're logged in to the app.

### AI commands don't work

**Solution:**

1. Check that `.env.local` is updated
2. Restart dev server: `npm run dev`
3. Check browser console for errors
4. Verify API route exists: `app/api/ai/route.ts`

---

## 📚 More Info

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [OpenAI API Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- See `aiTasks.md` Task 19 for implementation details
