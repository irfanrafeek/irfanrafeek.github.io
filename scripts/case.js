// Renders a single case study / writing into [data-case] based on ?slug= in the URL.
// Content comes from Sanity as Portable Text with custom media blocks.
(function () {
    var SANITY_PROJECT_ID = 'qgasa874';
    var SANITY_DATASET = 'production';
    var SANITY_API = 'https://' + SANITY_PROJECT_ID + '.api.sanity.io/v2021-10-21/data/query/' + SANITY_DATASET;

    var SOURCE_TYPE = {
        'projects.json': 'project',
        'writings.json': 'writing',
    };

    function escapeHtml(value) {
        return String(value)
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
            case 'h3':         return '<h3 class="case-heading">' + children + '</h3>';
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

    async function init() {
        var root = document.querySelector('[data-case]');
        if (!root) return;

        var source     = root.getAttribute('data-source') || 'projects.json';
        var backTarget = root.getAttribute('data-back')   || 'work.html';
        var backLabel  = root.getAttribute('data-back-label') || 'All work';
        var kindLabel  = root.getAttribute('data-kind') || 'Case study';

        var slug = new URLSearchParams(window.location.search).get('slug') || '';
        var docType = SOURCE_TYPE[source] || 'project';

        var query = '*[_type==$type&&slug.current==$slug][0]{title,"slug":slug.current,year,description,tags,body}';
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
