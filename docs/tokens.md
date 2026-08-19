# Design Tokens

All tokens live in `tokens.css` and are exposed as CSS custom properties
on `:root`. Components consume them via `var(--token-name)`.

## Two tiers, one rule

| Tier | Prefix | What it is | Who uses it |
| --- | --- | --- | --- |
| **Tier 1: Primitives** | `--primitive-…` | Raw values: `#ff6b47`, `24px`, `'Inter'` | **Only semantic tokens.** Never reference in component CSS. |
| **Tier 2: Semantic** | `--semantic-…` | Intent aliases: `interactive/primary` → primitive | **All component CSS.** This is what components consume. |

**The rule:** components consume semantic. Semantic aliases primitives.
This indirection is what lets themes work — a theme block redefines
semantic tokens without touching components.

---

## Primitive tokens

Defined under `:root` in `tokens.css`. Hidden from component authors in
spirit (no enforcement, but please don't reference directly).

### Color ramps

Four ramps. **Neutral** and **Accent** power Light/Dark. **Sepia** powers
Editorial theme. **Slate** powers Code theme.

```
--primitive-color-neutral-0    → #ffffff
--primitive-color-neutral-50   → #f8f8f6
--primitive-color-neutral-100  → #f0f0ed
…
--primitive-color-neutral-900  → #1a1a1a
--primitive-color-neutral-1000 → #000000

--primitive-color-accent-50    → #fff4f0  (lightest accent tint)
…
--primitive-color-accent-500   → #ff6b47  (brand orange)
…
--primitive-color-accent-800   → #b23a22

--primitive-color-sepia-{0,50,100,200,300,600,700,900}     (warm paper)
--primitive-color-slate-{0,100,300,500,600,700,800,850,900} (cool dim)
```

Plus status colors: `success`, `error`, `warning` at `50` / `500` / `600`.

### Spacing scale (non-linear)

```
--primitive-spacing-0    → 0px
--primitive-spacing-xs   → 4px
--primitive-spacing-sm   → 8px
--primitive-spacing-md   → 16px
--primitive-spacing-lg   → 24px
--primitive-spacing-xl   → 32px
--primitive-spacing-2xl  → 48px
--primitive-spacing-3xl  → 64px
--primitive-spacing-4xl  → 80px
```

### Radius

```
--primitive-radius-{none, sm, md, lg, xl, full}
                    0    4    8    12   16   9999
```

### Typography

```
--primitive-font-serif         → 'Merriweather', 'Georgia', serif
--primitive-font-sans          → 'Inter', system-ui, sans-serif
--primitive-font-mono          → 'Monaco', 'Courier New', monospace
--primitive-font-fraunces      → 'Fraunces', 'Merriweather', 'Georgia', serif
--primitive-font-source-serif  → 'Source Serif 4', 'Source Serif Pro', serif
--primitive-font-jetbrains-mono → 'JetBrains Mono', 'Monaco', monospace

--primitive-font-size-{xs,sm,base,md,lg,xl-sm,xl,2xl,3xl,4xl-sm,4xl,5xl,6xl}
                       12 14 16   18 20 22    26 30  34  38     44  50  58

--primitive-font-weight-{regular, medium, semibold, bold, extrabold}
                         300      500     600       700   800

--primitive-line-height-{tight, snug, normal, relaxed, loose}
                         1.1    1.25  1.5    1.6      1.8

--primitive-letter-spacing-{tight, normal, wide, wider, widest}
                            -0.02   0      0.05  0.1    0.15
```

### Shadows

```
--primitive-shadow-{none, xs, sm, md, lg, xl}
```

---

## Semantic tokens

The layer components actually touch.

### Color

| Token | Meaning |
| --- | --- |
| `--semantic-color-background-primary` | Page surface |
| `--semantic-color-background-secondary` | Subtle card / chip fill |
| `--semantic-color-background-tertiary` | Even subtler — placeholders |
| `--semantic-color-background-article` | White reading surface used by `body.page--article` |
| `--semantic-color-text-primary` | Primary text |
| `--semantic-color-text-secondary` | Secondary body text |
| `--semantic-color-text-tertiary` | Tertiary — captions, timestamps |
| `--semantic-color-text-inverse` | Text on an inverted background |
| `--semantic-color-border-primary` | Default border / divider |
| `--semantic-color-border-secondary` | Soft divider |
| `--semantic-color-border-strong` | Pronounced border / pull-quote rule |
| `--semantic-color-interactive-primary` | Brand accent — links, primary actions |
| `--semantic-color-interactive-primary-hover` | Hover state of primary |
| `--semantic-color-interactive-primary-active` | Active/pressed state |
| `--semantic-color-interactive-primary-disabled` | Disabled state |
| `--semantic-color-status-{success,error,warning}` | Status colors |

All color tokens are **theme-aware** — they have different values in
Light vs Dark vs Editorial vs Code.

### Spacing / radius / shadow

Semantic aliases that just forward to primitives (no theming):

```
--semantic-spacing-{xs,sm,md,lg,xl,2xl,3xl,4xl}
--semantic-radius-{none,sm,md,lg,full}
--semantic-shadow-{none,sm,md,lg}
```

### Font intents (theme-aware)

```
--semantic-font-display   → display headlines (theme picks the family)
--semantic-font-body      → body copy
--semantic-font-eyebrow   → small uppercase labels
```

Per-theme resolution:

| Intent | Light | Dark | Editorial | Code |
| --- | --- | --- | --- | --- |
| `font/display` | Merriweather | Merriweather | Fraunces | JetBrains Mono |
| `font/body` | Inter | Inter | Source Serif 4 | JetBrains Mono |
| `font/eyebrow` | Inter | Inter | Inter | JetBrains Mono |

Plus `--semantic-font-{serif,sans,mono}` family aliases (not theme-driven —
they're the family-type primitives in pass-through form).

### Type scales (semantic typography)

Every text style has a full set: `font-family`, `font-size`, `font-weight`,
`line-height`, `letter-spacing`.

- `--semantic-type-display-{lg,md,sm}-*` — large headlines
- `--semantic-type-heading-{lg,md,sm,xs,2xs}-*` — section titles
- `--semantic-type-body-{lg,md,sm}-*` — body copy
- `--semantic-type-body-strong-{lg,md,sm}-*` — emphasized body
- `--semantic-type-label-{lg,md,sm}-*` — small interactive labels
- `--semantic-type-caption-{lg,md,sm}-*` — even smaller meta
- `--semantic-type-eyebrow-{lg,md,sm}-*` — uppercase eyebrows
- `--semantic-type-article-{small,body,summary,quote,heading,title}-*` —
  reading-scale for case-study / article pages
- `--semantic-type-code-{lg,md,sm}-*` — monospace for inline code

### Body rhythm (theme-aware)

The `body` element binds these directly so themes can vary the rhythm:

```css
--semantic-type-body-base-line-height    → relaxed (Light/Dark) | loose (Editorial) | snug (Code)
--semantic-type-body-base-letter-spacing → normal  (Light/Dark) | normal (Editorial) | tight (Code)
```

### Motion

Primitives mirror the [DTCG format module](https://tr.designtokens.org/format/)
types — `duration` (number + unit) and `cubicBezier`.

```
--primitive-duration-instant → 80ms
--primitive-duration-fast    → 120ms
--primitive-duration-base    → 200ms
--primitive-duration-slow    → 320ms

--primitive-ease-standard → cubic-bezier(0.2, 0, 0, 1)    workhorse; fast out, settles
--primitive-ease-soft     → cubic-bezier(0.4, 0, 0.2, 1)  calm, editorial
--primitive-ease-exit     → cubic-bezier(0.4, 0, 1, 1)    accelerates away
--primitive-ease-spring   → cubic-bezier(0.34, 1.56, 0.64, 1)  slight overshoot
--primitive-ease-linear   → linear                        mechanical, no easing
```

**Semantic motion intents are themable** — the same mechanism as
`--semantic-font-display`. Components reference these, never the primitives:

```
--semantic-motion-hover-duration
--semantic-motion-hover-easing
--semantic-motion-hover           ← shorthand pair (duration + easing)
```

The shorthand mirrors DTCG's `transition` composite type, so components read:

```css
.project-card {
    transition: border-color var(--semantic-motion-hover),
                box-shadow var(--semantic-motion-hover);
}
```

Per-theme character:

| Theme            | Duration | Easing     | Reads as              |
| ---------------- | -------- | ---------- | --------------------- |
| Light / Dark     | 120ms    | `standard` | neutral, precise      |
| Editorial (sepia)| 200ms    | `soft`     | calm, gentle settle   |
| Code (slate)     | 80ms     | `linear`   | mechanical, switched  |

Dark deliberately shares Light's motion — it's a colour mode, not a separate
personality. Only Editorial and Code are distinct characters.

**Two rules when adding motion:**

1. **Hover stays under 200ms in every theme.** Hover is feedback on something
   the visitor is touching. A theme may change how it settles, never whether
   it keeps up.
2. **Never `transition: all`.** List the properties that actually change —
   `all` animates things you didn't intend (including layout properties) and
   costs more to composite.

**Reduced motion** is handled globally at the end of `components.css` per
WCAG 2.3.3. Durations are near-zeroed rather than removed, so state changes
still apply instantly and nothing waits on a `transitionend` that never fires.

**Figma caveat:** unlike colour and type, motion tokens do **not** round-trip
into the Figma library — Figma has no easing or duration variable type.
Durations could be mirrored as number variables; the curves cannot.

### Layout

```
--semantic-layout-container-max-width-default → 640px
--semantic-layout-container-max-width-narrow  → 640px
--semantic-layout-container-max-width-reading → 640px  (long-form articles)
```

All three are deliberately the same value — every page, index and article
alike, shares one 640px column, which keeps running text near 70 characters
a line. The variants are kept as separate tokens so they can diverge again
without touching markup.

Anything sized in fixed pixels inside a container must be checked against
this width when it changes. Watch for two failure modes:

- **Fixed square images going oval.** Set `width: 100%` + `max-width` +
  `aspect-ratio` rather than a fixed `width`/`height` pair.
- **Media queries wider than the container.** A `@media (max-width: 1200px)`
  rule now fires on essentially every viewport, so it silently becomes the
  default rather than a responsive exception.

---

## Naming convention

`--{tier}-{category}-{subcategory?}-{role}-{step?}`

Examples:

```
--primitive-color-neutral-50
--primitive-font-size-base
--semantic-color-background-primary
--semantic-type-display-lg-font-size
--semantic-layout-container-max-width-reading
```

- Lowercase, dash-separated.
- Numbers at the end (`-50`, `-500`, `-900`) describe steps in a ramp/scale.
- t-shirt-sized names (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`, …) for everything else.

---

## DO / DON'T

✅ **DO**

- Use semantic tokens in component CSS: `var(--semantic-spacing-md)`,
  `var(--semantic-color-text-primary)`.
- Add a new primitive at the end of its ramp if you genuinely need a
  new raw value (e.g. another accent step).
- Add a new semantic intent when something has a distinct purpose
  (e.g. `color/background/article` for the white reading surface).
- Mirror code changes in Figma the same day so both stay in sync.

❌ **DON'T**

- Hardcode hex codes, pixel values, or font names directly in components.
- Reference primitive tokens from component CSS. Go through semantic.
- Add per-theme overrides at the primitive layer — overrides go on
  the semantic side only.
- Delete or rename existing tokens. Extend the system instead.
- Use the family-type aliases (`--semantic-font-serif`) directly in
  components — use the intent aliases (`--semantic-font-display`) so
  themes can swap them.

---

## See also

- [components.md](./components.md) — which classes use which tokens
- [themes.md](./themes.md) — how per-theme overrides work
