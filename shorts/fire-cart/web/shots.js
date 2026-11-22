// "The fire cart" (hwacha, Haengju 1593). 30 fps, times from work/phrases.json. Cut every 1-2 s, camera always moving.
import * as T from './toon.js';

const FPS = 30;
export const TOTAL = Math.ceil(63.56 * FPS);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); };
const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const rg = (t, a, b) => cl((t - a) / (b - a));
const hash = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const blink = (t, seed = 1) => { const per = 2.4 + (seed % 5) * 0.4, ph = (t + seed * 0.7) % per; return ph < 0.07 ? 0.5 : ph < 0.14 ? 1 : 0; };
const AK = (t, keys) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, a] = keys[i - 1], [t1, b] = keys[i], k = ez((t - t0) / (t1 - t0)); return { ...b, a: lerp(a.a, b.a, k), e: lerp(a.e, b.e, k) }; } return keys[keys.length - 1][1]; };
const wig = (t, f = 6, amp = 8) => Math.sin(t * f) * amp;
const talkE = (t, expr) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(expr, 'o') : expr);
const hgt = (x, z) => (window.HGT ? window.HGT(x, z) : 0);

const C = (who, o = {}, props = [], t = 0) => (p) => { const out = {}; const oo = { ...o }; if (o.talk) oo.expr = talkE(t, o.expr || 'smile'); T.romanFront(p, who, { ...oo, out });
  for (const pr of props) { const h = out.hands[pr.hand ?? 1]; if (pr.kind === 'drill') T.propDrill(p, h[0], h[1], 2.4, t * 30); if (pr.kind === 'sword') T.propSword(p, h[0], h[1], 2.4, pr.ang ?? -80); if (pr.kind === 'torch') T.propTorch(p, h[0], h[1], 2.4, t); if (pr.kind === 'arrow') T.propArrow(p, h[0], h[1], 2.4, pr.ang ?? -30); } };
const act = (who, x, y, z, o = {}, props = [], extra = {}, t = 0) => ({ x, y, z, draw: C(who, o, props, t), ...extra });
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const burst = (t, col = '#fff3b0') => (p) => T.fxBurst(p, (t * 1.4) % 1, col, 12, 60, 250);
const word = (txt) => (t) => (p) => { const g = p.g; g.save(); g.font = '900 110px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#241726'; g.fillStyle = '#ffffff';
  [0, 1, 2].forEach((i) => { const k = (t * 1.3 + i / 3) % 1; g.globalAlpha = Math.min(1, (1 - k) * 2); const x = 160 + i * 140 + Math.sin(k * 7 + i) * 30, y = 700 - k * 450; g.strokeText(txt, x, y); g.fillText(txt, x, y); }); g.restore(); };
const hahas = word('HA');
const sign = (t, ch = '?', col = '#ffd84a') => (p) => { const g = p.g; g.save(); g.font = '900 260px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 26; g.strokeStyle = '#241726'; const y = 620 - Math.abs(Math.sin(t * 9)) * 30; g.strokeText(ch, 300, y); g.fillStyle = col; g.fillText(ch, 300, y); g.restore(); };
const walkO = (t, sp = 1.8, stride = 0) => ({ step: (t * sp) % 1, stride, bob: Math.abs(Math.sin(t * sp * Math.PI * 2)) * 0.025 });
// army block: rows x cols around (cx, z), moving dz per second
const army = (cx, z, rows, cols, sx, sz, mode, opts = {}) => { const out = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const i = r * cols + c;
  const x = cx + (c - (cols - 1) / 2) * sx + (hash(i, 1) - 0.5) * sx * 0.5, zz = z - r * sz + (hash(i, 2) - 0.5) * sz * 0.4; out.push({ x, z: zz, v: i % 2, mode, ph: hash(i, 3), rate: opts.rate ?? 1.8, s: opts.s ?? 1, flip: opts.flip ?? hash(i, 4) < 0.5, y: opts.y }); } return out; };
const DEF = (n, x0, dx, opts = {}) => { const out = []; for (let i = 0; i < n; i++) out.push(act(i % 2 ? 'kdef2' : 'kdef1', x0 + i * dx, 3, -12.7 - (i % 2) * 0.3, { expr: opts.expr || 'nervous', L: 'hang', R: i % 2 ? 'hang' : 'spear' in {} ? 'hang' : 'hang', facing: (i % 3 - 1) * 0.3, sweat: opts.sweat ?? 1, blink: blink(opts.t || 0, i) }, [], { s: 0.98 })); return out; };

