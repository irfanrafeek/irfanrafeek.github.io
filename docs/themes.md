# Theming

Four themes — **Light**, **Dark**, **Editorial** (data-theme = `sepia`),
**Code** (data-theme = `slate`) — share the same component layer.

## How it works

1. Each theme is a `[data-theme='…']` block in `tokens.css` that
   **redefines a small set of semantic tokens** — colors, fonts,
   line-height, letter-spacing.
2. Components never know about themes; they always read semantic tokens.
   When the active theme changes, semantic tokens resolve differently
   and components retint automatically.
3. The active theme is set by the `data-theme` attribute on `<html>`,
   driven by `scripts/theme.js`.

```
                    Components (.case-paragraph, .hero-title, …)
                          │  read var(--semantic-…)
                          ▼
:root  ─────────► Semantic tokens ─────► Primitives
                          ▲
                          │  override
        [data-theme='sepia'] / [data-theme='slate'] / …
```

## The four themes

| Theme | data-theme | Display font | Body font | Surface |
| --- | --- | --- | --- | --- |
| **Light** | (none / default) | Merriweather | Inter | warm off-white |
| **Dark** | `dark` | Merriweather | Inter | near-black |
| **Editorial** | `sepia` | Fraunces | Source Serif 4 | cream paper |
| **Code** | `slate` | JetBrains Mono | JetBrains Mono | cool dim |

Plus body rhythm:
- Light/Dark → line-height **1.6 relaxed**, letter-spacing normal
- Editorial → **1.8 loose**, normal
- Code → **1.25 snug**, tight (-0.02em)

And motion — a theme carries its own *feel*, not just its look:
- Light/Dark → **120ms**, `ease-standard` — neutral, precise
- Editorial → **200ms**, `ease-soft` — calm, gentle settle
- Code → **80ms**, `linear` — mechanical, reads as switched rather than animated

