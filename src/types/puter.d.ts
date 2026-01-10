/**
 * Puter.js Type Definitions
 * 
 * Global type definitions for Puter.js APIs used in the application.
 */

declare global {
  interface Window {
    /**
     * Puter.js global object with access to cloud services
     */
    puter?: {
      /**
       * Key-Value database operations
       */
      kv: {
        /**
         * Set a key-value pair
         * @param key The key to store
         * @param value The value to store (will be stringified if needed)
         * @param options Optional metadata (e.g., expiresAt)
         */
        set(
          key: string,
          value: any,
          options?: { expiresAt?: number }
        ): Promise<void>;

        /**
         * Get a value by key
         * @param key The key to retrieve
         */
        get(key: string): Promise<any>;

        /**
         * Delete a key
         * @param key The key to delete
         */
        del(key: string): Promise<void>;

        /**
         * Check if key exists
         * @param key The key to check
         */
        exists(key: string): Promise<boolean>;
      };

      /**
       * Worker function calls
       */
      call: {
        /**
         * Call a remote worker function
         * @param functionName Name of the worker function
         * @param payload Payload to send to the worker
         */
        function<T = any>(functionName: string, payload: any): Promise<T>;
      };

      /**
       * File system operations
       */
      fs?: {
        write(path: string, content: string): Promise<void>;
        read(path: string): Promise<string>;
        delete(path: string): Promise<void>;
        list(path: string): Promise<string[]>;
        mkdir(path: string): Promise<void>;
      };

      /**
       * Hosting operations
       */
      hosting?: {
        create(
          subdomain: string,
          directory: string
        ): Promise<{ subdomain: string }>;
        list(): Promise<any[]>;
        delete(subdomain: string): Promise<void>;
        get(subdomain: string): Promise<any>;
        update(subdomain: string, settings: any): Promise<void>;
      };

      /**
       * Authentication operations
       */
      auth?: {
        signIn(): Promise<{ username: string }>;
        signOut(): Promise<void>;
        getCurrentUser(): Promise<{ username: string } | null>;
      };

      /**
       * AI operations
       */
      ai?: {
        chat(prompt: string, options?: any): Promise<string>;
        txt2img(prompt: string, testMode?: boolean): Promise<HTMLImageElement>;
      };

      /**
       * Utility functions
       */
      print?(message: string): void;
      randName?(): string;
    };
  }
}

/**
 * Puter Worker Request/Response Types
 */
export interface PuterWorkerRequest {
  type: string;
  [key: string]: any;
}

export interface PuterWorkerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * E2B Sandbox Types
 */
export interface E2BCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface E2BFileContent {
  path: string;
  content: string;
}

/**
 * Puter KV Storage Types
 */
export interface KVStorageEntry {
  key: string;
  value: any;
  expiresAt?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Puter Client Configuration
 */
export interface PuterClientConfig {
  debug?: boolean;
  timeout?: number;
  retries?: number;
}

export {};
