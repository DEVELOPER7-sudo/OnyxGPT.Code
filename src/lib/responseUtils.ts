/**
 * Response Utilities
 * Helper functions for safely extracting text from various response formats
 * Fixes [object Object] errors in sandbox/AI responses
 */

export function extractResponseText(response: unknown): string {
  if (response === null || response === undefined) {
    return '';
  }
  
  if (typeof response === 'string') {
    return response;
  }
  
  if (typeof response === 'number' || typeof response === 'boolean') {
    return String(response);
  }
  
  if (response instanceof Error) {
    return response.message;
  }
  
  if (Array.isArray(response)) {
    return response.map(item => extractResponseText(item)).filter(Boolean).join('\n');
  }
  
  if (typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    
    // Check common content fields
    if ('text' in obj && typeof obj.text === 'string') {
      return obj.text;
    }
    if ('content' in obj && typeof obj.content === 'string') {
      return obj.content;
    }
    if ('message' in obj) {
      const msg = obj.message;
      if (typeof msg === 'string') {
        return msg;
      }
      if (typeof msg === 'object' && msg !== null) {
        const nested = msg as Record<string, unknown>;
        if ('content' in nested && typeof nested.content === 'string') {
          return nested.content;
        }
        if ('text' in nested && typeof nested.text === 'string') {
          return nested.text;
        }
      }
    }
    if ('data' in obj && typeof obj.data === 'string') {
      return obj.data;
    }
    
    // Avoid [object Object] by checking if it's a plain object without useful content
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return '';
    }
    
    // Try to extract meaningful content
    try {
      const json = JSON.stringify(response, null, 2);
      // If JSON contains [object Object], something went wrong
      if (json.includes('"[object Object]"')) {
        return 'Response received but content could not be parsed.';
      }
      return json;
    } catch {
      return 'Unable to parse response';
    }
  }
  
  return String(response);
}