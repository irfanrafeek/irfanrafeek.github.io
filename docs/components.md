# CSS Components

All component CSS lives in `components.css`. Every rule consumes
semantic tokens (`var(--semantic-…)`) — see [tokens.md](./tokens.md).

## Layout primitives

### `.container` / `.container--narrow`

Centered max-width wrapper with horizontal padding.

```html
<main>
  <div class="container">
    <!-- default: max-width 640, padded -->
  </div>

  <div class="container container--narrow">
    <!-- narrow: same 640 today, kept separate so the two can diverge -->
  </div>
</main>
```

All three layout widths — `default`, `narrow` and `reading` — resolve to
640px, so index and article pages share one column and running text stays
near 70 characters a line. Before changing any of them, check the fixed
pixel sizes that live inside a container; `docs/tokens.md` lists the two
failure modes to watch for.

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

### `.greeting`

One line above the hero, set in the mono face rather than the eyebrow sans
— deliberately the same family, size and tracking as the game's CLICK TO
PLAY prompt at the foot of the page, so the two read as one voice.

```html
<div class="greeting" id="greeting"></div>
<script>/* fills it from the visitor's clock */</script>
```

The text is written by a short inline script placed **immediately after the
element**, not by a deferred file. That position is the point: a deferred
script paints an empty line first and then pops the text in. Buckets are
5-11 morning, 12-16 afternoon, 17-21 evening, and everything either side of
midnight late night; it reads the visitor's own hour, so a reader in New
York at 9pm is greeted with EVENING while it is morning in Bangalore.

It was called `.location-header` until the content stopped being a
location. This line used to read BANGALORE, INDIA · AVAILABLE FOR WORK.
Both signals
left the page body with it — the city is now carried by the first sentence
of `.hero-description`, and the hiring signal only by the nav button.

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
</div>
```

The header takes the heading alone. It used to carry an `.view-all` link on
the right; that route now sits under the cards as a `.cta-button` inside
`.work-footer`, since it is what you reach for after reading the list rather
than before. `.view-all` is gone — nothing else used it.

### `.cta-button`

```html
<a href="#contact" class="cta-button">Work With Me</a>
```

The outlined button, in the nav and at the foot of the work section. It is
authored standalone rather than as `.nav-links a.cta-button` so the two
placements cannot drift apart. One nav-scoped rule survives: `.nav-links
a:hover` tints every link with the accent and outranks `.cta-button:hover`,
so the button's label colour is held explicitly there.

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

## Services grid (sticky notes)

```html
<div class="services-grid">
  <div class="service">
    <h3 class="service-title">Product Design</h3>
    <p class="service-description">
      <span class="service-lead">Product Design &middot;</span> turn complex problems&hellip;
    </p>
  </div>
  &hellip;
</div>
```

Three notes lying on the page: `background-raised`, square corners, no
border, each tilted a different amount and straightening under the cursor.
Three across, stacking below 768px.

The practice name appears **twice on purpose**. `.service-title` is present
for structure and visually hidden (clip-path, not `display: none`, so it is
still read out); the visible name is the `.service-lead` span that opens the
sentence. Running the name into its own line in one voice is what makes the
card read as something written on a note rather than a designed card — but
dropping the heading outright would leave the section with three anonymous
paragraphs under one `h2`.

Four things here are load-bearing and easy to undo by accident:

- **The tilt is authored at `.services-grid .service:nth-child(n)`, and the
  hover rule matches that specificity.** Written as a bare `.service:hover`
  it loses the cascade to the nth-child rules, `:hover` matches, and nothing
  moves. This exact bug shipped in the prototype.
- **The shadows are literal rgba, not tokens.** A tight contact shadow plus a
  longer one falling below is what separates paper lying on a surface from a
  box floating over one, and the shadow tokens are single-layer. They are
  neutral blacks at low alpha, so they hold in all four themes.
- **`prefers-reduced-motion` removes the transform, not just the transition.**
  Those users get straight notes, which is a plainer design than everyone
  else gets — a deliberate trade, not an oversight.
- **The grid carries vertical padding of its own.** The notes overhang their
  track by design (the tilt, the shadow, the 2px hover lift); without that
  padding the top edge clips.

The rotation pushes the outer notes about 3px past the container. It causes
no page scroll — the document stays exactly the viewport width — but the row
does sit a hair proud of the text above it.

---

## Client logos

```html
<div class="clients-grid">
    <div data-logo="vogue" class="client-logo" role="img" aria-label="Vogue"
         style="--client-logo: url('Assets/logos/vogue.svg')"></div>
