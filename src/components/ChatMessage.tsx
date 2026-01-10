import { motion } from 'framer-motion';
import { User, Bot, AlertCircle, FileCode, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import type { Message, CodeArtifact } from '@/types/project';

interface ChatMessageProps {
  message: Message;
  onArtifactClick?: (artifact: CodeArtifact) => void;
}

export const ChatMessage = ({ message, onArtifactClick }: ChatMessageProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isUser ? 'bg-primary' : isError ? 'bg-destructive' : 'bg-secondary'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : isError ? (
          <AlertCircle className="w-4 h-4 text-destructive-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-foreground" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block rounded-2xl px-4 py-3 max-h-64 overflow-y-auto ${
          isUser 
            ? 'bg-primary text-primary-foreground rounded-br-md' 
            : isError
            ? 'bg-destructive/10 text-destructive rounded-bl-md'
            : 'bg-secondary rounded-bl-md'
        }`}>
          {message.isStreaming ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    
                    if (isInline) {
                      return (
                        <code className="px-1.5 py-0.5 rounded bg-background/50 font-mono text-xs" {...props}>
                          {children}
                        </code>
                      );
                    }
                    
                    return (
                      <div className="relative mt-2 rounded-lg overflow-hidden bg-background/50">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                          <span className="text-xs text-muted-foreground font-mono">{match[1]}</span>
                        </div>
                        <pre className="p-3 overflow-x-auto">
                          <code className="font-mono text-xs" {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  },
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Code Artifacts */}
        {message.artifacts && message.artifacts.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.artifacts.map((artifact) => (
              <motion.button
                key={artifact.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => onArtifactClick?.(artifact)}
                className="w-full text-left p-3 rounded-xl border border-border/50 bg-card hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(artifact.content, artifact.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-secondary transition-all"
                  >
                    {copiedId === artifact.id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
