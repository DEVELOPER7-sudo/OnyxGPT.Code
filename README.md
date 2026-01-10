# OnyxGPT.Code - AI-Powered Full-Stack Code Generation

A modern, full-featured web application for generating code, managing projects, and previewing applications in real-time using AI and sandboxed execution.

## Features

### 🚀 Core Features
- **AI Code Generation**: Generate full-stack TypeScript/React applications from natural language descriptions
- **Real-time Live Preview**: Execute and preview generated code instantly in E2B sandboxes
- **Project Management**: Auto-saving projects with cloud persistence via Puter.js
- **File Tree Navigation**: Explore and manage project file structure
- **Sandbox Terminal**: Execute bash commands directly in the sandbox environment
- **Multiple AI Models**: Support for GPT, Claude, Gemini, Llama via Puter.js AI platform

### 💾 Project & Persistence
- **Real-time Auto-save**: Projects auto-save every 1.5s with debounce
- **Cloud Storage**: Projects saved to Puter.js KV storage or localStorage fallback
- **Recent Projects**: Quick access to recent projects from landing page
- **Project Sidebar**: Browse, search, and open all projects

### 🎨 User Interface
- **Two-Column Layout**: Chat on the left, code/preview on the right
- **Responsive Design**: Works perfectly at 80%, 100%, 120% zoom levels
- **Dark Mode**: Beautiful dark theme with cyan accents
- **Smooth Animations**: Framer Motion animations throughout
- **Mobile Friendly**: Full responsive design for mobile, tablet, desktop

