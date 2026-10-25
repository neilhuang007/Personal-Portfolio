import { createWordOcean } from './word-ocean.js?v=20261025.3';

// URL overrides, e.g. ?boat=SHIP&ocean=SEA&plane=JET&zoom=0.5&intro=1&sway=0.2&speed=0.5
const q = new URLSearchParams(location.search);
const num = (key) => (q.has(key) ? Number(q.get(key)) : undefined);

const scene = createWordOcean(document.getElementById('scene'), {
  words: {
    clouds: q.get('clouds'),
    boat: q.get('boat'),
    ocean: q.get('ocean'),
    bottle: q.get('bottle'),
    plane: q.get('plane'),
  },
  intro: q.get('intro') === '1',
  zoom: num('zoom'),
  sway: num('sway'),
  speed: num('speed'),
});

// Embedded scenes share the visible pause control in their dialog header.
let motion;
try { motion = window.parent.PortfolioMotion; } catch (_) { /* Other origins use the local control. */ }
if (motion) {
  scene.setPaused(motion.paused);
  const onMotionChange = event => scene.setPaused(event.detail.paused);
  window.parent.document.addEventListener('portfolio:motion-change', onMotionChange);
  window.addEventListener('pagehide', () => {
    window.parent.document.removeEventListener('portfolio:motion-change', onMotionChange);
    scene.destroy();
  }, { once: true });
} else {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.getElementById('scene-pause');
  let paused = preference.matches;
  const update = () => {
    scene.setPaused(paused);
    button.textContent = paused ? '[>] Resume animation' : '[||] Pause animation';
  };
  button.hidden = false;
  button.addEventListener('click', () => { paused = !paused; update(); });
  preference.addEventListener('change', event => { paused = event.matches; update(); });
  update();
}
