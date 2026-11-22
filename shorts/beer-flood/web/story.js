// Shot plan for "The London Beer Flood" — timed to voice.mp3 (65.88 s, 30 fps, 1976 frames).
// Phrase frames (work/phrases.json): hook 0-105 | October 126-186 | brewery/vats 202-322 | biggest 333-444 | hoops 457-584 |
// clerk 599-718 | boss shrugs 730-797 | hour later / snaps 814-876 | bursts 885-1034 | back wall 1046-1157 | St Giles/cellars 1171-1327 |
// rescuers 1341-1435 | eight 1450-1505 | who pays 1525-1555 | court/brewery/hoop/boss/act of God 1571-1741 | nobody 1752-1780 |
// and the brewery 1796-1816 | tax 1830-1926 | gets it back 1939-1970
import { M, camFromKeys, idle, blinkAt, walk, q, clamp, lerp, lerp3, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1976, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 120, light: 'golden' },
  { id: 'setting', a: 121, b: 200, light: 'day' },
  { id: 'hall', a: 201, b: 330, light: 'day' },
  { id: 'biggest', a: 331, b: 452, light: 'day' },
  { id: 'hoops', a: 453, b: 592, light: 'day' },
  { id: 'clerk', a: 593, b: 724, light: 'day' },
  { id: 'boss', a: 725, b: 806, light: 'day' },
  { id: 'snap', a: 807, b: 880, light: 'golden' },
  { id: 'burst', a: 881, b: 1040, light: 'golden' },
  { id: 'wall', a: 1041, b: 1165, light: 'golden' },
  { id: 'street', a: 1166, b: 1334, light: 'golden' },
  { id: 'rescue', a: 1335, b: 1442, light: 'golden' },
  { id: 'eight', a: 1443, b: 1515, light: 'dusk' },
  { id: 'court', a: 1516, b: 1564, light: 'court' },
  { id: 'evidence', a: 1565, b: 1747, light: 'court' },
  { id: 'blame', a: 1748, b: 1789, light: 'court' },
  { id: 'office', a: 1790, b: 1936, light: 'office' },
  { id: 'payoff', a: 1937, b: 1975, light: 'office' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const smooth = M.smooth;

// world anchors (must match main.js)
const WALL_Z = -7.3, V1 = [-1.6, 0, -3.2], COURT = 200, OFFICE = 300;
const CANDLE = [2.94, 3.85, -20.85], CELLAR = [2.94, 0.2, -20.15];

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 130, el: 44, sky: '#c8d4e4', ground: '#857a68', hemi: 1.15, sun: '#fff1dc', sunI: 2.4, fog: '#cdd6e2', fogNear: 60, fogFar: 520,
    skyTop: '#2f78d8', skyHor: '#ffe3b8', sunDisc: '#fff6dc', sunSize: 0.004, rays: 0.55, sat: 1.22, waterDeep: '#3a1f10', waterShal: '#6b3a1c', glint: '#e8cfa0', vig: 0.2, shadowExt: 22 },
  golden: { az: 60, el: 16, sky: '#a49ac4', ground: '#6a4c40', hemi: 1.0, sun: '#ffbe7a', sunI: 2.8, fog: '#e9bf98', fogNear: 50, fogFar: 460,
    skyTop: '#5a4fb0', skyHor: '#ff9e5e', sunDisc: '#fff0c8', sunSize: 0.006, rays: 0.9, sat: 1.25, gain: '#fff2e2', waterDeep: '#3a1d0e', waterShal: '#7a4320', glint: '#f2d6a6', vig: 0.26, shadowExt: 22 },
  dusk: { az: 200, el: 14, sky: '#7a88b8', ground: '#3e3a4a', hemi: 1.15, sun: '#b4c2ff', sunI: 1.5, fog: '#4a5680', fogNear: 30, fogFar: 300,
    skyTop: '#1d2550', skyHor: '#c48ab8', rays: 0.3, sunDisc: '#ffe0d0', sunSize: 0.004, sat: 1.12, gain: '#dfe6ff', waterDeep: '#20140e', waterShal: '#3f2818', glint: '#9a8a78', vig: 0.34, shadowExt: 14 },
  court: { az: 150, el: 62, sky: '#e8d6b8', ground: '#6a4a30', hemi: 1.25, sun: '#fff0d6', sunI: 1.9, fog: '#d8c8b0', fogNear: 60, fogFar: 400,
    skyTop: '#7a90b8', skyHor: '#e2d2b8', sat: 1.2, waterDeep: '#3a1f10', waterShal: '#6b3a1c', glint: '#e8cfa0', vig: 0.24, shadowExt: 12 },
  office: { az: 110, el: 58, sky: '#efe0c4', ground: '#6a5038', hemi: 1.3, sun: '#ffe8c4', sunI: 1.8, fog: '#e0d0b4', fogNear: 60, fogFar: 400,
    skyTop: '#7a90b8', skyHor: '#e6d6bc', sat: 1.22, gain: '#fff6ea', waterDeep: '#3a1f10', waterShal: '#6b3a1c', glint: '#e8cfa0', vig: 0.24, shadowExt: 12 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });

