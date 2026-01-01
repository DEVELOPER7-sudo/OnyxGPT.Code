# OnyxGPT.Code - Project Manifest

## Overview

A complete, beautiful, fast Lovable.dev-style AI app builder using:
- **React 19** + Vite + TypeScript
- **Tailwind CSS v4** + dark mode
- **@uiw/react-codemirror** (CodeMirror 6)
- **Puter.js v2** (cloud operations)
- **E2B SDK** (code execution)

**Status**: Phase 1 Foundation Complete ✅

---

## Implementation Progress

### ✅ Phase 1: Shell & Foundation (COMPLETE)

- [x] Vite + React 19 + TypeScript setup
- [x] Tailwind CSS v4 configuration
- [x] Dark/light mode system with CSS variables
- [x] Puter.js v2 script tag + error boundary
- [x] Three-panel resizable layout
- [x] Basic responsive mobile fallback
- [x] Topbar with project name, theme toggle
- [x] Sidebar with project list, new project button
- [x] Chat area placeholder with message input
- [x] Live preview panel with refresh
- [x] CodeMirror editor integration

### 🔶 Phase 2: Project & Storage (IN PROGRESS)

- [x] Project data model (TypeScript types)
- [x] Zustand store setup
- [x] Puter KV persistence (metadata)
- [x] Puter FS (file contents)
- [ ] File tree UI components
- [ ] File context menu (rename, delete)
- [ ] New file/folder dialogs
- [ ] Drag-and-drop file tree

### 🔴 Phase 3: Core Chat & Streaming (TODO)

- [ ] Streaming message rendering
- [ ] Markdown support in chat
- [ ] Code block syntax highlighting
- [ ] Copy button on code blocks
- [ ] Artifact cards with diffs
- [ ] Tool call visualization

### 🔴 Phase 4: Agent Tool Protocol (TODO)

- [ ] System prompt integration
- [ ] Tool call parsing (markdown format)
- [ ] `writeFile(path, content)`
- [ ] `readFile(path)`
- [ ] `deleteFile(path)`
- [ ] `runCommand(cmd, timeout)`
- [ ] `startDevServer()`
- [ ] `takeScreenshot()`
- [ ] Tool result appending
- [ ] Error handling & recovery

### 🔴 Phase 5: E2B Integration (TODO)

- [ ] Lazy sandbox creation
- [ ] File sync (diff-based)
- [ ] Dev server command selection
- [ ] Iframe auto-refresh
- [ ] Debounced preview updates
- [ ] Sandbox restart/cleanup

### 🔴 Phase 6: Code Editor Polish (TODO)

- [ ] TypeScript/JSX syntax highlighting
- [ ] Basic autocompletion
- [ ] Keyboard shortcuts (Ctrl+S)
- [ ] File tree synchronization
- [ ] Readonly state during agent work
- [ ] Theme sync with app

### 🔴 Phase 7: Templates & Delight (TODO)

- [ ] 8 hardcoded starter templates
- [ ] Template selection UI
- [ ] Undo/redo (12-snapshot history)
- [ ] Project branching
- [ ] Security warnings
- [ ] Error recovery

### 🔴 Phase 8: Settings & Extras (TODO)

- [ ] Settings panel
- [ ] Model selection (GPT-4, Claude, etc.)
- [ ] Temperature slider
- [ ] Share link generation
- [ ] ZIP export with README

---

## File Structure

```
OnyxGPT.Code/
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── App.tsx           # Main app wrapper
│   │   ├── Topbar.tsx        # Header with logo, name, buttons
│   │   ├── Sidebar.tsx       # Project list & new project
│   │   ├── ChatArea.tsx      # Messages + input
│   │   ├── CodeEditor.tsx    # CodeMirror integration
│   │   ├── PreviewPanel.tsx  # Live preview iframe
│   │   ├── Button.tsx        # Reusable button component
│   │   ├── ThemeProvider.tsx # Dark/light mode context
│   │   └── PuterErrorBoundary.tsx  # Puter.js error handling
│   ├── lib/
│   │   ├── puter-client.ts   # Puter.js wrapper (auth, KV, FS, AI)
│   │   ├── e2b-client.ts     # E2B SDK wrapper (sandbox)
│   │   ├── project-store.ts  # Zustand store (state + Puter sync)
│   │   └── utils.ts          # Helpers (cn, generateId, formatTime)
│   ├── types/
│   │   └── index.ts          # TypeScript definitions
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Root component
│   └── index.css             # Global styles + CSS variables
├── index.html                # HTML with Puter.js script tag
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript config
├── tailwind.config.ts        # Tailwind CSS config
├── postcss.config.js         # PostCSS + Tailwind
├── package.json              # Dependencies
├── README.md                 # Feature overview & quick start
├── SETUP.md                  # Architecture & development guide
├── DEPLOYMENT.md             # Deployment options & CI/CD
├── PROJECT_MANIFEST.md       # This file
├── init-github.sh            # GitHub repo initialization
├── .gitignore                # Git ignore rules
└── .env.example              # Environment variables template
```

