/**
 * E2B Sandbox integration
 * API key: e2b_a8bf5367c9183a37482e52661bc26ca7fec29a9c
 */

// This will be installed via npm: @e2b/sdk
// For now, we'll provide stub implementations that can be replaced

export interface SandboxFile {
  name: string
  isDir: boolean
}

export interface SandboxResponse {
  stdout: string
  stderr: string
  exitCode: number
}

let sandboxInstance: any = null

export async function createSandbox(): Promise<string> {
  try {
    // Import E2B SDK dynamically
    const { Sandbox } = await import('@e2b/sdk')
    sandboxInstance = await Sandbox.create()
    return sandboxInstance.id
  } catch (error) {
    console.error('Failed to create E2B sandbox:', error)
    throw new Error('E2B sandbox unavailable. Check API key.')
  }
}

export async function getSandbox(sandboxId: string): Promise<any> {
  if (sandboxInstance?.id === sandboxId) {
    return sandboxInstance
  }
  try {
    const { Sandbox } = await import('@e2b/sdk')
    sandboxInstance = await Sandbox.connect(sandboxId)
    return sandboxInstance
  } catch (error) {
    console.error('Failed to connect to sandbox:', error)
    return null
  }
}

export async function runCommand(
  sandboxId: string,
  cmd: string,
  timeout: number = 60000
): Promise<SandboxResponse> {
  const sandbox = await getSandbox(sandboxId)
  if (!sandbox) throw new Error('Sandbox not available')

  const result = await Promise.race([
    sandbox.exec(cmd),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Command timeout')), timeout)
    ),
  ])

  return result as SandboxResponse
}

export async function writeFile(
  sandboxId: string,
  path: string,
  content: string
): Promise<void> {
  const sandbox = await getSandbox(sandboxId)
  if (!sandbox) throw new Error('Sandbox not available')

  // E2B SDK method: writeFile
  await sandbox.files.write(path, content)
}

export async function readFile(sandboxId: string, path: string): Promise<string> {
  const sandbox = await getSandbox(sandboxId)
  if (!sandbox) throw new Error('Sandbox not available')

  const file = await sandbox.files.read(path)
  return file
}

export async function listFiles(sandboxId: string, path: string): Promise<SandboxFile[]> {
  const sandbox = await getSandbox(sandboxId)
  if (!sandbox) throw new Error('Sandbox not available')

  const files = await sandbox.files.list(path)
  return files
}

export async function deleteSandbox(sandboxId: string): Promise<void> {
  const sandbox = await getSandbox(sandboxId)
  if (sandbox) {
    await sandbox.close()
  }
  if (sandboxInstance?.id === sandboxId) {
    sandboxInstance = null
  }
}

export async function startDevServer(
  sandboxId: string
): Promise<string> {
  const sandbox = await getSandbox(sandboxId)
  if (!sandbox) throw new Error('Sandbox not available')

  // Try multiple dev server commands
  const commands = [
    'npm run dev',
    'pnpm dev',
    'bun dev',
    'yarn dev',
  ]

  for (const cmd of commands) {
    try {
      const result = await runCommand(sandboxId, cmd, 10000)
      if (result.exitCode === 0) {
        // Extract public URL from sandbox (typically available via sandbox.getPublicUrl())
        const publicUrl = `https://${sandbox.id}.e2b.dev`
        return publicUrl
      }
    } catch {
      // Try next command
    }
  }

  throw new Error('Could not start dev server')
}

export async function takeScreenshot(sandboxId: string): Promise<string> {
  // E2B SDK provides screenshot via browser context
  // For now, return placeholder
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
}
