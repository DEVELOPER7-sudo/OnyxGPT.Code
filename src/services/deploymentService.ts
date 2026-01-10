/**
 * Deployment Service
 * Handles project deployment detection, validation, and execution
 * Fixes deployment issues for Node.js, Python, Go, and other languages
 */

import type { FileNode, Project } from '@/types/project';

export type Language = 'nodejs' | 'python' | 'go' | 'rust' | 'static' | 'unknown';

export interface DeploymentConfig {
  language: Language;
  buildCommand: string;
  runCommand: string;
  port: number;
  entryPoint: string;
  environment: Record<string, string>;
}

export interface DeploymentValidation {
  valid: boolean;
  language: Language;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Build commands for different languages
export const BUILD_COMMANDS: Record<Language, string> = {
  nodejs: 'npm install --legacy-peer-deps 2>&1 && npm run build 2>&1 || npm install --legacy-peer-deps 2>&1',
  python: 'pip install -r requirements.txt 2>&1 || pip install -r pyproject.toml 2>&1 || echo "No requirements file found"',
  go: 'go mod download 2>&1 && go build -o app . 2>&1 || echo "Go build failed"',
  rust: 'cargo build --release 2>&1 || echo "Rust build failed"',
  static: 'echo "Static site ready" 2>&1',
  unknown: 'echo "Unknown language - using default commands" 2>&1',
};

// Run commands for different languages
export const RUN_COMMANDS: Record<Language, string> = {
  nodejs: 'npm start 2>&1 || npm run dev 2>&1 || node index.js 2>&1',
  python: 'python app.py 2>&1 || python main.py 2>&1 || python index.py 2>&1 || python server.py 2>&1',
  go: './app 2>&1 || go run . 2>&1',
  rust: './target/release/app 2>&1 || ./target/debug/app 2>&1',
  static: 'npx serve -s . -l 3000 2>&1 || python -m http.server 3000 2>&1 || python3 -m http.server 3000 2>&1',
  unknown: 'echo "Cannot determine how to run this project - check file structure" 2>&1',
};

// Default ports for different languages
export const DEFAULT_PORTS: Record<Language, number> = {
  nodejs: 3000,
  python: 5000,
  go: 8080,
  rust: 8080,
  static: 3000,
  unknown: 3000,
};

/**
 * Flatten file tree to get all file paths
 */
function flattenFileTree(node: FileNode, basePath: string = ''): string[] {
  const paths: string[] = [];
  
  if (node.type === 'file') {
    paths.push(`${basePath}/${node.name}`);
  }
  
  if (node.children) {
    for (const child of node.children) {
      paths.push(...flattenFileTree(child, `${basePath}/${node.name}`));
    }
  }
  
  return paths;
}

/**
 * Check if file exists in project
 */
function hasFile(fileTree: FileNode, filename: string): boolean {
  const paths = flattenFileTree(fileTree);
  return paths.some(p => p.includes(filename));
}

/**
 * Detect project language from file tree
 */
export function detectLanguage(fileTree: FileNode): Language {
  const files = flattenFileTree(fileTree).map(f => f.toLowerCase());

  // Check for Node.js
  if (files.some(f => f.includes('package.json'))) {
    return 'nodejs';
  }

  // Check for Python
  if (files.some(f => f.includes('requirements.txt'))) {
    return 'python';
  }
  if (files.some(f => f.includes('pyproject.toml'))) {
    return 'python';
  }
  if (files.some(f => f.includes('setup.py'))) {
    return 'python';
  }

  // Check for Go
  if (files.some(f => f.includes('go.mod'))) {
    return 'go';
  }
  if (files.some(f => f.includes('main.go'))) {
    return 'go';
  }

  // Check for Rust
  if (files.some(f => f.includes('cargo.toml'))) {
    return 'rust';
  }

  // Check for static HTML
  if (files.some(f => f.includes('index.html'))) {
    return 'static';
  }

  return 'unknown';
}

/**
 * Find project entry point
 */
export function findEntryPoint(language: Language, fileTree: FileNode): string {
  const files = flattenFileTree(fileTree);

  switch (language) {
    case 'nodejs':
      // Look for common entry points
      if (files.some(f => f.includes('server.js'))) return 'server.js';
      if (files.some(f => f.includes('index.js'))) return 'index.js';
      if (files.some(f => f.includes('app.js'))) return 'app.js';
      if (files.some(f => f.includes('main.js'))) return 'main.js';
      return 'index.js'; // Default

    case 'python':
      if (files.some(f => f.includes('app.py'))) return 'app.py';
      if (files.some(f => f.includes('main.py'))) return 'main.py';
      if (files.some(f => f.includes('index.py'))) return 'index.py';
      return 'app.py'; // Default

    case 'go':
      return 'main.go';

    case 'rust':
      return 'main.rs';

    case 'static':
      return 'index.html';

    default:
      return 'unknown';
  }
}

/**
 * Validate project for deployment
 */
export function validateDeployment(project: Project): DeploymentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const language = detectLanguage(project.fileTree);

