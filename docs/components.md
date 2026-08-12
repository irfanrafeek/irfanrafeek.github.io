# CSS Components

All component CSS lives in `components.css`. Every rule consumes
semantic tokens (`var(--semantic-…)`) — see [tokens.md](./tokens.md).

## Layout primitives

### `.container` / `.container--narrow`

Centered max-width wrapper with horizontal padding.

```html
<main>
  <div class="container">
    <!-- default: max-width 1200, padded -->
  </div>

  <div class="container container--narrow">
    <!-- narrow: max-width 1000 (used on the about page) -->
  </div>
</main>
```

### `nav#navbar` + `.nav-links`

Fixed top navigation with logo, link list, and theme switcher.

```html
<nav id="navbar">
  <a href="index.html" class="logo">
    <img src="Assets/Thumbnail_irfan.jpg" alt="" class="logo-thumb">
    IRFAN RAFEEK
  </a>

  <ul class="nav-links" id="navLinks">
    <li><a href="work.html">Projects</a></li>
    <li><a href="writings.html">Writing</a></li>
    <li><a href="index.html#services">Expertise</a></li>
    <li><a href="about.html">About</a></li>
    <li><a href="index.html#contact" class="cta-button">Work With Me</a></li>
  </ul>

  <button class="nav-toggle" id="navToggle" …>…</button>
</nav>
```

Mobile (≤640px): the `.nav-links` collapse into a hamburger drawer.
`scripts/nav.js` handles the open/close.

`.cta-button` is an outline button modifier — used in the navbar for
"Work With Me" and the call-to-action surface (`.cta-section`).

### `.page-eyebrow`

Small uppercase label above a page hero (used on About and Writings).

```html
<div class="page-eyebrow">My Journey</div>
```

---

## Hero & section headers

### `.hero` + `.hero-title` + `.hero-description`

```html
<section class="hero">
  <h1 class="hero-title">
    I design <span class="underline">scalable products</span>…<span class="accent-dot">.</span>
  </h1>
  <p class="hero-description">Nine years of product design…</p>
</section>
```

- `.underline` adds an accent underline to a span.
- `.accent-dot` colours the trailing period with the brand accent.

### `.section-header` + `.section-title` + `.section-number`

```html
<div class="section-header">
  <div>
    <div class="section-number">01</div>
    <h2 class="section-title">What I Do</h2>
  </div>
  <a href="work.html" class="view-all">All work</a>
</div>
```

---

## Category strip

```html
<div class="category-scroll">
  <div class="category-tag">Product Design</div>
  <div class="category-tag">Design Systems</div>
  …
</div>
```

Tags are separated by accent-colour bullet points via `::after` CSS.

---

## Project / writing cards

### Renderer

```html
<!-- All projects -->
<div class="projects-grid" data-projects></div>

<!-- Featured only (homepage) -->
<div class="projects-grid" data-projects="featured"></div>

<!-- Custom source -->
<div class="projects-grid"
     data-projects
     data-source="writings.json"
     data-target="/writing"></div>
```

The `scripts/projects.js` renderer:

- Reads `data-source` (default `projects.json`) — this selects the Sanity
  document *type*, it does not fetch the JSON file. See "Where content
  actually comes from" in [README](./README.md).
- Reads `data-target` (default `/case`) — used as the card link target.
- If `data-projects="featured"`, filters to `featured: true` items.

`.projects-grid` is a **single column** at every width — cards render
full-bleed, stacked. This is shared by the homepage, Projects, and Writing
pages, so changing it changes all three.

### Card markup (produced by the renderer)

```html
<a class="project-card" href="case.html?slug=…">
  <div class="project-image"><img src="Assets/…" alt="" loading="lazy"></div>
  <div class="project-content">
    <div class="project-meta">
      <h3 class="project-title">…</h3>
      <span class="project-year">2026</span>
    </div>
    <p class="project-description">…</p>
    <div class="project-tags">
      <span class="tag">design systems</span>
      …
    </div>
  </div>
</a>
```

---

## Services grid

```html
<div class="services-grid">
  <div class="service">
    <h3 class="service-title">Product design</h3>
    <p class="service-description">…</p>
  </div>
  …
</div>
```

2-column grid, stacked below 968px.

---

## About-me block (about page)

```html
<div class="about-me-grid">
  <div class="about-me-content">
    <h3 class="about-me-title">Get to Know Me</h3>
    <p class="about-me-text">…</p>
    <p class="about-me-text">…</p>
  </div>
  <div class="about-me-media">
    <img src="Assets/About_me.gif" alt="" class="about-me-image">
  </div>
</div>
```

