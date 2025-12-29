# Cloud Migration Guide: Remove Local Backend

This guide walks you through removing the local backend and migrating to cloud-based solutions.

---

## 🎯 Migration Options

### Option 1: **Vercel (RECOMMENDED - Easiest)** ⭐
- **Cost:** Free tier available
- **Setup Time:** 5 minutes
- **Complexity:** Very simple
- **Best for:** Quick deployment, serverless functions
- **Pros:** Auto-scaling, CORS pre-configured, GitHub integration
- **Cons:** Cold starts on free tier

### Option 2: **Firebase Cloud Functions**
- **Cost:** Free tier available
- **Setup Time:** 10 minutes
- **Complexity:** Moderate
- **Best for:** Full backend, real-time features
- **Pros:** Database included, real-time support
- **Cons:** More complex setup

### Option 3: **AWS Lambda + API Gateway**
- **Cost:** Free tier available
- **Setup Time:** 15 minutes
- **Complexity:** Moderate
- **Best for:** Scalable enterprise solutions
- **Pros:** Powerful, flexible, cost-effective at scale
- **Cons:** Steeper learning curve

### Option 4: **DigitalOcean App Platform**
- **Cost:** $12/month minimum
- **Setup Time:** 10 minutes
- **Complexity:** Simple
- **Best for:** Full control, traditional backend
- **Pros:** Easy deployment, good performance
- **Cons:** Not free tier

### Option 5: **Supabase (Recommended if using DB)**
- **Cost:** Free tier available
- **Setup Time:** 10 minutes
- **Complexity:** Simple
- **Best for:** With database, real-time features
- **Pros:** PostgreSQL included, authentication ready
- **Cons:** Overkill for just Gemini API proxy

---

## ✅ RECOMMENDED: Vercel Deployment

This is the simplest option. Let me show you how:

### Step 1: Prepare Code for Vercel

Create a new file: `api/generate.ts` in the root:

```typescript
// api/generate.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

async function getSystemPrompt(): Promise<string> {
  try {
    const promptPath = path.join(process.cwd(), 'system-prompt.md');
    return await fs.readFile(promptPath, 'utf-8');
  } catch (error) {
    console.error("Error reading system prompt:", error);
    return "You are an expert full-stack software engineer.";
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemPrompt = await getSystemPrompt();
    const chat = model.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 8192 },
    });

    const fullPrompt = systemPrompt + "\n\n" + prompt;
    const result = await chat.sendMessageStream(fullPrompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        const data = `data: ${JSON.stringify({ text: chunkText })}\n\n`;
        res.write(data);
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();

  } catch (error) {
    console.error("Gemini error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
}
```

### Step 2: Create `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "framework": "vite",
  "functions": {
    "api/**/*.ts": {
      "memory": 512,
      "maxDuration": 60
    }
  }
}
```

### Step 3: Update `.env.production`

```env
GEMINI_API_KEY=your_api_key_here
```

### Step 4: Update Frontend to Use Cloud Endpoint

**File:** `src/hooks/useAgentStream.tsx`

Change line 42:
```typescript
// ❌ OLD (Local)
const apiEndpoint = 'http://localhost:3002/api/generate';

// ✅ NEW (Cloud - Vercel)
const apiEndpoint = 'https://your-project.vercel.app/api/generate';
```

### Step 5: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, set GEMINI_API_KEY in dashboard
```

That's it! Your app now uses cloud backend. 🚀

---

## Alternative: Firebase Cloud Functions

### Setup Steps

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init functions

# Create functions/index.ts
```

**functions/index.ts:**
```typescript
import * as functions from "firebase-functions";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export const generate = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { prompt } = req.body;

  try {
    res.set('Content-Type', 'text/event-stream');
    res.set('Cache-Control', 'no-cache');
    res.set('Connection', 'keep-alive');

    const chat = model.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 8192 },
    });

    const result = await chat.sendMessageStream(prompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        const data = `data: ${JSON.stringify({ text: chunkText })}\n\n`;
        res.write(data);
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();

  } catch (error) {
    console.error("Error:", error);
    res.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
    res.end();
  }
});
```

**Deploy:**
```bash
firebase deploy
```

**Update Frontend:**
```typescript
const apiEndpoint = 'https://us-central1-YOUR-PROJECT.cloudfunctions.net/generate';
```

---

## Alternative: AWS Lambda

### Setup Steps

```bash
# Install SAM CLI
brew install aws-sam-cli

# Configure AWS credentials
aws configure

# Create function
sam init

# Build
sam build

