# Puter.js + E2B Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Web Browser (Frontend)                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  React Components                        │  │
│  │  (useE2BExecutor hook, manual calls, etc.)             │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │ calls                                     │
│  ┌──────────────────▼───────────────────────────────────────┐  │
│  │          puterApiClient (Singleton)                      │  │
│  │  ✓ executeCommand()                                     │  │
│  │  ✓ writeFile()                                          │  │
│  │  ✓ readFile()                                           │  │
│  │  ✓ setupProject()                                       │  │
│  │  ✓ startDevServer()                                     │  │
│  │  ✓ getExecutionHistory()                                │  │
│  │  ✓ getProjectInfo()                                     │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │ delegates                                 │
│  ┌──────────────────▼───────────────────────────────────────┐  │
│  │        puterKvService (Storage Layer)                    │  │
│  │  ✓ storeExecutionResult()                               │  │
│  │  ✓ getExecutionResult()                                 │  │
│  │  ✓ cacheData()                                          │  │
│  │  ✓ getCachedData()                                      │  │
│  │  ✓ getProjectMetadata()                                 │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │ calls                                     │
│  ┌──────────────────▼───────────────────────────────────────┐  │
│  │        puterWorker (Worker Caller)                       │  │
│  │  ✓ callPuterWorker()                                    │  │
│  │  ✓ Worker payload handling                              │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │ window.puter.call.function()            │
└─────────────────────┼──────────────────────────────────────────┘
                      │
      ┌───────────────┼───────────────┐
      │               │               │
      ▼               ▼               ▼
┌───────────────┐ ┌─────────────┐ ┌──────────────┐
│  Puter.js KV  │ │ Puter.js    │ │ Puter.js     │
│  Database     │ │ Workers     │ │ Authentication
└───────────────┘ └─────┬───────┘ └──────────────┘
                        │
      ┌─────────────────┼─────────────────┐
      │                 │                 │
      ▼                 ▼                 ▼
┌──────────────────────────────────────────────────┐
│            Puter.js Infrastructure               │
│  (Hosted serverless environment)                 │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  e2b-worker (puterE2bWorker.ts)            │ │
│  │                                            │ │
│  │  async handler(request) {                  │ │
│  │    switch(request.type) {                  │ │
│  │      case 'execute_command': ...           │ │
│  │      case 'write_file': ...                │ │
│  │      case 'read_file': ...                 │ │
│  │      case 'setup_project': ...             │ │
│  │      case 'start_dev_server': ...          │ │
│  │    }                                       │ │
│  │  }                                         │ │
│  └────────────────┬─────────────────────────┘ │
│                   │                            │
│                   ▼                            │
│  ┌────────────────────────────────────────────┐ │
│  │  E2B Sandbox Initialization                │ │
│  │  & Command Execution                       │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  E2B Sandbox Environment     │
        │                              │
        │  ✓ Node.js/npm               │
        │  ✓ Bash shell                │
        │  ✓ File system               │
        │  ✓ Package management        │
        │  ✓ Dev server hosting        │
        └──────────────────────────────┘
```

## Data Flow Diagram

### Command Execution Flow

```
User clicks "Run Command"
        │
        ▼
React Component calls:
  puterE2BClient.executeCommand(
    'npm install',
    apiKey,
    projectId
  )
        │
        ▼
puterApiClient checks cache:
  getCachedData(hashKey) → null (miss)
        │
        ▼
Creates ExecutionResult (pending):
  { id, status: 'pending', ... }
  → stored in Puter KV
        │
        ▼
Calls puterWorker.executeCommandViaWorker()
        │
        ▼
Calls window.puter.call.function('e2b-worker', payload)
        │
        ▼ NETWORK BOUNDARY
        │
Puter.js Worker receives request:
  handler({ type: 'execute_command', ... })
        │
        ▼
Initializes E2B Sandbox:
  await Sandbox.create({ apiKey, ... })
        │
        ▼
Executes command:
  sandbox.commands.run('bash -c "npm install"')
        │
        ▼
Returns result:
  { stdout, stderr, exitCode }
        │
        ▼ NETWORK BOUNDARY
        │
puterApiClient receives result
        │
        ▼
Updates ExecutionResult (success):
  { ..., status: 'success', output: {...} }
  → stored in Puter KV
        │
        ▼
Caches result:
  cacheData(hashKey, result, ttl=3600)
        │
        ▼
Returns to component:
  {
    id, stdout, stderr, exitCode,
    duration, cached: false
  }
        │
        ▼
Component renders output
```

### Caching Flow (Second Call)

```
User clicks "Run Command" (same command)
        │
        ▼
puterApiClient checks cache:
  getCachedData(hashKey) → { cached result }
        │
        ▼
Returns immediately:
  { ..., cached: true, duration: 150ms }
        │
        ▼
