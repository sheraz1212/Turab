// "Why the rails have gaps" (thermal expansion / sun kink). 30 fps, times from work/phrases.json. Cuts every ~1-2 s.
import * as T from './toon.js';
const FPS = 30;
export const TOTAL = Math.ceil(65.3 * FPS);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); };
const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const rg = (t, a, b) => cl((t - a) / (b - a));
const blink = (t, seed = 1) => { const per = 2.4 + (seed % 5) * 0.4, ph = (t + seed * 0.7) % per; return ph < 0.07 ? 0.5 : ph < 0.14 ? 1 : 0; };
const AK = (t, keys) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, a] = keys[i - 1], [t1, b] = keys[i], k = ez((t - t0) / (t1 - t0)); return { ...b, a: lerp(a.a, b.a, k), e: lerp(a.e, b.e, k) }; } return keys[keys.length - 1][1]; };
const wig = (t, f = 6, amp = 8) => Math.sin(t * f) * amp;
const talkE = (t, expr) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(expr, 'o') : expr);
const AX = -12, J = 6.12, BAL = 0.27, PL = 0.95;
const PURPLE = { ...T.OUTFITS.tycoon, skin: '#c08ae0' };
const C = (who, o = {}, props = [], t = 0) => (p) => { const out = {}; const oo = { ...o }; if (o.talk) oo.expr = talkE(t, o.expr || 'smile'); T.romanFront(p, who, { ...oo, out });
  for (const pr of props) { const h = out.hands[pr.hand ?? 1]; if (pr.kind === 'saw') T.propSaw(p, h[0], h[1], 2.4, t * 22); if (pr.kind === 'news') T.propNews(p, (out.hands[0][0] + h[0]) / 2, (out.hands[0][1] + h[1]) / 2 + 40, 2.2); } };
const act = (who, x, y, z, o = {}, props = [], extra = {}, t = 0) => ({ x, y, z, draw: C(who, o, props, t), ...extra });
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const burst = (t, col = '#fff3b0') => (p) => T.fxBurst(p, (t * 1.4) % 1, col, 12, 60, 250);
const word = (txt, col = '#ffffff', n = 3) => (t) => (p) => { const g = p.g; g.save(); g.font = '900 100px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#241726'; g.fillStyle = col;
  for (let i = 0; i < n; i++) { const k = (t * 1.6 + i / n) % 1; g.globalAlpha = Math.min(1, (1 - k) * 2); const x = 170 + i * 130 + Math.sin(k * 7 + i) * 30, y = 700 - k * 450; g.strokeText(txt, x, y); g.fillText(txt, x, y); } g.restore(); };
const sign = (t, ch = '?', col = '#ffd84a') => (p) => { const g = p.g; g.save(); g.font = '900 260px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 26; g.strokeStyle = '#241726'; const y = 620 - Math.abs(Math.sin(t * 9)) * 30; g.strokeText(ch, 300, y); g.fillStyle = col; g.fillText(ch, 300, y); g.restore(); };
const hearts = (t) => (p) => { for (let i = 0; i < 5; i++) { const k = (t * 0.9 + i / 5) % 1, x = 180 + i * 60 + Math.sin(k * 8 + i) * 30, y = 760 - k * 520, s = 22 + k * 10; p.g.save(); p.g.globalAlpha = 1 - k; p.poly([[x, y + s], [x - s * 1.4, y - s * 0.3], [x - s * 0.7, y - s * 1.2], [x, y - s * 0.5], [x + s * 0.7, y - s * 1.2], [x + s * 1.4, y - s * 0.3]], '#ff4a6a', 4); p.g.restore(); } };
const steamHead = (t) => (p) => { for (let i = 0; i < 2; i++) { const k = (t * 2 + i * 0.5) % 1; p.g.save(); p.g.globalAlpha = 1 - k; for (const s of [-1, 1]) p.ell(300 + s * (120 + k * 60), 260 - k * 160, 30 + k * 30, 22 + k * 20, '#f4f4f4', 5); p.g.restore(); } };
const tears = (t) => (p) => { for (let i = 0; i < 6; i++) { const a = ((t * 2 + i / 6) % 1); for (const s of [-1, 1]) p.ell(300 + s * (90 + a * 120), 260 + a * a * 300, 14, 20, '#9fd4ff', 4); } };
const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });

