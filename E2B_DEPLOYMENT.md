# E2B Worker Deployment Guide

## Setup

1. Install E2B CLI:
```bash
npm install -g @e2b/cli
```

2. Login to E2B:
```bash
e2b login
```

3. Configure your E2B API key in your account at https://e2b.dev

## Deploy the Worker

From the project root:

```bash
e2b build
e2b deploy
```

This will:
- Build the worker from `src/services/e2bWorker.ts`
- Deploy it to E2B's infrastructure
- Return a worker URL like: `https://my-worker-xxxxx.e2b.dev`

## Configure the Frontend

1. Copy your deployed worker URL
2. Create a `.env.local` file:
```
VITE_E2B_WORKER_URL=https://your-worker-url.e2b.dev
```

3. The frontend will now call your E2B worker instead of localhost

## How It Works

- **Client** (`aiTerminalService.ts`): Sends command requests to the E2B worker
- **Worker** (`e2bWorker.ts`): Creates a sandbox, validates commands, executes them, returns output
- **E2B SDK**: Handles sandbox lifecycle, process execution, file operations
- **API Key**: E2B automatically injects credentials, no need to pass them from client

## Testing Locally (Optional)

To test locally before deploying:

```bash
npm run dev:full
```

This runs:
- Frontend on `http://localhost:5173`
- Backend on `http://localhost:3001`

Update `.env.local` to point to localhost if testing locally.

## Troubleshooting

### "No routes for given request type GET"
- The worker URL is correct, but E2B expects a POST to the worker's handler
- Ensure `aiTerminalService.ts` uses POST method
- Verify the URL includes `/api/terminal` endpoint (handled by worker handler)

### Worker not responding
- Check E2B dashboard: https://e2b.dev/dashboard
- View logs: `e2b logs`
- Verify API key is valid

### Commands not executing
- Check worker logs for validation errors
- Ensure commands aren't in the FORBIDDEN_PATTERNS list
- Verify sandbox creation isn't timing out
