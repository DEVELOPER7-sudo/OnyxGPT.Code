import React, { useState } from 'react'
import { Menu, Plus, Download, Share2, Sun, Moon } from 'lucide-react'
import { Button } from './Button'
import { useTheme } from './ThemeProvider'
import { useProjectStore } from '@/lib/project-store'
import { cn } from '@/lib/utils'

interface TopbarProps {
  onMenuToggle: () => void
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { theme, toggleTheme } = useTheme()
  const { currentProject, createProject, updateProjectName } = useProjectStore()
  const [isEditingName, setIsEditingName] = useState(false)
  const [projectName, setProjectName] = useState(currentProject?.name || 'New Project')

  const handleNameChange = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentProject) {
      await updateProjectName(currentProject.id, projectName)
      setIsEditingName(false)
    } else if (e.key === 'Escape') {
      setProjectName(currentProject?.name || 'New Project')
      setIsEditingName(false)
    }
  }

  const handleNewProject = async () => {
    const project = await createProject('Untitled Project')
    // Will trigger navigation in parent
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-4 gap-4">
        {/* Left */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="hidden md:inline-flex"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg font-bold bg-gradient-to-r from-accent to-accent/50 bg-clip-text text-transparent whitespace-nowrap">
              OnyxGPT.Code
            </span>
            <span className="hidden sm:inline text-muted-foreground">/</span>
            {isEditingName ? (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={handleNameChange}
                onBlur={() => setIsEditingName(false)}
                autoFocus
                className={cn(
                  'bg-input border border-border rounded px-2 py-1 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-accent min-w-0 flex-1 truncate'
                )}
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className={cn(
                  'text-sm font-medium hover:bg-secondary rounded px-2 py-1',
                  'transition-colors min-w-0 flex-1 text-left truncate'
                )}
                title={currentProject?.name}
              >
                {projectName}
              </button>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNewProject}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">New</span>
          </Button>

          <Button variant="ghost" size="icon">
            <Download className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon">
            <Share2 className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