</div>
```

Each logo is a `div`, not an `img`: the SVG is applied as a **mask** and the
shape painted with `currentColor`, so one asset recolours correctly in all four
themes. The mark travels in `--client-logo`; `role="img"` plus `aria-label`
carry the name, since a masked div has no accessible content of its own.
`data-logo` is the hook the stylesheet sizes it by.

### Optical sizing

The grid gives every logo the same box. That is the right layout and the wrong
sizing, because **logos are not comparable objects**. Two things break at a
shared box:

- **Weight.** A heavy display face reads far larger than a light wordmark at
  identical height. Vogue and Allure are only the 5th and 6th tallest marks on
  the wall but among the first to look oversized. What the eye matches is ink
  mass, not bounding box.
- **Proportion.** A 10:1 lockup runs out of column long before it reaches the
  box height. National Herald painted at 9px next to AD at 40px — a 4.3&times;
  spread from identical boxes.

So a logo may carry `--client-scale`, which adjusts it **inside** its box via
`transform: scale()`. The grid, the columns and the box never move. Values are
hand-set and judged by eye; do not try to derive them from aspect ratio, because
the thing being matched is not a measurable dimension.

### Why the scales live in CSS, not inline

**The balance is a property of the layout, not of the logo.** Which marks look
oversized changes with the column width, so each breakpoint needs its own set —
and an inline custom property out-ranks every media query, which would freeze
one breakpoint's answer onto all of them. Hence `[data-logo="…"]` selectors.
This is the whole reason the attribute exists.

How completely the answer changes is worth seeing:

| | 5 columns (~90px track) | 2 columns (~155px track) |
|---|---|---|
| Wired | 18px — smallest but one | 32px — joint largest |
| Vanity Fair | 18px | 31px |
| Bloomberg | starved, grows 1.25&times; | height-limited, no growth |

Wired and Vanity Fair need the hardest correction on a phone and **none at all**
on a desktop. Copying one set to the other breakpoint would make things worse,
not better.

The reason is that the binding dimension flips. In five columns the track is
narrow, so most marks are limited by *width* and the question is "which logo has
room". In two columns the track is wide and almost everything reaches the height
ceiling instead, so the question becomes purely "which logo looks heavy".

### The three sets

**Base — 5 columns.** The marks reaching the 40px ceiling are the near-square
ones, so those hold down: `ad` `gq` 0.75, `asista` 0.78, `yourstory`
`conde-nast-traveler` 0.82, `allure` `vogue` 0.85. `bloomberg-quint` grows
1.25&times;.

**≤ 968px — 3 columns.** The track roughly doubles against the same 40px box,
so most marks stop being starved by the column and pile up on the height ceiling
instead. That lifts the heavy ones to the top of the wall: `allure` 0.72,
`quintype` 0.83, `wired` 0.87, `vanity-fair` 0.88, `bon-appetit` 0.90,
`fortune` 0.92. The light faces are left near the ceiling on purpose — at this
size they carry it. `national-herald` and `bloomberg-quint` both still run out
of column before box height so both still grow, but into a 24px gutter rather
than a 32px one, so both sit at 1.12.

**≤ 640px — 2 columns.** Weight is the question, plus one effect that does not
exist on desktop: the widest marks now span the track edge to edge, and a logo
touching both edges of its cell reads as large however short it is. Presence is
width as much as height. Wired, Vanity Fair and Bon Appétit are all ~5:1 and all
do this, so they are corrected harder than their height alone would suggest —
`vanity-fair` 0.78, `wired` 0.80, `bon-appetit` 0.85, joined by `quintype` 0.92.
`national-herald` grows 1.10; `bloomberg-quint` returns to 1, since the
starvation it corrected no longer exists and leaving it in would make one logo
the tallest on screen.

Result: 24–32px across fourteen of fifteen marks, ordered by weight — light
faces (New Yorker, Fortune, bon appétit) sit at the top of the band, heavy ones
(GQ, AD, Wired) at the bottom. That ordering *is* the alignment.

### Breakpoint sets leak downward

The media queries are `max-width`, so **`≤ 968px` also matches a phone**. Any
logo tuned in the three-column set reaches the two-column set as well, and if
its answer differs there it must be restated in the narrower block. Three are:
`allure` and `fortune` are corrected for a 40px box the phone no longer has, and
`gq` is deliberately smaller on desktop than a phone wants.

This has already bitten once — adding the tablet set silently changed three
logos on mobile. **After editing any breakpoint's set, re-measure every
breakpoint, not just the one you edited.**

### Growth overflows the column

A scale above 1 pushes the mark past its column and into the gutter, which is
empty space. The ceiling is therefore however much gutter there is to spend —
go past the gap and it touches its neighbour. Bloomberg at 1.25 in a 90px track
spends 22px of a 32px gutter. **After changing any scale above 1, re-check for
collisions** by comparing each logo's `right` against its row-neighbour's
`left`.

### Trimmed viewBoxes

Four logos — `asista`, `bloomberg-quint`, `quintype`, `fortune` — are `<text>`
based placeholders rather than real vector artwork, and shipped with large empty
margins baked into the viewBox: Asista filled 40% of its own artboard, Bloomberg
50%. With `mask-size: contain` that padding is sized as if it were part of the
logo, so the mark renders small no matter what the CSS says. Their viewBoxes are
trimmed to the real ink bounds plus 1.5 units.

Trimming changes a logo's aspect ratio, so it can flip which dimension binds —
Asista went from looking starved to looking oversized, which is why it appears
in the scale table. And because these four are text, they depend on Arial and
Times being present on the visitor's machine; inside a mask that fallback is
silent. Replacing them with real vector marks would beat any tuning here.

**Measuring ink bounds:** load the SVG into the DOM and call `getBBox()` on the
root. Comparing that to the viewBox gives the fill percentage; anything under
~90% is carrying padding.

---

## Experience timeline (about page)

```html
<div class="experience-entry">
  <div class="experience-meta">
    <h3 class="experience-company">Cond&eacute; Nast</h3>
    <div class="experience-dates">Dec 2020 &mdash; Jul 2025</div>
    <div class="experience-role">Principal Product Designer, Design Systems</div>
  </div>
  <div class="experience-description">
    <h4 class="experience-subhead">Optional, for entries covering several engagements</h4>
    <p>&hellip;</p>
  </div>
