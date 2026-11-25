// Honey Knight: full shot plan (71.4 s, 30 fps). Reference pacing: cut every ~1.5 s, camera always moving, close-ups, every line acted.
import * as T from './toon.js';
const FPS = 30; export const TOTAL = Math.ceil(71.6 * FPS);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)); const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t)); const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); }; const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const talkE = (t, e) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(e, 'o') : e);
const U = 2.36;
const prop = (p, pr, h, t) => { const [x, y] = h;
  if (pr.kind === 'jar') T.propHoney(p, x, y + 10, U * 1.3);
  if (pr.kind === 'dipper') T.propDipper(p, x, y, U * 1.2, 1); };
const life = (t, seed = 1) => ({ bob: 0.006 * Math.sin((t * 30 + seed * 11) * 0.11), headTilt: 2 * Math.sin(t * 1.6 + seed), blink: ((t * 30 + seed * 13) % (40 + seed * 7)) < 3 ? 1 : 0 });
const C = (who, o = {}, props = [], t = 0, seed = 1) => (p) => { const out = {}; const oo = { ...life(t, seed), ...o }; if (o.talk) oo.expr = talkE(t, o.expr || 'smile'); T.romanFront(p, who, { ...oo, out }); for (const pr of props) prop(p, pr, out.hands[pr.hand ?? 1], t); };
let SEED = 1; const act = (who, x, y, z, o = {}, props = [], extra = {}, t = 0) => ({ x, y, z, draw: C(who, o, props, t, (SEED = (SEED % 7) + 1)), ...extra });
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const swarm = (t, n = 30, r = 230, cy = 500, sz = 0.8) => (p) => T.fxSwarm(p, t, n, 300, cy, r, sz);
const pop = (txt) => (t) => (p) => { const g = p.g, k = T.OUTFITS ? (1 - Math.pow(1 - cl(t * 4), 3)) * (1 + 0.12 * Math.sin(cl(t * 4) * Math.PI)) : 1; g.save(); g.translate(300, 190); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); g.rotate(-0.03); g.font = '900 70px Arial Black, Arial'; const w = g.measureText(txt).width + 60;
  g.fillStyle = '#1a1414'; g.beginPath(); g.roundRect(-w / 2 + 6, -54 + 8, w, 108, 18); g.fill(); g.fillStyle = '#ffffff'; g.strokeStyle = '#1a1414'; g.lineWidth = 8; g.beginPath(); g.roundRect(-w / 2, -54, w, 108, 18); g.fill(); g.stroke();
  g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#3a1a04'; g.strokeText(txt, 0, 25); const gr = g.createLinearGradient(0, -28, 0, 26); gr.addColorStop(0, '#fff6a0'); gr.addColorStop(0.45, '#ffd21a'); gr.addColorStop(1, '#e88a00'); g.fillStyle = gr; g.fillText(txt, 0, 25);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-w / 2 + 30, -40, w - 60, 6); g.restore(); };
const popA = (txt, t) => fx(pop(txt)(t), 0, 0, 0, 0.36, { hud: { d: 1.2, up: -0.36 }, order: 9 });
const star = (t, col = '#fff6c0') => (p) => T.fxBurst(p, cl(t * 3), col, 12, 40, 260);
const KN = (k = 1, cuffs = true) => ({ ...T.OUTFITS.prisoner, legs: lerp(1.72, 0.55, k), cuffs });
const FREE = { ...T.OUTFITS.prisoner, cuffs: false };
const PZ = -1.05, GZ = -2.0, X0 = 100, SX = 50, HX = -50;
const guards = (t, ea = 'pained', eb = 'nervous', gy = -0.5, o = {}, ob = {}) => [act('guardA', -0.62, gy, GZ, { expr: ea, ...o }, [], {}, t), act('guardB', 0.66, gy, GZ - 0.05, { expr: eb, ...ob }, [], {}, t)];
const push = (t, d, a, b) => L3(a, b, ez(t / d)); const snap = (t, a, b, k = 0.2) => L3(a, b, eo(t / k));
const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });

