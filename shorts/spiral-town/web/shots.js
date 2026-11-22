// "Oakvale: the town built around a lever" (original story). 30 fps, times from work/phrases.json. Fast cuts (~1.2-1.6 s).
import * as T from './toon.js';
const FPS = 30;
export const TOTAL = Math.ceil(69.4 * FPS);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); };
const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const rg = (t, a, b) => cl((t - a) / (b - a));
const hash = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const blink = (t, seed = 1) => { const per = 2.4 + (seed % 5) * 0.4, ph = (t + seed * 0.7) % per; return ph < 0.07 ? 0.5 : ph < 0.14 ? 1 : 0; };
const wig = (t, f = 6, amp = 8) => Math.sin(t * f) * amp;
const talkE = (t, expr) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(expr, 'o') : expr);
const SP = (th, off = 0, y = 0) => { const r = 10 + 2.6 * th + off; return [Math.cos(th) * r, y, Math.sin(th) * r]; };
const C = (who, o = {}, props = [], t = 0) => (p) => { const out = {}; const oo = { ...o }; if (o.talk) oo.expr = talkE(t, o.expr || 'smile'); T.romanFront(p, who, { ...oo, out });
  for (const pr of props) { if (pr.kind === 'map') { const a = out.hands[0], b = out.hands[1]; p.g.save(); p.g.translate((a[0] + b[0]) / 2 - 68, (a[1] + b[1]) / 2 - 20); p.g.scale(0.26, 0.26); T.fxMap(p, pr.k || 0, t); p.g.restore(); } } };
const act = (who, x, y, z, o = {}, props = [], extra = {}, t = 0) => ({ x, y, z, draw: C(who, o, props, t), ...extra });
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const burst = (t, col = '#fff3b0') => (p) => T.fxBurst(p, (t * 1.4) % 1, col, 12, 60, 250);
const word = (txt, col = '#ffffff', n = 3) => (t) => (p) => { const g = p.g; g.save(); g.font = '900 100px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#241726'; g.fillStyle = col;
  for (let i = 0; i < n; i++) { const k = (t * 1.6 + i / n) % 1; g.globalAlpha = Math.min(1, (1 - k) * 2); const x = 170 + i * 130 + Math.sin(k * 7 + i) * 30, y = 700 - k * 450; g.strokeText(txt, x, y); g.fillText(txt, x, y); } g.restore(); };
const sign = (t, ch = '?', col = '#ffd84a') => (p) => { const g = p.g; g.save(); g.font = '900 260px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 26; g.strokeStyle = '#241726'; const y = 620 - Math.abs(Math.sin(t * 9)) * 30; g.strokeText(ch, 300, y); g.fillStyle = col; g.fillText(ch, 300, y); g.restore(); };
const mapCard = (k, t) => (p) => T.fxMap(p, k, t);
const walk = (t, sp = 2, stride = 18) => ({ step: (t * sp) % 1, stride, bob: Math.abs(Math.sin(t * sp * Math.PI * 2)) * 0.03 });
const FOLK = ['civA', 'civB', 'civC', 'lady', 'gent', 'clerk', 'workA', 'workB'];
const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });

