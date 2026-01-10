# Deployment Fix Guide

## Issue: Deployment Failed for Node.js and Multi-Language Projects

### Root Causes Identified

1. **Language Detection**: Projects with Node.js/Python/Go may not be properly detected
2. **Build Configuration**: Missing language-specific build commands
3. **Port Exposure**: Incorrect port mapping for different frameworks
4. **Environment Variables**: Missing or incorrectly passed environment variables

---

## Fixes Implemented

### 1. Enhanced Language Detection

```typescript
// src/services/deploymentService.ts
export function detectLanguage(fileTree: FileNode): string {
  const files = flattenFileTree(fileTree);
  
  // Check for Node.js
  if (files.some(f => f.includes('package.json'))) return 'nodejs';
  
  // Check for Python
  if (files.some(f => f.includes('requirements.txt'))) return 'python';
  if (files.some(f => f.includes('pyproject.toml'))) return 'python';
  
  // Check for Go
  if (files.some(f => f.includes('go.mod'))) return 'go';
  
  // Check for Rust
  if (files.some(f => f.includes('Cargo.toml'))) return 'rust';
  
  // Default to Node.js
  return 'nodejs';
}
```

### 2. Build Command Mapping

```typescript
export const BUILD_COMMANDS: Record<string, string> = {
  nodejs: 'npm install && npm run build',
  python: 'pip install -r requirements.txt',
  go: 'go build -o app',
  rust: 'cargo build --release',
  static: 'echo "Static site ready"',
};

export const RUN_COMMANDS: Record<string, string> = {
  nodejs: 'npm start',
  python: 'python app.py',
  go: './app',
  rust: './target/release/app',
  static: 'npx serve -s . -l 3000',
};
```

### 3. Port Configuration

```typescript
export const DEFAULT_PORTS: Record<string, number> = {
  nodejs: 3000,
  python: 5000,
  go: 8080,
  rust: 8080,
  static: 3000,
};
```

### 4. Pre-Flight Validation

```typescript
export function validateDeployment(project: Project): DeploymentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for required files
  const language = detectLanguage(project.fileTree);
  
  if (language === 'nodejs') {
    if (!hasFile(project, 'package.json')) {
      errors.push('Node.js project missing package.json');
    }
  } else if (language === 'python') {
    if (!hasFile(project, 'requirements.txt') && !hasFile(project, 'pyproject.toml')) {
      warnings.push('Python project should have requirements.txt or pyproject.toml');
    }
  }
  
  // Check for main entry point
  if (language === 'nodejs' && !hasFile(project, 'index.js') && !hasFile(project, 'server.js')) {
    warnings.push('Could not find main Node.js entry point');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    language,
  };
}
```

---

## Implementation Steps

### Step 1: Create Deployment Service
Create `src/services/deploymentService.ts` with:
- Language detection
- Build configuration
- Validation logic
- Error handling

### Step 2: Update E2B Worker
Update `src/services/puterE2bWorker.js` with:
```javascript
// Add language-specific build handlers
async function buildProject(projectId, language, commands) {
  const sandbox = await getSandbox(projectId);
  
  try {
    console.log(`🔨 Building ${language} project...`);
    
    // Run build commands
    for (const cmd of commands) {
      console.log(`📝 Running: ${cmd}`);
      const result = await sandbox.process.run({
        cmd: 'bash',
        args: ['-c', cmd],
        timeout: 300000, // 5 minutes for builds
      });
      
      if (result.exitCode !== 0) {
        throw new Error(`Build failed: ${result.stderr}`);
      }
    }
    
    console.log('✅ Build successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Build error:', error.message);
    return { 
      success: false, 
      error: error.message,
      stderr: error.message 
    };
  }
}
```

### Step 3: Update Project Component
Modify `src/pages/Project.tsx` to show:
- Pre-flight deployment checks
- Build progress
- Deployment logs
- Error details

---

## Testing Checklist

- [ ] Node.js + Express project deploys successfully
- [ ] Python Flask/Django project deploys successfully
- [ ] Go project builds and runs
- [ ] Static HTML/CSS project deploys
- [ ] React app with build step deploys
- [ ] Environment variables are properly set
- [ ] Port is correctly exposed
- [ ] Deployment logs show build progress
- [ ] Errors are clearly reported to user

---

## Troubleshooting

### Error: "ENOENT: no such file or directory"
- Check if package.json exists
- Verify file tree is correctly built
- Ensure artifacts were properly saved

### Error: "npm command not found"
- Verify Node.js is installed in sandbox
- Check npm version
- May need to adjust PATH

### Error: "Build timed out"
- Increase timeout in E2B worker
- Check for infinite loops or large downloads
- Consider caching dependencies

### Error: "Port already in use"
- Use available port detection
- Allow configurable port selection
- Check for zombie processes

---

## Future Improvements

1. **Dependency Caching**: Cache npm/pip dependencies between builds
2. **Progress Streaming**: Send real-time build logs to frontend
3. **Build Optimization**: Minimize build time with parallelization
4. **Error Recovery**: Automatic retry with fallback strategies
5. **Performance Monitoring**: Track build and runtime metrics
