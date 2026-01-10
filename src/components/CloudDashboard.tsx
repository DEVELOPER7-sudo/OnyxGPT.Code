import React, { useState, useEffect } from 'react';
import { HardDrive, Activity, History, Settings as SettingsIcon, Trash2, Eye, Copy, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCloudStorage } from '@/hooks/useCloudStorage';
import { useAppStore } from '@/stores/appStore';
import type { CloudKey, CloudUsage, CloudStats } from '@/hooks/useCloudStorage';

interface CloudTab {
  id: 'storage' | 'usage' | 'deployments' | 'settings';
  label: string;
  icon: React.ReactNode;
}

/**
 * Cloud Dashboard Component
 * Displays all Puter cloud features including:
 * - KV Store browser
 * - Usage analytics
 * - Deployment history
 * - Cloud settings
 */
export const CloudDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'storage' | 'usage' | 'deployments' | 'settings'>('storage');
  const [keys, setKeys] = useState<CloudKey[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [keyValue, setKeyValue] = useState<string>('');
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { usage, stats, isLoading, getUsage, listKeys, getKey, deleteKey, getStats } = useCloudStorage();
  const { isPuterAvailable } = useAppStore();

  const tabs: CloudTab[] = [
    { id: 'storage', label: 'Storage', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'usage', label: 'Usage', icon: <Activity className="w-4 h-4" /> },
    { id: 'deployments', label: 'Deployments', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  // Load keys on mount and tab change
  useEffect(() => {
    if (activeTab === 'storage' && isPuterAvailable) {
      loadCloudKeys();
    }
  }, [activeTab, isPuterAvailable]);

  const loadCloudKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const cloudKeys = await listKeys('onyxgpt:');
      setKeys(cloudKeys);
    } catch (error) {
      console.error('Failed to load cloud keys:', error);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const handleSelectKey = async (key: string) => {
    setSelectedKey(key);
    try {
      const value = await getKey(key);
      setKeyValue(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
    } catch (error) {
      console.error('Failed to load key value:', error);
    }
  };

  const handleDeleteKey = async (key: string) => {
    if (!confirm(`Delete key "${key}"?`)) return;
    
    try {
      await deleteKey(key);
      setKeys(keys.filter(k => k.key !== key));
      if (selectedKey === key) {
        setSelectedKey(null);
        setKeyValue('');
      }
    } catch (error) {
      console.error('Failed to delete key:', error);
    }
  };

  const filteredKeys = keys.filter(k =>
    k.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 bg-card/30">
        <h2 className="text-lg font-semibold">Cloud Dashboard</h2>
        <p className="text-sm text-muted-foreground">Manage your Puter cloud storage and deployments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-3 border-b border-border/50 bg-card/20 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-secondary text-muted-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Storage Tab */}
        {activeTab === 'storage' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border/50 bg-card/20">
              <input
                type="text"
                placeholder="Search keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="flex-1 overflow-hidden flex gap-4 p-4">
              {/* Keys List */}
              <div className="w-1/3 border border-border/50 rounded-lg overflow-hidden flex flex-col bg-card/50">
                <div className="p-3 border-b border-border/50 bg-card/30 flex items-center justify-between">
                  <span className="text-sm font-medium">Keys ({filteredKeys.length})</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={loadCloudKeys}
                    disabled={isLoadingKeys}
                    className="h-6 w-6 p-0"
                  >
                    ↻
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filteredKeys.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      {searchQuery ? 'No keys found' : 'No keys in cloud storage'}
                    </div>
                  ) : (
                    filteredKeys.map((key) => (
                      <div
                        key={key.key}
                        onClick={() => handleSelectKey(key.key)}
                        className={`p-3 border-b border-border/50 cursor-pointer transition-colors ${
                          selectedKey === key.key
                            ? 'bg-primary/20 border-primary'
                            : 'hover:bg-secondary/50'
                        }`}
                      >
                        <div className="text-sm font-mono text-foreground truncate">{key.key}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatBytes(key.size)} • {formatDate(key.updatedAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Key Value Viewer */}
              <div className="flex-1 border border-border/50 rounded-lg overflow-hidden flex flex-col bg-card/50">
                {selectedKey ? (
                  <>
                    <div className="p-3 border-b border-border/50 bg-card/30 flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{selectedKey}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigator.clipboard.writeText(selectedKey)}
                          className="h-6 w-6 p-0"
                          title="Copy key name"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteKey(selectedKey)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          title="Delete key"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-auto p-3 font-mono text-xs bg-background/50">
                      <pre className="whitespace-pre-wrap break-words text-muted-foreground">
                        {keyValue}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    Select a key to view its value
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {usage && (
              <div className="grid grid-cols-2 gap-4">
                {/* Storage Usage */}
                <div className="border border-border/50 rounded-lg p-4 bg-card/50">
                  <div className="text-sm font-medium text-muted-foreground mb-3">Storage Usage</div>
                  <div className="text-2xl font-bold mb-2">
                    {formatBytes(usage.storageUsed)}
                    <span className="text-sm text-muted-foreground ml-2">
                      / {formatBytes(usage.storageLimit)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (usage.storageUsed / usage.storageLimit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* API Calls */}
                <div className="border border-border/50 rounded-lg p-4 bg-card/50">
                  <div className="text-sm font-medium text-muted-foreground mb-3">API Calls Today</div>
                  <div className="text-2xl font-bold mb-2">
                    {usage.apiCallsToday}
                    <span className="text-sm text-muted-foreground ml-2">
                      / {usage.apiCallsLimit}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (usage.apiCallsToday / usage.apiCallsLimit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            {stats && (
              <div className="border border-border/50 rounded-lg p-4 bg-card/50">
                <div className="text-sm font-medium text-muted-foreground mb-4">Cloud Statistics</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Total Keys</div>
                    <div className="text-2xl font-bold">{stats.totalKeys}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Size</div>
                    <div className="text-2xl font-bold">{formatBytes(stats.totalSize)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Last Updated</div>
                    <div className="text-xs font-medium mt-1">
                      {formatDate(stats.lastUpdated)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!usage && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Unable to load usage data. Please check your connection.
              </div>
            )}
          </div>
        )}

        {/* Deployments Tab */}
        {activeTab === 'deployments' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="border border-dashed border-border/50 rounded-lg p-8 text-center bg-card/30">
              <History className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Deployment history coming soon</p>
              <p className="text-xs text-muted-foreground mt-2">
                Track your project deployments and status here
              </p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="border border-dashed border-border/50 rounded-lg p-8 text-center bg-card/30">
              <SettingsIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Cloud settings coming soon</p>
              <p className="text-xs text-muted-foreground mt-2">
                Configure your cloud storage preferences and API keys
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudDashboard;
