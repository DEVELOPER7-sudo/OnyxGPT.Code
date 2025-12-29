import { useEffect, useRef } from 'react';
import { StreamingParser } from '@/lib/parser';
import { useProjectStore } from '@/store/projectStore';
import { GeminiStreamClient } from '@/lib/geminiClient';
import { toast } from 'sonner';

// Get the actions once, outside the hook. They are stable.
const { addMessage, addOrUpdateFile, deleteFile, renameFile, clearState } = useProjectStore.getState();

export function useAgentStream(prompt: string | null, projectId: string | undefined, model: string = 'gemini-2.0-flash') {
  const parserRef = useRef<StreamingParser | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!prompt || !projectId) {
      return;
    }

    // Get API key from localStorage
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      const msg = '⚠️ No Gemini API key found. Please set it using the API Key button.';
      addMessage({ type: 'system', content: msg });
      toast.error('Missing API Key', {
        description: 'Please set your Gemini API key to continue.',
        duration: 5000,
      });
      return;
    }
    
    toast.success('API Key Loaded', {
      description: 'Starting agent with your Gemini API key.',
      duration: 2000,
    });

    clearState();
    addMessage({ type: 'system', content: '⏳ Initializing agent...' });
    
    parserRef.current = new StreamingParser({ addMessage, addOrUpdateFile, deleteFile, renameFile }, projectId);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const startStream = async () => {
      try {
        console.log('Starting Gemini stream with model:', model);
        
        toast.loading('Agent responding...', {
          duration: Infinity,
        });

        const client = new GeminiStreamClient(apiKey, model);
        
        for await (const chunk of client.generateStream(prompt)) {
          if (abortController.signal.aborted) {
            console.log('Stream aborted');
            break;
          }
          
          if (chunk.text) {
            console.log('Received chunk:', chunk.text.length, 'chars');
            parserRef.current?.parse(chunk.text);
          }
        }

        console.log('Stream completed');
        toast.success('Agent Complete', {
          description: 'Response generated successfully!',
          duration: 3000,
        });

      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Error in stream:", err);
          const errorMsg = (err as Error).message;
          addMessage({ type: 'system', content: `❌ Stream error: ${errorMsg}` });
          toast.error('Stream Error', {
            description: errorMsg,
            duration: 5000,
          });
        }
      }
    };
    
    startStream();

    return () => { 
      abortController.abort();
    };
    
  }, [prompt, projectId, model]);
}
