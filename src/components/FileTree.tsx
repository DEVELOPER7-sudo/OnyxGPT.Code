import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, FileCode, Folder, FolderOpen, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FileNode } from '@/types/project';

interface FileTreeProps {
  fileTree?: FileNode;
  onFileSelect: (filepath: string) => void;
  onClose?: () => void;
}

const FileTreeNode = ({ node, onFileSelect, level = 0 }: {
  node: FileNode;
  onFileSelect: (filepath: string) => void;
  level?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const isDirectory = node.type === 'directory';

  return (
    <div>
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => {
          if (isDirectory) {
            setIsExpanded(!isExpanded);
          } else {
            onFileSelect(node.path);
          }
        }}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-left text-sm hover:bg-secondary/50 rounded transition-colors ${
          !isDirectory ? 'cursor-pointer' : ''
        }`}
      >
        {isDirectory && (
          <ChevronRight
            className={`w-4 h-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        )}
        {isDirectory ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          )
        ) : (
          <FileCode className="w-4 h-4 text-blue-400 flex-shrink-0" />
        )}
        <span className="truncate text-foreground/90 font-medium">{node.name}</span>
      </motion.button>

      <AnimatePresence>
        {isDirectory && isExpanded && node.children && (
          <div className="pl-2">
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                onFileSelect={onFileSelect}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FileTree = ({ fileTree, onFileSelect, onClose }: FileTreeProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filterFileTree = useCallback((node: FileNode, term: string): FileNode | null => {
    if (!term.trim()) return node;

    const matchesSearch = node.name.toLowerCase().includes(term.toLowerCase());

    if (node.type === 'directory' && node.children) {
      const filteredChildren = node.children
        .map(child => filterFileTree(child, term))
        .filter((child): child is FileNode => child !== null);

      if (filteredChildren.length > 0 || matchesSearch) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
    } else if (matchesSearch) {
      return node;
    }

    return null;
  }, []);

  const filteredTree = fileTree ? filterFileTree(fileTree, searchTerm) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col bg-card/50 rounded-lg border border-border/50 overflow-hidden flex-safe"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-safe">
          <Folder className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium truncate">Files</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="px-2 sm:px-3 py-1 sm:py-2 border-b border-border/50 bg-background/50 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/50 rounded px-2 sm:px-3 py-1 sm:py-1.5 pl-6 sm:pl-7 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-1 sm:p-2 overflow-safe">
        {filteredTree ? (
          <FileTreeNode node={filteredTree} onFileSelect={onFileSelect} />
        ) : (
          <div className="text-center py-6 sm:py-8 text-muted-foreground/50">
            <p className="text-xs sm:text-sm">No files found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
