# Frontend-Only Deployment Guide

OnyxGPT is now configured as a **frontend-only application** that works entirely in the browser without requiring a backend server. This setup is optimized for deployment on Vercel.

## Architecture

```
Browser (Frontend Only)
├── React UI (Vite)
├── Gemini API (Direct)
└── localStorage (Data Persistence)
```

### Components

- **Frontend**: React + TypeScript + Vite (compiled to static HTML/JS)
- **API**: Google Gemini API (called directly from browser)
- **Storage**: Browser's localStorage (5-10 MB limit per domain)
- **Deployment**: Vercel (static site hosting)

## How It Works

1. **User enters API key** through the UI ("Set API Key" button)
2. **API key stored** securely in localStorage
3. **User writes prompt** and clicks "Generate"
4. **Frontend calls Gemini API** directly with the prompt
5. **Response is streamed** and parsed in the browser
6. **Generated files** are stored in localStorage
7. **User can export** files as ZIP or download individually

## Deployment to Vercel

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository (https://github.com/DEVELOPER7-sudo/OnyxGPT.Code)

### Deployment Steps

1. **Connect your GitHub repo to Vercel**:
   - Go to https://vercel.com/new
   - Select "GitHub" and authorize
   - Choose the `OnyxGPT.Code` repository
   - Click "Import"

2. **Configure environment (optional)**:
   - Framework: Vite (auto-detected)
   - Build Command: `npm run build` (default)
   - Output Directory: `dist` (default)
   - No environment variables needed for basic functionality

3. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at a Vercel URL

### Custom Domain
To use https://onyx-gpt-code.vercel.app:
1. Go to Vercel project settings
2. Navigate to "Domains"
3. Add domain if not already set

## Features

### Supported
- ✅ Generating code with Gemini AI (requires internet)
- ✅ Real-time streaming responses
- ✅ Creating and editing files
- ✅ Managing multiple projects
- ✅ Exporting generated code
- ✅ Reading existing projects (offline)

### Limitations
- ❌ Backend dependencies (npm/pip installs)
- ❌ Running code/tests
- ❌ Database operations
- ❌ File system access (outside browser)
- ❌ Generating code without internet

## Storage & Privacy

### localStorage Details
- **Capacity**: 5-10 MB per domain
- **Persistence**: Until browser cache is cleared
- **Scope**: Per domain (different domains = different storage)
- **Security**: Only accessible from the same domain

### Data Stored
- Gemini API key (encrypted in localStorage)
- Project metadata (names, descriptions)
- Generated files (code content)
- Chat history

### Important Notes
- API key is stored in localStorage (not sent to any backend)
- All processing happens in the user's browser
- No data is stored on any server
- Users are responsible for their own data backup

## Usage

### First Time
1. Visit https://onyx-gpt-code.vercel.app
2. Click "Set API Key"
3. Enter your Gemini API key (get one at: https://ai.google.dev)
4. Create a new project
5. Write a prompt
6. Click "Generate" and wait for response

### Regular Use
1. Visit the site (your data is still there in localStorage)
2. Select an existing project
3. Write prompts and generate code
4. Export or edit files as needed

## Troubleshooting

### "API Key not found"
- Make sure you've clicked "Set API Key" and entered a valid key
- The key is stored locally in your browser

### Storage limit exceeded
- localStorage limit is ~5-10 MB
- Delete old projects to free up space
- Export important files before deleting

### Files not persisting
- Check browser privacy settings
- Disable private/incognito mode
- Ensure localStorage is enabled
- Try a different browser

### Build fails on Vercel
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Check for TypeScript errors: `npm run build` locally

## API Keys

### Getting a Gemini API Key
1. Visit https://ai.google.dev
2. Click "Get Started"
3. Create or sign in to Google Account
4. Create an API key in Google AI Studio
5. Copy the key
6. Paste into OnyxGPT UI

### Security Notes
- Never share your API key
- The key is stored in your browser's localStorage
- Each user must provide their own API key
- Consider setting usage limits in Google Cloud Console

## Advanced Configuration

### Build for Production
```bash
npm run build
```
This creates optimized files in the `dist/` folder for deployment.

### Local Development
```bash
npm run dev
```
Runs the development server at http://localhost:5173 (or similar)

### Environment Variables
None required for basic functionality. Optional:
```bash
# .env.local (for reference only)
VITE_API_ENDPOINT=https://onyx-gpt-code.vercel.app
```

## Support

For issues or feature requests:
- GitHub: https://github.com/DEVELOPER7-sudo/OnyxGPT.Code
- Issues: Create a GitHub issue with details

## License

See LICENSE file in the repository.
