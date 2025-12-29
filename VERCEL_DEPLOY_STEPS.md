# Vercel Deployment: Complete Step-by-Step Guide

## Overview

This guide walks you through deploying OnyxGPT to Vercel, removing the need for a local backend server.

**Time Required:** 10 minutes  
**Difficulty:** Very Easy  
**Cost:** Free (with optional paid upgrades)

---

## Prerequisites

- [ ] GitHub account (to deploy from repo)
- [ ] Gemini API key (from https://aistudio.google.com/app/apikey)
- [ ] Project already pushed to GitHub

---

## Step 1: Verify Files Are in Place

Make sure these files exist in your project:

```
✅ api/generate.ts          ← Cloud function
✅ vercel.json               ← Configuration
✅ .env.local                ← Local development
✅ .env.production           ← Production config
✅ src/hooks/useAgentStream.tsx  ← Updated for cloud
```

**Check:**
```bash
ls api/generate.ts
ls vercel.json
```

---

## Step 2: Install Vercel CLI (Optional - Not Required)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Or use npm scripts instead (easier)
npm install --save-dev vercel
```

---

## Step 3: Deploy via GitHub (Easiest Method)

### Method A: Using Vercel Dashboard (No CLI needed)

1. **Go to Vercel:** https://vercel.com
2. **Sign Up/Login** with GitHub
3. **Click "New Project"**
4. **Import your repository**
   - Select `DEVELOPER7-sudo/OnyxGPT.Code`
5. **Framework Preset:** Select **Vite**
6. **Environment Variables:**
   - Click "Add"
   - Name: `GEMINI_API_KEY`
   - Value: Your API key from Google AI Studio
   - Click "Add"
7. **Deploy** - Click "Deploy" button
8. **Wait** - Takes 2-3 minutes
9. **Done!** - You'll get a URL like `https://onyxgpt-code.vercel.app`

### Step 4: Update Environment Variable

After deployment, update `.env.production`:

```env
VITE_API_ENDPOINT=https://YOUR-PROJECT-NAME.vercel.app/api/generate
```

Replace `YOUR-PROJECT-NAME` with your actual Vercel project name.

---

## Step 5: Deploy Frontend Updates

```bash
# Push changes to GitHub
git add -A
git commit -m "feat: add Vercel cloud deployment support"
git push origin main

# Vercel automatically deploys from main branch
# Check https://vercel.com/dashboard for deployment status
```

---

## Step 6: Test Cloud Deployment

### Test via cURL

```bash
# Test your cloud endpoint
curl -X POST https://YOUR-PROJECT.vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello world"}'

# Should receive:
# data: {"text": "..."}
# data: [DONE]
```

### Test in Browser

1. **Open your Vercel URL:** `https://YOUR-PROJECT.vercel.app`
2. **Click "Set API Key"** button (top right)
3. **Enter your Gemini API key**
4. **Click "Save Key"**
5. **Create a test project:**
   - Type: "A simple hello world component"
   - Click send
6. **Watch notifications:**
   - ✅ "API Key Loaded"
   - ⏳ "Agent responding..."
   - ✅ "Agent Complete"
7. **Success!** Files should appear

---

## Alternative: Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to your Vercel account
vercel login

# Deploy
vercel --prod

# When prompted:
# - Set project name
# - Use current directory
# - Skip build step (Vite handles it)
# - Add environment variable: GEMINI_API_KEY

# Get your URL from output
```

---

## File Structure

After deployment, your structure looks like:

```
src/                    ← React app
  ├─ pages/
  ├─ components/
  └─ hooks/
      └─ useAgentStream.tsx  (now uses VITE_API_ENDPOINT)

api/                    ← Cloud functions (deployed to Vercel)
  └─ generate.ts        (Gemini API proxy)

vercel.json             ← Vercel configuration
.env.production         ← Production environment
.env.local              ← Local development
```

---

## Configuration Files

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "framework": "vite",
  "env": {
    "GEMINI_API_KEY": "@gemini_api_key"
  },
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x",
      "memory": 512,
      "maxDuration": 60
    }
  }
}
```

**Explanation:**
- `buildCommand` - How to build the project
- `framework` - Use Vite for building
- `env` - Link to environment secrets
- `functions` - Configure serverless functions
  - `runtime` - Node.js version
  - `memory` - RAM allocated (512 MB)
  - `maxDuration` - Timeout (60 seconds)

### .env.local (Development)

```env
VITE_API_ENDPOINT=http://localhost:3002/api/generate
```

Uses local backend for development.

### .env.production (Production)

```env
VITE_API_ENDPOINT=https://your-project.vercel.app/api/generate
```

Uses Vercel cloud endpoint for production.

---

## API Endpoint Details

### Function Location

**File:** `api/generate.ts`

**Vercel Maps to:** `https://YOUR-URL/api/generate`

**What it does:**
1. Receives POST request with `{ prompt }`
2. Calls Gemini API
3. Streams response as SSE (Server-Sent Events)
4. Sends chunks: `data: {"text": "..."}\n\n`
5. Ends with: `data: [DONE]\n\n`

### Using the Endpoint

```javascript
// Browser
const response = await fetch('https://your-url/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Hello' })
});

// Read stream
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
```

---

## Environment Variables

### Setting in Vercel Dashboard

1. **Go to:** https://vercel.com/dashboard
2. **Select your project**
3. **Settings** → **Environment Variables**
4. **Add Variable:**
   - Name: `GEMINI_API_KEY`
   - Value: Your API key
   - Scope: Production (recommended)
5. **Save**

### Values Available

- `GEMINI_API_KEY` - Your Gemini API key
- Auto-detected by `api/generate.ts`

---

## Monitoring & Logs

### View Logs

1. **Vercel Dashboard** → Your Project
2. **Deployments** tab
3. Click on a deployment
4. **Functions** → See logs
5. Or use CLI:

```bash
vercel logs

# Or specifically:
vercel logs api/generate
```

### Common Log Messages

```
✅ "Initializing Gemini API..."      - Starting request
✅ "Streaming response..."            - Sending chunks
✅ "Stream complete. Total chunks: X" - Done
❌ "Error: API key not configured"   - Missing GEMINI_API_KEY
❌ "Error: PERMISSION_DENIED"        - Invalid API key
```

---

## Troubleshooting

### Issue: "GEMINI_API_KEY is not configured"

**Solution:**
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Add `GEMINI_API_KEY`
4. Re-deploy: Push to GitHub or click "Deploy"

### Issue: "404 Not Found" on /api/generate

**Solution:**
1. Check `api/generate.ts` exists
2. Check `vercel.json` is correct
3. Re-deploy: `git push origin main`

### Issue: CORS Error

**Solution:**
- Already fixed in `api/generate.ts`
- Headers are set:
  ```typescript
  res.setHeader('Access-Control-Allow-Origin', '*');
  ```

### Issue: "Stream timeout after 30s"

**Solutions:**
1. Check API quota at Google AI Studio
2. Try shorter prompt
3. Increase timeout in `vercel.json`: `"maxDuration": 120` (max 120s)

### Issue: Frontend still hitting localhost

**Solution:**
1. Update `.env.production` with correct URL
2. Rebuild: `npm run build`
3. Push to GitHub: `git push origin main`
4. Check deployment status in Vercel Dashboard

---

## Local Development (Without Vercel)

You can still run locally if you want:

```bash
# Terminal 1: Run local backend
bun run server/index.ts

# Terminal 2: Run frontend
npm run dev

# Frontend will use .env.local settings
# API calls go to localhost:3002
```

But cloud deployment means you don't need this!

---

## Workflow: From Local to Cloud

### Development
```bash
npm run dev          # Uses .env.local → localhost backend
```

### Deployment
```bash
git add -A
git commit -m "new feature"
git push origin main # Vercel auto-deploys → Uses .env.production → Cloud
```

---

## Costs

### Vercel Free Plan
- ✅ 10 GB bandwidth
- ✅ 6 GB RAM (total)
- ✅ Auto-scaling
- ✅ Custom domains
- ✅ API Functions

### For OnyxGPT
- **Normal usage:** Well within free tier
- **Heavy usage:** $20/month Pro plan

---

## Next Steps

1. ✅ Verify files in place (`api/generate.ts`, `vercel.json`)
2. ✅ Deploy to Vercel (via GitHub)
3. ✅ Add `GEMINI_API_KEY` environment variable
4. ✅ Update `.env.production` with your URL
5. ✅ Test cloud endpoint with curl
6. ✅ Test in browser
7. ✅ Delete local `server/` (if desired)
8. ✅ Celebrate! 🎉

---

## Keep Local Backend?

If you want to keep the local backend for comparison:

**Use both:**
```env
# .env.local - Uses localhost
VITE_API_ENDPOINT=http://localhost:3002/api/generate

# .env.production - Uses Vercel
VITE_API_ENDPOINT=https://your-project.vercel.app/api/generate
```

**Switch between them:**
```bash
# Local development
npm run dev              # Uses .env.local

# Production simulation
VITE_ENV=production npm run build
npm run preview          # Uses .env.production
```

---

## Delete Local Backend (Optional)

If you're moving entirely to cloud:

```bash
# Backup first
git add -A && git commit -m "backup before removing server"

# Remove local server
rm -rf server/

# Remove from package.json scripts if any

# Commit
git add -A
git commit -m "remove local backend, using Vercel cloud instead"
git push origin main
```

---

## Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Verify files exist | 1 min |
| 2 | Deploy to Vercel | 3 min |
| 3 | Add environment var | 2 min |
| 4 | Update .env.production | 1 min |
| 5 | Test endpoint | 2 min |
| 6 | Test in browser | 1 min |
| **Total** | **Complete cloud setup** | **~10 min** |

---

## Resources

- **Vercel Docs:** https://vercel.com/docs
- **Gemini API:** https://ai.google.dev
- **Node.js Runtime:** https://vercel.com/docs/functions/serverless-functions/runtimes

---

**Congratulations! 🚀**

Your app is now deployed to the cloud and doesn't need a local backend anymore!

---

**Last Updated:** January 2025  
**Status:** Ready to Deploy ✅