// ---------- DUNGEON ----------
// 1 "Every morning, this prisoner pours honey..."  close, honey drips, push-in
shot(0.0, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [0.3, 1.72, 0.55], [0.12, 1.68, 0.2]), look: [0.05, 1.6, PZ], fov: 46,
  actors: [...guards(t, 'pained', 'nervous', -0.1), act('prisoner', 0, 0.05, PZ, { expr: 'squint', honey: cl(0.3 + t * 0.4), L: { a: 40, e: 60 }, R: { a: 150 + Math.sin(t * 5) * 8, e: 30 } }, [{ kind: 'jar', hand: 0 }, { kind: 'dipper', hand: 1 }], {}, t)] }));
// 2 macro: honey running down the shoulder, pull-out
shot(1.3, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [0.2, 1.55, -0.05], [0.18, 1.6, 0.35]), look: [0.12, 1.5, PZ], fov: 42,
  actors: [...guards(t, 'pained', 'nervous', -0.1), act('prisoner', 0, 0.05, PZ, { expr: 'squint', honey: cl(0.6 + t * 0.4), L: { a: 40, e: 60 }, R: { a: 150, e: 30 } }, [{ kind: 'jar', hand: 0 }, { kind: 'dipper', hand: 1 }], {}, t)] }));
// 3 "The guards beg him to stop."  over-the-shoulder at the begging guards
shot(2.59, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [0.1, 1.95, -4.1], [0.05, 1.92, -3.8]), look: [0.05, 1.75, GZ], fov: 50,
  actors: [act('guardA', -0.45, 0, GZ, { expr: 'pained', talk: true, L: 'up', R: 'up' }, [], {}, t), act('guardB', 0.55, 0, GZ - 0.05, { expr: 'nervous', talk: true, L: 'up', R: 'up' }, [], {}, t),
    act('prisoner', -0.1, 0.05, PZ, { expr: 'squint', honey: 1 }, [], {}, t)] }));
// 4 "The whole cell gets sticky,"  wide cell with skylight, honey puddle, guard's boot stuck
shot(4.18, (t, d) => ({ preset: 'dungeon', puddle: 1, cam: push(t, d, [1.6, 2.4, 2.6], [1.3, 2.2, 2.0]), look: [0.1, 1.4, -1.0], fov: 54,
  actors: [...guards(t, 'pained', 'stubborn', 0), act('prisoner', 0, 0.05, PZ, { expr: 'smile', honey: 1, L: { a: 40, e: 60 }, R: 'hip' }, [{ kind: 'jar', hand: 0 }], {}, t)] }));
// 5 "and he just smiles."  snap close on the grin
shot(6.10, (t, d) => ({ preset: 'dungeon', cam: snap(t, [0.1, 1.7, 0.2], [0.03, 1.72, -0.05], 0.25), look: [0, 1.7, PZ], fov: 42,
  actors: [...guards(t, 'pained', 'nervous', -0.15), act('prisoner', 0, 0.05, PZ, { expr: 'grin', honey: 1, L: 'hip', R: 'hip', blink: 0 }, [], {}, t)] }));
// 6 "Then he kneels and waits,"  he kneels, camera follows down
shot(7.72, (t, d) => { const k = ez((t - 0.2) / 0.6); return { preset: 'dungeon', cam: L3([0.15, 1.7, 0.4], [0.05, 1.2, 0.35], ez(t / d)), look: [0, lerp(1.6, 1.1, k), PZ], fov: 46,
  actors: [...guards(t, 'squint', 'nervous', lerp(-0.1, -0.5, k)), act(KN(k), 0, 0.05, PZ, { expr: 'smile_closed', honey: 1, L: 'hip', R: 'hip' }, [], {}, t)] }; });
// 7 "perfectly still,"  dead-centre, very slow push
shot(9.31, (t, d) => ({ preset: 'dungeon', handheld: 0, cam: push(t, d, [0, 1.15, 0.55], [0, 1.15, 0.3]), look: [0, 1.1, PZ], fov: 44,
  actors: [...guards(t, 'squint', 'squint', -0.5), act(KN(1), 0, 0.05, PZ, { expr: 'smile_closed', honey: 1, L: 'hip', R: 'hip', bob: 0, headTilt: 0, blink: 0 }, [], {}, t)] }));
