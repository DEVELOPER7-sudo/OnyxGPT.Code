# Puter.js Integration Guide

This document outlines the integration of Puter.js with E2B Sandbox for Code Canvas, enabling serverless backend operations.

## Architecture Overview

```
Frontend (React)
    ↓
puterApiClient.ts (High-level API)
    ↓
puterWorker.ts (Calls Puter.js Workers)
    ↓
Puter.js Worker (Server-side: puterE2bWorker.ts)
    ↓
E2B Sandbox API
```

## Components

### 1. **puterApiClient.ts** - Main Frontend API
- **Location**: `src/services/puterApiClient.ts`
- **Exports**: `puterE2BClient` (singleton)
- **Responsibilities**:
  - High-level API for executing E2B operations
  - Handles authentication and caching
  - Records execution history
  - Manages project metadata
  - Error handling and retry logic

**Usage Example**:
```typescript
import { puterE2BClient } from '@/services/puterApiClient';

// Execute a command
const result = await puterE2BClient.executeCommand(
  'npm install',
  apiKey,
  projectId,
  true // useCache
);

console.log(result.stdout);
console.log(result.duration); // Time taken in ms

// Get execution history
const history = await puterE2BClient.getExecutionHistory(projectId);
```

### 2. **puterWorker.ts** - Worker Caller
- **Location**: `src/services/puterWorker.ts`
- **Responsibilities**:
  - Calls Puter.js Workers (server-side functions)
  - Handles payload serialization
  - Error propagation from workers

**Usage**: Internal use by `puterApiClient.ts`. Directly calling is uncommon.

### 3. **puterKvService.ts** - Data Storage
- **Location**: `src/services/puterKvService.ts`
- **Responsibilities**:
  - Store/retrieve execution results
  - Cache command outputs
  - Store project metadata
  - Manage execution history

**Key Features**:
- Automatic TTL (expiration) for results
- Execution history tracking
- Cache management with optional expiration
- Project metadata persistence

### 4. **puterE2bWorker.ts** - Server-Side Implementation
- **Location**: `src/services/puterE2bWorker.ts`
- **Runs**: In Puter.js Worker environment (server-side)
- **Responsibilities**:
  - Initialize E2B Sandboxes
  - Execute commands
  - Read/write files
  - Setup projects
  - Start dev servers

## Setup Instructions

### Step 1: Ensure Puter.js Script is Loaded
The HTML file already includes the Puter.js script:
```html
<script src="https://js.puter.com/v2/"></script>
```

### Step 2: Create a Puter.js Worker