---

## Key Components

### Puter.js Integration (`src/lib/puter-client.ts`)

```typescript
// Authentication
const user = await getPuterUser()

// Key-Value Store (project metadata)
await kvSet(`onyx:project:${id}`, project)
const project = await kvGet(`onyx:project:${id}`)
const keys = await kvList('onyx:project:*')

// File System (code contents)
await fsWriteFile('/onyx/projects/{id}/src/App.tsx', content)
const content = await fsReadFile('/onyx/projects/{id}/src/App.tsx')

// LLM (streaming chat)
const response = await aiChat(messages, { stream: true })
for await (const chunk of response) {
  // Process streaming chunks
}

// Alerts
await uiAlert('Project saved!')
```

### State Management (`src/lib/project-store.ts`)

```typescript
const {
  currentProject,
  projects,
  createProject,
  deleteProject,
  addMessage,
  updateFile,
  readFile,
  updateFileTree,
  setSandboxId,
} = useProjectStore()

// Auto-syncs to Puter KV on changes
await updateFile('/src/App.tsx', 'new content')
```

### Type Definitions (`src/types/index.ts`)

```typescript
interface Project {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
  ownerId: string
  messages: Message[]      // Chat history
  fileTree: FileNode       // Directory structure
  e2bSandboxId?: string   // E2B instance
  lastPreviewUrl?: string // Dev server URL
  settings: {
    model?: string
    temperature?: number
    autoPreview: boolean
  }
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  content?: string       // For files only
  language?: string      // 'typescript', 'jsx', etc.
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool-call' | 'tool-result'
  content: string
  timestamp: number
  toolName?: string
  toolArgs?: any
  artifacts?: Artifact[]
}
```

---

## Data Flow

### Creating a New Project

```
User clicks "New Project"
    ↓
createProject('Untitled Project')
    ↓
Generate ID + create Project object with initialFileTree
    ↓
kvSet(`onyx:project:${id}`, project)  // Save to Puter KV
    ↓
setCurrentProject(project)  // Update Zustand store
    ↓
UI re-renders with new project
```

### Saving File Changes

```
User edits code in CodeMirror
    ↓
onChange(newContent)
    ↓
updateFile(path, newContent)
    ↓
Update FileNode in currentProject.fileTree
    ↓
kvSet(`onyx:project:${id}`, project)  // Persist to KV
    ↓
Auto-sync to E2B sandbox (if running)
    ↓
Preview refreshes (debounced 700-900ms)
```

### Chat Message Flow

```
User sends message in chat input
    ↓
Create Message object with role='user'
    ↓
addMessage(message) → kvSet to Puter
    ↓
Append to currentProject.messages
    ↓
Stream puter.ai.chat(messages, {stream: true})
    ↓
Parse streaming chunks for tool calls
    ↓
Execute tools via E2B SDK
    ↓
Append tool-result messages
    ↓
Agent continues reasoning
```

---

## Agent System Prompt (To Implement)

```markdown
You are OnyxGPT — elite, tasteful, extremely fast full-stack AI developer.

Personality: Competent, opinionated about clean code & beautiful UX, friendly.

Core Rules:
1. Think deeply first — use <thinking>…</thinking>
2. Plan file structure BEFORE any code
3. Modern 2025 standards: React 19, Tailwind 4, TypeScript, hooks
4. Prefer Vite + React unless user explicitly wants Next.js
5. Always responsive + dark mode from first version
6. Use shadcn/ui whenever appropriate
7. Clean, typed, well-commented, DRY code
8. Minimal changes when editing — respect existing style
9. Use tools aggressively — NEVER hallucinate file contents
10. After tool use → explain clearly what changed & why
11. Politely refuse dangerous/insecure requests
12. Goal: "holy sh*t this is fast & beautiful" moments

Tool Format (exact):
{"name":"writeFile","args":{"path":"/src/components/Button.tsx","content":"..."}}

Supported Tools:
- writeFile(path, content)
- readFile(path)
- deleteFile(path)
- runCommand(cmd, timeout?)
- startDevServer()
- takeScreenshot()
- listFiles(path)
- installPackages(packages[])
```