// 8 "while every fly in the castle..."  low angle up at the skylight, flies pour down
shot(11.29, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [0.5, 0.9, 0.4], [0.4, 1.0, 0.2]), look: [0, 4.2, -0.8], fov: 56,
  actors: [act(KN(1), 0, 0.05, PZ, { expr: 'smile_closed', honey: 1 }, [], {}, t), ...[0, 1, 2].map((i) => fx(swarm(t + i, 18, 260, 500, 0.9), (i - 1) * 0.3, 3.9 - ((t * 1.2 + i * 0.4) % 1.6), -0.75, 0.9, { face: true }))] }));
// 9 "...shows up for breakfast."  flies land on the shoulders, push in
shot(12.75, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [0.06, 1.18, 0.6], [0.02, 1.15, 0.25]), look: [0, 1.08, PZ], fov: 46,
  actors: [...guards(t, 'pained', 'shock', -0.5), act(KN(1), 0, 0.05, PZ, { expr: 'smile_closed', honey: 1, flies: Math.min(18, 2 + Math.floor(t * 8)), flyT: t, L: 'hip', R: 'hip' }, [], {}, t), fx(swarm(t, 10, 300, 300, 0.7), 0, 0.9, PZ + 0.2, 0.9)] }));
// 10 "Why your shoulders?"  guard close, talking, through the bars
shot(15.15, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [0.55, 1.95, -3.75], [0.6, 1.92, -3.45]), look: [0.66, 1.85, GZ], fov: 44,
  actors: [act('guardB', 0.66, 0, GZ, { expr: 'pained', talk: t > 0.5, L: 'shrug', R: 'shrug' }, [], {}, t), act('guardA', -0.3, 0, GZ - 0.2, { expr: 'nervous' }, [], {}, t)] }));
// 11 "a guard moans."  guard face-palm (temple), snap zoom
shot(17.27, (t, d) => ({ preset: 'dungeon', cam: snap(t, [-0.5, 1.92, -3.9], [-0.55, 1.9, -3.5], 0.2), look: [-0.62, 1.85, GZ], fov: 44, roll: 4,
  actors: [act('guardA', -0.62, 0, GZ, { expr: 'pained', R: 'temple', swirl: t * 6, sweat: 1 }, [], {}, t), act('guardB', 0.4, 0, GZ - 0.1, { expr: 'squint' }, [], {}, t)] }));
// 12 "A fly walks right across his nose."  macro on the face, one fly crosses the nose
shot(18.58, (t, d) => ({ preset: 'dungeon', handheld: 0.004, cam: push(t, d, [0, 1.18, 0.15], [0, 1.18, -0.05]), look: [0, 1.15, PZ], fov: 42,
  actors: [...guards(t, 'shock', 'shock', -0.5), act(KN(1), 0, 0.05, PZ, { expr: 'smile_closed', honey: 1, flies: 18, flyT: t, noseFly: true, noseX: lerp(-40, 40, cl(t / d)), bob: 0, headTilt: 0, blink: 0 }, [], {}, t)] }));
// 13 "He doesn't even blink."  extreme close, dead still
shot(21.12, (t, d) => ({ preset: 'dungeon', handheld: 0, cam: push(t, d, [0, 1.2, -0.12], [0, 1.2, -0.2]), look: [0, 1.18, PZ], fov: 40,
  actors: [act(KN(1), 0, 0.05, PZ, { expr: 'smile_closed', honey: 1, flies: 18, flyT: t, noseFly: true, noseX: 0, bob: 0, headTilt: 0, blink: 0 }, [], {}, t)] }));
// 14 "That's it."  the captain bursts in, snap zoom, dutch
shot(22.69, (t, d) => ({ preset: 'dungeon', cam: snap(t, [0.9, 1.6, 1.0], [0.55, 1.6, 0.6], 0.18), look: [0.5, 1.55, PZ], fov: 50, roll: -9, shake: t < 0.3 ? 0.03 : 0,
  actors: [act('warden', 0.55, 0.05, PZ - 0.1, { expr: 'stern', talk: true, R: 'point', L: 'hip' }, [], { s: 1.05 }, t), act(KN(1), -0.5, 0.05, PZ + 0.15, { expr: 'squint', honey: 1, flies: 14, flyT: t }, [], {}, t)] }));