// 1 "In the middle of Oakvale,"  high above the spiral town, turning slowly
shot(0.0, (t, d) => ({ preset: 'day', cam: [0, 70, 52], look: [0, 0, 0], fov: 46, orbit: t * 0.12, focus: 80, cinf: 0, tag: 'OAKVALE', shadowExt: 70 }));
// 2 "there's a rusty lever,"  macro on the lever, a glint
shot(1.45, (t, d) => ({ preset: 'day', cam: L3([1.3, 3.1, 1.5], [1.0, 3.0, 1.2], ez(t / d)), look: [0, 2.7, 0], fov: 40, focus: 1.6, cinf: 3, motes: true, actors: [fx(burst(t, '#fff6d0'), 0.05, 2.6, 0.2, 0.3)] }));
// 3 "and the whole town is built around it."  crane up from the lever to the whole spiral
shot(2.9, (t, d) => { const k = ez(t / d); return { preset: 'day', cam: L3([2.5, 3.2, 4.5], [14, 34, 34], k), look: [0, lerp(2, 0, k), 0], fov: 48, focus: 30, cinf: 0, shadowExt: 50 }; });
// 4 "Every street curls toward it"  flying along a curving street toward the centre
shot(5.3, (t, d) => { const th = lerp(9.5, 7.6, t / d); const p = SP(th, 0, 1.9), q = SP(th - 0.35, 0, 1.5); return { preset: 'day', cam: p, look: q, fov: 52, focus: 8, cinf: 1.5, handheld: 0.006,
  actors: [0, 1, 2].map((i) => { const [x, , z] = SP(th - 0.5 - i * 0.18, 3.2); return act(FOLK[i], x, 0, z, { expr: 'smile', L: 'wave', R: 'hang', wv: t * 8 + i, facing: 0.2, blink: blink(t, i) }); }) }; });
// 5 "in a giant spiral."  straight down: the spiral, turning
shot(6.9, (t, d) => ({ preset: 'day', cam: [0.01, 105, 0.02], look: [0, 0, 0], fov: 48, roll: t * 18, focus: 100, cinf: 0, shadowExt: 80 }));
// 6 "And there's one rule."  the sign by the lever
shot(8.75, (t, d) => ({ preset: 'day', cam: L3([0.5, 1.6, 5.8], [0.3, 1.55, 5.2], ez(t / d)), look: [0, 1.4, 2.25], fov: 44, focus: 3, cinf: 3, signK: 0 }));
// 7 "Never,"  a guard, stern, wagging a finger
shot(10.1, (t, d) => ({ preset: 'day', cam: L3([2.3, 1.8, 4.2], [2.2, 1.8, 3.9], eo(t / 0.4)), look: [1.7, 1.72, 1.6], fov: 42, focus: 2.5, cinf: 4,
  actors: [act('tguard', 1.7, 0, 1.6, { expr: 'stern', L: 'hang', R: { a: 150 + wig(t, 14, 16), e: 20, finger: true }, facing: 0.1 })] }));
// 8 "ever pull it."  the second guard steps in; kids back away
shot(11.1, (t, d) => ({ preset: 'day', cam: L3([-2.4, 1.75, 4.4], [-2.2, 1.75, 4.0], ez(t / d)), look: [-1.6, 1.6, 1.4], fov: 46, focus: 3, cinf: 3,
  actors: [act('tguard', -1.7, 0, 1.4, { expr: 'stubborn', L: 'hip', R: 'spear', facing: -0.1 }), act('civC', -3.6, 0, 3.0, { expr: 'shock', L: 'cheek', R: 'hang', facing: 0.4, s: 0.8 }, [], { s: 0.78 })] }));
// 9a "Guards watch it day..."  wide: two guards flank the lever, folk pass by
shot(12.5, (t, d) => ({ preset: 'day', cam: [0.4, 2.3, 8.6], look: [0, 1.6, 0], fov: 46, focus: 8, cinf: 2, orbit: 0.1 - t * 0.08,
  actors: [act('tguard', 1.7, 0, 1.2, { expr: 'stern', L: 'hang', R: 'spear', facing: 0 }), act('tguard', -1.7, 0, 1.2, { expr: 'stern', L: 'hang', R: 'spear', facing: 0 }), act('lady', -5 + t * 2.2, 0, 5, { expr: 'smile', L: 'hang', R: 'hang', ...walk(t) }), act('gent', 5 - t * 2.0, 0, 4.4, { expr: 'neutral', L: 'hang', R: 'hang', ...walk(t + 0.3) })] }));
