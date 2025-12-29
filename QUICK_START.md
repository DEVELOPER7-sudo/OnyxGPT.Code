# Quick Start Guide

## What's Fixed

✅ Agent response timeouts - now properly streaming from Gemini API  
✅ API key management - custom input in app with notifications  
✅ Error handling - detailed toast notifications for all states  
✅ Logging - comprehensive server and client-side debugging  

---

## 5-Minute Setup

### 1. Get Gemini API Key (2 minutes)
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### 2. Start the App
```bash
# Terminal 1: Frontend
npm run dev
# Runs on http://localhost:5173

# Terminal 2: Backend
bun run server/index.ts
# Runs on http://localhost:3002
```

### 3. Set API Key in App
1. Open http://localhost:5173
2. Click "Set API Key" button (top right)
3. Paste your Gemini API key
4. Click "Save Key"
5. You'll see a ✅ success notification

### 4. Create Your First Project
1. Type a project description: "A todo app with dark mode"
2. Select Gemini model (2.5 Pro recommended)
3. Click the send button
4. Watch notifications as agent builds your project

---

## Understanding the Notifications

### You'll See These:
```
✅ "API Key Saved" - Your key is securely stored locally
✅ "API Key Loaded" - Agent has your key
⏳ "Agent responding..." - Gemini is thinking
✅ "Agent Complete" - Done! Files are ready
```

### If Something Goes Wrong:
```
❌ "Missing API Key" - Click "Set API Key" button first
❌ "Server Error" - Make sure backend is running on 3002
❌ "Stream Error" - Check internet & API quota
```

---

## File Structure

```
src/
  components/
    ApiKeyInput.tsx          ← API key dialog
  hooks/
    useAgentStream.tsx       ← Stream handler with notifications
  App.tsx                    ← Has Toaster component
    
server/
  gemini.ts                  ← Gemini API integration
  index.ts                   ← Express server
  
.env                         ← GEMINI_API_KEY (optional)
API_KEY_SETUP.md            ← Detailed docs
FIX_SUMMARY.md              ← Technical fixes
```

---

## Troubleshooting

### "Agent is responding but no output"
1. Check server logs: should show "Streaming response chunks..."
2. Check browser DevTools Console for errors
3. Verify API key is valid at Google AI Studio

### "Set API Key button not working"
1. Check browser console: F12 → Console
2. Try hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
3. Clear localStorage: F12 → Application → Local Storage → Clear All

### "Server won't start"
```bash
# Make sure you have Bun installed
bun --version

# Or use Node.js instead
node server/index.ts
```

### "Notifications not showing"
1. They appear in top-right corner
2. Check you're not in incognito/private mode
3. Check Toaster is in App.tsx

---

## Where the Code Is

| Feature | File |
|---------|------|
| API Key Input UI | `src/components/ApiKeyInput.tsx` |
| API Key Logic | `src/hooks/useApiKey.ts` |
| Stream Handler | `src/hooks/useAgentStream.tsx` |
| Notifications | `src/App.tsx` (Toaster) |
| Gemini API | `server/gemini.ts` |
| Backend Server | `server/index.ts` |

---

## Environment Setup

### Option 1: UI Input (Recommended)
- User clicks "Set API Key" button
- Key stored in browser localStorage
- Works across all projects
- Can be cleared anytime

### Option 2: Environment Variable
```bash
# Create .env file in project root
GEMINI_API_KEY=your_key_here

# Server reads it automatically
```

### Option 3: Production/Docker
```dockerfile
ENV GEMINI_API_KEY=your_key_here
```

---

## API Models Available

```typescript
// In project creation dialog:
- "gemini-2.0-flash"    ← Fast, free tier
- "gemini-2.5-flash"    ← Faster, better
- "gemini-2.5-pro"      ← Most capable (default)
```

---

## Next Steps

1. **Test streaming** - Create a simple project
2. **Check logs** - Monitor both terminals
3. **Monitor notifications** - See all status updates
4. **Debug if needed** - Check FIX_SUMMARY.md

---

## Still Having Issues?

1. Check **FIX_SUMMARY.md** for technical details
2. Check **API_KEY_SETUP.md** for advanced options
3. Check browser console: F12 → Console tab
4. Check server logs: Terminal running `bun run server/index.ts`

---

**You're all set! 🚀**
