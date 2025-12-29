# 🏠 Local Storage Only Setup

This guide explains how OnyxGPT works with **local storage only** - no cloud, no backend database.

---

## Overview

```
Browser
├─ React Frontend (Vite)
├─ localStorage (Data storage)
│  ├─ API Keys
│  ├─ Projects
│  └─ Generated Files
└─ Local Backend (Node.js)
   └─ Gemini API Integration
```

**Everything stays on your computer.** ✅

---

## How It Works

### Data Storage Locations

| Data | Where Stored | Persistence |
|------|--------------|-------------|
| **API Key** | Browser localStorage | Until cleared |
| **Projects** | Browser localStorage | Until cleared |
| **Generated Files** | Browser localStorage | Until cleared |
| **AI Responses** | Browser localStorage + Memory | Session |
| **Messages** | Browser RAM | During session |

### Flow

```
1. User sets API Key
   ↓ Stored in localStorage
   
2. User creates project
   ↓ Project metadata saved to localStorage
   
3. Agent generates files
   ↓ Files saved to localStorage
   
4. User can open project
   ↓ Loaded from localStorage
   
5. User clears data
   ↓ Deleted from localStorage
```

---

## Local Backend Server

### What It Does

The local backend (`server/index.ts`) running on `localhost:3002`:
- ✅ Connects to Gemini API
- ✅ Streams AI responses
- ✅ Handles CORS
- ✅ Manages file operations

### What It Doesn't Do

- ❌ Store data permanently
- ❌ Sync across devices
- ❌ Backup to cloud
- ❌ Persist after restart

---

## Setup Instructions

### Step 1: Get Gemini API Key

1. Visit: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### Step 2: Start Local Backend

```bash
# Terminal 1: Start backend
bun run server/index.ts

# Should show:
# "🦊 Open Lovable server is running at 0.0.0.0:3002"
```

### Step 3: Start Frontend

```bash
# Terminal 2: Start frontend
npm run dev

# Should show:
# "VITE v5.x ready in XXX ms"
# "Local: http://localhost:5173"
```

### Step 4: Open App

1. Open: http://localhost:5173
2. Click "Set API Key" button (top right)
3. Paste your Gemini API key
4. Click "Save Key"
5. ✅ Success! Key saved to localStorage

### Step 5: Create Project

1. Type project description: "A simple todo app"
2. Click send button
3. Wait for AI response
4. Files appear in editor

---

## Data Management

### Where Data is Stored

**Browser localStorage:**
```javascript
// View in DevTools:
F12 → Application → Local Storage → http://localhost:5173

// Keys:
gemini_api_key              // Your API key
project_<uuid>              // Each project
project_<uuid>_files        // Project files
```

### Viewing Your Data

```javascript
// In browser console (F12):

// View API key
localStorage.getItem('gemini_api_key');

// View all projects
Object.keys(localStorage).filter(k => k.startsWith('project_'));

// View project data
JSON.parse(localStorage.getItem('project_<uuid>'));
```

### Clearing Data

```javascript
// In browser console:

// Clear API key only
localStorage.removeItem('gemini_api_key');

// Clear specific project
localStorage.removeItem('project_<uuid>');

// Clear ALL data
localStorage.clear();
```

Or use the UI:
- Click "Set API Key" → Click X button to clear key
- Click project "Delete" button to remove project

---

## File Storage Details

### Project Structure in localStorage

```javascript
localStorage['project_123e4567'] = {
  id: "123e4567...",
  prompt: "Create a todo app",
  model: "gemini-2.5-pro",
  files: {
    "src/App.tsx": {
      path: "src/App.tsx",
      content: "export default function App() { ... }"
    },
    "src/style.css": {
      path: "src/style.css",
      content: "body { ... }"
    }
  },
  messages: [
    { type: "thinking", content: "I'll create..." },
    { type: "narrative", content: "Here's what I built..." }
  ],
  createdAt: "2025-01-15T10:30:00Z"
}
```

### Storage Limits

**Browser localStorage Limits:**
- Chrome: ~10 MB
- Firefox: ~10 MB
- Safari: ~5 MB

**Impact:**
- Small projects: Unlimited
- Medium projects (10-20 files): OK
- Large projects (100+ files): May hit limit
- Solution: Delete old projects to free space