// 15 "The captain rips the honey jar out of his hands" + NO MORE HONEY!
shot(23.54, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [0.3, 1.6, 1.7], [0.25, 1.58, 1.3]), look: [0.3, 1.45, PZ], fov: 54, roll: -8, shake: t > 0.3 && t < 0.6 ? 0.02 : 0,
  actors: [act('guardA', -1.2, 0, GZ, { expr: 'shock' }, [], {}, t), act('warden', 0.5, 0.05, PZ - 0.15, { expr: 'stern', talk: true, R: t < 0.4 ? 'reach' : 'up', lift: 0.2 }, t < 0.4 ? [] : [{ kind: 'jar', hand: 1 }], { s: 1.05 }, t),
    act(KN(1), -0.55, 0.05, PZ + 0.1, { expr: t < 0.4 ? 'squint' : 'shock', honey: 1, flies: 14, flyT: t, R: t < 0.4 ? 'reach' : 'hang' }, t < 0.4 ? [{ kind: 'jar', hand: 1 }] : [], {}, t), ...(t > 0.45 ? [popA('NO MORE HONEY!', t - 0.45)] : [])] }));
// 16 "...and storms off with it."  he marches to the cell door, flies lift off the shoulders
shot(25.3, (t, d) => { const x = lerp(0.5, 2.4, ez(t / d)); return { preset: 'dungeon', cam: push(t, d, [0.2, 1.5, 1.6], [0.9, 1.5, 1.4]), look: [x - 0.3, 1.4, PZ], fov: 52,
  actors: [act('warden', x, 0.05, PZ - 0.1, { expr: 'stubborn', R: 'up', step: (t * 2.2) % 1, stride: 16 }, [{ kind: 'jar', hand: 1 }], { s: 1.05, flip: true }, t), act(KN(1), -0.55, 0.05, PZ + 0.1, { expr: 'squint', honey: 1, flies: 10, flyT: t }, [], {}, t),
    fx(swarm(t, 26, 220, 500, 0.8), lerp(-0.4, x - 0.3, ez(t / d)), 0.7, PZ + 0.2, 1.0)] }; });
// 17 "But the flies follow the honey."  the swarm streams after the jar
shot(27.31, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [-0.2, 1.3, 0.8], [0.4, 1.4, 0.6]), look: [0.8, 1.3, PZ], fov: 52,
  actors: [act(KN(1), -0.4, 0.05, PZ, { expr: 'smile_closed', honey: 1, flies: Math.max(2, 14 - Math.floor(t * 10)), flyT: t }, [], {}, t), ...[0, 1, 2].map((i) => fx(swarm(t + i * 3, 16, 200, 500, 0.75), lerp(-0.3, 2.4, cl(t / d * 0.9 + i * 0.12)), 0.6 + i * 0.25, PZ + 0.2, 0.8))] }));
// ---------- STAIRS + HALL ----------
const stairY = (z) => cl(-z / 3.6) * 2.4;
// 18 "Up the stairs,"  low angle, the captain climbs with the swarm behind
shot(29.16, (t, d) => { const z = lerp(0.6, -2.4, ez(t / d)); return { preset: 'stairs', cam: push(t, d, [SX + 0.6, 0.5, 2.6], [SX + 0.5, 0.7, 2.2]), look: [SX, stairY(z) + 1.2, z], fov: 56,
  actors: [act('warden', SX, stairY(z), z, { expr: 'stubborn', R: 'up', step: (t * 2.4) % 1, stride: 16 }, [{ kind: 'jar', hand: 1 }], { s: 1.0, yaw: Math.PI }, t), fx(swarm(t, 30, 240, 500, 0.85), SX + 0.1, stairY(z + 1.2) + 0.6, z + 1.2, 1.1)] }; });
// 19 "down the hall,"  tracking shot down the lantern-lit hall
shot(30.6, (t, d) => { const z = lerp(-5, -10, ez(t / d)); return { preset: 'stairs', cam: [SX + 0.4, 3.8, z + 3.2], look: [SX, 3.5, z - 2], fov: 52,
  actors: [act('warden', SX - 0.1, 2.42, z, { expr: 'stubborn', R: 'up', step: (t * 2.4) % 1, stride: 16 }, [{ kind: 'jar', hand: 1 }], { s: 1.0 }, t), fx(swarm(t, 34, 260, 500, 0.85), SX + 0.2, 3.0, z + 1.4, 1.2)] }; });