Component renders cached output
(no worker call, no E2B interaction)
```

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND LAYER (Runs in Browser)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  React Components               React Components               │
│  (myComponent.tsx)              (anotherComponent.tsx)          │
│        │                              │                         │
│        └──────────────┬───────────────┘                         │
│                       │                                         │
│         ┌─────────────▼─────────────┐                         │
│         │  puterApiClient           │                         │
│         │  (High-level API)         │                         │
│         │                           │                         │
│         │  - executeCommand()       │                         │
│         │  - writeFile()            │                         │
│         │  - readFile()             │                         │
│         │  - setupProject()         │                         │
│         │  - startDevServer()       │                         │
│         │  - getExecutionHistory()  │                         │
│         │  - getProjectInfo()       │                         │
│         │  - clearCache()           │                         │
│         └──────────┬────────────────┘                         │
│                    │                                          │
│         ┌──────────┴──────────┐                              │
│         │                     │                              │
│         ▼                     ▼                              │
│    ┌─────────────────┐   ┌──────────────┐                 │
│    │ puterKvService  │   │ puterWorker  │                 │
│    │ (Storage)       │   │ (Caller)     │                 │
│    │                 │   │              │                 │
│    │ - store()       │   │ - callPuter  │                 │
│    │ - get()         │   │   Worker()   │                 │
│    │ - cache()       │   │              │                 │
│    │ - getHistory()  │   └──────────────┘                 │
│    │ - getMetadata() │         │                          │
│    └────────┬────────┘         │                          │
│             │                  │                          │
│  ┌──────────┴──────────────────┴───────┐                 │
│  │  window.puter (Puter.js SDK)        │                 │
│  │                                     │                 │
│  │  - puter.kv.set/get/del()          │                 │
│  │  - puter.call.function()           │                 │
│  │  - puter.auth                      │                 │
│  └────────────────┬────────────────────┘                 │
│                   │                                      │
└───────────────────┼──────────────────────────────────────┘
                    │ HTTP/HTTPS
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
    ┌─────────────┐    ┌──────────────┐
    │ Puter.js    │    │ Puter.js KV  │
    │ Worker      │    │ Database     │
    │ Platform    │    │              │
    └─────┬───────┘    └──────────────┘
          │
          ▼
    ┌───────────────────────────────────┐
    │  e2b-worker Handler               │
    │  (puterE2bWorker.ts)              │
    │                                   │
    │  - executeCommand()               │
    │  - writeFile()                    │
    │  - readFile()                     │
    │  - setupProject()                 │
    │  - startDevServer()               │
    └───────────┬───────────────────────┘
                │
         ┌──────┴──────┐
         │             │
         ▼             ▼
    ┌─────────────┐ ┌──────────┐
    │ E2B SDK     │ │ E2B API  │
    │ (e2b pkg)   │ │ Endpoints│
    └─────────────┘ └──────────┘
         │             │
         └──────┬──────┘
                ▼
        ┌──────────────────┐
        │ E2B Sandbox      │
        │ Environment      │
        │                  │
        │ - Node.js        │
        │ - npm            │
        │ - Bash           │
        │ - File System    │
        │ - Ports          │
        └──────────────────┘
```

## State Management

