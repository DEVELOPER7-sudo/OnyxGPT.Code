# Deployment Guide - OnyxGPT.Code

Complete guide for deploying OnyxGPT.Code to production environments.

## Quick Start - Vercel (Recommended)

### 1. Prerequisites
- GitHub account (repo already created)
- Vercel account (free tier available)
- Environment variables configured

### 2. Deploy to Vercel

```bash
# Option A: Using Vercel CLI
npm install -g vercel
vercel

# Option B: Using Vercel Dashboard
# 1. Go to https://vercel.com/new
# 2. Import GitHub repository
# 3. Configure environment variables
# 4. Deploy
```

### 3. Environment Variables

Create a `.env.production` file or configure in Vercel dashboard:

```env
# No backend environment variables required for frontend-only deployment
# All integrations use public APIs (Puter.js, E2B)
```

### 4. Verify Deployment

```bash
# After deployment, visit your Vercel URL
https://your-app.vercel.app
```

## Local Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup

```bash
# Clone repository
git clone https://github.com/DEVELOPER7-sudo/code-canvas.git
cd code-canvas

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker Deployment

### Using Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "preview"]
```

### Build and Run

```bash
# Build Docker image
docker build -t onyxgpt-code .

# Run container
docker run -p 3000:3000 onyxgpt-code

# Or use Docker Compose
docker-compose up
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: always
```

## Netlify Deployment

### 1. Connect Repository

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### 2. Via Netlify Dashboard

1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Select repository
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Deploy

### 3. Configure Redirects

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Firebase Hosting

### 1. Setup Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init hosting
```

### 2. Configure firebase.json

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 3. Deploy

```bash
npm run build
firebase deploy
```

## AWS Deployment

### Using AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure
amplify configure

# Initialize
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### Using S3 + CloudFront

```bash
# Build the app
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## GitHub Pages Deployment

### Setup

1. Modify `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/code-canvas/', // Match repository name
  // ... rest of config
})
```

2. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

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
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

3. Enable GitHub Pages in repository settings

## Production Checklist

### Before Deployment

- [ ] Update `package.json` version number
- [ ] Run `npm run build` and verify no errors
- [ ] Test in production build mode locally (`npm run preview`)
- [ ] Verify all environment variables are set
- [ ] Update README with deployment URL
- [ ] Test Puter.js integration
- [ ] Test E2B integration (if using sandbox features)
- [ ] Check console for any warnings
- [ ] Test on multiple browsers
- [ ] Test responsive design at various zoom levels

### Deployment

- [ ] Commit all changes
- [ ] Push to main branch
- [ ] Verify GitHub Actions pass (if using CI/CD)
- [ ] Monitor deployment logs
- [ ] Verify production URL is accessible
- [ ] Test all features work in production

### Post-Deployment

- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify all API integrations work
- [ ] Test user registration/login (Puter.js)
- [ ] Test project creation and saving
- [ ] Test E2B sandbox features

## Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run build -- --report

# Check dependencies
npm ls
```

### Image Optimization

All images are already optimized. No additional optimization needed.

### Code Splitting

The app uses dynamic imports for lazy loading:
- Components are loaded on demand
- Reduce initial bundle size
- Faster first contentful paint

### Caching

Configure caching headers:

```
# Cache control for assets (1 year)
/assets/* Cache-Control: max-age=31536000

# Cache control for HTML (no cache)
/*.html Cache-Control: no-cache
```

## Monitoring & Logging

### Recommended Tools

- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Vercel Analytics**: Performance monitoring
- **Google Analytics**: User analytics

### Setup Sentry

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
});
```

## Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deploy Failures

1. Check build logs carefully
2. Verify all environment variables are set
3. Ensure Node.js version compatibility (16+)
4. Check for file size limits on hosting platform

### Performance Issues

1. Check bundle size: `npm run build -- --report`
2. Monitor Core Web Vitals
3. Optimize images if added
4. Check for unnecessary dependencies

### Puter.js/E2B Issues

1. Verify API keys are correct
2. Check CORS configuration
3. Test in development mode first
4. Check service status pages

## Rollback Procedure

### Vercel

```bash
# Deployments are automatically saved
# Use Vercel dashboard to select previous deployment
# Or use CLI:
vercel --prod --confirm
```

### Netlify

1. Go to Deploys tab
2. Select previous deployment
3. Click "Publish deploy"

### GitHub Pages

```bash
git revert HEAD
git push origin main
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run build:dev # Test dev build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist
```

## Security Headers

Add to deployment platform headers configuration:

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' *.puter.com *.e2b.dev
```

## Cost Estimation

### Free Tier (Recommended for Getting Started)

- **Vercel**: Free tier includes 100GB bandwidth/month
- **Netlify**: Free tier includes 100GB bandwidth/month
- **GitHub Pages**: Unlimited, free
- **Firebase**: Free tier with usage limits
- **Puter.js**: Free for development
- **E2B**: Limited free tier (pay-as-you-go for production)

### Production Costs

- **Hosting**: $0-20/month (depending on traffic)
- **E2B Sandbox**: ~$0.05-0.10 per execution
- **Puter.js**: Free (no costs)
- **Analytics/Monitoring**: $0-50/month

## Support & Documentation

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Firebase Docs**: https://firebase.google.com/docs
- **GitHub Pages**: https://pages.github.com
- **Puter.js Docs**: https://docs.puter.com
- **E2B Docs**: https://docs.e2b.dev