// ---------- THRONE ROOM ----------
// 20 "and straight into the royal feast."  wide feast, swarm bursts in
shot(31.8, (t, d) => ({ preset: 'throne', cam: push(t, d, [X0 + 0.5, 2.6, 4.6], [X0 + 0.2, 2.3, 3.6]), look: [X0, 1.6, -2.4], fov: 52,
  actors: [act('king', X0 - 1.2, 0.05, -3.0, { expr: 'smile', L: 'belly', R: 'hang', talk: true }, [], { s: 1.05 }, t), act('queen', X0 + 1.2, 0.05, -3.0, { expr: 'smile_closed', R: 'cheek' }, [], {}, t),
    act('guardA', X0 - 3.2, 0, -2.6, { expr: 'neutral' }, [], {}, t), act('guardB', X0 + 3.2, 0, -2.6, { expr: 'neutral' }, [], {}, t), fx(swarm(t, 40, 280, 450, 0.8), lerp(X0 + 2.5, X0, ez(t / d)), lerp(2.6, 1.3, ez(t / d)), lerp(2.5, -1.5, ez(t / d)), 1.4)] }));
// 21 "Into the king's soup."  soup macro, flies drop in, the king's face above
shot(33.20, (t, d) => ({ preset: 'throne', cam: push(t, d, [X0 - 1.3, 1.6, -0.2], [X0 - 1.32, 1.55, -0.5]), look: [X0 - 1.3, 1.55, -2.4], fov: 48,
  actors: [act('king', X0 - 1.25, 0.05, -2.4, { expr: t > 0.5 ? 'shock' : 'smile' }, [], { s: 1.05 }, t), fx(swarm(t, 14, 160, 600, 0.7), X0 - 1.4, 1.0, -1.35, 0.5)] }));
// 22 "Into the queen's hair."  queen close, flies buzz in her wig
shot(34.63, (t, d) => ({ preset: 'throne', cam: snap(t, [X0 + 1.1, 2.1, -1.2], [X0 + 1.15, 2.05, -1.6], 0.2), look: [X0 + 1.2, 2.0, -3.0], fov: 44,
  actors: [act('queen', X0 + 1.2, 0.05, -3.0, { expr: 'shock', L: 'temple', R: 'temple', sweat: 1 }, [], {}, t), fx(swarm(t, 18, 200, 300, 0.75), X0 + 1.2, 1.9, -2.9, 0.7)] }));
// 23 "And the king hates flies more than anything."  low angle push on the furious king
shot(36.25, (t, d) => ({ preset: 'throne', cam: push(t, d, [X0 - 0.9, 1.3, -0.6], [X0 - 1.0, 1.45, -1.2]), look: [X0 - 1.2, 2.0, -3.0], fov: 46, roll: 5,
  actors: [act('king', X0 - 1.2, 0.05, -3.0, { expr: 'stern', L: 'fist', R: 'fist', sweat: 0 }, [], { s: 1.05 }, t), fx(swarm(t, 14, 260, 300, 0.7), X0 - 1.0, 1.9, -2.5, 0.8)] }));
// 24 "He swings his sword so wildly..."  sword swings, shake
shot(39.04, (t, d) => ({ preset: 'throne', cam: push(t, d, [X0 - 0.5, 1.9, 0.5], [X0 - 0.7, 1.85, 0.1]), look: [X0 - 0.9, 1.75, -2.6], fov: 48, roll: Math.sin(t * 4) * 6, shake: 0.02,
  sword: { p: [X0 - 0.5, 2.2, -2.5], rz: -0.9 + Math.sin(t * 11) * 0.9 },
  actors: [act('king', X0 - 0.85, 0.05, -2.6, { expr: 'stern', talk: true, R: 'up', L: 'fist' }, [], { s: 1.05 }, t), fx(swarm(t, 22, 240, 380, 0.75), X0 - 0.5, 1.3, -2.0, 1.0)] }));
