// "Storm Oil" (why sailors carried oil). 30 fps; times from work/phrases.json. Fast cuts, close deck angles, bubbles.
import * as T from './toon.js';
const FPS = 30;
export const TOTAL = Math.ceil(69.25 * FPS);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); };
const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const rg = (t, a, b) => cl((t - a) / (b - a));
const blink = (t, seed = 1) => { const per = 2.4 + (seed % 5) * 0.4, ph = (t + seed * 0.7) % per; return ph < 0.07 ? 0.5 : ph < 0.14 ? 1 : 0; };
const wig = (t, f = 6, amp = 8) => Math.sin(t * f) * amp;
const talkE = (t, expr) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(expr, 'o') : expr);
const prop = (p, pr, h, t) => { const g = p.g;
  if (pr.kind === 'pot') { const x = pr.c ? pr.c[0] : h[0], y = pr.c ? pr.c[1] : h[1]; p.ell(x, y, 92, 66, '#d8783a', 6); p.ell(x - 26, y - 30, 44, 15, '#ffffff70', 0); p.ell(x + 84, y - 40, 24, 58, '#f0a850', 5); p.ell(x + 84, y - 40, 13, 44, '#6a3010', 0); p.stroke([[x - 92, y - 6], [x - 128, y - 30]], 12, '#a85a20');
    if (pr.pour !== false) { const w = 16 + Math.sin(t * 20) * 3; const pts = [[x + 92, y - 36], [x + 122, y + 40], [x + 134, y + 300]]; p.stroke(pts, w + 8, '#7a4a10'); p.stroke(pts, w, '#ffc840'); p.stroke([[x + 95, y - 24], [x + 118, y + 40]], 5, '#fff4c0'); } }
  if (pr.kind === 'tied') { for (const dy of [-80, 60]) p.stroke([[300, 1040 + dy], [600, 1090 + dy], [900, 1040 + dy]], 30, '#3a2414'), p.stroke([[300, 1040 + dy], [600, 1090 + dy], [900, 1040 + dy]], 20, '#d8b070'); }
  if (pr.kind === 'sword') { const x = h[0], y = h[1]; p.poly([[x - 12, y - 20], [x + 12, y - 20], [x + 40, y - 300], [x + 8, y - 380], [x - 4, y - 300]], '#e8eef8', 6); p.stroke([[x - 50, y - 16], [x + 50, y - 16]], 18, '#e8b84a'); }
  if (pr.kind === 'lantern') T.propLantern(p, h[0], h[1] - 4, 2.8, 1);
  if (pr.kind === 'tin') { const x = h[0], y = h[1]; p.poly([[x - 40, y - 100], [x + 40, y - 100], [x + 40, y], [x - 40, y]], '#c82a2a', 4); p.poly([[x - 32, y - 78], [x + 32, y - 78], [x + 32, y - 24], [x - 32, y - 24]], '#f4e8c8', 0); g.save(); g.fillStyle = '#c82a2a'; g.font = '900 22px Arial Black'; g.textAlign = 'center'; g.fillText('STORM', x, y - 55); g.fillText('OIL', x, y - 30); g.restore(); }
  if (pr.kind === 'spoon') { p.stroke([[h[0], h[1]], [h[0] + 10, h[1] - 90]], 8, '#c8c8d0'); p.ell(h[0] + 12, h[1] - 100, 16, 22, '#d8d8e0', 3); } };