// 9b "...and night."  same, at night: lanterns, lit windows, stars
shot(13.45, (t, d) => ({ preset: 'night', cam: [-0.6, 2.2, 8.2], look: [0, 1.6, 0], fov: 46, focus: 8, cinf: 2, orbit: -0.05 + t * 0.06,
  actors: [act('tguard', 1.7, 0, 1.2, { expr: 'dazed', L: 'hang', R: 'spear', facing: 0, blink: 0.5 }), act('tguard', -1.7, 0, 1.2, { expr: 'stern', L: 'hang', R: 'spear', facing: 0, blink: blink(t, 3) })] }));
// 10 "But Nora thinks it's ridiculous."  Nora, eyes rolling, arms crossed
shot(14.95, (t, d) => ({ preset: 'day', cam: L3([3.9, 1.6, 7.6], [3.7, 1.6, 7.1], ez(t / d)), look: [3.0, 1.45, 5.0], fov: 42, focus: 2.6, cinf: 4,
  actors: [act('nora', 3.0, 0, 5.0, { expr: t > 0.6 ? 'stubborn' : 'neutral', L: 'cross', R: 'cross', facing: -0.2, look: t > 0.6 ? -0.8 : 0, headTilt: t > 0.6 ? 10 : 0 }, [], { s: 0.82 }), fx(sign(t, '?'), 3.5, 2.0, 5.0, 0.28)] }));
// 11 "So she digs through her grandpa's attic,"  attic: she hurls boxes aside, dust
shot(16.95, (t, d) => ({ preset: 'attic', cam: L3([-299.0, 1.5, 2.8], [-299.2, 1.45, 2.4], ez(t / d)), look: [-300.1, 1.0, -0.6], fov: 48, focus: 3, cinf: 3, dust: [{ p: [-300.2, 0.4, -0.6], w: 1.5, h: 1, s: 0.6, k: 0.3 }], dustN: 14, motes: true,
  actors: [act('nora', -300.4, 0, -0.1, { expr: 'stubborn', L: { a: 80 + wig(t, 10, 40), e: 30 }, R: { a: 70 - wig(t, 10, 40), e: 40 }, facing: 0.2, tilt: wig(t, 10, 6) }, [], { s: 0.82 })] }));
// 12 "and finds the founders' map."  she holds it up; light bursts
shot(18.85, (t, d) => ({ preset: 'attic', cam: L3([-299.6, 1.45, 2.2], [-299.7, 1.4, 1.8], ez(t / d)), look: [-300.2, 1.25, -0.1], fov: 44, focus: 2.2, cinf: 4, motes: true,
  actors: [act('nora', -300.2, 0, -0.1, { expr: 'shock', L: { a: 70, e: 60, front: true }, R: { a: 70, e: 60, front: true }, facing: 0 }, [{ kind: 'map' }], {}, t), fx(burst(t, '#ffe8a0'), -300.2, 0.9, -0.2, 0.7)] }));
// 13 "The streets aren't streets."  the map itself, close
shot(20.8, (t, d) => ({ preset: 'attic', cam: L3([-300.0, 1.6, 1.15], [-300.0, 1.55, 0.95], ez(t / d)), look: [-300.0, 1.45, 0], fov: 44, focus: 1.1, cinf: 2, actors: [fx(mapCard(0, t), -300.0, 0.3, 0, 1.0, { order: 2 })] }));
// 14 "They're drains."  arrows of water flow appear on the map
shot(22.7, (t, d) => ({ preset: 'attic', cam: [-300.0, 1.5, 0.95], look: [-300.0, 1.4, 0], fov: 44, focus: 1.0, cinf: 2, actors: [fx(mapCard(ez(rg(t, 0, 1.0)), t), -300.0, 0.3, 0, 1.0, { order: 2 })] }));
// 15 "Oakvale sits right on top of a dried-up river."  from the hills: the dry riverbed runs straight into town
shot(24.05, (t, d) => ({ preset: 'day', cam: L3([6, 18, -150], [4, 22, -130], ez(t / d)), look: [0, 0, -20], fov: 48, focus: 80, cinf: 0, shadowExt: 80 }));
// 16 "She shows the mayor."  office: Nora thrusts the map at the mayor
shot(27.1, (t, d) => ({ preset: 'office', cam: L3([200.9, 1.5, 3.5], [200.7, 1.5, 3.1], ez(t / d)), look: [200.0, 1.4, -0.3], fov: 46, focus: 3, cinf: 3,
  actors: [act('mayor', 200.0, 0, -1.0, { expr: 'squint', L: 'hip', R: 'hang', facing: 0.2, blink: blink(t, 2) }), act('nora', 200.6, 0, 0.9, { expr: talkE(t, 'stubborn'), L: { a: 75, e: 60, front: true }, R: { a: 75, e: 60, front: true }, facing: -0.4 }, [{ kind: 'map' }], { s: 0.82 }, t)] }));