1. Go to [https://puter.com/dashboard](https://puter.com/dashboard)
2. Navigate to **Workers** section
3. Click **Create New Worker**
4. Set **Worker Name**: `e2b-worker`
5. Copy the entire contents of `src/services/puterE2bWorker.ts`
6. Paste as the worker code
7. Add E2B package to dependencies (if required):
   - Dependencies: `e2b@^2.9.0`
8. Deploy the worker

### Step 3: Use the API in Your Components

```typescript
import { puterE2BClient } from '@/services/puterApiClient';
import { useState } from 'react';

export function MyComponent() {
  const [output, setOutput] = useState('');

  const handleExecuteCommand = async () => {
    try {
      const result = await puterE2BClient.executeCommand(
        'npm run build',
        apiKey,
        projectId,
        true // use cache
      );

      setOutput(result.stdout);
      console.log(`Execution took ${result.duration}ms`);
    } catch (error) {
      console.error('Execution failed:', error);
    }
  };

  return (
    <button onClick={handleExecuteCommand}>
      Execute Command
    </button>
  );
}
```

## API Reference

### PuterE2BClient Methods

#### `executeCommand(command, apiKey, projectId, useCache?)`
Execute a shell command in the E2B sandbox.

**Parameters**:
- `command` (string): Shell command to execute
- `apiKey` (string): E2B API key
- `projectId` (string): Unique project identifier
- `useCache` (boolean, optional): Use cached results if available (default: true)

**Returns**: Promise<E2BExecutionResult>
```typescript
{
  id: string;              // Unique execution ID
  stdout: string;          // Command output
  stderr: string;          // Error output
  exitCode: number;        // Exit code
  duration: number;        // Execution time in ms
  cached?: boolean;        // True if result was cached
}
```

#### `writeFile(path, content, apiKey, projectId)`
Write a file to the E2B sandbox.

**Parameters**:
- `path` (string): File path in sandbox
- `content` (string): File contents
- `apiKey` (string): E2B API key
- `projectId` (string): Project identifier

#### `readFile(path, apiKey, projectId)`
Read a file from the E2B sandbox.

**Parameters**:
- `path` (string): File path in sandbox
- `apiKey` (string): E2B API key
- `projectId` (string): Project identifier

**Returns**: Promise<string> (file contents)

#### `setupProject(files, apiKey, projectId)`
Setup a project with initial files and install dependencies.

**Parameters**:
- `files` (Array): Array of `{ path, content }` objects
- `apiKey` (string): E2B API key
- `projectId` (string): Project identifier

**Returns**: Promise<boolean> (success status)

#### `startDevServer(port, apiKey, projectId)`
Start a development server in the E2B sandbox.

**Parameters**:
- `port` (number): Port number
- `apiKey` (string): E2B API key
- `projectId` (string): Project identifier

**Returns**: Promise<boolean> (success status)

#### `getExecutionHistory(projectId, limit?)`
Get execution history for a project.

**Parameters**:
- `projectId` (string): Project identifier
- `limit` (number, optional): Maximum results (default: 50)

**Returns**: Promise<ExecutionResult[]>

#### `getProjectInfo(projectId)`
Retrieve project metadata.

**Parameters**:
- `projectId` (string): Project identifier

**Returns**: Promise<ProjectMetadata | null>

#### `updateProjectInfo(projectId, updates)`
Update project metadata.

**Parameters**:
- `projectId` (string): Project identifier
- `updates` (object): Partial metadata to update

#### `clearCache(command, projectId)`
Clear cached result for a command.

**Parameters**:
- `command` (string): The command to clear from cache
- `projectId` (string): Project identifier

## Data Storage

### Execution Results
Stored in Puter KV database with 7-day expiration.

```typescript
{
  id: string;                          // Unique result ID
  projectId: string;                   // Associated project
  type: 'command' | 'file_write' | ... // Operation type
  status: 'pending' | 'success' | 'error';
  input: { /* operation inputs */ };
  output?: { /* operation outputs */ };
  error?: string;                      // Error message if failed
  createdAt: number;                   // Timestamp
  updatedAt: number;                   // Last update
  expiresAt?: number;                  // TTL expiration time
}
```

### Project Metadata
Stored in Puter KV database indefinitely.

```typescript
{
  id: string;                          // Project ID
  name: string;                        // Project name
  apiKey?: string;                     // E2B API key (consider encryption)
  port: number;                        // Dev server port
  sandboxId?: string;                  // Current sandbox ID
  createdAt: number;                   // Creation timestamp
  updatedAt: number;                   // Last update
  lastExecution?: number;              // Last execution timestamp
}
```

### Cache
Results are cached for 1 hour by default.

## Security Considerations

1. **API Keys**: E2B API keys are passed to the worker but not stored in the KV database. Consider:
   - Storing encrypted keys
   - Using Puter.js secrets manager if available
   - Requesting keys from user each session

2. **Data Isolation**: Each user's Puter account has isolated KV storage

3. **Sandbox Isolation**: E2B sandboxes are isolated by project ID

4. **HTTPS**: All communication with Puter.js and E2B is encrypted

## Error Handling

All client methods throw errors with descriptive messages:

```typescript
try {
  const result = await puterE2BClient.executeCommand(
    'npm install',
    apiKey,
    projectId
  );
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed:', error.message);
    // Handle specific errors:
    // - "Puter.js not initialized"
    // - "Worker execution failed"
    // - "E2B sandbox not initialized"
    // - etc.
  }
}
```

## Testing

Test the integration locally:

```typescript
// In your component or console
import { puterE2BClient } from '@/services/puterApiClient';

// Initialize
await puterE2BClient.getProjectInfo('test-project');

// Test command execution
const result = await puterE2BClient.executeCommand(
  'echo "Hello from E2B"',
  'your-e2b-api-key',
  'test-project'
);
console.log(result);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Puter.js not initialized" | Ensure `<script src="https://js.puter.com/v2/"></script>` is in `index.html` |
| Worker call fails | Check that worker name is `e2b-worker` and is deployed |
| Commands time out | Increase timeout in worker or optimize command |
| Permission denied errors | Ensure E2B API key has required permissions |
| Cache not working | Check KV database is available in Puter account |

## Performance Optimization

1. **Use Caching**: Enable `useCache: true` for idempotent commands
2. **Batch Operations**: Group multiple file writes before executing
3. **Cache TTL**: Adjust cache expiration based on data freshness needs
4. **History Limits**: Request only needed execution history entries

## Next Steps

1. Deploy the E2B worker to Puter.js
2. Update UI components to use `puterE2BClient`
3. Add error handling and loading states
4. Test with actual E2B API key
5. Monitor execution history and performance