const C = (who, o = {}, props = [], t = 0) => (p) => { const out = {}; const oo = { ...o }; if (o.talk) oo.expr = talkE(t, o.expr || 'smile'); T.romanFront(p, who, { ...oo, out }); for (const pr of props) prop(p, pr, out.hands[pr.hand ?? 1], t); };
const act = (who, x, y, z, o = {}, props = [], extra = {}, t = 0) => ({ x, y, z, draw: C(who, o, props, t), ...extra });
const H = (who, x, z, o, props = [], extra = {}, t = 0) => act(who, x, 2.3, z, o, props, { ship: 'H', ...extra }, t);
const PP = (who, x, z, o, props = [], extra = {}, t = 0) => act(who, x, 2.5, z, o, props, { ship: 'P', ...extra }, t);
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const bubble = (txt, x, y, z, s = 0.42, extra = {}) => fx((p) => T.fxBubble(p, txt, {}), x, y - 1.5 * s, z, s, { order: 8, ...extra });
const burst = (t, col = '#fff3b0') => (p) => T.fxBurst(p, (t * 1.4) % 1, col, 12, 60, 250);
const breath = (t) => (p) => { const g = p.g; g.save(); g.lineCap = 'round'; for (let i = 0; i < 4; i++) { const k = (t * 1.6 + i / 4) % 1; g.globalAlpha = Math.sin(k * Math.PI); g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.beginPath(); g.moveTo(120 + k * 260, 380 + i * 40); g.quadraticCurveTo(220 + k * 260, 350 + i * 40, 320 + k * 260, 390 + i * 40); g.stroke(); } g.restore(); };
const windArrows = (t, col = '#ffffff') => (p) => { const g = p.g; g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; for (let i = 0; i < 3; i++) { const k = (t * 1.2 + i / 3) % 1; g.globalAlpha = Math.sin(k * Math.PI); const y = 300 + i * 170, x0 = -100 + k * 500; g.strokeStyle = '#1a2a5a'; g.lineWidth = 26; const path = () => { g.beginPath(); g.moveTo(x0, y); g.bezierCurveTo(x0 + 80, y - 50, x0 + 160, y + 50, x0 + 240, y); g.stroke(); g.beginPath(); g.moveTo(x0 + 200, y - 34); g.lineTo(x0 + 244, y); g.lineTo(x0 + 200, y + 34); g.stroke(); }; path(); g.strokeStyle = col; g.lineWidth = 14; path(); } g.restore(); };
const ring = (t) => (p) => { const g = p.g; g.save(); g.strokeStyle = '#ff9a3a'; g.lineWidth = 14 + Math.sin(t * 8) * 3; g.beginPath(); g.ellipse(300, 500, 150, 150, 0, 0, 7); g.stroke(); g.restore(); };
const word = (txt, col = '#ffd84a') => (t) => (p) => { const g = p.g; g.save(); g.font = '900 120px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 18; g.strokeStyle = '#1a1a3a'; g.fillStyle = col; const k = eo(t * 3); g.translate(300, 480); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); g.rotate(-0.08); g.strokeText(txt, 0, 0); g.fillText(txt, 0, 0); g.restore(); };
const walk = (t, sp = 2, stride = 18) => ({ step: (t * sp) % 1, stride });
// phases
const CALM = (pz = 34) => ({ H: { x: 0, z: 0 }, P: { x: 9, z: pz } });
const NEAR = { H: { x: 0, z: 0, rock: 1 }, P: { x: 12, z: 13, rock: 1 } };
const STORM = (k = 1) => ({ amp: 1.6 + 0.6 * k, chop: 1, rain: 1, preset: 'storm' });
const OIL = (k = 1, r = 11) => ({ k, r, off: [7, 0] });
const bolt = (seed) => (p) => { const g = p.g; g.save(); g.lineJoin = 'round'; const pts = []; let x = 300, y = 40; let r = seed * 9.7; for (let i = 0; i < 12; i++) { pts.push([x, y]); r = (r * 7.31 + 3.7) % 10; x += (r - 5) * 22; y += 75; } for (const [w, c] of [[40, 'rgba(160,200,255,.35)'], [18, '#cfe4ff'], [8, '#ffffff']]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.stroke(); } g.restore(); };
const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });

// 1 "The pirates are getting closer,"  low over the water: the black pirate ship bearing down astern
shot(0.0, (t, d) => { const pz = lerp(44, 30, t / d); return { preset: 'day', ships: CALM(pz), cam: L3([-5, 11, 70], [-4, 10, 56], ez(t / d)), look: [4.5, 3, lerp(16, 10, t / d)], fov: 54, amp: 0.4, spray: { p: [9, 0.4, pz - 15], w: 2.5, h: 2.2, rate: 2.2, s: 0.7, k: 0.5 } }; });
// 2 "and the ship's cook is pouring oil into the sea."  from the water: the cook at the rail, golden stream
shot(1.7, (t, d) => ({ preset: 'day', ships: CALM(33), amp: 0.4, camShip: 'H', cam: L3([8.6, 4.6, -6.5], [8.2, 4.7, -6.0], ez(t / d)), look: [3.8, 3.2, 0.4], fov: 48, oil: OIL(0.3, 5), pour: { ship: 'H', from: [3.75, 3.95, 0.3], w: 1.2, dx: 0.8 },
  actors: [act('cook', 3.25, 2.9, 0.5, { expr: 'squint', L: 'belly', R: 'belly', facing: 0.5 }, [{ kind: 'pot', c: [330, 540] }], { ship: 'H' }, t)] }));
