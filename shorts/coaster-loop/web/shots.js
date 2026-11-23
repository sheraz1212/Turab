// "The Loop" (clothoid coaster loop). 30 fps; times from work/phrases.json. Shiny park, close angles, every line acted.
import * as T from './toon.js';
const FPS = 30;
export const TOTAL = Math.ceil(67.2 * FPS);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); };
const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const wig = (t, f = 6, amp = 8) => Math.sin(t * f) * amp;
const talkE = (t, expr) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(expr, 'o') : expr);
const prop = (p, pr, h, t) => { const g = p.g; const c = pr.c || h;
  if (pr.kind === 'hammer') { const a = pr.a ?? 0; g.save(); g.translate(h[0], h[1]); g.rotate(a); p.stroke([[0, 0], [0, -200]], 18, '#8a5a32'); p.poly([[-70, -200], [70, -200], [70, -260], [-70, -260]], '#5a5e66', 6); g.restore(); }
  if (pr.kind === 'wrench') { g.save(); g.translate(h[0], h[1]); g.rotate(pr.a ?? 0); p.stroke([[0, 0], [0, -170]], 18, '#a8b0b8'); p.ell(0, -190, 30, 26, '#a8b0b8', 5); p.ell(0, -200, 12, 14, '#2a2a2a', 0); g.restore(); }
  if (pr.kind === 'wallet') { const x = c[0], y = c[1]; p.poly([[x - 70, y - 40], [x + 70, y - 40], [x + 70, y + 40], [x - 70, y + 40]], '#6a3a22', 6); p.poly([[x - 60, y - 40], [x + 60, y - 40], [x + 50, y - 90], [x - 50, y - 90]], '#7a4a2a', 5); for (let k = 0; k < 3; k++) { const a = (t * 1.2 + k / 3) % 1; p.ell(x - 30 + k * 30 + Math.sin(a * 9) * 20, y - 100 - a * 300, 16, 10, '#c8b8a0', 3); } }
  if (pr.kind === 'plan') { const x = c[0], y = c[1]; p.poly([[x - 140, y - 110], [x + 140, y - 110], [x + 140, y + 110], [x - 140, y + 110]], '#2a5ab8', 6); g.save(); g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.beginPath(); g.arc(x + 30, y - 10, 70, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(x - 130, y + 80); g.lineTo(x + 30, y + 60); g.stroke(); g.restore(); }
  if (pr.kind === 'crank') { const x = c[0], y = c[1], a = t * 8; p.ell(x, y, 60, 60, '#5a5e66', 6); p.stroke([[x, y], [x + Math.cos(a) * 80, y + Math.sin(a) * 80]], 16, '#3a3a40'); p.ell(x + Math.cos(a) * 80, y + Math.sin(a) * 80, 18, 18, '#e8322f', 4); } };
const C = (who, o = {}, props = [], t = 0) => (p) => { const out = {}; const oo = { ...o }; if (o.talk) oo.expr = talkE(t, o.expr || 'smile'); T.romanFront(p, who, { ...oo, out }); for (const pr of props) prop(p, pr, out.hands[pr.hand ?? 1], t); };
const act = (who, x, y, z, o = {}, props = [], extra = {}, t = 0) => ({ x, y, z, draw: C(who, o, props, t), ...extra });
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const bubble = (txt, x, y, z, s = 0.42, extra = {}) => fx((p) => T.fxBubble(p, txt, {}), x, y - 1.5 * s, z, s, { order: 8, ...extra });
const sparks = (t, col = '#ffd060') => (p) => T.fxBurst(p, (t * 3) % 1, col, 14, 20, 180);
const burst = (t, col = '#fff3b0') => (p) => T.fxBurst(p, (t * 1.4) % 1, col, 14, 60, 260);
const word = (txt, col = '#ffd84a', sz = 120) => (t) => (p) => { const g = p.g; g.save(); g.font = `900 ${sz}px Arial Black, Arial`; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 18; g.strokeStyle = '#1a1a2a'; g.fillStyle = col; const k = eo(t * 3); g.translate(300, 480); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); g.rotate(-0.06); g.strokeText(txt, 0, 0); g.fillText(txt, 0, 0); g.restore(); };
const ringO = (t, r = 230) => (p) => { const g = p.g; g.save(); g.strokeStyle = '#ff9a3a'; g.lineWidth = 22 + Math.sin(t * 8) * 4; g.beginPath(); g.ellipse(300, 500, r, r, 0, 0, Math.PI * 2 * eo(t * 2)); g.stroke(); g.restore(); };
const tagC = (txt, col = '#ffe070') => (t) => (p) => { const g = p.g; g.save(); const k = eo(t * 3); g.translate(300, 500); g.scale(k, k); p.poly([[-190, -64], [190, -64], [190, 64], [-190, 64]], col, 7); g.font = '900 72px Arial Black'; g.fillStyle = '#1a1a2a'; g.textAlign = 'center'; g.fillText(txt, 0, 26); g.restore(); };
const speed = (t) => (p) => { const g = p.g; g.save(); g.lineCap = 'round'; for (let i = 0; i < 6; i++) { const k = (t * 3 + i / 6) % 1; g.globalAlpha = 1 - k; g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.beginPath(); g.moveTo(80 + k * 200, 300 + i * 70); g.lineTo(260 + k * 200, 300 + i * 70); g.stroke(); } g.restore(); };
const tick = (t) => (p) => { const g = p.g, k = eo(t * 3); g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#1a3a1a'; g.lineWidth = 56; g.beginPath(); g.moveTo(170, 480); g.lineTo(260, 570); g.lineTo(260 + 200 * k, 570 - 260 * k); g.stroke(); g.strokeStyle = '#3ad84a'; g.lineWidth = 34; g.stroke(); g.restore(); };
const can = (p) => { p.poly([[230, 860], [370, 860], [380, 900], [220, 900]], '#d8322f', 5); p.poly([[220, 900], [380, 900], [370, 930], [230, 930]], '#c8c8d0', 5); };
const walk = (t, sp = 2, stride = 18) => ({ step: (t * sp) % 1, stride });
// track fractions (circle: loop 0.422..0.743, top 0.605; teardrop: 0.404..0.754, top 0.600; lift top 0.23)
const LP = 22; // loop centre x
const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });

