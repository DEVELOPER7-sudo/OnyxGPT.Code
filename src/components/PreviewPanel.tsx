import React, { useState, useEffect } from 'react'
import { RotateCcw, ExternalLink, Loader } from 'lucide-react'
import { Button } from './Button'
import { useProjectStore } from '@/lib/project-store'

export function PreviewPanel() {
  const { currentProject } = useProjectStore()
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  useEffect(() => {
    if (currentProject?.lastPreviewUrl) {
      setPreviewUrl(currentProject.lastPreviewUrl)
    }
  }, [currentProject])

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-card/50">
        <h3 className="text-sm font-medium">Live Preview</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
          </Button>
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-hidden">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            title="Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-sm font-medium mb-2">No preview available</p>
              <p className="text-xs">
                Run code to see preview here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
