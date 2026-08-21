// Shared card-grid renderer, loaded by both the browser (scripts/projects.js)
// and Node (build/prerender.js). See the note at the top of render-article.js:
// one copy of the markup, two callers.
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.CardRenderer = factory();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var SANITY_PROJECT_ID = 'qgasa874';
    var SANITY_DATASET = 'production';
    var SANITY_API = 'https://' + SANITY_PROJECT_ID + '.api.sanity.io/v2021-10-21/data/query/' + SANITY_DATASET;

    // Card thumbnails: 800px wide, auto WebP/AVIF, cropped to fit.
    var COVER_SIZE = 'w=800&auto=format&fit=max';

    var CARD_FIELDS = '_type,title,"slug":slug.current,year,"image":image.asset->url,description,tags,featured';

    var SOURCE_QUERY = {
        'projects.json': '*[_type=="project"]|order(coalesce(sortOrder, 9999) asc, year desc){' + CARD_FIELDS + '}',
        'writings.json': '*[_type=="writing"]|order(coalesce(sortOrder, 9999) asc, year desc){' + CARD_FIELDS + '}',
        // Featured grid on the home page mixes featured projects and featured writings.
        'featured.json': '*[(_type=="project" || _type=="writing") && featured==true]|order(coalesce(sortOrder, 9999) asc, year desc){' + CARD_FIELDS + '}',
    };

    // Route writing cards to /writing; everything else uses the grid's configured target.
    function resolveTarget(item, defaultTarget) {
        return item && item._type === 'writing' ? '/writing' : defaultTarget;
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
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
        var looksLikePath = /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(value) || /^https?:\/\//i.test(value) || value.indexOf('/') !== -1;
        if (looksLikePath) {
            return '<img src="' + escapeHtml(optimize(value, COVER_SIZE)) + '" alt="" loading="lazy">';
        }
        return escapeHtml(value);
    }

    // Clean path, with the trailing slash, so crawlers never eat a 301 hop.
    function articleHref(target, slug) {
        return target.replace(/\/$/, '') + '/' + encodeURIComponent(slug) + '/';
    }

    function renderCard(project, target) {
        var tags = Array.isArray(project.tags) ? project.tags : [];
        var tagsHtml = tags
            .map(function (tag) { return '<span class="tag">' + escapeHtml(tag) + '</span>'; })
            .join('');

        var slug = (project.slug || '').trim();
        var tag = slug ? 'a' : 'div';
        var href = slug ? ' href="' + escapeHtml(articleHref(target, slug)) + '"' : '';

        return '\n            <' + tag + ' class="project-card"' + href + '>\n                <div class="project-image">' + renderImage(project.image) + '</div>\n                <div class="project-content">\n                    <div class="project-meta">\n                        <h3 class="project-title">' + escapeHtml(project.title) + '</h3>\n                        <span class="project-year">' + escapeHtml(project.year) + '</span>\n                    </div>\n                    <p class="project-description">' + escapeHtml(project.description) + '</p>\n                    <div class="project-tags">' + tagsHtml + '</div>\n                </div>\n            </' + tag + '>';
    }

    function renderGrid(items, defaultTarget) {
        return (items || []).map(function (item) {
            return renderCard(item, resolveTarget(item, defaultTarget));
        }).join('');
    }

    return {
        SANITY_API: SANITY_API,
        SOURCE_QUERY: SOURCE_QUERY,
        COVER_SIZE: COVER_SIZE,
        escapeHtml: escapeHtml,
        optimize: optimize,
        renderImage: renderImage,
        articleHref: articleHref,
        resolveTarget: resolveTarget,
        renderCard: renderCard,
        renderGrid: renderGrid,
    };
});
