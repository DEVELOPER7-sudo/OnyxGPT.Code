import { create } from 'zustand';

export interface File {
  path: string;
  content: string;
}

// New type to distinguish between different kinds of agent messages
export type AgentMessage = {
  type: 'narrative' | 'thinking' | 'system';
  content: string;
}

interface ProjectState {
  // We'll replace `thinkingSteps` with a more generic `messages` array
  messages: AgentMessage[];
  files: Map<string, File>;

  // Actions
  addMessage: (message: AgentMessage) => void;
  addOrUpdateFile: (file: File) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  clearState: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  messages: [], // Replaces thinkingSteps
  files: new Map(),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  addOrUpdateFile: (file) => set((state) => {
    const newFiles = new Map(state.files);
    newFiles.set(file.path, file);
    return { files: newFiles };
  }),

  deleteFile: (path) => set((state) => {
    const newFiles = new Map(state.files);
    newFiles.delete(path);
    return { files: newFiles };
  }),

  renameFile: (oldPath, newPath) => set((state) => {
    const newFiles = new Map(state.files);
    const file = newFiles.get(oldPath);
    if (file) {
      newFiles.delete(oldPath);
      newFiles.set(newPath, { ...file, path: newPath });
    }
    return { files: newFiles };
  }),
  
  clearState: () => set({
    messages: [],
    files: new Map(),
  }),
}));