// 17 "He laughs her out of the room."  big laugh; she slides out of frame, deflated
shot(28.45, (t, d) => ({ preset: 'office', cam: [200.3, 1.55, 3.5], look: [200.0, 1.45, -0.3], fov: 48, focus: 3, cinf: 3,
  actors: [act('mayor', 200.0, 0, -1.0, { expr: 'laugh', L: 'belly', R: 'point', facing: 0.3, bob: Math.abs(Math.sin(t * 13)) * 0.025 }), act('nora', 200.6 + ei2(t) * 2.2, 0, 0.9, { expr: 'pained', L: 'hang', R: 'hang', facing: 0.4, ...walk(t, 2.2, 10) }, [], { s: 0.82 }), fx(word('HA')(t), 200.0, 2.1, -1.1, 0.7)] }));
// 18 "Then one spring,"  black clouds roll over the town
shot(30.35, (t, d) => ({ preset: 'storm', cam: L3([30, 30, 70], [26, 26, 62], ez(t / d)), look: [0, 2, 0], fov: 48, focus: 60, cinf: 0, windows: 1.0, shadowExt: 60 }));
// 19 "it rains for nine days straight."  rain on the plaza, splashes, guards soaked; lightning
shot(31.75, (t, d) => ({ preset: 'storm', cam: L3([1.4, 1.7, 7.6], [1.2, 1.7, 7.0], ez(t / d)), look: [0, 1.5, 1.2], fov: 46, focus: 6, cinf: 2, rain: true, splashAt: [0, 0, 4], tag: '9 DAYS', windows: 1.2,
  flash: t > 1.3 && t < 1.45 ? 0.5 : 0, bolt: t > 1.3 && t < 1.5 ? [-14, 30, -60] : null,
  actors: [act('tguard', 1.7, 0, 1.2, { expr: 'pained', L: 'hang', R: 'spear', facing: 0, sweat: 2 }), act('tguard', -1.7, 0, 1.2, { expr: 'dazed', L: 'hang', R: 'spear', facing: 0 })] }));
