# Stream Error Debugging Guide

## Error: "Failed to Fetch" on /api/generate Endpoint

This guide helps fix streaming errors when calling the `/api/generate` endpoint.

---

## Quick Diagnosis

### Step 1: Check Backend is Running
```bash
# In terminal, check if server is running
curl http://localhost:3002/

# Should respond:
# "Open Lovable Server is running"
```

If not running:
```bash
# Start the backend
bun run server/index.ts
# Or
npm run dev:server
```

### Step 2: Check Network Tab
1. Open browser DevTools: F12
2. Go to "Network" tab
3. Create a new project
4. Look for `/api/generate` request
5. Check Status, Response, etc.

### Step 3: Check Browser Console
1. Open DevTools: F12
2. Go to "Console" tab
3. Look for error messages
4. Screenshot any errors

---

## Common Errors & Solutions

### Error 1: "Failed to Fetch"

**Symptoms:**
- Request fails immediately
- No response from server
- Red "Failed to Fetch" in console

**Causes & Solutions:**

```
❌ Backend not running
   ✅ Solution: Start server with `bun run server/index.ts`

❌ Wrong port (not 3002)
   ✅ Solution: Check server/index.ts line 223, ensure port 3002

❌ CORS blocked
   ✅ Solution: Server has CORS enabled, check headers

❌ Network connectivity
   ✅ Solution: Check internet, restart network

❌ Firewall blocking
   ✅ Solution: Check firewall settings, allow localhost:3002

❌ URL typo in frontend
   ✅ Solution: Check src/hooks/useAgentStream.tsx line 42
       Should be: http://localhost:3002/api/generate
```

**Debug Steps:**
```javascript
// In browser console, test the endpoint:
const response = await fetch('http://localhost:3002/', {
  method: 'GET'
});
console.log(response);  // Should show 200 status
```

---

### Error 2: "API Key Missing"

**Symptoms:**
```
Toast: "Missing API Key"
Message: "Please set your Gemini API key to continue"
```

**Solutions:**
1. Click "Set API Key" button (top right)
2. Get key from https://aistudio.google.com/app/apikey
3. Paste key and click "Save Key"
4. See ✅ success toast

**Debug:**
```javascript
// In browser console:
localStorage.getItem('gemini_api_key');
// Should return your key, not null
```

---

### Error 3: "Invalid API Key"

**Symptoms:**
```
Toast: "API Error"
Message: "API key not valid for use with Gemini API"
```

**Solutions:**
1. Verify key is correct at https://aistudio.google.com/app/apikey
2. Create a new API key
3. Clear old key: Click X in API Key dialog
4. Save new key
5. Try again

**Test Key:**
```bash
# Test your API key directly
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'

# Should get a response, not an error
```

---

### Error 4: "Stream Timeout (> 30 seconds)"

**Symptoms:**
```
Stream starts but hangs for 30+ seconds
Then: "The user aborted a request."
Or: Request cancelled
```

**Causes:**
```
❌ Very long prompt (10K+ characters)
   ✅ Solution: Shorten prompt

❌ Rate limited by Gemini
   ✅ Solution: Wait a minute, retry

❌ API quota exceeded
   ✅ Solution: Check usage at Google AI Studio, wait or upgrade

❌ Network latency
   ✅ Solution: Check internet speed, try again

❌ Server overloaded
   ✅ Solution: Restart backend, check server logs
```

**Check Server Logs:**
```bash
# Terminal running backend should show:
# "Generate API called with prompt: ..."
# "System prompt loaded, length: XXXX"
# "Streaming response chunks..."
# "Chunk 1: XXX characters"
# ...
# "Stream complete. Total chunks: XX"

# If you don't see these, stream isn't reaching Gemini
```

---

### Error 5: "Response Body is Null"

**Symptoms:**
```
Toast: "Stream Error"
Message: "Response body is null"
```

**Causes:**
```
❌ Server returned 204 No Content
   ✅ Solution: Check server response headers

❌ Response not streaming
   ✅ Solution: Verify ReadableStream in server/index.ts

❌ Content-Type wrong
   ✅ Solution: Check headers are "text/event-stream"
```

**Check Headers:**
```javascript
// In Network tab of DevTools:
// Look at Response Headers:
Content-Type: text/event-stream    ← Should be this
Cache-Control: no-cache             ← Should be this
Connection: keep-alive              ← Should be this
```

---

### Error 6: "JSON Parse Error"

**Symptoms:**
```
Console: "JSON parse error >> SyntaxError: Unexpected token..."
Lines show data that can't be parsed
```

**Causes:**
```
❌ Malformed SSE format
   ✅ Solution: Check server returns "data: {json}\n\n"

❌ Invalid JSON in response
   ✅ Solution: Check gemini.ts line 43, JSON.stringify is correct

❌ Partial chunks
   ✅ Solution: Normal, parser handles this
```

**Check Format:**
```
Expected:
data: {"text": "some text"}
[empty line]

Not:
data: {"text": "some text"}
[no empty line]

Or:
{"text": "some text"}
[missing "data: "]
```

---

## Full Debugging Checklist

### Backend Setup
- [ ] Node.js or Bun installed
- [ ] `bun run server/index.ts` starts without errors
- [ ] Server logs show "Open Lovable Server is running"
- [ ] Port 3002 is free (check with `lsof -i :3002`)
- [ ] GEMINI_API_KEY set in .env file
- [ ] .env file in project root

### Network/CORS
- [ ] Can reach http://localhost:3002 from browser
- [ ] Can reach https://generativelanguage.googleapis.com from server
- [ ] No firewall blocking ports
- [ ] CORS headers present in response

