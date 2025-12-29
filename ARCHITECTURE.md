# Application Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                     │
│                      http://localhost:5173                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐         ┌──────────────────────────────┐   │
│  │   Index Page    │         │      Editor Page            │   │
│  │                 │         │  ┌────────────────────────┐  │   │
│  │ - Create project│◄────────┤  │  - Agent Messages      │  │   │
│  │ - Set API Key   │         │  │  - File Editor         │  │   │
│  │ - Project list  │         │  │  - Live Preview        │  │   │
│  └────────┬────────┘         │  └───────┬────────────────┘  │   │
│           │                  └──────────┼───────────────────┘   │
│           │                             │                        │
│           └─────────────────┬───────────┘                        │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │   useAgentStream │                          │
│                    │   (Main Hook)    │                          │
│                    │                  │                          │
│                    │ - Fetch to server│                          │
│                    │ - Parse SSE      │                          │
│                    │ - Toast notifs   │                          │
│                    │ - Update store   │                          │
│                    └────────┬─────────┘                          │
│                             │                                    │
│                    ┌────────▼────────────────────┐              │
│                    │   StreamingParser           │              │
│                    │   (XML Tag Parser)          │              │
│                    │                             │              │
│                    │ <lov-thinking>...</lov>     │              │
│                    │ <lov-write>...</lov-write>  │              │
│                    │ <lov-add-dependency>...</    │              │
│                    └────────┬────────────────────┘              │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  Zustand Store  │                          │
│                    │  (projectStore) │                          │
│                    │                 │                          │
│                    │ - messages[]    │                          │
│                    │ - files{}       │                          │
│                    │ - state mgmt    │                          │
│                    └────────────────┘                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           UI Components (React)                          │   │
│  │  ┌──────────────────┐    ┌────────────────────────────┐ │   │
│  │  │   ApiKeyInput    │    │   Notifications (Sonner)   │ │   │
│  │  │                  │    │                            │ │   │
│  │  │ - Dialog         │    │ ✅ Success Toasts         │ │   │
│  │  │ - Input field    │    │ ❌ Error Toasts           │ │   │
│  │  │ - Show/hide btn  │    │ ⏳ Loading Toasts         │ │   │
│  │  │ - Save to storage│    │ ℹ️  Info Toasts           │ │   │
│  │  └──────────────────┘    └────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/SSE
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Elysia)                    │
│                      http://localhost:3002                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│                     /api/generate endpoint                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Express Server (server/index.ts)                      │     │
│  │                                                        │     │
│  │  1. Receive { prompt } from client                    │     │
│  │  2. Create ReadableStream                             │     │
│  │  3. Call generateResponse()                           │     │
│  │  4. Return SSE stream to client                       │     │
│  └──────────────────┬─────────────────────────────────────┘     │
│                     │                                            │
│                     ▼                                            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Gemini Adapter (server/gemini.ts)                    │     │
│  │                                                        │     │
│  │  1. Load system prompt from file                      │     │
│  │  2. Combine with user prompt                          │     │
│  │  3. Initialize Gemini chat session                    │     │
│  │  4. Call sendMessageStream()                          │     │
│  │  5. Stream chunks as SSE: "data: {...}"              │     │
│  │  6. Finish with "data: [DONE]"                        │     │
│  │  7. Error handling & logging                          │     │
│  └──────────────────┬─────────────────────────────────────┘     │
│                     │                                            │
│                     ▼                                            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Environment Configuration                            │     │
│  │                                                        │     │
│  │  GEMINI_API_KEY → Google Generative AI               │     │
│  │  MODEL → gemini-2.5-pro (default)                     │     │
│  │  MAX_TOKENS → 8192                                    │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXTERNAL: Google Generative AI API                  │
│                  https://ai.google.dev                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  - Gemini 2.0 Flash                                             │
│  - Gemini 2.5 Flash                                             │
│  - Gemini 2.5 Pro (default)                                     │
│                                                                   │
│  Features:                                                       │
│  ✅ Streaming responses                                         │
│  ✅ 8K context window                                           │
│  ✅ Free tier available                                         │
│  ✅ Multi-turn conversations                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Creating a Project

