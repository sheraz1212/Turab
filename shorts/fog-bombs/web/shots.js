// Shot plan for "Every foggy night..." (railway fog-signal detonators). 30 fps, times from work/phrases.json.
import * as T from './toon.js';

const FPS = 30;
export const TOTAL = Math.ceil(62.75 * FPS);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); };
const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const ei = (t) => Math.pow(cl(t), 2.2);
const rg = (t, a, b) => cl((t - a) / (b - a));
const blink = (t, seed = 1) => { const per = 2.6 + (seed % 5) * 0.4, ph = (t + seed * 0.7) % per; return ph < 0.07 ? 0.5 : ph < 0.14 ? 1 : 0; };
const TRACK = 0.39, DET = 0.7175;

const C = (who, o = {}, props = []) => (p) => { const out = {}; T.romanFront(p, who, { ...o, out });
  for (const pr of props) { const h = out.hands[pr.hand]; if (pr.kind === 'lantern') T.propLantern(p, h[0], h[1] - 4, 2.8, pr.glow ?? 1); if (pr.kind === 'det') T.propDetonator(p, h[0], h[1] - 12, 3.0); if (pr.kind === 'dets') { T.propDetonator(p, h[0] - 22, h[1] - 10, 2.6); T.propDetonator(p, h[0] + 18, h[1] - 18, 2.6); } } };
