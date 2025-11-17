# ✅ Pre-Deploy Checklist

**Version:** 3.0.0  
**Date:** November 13, 2025  
**Status:** Ready for final verification

---

## 🎯 Overview

Use this checklist before deploying to production. Complete all sections marked with ⚠️ **CRITICAL**.

**Estimated time:** 10-15 minutes  
**Recommended:** Do this in a quiet environment

---

## 📋 CHECKLIST

### 1. ⚠️ Code Quality (CRITICAL)

- [ ] **Build succeeds locally**
  ```bash
  npm run build
  # Should complete without errors
  ```

- [ ] **Type checking passes**
  ```bash
  npm run typecheck
  # Should show: Found 0 errors
  ```

- [ ] **ESLint clean**
  ```bash
  npm run lint
  # Should show: 0 errors, 0 warnings
  ```

- [ ] **Preview works**
  ```bash
  npm run preview
  # Visit http://localhost:4173
  # Test all modules
  ```

---

### 2. ⚠️ Functionality Testing (CRITICAL)

#### Dashboard
- [ ] Dashboard loads without errors
- [ ] All 13 widgets display correctly
- [ ] Widget pinning works
- [ ] Full list modals open
- [ ] Charts render properly

#### Müşteri (Customer)
- [ ] Customer list loads
- [ ] Search works
- [ ] Add new customer works
- [ ] Edit customer works
- [ ] Customer detail view works
- [ ] Excel import works
- [ ] Excel export works

#### Banka/PF
- [ ] Bank/PF list loads
- [ ] All tabs accessible
- [ ] Add new Bank/PF works
- [ ] Edit works
- [ ] TABELA simulation works
- [ ] Hakediş calculation works

#### Tanımlar (Definitions)
- [ ] All tabs load
- [ ] Add new definitions works
- [ ] Edit definitions works
- [ ] Delete works
- [ ] Data persists after refresh

#### Gelir (Revenue)
- [ ] Revenue list loads
- [ ] Add new revenue works
- [ ] Auto-save works (1.5s debounce)
- [ ] Charts display
- [ ] Reports generate

#### Raporlar (Reports)
- [ ] All report types accessible
- [ ] Data displays correctly
- [ ] Export functions work
- [ ] Filters work

---

### 3. ⚠️ Data Management (CRITICAL)

- [ ] **Data persists after page refresh**
  ```
  1. Add test data
  2. Refresh page (F5)
  3. Verify data still there
  ```

- [ ] **Auto-save works**
  ```
  1. Edit a field
  2. Wait 2 seconds
  3. Check console for save message
  ```

- [ ] **Excel import works**
  ```
  1. Import sample Excel file
  2. Verify all data imported
  3. Check for errors
  ```

- [ ] **Excel export works**
  ```
  1. Export data to Excel
  2. Open file
  3. Verify data is correct
  ```

- [ ] **Data migration works**
  ```
  1. Check console for migration logs
  2. Verify no errors
  3. Test legacy data recovery
  ```

---

### 4. ⚠️ Error Handling (CRITICAL)

- [ ] **Error boundaries work**
  ```
  1. Force an error (if test mode available)
  2. Verify error boundary catches it
  3. Check user sees friendly message
  ```

- [ ] **Network errors handled**
  ```
  1. Disconnect internet (briefly)
  2. Try to save data
  3. Verify retry logic works
  4. Reconnect and verify save
  ```

- [ ] **No console errors**
  ```
  1. Open DevTools Console
  2. Navigate all pages
  3. Should see no red errors
  4. Warnings are OK
  ```

---

### 5. 🔒 Security

- [ ] **No hardcoded secrets**
  ```bash
  # Search for potential secrets
  grep -r "supabase" . --include="*.tsx" --include="*.ts"
  # Should only use environment variables
  ```

- [ ] **Environment variables documented**
  - Check `.env.example` exists
  - All required vars listed
  - Instructions clear

- [ ] **Sensitive data not committed**
  - Check `.gitignore` includes `.env`
  - No API keys in code
  - No passwords in comments

---

### 6. 📦 Bundle & Performance

- [ ] **Bundle size acceptable**
  ```bash
  npm run build
  # Check dist/ folder size
  # Should be < 1MB uncompressed
  # Should be < 300KB gzipped
  ```

