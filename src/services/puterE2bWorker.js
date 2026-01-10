/**
 * Puter Cloud Worker for E2B Sandbox Execution
 * 
 * This worker runs in Puter's cloud infrastructure using the global router object.
 * It handles all E2B API calls without exposing credentials.
 * 
 * Deploy via Puter Dashboard:
 * 1. Go to https://puter.com/dashboard
 * 2. Workers section
 * 3. Create new worker
 * 4. Copy this entire file
 * 5. Name it: e2b-worker
 * 6. Add dependency: @e2b/sdk
 * 7. Deploy
 */

const { Sandbox } = require('@e2b/sdk');

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

// Register routes with Puter's global router object
if (typeof router !== 'undefined') {
  /**
   * POST /execute
   * Execute commands in sandbox
   */
  router.post('/execute', async (req, res) => {
    try {
      console.log('POST /execute', req.body);
      
      const { commands, projectId } = req.body;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: projectId',
        });
      }

      if (!commands) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: commands',
        });
      }

      const result = await executeCommands(commands, projectId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Route error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /cleanup
   * Cleanup and kill sandbox
   */
  router.post('/cleanup', async (req, res) => {
    try {
      console.log('POST /cleanup', req.body);
      
      const { projectId } = req.body;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: projectId',
        });
      }

      const result = await cleanupSandbox(projectId);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Route error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /deploy
   * Deploy a project with language detection
   */
  router.post('/deploy', async (req, res) => {
    try {
      console.log('POST /deploy', req.body);
      
      const { projectId, language, buildCommand, runCommand, port } = req.body;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: projectId',
        });
      }

      if (!buildCommand || !runCommand) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: buildCommand and runCommand',
        });
      }

      let sandbox = await getSandbox(projectId);
      
      // Run build commands
      console.log(`🔨 Building ${language} project...`);
      const buildResult = await sandbox.process.run({
        cmd: 'bash',
        args: ['-c', buildCommand],
        timeout: 300_000, // 5 minutes
      });

      if (buildResult.exitCode !== 0) {
        console.error(`❌ Build failed for ${language} project`);
        return res.status(400).json({
          success: false,
          error: `Build failed: ${buildResult.stderr || buildResult.stdout}`,
          stdout: buildResult.stdout,
          stderr: buildResult.stderr,
          exitCode: buildResult.exitCode,
        });
      }

      console.log('✅ Build successful');

      // Start application
      console.log(`🚀 Starting application on port ${port}...`);
      const runResult = await sandbox.process.run({
        cmd: 'bash',
        args: ['-c', `${runCommand} > /tmp/app.log 2>&1 &`],
        timeout: 10_000,
      });

      console.log('✅ Application started');

      return res.status(200).json({
        success: true,
        sandboxId: sandbox.id,
        port,
        language,
        message: `${language} project deployed successfully`,
      });
    } catch (error) {
      console.error('Deployment error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Deployment failed',
      });
    }
  });

  /**
   * GET / (health check)
   */
  router.get('/', (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'E2B worker is running',
    });
  });

  console.log('✅ E2B Worker routes registered');
}