// 3 "The captain grabs him by the apron."  the captain storms in and grabs a fistful of apron
shot(4.55, (t, d) => ({ preset: 'day', ships: CALM(31), amp: 0.4, camShip: 'H', cam: L3([0.6, 3.9, -2.6], [0.9, 3.8, -2.2], ez(t / d)), look: [2.3, 3.4, 0.8], fov: 46, oil: OIL(0.4, 6),
  actors: [H('cook', 2.9, 0.6, { expr: 'squint', L: 'belly', R: 'belly', facing: 0.3, tilt: t > 0.5 ? -6 : 0 }, [{ kind: 'pot', c: [330, 540], pour: false }], {}, t), H('captain', lerp(0.6, 1.9, eo(t / 0.5)), 1.1, { expr: 'stern', L: 'hang', R: { a: 90, e: 10 }, facing: 0.4, ...walk(t, 2.4, 20), step: t < 0.5 ? (t * 2.4) % 1 : 0 })] }));
// 4 "They're about to board us, and you're cooking?"  captain in his face; pirates over his shoulder
shot(6.75, (t, d) => ({ preset: 'day', ships: CALM(29), amp: 0.4, camShip: 'H', cam: L3([0.2, 4.0, -0.6], [0.4, 4.0, -0.2], ez(t / d)), look: [1.9, 3.8, 1.4], fov: 46, oil: OIL(0.5, 7),
  actors: [H('captain', 1.9, 1.3, { expr: 'stern', talk: true, L: 'hang', R: { a: 140 + wig(t, 9, 10), e: 30, finger: true }, facing: 0.5, shake: 1 }, [], {}, t), H('cook', 3.0, 0.4, { expr: 'squint', L: 'belly', R: 'belly', facing: 0.3 }, [{ kind: 'pot', c: [330, 540], pour: false }], {}, t), bubble('COOKING?!', 1.75, 4.55, 1.3, 0.34, { ship: 'H' })] }));
// 5 "He doesn't look up."  close on the cook: eyes on the pot
shot(9.35, (t, d) => ({ preset: 'day', ships: CALM(28), amp: 0.4, camShip: 'H', cam: [1.2, 4.1, -0.5], look: [2.9, 3.9, 0.5], fov: 40, oil: OIL(0.55, 7), actors: [H('cook', 3.15, 0.5, { expr: 'squint', L: 'belly', R: 'belly', facing: 0.4, look: 0.5 }, [{ kind: 'pot', c: [330, 540], pour: false }], {}, t)] }));
// 6 "He just points."
shot(10.6, (t, d) => ({ preset: 'day', ships: CALM(27), amp: 0.45, camShip: 'H', cam: L3([0.0, 3.9, -2.6], [0.2, 3.9, -2.3], ez(t / d)), look: [2.0, 3.8, 0.9], fov: 50, oil: OIL(0.6, 7),
  actors: [H('cook', 3.15, 0.5, { expr: 'squint', L: { a: lerp(60, 170, eo(t / 0.3)), e: 0, finger: true }, R: { a: 60, e: 40 }, facing: 0.3 }, [{ kind: 'pot', c: [330, 560], pour: false }], {}, t), H('captain', 1.6, 1.3, { expr: 'stern', L: 'hang', R: 'hang', facing: 0.5, look: 0.6 })] }));
