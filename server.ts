/**
 * Backend server for AI Terminal Tool execution
 * This runs alongside the Vite dev server and handles E2B sandbox operations
 * 
 * Run with: npx ts-node server.ts
 */

import express, { Request, Response } from 'express';
import { Sandbox } from '@e2b/sdk';

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(express.json());

// Safety guardrails - forbidden patterns
const FORBIDDEN_PATTERNS = [
  /rm\s+-rf/i,
  /shutdown/i,
  /reboot/i,
  /mkfs/i,
  /:(){/,  // fork bomb
  /dd\s+if=/i,  // dangerous disk ops
  />\s*\/dev\/sd/i,  // writing to disks
  /chmod\s+777/i,  // dangerous permissions
];

/**
 * Validates commands for dangerous patterns
 */
function validateCommands(commands: string[]): void {
  for (const cmd of commands) {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(cmd)) {
        throw new Error(
          `🚨 Forbidden command detected: "${cmd}". This operation is not allowed for security reasons.`
        );
      }
    }
  }
}

interface TerminalRequest extends Request {
  headers: {
    'x-e2b-api-key'?: string;
    [key: string]: string | string[] | undefined;
  };
}

/**
 * POST /api/terminal
 * Execute commands in E2B sandbox
 */
app.post('/api/terminal', async (req: TerminalRequest, res: Response) => {
  try {
    const apiKey = req.headers['x-e2b-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        error: 'E2B API key not provided in X-E2B-API-Key header',
      });
    }

    if (typeof apiKey !== 'string') {
      return res.status(400).json({
        error: 'Invalid API key format',
      });
    }

    const { commands } = req.body;

    if (!Array.isArray(commands) || !commands.every((c) => typeof c === 'string')) {
      return res.status(400).json({
        error: 'Expected: { commands: string[] }',
      });
    }

    // Validate commands
    try {
      validateCommands(commands);
    } catch (error) {
      return res.status(403).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }

    console.log(`🚀 Creating E2B sandbox for ${commands.length} command(s)...`);

    let sandbox: Sandbox | null = null;

    try {
      // Create sandbox
      sandbox = await Sandbox.create({
        apiKey,
        timeout: 60 * 60 * 1000, // 1 hour
      });

      console.log(`✅ Sandbox created: ${sandbox.id}`);

      let output = '';
      let allStderr = '';
      let exitCode = 0;

      // Execute each command
      for (const cmd of commands) {
        console.log(`📝 Executing: ${cmd}`);

        try {
          const result = await sandbox.process.run({
            cmd: 'bash',
            args: ['-c', cmd],
            timeout: 60_000, // 60 second timeout per command
          });

          // Accumulate output
          if (result.stdout) {
            output += `\n$ ${cmd}\n${result.stdout}`;
          }
          if (result.stderr) {
            allStderr += `\n${result.stderr}`;
          }

          exitCode = result.exitCode || 0;

          if (exitCode !== 0) {
            console.warn(
              `⚠️  Command exited with code ${exitCode}: ${cmd}`
            );
            // Continue to next command even if one fails
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`❌ Command execution error: ${errorMsg}`);
          allStderr += `\nError executing "${cmd}": ${errorMsg}`;
          exitCode = 1;
        }
      }

      return res.json({
        stdout: output.trim(),
        stderr: allStderr.trim(),
        exitCode,
      });
    } finally {
      // Cleanup
      if (sandbox) {
        try {
          await sandbox.kill();
          console.log('🧹 Sandbox cleaned up');
        } catch (error) {
          console.warn('Warning cleaning up sandbox:', error);
        }
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Terminal API error:', errorMsg);
    return res.status(500).json({
      error: errorMsg,
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Terminal API server running on http://localhost:${PORT}`);
  console.log('Set X-E2B-API-Key header in requests to use the terminal API');
});
