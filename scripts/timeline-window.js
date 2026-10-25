(function () {
    'use strict';

    const dialog = document.getElementById('timeline-window');
    const trigger = document.getElementById('timeline-card');
    let frame;
    let returnFocus;

    function close() {
        if (dialog.open) dialog.close();
    }

    function open() {
        if (dialog.open) return;
        returnFocus = document.activeElement;
        frame = document.createElement('iframe');
        frame.className = 'timeline-window-scene';
        frame.tabIndex = -1;
        frame.title = 'Endless Sailing boat scene';
        frame.src = 'boateffect/index.html?v=20261025.3';
        frame.addEventListener('load', () => {
            if (!dialog.open || !frame) return;
            // Keyboard events inside an iframe do not bubble to the parent document.
            frame.contentWindow.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    close();
                } else if (event.key === 'Tab') {
                    event.preventDefault();
                    dialog.querySelector(event.shiftKey ? '.timeline-window-close' : '[data-motion-toggle]').focus();
                }
            });
        }, { once: true });
        dialog.append(frame);
        dialog.showModal();
        dialog.querySelector('.timeline-window-close').focus();
    }

    dialog.querySelector('.timeline-window-close').addEventListener('click', close);
    dialog.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const first = dialog.querySelector('[data-motion-toggle]');
        const last = dialog.querySelector('.timeline-window-close');
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) close();
    });
    dialog.addEventListener('close', () => {
        // Unload the scene so its animation stops while the window is closed.
        frame?.remove();
        frame = null;
        returnFocus?.focus({ preventScroll: true });
    });
    trigger.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open();
        }
    });

    window.BoatTimeline = { open, close };
})();
