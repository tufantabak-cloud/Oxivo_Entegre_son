# ⚙️ GitHub Actions Workflow Setup

**Status:** ⚠️ Manual setup required  
**Time Required:** 2 minutes  
**Difficulty:** Easy

---

## ⚠️ Important Notice

Your GitHub Actions workflow files are currently in `/workflows/` but they need to be in `/.github/workflows/` to work properly.

**Current location:** `/workflows/`  
**Required location:** `/.github/workflows/`

---

## 🚀 Quick Setup (2 minutes)

### Option 1: Command Line (Recommended)

```bash
# Create .github/workflows directory
mkdir -p .github/workflows

# Move workflow files
mv workflows/deploy.yml .github/workflows/
mv workflows/auto-sync.yml .github/workflows/

# Remove old directory
rmdir workflows

# Commit changes
git add .github/workflows/
git rm -r workflows/
git commit -m "chore: Move workflows to .github/workflows/"
git push
```

### Option 2: Manual (GitHub Web Interface)

1. **Go to your repository on GitHub**
2. **Create `.github/workflows/` directory:**
   - Click "Add file" → "Create new file"
   - Type `.github/workflows/deploy.yml`
   - This creates the directory structure

3. **Copy content from `/workflows/deploy.yml`:**
   - Open local `/workflows/deploy.yml`
   - Copy all content
   - Paste into new file
   - Commit

4. **Repeat for `auto-sync.yml`:**
   - Create `.github/workflows/auto-sync.yml`
   - Copy content from local file
   - Commit

5. **Delete old `/workflows/` directory:**
   - Navigate to `/workflows/`
   - Delete directory
   - Commit

---

## 📋 Workflow Files

### 1. deploy.yml
**Purpose:** Build and deploy on push to main  
**Triggers:** Push to main, Pull requests  
**Actions:**
- ✅ Checkout code
- ✅ Setup Node.js 18
- ✅ Install dependencies
- ✅ Build project
- ✅ Upload artifacts

**Required secrets:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 2. auto-sync.yml
**Purpose:** Scheduled build checks  
**Triggers:** Every 4 hours, Manual  
**Actions:**
- ✅ Check repository status
- ✅ Build and test
- ✅ Show statistics

**Required secrets:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🔑 GitHub Secrets Setup

After moving workflows, configure secrets:

### Step 1: Get Your Supabase Credentials

From your Supabase dashboard:
- **VITE_SUPABASE_URL:** `https://xxxxx.supabase.co`
- **VITE_SUPABASE_ANON_KEY:** `eyJhbGciOiJIUzI1...`

### Step 2: Add to GitHub

1. **Go to repository Settings**
2. **Navigate to:** Secrets and variables → Actions
3. **Click:** "New repository secret"
4. **Add secrets:**

```
Name: VITE_SUPABASE_URL
Value: https://your-project.supabase.co
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: your-anon-key-here
```

---

## ✅ Verification

### Check Workflow is Active

1. **Go to:** Repository → Actions tab
2. **You should see:**
   - "Build and Deploy"
   - "Scheduled Auto-Sync Check"

3. **Test manually:**
   - Click "Scheduled Auto-Sync Check"
   - Click "Run workflow"
   - Select branch: `main`
   - Click "Run workflow"

4. **Expected result:**
   - ✅ Build succeeds
   - ✅ No errors
   - ✅ Artifacts uploaded

---

## 🎯 Workflow Configuration

### Enable/Disable Workflows

#### Disable Auto-Sync (Optional)

If you don't want scheduled checks:

```yaml
# In .github/workflows/auto-sync.yml
# Comment out the schedule section:

on:
  # schedule:
  #   - cron: '0 */4 * * *'
  
  workflow_dispatch: # Keep manual trigger
```

#### Enable Vercel Deployment

To auto-deploy to Vercel:

```yaml
# In .github/workflows/deploy.yml
# Uncomment the deploy job (lines 40-50)

# Add these secrets:
# - VERCEL_TOKEN
# - VERCEL_ORG_ID
# - VERCEL_PROJECT_ID
```

---

## 🔧 Advanced Configuration

### Custom Build Script

To add additional build steps:

```yaml
# In .github/workflows/deploy.yml

- name: Type check
  run: npm run typecheck

- name: Lint
  run: npm run lint

- name: Tests
  run: npm test
```

### Multiple Environments

For staging and production:

```yaml
# Create .github/workflows/deploy-staging.yml

on:
  push:
    branches: [ develop ]

jobs:
  deploy-staging:
    # ... staging deployment
```

---

## 📊 Monitoring

### View Workflow Runs

1. **Go to:** Repository → Actions
2. **See all runs** with status
3. **Click a run** to see details
4. **Download artifacts** if needed

### Notifications

To get notified on failures:

```yaml
# Add to workflow:

- name: Send notification
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

Or use GitHub's built-in email notifications:
- Settings → Notifications → Actions

---

## 🐛 Troubleshooting

### Workflow Not Running

**Problem:** Workflow doesn't trigger  
**Solutions:**
- ✅ Check file is in `.github/workflows/`
- ✅ Check YAML syntax is valid
- ✅ Check branch name matches trigger
- ✅ Check workflows are enabled (Actions tab)

### Build Fails

**Problem:** Build step fails  
**Solutions:**
- ✅ Check secrets are configured
- ✅ Check `npm run build` works locally
- ✅ Check Node.js version matches (18)
- ✅ View full error logs in Actions

### Permission Denied

**Problem:** Cannot push artifacts  
**Solutions:**
- ✅ Check repository permissions
- ✅ Settings → Actions → General
- ✅ Enable "Read and write permissions"

---

## 📚 Resources

### Documentation
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

### Useful Actions
- [Checkout](https://github.com/actions/checkout)
- [Setup Node](https://github.com/actions/setup-node)
- [Upload Artifact](https://github.com/actions/upload-artifact)
- [Vercel Deploy](https://github.com/amondnet/vercel-action)

---

## ✅ Post-Setup Checklist

After moving workflows:

- [ ] Workflows in `.github/workflows/`
- [ ] Old `/workflows/` directory deleted
- [ ] Secrets configured in GitHub
- [ ] Test run succeeds
- [ ] Build artifacts created
- [ ] Notifications configured (optional)
- [ ] Documentation updated

---

## 🎯 Next Steps

1. **Move workflows** (use Option 1 above)
2. **Configure secrets** in GitHub
3. **Test workflow** manually
4. **Push to main** to trigger automatic build
5. **Monitor results** in Actions tab

---

## 💡 Pro Tips

### Faster Builds

```yaml
# Use cache for faster installs
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'npm'  # ← This speeds up builds!
```

### Conditional Runs

```yaml
# Only run on specific paths
on:
  push:
    paths:
      - 'src/**'
      - 'package.json'
```

### Matrix Builds

```yaml
# Test on multiple Node versions
strategy:
  matrix:
    node-version: [16, 18, 20]
```

---

## 📞 Need Help?

**Common issues:**
- ❓ Workflow not appearing → Check file location
- ❓ Build fails → Check secrets
- ❓ Artifacts missing → Check permissions

**Still stuck?**
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Check GitHub Actions logs
- Review workflow syntax

---

**Ready?** Run the quick setup commands above! ⚡

**Estimated time:** 2 minutes  
**Difficulty:** Easy  
**Impact:** Automated CI/CD ✨