### API Key
- [ ] API key is valid (test at https://aistudio.google.com/app/apikey)
- [ ] Key saved in localStorage (`localStorage.getItem('gemini_api_key')`)
- [ ] Key appears in browser Network tab (POST body)
- [ ] Key doesn't expire

### Gemini API
- [ ] Model exists: `gemini-2.5-pro` ✅
- [ ] API quota not exceeded (check Google AI Studio)
- [ ] Not rate limited (wait a minute if needed)
- [ ] Model supports streaming (all do)

### Request/Response
- [ ] Request method is POST ✅
- [ ] Request URL is correct ✅
- [ ] Request headers include Content-Type ✅
- [ ] Response status is 200 ✅
- [ ] Response headers include text/event-stream ✅
- [ ] Response body has SSE format ✅

### Frontend
- [ ] useAgentStream hook triggers
- [ ] Console shows "Fetching from: localhost:3002"
- [ ] Console shows "Response status: 200"
- [ ] Toast notifications appear
- [ ] Stream chunks print to console

---

## Advanced Debugging

### Test Endpoint with curl
```bash
# Test basic connectivity
curl -v http://localhost:3002/

# Test /api/generate with sample prompt
curl -X POST http://localhost:3002/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}' \
  -v

# Should stream back SSE format:
# data: {"text": "..."}
# data: {"text": "..."}
# data: [DONE]
```

### Monitor Server Logs
```bash
# Terminal 1: Run server with output visible
bun run server/index.ts

# Terminal 2: Make request
curl -X POST http://localhost:3002/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'

# Watch Terminal 1 for logs:
# Generate API called with prompt: test
# System prompt loaded, length: XXXX
# Streaming response chunks...
# Chunk 1: XXX characters
# etc.
```

### Test Gemini API Directly
```bash
# Get your API key
export GEMINI_API_KEY="your_key_here"

# Test Gemini endpoint
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=$GEMINI_API_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Explain AI in one sentence"
      }]
    }]
  }'

# Should return JSON with generated text
```

### Browser DevTools Network Tab
1. Open DevTools: F12
2. Go to Network tab
3. Filter: "XHR" or "Fetch"
4. Create new project
5. Look for `/api/generate` request
6. Click on it
7. Check:
   - Headers: Request headers correct?
   - Response: SSE format correct?
   - Timing: How long does request take?
   - Size: How many bytes transferred?

---

## Performance Metrics

### Expected Timing
```
Request → Server: < 100ms
Server → Gemini: 500ms - 1s (first response)
Streaming: Chunks arrive every 100-200ms
Total (first token): 1-3 seconds
Total (complete): 5-30 seconds (depends on length)
```

### If Timing is Off
```
❌ Stuck at "Streaming response chunks..."
   → Check Gemini API status
   → Check API quota

❌ Immediate timeout
   → Network issue
   → Backend not running

❌ Very slow (> 10s first token)
   → Network latency
   → Prompt too long
   → Rate limited
```

---

## Error Messages Reference

| Error | Cause | Fix |
|-------|-------|-----|
| Failed to fetch | Backend down | Start server |
| Response body is null | Bad response | Check headers |
| JSON parse error | Invalid JSON | Check format |
| API key not valid | Wrong key | Get new key |
| Rate limit exceeded | Too many requests | Wait or upgrade |
| Model not found | Wrong model name | Use gemini-2.5-pro |
| Stream error | Network issue | Check connection |
| Timeout | Request too slow | Check backend logs |

---

## Log Locations

### Browser Console
```
F12 → Console tab
Shows: "Fetching from...", "Response status...", errors
```

### Server Terminal
```
Terminal running: bun run server/index.ts
Shows: "Generate API called...", "Streaming chunks...", errors
```

### Network Tab
```
F12 → Network tab
Shows: HTTP requests/responses, timing, headers
```

### Local Storage
```
F12 → Application → Local Storage → http://localhost:5173
Shows: gemini_api_key value
```

---

## Recovery Steps

### If Stream Fails:
1. Check browser console for error message
2. Check server logs in terminal
3. Check Network tab in DevTools
4. Try the checklist above
5. Restart server: Ctrl+C, then `bun run server/index.ts`
6. Try again

### If Stuck in "Agent responding...":
1. Check server logs - is it actually streaming?
2. Open DevTools → Network
3. Look for `/api/generate` request
4. Check if it's receiving data (in Response tab)
5. Wait 30 seconds for timeout
6. Check error message in toast
7. Fix based on error

### If API Key Issues:
1. Get new key from https://aistudio.google.com/app/apikey
2. Clear old key (click X in dialog)
3. Click "Set API Key" button
4. Paste new key
5. Click "Save Key"
6. Try again

---

## Prevention Tips

1. **Always check backend is running** before testing
2. **Watch server logs** while testing - very helpful
3. **Check API quota** periodically at Google AI Studio
4. **Use shorter prompts** for faster responses
5. **Test with curl first** before testing in UI
6. **Monitor DevTools Network tab** while streaming
7. **Keep API key in .env** not in code
8. **Restart backend** if strange behavior occurs

---

## Still Stuck?

Check these files in order:
1. `QUICK_START.md` - Basic setup
2. `API_KEY_SETUP.md` - API key help
3. `ARCHITECTURE.md` - System understanding
4. `server/gemini.ts` - Code implementation
5. This file - Detailed debugging

If still stuck:
- Check all logs (browser + server)
- Check all network requests
- Verify checklist items
- Try with curl directly
- Restart everything

---

**Last Updated:** January 2025  
**Status:** Current with latest Gemini API
