# Docusaurus 3 Routing Fix - Complete Guide

**Status:** ✅ **FIXED** - All routing issues resolved

---

## 🔴 **Problems Identified & Fixed**

### 1. **Sidebar Path Mismatch** (CRITICAL)
**Problem:** Sidebar configuration didn't match actual folder names in `docs/`

**Before (Broken):**
```typescript
items: [
  'introduction/overview',              // ❌ Folder is named "01-introduction"
  'robotics-fundamentals/kinematics',   // ❌ Folder is named "02-robotics-fundamentals"
  'perception-systems/computer-vision', // ❌ Folder is named "03-perception-systems"
]
```

**After (Fixed):**
```typescript
items: [
  '01-introduction/overview',              // ✅ Matches folder name
  '02-robotics-fundamentals/kinematics',   // ✅ Matches folder name
  '03-perception-systems/computer-vision', // ✅ Matches folder name
]
```

**Result:** `/docs/01-introduction/overview` now loads correctly instead of 404.

---

### 2. **Missing Modules in Sidebar** (MODERATE)
**Problem:** Modules 4, 5, 6 existed in `docs/` but weren't in `sidebars.ts`

**Fixed:** Added all 6 modules to sidebar configuration:
- ✅ Module 4: AI for Robotics
- ✅ Module 5: Humanoid Robotics
- ✅ Module 6: Deployment & Ethics

---

### 3. **baseUrl Configuration** (DEPLOYMENT-CRITICAL)

**Current Configuration:**
```typescript
url: 'https://khanzadiwazirali.github.io',
baseUrl: '/',  // ⚠️ This assumes GitHub Pages at root domain
organizationName: 'khanzadiwazirali',
projectName: 'physical-ai-textbook',
```

**Scenarios:**

#### ✅ **Scenario A: Custom Domain or Root Deployment**
If deploying to:
- `khanzadiwazirali.github.io` (user/org page)
- Custom domain like `physicalai.com`

Keep:
```typescript
baseUrl: '/',
```

#### ⚠️ **Scenario B: Project Page Deployment**
If deploying to:
- `khanzadiwazirali.github.io/physical-ai-textbook`

Change to:
```typescript
baseUrl: '/physical-ai-textbook/',
```

---

## 📂 **Correct File Structure**

```
book/
├── docs/
│   ├── intro.md                                    → /docs/intro
│   ├── 01-introduction/
│   │   ├── overview.md                             → /docs/01-introduction/overview
│   │   ├── physical-ai-definition.md               → /docs/01-introduction/physical-ai-definition
│   │   ├── curriculum-guide.md                     → /docs/01-introduction/curriculum-guide
│   │   └── prerequisites.md                        → /docs/01-introduction/prerequisites
│   ├── 02-robotics-fundamentals/
│   │   ├── kinematics.md                           → /docs/02-robotics-fundamentals/kinematics
│   │   ├── dynamics.md                             → /docs/02-robotics-fundamentals/dynamics
│   │   ├── control-theory.md                       → /docs/02-robotics-fundamentals/control-theory
│   │   └── actuators-sensors.md                    → /docs/02-robotics-fundamentals/actuators-sensors
│   ├── 03-perception-systems/
│   │   ├── computer-vision.md                      → /docs/03-perception-systems/computer-vision
│   │   ├── lidar-sensors.md                        → /docs/03-perception-systems/lidar-sensors
│   │   ├── sensor-fusion.md                        → /docs/03-perception-systems/sensor-fusion
│   │   └── slam.md                                 → /docs/03-perception-systems/slam
│   ├── 04-ai-for-robotics/
│   │   ├── reinforcement-learning.md               → /docs/04-ai-for-robotics/reinforcement-learning
│   │   └── foundation-models.md                    → /docs/04-ai-for-robotics/foundation-models
│   ├── 05-humanoid-robotics/
│   │   ├── bipedal-locomotion.md                   → /docs/05-humanoid-robotics/bipedal-locomotion
│   │   └── manipulation-grasping.md                → /docs/05-humanoid-robotics/manipulation-grasping
│   └── 06-deployment-ethics/
│       └── safety-systems.md                       → /docs/06-deployment-ethics/safety-systems
├── src/
│   └── pages/
│       ├── index.tsx                               → / (homepage)
│       ├── signin.tsx                              → /signin
│       └── signup.tsx                              → /signup
├── docusaurus.config.ts
├── sidebars.ts                                     → FIXED ✅
└── package.json
```

