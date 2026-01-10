import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, Trash2, Clock, Loader2, ChevronLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { usePuter } from '@/hooks/usePuter';
import type { Project } from '@/types/project';

interface ProjectsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId?: string;
}

export const ProjectsSidebar = ({ isOpen, onClose, currentProjectId }: ProjectsSidebarProps) => {
  const navigate = useNavigate();
  const { projects, isProjectsLoading } = useAppStore();
  const { loadProjects, deleteProject } = usePuter();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteProject = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    
    setDeletingId(project.id);
    try {
      await deleteProject(project.id);
      if (currentProjectId === project.id) {
        navigate('/');
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectProject = (project: Project) => {
    navigate(`/project/${project.id}`);
    onClose();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-80 glass-card border-r border-border/50 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                <span className="font-semibold">Projects</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full bg-secondary/50 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* New Project Button */}
            <div className="p-4">
              <Button 
                onClick={() => { navigate('/'); onClose(); }}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>

            {/* Projects List */}
            <div className="flex-1 overflow-y-auto p-2">
              {isProjectsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? 'No matching projects' : 'No projects yet'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredProjects.map((project) => (
                    <motion.button
                      key={project.id}
                      onClick={() => handleSelectProject(project)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full text-left p-3 rounded-xl transition-colors group ${
                        currentProjectId === project.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{project.name}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(project.updatedAt)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteProject(e, project)}
                          disabled={deletingId === project.id}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                        >
                          {deletingId === project.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {project.messages.length > 0 && (
                        <div className="text-xs text-muted-foreground/60 mt-2 truncate">
                          {project.messages[project.messages.length - 1]?.content.slice(0, 50)}...
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
