// Renders a single case study / writing into [data-case] based on ?slug= in the URL.
// Fetches content from Sanity using a safe parameterised GROQ query.
(function () {
    var SANITY_PROJECT_ID = 'qgasa874';
    var SANITY_DATASET = 'production';
    var SANITY_API = 'https://' + SANITY_PROJECT_ID + '.api.sanity.io/v2021-10-21/data/query/' + SANITY_DATASET;

    var SOURCE_TYPE = {
        'projects.json': 'project',
        'writings.json': 'writing',
    };

    // GROQ projection: maps Sanity fields back to the shape the renderer expects.
    // galleryItems → items, embedTitle → title for embed blocks.
    var BLOCKS_PROJECTION = [
        'type',
        'text',
        'src',
        'alt',
        'caption',
        'poster',
        'attribution',
        '"title": coalesce(embedTitle, "")',
        '"items": select(type == "gallery" => galleryItems[]{src,alt,caption}, items)',
    ].join(',')

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderBlock(block) {
        switch (block.type) {
            case 'heading':
                return '<h2 class="case-heading">' + escapeHtml(block.text) + '</h2>';
            case 'paragraph':
                return '<p class="case-paragraph">' + escapeHtml(block.text) + '</p>';
            case 'image':
                return '\n                    <figure class="case-figure">\n                        <img class="case-image" src="' + escapeHtml(block.src) + '" alt="' + escapeHtml(block.alt || '') + '" loading="lazy">\n                        ' + (block.caption ? '<figcaption class="case-caption">' + escapeHtml(block.caption) + '</figcaption>' : '') + '\n                    </figure>';
            case 'quote':
                return '\n                    <blockquote class="case-quote">\n                        <p>' + escapeHtml(block.text) + '</p>\n                        ' + (block.attribution ? '<cite class="case-cite">' + escapeHtml(block.attribution) + '</cite>' : '') + '\n                    </blockquote>';
            case 'video':
                return '\n                    <figure class="case-figure">\n                        <video class="case-video" src="' + escapeHtml(block.src) + '"\n                            ' + (block.poster ? 'poster="' + escapeHtml(block.poster) + '"' : '') + '\n                            controls playsinline preload="metadata"></video>\n                        ' + (block.caption ? '<figcaption class="case-caption">' + escapeHtml(block.caption) + '</figcaption>' : '') + '\n                    </figure>';
            case 'list': {
                var items = (Array.isArray(block.items) ? block.items : [])
                    .map(function (item) { return '<li class="case-list-item">' + escapeHtml(item) + '</li>'; })
                    .join('');
                return '<ul class="case-list">' + items + '</ul>';
            }
            case 'numbered_list': {
                var items = (Array.isArray(block.items) ? block.items : [])
                    .map(function (item) { return '<li class="case-list-item">' + escapeHtml(item) + '</li>'; })
                    .join('');
                return '<ol class="case-list case-list--ordered">' + items + '</ol>';
            }
            case 'embed': {
                if (!block.src) return '';
                var title = block.title || 'Embedded content';
                return '\n                    <figure class="case-figure">\n                        <div class="case-embed">\n                            <iframe class="case-embed__frame" src="' + escapeHtml(block.src) + '" title="' + escapeHtml(title) + '" loading="lazy" allowfullscreen></iframe>\n                        </div>\n                        ' + (block.caption ? '<figcaption class="case-caption">' + escapeHtml(block.caption) + '</figcaption>' : '') + '\n                    </figure>';
            }
            case 'gallery': {
                var items = Array.isArray(block.items) ? block.items : [];
                if (!items.length) return '';
                var itemsHtml = items.map(function (item) { return '\n                    <figure class="case-gallery__item">\n                        <img class="case-gallery__image" src="' + escapeHtml(item.src) + '" alt="' + escapeHtml(item.alt || '') + '" loading="lazy">\n                        ' + (item.caption ? '<figcaption class="case-caption">' + escapeHtml(item.caption) + '</figcaption>' : '') + '\n                    </figure>'; }).join('');
                var navIcon = function (dir) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="' + (dir === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6') + '"/></svg>'; };
                return '\n                    <div class="case-gallery" data-gallery>\n                        <div class="case-gallery__viewport">\n                            <div class="case-gallery__track" data-gallery-track>' + itemsHtml + '</div>\n                        </div>\n                        <div class="case-gallery__controls">\n                            <button class="case-gallery__nav" type="button" data-gallery-prev aria-label="Previous image">' + navIcon('prev') + '</button>\n                            <span class="case-gallery__counter" data-gallery-counter>1 / ' + items.length + '</span>\n                            <button class="case-gallery__nav" type="button" data-gallery-next aria-label="Next image">' + navIcon('next') + '</button>\n                        </div>\n                    </div>';
            }
            default:
                return '';
        }
    }

    function renderArticle(project, backTarget, backLabel) {
        var tags = Array.isArray(project.tags) ? project.tags : [];
        var tagsHtml = tags.map(function (t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; }).join('');
        var blocks = Array.isArray(project.blocks) ? project.blocks : [];
        var bodyHtml = blocks.map(renderBlock).join('');

        return '\n            <header class="case-header">\n                <a href="' + escapeHtml(backTarget) + '" class="case-back">← ' + escapeHtml(backLabel) + '</a>\n                <div class="case-meta">\n                    <h1 class="case-title">' + escapeHtml(project.title) + '</h1>\n                    <span class="project-year">' + escapeHtml(project.year) + '</span>\n                </div>\n                <p class="case-summary">' + escapeHtml(project.description) + '</p>\n                <div class="project-tags">' + tagsHtml + '</div>\n            </header>\n            <div class="case-body">' + bodyHtml + '</div>';
    }

    function renderNotFound(slug, backTarget, backLabel, kindLabel) {
        return '\n            <header class="case-header">\n                <a href="' + escapeHtml(backTarget) + '" class="case-back">← ' + escapeHtml(backLabel) + '</a>\n                <h1 class="case-title">' + escapeHtml(kindLabel) + ' not found</h1>\n                <p class="case-summary">No entry matches "' + escapeHtml(slug || '') + '".</p>\n            </header>';
    }

    async function init() {
        var root = document.querySelector('[data-case]');
        if (!root) return;

        var source     = root.getAttribute('data-source') || 'projects.json';
        var backTarget = root.getAttribute('data-back')   || 'work.html';
        var backLabel  = root.getAttribute('data-back-label') || 'All work';
        var kindLabel  = root.getAttribute('data-kind') || 'Case study';

        var slug = new URLSearchParams(window.location.search).get('slug') || '';
        var docType = SOURCE_TYPE[source] || 'project';

        var query = '*[_type==$type&&slug.current==$slug][0]{title,"slug":slug.current,year,description,tags,"blocks":blocks[]{' + BLOCKS_PROJECTION + '}}';
        var url = SANITY_API
            + '?query=' + encodeURIComponent(query)
            + '&$type=' + encodeURIComponent(JSON.stringify(docType))
            + '&$slug=' + encodeURIComponent(JSON.stringify(slug));

        var project;
        try {
            var res = await fetch(url);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            var data = await res.json();
            project = data.result;
        } catch (err) {
            console.error('Could not load from Sanity:', err);
            root.innerHTML = renderNotFound(slug, backTarget, backLabel, kindLabel);
            return;
        }

        if (!project) {
            root.innerHTML = renderNotFound(slug, backTarget, backLabel, kindLabel);
            return;
        }

        document.title = project.title + ' — Irfan Rafeek';
        root.innerHTML = renderArticle(project, backTarget, backLabel);
        initGalleries(root);
    }

    function initGalleries(root) {
        root.querySelectorAll('[data-gallery]').forEach(function (gallery) {
            var track = gallery.querySelector('[data-gallery-track]');
            var counter = gallery.querySelector('[data-gallery-counter]');
            var prev = gallery.querySelector('[data-gallery-prev]');
            var next = gallery.querySelector('[data-gallery-next]');
            var total = track.children.length;
            if (total <= 1) {
                prev.disabled = next.disabled = true;
                return;
            }
            var index = 0;
            var update = function () {
                track.style.transform = 'translateX(-' + (index * 100) + '%)';
                counter.textContent = (index + 1) + ' / ' + total;
                prev.disabled = index === 0;
                next.disabled = index === total - 1;
            };
            prev.addEventListener('click', function () { if (index > 0) { index--; update(); } });
            next.addEventListener('click', function () { if (index < total - 1) { index++; update(); } });
            update();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
