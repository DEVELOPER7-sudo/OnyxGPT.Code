# Backend to localStorage Migration

## Summary of Changes

This project has been migrated from a backend-dependent architecture to a fully client-side localStorage-based system.

### Files Modified

1. **src/pages/Index.tsx**
   - Removed `axios` and backend API calls for project creation
   - Now uses `projectStorage.createProject()` to store projects in localStorage
   - Updated preview button to show a local build message instead of calling backend

2. **src/hooks/useProjects.ts**
   - Removed `axios` dependency
   - Changed from `fetch('http://localhost:3002/api/projects')` to `projectStorage.getProjects()`
   - Removed async/await from synchronous localStorage operations
   - Updated delete operation to use `projectStorage.deleteProject()`

3. **src/hooks/useAgentStream.tsx**
   - Made API endpoint configurable via `VITE_GEMINI_API_ENDPOINT` environment variable
   - Falls back to `http://localhost:3002/api/generate` if environment variable is not set
   - Still requires backend for AI generation (this part still uses backend if available)

4. **src/lib/parser.ts**
   - Removed `axios` dependency
   - Changed `performFileOperation()` to use localStorage instead of backend API calls
   - Now calls `projectStorage` methods for write, delete, and rename operations
   - Updated `performDependencyInstall()` to provide installation instructions instead of automatic installation
   - File operations are now stored in localStorage immediately

5. **package.json**
   - Removed `@elysiajs/cors` (Elysia CORS)
   - Removed `elysia` (backend framework)
   - Removed `axios` (HTTP client)
   - Added note about the migration
   - All other dependencies retained for frontend functionality

### New Files Created

1. **src/lib/projectStorage.ts**
   - Centralized localStorage management utility
   - Functions for:
     - `getProjects()` - retrieve all projects
     - `createProject()` - create new project with metadata
     - `deleteProject()` - remove project and its files
     - `getProject()` - get single project by ID
     - `getProjectFiles()` - retrieve all files for a project
     - `updateProjectFile()` - write/update file content
     - `deleteProjectFile()` - remove file from project
     - `renameProjectFile()` - rename file in project

2. **.env.example**
   - Example environment configuration
   - Documents optional `VITE_GEMINI_API_ENDPOINT` variable

3. **MIGRATION_NOTES.md** (this file)
   - Documentation of changes

## Data Storage

### Project Metadata
- Key: `onyx_projects`
- Value: JSON array of project objects with `id`, `prompt`, `model`, and `createdAt`

### Project Files
- Key: `onyx_project_files_{projectId}`
- Value: JSON object mapping file paths to their content

## Browser Limitations

Note: localStorage has a size limit (typically 5-10MB per domain). Large projects may exceed this limit.

## Installation Instructions

After these changes:

1. Run `npm install` to install client-side dependencies
2. Run `npm run dev` to start the development server
3. Run `npm run build` to build for production

Backend server is no longer required for basic project creation and editing.

## API Endpoint Configuration

If you want to connect to a custom backend API for the AI generation:
- Create a `.env.local` file
- Add: `VITE_GEMINI_API_ENDPOINT=http://your-backend-url/api/generate`

Without this, the app will attempt to use the default localhost endpoint.

## Known Limitations

1. **Preview Feature**: Disabled - requires local build and serve
2. **Dependency Installation**: No longer automatic - users must install manually in their local environment
3. **File Size Limits**: Limited by localStorage capacity (5-10MB total per domain)
4. **No Cloud Sync**: All data stored locally in browser - not synced across devices

## Future Considerations

To restore full backend functionality:
1. Update `useAgentStream.tsx` to always use a backend endpoint
2. Restore file operation endpoints in backend
3. Implement dependency installation endpoint
4. Implement preview server endpoint
5. Re-add backend dependencies to package.json
