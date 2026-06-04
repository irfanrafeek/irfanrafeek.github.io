// Multi-theme switcher: light / sepia / slate / dark.
// Applies the saved theme via data-theme on <html> and wires the floating switcher.
(function () {
    const VALID = ['light', 'sepia', 'slate', 'dark'];
    const html = document.documentElement;

    // Apply a persisted explicit choice as early as possible (no data-theme = follow OS).
    const stored = localStorage.getItem('theme');
    if (VALID.includes(stored)) html.setAttribute('data-theme', stored);

    function currentTheme() {
        if (VALID.includes(stored)) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function init() {
        const switcher = document.getElementById('themeSwitcher');
        if (!switcher) return;
        const options = [...switcher.querySelectorAll('.theme-switcher__option')];

        const markActive = (theme) => {
            options.forEach((o) => o.classList.toggle('is-active', o.dataset.themeValue === theme));
        };
        markActive(currentTheme());

        options.forEach((btn) => {
            btn.addEventListener('click', () => {
                // Tapping the already-active option just toggles the pill (for touch, where there's no hover).
                if (btn.classList.contains('is-active')) {
                    switcher.classList.toggle('is-open');
                    return;
                }
                const value = btn.dataset.themeValue;
                html.setAttribute('data-theme', value);
                localStorage.setItem('theme', value);
                markActive(value);
                switcher.classList.remove('is-open');
            });
        });

        // Tap outside closes the expanded pill.
        document.addEventListener('click', (e) => {
            if (!switcher.contains(e.target)) switcher.classList.remove('is-open');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