---

## Next Phase: Quick Start for Development

### Running Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

### Phase 2 Priority Tasks (File Tree UI)

1. Create `<FileTree>` component with icons + collapse
2. Add context menu (delete, rename, new file/folder)
3. Wire up `updateFile` on double-click to edit
4. Add drag-and-drop reordering

### Phase 3: Chat Improvements

1. Markdown rendering with `react-markdown`
2. Syntax highlighting for code blocks
3. Copy button on `<CodeBlock>`
4. Artifact card component

### Phase 4: Agent Integration

1. System prompt setup
2. Tool call parser (regex for JSON in markdown)
3. E2B execution wrapper
4. Streaming message handler

---

## Dependencies

### Core
- `react`: 19.0.0
- `react-dom`: 19.0.0
- `typescript`: 5.3.3
- `vite`: 5.0.8

### UI & Styling
- `tailwindcss`: 4.0.0
- `next-themes`: 0.2.1
- `lucide-react`: 0.408.0
- `clsx`: 2.0.0
- `tailwind-merge`: 2.2.0

### Editor
- `@uiw/react-codemirror`: 4.21.25
- `@codemirror/lang-javascript`: 6.2.2
- `@codemirror/lang-typescript`: 6.1.1

### State & Utils
- `zustand`: 4.4.1
- `jszip`: 3.10.1
- `framer-motion`: 10.16.16

### Cloud (via script tag)
- `puter.js`: v2 (loaded from https://js.puter.com/v2/)
- `@e2b/sdk`: (to be added)

---

## API Keys & Configuration

### Puter.js
- **Loading**: `<script src="https://js.puter.com/v2/"></script>` in `index.html`
- **No API key needed**: Authentication handled by Puter
- **User data**: Scoped to logged-in user or anonymous UUID

### E2B SDK
- **API Key**: `e2b_a8bf5367c9183a37482e52661bc26ca7fec29a9c`
- **Current**: Hardcoded in `src/lib/e2b-client.ts`
- **Future**: Move to `.env` file for production

---

## Performance Targets

- **Time to Interactive**: < 3.5 seconds
- **Chat response time**: < 500ms (Puter streaming)
- **File save latency**: < 200ms
- **Preview refresh**: 700-900ms debounce
- **Bundle size**: < 500KB gzipped (CodeMirror + React + Tailwind)

---

## Security Considerations

### Current
- Puter.js handles user authentication
- E2B sandbox isolated for code execution
- No direct eval() — all code runs in sandbox
- File paths validated before access

### Future Checklist
- [ ] Disable dangerous npm packages (eval, exec, child_process)
- [ ] Sanitize user input in file names
- [ ] Rate limit API calls
- [ ] Audit dependencies with `npm audit`
- [ ] Code signing for agent instructions

---

## Testing Strategy (TODO)

```typescript
// Unit tests
npm install --save-dev vitest
npm test

// E2E tests
npm install --save-dev playwright
npm run test:e2e

// Type checking
npm run type-check
```

---

## CI/CD Setup (TODO)

GitHub Actions workflow:
- Lint code
- Type check
- Unit tests
- Build verification
- Deploy to Vercel on main branch

---

## Roadmap

### Short Term (Next 2 weeks)
1. Phase 2: File tree UI complete
2. Phase 3: Chat streaming + markdown
3. Phase 4: Agent tool protocol

### Medium Term (Next month)
1. Phase 5: E2B sandbox full integration
2. Phase 6: Code editor polish
3. Phase 7: 8 templates + undo/redo

### Long Term (Q1 2025)
1. Phase 8: Settings & export
2. Collaborative editing
3. AI coaching features
4. Template marketplace

---

## Support & Contribution

See `SETUP.md` for development workflow.

For issues:
1. Check GitHub issues
2. Search closed PRs
3. Ask in discussions

For PRs:
1. Branch from `main`
2. Test locally
3. Update `PROJECT_MANIFEST.md` if scope changes
4. Descriptive commit messages

---

## License

MIT - See LICENSE file

---

## Credits

Inspired by **Lovable.dev** and built with ❤️ for developers who love beautiful, fast tools.

Last Updated: January 2025
Status: Phase 1 Complete, Phase 2 In Progress