---

## ✅ **Routes Now Working**

### Homepage Routes
- ✅ `/` → `src/pages/index.tsx` (homepage)
- ✅ `/signup` → `src/pages/signup.tsx`
- ✅ `/signin` → `src/pages/signin.tsx`

### Documentation Routes
- ✅ `/docs/intro` → `docs/intro.md`
- ✅ `/docs/01-introduction/overview` → `docs/01-introduction/overview.md`
- ✅ `/docs/02-robotics-fundamentals/kinematics` → `docs/02-robotics-fundamentals/kinematics.md`
- ✅ `/docs/03-perception-systems/computer-vision` → `docs/03-perception-systems/computer-vision.md`
- ✅ `/docs/04-ai-for-robotics/reinforcement-learning` → `docs/04-ai-for-robotics/reinforcement-learning.md`
- ✅ `/docs/05-humanoid-robotics/bipedal-locomotion` → `docs/05-humanoid-robotics/bipedal-locomotion.md`
- ✅ `/docs/06-deployment-ethics/safety-systems` → `docs/06-deployment-ethics/safety-systems.md`

---

## 🚀 **Local Development**

### 1. Clear Cache & Rebuild
```bash
cd book
npm run clear
npm install
npm start
```

### 2. Test Routes
Visit these URLs in your browser:
- http://localhost:3000/
- http://localhost:3000/docs/intro
- http://localhost:3000/docs/01-introduction/overview
- http://localhost:3000/signup
- http://localhost:3000/signin

### 3. Check for Errors
```bash
npm run build
```

This will:
- ✅ Validate all routes
- ✅ Check for broken links (with `onBrokenLinks: 'throw'`)
- ✅ Generate production build in `build/` folder

---

## 📦 **Production Build Testing**

```bash
npm run build
npm run serve
```

Visit: http://localhost:3000/

This serves the **production build** locally to verify everything works before deployment.

---

## 🌐 **GitHub Pages Deployment**

### **Option 1: Automatic Deploy via GitHub Actions**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./book
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: ./book/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build website
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./book/build

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Steps:**
1. Create file `.github/workflows/deploy.yml` in project root
2. Push to GitHub
3. Go to Settings → Pages → Source: **GitHub Actions**
4. Workflow runs automatically on push to `main`

---

### **Option 2: Manual Deploy**

```bash
cd book
npm run build

# Deploy to gh-pages branch
GIT_USER=<your-github-username> npm run deploy
```

**Set in GitHub Settings:**
- Go to Settings → Pages
- Source: **Deploy from a branch**
- Branch: **gh-pages** / **root**
- Save

---

## ⚠️ **baseUrl for GitHub Pages Project Site**

If deploying to `username.github.io/repository-name/`, update `docusaurus.config.ts`:

```typescript
url: 'https://khanzadiwazirali.github.io',
baseUrl: '/physical-ai-textbook/',  // Change this!
```

Then rebuild:
```bash
npm run clear
npm run build
```

---

## 🐛 **Troubleshooting 404 Errors**

### **Problem 1: Route gives 404**
**Solution:** Check `sidebars.ts` paths match folder names in `docs/`

Example:
```typescript
// ❌ Wrong
'introduction/overview'  → Folder is "01-introduction"

// ✅ Correct
'01-introduction/overview'
```

---

### **Problem 2: Homepage loads but `/docs` gives 404**
**Solution:** Verify `docs/intro.md` exists and is referenced in `sidebars.ts`:

```typescript
{
  type: 'doc',
  id: 'intro',  // Must match docs/intro.md
  label: '📚 Welcome',
}
```

