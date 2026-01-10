# Configuration Guide - OnyxGPT.Code

Complete guide to configuring OnyxGPT.Code for optimal use.

## Environment Setup

### Development Environment

```bash
# .env.development (create if needed)
VITE_API_KEY_PUTER=your_puter_key_here # Optional, usually auto-detected
NODE_ENV=development
```

### Production Environment

```bash
# .env.production
VITE_API_KEY_PUTER=your_puter_key_here # Optional
NODE_ENV=production
```

## In-App Configuration

All configuration is done through the Settings dialog (⚙️ icon) in the application.

### Settings Panel

#### 1. AI Model Selection

**Location**: Settings → AI Model

**Available Models**:
- **GPT Models**:
  - `gpt-5-nano` - Fast & efficient for simple tasks
  - `gpt-4o-mini` - Balanced performance (recommended)
  - `gpt-4o` - Most capable for complex tasks

- **Claude Models**:
  - `claude-sonnet-4` - Excellent coding support
  - `claude-3-5-sonnet` - Fast & smart

- **Google Models**:
  - `gemini-2.5-flash` - Quick responses
  - `gemini-2.5-pro` - Advanced reasoning

- **Meta Models**:
  - `llama-4-maverick` - Open source option

**Custom Models**:
- Enter any model ID from Puter.js supported models
- Format: `provider-model-version` (e.g., `openai-gpt-4-turbo`)

**Recommended**:
- For code generation: `claude-sonnet-4` or `gpt-4o`
- For quick responses: `gpt-4o-mini` or `gemini-2.5-flash`
- For custom needs: Use custom model ID

#### 2. Temperature Setting

**Location**: Settings → Temperature

**Range**: 0 (Precise) to 2 (Creative)

| Value | Behavior | Use Case |
|-------|----------|----------|
| 0.0 - 0.5 | Deterministic, precise | Code generation, critical logic |
| 0.7 | Balanced | Default, most applications |
| 1.0 - 1.5 | More creative | Content generation, ideation |
| 1.5 - 2.0 | Very creative | Creative writing, brainstorming |

**Recommended**:
- Default: `0.7` (balanced)
- Code: `0.5` (more precise)
- Creative: `1.2` (more varied)

#### 3. E2B Sandbox API Key

**Location**: Settings → Sandbox API Key (E2B)

**Required For**:
- Live preview of generated code
- Sandbox terminal execution
- Running applications
- File operations in sandbox

**How to Get API Key**:
1. Go to https://e2b.dev
2. Sign up for free account
3. Create new API key in dashboard
4. Copy the key (format: `e2b_xxx...`)

**Configuration**:
1. Open Settings (⚙️)
2. Paste E2B API key in "Sandbox API Key" field
3. Click "Save Settings"
4. Test by generating code and clicking "Preview"

**Key Features**:
- Execute Node.js/Python code
- Run servers (npm, Python, etc.)
- File system access
- Terminal commands
- Persistent storage during session

#### 4. Auto Preview

**Location**: Settings → Auto Preview

**Options**:
- **Enabled** (default): Automatically refresh preview when code changes
- **Disabled**: Manual refresh using button

**Recommended**:
- Enable for better development experience
- Disable if experiencing performance issues

## Puter.js Configuration

### Authentication

Puter.js handles authentication automatically:

1. **First Visit**: Anonymous session created
2. **Sign In**: Click "Sign In" button for persistent account
3. **Benefits of Sign In**:
   - Projects save to cloud
   - Access projects across devices
   - Longer session retention
   - Advanced features

### Project Storage

**Default Behavior**:
- Projects auto-save to Puter.js KV (if signed in)
- Fallback to localStorage (if offline)
- Auto-sync when connection restored

**Project Files**:
```
Projects stored as:
- Key: `onyxgpt:project:{project_id}`
- Value: Entire project JSON
- Size limit: Usually 5MB per project
```

### Cloud Sync

**What Syncs**:
- Project metadata (name, created/updated dates)
- Chat messages
- Generated code
- File structure
- Project settings

**What Doesn't Sync**:
- User settings (kept in browser localStorage)
- Active session state
- Temporary cache

## System Prompt Customization

### Current System Prompt

Location: `src/lib/systemPrompt.ts`

**Current Configuration**:
- React 19, Tailwind 4, TypeScript
- Responsive + dark mode by default
- shadcn/ui components
- Modern functional components
- Markdown code block format required

**To Customize**:

```typescript
// src/lib/systemPrompt.ts

export const SYSTEM_PROMPT = `Your custom prompt here...`;
```

### System Prompt Best Practices

1. **Be Specific**: Describe exactly what you want
2. **Include Examples**: Show code examples
3. **Specify Libraries**: List preferred libraries
4. **Define Standards**: Code style, naming conventions
5. **Set Constraints**: No external APIs, use only built-in modules, etc.

### Example Custom Prompts

**For Vue.js**:
```
You are a Vue.js specialist...
- Vue 3 with Composition API
- TypeScript
- Tailwind CSS
- Use shadcn-vue components
```

**For Python**:
```
You are a Python specialist...
- Use FastAPI for backend
- Use SQLAlchemy for ORM
- Use Pydantic for validation
- Include type hints
```

## Code Block Format

The system expects code in this format:

