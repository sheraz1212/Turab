// "The Sky Sent Its Own" — samurai vs. thunder bombs, Hakata Bay 1274/1281. voice.mp3 63.48 s, 30 fps, 1904 frames.
// Phrase frames: 0-43 | 48-125 rode out | 136-194 threw thunder | 213-315 Hakata Bay | 330-394 rode forward alone | 402-530 name/father/victories |
// 541-703 custom + duel | 718-752 nobody | 766-844 laughed | 849-912 arrows | 925-1058 something new / iron ball / smoke | 1070-1222 bounced/exploded/horses |
// 1236-1459 you see / hollow / gunpowder / fuse / never seen | 1473-1537 night, sailed away | 1554-1651 seven years, bigger fleet | 1664-1758 typhoon | 1774-1898 twist
import { M, camFromKeys, idle, blinkAt, walk, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1904, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 206, light: 'day' },
  { id: 'bay', a: 207, b: 322, light: 'day' },
  { id: 'forward', a: 323, b: 536, light: 'day' },
  { id: 'custom', a: 537, b: 710, light: 'golden' },
  { id: 'nobody', a: 711, b: 760, light: 'day' },
  { id: 'laugh', a: 761, b: 920, light: 'day' },
  { id: 'bomb', a: 921, b: 1066, light: 'day' },
  { id: 'boom', a: 1067, b: 1235, light: 'day' },
  { id: 'inside', a: 1236, b: 1466, light: 'night' },
  { id: 'night', a: 1467, b: 1545, light: 'night' },
  { id: 'later', a: 1546, b: 1660, light: 'overcast' },
  { id: 'typhoon', a: 1661, b: 1767, light: 'storm' },
  { id: 'twist', a: 1768, b: 1903, light: 'storm' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const smooth = M.smooth;
const CUT = 200, DUEL = 40;

export const LIGHTS = {
  day: { az: 120, el: 40, sky: '#cfe4ff', ground: '#e6c99a', hemi: 1.35, sun: '#fff2d8', sunI: 2.8, fog: '#d6ecff', fogNear: 90, fogFar: 900,
    skyTop: '#2a7fe0', skyHor: '#bfe6ff', sunDisc: '#fffbe8', sunSize: 0.004, rays: 0.5, sat: 1.3, waterDeep: '#1477b8', waterShal: '#38d0e0', glint: '#f4fdff', vig: 0.16, shadowExt: 26 },
  golden: { az: 70, el: 16, sky: '#ffd6b0', ground: '#d8a070', hemi: 1.3, sun: '#ffc48a', sunI: 3.0, fog: '#ffcfa0', fogNear: 70, fogFar: 700,
    skyTop: '#5a6ad0', skyHor: '#ffb27a', sunDisc: '#fff0c8', sunSize: 0.006, rays: 0.9, sat: 1.32, gain: '#fff2e2', waterDeep: '#2a5a9a', waterShal: '#ff9a6a', glint: '#ffe6c0', vig: 0.2, shadowExt: 22 },
  night: { az: 220, el: 30, sky: '#7a90e0', ground: '#3a4270', hemi: 1.2, sun: '#c6d4ff', sunI: 1.6, fog: '#2a3a78', fogNear: 60, fogFar: 600,
    skyTop: '#0e1a50', skyHor: '#4a5aa8', sunDisc: '#f4f6ff', sunSize: 0.005, rays: 0.4, sat: 1.25, waterDeep: '#10285a', waterShal: '#2a5aa0', glint: '#c8dcff', vig: 0.28, shadowExt: 22 },
  overcast: { az: 140, el: 34, sky: '#c8d2e4', ground: '#b8a890', hemi: 1.35, sun: '#f0f2ff', sunI: 1.9, fog: '#c4cede', fogNear: 60, fogFar: 700,
    skyTop: '#6a80a8', skyHor: '#d6dde8', sat: 1.22, waterDeep: '#2a5a7a', waterShal: '#5a9ab0', glint: '#e8f2ff', vig: 0.2, shadowExt: 26 },
  storm: { az: 160, el: 30, sky: '#8a96b8', ground: '#5a5a6a', hemi: 1.2, sun: '#d8e0ff', sunI: 1.5, fog: '#5a6488', fogNear: 30, fogFar: 380,
    skyTop: '#232a48', skyHor: '#6a7498', sat: 1.18, waterDeep: '#1a2e48', waterShal: '#3a6478', glint: '#dfeaff', vig: 0.3, shadowExt: 22 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });

// rider path along the beach (x) for the hook and the ride forward
const riderX = (f) => f < 207 ? lerp(16, 6, f / 206) : f < 400 ? lerp(6, -2, M.smooth(ramp(f, 330, 400))) : -2;
const CAMS = {
  hook: [
    { f: 0, pos: [19.5, 1.6, 5.2], look: [16, 2.0, 0], fov: 40 },
    { f: 206, pos: [9.5, 1.8, 5.6], look: [6, 2.0, 0], fov: 42 },
  ],
  bay: [
    { f: 207, pos: [12, 5, 9], look: [-6, 2, -16], fov: 50 },
    { f: 322, pos: [10, 8, 11], look: [-8, 1, -26], fov: 52 },
  ],
  forward: [
    { f: 323, pos: [3, 2.4, 13], look: [1, 1.8, 0], fov: 48 },
    { f: 396, pos: [0.5, 2.4, 12], look: [-2, 1.8, 0], fov: 46 },
    { f: 410, pos: [-0.4, 2.7, 4.6], look: [-2, 2.9, 0], fov: 38, ease: 'easeOut' },
    { f: 536, pos: [-0.6, 2.75, 4.2], look: [-2, 2.95, 0], fov: 35 },
  ],
  custom: [
    { f: 537, pos: [DUEL + 0.2, 1.9, 9.4], look: [DUEL + 0.2, 1.4, 0], fov: 46 },
    { f: 710, pos: [DUEL + 0.3, 1.8, 8.4], look: [DUEL + 0.2, 1.4, 0], fov: 44 },
  ],
  nobody: [
    { f: 711, pos: [1.5, 3.2, 3.4], look: [-12, 1.6, -0.5], fov: 40 },
    { f: 760, pos: [1.3, 3.15, 3.1], look: [-12, 1.6, -0.5], fov: 38 },
  ],
  laugh: [
    { f: 761, pos: [-8.4, 1.7, 5.4], look: [-12, 1.5, 0], fov: 40 },
    { f: 845, pos: [-8.6, 1.7, 5.0], look: [-12, 1.5, 0], fov: 38 },
    { f: 856, pos: [3, 1.2, 11], look: [-4, 4.5, -0.5], fov: 56, ease: 'easeOut' },
    { f: 920, pos: [3.4, 1.1, 11.5], look: [-3, 4.0, -0.5], fov: 56 },
  ],
  bomb: [
    { f: 921, pos: [-6.4, 1.9, 6.0], look: [-10.5, 1.8, 0], fov: 42 },
    { f: 975, pos: [-4, 2.4, 7.5], look: [-6, 2.6, 0.8], fov: 46 },
    { f: 1012, pos: [1.6, 0.9, 4.4], look: [0, 0.4, 1.6], fov: 34, ease: 'easeOut' },
    { f: 1066, pos: [1.3, 0.8, 4.0], look: [0, 0.4, 1.6], fov: 30 },
  ],
  boom: [
    { f: 1067, pos: [4.5, 2.2, 9.5], look: [-1, 1.8, 0.4], fov: 46 },
    { f: 1235, pos: [5.2, 2.6, 11], look: [-2, 1.8, 0.4], fov: 50 },
  ],
  inside: [
    { f: 1236, pos: [CUT, 2.8, 9.0], look: [CUT, 1.9, 0], fov: 42 },
    { f: 1300, pos: [CUT + 0.3, 2.6, 7.0], look: [CUT, 1.9, 0], fov: 40 },
    { f: 1380, pos: [CUT + 0.4, 3.0, 5.4], look: [CUT, 2.6, 0], fov: 40 },
    { f: 1400, pos: [CUT, 2.4, 9.4], look: [CUT, 1.7, 0], fov: 46, ease: 'easeOut' },
    { f: 1466, pos: [CUT, 2.4, 8.8], look: [CUT, 1.7, 0], fov: 44 },
  ],
  night: [
    { f: 1467, pos: [5, 2.6, 10], look: [-4, 2.5, -40], fov: 46 },
    { f: 1545, pos: [4.6, 2.6, 9.2], look: [-4, 2.5, -40], fov: 44 },
  ],
  later: [
    { f: 1546, pos: [6, 9, 17], look: [-6, 2, -40], fov: 52 },
    { f: 1660, pos: [5, 7, 14], look: [-6, 2, -40], fov: 50 },
  ],
  typhoon: [
    { f: 1661, pos: [3, 3, 12], look: [-6, 4, -40], fov: 48 },
    { f: 1767, pos: [2.4, 3.2, 10.6], look: [-6, 3, -40], fov: 46, roll: -2 },
  ],
  twist: [
    { f: 1768, pos: [4.2, 2.6, 7.4], look: [2.2, 2.3, 2], fov: 36 },
    { f: 1903, pos: [3.4, 2.5, 5.6], look: [2.2, 2.4, 2], fov: 30, roll: 4 },
  ],
};
const KICKS = [{ f: 168, a: 0.05 }, { f: 1112, a: 0.08 }, { f: 1120, a: 0.04 }, { f: 1702, a: 0.04 }, { f: 1734, a: 0.05 }, { f: 1884, a: 0.06 }];
const FLASH = [[537, 0.6], [1236, 0.7], [1546, 0.85], [1112, 0.5], [1700, 0.7], [1732, 0.6], [1884, 0.95]];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  if (S.id === 'hook') { const x = riderX(f); c.pos = [x + 3.5, 1.7, 5.4]; c.look = [x, 2.1, 0]; }
  if (S.id === 'forward' && f < 400) { const x = riderX(f); c.pos = [x + 2.5, 2.4, 11]; c.look = [x, 1.9, 0]; c.fov = 46; }
  c.flash = 0; for (const [a, k] of FLASH) if (f >= a && f < a + 6) c.flash = Math.max(c.flash, (1 - (f - a) / 6) * k);
  c.shadowAt = S.id === 'custom' ? [DUEL, 0, 0] : S.id === 'inside' ? [CUT, 0, 0] : [-2, 0, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'forward': return f > 405 ? { focus: dist(C.pos, [-2, 2.9, 0]), cinf: 10 } : { focus: 10, cinf: 0 };
    case 'laugh': return f < 850 ? { focus: dist(C.pos, [-12, 1.6, 0]), cinf: 9 } : { focus: 10, cinf: 0 };
    case 'bomb': return f > 1010 ? { focus: dist(C.pos, [0, 0.4, 1.6]), cinf: 12 } : { focus: 10, cinf: 0 };
    case 'inside': return { focus: dist(C.pos, C.look), cinf: 7 };
    case 'twist': return { focus: dist(C.pos, [2.2, 2.4, 2]), cinf: 10 };
  }
  return { focus: 10, cinf: 0 };
};

