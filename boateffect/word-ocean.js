// Word ocean: an endless voyage drawn entirely in monospace type on paper.
// Every object (clouds, planes, boat, bottles, swells) is a shape filled with its own repeated word
// on a shared character grid, so letters get clipped mid-word at the edges. As in the reference
// animation, each object's text travels with it, snapping a whole cell at a time, and the scene
// updates "on twos" (12 steps a second): letters entering a shape fade in through grey, letters
// leaving it fade out the same way, and every text row sways sideways on its own phase.
//
// The sky and the sea are separate planes. The sky's text grid is fixed to the screen; the sea (with
// the boat) has its own grid that shrinks as the camera zooms out, so it recedes into the distance.
// The boat sails forward forever: the world slides past at depth-dependent speeds, and bottles and
// little red biplanes turn up now and then.

const TAU = Math.PI * 2;
const STEP_RATE = 12;
const FADE_ALPHA = 0.4; // opacity of a letter on the step between hidden and fully inked

// The camera makes the two moves from the reference. First the shapes pull back on a fixed grid
// (1:05 -> 1:14), then it zooms out (1:14 -> 1:20): the sea and boat recede (their text shrinks and
// the horizon sinks), the far clouds sink with the horizon and the near clouds shrink towards the top.
const HORIZON = 0.69; // horizon height as a fraction of the viewport, at the 1:14 framing
const PULL_BACK = { start: 0, end: 8, scale: 1.45, horizon: 0.65 };
const ZOOM_OUT = { start: 6, end: 15, sea: 0.62, nearSky: 0.68, farSky: 0.8, horizon: 0.84 };

const DEFAULTS = {
  words: { clouds: 'CLOUDS', boat: 'BOAT', ocean: 'OCEAN', bottle: 'BOTTLE', plane: 'PLANE' },
  fontFamily: '"Roboto Mono", ui-monospace, Menlo, Consolas, monospace',
  rowsPerScreen: 45, // sky text rows per viewport height
  sway: 0.4, // horizontal row sway amplitude, in character widths
  speed: 1,
  intro: false, // play the camera moves (close-up -> pull back -> zoom out) instead of starting zoomed out
  zoom: 1, // how far the camera zooms out: 0 = the 1:14 framing, 1 = the 1:20 framing
  paper: [228, 221, 215],
  ink: [16, 9, 7],
  planeInk: [188, 30, 36], // the biplanes are printed in red
  bottleInk: [32, 102, 181], // blue ink keeps the bottles distinct from the swells
};

const SAIL_SPEED = 0.06; // how fast the boat sails, in sea units per second

// Boat outline in boat units (y grows downward), origin at the top centre of the hull.
const SAIL = [-0.078, -0.29, 0.25, -0.035, -0.19, -0.035];
const HULL = [-0.155, 0, 0.16, 0, 0.12, 0.075, -0.113, 0.075];
const BOAT_PIVOT_Y = 0.035;
const BOAT_BOX = { minX: -0.2, minY: -0.3, maxX: 0.26, maxY: 0.08 };
const BOAT_SCALE = 0.76;
const BOAT_DRAFT = 0.05; // how far the hull top sits above the water line, in scene units

// A corked bottle lying on its side, neck towards +x, 1 unit long.
const BOTTLE = [
  [-0.5, -0.12, -0.46, -0.16, 0.14, -0.16, 0.3, -0.08, 0.5, -0.08, 0.5, 0.08, 0.3, 0.08, 0.14, 0.16, -0.46, 0.16, -0.5, 0.12],
];
const BOTTLE_SIZE = 0.17; // sea units
const BOTTLE_SPACING = 1.6; // a bottle may float at every this many sea units of the voyage
const BOTTLE_CHANCE = 0.45;

// The original simple biplane silhouette, with a distinct propeller at the nose towards +x.
// Smaller lettering preserves its proportions as the whole plane shrinks.
const BIPLANE = [
  [0.42, -0.1, 0.1, -0.12, -0.3, -0.07, -0.5, -0.06, -0.5, 0.04, -0.3, 0.06, 0.1, 0.1, 0.42, 0.1], // fuselage
  [0.47, -0.25, 0.52, -0.29, 0.54, -0.2, 0.51, 0.26, 0.46, 0.29, 0.45, 0.2], // propeller
  [0.4, -0.06, 0.5, -0.06, 0.5, 0.06, 0.4, 0.06], // propeller hub
  [-0.16, -0.38, 0.32, -0.38, 0.36, -0.25, -0.16, -0.25], // upper wing
  [-0.1, 0.09, 0.3, 0.09, 0.3, 0.21, -0.1, 0.21], // lower wing
  [0.1, -0.26, 0.19, -0.26, 0.19, -0.1, 0.1, -0.1], // strut
  [-0.3, -0.06, -0.42, -0.33, -0.54, -0.33, -0.5, -0.05], // tail fin
];
const PLANE_SIZE = 0.25; // far sky units
const PLANE_TEXT_SCALE = 0.7;
const PLANE_SPEED = 0.17; // far-sky units per second along its flight path
const PLANE_EVERY = 28; // seconds between chances of a plane
const PLANE_CHANCE = 0.6;

