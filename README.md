# OnyxGPT.Code

A beautiful, fast Lovable.dev-style AI app builder powered by React 19, Vite, Tailwind CSS v4, CodeMirror, and Puter.js.

## Features

- ⚡ **Ultra-fast iteration**: Code → AI → Preview < 3-4s
- 🎨 **Beautiful dark/light UI**: Perfect Lovable.dev aesthetics
- 💬 **Intelligent AI agent**: Talk to senior full-stack developer
- 📝 **Code editor**: CodeMirror 6 with syntax highlighting
- 🔌 **Cloud-powered**: All operations via Puter.js (auth, storage, LLM)
- 🏃 **Live preview**: Instant rendering with E2B sandbox
- 📱 **Responsive**: Works great on mobile and desktop
- 🎯 **Modern stack**: React 19 + Vite + TypeScript + Tailwind CSS v4

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 + next-themes
- **Editor**: @uiw/react-codemirror (CodeMirror 6)
- **Icons**: lucide-react
- **State**: zustand
- **Cloud**: Puter.js v2 (auth, KV, FS, LLM)
- **Execution**: E2B SDK
- **Export**: JSZip

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Build

```bash
npm run build
```

## Architecture

```
src/
├── components/          # UI components
│   ├── Topbar.tsx
│   ├── Sidebar.tsx
│   ├── ChatArea.tsx
│   ├── CodeEditor.tsx
│   ├── PreviewPanel.tsx
│   ├── ThemeProvider.tsx
│   └── Button.tsx
├── lib/
│   ├── puter-client.ts  # Puter.js wrapper
│   ├── e2b-client.ts    # E2B sandbox wrapper
│   ├── project-store.ts # Zustand store
│   └── utils.ts
├── types/
│   └── index.ts         # TypeScript definitions
└── App.tsx
```

## Project Structure

Each project contains:
- **File tree**: Nested directory structure
- **Messages**: Chat history with agent
- **Settings**: Model preferences, auto-preview toggle
- **Sandbox**: E2B instance for code execution
- **Metadata**: Created/updated timestamps, description

Projects are persisted to Puter KV (key-value store).

## Agent Tools

The AI agent can use these tools:

```
writeFile(path, content)
readFile(path)
deleteFile(path)
runCommand(cmd, timeout?)
startDevServer()
takeScreenshot()
listFiles()
installPackages(packages[])
```

Agent format:
```
{"name": "writeFile", "args": {"path": "/src/App.tsx", "content": "..."}}
```

## Puter.js Integration

All cloud operations route through Puter:
- `puter.auth.getUser()` - Authentication
- `puter.kv.*` - Project metadata & messages storage
- `puter.fs.*` - File contents storage
- `puter.ai.chat()` - LLM calls with streaming
- `puter.ui.alert()` - Notifications

## E2B Sandbox

- **Purpose**: Execute code in isolated Node.js environment
- **Dev server**: Tries npm/pnpm/bun dev automatically
- **File sync**: Send changed files, get public URL for preview
- **Auto-refresh**: Preview updates on file change (debounced)

## Keyboard Shortcuts

- `Cmd+S` / `Ctrl+S` - Save file in editor
- `Escape` - Close modals
- `Cmd+K` - Open command palette (future)

## Environment Variables

No environment variables needed. API key for E2B is hardcoded:
```
e2b_a8bf5367c9183a37482e52661bc26ca7fec29a9c
```

(In production, move to .env)

## Mobile Support

- Responsive design with mobile-first approach
- Sidebar: hidden by default, toggle via menu button
- Code editor: bottom drawer on mobile
- Chat + preview: full-width stacked layout

## Dark Mode

System-wide dark/light mode toggle. Stored in localStorage. Theme syncs to:
- Tailwind classes on `<html>`
- CodeMirror editor theme
- CSS variables for colors

## Future Roadmap

- [ ] 8 hardcoded templates
- [ ] Undo/redo with snapshots
- [ ] Project branching
- [ ] Share link generation
- [ ] Export to ZIP with README
- [ ] Settings panel
- [ ] AI tool call visualizations
- [ ] Artifact diffs in chat
- [ ] File-level permissions
- [ ] Collaborative editing

## License

MIT

## Support

Built with ❤️ for fast, beautiful AI-powered development.
