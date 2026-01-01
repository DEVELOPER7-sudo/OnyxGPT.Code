export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  content?: string // only for files, loaded on demand
  language?: string // for syntax highlighting
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool-call' | 'tool-result'
  content: string
  timestamp: number
  toolName?: string
  toolArgs?: Record<string, any>
  toolResult?: any
  artifacts?: Artifact[]
}

export interface Artifact {
  id: string
  type: 'file-change' | 'new-file' | 'file-delete'
  path: string
  oldContent?: string
  newContent?: string
  language?: string
  diff?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
  ownerId: string // user.id or 'anon-xxx'
  messages: Message[]
  fileTree: FileNode
  e2bSandboxId?: string
  lastPreviewUrl?: string
  settings: {
    model?: string
    temperature?: number
    autoPreview: boolean
  }
}

export interface User {
  id: string
  username?: string
  email?: string
}

export interface PuterUser {
  id?: string
  username?: string
  email?: string
}

export interface E2BFile {
  name: string
  type: 'file' | 'dir'
  isDir: boolean
}