// 1 "Back in the 1890s,"  sunny park, the coaster with its round loop
shot(0.0, (t, d) => ({ preset: 'day', k1: 0, k2: 0, cam: L3([40, 14, 56], [36, 12, 50], ez(t / d)), look: [6, 7, 0], fov: 52, tag: '1890s' }));
// 2 "a builder makes a roller coaster that goes upside down."  the builder hammering a rail at the loop base
shot(1.64, (t, d) => ({ preset: 'day', k1: 0, k2: 0, cam: L3([LP - 6.5, 2.0, 9], [LP - 6, 2.2, 8.2], ez(t / d)), look: [LP - 4, 2.4, 1.5], fov: 50, shake: Math.sin(t * 14) > 0.85 ? 0.015 : 0,
  actors: [act('builder', LP - 4, 0, 2.6, { expr: 'stubborn', L: 'hang', R: { a: 120 + wig(t, 14, 30), e: 30 } }, [{ kind: 'hammer', a: wig(t, 14, 0.5) }], {}, t), Math.sin(t * 14) > 0.7 ? fx(sparks(t), LP - 3.4, 1.3, 1.6, 0.5) : null].filter(Boolean) }));
// 3 (cont.)  a test cart whips upside down through the loop
shot(3.1, (t, d) => ({ preset: 'day', k1: 0, k2: 0, cart: lerp(0.5, 0.68, t / d), cam: [LP + 2, 6, 26], look: [LP, 9, 1], fov: 52 }));
// 4 "One perfect circle of a loop."  face-on: an orange ring traces the perfect circle
shot(4.94, (t, d) => ({ preset: 'day', k1: 0, k2: 0, cam: L3([LP, 9.2, 34], [LP, 9.2, 31], ez(t / d)), look: [LP, 9.2, 1], fov: 46, actors: [fx(ringO(t, 250), LP, 1.8, 2.5, 6.2)] }));
// 5 "It costs him everything."  empty wallet, moths
shot(7.24, (t, d) => ({ preset: 'day', k1: 0, k2: 0, cam: [LP - 7.2, 1.9, 6.6], look: [LP - 6, 1.7, 3.2], fov: 44, actors: [act('builder', LP - 6, 0, 3.2, { expr: 'pained', L: { a: 60, e: 60 }, R: { a: 60, e: 60 } }, [{ kind: 'wallet', c: [300, 560] }], {}, t)] }));
// 6 "And of course, his rival copies it,"  rival peeks from behind a tent with a blueprint
shot(9.09, (t, d) => ({ preset: 'day', k1: 0, k2: 0, cam: L3([-8.6, 1.9, 12.5], [-9.0, 1.9, 12.0], ez(t / d)), look: [-11.6, 1.7, 10.4], fov: 44, actors: [act('rival', -11.6, 0, 10.4, { expr: 'grin', L: { a: 60, e: 50 }, R: { a: 60, e: 50 }, facing: 0.5 }, [{ kind: 'plan', c: [300, 560] }])] }));
// 7 "bolt for bolt."  his identical coaster across town, he tightens a bolt
shot(11.28, (t, d) => ({ preset: 'day', cam: [-300 + LP - 6.4, 2.0, 7.6], look: [-300 + LP - 4, 1.9, 2.4], fov: 48, actors: [act('rival', -300 + LP - 4, 0, 2.6, { expr: 'grin', L: 'hang', R: { a: 120, e: 40 } }, [{ kind: 'wrench', a: Math.sin(t * 8) * 0.5 }], {}, t)] }));
// 8 "But the night before opening,"  night; banner OPENING TOMORROW, lights on
shot(12.56, (t, d) => ({ preset: 'night', k1: 0, k2: 0, arch: 'OPENING TOMORROW', cam: L3([-6, 2.4, 22], [-6, 2.6, 26], ez(t / d)), look: [-6, 5.5, 40], fov: 50 }));
// 9 "his test dummy comes back crushed."  the cart rolls into the station with a squashed dummy
shot(13.9, (t, d) => ({ preset: 'night', k1: 0, k2: 0, arch: 'OPENING TOMORROW', cart: lerp(0.0, 0.05, eo(t / d)), cam: [-41.5, 3.4, 9.0], look: [-38.5, 2.8, 0.3], fov: 44,
  actors: [{ onCart: 'H', y: 0.15, ...act('dummy', 0, 0, 0, { expr: 'dazed', L: 'hang', R: 'hang' }), s: 0.75, roll: 0 }, act('builder', -35.6, 1.4, 3.0, { expr: 'shock', L: 'cheek', R: 'cheek' })].map((a, i) => (i === 0 ? { ...a, draw: C('dummy', { expr: 'dazed', L: 'hang', R: 'hang' }), y: 0.15 } : a)) }));