// 1 "Every thirty-nine feet,"  low along the gapped track, a joint every 39 ft
shot(0.0, (t, d) => ({ preset: 'day', cam: L3([AX + 0.35, 0.85, 31], [AX + 0.35, 0.8, 26], ez(t / d)), look: [AX, 0.45, 0], fov: 46, focus: 6, cinf: 2, tag: '39 FT', arrows: [{ p: [AX + 0.72, 0.85, 18.06], ry: Math.PI / 2, s: 0.8 }, { p: [AX + 0.72, 0.85, J], ry: -Math.PI / 2, s: 0.8 }] }));
// 2 "this railroad worker"  the worker, close, saw in hand
shot(1.6, (t, d) => ({ preset: 'day', cam: L3([AX + 2.4, 1.8, 9.2], [AX + 2.2, 1.75, 8.7], ez(t / d)), look: [AX + 1.5, 1.7, 6.4], fov: 44, focus: 2.6, cinf: 4,
  actors: [act('rworker', AX + 1.5, 0, 6.4, { expr: 'grin', L: 'hip', R: { a: 70, e: 50 }, facing: -0.3, blink: blink(t, 1) }, [{ hand: 1, kind: 'saw' }], {}, t)] }));
// 3 "cuts a gap in the track."  macro: the saw bites the rail, sparks fly
shot(2.65, (t, d) => ({ preset: 'day', cam: L3([AX + 1.55, 0.95, 7.4], [AX + 1.45, 0.9, 7.1], ez(t / d)), look: [AX + 0.72, 0.55, J], fov: 42, focus: 1.3, cinf: 4, sparks: [AX + 0.72, 0.6, J], dust: [{ p: [AX + 0.72, 0.4, J], w: 0.4, h: 0.4, s: 0.3, k: 0.3 }], dustN: 6,
  actors: [act('rworker', AX + 2.1, BAL - 0.3, J + 0.2, { expr: 'stubborn', L: 'hang', R: { a: 40 + wig(t, 20, 8), e: 60 }, facing: -0.5, tilt: -22 }, [{ hand: 1, kind: 'saw' }], {}, t)] }));
// 4 "On purpose."  he winks, thumbs up
shot(4.3, (t, d) => ({ preset: 'day', cam: L3([AX + 2.0, 1.78, 8.4], [AX + 1.9, 1.78, 8.0], eo(t / 0.4)), look: [AX + 1.5, 1.72, 6.4], fov: 42, focus: 1.8, cinf: 5,
  actors: [act('rworker', AX + 1.5, 0, 6.4, { expr: 'smile', L: 'thumb', R: { a: 70, e: 50 }, facing: -0.1, blink: t > 0.4 && t < 0.7 ? 1 : 0, headTilt: 8 }, [{ hand: 1, kind: 'saw' }], {}, t), fx(burst(t), AX + 1.9, 1.6, 6.3, 0.35)] }));
// 5 "It's the eighteen-hundreds,"  the station: steam train in, crowd, banners
shot(5.5, (t, d) => ({ preset: 'day', cam: L3([-4.5, 2.6, 44], [-3.8, 2.4, 40], ez(t / d)), look: [2.5, 2.0, 8], fov: 48, focus: 14, cinf: 1.5, tag: '1800s', train: 4 + t * 0.6, steam: 1, steamDrift: 1.5, shadowExt: 30,
  actors: [act('lady', 3.4, PL, 22, { expr: 'smile', L: 'hang', R: 'wave', wv: t * 8, facing: -0.3 }), act('gent', 4.6, PL, 24, { expr: 'grin', L: 'hang', R: 'thumb', facing: -0.4 }), act('newsboy', 3.0, PL, 26.5, { expr: 'laugh', L: 'up', R: 'hang', facing: -0.5 }), act('tycoon', 5.2, PL, 18, { expr: 'smile', L: 'hip', R: 'hang', facing: -0.4 })] }));
// 6 "and his rival thinks he's an idiot."  the rival laughs and points
shot(6.8, (t, d) => ({ preset: 'day', cam: L3([1.5, 2.7, 22.6], [1.6, 2.65, 22.2], ez(t / d)), look: [4.0, 2.6, 18.8], fov: 46, focus: 4.4, cinf: 4, orbit: 0.04 - t * 0.04,
  actors: [act('tycoon', 4.0, PL, 18.8, { expr: 'laugh', L: 'belly', R: 'point', facing: -0.3, bob: Math.abs(Math.sin(t * 13)) * 0.02 }), fx(word('HA')(t), 4.2, 3.4, 18.6, 0.6), fx(sign(t, '?'), 4.7, 3.4, 18.9, 0.3)] }));