// 20 "Up in the hills, the old river wakes up."  water floods down the dry bed between the hills
shot(34.4, (t, d) => ({ preset: 'storm', cam: [12, 8, -230], look: [0, 0, -290], fov: 48, focus: 40, cinf: 0, rain: true, river: lerp(-330, -240, ez(t / d)), flash: t > 0.8 && t < 0.95 ? 0.5 : 0, bolt: t > 0.8 && t < 1.0 ? [20, 40, -330] : null, shadowExt: 60 }));
// 21 "A wall of water"  low on the riverbed: the wave towers toward us
shot(37.05, (t, d) => ({ preset: 'storm', cam: [3, 1.6, -150], look: [0, 4, -200], fov: 50, focus: 30, cinf: 0, rain: true, wave: lerp(-235, -175, ez(t / d)), river: -175, shake: 0.06, dust: [{ p: [0, 0.4, -178], w: 20, h: 3, s: 3, k: 0.45, col: '#e8f0ff' }], dustN: 20 }));
// 22 "roars straight at the town."  chasing the wave toward the spiral
shot(38.4, (t, d) => { const z = lerp(-150, -95, t / d); return { preset: 'storm', cam: [8, 16, z - 30], look: [0, 0, z + 40], fov: 50, focus: 60, cinf: 0, rain: true, wave: z, river: z, windows: 1.2, shadowExt: 60 }; });
// 23 "Everyone runs."  townsfolk scatter across the wet plaza
shot(40.1, (t, d) => ({ preset: 'storm', cam: [0.8, 2.0, 9.4], look: [0, 1.4, 2], fov: 50, focus: 6, cinf: 2, rain: true, splashAt: [0, 0, 4], windows: 1.2,
  actors: FOLK.slice(0, 6).map((w, i) => act(w, (i % 2 ? 1 : -1) * (-2.6 + t * 4.0 + i * 0.3), 0, 3.2 + i * 0.7, { expr: 'shock', L: 'up', R: 'up', ...walk(t + i * 0.2, 3, 26), flip: i % 2 === 0 }, [], { flip: i % 2 === 0 })) }));
// 24 "Nora runs the other way,"  yellow raincoat, running straight at the camera (to the lever)
shot(41.5, (t, d) => ({ preset: 'storm', cam: L3([0.3, 1.3, 10.2], [0.3, 1.3, 9.6], t / d), look: [0, 1.1, 6.2], fov: 46, focus: 2.6, cinf: 3, rain: true, splashAt: [0, 0, 8], windows: 1.2,
  actors: [act('norarain', 0.0, 0, lerp(5.0, 7.6, t / d), { expr: 'stubborn', L: { a: 40 + wig(t, 14, 30), e: 60 }, R: { a: 40 - wig(t, 14, 30), e: 60 }, ...walk(t, 3, 26) }, [], { s: 0.82 }), act('civA', 2.4, 0, 3.0 - t * 2, { expr: 'shock', L: 'up', R: 'up', ...walk(t, 3, 26) })] }));
// 25 "right past the guards,"  she darts between the two guards; they gape
shot(42.9, (t, d) => ({ preset: 'storm', cam: [0.2, 1.1, 5.4], look: [0, 1.3, 1.2], fov: 50, focus: 3, cinf: 3, rain: true,
  actors: [act('tguard', 0.85, 0, 2.9, { expr: 'shock', L: 'cheek', R: 'spear', facing: -0.4 }), act('tguard', -0.85, 0, 2.9, { expr: 'shock', L: 'hang', R: 'up', facing: 0.4 }), act('norarain', 0.0, 0, lerp(4.4, 2.7, ez(t / d)), { expr: 'stubborn', L: 'reach', R: 'reach', lift: 0.6, ...walk(t, 3, 26) }, [], { s: 0.82, flip: true })] }));
// 26 "and yanks the lever."  macro: the rusty lever slams over, sparks
shot(44.1, (t, d) => { const k = eo(rg(t, 0.15, 0.55)); return { preset: 'storm', cam: [3.6, 2.2, 3.8], look: [0.8, 2.1, 0.3], fov: 46, focus: 2, cinf: 3, rain: true, lever: lerp(-0.5, 1.05, k), sparks: k > 0.3 && t < 0.9 ? [0, 1.5, 0.1] : null, flash: t > 0.5 && t < 0.6 ? 0.35 : 0, shake: k > 0.95 ? 0.05 : 0,
  actors: [act('norarain', 1.55, 0, 0.95, { expr: 'stubborn', L: { a: 150 - k * 80, e: 10 }, R: { a: 150 - k * 80, e: 10 }, facing: -0.3, tilt: -k * 10 }, [], { s: 0.82 })] }; });