// Scene units: 1 = viewport height at the 1:14 framing, origin on the horizon under the boat.
// Near clouds are dark and hang from the top of the frame; far clouds are faint and sit lower,
// closer to the horizon. Placed to match the zoomed-out reference frame (1:19). `speed` is how fast
// each slides past as the boat sails (near clouds faster than far ones).
const CLOUDS = [
  { x: -1.06, base: -0.645, w: 0.4, h: 0.2, near: true },
  { x: -0.31, base: -0.366, w: 0.73, h: 0.4, near: true },
  { x: 0.73, base: -0.29, w: 1.18, h: 0.45, near: true },
  { x: 1.75, base: -0.4, w: 0.75, h: 0.35, near: true },
  { x: -0.87, base: -0.375, w: 0.69, h: 0.36, near: false },
  { x: 0.03, base: -0.35, w: 0.73, h: 0.3, near: false },
  { x: 0.96, base: -0.35, w: 0.7, h: 0.32, near: false },
  { x: 1.95, base: -0.38, w: 0.6, h: 0.3, near: false },
].map((c) => ({ ...c, speed: c.near ? -0.065 : -0.028 }));

// Rolling swells, nearest first. Each is a band of text below a moving surface; nearer swells are
// darker, larger and slide past faster (`flow`, screen-relative), and cover the ones behind them.
// The boat and the bottles ride the middle swell.
const SWELLS = [
  { base: 0.245, amp: 0.09, len: 1.5, flow: -0.11, alpha: 0.9, phase: 3.1 },
  { base: 0.09, amp: 0.075, len: 1.0, flow: -0.08, alpha: 0.6, phase: 1.7 },
  { base: 0.0, amp: 0.04, len: 0.6, flow: -0.035, alpha: 0.2, phase: 0 },
];
const RIDE_SWELL = 1;

// Layer ids double as priority within a plane: when shapes overlap, the lowest id owns the cell.
const NEAR_CLOUD = 1, FAR_CLOUD = 2; // sky plane
const BOAT = 0, FLOATER = 1, SWELL = 2; // sea plane; swell i is SWELL + i

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const mod = (a, n) => ((a % n) + n) % n;
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function hash3(x, y, z) {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(z | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  let u = x - xi, v = y - yi, w = z - zi;
  u = u * u * (3 - 2 * u);
  v = v * v * (3 - 2 * v);
  w = w * w * (3 - 2 * w);
  const a = hash3(xi, yi, zi), b = hash3(xi + 1, yi, zi);
  const c = hash3(xi, yi + 1, zi), d = hash3(xi + 1, yi + 1, zi);
  const e = hash3(xi, yi, zi + 1), f = hash3(xi + 1, yi, zi + 1);
  const g = hash3(xi, yi + 1, zi + 1), h = hash3(xi + 1, yi + 1, zi + 1);
  const y0 = lerp(lerp(a, b, u), lerp(c, d, u), v);
  const y1 = lerp(lerp(e, f, u), lerp(g, h, u), v);
  return lerp(y0, y1, w);
}

function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Signed distance to a polygon given as a flat [x0, y0, x1, y1, ...] list (negative inside).
function sdPolygon(px, py, pts) {
  let d = Infinity;
  let inside = false;
  for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
    const xi = pts[i], yi = pts[i + 1], xj = pts[j], yj = pts[j + 1];
    const ex = xj - xi, ey = yj - yi, wx = px - xi, wy = py - yi;
    const h = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1);
    const qx = wx - ex * h, qy = wy - ey * h;
    d = Math.min(d, qx * qx + qy * qy);
    if (yi > py !== yj > py && px < (ex * (py - yi)) / ey + xi) inside = !inside;
  }
  return (inside ? -1 : 1) * Math.sqrt(d);
}

// Height of a swell above its base line: rounded crests, broad troughs, a little chop on top, and
// a slow swell in amplitude so the sea never settles into an obvious loop.
function swellHeight(s, x, t) {
  const k = TAU / s.len;
  const crest = 0.5 + 0.5 * Math.sin(k * (x - s.flow * t) + s.phase);
  const chop = Math.sin(1.9 * k * (x + 0.6 * s.flow * t) + 2.3 * s.phase);
  return s.amp * (0.85 + 0.15 * Math.sin(t * 0.05 + s.phase)) * (crest ** 1.6 + 0.18 * chop);
}

const surfaceY = (s, x, t) => s.base - swellHeight(s, x, t);

function waterTopAt(x, t) {
  let top = Infinity;
  for (const s of SWELLS) top = Math.min(top, surfaceY(s, x, t));
  return top;
}

// The boat sits in its swell and tilts with the slope under its hull.
function boatAt(t) {
  const swell = SWELLS[RIDE_SWELL];
  const x = 0.02 * Math.sin((TAU * t) / 23);
  const yL = surfaceY(swell, x - 0.1, t), yR = surfaceY(swell, x + 0.1, t), yC = surfaceY(swell, x, t);
  const theta = Math.atan2(yR - yL, 0.2) * 0.5;
  const y = (yL + yR + 2 * yC) / 4 - BOAT_DRAFT;
  // top/bottom bound the rows the boat can touch, with room for the tilt
  return { x, y, cos: Math.cos(theta), sin: Math.sin(theta), top: y - 0.36 * BOAT_SCALE, bottom: y + 0.14 * BOAT_SCALE };
}

function insideBoat(x, y, boat) {
  if (y < boat.top || y > boat.bottom) return false;
  const lx = (x - boat.x) / BOAT_SCALE, ly = (y - boat.y) / BOAT_SCALE - BOAT_PIVOT_Y;
  const ux = lx * boat.cos + ly * boat.sin, uy = -lx * boat.sin + ly * boat.cos + BOAT_PIVOT_Y;
  if (ux < BOAT_BOX.minX || ux > BOAT_BOX.maxX || uy < BOAT_BOX.minY || uy > BOAT_BOX.maxY) return false;
  return sdPolygon(ux, uy, SAIL) < 0 || sdPolygon(ux, uy, HULL) < 0;
}