// ---------- world ----------
export const worldAt = (f) => {
  const S = shotAt(f);
  const W = { fleet1: f < 1546, fleet2: f >= 1546, away: 0, sink: 0, storm: 0, arrows: -1, bomb: null, fire: 0, fireAt: [0, 0, 0], open: 0 };
  if (S.id === 'night') W.away = M.easeIn(ramp(f, 1490, 1545));
  if (S.id === 'typhoon' || S.id === 'twist') { W.storm = S.id === 'twist' ? 1 : M.smooth(ramp(f, 1661, 1690)); W.sink = M.easeIn(ramp(f, 1695, 1767)); }
  if (S.id === 'laugh' && f >= 849) W.arrows = ramp(f, 849, 905) * 1.4;
  if (S.id === 'hook' && f >= 150 && f < 200) { W.fire = Math.sin(clamp((f - 150) / 40) * Math.PI); W.fireAt = [riderX(f) - 4.5, 0.6, -3]; }
  if (S.id === 'bomb' && f >= 965) { const k = ramp(f, 965, 1010); W.bomb = [lerp(-10, 0, k), 0.34 + 6 * 4 * k * (1 - k) * (k < 1 ? 1 : 0), lerp(0, 1.6, k)]; }
  if (S.id === 'boom') {
    if (f < 1112) { const k = ramp(f, 1072, 1094); W.bomb = [lerp(0, 0.3, k), 0.34 + 0.8 * 4 * k * (1 - k), 1.6]; }
    else { const k = ramp(f, 1112, 1150); W.fire = Math.sin(clamp(k) * Math.PI) * 1.1; W.fireAt = [0.3, 0.6, 1.6]; }
  }
  if (S.id === 'inside') W.open = M.back(ramp(f, 1254, 1284));
  return W;
};

