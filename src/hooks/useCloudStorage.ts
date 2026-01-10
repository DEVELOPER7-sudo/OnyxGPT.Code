import { useCallback, useState, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';

export interface CloudUsage {
  storageUsed: number;
  storageLimit: number;
  apiCallsToday: number;
  apiCallsLimit: number;
  lastUpdated: number;
}

export interface CloudKey {
  key: string;
  size: number;
  createdAt: number;
  updatedAt: number;
  preview?: string;
}

export interface CloudStats {
  totalKeys: number;
  totalSize: number;
  lastUpdated: number;
}

/**
 * Hook for managing Puter Cloud KV Store operations
 */
export const useCloudStorage = () => {
  const { isPuterAvailable } = useAppStore();
  const [usage, setUsage] = useState<CloudUsage | null>(null);
  const [stats, setStats] = useState<CloudStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get cloud usage statistics
  const getUsage = useCallback(async (): Promise<CloudUsage | null> => {
    if (!isPuterAvailable || typeof window === 'undefined' || !window.puter) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if Puter has usage API
      if (!window.puter.kv.getUsage) {
        console.warn('⚠️ Puter KV usage API not available');
        return null;
      }

      const usageData = await window.puter.kv.getUsage();
      const cloudUsage: CloudUsage = {
        storageUsed: usageData.storageUsed || 0,
        storageLimit: usageData.storageLimit || 10 * 1024 * 1024, // 10MB default
        apiCallsToday: usageData.apiCallsToday || 0,
        apiCallsLimit: usageData.apiCallsLimit || 1000,
        lastUpdated: Date.now(),
      };

      setUsage(cloudUsage);
      return cloudUsage;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('❌ Failed to get cloud usage:', error);
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isPuterAvailable]);

  // List all keys in cloud storage
  const listKeys = useCallback(
    async (prefix: string = ''): Promise<CloudKey[]> => {
      if (!isPuterAvailable || typeof window === 'undefined' || !window.puter) {
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        const keys = await window.puter.kv.list(prefix);
        const cloudKeys: CloudKey[] = keys.map((key: string) => ({
          key,
          size: 0, // Will be updated by getKeyStats if available
          createdAt: 0,
          updatedAt: Date.now(),
        }));

        return cloudKeys;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('❌ Failed to list cloud keys:', error);
        setError(error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [isPuterAvailable]
  );

  // Get a specific key's value
  const getKey = useCallback(
    async (key: string): Promise<any> => {
      if (!isPuterAvailable || typeof window === 'undefined' || !window.puter) {
        return null;
      }

      try {
        const value = await window.puter.kv.get(key);
        return value;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`❌ Failed to get cloud key ${key}:`, error);
        setError(error);
        return null;
      }
    },
    [isPuterAvailable]
  );

  // Set a key-value pair
  const setKey = useCallback(
    async (key: string, value: any): Promise<void> => {
      if (!isPuterAvailable || typeof window === 'undefined' || !window.puter) {
        throw new Error('Puter is not available');
      }

      try {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        await window.puter.kv.set(key, serialized);
        console.log(`✅ Cloud key set: ${key}`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`❌ Failed to set cloud key ${key}:`, error);
        setError(error);
        throw error;
      }
    },
    [isPuterAvailable]
  );

  // Delete a key
  const deleteKey = useCallback(
    async (key: string): Promise<void> => {
      if (!isPuterAvailable || typeof window === 'undefined' || !window.puter) {
        throw new Error('Puter is not available');
      }

      try {
        await window.puter.kv.del(key);
        console.log(`✅ Cloud key deleted: ${key}`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`❌ Failed to delete cloud key ${key}:`, error);
        setError(error);
        throw error;
      }
    },
    [isPuterAvailable]
  );

  // Get cloud statistics
  const getStats = useCallback(async (): Promise<CloudStats | null> => {
    if (!isPuterAvailable || typeof window === 'undefined' || !window.puter) {
      return null;
    }

    try {
      // Get all project keys
      const projectKeys = await window.puter.kv.list('onyxgpt:project:');
      
      let totalSize = 0;
      
      // Calculate total size
      for (const key of projectKeys) {
        try {
          const data = await window.puter.kv.get(key);
          if (data) {
            const size = typeof data === 'string' ? data.length : JSON.stringify(data).length;
            totalSize += size;
          }
        } catch (e) {
          // Skip on error
          console.debug(`Failed to get size for ${key}:`, e);
        }
      }

      const cloudStats: CloudStats = {
        totalKeys: projectKeys.length,
        totalSize,
        lastUpdated: Date.now(),
      };

      setStats(cloudStats);
      return cloudStats;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('❌ Failed to get cloud stats:', error);
      setError(error);
      return null;
    }
  }, [isPuterAvailable]);

  // Initialize on mount
  useEffect(() => {
    if (isPuterAvailable) {
      getUsage();
      getStats();
    }
  }, [isPuterAvailable, getUsage, getStats]);

  return {
    // State
    usage,
    stats,
    isLoading,
    error,

    // Methods
    getUsage,
    listKeys,
    getKey,
    setKey,
    deleteKey,
    getStats,
  };
};
