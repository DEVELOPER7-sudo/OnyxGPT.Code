/**
 * Zustand store for project state
 * Handles project metadata, messages, file tree
 * Persists to Puter KV
 */

import { create } from 'zustand'
import { Project, FileNode, Message } from '@/types'
import { kvGet, kvSet, kvList } from './puter-client'

// Simple UUID generation
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

interface ProjectState {
  // Current project
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void

  // Projects list
  projects: Project[]
  loadProjects: () => Promise<void>

  // Project operations
  createProject: (name: string, description?: string) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  updateProjectName: (id: string, name: string) => Promise<void>

  // Messages
  addMessage: (message: Message) => Promise<void>
  clearMessages: () => Promise<void>

  // File tree operations
  updateFileTree: (fileTree: FileNode) => Promise<void>
  addFile: (path: string, content: string, language?: string) => Promise<void>
  deleteFile: (path: string) => Promise<void>
  updateFile: (path: string, content: string) => Promise<void>
  readFile: (path: string) => Promise<string>

  // Settings
  updateSettings: (settings: Partial<Project['settings']>) => Promise<void>

  // E2B sandbox
  setSandboxId: (id: string | undefined) => Promise<void>
}

const initialFileTree: FileNode = {
  name: 'root',
  path: '/',
  type: 'directory',
  children: [
    {
      name: 'src',
      path: '/src',
      type: 'directory',
      children: [
        {
          name: 'App.tsx',
          path: '/src/App.tsx',
          type: 'file',
          language: 'typescript',
          content: 'export default function App() {\n  return <div>Hello World</div>\n}\n',
        },
        {
          name: 'main.tsx',
          path: '/src/main.tsx',
          type: 'file',
          language: 'typescript',
          content: 'import React from "react"\nimport App from "./App"\n\nReact.createRoot(document.getElementById("root")!).render(<App />)\n',
        },
      ],
    },
    {
      name: 'package.json',
      path: '/package.json',
      type: 'file',
      language: 'json',
      content: JSON.stringify(
        {
          name: 'onyxgpt-project',
          version: '0.1.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'vite build',
          },
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
          },
        },
        null,
        2
      ),
    },
  ],
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  projects: [],

  setCurrentProject: (project) => {
    set({ currentProject: project })
  },

  loadProjects: async () => {
    try {
      const keys = await kvList('onyx:project:*')
      const projects: Project[] = []

      for (const key of keys) {
        const data = await kvGet(key)
        if (data) {
          projects.push(data as Project)
        }
      }

      set({ projects: projects.sort((a, b) => b.createdAt - a.createdAt) })
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  },

  createProject: async (name, description) => {
    const id = generateId()
    const now = Date.now()

    const project: Project = {
      id,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      ownerId: 'anon-' + generateId(), // Will be replaced with real user ID
      messages: [],
      fileTree: { ...initialFileTree },
      settings: {
        autoPreview: true,
        temperature: 0.7,
      },
    }

    await kvSet(`onyx:project:${id}`, project)
    set((state) => ({ projects: [project, ...state.projects] }))

    return project
  },

  deleteProject: async (id) => {
    await kvSet(`onyx:project:${id}`, null)
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }))
  },

  updateProjectName: async (id, name) => {
    const project = get().projects.find((p) => p.id === id)
    if (!project) return

    project.name = name
    project.updatedAt = Date.now()
    await kvSet(`onyx:project:${id}`, project)

    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? project : p)),
      currentProject: state.currentProject?.id === id ? project : state.currentProject,
    }))
  },

  addMessage: async (message) => {
    const { currentProject } = get()
    if (!currentProject) return

    currentProject.messages.push(message)
    currentProject.updatedAt = Date.now()
    await kvSet(`onyx:project:${currentProject.id}`, currentProject)

    set({ currentProject: { ...currentProject } })
  },

  clearMessages: async () => {
    const { currentProject } = get()
    if (!currentProject) return

    currentProject.messages = []
    currentProject.updatedAt = Date.now()
    await kvSet(`onyx:project:${currentProject.id}`, currentProject)

    set({ currentProject: { ...currentProject } })
  },

  updateFileTree: async (fileTree) => {
    const { currentProject } = get()
    if (!currentProject) return

    currentProject.fileTree = fileTree
    currentProject.updatedAt = Date.now()
    await kvSet(`onyx:project:${currentProject.id}`, currentProject)

    set({ currentProject: { ...currentProject } })
  },

  addFile: async (path, content, language) => {
    const { currentProject, updateFileTree } = get()
    if (!currentProject) return

    const newFileTree = JSON.parse(JSON.stringify(currentProject.fileTree))
    const pathParts = path.split('/').filter(Boolean)
    let current = newFileTree

    // Navigate/create directory structure
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      let child = current.children?.find((c: FileNode) => c.name === part)

      if (!child) {
        child = {
          name: part,
          path: '/' + pathParts.slice(0, i + 1).join('/'),
          type: 'directory',
          children: [],
        }
        if (!current.children) current.children = []
        current.children.push(child)
      }

      current = child
    }

    // Add file
    const fileName = pathParts[pathParts.length - 1]
    const newFile: FileNode = {
      name: fileName,
      path,
      type: 'file',
      language,
      content,
    }

    if (!current.children) current.children = []
    const existingIdx = current.children.findIndex((c: FileNode) => c.name === fileName)
    if (existingIdx >= 0) {
      current.children[existingIdx] = newFile
    } else {
      current.children.push(newFile)
    }

    await updateFileTree(newFileTree)
  },

  deleteFile: async (path) => {
    const { currentProject, updateFileTree } = get()
    if (!currentProject) return

    const newFileTree = JSON.parse(JSON.stringify(currentProject.fileTree))
    const pathParts = path.split('/').filter(Boolean)
    let current = newFileTree

    // Navigate to parent
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      current = current.children?.find((c: FileNode) => c.name === part)
      if (!current) return
    }

    // Delete file
    const fileName = pathParts[pathParts.length - 1]
    if (current.children) {
      current.children = current.children.filter((c: FileNode) => c.name !== fileName)
    }

    await updateFileTree(newFileTree)
  },

  updateFile: async (path, content) => {
    const { currentProject, updateFileTree } = get()
    if (!currentProject) return

    const newFileTree = JSON.parse(JSON.stringify(currentProject.fileTree))
    const pathParts = path.split('/').filter(Boolean)
    let current = newFileTree

    // Navigate
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      current = current.children?.find((c: FileNode) => c.name === part)
      if (!current) return
    }

    // Update file
    const fileName = pathParts[pathParts.length - 1]
    const file = current.children?.find((c: FileNode) => c.name === fileName)
    if (file && file.type === 'file') {
      file.content = content
    }

    await updateFileTree(newFileTree)
  },

  readFile: async (path) => {
    const { currentProject } = get()
    if (!currentProject) return ''

    const pathParts = path.split('/').filter(Boolean)
    let current = currentProject.fileTree

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      current = current.children?.find((c) => c.name === part)
      if (!current) return ''
    }

    const fileName = pathParts[pathParts.length - 1]
    const file = current.children?.find((c) => c.name === fileName)
    return file?.type === 'file' ? file.content || '' : ''
  },

  updateSettings: async (settings) => {
    const { currentProject, updateFileTree } = get()
    if (!currentProject) return

    currentProject.settings = { ...currentProject.settings, ...settings }
    currentProject.updatedAt = Date.now()
    await kvSet(`onyx:project:${currentProject.id}`, currentProject)

    set({ currentProject: { ...currentProject } })
  },

  setSandboxId: async (id) => {
    const { currentProject } = get()
    if (!currentProject) return

    currentProject.e2bSandboxId = id
    currentProject.updatedAt = Date.now()
    await kvSet(`onyx:project:${currentProject.id}`, currentProject)

    set({ currentProject: { ...currentProject } })
  },
}))