// 27 "Deep underground,"  the cavern: dust sifts, everything shakes
shot(45.6, (t, d) => ({ preset: 'cave', cam: L3([300.5, 2.2, 10], [300.4, 2.4, 9], ez(t / d)), look: [300, 3, -5], fov: 50, focus: 12, cinf: 1, shake: 0.04, dust: [{ p: [300, 6, -3], w: 8, h: -3, s: 0.8, k: 0.35, col: '#c8c0b8' }], dustN: 20 }));
// 28 "giant stone gates grind open."  the gates slide apart, water bursts through
shot(46.9, (t, d) => ({ preset: 'cave', cam: L3([301.8, 1.6, 7], [300.8, 1.8, 6], ez(t / d)), look: [300, 3, -5.4], fov: 50, focus: 11, cinf: 1, gates: ez(rg(t, 0.2, 2.2)), lake: ez(rg(t, 1.2, 2.5)) * 0.3, shake: 0.04, dust: [{ p: [300, 0.5, -4.5], w: 6, h: 2, s: 1.2, k: 0.4, col: '#d8d0c8' }], dustN: 16 }));
// 29 "The flood hits the spiral,"  the wave reaches the outer houses; the streets begin to fill
shot(49.45, (t, d) => ({ preset: 'storm', cam: [30, 26, -40], look: [0, 0, -20], fov: 50, focus: 60, cinf: 0, rain: true, wave: lerp(-90, -68, ez(t / d)), river: -64, water: ez(t / d) * 0.3, flow: 1.4, windows: 1.2, shadowExt: 70 }));
// 30 "spins around every house"  street level: water rushing between the houses
shot(51.0, (t, d) => { const th = lerp(12.0, 10.4, t / d); return { preset: 'storm', cam: SP(th, -1.2, 1.4), look: SP(th - 0.4, 0, 0.6), fov: 52, focus: 6, cinf: 1.5, rain: true, water: 0.42, flow: 2.6, windows: 1.3, shake: 0.02 }; });
// 31 "like water down a sink,"  straight down: the whole spiral swirls inward
shot(52.3, (t, d) => ({ preset: 'storm', cam: [0.01, 95, 0.02], look: [0, 0, 0], fov: 50, roll: -t * 30, focus: 90, cinf: 0, rain: false, water: 0.45, flow: 2.6, swirl: 0.8, vortex: 0.8, windows: 1.2, shadowExt: 80 }));
// 32 "and vanishes under the square."  the whirlpool drains through the plaza grates
shot(53.7, (t, d) => ({ preset: 'storm', cam: L3([4.5, 4.2, 8.5], [3.8, 3.6, 7.4], ez(t / d)), look: [0, 0, 0], fov: 50, focus: 8, cinf: 1.5, water: lerp(0.4, 0.05, ez(t / d)), flow: 2, vortex: lerp(1, 0.2, ez(t / d)), windows: 1.0 }));
// 33 "Not one house floods."  sun breaks through; doors open, people step out, dry
shot(55.65, (t, d) => { const [x, , z] = SP(3.2, 4.6); const [hx, , hz] = SP(3.2, 7.0); return { preset: 'day', cam: [x + 2.2, 1.6, z + 4.2], look: [hx, 1.4, hz], fov: 48, focus: 5, cinf: 2, rays: 0.8,
  actors: [act('civB', hx + 0.8, 0, hz + 1.6, { expr: 'laugh', L: 'up', R: 'up', facing: 0.2 }), act('civA', hx - 1.4, 0, hz + 2.0, { expr: 'grin', L: 'thumb', R: 'hang', facing: 0.3 }), act('civC', hx + 2.6, 0, hz + 2.4, { expr: 'smile', L: 'wave', R: 'hang', wv: t * 8 }, [], { s: 0.8 })] }; });
