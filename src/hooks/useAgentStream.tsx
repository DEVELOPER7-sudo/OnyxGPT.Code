import { useEffect, useRef } from 'react';
import { StreamingParser } from '@/lib/parser';
import { useProjectStore } from '@/store/projectStore';

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
      addMessage({ type: 'system', content: '⚠️ Please set your Gemini API key first using the "Set API Key" button above.' });
      return;
    }

    clearState();
    
    parserRef.current = new StreamingParser({ addMessage, addOrUpdateFile, deleteFile, renameFile }, projectId);

    const controller = new AbortController();
    const startStream = async () => {
      try {
        const apiEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate`;
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model, apiKey }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          addMessage({ type: 'system', content: `❌ Error: ${errorData.error || response.statusText}` });
          return;
        }

        if (!response.body) throw new Error('Response body is null.');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let partialLine = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const decodedChunk = partialLine + decoder.decode(value);
          const lines = decodedChunk.split('\n\n');
          partialLine = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataString = line.substring(6).trim();
              if (dataString === '[DONE]') {
                partialLine = '';
                return;
              }
              try {
                const parsedData = JSON.parse(dataString);
                if (parsedData.text) {
                  parserRef.current?.parse(parsedData.text);
                }
              } catch (e) {
                console.log("Stream error >> ", e)
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Error fetching or processing stream:", err);
          addMessage({ type: 'system', content: `❌ Stream error: ${(err as Error).message}` });
        }
      }
    };
    
    startStream();

    return () => { controller.abort(); };
    
  }, [prompt, projectId, model]);
}
