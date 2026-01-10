/**
 * Puter Cloud Backend Server
 * 
 * Deploy this as a Puter App that acts as a backend server
 * Runs E2B commands securely in Puter's cloud
 * 
 * Client calls: https://your-puter-app.puter.app/api/execute
 */

const { Sandbox } = require('@e2b/sdk');

const sandboxInstances = new Map();
const SANDBOX_TIMEOUT = 55 * 60 * 1000;

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

async function getSandbox(projectId) {
  const cached = sandboxInstances.get(projectId);
  
  if (cached && Date.now() - cached.createdAt < SANDBOX_TIMEOUT) {
    console.log(`✅ Using cached sandbox: ${cached.id}`);
    return cached.sandbox;
  }

  console.log(`🚀 Creating new E2B sandbox for project: ${projectId}`);
  
  try {
    const sandbox = await Sandbox.create({
      timeout: 60 * 60 * 1000,
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

async function executeCommands(commands, projectId) {
  if (!Array.isArray(commands) || !commands.every(c => typeof c === 'string')) {
    throw new Error('Expected: { commands: string[] }');
  }

  for (const cmd of commands) {
    validateCommand(cmd);
  }

  let sandbox = null;
  let output = '';
  let allStderr = '';
  let exitCode = 0;

  try {
    sandbox = await getSandbox(projectId);

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

// Export for Puter App
module.exports = {
  executeCommands,
  cleanupSandbox,
};
