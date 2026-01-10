# Puter Cloud Backend Setup

Use Puter as a cloud backend for E2B sandbox execution.

## What You Get

- **Frontend**: Your Vite app (deployed anywhere)
- **Backend**: Node.js server running on Puter Cloud
- **Sandbox**: E2B creates sandboxes on-demand
- **No local server**: Everything cloud-based

## Deployment Steps

### Step 1: Deploy Backend to Puter

1. Go to **Puter Dashboard** → **Apps**
2. Click **"Create New App"** or **"Deploy App"**
3. Upload this repo or connect GitHub
4. Set **entry point** to: `src/puter-server.js`
5. Add environment variable:
   ```
   E2B_API_KEY=your_e2b_api_key
   ```
6. Add dependencies to `package.json`:
   ```json
   {
     "dependencies": {
       "express": "^4.18.0",
       "cors": "^2.8.5",
       "@e2b/sdk": "^latest"
     }
   }
   ```
7. Click **Deploy**
8. Get your Puter app URL: `https://your-app-name.puter.app`

### Step 2: Configure Frontend

Create `.env.local`:
```
VITE_PUTER_BACKEND_URL=https://your-app-name.puter.app
```

The frontend will now call your Puter backend.

### Step 3: Deploy Frontend

Deploy your frontend anywhere:
- Vercel
- Netlify
- GitHub Pages
- Puter (same as backend)

## How It Works

```
Frontend (Any hosting)
    ↓
fetch('https://your-app.puter.app/api/execute', POST)
    ↓
Puter Backend Server (Express.js on Puter Cloud)
    ↓
executeCommands() function
    ↓
@e2b/sdk creates sandbox
    ↓
Bash executes commands
    ↓
Returns JSON response
```

## API Endpoints

### POST /api/execute

Execute commands in a sandbox.

**Request:**
```json
{
  "commands": ["npm install", "npm run build"],
  "projectId": "project_xyz_123"
}
```

**Response:**
```json
{
  "success": true,
  "stdout": "npm notice...\n...",
  "stderr": "",
  "exitCode": 0,
  "sandboxId": "sandbox_abc123"
}
```

### POST /api/cleanup

Clean up a sandbox.

**Request:**
```json
{
  "projectId": "project_xyz_123"
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /

Health check.

**Response:**
```json
{
  "success": true,
  "message": "E2B Backend Server is running"
}
```

## Files Involved

- **Frontend**: `src/services/aiTerminalService.ts` - Calls the backend
- **Backend**: `src/puter-server.js` - Express server
- **Logic**: `src/services/puterBackend.js` - E2B execution logic

## Forbidden Commands

These commands are blocked for security:
- `rm -rf`
- `shutdown`
- `reboot`
- `mkfs`
- Fork bombs
- Direct disk writes
- Dangerous chmod

## Sandbox Lifecycle

1. **Create**: Automatically created on first command for a project
2. **Reuse**: Same sandbox reused for 55 minutes (same projectId)
3. **Cleanup**: Manual cleanup via `/api/cleanup` or auto after timeout
4. **Cost**: E2B charges per sandbox - caching saves money

## Environment Variables

Set in Puter Dashboard → App Settings:

```
E2B_API_KEY=your_e2b_api_key_here
PORT=3000 (optional, Puter sets this)
```

## Testing

### Test health check:
```bash
curl https://your-app.puter.app/
```

### Test execute:
```bash
curl -X POST https://your-app.puter.app/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "commands": ["echo Hello", "pwd"],
    "projectId": "test_project"
  }'
```

### Test cleanup:
```bash
curl -X POST https://your-app.puter.app/api/cleanup \
  -H "Content-Type: application/json" \
  -d '{"projectId": "test_project"}'
```

## Troubleshooting

### "Module not found: @e2b/sdk"
- Add `@e2b/sdk` to `package.json` dependencies
- Redeploy on Puter

### "E2B API key not found"
- Set `E2B_API_KEY` environment variable in Puter Dashboard
- Redeploy

### Backend not responding
- Check Puter Dashboard → Apps → Logs
- Verify deployment was successful
- Check URL format is correct

### CORS errors
- Already enabled via `cors()` middleware
- If still issues, check Puter's CORS settings

## Costs

- **Puter**: Free tier available
- **E2B**: Pay per sandbox after free tier (typically $0.10-0.50 per sandbox)
- **Sandbox caching**: 55 minute reuse saves on E2B costs

Check pricing at:
- https://puter.com/pricing
- https://e2b.dev/pricing
