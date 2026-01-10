import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Globe, Check, Loader2, RefreshCw, ExternalLink, Copy, AlertCircle, Shuffle, Code, Server, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import { generateRandomName, generateSubdomain } from '@/lib/nameGenerator';
import { codesandboxPreviewService } from '@/services/codesandboxPreviewService';
import { puterE2BClient } from '@/services/puterApiClient';
import type { Project } from '@/types/project';

interface CodeSandboxDeployDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  project: Project;
  files?: Array<{ path: string; content: string }>;
}

interface DeploymentInfo {
  subdomain: string;
  url: string;
  uid?: string;
  deployedAt: number;
  previewUrl?: string;
  sandboxId?: string;
}

export const CodeSandboxDeployDialog = ({ 
  isOpen, 
  onClose, 
  projectId, 
  projectName, 
  project,
  files = [] 
}: CodeSandboxDeployDialogProps) => {
  const { isPuterAvailable } = useAppStore();
  const [subdomain, setSubdomain] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [isStartingPreview, setIsStartingPreview] = useState(false);
  const [deployment, setDeployment] = useState<DeploymentInfo | null>(null);
  const [existingDeployment, setExistingDeployment] = useState<DeploymentInfo | null>(null);
  const [previewSession, setPreviewSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'deploy'>('preview');
  const initializedRef = useRef(false);

  // Generate random subdomain on first open
  useEffect(() => {
    if (isOpen && !initializedRef.current && !existingDeployment) {
      initializedRef.current = true;
      if (!subdomain || projectName === 'Untitled Project') {
        setSubdomain(generateRandomName());
      } else {
        setSubdomain(generateSubdomain(projectName));
      }
    }
  }, [isOpen, projectName, existingDeployment, subdomain]);

  // Reset initialized flag when dialog closes
  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
      setActiveTab('preview');
    }
  }, [isOpen]);

  // Check for existing deployment
  useEffect(() => {
    const checkExisting = async () => {
      if (!isPuterAvailable || !isOpen) return;
      
      try {
        const stored = await window.puter?.kv?.get(`deployment:${projectId}`);
        if (stored) {
          const info = JSON.parse(stored);
          setExistingDeployment(info);
          setSubdomain(info.subdomain);
          initializedRef.current = true;
        }
      } catch (e) {
        console.log('No existing deployment found');
      }
    };
    
    checkExisting();
  }, [projectId, isPuterAvailable, isOpen]);

  // Start CodeSandbox preview
  const handleStartPreview = async () => {
    if (!project) {
      setError('Project not found. Please select a project first.');
      return;
    }

    setIsStartingPreview(true);
    setError(null);
    setActiveTab('preview');

    try {
      console.log('Starting CodeSandbox preview...');
      setError('Starting CodeSandbox preview... this may take a minute.');

      const session = await codesandboxPreviewService.startDevServer(project, {
        port: 3000,
      });

      if (session.status === 'running') {
        setPreviewSession(session);
        setError(null);
        toast.success('Preview started successfully!');
      } else {
        throw new Error(session.error || 'Failed to start preview');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Preview start failed:', errorMsg);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsStartingPreview(false);
    }
  };

  // Stop preview
  const handleStopPreview = async () => {
    try {
      await codesandboxPreviewService.stopDevServer(projectId);
      setPreviewSession(null);
      toast.success('Preview stopped');
    } catch (error) {
      console.error('Failed to stop preview:', error);
      toast.error('Failed to stop preview');
    }
  };

  // Deploy to production
  const handleDeploy = async () => {
    if (!isPuterAvailable || !subdomain.trim()) {
      setError('Please enter a valid subdomain');
      return;
    }

    const safeErr = (err: unknown) => {
      if (err instanceof Error) return err.message;
      if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') return (err as any).message;
      try { return JSON.stringify(err); } catch { return String(err); }
    };

    setIsDeploying(true);
    setError(null);

    try {
      // Convert files to array format
      const fileArray = files.map(f => ({ path: f.path, content: f.content }));

      // Use Puter hosting API for production deployment
      const success = await puterE2BClient.setupProject(fileArray, '', projectId);
      
      if (!success) {
        throw new Error('Failed to setup project in Puter');
      }

      // Create deployment directory
      const dirName = `deploy_${projectId}`;
      
      // Write files to Puter
      for (const file of files) {
        await puterE2BClient.writeFile(`/${dirName}/${file.path}`, file.content, '', projectId);
      }

      // Deploy using Puter hosting
      const site = await window.puter?.hosting?.create(subdomain.trim(), dirName);
      
      if (!site) {
        throw new Error('Failed to create Puter hosting site');
      }

      const deploymentInfo: DeploymentInfo = {
        subdomain: site.subdomain || subdomain.trim(),
        url: `https://${(site.subdomain || subdomain.trim())}.puter.site`,
        uid: site.uid,
        deployedAt: Date.now(),
        previewUrl: previewSession?.previewUrl,
        sandboxId: previewSession?.sandboxId,
      };

      // Store deployment info
      await window.puter?.kv?.set(`deployment:${projectId}`, JSON.stringify(deploymentInfo));

      setDeployment(deploymentInfo);
      setExistingDeployment(deploymentInfo);
      toast.success(existingDeployment ? 'Deployment updated!' : 'Project deployed!');
    } catch (err) {
      console.error('Deployment error:', err);
      let errorMsg = safeErr(err) || 'Deployment failed';
      if (errorMsg.includes('subdomain') || errorMsg.includes('already')) {
        errorMsg = 'This subdomain is already taken. Try a different name.';
      } else if (errorMsg.toLowerCase().includes('auth') || errorMsg.toLowerCase().includes('sign')) {
        errorMsg = 'Please sign in to Puter to deploy.';
      }
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRandomize = () => {
    setSubdomain(generateRandomName());
  };

  const copyUrl = () => {
    const url = deployment?.url || existingDeployment?.url;
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success('URL copied to clipboard');
    }
  };

  const openUrl = () => {
    const url = deployment?.url || existingDeployment?.url;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const openPreview = () => {
    if (previewSession?.previewUrl) {
      window.open(previewSession.previewUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl glass-card rounded-xl border border-border/50 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Rocket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">CodeSandbox Deployment</h2>
                <p className="text-xs text-muted-foreground">
                  Preview and deploy your project with CodeSandbox + Puter
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('preview')}
                className="gap-2"
              >
                <Code className="w-4 h-4" />
                Preview
              </Button>
              <Button
                variant={activeTab === 'deploy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('deploy')}
                className="gap-2"
              >
                <Cloud className="w-4 h-4" />
                Deploy
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="p-4 space-y-4">
              {!previewSession ? (
                <div className="text-center py-6 space-y-2">
                  <Code className="w-12 h-12 mx-auto text-primary opacity-50" />
                  <h3 className="font-semibold">Start Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Launch your project in CodeSandbox for live preview
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Preview Active</h3>
                    <p className="text-sm text-muted-foreground">
                      Your project is running in CodeSandbox
                    </p>
                  </div>

                  {previewSession.previewUrl && (
                    <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                      <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="flex-1 text-sm font-mono truncate">
                        {previewSession.previewUrl}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openPreview}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleStopPreview}>
                      Stop Preview
                    </Button>
                    <Button 
                      className="flex-1 gap-2" 
                      onClick={() => setActiveTab('deploy')}
                    >
                      <Cloud className="w-4 h-4" />
                      Deploy to Production
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {!previewSession && (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 gap-2" 
                    onClick={handleStartPreview}
                    disabled={isStartingPreview}
                  >
                    {isStartingPreview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Code className="w-4 h-4" />
                        Start Preview
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Deploy Tab */}
          {activeTab === 'deploy' && (
            <div className="p-4 space-y-4">
              {!isPuterAvailable ? (
                <div className="text-center py-6 space-y-2">
                  <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 opacity-50" />
                  <p className="text-sm font-medium">Puter.js Required</p>
                  <p className="text-xs text-muted-foreground">
                    Sign in to Puter to enable deployment features
                  </p>
                </div>
              ) : deployment || existingDeployment ? (
                // Success state
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">
                      {deployment ? 'Deployed Successfully!' : 'Currently Deployed'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your project is live at:
                    </p>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                    <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="flex-1 text-sm font-mono truncate">
                      {deployment?.url || existingDeployment?.url}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyUrl}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openUrl}>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>

                  {existingDeployment && !deployment && (
                    <div className="text-xs text-muted-foreground text-center">
                      Last deployed: {new Date(existingDeployment.deployedAt).toLocaleString()}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                      Close
                    </Button>
                    <Button 
                      className="flex-1 gap-2" 
                      onClick={handleDeploy}
                      disabled={isDeploying}
                    >
                      {isDeploying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Update
                    </Button>
                  </div>
                </div>
              ) : (
                // Deploy form
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Production Subdomain</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="subdomain"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="my-project"
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={handleRandomize} title="Generate random name">
                        <Shuffle className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">.puter.site</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your project will be available at https://{subdomain || 'your-subdomain'}.puter.site
                    </p>
                  </div>

                  {previewSession && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm text-blue-400">
                        🎉 Preview is running! Your changes will be reflected in the deployment.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 gap-2" 
                      onClick={handleDeploy}
                      disabled={isDeploying || !subdomain.trim()}
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4" />
                          Deploy to Production
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};