```
Step 1: User Input
┌─────────────────┐
│ Index Page      │
│ - Prompt        │
│ - Model select  │
│ Click "Send"    │
└────────┬────────┘
         │
         ▼
Step 2: Navigation
┌──────────────────────────────────────┐
│ Router navigates to /project/:id     │
│ Passes { prompt, model } in state    │
└──────────────────┬───────────────────┘
                   │
                   ▼
Step 3: Editor Page Loads
┌──────────────────────────────────┐
│ useAgentStream hook triggered    │
│ projectId available              │
│ initialPrompt available          │
└───────────────┬──────────────────┘
                │
                ▼
Step 4: API Key Check
┌────────────────────────────────────┐
│ Get API key from localStorage      │
│ Key present? YES → continue        │
│ Key missing? NO → show error toast │
└────────────┬───────────────────────┘
             │
             ▼
Step 5: Toast Notifications Start
┌────────────────────────────────────────┐
│ ✅ "API Key Loaded" (2s duration)      │
│ ⏳ "Agent responding..." (infinite)    │
└────────────┬───────────────────────────┘
             │
             ▼
Step 6: Fetch to Server
┌────────────────────────────────────┐
│ POST /api/generate                 │
│ Body: { prompt: "..." }            │
│ Headers: Content-Type: application/json
└────────────┬───────────────────────┘
             │
             ▼
Step 7: Server Processes
┌─────────────────────────────────┐
│ server/index.ts:                │
│ - Validates request             │
│ - Creates ReadableStream        │
│ - Calls generateResponse()      │
└────────────┬────────────────────┘
             │
             ▼
Step 8: Gemini Streaming
┌──────────────────────────────────────┐
│ server/gemini.ts:                    │
│ - Loads system prompt                │
│ - Concatenates with user prompt      │
│ - Calls Gemini API                   │
│ - Receives streaming chunks          │
│ - Formats as SSE: "data: {...}\n\n" │
└──────────────┬───────────────────────┘
               │
               ▼
Step 9: Client Receives Stream
┌────────────────────────────────────┐
│ useAgentStream:                    │
│ - ReadableStreamReader             │
│ - Decodes SSE format               │
│ - Parses JSON chunks               │
│ - Feeds to StreamingParser         │
└────────────┬───────────────────────┘
             │
             ▼
Step 10: Parse Agent Response
┌──────────────────────────────────────┐
│ StreamingParser:                     │
│ - Looks for XML-like tags            │
│ - <lov-thinking> → add message       │
│ - <lov-write> → write file           │
│ - <lov-add-dependency> → install pkg │
│ - Updates Zustand store              │
└────────────┬───────────────────────────┘
             │
             ▼
Step 11: React Re-renders
┌──────────────────────────────────┐
│ Zustand store updates trigger    │
│ EditorPage re-renders:           │
│ - Messages appear in left panel  │
│ - Files appear in right panel    │
│ - Live preview updates           │
└────────────┬────────────────────┘
             │
             ▼
Step 12: Stream Complete
┌──────────────────────────────────┐
│ Server sends: "data: [DONE]\n\n" │
│ Client closes stream reader      │
│ ⏳ Loading toast dismissed       │
│ ✅ "Agent Complete" toast shows  │
└──────────────────────────────────┘
             │
             ▼
Step 13: User Sees Result
┌──────────────────────────────────┐
│ Generated files visible          │
│ Messages show agent thinking     │
│ Ready to edit/preview            │
└──────────────────────────────────┘
```

---

## Error Handling Flow

```
Error at Any Step:
                │
        ┌───────▼────────┐
        │ Catch Error    │
        │ Get message    │
        └───────┬────────┘
                │
        ┌───────▼──────────────┐
        │ Add to Messages      │
        │ (in Zustand store)   │
        └───────┬──────────────┘
                │
        ┌───────▼──────────────────┐
        │ Show Toast Notification  │
        │ - Error type             │
        │ - Error message          │
        │ - 5 second duration      │
        └───────┬──────────────────┘
                │
        ┌───────▼──────────────────┐
        │ Log to Console           │
        │ - Full error object      │
        │ - Stack trace            │
        │ - Context info           │
        └──────────────────────────┘

Specific Error Cases:
├─ Missing API Key
│  ├─ Toast: "Missing API Key"
│  ├─ Message: "Please set your Gemini API key to continue"
│  └─ Action: Show API Key dialog
│
├─ Invalid API Key
│  ├─ Toast: "API Error"
│  ├─ Message: Gemini error from API
│  └─ Action: Show error, suggest retry
│
├─ Network Error
│  ├─ Toast: "Stream Error"
│  ├─ Message: Network error message
│  └─ Action: Retry or clear cache
│
├─ Server Error (5xx)
│  ├─ Toast: "Server Error"
│  ├─ Message: HTTP status + details
│  └─ Action: Check server is running
│
└─ Parser Error
   ├─ Toast: "API Error"
   ├─ Message: Parse error details
   └─ Action: Log and continue with next chunk
```