// 7 "Black clouds."  the horizon: a wall of dark storm clouds over the sea
shot(11.9, (t, d) => ({ preset: 'dusk', ships: CALM(27), amp: 0.7, chop: 0.5, camShip: 'H', cam: L3([1.4, 4.2, -6.2], [1.2, 4.3, -6.8], ez(t / d)), look: [-4, 8, -60], fov: 54, flash: 0, actors: [H('captain', -0.7, -9.6, { expr: 'shock', L: 'hang', R: 'hang', look: -0.3 }), H('cook', 0.7, -9.9, { expr: 'squint', L: { a: 170, e: 0, finger: true }, R: 'hang' })] }));
// 8 "A storm."  lightning
shot(13.25, (t, d) => ({ preset: 'dusk', ships: CALM(26), amp: 0.9, chop: 0.6, cam: [-18, 4, -16], look: [0, 6, -60], fov: 54, flash: t > 0.15 && t < 0.3 ? 0.8 : t > 0.4 && t < 0.48 ? 0.5 : 0, shake: t > 0.15 && t < 0.5 ? 0.06 : 0, actors: t > 0.12 && t < 0.55 ? [fx(bolt(3), -4, 6, -90, 34, { yaw: undefined })] : [] }));
// 9 "Nobody survives a storm like that."  captain, pale and sweating
shot(14.2, (t, d) => ({ preset: 'dusk', ships: CALM(25), amp: 0.9, chop: 0.6, camShip: 'H', cam: L3([0.3, 4.1, -0.3], [0.4, 4.05, 0.1], ez(t / d)), look: [1.7, 3.9, 1.4], fov: 42,
  actors: [H('captain', 1.7, 1.4, { expr: 'shock', L: 'cheek', R: 'cheek', facing: 0.4, sweat: 3, tilt: wig(t, 28, 1.5) }, [], {}, t), bubble('Doomed!', 1.55, 4.8, 1.35, 0.36, { ship: 'H' })] }));
// 10 "Trust the oil, says the cook."  the cook, calm, a tiny smile
shot(16.6, (t, d) => ({ preset: 'dusk', ships: CALM(24), amp: 1.0, chop: 0.6, camShip: 'H', cam: L3([1.3, 4.15, -0.7], [1.4, 4.1, -0.3], ez(t / d)), look: [2.9, 3.9, 0.5], fov: 42, oil: OIL(0.7, 8),
  actors: [H('cook', 3.15, 0.5, { expr: 'smile', talk: t > 0.1 && t < 1.0, L: 'belly', R: 'belly', facing: 0.4 }, [{ kind: 'pot', c: [330, 540], pour: false }], {}, t), bubble('Trust the oil.', 2.75, 4.8, 0.45, 0.36, { ship: 'H' })] }));
// 11 "A grappling hook bangs off the rail."  the hook flies in from the pirate ship and clangs
shot(18.95, (t, d) => ({ preset: 'dusk', ships: { H: { x: 0, z: 0 }, P: { x: 12, z: 16 } }, amp: 1.1, chop: 0.7, camShip: 'H', cam: [1.0, 3.6, 3.8], look: [3.6, 3.5, 2.0], fov: 48, oil: OIL(0.7, 8),
  hook: { ship: 'P', from: [-3.6, 4.0, -6], toShip: 'H', to: [3.75, 3.55, 2.2], k: cl(t / 0.6) }, shake: t > 0.6 && t < 0.9 ? 0.05 : 0,
  actors: t > 0.6 ? [fx(burst(t - 0.6, '#fff0a0'), 3.75, 2.9, 2.2, 0.5, { ship: 'H' }), fx(word('CLANG!')(t - 0.6), 2.9, 3.3, 2.0, 0.42, { ship: 'H' })] : [] }));
// 12 "The captain spins the wheel."
shot(21.2, (t, d) => ({ preset: 'dusk', ships: { H: { x: 0, z: 0, wheel: -t * 9 }, P: { x: 12, z: 15 } }, amp: 1.2, chop: 0.7, camShip: 'H', cam: L3([0.9, 3.7, 3.6], [0.7, 3.7, 4.1], ez(t / d)), look: [0, 3.4, 7.2], fov: 48,
  actors: [H('captain', 0, 7.2, { expr: 'stubborn', L: { a: 100 + wig(t, 12, 30), e: 40 }, R: { a: 100 - wig(t, 12, 30), e: 40 }, facing: 0, tilt: wig(t, 6, 6) })] }));
// 13 "And the pirates?"  the pirate deck, crew at the rail
shot(23.1, (t, d) => ({ preset: 'dusk', ships: { H: { x: 0, z: 0 }, P: { x: 12, z: 15 } }, amp: 1.2, chop: 0.7, camShip: 'P', cam: L3([-1.5, 3.9, -11], [-1.2, 3.9, -10], ez(t / d)), look: [-1.6, 3.3, -4.4], fov: 50,
  actors: [PP('pirateCap', -1.6, -4.2, { expr: 'grin', L: 'hip', R: 'hang', facing: -0.2 }), PP('pirateA', -3.0, -4.8, { expr: 'grin', L: 'hang', R: 'hang' }, [{ hand: 1, kind: 'sword' }]), PP('pirateB', -0.2, -4.9, { expr: 'grin', L: 'hang', R: 'hang' })] }));
