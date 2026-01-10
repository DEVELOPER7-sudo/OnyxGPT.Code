# Puter E2B Worker - Complete Specification

Copy this prompt to your professional AI coder to generate the worker code.

---

## WORKER PURPOSE

Create a cloud-based worker that executes terminal commands in E2B sandboxes on Puter's infrastructure. This enables a web application to run arbitrary shell commands securely without exposing API credentials.

**Key Requirements:**
- No need for local backend server
- Cloud-based execution (Puter infrastructure)
- Secure API key management
- Sandbox lifecycle management (create, execute, cleanup)
- Command validation and security guardrails
- HTTP-based request/response API

---

## WORKER ROUTES & ENDPOINTS

The worker must expose two main routes via HTTP POST:

### Route 1: `/execute`

**Purpose:** Execute terminal commands in a sandbox

**Request:**
```json
{
  "action": "execute",
  "projectId": "project_12345_abc123",
  "commands": ["npm list", "node --version", "pwd"]
}
```

**Response (Success):**
```json
{
  "success": true,
  "stdout": "npm@9.6.1\nnode-semver@7.3.8\n...",
  "stderr": "",
  "exitCode": 0,
  "sandboxId": "sandbox_xyz789"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Forbidden command detected: rm -rf /",
  "exitCode": 1
}
```

**Key Features:**
- Accepts array of commands to execute sequentially
- Returns accumulated stdout, stderr, and exit code
- Validates commands against forbidden patterns (see below)
- Reuses existing sandbox for same projectId (55 minute cache)
- Auto-creates new sandbox if cache expired
- Executes commands in bash shell

### Route 2: `/cleanup`

**Purpose:** Clean up and kill a sandbox after use

**Request:**
```json
{
  "action": "cleanup",
  "projectId": "project_12345_abc123"
}
```

**Response:**
```json
{
  "success": true
}
```

**Key Features:**
- Optional route (sandboxes auto-cleanup after 55 minutes)
- Called when user finishes their session
- Deletes sandbox from cache after killing it

---

## IMPLEMENTATION DETAILS

### Tech Stack
- **Language:** JavaScript/Node.js (ES Modules, no CommonJS)
- **SDK:** @e2b/sdk (already available in Puter)
- **HTTP Server:** Built into Puter worker environment (use `handleRequest` function)
- **Module Format:** ES6 imports/exports

### Forbidden Commands (Security Guardrails)

Block execution of dangerous patterns:
```
- rm -rf (recursive delete)
- shutdown (system shutdown)
- reboot (system restart)
- mkfs (filesystem format)
- :(){  (fork bomb)
- dd if= (dangerous disk operations)
- /dev/sd (direct disk write)
- chmod 777 (dangerous permissions)
```

Throw error: `"🚨 Forbidden command detected: <cmd>. This operation is not allowed for security reasons."`

### Sandbox Lifecycle

1. **Create:** `Sandbox.create()` with 1 hour timeout when needed
2. **Cache:** Store by projectId for 55 minutes (reuse for same project)
3. **Execute:** `sandbox.process.run()` with bash shell and 60 second timeout per command
4. **Cleanup:** `sandbox.kill()` when done or cache expires

### Environment

The worker runs in Puter's environment with:
- `@e2b/sdk` already installed
- `request` object with `.json()` method
- `Response` object for HTTP responses
- Standard JavaScript globals (console, Map, Date, etc.)

### Error Handling

- Catch all errors in try/catch blocks
- Return proper HTTP status codes:
  - `200 OK` - Success
  - `400 Bad Request` - Missing/invalid parameters
  - `404 Not Found` - Unknown action
  - `500 Internal Server Error` - Execution error
- Log all operations to console (visible in Puter Dashboard)

---

## HANDLER FUNCTIONS

### Main Handler: `handleRequest(request)`

**Type:** `async function`

**Input:** HTTP Request object with:
- `request.method` - "POST", "GET", "OPTIONS"
- `request.url` - Full URL including path
- `request.json()` - Async function to parse JSON body

**Logic:**
1. Handle OPTIONS preflight (return 200 OK)
2. Parse POST body as JSON
3. Extract `action`, `projectId`, `commands` from body
4. Route based on `/execute` or `/cleanup` in URL path OR action field
5. Validate parameters
6. Call appropriate function
7. Return JSON response with proper status code