// 25 "...he chops his own dinner in half."  the roast splits, snap zoom + flash
shot(40.9, (t, d) => ({ preset: 'throne', cutRoast: ez((t - 0.25) / 0.25), flash: t > 0.22 && t < 0.32 ? 0.35 : 0, shake: t > 0.22 && t < 0.6 ? 0.03 : 0, cam: snap(t, [X0 + 0.8, 2.0, 0.4], [X0 + 0.55, 1.85, 0.0], 0.25), look: [X0, 1.3, -1.5], fov: 46,
  sword: { p: [X0 + 0.05, lerp(3.4, 2.5, ez(t / 0.25)), -1.45], rz: Math.PI, s: 0.85 },
  actors: [act('king', X0 - 0.3, 0.05, -2.5, { expr: t > 0.4 ? 'shock' : 'stern', R: 'up' }, [], { s: 1.05 }, t), ...(t > 0.25 && t < 0.8 ? [fx(star(t - 0.25), X0, 1.0, -1.4, 0.5)] : [])] }));
// ---------- the king roars down through the grate (hatch set) ----------
// 26 "Who brought these flies?"
shot(43.05, (t, d) => ({ preset: 'dungeon', motes: false, shaft: false, cam: snap(t, [HX, 2.5, 2.6], [HX, 2.6, 1.9], 0.2), look: [HX, 2.85, 0], fov: 50, roll: 4, shake: 0.015,
  actors: [act('king', HX, 1.0, -0.55, { expr: 'stern', talk: true, L: 'fist', R: 'fist' }, [], { blob: false, s: 0.95 }, t)] }));
// 27 "he roars."  even closer, shaking
shot(44.64, (t, d) => ({ preset: 'dungeon', motes: false, shaft: false, cam: push(t, d, [HX, 2.75, 1.4], [HX, 2.78, 1.2]), look: [HX, 2.85, 0], fov: 48, roll: -3, shake: 0.03,
  actors: [act('king', HX, 1.0, -0.55, { expr: 'stern', talk: true, L: 'fist', R: 'fist' }, [], { blob: false, s: 0.95 }, t)] }));
// 28 "Everyone points down,"  throne room: everyone points at the floor grate
shot(45.63, (t, d) => ({ preset: 'throne', cam: push(t, d, [X0 + 1.2, 2.2, 4.2], [X0 + 1.4, 2.0, 3.6]), look: [X0 + 2.2, 1.0, 0.8], fov: 54,
  actors: [act('guardA', X0 + 1.4, 0, 0.2, { expr: 'stern', R: { a: 40, e: 10 }, finger: true }, [], {}, t), act('warden', X0 + 3.6, 0.05, 0.4, { expr: 'stern', L: { a: 40, e: 10 } }, [], { s: 1.05 }, t), act('queen', X0 + 2.6, 0.05, -0.6, { expr: 'stern', R: { a: 40, e: 10 } }, [], {}, t)] }));
// 29 "through the grate in the floor,"  looking down through the ceiling grate at the cell
shot(47.03, (t, d) => ({ preset: 'dungeon', shaft: false, motes: false, cam: push(t, d, [0.05, 7.2, -0.5], [0.02, 6.6, -0.6]), look: [0, 0.8, -0.7], fov: 40,
  actors: [act(KN(1), 0, 0.45, 1.2, { expr: 'smile_closed', honey: 1, flies: 2, flyT: t }, [], { face: true, s: 1.25, blob: false }, t)] }));
// 30 "at the prisoner."  he opens one eye, smug
shot(48.58, (t, d) => ({ preset: 'dungeon', cam: snap(t, [0.05, 1.2, 0.3], [0.02, 1.18, 0.0], 0.2), look: [0, 1.12, PZ], fov: 44,
  actors: [...guards(t, 'shock', 'nervous', -0.5), act(KN(1), 0, 0.05, PZ, { expr: 'squint', honey: 1, flies: 2, flyT: t, L: 'hip', R: 'hip' }, [], {}, t)] }));
// 31 "The king storms into the dungeon,"  down the stairs, sword up
shot(49.66, (t, d) => { const z = lerp(-3.0, 0.4, ez(t / d)); return { preset: 'stairs', cam: push(t, d, [SX + 0.5, 0.6, 2.8], [SX + 0.4, 0.8, 2.4]), look: [SX, stairY(z) + 1.4, z], fov: 54,
  sword: { p: [SX + 0.35, stairY(z) + 1.95, z + 0.05], rz: -0.3 },
  actors: [act('king', SX, stairY(z), z, { expr: 'stern', R: 'up', step: (t * 2.4) % 1, stride: 16 }, [], { s: 1.05 }, t), act('guardA', SX - 0.5, stairY(z - 0.8), z - 0.8, { expr: 'nervous', step: (t * 2.4 + 0.5) % 1, stride: 14 }, [], {}, t)] }; });
