# Toast Notification System Architecture

## Overview

The app uses **Sonner** for beautiful toast notifications. Notifications appear in the top-right corner and auto-dismiss based on type.

---

## Notification Types & Durations

```typescript
// Success - Green background, auto-dismiss after 2-3 seconds
toast.success('Title', {
  description: 'Subtitle text',
  duration: 2000,
});

// Error - Red background, auto-dismiss after 5 seconds
toast.error('Error Title', {
  description: 'Error description',
  duration: 5000,
});

// Loading - Blue background with spinner, stays until manually dismissed
toast.loading('Processing...', {
  duration: Infinity,
});

// Info - Blue background, auto-dismiss after some time
toast.info('Info Title', {
  description: 'Info text',
});
```

---

## Notification Flow in App

### 1. API Key Management (ApiKeyInput.tsx)

```
User Action → Notification
────────────────────────────

Paste key + Save
    ↓
✅ "API Key Saved"
    ↓
Dialog closes

Paste empty key + Save
    ↓
❌ "Empty Key - Please enter a valid API key"
    ↓
Dialog stays open

Click clear button
    ↓
ℹ️ "API Key Cleared"
    ↓
Key removed from localStorage
```

### 2. Agent Stream (useAgentStream.tsx)

```
Initialization
──────────────
User creates project
    ↓
No API key found?
    ↓
❌ "Missing API Key - Please set your Gemini API key to continue"
    ↓
Stop execution

API key found?
    ↓
✅ "API Key Loaded - Starting agent with your Gemini API key"
    ↓
Continue to stream


Streaming
─────────
Fetch to server
    ↓
Server error?
    ↓
❌ "Server Error - [error message]"
    ↓
Stop

Stream started?
    ↓
⏳ "Agent responding..." (loading spinner, stays until complete)
    ↓
Chunks stream in
    ↓
API returns error chunk?
    ↓
❌ "API Error - [error message]"
    ↓
Continue/stop

Stream complete?
    ↓
✅ "Agent Complete - Response generated successfully!"
    ↓
Dismiss loading notification
```

---

## Notification Styles

### Light Mode Colors
```
Success (✅):    Green (#22c55e)
Error (❌):      Red (#ef4444)
Loading (⏳):    Blue (#3b82f6)
Info (ℹ️):       Blue (#3b82f6)
```

### Dark Mode Colors
```
Success (✅):    Emerald (#10b981)
Error (❌):      Rose (#f43f5e)
Loading (⏳):    Cyan (#06b6d4)
Info (ℹ️):       Cyan (#06b6d4)
```

---

## Code Locations

### Toast Triggers

**File: src/components/ApiKeyInput.tsx**
```typescript
// Line 26-28: Empty key error
toast.error('Empty Key', {
  description: 'Please enter a valid API key.',
});

// Line 32-34: Save success
toast.success('API Key Saved', {
  description: 'Your Gemini API key has been saved securely in your browser.',
});

// Line 41-43: Clear success
toast.info('API Key Cleared', {
  description: 'Your API key has been removed.',
});
```

**File: src/hooks/useAgentStream.tsx**
```typescript
// Line 22-25: Missing key error
toast.error('Missing API Key', {
  description: 'Please set your Gemini API key to continue.',
  duration: 5000,
});

// Line 29-32: Key loaded success
toast.success('API Key Loaded', {
  description: 'Starting agent with your Gemini API key.',
  duration: 2000,
});

// Line 64-67: Server error
toast.error('Server Error', {
  description: errorMessage,
  duration: 5000,
});

// Line 71-73: Stream started
toast.loading('Agent responding...', {
  duration: Infinity,
});

// Line 94-97: Stream complete
toast.success('Agent Complete', {
  description: 'Response generated successfully!',
  duration: 3000,
});

// Line 106-109: API error
toast.error('API Error', {
  description: parsedData.error,
  duration: 5000,
});

// Line 125-128: Stream error
toast.error('Stream Error', {
  description: errorMsg,
  duration: 5000,
});
```

**File: src/App.tsx**
```typescript
// Line 15: Toaster component setup
<Toaster position="top-right" richColors />
```

