import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { getDiagnostics } from '@/services/deploymentService';
import type { DeploymentValidation } from '@/services/deploymentService';

interface DeploymentValidatorProps {
  onDeploy?: (config: any) => Promise<void>;
  isDeploying?: boolean;
}

/**
 * Deployment Validation Component
 * Shows pre-flight checks and deployment readiness
 */
export const DeploymentValidator: React.FC<DeploymentValidatorProps> = ({
  onDeploy,
  isDeploying = false,
}) => {
  const { currentProject } = useAppStore();
  const [diagnostics, setDiagnostics] = React.useState(getDiagnostics(currentProject!));

  React.useEffect(() => {
    if (currentProject) {
      setDiagnostics(getDiagnostics(currentProject));
    }
  }, [currentProject]);

  if (!currentProject) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No project loaded
      </div>
    );
  }

  const { detection, config, issues } = diagnostics;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Language Detection */}
      <div className="border border-border/50 rounded-lg p-4 bg-card/50">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="font-medium">Detection Results</h3>
        </div>
        <div className="space-y-2 text-sm">
          <p>
            Language: <span className="font-mono font-bold text-primary">{detection.language}</span>
          </p>
          <p>
            Build: <span className="font-mono text-xs text-muted-foreground">{config.buildCommand}</span>
          </p>
          <p>
            Run: <span className="font-mono text-xs text-muted-foreground">{config.runCommand}</span>
          </p>
          <p>
            Port: <span className="font-mono font-bold text-primary">{config.port}</span>
          </p>
        </div>
      </div>

      {/* Validation Status */}
      <div className="border border-border/50 rounded-lg p-4 bg-card/50">
        <div className="flex items-center gap-2 mb-3">
          {detection.valid ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
          <h3 className="font-medium">
            {detection.valid ? 'Ready to Deploy' : 'Deployment Issues'}
          </h3>
        </div>

        {/* Errors */}
        {detection.errors.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="text-xs font-medium text-red-500">Errors ({detection.errors.length}):</p>
            {detection.errors.map((error, i) => (
              <div key={i} className="text-xs p-2 bg-red-500/10 text-red-500 rounded border border-red-500/20">
                ❌ {error}
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {detection.warnings.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="text-xs font-medium text-yellow-600">Warnings ({detection.warnings.length}):</p>
            {detection.warnings.map((warning, i) => (
              <div key={i} className="text-xs p-2 bg-yellow-500/10 text-yellow-600 rounded border border-yellow-500/20">
                ⚠️ {warning}
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {detection.suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-blue-500">Suggestions ({detection.suggestions.length}):</p>
            {detection.suggestions.map((suggestion, i) => (
              <div key={i} className="text-xs p-2 bg-blue-500/10 text-blue-600 rounded border border-blue-500/20">
                💡 {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Issues Summary */}
      {issues.length > 0 && (
        <div className="border border-border/50 rounded-lg p-4 bg-card/50">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-500" />
            <h3 className="font-medium text-sm">Diagnostics ({issues.length})</h3>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {issues.map((issue, i) => (
              <div
                key={i}
                className={`text-xs p-2 rounded border ${
                  issue.level === 'error'
                    ? 'bg-red-500/10 text-red-600 border-red-500/20'
                    : issue.level === 'warning'
                      ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                }`}
              >
                {issue.level === 'error' ? '❌' : issue.level === 'warning' ? '⚠️' : 'ℹ️'} {issue.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deploy Button */}
      <Button
        onClick={() => onDeploy?.(config)}
        disabled={!detection.valid || isDeploying}
        className="w-full gap-2"
      >
        {isDeploying ? '🚀 Deploying...' : '🚀 Deploy Project'}
      </Button>

      {!detection.valid && (
        <p className="text-xs text-muted-foreground text-center">
          Fix the errors above before deploying
        </p>
      )}
    </div>
  );
};

export default DeploymentValidator;