Dark deliberately shares Light's motion: it's a colour mode, not a separate
personality. See [tokens.md → Motion](./tokens.md#motion) for the full scale
and the rules for extending it.

## What a theme block looks like

```css
/* tokens.css */
[data-theme='sepia'] {
  /* Surface colours redirect to the sepia ramp */
  --semantic-color-background-primary:   var(--primitive-color-sepia-50);
  --semantic-color-background-article:   var(--primitive-color-sepia-0);
  --semantic-color-text-primary:         var(--primitive-color-sepia-900);
  …

  /* Typography intent — Fraunces + Source Serif 4 */
  --semantic-font-display:               var(--primitive-font-fraunces);
  --semantic-font-body:                  var(--primitive-font-source-serif);

  /* Body rhythm — loose for editorial */
  --semantic-type-body-base-line-height: var(--primitive-line-height-loose);
}
```

Only **semantic** tokens get overridden in a theme block. Primitives are
never modified per theme — that would change them for every theme.

## Who applies the theme?

`scripts/theme.js` does the work:

1. **On page load**, reads `localStorage.theme`. If it's one of
   `light | dark | sepia | slate`, sets `data-theme="…"` on `<html>`.
2. **First-time visitors** with no saved preference fall through to the
   default. The `@media (prefers-color-scheme: dark)` block in
   `tokens.css` ensures they get dark surfaces if their OS is dark.
3. **When the user clicks** a `.theme-switcher__option`, the script
   saves to `localStorage.theme` and sets `data-theme` — applied
   immediately because every semantic token is a CSS custom property
   that re-resolves on attribute change.

```js
// scripts/theme.js (simplified)
const VALID = ['light', 'sepia', 'slate', 'dark'];
const stored = localStorage.getItem('theme');
if (VALID.includes(stored)) {
  document.documentElement.setAttribute('data-theme', stored);
}
```

## Article surface (`body.page--article`)

Case-study and writing pages add the `page--article` class to `<body>`:

```css
body.page--article {
  background-color: var(--semantic-color-background-article);
}
```

`color/background/article` is a separate semantic token from
`color/background/primary` so article pages can have a distinct
"reading surface" (e.g. pure white in Light, cream in Editorial,
deep dark in Code) without changing the navbar/footer surface.

The navbar deliberately stays on `color/background/primary` so it reads
as distinct chrome over the article.

---

## Adding a new theme

Say you want a 5th theme called `mint`:

### 1. (Optional) Add a new primitive ramp

If your theme uses colors that aren't already in the system, add a new
ramp in the **Primitives** section of `tokens.css`:

```css
:root {
  …
  /* TIER 1: PRIMITIVES - COLOR MINT */
  --primitive-color-mint-50:  #f0fdf4;
  --primitive-color-mint-100: #dcfce7;
  --primitive-color-mint-300: #86efac;
  --primitive-color-mint-600: #16a34a;
  --primitive-color-mint-900: #14532d;
}
```

### 2. Add a theme block at the bottom of `tokens.css`

```css
[data-theme='mint'] {
  --semantic-color-background-primary: var(--primitive-color-mint-50);
  --semantic-color-background-article: var(--primitive-color-mint-50);
  --semantic-color-text-primary:       var(--primitive-color-mint-900);
  --semantic-color-text-secondary:     var(--primitive-color-mint-600);
  --semantic-color-border-primary:     var(--primitive-color-mint-100);
  --semantic-color-interactive-primary: var(--primitive-color-mint-600);
  /* …override anything else that should change… */

  /* Typography (optional) */
  --semantic-font-display: var(--primitive-font-fraunces);

  /* Body rhythm (optional) */
  --semantic-type-body-base-line-height: var(--primitive-line-height-relaxed);
}
```

### 3. Add a button to the theme switcher (in all 6 HTML pages)

```html
<button class="theme-switcher__option" type="button"
        data-theme-value="mint"
        aria-label="Mint theme" title="Mint">
  <svg …>…icon…</svg>
</button>
```

### 4. Allow-list it in `scripts/theme.js`

```js
const VALID = ['light', 'sepia', 'slate', 'dark', 'mint'];
```

### 5. (If applicable) Load any fonts the theme needs

Add families to the Google Fonts URL in all 6 HTML pages.

### 6. Mirror in Figma

Add the new primitives + a new mode in the Semantic collection, then
fill in mode values for every semantic color and font intent variable.

---

## In Figma

Figma mirrors the runtime system via Variable Collections + Modes.

- **Primitives collection** — one mode ("Value"), holds the same raw
  values as the CSS primitives.
- **Semantic collection** — four modes (Light, Dark, Sepia, Slate).
  Switching the mode on a frame replays the theme — colours and
  typography update together because text styles bind their
  `fontFamily` to the `font/display` / `font/body` / `font/eyebrow`
  intent variables.

**To preview a theme on a frame:**

1. Select the frame.
2. Right-hand panel → top → Variables / Mode dropdown.
3. Switch among the four modes — the frame retints.

See the Figma file linked from your project's CMS-setup memory.

---

## Gotchas

- **Don't override primitives per theme.** Override semantic tokens
  only. Primitives are shared across all themes.
- **Don't use `--semantic-font-serif` / `--semantic-font-sans` in
  component CSS** — those are family-type aliases that are *not*
  theme-driven. Use `--semantic-font-display`, `--semantic-font-body`,
  or `--semantic-font-eyebrow` instead.
- **The Claude Preview headless renderer doesn't recompute CSS
  `var()` on runtime `data-theme` changes.** When developing locally,
  always do a full page reload (set `localStorage.theme` and refresh)
  rather than toggling the attribute live. Real browsers do this
  correctly — the switcher works for users.
- **Inter, Fraunces, Source Serif 4 and JetBrains Mono are loaded
  from Google Fonts in every page's `<head>`.** If you remove a font
  used by a theme, that theme's body/display will fall back through
  the stack.
