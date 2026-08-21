#!/usr/bin/env node
// Builds the static site into dist/.
//
// The site used to render every article and card in the browser, which meant a
// crawler fetching an article URL received an empty shell -- fine for people,
// invisible to Google and to the AI crawlers, which mostly do not run JS.
// This bakes the same markup into files ahead of time.
//
//   node build/prerender.js          build into dist/
//   node build/prerender.js --offline  build from the committed snapshot
//
// Source files are never modified. dist/ is disposable.

'use strict';

const fs = require('fs');
const path = require('path');

const Article = require('../scripts/render-article.js');
const Cards = require('../scripts/render-cards.js');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SNAPSHOT = path.join(__dirname, 'content-snapshot.json');
const TEMPLATES = path.join(__dirname, 'templates');

const SITE = 'https://www.irfanrafeek.com';
const AUTHOR = 'Irfan Rafeek';

// Files and folders copied through untouched.
const STATIC = [
    'Assets', 'photographs', 'scripts', 'admin',
    'tokens.css', 'components.css', 'CNAME', 'robots.txt',
    'projects.json', 'writings.json',
];

// Pages that are copied with their card grids filled in.
// [source, output path, default card link target]
const LISTINGS = [
    ['index.html', 'index.html', '/work'],
    ['work.html', 'work/index.html', '/work'],
    ['writings.html', 'writings.html', '/writing'],
];

// Static URLs for the sitemap, alongside the generated article ones.
const STATIC_URLS = ['/', '/about', '/work/', '/writings'];

/* ---------------------------------------------------------------- content */

async function query(groq) {
    const url = Cards.SANITY_API + '?query=' + encodeURIComponent(groq);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Sanity HTTP ' + res.status);
    const data = await res.json();
    return data.result || [];
}

async function loadContent(offline) {
    if (offline) {
        console.log('  reading build/content-snapshot.json (offline)');
        return JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
    }
    try {
        const [writings, projects] = await Promise.all([
            query(Article.allQuery('writing')),
            query(Article.allQuery('project')),
        ]);
        const content = { fetchedAt: new Date().toISOString(), writings, projects };
        fs.writeFileSync(SNAPSHOT, JSON.stringify(content, null, 2) + '\n');
        return content;
    } catch (err) {
        // A Sanity outage must never be able to take the site down. The last
        // good content is committed, so fall back to it and keep building.
        console.warn('  !! Sanity unreachable (' + err.message + ') -- falling back to snapshot');
        return JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
    }
}

/* ----------------------------------------------------------------- helpers */