// 34 "You see,"  Nora, soaked, beaming
shot(57.85, (t, d) => ({ preset: 'day', cam: [0.7, 1.4, 5.0], look: [0.4, 1.25, 2.7], fov: 42, focus: 2.4, cinf: 4, actors: [act('norarain', 0.4, 0, 2.7, { expr: 'smile_closed', L: 'hip', R: 'thumb', facing: 0.1 }, [], { s: 0.82 })] }));
// 35 "the founders never fought the river."  the bronze founders' statue, sunlit
shot(58.4, (t, d) => ({ preset: 'day', cam: L3([-4.4, 2.1, -0.4], [-4.6, 2.2, -0.8], ez(t / d)), look: [-6.2, 2.3, -3.8], fov: 46, focus: 3.6, cinf: 3, rays: 0.9, motes: true,
  actors: [-0.8, 0, 0.8].map((dx, i) => act('bronze', -6.2 + dx, 1.0, -3.8 - (i === 1 ? 0.2 : 0), { expr: 'stern', L: i === 1 ? { a: 160, e: 0, finger: true } : 'hip', R: i === 0 ? 'point' : 'hang', facing: (i - 1) * 0.3 }, [], { s: 0.95, tint: '#ffd8a0', blob: false })) }));
// 36 "They built the town to swallow it."  the hidden lake under the square, full and glittering
shot(60.65, (t, d) => ({ preset: 'cave', cam: L3([296, 2.6, 14], [298, 3.2, 12], ez(t / d)), look: [300, 0, 0], fov: 50, focus: 14, cinf: 0.5, gates: 1, lake: 0.9, motes: true }));
// 37 "And here's the crazy part."  the mayor, very sheepish
shot(62.85, (t, d) => ({ preset: 'day', cam: L3([3.9, 1.85, 4.8], [3.8, 1.85, 4.4], ez(t / d)), look: [3.4, 1.75, 2.6], fov: 42, focus: 2.2, cinf: 4,
  actors: [act('mayor', 3.4, 0, 2.6, { expr: 'nervous', L: 'temple', R: 'hang', facing: -0.2, sweat: 3, swirl: t * 6 })] }));
// 38 "The rule was never 'don't pull it.'"  Nora wipes the moss off the sign
shot(64.3, (t, d) => ({ preset: 'day', cam: L3([0.9, 1.55, 5.2], [0.75, 1.5, 4.8], ez(t / d)), look: [0.3, 1.35, 2.25], fov: 46, focus: 2.6, cinf: 3, signK: lerp(0, 0.35, ez(t / d)),
  actors: [act('norarain', 0.6, 0, 2.6, { expr: 'smile', L: 'hang', R: { a: 100 + wig(t, 9, 20), e: 30 }, facing: -0.5 }, [], { s: 0.82 })] }));
// 39 "It was 'don't pull it,"  more of the hidden line appears
shot(66.55, (t, d) => ({ preset: 'day', cam: [0.15, 1.42, 3.6], look: [0, 1.35, 2.25], fov: 42, focus: 1.4, cinf: 2, signK: lerp(0.35, 0.75, ez(t / d)), actors: [fx(burst(t, '#ffe8a0'), 0.5, 0.6, 2.3, 0.4)] }));
// 40 "until you need it."  the full sign, Nora's thumbs-up, crane up to a rainbow over Oakvale
shot(68.1, (t, d) => { const k = ez(t / d); return { preset: 'day', cam: L3([1.4, 1.6, 5.6], [4.5, 5.5, 15], k), look: L3([0, 1.4, 2.2], [0, 4, -30], k), fov: 48, focus: 6, cinf: 1, signK: 1, rainbow: true, rays: 1.0,
  actors: [act('norarain', 0.9, 0, 2.7, { expr: 'grin', L: 'thumb', R: 'hip', facing: 0.2 }, [], { s: 0.82 }), act('tguard', -1.0, 0, 2.6, { expr: 'smile', L: 'hang', R: 'spear', facing: 0.3 })] }; });

function ei2(t) { return Math.pow(cl(t / 1.4), 2); }
export const CUTS = SH.map((s) => s.t0);
export const stateAt = (f) => { const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--; const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0; const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i; return S; };
