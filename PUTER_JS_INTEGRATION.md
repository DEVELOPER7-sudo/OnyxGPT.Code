# Puter.js Integration - Zero Backend Setup

**Puter.js = Zero Backend, Zero Cost**

No servers. No workers. No API keys. Just frontend code that users pay for their own usage.

## What is Puter.js?

Puter.js is a JavaScript library that brings:
- ✅ Cloud Storage (filesystem)
- ✅ Key-Value Database
- ✅ AI (ChatGPT, Claude, Gemini, etc.)
- ✅ Authentication
- ✅ Static Site Hosting
- ✅ Serverless Workers (if needed)

**All from frontend JavaScript. Zero backend code.**

## Setup

### 1. Install Puter.js

```bash
npm install @heyputer/puter.js
```

Or use CDN in HTML:
```html
<script src="https://js.puter.com/v2/"></script>
```

### 2. Initialize in Your App

```typescript
import puter from '@heyputer/puter.js';

// Puter auto-initializes when user logs in
// No API keys needed!
```

### 3. Use Puter APIs

**Cloud Storage:**
```typescript
// Write file
await puter.fs.write('/my-file.txt', 'Hello World');

// Read file
const content = await puter.fs.read('/my-file.txt');

// List files
const files = await puter.fs.readdir('/');
```

**Key-Value Store (for preferences, settings):**
```typescript
// Set value
await puter.kv.set('user_theme', 'dark');

// Get value
const theme = await puter.kv.get('user_theme');

// Increment counter
await puter.kv.incr('login_count');
```

**AI Chat:**
```typescript
// Use any AI model without API keys
const response = await puter.ai.chat({
  messages: [
    { role: 'user', content: 'What is 2+2?' }
  ],
  model: 'gpt-4' // or 'claude-3-opus', 'gemini-2.0', etc.
});
```

**Authentication:**
```typescript
// Auto-authenticate
const user = await puter.auth.getUser();

// Sign out
await puter.auth.signOut();
```

## Our Terminal Service

Our `aiTerminalService.ts` uses Puter.js:

1. **Simulates terminal commands** (since browser can't run bash)
2. **Stores results** in Puter Cloud Storage
3. **Saves history** in Puter KV Store
4. **Users pay** for their own storage/usage

```typescript
// Frontend only - no backend
import { handleAITerminalToolCall } from '@/services/aiTerminalService';

const result = await handleAITerminalToolCall({
  tool: 'terminal',
  commands: ['npm list', 'pwd']
}, apiKey);

// Result is stored in user's Puter cloud
```

## Architecture

```
Your App (Vite/React)
    ↓
Puter.js Library
    ↓
Puter Cloud
    ↓
User's Data (Auto-isolated)
```

- **No backend server**
- **No API keys to manage**
- **User data automatically isolated**
- **Users pay for their own usage**

## Cost Model

| Traditional BaaS | Puter.js |
|---|---|
| You pay per user | User pays their own |
| You pay for storage | User pays for their storage |
| Success = higher bill | Success = $0 for you |
| Need billing system | Built-in (handled by Puter) |

## Real Terminal Execution (Optional)

If you want **actual bash execution**, you have options:

### Option 1: Use Puter Serverless Worker (Still Free!)

Create a worker in Puter:

```javascript
// puter-worker.js - deployed in Puter
async function handler(commands) {
  // Run bash commands
  for (const cmd of commands) {
    const result = await runCommand(cmd);
    // Return result
  }
}
```

Then call from frontend:

```typescript
const result = await puter.workers.run('my-worker', commands);
```

### Option 2: Keep Local Backend (Not Recommended)

If you insist on E2B + local backend:

```bash
npm run dev:full  # Runs local backend + frontend
```

Set `.env.local`:
```
VITE_E2B_WORKER_URL=http://localhost:3001
```

But this costs money and requires server management.

## Files in This Project

| File | Purpose |
|---|---|
| `src/services/aiTerminalService.ts` | Puter.js integration (no backend!) |
| `public/index.html` | Add `<script src="https://js.puter.com/v2/"></script>` |
| `.env.local` | No E2B_API_KEY needed for Puter.js |

## Migration from Local Backend

**Before (Local Backend):**
```
Frontend → POST /api/terminal → Local Node.js → E2B → Sandbox
```

**After (Puter.js):**
```
Frontend → Puter.js Library → Puter Cloud (instant, no server)
```

## Deployment

1. **Frontend**: Deploy anywhere (Vercel, Netlify, GitHub Pages, Puter)
2. **Backend**: None! Puter.js is zero-backend
3. **Cost**: Free for you. Users pay for their own usage.

## Add Puter.js to HTML

Add this to `index.html`:

```html
<script src="https://js.puter.com/v2/"></script>
```

Or if using npm:

```typescript
import puter from '@heyputer/puter.js';
```

## Advantages

✅ **Zero backend code**
✅ **Zero API keys**
✅ **Zero cost scaling**
✅ **User data auto-isolated**
✅ **Built-in authentication**
✅ **Cloud storage included**
✅ **AI built-in (no ChatGPT key needed)**
✅ **Users pay their own costs**

## Disadvantages

❌ **Can't run actual bash in browser** (unless you add Puter Worker)
❌ **No realtime features** (not in Puter.js yet)
❌ **Limited to what Puter.js provides** (but it's a lot)

## Next Steps

1. Add `<script src="https://js.puter.com/v2/"></script>` to `index.html`
2. Deploy frontend anywhere
3. Done! Users log in with Puter account automatically
4. Users pay for their own storage/AI/usage
5. You pay $0

## Resources

- **Docs**: https://docs.puter.com
- **Playground**: https://docs.puter.com/playground
- **Examples**: https://docs.puter.com/examples
- **Discord**: https://discord.gg/PQcx7Teh8u
- **GitHub**: https://github.com/HeyPuter

## Questions?

The current integration uses Puter.js for:
- Cloud file storage
- Key-Value store (history, preferences)
- AI chat (no keys needed)
- Authentication (users bring Puter account)

For **actual bash execution**, you'd need a Puter Worker (still free, still zero-backend).
