import { useEffect, useRef } from 'react';
import { StreamingParser } from '@/lib/parser';
import { useProjectStore } from '@/store/projectStore';
import { toast } from 'sonner';

// Get the actions once, outside the hook. They are stable.
const { addMessage, addOrUpdateFile, deleteFile, renameFile, clearState } = useProjectStore.getState();

export function useAgentStream(prompt: string | null, projectId: string | undefined, model: string = 'gemini-2.0-flash') {
  const parserRef = useRef<StreamingParser | null>(null);

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

    const controller = new AbortController();
    const startStream = async () => {
      try {
        // Support both local development and cloud deployment
        const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || 
          'http://localhost:3002/api/generate';
        console.log('Fetching from:', apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });

        console.log('Response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          let errorMessage = response.statusText;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || response.statusText;
            addMessage({ type: 'system', content: `❌ Error: ${errorMessage}` });
          } catch {
            addMessage({ type: 'system', content: `❌ Error: ${response.statusText}` });
          }
          toast.error('Server Error', {
            description: errorMessage,
            duration: 5000,
          });
          return;
        }
        
        toast.loading('Agent responding...', {
          duration: Infinity,
        });

        if (!response.body) throw new Error('Response body is null.');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let partialLine = '';
        console.log('Starting to read stream...');
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Stream ended');
            break;
          }
          const decodedChunk = partialLine + decoder.decode(value);
          const lines = decodedChunk.split('\n\n');
          partialLine = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataString = line.substring(6).trim();
              if (dataString === '[DONE]') {
                console.log('Received [DONE]');
                toast.success('Agent Complete', {
                  description: 'Response generated successfully!',
                  duration: 3000,
                });
                partialLine = '';
                return;
              }
              try {
                const parsedData = JSON.parse(dataString);
                if (parsedData.error) {
                  console.error('API error:', parsedData.error);
                  addMessage({ type: 'system', content: `❌ API Error: ${parsedData.error}` });
                  toast.error('API Error', {
                    description: parsedData.error,
                    duration: 5000,
                  });
                } else if (parsedData.text) {
                  console.log('Parsed text chunk:', parsedData.text.length, 'chars');
                  parserRef.current?.parse(parsedData.text);
                }
              } catch (e) {
                console.error("JSON parse error >> ", e, "Line:", dataString)
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Error fetching or processing stream:", err);
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

    return () => { controller.abort(); };
    
  }, [prompt, projectId, model]);
}