### Export Projects (Manual Backup)

```javascript
// In browser console:

// Get all projects
const projects = Object.keys(localStorage)
  .filter(k => k.startsWith('project_'))
  .map(k => ({
    key: k,
    data: JSON.parse(localStorage.getItem(k))
  }));

// Download as JSON
const json = JSON.stringify(projects, null, 2);
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'projects-backup.json';
a.click();
```

---

## API Key Management

### Where Key is Stored

**Browser localStorage:**
```
Key: gemini_api_key
Value: AIza...your_key...
Scope: Per domain (localhost:5173)
Security: Not encrypted, plain text
```

### Setting API Key

**Via UI (Recommended):**
1. Click "Set API Key" button
2. Enter your key
3. Click "Save Key"
4. See ✅ success toast

**Via localStorage directly:**
```javascript
localStorage.setItem('gemini_api_key', 'AIza...your_key...');
```

### Environment Variable (Optional)

You can set API key in `.env` file:

```env
# .env.local
GEMINI_API_KEY=AIza...your_key...
```

Then in `server/gemini.ts` it will use this. But localStorage takes precedence in the UI.

### Security Notes

⚠️ **Important:**
- localStorage is **NOT encrypted**
- Don't use on shared computers
- Clear cache to remove key: F12 → Application → Clear Site Data
- Better for: Personal development machines
- Not for: Enterprise/shared devices

---

## Backend Server Details

### Running Locally

```bash
bun run server/index.ts
```

**What happens:**
1. Starts Elysia server on port 3002
2. Loads system prompt from `system-prompt.md`
3. Initializes Gemini API connection
4. Ready to receive requests

### Endpoints

#### POST /api/generate
```
Request:
{
  "prompt": "Create a button component"
}

Response (Server-Sent Events):
data: {"text": "I'll create a button..."}
data: {"text": " with Tailwind..."}
data: [DONE]
```

#### GET /
Health check:
```
Response: "Open Lovable Server is running"
```

#### Other Endpoints
- POST /api/create-project
- DELETE /api/delete-project/:projectId
- POST /api/install-dependency
- POST /api/update-file
- etc.

---

## Workflow: Local Storage Only

### Development Workflow

```bash
# Step 1: Start backend
bun run server/index.ts
# Keep this running in Terminal 1

# Step 2: Start frontend
npm run dev
# Runs in Terminal 2

# Step 3: Open browser
# http://localhost:5173

# Step 4: Create projects, generate files
# Everything stored in localStorage

# Step 5: Close browser/computer
# Data remains in localStorage until cleared
```

### Persistence

**Data persists:**
- ✅ After closing browser
- ✅ After closing tab
- ✅ After restarting computer
- ✅ Until you clear cache/localStorage

**Data is lost when:**
- ❌ Browser cache cleared
- ❌ localStorage manually cleared
- ❌ Browser privacy/incognito mode
- ❌ Browser data deleted

---

## Backup & Restore

### Manual Backup

```bash
# Export all data
# (Use the JavaScript export example above)
# Save as: projects-backup.json
```

### Manual Restore

```javascript
// In browser console:

// 1. Load backup file
const backup = /* Paste JSON from backup */;

// 2. Restore to localStorage
backup.forEach(item => {
  localStorage.setItem(item.key, JSON.stringify(item.data));
});

// 3. Refresh page
location.reload();
```

### Automatic Backup (Browser Built-in)

Some browsers offer:
- Export bookmarks (not applicable)
- Sync data (not working for localStorage)
- Cloud backup (but data stays local)

---

## Offline Capability

OnyxGPT **works offline** for:
- ✅ Viewing projects
- ✅ Editing files (in future update)
- ✅ Browsing generated code
- ❌ Creating NEW projects (needs Gemini API)
- ❌ Regenerating files

---

## Troubleshooting

### "API Key not found"
```
Error: Please set your Gemini API key first

Solution:
1. Click "Set API Key" button
2. Get key from https://aistudio.google.com/app/apikey
3. Paste key and save
```

### "Failed to fetch from localhost:3002"
```
Error: Failed to fetch

Solution:
1. Check backend is running: bun run server/index.ts
2. Check port 3002 is free
3. Check firewall isn't blocking it
4. Restart backend
```

