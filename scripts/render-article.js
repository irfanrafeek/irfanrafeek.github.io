// Shared article renderer. Turns a Sanity document into the article markup.
//
// Loaded in two places and it must stay that way: the browser (scripts/case.js,
// for legacy ?slug= URLs) and Node (build/prerender.js, which bakes the same
// markup into static files). If this ever gets forked into a build-only copy,
// the prerendered pages will drift away from the CSS within a month.
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.ArticleRenderer = factory();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var SANITY_PROJECT_ID = 'qgasa874';
    var SANITY_DATASET = 'production';
    var SANITY_API = 'https://' + SANITY_PROJECT_ID + '.api.sanity.io/v2021-10-21/data/query/' + SANITY_DATASET;

    var SOURCE_TYPE = {
        'projects.json': 'project',
        'writings.json': 'writing',
    };

    // Expand image asset references to CDN URLs with sizing hints via `asset->url`.
    // Body images get a wider size than gallery items so hero images stay sharp.
    var BODY_PROJECTION = 'body[]{...,'
        + '_type == "mediaImage" => {..., "src": asset->url + "?w=1400&auto=format&fit=max"},'
        + '_type == "mediaGallery" => {..., items[]{..., "src": asset->url + "?w=1400&auto=format&fit=max"}}'
        + '}';

    var ARTICLE_FIELDS = 'title,"slug":slug.current,year,description,seoDescription,'
        + 'publishedAt,updatedAt,_createdAt,_updatedAt,tags,"image":image.asset->url,' + BODY_PROJECTION;

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Render one inline span with its marks (bold, italic, links, etc.)
    function renderSpan(span, markDefs) {
        var text = escapeHtml(span.text || '');
        var marks = Array.isArray(span.marks) ? span.marks : [];
        var opens = '', closes = '';
        marks.forEach(function (mark) {
            if (mark === 'strong')     { opens += '<strong>';  closes = '</strong>' + closes; }
            else if (mark === 'em')    { opens += '<em>';      closes = '</em>' + closes; }
            else if (mark === 'underline') { opens += '<u>';   closes = '</u>' + closes; }
            else if (mark === 'code')  { opens += '<code>';    closes = '</code>' + closes; }
            else {
                var def = (markDefs || []).find(function (d) { return d._key === mark; });
                if (def && def._type === 'link' && def.href) {
                    opens += '<a href="' + escapeHtml(def.href) + '" target="_blank" rel="noopener noreferrer">';
                    closes = '</a>' + closes;
                }
            }
        });
        return opens + text + closes;
    }

    function renderTextBlock(block) {
        var children = (Array.isArray(block.children) ? block.children : [])
            .map(function (span) { return renderSpan(span, block.markDefs); })
            .join('');

        switch (block.style) {
            case 'h2':         return '<h2 class="case-heading">' + children + '</h2>';
            case 'h3':         return '<h3 class="case-subheading">' + children + '</h3>';
            case 'blockquote': return '<blockquote class="case-quote"><p>' + children + '</p></blockquote>';
            default:           return '<p class="case-paragraph">' + children + '</p>';
        }
    }

    function renderMediaImage(block) {
        return '<figure class="case-figure">'
            + '<img class="case-image" src="' + escapeHtml(block.src || '') + '" alt="' + escapeHtml(block.alt || '') + '" loading="lazy">'
            + (block.caption ? '<figcaption class="case-caption">' + escapeHtml(block.caption) + '</figcaption>' : '')
            + '</figure>';
    }

    function renderMediaVideo(block) {
        return '<figure class="case-figure">'
            + '<video class="case-video" src="' + escapeHtml(block.src || '') + '"'
            + (block.poster ? ' poster="' + escapeHtml(block.poster) + '"' : '')
            + ' controls playsinline preload="metadata"></video>'
            + (block.caption ? '<figcaption class="case-caption">' + escapeHtml(block.caption) + '</figcaption>' : '')
            + '</figure>';
    }

    function renderMediaEmbed(block) {
        if (!block.src) return '';
        var title = block.title || 'Embedded content';
        return '<figure class="case-figure"><div class="case-embed">'
            + '<iframe class="case-embed__frame" src="' + escapeHtml(block.src) + '" title="' + escapeHtml(title) + '" loading="lazy" allowfullscreen></iframe>'
            + '</div>'
            + (block.caption ? '<figcaption class="case-caption">' + escapeHtml(block.caption) + '</figcaption>' : '')
            + '</figure>';
    }

    // The playable skater from the homepage, dropped into an article. Only the
    // container is emitted: scripts/skate.js owns the scene's markup and fills
    // this in, exactly as it does on the homepage. build/prerender.js adds that
    // script to a page only when its body actually carries one of these.
    function renderSkateGame(block) {
        var label = block.label
            || 'Small skating game. Click or press space to play and to jump.';
        return '<figure class="case-figure case-skate">'
            + '<div class="skate" data-skate tabindex="0" role="button" aria-label="' + escapeHtml(label) + '"></div>'
            + (block.caption ? '<figcaption class="case-caption">' + escapeHtml(block.caption) + '</figcaption>' : '')
            + '</figure>';
    }

    function renderMediaGallery(block) {
        var items = Array.isArray(block.items) ? block.items : [];
        if (!items.length) return '';
        var itemsHtml = items.map(function (item) {
            return '<figure class="case-gallery__item">'
                + '<img class="case-gallery__image" src="' + escapeHtml(item.src || '') + '" alt="' + escapeHtml(item.alt || '') + '" loading="lazy">'
                + (item.caption ? '<figcaption class="case-caption">' + escapeHtml(item.caption) + '</figcaption>' : '')
                + '</figure>';
        }).join('');
        var navIcon = function (dir) {
            return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
                + '<polyline points="' + (dir === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6') + '"/></svg>';
        };
        return '<div class="case-gallery" data-gallery>'
            + '<div class="case-gallery__viewport"><div class="case-gallery__track" data-gallery-track>' + itemsHtml + '</div></div>'
            + '<div class="case-gallery__controls">'
            + '<button class="case-gallery__nav" type="button" data-gallery-prev aria-label="Previous image">' + navIcon('prev') + '</button>'
            + '<span class="case-gallery__counter" data-gallery-counter>1 / ' + items.length + '</span>'
            + '<button class="case-gallery__nav" type="button" data-gallery-next aria-label="Next image">' + navIcon('next') + '</button>'
            + '</div></div>';
    }

    // Group consecutive listItem blocks into <ul>/<ol> and render everything else inline.
    function renderBody(blocks) {
        if (!Array.isArray(blocks)) return '';
        var html = '';
        var i = 0;
        while (i < blocks.length) {
            var block = blocks[i];
            if (block._type === 'block' && block.listItem) {
                var listItem = block.listItem;
                var tag = listItem === 'number' ? 'ol' : 'ul';
                var cls = listItem === 'number' ? 'case-list case-list--ordered' : 'case-list';
                var items = '';
                while (i < blocks.length && blocks[i]._type === 'block' && blocks[i].listItem === listItem) {
                    var children = (Array.isArray(blocks[i].children) ? blocks[i].children : [])
                        .map(function (span) { return renderSpan(span, blocks[i].markDefs); })
                        .join('');
                    items += '<li class="case-list-item">' + children + '</li>';
                    i++;
                }
                html += '<' + tag + ' class="' + cls + '">' + items + '</' + tag + '>';
                continue;
            }
            switch (block._type) {
                case 'block':        html += renderTextBlock(block); break;
                case 'mediaImage':   html += renderMediaImage(block); break;
                case 'mediaVideo':   html += renderMediaVideo(block); break;
                case 'mediaGallery': html += renderMediaGallery(block); break;
                case 'mediaEmbed':   html += renderMediaEmbed(block); break;
                case 'skateGame':    html += renderSkateGame(block); break;
            }
            i++;
        }
        return html;
    }

    function renderArticle(project, backTarget, backLabel) {
        var tags = Array.isArray(project.tags) ? project.tags : [];
        var tagsHtml = tags.map(function (t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; }).join('');
        var bodyHtml = renderBody(project.body);

        return '<header class="case-header">'
            + '<a href="' + escapeHtml(backTarget) + '" class="case-back">← ' + escapeHtml(backLabel) + '</a>'
            + '<div class="case-meta">'
            + '<h1 class="case-title">' + escapeHtml(project.title) + '</h1>'
            + '<span class="project-year">' + escapeHtml(project.year) + '</span>'
            + '</div>'
            + '<p class="case-summary">' + escapeHtml(project.description) + '</p>'
            + '<div class="project-tags">' + tagsHtml + '</div>'
            + '</header>'
            + '<div class="case-body">' + bodyHtml + '</div>';
    }

    function renderNotFound(slug, backTarget, backLabel, kindLabel) {
        return '<header class="case-header">'
            + '<a href="' + escapeHtml(backTarget) + '" class="case-back">← ' + escapeHtml(backLabel) + '</a>'
            + '<h1 class="case-title">' + escapeHtml(kindLabel) + ' not found</h1>'
            + '<p class="case-summary">No entry matches "' + escapeHtml(slug || '') + '".</p>'
            + '</header>';
    }

    // Whether a body needs scripts/skate.js. The build asks before adding the
    // tag, so articles without the game do not pay for it.
    function hasSkateGame(blocks) {
        return Array.isArray(blocks) && blocks.some(function (b) {
            return b && b._type === 'skateGame';
        });
    }

    // One document by slug. Used by the browser fallback path.
    function singleQuery() {
        return '*[_type==$type&&slug.current==$slug][0]{' + ARTICLE_FIELDS + '}';
    }

    // Every document of a type, bodies included. Used by the build.
    function allQuery(type) {
        return '*[_type=="' + type + '" && defined(slug.current)]'
            + '|order(coalesce(sortOrder, 9999) asc, year desc)'
            + '{' + ARTICLE_FIELDS + ',sortOrder,featured}';
    }

    return {
        SANITY_API: SANITY_API,
        SOURCE_TYPE: SOURCE_TYPE,
        escapeHtml: escapeHtml,
        renderBody: renderBody,
        hasSkateGame: hasSkateGame,
        renderArticle: renderArticle,
        renderNotFound: renderNotFound,
        singleQuery: singleQuery,
        allQuery: allQuery,
    };
});
