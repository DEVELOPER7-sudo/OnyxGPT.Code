# OnyxGPT.Code - Quick Reference

## Getting Started (60 seconds)

```bash
git clone https://github.com/DEVELOPER7-sudo/OnyxGPT.Code.git
cd OnyxGPT.Code
npm install
npm run dev
```

Visit `http://localhost:5173`

---

## Essential Commands

```bash
npm run dev         # Start dev server
npm run build       # Production build
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

---

## Common Code Snippets

### Using Zustand Store

```typescript
import { useProjectStore } from '@/lib/project-store'

function MyComponent() {
  const { currentProject, updateFile, addMessage } = useProjectStore()

  // Update file
  await updateFile('/src/App.tsx', 'new content')

  // Add message to chat
  await addMessage({
    id: generateId(),
    role: 'user',
    content: 'Hello',
    timestamp: Date.now(),
  })

  return <div>{currentProject?.name}</div>
}
```

### Using Puter.js

```typescript
import { getPuterUser, kvGet, kvSet, aiChat } from '@/lib/puter-client'

// Get user
const user = await getPuterUser()

// Store data
await kvSet('key', { data: 'value' })
const data = await kvGet('key')

// Stream AI response
const response = await aiChat(messages, { stream: true })
for await (const chunk of response) {
  console.log(chunk.text)
}
```

### Theme Management

```typescript
import { useTheme } from '@/components/ThemeProvider'

function MyComponent() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button onClick={toggleTheme}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
```

### CodeMirror Integration

```typescript
import CodeMirror from '@uiw/react-codemirror'
import { typescript } from '@codemirror/lang-typescript'

<CodeMirror
  value={code}
  onChange={setCode}
  extensions={[typescript()]}
  theme={theme === 'dark' ? 'dark' : 'light'}
  height="100%"
/>
```

---

## Component Architecture

### Topbar
- Logo + editable project name
- New project button
- Export ZIP
- Share link
- Theme toggle

**File**: `src/components/Topbar.tsx`

### Sidebar
- Project list (sorted by date)
- New project button
- Delete project
- Settings button

**File**: `src/components/Sidebar.tsx`

### Chat Area
- Message list (user/assistant bubbles)
- Streaming indicator
- Input field with send button

**File**: `src/components/ChatArea.tsx`

### Code Editor
- File header with save button
- CodeMirror instance
- File selector dropdown
- Readonly during agent work

**File**: `src/components/CodeEditor.tsx`

### Preview Panel
- Iframe with E2B dev server
- Refresh button
- Open in new tab link
- Loading indicator

**File**: `src/components/PreviewPanel.tsx`

---

## State Management (Zustand)

### Store Location
`src/lib/project-store.ts`

### Available Actions
```typescript
// Projects
setCurrentProject(project)
createProject(name, description)
deleteProject(id)
updateProjectName(id, name)
loadProjects()

// Messages
addMessage(message)
clearMessages()

// Files
addFile(path, content, language)
deleteFile(path)
updateFile(path, content)
readFile(path)
updateFileTree(tree)

// Settings
updateSettings(settings)
setSandboxId(id)
```

---

## File Paths Convention

```
Project root: /

