/**
 * CodeSandbox Development and Preview Service
 * 
 * Provides development server management and live preview capabilities
 * using CodeSandbox SDK with Puter hosting integration for production deployment
 */

import { codesandboxService } from './codesandboxService';
import { puterE2BClient } from './puterApiClient';
import { validateDeployment, getDeploymentConfig } from './deploymentService';
import type { Project } from '@/types/project';

export interface PreviewSession {
  projectId: string;
  sandboxId: string;
  previewUrl: string;
  port: number;
  status: 'starting' | 'running' | 'error' | 'stopped';
  error?: string;
  startedAt: number;
  lastActivity: number;
}

export interface DevelopmentConfig {
  port?: number;
  buildCommand?: string;
  runCommand?: string;
  entryPoint?: string;
  environment?: Record<string, string>;
}

export class CodeSandboxPreviewService {
  private previewSessions: Map<string, PreviewSession> = new Map();
  private autoWakeEnabled: boolean = true;

  /**
   * Start development server with CodeSandbox
   */
  async startDevServer(
    project: Project,
    config?: DevelopmentConfig
  ): Promise<PreviewSession> {
    const projectId = project.id;
    
    try {
      // Validate project for deployment
      const validation = validateDeployment(project);
      if (!validation.valid) {
        throw new Error(`Project validation failed: ${validation.errors.join(', ')}`);
      }

      // Get deployment configuration
      const deploymentConfig = getDeploymentConfig(project);
      const port = config?.port || deploymentConfig.port;

      console.log(`🚀 Starting dev server for project ${projectId} on port ${port}`);

      // Initialize CodeSandbox
      await codesandboxService.initialize(projectId, {
        template: this.getTemplateForLanguage(deploymentConfig.language),
        files: this.projectFilesToRecord(project.fileTree),
      });

      // Write project files to sandbox
      const files = this.projectFilesToRecord(project.fileTree);
      await codesandboxService.writeFiles(projectId, files);

      // Install dependencies
      await this.installDependencies(projectId, deploymentConfig);

      // Start development server
      const runCommand = config?.runCommand || deploymentConfig.runCommand;
      const output = await codesandboxService.executeCommand(projectId, runCommand);

      console.log('Server output:', output);

      // Wait for port to be available
      const portInfo = await codesandboxService.waitForPort(projectId, port);

      const session: PreviewSession = {
        projectId,
        sandboxId: portInfo.url.split('.')[0].split('//')[1],
        previewUrl: portInfo.url,
        port,
        status: 'running',
        startedAt: Date.now(),
        lastActivity: Date.now(),
      };

      this.previewSessions.set(projectId, session);

      console.log(`✅ Dev server started: ${portInfo.url}`);
      return session;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to start dev server:', errorMsg);

      const session: PreviewSession = {
        projectId,
        sandboxId: '',
        previewUrl: '',
        port: config?.port || 3000,
        status: 'error',
        error: errorMsg,
        startedAt: Date.now(),
        lastActivity: Date.now(),
      };

      this.previewSessions.set(projectId, session);
      throw error;
    }
  }

  /**
   * Stop development server
   */
  async stopDevServer(projectId: string): Promise<void> {
    try {
      await codesandboxService.killSandbox(projectId);
      this.previewSessions.delete(projectId);
      console.log(`🛑 Dev server stopped for project ${projectId}`);
    } catch (error) {
      console.error('Failed to stop dev server:', error);
    }
  }

  /**
   * Get preview session status
   */
  getPreviewSession(projectId: string): PreviewSession | null {
    return this.previewSessions.get(projectId) || null;
  }

  /**
   * Get all active preview sessions
   */
  getAllPreviewSessions(): PreviewSession[] {
    return Array.from(this.previewSessions.values());
  }

