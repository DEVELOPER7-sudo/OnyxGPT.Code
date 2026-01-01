import React, { useEffect, useState } from 'react'
import { ThemeProvider } from './components/ThemeProvider'
import { PuterErrorBoundary } from './components/PuterErrorBoundary'
import { Topbar } from './components/Topbar'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { CodeEditor } from './components/CodeEditor'
import { PreviewPanel } from './components/PreviewPanel'
import { useProjectStore } from './lib/project-store'
import { cn } from './lib/utils'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [codeEditorOpen, setCodeEditorOpen] = useState(false)
  const [layoutMode, setLayoutMode] = useState<'chat-preview' | 'chat-editor' | 'full'>('chat-preview')

  const { currentProject, loadProjects, createProject, setCurrentProject } = useProjectStore()

  useEffect(() => {
    const init = async () => {
      await loadProjects()
      // If no projects, create a starter
      const projects = useProjectStore.getState().projects
      if (projects.length === 0) {
        const project = await createProject('Welcome to OnyxGPT.Code')
        setCurrentProject(project)
      } else {
        setCurrentProject(projects[0])
      }
    }

    init()
  }, [])

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* Topbar */}
      <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden gap-0 md:gap-0">
        {/* Sidebar - Hidden on mobile by default */}
        <div className={cn('hidden md:flex', sidebarOpen && 'md:flex')}>
          <Sidebar isOpen={sidebarOpen} />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar isOpen={sidebarOpen} />

        {/* Chat Area - Always visible, flex-1 */}
        <div className="flex-1 min-w-0 flex flex-col md:flex-row">
          {/* Chat */}
          <div className="flex-1 md:w-1/2 flex flex-col">
            <ChatArea />
          </div>

          {/* Right Panel - Preview/Code Split (hidden on mobile by default) */}
          <div
            className={cn(
              'hidden md:flex md:flex-col md:w-1/2 border-l border-border',
              'lg:h-full'
            )}
          >
            {/* Preview Panel always visible on right */}
            <div
              className={cn(
                'flex-1',
                codeEditorOpen && 'h-1/2'
              )}
            >
              <PreviewPanel />
            </div>

            {/* Code Editor - Collapsible */}
            {codeEditorOpen && (
              <div className="h-1/2 border-t border-border">
                <CodeEditor
                  isOpen={codeEditorOpen}
                  onClose={() => setCodeEditorOpen(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Code Editor - Bottom Drawer */}
      <div className="md:hidden">
        <CodeEditor
          isOpen={codeEditorOpen}
          onClose={() => setCodeEditorOpen(false)}
        />
      </div>

      {/* Fab Button for Code Editor (mobile) */}
      <button
        onClick={() => setCodeEditorOpen(!codeEditorOpen)}
        className="md:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center hover:bg-accent/90 transition-colors"
      >
        {'</>'}
      </button>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <PuterErrorBoundary>
        <AppContent />
      </PuterErrorBoundary>
    </ThemeProvider>
  )
}

export default App
