# Irfan Rafeek Portfolio — Design System Edition

A professional portfolio website built with a **W3C-compliant design system**, featuring dark mode support, semantic tokens, and reusable components.

🌐 **Live**: Coming soon!  
📚 **Design System**: Production-ready, zero dependencies  
🎨 **Design**: Clean editorial aesthetic with serif typography  

---

## ✨ Features

### 🎨 Design System
- **W3C DTCG Compliant** tokens (Primitives + Semantic)
- **45+ primitive tokens** (colors, spacing, typography, shadows)
- **17+ semantic tokens** with light & dark mode support
- **8+ reusable components** (Button, Text, Card, Grid, Flex, etc.)
- **50+ utility classes** for rapid development

### 🌙 Dark Mode
- ✅ Automatic system preference detection (`prefers-color-scheme`)
- ✅ Manual toggle button (🌙 in bottom right)
- ✅ Theme persistence (localStorage)
- ✅ All components automatically theme-aware

### 📱 Responsive Design
- Desktop, tablet, and mobile optimized
- Clean breakpoints (1200px, 768px)
- Optimized typography scaling
- Touch-friendly interactions

### ⚡ Performance
- Zero external dependencies
- All CSS embedded (~1,100 lines)
- Lightweight and fast
- WCAG AA accessible

---

## 📁 File Structure

```
portfolio-design-system/
├── index.html              # Complete website (all CSS embedded)
├── tokens.css              # Design tokens (reference)
├── components.css          # Reusable components (reference)
├── README.md               # This file
├── DESIGN_SYSTEM.md        # Comprehensive token documentation
├── QUICK_REFERENCE.md      # Quick lookup guide
├── .gitignore              # Git ignore file
└── LICENSE                 # MIT License
```

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/portfolio-design-system.git
cd portfolio-design-system
```

### 2. Open Locally
```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npx http-server
```

Then visit: `http://localhost:8000`

### 3. Deploy to GitHub Pages

**Option A: Direct Upload**
1. Go to repository Settings → Pages
2. Source: `main` branch, `/ (root)`
3. Save
4. Your site will be live at: `https://yourusername.github.io/portfolio-design-system`

**Option B: GitHub Actions**
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

---

## 🎨 Design System Overview

### Tier 1: Primitives (45 tokens)

**Colors (30)**
```css
--primitive-color-neutral-0 through 1000  /* Neutral scale */
--primitive-color-accent-50 through 800   /* Orange palette */
--primitive-color-success/error/warning   /* Status colors */
```

**Spacing (9)**
```css
--primitive-spacing-xs: 4px
--primitive-spacing-sm: 8px
--primitive-spacing-md: 16px
--primitive-spacing-lg: 24px
--primitive-spacing-xl: 32px
--primitive-spacing-2xl: 48px
--primitive-spacing-3xl: 64px
--primitive-spacing-4xl: 80px
```

**Typography**
```css
--primitive-font-serif: 'EB Garamond'
--primitive-font-sans: 'Inter'
--primitive-font-size-xs through 5xl
--primitive-font-weight-regular through extrabold
```

### Tier 2: Semantics (17+ tokens × 2 modes)

**Light Mode**
```css
--semantic-color-background-primary: #f8f8f6 (cream)
--semantic-color-text-primary: #1a1a1a (dark)
--semantic-color-interactive-primary: #ff6b47 (orange)
--semantic-color-border-primary: #e8e8e5
```

**Dark Mode**
```css
--semantic-color-background-primary: #1a1a1a
--semantic-color-text-primary: #ffffff
--semantic-color-interactive-primary: #ffa57f
--semantic-color-border-primary: #444444
```

---

## 🧩 Using Components

### Button
```html
<button class="button">Click Me</button>
<button class="button secondary">Secondary</button>
<button class="button ghost">Ghost</button>
```

### Headings
```html
<h1 class="heading-1">Heading 1</h1>
<h2 class="heading-2">Heading 2</h2>
<h3 class="heading-3">Heading 3</h3>
```

### Text
```html
<p class="text-primary">Primary text</p>
<p class="text-secondary">Secondary text</p>
<p class="text-tertiary">Tertiary text</p>
```

### Grid
```html
<div class="grid cols-3">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Flex
```html
<div class="flex between">
  <span>Left</span>
  <span>Right</span>
</div>
```

---

## 🌙 Dark Mode Usage

### Automatic (System Preference)
Browser respects `prefers-color-scheme: dark` automatically.

### Manual Toggle
Click the 🌙 button (bottom right corner) to switch themes. Preference saves to localStorage.

### JavaScript Control
```javascript
// Enable dark mode
document.documentElement.setAttribute('data-theme', 'dark');

// Disable dark mode
document.documentElement.removeAttribute('data-theme');
```

---

## 📚 Documentation

### Complete Guides
- **DESIGN_SYSTEM.md** — Comprehensive implementation guide
- **QUICK_REFERENCE.md** — Quick lookup and cheat sheet

### Key Sections
- Token architecture and naming conventions
- Component documentation with examples
- Customization guide
- Best practices and patterns
- Responsive design guidelines

---

## 🎯 Customization

### Change Colors
Edit `index.html` `<style>` section:
```css
:root {
  --primitive-color-accent-500: #FF6B47; /* Change to your color */
}
```

All components automatically use the new color!

### Add New Token
```css
:root {
  --semantic-spacing-5xl: 100px;
}
```

### Create New Component
```css
.my-component {
  padding: var(--semantic-spacing-lg);
  background: var(--semantic-color-background-primary);
  color: var(--semantic-color-text-primary);
  border-radius: var(--semantic-radius-md);
}
```

---

## 📊 What's Included

```
Design System:
├── Primitive Tokens:     45 total
│   ├── Colors:          30
│   ├── Spacing:          9
│   ├── Radius:           6
│   └── Other:           ~60 (typography, shadows, etc.)
├── Semantic Tokens:      17+ (× 2 modes)
├── Components:           8+
└── Utilities:           50+

Website:
├── Responsive Layout
├── Navigation
├── Hero Section
├── Category Tags (with orange dots)
├── What I Do Section
├── Selected Work
├── CTA Section
└── Footer
```

---

## 🔍 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

Requires:
- CSS custom properties support
- `prefers-color-scheme` media query support
- Modern JavaScript (ES6)

---

## 🎓 Key Concepts

### W3C Design Tokens DTCG
This design system follows the Design Tokens Community Group format, making it portable to other tools (Figma, Storybook, etc.) and exportable to JSON, SCSS, or JavaScript.

### Semantic Tokens
Intent-based aliases (like `text-primary` instead of `neutral-900`) make the system intuitive and allow easy theme switching.

### Two-Tier Architecture
Primitives provide raw values, semantics add meaning. This separation allows powerful theming while maintaining consistency.

---

## 📝 Contributing

To improve this design system:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Make your changes
4. Test thoroughly in light and dark modes
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see LICENSE file for details.

---

## 🤝 Contact

**Irfan Rafeek**  
📧 dizeno.ir@gmail.com  
🔗 LinkedIn: linkedin.com/in/irfan-rafeek-70246455  
📸 Instagram: instagram.com/irfanrafeek  

---

## ✅ Checklist for New Repository

- [ ] Create new GitHub repository
- [ ] Clone locally
- [ ] Copy all files from this folder
- [ ] Update README.md with your info
- [ ] Customize colors (if desired)
- [ ] Test locally
- [ ] Deploy to GitHub Pages
- [ ] Test live site in light and dark modes
- [ ] Share your portfolio!

---

**Built with ❤️ using a production-ready design system**
