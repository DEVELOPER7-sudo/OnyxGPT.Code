/**
 * Puter.js E2B Worker Implementation
 * 
 * This file provides the interface for E2B operations through Puter.js.
 * Uses the e2bService for actual E2B SDK calls.
 */

import { validateCommand } from './e2bWorker';

interface SandboxCache {
  sandboxId: string;
  projectId: string;
  createdAt: number;
}

const sandboxCache: Map<string, SandboxCache> = new Map();

/**
 * Get cached sandbox ID for a project
 */
export function getCachedSandboxId(projectId: string): string | null {
  const cached = sandboxCache.get(projectId);
  if (cached && Date.now() - cached.createdAt < 55 * 60 * 1000) {
    return cached.sandboxId;
  }
  return null;
}

/**
 * Cache sandbox ID for a project
 */
export function cacheSandboxId(projectId: string, sandboxId: string): void {
  sandboxCache.set(projectId, {
    sandboxId,
    projectId,
    createdAt: Date.now(),
  });
}

/**
 * Clear cached sandbox for a project
 */
export function clearSandboxCache(projectId: string): void {
  sandboxCache.delete(projectId);
}

/**
 * Worker request handler interface
 */
export interface WorkerHandler {
  executeCommand(command: string, apiKey: string, projectId: string): Promise<{ stdout: string; stderr: string; exitCode: number }>;
  writeFile(path: string, content: string, apiKey: string, projectId: string): Promise<void>;
  readFile(path: string, apiKey: string, projectId: string): Promise<string>;
  listFiles(path: string, apiKey: string, projectId: string): Promise<string[]>;
  setupProject(files: Array<{ path: string; content: string }>, apiKey: string, projectId: string): Promise<boolean>;
  startDevServer(port: number, apiKey: string, projectId: string): Promise<{ success: boolean; sandboxId: string | null }>;
}

/**
 * Create a simulated worker handler for browser environments
 * In production, this would communicate with a Puter.js serverless worker
 */
export function createBrowserWorkerHandler(): WorkerHandler {
  return {
    async executeCommand(command: string, _apiKey: string, _projectId: string) {
      validateCommand(command);
      console.log('📝 Simulated command execution:', command);
      
      // Simulate command execution for demo purposes
      return {
        stdout: `$ ${command}\n[Simulated output - E2B sandbox requires backend integration]`,
        stderr: '',
        exitCode: 0,
      };
    },
    
    async writeFile(path: string, content: string, _apiKey: string, _projectId: string) {
      console.log('📁 Simulated file write:', path, `(${content.length} bytes)`);
    },
    
    async readFile(path: string, _apiKey: string, _projectId: string) {
      console.log('📖 Simulated file read:', path);
      return `// Simulated content for ${path}`;
    },
    
    async listFiles(path: string, _apiKey: string, _projectId: string) {
      console.log('📂 Simulated directory list:', path);
      return ['index.html', 'src/', 'package.json'];
    },
    
    async setupProject(files: Array<{ path: string; content: string }>, _apiKey: string, _projectId: string) {
      console.log('🔧 Simulated project setup:', files.length, 'files');
      return true;
    },
    
    async startDevServer(port: number, _apiKey: string, projectId: string) {
      console.log('🚀 Simulated dev server start on port:', port);
      const simulatedSandboxId = `sim-${projectId.substring(0, 8)}`;
      cacheSandboxId(projectId, simulatedSandboxId);
      return { success: true, sandboxId: simulatedSandboxId };
    },
  };
}

/**
 * Get the browser worker handler singleton
 */
let browserHandler: WorkerHandler | null = null;
export function getBrowserWorkerHandler(): WorkerHandler {
  if (!browserHandler) {
    browserHandler = createBrowserWorkerHandler();
  }
  return browserHandler;
}

/**
 * Execute commands via Puter.js worker (browser-compatible)
 */
export async function executeViaWorker(
  type: string,
  params: Record<string, unknown>,
  apiKey: string,
  projectId: string
): Promise<unknown> {
  const handler = getBrowserWorkerHandler();
  
  switch (type) {
    case 'execute_command':
      return handler.executeCommand(params.command as string, apiKey, projectId);
    case 'write_file':
      await handler.writeFile(params.path as string, params.content as string, apiKey, projectId);
      return { success: true };
    case 'read_file':
      return handler.readFile(params.path as string, apiKey, projectId);
    case 'list_files':
      return handler.listFiles(params.path as string, apiKey, projectId);
    case 'setup_project':
      return handler.setupProject(params.files as Array<{ path: string; content: string }>, apiKey, projectId);
    case 'start_dev_server':
      return handler.startDevServer(params.port as number, apiKey, projectId);
    default:
      throw new Error(`Unknown worker request type: ${type}`);
  }
}
