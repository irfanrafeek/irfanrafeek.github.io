# 🚀 GitHub Repository Setup Guide

Follow these steps to create and deploy your new portfolio website with the design system.

---

## Step 1: Create New Repository on GitHub

### Option A: Using GitHub Web
1. Go to https://github.com/new
2. **Repository name**: `portfolio-design-system` (or your preferred name)
3. **Description**: "Professional portfolio with W3C-compliant design system and dark mode"
4. **Public** (so it's visible)
5. **Don't initialize** with README (we have our own)
6. Click **Create repository**

### Option B: Using GitHub CLI
```bash
gh repo create portfolio-design-system --public --source=. --remote=origin --push
```

---

## Step 2: Prepare Your Files Locally

### Create a new folder
```bash
mkdir portfolio-design-system
cd portfolio-design-system
```

### Copy all files from `/mnt/user-data/outputs/`
You need:
- ✅ `index.html` (main website with all CSS embedded)
- ✅ `tokens.css` (reference file)
- ✅ `components.css` (reference file)
- ✅ `README.md` (use NEW_REPO_README.md and rename it)
- ✅ `.gitignore` (already created)
- ✅ Optional: `DESIGN_SYSTEM.md`, `QUICK_REFERENCE.md` (documentation)

---

## Step 3: Initialize Git

### In your local folder:
```bash
git init
git add .
git commit -m "Initial commit: Portfolio with design system"
```

---

## Step 4: Connect to GitHub

### Add remote
```bash
git remote add origin https://github.com/YOUR_USERNAME/portfolio-design-system.git
```

### Push to GitHub
```bash
git branch -M main
git push -u origin main
```

---

## Step 5: Enable GitHub Pages

### Via GitHub Web Interface
1. Go to your repository: `github.com/YOUR_USERNAME/portfolio-design-system`
2. Click **Settings** (top right)
3. In sidebar, click **Pages**
4. Under "Build and deployment":
   - **Source**: Select "Deploy from a branch"
   - **Branch**: Select `main`
   - **Folder**: Select `/ (root)`
5. Click **Save**

### Your site is now live at:
```
https://YOUR_USERNAME.github.io/portfolio-design-system
```

---

## Step 6: Verify Deployment

1. Wait 1-2 minutes for GitHub Pages to build
2. Visit `https://YOUR_USERNAME.github.io/portfolio-design-system`
3. You should see your portfolio website!

### Test dark mode
- Click 🌙 button (bottom right)
- Try system preference (DevTools → ⌘+Shift+P → "Dark mode")

---

## Step 7: Customize (Optional)

### Change site title
In `index.html`, line 6:
```html
<title>Irfan Rafeek — Product Designer</title>
```

### Change colors
In `index.html`, inside `<style>`:
```css
:root {
  --primitive-color-accent-500: #YOUR_COLOR;
}
```

### Update content
Replace the text in various sections with your own content.

### Commit changes
```bash
git add .
git commit -m "Customize: Update colors and content"
git push
```

---

## Complete File Checklist

### Essential Files
```
portfolio-design-system/
├── index.html              ✅ Main website (everything in one file)
├── .gitignore              ✅ Git ignore patterns
└── README.md               ✅ Repository documentation
```

### Optional Reference Files (for documentation)
```
├── tokens.css              📚 Token definitions (reference)
├── components.css          📚 Component definitions (reference)
├── DESIGN_SYSTEM.md        📚 Comprehensive guide
└── QUICK_REFERENCE.md      📚 Quick lookup
```

---

## Useful Commands

### Test locally
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server

# Visit: http://localhost:8000
```

### View changes
```bash
git status
git diff
```

### Make changes
```bash
git add .
git commit -m "Your message here"
git push
```

### View GitHub Pages status
1. Go to your repo
2. Click "🔧 Deployments" (right sidebar)
3. Or check Settings → Pages for deployment status

---

## Troubleshooting

### Site not showing up?
- [ ] Wait 2-3 minutes for GitHub Pages to build
- [ ] Check Settings → Pages is enabled
- [ ] Check "Actions" tab to see if deployment succeeded
- [ ] Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

### Styles look wrong?
- [ ] All CSS must be in `index.html` `<style>` tag
- [ ] Don't use external CSS files unless linked properly
- [ ] Check browser console for errors (F12)

### Dark mode not working?
- [ ] Check 🌙 button is clickable (bottom right)
- [ ] Browser JavaScript must be enabled
- [ ] Try in incognito/private mode
- [ ] Check localStorage: `localStorage.getItem('theme')`

### Domain issues?
Your site will be at: `https://YOUR_USERNAME.github.io/REPO_NAME`

If you want custom domain:
1. Settings → Pages → Custom domain
2. Add your domain
3. Update DNS records (GitHub will provide instructions)

---

## Directory Structure After Setup

```
portfolio-design-system/
│
├── .git/                   # Git history
├── .github/                # GitHub configuration
│   └── workflows/          # (Optional) CI/CD
│
├── index.html              # Your website ⭐
├── .gitignore              # What to ignore in Git
├── README.md               # Repository readme
│
├── tokens.css              # Reference (optional)
├── components.css          # Reference (optional)
├── DESIGN_SYSTEM.md        # Docs (optional)
├── QUICK_REFERENCE.md      # Docs (optional)
│
└── LICENSE                 # MIT License (optional)
```

---

## Next Steps

### After deploying:
1. ✅ Test the website at GitHub Pages URL
2. ✅ Test light and dark modes
3. ✅ Test on mobile
4. ✅ Share your portfolio!

### Optional enhancements:
- [ ] Add custom domain
- [ ] Set up GitHub Actions for CI/CD
- [ ] Add more sections to your portfolio
- [ ] Create additional pages (blog, case studies, etc.)
- [ ] Add analytics

---

## Example: Complete Setup in 5 Minutes

```bash
# 1. Create folder
mkdir portfolio-design-system
cd portfolio-design-system

# 2. Copy files
cp /path/to/index.html .
cp /path/to/.gitignore .
cp /path/to/README.md .
# ... copy other optional files

# 3. Initialize Git
git init
git add .
git commit -m "Initial commit: Portfolio with design system"

# 4. Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/portfolio-design-system.git
git branch -M main
git push -u origin main

# 5. Enable GitHub Pages in Settings
# Then visit: https://YOUR_USERNAME.github.io/portfolio-design-system

# Done! 🎉
```

---

## Support & Resources

**GitHub Pages Documentation:**
https://docs.github.com/en/pages

**Git & GitHub Guides:**
https://guides.github.com

**W3C Design Tokens:**
https://design-tokens.github.io/community-group/

**CSS Custom Properties:**
https://developer.mozilla.org/en-US/docs/Web/CSS/--*

---

## Questions?

If something goes wrong:
1. Check the GitHub Pages deployment status (Deployments tab)
2. Look at the Actions tab for build errors
3. Check browser console for JavaScript errors (F12)
4. Ensure index.html is at root of repository
5. Make sure all CSS is embedded in `<style>` tag

---

**Your portfolio with a professional design system is now live! 🚀**

Share it with employers, clients, and the world!
