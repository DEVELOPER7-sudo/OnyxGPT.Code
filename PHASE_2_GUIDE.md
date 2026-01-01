# Phase 2 Implementation Guide: File Tree UI

**Estimated Time**: 2-3 hours  
**Difficulty**: Medium  
**Blockers**: None (Phase 1 complete)  
**Next Phase**: Phase 3 (Chat Streaming)

---

## What You're Building

A collapsible, interactive file tree that shows project structure:

```
📁 root
  📁 src
    📄 App.tsx        ← Click to select
    📄 main.tsx
  📄 package.json
```

Features:
- Expand/collapse folders
- File type icons
- Click to open in editor
- Right-click context menu (delete, rename)
- New file/folder dialogs

---

## Implementation Plan

### Step 1: Create FileTree Component (30 min)

**File**: `src/components/FileTree.tsx`

```typescript
import React, { useState } from 'react'
import { ChevronDown, ChevronRight, FolderOpen, FolderIcon, File } from 'lucide-react'
import { FileNode } from '@/types'
import { cn } from '@/lib/utils'

interface FileTreeProps {
  node: FileNode
  depth?: number
  onSelectFile: (path: string) => void
  selectedFile?: string | null
}

export function FileTree({ node, depth = 0, onSelectFile, selectedFile }: FileTreeProps) {
  const [isExpanded, setIsExpanded] = useState(depth === 0)

  if (node.type === 'file') {
    return (
      <button
        onClick={() => onSelectFile(node.path)}
        className={cn(
          'w-full text-left px-2 py-1 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors',
          selectedFile === node.path && 'bg-accent text-accent-foreground'
        )}
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
      >
        <span className="inline-flex items-center gap-2">
          <File className="w-4 h-4" />
          {node.name}
        </span>
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full text-left px-2 py-1 text-sm rounded hover:bg-secondary transition-colors flex items-center gap-1'
        )}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        {isExpanded ? (
          <FolderOpen className="w-4 h-4" />
        ) : (
          <FolderIcon className="w-4 h-4" />
        )}
        <span className="font-medium">{node.name}</span>
      </button>

      {isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTree
              key={child.path}
              node={child}
              depth={depth + 1}
              onSelectFile={onSelectFile}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </>
  )
}
```

### Step 2: Add FileTree to Sidebar (20 min)

**Edit**: `src/components/Sidebar.tsx`

Replace the projects list section with file tree + projects:

```typescript
// Add import
import { FileTree } from './FileTree'
import { useProjectStore } from '@/lib/project-store'

// In the Sidebar component, add state:
const [selectedFile, setSelectedFile] = useState<string | null>(null)
const { currentProject } = useProjectStore()

// In JSX, after projects list:
{currentProject && (
  <>
    <div className="border-b border-border">
      <div className="p-3 text-xs font-semibold text-muted-foreground">
        FILES
      </div>
      <div className="max-h-96 overflow-y-auto">
        <FileTree
          node={currentProject.fileTree}
          onSelectFile={setSelectedFile}
          selectedFile={selectedFile}
        />
      </div>
    </div>
  </>
)}
```

### Step 3: Wire FileTree to Code Editor (20 min)

**Edit**: `src/components/CodeEditor.tsx`

Update to load selected file:

```typescript
// Add to component props:
interface CodeEditorProps {
  isOpen: boolean
  onClose: () => void
  selectedFile: string | null  // NEW
}

// In component body:
useEffect(() => {
  if (selectedFile && currentProject) {
    const loadContent = async () => {
      const fileContent = await readFile(selectedFile)
      setContent(fileContent)
    }
    loadContent()
  }
}, [selectedFile, currentProject])

// Show selected file name in header:
<div className="flex items-center gap-2">
  {selectedFile && (
    <>
      <span className="text-sm font-medium">{selectedFile.split('/').pop()}</span>
      ...
    </>
  )}
</div>
```

### Step 4: Pass selectedFile Through App (15 min)

**Edit**: `src/App.tsx`

Add state and pass to children:

```typescript
const [selectedFile, setSelectedFile] = useState<string | null>(null)

// In layout:
<Sidebar 
  isOpen={sidebarOpen}
  selectedFile={selectedFile}
  onSelectFile={setSelectedFile}
/>

<CodeEditor
  isOpen={codeEditorOpen}
  onClose={() => setCodeEditorOpen(false)}
  selectedFile={selectedFile}
/>
```

### Step 5: Add Context Menu (45 min)

**File**: `src/components/FileTreeContextMenu.tsx`

```typescript
import React, { useState } from 'react'
import { Button } from './Button'
import { Trash2, Edit2, Plus } from 'lucide-react'

interface FileTreeContextMenuProps {
  node: FileNode
  onDelete: (path: string) => Promise<void>
  onRename: (path: string, newName: string) => Promise<void>
  onNewFile: (parentPath: string) => void
}

export function FileTreeContextMenu({ node, onDelete, onRename, onNewFile }: FileTreeContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onContextMenu={(e) => {
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
        className="w-full"
      >
        {/* File/folder content */}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
          <div className="absolute z-40 bg-card border border-border rounded shadow-lg">
            {node.type === 'directory' && (
              <Button variant="ghost" size="sm" onClick={() => onNewFile(node.path)}>
                <Plus className="w-4 h-4 mr-2" />
                New File
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onRename(node.path, 'new-name')}>
              <Edit2 className="w-4 h-4 mr-2" />
              Rename
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(node.path)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
```