// ---------- cameras ----------
const CAMS = {
  hook: [
    { f: 0, pos: [10.9, 1.45, -11.9], look: [8, 0.85, -13.6], fov: 34 },
    { f: 22, pos: [11.2, 1.6, -11.6], look: [8, 0.9, -13.6], fov: 35 },
    { f: 96, pos: [17, 5.2, -9.4], look: [-2, 1.6, -15.5], fov: 48, ease: 'smooth' },
    { f: 120, pos: [17.3, 5.4, -9.2], look: [-2, 1.6, -15.5], fov: 47 },
  ],
  setting: [
    { f: 121, pos: [5.6, 11.6, -19.6], look: [5.2, 6.8, -7.3], fov: 50 },
    { f: 200, pos: [5.3, 11.3, -18.4], look: [5.0, 6.9, -7.3], fov: 48 },
  ],
  hall: [
    { f: 201, pos: [5.3, 11.3, -18.4], look: [5.0, 6.9, -7.3], fov: 48 },
    { f: 262, pos: [2.5, 15.5, -4], look: [0, 4, 0], fov: 50, path: [[3.2, 15, -12]] },
    { f: 312, pos: [4.2, 1.3, 7.4], look: [-1.6, 5.4, -3.2], fov: 54, path: [[4, 9, 4]] },
    { f: 330, pos: [4.3, 1.25, 7.6], look: [-1.6, 5.5, -3.2], fov: 53 },
  ],
  biggest: [
    { f: 331, pos: [1.8, 1.4, 3.6], look: [-1.6, 3.2, -3.2], fov: 44 },
    { f: 400, pos: [1.2, 9.4, 1.5], look: [-1.6, 6.3, -3.2], fov: 42, ease: 'smooth' },
    { f: 452, pos: [1.0, 9.6, 1.2], look: [-1.6, 6.3, -3.2], fov: 40 },
  ],
  hoops: [
    { f: 453, pos: [2.6, 4.6, 2.8], look: [-0.6, 3.9, -1.0], fov: 36 },
    { f: 515, pos: [2.8, 1.9, 3.1], look: [-0.6, 1.6, -0.9], fov: 36 },
    { f: 548, pos: [5.4, 1.7, 5.2], look: [2.9, 1.35, 1.1], fov: 34 },
    { f: 592, pos: [5.2, 1.7, 4.9], look: [2.9, 1.35, 1.1], fov: 32 },
  ],
  clerk: [
    { f: 593, pos: [3.2, 1.55, 4.4], look: [0.9, 1.75, 0.6], fov: 36 },
    { f: 632, pos: [3.0, 1.6, 4.1], look: [0.8, 2.0, 0.6], fov: 35 },
    { f: 664, pos: [0.15, 2.0, 1.8], look: [-1.3, 1.4, -0.1], fov: 28 },
    { f: 724, pos: [0.0, 1.95, 1.6], look: [-1.3, 1.4, -0.1], fov: 26 },
  ],
  boss: [
    { f: 725, pos: [2.3, 1.75, 7.4], look: [1.6, 1.55, 0.9], fov: 42 },
    { f: 806, pos: [2.25, 1.75, 7.0], look: [1.6, 1.55, 0.9], fov: 40 },
  ],
  snap: [
    { f: 807, pos: [-0.9, 1.75, 2.9], look: [-1.6, 1.3, -0.05], fov: 38 },
    { f: 848, pos: [-1.0, 1.7, 2.6], look: [-1.6, 1.3, -0.05], fov: 36 },
    { f: 880, pos: [-0.9, 1.8, 3.0], look: [-1.6, 1.35, -0.05], fov: 40, roll: -3 },
  ],
  burst: [
    { f: 881, pos: [3.6, 3.4, 13.5], look: [0.4, 3.6, -3.6], fov: 50 },
    { f: 1040, pos: [4.2, 3.9, 14.6], look: [0.8, 3.2, -3.6], fov: 52 },
  ],
  wall: [
    { f: 1041, pos: [-0.4, 2.4, -18.2], look: [-1.6, 3.8, -7.3], fov: 52 },
    { f: 1092, pos: [-0.5, 2.3, -17.6], look: [-1.6, 3.8, -7.3], fov: 50 },
    { f: 1165, pos: [1.8, 3.6, -19.8], look: [-1.6, 1.8, -9.5], fov: 56, ease: 'easeOut' },
  ],
  street: [
    { f: 1166, pos: [16, 3.6, -10.2], look: [-4, 1.2, -16.5], fov: 46 },
    { f: 1250, pos: [13, 3.2, -10.8], look: [-5, 1.1, -17], fov: 44 },
    { f: 1262, pos: [4.6, 2.2, -16.9], look: [2.94, 0.6, -20.3], fov: 40, ease: 'easeOut' },
    { f: 1334, pos: [4.4, 2.1, -17.3], look: [2.94, 0.6, -20.3], fov: 37 },
  ],
  rescue: [
    { f: 1335, pos: [3.4, 2.3, -9.4], look: [-1.4, 1.1, -12.8], fov: 42 },
    { f: 1442, pos: [2.8, 2.2, -9.9], look: [-1.4, 1.1, -12.8], fov: 39 },
  ],
  eight: [
    { f: 1443, pos: [CANDLE[0] + 0.2, CANDLE[1] + 0.9, CANDLE[2] + 6], look: [CANDLE[0], CANDLE[1] + 0.25, CANDLE[2]], fov: 40 },
    { f: 1515, pos: [CANDLE[0] + 0.1, CANDLE[1] + 0.55, CANDLE[2] + 3.4], look: [CANDLE[0], CANDLE[1] + 0.25, CANDLE[2]], fov: 34 },
  ],
  court: [
    { f: 1516, pos: [COURT + 0.4, 3.0, 5.4], look: [COURT, 2.5, -3.5], fov: 40 },
    { f: 1564, pos: [COURT + 0.3, 3.0, 5.0], look: [COURT, 2.5, -3.5], fov: 38 },
  ],
  evidence: [
    { f: 1565, pos: [COURT - 1.3, 1.9, 2.9], look: [COURT - 1.3, 1.35, 0.2], fov: 32 },
    { f: 1608, pos: [COURT - 1.2, 1.85, 2.7], look: [COURT - 1.3, 1.35, 0.2], fov: 30 },
    { f: 1622, pos: [COURT + 1.3, 2.4, 2.4], look: [COURT + 1.22, 1.15, 0.3], fov: 32, ease: 'easeOut' },
    { f: 1646, pos: [COURT + 1.32, 2.35, 2.25], look: [COURT + 1.22, 1.15, 0.3], fov: 31 },
    { f: 1656, pos: [COURT + 2.4, 1.8, 5.0], look: [COURT + 2.7, 1.55, 1.9], fov: 34, ease: 'easeOut' },
    { f: 1684, pos: [COURT + 2.3, 1.8, 4.8], look: [COURT + 2.7, 1.55, 1.9], fov: 33 },
    { f: 1696, pos: [COURT + 0.2, 3.1, -0.6], look: [COURT, 3.0, -4.5], fov: 38, ease: 'easeOut' },
    { f: 1731, pos: [COURT + 0.1, 3.05, -1.0], look: [COURT, 2.9, -4.5], fov: 35 },
    { f: 1747, pos: [COURT + 0.05, 4.1, -3.3], look: [COURT, 2.59, -4.1], fov: 34, ease: 'easeOut' },
  ],
  blame: [
    { f: 1748, pos: [COURT + 0.05, 4.1, -3.3], look: [COURT, 2.59, -4.1], fov: 34 },
    { f: 1770, pos: [COURT + 0.6, 3.0, 7.6], look: [COURT, 2.0, -2], fov: 46, ease: 'smooth' },
    { f: 1789, pos: [COURT + 0.5, 3.0, 7.3], look: [COURT, 2.0, -2], fov: 45 },
  ],
  office: [
    { f: 1790, pos: [OFFICE + 2.0, 2.0, 3.6], look: [OFFICE - 0.2, 1.45, -1.4], fov: 40 },
    { f: 1874, pos: [OFFICE + 1.8, 1.95, 3.2], look: [OFFICE - 0.2, 1.45, -1.4], fov: 38 },
    { f: 1890, pos: [OFFICE - 0.4, 2.55, -0.35], look: [OFFICE - 0.4, 1.17, -1.0], fov: 34, ease: 'easeOut' },
    { f: 1936, pos: [OFFICE - 0.4, 2.45, -0.4], look: [OFFICE - 0.4, 1.17, -1.0], fov: 32 },
  ],
  payoff: [
    { f: 1937, pos: [OFFICE + 2.2, 1.95, 3.2], look: [OFFICE + 0.6, 1.4, -0.3], fov: 42 },
    { f: 1975, pos: [OFFICE + 1.7, 1.85, 2.4], look: [OFFICE + 0.6, 1.4, -0.3], fov: 36, roll: 4 },
  ],
};
const KICKS = [{ f: 850, a: 0.05 }, { f: 887, a: 0.06 }, { f: 999, a: 0.05 }, { f: 1095, a: 0.07 }, { f: 1733, a: 0.045 }, { f: 1962, a: 0.04 }];
const FLASH = [121, 807, 1516, 1790];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  c.flash = 0; for (const a of FLASH) if (f >= a && f < a + 6) c.flash = (1 - (f - a) / 6) * 0.85;
  if (S.id === 'court' || S.id === 'evidence' || S.id === 'blame') c.shadowAt = [COURT, 1, -1];
  if (S.id === 'office' || S.id === 'payoff') c.shadowAt = [OFFICE, 1, -1];
  if (S.id === 'hook' || S.id === 'street' || S.id === 'rescue' || S.id === 'eight' || S.id === 'wall') c.shadowAt = [0, 0, -14];
  if (S.id === 'setting' || S.id === 'hall' || S.id === 'burst') c.shadowAt = [0, 0, -4];
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'hook': return { focus: dist(C.pos, [8, 0.9, -13.6]), cinf: lerp(12, 0, M.smooth(ramp(f, 22, 80))) };
    case 'clerk': return f < 650 ? { focus: dist(C.pos, [0.9, 1.9, 0.6]), cinf: 10 } : { focus: dist(C.pos, [-1.3, 1.4, -0.1]), cinf: 12 };
    case 'boss': return { focus: dist(C.pos, [2.0, 1.8, 1.1]), cinf: 9 };
    case 'snap': return { focus: dist(C.pos, [-1.4, 1.35, -0.1]), cinf: 13 };
    case 'eight': return { focus: dist(C.pos, CANDLE), cinf: 10 };
    case 'evidence': return { focus: dist(C.pos, C.look), cinf: 11 };
    case 'office': return { focus: dist(C.pos, C.look), cinf: 9 };
    case 'payoff': return { focus: dist(C.pos, [OFFICE + 0.3, 1.5, -0.5]), cinf: 10 };
    case 'rescue': return { focus: dist(C.pos, [-1.4, 1.2, -12.6]), cinf: 6 };
  }
  return { focus: 10, cinf: 0 };
};