  if (language === 'nodejs') {
    if (!hasFile(project.fileTree, 'package.json')) {
      errors.push('Node.js project missing package.json');
      suggestions.push('Create a package.json file with your project dependencies');
    }
  } else if (language === 'python') {
    if (!hasFile(project.fileTree, 'requirements.txt') && !hasFile(project.fileTree, 'pyproject.toml')) {
      warnings.push('Python project should have requirements.txt or pyproject.toml for dependencies');
      suggestions.push('Create a requirements.txt with your Python dependencies');
    }
  } else if (language === 'go') {
    if (!hasFile(project.fileTree, 'go.mod')) {
      errors.push('Go project missing go.mod');
      suggestions.push('Run `go mod init` to create go.mod');
    }
  } else if (language === 'static') {
    if (!hasFile(project.fileTree, 'index.html')) {
      warnings.push('Static site missing index.html');
    }
  } else if (language === 'unknown') {
    warnings.push('Could not detect project language/type');
    suggestions.push('Add package.json, requirements.txt, go.mod, or index.html to specify project type');
  }

  // Check for main entry point
  const entryPoint = findEntryPoint(language, project.fileTree);
  if (entryPoint === 'unknown' || entryPoint === 'index.html') {
    // This is okay
  } else if (!hasFile(project.fileTree, entryPoint)) {
    warnings.push(`Could not find expected entry point: ${entryPoint}`);
  }

  return {
    valid: errors.length === 0,
    language,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Get deployment configuration for project
 */
export function getDeploymentConfig(project: Project): DeploymentConfig {
  const language = detectLanguage(project.fileTree);
  const entryPoint = findEntryPoint(language, project.fileTree);

  return {
    language,
    buildCommand: BUILD_COMMANDS[language],
    runCommand: RUN_COMMANDS[language],
    port: DEFAULT_PORTS[language],
    entryPoint,
    environment: {
      'NODE_ENV': language === 'nodejs' ? 'production' : undefined,
      'PYTHONUNBUFFERED': language === 'python' ? '1' : undefined,
      'RUST_LOG': language === 'rust' ? 'info' : undefined,
    },
  };
}

/**
 * Get deployment diagnostics
 */
export function getDiagnostics(project: Project): {
  detection: DeploymentValidation;
  config: DeploymentConfig;
  issues: Array<{ level: 'error' | 'warning' | 'info'; message: string }>;
} {
  const detection = validateDeployment(project);
  const config = getDeploymentConfig(project);
  const issues: Array<{ level: 'error' | 'warning' | 'info'; message: string }> = [];

  // Add errors
  for (const error of detection.errors) {
    issues.push({ level: 'error', message: error });
  }

  // Add warnings
  for (const warning of detection.warnings) {
    issues.push({ level: 'warning', message: warning });
  }

  // Add info
  issues.push({
    level: 'info',
    message: `Detected language: ${detection.language}`,
  });
  issues.push({
    level: 'info',
    message: `Build command: ${config.buildCommand}`,
  });
  issues.push({
    level: 'info',
    message: `Run command: ${config.runCommand}`,
  });
  issues.push({
    level: 'info',
    message: `Port: ${config.port}`,
  });

  return {
    detection,
    config,
    issues,
  };
}

/**
 * Format deployment error safely (fixes "[object Object]" error)
 */
export function formatDeploymentError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    try {
      return JSON.stringify(error).slice(0, 500);
    } catch (e) {
      return 'Unknown deployment error occurred';
    }
  }
  return String(error);
}
