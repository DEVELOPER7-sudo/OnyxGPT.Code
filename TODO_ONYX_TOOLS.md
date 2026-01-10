# TODO: Onyx System Tools Update

## Status: COMPLETED ✅

### Phase 1: Core Tool Definition ✅
- [x] Create `/src/lib/onyxTools.ts` - Complete Onyx AI tools definition with 18 tools

### Phase 2: Update System Prompt ✅
- [x] Update `/src/lib/systemPrompt.ts`
  - [x] Remove "Lovable.dev agent" references
  - [x] Add Onyx tools documentation
  - [x] Update tool usage instructions
  - [x] Add Puter hosting deployment patterns

### Phase 3: Update AI Terminal Service ✅
- [x] Update `/src/services/aiTerminalService.ts`
  - [x] Rename tool from `terminal` → `onyx_terminal` (with backward compatibility)
  - [x] Enhanced `[object Object]` error handling for sandbox responses
  - [x] Better validation of sandbox response objects

### Phase 4: Update E2B Worker ✅
- [x] Update `/src/services/e2bWorker.ts`
  - [x] Rename all tools to use `onyx_` prefix (18 tools)
  - [x] Update tool definitions with proper parameters
  - [x] Update parsing logic for new tool names
  - [x] Add `extractResponseContent` helper function

### Phase 5: Update Project Page ✅
- [x] Update `/src/pages/Project.tsx`
  - [x] Update tool call parsing for new `onyx_*` tool names
  - [x] Add better error handling for tool execution

### Phase 6: Update Deploy Dialog ✅
- [x] Update `/src/components/DeployDialog.tsx`
  - [x] Add comprehensive error handling for hosting operations
  - [x] Fix deployment failed errors with actionable guidance:
    - Subdomain Already Taken
    - Authentication Required
    - Deployment Limit Reached
    - Permission Denied
    - Connection Error
    - Deployment Timed Out
    - Invalid Subdomain

### Phase 7: Update usePuter Hook ✅
- [x] Update `/src/hooks/usePuter.ts`
  - [x] Add `extractResponseText` helper function
  - [x] Fix `[object Object]` errors in responses
  - [x] Add better error parsing for nested objects
  - [x] Support both `onyx_terminal` and legacy `terminal` tools

---

## Onyx Tools Defined (18 total)

1. `onyx_write_file` - Write content to a file
2. `onyx_read_file` - Read file content
3. `onyx_list_files` - List directory contents
4. `onyx_run_command` - Execute bash commands
5. `onyx_start_dev_server` - Start dev server
6. `onyx_install_packages` - Install npm packages
7. `onyx_search_files` - Regex search in files
8. `onyx_grep` - Search with context
9. `onyx_replace_in_file` - Replace text in files
10. `onyx_ls` - List directory
11. `onyx_mkdir` - Create directory
12. `onyx_rm` - Remove file/directory
13. `onyx_mv` - Move/rename
14. `onyx_cp` - Copy file/directory
15. `onyx_exec` - Execute command
16. `onyx_cat` - Read file (alias)
17. `onyx_touch` - Create empty file
18. `onyx_glob` - Find files by pattern

## Deployment Error Fixes ✅

Based on Puter hosting docs, proper error handling added for:
- ✅ Subdomain already taken errors
- ✅ Authentication errors
- ✅ Deployment failed errors
- ✅ Connection errors
- ✅ Permission errors
- ✅ Timeout errors
- ✅ Invalid subdomain format

## Known Issues Fixed ✅
1. ✅ `[object Object]` error in sandbox opening/responses
2. ✅ Deployment failed errors without actionable guidance
3. ✅ Tool names using Lovable branding → replaced with Onyx branding
4. ✅ Backward compatibility with legacy `terminal` tool