Source code:  /src/*
Styles:       /styles/* (future)
Public:       /public/* (future)
Tests:        /__tests__/* (future)

Examples:
/src/App.tsx
/src/components/Button.tsx
/src/lib/utils.ts
```

---

## Type Definitions

### Project
```typescript
interface Project {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
  ownerId: string
  messages: Message[]
  fileTree: FileNode
  e2bSandboxId?: string
  lastPreviewUrl?: string
  settings: { model?: string; temperature?: number; autoPreview: boolean }
}
```

### FileNode
```typescript
interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  content?: string  // files only
  language?: string // 'typescript', 'jsx', etc.
}
```

### Message
```typescript
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool-call' | 'tool-result'
  content: string
  timestamp: number
  toolName?: string
  toolArgs?: Record<string, any>
  toolResult?: any
  artifacts?: Artifact[]
}
```

---

## Tailwind CSS Classes

### Dark Mode
```tsx
// Automatically applied based on <html class="dark">
<div className="dark:bg-black light:bg-white">
```

### Common Utilities
```tsx
// Spacing
m-4, p-4, gap-3, space-y-2

// Sizing
w-full, h-screen, max-w-md

// Colors
bg-background, text-foreground, border-border
text-primary, bg-accent, text-accent-foreground

// Responsive
hidden md:flex, sm:inline, lg:w-1/2

// Effects
rounded-lg, shadow-lg, opacity-50
```

---

## Keyboard Shortcuts (To Implement)

- `Cmd+S` / `Ctrl+S` - Save file
- `Cmd+K` / `Ctrl+K` - Command palette
- `Escape` - Close modal/editor
- `Cmd+B` / `Ctrl+B` - Toggle sidebar
- `Cmd+Shift+D` - Toggle dev tools

---

## Debugging

### Browser DevTools
```javascript
// Check Puter availability
window.puter
  
// Access store directly
useProjectStore.getState()

// Check current project
useProjectStore.getState().currentProject

// View all projects
useProjectStore.getState().projects
```

### Log Levels
```typescript
console.log('Info')      // General info
console.warn('Warning')  // Warnings
console.error('Error')   // Errors
```

### Performance
```typescript
// Check render count
console.count('render')

// Measure time
console.time('operation')
// ... code ...
console.timeEnd('operation')
```

---

## Adding a New Feature

1. **Create component** in `src/components/`
2. **Add types** in `src/types/index.ts`
3. **Update store** in `src/lib/project-store.ts` if needed
4. **Import & use** in parent component
5. **Test locally** with `npm run dev`

### Example: Add Settings Button

```typescript
// src/components/SettingsButton.tsx
export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Settings className="w-4 h-4" />
      </Button>
      {isOpen && <SettingsModal onClose={() => setIsOpen(false)} />}
    </>
  )
}

// src/components/Topbar.tsx
import { SettingsButton } from './SettingsButton'

// In Topbar component
<SettingsButton />
```

---

## Environment & Config

### Vite Config
`vite.config.ts` - Build settings, HMR, preview port

### TypeScript Config
`tsconfig.json` - Strict mode, path aliases (@/), lib settings

### Tailwind Config
`tailwind.config.ts` - Colors, spacing, plugins, dark mode

### PostCSS Config
`postcss.config.js` - Tailwind + autoprefixer

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

ES2020 target (no IE11)

---

## Performance Tips

1. **Lazy load file contents** - Don't fetch until user opens editor
2. **Debounce preview** - 700-900ms after file change
3. **Memoize components** - `React.memo()` for expensive renders
4. **Code split** - Use `React.lazy()` for heavy components
5. **Compress files** - Gzip large files before KV save

---

## Naming Conventions

### Files
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Hooks: `useHookName.ts`

### Variables
- React state: `camelCase` (e.g., `isOpen`, `selectedFile`)
- Types: `PascalCase` (e.g., `Project`, `FileNode`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_KEY`, `MAX_SIZE`)

### CSS Classes
- Utility-first with Tailwind
- Component-scoped via Tailwind
- Dark mode with `dark:` prefix

---

## Useful Links

- **Puter.js Docs**: https://docs.puter.com/
- **E2B SDK**: https://e2b.dev/
- **React 19**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **Tailwind CSS v4**: https://tailwindcss.com/
- **CodeMirror 6**: https://codemirror.net/
- **Zustand**: https://github.com/pmndrs/zustand

---

## Getting Help

1. Check `SETUP.md` for architecture details
2. Read `PROJECT_MANIFEST.md` for implementation progress
3. Review similar components for patterns
4. Check browser console for errors
5. Search GitHub issues
6. Ask in discussions

---

## Common Errors & Fixes

### "Puter.js not available"
- Check internet connection
- Ensure HTTPS (if not localhost)
- See `PuterErrorBoundary` component

### "Cannot read property of undefined"
- Check if `currentProject` is null
- Use optional chaining: `currentProject?.name`

### "Module not found"
- Check import path (use `@/` for src root)
- Verify file exists in `src/`

### "Tailwind classes not applied"
- Ensure file is in `content` array in `tailwind.config.ts`
- Use full class name (not dynamic)
- Dark mode: ensure `dark` class on `<html>`

---

## Quick Checklist for PRs

- [ ] Code passes `npm run lint`
- [ ] Types are properly defined
- [ ] Works on mobile + desktop
- [ ] Dark/light mode compatible
- [ ] No console errors
- [ ] Commit message is descriptive
- [ ] Updated `PROJECT_MANIFEST.md` if scope changed

---

Last Updated: January 2025