// ---------- world state ----------
const NONE = { R: 0, h: 0, H: 0 }, NOST = { L: 0, ex: 0, xc: -1.6, h: 0, H: 0 };
const FULL_HALL = { R: 14, h: 0.55, H: 0 }, FULL_ST = { L: 13.6, ex: 34, xc: -1.6, h: 0.85, H: 0 };
export const worldAt = (f) => {
  const S = shotAt(f);
  const W = { b1: 0, b2: 0, slip: 0, snap: 0, wallT: 0, hall: NONE, street: NOST, float: null, candles: null, stamped: false, bag: null };
  const after = (fa) => f >= fa;
  // the slipped hoop (from the clerk's shot on)
  W.slip = f >= 640 ? M.smooth(ramp(f, 640, 676)) : 0;
  if (S.id === 'hook') { W.slip = 1; W.snap = 1; W.b1 = 1.2; W.b2 = 1.2; W.wallT = 6; W.hall = FULL_HALL; W.street = { ...FULL_ST, h: 0.75 }; W.float = { hat: [8, 0, -13.6], barrel: [5.2, 0, -16.2] }; return W; }
  W.snap = f >= 850 ? M.back(ramp(f, 850, 858)) : 0;
  W.b1 = f >= 887 ? clamp((f - 887) / 26, 0, 1.25) : 0;
  W.b2 = f >= 999 ? clamp((f - 999) / 24, 0, 1.25) : 0;
  if (f >= 887) {
    const k = M.easeOut(ramp(f, 887, 1000)), R = lerp(3.2, 14, k);
    W.hall = { R, h: lerp(0.15, 0.55, k), H: lerp(4.2, 0, M.smooth(ramp(f, 900, 1060))) };
  }
  W.wallT = f >= 1095 ? (f - 1095) / 30 : 0;
  if (f >= 1095) {
    const k = M.easeOut(ramp(f, 1095, 1165)), k2 = M.smooth(ramp(f, 1166, 1300));
    W.street = { L: lerp(0.3, 13.6, k), ex: lerp(4, 14, k) + 20 * k2, xc: -1.6, h: lerp(0.2, 0.9, Math.max(k, k2)), H: lerp(3.2, 1.0, k) * (1 - k2) };
  }
  if (S.id === 'eight') { W.street = { ...FULL_ST, h: 0.3 }; W.candles = CANDLE; }
  if (f >= 1516) { W.hall = NONE; W.street = NOST; }
  W.stamped = f >= 1733;
  if (S.id === 'payoff') {
    const k = M.back(ramp(f, 1944, 1962), 1.2);
    W.bag = { p: [OFFICE + lerp(-0.1, 0.25, k), 1.15, lerp(-1.9, -0.45, k)], rz: f >= 1944 && f < 1966 ? Math.sin((f - 1944) * 0.8) * 0.15 * (1 - ramp(f, 1944, 1966)) : 0 };
  }
  return W;
};