// 14 "They're thrilled."  laughing, bouncing
shot(24.15, (t, d) => ({ preset: 'dusk', ships: { H: { x: 0, z: 0 }, P: { x: 12, z: 15 } }, amp: 1.2, chop: 0.7, camShip: 'P', cam: [-1.4, 3.9, -9.6], look: [-1.6, 3.3, -4.4], fov: 48, orbit: 0.1 - t * 0.1,
  actors: [PP('pirateCap', -1.6, -4.2, { expr: 'laugh', L: 'belly', R: 'belly', facing: -0.2, tilt: wig(t, 14, 4) }), PP('pirateA', -3.0, -4.8, { expr: 'laugh', L: 'up', R: { a: 160 + wig(t, 10, 10), e: 0 } }, [{ hand: 1, kind: 'sword' }], { y: 2.5 + Math.abs(Math.sin(t * 9)) * 0.25 }), PP('pirateB', -0.2, -4.9, { expr: 'laugh', L: 'belly', R: 'up' }, [], { y: 2.5 + Math.abs(Math.sin(t * 9 + 1)) * 0.25 }), bubble('Ha ha!', -2.95, 5.0, -4.9, 0.36, { ship: 'P' })] }));
// 15 "Why waste cannonballs,"  the captain pats a cannon
shot(25.4, (t, d) => ({ preset: 'dusk', ships: { H: { x: 0, z: 0 }, P: { x: 12, z: 15 } }, amp: 1.3, chop: 0.8, camShip: 'P', cam: L3([0.2, 4.0, -2.6], [0.0, 4.0, -2.2], ez(t / d)), look: [-2.4, 3.4, 0.6], fov: 50,
  actors: [PP('pirateCap', -2.2, 0.8, { expr: 'grin', talk: true, L: { a: 40 + Math.abs(wig(t, 8, 20)), e: 30 }, R: 'hip', facing: -0.3 }, [], {}, t)] }));
// 16 "when the storm will sink them for free?"  points at the storm, the merchant ship small ahead
shot(27.0, (t, d) => ({ preset: 'storm', ships: { H: { x: 0, z: 0 }, P: { x: 12, z: 15 } }, amp: 1.5, chop: 0.9, rain: 0.5, camShip: 'P', cam: L3([0.4, 4.1, -7.2], [0.6, 4.2, -6.8], ez(t / d)), look: [-6, 4.4, -22], fov: 52,
  actors: [PP('pirateCap', -1.5, -10.4, { expr: 'laugh', talk: true, L: 'belly', R: { a: 150, e: 0, finger: true }, facing: -0.2 }, [], {}, t), bubble('FREE!', -1.3, 5.0, -10.5, 0.36, { ship: 'P' })] }));
// 17 "The waves grow taller than the mast."  wide storm: the ship climbing a giant swell
shot(28.85, (t, d) => ({ ...STORM(1), amp: 3.0, ships: { H: { x: 0, z: 0, rock: 1.2 }, P: { x: 14, z: 18, rock: 1.2 } }, cam: L3([-26, 3, 14], [-24, 4, 10], ez(t / d)), look: [0, 8, -4], fov: 55, flash: t > 1.2 && t < 1.3 ? 0.6 : 0, oil: OIL(0.5, 8) }));
// 18 "The crew ties themselves to anything nailed down."  sailors lashed to the mast, captain hugging the wheel
shot(31.15, (t, d) => ({ ...STORM(1), ships: { H: { x: 0, z: 0, rock: 1.3 }, P: { x: 14, z: 18 } }, camShip: 'H', cam: L3([-2.4, 3.8, -0.9], [-2.2, 3.9, -0.4], ez(t / d)), look: [-0.1, 3.5, 2.4], fov: 52, oil: OIL(0.6, 9),
  actors: [H('sailorA', -0.6, 2.2, { expr: 'shock', L: 'hang', R: 'hang', tilt: wig(t, 7, 5), sweat: 2 }, [{ kind: 'tied' }], {}, t), H('sailorB', 0.7, 2.3, { expr: 'nervous', L: 'hang', R: 'hang', tilt: wig(t + 1, 7, 5) }, [{ kind: 'tied' }], {}, t), bubble('Hold on!', 0.75, 4.75, 2.3, 0.34, { ship: 'H' })] }));
