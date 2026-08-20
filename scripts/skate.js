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

    var GROUND_Y = 128;         /* pinned to the box's top in resize() */
    var SKATER_X = 90;          /* recomputed; see resize() */
    var SKATER_W = 28;
    var SKATER_H = 48;
    var SKATER_CX = SKATER_X + SKATER_W / 2;   /* the figure's local origin */
    var GRAVITY = 2000;         /* px per second, per second */
    var JUMP_APEX = 96;         /* clamped to the headroom actually available */
    var jumpV = -620;
    var SPEED_START = 260;
    var SPEED_CEIL = 460;       /* the ramp's ceiling before the track is considered */
    var speedMax = SPEED_CEIL;  /* the ceiling this particular track can afford */
    var speedScale = 1;         /* narrow screens give less warning, so slow down */

    /* The width this game was designed against — the desktop column. Every
       size below is expressed against it rather than as a bare pixel count,
       so a desktop-width box reproduces the original numbers exactly and
       anything narrower is scaled from them. */
    var DESIGN_W = 576;
    /* What a run is actually balanced on. TARGET_REACT is how long the player
       should get to see an obstacle coming; FLOOR_REACT is the least that may
       ever decay to once the speed has ramped. Both are seconds. */
    var TARGET_REACT = 1.55;
    var FLOOR_REACT = 1.10;
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
    var floorY = 0;             /* what the board is resting on: 0, or a bench top */
    var airborne = false;
    var tilt = 0;               /* board tilt, eased */
    var sway = 0;               /* balance sway while riding a bench, eased */
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
                9,-27, 15,-27,  -7,-27, -13,-23],
        /* Riding a bench: hips dropped for a low centre of gravity, knees
           pushed wider, arms floated up and out. Reads as balancing rather
           than cruising, without leaving the same line vocabulary. */
        grind: [-4,-21,  4,-31,  7,-37,   8.5,-14,  7.5,-5,  -8.5,-13, -7.5,-5,
                10,-30, 17,-33,  -7,-28, -14,-30],
        /* Waiting: weight settled, spine near vertical, arms hanging. The only
           pose the page shows before anyone clicks. */
        rest: [-1.5,-26,  0.5,-37,  2.5,-43.5,   4.5,-17,  6,-5,  -5.5,-16.5, -7,-5,
                5,-30.5, 7.5,-22.5,  -4.5,-30.5, -7,-23],
        /* The kick-push that opens a run: lift the back foot clear of the deck,
           plant it on the ground ahead, sweep it back as the board accelerates,
           fold the knee to bring it home. */
        lift:  [-3,-24,  3,-35,  6,-41.5,   8.7,-16.4,  7.5,-5,   4.5,-15.3, -2,-7,
                 8,-32, 13,-30.5,  -2.5,-32, -8,-30],
        plant: [-4,-19,  4,-30,  7,-36.5,   9.6,-16.3,  7.5,-5,   3.6,-10.4, 2,0,
                 9,-27, 14.5,-25.5,  -1.5,-27, -7,-25],
        sweep: [-3,-18,  6,-29,  9,-35.5,   10.8,-16,   7.5,-5,  -6.1,-6.9, -14,0,
                11,-26, 16.5,-25,  0.5,-26, -5,-24],
        fold:  [-3,-22,  4,-33,  7,-39.5,   9.7,-16.3,  7.5,-5,   3.8,-12.7, -5,-7,
                 9,-30, 14.5,-28.5,  -1.5,-30, -7,-28]
    };

    /* Beat end-times, in seconds from the start of a run. */
    var PUSH_BEATS = [[0.09, 'lift'], [0.18, 'plant'], [0.35, 'sweep'], [0.46, 'fold']];
    var PUSH_END = 0.46;
    var pushUntil = 0;          /* > 0 while the opening push owns the figure */
    /* Segment lengths the legs must hold. Taken from the riding pose, whose
       front leg was already drawn to them. */
    var BONES = { thighF: 13.9, shinF: 11.5, thighB: 11.5, shinB: 10.5 };

    function pushPose(t) {
        for (var i = 0; i < PUSH_BEATS.length; i++) {
            if (t < PUSH_BEATS[i][0]) return POSES[PUSH_BEATS[i][1]];
        }
        return POSES.roll;
    }

    /* Two-bone IK. A knee only opens forward, so of the two solutions take the
       one further along +x. */
    function kneeAt(hx, hy, fx, fy, thigh, shin) {
        var dx = fx - hx, dy = fy - hy;
        var d = Math.sqrt(dx * dx + dy * dy) || 0.001;
        var reach = thigh + shin;
        if (d > reach) { dx *= reach / d; dy *= reach / d; d = reach; }
        var a = (thigh * thigh - shin * shin + d * d) / (2 * d);
        var h = Math.sqrt(Math.max(0, thigh * thigh - a * a));
        var ux = dx / d, uy = dy / d;
        var bx = hx + a * ux, by = hy + a * uy;
        var k1x = bx + h * uy, k2x = bx - h * uy;
        return k1x >= k2x ? [k1x, by - h * ux] : [k2x, by + h * ux];
    }

    /* Easing joint positions shortens a limb between key poses — a reaching leg
       loses a fifth of its length mid-blend. Re-solving the knees from the eased
       hip and feet fixes every frame, not just the authored ones.  `w` fades the
       correction out afterwards so the riding pose still arrives as drawn: its
       back knee is deliberately behind the hip, which no solver would choose. */
    function solveKnees(p, w) {
        var kf = kneeAt(p[0], p[1], p[8], p[9], BONES.thighF, BONES.shinF);
        p[6] += (kf[0] - p[6]) * w; p[7] += (kf[1] - p[7]) * w;
        var kb = kneeAt(p[0], p[1], p[12], p[13], BONES.thighB, BONES.shinB);
        p[10] += (kb[0] - p[10]) * w; p[11] += (kb[1] - p[11]) * w;
    }

    function ikWeight() {
        if (pushUntil <= 0 || state !== 'playing') return 0;
        if (elapsed <= pushUntil) return 1;
        return Math.max(0, 1 - (elapsed - pushUntil) / 0.35);
    }

    /* The board is what accelerates during the sweep, so the ground speed
       follows the push rather than leading it. */
    function launch() {
        if (pushUntil <= 0 || elapsed >= pushUntil) return 1;
        return Math.pow(Math.max(0, elapsed) / pushUntil, 1.8);
    }

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
        var w = ikWeight();
        if (w > 0) solveKnees(pose, w);
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
        },
        {   /* long bench / ledge — ridden, not cleared. See `ride` below. */
            w: 220, h: 15, weight: 3, ride: true,
            d: 'M0 -15 H220 V-11 H0 Z M18 -11 V0 M110 -11 V0 M202 -11 V0'
        }
    ];

    var BENCH_H = 15;           /* the tallest ride surface; see resize() */
    var SHAPE_TOTAL = SHAPES.reduce(function (sum, s) { return sum + s.weight; }, 0);
    var TALLEST = 28;           /* the local-space height the scale is derived from */

    function pickShape() {
        var r = Math.random() * SHAPE_TOTAL;
        for (var i = 0; i < SHAPES.length; i++) {
            r -= SHAPES[i].weight;
            if (r <= 0) {
                /* A bench asks for timing rather than reflex, so hold it back
                   until the player has had a few ordinary obstacles first. */
                if (SHAPES[i].ride && elapsed < 6) return SHAPES[0];
                return SHAPES[i];
            }
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
        return ('0000' + n).slice(-5);
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

        /* The strip of empty space below the ground line used to be a fixed
           80px. That is fine on a desktop box and quietly ruinous on a phone:
           the box loses 20px of height, the strip does not give any of it back,
           and the headroom above the line — which is all the jump has to live
           in — drops by a quarter. So the line is pinned a fixed distance from
           the TOP instead and the strip absorbs whatever is left over. The jump
           keeps its full height everywhere; the tap zone below is what flexes,
           and it is the easiest part of the box to hit anyway. On a desktop-
           height box this arithmetic returns the original 80. The 44px floor
           is the point past which there is nothing left to give and the jump
           starts paying again. */
        GROUND_Y = Math.min(height - 44, 128);
        root.style.setProperty('--skate-ground-offset', (height - GROUND_Y) + 'px');

        /* A jump must never clip through the top of the box. */
        var headroom = GROUND_Y - SKATER_H - 6;
        var apex0 = Math.max(34, Math.min(JUMP_APEX, headroom));
        /* Obstacles are sized off the jump, so a short box stays clearable —
           but that coupling has a sting on a narrow one. Giving the jump its
           height back hands the obstacles the same increase and cancels the
           whole gain, so on a narrow track the two are separated and the
           obstacles are held down on their own. The skater cannot shrink here
           without becoming illegible, so the world around it does instead. */
        scale = Math.max(0.55, Math.min(1, (apex0 * 0.4) / TALLEST));
        scale = Math.min(scale, Math.max(0.75, width / DESIGN_W));
        /* Jumps also start from a bench top, so the clamp has to pay for that
           height as well — otherwise a hop off a bench clips the ceiling. */
        var apex = Math.max(30, Math.min(apex0, headroom - BENCH_H * scale));
        jumpV = -Math.sqrt(2 * GRAVITY * apex);

        /* 90px from the left was chosen while looking at a desktop box, where
           it leaves five sixths of the width as track. On a phone the same 90px
           is more than a quarter of the box, so the run-up collapses to half
           its length while the obstacles keep coming at nearly full speed.
           Written as a fraction it lands on exactly 90 at desktop width and
           steps in as the box narrows. */
        SKATER_X = Math.max(48, Math.min(90, width * (90 / DESIGN_W)));
        SKATER_CX = SKATER_X + SKATER_W / 2;

        /* Speed follows from how much track there actually is, aimed at a fixed
           number of seconds of warning rather than at a fraction of the width —
           what the player feels is time, not pixels. Never faster than the width
           alone would have run, so a desktop box is left exactly as it was. */
        var runway = width - SKATER_X;
        var byWidth = Math.max(0.72, Math.min(1, width / 700));
        speedScale = Math.max(0.5, Math.min(byWidth, runway / (TARGET_REACT * SPEED_START)));
        /* The ramp needs the same treatment, or a long run walks the warning
           back down to where it started. A desktop track is long enough that
           this never binds there. */
        speedMax = Math.min(SPEED_CEIL, runway / (FLOOR_REACT * speedScale));

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
        scheduleSpawn(shape.w * scale);
    }

    function clearObstacles() {
        obstacles.forEach(function (o) { o.el.remove(); });
        obstacles = [];
    }

    function scheduleSpawn(lastW) {
        /* Distance-based, so the gap stays fair as the speed creeps up, and
           measured from the trailing edge — a 220-wide bench would otherwise
           have the next obstacle spawn on top of it. */
        nextSpawn = ((lastW || 0) + 260 + Math.random() * 300) / speed;
    }

    function overlaps(o) {
        return SKATER_X < o.x + o.pad + o.w &&
               SKATER_X + SKATER_W > o.x + o.pad;
    }

    function hits(o) {
        var top = GROUND_Y - SKATER_H - y;
        var bottom = GROUND_Y - y;
        return overlaps(o) && bottom > GROUND_Y - o.h && top < GROUND_Y;
    }

    function draw() {
        var bob = 0;
        if (state === 'playing' && !airborne && !reduced.matches) {
            /* A soft roll, tied to speed — half a pixel is plenty. */
            bob = Math.sin(bobPhase) * 0.6;
        }
        var lean = (airborne ? -3 : 0) + sway;
        skater.setAttribute('transform',
            'translate(' + SKATER_CX + ' ' + (GROUND_Y - y + bob).toFixed(2) + ')' +
            (lean ? ' rotate(' + lean.toFixed(2) + ')' : ''));
        deck.setAttribute('transform', 'rotate(' + tilt.toFixed(2) + ')');
        obstacles.forEach(function (o) {
            o.el.setAttribute('transform',
                'translate(' + o.x.toFixed(1) + ' ' + GROUND_Y + ') scale(' + scale.toFixed(3) + ')');
        });
    }

    function choosePose() {
        /* Only the untouched scene rests; a crashed one holds the ride. */
        if (state === 'idle') return POSES.rest;
        if (state !== 'playing') return POSES.roll;
        if (airborne) {
            /* The impulse is instant, so the push-off reads on the way up. */
            return (elapsed - jumpAt) < 0.1 ? POSES.takeoff : POSES.air;
        }
        if (elapsed < pushUntil) return pushPose(elapsed);
        /* Balancing beats absorbing: once the board settles on a bench the
           grind pose owns the figure for the whole crossing. */
        if (floorY > 0) return POSES.grind;
        return elapsed < landUntil ? POSES.land : POSES.roll;
    }

    function tick(now) {
        var dt = Math.max(0, Math.min((now - last) / 1000, 0.05));   /* clamp; a rAF stamp can precede start() */
        last = now;
        elapsed += dt;

        speed = Math.min(speedMax, SPEED_START + elapsed * SPEED_RAMP) * speedScale * launch();

        var prevY = y;
        var wasAirborne = airborne;
        vy += GRAVITY * dt;
        y -= vy * dt;

        nextSpawn -= dt;
        if (nextSpawn <= 0) makeObstacle();

        /* Move the obstacles, and work out what the board is resting on. A
           bench is solid from above and lethal from the side, so the same
           pass decides between a landing and a crash. */
        var support = 0;
        for (var i = obstacles.length - 1; i >= 0; i--) {
            var o = obstacles[i];
            o.x -= speed * dt;
            if (o.x + o.shape.w * scale < -20) { o.el.remove(); obstacles.splice(i, 1); continue; }
            if (!o.shape.ride) {
                if (hits(o)) { stop(); return; }
                continue;
            }
            if (!overlaps(o)) continue;
            /* Landing counts if the board was clear of the top when the frame
               began — meeting the end face at deck height is a crash. */
            if (y >= o.h - 0.5 || prevY >= o.h - 0.5) {
                if (o.h > support) support = o.h;
            } else { stop(); return; }
        }

        if (y <= support) {
            /* Only a real descent reads as a landing; simply resting on a
               surface re-enters this branch every frame. */
            if (wasAirborne && vy > 0) landUntil = elapsed + 0.16;
            y = support; vy = 0;
        }
        floorY = support;
        airborne = y > support + 0.01;

        distance += speed * dt;
        bobPhase += dt * speed / 22;
        target = choosePose();
        easePose(dt);
        tilt += ((airborne ? -4 : 0) - tilt) * Math.min(1, dt * 10);
        /* A slow weight shift, only while balanced on a bench. */
        var swayTo = (floorY > 0 && !airborne && !reduced.matches)
            ? Math.sin(bobPhase * 0.35) * 1.4 : 0;
        sway += (swayTo - sway) * Math.min(1, dt * 6);

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
        floorY = 0; airborne = false; sway = 0;
        pushUntil = PUSH_END;
        clearObstacles();
        scheduleSpawn(0);
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
            /* Jumping out of the opening push abandons it rather than fighting it. */
            if (!airborne) { vy = jumpV; jumpAt = elapsed; pushUntil = 0; }
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
    pose = POSES.rest.slice();
    poseFigure();
    resize();
    draw();
    paintScore();

    /* Reduced motion keeps the scene static with no invitation, but still playable. */
    hint.textContent = reduced.matches ? '' : 'Click to play';
})();