// 7 "Gaps make trains bounce."  a train rattles over the joints on the old line, jolting
shot(8.8, (t, d) => ({ preset: 'day', cam: [AX + 3.2, 0.9, 14], look: [AX + 0.4, 1.4, 4], fov: 50, focus: 6, cinf: 2, trainX: AX, train: 30 - t * 7 + 12, bounce: 1, shake: 0.05, steam: 1, steamDrift: -3,
  dust: [{ p: [AX, 0.3, J], w: 3, h: 0.6, s: 0.6, k: 0.4 }], dustN: 10 }));
// 8 "Clickety-clack,"  inside: everyone jolts with every gap
shot(10.7, (t, d) => { const j = Math.abs(Math.sin(t * 9)) * 0.06; return { preset: 'int', cam: [300.0, 1.7, 3.4], look: [300, 1.35, -1.2], fov: 52, focus: 4, cinf: 2, shake: 0.06,
  actors: [act('lady', 300.85, j, 0.2, { expr: 'pained', L: 'cheek', R: 'hang', facing: -0.3 }), act('gent', 299.15, j * 1.2, -2.3, { expr: 'shock', L: 'up', R: 'up', facing: 0.3 }), act('newsboy', 300.85, j * 0.8, -4.9, { expr: 'dazed', L: 'hang', R: 'hang', facing: -0.2 }), fx(word('CLACK', '#ffd84a', 2)(t), 300, 2.0, -1, 0.7)] }; });
// 9 "all day long."  the gentleman, rattled, rubs his head
shot(11.6, (t, d) => { const j = Math.abs(Math.sin(t * 9)) * 0.05; return { preset: 'int', cam: L3([299.5, 1.8, 0.2], [299.45, 1.8, -0.2], ez(t / d)), look: [299.15, 1.72, -2.3], fov: 42, focus: 2.0, cinf: 4, shake: 0.04,
  actors: [act('gent', 299.15, j, -2.3, { expr: 'pained', L: 'temple', R: 'hang', facing: 0.2, sweat: 2, swirl: t * 8 })] }; });
// 10 "So the rival builds the perfect railroad."  he stands proud beside the new gleaming line
shot(12.95, (t, d) => ({ preset: 'day', cam: L3([0.9, 1.5, -20.2], [1.1, 1.6, -21.0], ez(t / d)), look: [1.9, 1.9, -24], fov: 46, focus: 5, cinf: 2.5,
  actors: [act('tycoon', 1.9, 0, -24, { expr: 'grin', L: { a: 130, e: 10 }, R: { a: 130, e: 10 }, facing: -0.2, blink: blink(t, 3) }), fx(burst(t), 1.9, 1.8, -24.1, 0.6)] }));
// 11 "No gaps."  macro on the seamless rail; he wags a finger
shot(15.4, (t, d) => ({ preset: 'day', cam: [1.15, 0.85, -26.6], look: [0.72, 0.58, -29], fov: 40, focus: 1.6, cinf: 4,
  actors: [act('tycoon', 1.7, 0, -30.5, { expr: 'stubborn', L: 'hip', R: { a: 150 + wig(t, 14, 18), e: 20, finger: true }, facing: -0.3 }), fx(burst(t, '#ffffff'), 0.72, 0.3, -28.8, 0.25)] }));
// 12 "Smooth steel,"  racing low along the shining rail head
shot(16.5, (t, d) => ({ preset: 'day', cam: [0.82, 0.64, -30 - t * 7], look: [0.72, 0.55, -40 - t * 7], fov: 46, focus: 2, cinf: 2, handheld: 0.004 }));
// 13 "end to end, straight across the desert."  crane up: one line to the horizon between the cliffs
shot(17.65, (t, d) => ({ preset: 'day', cam: L3([5, 10, 8], [3, 30, 16], ez(t / d)), look: [0, 0, -220], fov: 50, focus: 80, cinf: 0, shadowExt: 80 }));
// 14 "His trains glide in total silence."  side tracking: the luxury train slides past, smooth
shot(20.2, (t, d) => { const z = -40 + t * 10; return { preset: 'day', cam: [8.5, 2.4, z - 8], look: [0, 2.4, z - 10], fov: 46, focus: 9, cinf: 1.5, train: z, steam: 1, steamDrift: 6, shadowExt: 30 }; });
// 15 "Passengers love it."  inside: calm, smiles, tea, hearts
shot(22.85, (t, d) => ({ preset: 'int', cam: L3([299.7, 1.65, 4.0], [299.8, 1.65, 3.5], ez(t / d)), look: [300.4, 1.4, 0], fov: 46, focus: 3.4, cinf: 3,
  actors: [act('lady', 300.85, 0, 0.2, { expr: 'smile_closed', L: 'cheek', R: 'hang', facing: -0.3 }), act('gent', 299.15, 0, -2.3, { expr: 'grin', L: 'thumb', R: 'hang', facing: 0.3 }), fx(hearts(t), 300.6, 1.6, 0.1, 0.6)] }));
