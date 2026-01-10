/**
 * CodeSandbox SDK Service
 * 
 * Provides 2026-standard AI IDE terminal and preview capabilities
 * using CodeSandbox SDK for interactive terminal processes and live previews
 */

import { CodeSandbox } from '@codesandbox/sdk';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { v4 as uuidv4 } from 'uuid';

interface SandboxInstance {
  id: string;
  sdk: CodeSandbox;
  client: any;
  createdAt: number;
  terminals: Map<string, TerminalInstance>;
  commands: Map<string, CommandInstance>;
  ports: Map<number, PortInstance>;
}

interface TerminalInstance {
  id: string;
  terminal: any; // CodeSandbox terminal
  xterm: Terminal;
  fitAddon: FitAddon;
  webLinksAddon: WebLinksAddon;
  element: HTMLElement;
  isAttached: boolean;
}

interface CommandInstance {
  id: string;
  command: string;
  process: any;
  output: string[];
  isRunning: boolean;
}

interface PortInstance {
  port: number;
  url: string;
  isListening: boolean;
}

export interface CodeSandboxConfig {
  template?: string;
  files?: Record<string, string>;
  dependencies?: Record<string, string>;
}

export class CodeSandboxService {
  private sandboxInstances: Map<string, SandboxInstance> = new Map();
  private currentProjectId: string | null = null;

