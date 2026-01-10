import { Sandbox } from 'e2b';

interface SandboxInstance {
  id: string;
  sandbox: Sandbox;
  createdAt: number;
}

const sandboxInstances: Map<string, SandboxInstance> = new Map();
const initPromises: Map<string, Promise<Sandbox | null>> = new Map();

// E2B only works in backend environments or with proper setup
const isBrowserEnvironment = typeof window !== 'undefined';

export const initE2BSandbox = async (apiKey: string, projectId: string, retries: number = 3): Promise<Sandbox | null> => {
  if (isBrowserEnvironment) {
    console.warn('⚠️  E2B Sandbox only available via backend API');
    return null;
  }
  
  if (!apiKey) {
    console.warn('❌ E2B API key not configured');
    console.warn('   📝 Get your API key from: https://e2b.dev/dashboard');
    console.warn('   💾 Save it in Settings → E2B Sandbox Settings');
    return null;
  }

  // Check if already initialized for this project
  const existing = sandboxInstances.get(projectId);
  if (existing && Date.now() - existing.createdAt < 55 * 60 * 1000) {
    // Less than 55 minutes old
    console.log('Using cached sandbox:', existing.sandbox.sandboxId);
    return existing.sandbox;
  }

  // Check if already initializing
  const existingPromise = initPromises.get(projectId);
  if (existingPromise) {
    console.log('Sandbox initialization already in progress for project:', projectId);
    return existingPromise;
  }

  // Create new initialization promise with retry logic
  const initPromise = (async () => {
    let lastError: Error | null = null;
    
    try {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`🚀 [Attempt ${attempt}/${retries}] Initializing E2B sandbox for project: ${projectId}`);
          console.log(`   🔑 Using API key: ${apiKey.substring(0, 10)}...`);
          
          // Use Sandbox.create() with proper SDK 2.x syntax
          const sandbox = await Sandbox.create({
            apiKey: apiKey,
            timeoutMs: 60 * 60 * 1000, // 1 hour
          });

          console.log('✅ E2B sandbox initialized successfully:', sandbox.sandboxId);

          // Store instance
          sandboxInstances.set(projectId, {
            id: sandbox.sandboxId,
            sandbox,
            createdAt: Date.now(),
          });

          return sandbox;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          const errorMsg = lastError.message.toLowerCase();
          
          console.warn(`❌ [Attempt ${attempt}/${retries}] E2B sandbox initialization failed:`, errorMsg);
          
          // Provide specific error guidance
          if (errorMsg.includes('api') || errorMsg.includes('key') || errorMsg.includes('unauthorized') || errorMsg.includes('401')) {
            console.error('   ❌ API Key Error: Your E2B API key is invalid or missing');
            console.error('   📝 Get a valid key from: https://e2b.dev');
            console.error('   💾 Save it in Settings → Sandbox API Key');
          } else if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('econnrefused')) {
            console.error('   ⚠️  Network Error: Cannot reach E2B service');
            console.error('   🔍 Check your internet connection');
          } else if (errorMsg.includes('rate') || errorMsg.includes('429')) {
            console.error('   ⏱️  Rate Limit: Too many requests. Waiting before retry...');
          } else {
            console.error('   📋 Error:', lastError.message);
          }
          
          if (attempt < retries) {
            // Wait before retrying (exponential backoff)
            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`⏳ Retrying in ${waitTime}ms... (${attempt}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      console.error('✗ Failed to initialize E2B sandbox after', retries, 'attempts:', lastError?.message);
      return null;
    } finally {
      initPromises.delete(projectId);
    }
  })();

  initPromises.set(projectId, initPromise);
  return initPromise;
};

export const getSandbox = (projectId: string): Sandbox | null => {
  const instance = sandboxInstances.get(projectId);
  return instance ? instance.sandbox : null;
};

export const getSandboxId = (projectId: string): string | null => {
  const instance = sandboxInstances.get(projectId);
  return instance ? instance.id : null;
};

export const killSandbox = async (projectId: string): Promise<void> => {
  const instance = sandboxInstances.get(projectId);
  if (instance) {
    try {
      await instance.sandbox.kill();
      sandboxInstances.delete(projectId);
      console.log('E2B sandbox terminated:', projectId);
    } catch (error) {
      console.error('Error killing sandbox:', error);
      sandboxInstances.delete(projectId);
    }
  }
};

export const executeCommand = async (
  command: string,
  apiKey: string,
  projectId: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  const sb = await initE2BSandbox(apiKey, projectId);
  if (!sb) {
    throw new Error('E2B sandbox not initialized. Check your API key.');
  }

  try {
    console.log('🔧 Executing command:', command);
    // Use E2B SDK 2.x API: sandbox.commands.run()
    const result = await sb.commands.run(`bash -c '${command.replace(/'/g, "'\\''")}'`);

    // Safely extract output to prevent [object Object] errors
    const output = {
      stdout: result.stdout ? String(result.stdout) : '',
      stderr: result.stderr ? String(result.stderr) : '',
      exitCode: typeof result.exitCode === 'number' ? result.exitCode : 0,
    };

    console.log('✅ Command output:', output);
    return output;
  } catch (error) {
    console.error('❌ Command execution error:', error);
    // Provide better error handling for object object errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to execute command: ${errorMessage}`);
  }
};

