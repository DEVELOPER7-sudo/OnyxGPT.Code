import React, { useState, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { typescript } from '@codemirror/lang-typescript'
import { autocompletion } from '@codemirror/autocomplete'
import { X, ChevronUp } from 'lucide-react'
import { Button } from './Button'
import { useProjectStore } from '@/lib/project-store'
import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/utils'

interface CodeEditorProps {
  isOpen: boolean
  onClose: () => void
}

export function CodeEditor({ isOpen, onClose }: CodeEditorProps) {
  const { theme } = useTheme()
  const { currentProject, updateFile, readFile } = useProjectStore()
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    if (selectedFile && currentProject) {
      const loadContent = async () => {
        const fileContent = await readFile(selectedFile)
        setContent(fileContent)
      }
      loadContent()
    }
  }, [selectedFile, currentProject, readFile])

  const handleSave = async () => {
    if (selectedFile && currentProject) {
      await updateFile(selectedFile, content)
    }
  }

  const getLanguageExt = (path: string) => {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      return typescript()
    }
    if (path.endsWith('.js') || path.endsWith('.jsx')) {
      return javascript()
    }
    return javascript()
  }

  const editorTheme = theme === 'dark'
    ? 'dark'
    : 'light'

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 md:relative z-20',
        'bg-background border-t border-border',
        'transition-all duration-300',
        'h-80 md:h-full'
      )}
    >
      <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          {selectedFile && (
            <>
              <span className="text-sm font-medium">{selectedFile.split('/').pop()}</span>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => setSelectedFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            Save
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {selectedFile ? (
        <div className="h-[calc(100%-3rem)] overflow-hidden">
          <CodeMirror
            value={content}
            onChange={setContent}
            extensions={[getLanguageExt(selectedFile), autocompletion()]}
            theme={editorTheme}
            height="100%"
            options={{
              lineNumbers: true,
              indentUnit: 2,
              tabSize: 2,
            }}
          />
        </div>
      ) : (
        <div className="h-[calc(100%-3rem)] flex items-center justify-center text-muted-foreground">
          <p className="text-sm">Select a file to edit</p>
        </div>
      )}
    </div>
  )
}
