# Vercel Deployment Instructions

Your OnyxGPT application is now ready for deployment to Vercel as a **frontend-only application** at https://onyx-gpt-code.vercel.app

## Quick Deployment

### Option 1: Deploy from GitHub (Recommended)

1. **Go to Vercel**:
   - Visit https://vercel.com/dashboard
   - Sign in or create an account

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Click "Import Git Repository"
   - Select "GitHub" and authorize if needed
   - Search for `OnyxGPT.Code` repository
   - Click "Import"

3. **Configure**:
   - Framework: Leave as default (Vercel auto-detects Vite)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables: None required (optional: can add VITE_API_ENDPOINT)
   - Click "Deploy"

4. **Wait for Build**:
   - Vercel will automatically build and deploy
   - View progress in the dashboard
   - Your app will be live within 1-2 minutes

### Option 2: Deploy from CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project directory
cd /workspaces/OnyxGPT.Code
vercel --prod
```

## Post-Deployment Verification

### Check Deployment Status
1. Visit your deployment URL: https://onyx-gpt-code.vercel.app
2. You should see the OnyxGPT UI
3. Click "Set API Key" to enter your Gemini API key
4. Create a new project and test the generation feature

### Verify Frontend-Only Setup
- ✅ No backend server running
- ✅ No environment variables needed (except optional)
- ✅ API key stored in browser localStorage
- ✅ Data persists across page refreshes
- ✅ Requires internet for Gemini API calls

## Domain Configuration

If you have a custom domain:

1. **In Vercel Dashboard**:
   - Select your project
   - Go to "Settings" → "Domains"
   - Add your custom domain
   - Update DNS records according to Vercel instructions

2. **Current Setup**:
   - Default domain: `onyx-gpt-code.vercel.app`
   - This can be changed in project settings

## Environment Variables (Optional)

If you want to add environment variables later:

1. **In Vercel Dashboard**:
   - Select your project
   - Go to "Settings" → "Environment Variables"
   - Add any variables needed

2. **Available Variables**:
   ```
   VITE_API_ENDPOINT=https://onyx-gpt-code.vercel.app
   ```

## Key Architecture Points

### Frontend-Only Deployment
- All code runs in the browser
- No Node.js/backend server needed
- Deployed as static site to Vercel CDN
- Scales automatically with global traffic

### Data Handling
- API key: Stored in browser localStorage
- Projects: Stored in browser localStorage
- Generated files: Stored in browser localStorage
- No server-side storage or database needed

### API Integration
- Gemini API called directly from browser
- No middleware or proxy server
- Users provide their own API key
- Each browser session is independent

## Troubleshooting

### Build Fails on Vercel

**Check Vercel logs**:
1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments"
4. Find the failed deployment
5. Click to expand and check the error

**Common Issues**:
- Missing dependencies: Check `package.json`
- TypeScript errors: Run `npm run build` locally
- Node version: Vercel uses Node 20+ by default

### API Key Issues

**If "API Key not found"**:
1. Reload the page
2. Click "Set API Key"
3. Paste your Gemini API key
4. Press Save

**If generation fails**:
1. Check API key is correct: https://ai.google.dev
2. Check API quota/limits in Google Cloud Console
3. Try with a simple prompt first

### Data Loss

**If data disappeared**:
1. Check browser localStorage is enabled
2. Ensure not in incognito/private mode
3. Try different browser to test
4. Data survives page refreshes but not cache clear

## Monitoring & Maintenance

### View Analytics
- Vercel Dashboard shows:
  - Page views
  - Response times
  - Edge function usage
  - Error rates

### Update Application
1. Make changes locally
2. Commit to GitHub: `git commit -am "message"` and `git push origin main`
3. Vercel automatically rebuilds and deploys
4. No manual intervention needed

### Rollback
If you need to revert:
1. Go to Vercel Dashboard
2. Find previous deployment
3. Click "Redeploy"

## Performance Notes

### Optimization
- Built with Vite for fast loading
- CSS is minified (~10 KB gzipped)
- JavaScript is bundled and optimized (~225 KB gzipped)
- Global CDN via Vercel ensures fast access

### Expected Load Times
- First load: 2-4 seconds
- Subsequent loads: <500ms (cached)
- Generation: Depends on Gemini API response time

## Cost

Vercel Pricing:
- **Free Tier**: Sufficient for most users
  - 100 GB bandwidth/month
  - Unlimited serverless function invocations
  - Automatic deployments from Git
  - Edge network access
  
- No charges for static site hosting
- Pay only for overage bandwidth (if any)

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **GitHub Issues**: https://github.com/DEVELOPER7-sudo/OnyxGPT.Code/issues
- **Gemini API Docs**: https://ai.google.dev/docs
- **Vite Docs**: https://vitejs.dev

## Summary

Your application is deployed as a modern, frontend-only application that:
- Requires no backend infrastructure
- Scales globally with Vercel's CDN
- Protects user privacy with local-only storage
- Works offline for read-only access
- Deploys automatically from GitHub

Happy coding! 🚀