</div>
```

Two columns, `2fr / 5fr` with an `xl` gap, stacking to one below 968px.

The meta column carries one serif and two sans lines, not three headings:
the company name is the only thing that gets the display face, at
`heading-2xs`; dates drop to `eyebrow-sm` and the role to `body-sm` roman.
Set as three display voices it read as a wall of bold in a 155px column.

Two spacing traps here, both already sprung once:

- `.experience-role` used to carry a `margin-top` **on top of** the flex
  gap of the column it sits in, so the block was looser than drawn. The
  column's `gap` is the only spacing; keep it that way.
- A `3xl` column gap looks generous at 800px and starves the meta column at
  640px. Company names wrap when the column drops much under 150px.

`.experience-subhead` is still the serif at 20px, identical to the company
name beside it — so in an entry that has one, the subhead and the company
read at equal weight. Worth resolving if the subhead spreads to more
entries.

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

Centred block with top + bottom borders. Shared by `index`, `about`,
`work` and `writings` — a change here lands on four pages.

### Type sizes

|            | ≥969px | ≤968px | ≤640px |
|------------|--------|--------|--------|
| `.cta-title` | 30px | 26px | 22px |
| `.cta-email` | 20px | 20px | 20px |
| `.cta-label` | 14px | 14px | 14px |

The title sits a clear step below the hero (44px on the home page). It
was 38px, close enough that the last thing on the page competed with
the first for the loudest type on the site — which reads as shouting
rather than as a close. Keep the gap when changing either.

`.cta-email` has no responsive rules. It used to carry two that both
resolved to 20px once the base came down; steps that do not step are
worse than no steps, because they look deliberate.

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

## Photo wall (home page)

Six photographs in `#outside`, between Selected Work and Get In Touch.
Pays off the camera half of the hero copy the way the skate game pays
off the longboard half — it is the only promise the page makes twice.

