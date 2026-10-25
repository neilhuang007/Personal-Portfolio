/* Character rails control the actual scroll containers, including dynamic windows. */
(function () {
    'use strict';

    const selector = '.editor, .intro, #section1, #section2, #section3, .project-content, .tag-window-content, .modal-content, .skill-expansion, .project-article pre, .timeline-full, .timeline';
    const decoration = '.ascii-scrollbar, .ascii-frame, .ascii-rule, .ascii-surface, .pixel-button-mask';
    const entries = new Map();
    let nextId = 0;
    let frame = 0;

    function refresh() {
        if (!frame) frame = requestAnimationFrame(updateAll);
    }

    const resizeObserver = new ResizeObserver(refresh);

    function visibleRect(element) {
        const box = element.getBoundingClientRect();
        if (!element.getClientRects().length || box.width < 28 || box.height < 28) return null;
        const rect = {
            left: Math.max(0, box.left + element.clientLeft),
            right: Math.min(innerWidth, box.left + element.clientLeft + element.clientWidth),
            top: Math.max(0, box.top + element.clientTop),
            bottom: Math.min(innerHeight, box.top + element.clientTop + element.clientHeight)
        };
        for (let parent = element; parent; parent = parent.parentElement) {
            const style = getComputedStyle(parent);
            if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return null;
            if (parent === element) continue;
            const bounds = parent.getBoundingClientRect();
            if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
                rect.top = Math.max(rect.top, bounds.top + parent.clientTop);
                rect.bottom = Math.min(rect.bottom, bounds.top + parent.clientTop + parent.clientHeight);
            }
            if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
                rect.left = Math.max(rect.left, bounds.left + parent.clientLeft);
                rect.right = Math.min(rect.right, bounds.left + parent.clientLeft + parent.clientWidth);
            }
        }
        if (element.id === 'section1' || element.id === 'section2') {
            rect.top += 58;
            rect.bottom -= 52;
            rect.right -= 4;
        } else if (element.id === 'section3') {
            rect.top += 12;
            rect.bottom -= 12;
            rect.right -= 4;
        }
        return rect.right - rect.left >= 28 && rect.bottom - rect.top >= 28 ? rect : null;
    }

    function labelFor(element) {
        if (element.matches('.editor')) return 'Resume';
        if (element.matches('.intro')) return 'Introduction';
        if (element.id === 'section1') return 'Home';
        if (element.id === 'section2') return 'About';
        if (element.id === 'section3') return 'Skills';
        if (element.id === 'circuit-scroll-area') return 'Timeline';
        const host = element.closest('.project-window, .tag-project-window, .modal-window, .skill-card');
        return host?.querySelector('.project-window-title, .tag-window-title, .modal-title, .skill-name')?.textContent.trim() || 'Content';
    }

    function register(element, virtual) {
        if (entries.has(element)) return;
        if (!element.id) element.id = `ascii-scroll-area-${++nextId}`;
        if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
        if (!element.hasAttribute('aria-label')) element.setAttribute('aria-label', labelFor(element));
        element.classList.add('ascii-scrollable');
        const entry = { element, virtual, rails: [], observed: new Set() };
        entries.set(element, entry);
        resizeObserver.observe(element);
        const axes = virtual ? [virtual.axis] : ['vertical', 'horizontal'];
        axes.forEach(axis => entry.rails.push(createRail(entry, axis)));
        refresh();
    }

    function createRail(entry, axis) {
        const { element, virtual } = entry;
        const horizontal = axis === 'horizontal';
        const rail = document.createElement('div');
        rail.className = 'ascii-scrollbar';
        rail.dataset.axis = axis;
        rail.hidden = true;
        rail.tabIndex = 0;
        rail.setAttribute('role', 'scrollbar');
        rail.setAttribute('aria-controls', element.id);
        rail.setAttribute('aria-orientation', axis);
        rail.setAttribute('aria-label', `${labelFor(element)} ${axis} scrollbar`);
        rail.setAttribute('aria-valuemin', '0');
        document.body.append(rail);

        const state = {
            rail, horizontal, cells: [], cellSize: 12, length: 0, thumbSize: 0, thumbStart: 0,
            get max() { return virtual ? virtual.getMax() : horizontal ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight; },
            get value() { return virtual ? virtual.getPosition() : horizontal ? element.scrollLeft : element.scrollTop; },
            get page() { return horizontal ? element.clientWidth : element.clientHeight; },
            set(value) {
                value = Math.max(0, Math.min(state.max, value));
                if (virtual) virtual.setPosition(value);
                else if (horizontal) element.scrollLeft = value;
                else element.scrollTop = value;
                refresh();
            }
        };
        const coordinate = event => horizontal ? event.clientX : event.clientY;
        const card = element.closest('.skill-card');
        let drag = null;
        const keepExpanded = () => card?.classList.toggle('ascii-scroll-active', !!drag || rail.matches(':hover, :focus'));
        ['pointerenter', 'pointerleave', 'focus', 'blur'].forEach(type => rail.addEventListener(type, keepExpanded));
        rail.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            rail.focus({ preventScroll: true });
            const bounds = rail.getBoundingClientRect();
            const point = coordinate(event) - (horizontal ? bounds.left : bounds.top);
            const thumbOffset = state.thumbStart * state.cellSize;
            if (point >= thumbOffset && point < thumbOffset + state.thumbSize) {
                drag = { point: coordinate(event), value: state.value };
                rail.setPointerCapture(event.pointerId);
                rail.dataset.dragging = '';
            } else {
                const before = point < thumbOffset;
                state.set(state.value + (before ? -1 : 1) * state.page * 0.9);
            }
        });
        rail.addEventListener('pointermove', event => {
            if (!drag) return;
            const travel = Math.max(1, state.length - state.thumbSize);
            state.set(drag.value + (coordinate(event) - drag.point) * state.max / travel);
        });
        const endDrag = () => { drag = null; delete rail.dataset.dragging; keepExpanded(); };
        rail.addEventListener('pointerup', endDrag);
        rail.addEventListener('pointercancel', endDrag);
        rail.addEventListener('lostpointercapture', endDrag);
        rail.addEventListener('wheel', event => {
            event.preventDefault();
            event.stopPropagation();
            const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? state.page : 1;
            state.set(state.value + (horizontal ? event.deltaX || event.deltaY : event.deltaY) * unit);
        }, { passive: false });
        rail.addEventListener('keydown', event => {
            let value = state.value;
            switch (event.key) {
                case 'Home': value = 0; break;
                case 'End': value = state.max; break;
                case 'PageUp': value -= state.page * 0.9; break;
                case 'PageDown': value += state.page * 0.9; break;
                case ' ': value += state.page * (event.shiftKey ? -0.9 : 0.9); break;
                case 'ArrowUp': case 'k': if (horizontal) return; value -= 42; break;
                case 'ArrowDown': case 'j': if (horizontal) return; value += 42; break;
                case 'ArrowLeft': case 'h': if (!horizontal) return; value -= 42; break;
                case 'ArrowRight': case 'l': if (!horizontal) return; value += 42; break;
                default: return;
            }
            event.preventDefault();
            event.stopPropagation();
            state.set(value);
        });
        return state;
    }

    function updateAll() {
        frame = 0;
        const modal = [...document.querySelectorAll('.circuit-modal.active, .modal-overlay.active')]
            .find(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
        for (const [element, entry] of entries) {
            if (!element.isConnected) {
                resizeObserver.unobserve(element);
                entry.observed.forEach(child => resizeObserver.unobserve(child));
                entry.rails.forEach(state => state.rail.remove());
                entries.delete(element);
                continue;
            }
            for (const child of entry.observed) {
                if (child.parentElement !== element) {
                    resizeObserver.unobserve(child);
                    entry.observed.delete(child);
                }
            }
            for (const child of element.children) {
                if (!entry.observed.has(child) && !child.matches(decoration)) {
                    entry.observed.add(child);
                    resizeObserver.observe(child);
                }
            }
            const rect = visibleRect(element);
            if (!rect || (modal && !modal.contains(element))) {
                entry.rails.forEach(state => { state.rail.hidden = true; });
                continue;
            }
            const style = getComputedStyle(element);
            let zIndex = 30;
            for (let parent = element; parent; parent = parent.parentElement) {
                zIndex = Math.max(zIndex, (parseInt(getComputedStyle(parent).zIndex, 10) || 0) + 1);
            }
            for (const state of entry.rails) {
                const { rail, horizontal, cellSize } = state;
                const overflow = horizontal ? style.overflowX : style.overflowY;
                const show = rect && state.max > 1 && (entry.virtual || /auto|scroll/.test(overflow));
                rail.hidden = !show;
                if (!show) continue;
                const available = horizontal ? rect.right - rect.left - 22 : rect.bottom - rect.top;
                const cellCount = Math.floor(available / cellSize);
                if (cellCount < 2) {
                    rail.hidden = true;
                    continue;
                }
                const length = cellCount * cellSize;
                const thumbCount = Math.min(cellCount - 1, Math.max(2, Math.round(cellCount * state.page / (state.page + state.max))));
                const progress = Math.max(0, Math.min(1, state.value / state.max));
                state.length = length;
                state.thumbSize = thumbCount * cellSize;
                state.thumbStart = Math.round((cellCount - thumbCount) * progress);
                rail.style.cssText = horizontal
                    ? `left:${rect.left}px;top:${rect.bottom - 20}px;width:${length}px;z-index:${zIndex}`
                    : `left:${rect.right - 20}px;top:${rect.top}px;height:${length}px;z-index:${zIndex}`;
                // Cells stay fixed. Scrolling only replaces the character in each cell.
                if (state.cells.length !== cellCount) {
                    state.cells = Array.from({ length: cellCount }, () => {
                        const cell = document.createElement('span');
                        cell.className = 'ascii-scrollbar-cell';
                        cell.setAttribute('aria-hidden', 'true');
                        return cell;
                    });
                    rail.replaceChildren(...state.cells);
                }
                state.cells.forEach((cell, index) => {
                    const active = index >= state.thumbStart && index < state.thumbStart + thumbCount;
                    const symbol = horizontal ? (active ? '#' : '=') : (active ? '##' : '||');
                    if (cell.textContent !== symbol) cell.textContent = symbol;
                    if (cell.classList.contains('is-active') !== active) cell.classList.toggle('is-active', active);
                });
                rail.setAttribute('aria-valuemax', Math.round(state.max));
                rail.setAttribute('aria-valuenow', Math.round(state.value));
            }
        }
    }

    function scan(root) {
        if (root.nodeType !== Node.ELEMENT_NODE || root.closest(decoration)) return;
        if (root.matches(selector)) register(root);
        root.querySelectorAll(selector).forEach(element => register(element));
    }

    function initialize() {
        scan(document.body);
        new MutationObserver(records => {
            let changed = false;
            for (const record of records) {
                if (record.target.nodeType === Node.ELEMENT_NODE && record.target.closest(decoration)) continue;
                record.addedNodes.forEach(scan);
                changed = true;
            }
            if (changed) refresh();
        }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
        document.addEventListener('scroll', refresh, { capture: true, passive: true });
        document.addEventListener('load', refresh, true);
        window.addEventListener('resize', refresh);
        document.fonts.ready.then(refresh);
    }

    window.AsciiScrollbars = { refresh, registerVirtual: register };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
})();