---

## Case-study / writing article

`case.html` and `writing.html` use a shared renderer (`scripts/case.js`).

### Page chrome

```html
<body class="page--article">
  <!-- white reading surface from --semantic-color-background-article -->
  …
  <main>
    <div class="container container--narrow">
      <article class="case-study"
               data-case
               data-source="projects.json"
               data-back="work.html"
               data-back-label="All work"
               data-kind="Case study"></article>
    </div>
  </main>
</body>
```

`data-*` attributes (all optional):

- `data-source` — JSON file (default `projects.json`)
- `data-back` — where the back link goes (default `work.html`)
- `data-back-label` — visible back-link text (default "All work")
- `data-kind` — used in the not-found state (default "Case study")

`case.html` uses defaults; `writing.html` overrides them for writings.json.

### Header (produced by the renderer)

```html
<header class="case-header">
  <a href="work.html" class="case-back">← All work</a>
  <div class="case-meta">
    <h1 class="case-title">Building Ambo</h1>
    <span class="project-year">2026</span>
  </div>
  <p class="case-summary">Transforming an early-stage…</p>
  <div class="project-tags">…</div>
</header>
```

### Body block types

The article body is built from typed blocks in JSON. The renderer
generates the markup below.

| Block type | Class | Notes |
| --- | --- | --- |
| `heading` | `.case-heading` (`<h2>`) | Section title |
| `paragraph` | `.case-paragraph` | Body text |
| `image` | `.case-figure` → `.case-image` + optional `.case-caption` | Lazy-loaded |
| `list` | `.case-list` (`<ul>`) + `.case-list-item` | Bulleted list with accent marker |
| `numbered_list` | `.case-list.case-list--ordered` (`<ol>`) | Same as list, ordered |
| `gallery` | `.case-gallery` carousel | Has track/items + prev/next + counter |
| `quote` | `.case-quote` (`<blockquote>`) + `.case-cite` | Pull-quote with left rule |
| `video` | `.case-figure` → `.case-video` + caption | `<video controls>` |
| `embed` | `.case-figure` → `.case-embed > .case-embed__frame` (`<iframe>`) | 16:9 wrapper |

### Reading width

`.case-study` is constrained to **736px** by
`--semantic-layout-container-max-width-reading`. Don't change it on the
component — change the token.

### Article-scoped typography

Inside `.case-study`, type uses the **article reading scale** tokens
(`--semantic-type-article-…`) which are larger and looser than general
body type. These automatically step down at `≤968px` viewports.

---

## Call-to-action surface

```html
<section id="contact" class="cta-section">
  <div class="cta-label">GET IN TOUCH</div>
  <h2 class="cta-title">Have a project that deserves the time?</h2>
  <a href="mailto:dizeno.ir@gmail.com" class="cta-email">dizeno.ir@gmail.com</a>
</section>
```

Centred block with top + bottom borders.

---

## Footer

```html
<footer>
  <div class="copyright">© 2024 Irfan Rafeek. All rights reserved.</div>
  <div class="social-links">
    <a href="…">LinkedIn</a>
    <a href="…">Instagram</a>
    <a href="…">Email</a>
  </div>
</footer>
```

---

## Theme switcher

Fixed bottom-right pill that expands on hover/focus. Wired by `scripts/theme.js`.

```html
<div class="theme-switcher" id="themeSwitcher" role="group" aria-label="Color theme">
  <button class="theme-switcher__option" type="button" data-theme-value="light"
          aria-label="Light theme">…sun svg…</button>
  <button class="theme-switcher__option" type="button" data-theme-value="sepia"
          aria-label="Editorial theme">…book svg…</button>
  <button class="theme-switcher__option" type="button" data-theme-value="slate"
          aria-label="Code theme">…&lt;&gt; svg…</button>
  <button class="theme-switcher__option" type="button" data-theme-value="dark"
          aria-label="Dark theme">…moon svg…</button>
</div>
```

See [themes.md](./themes.md) for how it persists and applies the choice.

---

## Adding a new component

1. **Define the markup** in HTML (or in `scripts/case.js` if it's an
   article block).
2. **Add CSS** to `components.css` under a clearly named section.
3. **Reference semantic tokens** for every colour, spacing, radius,
   font, shadow. No hex codes, no pixel literals (except in
   `@media` widths, which target the viewport not a token).
4. **Add a section in this file** documenting the markup + behavior.
5. **Mirror in Figma** if it's a reusable component — add to the
   "Components" page following the Project Card / CTA Button pattern.
