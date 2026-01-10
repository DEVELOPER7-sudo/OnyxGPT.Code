import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, X, Play, Square, Monitor, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { codesandboxPreviewService } from '@/services/codesandboxPreviewService';
import { codesandboxService } from '@/services/codesandboxService';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';

interface SandboxTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const SandboxTerminal = ({ isOpen, onClose, projectId }: SandboxTerminalProps) => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [terminalId, setTerminalId] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const webLinksAddonRef = useRef<WebLinksAddon | null>(null);
  
  // E2B service removed - using CodeSandbox SDK instead

  // Initialize CodeSandbox terminal
  const initializeCodeSandboxTerminal = useCallback(async () => {
    if (!terminalRef.current) return;

    try {
      // Create xTerm.js terminal
      const xterm = new XTerm({
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
      const newTerminalId = await codesandboxService.createTerminal(projectId, terminalRef.current);
      
      const sandboxTerminal = codesandboxService.getTerminal(projectId, newTerminalId);
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

      // Fit terminal to container
      fitAddon.fit();
      window.addEventListener('resize', () => fitAddon.fit());

      // Attach to DOM
      xterm.open(terminalRef.current);
      fitAddon.fit();

      xtermRef.current = xterm;
      fitAddonRef.current = fitAddon;
      webLinksAddonRef.current = webLinksAddon;
      setTerminalId(newTerminalId);
      setIsConnected(true);

      // Write welcome message
      xterm.write('\x1b[32mWelcome to CodeSandbox Terminal\x1b[0m\r\n');
      xterm.write('Type "help" for available commands\r\n\r\n');
    } catch (error) {
      console.error('Failed to initialize CodeSandbox terminal:', error);
      setIsConnected(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      setOutput(['Welcome to OnyxGPT Sandbox Terminal', 'Type "help" for available commands', '']);
      initializeCodeSandboxTerminal();
    } else {
      setOutput([]);
      setIsConnected(false);
      if (terminalId) {
        codesandboxService.killTerminal(projectId, terminalId);
        setTerminalId(null);
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    }
  }, [isOpen, projectId, initializeCodeSandboxTerminal]);

  useEffect(() => {
    if (terminalRef.current && xtermRef.current) {
      xtermRef.current.fit();
    }
  }, [output]);

  const handleCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    setOutput(prev => [...prev, `$ ${cmd}`]);
    setIsRunning(true);

    try {
      // Command execution handled by CodeSandbox terminal directly
      // Output is written to xTerm.js in real-time
      setIsConnected(true);
    } catch (error) {
      setOutput(prev => [...prev, `Error: ${error instanceof Error ? error.message : String(error)}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExecute = async () => {
    if (xtermRef.current && command.trim()) {
      xtermRef.current.write(`\r\n$ ${command}\r\n`);
      await handleCommand(command);
      setCommand('');
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const handlePresetCommand = (cmd: string) => {
    if (xtermRef.current) {
      xtermRef.current.write(`\r\n$ ${cmd}\r\n`);
      setCommand(cmd);
      setTimeout(() => handleExecute(), 100);
    }
  };

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.write('\x1b[32mTerminal cleared\x1b[0m\r\n');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-card border border-border/50 rounded-lg shadow-lg z-50 glass-card">
      <div className="flex items-center justify-between p-2 border-b border-border/50 bg-card/30">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">CodeSandbox Terminal</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePresetCommand('npm install')}
            disabled={isRunning}
            className="h-8 w-8"
          >
            <Play className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePresetCommand('npm run dev')}
            disabled={isRunning}
            className="h-8 w-8"
          >
            <Play className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-8 w-8"
          >
            <Command className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div ref={terminalRef} className="flex-1 p-2 font-mono text-sm overflow-y-auto h-[calc(100%-80px)]">
        {/* xTerm.js will render here */}
      </div>
      
      <div className="flex items-center gap-2 p-2 border-t border-border/50 bg-card/30">
        <span className="text-xs text-muted-foreground">$</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          disabled={isRunning || !isConnected}
          className="flex-1 bg-transparent border-none outline-none text-sm font-mono"
        />
        <Button
          size="sm"
          onClick={handleExecute}
          disabled={isRunning || !command.trim() || !isConnected}
          className="gap-1"
        >
          <Play className="w-3 h-3" />
          Run
        </Button>
      </div>
    </div>
  );
};