import { useState, useEffect, useRef, useCallback } from 'react';
import { codesandboxService } from '@/services/codesandboxService';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';

export interface TerminalState {
  isInitialized: boolean;
  isRunning: boolean;
  isConnected: boolean;
  error: string | null;
  terminalId: string | null;
}

export interface TerminalActions {
  initialize: (projectId: string, container: HTMLElement) => Promise<void>;
  executeCommand: (command: string) => Promise<string>;
  write: (data: string) => void;
  resize: () => void;
  clear: () => void;
  dispose: () => void;
}

export const useCodeSandboxTerminal = (): [TerminalState, TerminalActions] => {
  const [state, setState] = useState<TerminalState>({
    isInitialized: false,
    isRunning: false,
    isConnected: false,
    error: null,
    terminalId: null,
  });

  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const webLinksAddonRef = useRef<WebLinksAddon | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  const initialize = useCallback(async (projectId: string, container: HTMLElement) => {
    if (!container) {
      setState(prev => ({ ...prev, error: 'Container element is required' }));
      return;
    }

    containerRef.current = container;

    try {
      setState(prev => ({ ...prev, isRunning: true, error: null }));

      // Create xTerm.js terminal
      const xterm = new XTerm({
        theme: {
          background: '#0d1117',
          foreground: '#c9d1d9',
          cursor: '#58a6ff',
          cursorAccent: '#0d1117',
          selectionBackground: '#58a6ff',
          selectionForeground: '#0d1117',
        },
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        rows: 24,
        cols: 80,
        cursorBlink: true,
        cursorStyle: 'bar',
        scrollback: 1000,
        tabStopWidth: 4,
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      
      xterm.loadAddon(fitAddon);
      xterm.loadAddon(webLinksAddon);

      // Create CodeSandbox terminal
      const terminalId = await codesandboxService.createTerminal(projectId, container);
      
      const sandboxTerminal = codesandboxService.getTerminal(projectId, terminalId);
      if (!sandboxTerminal) {
        throw new Error('Failed to create CodeSandbox terminal');
      }

      // Set up bidirectional communication
      sandboxTerminal.terminal.onOutput((data: string) => {
        xterm.write(data);
      });

      xterm.onData((data: string) => {
        sandboxTerminal.terminal.write(data);
      });

      // Handle terminal events
      xterm.onResize((size) => {
        console.log(`Terminal resized to ${size.cols}x${size.rows}`);
      });

      // Fit terminal to container
      fitAddon.fit();
      window.addEventListener('resize', () => fitAddon.fit());

      // Attach to DOM
      xterm.open(container);
      fitAddon.fit();

      // Write welcome message
      xterm.write('\x1b[32mWelcome to CodeSandbox Terminal\x1b[0m\r\n');
      xterm.write('Type "help" for available commands\r\n\r\n');

      xtermRef.current = xterm;
      fitAddonRef.current = fitAddon;
      webLinksAddonRef.current = webLinksAddon;

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isConnected: true,
        isRunning: false,
        error: null,
        terminalId,
      }));

      console.log('✅ CodeSandbox terminal initialized successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to initialize CodeSandbox terminal:', errorMsg);
      setState(prev => ({
        ...prev,
        isInitialized: false,
        isConnected: false,
        isRunning: false,
        error: errorMsg,
      }));
    }
  }, []);

  const executeCommand = useCallback(async (command: string): Promise<string> => {
    if (!xtermRef.current || !state.terminalId) {
      throw new Error('Terminal not initialized');
    }

    try {
      // Write command to terminal
      xtermRef.current.write(`\r\n$ ${command}\r\n`);
      
      // Execute via CodeSandbox service
      // Note: This would need to be implemented in the service
      // For now, we'll just return a placeholder
      return `Command executed: ${command}`;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setState(prev => ({ ...prev, error: errorMsg }));
      throw error;
    }
  }, [state.terminalId]);

  const write = useCallback((data: string) => {
    if (xtermRef.current) {
      xtermRef.current.write(data);
    }
  }, []);

  const resize = useCallback(() => {
    if (fitAddonRef.current) {
      fitAddonRef.current.fit();
    }
  }, []);

  const clear = useCallback(() => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.write('\x1b[32mTerminal cleared\x1b[0m\r\n');
    }
  }, []);

  const dispose = useCallback(() => {
    if (state.terminalId && containerRef.current) {
      codesandboxService.killTerminal(containerRef.current.id, state.terminalId);
    }
    
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }
    
    if (fitAddonRef.current) {
      fitAddonRef.current.dispose();
      fitAddonRef.current = null;
    }
    
    if (webLinksAddonRef.current) {
      webLinksAddonRef.current.dispose();
      webLinksAddonRef.current = null;
    }

    setState({
      isInitialized: false,
      isRunning: false,
      isConnected: false,
      error: null,
      terminalId: null,
    });
  }, [state.terminalId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  return [
    state,
    {
      initialize,
      executeCommand,
      write,
      resize,
      clear,
      dispose,
    },
  ];
};

// Hook for multiple terminals
export const useCodeSandboxMultiTerminal = () => {
  const [terminals, setTerminals] = useState<Map<string, any>>(new Map());
  const [activeTerminal, setActiveTerminal] = useState<string | null>(null);

  const createTerminal = useCallback(async (projectId: string, container: HTMLElement, terminalName: string = 'default') => {
    try {
      const terminalId = await codesandboxService.createTerminal(projectId, container);
      
      setTerminals(prev => new Map(prev.set(terminalName, {
        id: terminalId,
        container,
        projectId,
        createdAt: Date.now(),
      })));

      setActiveTerminal(terminalName);
      return terminalId;
    } catch (error) {
      console.error('Failed to create terminal:', error);
      throw error;
    }
  }, []);

  const switchTerminal = useCallback((terminalName: string) => {
    setActiveTerminal(terminalName);
  }, []);

  const removeTerminal = useCallback(async (terminalName: string) => {
    const terminal = terminals.get(terminalName);
    if (terminal) {
      try {
        await codesandboxService.killTerminal(terminal.projectId, terminal.id);
        setTerminals(prev => {
          const newMap = new Map(prev);
          newMap.delete(terminalName);
          return newMap;
        });
        
        if (activeTerminal === terminalName) {
          const remaining = Array.from(terminals.keys());
          setActiveTerminal(remaining.length > 0 ? remaining[0] : null);
        }
      } catch (error) {
        console.error('Failed to remove terminal:', error);
      }
    }
  }, [terminals, activeTerminal]);

  const getActiveTerminal = useCallback(() => {
    return activeTerminal ? terminals.get(activeTerminal) : null;
  }, [terminals, activeTerminal]);

  return {
    terminals: Array.from(terminals.entries()),
    activeTerminal,
    createTerminal,
    switchTerminal,
    removeTerminal,
    getActiveTerminal,
  };
};