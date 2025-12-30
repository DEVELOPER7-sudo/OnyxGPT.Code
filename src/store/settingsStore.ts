import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  modelId: string;
  sandboxApi: string;
  setModelId: (id: string) => void;
  setSandboxApi: (api: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      modelId: 'gpt-4o',
      sandboxApi: 'https://api.puter.com/ai/text/generate',
      setModelId: (id: string) => set({ modelId: id }),
      setSandboxApi: (api: string) => set({ sandboxApi: api }),
    }),
    {
      name: 'onyxgpt-settings',
    }
  )
);
