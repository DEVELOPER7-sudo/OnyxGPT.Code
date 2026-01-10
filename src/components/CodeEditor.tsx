import { useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { motion } from 'framer-motion';
import { FileCode, X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CodeArtifact } from '@/types/project';

interface CodeEditorProps {
  artifact: CodeArtifact | null;
  onClose: () => void;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

export const CodeEditor = ({ artifact, onClose, onChange, readOnly = true }: CodeEditorProps) => {
  const [copied, setCopied] = useState(false);

  const extensions = useMemo(() => {
    return [javascript({ jsx: true, typescript: true })];
  }, []);

  const handleCopy = async () => {
    if (!artifact) return;
    await navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChange = useCallback((value: string) => {
    onChange?.(value);
  }, [onChange]);

  if (!artifact) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a file to view its code</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="text-sm font-mono">{artifact.filename}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            artifact.action === 'create' 
              ? 'bg-green-500/20 text-green-400'
              : artifact.action === 'update'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {artifact.action}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={artifact.content}
          height="100%"
          theme={vscodeDark}
          extensions={extensions}
          onChange={handleChange}
          readOnly={readOnly}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            autocompletion: true,
            bracketMatching: true,
            closeBrackets: true,
            indentOnInput: true,
          }}
          className="h-full text-sm"
        />
      </div>
    </motion.div>
  );
};