const act = (who, x, y, z, o = {}, props = [], extra = {}) => ({ x, y, z, draw: C(who, o, props), ...extra });
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const burst = (t, col = '#fff3b0') => (p) => T.fxBurst(p, (t * 1.4) % 1, col, 12, 60, 250);
const qmark = (t) => (p) => { const g = p.g; g.save(); g.font = '900 260px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 26; g.strokeStyle = '#241726'; const y = 620 - Math.sin(t * 9) * 20; g.strokeText('?', 300, y); g.fillStyle = '#ffd84a'; g.fillText('?', 300, y); g.restore(); };
const exclam = (t) => (p) => { const g = p.g; g.save(); g.font = '900 300px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 28; g.strokeStyle = '#241726'; const s = 1 + 0.15 * Math.sin(t * 20); g.translate(300, 640); g.scale(s, s); g.strokeText('!', 0, 0); g.fillStyle = '#ff5a3a'; g.fillText('!', 0, 0); g.restore(); };
const tears = (t) => (p) => { for (let i = 0; i < 6; i++) { const a = ((t * 2 + i / 6) % 1); for (const s of [-1, 1]) p.ell(300 + s * (90 + a * 120), 260 + a * a * 300, 14, 20, '#9fd4ff', 4); } };
const hahas = (t) => (p) => { const g = p.g; g.save(); g.font = '900 120px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#241726'; g.fillStyle = '#ffffff';
  ['HA', 'HA!', 'HA'].forEach((w, i) => { const k = (t * 1.3 + i / 3) % 1; g.globalAlpha = Math.min(1, (1 - k) * 2); const x = 160 + i * 140 + Math.sin(k * 7 + i) * 30, y = 700 - k * 450; g.strokeText(w, x, y); g.fillText(w, x, y); }); g.restore(); };
const zzz = (t) => (p) => T.fxZ(p, t % 1);
const dots = (t) => (p) => { for (let i = 0; i < 3; i++) { const on = (t * 2.5) % 3 > i; if (on) p.ell(200 + i * 100, 600, 26, 26, '#ffffff', 8); } };
const walkO = (t, sp = 1.7) => ({ step: (t * sp) % 1, bob: Math.abs(Math.sin(t * sp * Math.PI * 2)) * 0.02 });

// ---------------- shots ----------------
const SH = [];
const shot = (t0, fn) => SH.push({ t0, fn });

// S1 0.0 "Every foggy night,"  establishing: the line at night, fog drifting, lamps, red signal
shot(0.0, (t, d) => { const k = ez(t / d);
  return { preset: 'night', cam: L3([0.9, 2.4, 10.5], [0.5, 1.8, 7.4], k), look: [-0.2, 1.4, -14], fov: 48, focus: 9, cinf: 2, fogRoll: t * 1.5,
    actors: [act('railman', -0.25, TRACK, -3.5 + t * 0.9, { expr: 'neutral', L: 'hang', R: 'hang', ...walkO(t), blink: blink(t) }, [{ hand: 0, kind: 'lantern' }])] }; });
// S2 1.45 "this railwayman walks out onto the tracks,"  tracking low, he walks toward us with lantern + detonators
shot(1.45, (t, d) => { const z = 1.2 + t * 0.85;
  return { preset: 'night', cam: [0.55 + 0.1 * Math.sin(t), 1.05, z + 3.4], look: [0.0, 1.62, z - 1], fov: 44, focus: 3.3, cinf: 6, fogRoll: 2 + t * 1.5,
    actors: [act('railman', -0.1, TRACK, z, { expr: t > 1.2 ? 'grin' : 'stern', L: 'hang', R: t > 1.3 ? 'fist' : 'hang', look: 0.3, ...walkO(t), blink: blink(t, 2) }, [{ hand: 0, kind: 'lantern' }, ...(t > 1.3 ? [{ hand: 1, kind: 'dets' }] : [])]),
      act('fireman', -3.7, 0, -1.5, { expr: 'laugh', L: 'belly', R: 'hang', facing: 0.6, blink: blink(t, 5) }, [], { tint: '#ffcfa0' })] }; });
// S3 3.9 "and straps bombs to the rails."  low close-up at the rail: he bends, the tin appears, clamp
shot(3.9, (t, d) => { const bend = ez(rg(t, 0, 0.5)), on = t > 0.75;
  return { preset: 'night', cam: L3([0.7, 0.95, 7.2], [0.6, 0.95, 6.7], ez(t / d)), look: [-0.9, 1.05, 4.0], fov: 52, focus: 3.0, cinf: 5,
    dets: on ? [{ p: [-DET, 0.565, 4.0], s: 1.6 * eo(rg(t, 0.75, 0.95)) + 0.001 }] : [],
    actors: [act('railman', -1.35, 0.27, 3.85, { expr: on ? 'grin' : 'stern', tilt: 26 * bend, L: 'hang', R: 'down', look: 0.6, facing: 0.6, blink: blink(t, 3) }, [{ hand: 0, kind: 'lantern' }]),
      ...(t > 0.8 && t < 1.25 ? [fx(burst(t), -DET, 0.3, 4.05, 0.35)] : [])] }; });
// S4 6.2 "It's England, in the eighteen-forties."  daytime station, crowd, a standing engine
shot(6.2, (t, d) => { const k = ez(t / d);
  return { preset: 'day', cam: L3([3.3, 2.25, 10.5], [3.1, 2.15, 9.5], k), look: [2.0, 1.6, -6], fov: 50, focus: 7, cinf: 2, loco: -9, steam: 1, steamDrift: 1, lampK: 0, tag: '1840s',
    actors: [act('gent', 3.5, 0.95, 3.0, { expr: 'smile', L: 'hang', R: 'wave', wv: t * 8, facing: -0.4, blink: blink(t, 1) }), act('lady', 4.2, 0.95, 1.0, { expr: 'smile', L: 'hang', R: 'hang', facing: -0.3, blink: blink(t, 2) }),
      act('civA', 2.6, 0.95, 5.4, { expr: 'grin', L: 'point', R: 'hang', facing: -0.6, blink: blink(t, 3) }), act('railman', 2.4, 0.95, 7.0, { expr: 'smile', L: 'hang', R: 'thumb', facing: 0.4, blink: blink(t, 4) }),
      act('clerk', 3.9, 0.95, -2.0, { expr: 'neutral', L: 'hang', R: 'hang', facing: -0.5, blink: blink(t, 6) }), act('civC', 2.7, 0.95, 0.2, { expr: 'laugh', L: 'belly', R: 'hang', facing: -0.6 })] }; });
// S5 8.6 "Steam trains thunder through the countryside,"  day, low by the line, engine rushes at and past us, driver waves
shot(8.6, (t, d) => { const z = lerp(-150, -96, eo(t / d * 0.95)), k = t / d;
  return { preset: 'day', cam: [3.3 - 0.4 * k, 0.75, -92], look: [0.2, 2.0, z - 2], fov: 48, focus: Math.max(3, -92 - z), cinf: 2, loco: z, steam: 1, steamDrift: 8, shake: 0.03 * k, lampK: 0,
    actors: [act('driver', 1.55, 1.75, z - 5.2, { expr: 'grin', L: 'hang', R: 'wave', wv: t * 10, facing: 0.5, blink: blink(t, 2) }, [], { s: 0.85 })] }; });
// S6 11.8 "faster than anything on earth."  side view: the engine overtakes a galloping horseman
shot(11.8, (t, d) => { const zr = -108 + t * 4, zl = zr - 9 + t / d * 22;
  return { preset: 'day', cam: [8.2, 1.8, zr], look: [1.5, 1.6, zr], fov: 50, focus: 4.8, cinf: 1.5, loco: zl, steam: 1, steamDrift: 7, lampK: 0,
    actors: [{ x: 3.4, y: 0, z: zr, s: 1.6, flip: true, draw: (p) => T.rider(p, 'gent', { expr: t > 0.6 ? 'shock' : 'stern', L: 'hang', R: 'hang' }, { gallop: (t * 3) % 1 }) },
      act('driver', 1.55, 1.75, zl - 5.2, { expr: 'laugh', L: 'hang', R: 'wave', wv: t * 10, facing: 0.5 }, [], { s: 0.85 })] }; });
// S7 13.25 "But when the fog rolls in,"  night, the fog bank rolls toward us, the lamps get swallowed
shot(13.25, (t, d) => { const k = ez(t / d);
  return { preset: 'night', cam: [0.4, 1.6, 6.5], look: [0, 1.6, -10], fov: 46, focus: 8, cinf: 1.5, fog: lerp(0.03, 0.1, k), fogCards: 1 + 2 * k, fogRoll: 14 * k, lampK: lerp(1, 0.6, k), glowFade: lerp(0.05, 0.12, k), actors: [] }; });
// S8 14.7 "the drivers can't see a thing."  driver leans out of the cab squinting into grey nothing
shot(14.7, (t, d) => { const z = -10 + t * 2;
  return { preset: 'night', cam: [3.8, 2.6, z - 1.4], look: [1.0, 2.6, z - 5.0], fov: 46, focus: 3.0, cinf: 5, fog: 0.11, fogCards: 2.5, loco: z, steam: 0.6, lampK: 0.5, glowFade: 0.12,
    actors: [act('driver', 1.6, 1.75, z - 5.3, { expr: 'squint', L: 'cheek', R: 'hang', facing: 0.6, blink: 0 }, [], { s: 0.95 }), fx(qmark(t), 1.8, 3.6, z - 5.6, 0.45)] }; });
// S9 16.75 "Not the signals."  red signal lamp fades into the fog
shot(16.75, (t, d) => { const k = ez(t / d);
  return { preset: 'night', cam: [-0.4, 4.6, -16.5 - k * 1.2], look: [-1.45, 5.2, -22], fov: 40, focus: 5.5, cinf: 2, fog: lerp(0.06, 0.16, k), fogCards: 2.5, sigK: lerp(1, 0.05, k), glowFade: 0.12, lampK: 0.4, actors: [] }; });
// S10 17.8 "Not the lamps."  a platform lamp fades
shot(17.8, (t, d) => { const k = ez(t / d);
  return { preset: 'night', cam: [0.6, 3.6, -0.5 - k * 0.8], look: [2.6, 4.0, -4], fov: 40, focus: 4, cinf: 2, fog: lerp(0.06, 0.16, k), fogCards: 2.5, platK: { z: -4, k: lerp(1, 0.04, k) }, glowFade: 0.1, lampK: 0.7, actors: [] }; });
// S11 18.85 "Not even a train stopped right ahead."  driver POV down the line; a goods van looms out at the last second
shot(18.85, (t, d) => { const k = t / d, cz = lerp(-4, -30, ez(k));
  return { preset: 'night', cam: [0.15, 2.7, cz], look: [0.1, 2.2, cz - 12], fov: 50, focus: 6, cinf: 1.5, fog: lerp(0.14, 0.1, k), fogCards: 2.5, van: -38, lampK: 0.5, glowFade: 0.08, shake: 0.03, actors: [] }; });
// S12 21.3 "So a young engineer has an idea."  office at night, the engineer at the table with his drawings, idea burst
shot(21.3, (t, d) => { const k = ez(t / d), idea = t > 1.0;
  return { preset: 'office', zone: 'office', cam: L3([200.0, 1.6, 3.4], [200.0, 1.62, 2.6], k), look: [200.0, 1.55, -0.6], fov: 44, focus: 2.6, cinf: 4, paper: [200.0, 0, -0.38],
    actors: [act('engineer', 200.0, 0, -0.95, { expr: idea ? 'grin' : 'stubborn', L: idea ? 'up' : 'temple', R: idea ? 'fist' : 'hang', facing: 0, look: idea ? 0 : 0.5, blink: blink(t, 4) }),
      ...(idea ? [fx(burst(t, '#fff3b0'), 200.0, 1.7, -1.0, 0.75), fx(exclam(t), 200.35, 2.05, -0.9, 0.35)] : [fx(dots(t), 200.4, 2.0, -0.9, 0.3)])] }; });
// S13 24.1 "Little bombs,"  macro: the tin on the table, sparkle
shot(24.1, (t, d) => { const k = ez(t / d), y = 0;
  return { preset: 'office', zone: 'office', cam: L3([200.3, 0.95, 0.3], [200.22, 0.9, 0.16], k), look: [200.1, 0.78, -0.08], fov: 38, focus: 0.35, cinf: 9, paper: [200.0, 0, -0.38], dets: [{ p: [200.1, 'TT', -0.08], s: 1, ry: t * 0.6 }],
    actors: [fx(burst(t, '#fff3b0'), 200.1, 'TT', -0.1, 0.12)] }; });
// S14 25.2 "the size of a coin."  tin next to a coin
shot(25.2, (t, d) => { const k = ez(t / d);
  return { preset: 'office', zone: 'office', cam: L3([200.05, 0.96, 0.28], [200.08, 0.9, 0.15], k), look: [200.13, 0.77, -0.07], fov: 36, focus: 0.33, cinf: 9, paper: [200.0, 0, -0.38], dets: [{ p: [200.1, 'TT', -0.08], s: 1 }], coin: [200.165, 'TT', -0.05], actors: [] }; });
// S15 26.7 "His bosses think he's lost his mind."  the board laughs; engineer nervous in front
shot(26.7, (t, d) => { const k = ez(t / d);
  return { preset: 'office', zone: 'office', cam: L3([200.3, 1.55, 4.2], [200.2, 1.55, 3.6], k), look: [200.0, 1.5, -0.5], fov: 46, focus: 3.4, cinf: 4,
    actors: [act('bossA', 198.6, 0, -0.9, { expr: 'laugh', L: 'belly', R: 'point', facing: 0.5, bob: Math.abs(Math.sin(t * 14)) * 0.02 }, [], { s: 1.02 }),
      act('bossB', 199.6, 0, -1.4, { expr: 'laugh', L: 'belly', R: 'belly', facing: 0.2, bob: Math.abs(Math.sin(t * 12 + 1)) * 0.02 }),
      act('bossD', 200.7, 0, -1.3, { expr: 'laugh', L: 'temple', R: 'thumb', facing: -0.3, swirl: t * 8 }),
      act('bossC', 201.5, 0, -0.6, { expr: 'grin', L: 'cross', R: 'cross', facing: -0.5, blink: blink(t, 3) }),
      act('engineer', 199.4, 0, 1.4, { expr: 'nervous', L: 'hang', R: 'fist', facing: 0.4, sweat: 2, blink: blink(t, 7) }, [{ hand: 1, kind: 'det' }]),
      fx(hahas(t), 199.6, 2.2, -1.2, 0.8)] }; });
// S16 28.85 "Explosives?"  close: boss A, shocked, leaning in
shot(28.85, (t, d) => { const k = eo(t / 0.4);
  return { preset: 'office', zone: 'office', cam: L3([199.0, 1.75, 1.6], [198.85, 1.75, 1.1], k), look: [198.6, 1.72, -0.9], fov: 42, focus: 2.0, cinf: 6,
    actors: [act('bossA', 198.6, 0, -0.9, { expr: 'shock', L: 'cheek', R: 'cheek', facing: 0.3, sweat: 1, tilt: -6 * k }, [], { s: 1.02 }), act('bossB', 199.6, 0, -1.4, { expr: 'laugh', L: 'belly', R: 'belly', facing: 0.2 }), fx(exclam(t), 198.95, 2.15, -0.8, 0.3)] }; });
// S17 30.0 "On the track?"  boss B laughing, pointing at the engineer
shot(30.0, (t, d) => ({ preset: 'office', zone: 'office', cam: L3([199.9, 1.7, 1.4], [199.8, 1.7, 1.0], ez(t / d)), look: [199.6, 1.65, -1.4], fov: 42, focus: 2.4, cinf: 6,
  actors: [act('bossB', 199.6, 0, -1.4, { expr: 'laugh', L: 'belly', R: 'point', facing: 0.4, bob: Math.abs(Math.sin(t * 14)) * 0.025 }), act('bossD', 200.7, 0, -1.3, { expr: 'laugh', L: 'belly', R: 'belly', facing: -0.3 }), fx(tears(t), 199.6, 1.4, -1.35, 0.45)] }));
// S18 31.05 "Under a moving train?"  boss D topples backward laughing, everyone howls
shot(31.05, (t, d) => { const fall = ei(rg(t, 0.4, 1.3));
  return { preset: 'office', zone: 'office', cam: [200.2, 1.5, 3.6], look: [200.1, 1.35, -0.6], fov: 48, focus: 3.3, cinf: 4, shake: t > 1.25 && t < 1.5 ? 0.06 : 0,
    actors: [act('bossA', 198.6, 0, -0.9, { expr: 'laugh', L: 'belly', R: 'belly', facing: 0.5, bob: Math.abs(Math.sin(t * 14)) * 0.02 }, [], { s: 1.02 }),
      act('bossB', 199.6, 0, -1.4, { expr: 'laugh', L: 'belly', R: 'point', facing: 0.2 }),
      act('bossD', 200.8 + fall * 0.5, -fall * 0.25, -1.3, { expr: 'laugh', L: 'up', R: 'up', facing: -0.3 }, [], { roll: -fall * 1.35, blob: fall < 0.5 }),
      act('bossC', 201.5, 0, -0.6, { expr: 'laugh', L: 'belly', R: 'belly', facing: -0.5 }), fx(hahas(t), 200.4, 2.2, -1.2, 0.8)] }; });
// S19a 32.9 "But he clips one to the rail,"  night, the engineer kneels at the rail and clamps a tin
shot(32.9, (t, d) => { const bend = ez(rg(t, 0, 0.4)), on = t > 0.6;
  return { preset: 'night', cam: L3([-0.6, 0.95, 3.1], [-0.5, 0.95, 2.6], ez(t / d)), look: [0.95, 1.05, -0.1], fov: 52, focus: 3.0, cinf: 5, dets: on ? [{ p: [DET, 0.565, 0], s: 1.6 * eo(rg(t, 0.6, 0.8)) + 0.001 }] : [],
    actors: [act('engineer', 1.4, 0.27, -0.15, { expr: 'stern', tilt: -24 * bend, L: 'down', R: 'hang', look: -0.6, facing: -0.6, blink: blink(t, 2) }, [{ hand: 1, kind: 'lantern' }]), ...(on && t < 1.0 ? [fx(burst(t), DET, 0.3, 0.05, 0.3)] : [])] }; });
// S19b 34.5 "and waits."  he stands back by the line with his lantern, staring into the fog; pocket watch tick
shot(34.5, (t, d) => ({ preset: 'night', cam: L3([0.3, 1.3, 4.3], [0.2, 1.35, 3.9], ez(t / d)), look: [-1.2, 1.55, 1.0], fov: 46, focus: 3.3, cinf: 5, fog: 0.07, fogCards: 2, dets: [{ p: [DET, 0.565, 0], s: 1.6 }],
  actors: [act('engineer', -1.55, 0.0, 1.2, { expr: 'neutral', L: 'cross', R: 'hang', look: -0.8, facing: -0.3, blink: blink(t, 6) }, [{ hand: 1, kind: 'lantern' }]), fx(dots(t), -1.2, 2.25, 1.1, 0.35)] }));
// S20a 35.85 "Out of the fog,"  headlamp grows out of the grey, straight at us
shot(35.85, (t, d) => { const z = lerp(-70, -34, ez(t / d));
  return { preset: 'night', cam: [0.2, 1.0, 4.5], look: [0, 2.2, -20], fov: 46, focus: 30, cinf: 1, fog: 0.07, fogCards: 2, loco: z, steam: 0.7, glowFade: 0.02, shake: 0.02, dets: [{ p: [DET, 0.565, 0], s: 1.6 }], actors: [] }; });
// S20b 37.3 "a train comes roaring in."  the engine roars past the engineer, steam everywhere
shot(37.3, (t, d) => { const z = lerp(-26, -3, t / d);
  return { preset: 'night', cam: [-2.6, 1.15, 5.2], look: [0, 2.0, z - 1], fov: 50, focus: 4, cinf: 3, fog: 0.05, fogCards: 1.5, loco: z, steam: 1, steamDrift: 6, shake: 0.05, dets: [{ p: [DET, 0.565, 0], s: 1.6 }],
    actors: [act('engineer', -1.65, 0, 2.3, { expr: 'grin', L: 'cross', R: 'hang', look: 0.8, facing: 0.4 }, [{ hand: 1, kind: 'lantern' }])] }; });
// S21 38.7 "The wheel rolls over it,"  macro at rail level: the front wheel creeps onto the tin
shot(38.7, (t, d) => { const z = lerp(-4.6, -0.6, ez(t / d));
  return { preset: 'night', cam: [1.3, 0.8, 1.6], look: [0.7, 0.75, -0.6], fov: 46, focus: 1.7, cinf: 7, fog: 0.04, loco: z, steam: 0, dets: [{ p: [DET, 0.565, 0], s: 1.6 }], shake: 0.012, actors: [] }; });
// S22 40.4 "and bang!"  flash, sparks, smoke, the camera jolts
shot(40.4, (t, d) => { const z = -0.6 + t * 3, k = eo(rg(t, 0, 0.25)) * (1 - rg(t, 0.5, d));
  return { preset: 'night', cam: [1.9, 0.75, 5.5], look: [0.2, 1.5, -2], fov: 50, focus: 5, cinf: 3, fog: 0.04, loco: z - 1.6, steam: 1, flash: 0.55 * (1 - rg(t, 0, 0.2)), shake: 0.18 * (1 - rg(t, 0, d)),
    bang: { p: [DET, 0.62, z + 0.3], k: 0.4 + k }, actors: [] }; });
// S23 41.45 "The driver can't see a thing,"  cab: the driver peers into fog through the spectacle glass
shot(41.45, (t, d) => ({ preset: 'cab', zone: 'cab', cam: L3([-200.0, 1.6, 2.7], [-199.95, 1.65, 2.3], ez(t / d)), look: [-200.05, 1.55, -1.0], fov: 46, focus: 1.9, cinf: 5, lever: 0.5,
  actors: [act('driver', -199.7, 0, -0.1, { expr: 'squint', L: 'cheek', R: 'hang', facing: 0.4, blink: 0 }), act('fireman', -200.5, 0, -0.5, { expr: 'neutral', L: 'hang', R: 'hang', facing: 0.3, blink: blink(t, 3) }, [], { s: 0.98 })] }));
// S24 42.95 "but he definitely hears that."  both jump, eyes wide, sweat
shot(42.95, (t, d) => { const j = Math.max(0, Math.sin(Math.min(1, t / 0.35) * Math.PI)) * 0.12;
  return { preset: 'cab', zone: 'cab', cam: L3([-199.95, 1.5, 2.9], [-199.95, 1.55, 2.4], eo(t / 0.4)), look: [-200.05, 1.5, -1.0], fov: 52, focus: 2.6, cinf: 5, lever: 0.5, shake: 0.08 * (1 - rg(t, 0, 0.6)),
    actors: [act('driver', -199.62, j, -0.1, { expr: 'shock', L: 'up', R: 'up', facing: 0.5, sweat: 3 }), act('fireman', -200.5, j * 0.8, -0.5, { expr: 'shock', L: 'cheek', R: 'cheek', facing: 0.3, sweat: 2 }, [], { s: 0.98 }), fx(exclam(t), -199.3, 2.15, -0.1, 0.35)] }; });
// S25 44.9 "He slams on the brakes,"  close: he yanks the brake lever
shot(44.9, (t, d) => { const k = eo(rg(t, 0.1, 0.45));
  return { preset: 'cab', zone: 'cab', cam: [-199.4, 1.45, 1.45], look: [-199.2, 1.25, -0.6], fov: 46, focus: 1.6, cinf: 6, lever: lerp(0.5, -0.55, k), shake: k > 0.9 ? 0.05 * (1 - rg(t, 0.45, 1.2)) : 0,
    actors: [act('driver', -199.62, 0, -0.1, { expr: 'stubborn', L: 'hang', R: 'lever', facing: 0.5, tilt: 10 * k, sweat: 2 })] }; });
// S26 46.2 "and stops just in time."  outside: wheels lock and spark, the engine stops a hair from the van
shot(46.2, (t, d) => { const k = eo(cl(t / (d - 0.4))), z = lerp(-62, -40.9, k), sl = 1 - k;
  return { preset: 'night', cam: [6.6, 1.5, -39.3], look: [0.0, 1.95, -39.6], fov: 50, focus: 6.6, cinf: 3, fog: 0.05, loco: z, van: -38.5, vanRot: 1, steam: 0.8, steamDrift: 3 * sl,
    sparks: sl > 0.05 ? { at: [[0.72, 0.55, z + 0.4], [0.72, 0.55, z - 2.2], [0.72, 0.55, z - 4.3]], dir: -1 } : null, shake: 0.04 * sl,
    actors: [act('driver', 1.55, 1.75, z - 5.2, { expr: k > 0.97 ? 'relief' : 'pained', L: k > 0.97 ? 'temple' : 'hang', R: 'hang', facing: 0.6, sweat: 3 }, [], { s: 0.85 })] }; });
// S27 48.05 "You see, a bang travels where light can't."  the lamp's glow dies in the fog, the bang's rings sail through it
shot(48.05, (t, d) => ({ preset: 'night', cam: L3([-0.2, 2.5, 7.4], [-0.3, 2.3, 6.6], ez(t / d)), look: [0.4, 1.0, -6], fov: 50, focus: 5, cinf: 1.5, fog: 0.09, fogCards: 2.5, glowFade: 0.12,
  rings: { p: [DET, 0.9, 0], dz: -14, size: 7, rate: 1.1, k: 0.9 }, dets: [{ p: [DET, 0.565, 0], s: 1.6 }],
  actors: [act('engineer', -1.45, 0, 3.2, { expr: 'smile', L: 'hang', R: 'point', facing: 0.4, look: 0.6, blink: blink(t, 4) }, [{ hand: 0, kind: 'lantern' }])] }));
// S28 51.3 "Fog can hide a lamp,"  close on a lantern, fog swallows it
shot(51.3, (t, d) => { const k = ez(t / d);
  return { preset: 'night', cam: [0.6, 3.6, -0.8], look: [2.6, 4.0, -4], fov: 40, focus: 4, cinf: 2, fog: lerp(0.06, 0.2, k), fogCards: 3, platK: { z: -4, k: lerp(1, 0.03, k) }, glowFade: 0.1, actors: [] }; });
// S29 52.75 "but it can't hide a bang."  rings burst out of the fog right at the driver, he grabs his ears
shot(52.75, (t, d) => ({ preset: 'night', cam: [2.9, 2.6, -10.6], look: [1.3, 2.7, -15.2], fov: 46, focus: 3.0, cinf: 4, fog: 0.13, fogCards: 2.5, loco: -10, steam: 0.4, glowFade: 0.12,
  rings: { p: [0.2, 2.3, -24], dz: 14, size: 5, rate: 1.4, k: 1 },
  actors: [act('driver', 1.6, 1.75, -15.3, { expr: 'shock', L: 'cheek', R: 'cheek', facing: 0.6, sweat: 2 }, [], { s: 0.95 })] }));
// S30 54.55 "And here's the crazy part."  the engineer leans into camera with a sly grin
shot(54.55, (t, d) => ({ preset: 'night', cam: L3([-0.2, 1.75, 3.6], [-0.3, 1.75, 2.9], ez(t / d)), look: [-0.4, 1.7, 0.6], fov: 42, focus: 2.4, cinf: 6,
  actors: [act('engineer', -0.4, TRACK - 0.12, 0.6, { expr: 'grin', L: 'hang', R: 'thumb', facing: 0.0, look: 0, headTilt: 6, blink: blink(t, 1) }, [{ hand: 0, kind: 'lantern' }])] }));
// S31 56.05 "They still use them today."  daylight, now: a track worker in hi-vis clips a tin to a modern rail
shot(56.05, (t, d) => { const bend = ez(rg(t, 0, 0.4)), on = t > 0.6;
  return { preset: 'day', cam: L3([-0.6, 0.95, 3.1], [-0.5, 0.95, 2.6], ez(t / d)), look: [0.95, 1.05, -0.1], fov: 52, focus: 3.0, cinf: 5, led: true, tag: 'TODAY', dets: on ? [{ p: [DET, 0.565, 0], s: 1.6 * eo(rg(t, 0.6, 0.8)) + 0.001 }] : [],
    actors: [act('worker', 1.4, 0.27, -0.15, { expr: 'smile', tilt: -24 * bend, L: 'down', R: 'hang', look: -0.6, facing: -0.6, blink: blink(t, 2) })] }; });
// S32 57.95 "Modern trains, computer signals,"  a sleek modern train whips past the green LED signal
shot(57.95, (t, d) => { const z = lerp(-95, -10, t / d);
  return { preset: 'day', cam: [-3.0, 1.1, -14], look: [-0.6, 2.4, -34], fov: 50, focus: 8, cinf: 2, modern: z, led: true, shake: 0.03, dets: [{ p: [DET, 0.565, 0], s: 1.6 }], actors: [] }; });
// S33 60.25 "and still, a tiny bomb on the track."  macro on the tin; the worker gives a thumbs up behind it
shot(60.25, (t, d) => { const k = ez(t / d);
  return { preset: 'day', cam: L3([1.35, 0.8, 1.6], [1.15, 0.72, 0.95], k), look: [0.35, 1.05, -1.2], fov: 46, focus: lerp(1.6, 1.0, k), cinf: 6, led: true, dets: [{ p: [DET, 0.565, 0], s: 1.6 }],
    actors: [act('worker', -0.3, TRACK, -2.2, { expr: 'grin', L: 'hang', R: 'thumb', facing: 0.3, blink: blink(t, 5) })] }; });

export const CUTS = SH.map((s) => s.t0);
export const stateAt = (f, ctx) => {
  const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--;
  const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0;
  const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i;
  // 'TT' = table top height, resolved here
  const fix = (p) => p && p.map((v) => (v === 'TT' ? ctx.TABLE_TOP + 0.001 : v));
  if (S.dets) S.dets.forEach((D) => { D.p = fix(D.p); }); if (S.coin) S.coin = fix(S.coin); if (S.paper) S.paper = [S.paper[0], ctx.TABLE_TOP + 0.002, S.paper[2]];
  if (S.actors) S.actors.forEach((a) => { if (a.y === 'TT') a.y = ctx.TABLE_TOP + 0.02; });
  return S;
};
