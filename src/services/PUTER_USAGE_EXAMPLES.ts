/**
 * Puter.js E2B Integration - Usage Examples
 * 
 * This file contains practical examples of how to use the Puter E2B Client
 * in your React components and services.
 */

import { puterE2BClient } from './puterApiClient';

// ============================================================================
// EXAMPLE 1: Execute a Simple Command
// ============================================================================
export async function exampleExecuteCommand() {
  const apiKey = 'your-e2b-api-key';
  const projectId = 'my-project-123';

  try {
    const result = await puterE2BClient.executeCommand(
      'echo "Hello World" && ls -la',
      apiKey,
      projectId
    );

    console.log('Command output:', result.stdout);
    console.log('Command errors:', result.stderr);
    console.log('Exit code:', result.exitCode);
    console.log('Execution took:', result.duration, 'ms');
  } catch (error) {
    console.error('Failed to execute command:', error);
  }
}

// ============================================================================
// EXAMPLE 2: Setup a Project with Files
// ============================================================================
export async function exampleSetupProject() {
  const apiKey = 'your-e2b-api-key';
  const projectId = 'my-project-123';

  const files = [
    {
      path: 'package.json',
      content: JSON.stringify(
        {
          name: 'my-app',
          version: '1.0.0',
          scripts: { dev: 'vite', build: 'vite build' },
          dependencies: { react: '^18.0.0', vite: '^4.0.0' },
        },
        null,
        2
      ),
    },
    {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html>
<head><title>My App</title></head>
<body><div id="root"></div></body>
</html>`,
    },
    {
      path: 'src/App.jsx',
      content: `export default function App() {
  return <h1>Hello World</h1>;
}`,
    },
  ];

  try {
    const success = await puterE2BClient.setupProject(files, apiKey, projectId);

    if (success) {
      console.log('✅ Project setup completed');
    } else {
      console.log('❌ Project setup failed');
    }
  } catch (error) {
    console.error('Setup error:', error);
  }
}

// ============================================================================
// EXAMPLE 3: Write and Read Files
// ============================================================================
export async function exampleFileOperations() {
  const apiKey = 'your-e2b-api-key';
  const projectId = 'my-project-123';

  try {
    // Write a file
    await puterE2BClient.writeFile(
      '/app/config.json',
      JSON.stringify({ debug: true, version: '1.0.0' }, null, 2),
      apiKey,
      projectId
    );
    console.log('✅ File written');

    // Read the file back
    const content = await puterE2BClient.readFile(
      '/app/config.json',
      apiKey,
      projectId
    );
    console.log('File content:', content);
    const config = JSON.parse(content);
    console.log('Config debug mode:', config.debug);
  } catch (error) {
    console.error('File operation error:', error);
  }
}

// ============================================================================
// EXAMPLE 4: Install Dependencies
// ============================================================================
export async function exampleInstallDependencies() {
  const apiKey = 'your-e2b-api-key';
  const projectId = 'my-project-123';

  try {
    // First, ensure package.json exists (from exampleSetupProject)

    // Install dependencies
    const result = await puterE2BClient.executeCommand(
      'npm install --legacy-peer-deps',
      apiKey,
      projectId
    );

    if (result.exitCode === 0) {
      console.log('✅ Dependencies installed');
      console.log(result.stdout);
    } else {
      console.error('❌ Installation failed');
      console.error(result.stderr);
    }
  } catch (error) {
    console.error('Installation error:', error);
  }
}

// ============================================================================
// EXAMPLE 5: Run Build Command
// ============================================================================
export async function exampleBuildProject() {
  const apiKey = 'your-e2b-api-key';
  const projectId = 'my-project-123';

  try {
    const result = await puterE2BClient.executeCommand(
      'npm run build 2>&1',
      apiKey,
      projectId,
      false // Don't use cache for builds
    );

    if (result.exitCode === 0) {
      console.log('✅ Build successful');
      console.log('Build output:', result.stdout);
    } else {
      console.error('❌ Build failed');
      console.error('Error output:', result.stderr);
    }
  } catch (error) {
    console.error('Build error:', error);
  }
}

// ============================================================================
// EXAMPLE 6: Start Development Server
// ============================================================================
export async function exampleStartDevServer() {
  const apiKey = 'your-e2b-api-key';
  const projectId = 'my-project-123';
  const port = 3000;

  try {
    const success = await puterE2BClient.startDevServer(
      port,
      apiKey,
      projectId
    );

    if (success) {
      console.log(`✅ Dev server started on port ${port}`);
      // Server URL would be: https://{sandboxId}.sb.e2b.dev:{port}
    } else {
      console.log('❌ Dev server failed to start');
    }
  } catch (error) {
    console.error('Dev server error:', error);
  }
}

// ============================================================================
// EXAMPLE 7: Get Execution History
// ============================================================================
export async function exampleGetExecutionHistory() {
  const projectId = 'my-project-123';

  try {
    const history = await puterE2BClient.getExecutionHistory(projectId, 10);

    console.log(`Found ${history.length} executions:`);
    history.forEach(result => {
      console.log(`- ${result.type}: ${result.status} at ${new Date(result.createdAt).toLocaleString()}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
  } catch (error) {
    console.error('History retrieval error:', error);
  }
}

// ============================================================================
// EXAMPLE 8: Manage Project Metadata
// ============================================================================
export async function exampleProjectMetadata() {
  const apiKey = 'your-e2b-api-key';
  const projectId = 'my-project-123';

  try {
    // Get current metadata
    let metadata = await puterE2BClient.getProjectInfo(projectId);

    if (!metadata) {
      console.log('Project not found, creating new...');
      // Note: In practice, you might create this elsewhere
      metadata = {
        id: projectId,
        name: 'My Project',
        port: 3000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      // Would need to save this first
    }

    console.log('Current metadata:', metadata);

    // Update metadata
    await puterE2BClient.updateProjectInfo(projectId, {
      lastExecution: Date.now(),
      sandboxId: 'sandbox-xyz-123',
    });

    console.log('✅ Metadata updated');

    // Retrieve updated metadata
    const updated = await puterE2BClient.getProjectInfo(projectId);
    console.log('Updated metadata:', updated);
  } catch (error) {
    console.error('Metadata error:', error);
  }
}

// ============================================================================
// EXAMPLE 9: Cache Management
// ============================================================================
export async function exampleCacheManagement() {
  const apiKey = 'your-e2b-api-key';
  const projectId = 'my-project-123';

  try {
    // Execute with cache enabled (default)
    const result1 = await puterE2BClient.executeCommand(
      'npm list',
      apiKey,
      projectId,
      true // useCache
    );
    console.log('First execution time:', result1.duration, 'ms');

    // Same command again - should use cache
    const result2 = await puterE2BClient.executeCommand(
      'npm list',
      apiKey,
      projectId,
      true
    );
    console.log('Second execution time:', result2.duration, 'ms');
    console.log('Was cached:', result2.cached); // Should be true

    // Clear the cache
    await puterE2BClient.clearCache('npm list', projectId);
    console.log('✅ Cache cleared');

    // Execute again - should not use cache
    const result3 = await puterE2BClient.executeCommand(
      'npm list',
      apiKey,
      projectId,
      true
    );
    console.log('Third execution time:', result3.duration, 'ms');
    console.log('Was cached:', result3.cached); // Should be false
  } catch (error) {
    console.error('Cache error:', error);
  }
}

// ============================================================================
// EXAMPLE 10: React Hook Integration
// ============================================================================
import { useState, useCallback } from 'react';

export function useE2BExecutor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<any>(null);

  const execute = useCallback(
    async (
      command: string,
      apiKey: string,
      projectId: string,
      useCache: boolean = true
    ) => {
      setLoading(true);
      setError(null);

      try {
        const res = await puterE2BClient.executeCommand(
          command,
          apiKey,
          projectId,
          useCache
        );
        setResult(res);
        return res;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { execute, loading, error, result };
}

// Usage in component:
/*
function MyComponent() {
  const { execute, loading, error, result } = useE2BExecutor();

  const handleClick = async () => {
    try {
      const res = await execute('ls -la', apiKey, projectId);
      console.log(res.stdout);
    } catch (err) {
      console.error('Execution failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Executing...' : 'Execute Command'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {result && <pre>{result.stdout}</pre>}
    </div>
  );
}
*/

// ============================================================================
// EXAMPLE 11: Complex Workflow - Full Project Setup & Build
// ============================================================================
export async function exampleCompleteWorkflow() {
  const apiKey = 'your-e2b-api-key';
  const projectId = 'my-project-123';

  console.log('Starting complete workflow...');

  try {
    // Step 1: Setup project files
    console.log('Step 1: Setting up project...');
    const setupSuccess = await puterE2BClient.setupProject(
      [
        {
          path: 'package.json',
          content: JSON.stringify(
            {
              name: 'my-app',
              version: '1.0.0',
              scripts: { dev: 'vite', build: 'vite build' },
              dependencies: { react: '^18.0.0' },
            },
            null,
            2
          ),
        },
      ],
      apiKey,
      projectId
    );

    if (!setupSuccess) {
      throw new Error('Project setup failed');
    }
    console.log('✅ Project setup complete');

    // Step 2: Install dependencies
    console.log('Step 2: Installing dependencies...');
    const installResult = await puterE2BClient.executeCommand(
      'npm install --legacy-peer-deps',
      apiKey,
      projectId,
      false
    );

    if (installResult.exitCode !== 0) {
      throw new Error('Dependency installation failed');
    }
    console.log('✅ Dependencies installed');

    // Step 3: Build project
    console.log('Step 3: Building project...');
    const buildResult = await puterE2BClient.executeCommand(
      'npm run build',
      apiKey,
      projectId,
      false
    );

    if (buildResult.exitCode !== 0) {
      throw new Error('Build failed');
    }
    console.log('✅ Build successful');

    // Step 4: Start dev server
    console.log('Step 4: Starting dev server...');
    const devSuccess = await puterE2BClient.startDevServer(
      3000,
      apiKey,
      projectId
    );

    if (!devSuccess) {
      throw new Error('Dev server startup failed');
    }
    console.log('✅ Dev server started');

    // Step 5: Update project metadata
    console.log('Step 5: Updating project metadata...');
    await puterE2BClient.updateProjectInfo(projectId, {
      name: 'My App',
      port: 3000,
      lastExecution: Date.now(),
    });
    console.log('✅ Metadata updated');

    console.log('✅ Complete workflow finished successfully!');
  } catch (error) {
    console.error('❌ Workflow failed:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 12: Monitoring & Debugging
// ============================================================================
export async function exampleMonitoring() {
  const projectId = 'my-project-123';

  try {
    // Get all recent executions
    const history = await puterE2BClient.getExecutionHistory(projectId, 50);

    // Group by status
    const stats = {
      success: 0,
      error: 0,
      pending: 0,
    };

    history.forEach(result => {
      stats[result.status as keyof typeof stats]++;
    });

    console.log('Execution Statistics:', stats);

    // Find all errors
    const errors = history.filter(r => r.status === 'error');
    if (errors.length > 0) {
      console.log('Recent errors:');
      errors.forEach(err => {
        console.log(`- ${err.type}: ${err.error}`);
      });
    }

    // Get execution times
    const durations = history
      .filter(r => r.status === 'success' && r.type === 'command')
      .map(r => ({
        input: r.input,
        duration: (r as any).duration || 0,
      }));

    console.log('Command durations:', durations);
  } catch (error) {
    console.error('Monitoring error:', error);
  }
}
