# Puter.js + E2B Quick Start

## What Was Integrated?

Three core Puter.js services for serverless E2B sandbox execution:

1. **Puter.js Workers** - Serverless backend functions (execute E2B commands securely)
2. **Puter.js KV Database** - Persistent data storage (results, cache, metadata)
3. **Frontend API Client** - Simple interface for React components

## File Structure

```
src/services/
├── puterApiClient.ts       ← Use this in your components
├── puterWorker.ts          ← Calls Puter workers (internal)
├── puterKvService.ts       ← Data storage layer (internal)
├── puterE2bWorker.ts       ← Deploy this to Puter.js
└── PUTER_USAGE_EXAMPLES.ts ← Code examples
```

## 5-Minute Setup

### 1. Deploy Worker to Puter.js (2 min)
```
1. Go to https://puter.com/dashboard
2. Create New Worker
3. Name: "e2b-worker"
4. Copy contents of: src/services/puterE2bWorker.ts
5. Deploy
```

### 2. Use in Component (3 min)
```typescript
import { puterE2BClient } from '@/services/puterApiClient';

export function MyComponent() {
  const handleClick = async () => {
    const result = await puterE2BClient.executeCommand(
      'npm install',
      'your-e2b-api-key',
      'my-project-id'
    );
    console.log(result.stdout);
  };

  return <button onClick={handleClick}>Run Command</button>;
}
```

## Key Benefits

✅ **No Backend Server** - Puter.js Workers handle everything
✅ **Free & Scalable** - Users pay for their own resources
✅ **Secure** - API keys never exposed to frontend
✅ **Persistent** - Results stored in Puter KV database
✅ **Cached** - Command results cached for 1 hour by default

## API Methods

```typescript
// Execute commands
await puterE2BClient.executeCommand(command, apiKey, projectId);

// File operations
await puterE2BClient.writeFile(path, content, apiKey, projectId);
const content = await puterE2BClient.readFile(path, apiKey, projectId);

// Project setup
await puterE2BClient.setupProject(files, apiKey, projectId);

// Dev server
await puterE2BClient.startDevServer(port, apiKey, projectId);

// History & metadata
const history = await puterE2BClient.getExecutionHistory(projectId);
const info = await puterE2BClient.getProjectInfo(projectId);
await puterE2BClient.updateProjectInfo(projectId, updates);

// Cache management
await puterE2BClient.clearCache(command, projectId);
```

## Example Usage

See `src/services/PUTER_USAGE_EXAMPLES.ts` for 12 complete examples:
- Simple command execution
- Project setup
- File operations
- Dependency installation
- Building projects
- Starting dev servers
- Getting execution history
- Cache management
- React hook integration
- Complete workflows
- Monitoring & debugging

## Common Issues

| Problem | Fix |
|---------|-----|
| "Puter.js not initialized" | Ensure `<script src="https://js.puter.com/v2/"></script>` in `index.html` |
| Worker call fails | Check worker is deployed with name `e2b-worker` |
| API key rejected | Verify E2B API key has required permissions |
| Results not persisting | Check user is authenticated with Puter account |

## Next Steps

1. ✅ Deploy `puterE2bWorker.ts` to Puter.js
2. ⬜ Update UI components to use `puterE2BClient`
3. ⬜ Add error handling and loading states
4. ⬜ Test with real E2B API key
5. ⬜ Monitor execution history

## Full Documentation

See `PUTER_INTEGRATION.md` for:
- Complete architecture overview
- Detailed API reference
- Security considerations
- Performance optimization
- Troubleshooting guide

## Support

- Puter.js Docs: https://docs.puter.com
- E2B Docs: https://e2b.dev
- Full Guide: See `PUTER_INTEGRATION.md`