---

## Customization

### Change Position
```typescript
// In src/App.tsx line 15
<Toaster 
  position="bottom-right"    // or: top-left, bottom-left, top-center, etc.
  richColors 
/>
```

### Change Auto-Dismiss Time
```typescript
// In src/hooks/useAgentStream.tsx
toast.success('Title', {
  description: 'Text',
  duration: 5000,  // milliseconds, or Infinity to keep until manually dismissed
});
```

### Add Custom Styling
```typescript
// Sonner supports custom CSS via className
toast.success('Title', {
  className: 'bg-custom-color text-custom-text',
  description: 'Text',
});
```

---

## Notification Examples

### Success Flow
```
User enters Gemini API key
    ↓
Clicks "Save Key"
    ↓
✅ Green toast appears: "API Key Saved"
    ↓
Dialog closes automatically
    ↓
Toast auto-dismisses after 2 seconds
```

### Error Flow
```
User tries to start project without API key
    ↓
❌ Red toast appears: "Missing API Key - Please set your Gemini API key to continue"
    ↓
Toast stays for 5 seconds
    ↓
User clicks "Set API Key" button
    ↓
Dialog opens
```

### Loading Flow
```
User submits project prompt
    ↓
✅ Green toast: "API Key Loaded"
    ↓
⏳ Blue toast with spinner: "Agent responding..." appears
    ↓
Stays on screen while streaming
    ↓
Files being generated
    ↓
Stream completes
    ↓
⏳ Loading toast dismissed
    ↓
✅ Green toast: "Agent Complete" appears
    ↓
Auto-dismisses after 3 seconds
```

---

## Advanced Features

### Promise-Based Notifications
```typescript
// Show loading, then success/error
const promise = fetchData();

toast.promise(promise, {
  loading: 'Loading...',
  success: 'Data loaded!',
  error: 'Failed to load',
});
```

### Custom Action Buttons
```typescript
toast.success('Saved!', {
  description: 'Your file is saved',
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo action'),
  },
});
```

### Multiple Toasts with Unique IDs
```typescript
toast.success('Save 1');
toast.success('Save 2');  // Both show

// Or:
toast.success('Updating...', { id: 'save-1' });
// Update same toast:
toast.success('Updated!', { id: 'save-1' });
```

---

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ |
| Firefox | ✅ |
| Safari | ✅ |
| Edge | ✅ |
| Opera | ✅ |
| IE11 | ❌ |

---

## Testing Notifications

### Manual Testing

1. **API Key Save**
   - Open app
   - Click "Set API Key"
   - Enter key and save
   - ✅ Should see success toast

2. **Missing Key Error**
   - Clear localStorage: F12 → Application → Local Storage → Clear All
   - Try to create project
   - ❌ Should see error toast

3. **Stream Notifications**
   - Create project with valid key
   - ⏳ Should see loading toast
   - ✅ Should see complete toast when done

### Browser DevTools
```javascript
// In browser console, manually trigger:
localStorage.clear();  // Clear all data
localStorage.setItem('gemini_api_key', 'test-key');  // Set test key
```

---

## Troubleshooting Notifications

### Notifications Not Showing
1. Check Toaster component in App.tsx
2. Check browser console for errors
3. Check sonner package is installed: `npm ls sonner`
4. Check position isn't off-screen

### Notification Styling Wrong
1. Check richColors prop: `<Toaster richColors />`
2. Check dark/light mode CSS
3. Check Tailwind is properly configured

### Multiple Same Notifications
1. Check for duplicate toast.() calls
2. Use `id` prop to prevent duplicates:
   ```typescript
   toast.loading('Processing...', { id: 'processing' });
   // Later update same toast:
   toast.success('Done!', { id: 'processing' });
   ```

---

## Performance Notes

- Toasts are lightweight
- Multiple simultaneous toasts are OK
- Auto-dismiss prevents notification clutter
- No performance impact on streaming

---

## Future Enhancements

- [ ] Persistent notification log
- [ ] Notification history panel
- [ ] Custom notification themes
- [ ] Sound notifications
- [ ] Desktop notifications API integration
- [ ] Notification preferences