// 19 "But the cook keeps pouring."  in the rain, calm, pouring
shot(34.15, (t, d) => ({ ...STORM(1), ships: { H: { x: 0, z: 0, rock: 1.2 }, P: { x: 14, z: 18 } }, camShip: 'H', cam: L3([8.6, 4.8, -6.5], [8.2, 4.9, -6.0], ez(t / d)), look: [3.8, 3.2, 0.4], fov: 50, oil: OIL(0.8, 10), pour: { ship: 'H', from: [3.75, 3.95, 0.3], w: 1.2, dx: 0.8 },
  actors: [act('cook', 3.25, 2.9, 0.5, { expr: 'squint', L: 'belly', R: 'belly', facing: 0.5 }, [{ kind: 'pot', c: [330, 540] }], { ship: 'H' }, t)] }));
// 20 "Always on the windy side."  over his shoulder: white wind arrows blow onto the oil
shot(36.0, (t, d) => ({ ...STORM(1), ships: { H: { x: 0, z: 0, rock: 1.1 }, P: { x: 14, z: 18 } }, camShip: 'H', cam: L3([1.0, 4.4, 1.6], [1.2, 4.6, 1.2], ez(t / d)), look: [6.5, 2.0, 0], fov: 52, oil: OIL(0.85, 10), pour: { ship: 'H', from: [3.75, 3.6, 1.0], w: 1.2, dx: 0.8 },
  actors: [H('cook', 3.25, 0.5, { expr: 'squint', L: 'belly', R: 'belly', facing: 0.5 }, [{ kind: 'pot', c: [330, 540], pour: false }], {}, t), fx(windArrows(t), 7.5, 2.0, -0.2, 1.4, { ship: 'H', yaw: undefined })] }));
// 21 "The pirates swing in to board."  pirates on ropes swinging across
shot(37.95, (t, d) => { const k = ez(t / d); const sw = (i) => { const a = lerp(-0.9, 0.5, cl(k * 1.2 - i * 0.12)); return [12 - 3.6 - 7 * Math.sin(a + 0.9) * 0.9, 2.5 + 11 - 9 * Math.cos(a), 13 - 4 - i * 2.5]; };
  return { ...STORM(1), ships: { H: { x: 0, z: 0, rock: 1 }, P: { x: 12, z: 13, rock: 1 } }, cam: L3([-2, 6.2, 14.5], [-1.4, 6.4, 13.5], k), look: [5.5, 7, 6], fov: 50, oil: OIL(0.85, 10),
    ropes: [0, 1, 2].map((i) => ({ ship: 'P', top: [0, 13.5, -1 - i * 2.5], end: sw(i).map((v, j) => v + (j === 1 ? 1.6 : 0)) })), actors: [0, 1, 2].map((i) => act(['pirateA', 'pirateB', 'pirateC'][i], ...sw(i), { expr: 'laugh', L: 'up', R: { a: 120, e: 30 } }, [{ hand: 1, kind: 'sword' }], { blob: false, s: 1.1 })) }; });
// 22 "And straight ahead,"  the captain turns, frozen
shot(39.9, (t, d) => ({ ...STORM(1), ships: NEAR, camShip: 'H', cam: [0.8, 4.2, -2.0], look: [0.4, 4.0, 1.5], fov: 44, oil: OIL(0.85, 10),
  actors: [H('captain', 0.4, 1.5, { expr: 'shock', L: 'hang', R: 'hang', facing: lerp(0.6, -0.1, eo(t / 0.4)), look: -0.4 })] }));