### "Projects don't appear"
```
Solution:
1. Check F12 → Application → Local Storage
2. Look for keys starting with "project_"
3. If empty, localStorage is cleared
4. Recreate projects
```

### "Can't clear data"
```
Solution:
1. Open DevTools: F12
2. Application → Local Storage
3. Right-click → Delete
4. Or: Run in console: localStorage.clear()
5. Refresh page
```

### "Browser ran out of storage"
```
Error: QuotaExceededError

Solution:
1. Delete old projects (UI: Delete button)
2. Or: localStorage.clear() in console
3. Or: Use different browser (larger quota)
4. Note: Each project takes ~50KB-500KB
```

---

## Performance

### Load Times

| Operation | Time |
|-----------|------|
| Start server | 1-2s |
| Start frontend | 3-5s |
| Load project | < 100ms |
| Create project | 2-5s (Gemini) |
| Save to localStorage | < 10ms |

### Memory Usage

| Component | RAM |
|-----------|-----|
| Backend server | 50-100 MB |
| Frontend app | 30-50 MB |
| localStorage (10 projects) | ~5 MB |
| **Total** | **~100-150 MB** |

---

## Limits & Constraints

### localStorage Limits
- **Size:** 5-10 MB per domain
- **Items:** Thousands of key-value pairs
- **Scope:** Per domain (localhost:5173 separate from example.com)

### Project Limits
- **Max projects:** ~20-50 (depends on file count)
- **Max files per project:** 100+ (depends on content size)
- **Max file size:** ~1 MB per file

### Solution for Large Projects
- Split into multiple smaller projects
- Delete old projects to free space
- Use `.gitignore` to exclude large files

---

## Comparison: Local vs Cloud

| Feature | Local Storage | Cloud Server |
|---------|-------|------|
| Setup | 5 min | 10 min |
| Persistence | Browser | Database |
| Offline Access | Yes (read-only) | No |
| Multi-device | ❌ | ✅ |
| Backup | Manual | Auto |
| Cost | Free | Free-$20 |
| Privacy | 100% | Provider dependent |
| Storage Limit | 5-10 MB | 100+ GB |
| Performance | Fast | Depends |

---

## Future: Add Cloud Backup (Optional)

If you want cloud backup later:

1. Keep this local setup working
2. Add optional "Backup to Cloud" button
3. Export localStorage to cloud storage
4. Import back when needed

---

## Files Overview

### Frontend
- `src/` - React components & pages
- `src/hooks/useAgentStream.tsx` - AI streaming
- `src/hooks/useApiKey.ts` - API key management
- `src/lib/projectStorage.ts` - localStorage interface
- `src/store/projectStore.ts` - Zustand state management

### Backend
- `server/index.ts` - Express/Elysia server
- `server/gemini.ts` - Gemini API integration
- `system-prompt.md` - AI system prompt

### Configuration
- `.env.local` - Local environment
- `vite.config.ts` - Vite build config
- `tsconfig.json` - TypeScript config

---

## Quick Reference Commands

```bash
# Start backend
bun run server/index.ts

# Start frontend
npm run dev

# Build for production (local)
npm run build

# Preview build
npm run preview

# Stop server
Ctrl+C

# Clear all data (browser console)
localStorage.clear()

# Export backup (browser console)
# See "Backup & Restore" section above
```

---

## Support & Documentation

- **API Key Setup:** `API_KEY_SETUP.md`
- **Troubleshooting:** `STREAM_ERROR_DEBUGGING.md`
- **Features:** `FEATURES.md`
- **Architecture:** `ARCHITECTURE.md`

---

## Summary

✅ **Everything stays local**
- Data in browser localStorage
- Backend on your machine
- No cloud, no sync, no backup

✅ **Simple to use**
- Set API key in UI
- Create projects
- View generated code

✅ **Private & offline**
- All data on your device
- No remote storage
- Works offline (read-only)

⚠️ **Limitations**
- Storage limited to browser (5-10 MB)
- Manual backup required
- Single device only
- Data lost if localStorage cleared

---

**Status:** ✅ Local Storage Only Setup Complete

**Ready to use?** Start with `QUICK_START.md`

---

**Last Updated:** January 2025