  /**
   * Initialize CodeSandbox SDK and connect to sandbox
   */
  async initialize(projectId: string, config?: CodeSandboxConfig): Promise<void> {
    if (this.sandboxInstances.has(projectId)) {
      this.currentProjectId = projectId;
      return;
    }

    try {
      console.log('🚀 Initializing CodeSandbox SDK for project:', projectId);
      
      // Create new sandbox instance
      const sdk = new CodeSandbox();
      const sandbox = await sdk.sandboxes.create({
        template: config?.template || 'node',
        files: config?.files || {},
        dependencies: config?.dependencies || {},
      });
      
      const client = await sandbox.connect();

      const instance: SandboxInstance = {
        id: sandbox.id,
        sdk,
        client,
        createdAt: Date.now(),
        terminals: new Map(),
        commands: new Map(),
        ports: new Map(),
      };

      this.sandboxInstances.set(projectId, instance);
      this.currentProjectId = projectId;

      console.log('✅ CodeSandbox SDK initialized:', sandbox.id);
    } catch (error) {
      console.error('❌ CodeSandbox initialization failed:', error);
      throw new Error(`Failed to initialize CodeSandbox: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a new terminal instance with xTerm.js integration
   */
  async createTerminal(projectId: string, element: HTMLElement): Promise<string> {
    const instance = this.sandboxInstances.get(projectId);
    if (!instance) {
      throw new Error('CodeSandbox not initialized for project');
    }

    const terminalId = uuidv4();
    
    // Create xTerm.js terminal
    const xterm = new Terminal({
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
      },
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      rows: 24,
      cols: 80,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    // Create CodeSandbox terminal
    const sandboxTerminal = await instance.client.terminals.create();

    // Set up bidirectional communication
    sandboxTerminal.onOutput((data: string) => {
      xterm.write(data);
    });

    xterm.onData((data: string) => {
      sandboxTerminal.write(data);
    });

    // Fit terminal to container
    fitAddon.fit();
    window.addEventListener('resize', () => fitAddon.fit());

    // Attach to DOM
    xterm.open(element);
    fitAddon.fit();

    const terminalInstance: TerminalInstance = {
      id: terminalId,
      terminal: sandboxTerminal,
      xterm,
      fitAddon,
      webLinksAddon,
      element,
      isAttached: true,
    };

    instance.terminals.set(terminalId, terminalInstance);

    return terminalId;
  }

  /**
   * Execute a command in the background
   */
  async executeCommand(projectId: string, command: string): Promise<string> {
    const instance = this.sandboxInstances.get(projectId);
    if (!instance) {
      throw new Error('CodeSandbox not initialized for project');
    }

    const commandId = uuidv4();
    
    try {
      const process = await instance.client.commands.runBackground(command);
      
      const commandInstance: CommandInstance = {
        id: commandId,
        command,
        process,
        output: [],
        isRunning: true,
      };

      instance.commands.set(commandId, commandInstance);

      // Listen for output
      process.onOutput((data: string) => {
        commandInstance.output.push(data);
      });

      // Wait for completion
      await process.waitForExit();
      commandInstance.isRunning = false;

      return commandInstance.output.join('');
    } catch (error) {
      console.error('Command execution failed:', error);
      throw new Error(`Command failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Wait for a port to be available and get preview URL
   */
  async waitForPort(projectId: string, port: number): Promise<{ url: string; port: number }> {
    const instance = this.sandboxInstances.get(projectId);
    if (!instance) {
      throw new Error('CodeSandbox not initialized for project');
    }

    try {
      const portInfo = await instance.client.ports.waitForPort(port);
      
      const portInstance: PortInstance = {
        port,
        url: portInfo.url,
        isListening: true,
      };

      instance.ports.set(port, portInstance);

      console.log(`🌐 Port ${port} available at: ${portInfo.url}`);
      return {
        url: portInfo.url,
        port,
      };
    } catch (error) {
      console.error('Port wait failed:', error);
      throw new Error(`Port ${port} not available: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get terminal instance
   */
  getTerminal(projectId: string, terminalId: string): TerminalInstance | null {
    const instance = this.sandboxInstances.get(projectId);
    return instance?.terminals.get(terminalId) || null;
  }

  /**
   * Get all terminals for a project
   */
  getTerminals(projectId: string): TerminalInstance[] {
    const instance = this.sandboxInstances.get(projectId);
    return instance ? Array.from(instance.terminals.values()) : [];
  }

  /**
   * Get all ports for a project
   */
  getPorts(projectId: string): PortInstance[] {
    const instance = this.sandboxInstances.get(projectId);
    return instance ? Array.from(instance.ports.values()) : [];
  }

  /**
   * Kill a specific terminal
   */
  async killTerminal(projectId: string, terminalId: string): Promise<void> {
    const instance = this.sandboxInstances.get(projectId);
    if (!instance) return;

    const terminal = instance.terminals.get(terminalId);
    if (terminal) {
      try {
        await terminal.terminal.kill();
        terminal.xterm.dispose();
        instance.terminals.delete(terminalId);
      } catch (error) {
        console.error('Failed to kill terminal:', error);
      }
    }
  }

  /**
   * Kill all terminals for a project
   */
  async killAllTerminals(projectId: string): Promise<void> {
    const instance = this.sandboxInstances.get(projectId);
    if (!instance) return;

    for (const [terminalId] of instance.terminals) {
      await this.killTerminal(projectId, terminalId);
    }
  }

  /**
   * Kill sandbox instance
   */
  async killSandbox(projectId: string): Promise<void> {
    const instance = this.sandboxInstances.get(projectId);
    if (!instance) return;

    try {
      await this.killAllTerminals(projectId);
      
      for (const [commandId] of instance.commands) {
        const command = instance.commands.get(commandId);
        if (command?.process) {
          try {
            await command.process.kill();
          } catch (error) {
            console.error('Failed to kill command:', error);
          }
        }
      }

      await instance.sdk.kill();
      this.sandboxInstances.delete(projectId);
      
      if (this.currentProjectId === projectId) {
        this.currentProjectId = null;
      }

      console.log('🧹 CodeSandbox instance cleaned up:', projectId);
    } catch (error) {
      console.error('Failed to kill sandbox:', error);
    }
  }

  /**
   * Get sandbox status
   */
  getSandboxStatus(projectId: string): {
    isInitialized: boolean;
    terminalCount: number;
    commandCount: number;
    portCount: number;
    sandboxId?: string;
  } {
    const instance = this.sandboxInstances.get(projectId);
    if (!instance) {
      return {
        isInitialized: false,
        terminalCount: 0,
        commandCount: 0,
        portCount: 0,
      };
    }

    return {
      isInitialized: true,
      terminalCount: instance.terminals.size,
      commandCount: instance.commands.size,
      portCount: instance.ports.size,
      sandboxId: instance.id,
    };
  }

  /**
   * Write files to sandbox
   */
  async writeFiles(projectId: string, files: Record<string, string>): Promise<void> {
    const instance = this.sandboxInstances.get(projectId);
    if (!instance) {
      throw new Error('CodeSandbox not initialized for project');
    }

    try {
      for (const [path, content] of Object.entries(files)) {
        await instance.client.fs.write(path, content);
      }
      console.log('📁 Files written to sandbox:', Object.keys(files));
    } catch (error) {
      console.error('Failed to write files:', error);
      throw new Error(`File write failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Read file from sandbox
   */
  async readFile(projectId: string, path: string): Promise<string> {
    const instance = this.sandboxInstances.get(projectId);
    if (!instance) {
      throw new Error('CodeSandbox not initialized for project');
    }

    try {
      return await instance.client.fs.read(path);
    } catch (error) {
      console.error('Failed to read file:', error);
      throw new Error(`File read failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List files in sandbox directory
   */
  async listFiles(projectId: string, path: string = '/'): Promise<string[]> {
    const instance = this.sandboxInstances.get(projectId);
    if (!instance) {
      throw new Error('CodeSandbox not initialized for project');
    }

    try {
      const entries = await instance.client.fs.list(path);
      return entries.map(entry => entry.name);
    } catch (error) {
      console.error('Failed to list files:', error);
      throw new Error(`File list failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    for (const [projectId] of this.sandboxInstances) {
      await this.killSandbox(projectId);
    }
    this.sandboxInstances.clear();
    this.currentProjectId = null;
  }
}

// Export singleton instance
export const codesandboxService = new CodeSandboxService();