# Deploy
sam deploy --guided
```

### Lambda Function

```typescript
// src/handlers/generate.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const { prompt } = JSON.parse(event.body || '{}');

  try {
    const chat = model.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 8192 },
    });

    let responseText = '';

    const result = await chat.sendMessageStream(prompt);

    for await (const chunk of result.stream) {
      responseText += chunk.text();
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: responseText })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) })
    };
  }
};
```

---

## Removing Local Backend

### Step 1: Stop Local Server

In your terminal, press `Ctrl+C` to stop the backend.

### Step 2: Remove Server Files (Optional)

```bash
# Keep server directory for reference, or remove:
rm -rf server/
```

### Step 3: Update package.json

```json
{
  "scripts": {
    "dev": "vite",
    // Remove: "dev:server": "...",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Step 4: Update .env

Remove `GEMINI_API_KEY` (now in cloud provider's dashboard)

```env
# Local .env (removed GEMINI_API_KEY)
# Just for development, use cloud env vars in production
```

### Step 5: Update Frontend Endpoint

**src/hooks/useAgentStream.tsx line 42:**
```typescript
// Change from localhost to cloud URL
const apiEndpoint = process.env.VITE_API_ENDPOINT || 
  'https://your-cloud-url/api/generate';
```

**Create .env.local for development:**
```env
VITE_API_ENDPOINT=http://localhost:3002/api/generate  # For local testing
# or
VITE_API_ENDPOINT=https://your-cloud-url/api/generate  # For production
```

---

## Comparison Table

| Feature | Local | Vercel | Firebase | AWS |
|---------|-------|--------|----------|-----|
| Setup Time | Already done | 5 min | 10 min | 15 min |
| Free Tier | Yes | Yes | Yes | Yes |
| Scaling | Manual | Auto | Auto | Auto |
| Performance | Fast (local) | Very fast | Fast | Very fast |
| CORS | Manual | Auto | Manual | Manual |
| GitHub Deploy | N/A | Yes | Yes | Yes |
| Cost Scale | $0 | $0-20/mo | $0-10/mo | Pay per use |
| Complexity | Simple | Simplest | Moderate | Moderate |

---

## Environment Variables Setup

### For Vercel
1. Dashboard → Settings → Environment Variables
2. Add `GEMINI_API_KEY`
3. Set for Production

### For Firebase
```bash
firebase functions:config:set gemini.key="your_key"
```

### For AWS
```bash
# In SAM template.yaml
Parameters:
  GeminiKey:
    Type: String
    NoEcho: true
```

---

## Testing Cloud Deployment

### Test Endpoint

```bash
# Test your cloud endpoint
curl -X POST https://your-cloud-url/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'

# Should stream back:
# data: {"text": "..."}
# data: [DONE]
```

### Test in Browser

1. Update `useAgentStream.tsx` with cloud URL
2. Open app
3. Set API key
4. Create project
5. Watch notifications appear

---

## Costs Breakdown

### Vercel (Recommended)
- **Free Tier:** 10GB bandwidth, 6GB RAM
- **Starter:** $20/month
- **Pro:** $20/month

### Firebase
- **Free:** 2M function calls/month
- **Pay as you go:** $0.40 per million invocations
- **Database (if needed):** $25/GB stored

### AWS Lambda
- **Free:** 1M requests/month
- **Price:** $0.20 per million requests
- **Very cost-effective at scale**

### DigitalOcean
- **Basic:** $12/month
- **Standard:** $24/month
- **Simple pricing, good value**

---

## Recommended Path

### For Getting Started Fast:
1. **Deploy to Vercel** (5 minutes)
   - Easiest setup
   - Free tier sufficient
   - GitHub integration

### For Production:
1. **Start with Vercel**
2. **If you need database:** Migrate to Firebase or Supabase
3. **If you need scale:** Migrate to AWS Lambda

---

## Rollback to Local

If cloud doesn't work, easily go back:

```typescript
// In src/hooks/useAgentStream.tsx
const apiEndpoint = process.env.VITE_API_ENDPOINT || 
  'http://localhost:3002/api/generate';  // Falls back to local
```

Then restart local server:
```bash
bun run server/index.ts
```

---

## Next Steps

### To Deploy Now:
1. Choose a platform (I recommend Vercel)
2. Follow the setup steps above
3. Test with curl
4. Update frontend endpoint
5. Deploy frontend to Vercel too (optional)
6. Done! 🚀

### Files to Update:
- ✅ `src/hooks/useAgentStream.tsx` - Change endpoint
- ✅ Create `api/generate.ts` (Vercel) or equivalent
- ✅ Set `GEMINI_API_KEY` in cloud dashboard
- ✅ Create `.env.local` for local development

### Don't Delete Yet:
- Keep `server/` folder for reference
- Keep `server/gemini.ts` logic (reuse in cloud)
- Keep documentation

---

## Complete Vercel Deployment Steps

### 1. Prepare Project
```bash
# Clone your repo (or use existing)
cd OnyxGPT.Code

# Make sure you have vercel.json (created above)
# Make sure you have api/generate.ts (created above)

# Install Vercel CLI
npm i -g vercel
```

### 2. Deploy
```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Or deploy directly:
vercel --prod
```

### 3. Set Environment Variable
```bash
# Via CLI
vercel env add GEMINI_API_KEY

# Or via dashboard:
# https://vercel.com/dashboard
# → Your Project → Settings → Environment Variables
# → Add GEMINI_API_KEY
```

### 4. Update Frontend
```typescript
// src/hooks/useAgentStream.tsx line 42
const apiEndpoint = 'https://your-project.vercel.app/api/generate';
```

### 5. Deploy Frontend (Optional)
```bash
# Deploy frontend to Vercel too
vercel --prod
```

---

## Troubleshooting

### CORS Error
**Solution:** Add CORS headers in cloud function
```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST');
```

### Cold Start Timeout
**Solution:** Use warm-up requests or upgrade plan
```bash
# Ping endpoint every 5 minutes
curl https://your-url/api/generate >/dev/null 2>&1
```

### API Key Not Found
**Solution:** Verify environment variable is set
```bash
# Vercel
vercel env list

# Firebase
firebase functions:config:get

# AWS
aws ssm get-parameter --name /your/key
```

### Can't Find System Prompt
**Solution:** Include prompt in function or database
```typescript
const systemPrompt = "You are an expert engineer.";  // Hardcode if needed
```

---

## Questions?

- **Vercel Docs:** https://vercel.com/docs
- **Firebase Docs:** https://firebase.google.com/docs
- **AWS Lambda:** https://docs.aws.amazon.com/lambda/

---

**Last Updated:** January 2025  
**Recommendation:** Use Vercel for simplicity ⭐
