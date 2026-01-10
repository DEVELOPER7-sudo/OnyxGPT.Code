# Quick Start: Using the New Features

## 🎯 What to Test First

### 1. Chat History (DO THIS FIRST - Critical Fix)
```
1. Open a project
2. Type a chat message and send
3. Refresh the page (Ctrl+R or Cmd+R)
4. ✅ Message should still be there!
5. Check browser console for "✅ Auto-save successful" logs
```

### 2. Random Project Names (Visual Confirmation)
```
1. Go to home page
2. Create a new project (should show random name like "Blazing Phoenix 847")
3. Create another project
4. Create a third project
5. ✅ Each should have unique, memorable name
6. Names use format: Adjective + Noun + Number
```

### 3. Cloud Dashboard
```
1. In Project page, look for Cloud tab (will be added next)
2. Navigate to Cloud tab
3. See 4 sections:
   - Storage: List of all keys in cloud
   - Usage: Storage and API usage stats
   - Deployments: (Coming soon)
   - Settings: (Coming soon)
4. ✅ Can search keys, view values, copy, delete
```

### 4. Sandbox Errors (Terminal)
```
1. In a project, generate code with terminal commands
2. If command fails, check the error message
3. ✅ Error should show as text, not "[object Object]"
4. Example: "❌ Command failed: npm: not found" (NOT "[object Object]")
```

---

## 📁 File Guide

### New Files You Should Know About

#### Services (Backend Logic)
| File | Purpose | Use When |
|------|---------|----------|
| `src/services/projectNameGenerator.ts` | Generates unique project names | Creating new projects |
| `src/services/aiTerminalService.ts` | Terminal execution with error fixes | Running commands in sandbox |
| `src/services/deploymentService.ts` | Multi-language deployment detection | Deploying projects |
| `src/services/syncService.ts` | Cross-device synchronization | Syncing projects between devices |

#### Hooks (React Integration)
| File | Purpose | Use When |
|------|---------|----------|
| `src/hooks/useAutoSave.ts` | Auto-saves chat history | Project loads (automatic) |
| `src/hooks/useCloudStorage.ts` | Cloud KV store operations | Accessing cloud storage |

#### Components (UI)
| File | Purpose | Use When |
|------|---------|----------|
| `src/components/CloudDashboard.tsx` | Cloud management UI | Adding Cloud tab to project |

---

## 🔧 Common Integration Points

### Adding Cloud Tab to Project Page

**File**: `src/pages/Project.tsx`

**Find this**:
```tsx
const [activeTab, setActiveTab] = useState<"preview" | "code">("code");
```

**Change to**:
```tsx
const [activeTab, setActiveTab] = useState<"preview" | "code" | "cloud">("code");
```

**Find the tab buttons section** (around line 271):
```tsx
<button onClick={() => setActiveTab("preview")}>
  <Eye className="w-4 h-4" />Preview
</button>
<button onClick={() => setActiveTab("code")}>
  <Code2 className="w-4 h-4" />Code
</button>
```

**Add after Code button**:
```tsx
<button onClick={() => setActiveTab("cloud")}>
  <Cloud className="w-4 h-4" />Cloud
</button>
```

**Add import**:
```tsx
import { Cloud } from 'lucide-react';
import { CloudDashboard } from '@/components/CloudDashboard';
```

**Find the content render section** (around line 280):
```tsx
{activeTab === "code" ? (
  <CodeEditor artifact={selectedArtifact} onClose={() => setSelectedArtifact(null)} />
) : (
  <LivePreview projectId={id} port={3000} />
)}
```

**Change to**:
```tsx
{activeTab === "code" ? (
  <CodeEditor artifact={selectedArtifact} onClose={() => setSelectedArtifact(null)} />
) : activeTab === "cloud" ? (
  <CloudDashboard />
) : (
  <LivePreview projectId={id} port={3000} />
)}
```

---

## 🚀 Using the Features in Code

### Generate Random Project Name
```typescript
import { generateProjectName } from '@/services/projectNameGenerator';

const projectName = generateProjectName();
// Returns: "Blazing Phoenix 847"
```

### Auto-Save Chat
```typescript
import { useAutoSave } from '@/hooks/useAutoSave';

const { manualSave } = useAutoSave(currentProject, {
  debounceMs: 1500,
  onSave: saveProject,
});
```

### Access Cloud Storage
```typescript
import { useCloudStorage } from '@/hooks/useCloudStorage';

const { usage, stats, listKeys, getKey, setKey, deleteKey } = useCloudStorage();

// List all project keys
const keys = await listKeys('onyxgpt:project:');

// Get a key value
const data = await getKey('onyxgpt:project:123');

// Save something
await setKey('onyxgpt:custom:mydata', { foo: 'bar' });
```

