# 🚀 Deployment Guide

Complete guide for deploying Oxivo Management System to production.

---

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All TypeScript errors resolved (`npm run build`)
- [ ] ESLint warnings addressed
- [ ] No console.error in production code
- [ ] All tests passing (if applicable)

### ✅ Performance
- [ ] Bundle size < 1MB (gzipped < 300KB)
- [ ] Lighthouse score > 90
- [ ] No memory leaks detected
- [ ] Lazy loading configured

### ✅ Security
- [ ] No API keys in code
- [ ] Environment variables configured
- [ ] CORS settings reviewed
- [ ] Input validation in place

### ✅ Data
- [ ] Migration scripts tested
- [ ] Backup strategy documented
- [ ] Version control verified
- [ ] Recovery procedures ready

---

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)

**Why Netlify?**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Built-in CDN
- ✅ Easy rollbacks
- ✅ Git integration

**Steps:**

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Configure Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select your repository
   - Build settings:
     ```
     Build command: npm run build
     Publish directory: dist
     ```

3. **Environment Variables** (if using backend)
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Deploy**
   - Click "Deploy site"
   - Wait 2-3 minutes
   - Site is live! 🎉

**Configuration File (`netlify.toml`):**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18.17.0"
```

---

### Option 2: Vercel

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Follow prompts**
   - Link to existing project or create new
   - Confirm build settings
   - Deploy!

**Configuration File (`vercel.json`):**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

### Option 3: GitHub Pages

**Steps:**

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json**
   ```json
   {
     "homepage": "https://[username].github.io/[repo-name]",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Configure Vite** (`vite.config.ts`)
   ```typescript
   export default defineConfig({
     base: '/[repo-name]/',
     // ...
   });
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

---

### Option 4: Self-Hosted (VPS)

**Requirements:**
- Ubuntu 20.04+ or similar
- Nginx or Apache
- SSL certificate (Let's Encrypt)

**Steps:**

1. **Build Locally**
   ```bash
   npm run build
   ```

2. **Upload to Server**
   ```bash
   scp -r dist/* user@server:/var/www/oxivo
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/oxivo;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       gzip on;
       gzip_types text/css application/javascript application/json;
   }
   ```

4. **Setup SSL**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🔧 Build Configuration

### Production Build

```bash
# Standard build
npm run build

# Build with source maps (debugging)
npm run build -- --mode development

# Preview production build locally
npm run preview
```

### Build Optimization

**Vite Config (`vite.config.ts`):**

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

---

## 🌍 Environment Variables

### Development (`.env.local`)

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_dev_supabase_url
VITE_SUPABASE_ANON_KEY=your_dev_anon_key
```

### Production (Platform Settings)

```env
VITE_API_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=your_prod_supabase_url
VITE_SUPABASE_ANON_KEY=your_prod_anon_key
```

**⚠️ Never commit `.env.local` to Git!**

---

## 📊 Post-Deployment Verification

### Health Checks

1. **Lighthouse Audit**
   - Open DevTools → Lighthouse
   - Run audit
   - Aim for 90+ in all categories

2. **Bundle Size**
   ```bash
   npm run build
   # Check dist/ folder size
   ```

3. **Error Monitoring**
   - Check browser console
   - Test all major flows
   - Verify error boundaries work

4. **Performance**
   - First Paint < 1s
   - Time to Interactive < 3s
   - No layout shifts (CLS < 0.1)

### Testing Checklist

- [ ] All modules load correctly
- [ ] Data persistence works
- [ ] Excel import/export functional
- [ ] Dashboard widgets render
- [ ] Search functionality works
- [ ] Mobile responsive
- [ ] Dark mode works (if enabled)
- [ ] Error boundaries catch errors
- [ ] No console errors

---

## 🔄 Continuous Deployment

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 🐛 Troubleshooting Deployment

### Build Fails

**Error:** `Module not found`
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error:** `Out of memory`
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Site Not Loading

1. Check browser console
2. Verify routing configuration (SPA fallback)
3. Check CORS settings
4. Verify environment variables

### Assets Not Loading

- Check `base` path in `vite.config.ts`
- Verify asset paths are relative
- Check CDN configuration

---

## 📈 Performance Monitoring

### Recommended Tools

- **Lighthouse CI** - Automated performance audits
- **Sentry** - Error tracking
- **Google Analytics** - User analytics
- **Plausible** - Privacy-friendly analytics

### Key Metrics to Track

| Metric | Target | Critical |
|--------|--------|----------|
| **First Paint** | < 1s | < 2s |
| **Time to Interactive** | < 3s | < 5s |
| **Bundle Size** | < 1MB | < 2MB |
| **Lighthouse Score** | > 90 | > 80 |

---

## 🔐 Security Best Practices

### Pre-Deploy

- [ ] Update all dependencies
- [ ] Run security audit: `npm audit`
- [ ] Fix critical vulnerabilities
- [ ] Review environment variables
- [ ] Enable HTTPS only

### Post-Deploy

- [ ] Setup security headers
- [ ] Configure CSP (Content Security Policy)
- [ ] Enable rate limiting (if backend)
- [ ] Monitor for suspicious activity

---

## 📚 Additional Resources

- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **Netlify Docs**: https://docs.netlify.com
- **Vercel Docs**: https://vercel.com/docs
- **Performance Guide**: https://web.dev/performance

---

**🎉 Congratulations! Your app is now live!**

**Next Steps:**
1. Monitor performance
2. Gather user feedback
3. Plan next iteration
4. Keep dependencies updated

**Version:** 3.0  
**Last Updated:** November 13, 2025
