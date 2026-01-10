import { useCallback } from 'react';
import { executeCommand, startDevServer, killSandbox } from '@/services/e2bService';

export const useE2BService = () => {
  const executeCommandWrapper = useCallback(async (command: string, projectId: string) => {
    const apiKey = localStorage.getItem('e2b-api-key') || '';
    return await executeCommand(command, apiKey, projectId);
  }, []);

  const startDevServerWrapper = useCallback(async (projectId: string, port: number = 3000) => {
    const apiKey = localStorage.getItem('e2b-api-key') || '';
    return await startDevServer(apiKey, projectId, port);
  }, []);

  const killSandboxWrapper = useCallback(async (projectId: string) => {
    return await killSandbox(projectId);
  }, []);

  return {
    executeCommand: executeCommandWrapper,
    startDevServer: startDevServerWrapper,
    killSandbox: killSandboxWrapper,
  };
};