  /**
   * Check if preview is healthy
   */
  async checkPreviewHealth(projectId: string): Promise<boolean> {
    const session = this.previewSessions.get(projectId);
    if (!session || session.status !== 'running') {
      return false;
    }

    try {
      const response = await fetch(session.previewUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Preview health check failed:', error);
      return false;
    }
  }

  /**
   * Deploy to production using Puter hosting
   */
  async deployToProduction(
    project: Project,
    subdomain: string
  ): Promise<{ success: boolean; url: string; error?: string }> {
    const projectId = project.id;

    try {
      console.log(`🚀 Deploying project ${projectId} to production with subdomain: ${subdomain}`);

      // Get project files
      const files = this.projectFilesToRecord(project.fileTree);

      // Convert files to array format for Puter client
      const fileArray = Object.entries(files).map(([path, content]) => ({
        path,
        content,
      }));

      // Use Puter hosting API for production deployment
      const success = await puterE2BClient.setupProject(fileArray, '', projectId);
      
      if (!success) {
        throw new Error('Failed to setup project in Puter');
      }

      // Create deployment directory
      const dirName = `deploy_${projectId}`;
      
      // Write files to Puter
      for (const [path, content] of Object.entries(files)) {
        await puterE2BClient.writeFile(`/${dirName}/${path}`, content, '', projectId);
      }

      // Deploy using Puter hosting
      const deploymentInfo = await this.createPuterDeployment(subdomain, dirName);

      if (!deploymentInfo.success) {
        throw new Error(deploymentInfo.error || 'Deployment failed');
      }

      console.log(`✅ Production deployment successful: ${deploymentInfo.url}`);
      return deploymentInfo;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Production deployment failed:', errorMsg);
      return {
        success: false,
        url: '',
        error: errorMsg,
      };
    }
  }

  /**
   * Create Puter deployment
   */
  private async createPuterDeployment(
    subdomain: string,
    directoryPath: string
  ): Promise<{ success: boolean; url: string; error?: string }> {
    try {
      const site = await window.puter?.hosting?.create(subdomain, directoryPath);
      
      if (!site) {
        return {
          success: false,
          url: '',
          error: 'Failed to create Puter hosting site',
        };
      }

      return {
        success: true,
        url: `https://${site.subdomain}.puter.site`,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        url: '',
        error: errorMsg,
      };
    }
  }

  /**
   * Install dependencies based on project type
   */
  private async installDependencies(
    projectId: string,
    config: { language: string; buildCommand: string }
  ): Promise<void> {
    try {
      console.log(`📦 Installing dependencies for ${config.language} project`);
      
      const result = await codesandboxService.executeCommand(projectId, config.buildCommand);
      console.log('Installation output:', result);
    } catch (error) {
      console.warn('Dependency installation failed, continuing anyway:', error);
    }
  }

  /**
   * Get CodeSandbox template for language
   */
  private getTemplateForLanguage(language: string): string {
    switch (language) {
      case 'nodejs':
        return 'node';
      case 'python':
        return 'python';
      case 'go':
        return 'go';
      case 'rust':
        return 'rust';
      case 'static':
        return 'static';
      default:
        return 'node';
    }
  }

  /**
   * Convert project file tree to record
   */
  private projectFilesToRecord(fileTree: any): Record<string, string> {
    const files: Record<string, string> = {};
    
    const flattenFiles = (node: any, basePath: string = '') => {
      if (node.type === 'file') {
        const path = basePath ? `${basePath}/${node.name}` : node.name;
        files[path] = node.content || '';
      }
      
      if (node.children) {
        for (const child of node.children) {
          flattenFiles(child, basePath ? `${basePath}/${node.name}` : node.name);
        }
      }
    };

    flattenFiles(fileTree);
    return files;
  }

  /**
   * Enable/disable auto-wake feature
   */
  setAutoWake(enabled: boolean): void {
    this.autoWakeEnabled = enabled;
  }

  /**
   * Clean up all preview sessions
   */
  async cleanup(): Promise<void> {
    for (const [projectId] of this.previewSessions) {
      await this.stopDevServer(projectId);
    }
    this.previewSessions.clear();
  }

  /**
   * Get sandbox status
   */
  getSandboxStatus(projectId: string) {
    return codesandboxService.getSandboxStatus(projectId);
  }
}

// Export singleton instance
export const codesandboxPreviewService = new CodeSandboxPreviewService();