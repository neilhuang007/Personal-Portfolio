/* Reveal the next buffer through a moving band of changing ASCII cells. */
(function () {
    'use strict';

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cellWidth = 14;
    const cellHeight = 22;
    const duration = 900;
    const glyphs = '.:;=+*%#@01/{}[]<>'.split('');
    let canvas;
    let context;
    let finishActive = null;

    function noise(column, row, tick = 0) {
        let value = Math.imul(column + 1, 374761393) ^ Math.imul(row + 1, 668265263) ^ Math.imul(tick + 1, 1274126177);
        value = Math.imul(value ^ (value >>> 13), 1274126177);
        return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
    }

    function run(outgoing, incoming, complete, direction = 1) {
        if (finishActive) finishActive();
        if (motion.matches || window.PortfolioMotion?.paused || document.hidden) {
            complete();
            return;
        }

        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'ascii-page-transition';
            canvas.setAttribute('aria-hidden', 'true');
            canvas.hidden = true;
            context = canvas.getContext('2d');
            document.body.append(canvas);
        }
        if (!context) {
            complete();
            return;
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        const scale = Math.min(window.devicePixelRatio || 1, 2);
        const rows = Math.ceil(height / cellHeight);
        const forward = direction >= 0;
        // Each pass gets its own rolling contour, width, and character pattern.
        const seed = Math.floor(Math.random() * 1000000);
        const band = Math.min(300, Math.max(140, width * (0.15 + Math.random() * 0.07)));
        const amplitude = Math.min(140, width * 0.1) * (0.55 + Math.random() * 0.45);
        const frequency = 0.55 + Math.random() * 1.25;
        const phase = Math.random() * Math.PI * 2;
        const drift = (Math.random() - 0.5) * 1.4;
        const margin = band / 2 + amplitude * 1.3 + cellWidth * 3;
        const offsets = Array.from({ length: rows }, (_, row) => (noise(seed, row) - 0.5) * cellWidth * 3);
        const previous = [outgoing, incoming].map(element => ({
            element,
            clipPath: element.style.clipPath,
            inert: element.inert
        }));
        let frame = 0;
        let finished = false;

        canvas.width = Math.ceil(width * scale);
        canvas.height = Math.ceil(height * scale);
        context.setTransform(scale, 0, 0, scale, 0, 0);
        context.font = `18px ${getComputedStyle(document.body).fontFamily}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        function finish() {
            if (finished) return;
            finished = true;
            cancelAnimationFrame(frame);
            finishActive = null;
            canvas.hidden = true;
            document.body.classList.remove('ascii-transitioning');
            previous.forEach(({ element, clipPath, inert }) => {
                element.style.clipPath = clipPath;
                element.inert = inert;
            });
            complete();
        }

        function draw(progress, elapsed) {
            // A gentle acceleration keeps the sweep readable without a long tail.
            const eased = progress * progress * (3 - 2 * progress);
            const travel = -margin + (width + margin * 2) * eased;
            const head = forward ? travel : width - travel;
            const tick = Math.floor(elapsed / 65);
            const edge = [];
            context.clearRect(0, 0, width, height);

            for (let row = 0; row < rows; row++) {
                const y = row * cellHeight;
                const angle = row / rows * Math.PI * 2 * frequency + phase + progress * drift;
                const wave = Math.sin(angle) * amplitude + Math.sin(angle * 2 + phase) * amplitude * 0.3;
                const offset = (wave + offsets[row]) * (forward ? 1 : -1);
                const seam = Math.round((head + offset) / cellWidth) * cellWidth;
                const clipped = Math.max(0, Math.min(width, seam));
                edge.push(`${clipped}px ${y}px`, `${clipped}px ${Math.min(height, y + cellHeight)}px`);

                const first = Math.max(0, Math.floor((seam - band / 2) / cellWidth));
                const last = Math.min(Math.ceil(width / cellWidth), Math.ceil((seam + band / 2) / cellWidth));
                for (let column = first; column < last; column++) {
                    const x = column * cellWidth;
                    const distance = Math.abs(x + cellWidth / 2 - seam) / (band / 2);
                    const density = Math.max(0, 1 - distance);
                    // Solid at the seam, scattered whole character cells at the edges.
                    if (distance > 0.24 && noise(column + seed, row) > density * 1.15) continue;
                    context.fillStyle = '#000';
                    context.fillRect(x, y, cellWidth, cellHeight);
                    const random = noise(column + seed, row, tick);
                    context.fillStyle = random > 0.92 ? '#a4c59a' : density > 0.65 ? '#d8d8d8' : '#777777';
                    const character = density < 0.25 ? (random > 0.5 ? '.' : ':') : glyphs[Math.floor(random * glyphs.length)];
                    context.fillText(character, x + cellWidth / 2, y + cellHeight / 2);
                }
            }

            const incomingSide = forward ? 0 : width;
            const outgoingSide = forward ? width : 0;
            incoming.style.clipPath = `polygon(${incomingSide}px 0, ${edge.join(', ')}, ${incomingSide}px ${height}px)`;
            outgoing.style.clipPath = `polygon(${outgoingSide}px 0, ${edge.join(', ')}, ${outgoingSide}px ${height}px)`;
        }

        finishActive = finish;
        previous.forEach(({ element }) => { element.inert = true; });
        incoming.classList.remove('hidden', 'hiding', 'scrolling-down', 'scrolling-up', 'scrolling-out');
        incoming.classList.add('visible');
        document.body.classList.add('ascii-transitioning');
        canvas.hidden = false;
        draw(0, 0);

        const start = performance.now();
        function animate(now) {
            const elapsed = now - start;
            const progress = Math.min(1, elapsed / duration);
            if (progress === 1) {
                finish();
                return;
            }
            draw(progress, elapsed);
            frame = requestAnimationFrame(animate);
        }
        frame = requestAnimationFrame(animate);
    }

    // Settle on the destination if the viewport or motion preference changes.
    window.addEventListener('resize', () => finishActive?.());
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) finishActive?.();
    });
    motion.addEventListener('change', () => {
        if (motion.matches) finishActive?.();
    });

    window.AsciiPageTransition = { run };
})();
