# Agent Response Timeout Fix

## Problems Found & Fixed

### 1. **Wrong API Endpoint** ❌ → ✅
**Problem:** Frontend was trying to call a non-existent Supabase function at `${VITE_SUPABASE_URL}/functions/v1/generate`
**Fix:** Changed to local server endpoint `http://localhost:3002/api/generate`
**File:** `src/hooks/useAgentStream.tsx`

### 2. **API Key Not Being Sent** ❌ → ✅
**Problem:** Frontend was sending `apiKey` to backend but backend doesn't use it (it reads from `GEMINI_API_KEY` env var)
**Fix:** Removed unnecessary `apiKey` from request payload. Server now reads from `.env` file
**File:** `src/hooks/useAgentStream.tsx`

### 3. **Missing Error Handling in Stream** ❌ → ✅
**Problem:** Server-side ReadableStream didn't handle async errors properly
**Fix:** Added try-catch wrapper in the stream's `start` callback with proper error responses
**File:** `server/index.ts`

### 4. **Improper System Prompt Integration** ❌ → ✅
**Problem:** System prompt was being added as a separate chat history message instead of prepended to the prompt
**Fix:** Concatenate system prompt directly with user prompt before sending to Gemini
**File:** `server/gemini.ts`

### 5. **Insufficient Logging** ❌ → ✅
**Problem:** Hard to debug stream timeouts with minimal console output
**Fix:** Added detailed console logs for:
  - Stream initialization
  - Chunk counts and sizes
  - Error details
  - Stream completion status
**Files:** `server/gemini.ts`, `src/hooks/useAgentStream.tsx`

---

## Setup Instructions

### 1. Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

### 2. Configure Environment
Edit `.env` file in the project root and add:
```
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Start the Server
```bash
# In one terminal
npm run dev    # Runs Vite dev server on :5173

# In another terminal (from project root)
bun run server/index.ts   # Runs server on :3002
```

### 4. Test the Flow
1. Open http://localhost:5173
2. Set a Gemini API key in the UI (or it'll read from `.env`)
3. Create a new project with a prompt
4. Monitor the browser console for debug logs
5. Monitor the server terminal for stream logs

---

## How It Works Now

```
Frontend (React)
    ↓ (fetch POST to localhost:3002/api/generate)
Backend Server (Elysia)
    ↓ (sends prompt to Gemini API)
Gemini 2.5 Pro
    ↓ (streams response back)
Server ReadableStream
    ↓ (event-stream format: "data: {...}\n\n")
Frontend Reader
    ↓ (parses SSE chunks, feeds to StreamingParser)
StreamingParser
    ↓ (parses XML-like tags: <lov-thinking>, <lov-write>, etc.)
Zustand Store
    ↓ (updates messages & files)
React Components
    ↓ (renders agent response & generated files)
```

---

## Key Files Changed

1. **src/hooks/useAgentStream.tsx** - Fixed API endpoint & added logging
2. **server/index.ts** - Added error handling for stream
3. **server/gemini.ts** - Fixed system prompt integration & logging
4. **.env** - Created for API key storage

---

## Debugging Checklist

- [ ] GEMINI_API_KEY is set in `.env`
- [ ] Server is running on port 3002
- [ ] Browser console shows "Fetching from: http://localhost:3002/api/generate"
- [ ] Server console shows "Generate API called..."
- [ ] No "Response status: 5xx" errors
- [ ] Check for CORS issues (should be allowed on server)
- [ ] Verify chunks are being streamed ("Chunk 1: X characters")
- [ ] Check for JSON parse errors in browser console
