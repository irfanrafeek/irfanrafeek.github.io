# Design System Documentation

This folder documents the design tokens, CSS components, and theming model
that power [irfanrafeek.com](https://www.irfanrafeek.com).

## What this is

A zero-build static portfolio with a **two-tier design token system**.
Components consume semantic tokens, never primitives. Four themes
(Light, Dark, Editorial, Code) live on top of the same component layer.

```
┌─────────────────────────────────────────────────────┐
│  Tier 1: Primitives  →  Tier 2: Semantic  →  Used   │
│  raw colors, sizes,     intent aliases       in CSS │
│  weights                background/primary,         │
│                         text/primary, etc.          │
└─────────────────────────────────────────────────────┘
              ▲                  ▲
              │                  │
              └──── tokens.css ──┘
                           │
                           └─→  components.css uses var(--semantic-…)
```

## File map

| File             | Purpose                                                |
| ---------------- | ------------------------------------------------------ |
| `tokens.css`     | All design tokens (primitives + semantic + theme overrides) |
| `components.css` | All component CSS — references semantic tokens only    |
| `scripts/*.js`   | Renderers for projects/writings cards + article body + theme + nav  |
| `*.html`         | Six page templates: index, about, work, case, writings, writing |

## Documentation in this folder

- [**tokens.md**](./tokens.md) — Token reference: every primitive ramp,
  every semantic intent, naming convention, when to use which. Includes the
  [motion scale](./tokens.md#motion) — durations, easing curves, and the
  per-theme motion character.
- [**components.md**](./components.md) — Class reference: the major
  component classes (`.hero`, `.project-card`, `.case-*`, `.theme-switcher`, etc.)
  with markup examples.
- [**themes.md**](./themes.md) — How the four-theme system works: the
  `data-theme` attribute, per-theme token overrides, persistence,
  how to add a new theme.

## Quick start: changing a value

To change the brand accent color across the whole site (light + dark +
editorial + code themes):

```css
/* tokens.css */
:root {
  --primitive-color-accent-500: #ff6b47;  /* ← change this hex */
}
```

Every component that uses `color/interactive/primary` (semantic) gets
the new value automatically because semantic aliases into the primitive.

To change it for **one theme only**:

```css
/* tokens.css */
[data-theme='sepia'] {
  --semantic-color-interactive-primary: var(--primitive-color-accent-700);
  /* now Editorial theme uses a different accent without touching others */
}
```

## Mirroring in Figma

The same two-tier structure is mirrored as Figma Variables in the file
linked from your project's CMS-setup memory. Primitive Collection +
Semantic Collection with four modes (Light/Dark/Sepia/Slate). Text
styles bind their `fontFamily` to `font/display`, `font/body`, and
`font/eyebrow` intent variables so designs retint with the mode just
like the live site.

See [themes.md](./themes.md#in-figma) for the editor workflow.

---

## Where content actually comes from

**Sanity, not the JSON files.** This trips people up, so read this before
editing case-study or writing copy.

`scripts/case.js` and `scripts/projects.js` fetch from the Sanity API
(project `qgasa874`, dataset `production`) at page load. The committed
`projects.json` / `writings.json` are legacy import sources that are no
longer read by the site.

So: **editing `projects.json` does not change the live page.** To fix
article copy, edit the Sanity document — via the Studio in `sanity-studio/`,
or with a direct mutation using the CLI token in `~/.config/sanity/config.json`.
It is still worth keeping the JSON files in sync so the two don't diverge.

The `data-source="projects.json"` attribute is a leftover naming: it selects
the Sanity document *type* (`project` / `writing`), it does not fetch a file.

## URLs and local development

Internal links are **extensionless** — `/about`, `/work`, `/case?slug=…`.
GitHub Pages resolves these to the matching `.html` file automatically, so
no folder restructuring or build step is involved. The `.html` URLs still
work, which keeps previously shared links alive.

`python3 -m http.server` does **not** do that resolution, so every clean
link 404s against it. Use the included server instead:

```bash
python3 devserver.py 4000
```

It adds the same extensionless fallback Pages uses (only when no literal
file matches and the URL has no extension, so it never shadows a real
file) and sends `Cache-Control: no-store` so CSS edits show up without a
hard refresh. `.claude/launch.json` already points at it.

Case studies are still `/case?slug=…`. Making those clean (`/work/<slug>`)
needs a page generated per slug, since no file exists at that path — that
would also fix the fact that crawlers currently see an empty shell for
articles, because the content is fetched client-side.

## Deploying

Push to `main`; GitHub Pages builds automatically (legacy build type,
branch `main`, path `/`, custom domain via `CNAME`).

**Do not cancel a stuck `pages-build-deployment` run.** Cancelling orphans
the Pages build record and wedges the service in `building`, so every later
push queues behind a phantom build and never goes live. If a build looks
stuck, nudge it instead:

```bash
gh api -X POST repos/irfanrafeek/irfanrafeek.github.io/pages/builds
```

That is non-destructive and clears the wedge. Verify a deploy landed by
checking both the build status and the live bytes — the API can report
success while the CDN still serves the old file:

```bash
gh api repos/irfanrafeek/irfanrafeek.github.io/pages/builds/latest --jq '.status, .commit'
curl -s https://www.irfanrafeek.com/ | grep -o 'something-you-changed'
```