// Place a shape (polygons 1 unit across) at (x, y) with a size, an angle and a facing (dir = +-1).
// `squash` scales it vertically (a roll: 1 -> 0 -> -1 flips it upside down). Cells within `margin`
// (scene units) outside its outline are kept blank, so the silhouette reads cleanly against
// whatever is behind it.
function placeShape(x, y, size, angle, dir, polys, margin, squash = 1) {
  const reach = size * 0.7 + margin;
  const flat = Math.sign(squash || 1) * Math.max(0.12, Math.abs(squash)); // edge-on, keep a sliver
  return { x, y, size, cos: Math.cos(angle), sin: Math.sin(angle), dir, polys, flat, margin: margin / size, top: y - reach, bottom: y + reach };
}

// Distance from (x, y) to the shape's outline in shape units (negative inside); Infinity when far.
function shapeDistance(x, y, s) {
  if (y < s.top || y > s.bottom) return Infinity;
  const dx = (x - s.x) / s.size, dy = (y - s.y) / s.size;
  const lx = (dx * s.cos + dy * s.sin) * s.dir, ly = (-dx * s.sin + dy * s.cos) / s.flat;
  const reach = 0.7 + s.margin;
  if (lx < -reach || lx > reach || ly < -reach || ly > reach) return Infinity;
  let d = Infinity;
  for (const p of s.polys) d = Math.min(d, sdPolygon(lx, ly, p));
  return d;
}

// Bottles float at fixed spots along the voyage, so they drift past as the boat sails on. They bob
// and roll on the swell. `halfWidth` is half the visible width in sea units; `margin` is the blank
// border kept around each bottle.
function bottlesAt(t, halfWidth, margin) {
  const out = [];
  const travelled = SAIL_SPEED * t;
  const reach = halfWidth + BOTTLE_SIZE;
  const kMin = Math.floor((travelled - reach) / BOTTLE_SPACING) - 1, kMax = Math.ceil((travelled + reach) / BOTTLE_SPACING);
  for (let k = kMin; k <= kMax; k++) {
    // the first bottle always comes, soon after the page opens; none starts on top of the boat
    if (k < 1 || (k > 1 && hash3(k, 21, 5) > BOTTLE_CHANCE)) continue;
    const x = k * BOTTLE_SPACING + hash3(k, 22, 5) * 0.6 - travelled;
    if (Math.abs(x) > reach) continue;
    const swell = SWELLS[RIDE_SWELL];
    const slope = Math.atan2(surfaceY(swell, x + 0.05, t) - surfaceY(swell, x - 0.05, t), 0.1);
    const dir = hash3(k, 23, 5) < 0.5 ? 1 : -1;
    const roll = 0.12 * Math.sin(t * 1.4 + k * 2.1);
    out.push(placeShape(x, surfaceY(swell, x, t) - 0.02, BOTTLE_SIZE, slope * 0.8 - 0.3 * dir + roll, dir, BOTTLE, margin));
  }
  return out;
}

// Where a stunt plane is after flying `s` units along its path, flying towards +x with y down.
// Straight flight is broken up by `moves`: a loop swaps forward progress for a full vertical circle
// (the plane turns right over with it); a roll keeps it flying straight while it turns about its
// own length, which side-on looks like it flattening and flipping over.
function flight(s, moves) {
  let x = s, y = 0, angle = 0, squash = 1;
  for (const mv of moves) {
    if (s <= mv.at) break;
    const d = Math.min(s - mv.at, mv.len);
    const during = s - mv.at < mv.len;
    if (mv.kind === 'loop') {
      const phi = d / mv.r;
      x += mv.r * Math.sin(phi) - d;
      y -= mv.r * (1 - Math.cos(phi));
      if (during) angle = -phi;
    } else if (during) {
      squash = Math.cos((d / mv.len) * TAU);
    }
  }
  return { x, y, angle, squash };
}

