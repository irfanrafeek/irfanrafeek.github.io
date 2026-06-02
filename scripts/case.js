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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