### Structure

`figure.polaroid` → `img.polaroid-photo` + `figcaption.polaroid-caption`,
in a `.photo-wall` grid. Three up, two up below 640px.

The heading carries **no section number**, unlike 01–03 above it. Those
three are the argument the page makes, in order; this is a coda after
it, and numbering it filed it as a fourth exhibit.

The lede is a **sibling** of `.section-header`, never a child: that
header's inner div is a flex row ending in the hairline rule, so
anything added inside becomes a third flex item and shoves the rule out
of the way.

### The paper

Same surface and the same two-layer shadow as the service notes — the
page already had one paper metaphor and a second one behaving
differently would read as a different material.

Colours come from `--semantic-color-photo-*`. See `docs/tokens.md` for
why they are restated identically in every theme block.

### The swing

Hovering a photo swings it to vertical as a damped oscillation: through
vertical, back a smaller amount, four passes, settling over 620ms. Each
pass is about 38% of the one before.

Three things make it read as physics rather than as an effect, and each
was wrong at some point:

- **`transform-origin: 50% -1px` — the pin, not the top edge.** The pin
  is `::before` at `top: -5px`, 8px across, so its centre is 1px *above*
  the frame. Rotating about anything else drags the pin along the wall,
  which is the one thing a pin never does. Verified at 0.01px of drift
  through a full oscillation; measure it with a 1px marker at
  `left: 50%; top: -1px` if you change any of this.
- **The transform is rotation and nothing else.** The vertical stagger
  is `margin-top`, not `translateY`, or it carries the pin down the wall
  and lifts it again on hover. Nothing lifts and the shadow holds
  constant: a photo swinging to vertical does not change its distance
  from the wall.
- **The rest angle is `--polaroid-tilt`, not a literal in the
  transform.** The keyframes are written as proportions of it, so one
  set serves six photos and each swings as far as its own crookedness
  earns. A fixed animation swings the barely-tilted frame as hard as the
  worst-hung one.

Going out is the keyframed swing; coming back is a plain transition,
since nobody flicks a photo when they take their hand away.

In the reduced-motion block, `animation: none` is the load-bearing
line — without it the keyframes run whatever the transition says.

The `nth-child` rules are authored at the same specificity as the
`:hover` rule or they silently outrank it.

### Image ratio

`aspect-ratio: 9 / 10` against photographs shot 4:5, so the frame crops
about 11% of height, centred. That is a deliberate step towards the
squarer image area a real polaroid has. **The frame crops the
photographer's crop** — check a new photo in place rather than trusting
the thumbnail, particularly anything composed tight to the top or
bottom edge.

`height: auto` is load-bearing. The `width`/`height` attributes on the
tag reserve space before load, but the browser maps `height="1350"` to a
specified CSS height, and a specified height outranks `aspect-ratio` —
leaving 1350px-tall frames.

### One size, not two

The grid shows the same files the viewer opens. A thumbnail set plus a
full-size set would save about 137KB on first load, and was rejected:
six photographs is not enough to justify two of everything, and the
single set means opening a photo is a cache hit rather than a download.
Exported at native resolution, quality 76, 300KB for all six.

Revisit that if the wall ever grows past a dozen.

### The viewer

`scripts/photos.js`, on a native `<dialog>`. The focus trap, Escape, and
the backdrop are the browser's; what is written here is which photo and
how to move between them.

- The figures are upgraded to controls **in JS**, not in the markup, so
  without JS they stay plain figures rather than buttons that do
  nothing.
- Focus is restored **explicitly** on close, to the photo last viewed.
  The dialog's own restore returns to whatever was focused when it
  opened — the wrong frame once someone arrows across, and nothing at
  all when the click never moved focus.
