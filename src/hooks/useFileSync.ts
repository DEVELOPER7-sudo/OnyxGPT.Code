import { useCallback } from 'react';
import type { FileNode, Message, CodeArtifact } from '@/types/project';

export const useFileSync = () => {
  /**
   * Update file tree based on code artifacts from messages
   */
  const updateFileTreeFromArtifacts = useCallback((
    artifacts: CodeArtifact[],
    currentTree: FileNode
  ): FileNode => {
    const tree = { ...currentTree };

    for (const artifact of artifacts) {
      const path = artifact.filename;
      if (!path) continue;

      // Split path into parts
      const parts = path.split('/').filter(p => p.length > 0);
      const filename = parts[parts.length - 1];
      const dirParts = parts.slice(0, -1);

      // Navigate/create directory structure
      let current = tree;
      for (const dir of dirParts) {
        if (!current.children) {
          current.children = [];
        }

        let dirNode = current.children.find(n => n.name === dir && n.type === 'directory');
        if (!dirNode) {
          dirNode = {
            name: dir,
            path: `${current.path}${current.path.endsWith('/') ? '' : '/'}${dir}`,
            type: 'directory',
            children: [],
          };
          current.children.push(dirNode);
        }
        current = dirNode;
      }

      // Add/update file
      if (!current.children) {
        current.children = [];
      }

      const fileIndex = current.children.findIndex(n => n.name === filename && n.type === 'file');
      const filePath = `${current.path}${current.path.endsWith('/') ? '' : '/'}${filename}`;

      if (fileIndex >= 0) {
        // Update existing file
        current.children[fileIndex] = {
          name: filename,
          path: filePath,
          type: 'file',
        };
      } else {
        // Add new file
        current.children.push({
          name: filename,
          path: filePath,
          type: 'file',
        });
      }
    }

    return tree;
  }, []);

  /**
   * Extract all artifacts from messages and build file tree
   */
  const buildFileTreeFromMessages = useCallback((
    messages: Message[]
  ): FileNode => {
    const allArtifacts = messages
      .flatMap(m => m.artifacts || [])
      .filter((a, i, arr) => arr.findIndex(x => x.filename === a.filename) === i) // Deduplicate
      .filter(a => a.filename && a.filename.trim().length > 0); // Filter out empty filenames

    const root: FileNode = {
      name: 'root',
      path: '/',
      type: 'directory',
      children: [],
    };

    return updateFileTreeFromArtifacts(allArtifacts, root);
  }, [updateFileTreeFromArtifacts]);

  return {
    updateFileTreeFromArtifacts,
    buildFileTreeFromMessages,
  };
};
