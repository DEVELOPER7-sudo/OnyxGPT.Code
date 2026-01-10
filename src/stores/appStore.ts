import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, Project, Message, FileNode } from '@/types/project';
import { DEFAULT_SETTINGS } from '@/types/project';

interface PuterUser {
  uuid: string;
  username: string;
  email?: string;
}

interface AppState {
  // User state
  user: PuterUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  
  // Settings
  settings: AppSettings;
  
  // Projects
  projects: Project[];
  currentProject: Project | null;
  isProjectsLoading: boolean;
  
  // Puter availability
  isPuterAvailable: boolean;
  
  // Actions
  setUser: (user: PuterUser | null) => void;
  setIsAuthLoading: (loading: boolean) => void;
  setSettings: (settings: Partial<AppSettings>) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  addMessage: (projectId: string, message: Message) => void;
  updateMessage: (projectId: string, messageId: string, updates: Partial<Message>) => void;
  updateFileTree: (projectId: string, fileTree: FileNode) => void;
  setIsPuterAvailable: (available: boolean) => void;
  setIsProjectsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isAuthLoading: true,
      settings: DEFAULT_SETTINGS,
      projects: [],
      currentProject: null,
      isProjectsLoading: false,
      isPuterAvailable: false,
      
      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isAuthLoading: false 
      }),
      
      setIsAuthLoading: (loading) => set({ isAuthLoading: loading }),
      
      setSettings: (newSettings) => set((state) => ({ 
        settings: { ...state.settings, ...newSettings } 
      })),
      
      setProjects: (projects) => set({ projects }),
      
      addProject: (project) => set((state) => ({ 
        projects: [project, ...state.projects] 
      })),
      
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
        ),
        currentProject: state.currentProject?.id === id 
          ? { ...state.currentProject, ...updates, updatedAt: Date.now() } 
          : state.currentProject
      })),
      
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject
      })),
      
      setCurrentProject: (project) => set({ currentProject: project }),
      
      addMessage: (projectId, message) => set((state) => {
        const updatedProjects = state.projects.map((p) => 
          p.id === projectId 
            ? { ...p, messages: [...p.messages, message], updatedAt: Date.now() } 
            : p
        );
        const updatedCurrentProject = state.currentProject?.id === projectId
          ? { ...state.currentProject, messages: [...state.currentProject.messages, message], updatedAt: Date.now() }
          : state.currentProject;
        return { projects: updatedProjects, currentProject: updatedCurrentProject };
      }),
      
      updateMessage: (projectId, messageId, updates) => set((state) => {
        const updateMessages = (messages: Message[]) => 
          messages.map((m) => m.id === messageId ? { ...m, ...updates } : m);
        
        const updatedProjects = state.projects.map((p) => 
          p.id === projectId 
            ? { ...p, messages: updateMessages(p.messages) } 
            : p
        );
        const updatedCurrentProject = state.currentProject?.id === projectId
          ? { ...state.currentProject, messages: updateMessages(state.currentProject.messages) }
          : state.currentProject;
        return { projects: updatedProjects, currentProject: updatedCurrentProject };
      }),
      
      updateFileTree: (projectId, fileTree) => set((state) => {
        const updatedProjects = state.projects.map((p) => 
          p.id === projectId ? { ...p, fileTree, updatedAt: Date.now() } : p
        );
        const updatedCurrentProject = state.currentProject?.id === projectId
          ? { ...state.currentProject, fileTree, updatedAt: Date.now() }
          : state.currentProject;
        return { projects: updatedProjects, currentProject: updatedCurrentProject };
      }),
      
      setIsPuterAvailable: (available) => set({ isPuterAvailable: available }),
      
      setIsProjectsLoading: (loading) => set({ isProjectsLoading: loading }),
    }),
    {
      name: 'onyxgpt-storage',
      partialize: (state) => ({ 
        settings: state.settings,
        // Persist projects as backup (Puter cloud is primary)
        projects: state.projects,
      }),
    }
  )
);