---

## Storage & Persistence

```
┌──────────────────────────────┐
│  Browser Local Storage        │
│  (localStorage)               │
├──────────────────────────────┤
│                              │
│  Key: gemini_api_key         │
│  Value: "AIza..."            │
│  Scope: Per domain           │
│  Persistence: Until cleared  │
│  Sync: None (local only)     │
│                              │
└──────────────────────────────┘

┌──────────────────────────────┐
│  Project Storage              │
│  (localStorage)               │
├──────────────────────────────┤
│                              │
│  Key: project_<uuid>         │
│  Value: {                    │
│    id, prompt, model,        │
│    files{}, messages[]       │
│  }                           │
│                              │
└──────────────────────────────┘

┌──────────────────────────────┐
│  Zustand Store (In-Memory)    │
├──────────────────────────────┤
│                              │
│  State: projectStore         │
│  Updates: Real-time          │
│  Persistence: On each change │
│  to localStorage             │
│                              │
└──────────────────────────────┘
```

---

## Component Hierarchy

```
App (Toaster provider)
│
├─ Router
│  │
│  ├─ Index Page
│  │  ├─ Header
│  │  │  └─ ApiKeyInput (Dialog + Toast)
│  │  ├─ PromptInput
│  │  │  ├─ Textarea
│  │  │  ├─ Select (model)
│  │  │  └─ Button (send)
│  │  └─ ProjectList
│  │     └─ ProjectCard[] (with actions)
│  │
│  └─ Editor Page
│     ├─ Header
│     ├─ ResizablePanel (left)
│     │  └─ AgentMessageBlock[]
│     ├─ ResizableHandle
│     └─ ResizablePanel (right)
│        ├─ Tabs
│        │  ├─ Code Tab
│        │  │  └─ Accordion (files)
│        │  │     └─ CodeBlock
│        │  └─ Preview Tab
│        │     └─ LivePreview
│        └─ useAgentStream (hook)
│           ├─ StreamingParser
│           └─ Zustand dispatch
│
└─ Toaster (notifications)
```

---

## Technologies Used

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18.3.1 | UI Framework |
| | React Router | 7.8.2 | Navigation |
| | Zustand | 5.0.8 | State Management |
| | Vite | 5.4.1 | Build Tool |
| | TypeScript | 5.5.3 | Type Safety |
| | Tailwind CSS | 3.4.11 | Styling |
| | shadcn/ui | Latest | Components |
| | Sonner | Latest | Toast Notifications |
| | Lucide React | 0.462 | Icons |
| **Backend** | Elysia | Latest | Server Framework |
| | @google/generative-ai | 0.24.1 | Gemini API |
| **DevOps** | Bun | Latest | Runtime/Package |
| **External** | Google Generative AI | Latest | LLM Provider |

---

## API Endpoints

### POST /api/generate
**Purpose:** Stream AI-generated response

**Request:**
```json
{
  "prompt": "Create a todo app with React"
}
```

**Response:** Server-Sent Events (SSE)
```
data: {"text": "I'll help you create..."}

data: {"text": " a todo app using..."}

data: [DONE]
```

**Status Codes:**
- `200`: Stream started successfully
- `400`: Invalid request body
- `500`: Server/Gemini error

---

## Performance Considerations

| Operation | Time | Bottleneck |
|-----------|------|-----------|
| API Key Save | <100ms | localStorage write |
| Fetch to Server | <500ms | Network latency |
| Gemini Response Start | 1-3s | Model initialization |
| Streaming (per chunk) | <100ms | Network + parsing |
| File Parsing | <50ms | Parser complexity |
| React Re-render | <50ms | Component updates |
| **Total First Response** | **2-5s** | Network + Model |

---

## Security Considerations

✅ **Good:**
- API key stored in browser localStorage
- No backend API key exposure
- CORS enabled for localhost only
- SSE standard format (no custom protocol)
- No authentication bypass

⚠️ **Warning:**
- localStorage not encrypted
- Don't use on shared computers
- Browser history not cleared automatically
- API key visible in Network tab (HTTPS needed for production)

---

## Future Architecture Changes

1. **Backend API Relay**
   - Hide Gemini API key on server
   - Add authentication layer
   - Rate limiting per user

2. **Database Integration**
   - Store projects permanently
   - Message history persistence
   - User accounts

3. **Real-time Collaboration**
   - WebSocket for live editing
   - Multiple users per project
   - Comment system

4. **Advanced Features**
   - File import/export
   - Version control integration
   - Code execution sandbox
   - Deployment pipelines
