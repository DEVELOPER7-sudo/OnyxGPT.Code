// localStorage-based project management
export interface StoredProject {
  id: string;
  prompt: string;
  model: string;
  createdAt: number;
}

export interface ProjectFiles {
  [filePath: string]: string;
}

const PROJECTS_KEY = 'onyx_projects';
const PROJECT_FILES_PREFIX = 'onyx_project_files_';

export const projectStorage = {
  // Projects management
  getProjects(): StoredProject[] {
    try {
      const data = localStorage.getItem(PROJECTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  createProject(id: string, prompt: string, model: string): StoredProject {
    const project: StoredProject = {
      id,
      prompt,
      model,
      createdAt: Date.now(),
    };
    const projects = this.getProjects();
    projects.push(project);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    // Initialize empty files object for this project
    localStorage.setItem(PROJECT_FILES_PREFIX + id, JSON.stringify({}));
    return project;
  },

  deleteProject(projectId: string): void {
    const projects = this.getProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
    localStorage.removeItem(PROJECT_FILES_PREFIX + projectId);
  },

  getProject(projectId: string): StoredProject | null {
    const projects = this.getProjects();
    return projects.find(p => p.id === projectId) || null;
  },

  // Project files management
  getProjectFiles(projectId: string): ProjectFiles {
    try {
      const data = localStorage.getItem(PROJECT_FILES_PREFIX + projectId);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  setProjectFiles(projectId: string, files: ProjectFiles): void {
    localStorage.setItem(PROJECT_FILES_PREFIX + projectId, JSON.stringify(files));
  },

  updateProjectFile(projectId: string, filePath: string, content: string): void {
    const files = this.getProjectFiles(projectId);
    files[filePath] = content;
    this.setProjectFiles(projectId, files);
  },

  deleteProjectFile(projectId: string, filePath: string): void {
    const files = this.getProjectFiles(projectId);
    delete files[filePath];
    this.setProjectFiles(projectId, files);
  },

  renameProjectFile(projectId: string, oldPath: string, newPath: string): void {
    const files = this.getProjectFiles(projectId);
    if (files[oldPath]) {
      files[newPath] = files[oldPath];
      delete files[oldPath];
      this.setProjectFiles(projectId, files);
    }
  },
};