// 32 "...and everyone is sure..."  corridor shot: the king arrives at the cell
shot(51.6, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [0.9, 1.7, -3.9], [0.7, 1.65, -3.4]), look: [-0.2, 1.7, -2.6], fov: 52,
  sword: { p: [-0.05, 2.05, -2.65], rz: -0.25 },
  actors: [act('king', -0.4, 0, -2.7, { expr: 'stern', R: 'up', talk: true }, [], { s: 1.05 }, t), act('guardB', 0.7, 0, -2.3, { expr: 'nervous', sweat: 2 }, [], {}, t), act('warden', -1.5, 0, -3.4, { expr: 'stern' }, [], { s: 1.05 }, t)] }));
// 33 "...that man is about to lose his head."  guards gulp, sweat
shot(52.9, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [0.05, 1.9, -4.1], [0.03, 1.88, -3.8]), look: [0, 1.8, GZ], fov: 48,
  actors: [act('guardA', -0.4, 0, GZ, { expr: 'nervous', sweat: 2, L: 'cheek' }, [], {}, t), act('guardB', 0.45, 0, GZ - 0.05, { expr: 'shock', sweat: 2, R: 'cheek' }, [], {}, t)] }));
// 34 "The prisoner kneels."  OTS from behind the king, sword raised over the kneeling prisoner
shot(54.83, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [-1.0, 1.9, -0.1], [-0.85, 1.85, -0.3]), look: [0, 1.0, PZ], fov: 50,
  sword: { p: [-0.55, 1.7, PZ + 0.05], rz: -0.2 },
  actors: [act('king', -0.75, 0.05, PZ - 0.25, { expr: 'stern', R: 'up' }, [], { s: 1.05 }, t), act(KN(1), 0, 0.05, PZ, { expr: 'smile_closed', honey: 0.8, flies: 2, flyS: 1.6, flyT: t }, [], {}, t), ...guards(t, 'shock', 'shock', -0.3)] }));
// 35 "One fat fly on each shoulder."  macro across both shoulders
shot(56.20, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [0.0, 0.98, -0.15], [0.0, 1.0, -0.3]), look: [0, 0.95, PZ], fov: 46,
  actors: [act(KN(1), 0, 0.05, PZ, { expr: 'smile_closed', honey: 0.8, flies: 2, flyS: 1.7, flyT: t }, [], {}, t)] }));
// 36 "Smack, left."
shot(58.64, (t, d) => ({ preset: 'dungeon', flash: t > 0.12 && t < 0.2 ? 0.3 : 0, shake: t > 0.12 && t < 0.4 ? 0.03 : 0, cam: snap(t, [-0.1, 1.0, 0.0], [-0.12, 0.98, -0.25], 0.15), look: [-0.12, 0.92, PZ], fov: 46,
  sword: { p: [-1.25, lerp(1.5, 0.87, ez(t / 0.14)), PZ + 0.08], rz: -Math.PI / 2 + 0.08, s: 0.75 },
  actors: [act(KN(1), 0, 0.05, PZ, { expr: 'smile_closed', honey: 0.8, flies: t < 0.14 ? 2 : 1, flyS: 1.7, flyT: t }, [], {}, t), ...(t > 0.12 && t < 0.6 ? [fx(star(t - 0.12), -0.17, 0.72, PZ + 0.1, 0.35)] : [])] }));
// 37 "Smack, right."
shot(59.99, (t, d) => ({ preset: 'dungeon', flash: t > 0.12 && t < 0.2 ? 0.3 : 0, shake: t > 0.12 && t < 0.4 ? 0.03 : 0, cam: snap(t, [0.1, 1.0, 0.0], [0.12, 0.98, -0.25], 0.15), look: [0.12, 0.92, PZ], fov: 46,
  sword: { p: [-0.85, lerp(1.5, 0.87, ez(t / 0.14)), PZ + 0.08], rz: -Math.PI / 2 + 0.08, s: 0.75 },
  actors: [act({ ...KN(1) }, 0, 0.05, PZ, { expr: 'smile_closed', honey: 0.8, flies: 0, flyT: t }, [], {}, t), ...(t > 0.12 && t < 0.6 ? [fx(star(t - 0.12), 0.17, 0.72, PZ + 0.1, 0.35)] : [])] }));
