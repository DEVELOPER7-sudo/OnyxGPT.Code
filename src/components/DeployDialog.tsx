import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Globe, Check, Loader2, RefreshCw, ExternalLink, Copy, AlertCircle, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import { generateRandomName, generateSubdomain } from '@/lib/nameGenerator';

interface DeployDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  files?: Array<{ path: string; content: string }>;
}

interface DeploymentInfo {
  subdomain: string;
  url: string;
  uid?: string;
  deployedAt: number;
}

export const DeployDialog = ({ isOpen, onClose, projectId, projectName, files = [] }: DeployDialogProps) => {
  const { isPuterAvailable } = useAppStore();
  const [subdomain, setSubdomain] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployment, setDeployment] = useState<DeploymentInfo | null>(null);
  const [existingDeployment, setExistingDeployment] = useState<DeploymentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Generate random subdomain on first open (only once)
  useEffect(() => {
    if (isOpen && !initializedRef.current && !existingDeployment) {
      initializedRef.current = true;
      // Generate random name if project is untitled or no subdomain set
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
          initializedRef.current = true; // Don't regenerate for existing deployments
        }
      } catch (e) {
        console.log('No existing deployment found');
      }
    };
    
    checkExisting();
  }, [projectId, isPuterAvailable, isOpen]);

  const handleRandomize = () => {
    setSubdomain(generateRandomName());
  };

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

    const ensureDirs = async (fullPath: string) => {
      // fullPath like: deploy_xxx/src/components
      const parts = fullPath.split('/').filter(Boolean);
      let cur = '';
      for (const part of parts) {
        cur = cur ? `${cur}/${part}` : part;
        // mkdir might throw if exists; ignore
        // @ts-expect-error puter types are runtime
        await window.puter?.fs?.mkdir(cur).catch(() => {});
      }
    };

    setIsDeploying(true);
    setError(null);

    try {
      // Create a directory for the project files
      const dirName = `deploy_${projectId}`;
      // @ts-expect-error puter types are runtime
      await window.puter?.fs?.mkdir(dirName).catch(() => {});

      // Write files to the directory (create folders first)
      if (files.length > 0) {
        for (const file of files) {
          const relative = (file.path || '').startsWith('/') ? file.path.slice(1) : file.path;
          const filePath = `${dirName}/${relative}`;
          const parentDir = filePath.split('/').slice(0, -1).join('/');
          if (parentDir) await ensureDirs(parentDir);
          // @ts-expect-error puter types are runtime
          await window.puter?.fs?.write(filePath, file.content);
        }
      } else {
        // Create a default index.html if no files provided
        // @ts-expect-error puter types are runtime
        await window.puter?.fs?.write(`${dirName}/index.html`, `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <style>
    body { font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #fff; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 ${projectName}</h1>
    <p>Your project is deployed! Add files to see your app here.</p>
  </div>
</body>
</html>
        `.trim());
      }

      // Deploy or update the website (per Puter Hosting API docs)
      const sd = subdomain.trim();
      let site: any;
      if (existingDeployment) {
        if (existingDeployment.subdomain !== sd) {
          // Subdomain changed: delete old & create new
          // @ts-expect-error puter types are runtime
          await window.puter?.hosting?.delete(existingDeployment.subdomain).catch(() => {});
          // @ts-expect-error puter types are runtime
          site = await window.puter?.hosting?.create(sd, dirName);
        } else {
          // Same subdomain: update root directory
          // @ts-expect-error puter types are runtime
          site = await window.puter?.hosting?.update(sd, dirName);
          if (!site) {
            // Some implementations may not return the site; fetch it
            // @ts-expect-error puter types are runtime
            site = await window.puter?.hosting?.get(sd);
          }
        }
      } else {
        // @ts-expect-error puter types are runtime
        site = await window.puter?.hosting?.create(sd, dirName);
      }

      const deploymentInfo: DeploymentInfo = {
        subdomain: site.subdomain || sd,
        url: `https://${(site.subdomain || sd)}.puter.site`,
        uid: site.uid,
        deployedAt: Date.now(),
      };

      // Store deployment info
      // @ts-expect-error puter types are runtime
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
          className="w-full max-w-md glass-card rounded-xl border border-border/50 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Rocket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Deploy Project</h2>
                <p className="text-xs text-muted-foreground">
                  {existingDeployment ? 'Update your live website' : 'Publish to puter.site'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
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
                  <Label htmlFor="subdomain">Subdomain</Label>
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
                        Deploy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};