```typescript
// filepath: /src/components/Example.tsx
import React from 'react';

export const Example = () => {
  return <div>Example</div>;
};

export default Example;
```

**Format Rules**:
1. Start with `// filepath: {path}`
2. Include complete file content
3. All imports and exports required
4. TypeScript/JavaScript syntax correct
5. File path must be valid

## E2B Sandbox Configuration

### Sandbox Initialization

```typescript
// src/services/e2bService.ts

sandbox = await Sandbox.create({ 
  apiKey: 'your_key',
  timeout: 60 * 60 * 1000, // 1 hour
});
```

### Supported Commands

**Node.js**:
```bash
npm install
npm run dev
npm run build
node script.js
```

**Python**:
```bash
pip install package
python script.py
python -m http.server 8000
```

**System**:
```bash
bash
sh
curl
wget
ls, cd, mkdir, etc.
```

### File Operations

**Write File**:
```typescript
await writeFile('/path/to/file.txt', 'content', apiKey);
```

**Read File**:
```typescript
const content = await readFile('/path/to/file.txt', apiKey);
```

**List Files**:
```typescript
const files = await listFiles('/path', apiKey);
```

## Project Structure Customization

### Default File Tree

Projects create files in this structure:

```
/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

### Customize Structure

Modify `extractCodeBlocks` in `src/lib/systemPrompt.ts` to parse different folder structures.

## Browser Local Storage

### What's Stored

1. **Settings**:
   - AI model selection
   - Temperature
   - E2B API key
   - Auto preview preference

2. **Projects** (if offline):
   - Full project data
   - Chat history
   - File content

3. **User Preferences**:
   - Theme (if implemented)
   - Last visited project
   - Sidebar state

### Clear Storage

```javascript
// In browser console
localStorage.clear();
```

### Storage Limit

- **Chrome/Firefox**: 5-10MB per domain
- **Safari**: 5MB per domain
- **Fallback**: IndexedDB for larger data

## API Integration Points

### Puter.js APIs Used

```typescript
// Authentication
window.puter.auth.getUser()
window.puter.auth.signIn()
window.puter.auth.signOut()

// Key-Value Storage
window.puter.kv.set(key, value)
window.puter.kv.get(key)
window.puter.kv.list(prefix)
window.puter.kv.del(key)

// AI Chat
window.puter.ai.chat(messages, options)
```

### E2B APIs Used

```typescript
// Sandbox
Sandbox.create({ apiKey, timeout })

// Process Execution
sandbox.process.run({ command, args })

// File Operations
sandbox.files.write(path, content)
sandbox.files.read(path)

// Sandbox Management
sandbox.kill()
```

## Performance Tuning

### Debounce Settings

Current: 1.5 seconds for auto-save

**Adjust in `src/pages/Project.tsx`**:
```typescript
useAutoSave(currentProject, {
  debounceMs: 1500, // Change this value
  onSave: saveProject,
});
```

**Recommendations**:
- Slower connection: 2000ms or higher
- Fast connection: 1000ms or lower
- Default: 1500ms (balanced)

### Streaming Settings

**Current**: Streaming enabled with fallback

**To Disable Streaming**:
```typescript
// In usePuter.ts, modify chat function
// Remove onChunk callback handling
```

### Memory Management

**Sandbox Cleanup**:
```typescript
// Auto-kill after 1 hour
timeout: 60 * 60 * 1000

// Manual cleanup
await killSandbox();
```

## Troubleshooting Configuration

### Issue: Projects Not Saving

**Check**:
1. Verify Puter.js loaded (check console)
2. Sign in to save to cloud
3. Check localStorage quota
4. Clear browser cache

**Fix**:
```javascript
// Force refresh auth
localStorage.clear();
location.reload();
```

### Issue: E2B Sandbox Not Working

**Check**:
1. API key correct in settings
2. API key has valid credits
3. No network/firewall blocking
4. Sandbox region available

**Fix**:
```typescript
// Test connection
const sandbox = await initE2BSandbox(apiKey);
if (!sandbox) console.error('Failed to init');
```

### Issue: AI Not Generating Code

**Check**:
1. Model selected correctly
2. Puter.js is loaded
3. User signed in for some models
4. Rate limits not exceeded

**Fix**:
1. Refresh page
2. Sign in again
3. Try different model
4. Check browser console for errors

## Advanced Configuration

### Custom Build

```bash
# Development with source maps
npm run build:dev

# Production optimized
npm run build

# Check bundle size
npm run build -- --report
```

### TypeScript Configuration

Location: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "jsx": "react-jsx"
  }
}
```

### Tailwind Configuration

Location: `tailwind.config.ts`

Customize colors, spacing, fonts, etc.

### Vite Configuration

Location: `vite.config.ts`

Set build options, dev server port, proxy, etc.

## Support & Resources

- **Puter.js Docs**: https://docs.puter.com
- **E2B Docs**: https://docs.e2b.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs/

## Configuration Checklist

- [ ] E2B API key configured for sandbox features
- [ ] Preferred AI model selected
- [ ] Temperature set for your use case
- [ ] Auto preview enabled/disabled based on preference
- [ ] Signed in to Puter.js for cloud sync
- [ ] Browser storage quota sufficient
- [ ] Network/firewall allows E2B connections
- [ ] System prompt customized if needed
- [ ] Debounce timing appropriate for connection speed
