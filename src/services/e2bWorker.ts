/**
 * Onyx AI Tools for E2B Sandbox
 * All tools use onyx_ prefix for consistency
 * This file contains type definitions and utilities for E2B sandbox operations.
 * Actual E2B SDK calls are made via the e2bService.ts file.
 */

// Safety guardrails
const FORBIDDEN_PATTERNS = [
  /rm\s+-rf/i,
  /shutdown/i,
  /reboot/i,
  /mkfs/i,
  /:(){/, // fork bomb
  /dd\s+if=/i, // dangerous disk ops
  />\s*\/dev\/sd/i, // writing to disks
  /chmod\s+777/i, // dangerous permissions
];

export function validateCommand(cmd: string): void {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(cmd)) {
      throw new Error(
        `🚨 Forbidden command detected: "${cmd}". This operation is not allowed for security reasons.`
      );
    }
  }
}

export interface ExecuteRequest {
  commands: string[];
}

export interface ExecuteResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface WorkerRequest {
  type: 'execute_command' | 'write_file' | 'read_file' | 'setup_project' | 'start_dev_server' | 'list_files';
  command?: string;
  path?: string;
  content?: string;
  files?: Array<{ path: string; content: string }>;
  apiKey: string;
  projectId: string;
  port?: number;
}

export interface WorkerResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: number;
}

/**
 * Format commands for safe execution
 */
