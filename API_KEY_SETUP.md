# API Key Setup & Notifications System

## Overview

The application now has a complete API key management system with toast notifications for all operations.

## Features Added

### 1. **API Key Input Dialog** (`src/components/ApiKeyInput.tsx`)
- Secure input field with show/hide toggle
- Save key to browser localStorage
- Clear key functionality
- Toast notifications for all actions
- Enter key support for quick save
- Privacy notice showing keys are stored locally only

### 2. **Toast Notifications** (via Sonner)
The app now shows beautiful notifications at critical points:

#### API Key Notifications:
- ✅ "API Key Saved" - When key is successfully saved
- ✅ "API Key Loaded" - When starting agent with valid key
- ❌ "Missing API Key" - When trying to generate without key
- ❌ "Empty Key" - When trying to save empty key
- ℹ️ "API Key Cleared" - When key is removed

#### Agent Stream Notifications:
- ✅ "API Key Loaded" - Key loaded from storage
- ⏳ "Agent responding..." - While streaming
- ✅ "Agent Complete" - Response finished successfully
- ❌ "Server Error" - API/backend errors
- ❌ "API Error" - Gemini API errors
- ❌ "Stream Error" - Network/stream issues

### 3. **Enhanced Error Handling**
- Better error messages in toast notifications
- Detailed console logging for debugging
- API errors are captured and displayed to users
- Stream timeouts with clear messaging

---

## How to Use

### For Users

#### Step 1: Get a Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

#### Step 2: Set API Key in App
1. Click the **"API Key Set"** or **"Set API Key"** button in the top-right corner
2. Paste your Gemini API key in the dialog
3. Click **"Save Key"** (or press Enter)
4. You'll see a success notification
5. The key is now stored in your browser

#### Step 3: Create Projects
1. In the prompt box, describe your project
2. Select a Gemini model (2.0 Flash, 2.5 Flash, or 2.5 Pro)
3. Click the send button
4. Watch notifications appear as the agent works

### For Developers

#### Environment Variable Setup

**Option 1: Browser Storage (Recommended for Users)**
```
No setup needed. Users enter their key via the UI.
```

**Option 2: Server-Side Environment Variable**
```bash
# Create .env file in project root
GEMINI_API_KEY=your_api_key_here
```

Then the server will use this key automatically:
```typescript
const apiKey = process.env.GEMINI_API_KEY;
```

#### To Verify Setup is Working

1. Open browser DevTools (F12)
2. Go to "Application" → "Local Storage"
3. Look for key: `gemini_api_key`
4. If present, API key is saved

Check server logs for:
```
Generate API called with prompt: ...
System prompt loaded, length: XXXX
Streaming response chunks...
Chunk 1: XXXX characters
...
Stream complete. Total chunks: XX
```

---

## Code Files Modified

### Frontend
1. **src/App.tsx**
   - Added Sonner Toaster component
   - Positioned notifications at top-right

2. **src/components/ApiKeyInput.tsx**
   - Enhanced UI with privacy notice
   - Added toast notifications
   - Enter key support
   - Better validation

3. **src/hooks/useAgentStream.tsx**
   - API endpoint fixed (localhost:3002)
   - Toast notifications for all states
   - Better error handling
   - Enhanced console logging

### Backend
1. **server/index.ts**
   - Async error handling in stream
   - Better error responses

2. **server/gemini.ts**
   - System prompt properly integrated
   - Detailed logging for debugging
   - Error message improvement

### Configuration
1. **.env** - Created with GEMINI_API_KEY placeholder

---

## Notification Positions & Styling

All notifications appear in the **top-right corner** with:
- ✅ Green for success
- ❌ Red for errors
- ⏳ Blue for loading
- ℹ️ Blue for info

Notifications auto-dismiss after:
- Success: 2-3 seconds
- Error: 5 seconds
- Loading: Manual (stays until stream completes)

---

## API Key Security

### What We Do Right ✅
- Keys stored **only in browser localStorage**
- Never sent to our servers
- Users can clear anytime
- Privacy notice displayed clearly

### What Users Should Know ⚠️
- localStorage is cleared when cache is cleared
- localStorage is not encrypted
- Don't share API keys in screenshots/logs
- Use browser incognito for privacy

---

## Debugging Guide

### Notification Not Showing?
- Check: Is Toaster component in App.tsx?
- Check: Is "sonner" package installed?
- Browser console should show no errors

### API Key Not Saving?
- Check localStorage: F12 → Application → Local Storage
- Try clearing cache and re-entering key
- Check for localStorage quota errors in console

### Notifications But No Response?
- Check server is running: `bun run server/index.ts`
- Check GEMINI_API_KEY env variable set
- Check API key is valid
- Look at server logs for streaming details

### Stream Timeout?
- Check internet connection
- Check API rate limits on Google AI Studio
- Check prompt length isn't too long
- Try a simpler prompt first

---

## Example User Flow

```
User clicks "Set API Key"
    ↓
Dialog opens, user pastes key
    ↓
User clicks "Save Key"
    ↓
✅ Toast: "API Key Saved"
    ↓
User enters project description
    ↓
User clicks send
    ↓
✅ Toast: "API Key Loaded"
    ↓
⏳ Toast: "Agent responding..."
    ↓
Agent streams response chunks
    ↓
✅ Toast: "Agent Complete"
    ↓
Files appear in editor panel
```

---

## Future Improvements

- [ ] Save multiple API keys
- [ ] Switch between different API providers
- [ ] Show API key usage/quota
- [ ] Add import/export settings
- [ ] Keyboard shortcuts for API key dialog
- [ ] API key validation before save