export const writeFile = async (
  path: string,
  content: string,
  apiKey: string,
  projectId: string
): Promise<void> => {
  const sb = await initE2BSandbox(apiKey, projectId);
  if (!sb) throw new Error('E2B sandbox not initialized');

  try {
    await sb.files.write(path, content);
    console.log('File written:', path);
  } catch (error) {
    console.error('File write error:', error);
    throw error;
  }
};

export const readFile = async (
  path: string,
  apiKey: string,
  projectId: string
): Promise<string> => {
  const sb = await initE2BSandbox(apiKey, projectId);
  if (!sb) throw new Error('E2B sandbox not initialized');

  try {
    return await sb.files.read(path);
  } catch (error) {
    console.error('File read error:', error);
    throw error;
  }
};

export const listFiles = async (
  path: string,
  apiKey: string,
  projectId: string
): Promise<string[]> => {
  const sb = await initE2BSandbox(apiKey, projectId);
  if (!sb) throw new Error('E2B sandbox not initialized');

  try {
    const entries = await sb.files.list(path);
    return entries.map(e => e.name);
  } catch (error) {
    console.error('File list error:', error);
    throw error;
  }
};

export const setupProject = async (
  apiKey: string,
  projectId: string,
  files: { path: string; content: string }[]
): Promise<boolean> => {
  const sb = await initE2BSandbox(apiKey, projectId);
  if (!sb) return false;

  try {
    // Write all files
    for (const file of files) {
      await writeFile(file.path, file.content, apiKey, projectId);
    }

    // Initialize npm if package.json exists
    const hasPackageJson = files.some(f => f.path === 'package.json');
    if (hasPackageJson) {
      console.log('Installing dependencies...');
      await executeCommand('cd / && npm install --legacy-peer-deps 2>&1 | head -20', apiKey, projectId);
    }

    return true;
  } catch (error) {
    console.error('Failed to setup project:', error);
    return false;
  }
};

export const startDevServer = async (
  apiKey: string,
  projectId: string,
  port: number = 3000
): Promise<{ success: boolean; sandboxId: string | null }> => {
  const sb = await initE2BSandbox(apiKey, projectId);
  if (!sb) {
    console.error('E2B sandbox not initialized');
    return { success: false, sandboxId: null };
  }

  try {
    console.log(`Starting dev server on port ${port}...`);

    // Start dev server in background (don't wait for it)
    executeCommand(
      `cd / && timeout 300 npm run dev -- --port ${port} --host 0.0.0.0 > /tmp/server.log 2>&1 &
       sleep 1
       if [ ! -f /tmp/server.log ]; then
         timeout 300 npm run start -- --port ${port} --host 0.0.0.0 > /tmp/server.log 2>&1 &
         sleep 1
       fi
       if [ ! -f /tmp/server.log ]; then
         cd / && npx -y vite --port ${port} --host 0.0.0.0 > /tmp/server.log 2>&1 &
         sleep 2
       fi`,
      apiKey,
      projectId
    ).catch(err => console.warn('Dev server startup warning:', err));

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    return { success: true, sandboxId: sb.sandboxId };
  } catch (error) {
    console.error('Failed to start dev server:', error);
    return { success: true, sandboxId: sb.sandboxId }; // Still return true as server might be starting in background
  }
};

export const getServerPreviewUrl = (sandboxId: string, port: number = 3000): string => {
  return `https://${sandboxId}-${port}.e2b.dev`;
};

export const checkServerHealth = async (
  apiKey: string,
  projectId: string,
  port: number = 3000
): Promise<boolean> => {
  try {
    const result = await executeCommand(
      `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/ 2>/dev/null || echo "000"`,
      apiKey,
      projectId
    );

    const statusCode = parseInt(result.stdout.trim());
    return statusCode >= 200 && statusCode < 500;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};