- The scrim is painted on the dialog element, not only on `::backdrop`.
  The dialog already fills the viewport so they are the same surface,
  but a plain element is one every renderer treats normally.
- Opaque, and dark in every theme. It is a room built to look at a
  photograph in; the answer does not change with the site's mood.

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
point, y negative upwards. Ten poses are arrays of those joints; each
frame the live pose eases toward whichever the state asks for and five
`d` attributes are rewritten. There are no animation frames — the
interpolated in-between poses *are* the animation.

Five cover riding — `roll`, `takeoff`, `air`, `land`, `grind`. One is
the resting figure, `rest`. Four are the opening kick-push: `lift`,
`plant`, `sweep`, `fold`.

Takeoff is deliberately brief: the jump impulse is applied instantly on
click (delaying it for real anticipation costs more in input lag than
the pose is worth), so the compressed pose blends out over the first
100ms of the rise instead.

The landing pose is armed only by a *real descent* — the frame the
board goes from airborne to resting. Resting on a surface re-enters
the same branch of the physics every frame, so an unguarded check
holds the landing crouch forever and the rolling pose never returns.

### The head and the cap

The head is the one part not driven by the joint array alone. It is an
`<ellipse rx="4.2" ry="5">` rather than a circle, so it has an
orientation and has to *rotate* as well as move — where the old circle
only needed `cx`/`cy` written each frame. `poseFigure()` builds one
`translate(...) rotate(...)` string and assigns it to three elements:
the head, the cap band, and the brim.

The cap is two shapes whose `d` never changes, authored straight into
`index.html` in a head-local frame (origin at the head's centre, +x the
direction of travel):

| | |
| --- | --- |
| `.skate-cap` | the band, `M-4.2 0 Q0 -2.5 4.2 0` — a stroke |
| `.skate-cap-brim` | the brim, a four-point wedge — a **fill** |

Two things here are load-bearing and look arbitrary:

**The head takes half the lean, not all of it.** The rotation comes
from the shoulder-to-head vector and is then halved (hence the
`90 / Math.PI` where a plain degree conversion would be `180 / Math.PI`).
A real neck stays more upright than the spine; at the full ~28° lean of
the rolling pose the brim swings up and stops reading as a brim at all.
This was the single change that made the cap legible.

**The brim is filled, and it is the only filled shape on the figure.**
An SVG stroke has one width along its whole length, so a brim drawn as
a stroke cannot taper — and the taper is what makes four pixels of brim
read as a brim instead of a stray line. The cost is that its weight is
absolute: **if `.skate-figure`'s `stroke-width` ever changes, the brim
will not follow and must be re-cut by hand.**

The band and the head shape are a matched pair. The band's endpoints
sit on the ellipse (±4.2 at y 0); a different head shape needs a
different band.

### Starting a run

Only the untouched scene rests. `rest` is what the page shows before
anyone clicks; a crashed scene holds the riding pose instead, because
the run it is showing the end of was a moving one.

The first 0.46s of every run is a scripted pose track — `lift`,
`plant`, `sweep`, `fold` — laid over the ordinary physics rather than
beside it. There is no new state: `choosePose` simply prefers the
push while `elapsed < pushUntil`, so jumping, landing and benches all
still win over it in the order they always did. Jumping during the
push sets `pushUntil` to 0, abandoning it rather than fighting it.

The ground accelerates on a curve underneath (`launch()`), because the
board is what the sweep is pushing — the speed follows the leg rather
than leading it.

**The legs are solved, not posed.** Placing a reaching leg by hand
silently stretches it: the first attempt grew the back leg by 68% to
touch the ground. Both knees now come from two-bone IK against fixed
segment lengths, and — because easing joint positions shortens a limb
between key poses too — they are re-solved every frame from the eased
hip and feet rather than eased themselves.

The correction fades out over 0.35s after the push. That fade is
load-bearing: the riding pose's back knee sits *behind* the hip, which
no solver would ever choose, so the IK has to be gone by the time the
figure settles or the knee would snap forward.