const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });
// 1  "In fifteen ninety-three,"  the fort on its green hill, banners in the wind, crane up
shot(0.0, (t, d) => { const k = ez(t / d); return { preset: 'day', cam: L3([26, -6, -48], [22, 2, -44], k), look: [0, 4, -14], fov: 46, focus: 30, cinf: 0, tag: '1593', shadowExt: 50, motes: false }; });
// 2  "a Korean craftsman spends all night"  night workshop, lantern light, he drills
shot(1.6, (t, d) => ({ preset: 'night', cam: L3([16.9, 1.75, 14.0], [16.5, 1.7, 13.2], ez(t / d)), look: [15.6, 1.45, 10.0], fov: 46, focus: 3.6, cinf: 4, holes: 3 + Math.floor(t * 1.5), chips: [16.05, 1.45, 10.35],
  actors: [act('craftsman', 15.2, 0, 9.75, { expr: 'stubborn', L: 'hang', R: { a: 55 + wig(t, 18, 6), e: 70 }, facing: 0.4, blink: blink(t, 1), tilt: wig(t, 18, 2) }, [{ hand: 1, kind: 'drill' }], {}, t)] }));
// 3  "...drilling holes into a block of wood."  macro on the block, holes appear, chips fly
shot(3.7, (t, d) => ({ preset: 'night', cam: L3([16.3, 1.52, 10.95], [16.18, 1.5, 10.8], ez(t / d)), look: [16.0, 1.44, 10.33], fov: 40, focus: 0.6, cinf: 6, holes: 6 + Math.floor(t * 3), chips: [15.95, 1.5, 10.35], near: 0.02,
  actors: [act('craftsman', 16.05, 0, 9.3, { expr: 'stubborn', L: 'hang', R: { a: 40 + wig(t, 18, 6), e: 95 }, facing: 0 }, [{ hand: 1, kind: 'drill' }], {}, t)] }));
// 4  "His friends think he's lost it."  two soldiers lean in the doorway, laughing
shot(6.0, (t, d) => ({ preset: 'night', cam: L3([13.0, 1.6, 13.0], [13.3, 1.6, 12.4], ez(t / d)), look: [13.9, 1.5, 9.2], fov: 46, focus: 3.4, cinf: 4, holes: 14,
  actors: [act('kdef1', 13.2, 0, 9.4, { expr: 'laugh', L: 'temple', R: 'belly', facing: 0.4, swirl: t * 8, bob: Math.abs(Math.sin(t * 12)) * 0.02 }), act('kdef2', 14.4, 0, 8.8, { expr: 'laugh', L: 'belly', R: 'point', facing: 0.2 }), fx(hahas(t), 13.8, 2.3, 9.0, 0.6)] }));
// 5  "Holes?"  close: confused face
shot(7.7, (t, d) => ({ preset: 'night', cam: [13.55, 1.78, 11.1], look: [13.2, 1.72, 9.4], fov: 42, focus: 1.8, cinf: 6, orbit: 0.08 - t * 0.1,
  actors: [act('kdef1', 13.2, 0, 9.4, { expr: 'squint', L: 'shrug', R: 'shrug', facing: 0.2, headTilt: 10 }), fx(sign(t, '?'), 13.55, 2.25, 9.4, 0.35)] }));
// 6  "We need swords!"  the other one thrusts a sword up, shouting
shot(8.5, (t, d) => ({ preset: 'night', cam: L3([14.9, 1.65, 11.0], [14.75, 1.7, 10.4], eo(t / 0.4)), look: [14.4, 1.75, 8.8], fov: 44, focus: 2.0, cinf: 6,
  actors: [act('kdef2', 14.4, 0, 8.8, { expr: 'shock', talk: true, L: 'hip', R: AK(t, [[0, { a: 40, e: 30 }], [0.3, { a: 170, e: 0 }]]), facing: -0.2 }, [{ hand: 1, kind: 'sword', ang: -88 }], {}, t), fx(sign(t, '!', '#ff5a3a'), 14.0, 2.3, 8.7, 0.35)] }));