### 🔧 Developer Experience
- **TypeScript**: Fully typed codebase
- **Hot Module Replacement**: Fast development with Vite
- **Component Library**: shadcn/ui components for consistency
- **System Prompt Engineering**: Optimized prompts for code generation

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or bun package manager
- Puter.js account (for AI and cloud features)
- E2B API key (for sandbox features - optional but recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/DEVELOPER7-sudo/code-canvas.git
cd code-canvas

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

## Configuration

### E2B Sandbox (Required for Live Preview & Terminal)

1. Get API key from [e2b.dev](https://e2b.dev)
2. Open Settings (⚙️ icon) in the app
3. Paste your E2B API key in "Sandbox API Key" field
4. Save settings

### AI Model Selection

Settings dialog allows you to:
- Select from preset models (GPT-4o, Claude, Gemini, etc.)
- Enter custom model IDs
- Adjust temperature (0 = precise, 2 = creative)
- Enable/disable auto preview

## Architecture

### Project Structure

```
src/
├── components/
│   ├── FileTree.tsx              # File tree navigation
│   ├── LivePreview.tsx           # E2B sandbox preview iframe
│   ├── SandboxTerminal.tsx       # Terminal interface
│   ├── ChatMessage.tsx           # Chat message display
│   ├── CodeEditor.tsx            # Code editor view
│   ├── SettingsDialog.tsx        # Settings panel
│   ├── ProjectsSidebar.tsx       # Projects list
│   ├── PromptInput.tsx           # AI prompt input
│   └── ... (other components)
├── pages/
│   ├── Project.tsx               # Main project workspace (2-column layout)
│   ├── Index.tsx                 # Landing page with recent projects
│   └── NotFound.tsx              # 404 page
├── hooks/
│   ├── usePuter.ts               # Puter.js integration
│   ├── useAutoSave.ts            # Auto-save with debounce
│   └── use-mobile.tsx            # Mobile detection
├── services/
│   ├── e2bService.ts             # E2B SDK wrapper
│   └── ... (other services)
├── stores/
│   └── appStore.ts               # Zustand global state
├── types/
│   └── project.ts                # TypeScript interfaces
├── lib/
│   ├── systemPrompt.ts           # AI system prompt
│   └── utils.ts                  # Utility functions
└── index.css                     # Global styles with Tailwind
```

### Key Technologies

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3 + shadcn/ui
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Code Editing**: CodeMirror 6
- **Markdown**: React Markdown
- **AI/Cloud**: Puter.js
- **Sandboxing**: E2B SDK

## Usage

### Creating a New Project

1. Click the prompt input on the landing page
2. Describe what you want to build (e.g., "A todo list with dark mode")
3. Press Enter or click the send button
4. AI generates code and displays it in the editor
5. Live preview updates automatically (if E2B key is configured)

### Managing Files

- **File Tree**: Left sidebar shows all generated files
- **Search**: Use search box to find files quickly
- **Click to Open**: Click any file to view/edit in code editor

### Running Code

1. Open Settings and add E2B API key
2. Go to project and click "Run" button
3. Terminal tab opens showing execution output
4. Preview tab shows live app in iframe

### Project Persistence

- Projects auto-save every 1.5s
- Changes persist to Puter.js cloud or localStorage
- All projects visible in projects sidebar
- Recent projects shown on landing page

## Component Details

### Project Page Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: Back | Logo | Project Name | Settings Run │
├────────────────────┬────────────────────────────────┤
│                    │                                 │
│  Left Panel:       │  Right Panel:                  │
│  ┌──────────────┐  │  ┌──────────────────────────┐  │
│  │ File Tree    │  │  │ Preview | Code Tabs      │  │
│  │ (Collapsible)│  │  ├──────────────────────────┤  │
│  └──────────────┘  │  │ Live Preview / Editor    │  │
│  ┌──────────────┐  │  │                          │  │
│  │              │  │  │                          │  │
│  │ Chat History │  │  │                          │  │
│  │              │  │  └──────────────────────────┘  │
│  └──────────────┘  │  ┌──────────────────────────┐  │
│  ┌──────────────┐  │  │ Terminal | File Tree     │  │
│  │ Chat Input   │  │  │ (Minimizable Panels)     │  │
│  └──────────────┘  │  └──────────────────────────┘  │
└────────────────────┴────────────────────────────────┘
```

### File Tree Component

- Hierarchical folder/file display
- Collapsible directories
- Search functionality
- Click to open file in editor
- Shows file type icons

### Live Preview Component

- Displays E2B sandbox app in iframe
- Auto-refresh button
- Loading state indicator
- Error message display
- Server health check

### Sandbox Terminal Component

- Command line interface
- Command history display
- Output scrolling
- Error highlighting
- Real-time execution

## System Prompt Engineering

The AI uses an optimized system prompt (`src/lib/systemPrompt.ts`) that:
- Enforces markdown code block format
- Specifies file structure requirements
- Ensures responsive + dark mode
- Uses modern React patterns
- Applies TypeScript best practices
- Falls back to non-streaming for compatibility

## Auto-Save Implementation

The `useAutoSave` hook provides:
- Debounced saving (1.5s default)
- Change detection
- Automatic save on unmount
- Fallback to localStorage if cloud unavailable

## Responsive Design

### Zoom Support

The CSS includes utilities for handling different zoom levels:
- `flex-safe`: Adds `min-width: 0` and `min-height: 0`
- `overflow-safe`: Ensures proper overflow handling
- Responsive padding using `sm:` breakpoints
- Clamp font sizes for better scaling

### Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px
- Zoom levels: 80% - 120%+ supported

## Error Handling

- **AI Streaming Fallback**: If streaming fails, automatically falls back to non-streaming
- **Sandbox Errors**: Clear error messages if E2B sandbox fails
- **Save Errors**: Graceful fallback to localStorage
- **File Errors**: User-friendly error notifications

## Performance Optimizations

- Debounced auto-save to reduce API calls
- Lazy component loading with React.lazy
- CSS-in-JS optimizations via Tailwind
- Efficient state management with Zustand
- Code splitting ready via Vite

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security

- No sensitive data stored in frontend
- All cloud operations through Puter.js secure API
- Sandbox execution isolated via E2B
- HTTPS required for production
- CORS properly configured

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: GitHub Issues
- **Puter.js Docs**: https://docs.puter.com
- **E2B Docs**: https://docs.e2b.dev
- **React Docs**: https://react.dev
- **Tailwind Docs**: https://tailwindcss.com

## Roadmap

- [ ] Backend code generation and API scaffolding
- [ ] Database schema generation and migrations
- [ ] Git integration for version control
- [ ] Team collaboration features
- [ ] Custom deployment targets
- [ ] Code review and suggestions
- [ ] Integration with GitHub/GitLab
- [ ] VSCode extension

## Changelog

### v1.0.0 (Latest)

**Features Added:**
- E2B sandbox integration with terminal support
- Real-time project auto-saving with debounce
- Two-column layout (chat + code/preview)
- File tree component with search
- Live preview iframe
- Sandbox terminal for bash commands
- Recent projects on landing page
- Zoom-aware responsive design
- System prompt optimization for all models

**Bug Fixes:**
- Fixed AI response for models without tool_use support
- Fixed zoom responsiveness at all levels (80%, 100%, 120%+)
- Fixed message container overflow
- Improved streaming fallback reliability

**UI/UX Improvements:**
- Better mobile responsiveness
- Enhanced error messages
- Smooth animations throughout
- Better visual hierarchy

## Credits

Built with ❤️ using:
- [Puter.js](https://puter.com) - Cloud OS for code
- [E2B](https://e2b.dev) - Sandbox execution
- [shadcn/ui](https://shadcn-ui.com) - Component library
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion) - Animation library
