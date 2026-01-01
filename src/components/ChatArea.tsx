import React, { useRef, useEffect, useState } from 'react'
import { Send, Loader } from 'lucide-react'
import { Button } from './Button'
import { useProjectStore } from '@/lib/project-store'
import { Message } from '@/types'
import { generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function ChatArea() {
  const { currentProject, addMessage } = useProjectStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentProject) {
      setMessages(currentProject.messages)
    }
  }, [currentProject])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !currentProject || isLoading) return

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    }

    setMessages([...messages, userMessage])
    await addMessage(userMessage)
    setInput('')

    // Simulate agent response
    setIsLoading(true)
    setTimeout(async () => {
      const agentMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `I received your message: "${input}". I'm ready to help build your app!`,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, agentMessage])
      await addMessage(agentMessage)
      setIsLoading(false)
    }, 1000)
  }

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No project selected</p>
          <p className="text-sm">Create or select a project to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Start chatting</p>
              <p className="text-sm max-w-sm">
                Describe what you want to build, and I'll create beautiful code for you.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 animate-in fade-in slide-in-from-bottom-2',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-xs lg:max-w-md rounded-lg px-4 py-2.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-card border border-border text-foreground'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 animate-in fade-in">
                <div className="bg-card border border-border rounded-lg px-4 py-2.5 flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what to build..."
            disabled={isLoading}
            className={cn(
              'flex-1 bg-input border border-border rounded-lg px-4 py-2',
              'focus:outline-none focus:ring-2 focus:ring-accent',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
