/**
 * AI Terminal Service
 * Handles terminal execution through E2B sandbox with proper error handling
 * Fixes the "[object Object]" error in sandbox responses
 * Uses Onyx tool naming convention
 */

import type { Message } from '@/types/project';
import { v4 as uuidv4 } from 'uuid';
import { puterE2BClient } from '@/services/puterApiClient';

export interface TerminalToolCall {
  tool: 'onyx_terminal' | 'terminal';
  command: string;
  args?: string[];
  projectId: string;
}

export interface TerminalResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  sandboxId?: string;
  error?: string;
}

/**
 * Format error to string safely (fixes "[object Object]" error)
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    // Try to get a meaningful string representation
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('toString' in error && typeof error.toString === 'function') {
      try {
        const str = (error as any).toString();
        if (str !== '[object Object]') {
          return str;
        }
      } catch (e) {
        // Fall through
      }
    }
    // Last resort: JSON stringify with limited depth
    try {
      return JSON.stringify(error, null, 2).slice(0, 500);
    } catch (e) {
      return 'Unknown error occurred';
    }
  }
  return String(error);
}

/**
 * Validate sandbox response object
 */
function validateSandboxResponse(response: any): TerminalResult | null {
  if (!response) {
    return null;
  }

  // Check if response has expected properties
  if (
    typeof response === 'object' &&
    'success' in response &&
    typeof response.success === 'boolean'
  ) {
    return {
      success: response.success,
      stdout: String(response.stdout || ''),
      stderr: String(response.stderr || ''),
      exitCode: Number(response.exitCode || 1),
      sandboxId: String(response.sandboxId || ''),
      error: response.error ? String(response.error) : undefined,
    };
  }

  return null;
}

/**
 * Handle AI terminal tool calls
 * Called when the AI requests to execute a command
 */
export async function handleAITerminalToolCall(
  toolCall: TerminalToolCall,
  apiKey: string
): Promise<string> {
  try {
    if (!apiKey) {
      return '❌ E2B API key not configured. Cannot execute terminal commands.';
    }

    if (!toolCall.command) {
      return '❌ No command specified in terminal tool call.';
    }

    console.log('🔧 Handling terminal tool call:', {
      command: toolCall.command,
      projectId: toolCall.projectId,
    });

    // Use the Puter worker-backed client (prevents [object Object] + env URL issues)
    const exec = await puterE2BClient.executeCommand(toolCall.command, apiKey, toolCall.projectId);

    const stdout = typeof exec.stdout === 'string' ? exec.stdout : JSON.stringify(exec.stdout, null, 2);
    const stderr = typeof exec.stderr === 'string' ? exec.stderr : JSON.stringify(exec.stderr, null, 2);

    let output = stdout || '';
    if (stderr) {
      output += `\n⚠️ Warnings:\n${stderr}`;
    }

    return output.trim() || '✅ Command executed successfully';
  } catch (error) {
    const errorMsg = formatError(error);
    console.error('❌ Terminal tool error:', errorMsg);
    return `❌ Terminal error: ${errorMsg}`;
  }
}

/**
 * Execute commands in E2B sandbox
 */
async function executeInSandbox(
  commands: string[],
  projectId: string,
  apiKey: string
): Promise<any> {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_E2B_WORKER_URL || 'https://worker.puter.com'}/api/e2b/execute`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          commands,
          projectId,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Sandbox request failed: ${response.status} ${response.statusText} - ${text}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    const errorMsg = formatError(error);
    console.error('❌ Sandbox request error:', errorMsg);
    throw new Error(`Failed to execute in sandbox: ${errorMsg}`);
  }
}

/**
 * Create a terminal message from tool call
 */
export function createTerminalMessage(
  command: string,
  result: TerminalResult
): Message {
  const exitCodeColor = result.exitCode === 0 ? '✅' : '❌';
  const content = `
\`\`\`bash
$ ${command}
${result.stdout}
${result.stderr ? `stderr: ${result.stderr}` : ''}
${exitCodeColor} Exit code: ${result.exitCode}
\`\`\`
`;

  return {
    id: uuidv4(),
    role: 'assistant',
    content: content.trim(),
    timestamp: Date.now(),
  };
}

/**
 * Safely parse tool call from AI response
 */
export function parseToolCall(content: string): TerminalToolCall | null {
  try {
    // Try to find JSON code block
    const match = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    
    if (!match) {
      return null;
    }

    const toolCall = JSON.parse(match[1]);

    if (toolCall.tool === 'terminal' || toolCall.tool === 'onyx_terminal') {
      return {
        tool: 'terminal',
        command: String(toolCall.command),
        args: Array.isArray(toolCall.args) ? toolCall.args.map(String) : undefined,
        projectId: String(toolCall.projectId || ''),
      };
    }

    return null;
  } catch (error) {
    console.warn('Failed to parse tool call:', error);
    return null;
  }
}

/**
 * Validate command safety
 */
export function isCommandSafe(command: string): boolean {
  const dangerousPatterns = [
    /rm\s+-rf/i,
    /shutdown/i,
    /reboot/i,
    /mkfs/i,
    /:(){/,
    /dd\s+if=/i,
    />\s*\/dev\/sd/i,
    /chmod\s+777/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return false;
    }
  }

  return true;
}