// 23 "a wave big enough to swallow both ships rises out of the dark."
shot(41.05, (t, d) => { const k = ez(t / d); return { ...STORM(1), amp: 2.2, ships: { H: { x: 0, z: 0, rock: 1 }, P: { x: 12, z: 13, rock: 1 } }, cam: L3([-8, 3.0, 30], [-8, 3.2, 26], k), look: [0, lerp(8, 14, k), -40], fov: 58, wave: { z: -70, h: lerp(6, 24, eo(t / d)), curl: 0.2 }, flash: t > 2.2 && t < 2.32 ? 0.7 : 0 }; });
// 24 "You see,"  the galley: the cook at the counter
shot(45.1, (t, d) => ({ preset: 'galley', cam: L3([300.2, 1.9, 2.8], [300.2, 1.9, 2.4], ez(t / d)), look: [300.3, 1.55, -1.2], fov: 46, actors: [act('cook', 300.2, 0, -1.0, { expr: 'smile', L: 'hang', R: { a: 40, e: 30 }, facing: 0 })] }));
// 25 "sailors really did carry oil for this."  he plants the tin on the counter
shot(45.75, (t, d) => ({ preset: 'galley', cam: L3([301.6, 1.85, 1.4], [301.7, 1.8, 1.0], ez(t / d)), look: [301.9, 1.45, -1.6], fov: 46, actors: [act('cook', 301.4, 0, -0.9, { expr: 'grin', L: 'hang', R: { a: 60, e: 30, finger: true }, facing: 0.4 })] }));
// 26 "They called it storm oil."  macro on the tin
shot(48.3, (t, d) => ({ preset: 'galley', cam: L3([302.4, 1.6, -0.6], [302.5, 1.58, -0.9], ez(t / d)), look: [302.6, 1.5, -1.95], fov: 40, motes: true }));
// 27 "Blow on soup."  the cook leans over the bowl and blows
shot(50.2, (t, d) => ({ preset: 'galley', cam: [299.4, 1.75, 0.6], look: [300.2, 1.45, -1.7], fov: 46, blow: rg(t, 0.2, 0.5),
  actors: [act('cook', 299.75, -0.15, -1.25, { expr: T.withMouth('squint', 'o'), L: 'hang', R: { a: 40, e: 30 }, facing: 0.6, tilt: 10 }), fx(breath(t), 300.15, 1.3, -1.55, 0.35)] }));
// 28 "The broth ripples,"  bowl macro from above
shot(51.65, (t, d) => ({ preset: 'galley', cam: L3([300.4, 1.8, -1.55], [300.4, 1.72, -1.6], ez(t / d)), look: [300.4, 1.2, -1.86], fov: 40, blow: 1 }));
// 29 "but the oily spots stay flat."  orange ring around a flat spot
shot(52.9, (t, d) => ({ preset: 'galley', cam: [300.42, 1.62, -1.72], look: [300.42, 1.2, -1.86], fov: 38, blow: 1, actors: [fx(ring(t), 300.454, 1.21, -1.84, 0.08, { yaw: 0, roll: 0 })] }));
// 30 "Your breath can't grip them."  breath lines slide over the spot
shot(54.9, (t, d) => ({ preset: 'galley', cam: [300.4, 1.7, -1.6], look: [300.4, 1.2, -1.86], fov: 40, blow: 1, actors: [fx(breath(t), 300.35, 1.15, -1.85, 0.12)] }));
// 31 "Same with the sea."  high above: a smooth golden patch in a rough sea
shot(56.65, (t, d) => ({ ...STORM(1), amp: 2.4, ships: { H: { x: 0, z: 0, rock: 0.5 }, P: { x: 6, z: 45 } }, cam: L3([14, 34, 18], [12, 32, 14], ez(t / d)), look: [3, 0, -1], fov: 52, oil: OIL(1, 13), rain: 0.4 }));
// 32 "No grip,"  low over the slick: wind arrows skid across
shot(57.75, (t, d) => ({ ...STORM(1), amp: 2.4, ships: { H: { x: 0, z: 0, rock: 0.5 }, P: { x: 6, z: 45 } }, cam: [14, 2.6, 9], look: [4, 1.0, -4], fov: 50, oil: OIL(1, 13), actors: [fx(windArrows(t), 9, 1.6, 2, 2.4, {})] }));
// 33 "no breaking wave."  rough water stops at the slick edge
shot(58.55, (t, d) => ({ ...STORM(1), amp: 2.6, ships: { H: { x: 0, z: 0, rock: 0.5 }, P: { x: 6, z: 45 } }, cam: L3([24, 5, 6], [23, 5, 4], ez(t / d)), look: [6, 0.5, -2], fov: 52, oil: OIL(1, 13) }));
// 34 "So when the wave hits their oily patch,"  the giant wave arrives at the ship
shot(59.95, (t, d) => { const k = t / d; return { ...STORM(1), amp: 2.2, ships: { H: { x: 0, z: 0, rock: 0.6 }, P: { x: 6, z: 45 } }, cam: L3([-20, 5, 26], [-19, 5.5, 23], ez(k)), look: [0, 9, -12], fov: 58, oil: OIL(1, 13), wave: { z: lerp(-34, -14, k), h: 22, curl: 0.25 } }; });
// 35 "it just lifts the ship,"  the swell rolls smooth under the oil: up she goes
shot(61.6, (t, d) => { const k = t / d; return { ...STORM(1), amp: 2.0, ships: { H: { x: 0, z: 0, rock: 0.3, lift: 7 * Math.sin(Math.PI * cl(k * 1.1)) }, P: { x: 6, z: 45 } }, cam: [-22, 6, 6], look: [0, lerp(5, 10, ez(k)), 0], fov: 56, oil: OIL(1, 13),
  actors: [H('cook', 3.25, 0.5, { expr: 'smile', L: 'belly', R: 'belly' }, [{ kind: 'pot', c: [330, 560], pour: false }], {}, t)] }; });