---

### **Problem 3: Works locally but 404 on GitHub Pages**
**Solution:** Check `baseUrl` in `docusaurus.config.ts`

For project page `username.github.io/repo-name/`:
```typescript
baseUrl: '/repo-name/',  // Must include slashes!
```

For root domain `username.github.io` or custom domain:
```typescript
baseUrl: '/',
```

---

### **Problem 4: Broken internal links**
**Solution:** Use Docusaurus links, not raw markdown:

```tsx
// ❌ Wrong - may break
[Link](/docs/chapter1)

// ✅ Correct - Docusaurus validates at build time
import Link from '@docusaurus/Link';
<Link to="/docs/chapter1">Link</Link>
```

---

### **Problem 5: Case-sensitive paths on Linux/GitHub Pages**
**Solution:** Ensure consistent casing:

```
// ❌ Wrong - may work locally, fail on GitHub Pages
docs/Introduction/Overview.md  → 'introduction/overview'

// ✅ Correct - match exactly
docs/01-introduction/overview.md → '01-introduction/overview'
```

---

## 📋 **Validation Checklist**

Before deployment, run this checklist:

```bash
# 1. Clear cache
npm run clear

# 2. Fresh install
rm -rf node_modules package-lock.json
npm install

# 3. Build (this validates everything)
npm run build

# 4. Serve locally
npm run serve
```

**Manual Tests:**
- [ ] Homepage loads (/)
- [ ] Docs intro loads (/docs/intro)
- [ ] All sidebar links work
- [ ] Navbar links work (/signup, /signin)
- [ ] Footer links work
- [ ] No console errors
- [ ] Mobile view works

---

## 🔍 **Debug Mode**

Enable detailed logs:

```bash
# Development with verbose logging
npm start -- --host 0.0.0.0 --poll

# Build with detailed output
npm run build -- --no-minify
```

---

## 📚 **Key Docusaurus Concepts**

### **1. Doc IDs**
File path becomes doc ID:
```
docs/01-introduction/overview.md  →  ID: '01-introduction/overview'
docs/intro.md                     →  ID: 'intro'
```

### **2. Sidebar Reference**
Sidebar must use correct doc IDs:
```typescript
items: ['01-introduction/overview']  // Must match file path
```

### **3. Route Generation**
Docusaurus auto-generates routes:
```
File: docs/01-introduction/overview.md
Route: /docs/01-introduction/overview
```

---

## 🎯 **Summary of Fixes**

| Issue | Before | After | Status |
|-------|--------|-------|--------|
| Sidebar paths | `introduction/overview` | `01-introduction/overview` | ✅ Fixed |
| Missing modules | 3 modules | 6 modules | ✅ Fixed |
| baseUrl clarity | Unclear | Documented | ✅ Documented |
| Route validation | None | Build validates | ✅ Automated |

---

## 🚨 **Common Mistakes to Avoid**

1. ❌ **Don't** use absolute paths in markdown: `/docs/page`
2. ❌ **Don't** mismatch folder names with sidebar IDs
3. ❌ **Don't** forget slashes in `baseUrl`: `/repo-name/`
4. ❌ **Don't** use mixed case in doc IDs (stick to lowercase with hyphens)
5. ❌ **Don't** skip `npm run build` before deploying

---

## ✅ **Next Steps**

1. **Test locally:**
   ```bash
   npm run clear && npm start
   ```

2. **Build for production:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   - Push to GitHub (auto-deploys via Actions)
   - OR: `npm run deploy` (manual)

4. **Verify deployment:**
   - Visit your GitHub Pages URL
   - Test all routes
   - Check mobile view

---

## 📞 **Still Have Issues?**

Run this diagnostic:

```bash
cd book
npm run clear
npm install
npm run build 2>&1 | tee build.log
```

Check `build.log` for:
- Broken links
- Missing files
- Path mismatches
- Build errors

---

**Document Version:** 1.0
**Last Updated:** 2025-12-29
**Status:** Production Ready ✅
