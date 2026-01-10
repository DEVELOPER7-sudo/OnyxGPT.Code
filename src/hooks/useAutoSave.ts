import { useEffect, useRef, useCallback } from 'react';
import type { Project } from '@/types/project';

interface AutoSaveOptions {
  debounceMs?: number;
  onSave: (project: Project) => Promise<void>;
  onError?: (error: Error) => void;
}

/**
 * Auto-save hook with aggressive persistence for chat history
 * Saves on every significant change and on page unload
 */
export const useAutoSave = (
  project: Project | null,
  options: AutoSaveOptions
) => {
  const { debounceMs = 1500, onSave, onError } = options;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const saveAttemptsRef = useRef<number>(0);
  const MAX_RETRY_ATTEMPTS = 3;

  // Calculate a hash of the project state for change detection
  const getProjectHash = useCallback((proj: Project | null): string => {
    if (!proj) return '';
    return JSON.stringify({
      id: proj.id,
      name: proj.name,
      messages: proj.messages.length,
      lastMessageId: proj.messages[proj.messages.length - 1]?.id,
      updatedAt: proj.updatedAt,
    });
  }, []);

  // Perform the actual save with retry logic
  const performSave = useCallback(
    async (proj: Project) => {
      try {
        saveAttemptsRef.current = 0;
        
        const trySave = async (): Promise<void> => {
          try {
            await onSave(proj);
            console.log('✅ Auto-save successful:', proj.id);
            lastSavedRef.current = getProjectHash(proj);
            return;
          } catch (error) {
            saveAttemptsRef.current += 1;
            
            if (saveAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
              console.warn(
                `⚠️ Auto-save attempt ${saveAttemptsRef.current} failed, retrying...`,
                error
              );
              // Exponential backoff: 500ms, 1s, 2s
              await new Promise(resolve =>
                setTimeout(resolve, 500 * Math.pow(2, saveAttemptsRef.current - 1))
              );
              return trySave();
            } else {
              throw error;
            }
          }
        };

        await trySave();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('❌ Auto-save failed after retries:', err);
        onError?.(err);
      }
    },
    [onSave, onError, getProjectHash]
  );

  // Debounced save effect
  useEffect(() => {
    if (!project) return;

    const projectHash = getProjectHash(project);
    
    // Only save if project has actually changed
    if (projectHash === lastSavedRef.current) {
      return;
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      performSave(project);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [project, debounceMs, performSave, getProjectHash]);

  // Save on page unload (critical for chat history)
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (!project) return;

      const projectHash = getProjectHash(project);
      
      // If there are unsaved changes, attempt to save before leaving
      if (projectHash !== lastSavedRef.current) {
        console.log('💾 Attempting to save before unload:', project.id);
        
        try {
          // Use sendBeacon for maximum reliability on unload
          const data = JSON.stringify(project);
          
          // Try navigator.sendBeacon for better unload reliability
          if (navigator.sendBeacon) {
            const blob = new Blob([data], { type: 'application/json' });
            navigator.sendBeacon('/api/auto-save', blob);
          }
          
          // Also try synchronous save if available (last resort)
          // This may block but ensures save happens
          localStorage.setItem(`onyxgpt-project-backup:${project.id}`, data);
          console.log('✅ Backup save to localStorage before unload');
        } catch (error) {
          console.error('⚠️ Error during unload save:', error);
        }

        // Prompt user if critical unsaved changes exist
        if (project.messages.length > 0) {
          e.preventDefault();
          e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
          return e.returnValue;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [project, getProjectHash]);

  // Expose manual save trigger
  const manualSave = useCallback(async () => {
    if (!project) return;
    await performSave(project);
  }, [project, performSave]);

  return { manualSave };
};