**Output:** HTTP Response object with status code and JSON body

### Helper Function: `validateCommand(cmd)`

**Type:** `function`

**Input:** Single command string

**Logic:**
- Test against each FORBIDDEN_PATTERN regex
- Throw error if match found
- Error message format: `"🚨 Forbidden command detected: "<cmd>". This operation is not allowed for security reasons."`

### Helper Function: `getSandbox(projectId)`

**Type:** `async function`

**Input:** Project ID string

**Logic:**
1. Check if sandbox cached for projectId
2. If cached and less than 55 minutes old, return cached sandbox
3. If not, create new sandbox via `Sandbox.create({ timeout: 3600000 })`
4. Store in Map with: `{ id, sandbox, createdAt }`
5. Return sandbox object

**Output:** Sandbox instance from E2B SDK

### Helper Function: `executeCommands(commands, projectId)`

**Type:** `async function`

**Input:** Array of command strings, project ID

**Logic:**
1. Validate commands array (must be non-empty array of strings)
2. Validate each command against forbidden patterns
3. Get or create sandbox
4. Execute each command sequentially using `sandbox.process.run()`
5. Accumulate stdout, stderr, exitCode
6. Return object with: `{ success, stdout, stderr, exitCode, sandboxId }`

**Command Execution:**
```javascript
const result = await sandbox.process.run({
  cmd: 'bash',
  args: ['-c', commandString],
  timeout: 60000
})
```

### Helper Function: `cleanupSandbox(projectId)`

**Type:** `async function`

**Input:** Project ID string

**Logic:**
1. Look up sandbox in cache by projectId
2. If found, call `sandbox.kill()`
3. Delete from cache Map
4. Return `{ success: true }`
5. If not found, return `{ success: true }` (idempotent)

**Output:** Success response object

---

## EXPORT REQUIREMENTS

```javascript
export { handler, handleRequest }
```

Both named exports required:
- `handler` - Legacy message-based API (fallback)
- `handleRequest` - Primary HTTP request handler

---

## EXAMPLE FLOW

**User calls from frontend:**
```javascript
fetch('https://api.puter.local/workers/e2b-worker/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'execute',
    projectId: 'project_xyz',
    commands: ['npm install', 'npm run build']
  })
})
```

**Worker processes:**
1. Receives POST request to `/execute`
2. Validates projectId and commands
3. Gets/creates sandbox for project_xyz (or reuses if exists)
4. Validates commands against forbidden patterns
5. Executes `npm install` in bash, captures output
6. Executes `npm run build` in bash, captures output
7. Returns accumulated stdout, stderr, exitCode
8. Sandbox remains in cache for 55 minutes (reusable)

**User calls cleanup (optional):**
```javascript
fetch('https://api.puter.local/workers/e2b-worker/cleanup', {
  method: 'POST',
  body: JSON.stringify({
    action: 'cleanup',
    projectId: 'project_xyz'
  })
})
```

**Worker processes:**
1. Finds sandbox for project_xyz
2. Calls `sandbox.kill()`
3. Removes from cache
4. Returns success

---

## DEPLOYMENT

**Target Platform:** Puter.com Workers

**Steps:**
1. Generate worker code from this specification
2. Go to puter.com/dashboard → Workers → Create New
3. Name: `e2b-worker`
4. Copy generated code into editor
5. Add dependency: `@e2b/sdk`
6. Deploy
7. Get worker endpoint URL

**Verify Deployment:**
- Check Puter Dashboard → Workers → Logs
- Should see messages like:
  - "POST /execute { action: 'execute', projectId: '...' }"
  - "🚀 Creating new E2B sandbox..."
  - "✅ Sandbox created: sandbox_..."
  - "📝 Executing: npm install"
  - "🧹 Sandbox cleaned up: sandbox_..."

---

## NOTES

- **No authentication needed** - Puter handles CORS and auth
- **Stateful** - Maintains sandbox cache in memory (lost on worker restart)
- **Sandboxes are expensive** - Cache them for 55 minutes to save costs
- **Commands run as root** - Use security guardrails to prevent damage
- **Timeout per command** - 60 seconds max per command
- **Project ID** - Keeps sandboxes per user/project to avoid cross-contamination
