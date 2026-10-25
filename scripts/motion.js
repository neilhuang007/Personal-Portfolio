/* One accessible control for decorative motion throughout the workspace. */
(function () {
    'use strict';
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = preference.matches;
    try {
        const saved = localStorage.getItem('portfolio-motion-paused');
        if (saved !== null) paused = saved === 'true';
    } catch (_) { /* Motion preferences also work without storage. */ }

    function updateControls() {
        document.querySelectorAll('[data-motion-toggle]').forEach(button => {
            // Preserve the decorative mask added by the terminal renderer.
            button.querySelector('[data-motion-symbol]').textContent = paused ? '[>]' : '[||]';
            const label = paused ? 'Resume animations' : 'Pause animations';
            button.setAttribute('aria-label', label);
            button.title = label;
        });
    }

    function setPaused(value, save = false) {
        paused = value;
        if (save) {
            try { localStorage.setItem('portfolio-motion-paused', String(paused)); } catch (_) { /* Optional storage. */ }
        }
        updateControls();
        document.dispatchEvent(new CustomEvent('portfolio:motion-change', { detail: { paused } }));
    }

    window.PortfolioMotion = { get paused() { return paused; }, setPaused };
    preference.addEventListener('change', event => setPaused(event.matches));
    document.querySelectorAll('[data-motion-toggle]').forEach(button => {
        button.addEventListener('click', () => setPaused(!paused, true));
    });
    updateControls();
})();
