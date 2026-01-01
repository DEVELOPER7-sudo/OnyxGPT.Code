# Setup Guide

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/DEVELOPER7-sudo/OnyxGPT.Code.git
cd OnyxGPT.Code
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
npm run preview
```

## Architecture Overview

### Frontend Stack
- **React 19** + Vite (ultra-fast dev, HMR)
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **CodeMirror 6** (@uiw/react-codemirror) for code editor
- **Zustand** for global state management
- **lucide-react** for icons

### Cloud Services (via Puter.js v2)
- **Authentication**: `puter.auth.getUser()`
- **Key-Value Storage**: `puter.kv.*` (project metadata, messages)
- **File System**: `puter.fs.*` (code file contents)
- **LLM/Chat**: `puter.ai.chat()` (streaming support)
- **UI**: `puter.ui.alert()` (notifications)

### Code Execution (E2B SDK)
- Sandboxed Node.js environment
- File sync & execution
- Dev server proxy (npm/pnpm/bun dev)
- Screenshot support

## Project Anatomy

### Data Model

```typescript
Project {
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
  settings: {
    model?: string
    temperature?: number
    autoPreview: boolean
  }
}

FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  content?: string  // files only, lazy-loaded
  language?: string // 'typescript', 'jsx', etc.
}
```

### Storage Layer

**Puter KV** (project metadata):
- Key: `onyx:project:{projectId}`
- Value: Full Project object (includes message history)

**Puter FS** (file contents):
- Path: `/onyx/projects/{projectId}{filePath}`
- Content: Text or binary file content

### Chat & Agent Protocol

Messages flow through the chat:
1. User sends message
2. Store appends to `currentProject.messages`
3. App streams via `puter.ai.chat(messages, {stream: true})`
4. Agent parses tool calls in markdown format:
   ```
   {"name": "writeFile", "args": {"path": "/src/App.tsx", "content": "..."}}
   ```
5. App executes via E2B SDK
6. Result appended as `tool-result` message
7. Agent continues reasoning

### UI Layout

```
┌─ Topbar (Logo, Project Name, New, Export, Theme) ──────────────┐
├──────────────────────────────────────────────────────────────────┤
│ Sidebar │ Chat Area              │ Live Preview + Code Editor    │
│ Projects│ • Streaming messages   │ • Iframe (E2B dev server)    │
│ • New   │ • Code artifacts       │ • CodeMirror (bottom split)  │
│ • List  │ • Tool indicators      │ • File selector              │
│         │                        │                               │
└─────────┴────────────────────────┴───────────────────────────────┘
```

**Mobile**: Stacked layout, sidebar/editor hidden by default

## Development Workflow

### Adding a New Component

1. Create in `src/components/{Name}.tsx`
2. Use shadcn/ui patterns (button, input, etc.)
3. Import icons from `lucide-react`
4. Style with Tailwind classes

### Modifying State

Use the `useProjectStore` hook:
```typescript
const { currentProject, updateFile, addMessage } = useProjectStore()

// Update a file
await updateFile('/src/App.tsx', newContent)

// Add a message
await addMessage(message)
```

### Adding a New Tool

1. Update agent system prompt in `src/lib/agent-system-prompt.ts` (to be created)
2. Add handler in `src/lib/e2b-client.ts`
3. Document in README under "Agent Tools"

### Working with CodeMirror

```typescript
import CodeMirror from '@uiw/react-codemirror'
import { typescript } from '@codemirror/lang-typescript'

<CodeMirror
  value={content}
  onChange={setContent}
  extensions={[typescript()]}
  theme={theme === 'dark' ? 'dark' : 'light'}
  height="100%"
/>
```

## Environment Variables

None required for development. Puter.js loads via script tag.

For E2B (optional override):
```
E2B_API_KEY=your_key_here
```

Default: `e2b_a8bf5367c9183a37482e52661bc26ca7fec29a9c`

## Common Tasks

### Create a New Project Programmatically

```typescript
const project = await createProject('My App', 'Description')
setCurrentProject(project)
// Auto-saves to Puter KV
```

### Load All User Projects

```typescript
const { projects, loadProjects } = useProjectStore()
await loadProjects()
// Fetches all `onyx:project:*` from KV
```

### Save & Restore File Tree State

```typescript
// Save after changes
await updateFileTree(newTree)

// Restore from project
const tree = currentProject?.fileTree
```

### Stream Chat from Agent

```typescript
const response = await puter.ai.chat(messages, {
  stream: true,
  model: 'gpt-4',
})

// response is an async iterator
for await (const chunk of response) {
  console.log(chunk.text)
}
```

## Performance Tips

1. **File lazing**: Don't load file `content` until editor opens
2. **Debounce preview refresh**: 700-900ms after file change
3. **Compress large files** before KV save (>1MB)
4. **Batch file sync**: Send only changed files to E2B
5. **Stream agent responses**: Don't wait for full response

## Troubleshooting

### Puter.js not loading
- Check internet connection
- Verify `https://js.puter.com/v2/` is accessible
- See `PuterErrorBoundary` component

### E2B sandbox fails
- Check API key in `.env`
- Verify Node.js version compatible
- Try `npm run build` for smaller output

### Preview doesn't refresh
- Check `settings.autoPreview = true`
- Verify E2B sandbox is running
- Look for dev server errors in logs

### State doesn't persist
- Check Puter KV is available
- Verify project ID format (`TIMESTAMP-RANDOM`)
- Ensure `kvSet` completes before reload

## Next Steps

1. Read `README.md` for feature overview
2. Explore `src/components/` for UI patterns
3. Check `src/lib/project-store.ts` for state management
4. Review `src/lib/puter-client.ts` for cloud operations

## Contributing

See `CONTRIBUTING.md` (to be created) for:
- Code style guide
- Component patterns
- Testing strategy
- PR process
