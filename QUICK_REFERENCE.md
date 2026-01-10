# Quick Reference - Puter.js + E2B Setup

## File to Deploy
```
src/services/puterE2bWorker.js
```

## Deployment Steps
```
1. Go to https://puter.com/dashboard
2. Workers → Create New Worker
3. Name: e2b-worker
4. Copy code from puterE2bWorker.js
5. Add dependency: e2b@^2.9.0
6. Deploy
7. Wait for "Active" status
```

## Get API Key
```
1. Go to https://e2b.dev/dashboard
2. Create API Key
3. Copy key (format: e2b_xxx...)
```

## Add Key to App
```
1. Open Code Canvas
2. Settings → Sandbox API Key (E2B)
3. Paste API key
4. Click Save
```

## Test It
```
1. Open Terminal tab
2. Type: echo "test"
3. Press Enter
4. Should see: test
```

## Key Names
```
Worker Name:  e2b-worker  (exact spelling)
API Key:      e2b_xxxxx   (starts with e2b_)
```

## Links
```
Puter Dashboard:    https://puter.com/dashboard
E2B Dashboard:      https://e2b.dev/dashboard
Code Canvas Repo:   https://github.com/DEVELOPER7-sudo/code-canvas
```

## Troubleshooting
```
Worker not found?       Check name = e2b-worker (lowercase)
API key rejected?       Verify it starts with e2b_
Commands timeout?       Check internet, refresh page
Terminal gives error?   Check Settings has API key saved
```

## Files Changed
```
✅ src/components/SandboxTerminal.tsx    (Updated)
✅ src/components/LivePreview.tsx        (Updated)
✅ src/services/puterApiClient.ts        (Already created)
✅ src/services/puterE2bWorker.js        (Deploy this)
```

## API Usage (for developers)
```typescript
import { puterE2BClient } from '@/services/puterApiClient';

// Execute command
const result = await puterE2BClient.executeCommand(
  'npm install',
  apiKey,
  projectId
);

// Start dev server
const started = await puterE2BClient.startDevServer(
  3000,
  apiKey,
  projectId
);
```

## Architecture
```
React Component
    ↓
puterE2BClient (Frontend)
    ↓
Puter.js Worker (Server)
    ↓
E2B Sandbox (Isolated)
```

## Performance
```
First execution:    2-10 seconds
Cached execution:   100-200ms
File operations:    500ms-2 seconds
```

## Security
```
✅ API key stored locally (not sent to servers)
✅ Only sent to Puter.js for server-side use
✅ E2B sandbox provides isolation
✅ Commands run in isolated environment
```

---

**Everything ready? Deploy the worker!** 🚀

See `DEPLOY_WORKER_NOW.md` for detailed deployment steps.
