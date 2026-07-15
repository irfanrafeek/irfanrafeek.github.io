// Renders project / writing cards from Sanity into any element with [data-projects].
// Usage in markup:
//   <div class="projects-grid" data-projects></div>
//   <div class="projects-grid" data-projects="featured"></div>
// Optional attributes:
//   data-source="writings.json"    -> load writings instead of projects (default: projects.json)
//   data-target="writing.html"     -> swap the card link target (default: case.html)
(function () {
    var SANITY_PROJECT_ID = 'qgasa874';
    var SANITY_DATASET = 'production';
    var SANITY_API = 'https://' + SANITY_PROJECT_ID + '.api.sanity.io/v2021-10-21/data/query/' + SANITY_DATASET;

    // Card thumbnails: 800px wide, auto WebP/AVIF, cropped to fit.
    var COVER_SIZE = 'w=800&auto=format&fit=max';

    var SOURCE_QUERY = {
        'projects.json': '*[_type=="project"]|order(coalesce(sortOrder, 9999) asc, year desc){title,"slug":slug.current,year,"image":image.asset->url,description,tags,featured}',
        'writings.json': '*[_type=="writing"]|order(coalesce(sortOrder, 9999) asc, year desc){title,"slug":slug.current,year,"image":image.asset->url,description,tags,featured}',
    };

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Append optimization params for Sanity CDN URLs; leave others (emoji, legacy paths) untouched.
    function optimize(url, size) {
        var value = (url || '').trim();
        if (!value) return value;
        if (value.indexOf('cdn.sanity.io') === -1) return value;
        return value + (value.indexOf('?') === -1 ? '?' : '&') + size;
    }

    // An emoji/short string renders as text; a path or URL renders as an image.
    function renderImage(image) {
        var value = (image || '').trim();
        var looksLikePath = /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(value) || /^https?:\/\//i.test(value) || value.includes('/');
        if (looksLikePath) {
            return '<img src="' + escapeHtml(optimize(value, COVER_SIZE)) + '" alt="" loading="lazy">';
        }
        return escapeHtml(value);
    }

    function renderCard(project, target) {
        var tags = Array.isArray(project.tags) ? project.tags : [];
        var tagsHtml = tags
            .map(function (tag) { return '<span class="tag">' + escapeHtml(tag) + '</span>'; })
            .join('');

        var slug = (project.slug || '').trim();
        var tag = slug ? 'a' : 'div';
        var href = slug ? ' href="' + escapeHtml(target) + '?slug=' + encodeURIComponent(slug) + '"' : '';

        return '\n            <' + tag + ' class="project-card"' + href + '>\n                <div class="project-image">' + renderImage(project.image) + '</div>\n                <div class="project-content">\n                    <div class="project-meta">\n                        <h3 class="project-title">' + escapeHtml(project.title) + '</h3>\n                        <span class="project-year">' + escapeHtml(project.year) + '</span>\n                    </div>\n                    <p class="project-description">' + escapeHtml(project.description) + '</p>\n                    <div class="project-tags">' + tagsHtml + '</div>\n                </div>\n            </' + tag + '>';
    }

    // Cache fetched data so multiple grids sharing the same source only hit the network once.
    var _cache = new Map();
    async function loadItems(source) {
        if (_cache.has(source)) return _cache.get(source);
        var query = SOURCE_QUERY[source] || SOURCE_QUERY['projects.json'];
        var url = SANITY_API + '?query=' + encodeURIComponent(query);
        var res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        var items = data.result || [];
        _cache.set(source, items);
        return items;
    }

    async function init() {
        var grids = document.querySelectorAll('[data-projects]');
        if (!grids.length) return;

        for (var grid of grids) {
            var source = grid.getAttribute('data-source') || 'projects.json';
            var target = grid.getAttribute('data-target') || 'case.html';
            var mode = grid.getAttribute('data-projects');
            var items;
            try {
                items = await loadItems(source);
            } catch (err) {
                console.error('Could not load from Sanity:', err);
                continue;
            }
            var list = mode === 'featured' ? items.filter(function (p) { return p.featured; }) : items;
            grid.innerHTML = list.map(function (item) { return renderCard(item, target); }).join('');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
