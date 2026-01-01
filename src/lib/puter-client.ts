/**
 * Puter.js client wrapper with TypeScript support
 * All cloud operations (auth, KV, FS, AI) routed through puter.*
 */

declare global {
  interface Window {
    puter?: {
      auth: {
        getUser(): Promise<any>
      }
      kv: {
        get(key: string): Promise<any>
        set(key: string, value: any): Promise<void>
        del(key: string): Promise<void>
        list(pattern: string): Promise<string[]>
      }
      fs: {
        readFile(path: string): Promise<string>
        writeFile(path: string, content: string | Blob): Promise<void>
        delete(path: string): Promise<void>
        mkdir(path: string): Promise<void>
        listdir(path: string): Promise<any[]>
      }
      ai: {
        chat(
          messages: any[],
          options?: {
            stream?: boolean
            model?: string
          }
        ): Promise<any> | AsyncIterableIterator<any>
      }
      ui: {
        alert(message: string): Promise<void>
      }
    }
  }
}

export const puterReady = (): boolean => {
  return typeof window !== 'undefined' && window.puter !== undefined
}

export const getPuter = () => {
  if (!puterReady()) {
    throw new Error('Puter.js not available. Check internet connection.')
  }
  return window.puter!
}

export async function getPuterUser() {
  try {
    const puter = getPuter()
    const user = await puter.auth.getUser()
    return user || null
  } catch (error) {
    console.error('Error getting Puter user:', error)
    return null
  }
}

export async function kvGet(key: string) {
  const puter = getPuter()
  return puter.kv.get(key)
}

export async function kvSet(key: string, value: any) {
  const puter = getPuter()
  return puter.kv.set(key, value)
}

export async function kvDel(key: string) {
  const puter = getPuter()
  return puter.kv.del(key)
}

export async function kvList(pattern: string): Promise<string[]> {
  const puter = getPuter()
  try {
    return await puter.kv.list(pattern)
  } catch {
    return []
  }
}

export async function fsReadFile(path: string): Promise<string> {
  const puter = getPuter()
  return puter.fs.readFile(path)
}

export async function fsWriteFile(path: string, content: string) {
  const puter = getPuter()
  // Ensure parent dir exists
  const pathParts = path.split('/').filter(Boolean)
  const parentDir = '/' + pathParts.slice(0, -1).join('/')
  if (pathParts.length > 1) {
    try {
      await puter.fs.mkdir(parentDir)
    } catch {
      // dir might already exist
    }
  }
  return puter.fs.writeFile(path, content)
}

export async function fsDelete(path: string) {
  const puter = getPuter()
  return puter.fs.delete(path)
}

export async function fsList(path: string) {
  const puter = getPuter()
  return puter.fs.listdir(path)
}

export async function aiChat(
  messages: any[],
  options?: { stream?: boolean; model?: string }
) {
  const puter = getPuter()
  return puter.ai.chat(messages, options)
}

export async function uiAlert(message: string) {
  const puter = getPuter()
  return puter.ui.alert(message)
}
