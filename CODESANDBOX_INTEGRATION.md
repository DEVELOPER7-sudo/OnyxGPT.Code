# CodeSandbox SDK Integration Guide

This document provides comprehensive instructions for integrating CodeSandbox SDK with Puter hosting to create a 2026-standard AI IDE.

## Overview

The integration combines:
- **CodeSandbox SDK**: For interactive terminal processes and live previews
- **xTerm.js**: For terminal UI rendering
- **Puter Hosting API**: For production deployments
- **Auto-wake**: For persistent preview sessions

## Installation

### 1. Add Dependencies

```bash
npm install @codesandbox/sdk xterm xterm-addon-fit xterm-addon-web-links
```

### 2. Update package.json

Ensure your `package.json` includes:

```json
{
  "dependencies": {
    "@codesandbox/sdk": "^0.1.0",
    "xterm": "^5.5.0",
    "xterm-addon-fit": "^0.8.0",
    "xterm-addon-web-links": "^0.8.0"
  }
}
```

## Architecture

### Core Services

1. **CodeSandbox Service** (`src/services/codesandboxService.ts`)
   - Manages CodeSandbox SDK instances
   - Handles terminal creation and management
   - Provides file operations and command execution

2. **Preview Service** (`src/services/codesandboxPreviewService.ts`)
   - Manages development server lifecycle
   - Handles preview sessions
   - Integrates with Puter for production deployment

3. **Auto-Wake Service** (`src/services/autoWakeService.ts`)
   - Manages persistent preview sessions
   - Implements auto-wake functionality
   - Handles preview health checks

### Components

1. **SandboxTerminal** (`src/components/SandboxTerminal.tsx`)
   - Interactive terminal with xTerm.js
   - CodeSandbox SDK integration
   - Real-time command execution

2. **LivePreview** (`src/components/LivePreview.tsx`)
   - Live preview with CodeSandbox port management
   - Connection status indicators
   - Health monitoring

3. **CodeSandboxDeployDialog** (`src/components/CodeSandboxDeployDialog.tsx`)
   - Two-tab interface (Preview/Deploy)
   - CodeSandbox preview integration
   - Puter production deployment

### Hooks

1. **useCodeSandboxTerminal** (`src/hooks/useCodeSandboxTerminal.ts`)
   - Terminal state management
   - Multi-terminal support
   - Lifecycle management

## Usage Examples

### Basic Terminal Integration

```typescript
import { useCodeSandboxTerminal } from '@/hooks/useCodeSandboxTerminal';

function MyComponent() {
  const [state, actions] = useCodeSandboxTerminal();
  
  const handleInitialize = async () => {
    const container = document.getElementById('terminal-container');
    await actions.initialize('my-project-id', container);
  };

  return (
    <div>
      <div id="terminal-container" style={{ height: '400px' }} />
      <button onClick={handleInitialize}>Start Terminal</button>
    </div>
  );
}
```

### Preview Management

```typescript
import { codesandboxPreviewService } from '@/services/codesandboxPreviewService';

async function startPreview() {
  const project = { /* project data */ };
  const session = await codesandboxPreviewService.startDevServer(project);
  
  if (session.status === 'running') {
    console.log('Preview URL:', session.previewUrl);
  }
}
```

### Deployment

```typescript
import { codesandboxPreviewService } from '@/services/codesandboxPreviewService';

async function deployToProduction() {
  const project = { /* project data */ };
  const result = await codesandboxPreviewService.deployToProduction(
    project, 
    'my-app'
  );
  
  if (result.success) {
    console.log('Deployed to:', result.url);
  }
}
```

## Configuration

### CodeSandbox Templates

The system automatically selects appropriate templates based on project language:

- **Node.js**: `node` template
- **Python**: `python` template  
- **Go**: `go` template
- **Rust**: `rust` template
- **Static**: `static` template

### Auto-Wake Configuration

```typescript
import { autoWakeService } from '@/services/autoWakeService';

// Configure auto-wake
autoWakeService.updateConfig({
  enabled: true,
  checkInterval: 30000, // 30 seconds
  maxInactiveTime: 10 * 60 * 1000, // 10 minutes
  retryAttempts: 3
});
```

### Port Management

Default ports by language:
- Node.js: 3000
- Python: 5000
- Go: 8080
- Rust: 8080
- Static: 3000

## Best Practices

### 1. Resource Management

Always clean up resources when components unmount:

```typescript
useEffect(() => {
  return () => {
    actions.dispose(); // Clean up terminal
  };
}, []);
```

### 2. Error Handling

Implement proper error handling for all async operations:

```typescript
try {
  const result = await codesandboxService.executeCommand(projectId, command);
  // Handle success
} catch (error) {
  console.error('Command failed:', error);
  // Show user-friendly error message
}
```

### 3. Performance Optimization

- Use memoization for expensive calculations
- Implement proper caching strategies
- Clean up intervals and timeouts
- Dispose of resources properly

### 4. Security

- Validate all user inputs
- Implement command safety checks
- Use proper authentication for Puter API
- Handle sensitive data securely

## Troubleshooting

### Common Issues

1. **Terminal not rendering**
   - Check container element exists
   - Verify xTerm.js dependencies are installed
   - Ensure proper CSS for terminal container

2. **Preview not starting**
   - Verify CodeSandbox API key is configured
   - Check project files are properly formatted
   - Ensure dependencies are installed

3. **Deployment failures**
   - Verify Puter authentication
   - Check subdomain availability
   - Ensure project files are complete

### Debug Mode

Enable debug logging:

```typescript
// In development, add to your component
console.log('Terminal state:', state);
console.log('Preview sessions:', codesandboxPreviewService.getAllPreviewSessions());
```

## Migration from E2B

If migrating from E2B integration:

1. **Replace E2B service calls** with CodeSandbox equivalents
2. **Update terminal components** to use xTerm.js
3. **Migrate preview logic** to use CodeSandbox port management
4. **Update deployment flow** to use Puter hosting API

## Future Enhancements

- **Multi-language support**: Expand language detection and templates
- **Collaboration features**: Real-time collaboration in CodeSandbox
- **Advanced debugging**: Integrated debugging tools
- **Performance monitoring**: Preview performance metrics
- **Custom templates**: User-defined CodeSandbox templates

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the example implementations
3. Check browser console for errors
4. Verify all dependencies are properly installed