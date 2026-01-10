export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: number;
  artifacts?: CodeArtifact[];
  isStreaming?: boolean;
}

export interface CodeArtifact {
  id: string;
  filename: string;
  language: string;
  content: string;
  action: 'create' | 'update' | 'delete';
}

export interface ProjectSync {
  lastSyncedAt: number;
  syncStatus: 'syncing' | 'synced' | 'failed' | 'pending';
  changeCount: number;
  conflictCount: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  ownerId: string;
  messages: Message[];
  fileTree: FileNode;
  settings: ProjectSettings;
  syncMetadata?: ProjectSync;
}

export interface ProjectSettings {
  model?: string;
  temperature?: number;
  autoPreview: boolean;
}

export interface AppSettings {
  defaultModel: string;
  temperature: number;
  sandboxApiKey: string;
  autoPreview: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: 'gpt-4o-mini',
  temperature: 0.7,
  sandboxApiKey: '',
  autoPreview: true,
};

export const AVAILABLE_MODELS = [
  { id: 'gpt-5-nano', name: 'GPT-5 Nano', provider: 'OpenAI', description: 'Fast & efficient' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Balanced performance' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Most capable' },
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', description: 'Excellent coding' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Fast & smart' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Quick responses' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Advanced reasoning' },
  { id: 'llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta', description: 'Open source' },
];