One trap worth knowing: a `requestAnimationFrame` timestamp can
precede the `performance.now()` captured when a run starts, making the
first `dt` negative. The integrator absorbs that silently, but
`launch()` raises `elapsed` to a fractional power, and a negative base
gives `NaN` — which then spreads through the transform and the score.
`dt` is clamped at zero for that reason.

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

### Scenery

Three bands sit behind the game and collide with nothing. They exist
for depth only, and they are built to cost almost nothing: the two far
bands are **one tile drawn twice and wrapped forever**, so after load
nothing is allocated, and the near band peaks at two elements on
screen.

| Band | Element | Speed | Tone |
| --- | --- | --- | --- |
| Grit (road texture) | `.skate-grit`, 2 static paths | 1.0 | `border-primary` |
| Streetscape | `.skate-street`, spawned | 0.65 | `border-strong` at 55% |
| Skyline | `.skate-sky`, 2 static paths | 0.14 | `border-primary` at 25% |

**The one rule that is not negotiable:** decoration never presents a
knee-high silhouette on the ground line. That shape belongs to the
`SHAPES` table. The obstacle set already owns a bench you grind, a bush
and a rock, so a decorative bench you *cannot* ride — sitting next to a
real one you can — teaches the player that the rules are unreliable.
Every shape in `SCENERY` is therefore a bare vertical carrying its mass
above the skater's head: street light, sign, tree. This is why the
reference mockup's bench and hydrant are absent, and it is the first
thing to re-read before adding anything to that table.

The tone order — obstacles darkest, then streetscape, then skyline —
is load-bearing for the same reason: **the thing you must jump is
always the darkest object on the track.** All three are tokens, so the
order survives every theme without a per-theme rule.

#### Speeds are the depth

Apparent motion falls off with distance, so those ratios *are* how far
back each band reads. Below about 0.10 a background looks pinned to the
frame and the depth collapses; above ~0.25 the skyline starts to feel
like it is on the same street as the skater.

The streetscape's 0.65 is fast for a mid-ground, and deliberately so.
The usual 0.4–0.6 assumes the mid-ground is *drawn* small, as things at
that distance would be. These are not — a street light is taller than
the skater — and **speed has to agree with size or the eye reads an
object that looks close but drifts like it is far.** If layer 3 is ever
redrawn smaller, that number has to come down with it.

#### The skyline scales

The band takes the same `scale` factor the obstacles take. Left at full
size it does not shrink with the box, and on a phone a skyline drawn
for a 576px column stands up like a wall right behind the skater. The
consequence is easy to miss: because the band is drawn scaled, it has
to **travel in its own local units** (`speed * SKY_RATE * dt / scale`)
or a narrow box scrolls the skyline faster than the track in front of
it.

Below 480px the streetscape is switched off entirely. Three street
lights in a 375px box is clutter, not depth.

#### The city arrives with the player

`.skate-sky` starts at `opacity: 0` and fades to 1 on `.is-playing`,
after a 150ms delay — so the push lands *first* and the skater reads as
bringing the world with them, rather than the page finishing its load.
It never fades back out: `.is-playing` and `.is-over` are mutually
exclusive and one of them is always set after the first start, so the
union of the two means "has ever been played". That is the whole
mechanism — **no JavaScript is involved in the fade.**

The 1.6s duration is an absolute value rather than a motion token, and
that is deliberate. The motion tier tops out at 320ms because it exists
for UI transitions that must not keep a pointer waiting; this is
one-off scene-setting timed against the push-off (`PUSH_END`, 0.46s)
and the speed ramp behind it. The *easing* is still the system's
`--primitive-ease-soft`.

Under `prefers-reduced-motion` the bands are drawn but never scrolled —
parallax is exactly the effect that query exists to suppress — and the
skyline is simply present from the start with no fade.

#### Known: a short run may show no streetscape

The first streetscape item arrives around four seconds in, then every
5–9 seconds. A run that ends before that shows none at all, so on a
typical short run the near band is invisible. Left as-is on purpose —
the sparseness is the design — but if it ever needs fixing, seed one or
two items on the track in `clearScenery()` rather than shortening the
interval, which would cost the rarity.

### Sizing and difficulty

