import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Cpu, Thermometer, Key, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { AVAILABLE_MODELS } from '@/types/project';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog = ({ isOpen, onClose }: SettingsDialogProps) => {
  const { settings, setSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleSave = () => {
    setSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleModelSelect = (modelId: string) => {
    setLocalSettings(prev => ({ ...prev, defaultModel: modelId }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto"
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto rounded-2xl"
          >
            <div className="glass-card rounded-2xl border border-border/50 shadow-2xl flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Settings</h2>
                    <p className="text-sm text-muted-foreground">Configure your AI and sandbox settings</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-8 overflow-y-auto flex-1">
                {/* Model Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    <h3 className="font-medium">AI Model</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleModelSelect(model.id)}
                        className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${
                          localSettings.defaultModel === model.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border/50 hover:border-border hover:bg-secondary/50'
                        }`}
                      >
                        {localSettings.defaultModel === model.id && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        <div className="font-medium text-sm">{model.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{model.provider}</div>
                        <div className="text-xs text-primary/80 mt-1">{model.description}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Or enter a custom model ID:
                  </p>
                  <input
                    type="text"
                    value={localSettings.defaultModel}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultModel: e.target.value }))}
                    placeholder="e.g., gpt-4o, claude-sonnet-4"
                    className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50 font-mono"
                  />
                </div>

                {/* Temperature */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-primary" />
                      <h3 className="font-medium">Temperature</h3>
                    </div>
                    <span className="text-sm font-mono text-primary">{localSettings.temperature.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={localSettings.temperature}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Precise (0)</span>
                    <span>Balanced (1)</span>
                    <span>Creative (2)</span>
                  </div>
                </div>

                {/* Sandbox API Key */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    <h3 className="font-medium">Sandbox API Key (E2B)</h3>
                  </div>
                  <input
                    type="password"
                    value={localSettings.sandboxApiKey}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, sandboxApiKey: e.target.value }))}
                    placeholder="e2b_xxxxxxxxxxxxxxxx"
                    className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50 font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional. Get your key from{' '}
                    <a href="https://e2b.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      e2b.dev
                    </a>
                    {' '}to enable code execution in sandboxes.
                  </p>
                </div>

                {/* Auto Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <h3 className="font-medium">Auto Preview</h3>
                    </div>
                    <button
                      onClick={() => setLocalSettings(prev => ({ ...prev, autoPreview: !prev.autoPreview }))}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        localSettings.autoPreview ? 'bg-primary' : 'bg-secondary'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-foreground transition-transform duration-200 ${
                          localSettings.autoPreview ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automatically refresh preview when code changes are detected.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border/50 flex-shrink-0">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  {saved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Saved!
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
