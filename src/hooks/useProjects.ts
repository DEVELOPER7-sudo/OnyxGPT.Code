import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface Project {
  id: string;
  prompt: string;
  createdAt: string;
}

const LOCAL_STORAGE_KEY = 'openLovableProjects';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);

  // Load projects from localStorage on initial component mount
  useEffect(() => {
    try {
      const storedProjects = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedProjects) {
        setProjects(JSON.parse(storedProjects));
      }
    } catch (error) {
      console.error("Failed to load projects from localStorage:", error);
      setProjects([]);
    }
  }, []);

  /**
   * Adds a new project to localStorage.
   */
  const addProject = useCallback((newProject: Project) => {
    try {
      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects));
    } catch (error) {
      console.error("Failed to save project to localStorage:", error);
    }
  }, [projects]);

  /**
   * Deletes a project from the backend and then from localStorage.
   */
  const deleteProject = useCallback(async (projectId: string) => {
    // Simple confirmation dialog to prevent accidental deletion
    if (!window.confirm("Are you sure you want to delete this project and all its files? This action cannot be undone.")) {
      return;
    }

    try {
      // 1. Call the backend to delete the physical files
      await axios.delete(`http://localhost:3002/api/delete-project/${projectId}`);

      // 2. If successful, remove the project from the local state and localStorage
      const updatedProjects = projects.filter((p) => p.id !== projectId);
      setProjects(updatedProjects);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects));

    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Could not delete the project files on the server. Please check the console.");
    }
  }, [projects]);

  return { projects, addProject, deleteProject };
}
