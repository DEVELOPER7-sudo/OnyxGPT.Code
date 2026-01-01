# Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+ and npm/pnpm
- Internet connection (for Puter.js and E2B SDK)
- Modern browser (Chrome, Firefox, Safari, Edge)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open http://localhost:5173
```

The app uses hot module replacement (HMR), so changes update instantly.

## Building for Production

```bash
# Build optimized bundle
npm run build

# Output: dist/

# Preview production build locally
npm run preview
```

## Deployment Options

### Option 1: Vercel (Recommended)

**Simplest deployment for React apps**

```bash
npm i -g vercel
vercel
```

Then follow the prompts. Vercel handles:
- Build optimization
- CDN distribution
- Automatic deployments on git push
- Environment variables (if needed)

### Option 2: Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

Or use Git integration:
1. Push to GitHub
2. Connect repo to Netlify
3. Auto-deploys on commits

### Option 3: GitHub Pages

Static hosting (requires SPA configuration):

```bash
npm run build
# Deploy dist/ folder to gh-pages branch
```

Edit `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/OnyxGPT.Code/', // if repo is not root
  // ... rest of config
})
```

### Option 4: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve with static server
FROM node:18-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=0 /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build & run:
```bash
docker build -t onyxgpt-code .
docker run -p 3000:3000 onyxgpt-code
```

### Option 5: Self-Hosted (Node.js)

```bash
npm run build
npm install -g serve
serve -s dist -l 3000
```

## Environment Setup

### Required Configuration

No environment variables needed! Everything is configured by default.

### Optional: E2B API Key Override

Create `.env.production`:
```
VITE_E2B_API_KEY=your_api_key_here
```

Update `src/lib/e2b-client.ts`:
```typescript
const apiKey = import.meta.env.VITE_E2B_API_KEY || 'e2b_a8bf5367c9183a37482e52661bc26ca7fec29a9c'
```

## Performance Optimization

### Code Splitting

Vite automatically splits code for:
- React components
- Third-party libraries
- CodeMirror extensions

### Image Optimization

No images in current version. For future:
```typescript
import { lazy } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))
```

### Bundle Analysis

```bash
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.ts:
import { visualizer } from 'rollup-plugin-visualizer'

plugins: [
  react(),
  visualizer({ open: true })
]
```

Run build, opens bundle analyzer.

## Monitoring & Analytics

Add your analytics script to `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

## Performance Metrics

Target metrics:
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.5s

Check with:
```bash
npm install --save-dev lighthouse
npx lighthouse https://your-deployed-url.com --view
```

## SSL/HTTPS

All deployment platforms provide free HTTPS. Puter.js requires HTTPS.

For self-hosted:
- Use Let's Encrypt with Certbot
- Use Nginx with SSL module
- Use Cloudflare as CDN with SSL

## Database & Persistence

**Current**: Puter.js handles all persistence
- No setup needed
- Data stored in user's Puter account
- No separate database required

**Future**: If migrating to traditional backend:
- Add PostgreSQL/MongoDB
- Create `/api` endpoints
- Update `src/lib/puter-client.ts`

## Scaling Considerations

### Current (Puter-based)
- Scales automatically with Puter infrastructure
- Per-user quota limits apply
- No server costs

### Future (if self-hosting)
- Use Redis for KV store
- CDN for file serving
- Containerize with Kubernetes
- Load balance across instances

## Troubleshooting Deployments

### Build fails
```bash
npm ci  # Clean install
npm run build  # Detailed error output
```

### Puter.js not available in production
- Verify HTTPS enabled
- Check CORS headers from Puter
- Review browser console

### Large bundle size
```bash
# Analyze
npm run build --report

# Reduce
- Code split lazy components
- Tree-shake unused imports
- Compress CodeMirror extensions
```

### Preview not loading after deploy
- Check E2B sandbox connectivity
- Verify API key in environment
- Test locally first

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/deploy-pages@v2
        if: github.ref == 'refs/heads/main'
```

## Rollback Plan

If deployment breaks:

**Vercel**: Click "Rollback" in Deployments tab
**Netlify**: Switch to previous deploy in Deploy settings
**GitHub Pages**: Revert commit and push
**Docker**: Restart with previous image tag

## Maintenance

### Regular Tasks
- Monitor error logs
- Update dependencies: `npm update`
- Security audits: `npm audit`
- Performance monitoring

### Monthly
```bash
npm outdated  # Check for updates
npm audit fix  # Security updates
npm test  # Run tests
```

### Quarterly
- Major version upgrades
- Framework updates (React, Vite)
- Architecture reviews

## Support & Debugging

### Logs
- **Browser console**: `F12` → Console tab
- **Build logs**: Terminal output during `npm run build`
- **Deployment logs**: Check platform-specific dashboards

### Debugging
```bash
# Source maps in build
npm run build -- --sourcemap

# Remote debugging
chrome://inspect
```

## Backup Strategy

**Automatic** (via Puter):
- All user data backed up on Puter servers
- No additional backup needed

**Manual** (for projects):
```typescript
// Export project as JSON
const project = useProjectStore.getState().currentProject
const json = JSON.stringify(project, null, 2)
localStorage.setItem('project-backup', json)
```

## Cost Analysis

### Free Tier (Current Stack)
- Vercel: 0 (free tier)
- Netlify: 0 (free tier)
- Puter: 0 (free tier)
- E2B: ~$0.50/hour (pay-as-you-go)

**Total**: Essentially free for development

### Production (Expected)
- Hosting: $10-50/month
- E2B (moderate usage): $50-200/month
- Puter (premium): $0-50/month

**Total**: ~$100-300/month for production-scale app

## Next Steps

1. Choose deployment platform (Vercel recommended)
2. Connect GitHub repository
3. Set up auto-deployments
4. Configure custom domain
5. Monitor performance
6. Plan scaling strategy
