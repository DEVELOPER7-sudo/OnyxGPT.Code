/**
 * Puter.js Worker Service
 * 
 * This service handles E2B API calls in a serverless worker environment.
 * It securely manages API keys and executes sandbox commands without exposing
 * credentials to the frontend.
 */

export interface WorkerExecuteCommandPayload {
  type: 'execute_command';
  command: string;
  apiKey: string;
  projectId: string;
}

export interface WorkerWriteFilePayload {
  type: 'write_file';
  path: string;
  content: string;
  apiKey: string;
  projectId: string;
}

export interface WorkerReadFilePayload {
  type: 'read_file';
  path: string;
  apiKey: string;
  projectId: string;
}

export interface WorkerSetupProjectPayload {
  type: 'setup_project';
  files: Array<{ path: string; content: string }>;
  apiKey: string;
  projectId: string;
}

export interface WorkerStartDevServerPayload {
  type: 'start_dev_server';
  port: number;
  apiKey: string;
  projectId: string;
}

export type WorkerPayload =
  | WorkerExecuteCommandPayload
  | WorkerWriteFilePayload
  | WorkerReadFilePayload
  | WorkerSetupProjectPayload
  | WorkerStartDevServerPayload;

export interface WorkerResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * Execute a command in the E2B sandbox via a Puter.js worker
 * The worker executes the command server-side without exposing the API key
 */
export const executeCommandViaWorker = async (
  command: string,
  apiKey: string,
  projectId: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  const payload: WorkerExecuteCommandPayload = {
    type: 'execute_command',
    command,
    apiKey,
    projectId,
  };

  const result = await callPuterWorker<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }>(payload);

  return result;
};

/**
 * Write a file to the E2B sandbox via a Puter.js worker
 */
export const writeFileViaWorker = async (
  path: string,
  content: string,
  apiKey: string,
  projectId: string
): Promise<void> => {
  const payload: WorkerWriteFilePayload = {
    type: 'write_file',
    path,
    content,
    apiKey,
    projectId,
  };

  await callPuterWorker<void>(payload);
};

/**
 * Read a file from the E2B sandbox via a Puter.js worker
 */
export const readFileViaWorker = async (
  path: string,
  apiKey: string,
  projectId: string
): Promise<string> => {
  const payload: WorkerReadFilePayload = {
    type: 'read_file',
    path,
    apiKey,
    projectId,
  };

  return await callPuterWorker<string>(payload);
};

/**
 * Setup a project in the E2B sandbox via a Puter.js worker
 */
export const setupProjectViaWorker = async (
  files: Array<{ path: string; content: string }>,
  apiKey: string,
  projectId: string
): Promise<boolean> => {
  const payload: WorkerSetupProjectPayload = {
    type: 'setup_project',
    files,
    apiKey,
    projectId,
  };

  try {
    await callPuterWorker<void>(payload);
    return true;
  } catch (error) {
    console.error('Setup project error:', error);
    return false;
  }
};

/**
 * Start a dev server in the E2B sandbox via a Puter.js worker
 */
export const startDevServerViaWorker = async (
  port: number,
  apiKey: string,
  projectId: string
): Promise<boolean> => {
  const payload: WorkerStartDevServerPayload = {
    type: 'start_dev_server',
    port,
    apiKey,
    projectId,
  };

  try {
    await callPuterWorker<void>(payload);
    return true;
  } catch (error) {
    console.error('Start dev server error:', error);
    return false;
  }
};

/**
 * Core function to call a Puter.js Worker
 * Workers are serverless functions that handle secure API operations
 */
async function callPuterWorker<T>(payload: WorkerPayload): Promise<T> {
  if (!window.puter) {
    throw new Error('Puter.js not initialized. Check if script tag is loaded.');
  }

  try {
    // Execute worker - Puter.js handles worker invocation
    const response = await window.puter.call.function(
      'e2b-worker', // Worker function name
      payload
    );

    if (!response.success) {
      throw new Error(response.error || 'Worker execution failed');
    }

    return response.data as T;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Worker call failed:', errorMsg);
    throw error;
  }
}