// 38 "Thank you, Your Majesty."  close, smug, talking
shot(60.76, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [0.08, 1.2, 0.2], [0.03, 1.18, -0.15]), look: [0, 1.12, PZ], fov: 44,
  actors: [...guards(t, 'shock', 'shock', -0.5), act(KN(1), 0, 0.05, PZ, { expr: 'squint', talk: t > 0.1, honey: 0.8, L: 'hip', R: 'hip' }, [], {}, t)] }));
// 39 "You see,"  the king's stunned face, snap
shot(63.53, (t, d) => ({ preset: 'dungeon', cam: snap(t, [-0.6, 1.95, 0.25], [-0.7, 1.92, -0.05], 0.2), look: [-0.75, 1.88, PZ - 0.25], fov: 44,
  actors: [act('king', -0.75, 0.05, PZ - 0.25, { expr: 'shock', R: { a: 100, e: -10 } }, [], { s: 1.05 }, t)] }));
// 40 "when a king touches a man on both shoulders with his sword,"  pull-out: sword resting on the shoulder
shot(64.16, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [-0.1, 1.2, 0.0], [-0.3, 1.5, 1.2]), look: [-0.3, 1.3, PZ], fov: 50,
  sword: { p: [-1.1, 0.88, PZ + 0.08], rz: -Math.PI / 2 + 0.06, s: 0.75 },
  actors: [act('king', -0.85, 0.05, PZ - 0.25, { expr: 'shock', R: { a: 70, e: 0 } }, [], { s: 1.05 }, t), act(KN(1), 0, 0.05, PZ, { expr: 'smile_closed', honey: 0.6 }, [], {}, t), ...guards(t, 'shock', 'shock', -0.2)] }));
// 41 "that man becomes a knight."  KNIGHTED!
shot(67.31, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [-0.2, 1.45, 1.4], [-0.25, 1.43, 1.05]), look: [-0.3, 1.35, PZ], fov: 52,
  sword: { p: [-0.48, 1.3, PZ + 0.3], rz: -2.2, s: 0.6 },
  actors: [act('guardB', 0.5, -0.1, GZ, { expr: 'grin' }, [], {}, t), act('warden', 1.3, 0.05, GZ + 0.2, { expr: 'shock' }, [], {}, t), act('king', -0.85, 0.05, PZ - 0.4, { expr: 'shock', R: { a: 100, e: -10 } }, [], { s: 1.05 }, t),
    act(KN(1), 0, 0.05, PZ + 0.1, { expr: 'grin', honey: 0.6 }, [], {}, t), act('queen', 1.0, 0.05, PZ - 0.3, { expr: 'smile', L: 'cheek' }, [], {}, t), popA('KNIGHTED!', t)] }));
// 42 "And nobody keeps a knight in chains."  he stands, cuffs gone, walks out, everyone cheers
shot(69.11, (t, d) => ({ preset: 'dungeon', puddle: 0.8, cam: push(t, d, [0.3, 1.7, 1.2], [0.6, 2.2, 2.4]), look: [0, 1.4, PZ], fov: 52,
  actors: [act('guardA', -0.9, 0, GZ, { expr: 'grin', L: 'up', R: 'up' }, [], {}, t), act('guardB', 0.9, 0, GZ, { expr: 'laugh', L: 'up', R: 'wave', wv: t * 8 }, [], {}, t), act('king', -1.0, 0.05, PZ - 0.3, { expr: 'smile' }, [], { s: 1.05 }, t),
    act(FREE, 0, 0.05, lerp(PZ, PZ + 0.5, ez(t / d)), { expr: 'grin', honey: 0.5, R: 'wave', wv: t * 8, L: 'thumb', step: (t * 2) % 1, stride: 10 }, [], {}, t), act('queen', 1.1, 0.05, PZ - 0.3, { expr: 'laugh', L: 'cheek' }, [], {}, t)] }));
export const stateAt = (f) => { const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--; const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0; const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i; return S; };
export const SHOTS = SH.map((s) => s.t0);