### Detect Project Language
```typescript
import { detectLanguage, validateDeployment, getDeploymentConfig } from '@/services/deploymentService';

const language = detectLanguage(project.fileTree);
// Returns: 'nodejs' | 'python' | 'go' | 'rust' | 'static'

const validation = validateDeployment(project);
if (!validation.valid) {
  console.error('Errors:', validation.errors);
}

const config = getDeploymentConfig(project);
console.log(`Build: ${config.buildCommand}`);
console.log(`Run: ${config.runCommand}`);
console.log(`Port: ${config.port}`);
```

### Sync Projects
```typescript
import { compareProjects, detectConflicts, mergeChanges } from '@/services/syncService';

const changes = compareProjects(localProject, remoteProject);
const conflicts = detectConflicts(localChanges, remoteChanges);
const merged = mergeChanges(local, remote, conflicts);
```

---

## 🐛 Debugging

### View Auto-Save Logs
```javascript
// Browser console
localStorage.setItem('DEBUG_AUTOSAVE', 'true');
// Reload page
// Watch console for save messages
```

### View Cloud Operations
```javascript
// Check what's in cloud
const keys = await window.puter.kv.list('onyxgpt:');
console.log(keys);

const data = await window.puter.kv.get('onyxgpt:project:123');
console.log(data);
```

### Test Deployment Detection
```javascript
// In browser console
import { detectLanguage, validateDeployment } from '@/services/deploymentService';

const validation = validateDeployment(project);
console.log('Language:', validation.language);
console.log('Valid:', validation.valid);
console.log('Errors:', validation.errors);
console.log('Warnings:', validation.warnings);
```

---

## ✅ Testing Checklist

### Chat History
- [ ] Send message
- [ ] Refresh page
- [ ] Message still there
- [ ] No "[object Object]" errors

### Project Names
- [ ] Each new project has different name
- [ ] Names are memorable (Adjective + Noun + Number)
- [ ] Names don't repeat

### Cloud Dashboard
- [ ] Can open Cloud tab
- [ ] Shows list of keys
- [ ] Can search keys
- [ ] Can view key values
- [ ] Can copy key names
- [ ] Can delete keys
- [ ] Shows storage usage
- [ ] Shows API call usage

### Deployment
- [ ] Node.js project detected as 'nodejs'
- [ ] Python project detected as 'python'
- [ ] Go project detected as 'go'
- [ ] Static HTML detected as 'static'
- [ ] Correct build commands assigned
- [ ] Correct ports assigned
- [ ] Pre-flight checks work

### Synchronization
- [ ] Changes tracked properly
- [ ] Conflicts detected
- [ ] Merge happens automatically
- [ ] No data loss

---

## 🎓 Learning Resources

### Understanding Each Feature

#### Chat Persistence
- Read: `src/hooks/useAutoSave.ts`
- Key concept: beforeunload event + retry logic
- Test: Add message → Refresh → Verify

#### Random Names
- Read: `src/services/projectNameGenerator.ts`
- Key concept: Random selection from lists
- Test: Generate 10 names → Check uniqueness

#### Cloud Storage
- Read: `src/hooks/useCloudStorage.ts`
- Key concept: Puter KV API wrapper
- Test: List keys → Get value → Set new → Delete

#### Error Handling
- Read: `src/services/aiTerminalService.ts`
- Key concept: formatError() function
- Test: Run failed command → Check error message

#### Deployment Detection
- Read: `src/services/deploymentService.ts`
- Key concept: File detection + language mapping
- Test: Validate different project types

#### Synchronization
- Read: `src/services/syncService.ts`
- Key concept: Change comparison + conflict resolution
- Test: Compare two versions → Detect changes

---

## 📞 Need Help?

### Check Console Logs First
```
Look for patterns like:
✅ - Successful operations
⚠️ - Warnings
❌ - Errors
📡 - Network operations
💾 - Save operations
🔄 - Sync operations
```

### Common Issues & Fixes

| Problem | Cause | Fix |
|---------|-------|-----|
| Chat not saving | Puter not available | Check `window.puter` exists |
| Cloud Dashboard blank | isPuterAvailable false | Verify Puter initialization |
| Names all same | Random seed issue | Check projectNameGenerator |
| Deployment fails | Language not detected | Check file tree structure |
| "[object Object]" error | formatError not called | Verify aiTerminalService loaded |

---

## 🎉 You're Ready!

All features are implemented and ready to integrate. Start with the quick tests above, then follow the integration checklist in IMPLEMENTATION_GUIDE.md.

**Main Next Steps**:
1. Test Phase 1 features (chat, names, errors)
2. Add Cloud tab to UI
3. Update E2B worker
4. Create deployment UI
5. Add sync integration

Good luck! 🚀