export function formatCommand(cmd: string): string {
  // Escape single quotes for bash -c execution
  return cmd.replace(/'/g, "'\\''");
}

/**
 * Parse Onyx tool call from AI response
 * Supports both onyx_* prefixed tools and legacy tools
 */
export function parseToolCall(text: string): { name: string; args: Record<string, unknown> } | null {
  // Look for ```json tool blocks with onyx_ prefix
  const toolMatch = text.match(/```json\s*\{[\s\S]*?"tool"\s*:\s*"onyx_[^"]+"[\s\S]*?\}\s*```/);
  if (toolMatch) {
    try {
      const jsonStr = toolMatch[0].replace(/```json\s*/, '').replace(/\s*```/, '');
      const parsed = JSON.parse(jsonStr);
      if (parsed.tool && parsed.args) {
        return { name: parsed.tool, args: parsed.args };
      }
    } catch {
      return null;
    }
  }
  
  // Look for ```tool-use blocks
  const toolUseMatch = text.match(/```tool-use\s*\n([\s\S]*?)\n```/);
  if (toolUseMatch) {
    try {
      const parsed = JSON.parse(toolUseMatch[1]);
      if (parsed.tool && parsed.args) {
        return { name: parsed.tool, args: parsed.args };
      }
    } catch {
      return null;
    }
  }
  
  // Look for JSON tool calls with onyx_ prefix
  const jsonMatch = text.match(/\{[\s\S]*?"tool"\s*:\s*"onyx_[^"]+"[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.tool && parsed.args) {
        return { name: parsed.tool, args: parsed.args };
      }
    } catch {
      return null;
    }
  }
  
  // Legacy support: look for terminal tool
  const legacyMatch = text.match(/```json\s*\{[\s\S]*?"tool"\s*:\s*"terminal"[\s\S]*?\}\s*```/);
  if (legacyMatch) {
    try {
      const jsonStr = legacyMatch[0].replace(/```json\s*/, '').replace(/\s*```/, '');
      const parsed = JSON.parse(jsonStr);
      if (parsed.tool && parsed.args) {
        return { name: 'onyx_terminal', args: parsed.args };
      }
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Onyx Tool definitions for AI to use
 * All tools use onyx_ prefix
 */
export const AVAILABLE_TOOLS = [
  {
    name: 'onyx_write_file',
    description: 'Write content to a file in the sandbox',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path (e.g., /src/App.tsx)' },
        content: { type: 'string', description: 'File content' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'onyx_read_file',
    description: 'Read content from a file in the sandbox',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' },
      },
      required: ['path'],
    },
  },
  {
    name: 'onyx_run_command',
    description: 'Run a bash command in the sandbox',
    parameters: {
      type: 'object',
      properties: {
        cmd: { type: 'string', description: 'Command to run' },
        timeout: { type: 'number', description: 'Timeout in ms (optional)' },
      },
      required: ['cmd'],
    },
  },
  {
    name: 'onyx_list_files',
    description: 'List files in a directory',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path' },
      },
      required: ['path'],
    },
  },
  {
    name: 'onyx_start_dev_server',
    description: 'Start the development server',
    parameters: {
      type: 'object',
      properties: {
        port: { type: 'number', description: 'Port number (default: 3000)' },
      },
    },
  },
  {
    name: 'onyx_install_packages',
    description: 'Install npm packages',
    parameters: {
      type: 'object',
      properties: {
        packages: { type: 'array', description: 'Array of package names' },
        save: { type: 'boolean', description: 'Save to package.json (default: true)' },
      },
      required: ['packages'],
    },
  },
  {
    name: 'onyx_search_files',
    description: 'Search for text patterns in files using regex',
    parameters: {
      type: 'object',
      properties: {
        regex: { type: 'string', description: 'Regular expression pattern' },
        path: { type: 'string', description: 'Directory path to search' },
        file_pattern: { type: 'string', description: 'File glob pattern (e.g., *.ts)' },
      },
      required: ['regex'],
    },
  },
  {
    name: 'onyx_grep',
    description: 'Search for text patterns with context',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Text pattern to search for' },
        path: { type: 'string', description: 'Directory path to search in' },
        case_sensitive: { type: 'boolean', description: 'Case sensitive (default: false)' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'onyx_replace_in_file',
    description: 'Replace text in an existing file',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to modify' },
        old_str: { type: 'string', description: 'Exact string to find' },
        new_str: { type: 'string', description: 'Replacement string' },
      },
      required: ['path', 'old_str', 'new_str'],
    },
  },
  {
    name: 'onyx_ls',
    description: 'List directory contents',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to list (default: /)' },
      },
    },
  },
  {
    name: 'onyx_mkdir',
    description: 'Create a new directory',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path to create' },
      },
      required: ['path'],
    },
  },
  {
    name: 'onyx_rm',
    description: 'Remove a file or directory',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to remove' },
        recursive: { type: 'boolean', description: 'Remove recursively (default: false)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'onyx_mv',
    description: 'Move or rename a file or directory',
    parameters: {
      type: 'object',
      properties: {
        src: { type: 'string', description: 'Source path' },
        dest: { type: 'string', description: 'Destination path' },
      },
      required: ['src', 'dest'],
    },
  },
  {
    name: 'onyx_cp',
    description: 'Copy a file or directory',
    parameters: {
      type: 'object',
      properties: {
        src: { type: 'string', description: 'Source path' },
        dest: { type: 'string', description: 'Destination path' },
      },
      required: ['src', 'dest'],
    },
  },
  {
    name: 'onyx_exec',
    description: 'Execute a command and capture output',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute' },
        timeout: { type: 'number', description: 'Timeout in milliseconds' },
      },
      required: ['command'],
    },
  },
  {
    name: 'onyx_cat',
    description: 'Read and display file content',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' },
      },
      required: ['path'],
    },
  },
  {
    name: 'onyx_touch',
    description: 'Create an empty file',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path for new file' },
      },
      required: ['path'],
    },
  },
  {
    name: 'onyx_glob',
    description: 'Find files matching a glob pattern',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern (e.g., **/*.tsx)' },
        path: { type: 'string', description: 'Base path for search' },
      },
      required: ['pattern'],
    },
  },
];

/**
 * Safely extract content from sandbox response
 * Fixes [object Object] errors by proper serialization
 */
export function extractResponseContent(response: unknown): string {
  if (response === null || response === undefined) {
    return '';
  }
  
  if (typeof response === 'string') {
    return response;
  }
  
  if (typeof response === 'number' || typeof response === 'boolean') {
    return String(response);
  }
  
  if (response instanceof Error) {
    return response.message;
  }
  
  if (Array.isArray(response)) {
    return response.map(item => extractResponseContent(item)).filter(Boolean).join('\n');
  }
  
  if (typeof response === 'object') {
    // Try to get common response fields first
    const obj = response as Record<string, unknown>;
    
    if ('stdout' in obj && typeof obj.stdout === 'string') {
      return obj.stdout;
    }
    if ('content' in obj && typeof obj.content === 'string') {
      return obj.content;
    }
    if ('text' in obj && typeof obj.text === 'string') {
      return obj.text;
    }
    if ('message' in obj) {
      const msg = obj.message;
      if (typeof msg === 'string') {
        return msg;
      }
      if (typeof msg === 'object' && msg !== null) {
        // Handle {message: {text: ...}} or similar nested structures
        return extractResponseContent(msg);
      }
    }
    if ('data' in obj) {
      const data = obj.data;
      if (typeof data === 'string') {
        return data;
      }
      if (typeof data === 'object' && data !== null) {
        return extractResponseContent(data);
      }
    }
    
    // Last resort: JSON stringify but avoid [object Object]
    try {
      const json = JSON.stringify(response, null, 2);
      // If the JSON is just {[object Object]: ...}, something went wrong
      if (json.includes('"[object Object]"')) {
        return 'Response received but content could not be parsed. Check sandbox status.';
      }
      return json;
    } catch {
      return 'Unable to parse response content';
    }
  }
  
  return String(response);
}

