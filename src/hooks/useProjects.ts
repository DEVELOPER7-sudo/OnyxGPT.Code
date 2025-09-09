import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface Project {
  id: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3002/api/projects');
      if (response.data.success) {
        setProjects(response.data.projects);
      }
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
   * Deletes a project from the backend and refreshes the list.
   */
  const deleteProject = useCallback(async (projectId: string) => {
    if (!window.confirm("Are you sure you want to delete this project and all its files? This action cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3002/api/delete-project/${projectId}`);
      // Refresh the projects list after successful deletion
      await fetchProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Could not delete the project files on the server. Please check the console.");
    }
  }, [fetchProjects]);

  return { 
    projects, 
    loading,
    deleteProject, 
    refreshProjects: fetchProjects 
  };
}
