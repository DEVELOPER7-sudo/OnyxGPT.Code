import { useState, useEffect, useCallback } from 'react';
import { projectStorage } from '@/lib/projectStorage';

export interface Project {
  id: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects from localStorage
  const fetchProjects = useCallback(() => {
    try {
      setLoading(true);
      const storedProjects = projectStorage.getProjects();
      setProjects(storedProjects.map(p => ({ id: p.id })));
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /**
   * Deletes a project from localStorage and refreshes the list.
   */
  const deleteProject = useCallback((projectId: string) => {
    if (!window.confirm("Are you sure you want to delete this project and all its files? This action cannot be undone.")) {
      return;
    }

    try {
      projectStorage.deleteProject(projectId);
      // Refresh the projects list after successful deletion
      fetchProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Could not delete the project. Please check the console.");
    }
  }, [fetchProjects]);

  return { 
    projects, 
    loading,
    deleteProject, 
    refreshProjects: fetchProjects 
  };
}