// 16 "The newspapers call it the future."  newsboy waves the paper; the rival beams behind
shot(24.25, (t, d) => ({ preset: 'day', cam: L3([1.6, 2.5, 30.2], [1.7, 2.45, 29.6], eo(t / 0.5)), look: [3.4, 2.4, 26.6], fov: 44, focus: 3.6, cinf: 3,
  actors: [act('newsboy', 3.0, PL, 26.8, { expr: 'laugh', talk: true, L: { a: 60 + wig(t, 8, 6), e: 70, front: true }, R: { a: 60 - wig(t, 8, 6), e: 70, front: true }, facing: -0.2 }, [{ hand: 1, kind: 'news' }], {}, t), act('tycoon', 4.8, PL, 24.5, { expr: 'grin', L: 'hip', R: 'thumb', facing: -0.3 })] }));
// 17 "Then summer arrives."  the thermometer by the line climbs, sun blazing
shot(26.5, (t, d) => ({ preset: 'hot', cam: L3([1.6, 3.2, -127.4], [2.0, 3.3, -128.4], ez(t / d)), look: [3.4, 3.5, -132], fov: 44, focus: 4, cinf: 2, thermo: lerp(0.3, 0.72, ez(t / d)), tag: 'SUMMER', haze: 0.4, rays: 1.0, motes: true }));
// 18 "The sun bakes the rails all afternoon,"  low on the rails: colour creeps into the steel, the air shimmers
shot(28.1, (t, d) => ({ preset: 'hot', cam: L3([1.0, 0.72, -118], [0.95, 0.7, -120], ez(t / d)), look: [0.4, 0.55, -132], fov: 46, focus: 3, cinf: 2, heat: lerp(0.1, 0.55, ez(t / d)), haze: 0.8, thermo: 0.75 }));
// 19 "and steel does something sneaky."  the rival on the platform fans himself, sweating, oblivious
shot(30.65, (t, d) => ({ preset: 'hot', cam: L3([1.5, 2.6, 22.6], [1.6, 2.6, 22.2], ez(t / d)), look: [4.0, 2.5, 18.8], fov: 44, focus: 4.2, cinf: 3, haze: 0.6,
  actors: [act('tycoon', 4.0, PL, 18.8, { expr: 'nervous', L: 'hip', R: { a: 140 + wig(t, 16, 20), e: 50 }, facing: -0.3, sweat: 3 }), fx(sign(t, '!', '#ff7a3a'), 4.6, 3.5, 18.9, 0.3)] }));
// 20 "It grows."  macro on an old-line gap: the rail end creeps in, but the gap survives
shot(33.15, (t, d) => ({ preset: 'hot', cam: [AX + 1.05, 0.8, J + 0.9], look: [AX + 0.72, 0.55, J], fov: 38, focus: 1.0, cinf: 4, grow: ez(rg(t, 0, 1.0)), heat: 0.4, haze: 0.4, near: 0.02,
  arrows: [{ p: [AX + 0.72, 0.78, J + 0.45], ry: Math.PI / 2, s: 0.35 }, { p: [AX + 0.72, 0.78, J - 0.45], ry: -Math.PI / 2, s: 0.35 }] }));
// 21 "One short rail only grows a tiny bit."  the worker points at the gap that's still there
shot(34.3, (t, d) => ({ preset: 'hot', cam: L3([AX + 2.3, 1.6, 9.0], [AX + 2.2, 1.55, 8.6], ez(t / d)), look: [AX + 1.0, 1.0, J], fov: 46, focus: 3, cinf: 3, grow: 1, heat: 0.4, tag: 'TINY',
  actors: [act('rworker', AX + 1.6, 0, J + 0.3, { expr: 'smile', L: 'hip', R: { a: 110, e: 30, finger: true }, facing: -0.4, blink: blink(t, 4) })] }));
