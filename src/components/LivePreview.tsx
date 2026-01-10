import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, Loader2, AlertCircle, RefreshCw, Play, StopCircle, Globe, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { puterE2BClient } from '@/services/puterApiClient';
import { codesandboxPreviewService } from '@/services/codesandboxPreviewService';
import { startCodeSandboxDevServer, getCodeSandboxPreviewSession } from '@/services/deploymentService';

interface LivePreviewProps {
  projectId?: string;
  port?: number;
  sandboxId?: string;
  onServerStart?: (url: string) => void;
}

export const LivePreview = ({ 
  projectId,
  port = 3000,
  sandboxId,
  onServerStart
}: LivePreviewProps) => {
  const { settings } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const apiKey = settings.sandboxApiKey;
  const healthCheckRef = useRef<any>();
  const projectRef = useRef<any>(null);

  // Start CodeSandbox development server
  const startCodeSandboxServer = useCallback(async (project: any) => {
    if (!project) {
      setError('Project not found. Please select a project first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setConnectionStatus('connecting');

    try {
      console.log('Starting CodeSandbox dev server...');
      setError('Starting CodeSandbox development server... this may take a minute.');

      const result = await startCodeSandboxDevServer(project, { port });
      
      if (result.success) {
        setIsServerRunning(true);
        setPreviewUrl(result.previewUrl || '');
        setConnectionStatus('connected');
        onServerStart?.(result.previewUrl || '');
        setError(null);
        setIsLoading(false);
        
        console.log('✅ CodeSandbox server started:', result.previewUrl);
      } else {
        throw new Error(result.error || 'Failed to start CodeSandbox server');
      }
    } catch (err) {
      const errorMsg = err instanceof Error
        ? err.message
        : (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string')
          ? (err as any).message
          : (() => { try { return JSON.stringify(err); } catch { return String(err); } })();
      console.error('Error starting CodeSandbox server:', errorMsg);
      setError(errorMsg);
      setConnectionStatus('error');
      setIsLoading(false);
    }
  }, [port, onServerStart]);

  // Start E2B server (fallback)
  const startE2BServer = useCallback(async () => {
    if (!projectId || !apiKey) {
      setError('Project ID or API key missing. Please add E2B API key in settings.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setConnectionStatus('connecting');

    try {
      console.log('Starting E2B dev server via Puter.js...');
      setError('Starting E2B development server... this may take a minute.');
      
      const started = await puterE2BClient.startDevServer(port, apiKey, projectId);

      if (!started) {
        throw new Error('Failed to start E2B dev server. Verify your E2B API key and check your internet connection.');
      }

      const url = `https://${projectId}.sandbox.local:${port}`;
      setPreviewUrl(url);
      setConnectionStatus('connected');
      onServerStart?.(url);

      // Start health check
      let healthyAttempts = 0;
      const maxAttempts = 40;
      const checkHealth = async () => {
        try {
          const result = await puterE2BClient.executeCommand(
            `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/ 2>/dev/null || echo "000"`,
            apiKey,
            projectId
          );

          const statusCode = parseInt(result.stdout.trim());
          if (statusCode >= 200 && statusCode < 500) {
            setIsServerRunning(true);
            console.log('Server is healthy and ready');
            setError(null);
            setIsLoading(false);
          } else {
            healthyAttempts++;
            if (healthyAttempts < maxAttempts) {
              setError(`Waiting for server to respond... (${healthyAttempts}/${maxAttempts})`);
              healthCheckRef.current = setTimeout(checkHealth, 2000);
            } else {
              setError('Server took too long to start. Check terminal for errors or try again.');
              setConnectionStatus('error');
              setIsLoading(false);
            }
          }
        } catch (err) {
          console.error('Health check error:', err);
          healthyAttempts++;
          if (healthyAttempts < maxAttempts) {
            setError(`Retrying server health check... (${healthyAttempts}/${maxAttempts})`);
            healthCheckRef.current = setTimeout(checkHealth, 2000);
          } else {
            setError('Server health check failed after multiple attempts. Please try again.');
            setConnectionStatus('error');
            setIsLoading(false);
          }
        }
      };

      checkHealth();
    } catch (err) {
      const errorMsg = err instanceof Error
        ? err.message
        : (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string')
          ? (err as any).message
          : (() => { try { return JSON.stringify(err); } catch { return String(err); } })();
      console.error('Error starting E2B server:', errorMsg);
      setError(errorMsg);
      setConnectionStatus('error');
      setIsLoading(false);
    }
  }, [projectId, apiKey, port, onServerStart]);

  const handleStop = useCallback(async () => {
    if (healthCheckRef.current) {
      clearTimeout(healthCheckRef.current);
    }
    setIsServerRunning(false);
    setPreviewUrl(null);
    setConnectionStatus('disconnected');
    
    // Stop CodeSandbox server
    if (projectId) {
      await codesandboxPreviewService.stopDevServer(projectId);
    }
  }, [projectId]);

  const handleRefresh = useCallback(() => {
    setIframeKey(prev => prev + 1);
  }, []);

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />;
      default:
        return <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  if (!apiKey) {
    return (
      <div className="h-full flex items-center justify-center bg-card/50 rounded-lg border border-border/50">
        <div className="text-center space-y-3 p-4">
          <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-yellow-500 opacity-50" />
          <div>
            <p className="text-xs sm:text-sm font-medium">Preview Unavailable</p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure E2B API key in settings to enable live preview
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col bg-card/50 rounded-lg border border-border/50 overflow-hidden flex-safe"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-border/50 bg-background/50 flex-shrink-0">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-safe">
          <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium truncate">Live Preview</span>
          <div className="flex items-center gap-1">
            {getConnectionStatusIcon()}
            <span className="text-xs text-muted-foreground">{getConnectionStatusText()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isServerRunning ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={startE2BServer}
              disabled={isLoading}
              className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
              title="Start E2B server"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-primary" />
              ) : (
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                title="Refresh preview"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStop}
                className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                title="Stop server"
              >
                <StopCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden overflow-safe">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-background/50 z-10">
            <div className="text-center space-y-3 max-w-sm">
              <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-red-500" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-red-400">{error}</p>
                {isServerRunning && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="mt-3 text-xs"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : !isServerRunning ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center space-y-3">
              <Globe className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground opacity-50" />
              <div>
                <p className="text-xs sm:text-sm font-medium">Click "Start" to preview</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dev server will launch and display here
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={startE2BServer}
                  disabled={isLoading}
                  className="mt-4 gap-2"
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      Start E2B Server
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            {previewUrl && (
              <iframe
                key={iframeKey}
                src={previewUrl}
                title="Live Preview"
                className="w-full h-full border-none bg-white"
                onError={() => setError('Failed to load preview iframe')}
                allow="microphone; camera; geolocation"
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
