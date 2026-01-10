/**
 * Puter.js API Client
 * 
 * High-level API for executing E2B operations through Puter.js Workers.
 * Handles authentication, caching, error handling, and result storage.
 * This is the primary interface for frontend code to interact with E2B.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  executeCommandViaWorker,
  writeFileViaWorker,
  readFileViaWorker,
  setupProjectViaWorker,
  startDevServerViaWorker,
} from './puterWorker';
import {
  storeExecutionResult,
  getExecutionResult,
  getProjectExecutionHistory,
  storeProjectMetadata,
  getProjectMetadata,
  cacheData,
  getCachedData,
  ExecutionResult,
  ProjectMetadata,
} from './puterKvService';

export interface E2BExecutionResult {
  id: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  cached?: boolean;
}

export interface PuterE2BClient {
  executeCommand(
    command: string,
    apiKey: string,
    projectId: string,
    useCache?: boolean
  ): Promise<E2BExecutionResult>;

  writeFile(
    path: string,
    content: string,
    apiKey: string,
    projectId: string
  ): Promise<void>;

  readFile(
    path: string,
    apiKey: string,
    projectId: string
  ): Promise<string>;

  setupProject(
    files: Array<{ path: string; content: string }>,
    apiKey: string,
    projectId: string
  ): Promise<boolean>;

  startDevServer(
    port: number,
    apiKey: string,
    projectId: string
  ): Promise<boolean>;

  getExecutionHistory(projectId: string, limit?: number): Promise<ExecutionResult[]>;

  getProjectInfo(projectId: string): Promise<ProjectMetadata | null>;

  updateProjectInfo(
    projectId: string,
    updates: Partial<ProjectMetadata>
  ): Promise<void>;

  clearCache(command: string, projectId: string): Promise<void>;
}

class PuterE2BClientImpl implements PuterE2BClient {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Wait for Puter.js to load
    let attempts = 0;
    while (!window.puter && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.puter) {
      throw new Error('Puter.js failed to load. Check if script tag is included in HTML.');
    }

    // Verify KV database is available
    if (!window.puter.kv) {
      throw new Error('Puter.js KV database not available.');
    }

    this.isInitialized = true;
    console.log('✅ Puter E2B Client initialized');
  }

  async executeCommand(
    command: string,
    apiKey: string,
    projectId: string,
    useCache: boolean = true
  ): Promise<E2BExecutionResult> {
    await this.initialize();

    const resultId = uuidv4();
    const startTime = Date.now();

    try {
      // Check cache
      if (useCache) {
        const cached = await this.getCommandFromCache(command, projectId);
        if (cached) {
          console.log('📦 Using cached result for command');
          return { ...cached, cached: true };
        }
      }

      // Record pending execution
      const pendingResult: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'command',
        status: 'pending',
        input: { command },
        createdAt: startTime,
        updatedAt: startTime,
      };
      await storeExecutionResult(pendingResult);

      // Execute via worker
      const output = await executeCommandViaWorker(command, apiKey, projectId);
      const duration = Date.now() - startTime;

      // Store result
      const result: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'command',
        status: 'success',
        input: { command },
        output: {
          stdout: output.stdout,
          stderr: output.stderr,
          exitCode: output.exitCode,
        },
        createdAt: startTime,
        updatedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      };
      await storeExecutionResult(result);

      // Cache result
      if (useCache) {
        await this.cacheCommand(command, projectId, output, duration);
      }

      return {
        id: resultId,
        stdout: output.stdout,
        stderr: output.stderr,
        exitCode: output.exitCode,
        duration,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Store error result
      const errorResult: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'command',
        status: 'error',
        input: { command },
        error: errorMsg,
        createdAt: startTime,
        updatedAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 1 day
      };
      await storeExecutionResult(errorResult);

      throw error;
    }
  }

  async writeFile(
    path: string,
    content: string,
    apiKey: string,
    projectId: string
  ): Promise<void> {
    await this.initialize();

    const resultId = uuidv4();
    const startTime = Date.now();

    try {
      const pendingResult: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'file_write',
        status: 'pending',
        input: { path, contentLength: content.length },
        createdAt: startTime,
        updatedAt: startTime,
      };
      await storeExecutionResult(pendingResult);

      await writeFileViaWorker(path, content, apiKey, projectId);

      const result: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'file_write',
        status: 'success',
        input: { path, contentLength: content.length },
        output: { path },
        createdAt: startTime,
        updatedAt: Date.now(),
      };
      await storeExecutionResult(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorResult: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'file_write',
        status: 'error',
        input: { path },
        error: errorMsg,
        createdAt: startTime,
        updatedAt: Date.now(),
      };
      await storeExecutionResult(errorResult);
      throw error;
    }
  }

  async readFile(
    path: string,
    apiKey: string,
    projectId: string
  ): Promise<string> {
    await this.initialize();

    const resultId = uuidv4();
    const startTime = Date.now();

    try {
      const content = await readFileViaWorker(path, apiKey, projectId);

      const result: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'file_read',
        status: 'success',
        input: { path },
        output: { contentLength: content.length },
        createdAt: startTime,
        updatedAt: Date.now(),
      };
      await storeExecutionResult(result);

      return content;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorResult: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'file_read',
        status: 'error',
        input: { path },
        error: errorMsg,
        createdAt: startTime,
        updatedAt: Date.now(),
      };
      await storeExecutionResult(errorResult);
      throw error;
    }
  }

  async setupProject(
    files: Array<{ path: string; content: string }>,
    apiKey: string,
    projectId: string
  ): Promise<boolean> {
    await this.initialize();

    const resultId = uuidv4();
    const startTime = Date.now();

    try {
      const pendingResult: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'setup',
        status: 'pending',
        input: { fileCount: files.length },
        createdAt: startTime,
        updatedAt: startTime,
      };
      await storeExecutionResult(pendingResult);

      const success = await setupProjectViaWorker(files, apiKey, projectId);

      const result: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'setup',
        status: success ? 'success' : 'error',
        input: { fileCount: files.length },
        output: { success },
        createdAt: startTime,
        updatedAt: Date.now(),
      };
      await storeExecutionResult(result);

      return success;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorResult: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'setup',
        status: 'error',
        input: { fileCount: files.length },
        error: errorMsg,
        createdAt: startTime,
        updatedAt: Date.now(),
      };
      await storeExecutionResult(errorResult);
      return false;
    }
  }

  async startDevServer(
    port: number,
    apiKey: string,
    projectId: string
  ): Promise<boolean> {
    await this.initialize();

    const resultId = uuidv4();
    const startTime = Date.now();

    try {
      const pendingResult: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'dev_server',
        status: 'pending',
        input: { port },
        createdAt: startTime,
        updatedAt: startTime,
      };
      await storeExecutionResult(pendingResult);

      let success: boolean;
      try {
        const workerResult = await startDevServerViaWorker(port, apiKey, projectId);
        // Handle both boolean and object responses safely
        if (typeof workerResult === 'boolean') {
          success = workerResult;
        } else if (workerResult && typeof workerResult === 'object' && 'success' in workerResult) {
          success = Boolean((workerResult as { success: boolean }).success);
        } else {
          success = Boolean(workerResult);
        }
      } catch (workerError) {
        console.warn('Dev server worker error:', workerError);
        success = false;
      }

      const execResult: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'dev_server',
        status: success ? 'success' : 'error',
        input: { port },
        output: { success, port },
        createdAt: startTime,
        updatedAt: Date.now(),
      };
      await storeExecutionResult(execResult);

      return success;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Dev server start error:', errorMsg);
      const errorResult: ExecutionResult = {
        id: resultId,
        projectId,
        type: 'dev_server',
        status: 'error',
        input: { port },
        error: errorMsg,
        createdAt: startTime,
        updatedAt: Date.now(),
      };
      await storeExecutionResult(errorResult);
      return false;
    }
  }

  async getExecutionHistory(
    projectId: string,
    limit: number = 50
  ): Promise<ExecutionResult[]> {
    await this.initialize();
    return getProjectExecutionHistory(projectId, limit);
  }

  async getProjectInfo(projectId: string): Promise<ProjectMetadata | null> {
    await this.initialize();
    return getProjectMetadata(projectId);
  }

  async updateProjectInfo(
    projectId: string,
    updates: Partial<ProjectMetadata>
  ): Promise<void> {
    await this.initialize();

    const current = await getProjectMetadata(projectId);
    if (!current) {
      throw new Error(`Project ${projectId} not found`);
    }

    const updated: ProjectMetadata = {
      ...current,
      ...updates,
      id: projectId, // Ensure ID doesn't change
    };

    await storeProjectMetadata(updated);
  }

  async clearCache(command: string, projectId: string): Promise<void> {
    await this.initialize();
    const cacheKey = this.getCommandCacheKey(command, projectId);
    await cacheData(cacheKey, null);
  }

  // Private helper methods

  private getCommandCacheKey(command: string, projectId: string): string {
    return `cmd_${projectId}_${this.hashString(command)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private async getCommandFromCache(
    command: string,
    projectId: string
  ): Promise<E2BExecutionResult | null> {
    try {
      const cacheKey = this.getCommandCacheKey(command, projectId);
      const cached = await getCachedData(cacheKey);
      return cached;
    } catch {
      return null;
    }
  }

  private async cacheCommand(
    command: string,
    projectId: string,
    output: { stdout: string; stderr: string; exitCode: number },
    duration: number
  ): Promise<void> {
    try {
      const cacheKey = this.getCommandCacheKey(command, projectId);
      const result: E2BExecutionResult = {
        id: uuidv4(),
        stdout: output.stdout,
        stderr: output.stderr,
        exitCode: output.exitCode,
        duration,
      };
      // Cache for 1 hour (3600 seconds)
      await cacheData(cacheKey, result, 3600);
    } catch (error) {
      console.warn('Failed to cache command result:', error);
    }
  }
}

// Export singleton instance
export const puterE2BClient: PuterE2BClient = new PuterE2BClientImpl();

// Type guard to check Puter initialization
declare global {
  interface Window {
    puter?: any;
  }
}