// 36 "and puts it back down."  the crew opens their eyes, relieved
shot(63.2, (t, d) => ({ ...STORM(0.6), rain: 0.5, ships: { H: { x: 0, z: 0, rock: 0.5 }, P: { x: 6, z: 45 } }, camShip: 'H', cam: [-3.3, 3.9, -0.6], look: [-0.2, 3.5, 2.5], fov: 52, oil: OIL(1, 13),
  actors: [H('sailorA', -0.6, 2.2, { expr: 'smile_closed', L: 'hang', R: 'hang' }, [{ kind: 'tied' }], {}, t), H('sailorB', 0.7, 2.3, { expr: 'shock', L: 'hang', R: 'hang' }, [{ kind: 'tied' }], {}, t), H('captain', 1.9, 2.8, { expr: 'shock', L: 'cheek', R: 'hang' })] }));
// 37 "Fifty yards behind,"  the wave reaches the pirate ship
shot(64.6, (t, d) => { const k = t / d; return { ...STORM(1), amp: 2.2, ships: { H: { x: 0, z: 0, rock: 0.5 }, P: { x: 6, z: 45, rock: 1.2 } }, cam: L3([-16, 6, 78], [-15, 6.5, 75], ez(k)), look: [5, 9, 40], fov: 54, oil: OIL(1, 13), wave: { z: lerp(28, 34, k), h: 20, curl: 0.6 } }; });
// 38 "it curls over,"  under the lip: the pirates look up
shot(65.85, (t, d) => { const k = t / d; return { ...STORM(1), amp: 2.2, ships: { H: { x: 0, z: 0 }, P: { x: 6, z: 45, rock: 1.3 } }, cam: [-24, 9, 62], look: [4, 8, 42], fov: 56, wave: { z: lerp(34, 38, k), h: 20, curl: lerp(0.6, 1, k) },
  actors: [PP('pirateCap', -3.0, 2.0, { expr: 'shock', L: 'up', R: 'up', look: 0.5 }), PP('pirateA', -3.1, 0.6, { expr: 'shock', L: 'cheek', R: 'cheek' }), PP('pirateB', -3.0, 3.4, { expr: 'shock', L: 'up', R: 'cheek' })] }; });
// 39 "and crashes right onto the pirates' deck."  CRASH: spray explodes over the pirate ship
shot(67.2, (t, d) => { const k = t / d; return { ...STORM(1), amp: 2.4, ships: { H: { x: 0, z: 0 }, P: { x: 6, z: 45, rock: 2, pitch: 0.12 * Math.sin(t * 5), lift: -1.5 * eo(k) } }, cam: L3([-30, 6, 52], [-31, 6.5, 50], ez(k)), look: [6, 5, 44], fov: 56, oil: OIL(1, 13), wave: { z: lerp(38, 42, k), h: lerp(20, 9, eo(k)), curl: 1 },
  spray: { p: [6, 3, 44], w: 12, h: 9, rate: 1.0, s: 2.2 }, shake: 0.08 * (1 - k), flash: t < 0.1 ? 0.4 : 0 }; });

export const CUTS = SH.map((s) => s.t0);
export const stateAt = (f) => { const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--; const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0; const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i; return S; };