// 10 "Flat as a soda can."  the flattened dummy + a crushed can
shot(16.04, (t, d) => ({ preset: 'night', k1: 0, k2: 0, cart: 0.05, cam: [-40.6, 3.4, 3.4], look: [-38.2, 2.7, 0.2], fov: 42,
  actors: [{ onCart: 'H', y: 0.1, draw: C('dummy', { expr: 'dazed', L: 'hang', R: 'hang' }), s: 0.78, scaleY: 0.4 }, fx((p) => can(p), -37.0, 2.1, 0.8, 0.5)] }));
// 11 "He can't miss opening day."  builder panics under the banner
shot(17.76, (t, d) => ({ preset: 'night', arch: 'OPENING TOMORROW', cam: [-6, 2.0, 34.6], look: [-6, 3.2, 40], fov: 48, actors: [act('builder', -6, 0, 37.4, { expr: 'nervous', L: 'cheek', R: 'cheek', sweat: 3, tilt: wig(t, 30, 2) })] }));
// 12 "So he grabs a hammer,"  he hefts a huge hammer
shot(19.7, (t, d) => ({ preset: 'night', k1: 0, k2: 0, cam: [LP - 6.4, 1.9, 7.4], look: [LP - 4.6, 2.0, 3], fov: 44, actors: [act('builder', LP - 4.6, 0, 3, { expr: 'stubborn', L: { a: 150, e: 10 }, R: { a: 150, e: 10 } }, [{ kind: 'hammer', a: -0.2 }])] }));
// 13 "and bends the bottom of the loop into a long, lazy curve."  CLANG; the loop base widens
shot(21.2, (t, d) => { const k = ez((t - 0.3) / (d - 0.6)); return { preset: 'night', k1: k, k2: 0, cam: L3([LP - 2, 5, 30], [LP - 2, 6, 33], ez(t / d)), look: [LP, 6, 1], fov: 52, shake: Math.sin(t * 10) > 0.8 ? 0.02 : 0,
  actors: [act('builder', LP - 9, 0, 3, { expr: 'stubborn', L: 'hang', R: { a: 120 + wig(t, 10, 40), e: 30 } }, [{ kind: 'hammer', a: wig(t, 10, 0.6) }], {}, t), fx(word('CLANG!')(t % 0.6), LP - 8, 3.6, 3.2, 0.7)] }; });