// 22 "But a whole mile of steel with no gaps?"  high along the new line: the whole mile glows hot
shot(36.9, (t, d) => ({ preset: 'hot', cam: L3([4, 12, -60], [3, 16, -70], ez(t / d)), look: [0, 0, -260], fov: 48, focus: 60, cinf: 0, heat: 0.75, haze: 0.5, tag: '1 MILE', shadowExt: 80 }));
// 23 "It needs almost two feet of extra room,"  macro: arrows strain along the rail, it creaks
shot(39.6, (t, d) => ({ preset: 'hot', cam: [1.3, 0.95, -142], look: [0.72, 0.6, -148], fov: 44, focus: 2, cinf: 3, heat: 0.85, haze: 0.6, tag: '2 FEET', shake: 0.01,
  arrows: [{ p: [0.72, 0.9, -146], ry: Math.PI / 2, s: 0.6 }, { p: [0.72, 0.9, -150], ry: -Math.PI / 2, s: 0.6 }] }));
// 24 "and there's nowhere to go."  sleepers tremble, gravel jumps, dust puffs
shot(41.9, (t, d) => ({ preset: 'hot', cam: [2.2, 0.9, -138], look: [0, 0.4, -150], fov: 48, focus: 6, cinf: 2, heat: 0.9, haze: 0.6, kink: 0.04 * Math.sin(t * 20), shake: 0.03, dust: [{ p: [0, 0.3, -150], w: 3, h: 0.5, s: 0.5, k: 0.35 }], dustN: 12 }));
// 25 "So the track shoves itself sideways,"  BANG: the rails buckle sideways, gravel and dust burst
shot(43.3, (t, d) => { const k = eo(rg(t, 0.15, 1.5)); return { preset: 'hot', cam: [5.5, 1.6, -132], look: [0.6, 0.5, -150], fov: 50, focus: 8, cinf: 1.5, heat: 0.9, haze: 0.5, kink: k * 0.85, shake: 0.07 * (1 - rg(t, 0.2, 1.8)),
    dust: [{ p: [0.6, 0.3, -140], w: 6, h: 1.4, s: 1.4, k: 0.5 }, { p: [-0.6, 0.3, -160], w: 6, h: 1.4, s: 1.4, k: 0.5 }], dustN: 30 }; });
// 26 "into a giant snake-shaped bend."  aerial: the S-bend, plain as day
shot(45.5, (t, d) => ({ preset: 'hot', cam: L3([10, 14, -118], [12, 22, -122], ez(t / d)), look: [0, 0, -152], fov: 46, focus: 30, cinf: 0, heat: 0.8, kink: 1, haze: 0.3, shadowExt: 40 }));
// 27 "And the afternoon train"  behind the bend: the train comes thundering toward it
shot(48.0, (t, d) => ({ preset: 'hot', cam: [-1.6, 1.3, -112], look: [0, 1.6, -200], fov: 46, focus: 30, cinf: 1, heat: 0.8, kink: 1, train: -262 + t * 22, steam: 1, steamDrift: 6, haze: 0.4 }));
// 28 "is heading right for it."  the driver spots it, eyes wide
shot(49.3, (t, d) => { const z = -228 + t * 14; return { preset: 'hot', cam: [3.4, 2.4, z - 2.8], look: [1.4, 2.6, z - 5.4], fov: 46, focus: 3, cinf: 3, kink: 1, heat: 0.8, train: z, steam: 1, shake: 0.03,
  actors: [act('driver', 1.6, 1.75, z - 5.3, { expr: 'shock', L: 'cheek', R: 'up', facing: 0.6, sweat: 3 }, [], { s: 0.95, blob: false }), fx(sign(t, '!', '#ff5a3a'), 1.9, 3.7, z - 5.4, 0.35)] }; });
