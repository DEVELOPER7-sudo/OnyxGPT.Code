/**
 * Puter Cloud Worker for E2B Sandbox Execution (ES Module)
 * 
 * This worker runs in Puter's cloud infrastructure.
 * It handles all E2B API calls without exposing credentials.
 * 
 * Deploy via Puter Dashboard:
 * 1. Go to https://puter.com/dashboard
 * 2. Workers section
 * 3. Create new worker
 * 4. Copy this entire file
 * 5. Name it: e2b-worker
 * 6. Deploy
 * 
 * Access via: puter.app.run('e2b-worker', {...})
 */

// Import E2B SDK (available in Puter worker environment)
import { Sandbox } from '@e2b/sdk';

const sandboxInstances = new Map();
const SANDBOX_TIMEOUT = 55 * 60 * 1000; // 55 minutes

// Safety guardrails
const FORBIDDEN_PATTERNS = [
  /rm\s+-rf/i,
  /shutdown/i,
  /reboot/i,
  /mkfs/i,
  /:(){/,
  /dd\s+if=/i,
  />\s*\/dev\/sd/i,
  /chmod\s+777/i,
];

function validateCommand(cmd) {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(cmd)) {
      throw new Error(
        `🚨 Forbidden command detected: "${cmd}". This operation is not allowed for security reasons.`
      );
    }
  }
}

/**
 * Get or create sandbox
 */
async function getSandbox(projectId) {
  const cached = sandboxInstances.get(projectId);
  
  if (cached && Date.now() - cached.createdAt < SANDBOX_TIMEOUT) {
    console.log(`✅ Using cached sandbox: ${cached.id}`);
    return cached.sandbox;
  }

  console.log(`🚀 Creating new E2B sandbox for project: ${projectId}`);
  
  try {
    const sandbox = await Sandbox.create({
      timeout: 60 * 60 * 1000, // 1 hour
    });

    sandboxInstances.set(projectId, {
      id: sandbox.id,
      sandbox: sandbox,
      createdAt: Date.now(),
    });

    console.log(`✅ Sandbox created: ${sandbox.id}`);
    return sandbox;
  } catch (error) {
    console.error('Failed to create sandbox:', error.message);
    throw new Error(`Failed to create E2B sandbox: ${error.message}`);
  }
}

/**
 * Execute commands in sandbox
 */
async function executeCommands(commands, projectId) {
  if (!Array.isArray(commands) || !commands.every(c => typeof c === 'string')) {
    throw new Error('Expected: { commands: string[] }');
  }

  // Validate all commands
  for (const cmd of commands) {
    validateCommand(cmd);
  }

  let sandbox = null;
  let output = '';
  let allStderr = '';
  let exitCode = 0;

  try {
    sandbox = await getSandbox(projectId);

    // Execute each command
    for (const cmd of commands) {
      console.log(`📝 Executing: ${cmd}`);

      try {
        const result = await sandbox.process.run({
          cmd: 'bash',
          args: ['-c', cmd],
          timeout: 60_000,
        });

        if (result.stdout) {
          output += `\n$ ${cmd}\n${result.stdout}`;
        }
        if (result.stderr) {
          allStderr += `\n${result.stderr}`;
        }

        exitCode = result.exitCode || 0;

        if (exitCode !== 0) {
          console.warn(`⚠️  Command exited with code ${exitCode}: ${cmd}`);
        }
      } catch (error) {
        console.error(`❌ Command execution error: ${error.message}`);
        allStderr += `\nError executing "${cmd}": ${error.message}`;
        exitCode = 1;
      }
    }

    return {
      success: true,
      stdout: output.trim(),
      stderr: allStderr.trim(),
      exitCode,
      sandboxId: sandbox.id,
    };
  } catch (error) {
    console.error('Execution error:', error.message);
    return {
      success: false,
      error: error.message,
      exitCode: 1,
    };
  }
}

/**
 * Cleanup sandbox
 */
async function cleanupSandbox(projectId) {
  const cached = sandboxInstances.get(projectId);
  if (cached) {
    try {
      await cached.sandbox.kill();
      sandboxInstances.delete(projectId);
      console.log(`🧹 Sandbox cleaned up: ${cached.id}`);
      return { success: true };
    } catch (error) {
      console.error('Cleanup error:', error.message);
      return { success: false, error: error.message };
    }
  }
  return { success: true };
}

/**
 * HTTP request handler for Puter worker
 */
async function handleRequest(request) {
  try {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200 });
    }

    // Parse body for POST requests
    let body = {};
    if (request.method === 'POST') {
      try {
        body = await request.json();
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid JSON body' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const { action, commands, projectId } = body;
    const url = new URL(request.url);
    const path = url.pathname;

    console.log(`${request.method} ${path}`, { action, projectId });

    // Route based on path or action
    if (path.includes('/execute') || action === 'execute') {
      if (!projectId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing projectId' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (!commands) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing commands' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const result = await executeCommands(commands, projectId);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path.includes('/cleanup') || action === 'cleanup') {
      if (!projectId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing projectId' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const result = await cleanupSandbox(projectId);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default handler
    return new Response(
      JSON.stringify({
        success: false,
        error: `Unknown action or path: ${action || path}`,
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Worker error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Legacy handler for Puter's message-based API
 */
async function handler(message) {
  try {
    const { action, commands, projectId } = message;

    if (!projectId) {
      return {
        success: false,
        error: 'Missing required field: projectId',
      };
    }

    switch (action) {
      case 'execute':
        if (!commands) {
          return {
            success: false,
            error: 'Missing required field: commands',
          };
        }
        return await executeCommands(commands, projectId);

      case 'cleanup':
        return await cleanupSandbox(projectId);

      default:
        return {
          success: false,
          error: `Unknown action: ${action}`,
        };
    }
  } catch (error) {
    console.error('Worker error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Puter worker exports (ES modules)
export { handler, handleRequest };