// 14 "Does he know what he's doing?"  head scratch
shot(24.75, (t, d) => ({ preset: 'night', k1: 1, k2: 0, cam: [LP - 7.0, 1.9, 9.0], look: [LP - 6, 1.8, 5], fov: 44, actors: [act('builder', LP - 6, 0, 5, { expr: 'dazed', L: 'hang', R: 'cheek', headTilt: 12 }), bubble('?', LP - 5.6, 2.7, 5, 0.45)] }));
// 15 "Not really."  shrug + grin
shot(26.18, (t, d) => ({ preset: 'night', k1: 1, k2: 0, cam: [LP - 6.8, 1.9, 8.6], look: [LP - 6, 1.8, 5], fov: 42, actors: [act('builder', LP - 6, 0, 5, { expr: 'grin', L: 'up', R: 'up' })] }));
// 16 "His rival laughs."  behind a tent in the dark
shot(27.25, (t, d) => ({ preset: 'night', k1: 1, k2: 0, cam: [-8.8, 1.9, 13.4], look: [-11.6, 1.7, 10.4], fov: 44, actors: [act('rival', -11.6, 0, 10.4, { expr: 'laugh', L: 'belly', R: 'belly', tilt: wig(t, 14, 5) })] }));
// 17 "Then sneaks in that night,"  tiptoeing past the loop with a crank
shot(28.68, (t, d) => { const k = t / d; return { preset: 'night', k1: 1, k2: 0, cam: [LP + 2, 1.9, 12], look: [LP - 1, 1.8, 4], fov: 50, actors: [act('rival', lerp(LP - 5, LP + 1, k), 0, 4, { expr: 'grin', L: { a: 60, e: 50 }, R: { a: 60, e: 50 }, ...walk(t, 1.6, 14) }, [{ kind: 'crank', c: [300, 560] }], {}, t)] }; });
// 18 "and cranks the sides together,"  the loop squeezes tall and narrow
shot(30.4, (t, d) => { const k = ez(t / d); return { preset: 'night', k1: 1, k2: k, cam: L3([LP, 8, 36], [LP, 9, 38], ez(t / d)), look: [LP, 9, 1], fov: 52, actors: [act('rival', LP + 9.6, 0, 2.6, { expr: 'stubborn', L: { a: 60, e: 50 }, R: { a: 60, e: 50 } }, [{ kind: 'crank', c: [300, 560] }], {}, t)] }; });
// 19 "until the loop is tall and skinny."  teardrop under the moon
shot(32.25, (t, d) => ({ preset: 'night', k1: 1, k2: 1, cam: L3([LP + 6, 2, 30], [LP + 5, 2.4, 28], ez(t / d)), look: [LP, 11, 1], fov: 56 }));
// 20 "Opening day."  GRAND OPENING, crowds, balloons
shot(34.0, (t, d) => ({ preset: 'day', k1: 1, k2: 1, arch: 'GRAND OPENING', cam: L3([-6, 1.8, 54], [-6, 2.2, 50], ez(t / d)), look: [-6, 4.5, 38], fov: 52,
  actors: [act('townA', -8, 0, 44, { expr: 'smile', L: 'up', R: 'hang' }), act('townB', -4.4, 0, 45, { expr: 'grin', L: 'hang', R: 'up' }, [], { s: 0.92 }), act('townC', -6.2, 0, 42.5, { expr: 'laugh', L: 'up', R: 'up' })] }));
