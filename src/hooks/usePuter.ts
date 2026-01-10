import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import type { Project, Message } from '@/types/project';
import { v4 as uuidv4 } from 'uuid';
import { handleAITerminalToolCall } from '@/services/aiTerminalService';
import { generateProjectName } from '@/services/projectNameGenerator';
import { compareProjects, detectConflicts, mergeChanges } from '@/services/syncService';
import { extractResponseText } from '@/lib/responseUtils';

const PROJECT_PREFIX = 'onyxgpt:project:';


export const usePuter = () => {
  const { 
    setUser, 
    setIsPuterAvailable, 
    isPuterAvailable,
    setProjects,
    addProject,
    updateProject,
    deleteProject: removeProject,
    setIsProjectsLoading,
    settings,
  } = useAppStore();

  // Check if Puter is available
  useEffect(() => {
    const checkPuter = () => {
      if (typeof window !== 'undefined' && window.puter) {
        console.log('✅ Puter loaded successfully');
        setIsPuterAvailable(true);
        return true;
      }
      return false;
    };

    if (!checkPuter()) {
      // Retry a few times as Puter might load async
      console.log('⏳ Waiting for Puter to load...');
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        console.log(`📡 Puter check attempt ${attempts}/10`);
        if (checkPuter() || attempts >= 10) {
          clearInterval(interval);
          if (attempts >= 10 && !window.puter) {
            console.warn('⚠️ Puter failed to load after 10 attempts. Using localStorage fallback.');
            // Still mark as not available but don't block
            setIsPuterAvailable(false);
          }
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [setIsPuterAvailable]);

  // Initialize auth
  const initAuth = useCallback(async () => {
    if (!isPuterAvailable) return null;
    
    try {
      const user = await window.puter.auth.getUser();
      if (user) {
        setUser(user);
        return user;
      }
      // Generate anonymous user ID if not signed in
      let anonId = localStorage.getItem('onyxgpt-anon-id');
      if (!anonId) {
        anonId = `anon-${uuidv4()}`;
        localStorage.setItem('onyxgpt-anon-id', anonId);
      }
      setUser({ uuid: anonId, username: 'Anonymous' });
      return null;
    } catch (error) {
      console.error('Auth init error:', error);
      // Fallback to anonymous
      let anonId = localStorage.getItem('onyxgpt-anon-id');
      if (!anonId) {
        anonId = `anon-${uuidv4()}`;
        localStorage.setItem('onyxgpt-anon-id', anonId);
      }
      setUser({ uuid: anonId, username: 'Anonymous' });
      return null;
    }
  }, [isPuterAvailable, setUser]);

  // Sign in
  const signIn = useCallback(async () => {
    if (!isPuterAvailable) {
      throw new Error('Puter is not available');
    }
    
    try {
      const user = await window.puter.auth.signIn();
      setUser(user);
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, [isPuterAvailable, setUser]);

  // Sign out
  const signOut = useCallback(async () => {
    if (!isPuterAvailable) return;
    
    try {
      await window.puter.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [isPuterAvailable, setUser]);

  // Save project to Puter KV or localStorage
  const saveProject = useCallback(async (project: Project) => {
    console.log(`💾 Saving project: ${project.id} with ${project.messages?.length || 0} messages`);
    
    // Always save to localStorage first as reliable backup
    try {
      const stored = localStorage.getItem('onyxgpt-projects') || '[]';
      const projects = JSON.parse(stored) as Project[];
      const index = projects.findIndex(p => p.id === project.id);
      if (index >= 0) {
        projects[index] = project;
      } else {
        projects.unshift(project);
      }
      localStorage.setItem('onyxgpt-projects', JSON.stringify(projects));
      console.log('✅ Project saved to localStorage:', project.id);
    } catch (localError) {
      console.error('❌ LocalStorage save error:', localError);
    }
    
    // Also save to Puter cloud if available
    if (isPuterAvailable) {
      try {
        console.log('☁️ Saving to Puter cloud...');
        const key = `${PROJECT_PREFIX}${project.id}`;
        await window.puter.kv.set(key, JSON.stringify(project));
        console.log('✅ Project saved to Puter cloud:', project.id);
      } catch (puterError) {
        console.error('⚠️ Puter cloud save failed (localStorage backup exists):', puterError);
      }
    }
    
    // Update store immediately
    updateProject(project.id, project);
  }, [isPuterAvailable, updateProject]);

  // Load all projects from Puter KV and localStorage (merged)
  const loadProjects = useCallback(async () => {
    setIsProjectsLoading(true);
    console.log('📂 Loading projects...');
    
    const allProjects: Project[] = [];
    const seenIds = new Set<string>();
    
    // Load from localStorage first (always available)
    try {
      const stored = localStorage.getItem('onyxgpt-projects') || '[]';
      const localProjects = JSON.parse(stored) as Project[];
      console.log('📝 Loaded from localStorage:', localProjects.length, 'projects');
      for (const p of localProjects) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          allProjects.push(p);
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
    
    // Load from Puter cloud if available
    if (isPuterAvailable) {
      try {
        const keys = await window.puter.kv.list(PROJECT_PREFIX);
        console.log('☁️ Found', keys?.length || 0, 'projects in Puter cloud');
        
        if (keys && keys.length > 0) {
          for (const key of keys) {
            try {
              const data = await window.puter.kv.get(key);
              if (data) {
                const project = JSON.parse(data) as Project;
                // Prefer cloud version if newer
                const existingIdx = allProjects.findIndex(p => p.id === project.id);
                if (existingIdx >= 0) {
                  if (project.updatedAt > allProjects[existingIdx].updatedAt) {
                    allProjects[existingIdx] = project;
                  }
                } else {
                  allProjects.push(project);
                }
              }
            } catch (e) {
              console.error(`Error loading project ${key}:`, e);
            }
          }
        }
      } catch (error) {
        console.error('Puter cloud load error:', error);
      }
    }
    
    // Sort by updatedAt descending
    allProjects.sort((a, b) => b.updatedAt - a.updatedAt);
    console.log('✅ Total projects loaded:', allProjects.length);
    setProjects(allProjects);
    setIsProjectsLoading(false);
    return allProjects;
  }, [isPuterAvailable, setProjects, setIsProjectsLoading]);

  // Load a single project (try cloud first, then localStorage)
  const loadProject = useCallback(async (id: string): Promise<Project | null> => {
    console.log('📂 Loading single project:', id);
    
    // Try Puter cloud first
    if (isPuterAvailable) {
      try {
        const key = `${PROJECT_PREFIX}${id}`;
        const data = await window.puter.kv.get(key);
        if (data) {
          const project = JSON.parse(data) as Project;
          console.log('☁️ Loaded from Puter cloud:', id, 'with', project.messages?.length || 0, 'messages');
          return project;
        }
      } catch (error) {
        console.error('Puter load error:', error);
      }
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('onyxgpt-projects') || '[]';
      const projects = JSON.parse(stored) as Project[];
      const project = projects.find(p => p.id === id);
      if (project) {
        console.log('📝 Loaded from localStorage:', id, 'with', project.messages?.length || 0, 'messages');
        return project;
      }
    } catch (e) {
      console.error('localStorage load error:', e);
    }
    
    return null;
  }, [isPuterAvailable]);

  // Create new project with random name
  const createProject = useCallback(async (initialPrompt?: string): Promise<Project> => {
    const projectId = uuidv4();
    const projectName = generateProjectName();
    
    const newProject: Project = {
      id: projectId,
      name: projectName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ownerId: useAppStore.getState().user?.uuid || 'anonymous',
      messages: [],
      fileTree: { name: 'root', path: '/', type: 'directory', children: [] },
      settings: { autoPreview: true },
    };

    console.log(`✨ Created new project: ${projectName} (${projectId})`);
    
    // Save to cloud
    await saveProject(newProject);
    
    // Add to store
    addProject(newProject);
    
    return newProject;
  }, [saveProject, addProject]);

  // Sync project across devices
  const syncProject = useCallback(async (projectId: string): Promise<{ merged: Project | null; conflicts: number }> => {
    try {
      const local = useAppStore.getState().currentProject;
      if (!local || local.id !== projectId) {
        console.warn('⚠️ No local project to sync');
        return { merged: null, conflicts: 0 };
      }

      // Load remote version
      const remote = await loadProject(projectId);
      if (!remote) {
        console.log('ℹ️ No remote version found, using local');
        return { merged: local, conflicts: 0 };
      }

      console.log('🔄 Syncing project:', projectId);
      
      // Compare projects
      const changes = compareProjects(local, remote);
      console.log(`📝 Found ${changes.length} changes`);
      
      // Detect conflicts
      const conflicts = detectConflicts(
        changes.filter(c => c.userId === local.ownerId),
        changes.filter(c => c.userId === remote.ownerId)
      );
      console.log(`⚠️ Found ${conflicts.length} conflicts`);
      
      // Merge changes
      const merged = mergeChanges(local, remote, conflicts);
      
      // Save merged result
      await saveProject(merged);
      console.log(`✅ Sync complete: ${conflicts.length} conflicts resolved`);
      
      // Update store
      useAppStore.getState().setCurrentProject(merged);
      
      return {
        merged,
        conflicts: conflicts.length,
      };
    } catch (error) {
      console.error('❌ Sync error:', error);
      return { merged: null, conflicts: 0 };
    }
  }, [loadProject, saveProject]);

  // Delete project from Puter KV
  const deleteProjectFromCloud = useCallback(async (id: string) => {
    if (!isPuterAvailable) {
      const stored = localStorage.getItem('onyxgpt-projects') || '[]';
      const projects = JSON.parse(stored) as Project[];
      localStorage.setItem('onyxgpt-projects', JSON.stringify(projects.filter(p => p.id !== id)));
      removeProject(id);
      return;
    }

    try {
      const key = `${PROJECT_PREFIX}${id}`;
      await window.puter.kv.del(key);
      removeProject(id);
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  }, [isPuterAvailable, removeProject]);

  // Handle AI tool calls (supports both onyx_ prefixed and legacy tools)
  const handleToolCall = useCallback(async (toolCall: unknown): Promise<string> => {
    try {
      const callStr = typeof toolCall === 'string' ? toolCall : JSON.stringify(toolCall);
      
      // Try to parse as JSON
      let parsed;
      try {
        parsed = JSON.parse(callStr);
      } catch {
        parsed = toolCall;
      }

      // Check if it's a terminal tool call (onyx_terminal or legacy terminal)
      if (parsed && typeof parsed === 'object' && 
          (parsed.tool === 'terminal' || parsed.tool === 'onyx_terminal')) {
        console.log('🔧 Handling terminal tool call:', parsed);
        const apiKey = settings.sandboxApiKey;
        if (!apiKey) {
          return '❌ E2B API key not configured. Cannot execute terminal commands. Set it in Settings → Sandbox API Key.';
        }
        const result = await handleAITerminalToolCall(parsed as any, apiKey);
        console.log('✅ Terminal tool result:', result);
        return result;
      }

      // Check if it's an Onyx tool (onyx_* prefixed)
      if (parsed && typeof parsed === 'object' && parsed.tool && 
          typeof parsed.tool === 'string' && parsed.tool.startsWith('onyx_')) {
        console.log('🔧 Handling Onyx tool call:', parsed.tool);
        return `📋 Tool "${parsed.tool}" received. This tool is registered for execution.`;
      }

      return `❌ Unknown tool: ${parsed?.tool || 'unknown'}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Tool call error:', msg);
      return `❌ Tool execution failed: ${msg}`;
    }
  }, [settings.sandboxApiKey]);

  // Chat with AI
  const chat = useCallback(async (
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    onChunk?: (text: string) => void
  ): Promise<string> => {
    if (!isPuterAvailable) {
      throw new Error('Puter is not available');
    }

    const model = settings.defaultModel || 'gpt-4o-mini';

    try {
      console.log('🔄 Chat with model:', model, 'streaming:', !!onChunk);
      
      // Always use streaming: true for better response flow
      const response = await window.puter.ai.chat(messages, { 
        model, 
        stream: true,
        temperature: settings.temperature || 0.7,
      });
      
      let fullText = '';
      let chunkCount = 0;
      
      // Handle different response types using extractResponseText
      if (response && typeof response[Symbol.asyncIterator] === 'function') {
        console.log('📡 Using async iterator for streaming');
        for await (const chunk of response) {
          const text = extractResponseText(chunk);
          if (text) {
            fullText += text;
            onChunk?.(text);
            chunkCount++;
          }
        }
      } else if (response && typeof response[Symbol.iterator] === 'function') {
        console.log('📡 Using sync iterator');
        for (const chunk of response) {
          const text = extractResponseText(chunk);
          if (text) {
            fullText += text;
            onChunk?.(text);
            chunkCount++;
          }
        }
      } else if (typeof response === 'string') {
        fullText = response;
        onChunk?.(response);
        chunkCount = 1;
      } else if (response && typeof response === 'object') {
        // Use extractResponseText to avoid [object Object]
        const text = extractResponseText(response);
        if (text) {
          fullText = text;
          onChunk?.(text);
          chunkCount = 1;
        } else {
          console.warn('⚠️ Empty response received');
        }
      }
      
      console.log(`✅ Chat complete (${chunkCount} chunks, ${fullText.length} chars)`);
      return fullText;
    } catch (error) {
      console.error('❌ AI chat error:', error);
      throw error;
    }
  }, [isPuterAvailable, settings.defaultModel, settings.temperature]);

  return {
    isPuterAvailable,
    initAuth,
    signIn,
    signOut,
    saveProject,
    loadProjects,
    loadProject,
    deleteProject: deleteProjectFromCloud,
    createProject,
    syncProject,
    chat,
    handleToolCall,
  };
};