// 7  "Thirty thousand soldiers are marching"  the valley: columns of spears march at us
shot(10.1, (t, d) => { const z = -86 + t * 2.2; return { preset: 'day', cam: [6, hgt(6, -76) + 1.5, -76], look: [4, hgt(4, -84) + 1.8, -84], fov: 50, focus: 12, cinf: 1.5, tag: '30,000', shake: 0.012, shadowExt: 30,
  army: army(4, z, 14, 18, 1.2, 1.6, 'march', { rate: 1.8 }), dust: [{ p: [4, hgt(4, z) + 0, z - 6], w: 18, h: 2, s: 2.2, k: 0.35 }], dustN: 24 }; });
// 8  "on their tiny hilltop fort,"  from the valley floor, the little fort on top of the hill
shot(11.9, (t, d) => { const k = ez(t / d); return { preset: 'day', cam: L3([30, hgt(30, -95) + 6, -100], [26, hgt(26, -95) + 9, -96], k), look: [0, 2, -16], fov: 46, focus: 60, cinf: 0, shadowExt: 60,
  army: army(10, -78 + t * 2, 10, 16, 1.3, 1.6, 'march') }; });
// 9  "and there are barely three thousand defenders."  the wall: a thin line of nervous defenders
shot(13.8, (t, d) => ({ preset: 'day', cam: L3([-3.5, 4.75, -10.6], [-4.8, 4.7, -10.8], ez(t / d)), look: [-11, 4.3, -13.2], fov: 46, focus: 3.6, cinf: 3, tag: '3,000',
  actors: [act('kdef1', -6.2, 3, -12.8, { expr: 'nervous', L: 'hang', R: 'hang', facing: 0.5, sweat: 2, blink: blink(t, 1) }), act('kdef2', -8.6, 3, -12.9, { expr: 'pained', L: 'cross', R: 'cross', facing: 0.3, blink: blink(t, 2) }), act('kdef1', -11.2, 3, -12.8, { expr: 'shock', L: 'cheek', R: 'cheek', facing: 0.4 }), act('kdef2', -14.0, 3, -12.9, { expr: 'nervous', L: 'hang', R: 'hang', facing: 0.4, sweat: 1 })] }));
// 10 "But he keeps drilling."  back in the workshop, close, sweating, determined
shot(16.4, (t, d) => ({ preset: 'night', cam: L3([15.7, 1.8, 11.5], [15.6, 1.8, 11.2], ez(t / d)), look: [15.35, 1.62, 9.75], fov: 42, focus: 2.2, cinf: 6, holes: 60 + Math.floor(t * 12), chips: [16.05, 1.45, 10.35],
  actors: [act('craftsman', 15.2, 0, 9.75, { expr: 'stubborn', L: 'hang', R: { a: 55 + wig(t, 18, 6), e: 70 }, facing: 0.4, sweat: 2, tilt: wig(t, 18, 2) }, [{ hand: 1, kind: 'drill' }], {}, t)] }));
// 11 "One hundred holes,"  macro on the finished face, pull back
shot(18.0, (t, d) => ({ preset: 'night', cam: L3([16.0, 1.46, 10.75], [16.0, 1.5, 11.6], ez(t / d)), look: [16.0, 1.44, 10.33], fov: 42, focus: 0.8, cinf: 5, holes: 100, tag: '100', near: 0.02,
  actors: [fx(burst(t), 16.0, 1.0, 10.4, 0.5)] }));
// 12 "on top of a little cart."  the cart: launcher on wheels; he pats it proudly
shot(19.5, (t, d) => ({ preset: 'night', cam: L3([13.2, 1.7, 16.0], [13.6, 1.6, 15.4], ez(t / d)), look: [15.2, 1.1, 12.7], fov: 46, focus: 3.4, cinf: 4, holes: 100, block: false, loaded: 0, orbit: 0.1 - t * 0.06,
  actors: [act('craftsman', 16.3, 0, 12.2, { expr: 'grin', L: 'hip', R: AK(t, [[0, { a: 60, e: 40 }], [0.5, { a: 95, e: 40 }], [0.8, { a: 80, e: 40 }], [1.1, { a: 95, e: 40 }]]), facing: -0.4, blink: blink(t, 2) })] }));