// Each flight chooses its own heading through a point inside the viewport. Intersecting that
// line with a padded viewport puts both ends fully offscreen, including top and bottom entries.
function planesAt(t, bounds, margin) {
  const out = [];
  const k0 = Math.floor(t / PLANE_EVERY);
  const width = bounds.right - bounds.left, height = bounds.bottom - bounds.top;
  const lookback = Math.ceil((Math.hypot(width, height) + 3) / (PLANE_SPEED * 0.85 * PLANE_EVERY));
  for (let k = Math.max(0, k0 - lookback); k <= k0; k++) {
    // the first plane always comes, a couple of seconds after the page opens
    if (k < 0 || (k > 0 && hash3(k, 11, 3) > PLANE_CHANCE)) continue;
    const t0 = k * PLANE_EVERY + 2 + hash3(k, 12, 3) * 6;
    if (t < t0) continue;
    const heading = hash3(k, 13, 3) * TAU;
    const vx = Math.cos(heading), vy = Math.sin(heading);
    const targetX = lerp(bounds.left, bounds.right, 0.15 + hash3(k, 14, 3) * 0.7);
    const targetY = lerp(bounds.top, bounds.bottom, 0.15 + hash3(k, 15, 3) * 0.7);
    const pad = PLANE_SIZE + margin;
    const tx = Math.abs(vx) < 1e-6 ? [-Infinity, Infinity]
      : [(bounds.left - pad - targetX) / vx, (bounds.right + pad - targetX) / vx].sort((a, b) => a - b);
    const ty = Math.abs(vy) < 1e-6 ? [-Infinity, Infinity]
      : [(bounds.top - pad - targetY) / vy, (bounds.bottom + pad - targetY) / vy].sort((a, b) => a - b);
    const entry = Math.max(tx[0], ty[0]), exit = Math.min(tx[1], ty[1]);
    const length = exit - entry;
    const r = 0.08 + hash3(k, 16, 3) * 0.07;
    const loop = { kind: 'loop', len: TAU * r, r };
    const roll = { kind: 'roll', len: 0.5 };
    const first = length * (0.3 + hash3(k, 17, 3) * 0.25);
    const style = hash3(k, 18, 3);
    const moves = style < 0.28 ? [{ ...loop, at: first }] : style < 0.55 ? [{ ...roll, at: first }] : [];
    const speed = PLANE_SPEED * (0.85 + hash3(k, 19, 3) * 0.4);
    const f = flight((t - t0) * speed, moves);
    if (f.x > length) continue;
    const bend = (hash3(k, 20, 3) - 0.5) * Math.min(0.5, length * 0.2);
    const phase = Math.PI * f.x / length;
    const offset = f.y + bend * Math.sin(phase) ** 2;
    const slope = bend * Math.PI / length * Math.sin(2 * phase);
    const tangent = heading + Math.atan2(Math.sin(f.angle) + slope * Math.cos(f.angle), Math.cos(f.angle));
    const dir = vx < 0 ? -1 : 1;
    const x = targetX + vx * (entry + f.x) - vy * offset;
    const y = targetY + vy * (entry + f.x) + vx * offset;
    out.push(placeShape(x, y, PLANE_SIZE, tangent - (dir < 0 ? Math.PI : 0), dir, BIPLANE, margin, f.squash));
  }
  return out;
}

// A cumulus mound: overlapping metaballs whose heights peak near the middle.
function shapeCloud(cloud, rand) {
  const blobs = [];
  const n = 7;
  const skew = (rand() - 0.5) * 0.3;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const bh = cloud.h * Math.max(0.18, 1 - Math.abs(t - 0.5 - skew) * 1.7);
    blobs.push({
      x: (t - 0.5) * cloud.w * 0.78 + (rand() - 0.5) * 0.03,
      y: -bh * 0.42,
      rx: cloud.w * (0.13 + rand() * 0.06),
      ry: bh * 0.62 + 0.02,
      phase: rand() * TAU,
      rate: 0.6 + rand() * 0.8,
    });
  }
  cloud.blobs = blobs;
}

// Each time a cloud slides off one side it comes back on the other as a new cloud, so the sky
// never repeats. Lap 0 is the hand-placed layout. Besides sliding past, every cloud climbs or sinks
// a little on its way across, bobs, and slowly swells and shrinks.
function reshapeCloud(cloud, lap) {
  const rand = mulberry32(lap === 0 ? 7 + cloud.index : hash3(cloud.index, lap, 9) * 4294967296);
  const vary = lap === 0 ? 0 : 1;
  cloud.w = cloud.spec.w * (1 + vary * (rand() - 0.5) * 0.5);
  cloud.h = cloud.spec.h * (1 + vary * (rand() - 0.5) * 0.4);
  cloud.base = cloud.spec.base + vary * (rand() - 0.5) * 0.06;
  cloud.rise = (rand() - 0.5) * 0.24;
  cloud.bob = { amp: 0.015 + rand() * 0.02, period: 14 + rand() * 14, phase: rand() * TAU };
  cloud.grow = { amp: 0.06 + rand() * 0.06, period: 18 + rand() * 18, phase: rand() * TAU };
  cloud.seed = cloud.index * 17.3 + lap * 5.1;
  cloud.lap = lap;
  shapeCloud(cloud, rand);
}

// Billowing cloud density; the cell is inside the cloud when this reaches 0.5.
function cloudField(cloud, sx, sy, t) {
  const dx = (sx - cloud.cx) / cloud.scale, dy = (sy - cloud.y) / cloud.scale;
  if (dx < -cloud.w * 0.75 || dx > cloud.w * 0.75 || dy < -cloud.h * 1.45 || dy > 0.1) return 0;
  let f = 0;
  for (const b of cloud.blobs) {
    const p = t * b.rate;
    const u = (dx - b.x - 0.025 * Math.sin(p * 0.7 + b.phase)) / (b.rx * (1 + 0.15 * Math.sin(p * 0.9 + b.phase * 2.1)));
    const v = (dy - b.y - 0.016 * Math.sin(p * 1.1 + b.phase * 1.3)) / (b.ry * (1 + 0.1 * Math.sin(p * 0.8 + b.phase)));
    f += Math.exp(-2 * (u * u + v * v));
  }
  // Flatten the underside, then let noise tear it into dangling fragments. The noise travels with
  // the cloud so it moves as one shape while it billows.
  f *= 1 - 0.75 * smoothstep(-0.01, 0.08, dy);
  f += (noise3(dx * 14 + cloud.seed, dy * 24, t * 0.35) - 0.5) * 0.5;
  f += (noise3(dx * 34 - cloud.seed, dy * 30, t * 0.5) - 0.5) * 0.9 * smoothstep(-0.07, 0.01, dy);
  return f;
}

