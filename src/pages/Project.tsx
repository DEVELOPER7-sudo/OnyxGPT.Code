import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Settings, FolderOpen, Play, Send, Code2, Eye, MessageSquare, Loader2, Menu, Rocket, Terminal, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Logo } from "@/components/Logo";
import { SettingsDialog } from "@/components/SettingsDialog";
import { ProjectsSidebar } from "@/components/ProjectsSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { CodeEditor } from "@/components/CodeEditor";
import { FileTree } from "@/components/FileTree";
import { LivePreview } from "@/components/LivePreview";
import { DeployDialog } from "@/components/DeployDialog";
import { CloudDashboard } from "@/components/CloudDashboard";
import { useAppStore } from "@/stores/appStore";
import { usePuter } from "@/hooks/usePuter";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useFileSync } from "@/hooks/useFileSync";
import { SandboxTerminal } from "@/components/SandboxTerminal";
import { SYSTEM_PROMPT, extractCodeBlocks } from "@/lib/systemPrompt";
import type { Project, Message, CodeArtifact } from "@/types/project";
import { v4 as uuidv4 } from "uuid";

interface LocationState { initialPrompt?: string; }

const Project = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  
  const { currentProject, setCurrentProject, user } = useAppStore();
  const { loadProject, saveProject, chat, isPuterAvailable, handleToolCall } = usePuter();
  const { buildFileTreeFromMessages } = useFileSync();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(true);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "cloud">("code");
  const [selectedArtifact, setSelectedArtifact] = useState<CodeArtifact | null>(null);
  const [projectName, setProjectName] = useState("Untitled Project");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load or create project
  useEffect(() => {
    const initProject = async () => {
      if (!id) return;
      
      console.log('🔄 Loading project:', id);
      let project = await loadProject(id);
      
      if (!project) {
        console.log('📝 Creating new project:', id);
        project = {
          id,
          name: "Untitled Project",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ownerId: user?.uuid || "anonymous",
          messages: [],
          fileTree: { name: "root", path: "/", type: "directory", children: [] },
          settings: { autoPreview: true },
        };
        await saveProject(project);
      } else {
        console.log('✅ Loaded project with', project.messages?.length || 0, 'messages');
      }
      
      // Ensure messages array exists
      if (!project.messages) {
        project.messages = [];
      }
      
      setCurrentProject(project);
      setProjectName(project.name);
      
      // Handle initial prompt only for truly new projects
      if (state?.initialPrompt && project.messages.length === 0) {
        // Clear state to prevent re-triggering
        window.history.replaceState({}, document.title);
        handleSendMessage(state.initialPrompt, project);
      }
    };
    
    initProject();
  }, [id]);

  // Auto-save with debounce
  useAutoSave(currentProject, {
    debounceMs: 1500,
    onSave: saveProject,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [currentProject?.messages]);

  const handleSendMessage = useCallback(async (content: string, proj?: Project) => {
    const project = proj || currentProject;
    if (!content.trim() || !project || !isPuterAvailable) return;
    
    const userMessage: Message = { id: uuidv4(), role: "user", content: content.trim(), timestamp: Date.now() };
    setInput("");
    setIsGenerating(true);

    // Get current messages before adding new ones
    const existingMessages = project.messages || [];

    const assistantMessageId = uuidv4();
    const streamingMessage: Message = { id: assistantMessageId, role: "assistant", content: "", timestamp: Date.now(), isStreaming: true };

    // Update project with user message immediately
    const projectWithUserMsg = {
      ...project,
      messages: [...existingMessages, userMessage],
      updatedAt: Date.now(),
    };
    setCurrentProject(projectWithUserMsg);
    await saveProject(projectWithUserMsg);

    // Add streaming placeholder
    const projectWithStreaming = {
      ...projectWithUserMsg,
      messages: [...projectWithUserMsg.messages, streamingMessage],
    };
    setCurrentProject(projectWithStreaming);

    try {
      const chatMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...existingMessages.filter(m => m.role !== 'error').map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: content.trim() },
      ];

      let fullResponse = "";
      await chat(chatMessages, (chunk) => {
        fullResponse += chunk;
        // Update streaming message in local state only (not store)
        const updatedMsgs = [...projectWithUserMsg.messages];
        const streamIdx = updatedMsgs.findIndex(m => m.id === assistantMessageId);
        if (streamIdx === -1) {
          updatedMsgs.push({ ...streamingMessage, content: fullResponse });
        } else {
          updatedMsgs[streamIdx] = { ...updatedMsgs[streamIdx], content: fullResponse };
        }
        setCurrentProject({ ...projectWithUserMsg, messages: updatedMsgs });
      });

      // Check for tool calls in the response (both onyx_ prefixed and legacy)
      const onyxToolMatch = fullResponse.match(/```json\s*\{[\s\S]*?"tool"\s*:\s*"onyx_[^"]+"[\s\S]*?\}\s*```/);
      if (onyxToolMatch) {
        try {
          const toolCallStr = onyxToolMatch[0].replace(/```json\s*/, '').replace(/\s*```/, '');
          const toolCall = JSON.parse(toolCallStr);
          const toolResult = await handleToolCall(toolCall);
          fullResponse += `\n\n**Terminal Output:**\n${toolResult}`;
        } catch (toolError) {
          console.warn('Tool call parsing error:', toolError);
          fullResponse += `\n\n**Tool Execution Note:** Could not execute tool (check console for details)`;
        }
      }
      
      // Also check for legacy terminal tool calls
      const toolCallMatch = fullResponse.match(/```json\s*\{[\s\S]*?"tool"\s*:\s*"terminal"[\s\S]*?\}\s*```/);
      if (toolCallMatch) {
        try {
          const toolCallStr = toolCallMatch[0].replace(/```json\s*/, '').replace(/\s*```/, '');
          const toolCall = JSON.parse(toolCallStr);
          const toolResult = await handleToolCall(toolCall);
          fullResponse += `\n\n**Terminal Output:**\n${toolResult}`;
        } catch (toolError) {
          console.warn('Tool call parsing error:', toolError);
        }
      }

      // Extract code artifacts
      const codeBlocks = extractCodeBlocks(fullResponse);
      const artifacts: CodeArtifact[] = codeBlocks.map((block, i) => ({
        id: `${assistantMessageId}-${i}`,
        filename: block.filepath,
        language: block.language,
        content: block.content,
        action: "create" as const,
      }));

      // Final message with artifacts
      const finalAssistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: fullResponse,
        timestamp: Date.now(),
        isStreaming: false,
        artifacts,
      };

      if (artifacts.length > 0) {
        setSelectedArtifact(artifacts[0]);
        setActiveTab("code");
      }

      // Build final project state with all messages
      const finalMessages = [...existingMessages, userMessage, finalAssistantMessage];
      const newFileTree = buildFileTreeFromMessages(finalMessages);
      const finalProject: Project = {
        ...project,
        messages: finalMessages,
        fileTree: newFileTree,
        updatedAt: Date.now(),
      };
      
      setCurrentProject(finalProject);
      await saveProject(finalProject);
      console.log('💾 Chat saved successfully:', finalProject.id, finalProject.messages.length, 'messages');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An error occurred";
      const errorMessage: Message = { id: assistantMessageId, role: "error", content: errorMsg, timestamp: Date.now(), isStreaming: false };
      const errorProject = { ...project, messages: [...existingMessages, userMessage, errorMessage], updatedAt: Date.now() };
      setCurrentProject(errorProject);
      await saveProject(errorProject);
    } finally {
      setIsGenerating(false);
    }
  }, [currentProject, isPuterAvailable, chat, saveProject, buildFileTreeFromMessages, setCurrentProject, handleToolCall]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  return (
    <div className="h-screen bg-background relative overflow-hidden flex flex-col flex-safe">
      <AnimatedBackground />
      <ProjectsSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentProjectId={id} />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <DeployDialog
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        projectId={id || ''}
        projectName={projectName}
        files={currentProject?.messages.flatMap(m => m.artifacts?.map(a => ({ path: a.filename, content: a.content })) || [])}
      />
      <SandboxTerminal
        isOpen={activeTab === "cloud"}
        onClose={() => setActiveTab("code")}
        projectId={id || ''}
      />

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex items-center justify-between px-2 sm:px-4 py-3 border-b border-border/50 glass-card flex-shrink-0 h-fit">
        <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-safe">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="h-8 w-8 sm:h-10 sm:w-10"><FolderOpen className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8 sm:h-10 sm:w-10"><ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
          <Logo size="sm" />
          <div className="hidden sm:block h-6 w-px bg-border" />
          <input 
            type="text" 
            value={projectName} 
            onChange={(e) => setProjectName(e.target.value)} 
            onBlur={() => {
              if (currentProject) {
                const updated = { ...currentProject, name: projectName, updatedAt: Date.now() };
                setCurrentProject(updated);
                saveProject(updated);
              }
            }}
            className="hidden sm:block bg-transparent text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-2 py-1 min-w-0 flex-safe" 
          />
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setIsFileTreeOpen(!isFileTreeOpen)} className="h-8 w-8 sm:h-10 sm:w-10">
            {isFileTreeOpen ? <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4" /> : <Menu className="w-3 h-3 sm:w-4 sm:h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="h-8 w-8 sm:h-10 sm:w-10"><Settings className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setIsDeployOpen(true)} className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"><Rocket className="w-3 h-3" /><span className="hidden sm:inline">Deploy</span></Button>
          <Button size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"><Play className="w-3 h-3" /><span className="hidden sm:inline">Run</span></Button>
          <Button variant="ghost" size="icon" onClick={() => setActiveTab(activeTab === "preview" ? "code" : "preview")} className="h-8 w-8 sm:h-10 sm:w-10">
            {activeTab === "preview" ? <Code2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
          </Button>
        </div>
      </motion.header>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex relative z-10 overflow-hidden gap-0 flex-safe min-h-0">
        {/* Left Panel: Chat + Files */}
        <div className="w-full lg:w-1/2 flex flex-col border-r border-border/50 overflow-hidden min-h-0">
          {/* File Tree Toggle (Mobile) */}
          <AnimatePresence>
            {isFileTreeOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden border-b border-border/50 max-h-48 overflow-hidden flex-shrink-0"
              >
                <FileTree 
                  fileTree={currentProject?.fileTree}
                  onFileSelect={(filepath) => {
                    const artifact = currentProject?.messages
                      .flatMap(m => m.artifacts || [])
                      .find(a => a.filename === filepath);
                    if (artifact) {
                      setSelectedArtifact(artifact);
                      setActiveTab("code");
                    }
                  }}
                  onClose={() => setIsFileTreeOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Panel - Fixed Layout */}
          <div className="flex-1 flex flex-col glass-card overflow-hidden min-h-0">
            <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-border/50 bg-card/30 flex-shrink-0 h-fit">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Chat</span>
            </div>

            {/* Messages Container - Scrollable Only */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 min-h-0 pb-2 max-h-[calc(100vh-200px)]" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {currentProject?.messages.map((message) => (
                <ChatMessage key={message.id} message={message} onArtifactClick={(artifact) => { setSelectedArtifact(artifact); setActiveTab("code"); }} />
              ))}
              {currentProject?.messages.length === 0 && !isGenerating && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Start by describing what you want to build</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input - Sticky at Bottom */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border/50 bg-card/30 backdrop-blur">
            <div className="relative">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Describe what you want to build..." rows={1} disabled={!isPuterAvailable} className="w-full bg-secondary/50 rounded-xl px-4 py-2 sm:py-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50 resize-none disabled:opacity-50 max-h-24" />
                <Button size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg" disabled={isGenerating || !input.trim() || !isPuterAvailable} onClick={() => handleSendMessage(input)}>
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Code/Preview + File Tree (Desktop) */}
        <div className="hidden lg:flex w-1/2 flex-col gap-0 overflow-hidden min-h-0">
          {/* Code/Preview Tabs */}
          <div className="flex-1 flex flex-col glass-card overflow-hidden border-l border-border/50 min-h-0">
            <div className="flex items-center gap-1 p-2 border-b border-border/50 bg-card/30 flex-shrink-0 h-fit">
              <button onClick={() => setActiveTab("preview")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeTab === "preview" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Eye className="w-4 h-4" />Preview
              </button>
              <button onClick={() => setActiveTab("code")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeTab === "code" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Code2 className="w-4 h-4" />Code
              </button>
              <button onClick={() => setActiveTab("cloud")} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeTab === "cloud" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Cloud className="w-4 h-4" />Cloud
              </button>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
              {activeTab === "code" ? (
                <CodeEditor artifact={selectedArtifact} onClose={() => setSelectedArtifact(null)} />
              ) : activeTab === "cloud" ? (
                <CloudDashboard />
              ) : (
                <LivePreview 
                  projectId={id}
                  port={3000}
                />
              )}
            </div>
          </div>

          {/* Bottom: File Tree */}
          {isFileTreeOpen && (
            <div className="flex gap-2 p-2 border-t border-border/50 bg-background/20 overflow-hidden flex-shrink-0 h-64">
              <div className="flex-1 min-w-0">
                <FileTree 
                  fileTree={currentProject?.fileTree}
                  onFileSelect={(filepath) => {
                    const artifact = currentProject?.messages
                      .flatMap(m => m.artifacts || [])
                      .find(a => a.filename === filepath);
                    if (artifact) {
                      setSelectedArtifact(artifact);
                      setActiveTab("code");
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Project;
