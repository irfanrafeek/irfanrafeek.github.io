# Build and deploy

The site is static HTML served by GitHub Pages. Content lives in Sanity, and
`build/prerender.js` bakes it into files before deploy.

## Why there is a build step at all

Until August 2026 every article and card was rendered in the browser: the page
arrived empty and JavaScript fetched the content from Sanity. That is invisible
to search. A crawler fetching an article URL got a 5.3 KB shell with no text, a
shared `<title>` ("Writing — Irfan Rafeek") on every article, no canonical, and
no structured data. Google renders JS eventually, at a crawl-budget penalty —
but the AI crawlers (ClaudeBot, GPTBot, PerplexityBot) largely do not run JS at
all, so the articles did not exist for them.

The build makes the same markup arrive in the file.

## Commands

```
npm run build            # query Sanity, write dist/
npm run build:offline    # build from the committed snapshot, no network
npm run preview          # build, then serve dist/ at localhost:4000
```

`dist/` is gitignored and disposable. **Source files are never modified by the
build** — the listing pages keep their empty `[data-projects]` grids, and the
build fills them on the way into `dist/`.

## One renderer, two callers

`scripts/render-article.js` and `scripts/render-cards.js` hold every piece of
markup the site produces. They are UMD, so the same file loads in Node (the
build) and in the browser.

**Do not fork them into a build-only copy.** The prerendered pages and the CSS
would drift apart within a month, and the failure is silent — the page just
slowly stops matching the design.

## URL layout

| URL | File | Notes |
|---|---|---|
| `/writings` | `writings.html` | Listing, grid injected at build |
| `/writing/<slug>/` | generated | Article |
| `/work` | `work/index.html` | Listing, from `work.html` |
| `/work/<slug>/` | generated | Case study |
| `/writing?slug=…` | `writing/index.html` | Legacy shim, redirects |
| `/case?slug=…` | `case.html` | Legacy shim, redirects |

### The directory collision

Articles need directories named `writing/` and `work/`, and those shadow the
`writing.html` and `work.html` at the repo root — Pages resolves `/work` to the
directory before it tries the `.html` fallback. So the build moves `work.html`
into `dist/work/index.html`, and `writing.html`'s slot is taken by the redirect
shim.

If you add a page whose name collides with a content directory, this is the
thing that will bite you.

### Old links keep working

`/writing?slug=x` and `/case?slug=x` are shared on LinkedIn and sitting in
inboxes. Both resolve to a shim that forwards to the real page and carries
`noindex, follow`, so the indexing lands on the article rather than being split
between two URLs.

## What each page carries

Per article: a unique `<title>`, meta description (`seoDescription`, falling
back to `description`), canonical, Open Graph and Twitter cards, and
`BlogPosting` (writing) or `Article` (case studies) JSON-LD with author,
`datePublished` and `dateModified`.

Also generated: `sitemap.xml` with every URL and a `lastmod`, and `feed.xml`
(RSS, writing only), linked from the listing pages' `<head>`.

## Dates

The schema has `publishedAt` (required) and `updatedAt` (optional). Both search
and AI answer engines weight recency, and `year` alone is not a date.

Where `publishedAt` is blank the build falls back to Sanity's `_createdAt` so
nothing ships dateless — but that is a fallback, not a substitute. Set real
dates on existing documents.

## The snapshot

Every successful build writes `build/content-snapshot.json` and commits it.
If Sanity is unreachable the build warns and uses the snapshot instead of
failing, so a CMS outage can never take the website down.

## Deploying

`.github/workflows/deploy.yml` runs on push to `main`, on `workflow_dispatch`,
and on a `repository_dispatch` of type `sanity-publish`. It builds, sanity-checks
that articles and structured data were actually produced, and deploys `dist/`.

**Pages must be set to "Source: GitHub Actions"** in repo settings. This
replaces the old branch-based build — the `POST /pages/builds` nudge used for
stuck branch builds no longer applies.

Publishing in Sanity Studio triggers a rebuild via a webhook pointed at
`repository_dispatch`. Content edits therefore go live about a minute after
Publish, with no terminal involved.