function mergeOptions(base, over) {
  const out = { ...base, words: { ...base.words } };
  for (const [key, value] of Object.entries(over)) {
    if (value === undefined) continue;
    if (key === 'words') {
      for (const [w, text] of Object.entries(value)) if (text) out.words[w] = text;
    } else {
      out[key] = value;
    }
  }
  return out;
}

const patternOf = (word) => `${word.trim().toUpperCase() || 'X'} `;

// Pre-rendered glyphs, one cell per character, at a given text scale.
function buildAtlas(chars, family, weight, metrics, scale, dpr, ink) {
  const gw = Math.ceil(metrics.cw * scale * dpr) + 2, gh = Math.ceil(metrics.rh * scale * dpr) + 2;
  const cv = document.createElement('canvas');
  cv.width = gw * chars.length;
  cv.height = gh;
  const g = cv.getContext('2d');
  g.font = `${weight} ${metrics.fontPx * scale * dpr}px ${family}`;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.fillStyle = `rgb(${ink.join(',')})`;
  const baseline = gh / 2 + (metrics.capH * scale * dpr) / 2;
  chars.forEach((ch, i) => g.fillText(ch, i * gw + gw / 2, baseline));
  return { canvas: cv, gw, gh };
}

function buildPaper(w, h, [r, g, b]) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const p = cv.getContext('2d');
  p.fillStyle = `rgb(${r},${g},${b})`;
  p.fillRect(0, 0, w, h);

  const rand = mulberry32(3);
  const big = Math.max(w, h);
  for (let i = 0; i < 40; i++) {
    const x = rand() * w, y = rand() * h, rad = (0.06 + rand() * 0.3) * big;
    const tone = rand() < 0.5 ? '255,252,246' : '120,100,80';
    const grad = p.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, `rgba(${tone},${0.03 + rand() * 0.04})`);
    grad.addColorStop(1, `rgba(${tone},0)`);
    p.fillStyle = grad;
    p.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  const tile = document.createElement('canvas');
  tile.width = tile.height = 256;
  const tg = tile.getContext('2d');
  const img = tg.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rand() < 0.5 ? 0 : 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = rand() * 14;
  }
  tg.putImageData(img, 0, 0);
  p.fillStyle = p.createPattern(tile, 'repeat');
  p.fillRect(0, 0, w, h);

  const vignette = p.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) / 2);
  vignette.addColorStop(0, 'rgba(90,60,40,0)');
  vignette.addColorStop(1, 'rgba(90,60,40,0.12)');
  p.fillStyle = vignette;
  p.fillRect(0, 0, w, h);
  return cv;
}

// One plane's text grid: which layer owns each cell, how far its letter has faded in (0-2), and
// which letter it shows (an index into the charset, or -1 for a space between words).
function makeGrid(cells) {
  return { owner: new Int8Array(cells).fill(-1), level: new Uint8Array(cells), glyph: new Int16Array(cells).fill(-1) };
}

