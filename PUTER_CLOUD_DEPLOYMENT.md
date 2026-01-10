# Puter Cloud Worker Deployment

## Overview

Everything runs in Puter's cloud - no local backend needed.

- **Frontend**: Deployed on Puter
- **Worker**: Runs in Puter cloud (`e2b-worker`)
- **E2B Sandbox**: Created by worker on-demand
- **No local server**: Fully cloud-based

## Deploy E2B Worker to Puter

### Step 1: Create Worker

1. Go to https://puter.com/dashboard
2. Click "Workers" (or "Apps" → "Workers")
3. Click "Create New Worker"
4. Name: `e2b-worker`
5. Copy entire contents of `/src/services/puterE2bWorker.js`
6. Paste into worker editor
7. Click "Deploy"

### Step 2: Add E2B SDK Dependency

In worker settings, add dependency:
```
@e2b/sdk
```

### Step 3: Deploy Frontend

1. Push code to GitHub (or your repo)
2. In Puter Dashboard → "Apps"
3. Click "Create New App"
4. Connect your GitHub repo
5. Point to this directory
6. Deploy

## How It Works

```
Frontend (Puter App)
    ↓
fetch('https://e2b-worker.puter.work/execute', POST)
    ↓
Puter Worker (e2b-worker) - Global Router
    ↓
router.post('/execute') handler
    ↓
@e2b/sdk (creates sandbox)
    ↓
E2B Sandbox executes commands
    ↓
Returns JSON response to frontend
```

## Routes

The worker exposes these HTTP endpoints:

### POST /execute
Execute commands in a sandbox
```json
{
  "commands": ["npm install", "npm run build"],
  "projectId": "project_xyz"
}
```

### POST /cleanup
Clean up sandbox
```json
{
  "projectId": "project_xyz"
}
```

### GET /
Health check

## Usage in Frontend

The `aiTerminalService.ts` handles everything:
- Calls the Puter worker
- Manages project ID (persists in session)
- Formats output for AI model

## Testing

Before deploying, test locally:

```bash
# Check if Puter SDK is available
npm install @puter/puter-js

# Run frontend
npm run dev
```

If Puter SDK isn't available locally, it will be available in production.

## Cleanup

Sandboxes auto-cleanup after 55 minutes of inactivity or when:

```javascript
cleanupE2bSandbox() // Called on app unload
```

## Troubleshooting

### "puter is not defined"
- Only available in Puter environment
- Works in production, not in local dev

### Worker not responding
- Check Puter Dashboard → Workers → Logs
- Verify `@e2b/sdk` dependency is added
- Check E2B API key is set in worker environment

### Commands failing
- Check forbidden patterns in `puterE2bWorker.js`
- Some commands like `rm -rf`, `shutdown` are blocked
- Check sandbox logs in Puter Dashboard

## Environment Variables

Set in Puter Dashboard → Worker Settings:
```
E2B_API_KEY=your_e2b_api_key
```

(Worker automatically uses process.env.E2B_API_KEY if set)

## Costs

- Puter: Free tier available
- E2B: Pay-per-sandbox after free tier
- Check pricing at https://e2b.dev/pricing