// Pages that live in a subdirectory cannot use relative asset paths.
function absolutize(html) {
    return html
        .replace(/href="tokens\.css"/g, 'href="/tokens.css"')
        .replace(/href="components\.css"/g, 'href="/components.css"')
        .replace(/src="Assets\//g, 'src="/Assets/')
        .replace(/src="scripts\//g, 'src="/scripts/')
        .replace(/href="Assets\//g, 'href="/Assets/')
        .replace(/src="photographs\//g, 'src="/photographs/')
        .replace(/href="photographs\//g, 'href="/photographs/');
}

function assertNoRelativeRefs(html, label) {
    const bad = html.match(/(?:href|src)="(?!https?:|\/|#|mailto:|data:|\{\{)[^"]*"/g);
    if (bad) throw new Error('relative reference left in ' + label + ': ' + bad.join(', '));
}

function write(relPath, contents) {
    const full = path.join(DIST, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
}

function attr(value) {
    return Article.escapeHtml(value == null ? '' : String(value));
}

// Sanity gives ISO timestamps; the schema is new, so tolerate a missing one.
function isoDate(doc) {
    const raw = doc.publishedAt || doc._createdAt;
    if (!raw) return '';
    const d = new Date(raw);
    return isNaN(d) ? '' : d.toISOString();
}

function modifiedDate(doc) {
    const raw = doc.updatedAt || doc.publishedAt || doc._updatedAt;
    if (!raw) return '';
    const d = new Date(raw);
    return isNaN(d) ? '' : d.toISOString();
}

function summaryOf(doc) {
    return (doc.seoDescription || doc.description || '').trim();
}

function coverOf(doc) {
    const img = (doc.image || '').trim();
    if (!img) return SITE + '/Assets/About_me.gif';
    if (img.indexOf('cdn.sanity.io') !== -1) return img + '?w=1200&auto=format&fit=max';
    return img.startsWith('http') ? img : SITE + '/' + img.replace(/^\//, '');
}

/* ------------------------------------------------------------------ pages */

const KINDS = {
    writing: {
        base: '/writing',
        back: '/writings',
        backLabel: 'All writing',
        schemaType: 'BlogPosting',
    },
    project: {
        base: '/work',
        back: '/work/',
        backLabel: 'All work',
        schemaType: 'Article',
    },
};

function jsonLd(doc, kind, canonical) {
    const data = {
        '@context': 'https://schema.org',
        '@type': kind.schemaType,
        headline: doc.title,
        description: summaryOf(doc),
        image: [coverOf(doc)],
        author: { '@type': 'Person', name: AUTHOR, url: SITE + '/about' },
        publisher: { '@type': 'Person', name: AUTHOR, url: SITE },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        url: canonical,
    };
    const published = isoDate(doc);
    const modified = modifiedDate(doc);
    if (published) data.datePublished = published;
    if (modified) data.dateModified = modified;
    if (Array.isArray(doc.tags) && doc.tags.length) data.keywords = doc.tags.join(', ');
    // Escaped so a "</script>" inside any content field cannot close the tag.
    return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
}

function buildArticlePage(template, doc, kind) {
    const canonical = SITE + kind.base + '/' + doc.slug + '/';
    const title = doc.title + ' — ' + AUTHOR;
    const html = template
        .replace(/\{\{TITLE\}\}/g, attr(title))
        .replace(/\{\{OG_TITLE\}\}/g, attr(doc.title))
        .replace(/\{\{DESCRIPTION\}\}/g, attr(summaryOf(doc)))
        .replace(/\{\{CANONICAL\}\}/g, attr(canonical))
        .replace(/\{\{IMAGE\}\}/g, attr(coverOf(doc)))
        .replace(/\{\{PUBLISHED\}\}/g, attr(isoDate(doc)))
        .replace(/\{\{MODIFIED\}\}/g, attr(modifiedDate(doc)))
        .replace(/\{\{JSONLD\}\}/, jsonLd(doc, kind, canonical))
        .replace(/\{\{ARTICLE\}\}/, Article.renderArticle(doc, kind.back, kind.backLabel));

    write(kind.base.replace(/^\//, '') + '/' + doc.slug + '/index.html', html);
    return canonical;
}

// Fills a grid element's contents in place, keyed off its data-projects attribute.
function injectGrid(html, cardsHtml) {
    return html.replace(
        /(<div class="projects-grid"[^>]*data-projects[^>]*>)([\s\S]*?)(<\/div>)/,
        (m, open, _inner, close) => open + cardsHtml + '\n            ' + close
    );
}

function orderMixed(items) {
    return items.slice().sort((a, b) => {
        const sa = a.sortOrder == null ? 9999 : a.sortOrder;
        const sb = b.sortOrder == null ? 9999 : b.sortOrder;
        if (sa !== sb) return sa - sb;
        return String(b.year || '').localeCompare(String(a.year || ''));
    });
}

/* ------------------------------------------------------------------- feeds */

function buildSitemap(urls) {
    const body = urls.map(u => {
        const loc = '    <loc>' + Article.escapeHtml(u.loc) + '</loc>';
        const mod = u.lastmod ? '\n    <lastmod>' + u.lastmod.slice(0, 10) + '</lastmod>' : '';
        return '  <url>\n' + loc + mod + '\n  </url>';
    }).join('\n');
    return '<?xml version="1.0" encoding="UTF-8"?>\n'
        + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + body + '\n</urlset>\n';
}

function buildFeed(writings) {
    const items = writings.map(doc => {
        const link = SITE + '/writing/' + doc.slug + '/';
        const pub = isoDate(doc);
        return '    <item>\n'
            + '      <title>' + Article.escapeHtml(doc.title) + '</title>\n'
            + '      <link>' + link + '</link>\n'
            + '      <guid isPermaLink="true">' + link + '</guid>\n'
            + (pub ? '      <pubDate>' + new Date(pub).toUTCString() + '</pubDate>\n' : '')
            + '      <description>' + Article.escapeHtml(summaryOf(doc)) + '</description>\n'
            + '    </item>';
    }).join('\n');

    return '<?xml version="1.0" encoding="UTF-8"?>\n'
        + '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n'
        + '  <channel>\n'
        + '    <title>' + AUTHOR + ' — Writing</title>\n'
        + '    <link>' + SITE + '/writings</link>\n'
        + '    <description>Notes on design, products, and systems.</description>\n'
        + '    <language>en</language>\n'
        + '    <atom:link href="' + SITE + '/feed.xml" rel="self" type="application/rss+xml"/>\n'
        + items + '\n'
        + '  </channel>\n</rss>\n';
}

/* -------------------------------------------------------------------- main */

async function main() {
    const offline = process.argv.includes('--offline');

    console.log('Building into dist/');
    // Clear the contents rather than the directory itself: a dev server that
    // chdir'd into dist/ would otherwise be left pointing at a deleted inode.
    fs.mkdirSync(DIST, { recursive: true });
    for (const entry of fs.readdirSync(DIST)) {
        fs.rmSync(path.join(DIST, entry), { recursive: true, force: true });
    }

    const content = await loadContent(offline);
    const writings = content.writings || [];
    const projects = content.projects || [];
    console.log('  ' + writings.length + ' writings, ' + projects.length + ' projects');

    // 1. static passthrough
    for (const entry of STATIC) {
        const from = path.join(ROOT, entry);
        if (!fs.existsSync(from)) continue;
        fs.cpSync(from, path.join(DIST, entry), { recursive: true });
    }
    for (const extra of ['about.html']) {
        const from = path.join(ROOT, extra);
        if (fs.existsSync(from)) write(extra, absolutize(fs.readFileSync(from, 'utf8')));
    }

    // 2. article pages
    const template = fs.readFileSync(path.join(TEMPLATES, 'article.html'), 'utf8');
    const urls = STATIC_URLS.map(u => ({ loc: SITE + (u === '/' ? '/' : u) }));

    for (const doc of writings) {
        urls.push({ loc: buildArticlePage(template, doc, KINDS.writing), lastmod: modifiedDate(doc) });
    }
    for (const doc of projects) {
        urls.push({ loc: buildArticlePage(template, doc, KINDS.project), lastmod: modifiedDate(doc) });
    }
    console.log('  ' + (writings.length + projects.length) + ' article pages');

    // 3. listing pages with their grids filled in
    const featured = orderMixed(
        writings.filter(d => d.featured).map(d => Object.assign({ _type: 'writing' }, d))
            .concat(projects.filter(d => d.featured).map(d => Object.assign({ _type: 'project' }, d)))
    );
    const gridFor = {
        'index.html': featured,
        'work.html': projects.map(d => Object.assign({ _type: 'project' }, d)),
        'writings.html': writings.map(d => Object.assign({ _type: 'writing' }, d)),
    };

    for (const [source, out, target] of LISTINGS) {
        let html = absolutize(fs.readFileSync(path.join(ROOT, source), 'utf8'));
        html = injectGrid(html, Cards.renderGrid(gridFor[source], target));
        html = html.replace('</head>',
            '    <link rel="alternate" type="application/rss+xml" title="' + AUTHOR + ' — Writing" href="' + SITE + '/feed.xml">\n</head>');
        assertNoRelativeRefs(html, out);
        write(out, html);
    }
    console.log('  ' + LISTINGS.length + ' listing pages');

    // 4. legacy ?slug= shims
    const shim = fs.readFileSync(path.join(TEMPLATES, 'redirect.html'), 'utf8');
    write('writing/index.html', shim
        .replace(/\{\{BASE\}\}/g, '/writing')
        .replace(/\{\{FALLBACK\}\}/g, '/writings'));
    write('case.html', shim
        .replace(/\{\{BASE\}\}/g, '/work')
        .replace(/\{\{FALLBACK\}\}/g, '/work'));

    // 5. feeds
    write('sitemap.xml', buildSitemap(urls));
    write('feed.xml', buildFeed(writings));
    console.log('  sitemap.xml (' + urls.length + ' urls), feed.xml');

    console.log('Done.');
}

main().catch(err => {
    console.error('BUILD FAILED:', err.message);
    process.exit(1);
});
