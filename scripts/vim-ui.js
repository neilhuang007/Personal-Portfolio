/* Buffer chrome for the portfolio's read only documents. */
(function () {
    'use strict';

    const selector = '.editor-container, .about-main-card, .project-window, .tag-project-window, .modal-window, .circuit-board';
    const initialized = new WeakSet();
    const maskSelector = '.neon-sign, .vim-tabline button, .cta a, .github-link, .project-link, .project-window-tag, .scroll-indicator, .back-indicator, .window-control, .window-button, .circuit-close, .timeline-window-close, .skills-filter, .skills-row, .skills-project-link, .skills-project-pager button, .skills-back';
    const surfaceSelector = '.editor-container, .about-main-card, .card, .project-decks-container, .skill-card, .category-title, .section-header, .vim-workspace, .intro > .greeting, .intro > h1, .intro .stat, .skills-heading, .skills-group, .skills-detail-overview, .skills-detail-metadata, .skills-status';
    const masks = new Map();

    function seedFor(text) {
        let seed = 2166136261;
        for (const character of text) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619);
        return seed >>> 0;
    }

    function drawMask(element) {
        const state = masks.get(element);
        if (!state || !element.offsetWidth || !element.offsetHeight) return;
        const compact = element.matches('.window-control, .window-button, .circuit-close');
        const bleed = compact ? 4 : 8;
        const width = Math.ceil(element.offsetWidth / 4) * 4 + bleed * 2;
        const height = Math.ceil(element.offsetHeight / 2) * 2 + bleed * 2;
        const size = `${width}:${height}`;
        if (state.size === size) return;
        state.size = size;
        let seed = state.seed;
        const depth = () => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return (seed % (compact ? 2 : 3)) * 2;
        };
        const points = [];
        const point = (x, y) => points.push(`${x}px ${y}px`);
        const corner = 4;
        let previous = corner;
        point(corner, corner);
        // Every segment stays on a rectangular grid. The solid center covers the label.
        for (let x = corner + 8; x < width - corner; x += 8) {
            point(x, previous);
            previous = depth();
            point(x, previous);
        }
        point(width - corner, previous);
        point(width - corner, corner);
        previous = width - corner;
        for (let y = corner + 4; y < height - corner; y += 4) {
            point(previous, y);
            previous = width - depth();
            point(previous, y);
        }
        point(previous, height - corner);
        point(width - corner, height - corner);
        previous = height - corner;
        for (let x = width - corner - 8; x > corner; x -= 8) {
            point(x, previous);
            previous = height - depth();
            point(x, previous);
        }
        point(corner, previous);
        point(corner, height - corner);
        previous = corner;
        for (let y = height - corner - 4; y > corner; y -= 4) {
            point(previous, y);
            previous = depth();
            point(previous, y);
        }
        point(previous, corner);
        point(corner, corner);
        Object.assign(state.mask.style, {
            left: `${-bleed}px`, top: `${-bleed}px`,
            width: `${width}px`, height: `${height}px`,
            clipPath: `polygon(${points.join(',')})`
        });
    }

    const maskResizeObserver = new ResizeObserver(entries => entries.forEach(entry => drawMask(entry.target)));

    function addMask(element) {
        if (masks.has(element)) return;
        const label = element.getAttribute('aria-label') || element.dataset.filter || element.textContent.trim();
        element.classList.add(element.matches(surfaceSelector) ? 'pixel-surface' : 'pixel-button');
        if (getComputedStyle(element).position === 'static') element.classList.add('ascii-positioned');
        const mask = document.createElement('span');
        mask.className = 'pixel-button-mask';
        mask.setAttribute('aria-hidden', 'true');
        element.prepend(mask);
        masks.set(element, { mask, seed: seedFor(label) });
        if (element.classList.contains('pixel-surface')) {
            maskResizeObserver.observe(element);
            drawMask(element);
        }
    }

    function filename(value) {
        return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'untitled';
    }

    function addChrome(element) {
        if (initialized.has(element)) return;
        initialized.add(element);
        element.classList.add('vim-window');
        let name = 'detail.txt';
        let type = 'text';
        let scrollArea = element.querySelector('.modal-content');
        if (element.matches('.editor-container')) {
            name = 'resume.json'; type = 'json'; scrollArea = element.querySelector('.editor');
        } else if (element.matches('.about-main-card')) {
            name = 'about.md'; type = 'markdown';
        } else if (element.matches('.project-window')) {
            name = `projects/${filename(element.querySelector('.project-window-title').textContent)}.md`;
            type = 'markdown'; scrollArea = element.querySelector('.project-content');
        } else if (element.matches('.tag-project-window')) {
            name = `projects/${filename(element.querySelector('.tag-window-title').textContent)}/`;
            type = 'directory'; scrollArea = element.querySelector('.tag-window-content');
        } else if (element.matches('.circuit-board')) {
            element.querySelector('.circuit-title').textContent = 'timeline.log';
            return;
        }

        let header = element.querySelector('.window-chrome, .project-window-header, .tag-window-header');
        if (!header) {
            header = document.createElement('div');
            header.className = 'vim-buffer-header';
            const label = document.createElement('span');
            label.className = 'vim-buffer-name';
            label.textContent = name;
            const readonly = document.createElement('span');
            readonly.className = 'vim-readonly';
            readonly.textContent = '[RO]';
            header.append(label, readonly);
            element.prepend(header);
        } else {
            const title = header.querySelector('.window-title, .project-window-title, .tag-window-title');
            if (title) title.textContent = name;
        }
        element.querySelectorAll('button.close').forEach(button => { button.textContent = ':q'; });

        const status = document.createElement('div');
        status.className = 'vim-statusline';
        const fields = [['vim-mode', 'NORMAL'], ['vim-status-name', name], ['vim-status-format', `${type}  [RO]`], ['vim-position', 'All']];
        for (const [className, text] of fields) {
            const field = document.createElement('span');
            field.className = className;
            field.textContent = text;
            status.append(field);
        }
        element.append(status);
        const updatePosition = () => {
            const max = scrollArea ? scrollArea.scrollHeight - scrollArea.clientHeight : 0;
            status.lastElementChild.textContent = max <= 1 ? 'All' : scrollArea.scrollTop <= 1 ? 'Top' : scrollArea.scrollTop >= max - 1 ? 'Bot' : 'Mid';
        };
        if (scrollArea) {
            scrollArea.addEventListener('scroll', updatePosition, { passive: true });
            const observer = new ResizeObserver(updatePosition);
            observer.observe(scrollArea);
            element._vimResizeObserver = observer;
        }
        if (element.matches('.editor-container')) document.addEventListener('portfolio:resume-ready', updatePosition);
        updatePosition();
    }

    function scan(root) {
        if (root.nodeType !== Node.ELEMENT_NODE || root.closest('.ascii-frame, .ascii-rule, .ascii-surface, .vim-statusline, .pixel-button-mask')) return;
        if (root.matches(selector)) addChrome(root);
        root.querySelectorAll(selector).forEach(addChrome);
        if (root.matches(maskSelector)) addMask(root);
        root.querySelectorAll(maskSelector).forEach(addMask);
        if (root.matches(surfaceSelector)) addMask(root);
        root.querySelectorAll(surfaceSelector).forEach(addMask);
    }

    function initialize() {
        scan(document.body);
        new MutationObserver(records => {
            for (const record of records) {
                record.addedNodes.forEach(scan);
                record.removedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE || node.isConnected) return;
                    [node, ...node.querySelectorAll('.vim-window, .pixel-button, .pixel-surface')].forEach(element => {
                        element._vimResizeObserver?.disconnect();
                        maskResizeObserver.unobserve(element);
                        masks.delete(element);
                    });
                });
            }
        }).observe(document.body, { childList: true, subtree: true });
        document.querySelectorAll('[data-buffer]').forEach(button => {
            button.addEventListener('click', () => goToSection(Number(button.dataset.buffer)));
        });
        document.addEventListener('portfolio:section-change', event => {
            document.querySelectorAll('[data-buffer]').forEach(button => {
                if (Number(button.dataset.buffer) === event.detail.section) button.setAttribute('aria-current', 'page');
                else button.removeAttribute('aria-current');
            });
        });
        document.addEventListener('portfolio:resume-ready', () => {
            const code = document.getElementById('resume-code');
            const format = document.querySelector('.editor-container .vim-status-format');
            if (format) format.textContent = `json  ${code.dataset.lines}L  [RO]`;
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
})();
