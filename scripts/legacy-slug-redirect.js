// Keeps the old query-string article URLs alive.
//
// Articles used to live at /writing?slug=x and /case?slug=x, and those links are
// out in the world on LinkedIn and in inboxes. They now resolve to a shim page
// that forwards to the prerendered /writing/x/ or /work/x/. The canonical tag on
// the shim points at the same place, so a crawler that does not run JS still
// learns where the real page is.
(function () {
    var shim = document.querySelector('[data-legacy-redirect]');
    if (!shim) return;

    var base = shim.getAttribute('data-legacy-redirect');   // "/writing" or "/work"
    var fallback = shim.getAttribute('data-fallback') || '/';
    var slug = new URLSearchParams(window.location.search).get('slug');

    var target = slug
        ? base.replace(/\/$/, '') + '/' + encodeURIComponent(slug) + '/'
        : fallback;

    window.location.replace(target);
})();
