# Migration Guide: Open Lovable → OnyxGPT.Code

## Overview

OnyxGPT.Code is a major update that transforms Open Lovable with the following key changes:

1. **App Name:** Open Lovable → OnyxGPT.Code
2. **AI Provider:** Google Gemini API → Puter AI API (no API key required)
3. **Configuration:** Hardcoded Gemini models → Custom model ID & sandbox API in Settings
4. **Dependencies:** Removed `@google/generative-ai`, added `immer`

## What Changed

### Backend Changes

#### Replaced `server/gemini.ts` with `server/puter.ts`
- **Old:** Used Google Generative AI SDK with hardcoded API key and model
- **New:** Uses Puter AI API with OpenAI-compatible streaming format
- **Benefits:** 
  - No API key required
  - Supports any OpenAI-compatible endpoint
  - Configurable model selection

#### Updated `server/index.ts`
- Changed import from `./gemini` to `./puter`
- API endpoint now accepts optional `modelId` and `sandboxApi` parameters
- All hardcoded Gemini model references removed
- Server name updated to "OnyxGPT.Code"

### Frontend Changes

#### New Settings Store: `src/store/settingsStore.ts`
- Persistent storage for user preferences
- **Configuration Options:**
  - `modelId`: Default is `gpt-4o` (customizable in Settings)
  - `sandboxApi`: Default is `https://api.puter.com/ai/text/generate` (customizable in Settings)
- Uses Zustand with `persist` middleware to save settings

#### Updated `src/pages/Index.tsx`
- **New SettingsDialog Component:**
  - Access via settings icon in the header
  - Configure custom model ID
  - Configure custom API endpoint
  - Settings are persisted to localStorage
- **PromptInput Component:**
  - Removed hardcoded Gemini model selector
  - Now uses settings from `useSettingsStore`
  - Sends `modelId` and `sandboxApi` to backend
- **Header Component:**
  - App name changed to "OnyxGPT.Code"
  - Added Settings button

#### Updated `src/pages/EditorPage.tsx`
- Header text updated to "OnyxGPT.Code"
- No functional changes needed for streaming

#### Updated `src/hooks/useAgentStream.tsx`
- Now imports and uses `useSettingsStore`
- Passes `modelId` and `sandboxApi` to `/api/generate` endpoint
- Settings are reactive dependencies in the useEffect hook

### Package Changes

**Removed:**
- `@google/generative-ai` - No longer needed

**Added:**
- `immer` - Required by Zustand's persist middleware

**Dependencies that remain:**
- All other dependencies unchanged
- Full compatibility with existing UI framework (shadcn/ui, etc.)

## Configuration

### Default Configuration

OnyxGPT.Code works **out of the box** with zero configuration:
- **Default Model:** `gpt-4o`
- **Default API:** Puter AI API at `https://api.puter.com/ai/text/generate`
- **API Key:** Not required

### Custom Configuration

Access Settings via the gear icon in the header:

1. **Custom Model ID:**
   - Input any model identifier
   - Examples: `gpt-4o`, `gpt-4-turbo`, `claude-3-opus`, etc.
   - Setting persists in localStorage

2. **Custom API Endpoint:**
   - Input any OpenAI-compatible API endpoint
   - Examples:
     - `https://api.openai.com/v1/chat/completions`
     - `https://api.anthropic.com/v1/messages`
     - Any local or self-hosted LLM endpoint
   - Must be OpenAI-compatible streaming format
   - Setting persists in localStorage

## How to Use

### First Time Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/aniketdandagavhan/OnyxGPT.Code.git
   cd OnyxGPT.Code
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development servers:
   ```bash
   bun run dev
   ```

4. Open `http://localhost:8080` in your browser

### Using with Custom API

1. Click the **Settings** icon (gear) in the header
2. Enter your custom **Model ID** (e.g., `gpt-4-turbo`)
3. Enter your custom **API Endpoint**
4. Click **Save Settings**
5. Create a new project - it will use your custom settings

### Using with Puter AI (Default)

No setup needed! Just start creating projects immediately.

## Migration from Open Lovable

If you have existing Open Lovable projects:

### Database Changes
- Projects saved in the previous version are still compatible
- No migration script needed - projects will work as-is
- Settings are stored separately in `onyxgpt-settings` localStorage key

### Code Changes
- If you've customized the codebase, focus on:
  - Any files importing from `./server/gemini.ts` → update to `./server/puter.ts`
  - Any hardcoded Gemini API logic → move to Settings store
  - Any UI that displays Gemini branding → replace with OnyxGPT.Code

## API Compatibility

### What Changed

**Old (Gemini):**
```typescript
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
const result = await chat.sendMessageStream(prompt);
```

**New (Puter/OpenAI-compatible):**
```typescript
const response = await fetch(sandboxApi, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: modelId,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    stream: true,
  }),
});
```

### Benefits
- Works with any OpenAI-compatible API
- No vendor lock-in
- Easy to switch providers
- Settings UI for non-technical users

## Troubleshooting

### "API Error" when creating a project

**Solution:** Verify your Settings:
1. Check that Model ID is not empty
2. Check that API Endpoint is correct and accessible
3. If using custom endpoint, ensure it's OpenAI-compatible
4. Default Puter API should work without any configuration

### Settings not persisting

**Solution:**
- Clear browser cache/localStorage
- Verify localStorage is enabled
- Check browser console for errors

### Custom API endpoint returns 401/403

**Solution:**
- Verify the endpoint URL is correct
- Check if the endpoint requires authentication
- Some endpoints may need additional headers in `src/hooks/useAgentStream.tsx`

## Support

For issues or questions:
1. Check the [README.md](./README.md) for general information
2. Review [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) (this file)
3. Open an issue on GitHub

## Future Development

Planned improvements:
- [ ] More AI provider integrations
- [ ] Authentication for custom APIs
- [ ] Model parameter customization (temperature, max_tokens, etc.)
- [ ] Provider-specific configuration templates
- [ ] Request/response logging for debugging

---

**Version:** 1.0.0 (OnyxGPT.Code)  
**Last Updated:** Dec 2024
