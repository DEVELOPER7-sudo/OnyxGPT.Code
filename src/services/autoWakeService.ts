/**
 * Auto-Wake and Persistent Preview Service
 * 
 * Implements auto-wake functionality for CodeSandbox previews
 * and manages persistent preview sessions across browser sessions
 */

import { codesandboxPreviewService } from './codesandboxPreviewService';
import { puterE2BClient } from './puterApiClient';

export interface PersistentPreview {
  projectId: string;
  previewUrl: string;
  sandboxId: string;
  port: number;
  lastAccessed: number;
  isActive: boolean;
  autoWakeEnabled: boolean;
}

export interface AutoWakeConfig {
  enabled: boolean;
  checkInterval: number; // milliseconds
  maxInactiveTime: number; // milliseconds
  retryAttempts: number;
}

export class AutoWakeService {
  private persistentPreviews: Map<string, PersistentPreview> = new Map();
  private wakeCheckInterval: any = null;
  private config: AutoWakeConfig = {
    enabled: true,
    checkInterval: 30000, // 30 seconds
    maxInactiveTime: 10 * 60 * 1000, // 10 minutes
    retryAttempts: 3,
  };

  constructor() {
    this.loadPersistentPreviews();
    this.startWakeCheck();
  }

  /**
   * Register a preview for auto-wake
   */
  registerPreview(preview: PersistentPreview): void {
    this.persistentPreviews.set(preview.projectId, preview);
    this.savePersistentPreviews();
    console.log(`Registered preview for auto-wake: ${preview.projectId}`);
  }

  /**
   * Unregister a preview from auto-wake
   */
  unregisterPreview(projectId: string): void {
    this.persistentPreviews.delete(projectId);
    this.savePersistentPreviews();
    console.log(`Unregistered preview from auto-wake: ${projectId}`);
  }

  /**
   * Update preview access time
   */
  updatePreviewAccess(projectId: string): void {
    const preview = this.persistentPreviews.get(projectId);
    if (preview) {
      preview.lastAccessed = Date.now();
      this.savePersistentPreviews();
    }
  }

  /**
   * Check if preview needs to be woken up
   */
  async checkAndWakePreviews(): Promise<void> {
    if (!this.config.enabled) return;

    const now = Date.now();
    
    for (const [projectId, preview] of this.persistentPreviews) {
      if (!preview.autoWakeEnabled || preview.isActive) continue;

      const timeSinceLastAccess = now - preview.lastAccessed;
      
      if (timeSinceLastAccess > this.config.maxInactiveTime) {
        console.log(`Attempting to wake preview for project: ${projectId}`);
        await this.wakePreview(projectId);
      }
    }
  }

  /**
   * Wake a specific preview
   */
  async wakePreview(projectId: string): Promise<boolean> {
    const preview = this.persistentPreviews.get(projectId);
    if (!preview) {
      console.warn(`No persistent preview found for project: ${projectId}`);
      return false;
    }

    try {
      // Check if preview is already active
      const isHealthy = await this.checkPreviewHealth(preview.previewUrl);
      if (isHealthy) {
        preview.isActive = true;
        this.savePersistentPreviews();
        console.log(`Preview already active: ${projectId}`);
        return true;
      }

      // Attempt to restart the preview
      console.log(`Restarting preview for project: ${projectId}`);
      
      // This would need to be implemented based on your project structure
      // For now, we'll mark it as failed
      preview.isActive = false;
      
      return false;
    } catch (error) {
      console.error(`Failed to wake preview for project ${projectId}:`, error);
      return false;
    }
  }

  /**
   * Check preview health
   */
  async checkPreviewHealth(previewUrl: string): Promise<boolean> {
    try {
      const response = await fetch(previewUrl, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch (error) {
      console.warn(`Preview health check failed for ${previewUrl}:`, error);
      return false;
    }
  }

  /**
   * Start wake check interval
   */
  private startWakeCheck(): void {
    if (this.wakeCheckInterval) {
      clearInterval(this.wakeCheckInterval);
    }

    this.wakeCheckInterval = setInterval(() => {
      this.checkAndWakePreviews();
    }, this.config.checkInterval);

    console.log(`Auto-wake service started with ${this.config.checkInterval}ms interval`);
  }

  /**
   * Stop wake check interval
   */
  private stopWakeCheck(): void {
    if (this.wakeCheckInterval) {
      clearInterval(this.wakeCheckInterval);
      this.wakeCheckInterval = null;
    }
  }

  /**
   * Save persistent previews to storage
   */
  private savePersistentPreviews(): void {
    try {
      const previews = Array.from(this.persistentPreviews.values());
      localStorage.setItem('persistent-previews', JSON.stringify(previews));
    } catch (error) {
      console.warn('Failed to save persistent previews:', error);
    }
  }

  /**
   * Load persistent previews from storage
   */
  private loadPersistentPreviews(): void {
    try {
      const saved = localStorage.getItem('persistent-previews');
      if (saved) {
        const previews: PersistentPreview[] = JSON.parse(saved);
        previews.forEach(preview => {
          this.persistentPreviews.set(preview.projectId, preview);
        });
        console.log(`Loaded ${previews.length} persistent previews`);
      }
    } catch (error) {
      console.warn('Failed to load persistent previews:', error);
    }
  }

  /**
   * Get all persistent previews
   */
  getPersistentPreviews(): PersistentPreview[] {
    return Array.from(this.persistentPreviews.values());
  }

  /**
   * Get preview by project ID
   */
  getPreview(projectId: string): PersistentPreview | null {
    return this.persistentPreviews.get(projectId) || null;
  }

  /**
   * Update auto-wake configuration
   */
  updateConfig(config: Partial<AutoWakeConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.enabled !== undefined) {
      if (config.enabled) {
        this.startWakeCheck();
      } else {
        this.stopWakeCheck();
      }
    }
    console.log('Auto-wake configuration updated:', this.config);
  }

  /**
   * Cleanup inactive previews
   */
  cleanupInactivePreviews(): void {
    const now = Date.now();
    const inactiveThreshold = now - (30 * 24 * 60 * 60 * 1000); // 30 days

    for (const [projectId, preview] of this.persistentPreviews) {
      if (preview.lastAccessed < inactiveThreshold) {
        this.unregisterPreview(projectId);
        console.log(`Cleaned up inactive preview: ${projectId}`);
      }
    }
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    this.stopWakeCheck();
    this.persistentPreviews.clear();
    localStorage.removeItem('persistent-previews');
    console.log('Auto-wake service cleaned up');
  }
}

// Export singleton instance
export const autoWakeService = new AutoWakeService();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    autoWakeService.cleanup();
  });

  // Cleanup old previews on page load
  autoWakeService.cleanupInactivePreviews();
}