// 13 "Into each hole, he slides an arrow,"  macro, front of the launcher: arrows slide in one by one
shot(21.1, (t, d) => { const n = 30 + Math.floor(t * 18), k = (t * 18) % 1; return { preset: 'night', cam: L3([15.45, 1.62, 14.0], [15.4, 1.58, 13.7], ez(t / d)), look: [15.2, 1.48, 12.95], fov: 42, focus: 1.0, cinf: 5, block: false, loaded: n, slide: { i: n, k: ez(k) }, near: 0.02 }; });
// 14 "with a tiny tube of gunpowder tied to its side."  close on the red powder tubes, a glint
shot(23.2, (t, d) => ({ preset: 'night', cam: L3([16.0, 1.75, 13.6], [15.8, 1.7, 13.3], ez(t / d)), look: [15.2, 1.55, 12.8], fov: 38, focus: 0.9, cinf: 6, block: false, loaded: 70 + Math.floor(t * 10), near: 0.02,
  actors: [act('craftsman', 16.6, 0, 12.1, { expr: 'smile', L: 'hang', R: { a: 75, e: 50 }, facing: -0.5 }, [{ hand: 1, kind: 'arrow', ang: -10 }]), fx(burst(t, '#fff6c8'), 15.4, 1.3, 13.0, 0.35)] }));
// 15 "Then he twists every fuse together,"  behind the cart: dozens of cords gathered into his hands
shot(26.2, (t, d) => ({ preset: 'night', cam: L3([16.6, 2.2, 10.4], [16.3, 2.1, 10.8], ez(t / d)), look: [15.2, 1.55, 12.3], fov: 46, focus: 1.8, cinf: 4, block: false, loaded: 100,
  actors: [act('craftsman', 14.3, 0, 11.4, { expr: 'stubborn', L: { a: 70 + wig(t, 9, 10), e: 70, front: true }, R: { a: 70 - wig(t, 9, 10), e: 70, front: true }, facing: 0.5, tilt: wig(t, 9, 3) })] }));
// 16 "into one single string."  macro along the single fuse cord
shot(28.5, (t, d) => ({ preset: 'night', cam: L3([13.8, 0.95, 10.3], [14.5, 1.2, 10.4], ez(t / d)), look: L3([14.4, 0.35, 11.3], [15.1, 0.85, 11.25], ez(t / d)), fov: 38, focus: 0.9, cinf: 5, block: false, loaded: 100, near: 0.02 }));
// 17 "The next morning,"  dawn over the hills; the fort catches the first light
shot(30.5, (t, d) => ({ preset: 'dawn', cam: L3([-34, 9, -60], [-30, 10, -56], ez(t / d)), look: [0, 3, -14], fov: 48, focus: 40, cinf: 0, rays: 1.0, shadowExt: 60, motes: true }));
// 18 "the enemy climbs the hill."  from the wall, looking down: the army swarms up the slope
shot(31.5, (t, d) => { const z = -44 + t * 2.4; return { preset: 'day', cam: L3([5.5, 5.6, -15.0], [5.0, 5.4, -15.4], ez(t / d)), look: [3, hgt(3, z) + 1, z], fov: 50, focus: 20, cinf: 0.8, shadowExt: 40,
  army: army(3, z, 16, 22, 1.15, 1.4, 'march', { rate: 1.6 }), dust: [{ p: [3, hgt(3, z - 6), z - 6], w: 20, h: 1.6, s: 2.4, k: 0.25 }], dustN: 20 }; });
// 19 "Closer."  push in: the front rank, spears up, angry
shot(33.3, (t, d) => { const z = -30 + t * 2; return { preset: 'day', cam: L3([6.5, hgt(6.5, z + 4) + 1.6, z + 4.2], [6.3, hgt(6.3, z + 3.6) + 1.6, z + 3.6], eo(t / 0.4)), look: [5.5, hgt(5.5, z) + 1.6, z], fov: 46, focus: 3.8, cinf: 3,
  army: army(5.5, z, 10, 9, 1.0, 1.2, 'march', { rate: 1.6 }) }; });
// 20 "And closer."  the defenders peer over the parapet, sweating
shot(34.3, (t, d) => ({ preset: 'day', cam: L3([-2.2, 4.75, -10.6], [-2.25, 4.7, -11.1], eo(t / 0.4)), look: [-2.3, 4.25, -16.5], fov: 48, focus: 2.6, cinf: 3,
  actors: [act('kdef1', -1.75, 3, -14.4, { expr: 'shock', L: 'cheek', R: 'cheek', facing: -0.2, sweat: 3 }, [], { blob: false }), act('kdef2', -2.75, 3, -14.9, { expr: 'nervous', L: 'hang', R: 'hang', facing: 0.2, sweat: 3, blink: blink(t, 4) }, [], { blob: false })] }));