### Step 6: Add Store Actions (30 min)

**Edit**: `src/lib/project-store.ts`

Add these actions (some already exist):

```typescript
// Already exists:
addFile(path, content, language)
deleteFile(path)
updateFile(path, content)

// Already exists:
updateFileTree(fileTree)

// Add rename:
renameFile: async (oldPath, newName) => {
  const { currentProject, updateFileTree } = get()
  if (!currentProject) return

  const newFileTree = JSON.parse(JSON.stringify(currentProject.fileTree))
  const pathParts = oldPath.split('/').filter(Boolean)
  let current = newFileTree

  // Navigate to parent
  for (let i = 0; i < pathParts.length - 1; i++) {
    current = current.children?.find((c: FileNode) => c.name === pathParts[i])
  }

  // Rename
  const file = current.children?.find((c: FileNode) => c.name === pathParts[pathParts.length - 1])
  if (file) {
    file.name = newName
    file.path = oldPath.replace(pathParts[pathParts.length - 1], newName)
  }

  await updateFileTree(newFileTree)
}

// Add newFolder:
createFolder: async (parentPath, folderName) => {
  const { currentProject, updateFileTree } = get()
  if (!currentProject) return

  const newFileTree = JSON.parse(JSON.stringify(currentProject.fileTree))
  // Similar logic to addFile but type='directory'
  
  await updateFileTree(newFileTree)
}
```

### Step 7: Test Locally (20 min)

1. Start dev server: `npm run dev`
2. Create new project
3. Try:
   - Expand/collapse folders
   - Click files
   - See content in editor
   - Try right-click (implement context menu)

---

## Testing Checklist

- [ ] File tree renders with correct structure
- [ ] Folder expand/collapse works
- [ ] Click file → opens in editor
- [ ] File content shows correctly
- [ ] Icons are appropriate
- [ ] Mobile view is responsive
- [ ] Dark/light mode looks good
- [ ] No console errors
- [ ] Project saves to Puter KV

---

## Troubleshooting

### File tree doesn't show
**Fix**: Check `currentProject.fileTree` exists
```typescript
console.log(useProjectStore.getState().currentProject?.fileTree)
```

### Click doesn't open file
**Fix**: Verify `readFile` is loading content
```typescript
const content = await readFile('/src/App.tsx')
console.log(content)
```

### Performance slow with many files
**Fix**: Implement virtual scrolling (future optimization)
```typescript
import { FixedSizeList } from 'react-window'
```

### Context menu doesn't appear
**Fix**: Make sure right-click handler prevents default
```typescript
onContextMenu={(e) => {
  e.preventDefault()
  // Show menu
}}
```

---

## Success Criteria

When you can:

✅ See file tree in sidebar  
✅ Expand folders  
✅ Click file  
✅ Content appears in editor  
✅ Create new file  
✅ Delete file  
✅ Project persists to Puter KV  

**You've completed Phase 2!** 🎉

---

## Next: Phase 3 (Chat Streaming)

Once file tree is done:

1. Implement `puter.ai.chat()` streaming in ChatArea
2. Parse streaming chunks
3. Parse tool calls (JSON in markdown)
4. Display beautifully with markdown rendering

Estimated time: 1-2 hours

---

## Code Examples

### Expand All Folders

```typescript
const expandAllFolders = (node: FileNode) => {
  const expand = (n: FileNode) => {
    if (n.type === 'directory') {
      n.children?.forEach(expand)
      // Set expanded state in component
    }
  }
  expand(node)
}
```

### Search Files

```typescript
const searchFiles = (node: FileNode, query: string): FileNode[] => {
  const results: FileNode[] = []
  
  const search = (n: FileNode) => {
    if (n.name.toLowerCase().includes(query.toLowerCase())) {
      results.push(n)
    }
    n.children?.forEach(search)
  }
  
  search(node)
  return results
}
```

### Get File by Path

```typescript
const getFileByPath = (node: FileNode, path: string): FileNode | null => {
  if (node.path === path) return node
  
  for (const child of node.children || []) {
    const found = getFileByPath(child, path)
    if (found) return found
  }
  
  return null
}
```

---

## Git Workflow

When Phase 2 is complete:

```bash
# Test locally
npm run dev

# Commit
git add -A
git commit -m "feat: implement file tree UI with file operations"

# Push
git push origin main

# Update project status
# Edit PROJECT_MANIFEST.md
# Mark Phase 2: File Tree ✅ 100%
```

---

## Time Breakdown

| Task | Time | Status |
|------|------|--------|
| FileTree component | 30 min | Ready to code |
| Sidebar integration | 20 min | Ready to code |
| Editor wiring | 20 min | Ready to code |
| App state passing | 15 min | Ready to code |
| Context menu | 45 min | Optional (first pass) |
| Store actions | 30 min | Ready to code |
| Testing | 20 min | Ready to code |
| **Total** | **~180 min** | **2.5-3 hours** |

---

## Pro Tips

1. **Start simple**: Just folder expand/collapse, then click to edit
2. **Add context menu later**: Get basics working first
3. **Use store for everything**: Let Zustand + Puter handle persistence
4. **Test file save**: After editing, refresh page - should still be there
5. **Mobile first**: Make sure it works on phone before polish

---

You've got this! FileTree is foundational but very doable. 

Once you finish this, chat streaming (Phase 3) becomes possible. 🚀

Good luck!