// ---------- actors ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const RIDE = (T, o, ho, pos, extra = {}) => ({ key: 'ride' + JSON.stringify(o) + JSON.stringify(ho), draw: (p) => T.rider(p, 'samurai', o, ho), x: pos[0], y: pos[1], z: pos[2], s: 1.65, ...extra });
const HORSE = (T, ho, pos, extra = {}) => ({ key: 'horse' + JSON.stringify(ho), draw: (p) => T.fxHorse(p, ho), x: pos[0], y: pos[1], z: pos[2], s: 1.65, ...extra });
const life = (f, seed, o) => { const i = idle(f, seed); return { seed, blink: blinkAt(f, seed), bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), ...o }; };
const LINE = [[-13.2, -1.6, 'mongol'], [-12.4, 0.2, 'mongol2'], [-11.6, -1.0, 'mongolBoss'], [-12.8, 1.4, 'mongol'], [-11.0, 0.8, 'mongol2'], [-13.8, 0.4, 'mongol2'], [-10.4, -0.6, 'mongol'], [-14.4, -0.8, 'mongol']];
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const tint = S.light === 'night' ? '#cfd8ff' : S.light === 'storm' ? '#d8def0' : S.light === 'golden' ? '#ffe6cc' : '#ffffff';
  const put = (a) => { a.tint = a.tint || tint; out.push(a); };
  const mongols = (exprFn, armsFn) => LINE.forEach(([x, z, who], i) => put(R(T, who, life(f, 20 + i, { expr: exprFn(i), ...armsFn(i), facing: 1 }), [x, 0, z])));
  const gal = q((f * 0.09) % 1, 2);
  switch (S.id) {
    case 'hook': put(RIDE(T, life(f, 3, { expr: f > 160 ? 'shock' : 'stern', L: 'up', R: 'hang' }), { gallop: gal }, [riderX(f), 0, 0], { flip: true })); break;
    case 'bay': put(RIDE(T, life(f, 3, { expr: 'stern' }), { gallop: 0 }, [6, 0, 0], { flip: true })); mongols(() => 'stern', () => ({})); break;
    case 'forward': {
      const moving = f < 400, shout = f >= 402;
      put(RIDE(T, life(f, 3, { expr: shout ? (Math.sin(f * 0.6) > -0.3 ? 'shock' : 'stern') : 'stern', L: shout ? 'up' : 'hang', R: shout && f > 470 ? 'up' : 'hang', bob: shout ? q(0.015 * Math.abs(Math.sin(f * 0.5)), 3) : 0 }), { gallop: moving ? gal : 0 }, [riderX(f), 0, 0], { flip: true }));
      mongols(() => 'neutral', () => ({}));
      break;
    }
    case 'custom': {
      const step = f >= 612 ? M.smooth(ramp(f, 612, 660)) : 0, w = walk(f, 612, 1.0);
      put(R(T, 'samurai', life(f, 3, { expr: 'stern', L: f > 650 ? 'point' : 'hip', facing: 1 }), [DUEL - 0.9, 0, 0]));
      put(R(T, 'samurai2', life(f, 9, { expr: 'stern', L: 'hip', facing: -1, step: step < 1 ? q(w.phase, 2) : 0 }), [DUEL + 2.8 - step * 1.6, 0, -0.3], { flip: true }));
      break;
    }
    case 'nobody': put(RIDE(T, life(f, 3, { expr: f > 735 ? 'squint' : 'stern' }), { gallop: 0 }, [-2, 0, 0], { flip: true })); mongols(() => 'neutral', () => ({})); break;
    case 'laugh': {
      put(RIDE(T, life(f, 3, { expr: f > 849 ? 'shock' : 'squint', L: f > 870 ? 'up' : 'hang' }), { gallop: 0, rear: f > 870 ? 0.2 : 0 }, [-2, 0, 0], { flip: true }));
      mongols((i) => f < 849 ? (i % 2 ? 'laugh' : 'grin') : 'stern', (i) => f < 849 ? { L: 'belly', R: i % 3 ? 'belly' : 'point', tilt: q(-4 + 5 * Math.sin(f * 0.5 + i), 1), bob: q(Math.abs(Math.sin((f + i * 5) * 0.55)) * 0.025, 3) } : { L: 'up', R: 'point' });
      break;
    }
    case 'bomb': {
      put(RIDE(T, life(f, 3, { expr: f > 1015 ? 'shock' : 'squint' }), { gallop: 0 }, [-2, 0, 0], { flip: true }));
      mongols((i) => i === 6 ? 'grin' : 'smile', (i) => i === 6 ? { R: f < 965 ? 'up' : 'point', L: 'hang' } : {});
      break;
    }
    case 'boom': {
      if (f < 1114) put(RIDE(T, life(f, 3, { expr: 'shock', L: 'up', R: 'up' }), { gallop: 0 }, [-2, 0, 0], { flip: true }));
      else {
        const k = ramp(f, 1114, 1140), fly = ramp(f, 1116, 1160);
        put(HORSE(T, { rear: q(Math.sin(k * Math.PI) * 1.0 + (f > 1140 ? 0.2 : 0), 2), gallop: f > 1150 ? gal : 0 }, [-2 - (f > 1150 ? (f - 1150) * 0.12 : 0), 0, 0], { flip: true }));
        put(R(T, 'samurai', life(f, 3, { expr: 'shock', L: 'up', R: 'up' }), [-1.2 + fly * 3.4, 3.2 * 4 * fly * (1 - fly) + (1 - fly) * 1.8, 0.4], { roll: q(-fly * 2.4, 2), blob: false }));
      }
      mongols(() => 'shock', () => ({ L: 'cheek', R: 'cheek' }));
      break;
    }
    case 'inside': if (f >= 1391) [[-1.5, 2.6, 'samurai'], [1.5, 2.8, 'samurai2'], [0, 1.6, 'samurai']].forEach(([x, z, who], i) => put(R(T, who, life(f, 40 + i, { expr: 'shock', L: 'cheek', R: 'cheek', look: -x * 0.2 }), [CUT + x, 0, z]))); break;
    case 'night': case 'later': case 'typhoon':
      [[1.5, 3.0], [4.2, 2.4], [6.8, 3.4]].forEach(([x, z], i) => put(R(T, i % 2 ? 'samurai2' : 'samurai', life(f, 50 + i, { expr: S.id === 'typhoon' ? 'shock' : S.id === 'later' ? 'stern' : 'neutral', L: S.id === 'typhoon' ? 'up' : 'hang' }), [x, 0, z])));
      break;
    case 'twist': put(R(T, 'samurai', life(f, 3, { expr: f > 1884 ? 'grin' : 'stern', look: -0.4, headTilt: f > 1850 ? -6 : 0 }), [2.2, 0, 2])); break;
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, fx: true, ...extra });
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'forward' && f >= 402) { const t = q(((f - 402) / 24) % 1, 2); out.push(FX('shout' + t, (p) => T.fxShout(p, t), [-2.6, 3.1, 0.3], 1.2)); }
  if (S.id === 'bomb' && f >= 1010) { const t = q((f * 0.07) % 1, 2); out.push(FX('spark' + t, (p) => T.fxSpark(p, t), [0, 0.86, 1.62], 0.14)); for (let i = 0; i < 3; i++) { const k = q(((f - 1010) * 0.03 + i / 3) % 1, 2); out.push(FX('smk' + k, (p) => T.fxDust(p, k, '#d8d8de'), [0.05, 0.9 + k * 1.2, 1.55], 0.3 + k * 0.6)); } }
  if (S.id === 'boom' && f < 1112 && f > 1067) { const t = q((f * 0.07) % 1, 2); out.push(FX('spark' + t, (p) => T.fxSpark(p, t), [0.3, 1.0, 1.62], 0.14)); }
  if (S.id === 'boom' && f >= 1112 && f < 1170) { const k = q(ramp(f, 1112, 1170), 2); out.push(FX('burst' + k, (p) => T.fxBurst(p, k, '#ffb02a', 14), [0.3, 1.2, 2.1], 4.5)); }
  if (S.id === 'hook' && f >= 150 && f < 200) { const k = q(ramp(f, 150, 200), 2); out.push(FX('burstH' + k, (p) => T.fxBurst(p, k, '#fff3b0', 12), [riderX(f) - 4.5, 1.2, -2.6], 5)); }
  if (S.id === 'inside' && f >= 1300 && f < 1400) { const t = q((f * 0.07) % 1, 2); out.push(FX('spark' + t, (p) => T.fxSpark(p, t), [CUT, 4.15, 0.05], 0.4)); }
  if (S.id === 'typhoon' || S.id === 'twist') for (let i = 0; i < 6; i++) { const t = q(((f * 0.04) + i / 6) % 1, 2), cp = camAt(f).pos; out.push(FX('rain' + t, (p) => T.fxRain(p, t), [cp[0] - 4 + i * 1.6, cp[1] - 1, cp[2] - 4 - (i % 3)], 3, { order: 7 })); }
  for (const fb of [1700, 1732, 1884]) if (f >= fb && f < fb + 8) out.push(FX('bolt' + fb, (p) => T.fxBolt(p, fb), fb === 1884 ? [-4, 4, -30] : [-14 + (fb % 7), 6, -60], fb === 1884 ? 22 : 34, { order: 0 }));
  return out;
};
