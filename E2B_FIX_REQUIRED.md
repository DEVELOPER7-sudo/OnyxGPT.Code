# E2B Sandbox Error - Root Cause & Solution

## The Problem

You're seeing this error:
```
Sandbox failed to initialize. Verify your E2B API key is valid in settings (https://e2b.dev)
```

**Root Cause**: E2B SDK cannot run directly in the browser. The `e2bService.ts` detects it's in a browser environment and returns null immediately (line 16-19).

```typescript
// e2bService.ts line 16-19
if (isBrowserEnvironment) {
  console.warn('⚠️  E2B Sandbox only available via backend API');
  return null;  // ← This is why it fails
}
```

## Why This Happens

E2B SDK 2.x requires a Node.js backend environment. Running it directly in a browser violates API authentication and security constraints.

## Two Solutions

### ✅ SOLUTION 1: Use Puter.js Workers (Recommended)

This is what I just created for you. The Puter.js Worker runs server-side and securely handles E2B.

**Steps:**
1. Deploy the worker: `src/services/puterE2bWorker.ts` to Puter.js
2. Replace LivePreview to use `puterE2BClient` instead of `e2bService`
3. Keep E2B API key in settings (will be passed to worker)

**Pros:**
- ✅ Serverless (no backend to manage)
- ✅ Free for developers
- ✅ Secure (API key server-side only)
- ✅ Scalable

**Timeline:** ~30 minutes to implement

---

### ✅ SOLUTION 2: Use Local Backend Server

Keep using `e2bService.ts` but run a local Node.js backend server.

**Changes needed:**
1. Update `e2bService.ts` to call backend API instead of direct E2B
2. Run backend server: `npm run dev:server`
3. Backend routes handle E2B initialization

**Pros:**
- ✅ Uses existing `e2bService.ts` code
- ✅ Simple local development

**Cons:**
- ❌ Requires backend server
- ❌ Can't deploy without backend
- ❌ More complex production setup

**Timeline:** ~20 minutes to implement

---

## Recommended: SOLUTION 1 (Puter.js)

I've already created all the code for you. Here's what to do:

### Step 1: Fix LivePreview Component

Replace the E2B service calls with Puter.js client:

```typescript
// src/components/LivePreview.tsx

// CHANGE FROM:
import { startDevServer, checkServerHealth, getSandbox, getServerPreviewUrl } from '@/services/e2bService';

// CHANGE TO:
import { puterE2BClient } from '@/services/puterApiClient';

// Then in startServer function:
// OLD CODE:
const started = await startDevServer(apiKey, projectId, port);

// NEW CODE:
const started = await puterE2BClient.startDevServer(port, apiKey, projectId);
```

### Step 2: Deploy Worker to Puter.js

1. Go to https://puter.com/dashboard
2. Create New Worker
3. Name it: `e2b-worker` (exact spelling)
4. Copy code from: `src/services/puterE2bWorker.ts`
5. Deploy

### Step 3: Update Other Components

Search for other uses of `e2bService` and `executeCommand`:

```bash
grep -r "e2bService\|executeCommand\|startDevServer" src/
```

Replace them with `puterE2BClient` methods.

---

## Quick Verification

### Test if Puter.js loads:
```javascript
// In browser console
window.puter  // Should NOT be undefined
```

### Test if API key is saved:
```javascript
// In browser console
localStorage.getItem('onyxgpt-storage')  // Look for sandboxApiKey
```

### Test E2B API key format:
```
Should start with: e2b_
Example: e2b_abc123def456xyz
```

---

## If You Want Solution 2 Instead

Modify `e2bService.ts` to call backend API:

```typescript
// e2bService.ts - Line 15-25
export const initE2BSandbox = async (apiKey: string, projectId: string, retries: number = 3): Promise<Sandbox | null> => {
  // CHANGE THIS:
  if (isBrowserEnvironment) {
    console.warn('⚠️  E2B Sandbox only available via backend API');
    return null;
  }

  // TO THIS:
  if (isBrowserEnvironment) {
    // Call backend API instead
    return fetch('/api/sandbox/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, projectId })
    }).then(r => r.json());
  }
  
  // ... rest of code
};
```

Then run backend: `npm run dev:server`

---

## Summary

| Option | Time | Effort | Deployment |
|--------|------|--------|-----------|
| **Puter.js (Rec)** | 30 min | Low | Serverless ✅ |
| Local Backend | 20 min | Low | Requires server ⚠️ |

**I recommend Solution 1 (Puter.js).** I've already created all the code.

**Next action:** Let me know if you want me to:
1. Update LivePreview to use `puterE2BClient`
2. Create backend API routes for Solution 2
3. Something else?
