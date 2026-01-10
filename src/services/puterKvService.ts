/**
 * Puter.js Key-Value Database Service
 * 
 * Stores execution results, project metadata, and cache data
 * in Puter's serverless NoSQL key-value database.
 * Data persists across sessions and is accessible from any frontend instance.
 */

export interface ExecutionResult {
  id: string;
  projectId: string;
  type: 'command' | 'file_write' | 'file_read' | 'setup' | 'dev_server';
  status: 'pending' | 'success' | 'error';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number; // Optional TTL
}

export interface ProjectMetadata {
  id: string;
  name: string;
  apiKey?: string; // Encrypted or stored securely
  port: number;
  sandboxId?: string;
  createdAt: number;
  updatedAt: number;
  lastExecution?: number;
}

export interface CacheEntry {
  key: string;
  value: any;
  expiresAt?: number;
  createdAt: number;
}

const EXECUTION_RESULTS_PREFIX = 'exec_result_';
const PROJECT_METADATA_PREFIX = 'project_meta_';
const CACHE_PREFIX = 'cache_';
const EXECUTION_HISTORY_PREFIX = 'exec_history_';

/**
 * Store execution result in Puter KV database
 */
export const storeExecutionResult = async (
  result: ExecutionResult
): Promise<void> => {
  if (!window.puter) {
    throw new Error('Puter.js not initialized');
  }

  const key = `${EXECUTION_RESULTS_PREFIX}${result.id}`;

  try {
    await window.puter.kv.set(key, JSON.stringify(result), {
      expiresAt: result.expiresAt,
    });
    console.log(`✅ Stored execution result: ${result.id}`);

    // Also add to history for easy retrieval
    await addToExecutionHistory(result.projectId, result.id);
  } catch (error) {
    console.error('Failed to store execution result:', error);
    throw error;
  }
};

/**
 * Retrieve execution result from Puter KV database
 */
export const getExecutionResult = async (
  resultId: string
): Promise<ExecutionResult | null> => {
  if (!window.puter) {
    throw new Error('Puter.js not initialized');
  }

  const key = `${EXECUTION_RESULTS_PREFIX}${resultId}`;

  try {
    const data = await window.puter.kv.get(key);
    if (!data) return null;

    return JSON.parse(data) as ExecutionResult;
  } catch (error) {
    console.error('Failed to retrieve execution result:', error);
    return null;
  }
};

/**
 * Get all execution results for a project
 */
export const getProjectExecutionHistory = async (
  projectId: string,
  limit: number = 50
): Promise<ExecutionResult[]> => {
  if (!window.puter) {
    throw new Error('Puter.js not initialized');
  }

  const historyKey = `${EXECUTION_HISTORY_PREFIX}${projectId}`;

  try {
    const data = await window.puter.kv.get(historyKey);
    if (!data) return [];

    const resultIds: string[] = JSON.parse(data);
    const limitedIds = resultIds.slice(-limit);

    // Fetch all results
    const results = await Promise.all(
      limitedIds.map(id => getExecutionResult(id))
    );

    return results.filter((r): r is ExecutionResult => r !== null);
  } catch (error) {
    console.error('Failed to retrieve execution history:', error);
    return [];
  }
};

/**
 * Store project metadata
 */
export const storeProjectMetadata = async (
  metadata: ProjectMetadata
): Promise<void> => {
  if (!window.puter) {
    throw new Error('Puter.js not initialized');
  }

  const key = `${PROJECT_METADATA_PREFIX}${metadata.id}`;
  metadata.updatedAt = Date.now();

  try {
    await window.puter.kv.set(key, JSON.stringify(metadata));
    console.log(`✅ Stored project metadata: ${metadata.id}`);
  } catch (error) {
    console.error('Failed to store project metadata:', error);
    throw error;
  }
};

/**
 * Retrieve project metadata
 */
export const getProjectMetadata = async (
  projectId: string
): Promise<ProjectMetadata | null> => {
  if (!window.puter) {
    throw new Error('Puter.js not initialized');
  }

  const key = `${PROJECT_METADATA_PREFIX}${projectId}`;

  try {
    const data = await window.puter.kv.get(key);
    if (!data) return null;

    return JSON.parse(data) as ProjectMetadata;
  } catch (error) {
    console.error('Failed to retrieve project metadata:', error);
    return null;
  }
};

/**
 * Cache arbitrary data with optional expiration
 */
export const cacheData = async (
  key: string,
  value: any,
  ttlSeconds?: number
): Promise<void> => {
  if (!window.puter) {
    throw new Error('Puter.js not initialized');
  }

  const cacheKey = `${CACHE_PREFIX}${key}`;
  const entry: CacheEntry = {
    key,
    value,
    createdAt: Date.now(),
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
  };

  try {
    await window.puter.kv.set(cacheKey, JSON.stringify(entry), {
      expiresAt: entry.expiresAt,
    });
  } catch (error) {
    console.error('Failed to cache data:', error);
    throw error;
  }
};

/**
 * Retrieve cached data
 */
export const getCachedData = async (key: string): Promise<any> => {
  if (!window.puter) {
    throw new Error('Puter.js not initialized');
  }

  const cacheKey = `${CACHE_PREFIX}${key}`;

  try {
    const data = await window.puter.kv.get(cacheKey);
    if (!data) return null;

    const entry = JSON.parse(data) as CacheEntry;

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      // Delete expired entry
      await window.puter.kv.del(cacheKey);
      return null;
    }

    return entry.value;
  } catch (error) {
    console.error('Failed to retrieve cached data:', error);
    return null;
  }
};

/**
 * Clear cache entry
 */
export const clearCache = async (key: string): Promise<void> => {
  if (!window.puter) {
    throw new Error('Puter.js not initialized');
  }

  const cacheKey = `${CACHE_PREFIX}${key}`;

  try {
    await window.puter.kv.del(cacheKey);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
};

/**
 * Add result ID to project's execution history
 */
async function addToExecutionHistory(
  projectId: string,
  resultId: string
): Promise<void> {
  const historyKey = `${EXECUTION_HISTORY_PREFIX}${projectId}`;

  try {
    const data = await window.puter.kv.get(historyKey);
    let history: string[] = data ? JSON.parse(data) : [];

    // Add to history (keep last 1000)
    history.push(resultId);
    if (history.length > 1000) {
      history = history.slice(-1000);
    }

    await window.puter.kv.set(historyKey, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to update execution history:', error);
  }
}

/**
 * Delete all data for a project (cleanup)
 */
export const deleteProjectData = async (projectId: string): Promise<void> => {
  if (!window.puter) {
    throw new Error('Puter.js not initialized');
  }

  try {
    // Delete metadata
    const metaKey = `${PROJECT_METADATA_PREFIX}${projectId}`;
    await window.puter.kv.del(metaKey);

    // Delete history
    const historyKey = `${EXECUTION_HISTORY_PREFIX}${projectId}`;
    await window.puter.kv.del(historyKey);

    console.log(`✅ Deleted all data for project: ${projectId}`);
  } catch (error) {
    console.error('Failed to delete project data:', error);
    throw error;
  }
};