Everything derives from the box, not from constants. The rule the whole
section rests on: **what a player feels is time, not pixels.** Two boxes
of different widths are only the same game if they hand out the same
number of seconds, and that does not happen by leaving pixel counts
alone — it happens by recomputing them.

The ground line sits a fixed distance from the **top** (`128px`), and
the tap strip below absorbs whatever is left. It used to be the other
way round — a fixed 80px strip — which meant a shorter box took its
20px entirely out of the headroom above the line, where the jump lives.
The jump lost a quarter of its height on a phone for a layout reason.
A desktop box still works out to the original 80px strip.

From there:

- Jump apex is clamped to the headroom, so a jump can never clip out.
- The bench height is subtracted a second time, because a jump can
  start from a bench top as well as the ground.
- Obstacle scale follows the apex — **but is capped separately on a
  narrow box.** These two were coupled, and the coupling has a sting:
  restoring the jump hands the obstacles the same increase and cancels
  the entire gain. The skater cannot shrink without becoming
  illegible, so the world around it does instead.
- The skater's x is `width * (90 / 576)`, floored at 48. At desktop
  width this is exactly the 90 it always was. It used to be a literal,
  which on a phone put the figure a quarter of the way into its own
  box and halved the run-up.
- Speed is aimed at `TARGET_REACT` seconds of warning, never faster
  than width alone would have given. `speedMax` caps the ramp at
  `FLOOR_REACT`, or a long run walks the warning back to where it
  started.

#### The metric to tune against

Reaction time is not what ends a run — the **jump window** is. Once
you have committed, the obstacle must clear the skater's whole body
before you land:

```
window = airtime - (skaterWidth + obstacleWidth) / speed
```

Roughly 0.23s across every width. Check this number, not the warning
time, after touching anything above.

It has two counter-intuitive properties, and both have already caused
a wrong fix:

- **Slowing down shrinks it.** A slower obstacle spends longer
  crossing your body, so you must stay airborne longer relative to it.
  Buying reaction time by cutting speed alone makes the game harder.
- **Raising the jump can leave it unchanged**, because obstacle scale
  follows the apex. Both sides of the ratio move together.

The box is 288px tall, 268px below 768px — of which only the top 128px
is play area. All the rest is tap room, and it runs down to the "What I
Do" heading: `#services` carries **no** top padding, and `.skate` is
taller by exactly that amount. The whitespace between the two was always
going to be there; putting it inside the game means a tap anywhere in it
starts a run instead of hitting dead page.

That makes the two rules a pair. If the game ever stops being the
previous sibling of `#services`, put the `4xl` top padding back and take
the same amount off `.skate`, or the heading sits flush against whatever
follows it.

Because the ground line is pinned to the top, height changes below it
are gameplay-neutral: making the box shorter spends the tap strip first,
down to a 44px floor, and only then starts lowering the jump. Making it
taller only ever adds tap room. Moving the line itself is the change
that alters the game.

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
visual text `aria-hidden` behind the root's `aria-label`.

Space and enter are bound to the game *element*, not to `window` — a
global handler would jump the skater from anywhere on the page and
would have to fight the page's own scrolling to do it. That makes focus
a precondition for keyboard play, and `pointerdown` calls
`preventDefault()` (which is what stops the page lurching when you
click the strip) — so the click has to take focus explicitly, or space
silently does nothing after a click and the game looks mouse-only.

Taking focus in script has a side effect: **Chrome treats a programmatic
`focus()` as keyboard-originated and matches `:focus-visible`**, so the
focus ring appears on every mouse click. The fix is to record where
focus came from — `pointerdown` sets `data-pointer-focus` before
focusing, one rule suppresses the outline while that flag is present,
and `blur` clears it. Tabbing in sets no flag and still gets the ring.
Firefox and Safari never had the bug; there the rule is a no-op.

Pre-existing gap, not introduced by that rule: in browsers without
`:focus-visible` (Safari before 15.4) both rules are dropped as invalid
selectors and the base `outline: none` stands, so keyboard users get no
ring at all. A `@supports not selector(:focus-visible)` fallback would
close it. Under
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