// 21 "He climbs into the first cart."  at the station
shot(35.1, (t, d) => ({ preset: 'day', k1: 1, k2: 1, cart: 0.04, cam: [-41.5, 3.4, 9.0], look: [-38.5, 2.8, 0.3], fov: 44, actors: [{ onCart: 'H', y: 0.2, draw: C('builder', { expr: 'grin', L: 'up', R: 'thumb' }), s: 0.8 }, act('townA', -36.4, 1.4, 3.2, { expr: 'smile', L: 'up', R: 'hang' })] }));
// 22 "As it tips over the hill,"  behind the cart at the top of the lift
shot(36.95, (t, d) => ({ preset: 'day', k1: 1, k2: 1, cart: lerp(0.212, 0.232, t / d), cam: [-18.5, 21.4, 2.6], look: [-6, 14, 0.5], fov: 54, actors: [{ onCart: 'H', y: 0.2, draw: C('builder', { expr: 'smile', L: 'hang', R: 'hang' }), s: 0.8 }] }));
// 23 "he finally sees the loop."  his POV: the tall skinny loop ahead
shot(38.3, (t, d) => ({ preset: 'day', k1: 1, k2: 1, cart: 0.215, cam: [-11.0, 21.4, 0.0], look: [LP, 9, 1], fov: 50, rays: 0.4 }));
// 24 "Too late."  his face as the drop starts
shot(40.3, (t, d) => ({ preset: 'day', k1: 1, k2: 1, cart: lerp(0.233, 0.25, t / d), cam: [-13.0, 21.6, 3.8], look: [-9.0, 19.0, 0], fov: 48, shake: 0.03, actors: [{ onCart: 'H', y: 0.2, draw: C('builder', { expr: 'shock', L: 'up', R: 'up' }), s: 0.8 }] }));
// 25 "You see,"  a car on a hairpin road
shot(41.4, (t, d) => ({ preset: 'road', car: { u: lerp(0.1, 0.18, t / d) }, cam: [192, 5, 2], look: [182, 0.5, -12], fov: 52 }));
// 26 "a car can take a hairpin turn at five miles an hour."  slow and steady
shot(41.95, (t, d) => ({ preset: 'road', car: { u: lerp(0.3, 0.62, t / d) }, cam: [207, 3.2, 3.5], look: [210, 0.8, -4], fov: 50, tag: '5 MPH' }));
// 27 "Take it at sixty,"  fast with speed lines
shot(45.15, (t, d) => ({ preset: 'road', car: { u: lerp(0.12, 0.34, t / d) }, cam: [196, 2.0, -21], look: [192, 1.0, -12], fov: 52, tag: '60 MPH', shake: 0.02 }));
// 28 "and it flips."  over it goes
shot(46.28, (t, d) => { const k = eo(t / d); return { preset: 'road', car: { u: 0.47, y: Math.sin(k * Math.PI) * 2.5, roll: k * Math.PI * 1.5 }, cam: [218, 3.2, 5.0], look: [211.6, 1.6, -3.0], fov: 50, shake: 0.03, dust: [{ p: [211, 0, 0], w: 3, h: 1, s: 1, k: 0.5, rate: 1.5, col: '#d8d0c8' }], dustN: 14 }; });
// 29 "A coaster cart is fastest at the bottom of a loop,"  circle loop: cart zooms at the bottom
shot(47.45, (t, d) => ({ preset: 'day', k1: 0, k2: 0, cart: lerp(0.4, 0.45, t / d), cam: [LP, 6.5, 30], look: [LP, 8, 1], fov: 50, actors: [fx(tagC('FAST')(t), LP - 4, -1.0, 6, 8), fx(speed(t), LP - 1, -1.0, 3, 5)] }));
// 30 "and slowest at the top."  the cart crawls over the top
shot(50.25, (t, d) => ({ preset: 'day', k1: 0, k2: 0, cart: lerp(0.598, 0.61, t / d), cam: [LP, 9.5, 30], look: [LP, 10, 1], fov: 50, actors: [fx(tagC('SLOW', '#8ad0ff')(t), LP + 3, 8, 6, 8)] }));
// 31 "A perfect circle puts the same sharp turn in both places."  two orange rings: top and bottom
shot(51.95, (t, d) => ({ preset: 'day', k1: 0, k2: 0, cam: [LP, 9.2, 32], look: [LP, 9.2, 1], fov: 48, actors: [fx(ringO(t, 160), LP, 10.6, 2.5, 6), fx(ringO(t - 0.4, 160), LP, -3.3, 2.5, 6), fx(tagC('SAME')(t - 1), LP, 2.0, 5, 7)] }));
// 32 "But his lazy curve at the bottom, and that squeeze at the top?"  teardrop with GENTLE / TIGHT
shot(55.75, (t, d) => ({ preset: 'day', k1: 1, k2: 1, cam: [LP, 10.5, 36], look: [LP, 10.5, 1], fov: 50, actors: [fx(tagC('GENTLE', '#8ae070')(t), LP, -5.2, 6, 7.5), fx(tagC('TIGHT', '#ff9a6a')(t - 1.2), LP, 11.2, 6, 7.5)] }));
// 33 "Exactly the right shape."  the loop gleams; green tick
shot(59.05, (t, d) => ({ preset: 'day', k1: 1, k2: 1, cam: L3([LP + 8, 4, 24], [LP + 6, 5, 22], ez(t / d)), look: [LP, 11, 1], fov: 54, rays: 0.5, actors: [fx(tick(t), LP + 4, 6, 6, 3)] }));
// 34 "He sails over without a scratch."  riding over the top, cheering
shot(60.85, (t, d) => ({ preset: 'day', k1: 1, k2: 1, cart: lerp(0.57, 0.64, t / d), cam: [LP + 2, 15.5, 11], look: [LP, 19, 1], fov: 52, actors: [{ onCart: 'H', y: 0.2, draw: C('builder', { expr: 'laugh', L: 'up', R: 'up' }), s: 0.8 }] }));
// 35 "Across town,"  whip to the rival's park
shot(63.15, (t, d) => ({ preset: 'day', cam: L3([-300 + 40, 14, 56], [-300 + 36, 12, 50], ez(t / d)), look: [-300 + 6, 7, 0], fov: 52, rcart: lerp(0.3, 0.36, t / d), actors: [{ onCart: 'R', y: 0.2, draw: C('rival', { expr: 'grin', L: 'up', R: 'up' }), s: 0.8 }] }));
// 36 "the rival's cart hits the bottom of his perfect circle."  CRUNCH, BOOM
shot(64.15, (t, d) => { const k = t / d; const hit = k > 0.35; return { preset: 'day', rcart: hit ? 0.44 : lerp(0.38, 0.44, k / 0.35), cartCrush: hit, cam: [-300 + LP + 10, 4, 20], look: [-300 + LP, 4, 1], fov: 54, shake: hit ? 0.08 * (1 - k) : 0, flash: hit && k < 0.42 ? 0.5 : 0,
  bang: hit && k < 0.75 ? { p: [-300 + LP - 3, 2, 1], s: 4 * eo((k - 0.35) * 4), k: 1 } : null, dust: [{ p: [-300 + LP - 3, 1, 1], w: 6, h: 8, s: 3, k: 0.6, rate: 0.6, col: '#6a5a50' }], dustN: hit ? 26 : 0,
  actors: [hit ? fx(word('CRUNCH!', '#ff8a3a', 140)(k - 0.35), -300 + LP + 2, 3.5, 5, 1.3) : { onCart: 'R', y: 0.2, draw: C('rival', { expr: 'shock', L: 'up', R: 'up' }), s: 0.8 }] }; });

export const CUTS = SH.map((s) => s.t0);
export const stateAt = (f) => { const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--; const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0; const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i; return S; };