// 21 "Shoulder to shoulder."  low, right in the packed front line: shields and spears
shot(35.5, (t, d) => { const z = -24 + t * 0.6; return { preset: 'day', cam: L3([1.5, hgt(1.5, z + 3) + 1.5, z + 3.0], [2.3, hgt(2.3, z + 3) + 1.5, z + 3.0], ez(t / d)), look: [2.0, hgt(2, z) + 1.5, z], fov: 48, focus: 3.0, cinf: 3,
  army: army(2, z, 6, 9, 0.75, 0.9, 'stand') }; });
// 22 "He lights one fuse."  on the wall: torch to the fuse of the big cart
shot(37.3, (t, d) => ({ preset: 'day', cam: L3([11.9, 4.7, -9.3], [11.4, 4.6, -9.8], ez(t / d)), look: [9.2, 4.0, -12.0], fov: 46, focus: 2.6, cinf: 4, spark: t > 1.1 ? { h: 8, k: 0.02 } : null,
  actors: [act('craftsman', 9.7, 3, -11.5, { expr: t > 1.1 ? 'grin' : 'stubborn', L: 'hang', R: AK(t, [[0, { a: 100, e: 30 }], [1.0, { a: 60, e: 60 }]]), facing: -0.4, blink: blink(t, 2) }, [{ hand: 1, kind: 'torch' }], {}, t)] }));
// 23 "The spark races down the string,"  macro tracking the spark along the cord
shot(39.0, (t, d) => { const k = ez(t / d), sp = L3([8.8, 3.2, -12.1], [7.9, 3.94, -12.05], k); return { preset: 'day', cam: [sp[0] + 0.55, sp[1] + 0.3, sp[2] + 0.6], look: sp, fov: 40, focus: 0.9, cinf: 5, near: 0.02, spark: { h: 8, k } }; });
// 24 "splits into a hundred sparks,"  behind the launcher: the spark fans out to every arrow
shot(41.0, (t, d) => ({ preset: 'day', cam: L3([7.9, 5.1, -11.0], [7.9, 5.0, -11.4], ez(t / d)), look: [7.9, 4.5, -12.6], fov: 44, focus: 1.6, cinf: 4, split: { h: 8, k: ez(t / 1.3) }, spark: t < 0.3 ? { h: 8, k: 1 } : null }));
// 25 "and every arrow takes off at once."  in front of the wall: the whole cart fires
shot(42.7, (t, d) => ({ preset: 'day', cam: L3([10.4, 4.4, -19.5], [10.6, 4.3, -20.4], eo(t / d)), look: [7.9, 4.8, -14.6], fov: 50, focus: 5, cinf: 2, fired: { 8: 42.95 }, heroAll: true, flash: t > 0.25 && t < 0.4 ? 0.25 : 0, shake: t > 0.25 ? 0.06 * (1 - rg(t, 0.25, 2.4)) : 0 }));
// 26 "You see,"  wide side view: a hundred smoke trails arc over the slope
shot(45.2, (t, d) => ({ preset: 'day', cam: [62, 14, -44], look: [6, 14, -60], fov: 56, focus: 40, cinf: 0, fired: { 8: 43.0, 9: 43.6, 7: 44.1 }, flight: 3.4, army: army(3, -46, 10, 18, 1.2, 1.4, 'march') }));
// 27 "each arrow is a tiny rocket."  we fly with one arrow: flame jet and smoke
shot(45.8, (t, d) => ({ preset: 'day', cam: [0, 0, 0], look: [0, 0, 0], fov: 46, focus: 1.2, cinf: 3, fired: { 9: 45.85 }, track: { h: 9, i: 22, off: [0.9, 0.35, 0.8] }, flameS: 0.45, flight: 3.4, handheld: 0.004, near: 0.02, motes: false }));
// 28 "One man,"  the craftsman, finger up
shot(48.0, (t, d) => ({ preset: 'day', cam: L3([10.6, 4.95, -9.8], [10.2, 4.9, -10.3], ez(t / d)), look: [9.6, 4.7, -11.6], fov: 42, focus: 1.9, cinf: 5, fired: { 8: 42.95 },
  actors: [act('craftsman', 9.6, 3, -11.6, { expr: 'smile', L: 'hip', R: { a: 165, e: 0, finger: true }, facing: -0.2, blink: blink(t, 5) })] }));
