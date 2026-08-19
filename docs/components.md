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

Single-column list. Rows carry no rules of their own — the ruled
section header above the grid is the only divider.

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

## Skate game (home page)

A small playable scene between the introduction and What I Do,
picking up the last line of the copy above it. Static
until clicked; logic in `scripts/skate.js`, no dependencies.

```html
<div class="skate" data-skate tabindex="0" role="button" aria-label="…">
  <svg class="skate-svg" viewBox="0 0 900 160" aria-hidden="true">
    <line class="skate-ground"></line>
    <g class="skate-obstacles"></g>       <!-- filled at runtime -->
    <g class="skate-skater">
      <g class="skate-deck">…board + wheels…</g>
      <g class="skate-figure">…5 limb paths + head…</g>
    </g>
  </svg>
  <span class="skate-score" aria-hidden="true">
    <span class="skate-best"></span><span class="skate-time"></span>
  </span>
  <span class="skate-hint" aria-hidden="true">
    <svg class="skate-hint-icon">…</svg><span class="skate-hint-text"></span>
  </span>
</div>
```

The script drives everything through two state classes on the root:
`.is-playing` and `.is-over`.

| Class | State | Hint |
| --- | --- | --- |
| *(none)* | idle, never played | "Click to play", 8px above the line |
| `.is-playing` | running | hidden |
| `.is-over` | crashed, scene frozen | icon + "Restart", raised clear of frozen obstacles |

### Coordinate space

The SVG viewBox is resized to the element's own pixel dimensions on
load and on resize, so **one SVG unit is always one CSS pixel** and
nothing scales unexpectedly between breakpoints. The ground sits
`--skate-ground-offset` (80px) up from the bottom edge; that custom
property is mirrored by `GROUND_Y` in the script, and the hint's
`bottom` is derived from it. Change it in both places or neither.

That offset is larger than the line needs. The band below the ground
is dead space by design: nothing ever moves through it, so it is the
safest place for a thumb to land. The block carries no bottom margin —
the tap room *is* the spacing.

### The skater

Eleven joints — hip, shoulder, head, two knees, two feet, two elbows,
two hands — in a local space whose origin is the board's contact
point, y negative upwards. Five poses (`roll`, `takeoff`, `air`,
`land`, `grind`) are arrays of those joints; each frame the live pose eases
toward whichever the state asks for and five `d` attributes are
rewritten. There are no animation frames — the interpolated in-between
poses *are* the animation. `roll` doubles as the idle pose so the
resting graphic already reads as someone cruising.

Takeoff is deliberately brief: the jump impulse is applied instantly on
click (delaying it for real anticipation costs more in input lag than
the pose is worth), so the compressed pose blends out over the first
100ms of the rise instead.

The landing pose is armed only by a *real descent* — the frame the
board goes from airborne to resting. Resting on a surface re-enters
the same branch of the physics every frame, so an unguarded check
holds the landing crouch forever and the rolling pose never returns.

### Obstacles

Nine line-icon silhouettes in the `SHAPES` table, one `<path>` each,
weighted so simple shapes turn up most and stacked boxes stay rare.
Heights are authored against a 28-unit tallest shape and scaled by a
single factor derived from the jump apex, so **every obstacle stays
clearable at every screen size**. Organic shapes (bush, rock) declare
an `inset` that shrinks their hitbox — a strict bounding box around a
soft silhouette punishes players for air they visually cleared.

### Benches

One shape — the long bench — carries `ride: true`, and it is the only
one you are not meant to clear. Its top is a **temporary elevated
floor**: land on it, roll across, drop off the end.

The physics did not grow a special case for it. Every frame resolves a
single `support` height — 0 on open ground, the bench top while the
board is over one — and the existing gravity step lands on `support`
instead of on zero. Everything downstream reads `airborne`
(`y > support`) rather than `y > 0`, so jumping, the board tilt, the
bob and the pose all behave identically eight pixels up.

A bench is solid from above and lethal from the side, and the same
pass decides which:

| At the moment of overlap | Result |
| --- | --- |
| Board was clear of the top when the frame began | Lands, `support` becomes the bench top |
| Board is at deck height | Crash — that is the end face |

Testing against the position at the *start* of the frame is what makes
a fast descent land rather than clip through, while still failing an
approach that never left the ground. **Timing the jump is the whole
interaction** — jump late and you hit the end face.

Two knock-on constraints, both easy to break by accident:

- Jumps also start from a bench top, so `resize()` subtracts the bench
  height from the headroom clamp a second time. Without it a hop taken
  on a bench clips the ceiling.
- Spawn gaps are measured from the *trailing* edge of the obstacle just
  placed, not its origin. A 220-unit bench is wider than the old gap,
  so the next obstacle used to land on top of it.

Benches are held back for the first six seconds of a run: they ask for
timing rather than reflex, and they read better once the player has
met a few ordinary obstacles.

While riding, the figure takes the `grind` pose — hips dropped, knees
wider, arms floated up — and a slow `sway` rotates the whole figure by
just over a degree. Both are subtle on purpose; the point is to read
as balancing, not as a different character.

### Sizing and difficulty

Both derive from the box, not from constants:

- Jump apex is clamped to the headroom actually available, so a jump
  can never clip out of a short box.
- Obstacle scale follows the apex.
- The bench height is then subtracted from the headroom a second time,
  because a jump can start from a bench top as well as the ground.
- Speed scales down on narrow screens, where the runway gives less
  warning.

The box is 208px tall, 188px below 768px — of which the bottom 80px is
tap room, leaving the same play area as before. **Making it shorter
lowers the jump, which shrinks the obstacles** — it is a gameplay
change, not just a layout one. Trim the ground offset instead if you
only want the block to take less room.

### Score

Distance-based like the Chrome dinosaur game (~10 points/second at the
starting speed, accelerating with it), not wall-clock seconds. The best
score persists in `localStorage` under `skate-best`, wrapped in
try/catch on both read and write — Safari private mode throws on write,
where the game still plays and just doesn't remember.

Both numbers are zero-padded to five digits by `pad()`. That width is
cosmetic rather than structural: at the current rate the counter only
reaches five digits after roughly ten minutes of play. Changing
`SCORE_RATE` to make the digits arrive sooner would re-scale every
stored high score, which players would read as their record being
wiped.

### Accessibility & motion

Focusable with space/enter parity, `:focus-visible` outline, and all
visual text `aria-hidden` behind the root's `aria-label`. Under
`prefers-reduced-motion` the body bob and the bench sway are both
suppressed and the idle hint is hidden, leaving a static graphic that
is still playable on click.
Hidden entirely in print.

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
