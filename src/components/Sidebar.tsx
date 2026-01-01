import React from 'react'
import { ChevronDown, Plus, Settings, Trash2 } from 'lucide-react'
import { Button } from './Button'
import { useProjectStore } from '@/lib/project-store'
import { formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
}

export function Sidebar({ isOpen }: SidebarProps) {
  const { projects, currentProject, createProject, setCurrentProject, deleteProject } =
    useProjectStore()

  const handleNewProject = async () => {
    const project = await createProject('Untitled Project')
    setCurrentProject(project)
  }

  const handleSelectProject = (project: any) => {
    setCurrentProject(project)
  }

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(id)
    }
  }

  return (
    <aside
      className={cn(
        'fixed md:relative w-64 h-[calc(100vh-4rem)] border-r border-border bg-background',
        'transition-all duration-300 ease-out z-30',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <Button className="w-full justify-start" onClick={handleNewProject}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No projects yet
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition-colors group',
                    currentProject?.id === project.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-secondary'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{project.name}</p>
                      <p className="text-xs opacity-70 mt-0.5">
                        {formatTime(project.updatedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 w-8 h-8"
                      onClick={(e) => handleDeleteProject(e, project.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </aside>
  )
}