// 29 "one spark,"  macro spark on a fresh fuse
shot(48.8, (t, d) => ({ preset: 'day', cam: [13.75, 3.95, -11.35], look: [13.4, 3.55, -12.1], fov: 38, focus: 0.7, cinf: 5, near: 0.02, spark: { h: 9, k: 0.25 + 0.5 * ez(t / d) } }));
// 30 "one hundred shots."  low in front of a cart: the volley streams past us
shot(49.8, (t, d) => ({ preset: 'day', cam: [18.6, 4.0, -18.0], look: [18.1, 5.2, -13.6], fov: 52, focus: 4, cinf: 2, fired: { 10: 49.85 }, heroAll: true, shake: 0.05 * (1 - rg(t, 0, d)) }));
// 31 "The Koreans called it the hwacha."  the reloaded cart on the wall; the general nods
shot(51.6, (t, d) => ({ preset: 'day', cam: L3([5.6, 4.7, -9.8], [6.0, 4.6, -10.2], ez(t / d)), look: [7.9, 3.9, -13.4], fov: 46, focus: 3.4, cinf: 3, tag: 'HWACHA',
  actors: [act('general', 7.0, 3, -11.7, { expr: 'smile', L: 'hip', R: { a: 110 + wig(t, 4, 6), e: 40 }, facing: 0.4, headTilt: wig(t, 3, 4), blink: blink(t, 3) })] }));
// 32 "The fire cart."  close: a cart erupts in flame and smoke
shot(53.8, (t, d) => ({ preset: 'day', cam: L3([27.0, 4.9, -18.6], [26.6, 4.8, -19.2], ez(t / d)), look: [23.2, 4.6, -13.8], fov: 46, focus: 5, cinf: 2, fired: { 11: 53.9 }, heroAll: true, shake: 0.04 }));
// 33 "And this fort had forty of them."  along the wall: every cart fires in a ripple
shot(55.0, (t, d) => { const fired = {}; for (let i = 1; i <= 14; i++) fired[i] = 55.05 + (i - 1) * 0.12; return { preset: 'day', cam: L3([-56, 12, -30], [-52, 13, -32], ez(t / d)), look: [0, 3, -20], fov: 50, focus: 50, cinf: 0, tag: '40', fired, shadowExt: 60, army: army(0, -40, 10, 30, 1.4, 1.5, 'march') }; });
// 34 "And here's the crazy part."  the general, close, grinning
shot(57.3, (t, d) => ({ preset: 'day', cam: L3([6.9, 4.85, -10.4], [6.6, 4.85, -10.8], ez(t / d)), look: [6.0, 4.75, -12.2], fov: 42, focus: 1.9, cinf: 5,
  actors: [act('general', 6.0, 3, -12.2, { expr: 'grin', L: 'hip', R: 'thumb', facing: 0.2, blink: blink(t, 2) })] }));
// 35 "The army of thirty thousand turned around,"  the army breaks and runs down the hill, smoke everywhere
shot(58.8, (t, d) => { const z = -34 - t * 4; return { preset: 'day', cam: L3([6.0, 5.4, -15.2], [5.6, 6.2, -15.0], ez(t / d)), look: [3, hgt(3, z) + 1, z], fov: 50, focus: 18, cinf: 0.8, shadowExt: 40,
  army: army(3, z, 14, 20, 1.2, 1.5, 'run', { rate: 2.6 }), dust: [{ p: [0, hgt(0, z), z], w: 26, h: 2, s: 2.6, k: 0.4 }], dustN: 30, fired: { 12: 58.9, 13: 59.4 } }; });
// 36 "and the little fort was never taken."  the defenders cheer on the wall, banners fly, crane up and away
shot(61.4, (t, d) => { const k = ez(t / d); return { preset: 'dawn', cam: L3([0, 5.6, -22], [6, 11, -34], k), look: [0, 4.6, -14], fov: 48, focus: 10, cinf: 1, rays: 0.8, shadowExt: 40,
  actors: [-6, -3.5, -1, 1.6, 4].map((x, i) => act(['kdef1', 'kdef2', 'craftsman', 'general', 'kdef1'][i], x, 3, -14.9, { expr: 'laugh', L: 'up', R: i % 2 ? 'wave' : 'up', wv: t * 10 + i, facing: (i - 2) * 0.2, bob: Math.abs(Math.sin(t * 10 + i)) * 0.04 }, [], { blob: false })) }; });

export const CUTS = SH.map((s) => s.t0);
export const stateAt = (f) => {
  const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--;
  const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0;
  const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i; return S;
};