```
┌──────────────────────────────────────────────────────────┐
│         Puter.js KV Database (Persistent)                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Execution Results (7-day TTL)                          │
│  ├─ exec_result_id1: { success, output, error }        │
│  ├─ exec_result_id2: { ... }                           │
│  └─ exec_result_id3: { ... }                           │
│                                                          │
│  Execution History (per project)                        │
│  ├─ exec_history_proj1: [id1, id2, id3, ...]          │
│  └─ exec_history_proj2: [...]                          │
│                                                          │
│  Project Metadata (indefinite)                          │
│  ├─ project_meta_proj1: { name, port, sandbox_id }    │
│  └─ project_meta_proj2: { ... }                        │
│                                                          │
│  Cache Entries (1-hour TTL)                             │
│  ├─ cache_cmd_hash1: { cached result }                 │
│  ├─ cache_cmd_hash2: { ... }                           │
│  └─ cache_cmd_hash3: { ... }                           │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Browser Memory (Session-based)                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  puterApiClient (Singleton)                             │
│  ├─ isInitialized: boolean                              │
│  └─ internal state for pending requests                 │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Puter.js Worker (Server Memory)                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Sandbox Instances                                      │
│  ├─ sandboxInstances: Map<projectId, Sandbox>          │
│  ├─ initPromises: Map<projectId, Promise>              │
│  └─ Cache (55-minute TTL for reuse)                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Request/Response Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend Request                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Component calls:                                           │
│  await puterE2BClient.executeCommand(...)                  │
│                                                             │
│  ├─ Creates UUID for execution ID                          │
│  ├─ Records start time                                     │
│  ├─ Creates pending ExecutionResult                        │
│  ├─ Stores in Puter KV (pending)                          │
│  ├─ Checks cache (optional)                                │
│  ├─ If cached, returns immediately                         │
│  └─ If not cached, continues...                            │
│                                                             │
└──────────────┬────────────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────────────┐
│  Worker Call                                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Payload: {                                             │
│    type: 'execute_command',                             │
│    command: 'npm install',                              │
│    apiKey: '...',                                       │
│    projectId: '...'                                     │
│  }                                                      │
│                                                          │
│  Serializes → HTTP POST → Puter.js API                 │
│                                                          │
└──────────────┬────────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────────────┐
│  Worker Processing                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  e2b-worker handler() receives payload                  │
│  ├─ Validates input                                     │
│  ├─ Extracts fields (type, command, apiKey, etc.)     │
│  ├─ Initializes E2B Sandbox (cached if available)      │
│  ├─ Executes command via sandbox.commands.run()        │
│  ├─ Returns: { stdout, stderr, exitCode }              │
│  └─ Wraps in response: {                               │
│       success: true,                                   │
│       data: { stdout, stderr, exitCode },              │
│       timestamp: Date.now()                            │
│     }                                                  │
│                                                          │
└──────────────┬────────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────────────┐
│  Frontend Response Handling                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Receives WorkerResult                                  │
│  ├─ Checks success flag                                │
│  ├─ Extracts data (stdout, stderr, exitCode)          │
│  ├─ Calculates duration (now - startTime)              │
│  ├─ Updates ExecutionResult to success                 │
│  ├─ Stores result in Puter KV                         │
│  ├─ Caches result (if useCache=true)                  │
│  ├─ Returns E2BExecutionResult:                        │
│  │   {                                                 │
│  │     id, stdout, stderr, exitCode,                  │
│  │     duration, cached: false                         │
│  │   }                                                 │
│  └─ Component renders output                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
Command Execution
       │
       ├─ Catch Error at Worker level
       │  ├─ Network error
       │  ├─ E2B API error
       │  ├─ Sandbox init error
       │  ├─ Command execution error
       │  └─ Logs and returns error response
       │
       ├─ Worker returns: { success: false, error: '...' }
       │
       ├─ Frontend catches error in puterApiClient
       │  ├─ Stores error ExecutionResult
       │  ├─ Logs error
       │  └─ Re-throws to component
       │
       ├─ Component catch block handles error
       │  ├─ Displays error message to user
       │  ├─ May retry or show recovery UI
       │  └─ Logs for monitoring
       │
       └─ User sees "Command failed: ..."
```

## Performance & Caching

```
Command Execution Timeline:

First Execution (Cold):
  0ms    : Request sent
  100ms  : Worker received
  200ms  : Sandbox initialized
  500ms  : Command execution
  2000ms : Result stored
  2100ms : Response returned
  ────────────────────────
  Total: ~2100ms
  
Second Execution (Cached):
  0ms    : Request sent
  10ms   : Cache hit
  15ms   : Response returned
  ────────────────────────
  Total: ~15ms (140x faster)
  
Cache Invalidation:
  │
  ├─ Manual: clearCache(command, projectId)
  ├─ TTL: 1 hour (3600 seconds)
  ├─ Eviction: Space limits
  └─ User logout: Automatic
```

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  UNTRUSTED ZONE (Browser)                                  │
├─────────────────────────────────────────────────────────────┤
│  ✓ User input                                              │
│  ✓ Component code                                          │
│  ✓ Frontend API keys (if stored)                          │
│  ✓ Local cache                                             │
│  ✓ Execution history                                       │
└────────────────────────┬──────────────────────────────────┘
                         │ window.puter API
                         │ (Puter.js handles auth)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  SEMI-TRUSTED (Puter.js KV)                                │
├─────────────────────────────────────────────────────────────┤
│  ✓ Results (encrypted transit)                             │
│  ✓ Metadata (user-isolated)                                │
│  ✓ Cache (user-isolated)                                   │
│  ✓ History (user-isolated)                                 │
│  ✗ API keys (do NOT store in KV!)                         │
└────────────────────────┬──────────────────────────────────┘
                         │ Worker function call
                         │ (Puter.js handles auth)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  TRUSTED ZONE (Puter.js Worker)                            │
├─────────────────────────────────────────────────────────────┤
│  ✓ E2B API keys (parameter-based, not stored)             │
│  ✓ Sandbox creation & management                          │
│  ✓ Sensitive operations                                    │
│  ✓ Error handling                                          │
│  ✓ Logging (server-side only)                             │
└────────────────────────┬──────────────────────────────────┘
                         │ E2B API calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL (E2B Sandbox)                                    │
├─────────────────────────────────────────────────────────────┤
│  ✓ Isolated process                                        │
│  ✓ Authenticated API key                                   │
│  ✓ Ephemeral resources                                     │
│  ✓ Auto-cleanup                                            │
└─────────────────────────────────────────────────────────────┘
```

This architecture ensures:
1. API keys never exposed to frontend
2. Sensitive operations isolated server-side
3. Data persistence with user isolation
4. Efficient caching for performance
5. Comprehensive error tracking
6. Audit trail via execution history
