/*
 * A small skater that lives under the About section.
 * Static and quiet until clicked — see components.css (.skate) for the styling.
 *
 * Everything is drawn in the SVG's own pixel space: the viewBox is resized to
 * match the element's width so one unit is always one CSS pixel.
 */
(function () {
    var root = document.querySelector('[data-skate]');
    if (!root) return;

    var svg = root.querySelector('.skate-svg');
    var hint = root.querySelector('.skate-hint-text');
    var timeEl = root.querySelector('.skate-time');
    var bestEl = root.querySelector('.skate-best');
    var ground = svg.querySelector('.skate-ground');
    var skater = svg.querySelector('.skate-skater');
    var deck = svg.querySelector('.skate-deck');
    var head = svg.querySelector('.skate-head');
    var torso = svg.querySelector('.skate-torso');
    var legF = svg.querySelector('.skate-leg-f');
    var legB = svg.querySelector('.skate-leg-b');
    var armF = svg.querySelector('.skate-arm-f');
    var armB = svg.querySelector('.skate-arm-b');
    var obstacleLayer = svg.querySelector('.skate-obstacles');

    var GROUND_Y = 128;         /* recomputed from the element's height */
    var SKATER_X = 90;
    var SKATER_W = 28;
    var SKATER_H = 48;
    var SKATER_CX = SKATER_X + SKATER_W / 2;   /* the figure's local origin */
    var GRAVITY = 2000;         /* px per second, per second */
    var JUMP_APEX = 96;         /* clamped to the headroom actually available */
    var jumpV = -620;
    var SPEED_START = 260;
    var SPEED_MAX = 460;
    var speedScale = 1;         /* narrow screens give less warning, so slow down */
    var scale = 1;              /* obstacle scale, derived from the jump apex */
    var SPEED_RAMP = 6;         /* px/s gained per second played */

    var width = 0;
    var height = 0;
    var state = 'idle';         /* idle | playing | over */
    var y = 0;                  /* offset above the ground, positive = airborne */
    var vy = 0;
    var speed = SPEED_START;
    var obstacles = [];
    var nextSpawn = 0;
    var last = 0;
    var jumpAt = -1;            /* when the current jump started, for the push-off */
    var tilt = 0;               /* board tilt, eased */
    var frame = null;
    var elapsed = 0;


    /*
     * The figure is a set of joints in a local space whose origin is the
     * board's contact point with the ground, y running upwards as negative.
     * A pose is just those joints; every frame the live pose eases toward the
     * pose the current state asks for and five path strings get rewritten.
     * No frames, no sprites — the in-between poses are the animation.
     *
     * Order: hip, shoulder, head, kneeF, footF, kneeB, footB,
     *        elbowF, handF, elbowB, handB.  +x is the direction of travel.
     */
    var POSES = {
        /* Relaxed cruise: forward lean, soft knees, lead arm reaching ahead and
           the trailing arm hanging back. Idle holds this same silhouette. */
        roll: [-4,-25,  5,-36,  8.5,-42.5,   7,-16.5,  7.5,-5,  -7,-15, -7.5,-5,
               10,-33, 16,-32,  -6,-31, -12,-26],
        /* Compressed push-off: hips drop toward the deck, both arms swing back. */
        takeoff: [-3,-18,  5,-28,  8,-34,   9.5,-12,  7.5,-5,  -8,-11, -7.5,-5,
                   3,-24, -2,-20,  -9,-24, -15,-20],
        /* Airborne: legs fold up under the body, arms out for balance. */
        air: [-3,-20,  4,-31,  7,-37,   9,-18,  7,-5,  -6.5,-17, -7.5,-5,
              10,-30, 15,-33,  -7,-29, -13,-27],
        /* Absorbing the landing: deep knees, arms low and wide. */
        land: [-3,-19,  4,-30,  7,-36,   8.5,-13.5,  7.5,-5,  -8,-12, -7.5,-5,
                9,-27, 15,-27,  -7,-27, -13,-23]
    };

    var pose = POSES.roll.slice();      /* the live, interpolated pose */
    var target = POSES.roll;
    var poseBlend = 14;                 /* higher eases faster */
    var landUntil = 0;                  /* landing pose holds briefly */
    var bobPhase = 0;

    function line(a, b, c2) {
        /* Two-segment limb: the middle point is the elbow or knee. */
        return 'M' + pose[a] + ' ' + pose[a + 1] +
               'L' + pose[b] + ' ' + pose[b + 1] +
               'L' + pose[c2] + ' ' + pose[c2 + 1];
    }

    function poseFigure() {
        var hx = pose[0], hy = pose[1], sx = pose[2], sy = pose[3];
        /* A slight forward bow through the spine, rather than a straight rod. */
        torso.setAttribute('d', 'M' + hx + ' ' + hy +
            'Q' + ((hx + sx) / 2 + 2.5) + ' ' + ((hy + sy) / 2) +
            ' ' + sx + ' ' + sy);
        head.setAttribute('cx', pose[4]);
        head.setAttribute('cy', pose[5]);
        legF.setAttribute('d', line(0, 6, 8));
        legB.setAttribute('d', line(0, 10, 12));
        armF.setAttribute('d', line(2, 14, 16));
        armB.setAttribute('d', line(2, 18, 20));
    }

    function easePose(dt) {
        var k = Math.min(1, dt * poseBlend);
        for (var i = 0; i < pose.length; i++) {
            pose[i] = +(pose[i] + (target[i] - pose[i]) * k).toFixed(2);
        }
        poseFigure();
    }

    /*
     * Obstacles, drawn as single-stroke line icons in a local space whose
     * origin sits on the ground line, with the shape extending upwards.
     * Round joins do the work of rounded corners, so each one is a single
     * <path> — cheap to spawn and throw away.  `weight` biases the mix so the
     * simple silhouettes turn up most and the stacked boxes stay rare.
     */
    var SHAPES = [
        {   /* traffic cone */
            w: 26, h: 22, weight: 3,
            d: 'M3 0 L5 -5 H21 L23 0 Z M8 -5 L13 -22 L18 -5 M10.2 -11 H15.8 M11.6 -16 H14.4'
        },
        {   /* curb / step */
            w: 30, h: 12, weight: 3,
            d: 'M0 0 V-9 L3 -12 H27 L30 -9 V0'
        },
        {   /* box / crate */
            w: 22, h: 22, weight: 2,
            d: 'M1 0 V-20 L3 -22 H19 L21 -20 V0 Z M3 -2 L19 -20 M3 -20 L19 -2'
        },
        {   /* plant / bush */
            w: 24, h: 20, weight: 2, inset: 0.18,
            d: 'M12 0 C5 -5 3 -11 6 -16 C10 -12 12 -5 12 0 Z M12 0 C8 -7 7 -14 9 -20 C12 -14 13 -6 12 0 Z M12 0 C12 -7 13 -14 15 -19 C17 -13 16 -6 12 0 Z M12 0 C13 -5 16 -11 19 -15 C19 -9 16 -3 12 0 Z'
        },
        {   /* rock / stone */
            w: 25, h: 13, weight: 2, inset: 0.12,
            d: 'M0 0 C0 -7 4 -13 10 -13 C15 -13 18 -6 18 0 Z M16 0 C16 -5 19 -8.5 22 -8.5 C24.5 -8.5 25 -4 25 0 Z'
        },
        {   /* trash can */
            w: 16, h: 19, weight: 1.5,
            d: 'M2.5 -15 L4 0 H12 L13.5 -15 M1 -15 H15 M6 -18 H10 V-15 M6.5 -12 V-4 M8 -12 V-4 M9.5 -12 V-4'
        },
        {   /* low rail / barrier */
            w: 34, h: 13, weight: 1.5,
            d: 'M1 -12 H33 V-8 H1 Z M6 -8 V0 M28 -8 V0'
        },
        {   /* stacked boxes */
            w: 30, h: 28, weight: 0.6,
            d: 'M0 0 V-26 L2 -28 H15 L17 -26 V0 Z M2 -2 L15 -26 M2 -26 L15 -2 M17 0 V-13 L19 -15 H28 L30 -13 V0 Z M19 -2 L28 -13 M19 -13 L28 -2'
        }
    ];

    var SHAPE_TOTAL = SHAPES.reduce(function (sum, s) { return sum + s.weight; }, 0);
    var TALLEST = 28;           /* the local-space height the scale is derived from */

    function pickShape() {
        var r = Math.random() * SHAPE_TOTAL;
        for (var i = 0; i < SHAPES.length; i++) {
            r -= SHAPES[i].weight;
            if (r <= 0) return SHAPES[i];
        }
        return SHAPES[0];
    }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    var BEST_KEY = 'skate-best';
    var best = 0;
    var shownTime = -1;         /* last painted value, so we only touch the DOM on change */
    var distance = 0;           /* px travelled; the score is distance, not time */
    var SCORE_RATE = 0.04;      /* ~10 points a second at the starting speed */

    try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) { best = 0; }

    function pad(n) {
        return ('000' + n).slice(-4);
    }

    function score() {
        return Math.floor(distance * SCORE_RATE);
    }

    function paintScore() {
        var n = state === 'idle' ? 0 : score();
        if (n !== shownTime) {
            timeEl.textContent = state === 'idle' ? '' : pad(n);
            shownTime = n;
        }
        bestEl.textContent = best ? 'HI ' + pad(best) + ' ' : '';
    }

    function recordBest() {
        var n = score();
        if (n > best) {
            best = n;
            try { localStorage.setItem(BEST_KEY, best); } catch (e) { /* private mode */ }
        }
    }

    function resize() {
        /* One SVG unit stays one CSS pixel at every size, so the physics never
           needs to know how tall the element is — only where the ground sits. */
        width = root.clientWidth;
        height = root.clientHeight;
        svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
        GROUND_Y = height - 32;

        /* A jump must never clip through the top of the box. */
        var apex = Math.max(34, Math.min(JUMP_APEX, GROUND_Y - SKATER_H - 6));
        jumpV = -Math.sqrt(2 * GRAVITY * apex);
        speedScale = Math.max(0.72, Math.min(1, width / 700));
        /* Obstacles are sized off the jump, so a short box stays clearable. */
        scale = Math.max(0.55, Math.min(1, (apex * 0.4) / TALLEST));
        ground.setAttribute('y1', GROUND_Y + 0.5);
        ground.setAttribute('y2', GROUND_Y + 0.5);
        ground.setAttribute('x2', width);

        draw();
    }

    function makeObstacle() {
        var shape = pickShape();
        var el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        var inset = shape.inset || 0;
        var o = {
            el: el,
            shape: shape,
            x: width + 20,
            w: shape.w * scale * (1 - inset * 2),
            pad: shape.w * scale * inset,   /* organic shapes get a forgiving hitbox */
            h: shape.h * scale * (1 - inset)
        };
        el.setAttribute('d', shape.d);
        obstacleLayer.appendChild(el);
        obstacles.push(o);
    }

    function clearObstacles() {
        obstacles.forEach(function (o) { o.el.remove(); });
        obstacles = [];
    }

    function scheduleSpawn() {
        /* Distance-based, so the gap stays fair as the speed creeps up. */
        nextSpawn = (260 + Math.random() * 300) / speed;
    }

    function hits(o) {
        var top = GROUND_Y - SKATER_H - y;
        var bottom = GROUND_Y - y;
        return SKATER_X < o.x + o.pad + o.w &&
               SKATER_X + SKATER_W > o.x + o.pad &&
               bottom > GROUND_Y - o.h &&
               top < GROUND_Y;
    }

    function draw() {
        var airborne = y > 0;
        var bob = 0;
        if (state === 'playing' && !airborne && !reduced.matches) {
            /* A soft roll, tied to speed — half a pixel is plenty. */
            bob = Math.sin(bobPhase) * 0.6;
        }
        var lean = airborne ? -3 : 0;
        skater.setAttribute('transform',
            'translate(' + SKATER_CX + ' ' + (GROUND_Y - y + bob).toFixed(2) + ')' +
            (lean ? ' rotate(' + lean + ')' : ''));
        deck.setAttribute('transform', 'rotate(' + tilt.toFixed(2) + ')');
        obstacles.forEach(function (o) {
            o.el.setAttribute('transform',
                'translate(' + o.x.toFixed(1) + ' ' + GROUND_Y + ') scale(' + scale.toFixed(3) + ')');
        });
    }

    function choosePose() {
        if (state !== 'playing') return POSES.roll;
        if (y > 0) {
            /* The impulse is instant, so the push-off reads on the way up. */
            return (elapsed - jumpAt) < 0.1 ? POSES.takeoff : POSES.air;
        }
        return elapsed < landUntil ? POSES.land : POSES.roll;
    }

    function tick(now) {
        var dt = Math.min((now - last) / 1000, 0.05);   /* clamp after a tab switch */
        last = now;
        elapsed += dt;

        speed = Math.min(SPEED_MAX, SPEED_START + elapsed * SPEED_RAMP) * speedScale;

        vy += GRAVITY * dt;
        y -= vy * dt;
        if (y <= 0) {
            if (vy > 0) landUntil = elapsed + 0.16;     /* just touched down */
            y = 0; vy = 0;
        }

        distance += speed * dt;
        bobPhase += dt * speed / 22;
        target = choosePose();
        easePose(dt);
        tilt += ((y > 0 ? -4 : 0) - tilt) * Math.min(1, dt * 10);

        nextSpawn -= dt;
        if (nextSpawn <= 0) { makeObstacle(); scheduleSpawn(); }

        for (var i = obstacles.length - 1; i >= 0; i--) {
            var o = obstacles[i];
            o.x -= speed * dt;
            if (o.x + o.shape.w * scale < -20) { o.el.remove(); obstacles.splice(i, 1); continue; }
            if (hits(o)) { stop(); return; }
        }

        draw();
        paintScore();
        frame = requestAnimationFrame(tick);
    }

    function start() {
        state = 'playing';
        root.classList.add('is-playing');
        root.classList.remove('is-over');
        hint.textContent = '';
        y = 0; vy = 0; elapsed = 0; speed = SPEED_START * speedScale;
        jumpAt = -1; landUntil = 0; tilt = 0; distance = 0;
        clearObstacles();
        scheduleSpawn();
        shownTime = -1;
        draw();
        last = performance.now();
        frame = requestAnimationFrame(tick);
    }

    function stop() {
        state = 'over';
        recordBest();
        root.classList.remove('is-playing');
        root.classList.add('is-over');
        cancelAnimationFrame(frame);
        frame = null;
        draw();
        paintScore();
        hint.textContent = 'Restart';
    }

    function press() {
        if (state === 'playing') {
            if (y === 0) { vy = jumpV; jumpAt = elapsed; }   /* no double jumps */
        } else {
            start();
        }
    }

    root.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        press();
    });

    /* Keyboard parity, since the area is focusable. */
    root.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); press(); }
    });

    /* Leaving the tab mid-run would otherwise resume with a huge jump forward. */
    document.addEventListener('visibilitychange', function () {
        if (document.hidden && state === 'playing') stop();
    });

    window.addEventListener('resize', resize);
    poseFigure();
    resize();
    draw();
    paintScore();

    /* Reduced motion keeps the scene static with no invitation, but still playable. */
    hint.textContent = reduced.matches ? '' : 'Click to play';
})();
