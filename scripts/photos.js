/*
 * Click a polaroid, see the photograph.
 *
 * The grid crops each photo to the frame's 0.9 shape; this shows the whole
 * 4:5 as it was shot, which is the only place the full composition exists.
 *
 * Built on a native <dialog>, so the focus trap, the return of focus on
 * close, Escape, and the backdrop are all the browser's work rather than
 * ours. What is left is the gallery part: which photo, and moving between
 * them. See docs/components.md, "Photo wall".
 */
(function () {
    var wall = document.querySelector('.photo-wall');
    var dialog = document.querySelector('.lightbox');
    if (!wall || !dialog || typeof dialog.showModal !== 'function') return;

    var img = dialog.querySelector('.lightbox-image');
    var caption = dialog.querySelector('.lightbox-caption');
    var frames = [].slice.call(wall.querySelectorAll('.polaroid'));
    var index = 0;

    /* The figures are upgraded here rather than marked up as buttons, so that
       without JS they stay plain figures instead of controls that do nothing. */
    frames.forEach(function (frame, i) {
        frame.tabIndex = 0;
        frame.setAttribute('role', 'button');
        frame.setAttribute('aria-haspopup', 'dialog');
        var label = frame.querySelector('.polaroid-caption');
        frame.setAttribute('aria-label', 'View photograph: ' + (label ? label.textContent.trim() : ''));
        frame.addEventListener('click', function () { open(i); });
        frame.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
        });
    });

    function show(i) {
        index = (i + frames.length) % frames.length;
        var source = frames[index].querySelector('.polaroid-photo');
        /* Same file the grid already loaded, so this is a cache hit and the
           photo is there on the first frame rather than flashing empty. */
        img.src = source.currentSrc || source.src;
        img.alt = source.alt;
        caption.textContent = frames[index].querySelector('.polaroid-caption').textContent;
    }

    function open(i) {
        show(i);
        dialog.showModal();
    }

    dialog.querySelector('.lightbox-close').addEventListener('click', function () { dialog.close(); });
    dialog.querySelector('.lightbox-prev').addEventListener('click', function () { show(index - 1); });
    dialog.querySelector('.lightbox-next').addEventListener('click', function () { show(index + 1); });

    /* Clicking the backdrop reports the dialog itself as the target, since the
       backdrop is not an element you can hit. Anything inside is a real child. */
    dialog.addEventListener('click', function (e) {
        if (e.target === dialog) dialog.close();
    });

    dialog.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    });

    /* A dialog restores focus to whatever was focused when it opened — which
       is the wrong frame the moment someone arrows across to another photo,
       and is nothing at all when the click never moved focus in the first
       place. Put it back explicitly, on the photo they were actually looking
       at when they closed. */
    dialog.addEventListener('close', function () {
        frames[index].focus();
    });
})();