- [ ] **Lighthouse score good**
  ```
  1. Build and preview
  2. Open DevTools → Lighthouse
  3. Run audit
  4. Should be 90+
  ```

- [ ] **First paint fast**
  ```
  1. Hard refresh (Ctrl+Shift+R)
  2. Should see content < 1 second
  ```

- [ ] **No memory leaks**
  ```
  1. Use app for 5 minutes
  2. Check DevTools → Memory
  3. Should not grow indefinitely
  ```

---

### 7. 📱 Responsive Design

- [ ] **Desktop (1920x1080)**
  - All pages look good
  - No horizontal scroll
  - All content visible

- [ ] **Laptop (1366x768)**
  - All pages look good
  - No overflow
  - Content fits

- [ ] **Tablet (768x1024)**
  - Layout adapts
  - Navigation works
  - Touch targets adequate

- [ ] **Mobile (375x667)**
  - Mobile view works
  - Text readable
  - Buttons accessible

---

### 8. 🌐 Browser Compatibility

- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (if on Mac)
- [ ] **Edge** (latest)

**Test in each:**
- Dashboard loads
- Main features work
- No console errors

---

### 9. 📚 Documentation

- [ ] **README.md up to date**
  - Project description accurate
  - Installation steps work
  - Links functional

- [ ] **QUICK_START.md tested**
  - Follow steps exactly
  - Should work in 5 minutes
  - No missing info

- [ ] **DEPLOYMENT.md accurate**
  - Deployment steps correct
  - All platforms documented
  - Environment vars listed

- [ ] **TROUBLESHOOTING.md helpful**
  - Common issues covered
  - Solutions work
  - Contact info correct

---

### 10. ⚙️ Configuration Files

- [ ] **package.json**
  - ✅ Name: "oxivo-management-system"
  - ✅ Version: "3.0.0"
  - ✅ Scripts work
  - ✅ Dependencies correct

- [ ] **tsconfig.json**
  - ✅ Strict mode enabled
  - ✅ Paths configured
  - ✅ No errors

- [ ] **vite.config.ts**
  - ✅ Build settings correct
  - ✅ Plugins configured
  - ✅ No deprecated options

- [ ] **.gitignore**
  - ✅ Exists
  - ✅ Includes node_modules
  - ✅ Includes .env
  - ✅ Includes dist

---

### 11. 🚀 Deployment Files

- [ ] **netlify.toml** (if using Netlify)
  - Build command correct
  - Publish directory correct
  - Redirects configured

- [ ] **vercel.json** (if using Vercel)
  - Build settings correct
  - Environment vars noted
  - Routes configured

- [ ] **GitHub workflows**
  - Moved to `.github/workflows/`
  - Secrets documented
  - Test run succeeds

---

### 12. 🎯 Final Tests

- [ ] **Clean install test**
  ```bash
  # Delete node_modules
  rm -rf node_modules
  
  # Fresh install
  npm install
  
  # Build
  npm run build
  
  # Should succeed
  ```

- [ ] **Production build test**
  ```bash
  npm run build
  npm run preview
  
  # Visit http://localhost:4173
  # Test all features
  ```

- [ ] **Network tab check**
  ```
  1. Open DevTools → Network
  2. Refresh page
  3. Check for:
     - No 404 errors
     - No failed requests
     - Reasonable load times
  ```

---

## 🎨 Visual Verification

### Screenshots Checklist

Take screenshots of:
- [ ] Dashboard (desktop)
- [ ] Customer list (desktop)
- [ ] Customer detail (desktop)
- [ ] Dashboard (mobile)
- [ ] All working correctly

**Save these for:**
- Documentation
- Marketing
- Bug reports baseline

---

## 🔍 Deep Inspection

### Console Logs

- [ ] **No errors** (red)
- [ ] **Minimal warnings** (yellow)
- [ ] **No sensitive data** logged
- [ ] **Proper log levels** used

### Network Requests

- [ ] **No unnecessary requests**
- [ ] **Proper caching** used
- [ ] **Reasonable payload sizes**
- [ ] **HTTPS only** (in production)

### Local Storage