// ---------- actors (2D cards) ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed, o) => { const i = idle(f, seed); return { seed, blink: blinkAt(f, seed), bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), ...o }; };
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const tint = S.light === 'golden' ? '#ffe2c8' : S.light === 'dusk' ? '#c8d0ff' : '#ffffff';
  const put = (who, o, pos, extra = {}) => out.push(R(T, who, o, pos, { tint, ...extra }));
  const laugh = (s) => ({ bob: q(Math.abs(Math.sin((f + s) * 0.55)) * 0.025, 3), tilt: q(-4 + 3 * Math.sin(f * 0.5 + s), 1) });
  switch (S.id) {
    case 'setting': {
      const w1 = walk(f, 121, 1.2), w2 = walk(f, 121, 1.0);
      put('lady', life(f, 51, { step: q(w1.phase, 2), facing: 1 }), [-6 + w1.dist, 0, -14]);
      put('gent', life(f, 52, { step: q(w2.phase, 2), facing: -1 }), [8 - w2.dist, 0, -16.5]);
      break;
    }
    case 'hall': case 'biggest': {
      put('brewer', life(f, 61, { L: 'hip', look: 0.4 }), [-4.6, 0, 1.2]);
      put('brewer2', life(f, 62, { L: 'up', R: 'hang', look: -0.3 }), [3.6, 0, 1.6]);
      put('clerk', life(f, 63, { look: 0.2 }), [0.9, 0, 1.8]);
      if (S.id === 'biggest') put('brewer2', life(f, 64, { L: 'reach', R: 'hang', lift: 0.3, look: -0.8, expr: 'smile' }), [1.9, 5.3, -3.2], { blob: false });
      break;
    }
    case 'hoops': {
      const suck = f > 560 ? M.smooth(ramp(f, 560, 572)) : 0;
      put('brewer', life(f, 61, { L: 'belly', R: 'belly', expr: suck > 0.5 ? 'nervous' : 'smile', look: -0.5, bob: q(-0.01 * suck, 3) }), [2.9, 0, 1.1]);
      break;
    }
    case 'clerk': {
      const up = f > 612 ? 1 : 0;
      put('clerk', life(f, 63, { look: up ? -0.6 : 0.2, expr: f > 650 ? 'nervous' : 'neutral', L: f > 640 ? 'point' : 'hang', headTilt: up ? -8 : 0 }), [0.9, 0, 0.6]);
      break;
    }
    case 'boss': {
      const shrug = f >= 738 && f < 762;
      const talk = f >= 769 && f < 797;
      put('clerk', life(f, 63, { look: 0.7, expr: 'nervous', L: 'point' }), [0.7, 0, 0.9], { order: 2 });
      put('boss', life(f, 71, { L: shrug ? 'shrug' : talk ? 'wave' : 'hip', R: shrug ? 'shrug' : 'belly', wv: q(f * 0.6, 1), expr: shrug ? 'smile' : talk ? 'whistle' : 'neutral', look: -0.6, bob: shrug ? 0.015 : 0 }), [2.4, 0, 1.3], { order: 3 });
      break;
    }
    case 'burst': {
      for (const [who, seed, x0, sp] of [['brewer', 61, -4.6, 3.5], ['brewer2', 62, 3.6, 3.2], ['clerk', 63, 0.9, 3.8]]) {
        const w = walk(f, 892, sp);
        if (w.dist < 14) put(who, life(f, seed, { expr: 'shock', L: 'up', R: 'up', step: q(w.phase, 2) }), [x0 + (x0 > 0 ? 0.3 : -0.3) * w.dist, 0, 1.4 + w.dist]);
      }
      break;
    }
    case 'rescue': {
      const dig = (s) => (Math.sin((f + s) * 0.18) > 0 ? 'lift' : 'reach');
      put('rescA', life(f, 81, { L: dig(0), R: dig(0), lift: 0.4, expr: 'pained', look: -0.4 }), [-2.6, -0.15, -12.2]);
      put('rescB', life(f, 82, { L: dig(9), R: 'hang', lift: 0.3, expr: 'nervous', look: 0.3 }), [-0.4, -0.15, -13.4]);
      put('rescC', life(f, 83, { L: 'point', R: 'hang', expr: 'shock', look: 0.6 }), [0.9, -0.15, -11.6]);
      break;
    }
    case 'court': case 'evidence': case 'blame': {
      const blame = S.id === 'blame';
      const sk = f >= 1700 && f < 1733 ? M.easeIn(ramp(f, 1712, 1733)) : f >= 1733 && f < 1745 ? 1 : 0;
      const judgeL = blame ? 'shrug' : f >= 1700 && f < 1745 ? 'stamp' : 'hang';
      put('judge', life(f, 91, { L: judgeL, R: blame ? 'shrug' : 'hang', stampK: q(sk, 2), expr: blame ? 'smile' : f > 1690 ? 'stern' : 'neutral', bob: f >= 1733 && f < 1736 ? 0.02 : 0 }), [COURT, 1.4, -4.9], { blob: false, order: 1 });
      const bossShrug = (f >= 1651 && f < 1690) || blame;
      put('boss', life(f, 71, { L: bossShrug ? 'shrug' : 'hip', R: bossShrug ? 'shrug' : 'belly', expr: blame ? 'grin' : 'smile', look: -0.3 }), [COURT + 2.7, 0, 1.9]);
      put('clerk', life(f, 63, { L: blame ? 'shrug' : 'hang', R: blame ? 'shrug' : 'hang', expr: blame ? 'relief' : 'nervous', look: 0.3 }), [COURT - 2.7, 0, 2.1]);
      break;
    }
    case 'office': case 'payoff': {
      const end = S.id === 'payoff';
      put('official', life(f, 95, { L: end && f < 1962 ? 'reach' : 'hang', R: 'hang', lift: 0.1, expr: end ? 'nervous' : 'neutral', look: 0.4 }), [OFFICE - 0.1, 0, -2.6], { order: 1 });
      put('boss', life(f, 71, { L: end && f >= 1960 ? 'up' : 'hip', R: end && f >= 1960 ? 'up' : 'belly', expr: end && f >= 1958 ? 'grin' : 'smile', look: -0.5, bob: end && f >= 1962 && f < 1968 ? 0.02 : 0 }), [OFFICE + 1.25, 0, 0.15], { order: 2 });
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'setting' || S.id === 'hall') { // October leaves
    for (let i = 0; i < 10; i++) {
      const t = ((f - 121) * 0.01 + i / 10) % 1, cols = ['#d9822b', '#c4452c', '#e6b13a'];
      out.push(FX('leaf' + i % 3, (p) => T.fxLeaf(p, cols[i % 3]), [-6 + t * 10 + Math.sin(i * 3.1) * 2, 12 - t * 11 + Math.sin(t * 9 + i) * 0.4, -12 + i * 0.6], 0.5, { roll: q(t * 8 + i, 1) }));
    }
  }
  if (S.id === 'clerk' && f > 660) for (let i = 0; i < 2; i++) { const t = ((f * 0.05 + i * 0.5) % 1); out.push(FX('drip', (p) => T.fxDrip(p), [-1.25 + i * 0.25, 1.5 - t * 1.4, 0.05], 0.06)); }
  if (S.id === 'snap') {
    if (f >= 850 && f < 868) { const t = q((f - 850) / 18, 2); out.push(FX('burstS' + t, (p) => T.fxBurst(p, t, '#fff3b0'), [-1.4, 1.35, 0.1], 0.9)); }
    if (f >= 852) for (let i = 0; i < 4; i++) { const t = ((f - 852) * 0.07 + i * 0.25) % 1; out.push(FX('drip', (p) => T.fxDrip(p), [-1.6 + i * 0.2, 1.35 - t * 1.3, 0.1 + t * 0.6], 0.08)); }
  }
  if (S.id === 'wall' && f >= 1095 && f < 1140) { const k = q(ramp(f, 1095, 1140), 2); [[0, 0], [-3, 1], [3, -1]].forEach(([dx, dz], i) => out.push(FX('dust' + k, (p) => T.fxDust(p, k, '#c9a888'), [-1.6 + dx, 3 + i, -8.5 + dz], 5 + i, { tint: '#ffd9b0' }))); }
  if (S.id === 'street' && f >= 1255) { const t = q(((f - 1255) / 20) % 1, 2); out.push(FX('pour' + t, (p) => T.fxPour(p, t), [CELLAR[0], 0.9 - 1.1, CELLAR[2] + 0.45], 0.6, { order: 6 })); }
  if (S.id === 'eight') for (let i = 0; i < 8; i++) { const k = q(0.6 + 0.4 * Math.sin(f * 0.4 + i * 1.7), 1); out.push(FX('flame' + k, (p) => T.fxFlame(p, k), [CANDLE[0] - 0.42 + i * 0.12, CANDLE[1] + 0.12, CANDLE[2] + 0.12], 0.12, { order: 6 })); }
  if (S.id === 'evidence' && f >= 1733 && f < 1745) { const t = q((f - 1733) / 12, 2); out.push(FX('stampB' + t, (p) => T.fxBurst(p, t, '#ffffff'), [COURT, 2.62, -4.0], 0.8)); }
  if (S.id === 'payoff' && f >= 1962) {
    const t = q(ramp(f, 1962, 1975), 2); out.push(FX('coinB' + t, (p) => T.fxBurst(p, t, '#ffe27a', 12), [OFFICE + 0.25, 1.4, -0.35], 0.9));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, d = t * 0.6; out.push(FX('coin', (p) => T.fxCoin(p), [OFFICE + 0.25 + Math.cos(a) * d, 1.3 + Math.sin(a) * d * 0.6 + t * 0.3, -0.3], 0.12, { roll: q(a + t * 6, 1) })); }
  }
  return out;
};
