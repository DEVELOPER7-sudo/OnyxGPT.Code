import React from 'react';
import { Cloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { usePuter } from '@/hooks/usePuter';

interface SyncStatusProps {
  projectId?: string;
  onSyncComplete?: () => void;
}

/**
 * Sync Status Component
 * Shows project sync status and triggers manual sync
 */
export const SyncStatus: React.FC<SyncStatusProps> = ({
  projectId,
  onSyncComplete,
}) => {
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSync, setLastSync] = React.useState<number | null>(null);
  const [syncStatus, setSyncStatus] = React.useState<'synced' | 'syncing' | 'failed' | 'pending'>('pending');
  const [conflictCount, setConflictCount] = React.useState(0);

  const { currentProject } = useAppStore();
  const { syncProject } = usePuter();

  const handleSync = async () => {
    if (!projectId || !currentProject) return;

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      const result = await syncProject(projectId);

      if (result.merged) {
        setSyncStatus('synced');
        setLastSync(Date.now());
        setConflictCount(result.conflicts);
        console.log(`✅ Sync complete: ${result.conflicts} conflicts resolved`);
      } else {
        setSyncStatus('failed');
        console.error('❌ Sync failed');
      }
    } catch (error) {
      setSyncStatus('failed');
      console.error('❌ Sync error:', error);
    } finally {
      setIsSyncing(false);
      onSyncComplete?.();
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Cloud className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'synced':
        return lastSync
          ? `Synced ${new Date(lastSync).toLocaleTimeString()}`
          : 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'failed':
        return 'Sync failed';
      default:
        return 'Not synced';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-xs text-muted-foreground">{getStatusText()}</span>
        {conflictCount > 0 && (
          <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded border border-yellow-500/20">
            {conflictCount} conflicts
          </span>
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSync}
        disabled={isSyncing}
        className="h-6 px-2"
      >
        {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Cloud className="w-3 h-3" />}
      </Button>
    </div>
  );
};

export default SyncStatus;
