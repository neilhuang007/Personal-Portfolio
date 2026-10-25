/* Character frames shared by static panels and dynamically opened windows. */
(function () {
    'use strict';

    const windows = '.editor-container, .modal-window, .project-window, .tag-project-window, .circuit-board, .timeline-window, .phone-blocker-content, .skills-detail-window';
    const panels = '.about-main-card, .card, .project-decks-container, .project-card, .skill-card, .skills-group, .tag-project-item, .circuit-node, .year-chip, .about-quote, .project-article pre, .neon-sign';
    const dividers = '.window-chrome, .vim-buffer-header, .project-window-header, .tag-window-header, .circuit-header, .circuit-hints, .card-header, .decks-header, .project-hero, .project-footer';
    const selector = `${windows}, ${panels}, ${dividers}`;
    const frames = new Map();
    const measureContext = document.createElement('canvas').getContext('2d');

    function bar(value, length = 12) {
        const percentage = Math.min(100, Math.max(0, Number.parseFloat(value) || 0));
        const filled = Math.round(percentage / 100 * length);
        return '[' + '#'.repeat(filled) + '.'.repeat(length - filled) + ']';
    }

    window.AsciiUI = { bar };

    function draw(element) {
        const state = frames.get(element);
        if (!state) return;
        const width = state.frame.clientWidth;
        const height = state.frame.clientHeight;
        if (!width || !height) return;
        const font = getComputedStyle(state.edges[0]);
        measureContext.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
        const characterWidth = measureContext.measureText('=').width;
        const size = `${width}:${height}:${characterWidth}`;
        if (state.size === size) return;
        state.size = size;

        const columns = Math.max(2, Math.floor((width - 8) / characterWidth));
        const rows = Math.max(1, Math.floor((height - 32) / 12));
        state.edges.forEach((edge, edgeIndex) => {
            const vertical = edgeIndex > 1;
            const count = vertical ? rows : columns;
            const rule = state.terminal ? '-' : '=';
            edge.textContent = vertical
                ? Array(count).fill(state.hash ? '#' : '|').join('\n')
                : state.divider ? rule.repeat(count) : state.hash ? '#'.repeat(count) : '+' + rule.repeat(Math.max(0, count - 2)) + '+';
            if (vertical) edge.style.lineHeight = `${Math.max(12, (height - 32) / count)}px`;
        });
    }

    const resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => draw(entry.target));
    });

    function enhance(element) {
        if (frames.has(element)) return;
        const divider = element.matches(dividers);
        const terminal = element.matches('.project-window, .project-window-header');
        const hash = !terminal && (element.matches(windows) || element.matches('.about-main-card, .project-decks-container'));
        if (getComputedStyle(element).position === 'static') element.classList.add('ascii-positioned');
        element.setAttribute(divider ? 'data-ascii-divider' : 'data-ascii-frame', hash ? 'hash' : 'equals');

        if (!divider) {
            const surface = document.createElement('span');
            surface.className = 'ascii-surface';
            surface.setAttribute('aria-hidden', 'true');
            surface.innerHTML = '<span class="ascii-fill"></span><span class="ascii-bleed ascii-bleed-top"></span><span class="ascii-bleed ascii-bleed-bottom"></span><span class="ascii-bleed ascii-bleed-left"></span><span class="ascii-bleed ascii-bleed-right"></span>';
            element.prepend(surface);
        }

        const frame = document.createElement('span');
        frame.className = divider ? 'ascii-rule' : 'ascii-frame';
        frame.setAttribute('aria-hidden', 'true');
        const edges = (divider ? ['bottom'] : ['top', 'bottom', 'left', 'right']).map(side => {
            const edge = document.createElement('span');
            edge.className = `ascii-edge ascii-edge-${side}`;
            frame.appendChild(edge);
            return edge;
        });
        element.appendChild(frame);
        frames.set(element, { frame, edges, hash, divider, terminal });
        resizeObserver.observe(element);
        draw(element);
    }

    function scan(root) {
        if (root.nodeType !== Node.ELEMENT_NODE || root.closest('.ascii-frame, .ascii-rule, .ascii-surface')) return;
        if (root.matches(selector)) enhance(root);
        root.querySelectorAll(selector).forEach(enhance);
    }

    function initialize() {
        scan(document.body);
        document.fonts.ready.then(() => frames.forEach((state, element) => draw(element)));
        new MutationObserver(records => {
            records.forEach(record => record.addedNodes.forEach(scan));
            for (const element of frames.keys()) {
                if (!element.isConnected) {
                    resizeObserver.unobserve(element);
                    frames.delete(element);
                }
            }
        }).observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
})();