export function createWordOcean(canvas, options = {}) {
  const opts = mergeOptions(DEFAULTS, options);
  opts.zoom = clamp(Number(opts.zoom) || 0, 0, 1);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    opts.sway = 0;
    opts.intro = false;
  }

  const ctx = canvas.getContext('2d');
  const patterns = Object.fromEntries(Object.entries(opts.words).map(([k, w]) => [k, patternOf(w)]));
  const charset = [...new Set(Object.values(patterns).join('').replace(/\s/g, ''))];
  const charIndex = new Map(charset.map((ch, i) => [ch, i]));
  // Each word as charset indices, so a cell's letter is a lookup: glyphOf(word, i) = word[i mod length].
  const codes = Object.fromEntries(Object.entries(patterns).map(([k, p]) => [k, Int16Array.from([...p], (ch) => (ch === ' ' ? -1 : charIndex.get(ch)))]));
  const glyphOf = (word, i) => word[mod(i, word.length)];
  const stray = codes.ocean.filter((g) => g >= 0); // the boat's edges occasionally catch a letter of the sea

  const skyLayers = [{ alpha: 1, red: true }, { alpha: 0.94 }, { alpha: 0.42 }];
  const seaLayers = [{ alpha: 1, bold: true }, { alpha: 0.95 }, ...SWELLS.map((s) => ({ alpha: s.alpha }))];

  const clouds = CLOUDS.map((spec, index) => {
    const cloud = { spec, index, near: spec.near, speed: spec.speed, cx: spec.x, y: spec.base, scale: 1 };
    reshapeCloud(cloud, 0);
    return cloud;
  });
  const nearRow = [];
  const farRow = [];

  let m = null;
  let time = 0;
  let last = 0;
  let lastStep = -1;
  let fresh = true; // the next step shows shapes fully inked instead of fading them in
  let paused = false;
  let started = false;
  let raf = 0;

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) {
      m = null; // hidden or collapsed: skip rendering until the next resize
      return;
    }
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    // Proportions measured from the reference: cap height is 82% of the row pitch, and the
    // character pitch is 0.865 cap heights.
    const rh = Math.max(12, Math.min(H, W * 0.9) / opts.rowsPerScreen);
    const fontPx = rh / 0.867;
    ctx.font = `380 ${fontPx}px ${opts.fontFamily}`;
    const cw = ctx.measureText('M').width + fontPx * 0.015;
    const capH = ctx.measureText('H').actualBoundingBoxAscent || fontPx * 0.71;
    const rows = Math.ceil(H / rh) + 1;
    const cols = Math.ceil(W / cw) + 2; // includes one column hanging off each side for the sway

    // The sea grid is indexed in its own plane, so a cell keeps its letter while the plane shrinks.
    // Size it for the smallest scale the zoom reaches.
    const seaMin = lerp(1, ZOOM_OUT.sea, opts.zoom);
    const seaHalf = Math.ceil(W / 2 / (cw * seaMin)) + 2;
    const seaRows = Math.ceil(H / (rh * seaMin)) + 2;
    const skyMin = Math.min(lerp(1, ZOOM_OUT.nearSky, opts.zoom), lerp(1, ZOOM_OUT.farSky, opts.zoom));

    const metrics = { cw, rh, fontPx, capH };
    m = {
      dpr, W, H, cw, rh, rows, cols, metrics,
      span: Math.max(3.2, W / (H * skyMin) + 1.4), // wrap-around for drifting clouds
      paper: buildPaper(canvas.width, canvas.height, opts.paper),
      skyAtlas: buildAtlas(charset, opts.fontFamily, 380, metrics, 1, dpr, opts.ink),
      planeAtlas: buildAtlas(charset, opts.fontFamily, 500, metrics, PLANE_TEXT_SCALE, dpr, opts.planeInk),
      seaAtlas: null,
      sky: makeGrid(rows * cols),
      sea: makeGrid((seaHalf * 2 + 1) * (seaRows * 2 + 1)),
      seaHalf, seaRows, seaCols: seaHalf * 2 + 1,
      seaU: new Float32Array(cols),
      seaTop: new Float32Array(cols),
      nearU: new Float32Array(cols),
      farU: new Float32Array(cols),
      colU: new Float32Array(seaHalf * 2 + 1),
      colTop: SWELLS.map(() => new Float32Array(seaHalf * 2 + 1)),
    };
    fresh = true;
    lastStep = -1;
  }

  // Sea glyphs are re-rendered at the sea's current scale so they stay crisp while it shrinks.
  function seaAtlasFor(scale) {
    const a = m.seaAtlas;
    if (a && Math.abs(a.scale - scale) < 0.004) return a;
    const { metrics, dpr } = m;
    m.seaAtlas = {
      scale,
      regular: buildAtlas(charset, opts.fontFamily, 380, metrics, scale, dpr, opts.ink),
      bold: buildAtlas(charset, opts.fontFamily, 500, metrics, scale, dpr, opts.ink),
      bottle: buildAtlas(charset, opts.fontFamily, 380, metrics, scale, dpr, opts.bottleInk),
    };
    return m.seaAtlas;
  }

  function progress(t, start, end) {
    return opts.intro ? easeInOutCubic(clamp((t - start) / (end - start), 0, 1)) : 1;
  }

  // Where each plane sits on screen: `oy` is the screen y of the scene origin and `unit` is px per
  // scene unit. The near sky scales about the top of the screen, the far sky and the sea about the
  // sinking horizon.
  function cameraAt(t) {
    const H = m.H;
    const k1 = progress(t, PULL_BACK.start, PULL_BACK.end);
    const k2 = progress(t, ZOOM_OUT.start, ZOOM_OUT.end) * opts.zoom;
    const unit = lerp(PULL_BACK.scale, 1, k1) * H;
    const oy = lerp(PULL_BACK.horizon, HORIZON, k1) * H;
    const horizon = lerp(HORIZON, ZOOM_OUT.horizon, k2) * H;
    const near = lerp(1, ZOOM_OUT.nearSky, k2), far = lerp(1, ZOOM_OUT.farSky, k2), sea = lerp(1, ZOOM_OUT.sea, k2);
    const offset = oy - HORIZON * H;
    return {
      near: { oy: oy * near, unit: unit * near },
      far: { oy: horizon + offset * far, unit: unit * far },
      sea: { oy: horizon + offset * sea, unit: unit * sea, scale: sea, gridY: horizon },
    };
  }

  // Hidden -> grey -> inked when a shape arrives; inked -> grey -> hidden when it leaves. A cell
  // that stays inside a moving shape just takes the shape's next letter.
  function advance(grid, cell, target, glyph) {
    let o = grid.owner[cell], l = grid.level[cell];
    if (fresh) {
      o = target;
      l = target < 0 ? 0 : 2;
    } else if (target === o) {
      if (o >= 0 && l < 2) l++;
    } else if (target < 0) {
      if (--l <= 0) {
        l = 0;
        o = -1;
      }
    } else {
      o = target;
      l = 1;
    }
    grid.owner[cell] = o;
    grid.level[cell] = l;
    if (target >= 0) grid.glyph[cell] = glyph; // a fading-out letter keeps the letter it had
  }

  function drawGlyph(atlas, glyph, x, y, alpha) {
    const { dpr } = m;
    const { gw, gh } = atlas;
    ctx.globalAlpha = alpha;
    ctx.drawImage(atlas.canvas, glyph * gw, 0, gw, gh, Math.round(x * dpr - gw / 2), Math.round(y * dpr - gh / 2), gw, gh);
  }

  const swayOf = (row, t, amp) => amp * (Math.sin((TAU * t) / 1.3 + hash3(row, 1, 7) * TAU) + 0.45 * Math.sin((TAU * t) / 7.5 + hash3(row, 2, 7) * TAU));

  // Clouds use the original screen grid and moving text anchors. The smaller planes are
  // drawn separately, with a blank border in the cloud texture.
  // Cells covered by the boat or the water stay empty.
  function drawSky(t, cam, boat, planes) {
    const { W, cw, rh, rows, cols, sky } = m;
    const cx = W / 2;
    for (let i = 0; i < cols; i++) {
      const x = (i - 1) * cw + cw / 2;
      m.nearU[i] = (x - cx) / cam.near.unit;
      m.farU[i] = (x - cx) / cam.far.unit;
      m.seaU[i] = (x - cx) / cam.sea.unit;
      m.seaTop[i] = waterTopAt(m.seaU[i], t);
    }
    for (const c of clouds) {
      const layer = c.near ? cam.near : cam.far;
      c.col0 = Math.round((cx + c.cx * layer.unit) / cw);
      c.row0 = Math.round((layer.oy + c.y * layer.unit) / rh);
    }

    for (let r = 0; r < rows; r++) {
      const y = r * rh + rh / 2;
      const vNear = (y - cam.near.oy) / cam.near.unit;
      const vFar = (y - cam.far.oy) / cam.far.unit;
      const vSea = (y - cam.sea.oy) / cam.sea.unit;
      const sway = swayOf(r, t, cw * opts.sway);
      nearRow.length = farRow.length = 0;
      for (const c of clouds) {
        const v = c.near ? vNear : vFar;
        if (v > c.y - c.h * 1.45 * c.scale && v < c.y + 0.1 * c.scale) (c.near ? nearRow : farRow).push(c);
      }
      const planeRow = planes.filter((p) => vFar > p.top && vFar < p.bottom);

      for (let i = 0; i < cols; i++) {
        const col = i - 1;
        let target = -1, glyph = -1;
        if (vSea < m.seaTop[i] && !insideBoat(m.seaU[i], vSea, boat)) {
          let plane = Infinity;
          for (const p of planeRow) {
            const d = shapeDistance(m.farU[i], vFar, p) / p.margin;
            plane = Math.min(plane, d);
          }
          if (plane >= 1) {
            for (const c of nearRow) {
              if (cloudField(c, m.nearU[i], vNear, t) < 0.5) continue;
              target = NEAR_CLOUD;
              glyph = glyphOf(codes.clouds, col - c.col0 - (r - c.row0) + c.index * 3);
              break;
            }
            for (let n = 0; target < 0 && n < farRow.length; n++) {
              const c = farRow[n];
              if (cloudField(c, m.farU[i], vFar, t) < 0.5) continue;
              target = FAR_CLOUD;
              glyph = glyphOf(codes.clouds, col - c.col0 - (r - c.row0) + c.index * 3);
            }
          }
        }
        const cell = r * cols + i;
        advance(sky, cell, target, glyph);
        const owner = sky.owner[cell], g = sky.glyph[cell];
        if (owner < 0 || g < 0) continue;
        const layer = skyLayers[owner];
        drawGlyph(m.skyAtlas, g, col * cw + cw / 2 + sway, y, layer.alpha * (sky.level[cell] === 2 ? 1 : FADE_ALPHA));
      }
    }
  }

  // Small upright letters retain the wing gaps and propeller as the plane banks and loops.
  function drawPlanes(cam, planes) {
    const cw = m.cw * PLANE_TEXT_SCALE, rh = m.rh * PLANE_TEXT_SCALE;
    const unit = cam.far.unit;
    for (const p of planes) {
      const x = m.W / 2 + p.x * unit, y = cam.far.oy + p.y * unit;
      const reach = p.size * 0.72 * unit;
      const col0 = Math.round(x / cw), row0 = Math.round(y / rh);
      const iMin = Math.max(0, Math.floor((x - reach) / cw));
      const iMax = Math.min(Math.ceil(m.W / cw), Math.ceil((x + reach) / cw));
      const jMin = Math.max(0, Math.floor((y - reach) / rh));
      const jMax = Math.min(Math.ceil(m.H / rh), Math.ceil((y + reach) / rh));
      for (let j = jMin; j <= jMax; j++) {
        const py = (j + 0.5) * rh;
        for (let i = iMin; i <= iMax; i++) {
          const px = (i + 0.5) * cw;
          if (shapeDistance((px - m.W / 2) / unit, (py - cam.far.oy) / unit, p) >= 0) continue;
          const g = glyphOf(codes.plane, i - col0 - (j - row0) + 1);
          if (g >= 0) drawGlyph(m.planeAtlas, g, px, py, 1);
        }
      }
    }
  }

  // The boat, bottles and swells, on the sea plane's own grid, which shrinks as the camera zooms out.
  // The boat's and bottles' text rides with them; each swell's text streams past with its water.
  function drawSea(t, stepIndex, cam, boat, planes) {
    const { W, H, cw, rh, sea, seaHalf, seaRows, seaCols } = m;
    const scale = cam.sea.scale;
    const cwS = cw * scale, rhS = rh * scale;
    const atlas = seaAtlasFor(scale);
    const cx = W / 2;
    const unit = cam.sea.unit;
    const iMin = Math.max(-seaHalf, Math.floor(-cx / cwS) - 2), iMax = Math.min(seaHalf, Math.ceil(cx / cwS) + 1);
    const jMin = Math.max(-seaRows, Math.floor(-cam.sea.gridY / rhS) - 1), jMax = Math.min(seaRows, Math.ceil((H - cam.sea.gridY) / rhS));
    const toCol = (x) => Math.round((x * unit) / cwS);
    const toRow = (y) => Math.round((cam.sea.oy + y * unit - cam.sea.gridY) / rhS);
    const bottles = bottlesAt(t, cx / unit, (0.75 * rhS) / unit);
    for (const b of bottles) (b.col0 = toCol(b.x)), (b.row0 = toRow(b.y));
    const boatCol = toCol(boat.x), boatRow = toRow(boat.y);
    const scroll = SWELLS.map((s) => Math.round((s.flow * t * unit) / cwS));

    let waterTop = Infinity;
    for (let i = iMin; i <= iMax; i++) {
      const k = i + seaHalf;
      const u = ((i + 0.5) * cwS) / unit;
      m.colU[k] = u;
      SWELLS.forEach((s, w) => {
        const top = surfaceY(s, u, t);
        m.colTop[w][k] = top;
        waterTop = Math.min(waterTop, top);
      });
    }

    for (let j = jMin; j <= jMax; j++) {
      const y = cam.sea.gridY + (j + 0.5) * rhS;
      const v = (y - cam.sea.oy) / unit;
      const sway = swayOf(j + 5000, t, cwS * opts.sway);
      const inWater = v >= waterTop;
      const bottleRow = bottles.filter((b) => v > b.top && v < b.bottom);
      const vFar = (y - cam.far.oy) / cam.far.unit;
      const planeRow = planes.filter((p) => vFar >= p.top && vFar <= p.bottom);
      const shift = SWELLS.map((s, w) => Math.floor(hash3(j, 3 + w, 7) * codes.ocean.length) - scroll[w]);
      for (let i = iMin; i <= iMax; i++) {
        const k = i + seaHalf;
        let target = -1, glyph = -1;
        let bottle = Infinity, which = null;
        for (const b of bottleRow) {
          const d = shapeDistance(m.colU[k], v, b) / b.margin;
          if (d < bottle) (bottle = d), (which = b);
        }
        if (insideBoat(m.colU[k], v, boat)) {
          target = BOAT;
          glyph = glyphOf(codes.boat, i - boatCol - (j - boatRow) + 2);
        } else if (bottle < 1) {
          // the blank border keeps the bottle legible on the water
          if (bottle < 0) (target = FLOATER), (glyph = glyphOf(codes.bottle, i - which.col0 - (j - which.row0) + 4));
        } else if (inWater) {
          for (let w = 0; w < SWELLS.length; w++) {
            if (v < m.colTop[w][k]) continue;
            target = SWELL + w;
            glyph = glyphOf(codes.ocean, i + shift[w]);
            break;
          }
        }

        const cell = (j + seaRows) * seaCols + k;
        advance(sea, cell, target, glyph);
        const owner = sea.owner[cell];
        let g = sea.glyph[cell];
        if (owner < 0 || g < 0) continue;
        const level = sea.level[cell];
        if (owner === BOAT && level === 1 && hash3(i, j, stepIndex) < 0.15) g = stray[Math.floor(hash3(i, j, stepIndex + 1) * stray.length)];
        const x = cx + (i + 0.5) * cwS + sway;
        const uFar = (x - cx) / cam.far.unit;
        if (planeRow.some((p) => shapeDistance(uFar, vFar, p) < p.margin)) continue;
        const layer = seaLayers[owner];
        const glyphAtlas = owner === FLOATER ? atlas.bottle : layer.bold ? atlas.bold : atlas.regular;
        drawGlyph(glyphAtlas, g, x, y, layer.alpha * (level === 2 ? 1 : FADE_ALPHA));
      }
    }
  }

  // Advance the scene one step: move everything, work out which shape owns each cell, move each
  // cell's letter one fade level towards it, and redraw.
  function step(t, stepIndex) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(m.paper, 0, 0);
    for (const c of clouds) {
      const travelled = c.spec.x + c.speed * t + m.span / 2;
      const lap = Math.floor(travelled / m.span);
      if (lap !== c.lap) reshapeCloud(c, lap);
      c.cx = travelled - lap * m.span - m.span / 2;
      const across = c.cx / (m.span / 2); // +1 entering on the right, -1 leaving on the left
      c.y = c.base + c.rise * across + c.bob.amp * Math.sin((TAU * t) / c.bob.period + c.bob.phase);
      c.scale = 1 + c.grow.amp * Math.sin((TAU * t) / c.grow.period + c.grow.phase);
    }
    const cam = cameraAt(t);
    const boat = boatAt(t);
    const bounds = {
      left: -m.W / (2 * cam.far.unit), right: m.W / (2 * cam.far.unit),
      top: -cam.far.oy / cam.far.unit, bottom: (m.H - cam.far.oy) / cam.far.unit,
    };
    const planes = planesAt(t, bounds, (0.5 * m.rh) / cam.far.unit);
    drawSky(t, cam, boat, planes);
    drawSea(t, stepIndex, cam, boat, planes);
    drawPlanes(cam, planes);
    fresh = false;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (!paused) time += dt * opts.speed;
    const s = Math.floor(time * STEP_RATE);
    if (m && s !== lastStep) {
      lastStep = s;
      step(s / STEP_RATE, s);
    }
  }

  const onResize = () => {
    if (started) layout();
  };
  window.addEventListener('resize', onResize);

  const fam = opts.fontFamily;
  const fontsReady = document.fonts
    ? Promise.race([
        Promise.all([380, 500].map((w) => document.fonts.load(`${w} 20px ${fam}`))),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ])
    : Promise.resolve();
  fontsReady
    .catch(() => {})
    .then(() => {
      started = true;
      layout();
      raf = requestAnimationFrame(frame);
    });

  return {
    togglePause() {
      paused = !paused;
    },
    restart() {
      time = 0;
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    },
  };
}