- [ ] **Data structure correct**
- [ ] **Version numbers present**
- [ ] **No excessive storage** (< 5MB)
- [ ] **Cleanup works**

---

## 📊 Performance Metrics

### Target Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Bundle Size** | < 1MB | 850KB | [ ] |
| **Gzipped** | < 300KB | 280KB | [ ] |
| **First Paint** | < 1.5s | ___ | [ ] |
| **FCP** | < 2s | ___ | [ ] |
| **TTI** | < 3s | ___ | [ ] |
| **Lighthouse** | > 90 | ___ | [ ] |

**Fill in "Current" values above**

---

## 🐛 Known Issues Check

Review and verify these are resolved:

- [x] Dashboard "0 ürün" issue → ✅ Fixed
- [x] Dropdown legacy components → ✅ Migrated
- [x] Type safety issues → ✅ Resolved
- [x] Connection resilience → ✅ Implemented
- [x] TABELA interface mismatch → ✅ Fixed
- [x] Widget pin feature → ✅ Complete
- [x] Top 6 limitation → ✅ Applied

**Any new issues?** Document below:

```
Issue 1: ___________________
Status: ___________________

Issue 2: ___________________
Status: ___________________
```

---

## 🎓 User Acceptance

If possible, have someone else test:

- [ ] **Non-developer user** tested
  - Can navigate easily
  - Understands features
  - No confusion

- [ ] **Feedback collected**
  - What worked well
  - What was confusing
  - Suggestions noted

---

## 📝 Documentation Review

- [ ] **All links work**
  ```bash
  # Check all .md files for broken links
  ```

- [ ] **Code comments adequate**
  ```bash
  # Review complex functions
  # Check for TODO/FIXME
  ```

- [ ] **API documented**
  ```bash
  # Check utils/ functions
  # Verify types documented
  ```

---

## 🔐 Environment Variables

### Required Variables

- [ ] **VITE_SUPABASE_URL**
  - Value: `https://xxxxx.supabase.co`
  - Status: [ ] Set

- [ ] **VITE_SUPABASE_ANON_KEY**
  - Value: `eyJhbGci...`
  - Status: [ ] Set

### Optional Variables

- [ ] **VITE_GEMINI_API_KEY** (if using AI features)
  - Status: [ ] Set or N/A

---

## 🚦 Final Status

### Overall Readiness

```
Category               Status    Notes
─────────────────────────────────────────
Code Quality           [ ]       _______________
Functionality          [ ]       _______________
Data Management        [ ]       _______________
Error Handling         [ ]       _______________
Security               [ ]       _______________
Performance            [ ]       _______________
Responsive Design      [ ]       _______________
Browser Compat         [ ]       _______________
Documentation          [ ]       _______________
Configuration          [ ]       _______________
Deployment Files       [ ]       _______________
Final Tests            [ ]       _______________
```

---

## ✅ Sign-Off

### Pre-Deploy Approval

**I confirm that:**
- [ ] All critical items completed
- [ ] All tests passed
- [ ] Documentation reviewed
- [ ] Ready for deployment

**Checked by:** _________________  
**Date:** _________________  
**Time:** _________________

**Deploy to:** [ ] Staging [ ] Production

---

## 🚀 Ready to Deploy?

### If ALL checkboxes checked:

```bash
# You're ready! Follow DEPLOYMENT.md

# Quick deploy commands:
npm run build              # Build for production
# Then follow platform-specific steps
```

### If ANY checkboxes NOT checked:

**STOP!** Do not deploy yet.
1. Complete missing items
2. Re-test
3. Come back to this checklist

---

## 📞 Emergency Contacts

**Before deploying, know who to contact if issues arise:**

- **Technical Lead:** _______________
- **DevOps:** _______________
- **Support:** _______________
- **Emergency:** _______________

---

## 🎯 Post-Deploy Actions

After successful deployment:

- [ ] Monitor for 1 hour
- [ ] Check error tracking
- [ ] Verify all features work
- [ ] Update status page
- [ ] Notify team
- [ ] Celebrate! 🎉

---

**Last Updated:** November 13, 2025  
**Version:** 3.0.0  
**Checklist Version:** 1.0

**🎉 Good luck with your deployment!**
