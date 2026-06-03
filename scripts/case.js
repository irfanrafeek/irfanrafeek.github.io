// Renders a single case study into [data-case] based on ?slug= in the URL.
// Block types: heading, paragraph, image, quote.
(function () {
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
                return `<h2 class="case-heading">${escapeHtml(block.text)}</h2>`;
            case 'paragraph':
                return `<p class="case-paragraph">${escapeHtml(block.text)}</p>`;
            case 'image':
                return `
                    <figure class="case-figure">
                        <img class="case-image" src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || '')}" loading="lazy">
                        ${block.caption ? `<figcaption class="case-caption">${escapeHtml(block.caption)}</figcaption>` : ''}
                    </figure>`;
            case 'quote':
                return `
                    <blockquote class="case-quote">
                        <p>${escapeHtml(block.text)}</p>
                        ${block.attribution ? `<cite class="case-cite">${escapeHtml(block.attribution)}</cite>` : ''}
                    </blockquote>`;
            case 'video':
                return `
                    <figure class="case-figure">
                        <video class="case-video" src="${escapeHtml(block.src)}"
                            ${block.poster ? `poster="${escapeHtml(block.poster)}"` : ''}
                            controls playsinline preload="metadata"></video>
                        ${block.caption ? `<figcaption class="case-caption">${escapeHtml(block.caption)}</figcaption>` : ''}
                    </figure>`;
            case 'list': {
                const items = (Array.isArray(block.items) ? block.items : [])
                    .map((item) => `<li class="case-list-item">${escapeHtml(item)}</li>`)
                    .join('');
                return `<ul class="case-list">${items}</ul>`;
            }
            case 'gallery': {
                const items = Array.isArray(block.items) ? block.items : [];
                if (!items.length) return '';
                const itemsHtml = items.map((item) => `
                    <figure class="case-gallery__item">
                        <img class="case-gallery__image" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || '')}" loading="lazy">
                        ${item.caption ? `<figcaption class="case-caption">${escapeHtml(item.caption)}</figcaption>` : ''}
                    </figure>`).join('');
                const navIcon = (dir) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="${dir==='prev'?'15 18 9 12 15 6':'9 18 15 12 9 6'}"/></svg>`;
                return `
                    <div class="case-gallery" data-gallery>
                        <div class="case-gallery__viewport">
                            <div class="case-gallery__track" data-gallery-track>${itemsHtml}</div>
                        </div>
                        <div class="case-gallery__controls">
                            <button class="case-gallery__nav" type="button" data-gallery-prev aria-label="Previous image">${navIcon('prev')}</button>
                            <span class="case-gallery__counter" data-gallery-counter>1 / ${items.length}</span>
                            <button class="case-gallery__nav" type="button" data-gallery-next aria-label="Next image">${navIcon('next')}</button>
                        </div>
                    </div>`;
            }
            default:
                return '';
        }
    }

    function renderArticle(project) {
        const tags = Array.isArray(project.tags) ? project.tags : [];
        const tagsHtml = tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');
        const blocks = Array.isArray(project.blocks) ? project.blocks : [];
        const bodyHtml = blocks.map(renderBlock).join('');

        return `
            <header class="case-header">
                <a href="work.html" class="case-back">← All work</a>
                <div class="case-meta">
                    <h1 class="case-title">${escapeHtml(project.title)}</h1>
                    <span class="project-year">${escapeHtml(project.year)}</span>
                </div>
                <p class="case-summary">${escapeHtml(project.description)}</p>
                <div class="project-tags">${tagsHtml}</div>
            </header>
            <div class="case-body">${bodyHtml}</div>`;
    }

    function renderNotFound(slug) {
        return `
            <header class="case-header">
                <a href="work.html" class="case-back">← All work</a>
                <h1 class="case-title">Case study not found</h1>
                <p class="case-summary">No project matches "${escapeHtml(slug || '')}".</p>
            </header>`;
    }

    async function init() {
        const root = document.querySelector('[data-case]');
        if (!root) return;

        const slug = new URLSearchParams(window.location.search).get('slug');

        let projects;
        try {
            const res = await fetch('projects.json', { cache: 'no-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            projects = Array.isArray(data) ? data : data.projects || [];
        } catch (err) {
            console.error('Could not load projects.json:', err);
            root.innerHTML = renderNotFound(slug);
            return;
        }

        const project = projects.find((p) => p.slug === slug);
        if (!project) {
            root.innerHTML = renderNotFound(slug);
            return;
        }

        document.title = `${project.title} — Irfan Rafeek`;
        root.innerHTML = renderArticle(project);
        initGalleries(root);
    }

    function initGalleries(root) {
        root.querySelectorAll('[data-gallery]').forEach((gallery) => {
            const track = gallery.querySelector('[data-gallery-track]');
            const counter = gallery.querySelector('[data-gallery-counter]');
            const prev = gallery.querySelector('[data-gallery-prev]');
            const next = gallery.querySelector('[data-gallery-next]');
            const total = track.children.length;
            if (total <= 1) {
                prev.disabled = next.disabled = true;
                return;
            }
            let index = 0;
            const update = () => {
                track.style.transform = `translateX(-${index * 100}%)`;
                counter.textContent = `${index + 1} / ${total}`;
                prev.disabled = index === 0;
                next.disabled = index === total - 1;
            };
            prev.addEventListener('click', () => { if (index > 0) { index--; update(); } });
            next.addEventListener('click', () => { if (index < total - 1) { index++; update(); } });
            update();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