// 29 "You see,"  the worker, calm
shot(50.85, (t, d) => ({ preset: 'day', cam: [AX + 2.0, 1.78, 8.4], look: [AX + 1.5, 1.72, 6.4], fov: 42, focus: 1.8, cinf: 5, actors: [act('rworker', AX + 1.5, 0, 6.4, { expr: 'smile', L: 'hip', R: 'hang', facing: -0.1, blink: blink(t, 6) })] }));
// 30 "those little gaps were never mistakes."  macro on the gap, glowing outline sparkle
shot(51.4, (t, d) => ({ preset: 'day', cam: L3([AX + 1.15, 0.85, J + 1.1], [AX + 1.0, 0.8, J + 0.8], ez(t / d)), look: [AX + 0.72, 0.55, J], fov: 40, focus: 1.1, cinf: 4, near: 0.02, actors: [fx(burst(t, '#ffd870'), AX + 0.72, 0.25, J, 0.3)] }));
// 31 "They were breathing room."  the gap breathes in and out; he takes a deep breath too
shot(53.8, (t, d) => ({ preset: 'day', cam: L3([AX + 2.2, 1.7, 9.0], [AX + 2.0, 1.7, 8.5], ez(t / d)), look: [AX + 1.2, 1.2, J], fov: 46, focus: 2.8, cinf: 3, grow: 0.5 + 0.5 * Math.sin(t * 4),
  actors: [act('rworker', AX + 1.6, 0, J + 0.3, { expr: 'smile_closed', L: { a: 120 + 20 * Math.sin(t * 4), e: 40 }, R: { a: 120 + 20 * Math.sin(t * 4), e: 40 }, facing: -0.3, bob: 0.02 * Math.sin(t * 4) })] }));
// 32 "And here's the crazy part."  the rival, purple with rage, steaming
shot(55.3, (t, d) => ({ preset: 'hot', cam: L3([3.5, 2.75, 21.0], [3.6, 2.75, 20.6], ez(t / d)), look: [4.0, 2.65, 18.8], fov: 42, focus: 1.9, cinf: 5,
  actors: [act(PURPLE, 4.0, PL, 18.8, { expr: 'stubborn', L: 'fist', R: 'fist', facing: 0, tilt: wig(t, 22, 2) }), fx(steamHead(t), 4.0, 2.3, 18.7, 0.9)] }));
// 33 "Most railroads today really have no gaps."  today: a sleek modern train glides past on seamless rail
shot(56.9, (t, d) => ({ preset: 'gold', cam: [-3.6, 1.1, -40], look: [0, 2.2, -52], fov: 50, focus: 8, cinf: 1.5, modern: -84 + t * 24, tag: 'TODAY', rays: 1.0, shake: 0.02 }));
// 34 "Engineers stretch the steel tight"  hi-vis crew: the yellow tensioner clamps the rail, arrows pull outward
shot(59.8, (t, d) => ({ preset: 'gold', cam: L3([2.6, 1.6, -57.5], [2.4, 1.55, -58.2], ez(t / d)), look: [0.6, 0.8, -61], fov: 46, focus: 3, cinf: 3, tens: [0.72, 0, -61],
  arrows: [{ p: [0.72, 0.95, -59.3], ry: Math.PI / 2, s: 0.55 }, { p: [0.72, 0.95, -62.7], ry: -Math.PI / 2, s: 0.55 }],
  actors: [act('worker', 2.0, 0, -60.4, { expr: 'stubborn', L: { a: 60, e: 50 }, R: { a: 60 + wig(t, 8, 6), e: 50 }, facing: -0.5, tilt: -10 })] }));
// 35 "and lay it on a hot day,"  the thermometer says hot; welding sparks; a sweaty thumbs-up
shot(61.6, (t, d) => ({ preset: 'hot', cam: L3([1.8, 2.2, -126], [2.1, 2.3, -126.8], ez(t / d)), look: [2.6, 2.4, -131.5], fov: 46, focus: 3, cinf: 3, thermo: 0.8, sparks: [0.72, 0.6, -129.5], haze: 0.3,
  actors: [act('worker', 1.6, 0, -130.0, { expr: 'smile', L: 'thumb', R: 'hang', facing: 0.2, sweat: 2 })] }));
// 36 "so summer has nothing left to push."  sunset: the modern train glides by over straight, calm rails
shot(63.2, (t, d) => ({ preset: 'gold', cam: L3([3.6, 1.7, -36.6], [4.0, 2.0, -35.0], ez(t / d)), look: [2.0, 1.6, -40], fov: 48, focus: 3.5, cinf: 2, modern: -96 + t * 20, rays: 1.2,
  actors: [act('worker', 2.2, 0, -40, { expr: 'grin', L: 'thumb', R: 'hip', facing: 0.3, blink: blink(t, 2) })] }));

export const CUTS = SH.map((s) => s.t0);
export const stateAt = (f) => { const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--; const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0; const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i; return S; };
