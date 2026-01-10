import { motion } from "framer-motion";
import { Zap, Code2, Layers, Cpu, Rocket, Shield, Settings, FolderOpen, Clock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { PromptInput } from "@/components/PromptInput";
import { Logo } from "@/components/Logo";
import { FeatureCard } from "@/components/FeatureCard";
import { SettingsDialog } from "@/components/SettingsDialog";
import { AuthButton } from "@/components/AuthButton";
import { ProjectsSidebar } from "@/components/ProjectsSidebar";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";
import { usePuter } from "@/hooks/usePuter";

const features = [
  { icon: Zap, title: "Lightning Fast", description: "See your ideas come to life in seconds with real-time AI code generation." },
  { icon: Code2, title: "Production Ready", description: "Generate clean, typed TypeScript code with modern React patterns." },
  { icon: Layers, title: "Full Stack", description: "From UI components to backend logic, build complete applications." },
  { icon: Cpu, title: "AI Powered", description: "Powered by 500+ AI models via Puter.js - GPT, Claude, Gemini & more." },
  { icon: Rocket, title: "Cloud Storage", description: "Projects auto-save to cloud. Access them anywhere, anytime." },
  { icon: Shield, title: "Secure by Default", description: "Your code and data are protected with enterprise-grade security." },
];

const Index = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isPuterAvailable, projects } = useAppStore();
  const { initAuth, loadProjects } = usePuter();
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      console.log('🚀 Initializing Index page...');
      try {
        const user = await initAuth();
        console.log('✅ Auth initialized:', user ? user.username : 'anonymous');
      } catch (error) {
        console.error('❌ Auth init error:', error);
      }
      
      try {
        const loaded = await loadProjects();
        console.log('✅ Projects loaded:', loaded?.length || 0);
        if (!loaded || loaded.length === 0) {
          console.log('📝 No projects found. User can create new projects.');
        }
      } catch (error) {
        console.error('❌ Projects load error:', error);
      }
    };
    
    init();
  }, [initAuth, loadProjects]);

  const recentProjects = projects.slice(0, 6);
  
  useEffect(() => {
    if (recentProjects.length > 0) {
      console.log('📂 Recent projects:', recentProjects.map(p => p.name));
    }
  }, [recentProjects]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />
      <ProjectsSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <FolderOpen className="w-5 h-5" />
          </Button>
          <Logo size="md" />
        </div>
        
        <div className="flex items-center gap-2">
          {!isPuterAvailable && (
            <span className="text-xs text-yellow-500 hidden sm:block">Puter offline</span>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-5 h-5" />
          </Button>
          <AuthButton />
        </div>
      </motion.header>

      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 lg:pt-32">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-muted-foreground">Powered by Puter.js AI</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-8 max-w-4xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Build apps with </span>
            <span className="gradient-text glow-text">natural language</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Describe your vision, and watch it transform into a fully functional application. Powered by 500+ AI models.
          </p>
        </motion.div>

        <div className="w-full max-w-3xl mb-16">
          <PromptInput />
        </div>
      </main>

      {/* Recent Projects Section */}
      {recentProjects.length > 0 && (
        <section className="relative z-10 px-6 py-16 lg:px-12 border-t border-border/30">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Recent Projects</h2>
              <p className="text-muted-foreground text-sm">Continue working on your recent projects</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map((project, index) => (
                <motion.button
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="text-left p-5 rounded-xl glass-card border border-border/50 hover:border-border hover:bg-secondary/30 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{project.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                  {project.messages.length > 0 && (
                    <p className="text-sm text-muted-foreground/70 line-clamp-2">
                      {project.messages[project.messages.length - 1]?.content.slice(0, 100)}
                    </p>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="features" className="relative z-10 px-6 pb-32 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to <span className="gradient-text">ship fast</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} icon={feature.icon} title={feature.title} description={feature.description} delay={0.1 * index} />
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/50 px-6 py-8 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} OnyxGPT.Code</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
