# Deploy Puter.js Worker - Complete Instructions

## What to Deploy

Use the **JavaScript** file (not TypeScript):
```
src/services/puterE2bWorker.js
```

## Step-by-Step Deployment

### 1. Go to Puter.js Dashboard
```
https://puter.com/dashboard
```

### 2. Navigate to Workers
- Click "Workers" in the left sidebar
- Click "Create New Worker"

### 3. Configure Worker
**Worker Name**: `e2b-worker` (exactly this name - case sensitive)

**Language/Type**: Node.js

### 4. Copy the Code
1. Open file: `src/services/puterE2bWorker.js`
2. Select all content (Ctrl+A / Cmd+A)
3. Copy (Ctrl+C / Cmd+C)

### 5. Paste into Puter Dashboard
1. In the Puter worker editor, paste the code
2. Should see the full handler function

### 6. Add Dependencies
In the dependencies section, add:
```
e2b@^2.9.0
```

(This is the E2B SDK that the worker needs)

### 7. Deploy
Click the "Deploy" button and wait for confirmation.

You should see:
```
✅ Worker deployed successfully
Status: Active
```

## Verification

### Check Worker Status
1. Go to Workers list
2. Find `e2b-worker`
3. Status should show: **Active** (green checkmark)

### Test Worker
In browser console at Code Canvas:
```javascript
// Test if Puter.js is loaded
window.puter  // Should NOT be undefined

// Test worker can be called
puter.call.function('e2b-worker', {
  type: 'execute_command',
  command: 'echo "Hello from E2B"',
  apiKey: 'your-api-key',
  projectId: 'test-project'
}).then(console.log).catch(console.error);
```

## If Deploy Fails

### Issue: "Worker name already exists"
**Solution**: Change the name slightly, e.g., `e2b-worker-v2`
(Then update `puterApiClient.ts` line 169 to use new name)

### Issue: "Invalid JavaScript"
**Solution**: 
- Make sure you copied the entire `.js` file
- Check for syntax errors (missing brackets, etc.)
- Try deploying again

### Issue: "Dependencies not found"
**Solution**:
- Make sure `e2b@^2.9.0` is in dependencies
- Some Puter.js instances may have limited packages
- Try `e2b` without version specification

### Issue: "Worker times out"
**Solution**:
- E2B initialization takes time
- Timeout is normal for first execution
- Subsequent calls will be faster

## After Deployment

### 1. Get E2B API Key
```
https://e2b.dev/dashboard
→ Create API Key
→ Format: e2b_xxxxx...
```

### 2. Add Key to Code Canvas
1. Open Code Canvas
2. Settings (gear icon)
3. "Sandbox API Key (E2B)"
4. Paste your API key
5. Click "Save Settings"

### 3. Test Execution
1. Open a project
2. Open Terminal tab
3. Type: `npm list`
4. Press Enter
5. Should see npm packages (not error)

## Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| Worker not active | Wait 30 seconds, refresh page, check status |
| Commands timeout | E2B API key may be invalid, check it starts with `e2b_` |
| "Worker not found" | Worker name must be exactly `e2b-worker` (lowercase) |
| Puter.js error | Reload page, ensure script tag in HTML |
| API key rejected | Generate new key at https://e2b.dev/dashboard |

## Important Notes

### Worker Name
The worker **MUST** be named exactly:
```
e2b-worker
```

If you use a different name, update `puterApiClient.ts`:
```typescript
// Line ~169
const response = await window.puter.call.function(
  'e2b-worker',  // ← Change this if you use different name
  payload
);
```

### File Format
- Use `.js` file (JavaScript), not `.ts` (TypeScript)
- File: `src/services/puterE2bWorker.js` ✅
- NOT: `src/services/puterE2bWorker.ts` ❌

### Dependencies
The E2B SDK dependency is critical:
```
e2b@^2.9.0
```

Without it, the worker won't be able to create sandboxes.

## Success Checklist

- [ ] Worker created with name `e2b-worker`
- [ ] Code from `puterE2bWorker.js` pasted
- [ ] Dependency added: `e2b@^2.9.0`
- [ ] Worker status shows "Active"
- [ ] E2B API key obtained
- [ ] API key added to Code Canvas settings
- [ ] Test command executed successfully
- [ ] Terminal shows output (not error)

## Video Alternative

If you prefer video guidance:
1. Puter.js Docs: https://docs.puter.com/workers/
2. E2B Docs: https://e2b.dev/docs

## Support

If you're stuck:
1. Check this guide again (section: Common Issues)
2. Read: `PUTER_QUICK_START.md`
3. Read: `PUTER_IMPLEMENTATION_GUIDE.md`
4. Check Puter.js docs: https://docs.puter.com

## Next Steps After Deployment

Once worker is deployed and API key is added:

1. **Test Terminal**
   ```
   Type: npm --version
   Should see: v18.x.x (or similar)
   ```

2. **Test File Operations**
   ```
   Type: echo "test" > /tmp/test.txt && cat /tmp/test.txt
   Should see: test
   ```

3. **Test Dev Server**
   ```
   Click: Play button in LivePreview
   Should start server and show preview
   ```

---

**You're all set!** 🚀

The worker is deployed and Code Canvas can now execute commands in E2B sandboxes.
