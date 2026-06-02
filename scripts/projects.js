// Renders project cards from projects.json into any element with [data-projects].
// Usage in markup:
//   <div class="projects-grid" data-projects></div>              -> all projects
//   <div class="projects-grid" data-projects="featured"></div>   -> only featured ones
(function () {
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // An emoji/short string renders as text; a path or URL renders as an image.
    function renderImage(image) {
        const value = (image || '').trim();
        const looksLikePath = /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(value) || /^https?:\/\//i.test(value) || value.includes('/');
        if (looksLikePath) {
            return `<img src="${escapeHtml(value)}" alt="" loading="lazy">`;
        }
        return escapeHtml(value);
    }

    function renderCard(project) {
        const tags = Array.isArray(project.tags) ? project.tags : [];
        const tagsHtml = tags
            .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
            .join('');

        // A card with a slug links to its case study; otherwise it stays a plain block.
        const slug = (project.slug || '').trim();
        const tag = slug ? 'a' : 'div';
        const href = slug ? ` href="case.html?slug=${encodeURIComponent(slug)}"` : '';

        return `
            <${tag} class="project-card"${href}>
                <div class="project-image">${renderImage(project.image)}</div>
                <div class="project-content">
                    <div class="project-meta">
                        <h3 class="project-title">${escapeHtml(project.title)}</h3>
                        <span class="project-year">${escapeHtml(project.year)}</span>
                    </div>
                    <p class="project-description">${escapeHtml(project.description)}</p>
                    <div class="project-tags">${tagsHtml}</div>
                </div>
            </${tag}>`;
    }

    async function init() {
        const grids = document.querySelectorAll('[data-projects]');
        if (!grids.length) return;

        let projects;
        try {
            const res = await fetch('projects.json', { cache: 'no-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            projects = Array.isArray(data) ? data : data.projects || [];
        } catch (err) {
            console.error('Could not load projects.json:', err);
            return;
        }

        grids.forEach((grid) => {
            const mode = grid.getAttribute('data-projects');
            const list = mode === 'featured'
                ? projects.filter((p) => p.featured)
                : projects;
            grid.innerHTML = list.map(renderCard).join('');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
