import { createWordOcean } from './word-ocean.js';

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

// Space: pause, R: replay the intro.
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    scene.togglePause();
  } else if (e.key === 'r' || e.key === 'R') {
    scene.restart();
  }
});
