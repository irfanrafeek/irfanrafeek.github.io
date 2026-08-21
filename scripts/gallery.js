// Wires up the image galleries inside a prerendered article.
//
// The markup now arrives in the HTML rather than being built at runtime, so all
// that is left for the browser is the paging behaviour.
(function () {
    function initGalleries(root) {
        root.querySelectorAll('[data-gallery]').forEach(function (gallery) {
            var track = gallery.querySelector('[data-gallery-track]');
            var counter = gallery.querySelector('[data-gallery-counter]');
            var prev = gallery.querySelector('[data-gallery-prev]');
            var next = gallery.querySelector('[data-gallery-next]');
            if (!track || !prev || !next) return;

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

    function init() { initGalleries(document); }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
