import { useState, useEffect, useRef } from 'react';
import { Terminal, X, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useE2BService } from '@/hooks/useE2BService';

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
  const terminalRef = useRef<HTMLDivElement>(null);
  const { executeCommand, startDevServer, killSandbox } = useE2BService();

  useEffect(() => {
    if (isOpen) {
      setOutput(['Welcome to OnyxGPT Sandbox Terminal', 'Type "help" for available commands', '']);
    } else {
      setOutput([]);
      setIsConnected(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const handleCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    setOutput(prev => [...prev, `$ ${cmd}`]);
    setIsRunning(true);

    try {
      const result = await executeCommand(cmd, projectId);
      setOutput(prev => [...prev, result.stdout, result.stderr ? `Error: ${result.stderr}` : '']);
      setIsConnected(true);
    } catch (error) {
      setOutput(prev => [...prev, `Error: ${error instanceof Error ? error.message : String(error)}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExecute = async () => {
    await handleCommand(command);
    setCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const handlePresetCommand = (cmd: string) => {
    setCommand(cmd);
    setTimeout(() => handleExecute(), 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-card border border-border/50 rounded-lg shadow-lg z-50 glass-card">
      <div className="flex items-center justify-between p-2 border-b border-border/50 bg-card/30">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Sandbox Terminal</span>
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
            onClick={() => handlePresetCommand('ls -la')}
            disabled={isRunning}
            className="h-8 w-8"
          >
            <Terminal className="w-3 h-3" />
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
        {output.map((line, index) => (
          <div key={index} className="mb-1">
            {line}
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Executing...</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 p-2 border-t border-border/50 bg-card/30">
        <span className="text-xs text-muted-foreground">$</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          disabled={isRunning}
          className="flex-1 bg-transparent border-none outline-none text-sm font-mono"
        />
        <Button
          size="sm"
          onClick={handleExecute}
          disabled={isRunning || !command.trim()}
          className="gap-1"
        >
          <Play className="w-3 h-3" />
          Run
        </Button>
      </div>
    </div>
  );
};