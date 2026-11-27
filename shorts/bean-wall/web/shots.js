// Bean Wall: test shots (71.4 s, 30 fps). Reference pacing: cut every ~1.5 s, camera always moving, close-ups, every line acted.
import * as T from './toon.js';
const FPS = 30;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)); const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t)); const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); }; const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const talkE = (t, e) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(e, 'o') : e);
const U = 2.36;
const prop = (p, pr, h, t) => { const [x, y] = h;
  if (pr.kind === 'jar') T.propHoney(p, x, y + 10, U * 1.3);
  if (pr.kind === 'dipper') T.propDipper(p, x, y, U * 1.2, 1);
  const u = U, I = '#1a1414';
  if (pr.kind === 'spoon') { p.stroke([[x, y], [x + 34 * u, y - 18 * u]], 4 * u + 5, I); p.stroke([[x, y], [x + 34 * u, y - 18 * u]], 4 * u, '#d8dce4'); p.ell(x + 40 * u, y - 21 * u, 9 * u, 6 * u, '#e8ecf2', 2.4 * u); p.ell(x + 40 * u, y - 23 * u, 4 * u, 2.6 * u, '#f2c84a', 1.4 * u); }
  if (pr.kind === 'bowl') { p.poly([[x - 26 * u, y - 6 * u], [x + 26 * u, y - 6 * u], [x + 18 * u, y + 12 * u], [x - 18 * u, y + 12 * u]], '#c8ccd4', 2.4 * u); for (let k = 0; k < 9; k++) p.ell(x - 18 * u + (k % 5) * 9 * u, y - 8 * u - Math.floor(k / 5) * 5 * u, 5 * u, 3.4 * u, '#f2c84a', 1.2 * u); }
  if (pr.kind === 'cup') { p.poly([[x - 11 * u, y - 16 * u], [x + 11 * u, y - 16 * u], [x + 9 * u, y + 10 * u], [x - 9 * u, y + 10 * u]], '#e8e4dc', 2.4 * u); p.ell(x, y - 16 * u, 11 * u, 3.4 * u, '#6ab8e8', 1.6 * u); }
  if (pr.kind === 'sausage') { p.stroke([[x - 4 * u, y + 2 * u], [x + 14 * u, y - 30 * u]], 2 * u + 4, I); p.stroke([[x - 4 * u, y + 2 * u], [x + 14 * u, y - 30 * u]], 2 * u, '#c8a070'); const sp = [[x + 8 * u, y - 24 * u], [x + 30 * u, y - 46 * u]]; p.stroke(sp, 15 * u + 6, I); p.stroke(sp, 15 * u, '#b8502a'); p.stroke([[x + 14 * u, y - 34 * u], [x + 22 * u, y - 42 * u]], 3 * u, '#e8906a'); }
  if (pr.kind === 'bucket') { p.poly([[x - 24 * u, y - 10 * u], [x + 24 * u, y - 10 * u], [x + 18 * u, y + 30 * u], [x - 18 * u, y + 30 * u]], '#8a5a32', 2.6 * u); for (const yy of [0, 20]) p.stroke([[x - 22 * u, y + yy * u], [x + 22 * u, y + yy * u]], 3 * u, '#3a3a40'); p.ell(x, y - 10 * u, 24 * u, 6 * u, '#5ab0e8', 2 * u); }
  if (pr.kind === 'beans') { for (let k = 0; k < 7; k++) p.ell(x - 10 * u + (k % 4) * 7 * u, y - Math.floor(k / 4) * 6 * u, 5 * u, 3.4 * u, '#f2c84a', 1.2 * u); }
  if (pr.kind === 'pot') { p.poly([[x - 30 * u, y - 12 * u], [x + 30 * u, y - 12 * u], [x + 24 * u, y + 26 * u], [x - 24 * u, y + 26 * u]], '#3a3a42', 2.6 * u); p.ell(x, y - 12 * u, 30 * u, 7 * u, '#c89a4a', 2 * u); for (let k = 0; k < 5; k++) p.ell(x - 14 * u + k * 7 * u, y - 13 * u, 4 * u, 2.6 * u, '#f2c84a', 1 * u); }
  if (pr.kind === 'bucketTip') { p.g.save(); p.g.translate(x, y); p.g.rotate(-1.1); p.g.translate(-x, -y); p.poly([[x - 24 * u, y - 10 * u], [x + 24 * u, y - 10 * u], [x + 18 * u, y + 30 * u], [x - 18 * u, y + 30 * u]], '#8a5a32', 2.6 * u); for (const yy of [0, 20]) p.stroke([[x - 22 * u, y + yy * u], [x + 22 * u, y + yy * u]], 3 * u, '#3a3a40'); p.g.restore(); }
  if (pr.kind === 'ticket') { p.poly([[x - 14 * u, y - 10 * u], [x + 14 * u, y - 14 * u], [x + 16 * u, y + 2 * u], [x - 12 * u, y + 6 * u]], '#ffd8a0', 2 * u); } };
const life = (t, seed = 1) => ({ bob: 0.006 * Math.sin((t * 30 + seed * 11) * 0.11), headTilt: 2 * Math.sin(t * 1.6 + seed), blink: ((t * 30 + seed * 13) % (40 + seed * 7)) < 3 ? 1 : 0 });
const C = (who, o = {}, props = [], t = 0, seed = 1) => (p) => { const out = {}; const oo = { ...life(t, seed), ...o }; if (o.talk) { oo.expr = talkE(t, o.expr || 'smile'); if (!o.R) oo.R = { a: 55 + 28 * Math.sin(t * 7 + seed), e: 25 + 20 * Math.sin(t * 5) }; if (!o.L) oo.L = { a: 25 + 12 * Math.sin(t * 6 + 1), e: 15 }; } T.romanFront(p, who, { ...oo, out }); for (const pr of props) prop(p, pr, out.hands[pr.hand ?? 1], t); };
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


const CX = -100, KX = -150, OX = -200, WZ = 0.05, CK = CX + 0.35, WX = KX + 2.1;
const VIS = (o) => ({ ...o, skin: '#e8b48c', freckles: true });
const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });
const zz = (t) => (p) => { const g = p.g; g.save(); g.font = '900 120px Arial Black, Arial'; g.lineWidth = 14; g.strokeStyle = '#0a1a2a'; g.fillStyle = '#7ae8d8'; for (let k = 0; k < 3; k++) { const y = 400 - k * 110 - (t * 60 % 110), x = 300 + k * 40; g.strokeText('Z', x, y); g.fillText('Z', x, y); } g.restore(); };
const buttons = (t) => (p) => { for (let k = 0; k < 6; k++) { const a = -0.4 - k * 0.45, d = 60 + t * 900, x = 300 + Math.cos(a) * d * (k % 2 ? 1 : -1), y = 520 + Math.sin(a) * d + t * t * 900; p.ell(x, y, 16, 16, '#e8c84a', 4); p.dot(x - 5, y, 3, '#7a5a1a'); p.dot(x + 5, y, 3, '#7a5a1a'); } };
const water = (t) => (p) => { const g = p.g; g.save(); g.lineCap = 'round'; for (let k = 0; k < 7; k++) { const off = (t * 4 + k * 0.17) % 1; g.strokeStyle = k % 2 ? '#8ad8ff' : '#4ab0f0'; g.lineWidth = 26 - k * 2; g.beginPath(); g.moveTo(150 + k * 6, 300); g.quadraticCurveTo(330, 280 + k * 10, 380 + k * 8, 620 + off * 60); g.stroke(); } for (let k = 0; k < 14; k++) { const a = k * 0.9, r = 40 + ((t * 300 + k * 37) % 120); p.ell(390 + Math.cos(a) * r, 640 + Math.sin(a) * r * 0.4, 9, 9, '#bfeaff', 3); } g.restore(); };
const shk = (t, k = 1) => [Math.sin(t * 80) * 0.03 * k, Math.cos(t * 70) * 0.02 * k, 0];
const add3 = (a, b) => a.map((v, i) => v + b[i]);
const pp = (t, a, b) => push(t, 1.6, a, b);
const conv = (x, z, o, props = [], t = 0, extra = {}) => act('convict', x, 0, z, o, props, extra, t);

// ======== 1 "Every night, this skinny prisoner pushes his dinner into the wall."
shot(0.0, (t, d) => ({ preset: 'cell', keep: [[CK, 1.3, -0.49], [CK, 0.7, -0.49]], beans: 0.05, cam: push(t, d, [CX + 1.8, 1.4, 1.65], [CX + 1.6, 1.42, 1.45]), look: [CX + 0.05, 1.6, -0.25], fov: 50,
  actors: [conv(CX + 0.0, WZ, { expr: 'smug', R: { a: 95 + Math.sin(t * 6) * 6, e: 10 }, L: { a: 40, e: 60 } }, [{ kind: 'spoon', hand: 1 }, { kind: 'bowl', hand: 0 }], t)] }));
shot(1.9, (t, d) => ({ preset: 'cell', beans: 0.06, minD: 1.0, zoomOut: 1, cam: push(t, d, [CK + 0.55, 0.95, 0.55], [CK + 0.45, 0.92, 0.45]), look: [CK - 0.25, 0.8, -0.45], fov: 46, actors: [] }));
// ======== 2 "One dry bean at a time, he packs them into a tiny crack."
shot(4.3, (t, d) => ({ preset: 'cell', keep: [[CK, 1.3, -0.49], [CK, 0.7, -0.49]], beans: 0.08 + t * 0.01, cam: push(t, d, [CX + 1.75, 1.35, 1.3], [CX + 1.6, 1.37, 1.15]), look: [CX + 0.05, 1.6, -0.25], fov: 48,
  actors: [conv(CX + 0.0, WZ, { expr: 'squint', R: { a: 92, e: 4, finger: true }, L: 'hip' }, [], t)] }));
shot(6.2, (t, d) => ({ preset: 'cell', beans: 0.1, minD: 0.9, zoomOut: 1, cam: push(t, d, [CK + 0.1, 0.85, 0.6], [CK + 0.05, 0.8, 0.35]), look: [CK, 0.72, -0.49], fov: 42, actors: [] }));
// ======== 3 "Then he pours in his water and whispers, 'Grow big.'"
shot(8.6, (t, d) => ({ preset: 'cell', keep: [[CK, 1.3, -0.49], [CK, 0.7, -0.49]], beans: 0.12, cam: push(t, d, [CX + 1.8, 1.4, 1.65], [CX + 1.6, 1.42, 1.45]), look: [CX + 0.05, 1.6, -0.25], fov: 50,
  actors: [conv(CX + 0.0, WZ, { expr: 'smile_closed', R: { a: 100, e: 10 }, L: 'hip' }, [{ kind: 'cup', hand: 1 }], t)] }));
shot(11.1, (t, d) => ({ preset: 'cell', beans: 0.12, minD: 1.2, zoomOut: 1, cam: snap(t, [CX + 0.7, 1.7, 1.05], [CX + 0.6, 1.72, 0.95]), look: [CX - 0.25, 1.85, -0.1], fov: 46,
  actors: [conv(CX - 0.25, WZ, { expr: 'smug', talk: t > 0.3 && t < 1.2, R: 'cheek', L: 'hip' }, [], t)] }));
// ======== 4 "The guards think he has lost his mind."
shot(12.9, (t, d) => ({ preset: 'cell', beans: 0.12, cam: push(t, d, [CX + 0.5, 1.5, 3.4], [CX + 0.6, 1.5, 3.1]), look: [CX + 2.2, 1.65, 1.2], fov: 50,
  actors: [act('guardA', CX + 2.15, 0, 0.9, { expr: 'laugh', L: 'belly', R: 'belly' }, [], {}, t), act('guardB', CX + 2.2, 0, 1.8, { expr: 'laugh', L: 'temple', R: 'belly' }, [], {}, t)] }));
shot(14.2, (t, d) => ({ preset: 'cell', beans: 0.12, cam: push(t, d, [CX + 1.0, 1.45, 2.3], [CX + 1.1, 1.45, 2.1]), look: [CX + 2.2, 1.9, 1.8], fov: 46,
  actors: [act('guardB', CX + 2.2, 0, 1.8, { expr: 'grin', L: 'temple', R: 'hip' }, [], {}, t)] }));
// ======== 5 "'Feeding the wall?' one laughs, waving a sausage under his nose."
shot(15.4, (t, d) => ({ preset: 'cell', beans: 0.12, cam: snap(t, [CX + 1.0, 1.4, 0.0], [CX + 1.05, 1.42, 0.1]), look: [CX + 2.15, 1.9, 0.9], fov: 46,
  actors: [act('guardA', CX + 2.15, 0, 0.9, { expr: 'laugh', talk: true, L: 'belly', R: 'point' }, [], {}, t)] }));
shot(16.9, (t, d) => ({ preset: 'dungeon', cam: push(t, d, [0.3, 1.45, 0.9], [0.25, 1.45, 0.7]), look: [0.05, 1.7, -1.0], fov: 50,
  actors: [act('guardA', -0.5, 0, -0.35, { expr: 'grin', R: { a: 100 + Math.sin(t * 9) * 10, e: 5 }, L: 'hip' }, [{ kind: 'sausage', hand: 1 }], {}, t), conv(0.45, -1.05, { expr: 'lick', L: 'hip', R: 'hip' }, [], t)] }));
shot(18.4, (t, d) => ({ preset: 'dungeon', minD: 1.3, zoomOut: 1, cam: push(t, d, [0.85, 1.55, 0.2], [0.8, 1.55, 0.05]), look: [0.42, 1.9, -1.05], fov: 46,
  actors: [conv(0.45, -1.05, { expr: 'lick', L: 'hip', R: 'hip' }, [], t), act('guardA', -0.1, 0, -0.45, { expr: 'grin', R: { a: 100 + Math.sin(t * 9) * 12, e: 5 }, L: 'hip' }, [{ kind: 'sausage', hand: 1 }], {}, t)] }));
// ======== 6 "The prisoner just smiles and gives the wall his last bean."
shot(19.85, (t, d) => ({ preset: 'cell', beans: 0.15, minD: 1.3, zoomOut: 1, cam: push(t, d, [CX + 0.5, 1.55, 1.2], [CX + 0.45, 1.56, 1.05]), look: [CX - 0.25, 1.9, -0.1], fov: 46,
  actors: [conv(CX - 0.25, WZ, { expr: 'grin', L: 'hip', R: 'hip' }, [], t)] }));
shot(21.3, (t, d) => ({ preset: 'cell', keep: [[CK, 1.3, -0.49], [CK, 0.7, -0.49]], beans: 0.16, cam: push(t, d, [CX + 1.8, 1.4, 1.65], [CX + 1.6, 1.42, 1.45]), look: [CX + 0.05, 1.6, -0.25], fov: 50,
  actors: [conv(CX + 0.0, WZ, { expr: 'smile_closed', R: { a: 95, e: 10 }, L: { a: 40, e: 60 } }, [{ kind: 'spoon', hand: 1 }], t)] }));
shot(22.6, (t, d) => ({ preset: 'cell', beans: 0.16 + ez(t / 0.6) * 0.01, minD: 0.9, zoomOut: 1, cam: push(t, d, [CK + 0.25, 0.95, 0.55], [CK + 0.12, 0.9, 0.35]), look: [CK, 0.85, -0.49], fov: 42, actors: [] }));
// ======== 7 "When the warden hears about it, he laughs so hard his buttons pop."
shot(23.95, (t, d) => ({ preset: 'stall', cam: push(t, d, [WX - 0.7, 1.35, 2.9], [WX - 0.55, 1.35, 2.6]), look: [WX - 0.1, 1.8, 0.5], fov: 50,
  actors: [act('warden', WX + 0.25, 0, 0.6, { expr: 'neutral', L: 'belly', R: 'belly' }, [], {}, t), act('guardB', WX - 0.75, 0, 0.9, { expr: 'grin', talk: true, R: 'cheek' }, [], {}, t)] }));
shot(25.4, (t, d) => ({ preset: 'stall', shake: t > 0.5 ? 0.015 : 0, cam: push(t, d, [WX - 0.2, 1.25, 2.6], [WX - 0.15, 1.25, 2.35]), look: [WX + 0.1, 1.7, 0.6], fov: 48,
  actors: [act('warden', WX + 0.1, 0, 0.6, { expr: 'laugh', L: 'belly', R: 'belly' }, [], {}, t), ...(t > 0.7 ? [fx(buttons(t - 0.7), WX + 0.1, 0.1, 0.75, 1)] : [])] }));
shot(26.75, (t, d) => ({ preset: 'stall', shake: 0.01, cam: push(t, d, [WX + 0.1, 1.5, 2.3], [WX + 0.1, 1.45, 2.1]), look: [WX + 0.1, 1.3, 0.6], fov: 46,
  actors: [act('warden', WX + 0.1, 0, 0.6, { expr: 'laugh', L: 'belly', R: 'belly' }, [], {}, t), fx(buttons(t + 0.2), WX + 0.1, 0.1, 0.75, 1)] }));
// ======== 8 "'Give him double beans!' he shouts. 'The wall looks hungry!'"
shot(27.9, (t, d) => ({ preset: 'stall', cam: snap(t, [WX + 0.3, 1.25, 2.7], [WX + 0.25, 1.25, 2.45]), look: [WX + 0.1, 1.65, 0.6], fov: 48,
  actors: [act('warden', WX + 0.1, 0, 0.6, { expr: 'yell', talk: true, L: 'belly', R: 'up' }, [], {}, t), popA('DOUBLE BEANS!', t)] }));
shot(30.3, (t, d) => ({ preset: 'stall', cam: push(t, d, [WX - 0.5, 1.3, 2.4], [WX - 0.4, 1.3, 2.2]), look: [WX + 0.1, 1.65, 0.6], fov: 48,
  actors: [act('warden', WX + 0.1, 0, 0.6, { expr: 'laugh', talk: true, L: 'belly', R: 'point' }, [], {}, t)] }));
// ======== 9 "So the prisoner gets double. And the crack gets fuller."
shot(32.1, (t, d) => ({ preset: 'cell', beans: 0.3, cam: push(t, d, [CX - 0.9, 2.3, 3.2], [CX - 0.7, 2.25, 2.9]), look: [CX - 0.1, 1.3, -0.1], fov: 50,
  actors: [conv(CX - 0.25, WZ, { expr: 'grin', L: { a: 40, e: 60 }, R: { a: 140, e: 60 } }, [{ kind: 'bowl', hand: 0 }, { kind: 'bowl', hand: 1 }], t)] }));
shot(33.2, (t, d) => ({ preset: 'cell', keep: [[CK, 1.3, -0.49], [CK, 0.7, -0.49]], beans: 0.35 + t * 0.1, cam: push(t, d, [CX + 1.8, 1.4, 1.65], [CX + 1.6, 1.42, 1.45]), look: [CX + 0.05, 1.6, -0.25], fov: 50,
  actors: [conv(CX + 0.0, WZ, { expr: 'wink', R: { a: 95 + Math.sin(t * 8) * 8, e: 10 }, L: { a: 40, e: 60 } }, [{ kind: 'spoon', hand: 1 }, { kind: 'bowl', hand: 0 }], t)] }));
shot(34.1, (t, d) => ({ preset: 'cell', beans: 0.45 + t * 0.12, minD: 1.2, cam: push(t, d, [CK + 0.4, 1.7, 1.3], [CK + 0.2, 1.65, 0.95]), look: [CK, 1.55, -0.49], fov: 44, actors: [] }));
// ======== 10 "Weeks pass. Ten thousand beans later, the guards start selling tickets."
shot(36.05, (t, d) => ({ preset: 'cell', beans: 0.65 + t * 0.15, cam: push(t, d, [CX + 2.9, 1.65, 1.1], [CX + 2.7, 1.62, 1.0]), look: [CX - 0.2, 1.55, 0.2], fov: 50,
  actors: [conv(CX - 0.6, 0.6, { expr: 'smug', L: 'hip', R: 'hip' }, [], t), popA('3 WEEKS LATER', t)] }));
shot(37.4, (t, d) => ({ preset: 'cell', beans: 1, cam: push(t, d, [CX + 2.6, 1.55, 0.6], [CX + 2.45, 1.55, 0.55]), look: [CX - 0.2, 1.7, -0.1], fov: 48,
  actors: [conv(CX - 0.3, WZ, { expr: 'smug', L: 'hip', R: 'thumb' }, [], t), popA('10,000 BEANS', t)] }));
shot(39.25, (t, d) => ({ preset: 'stall', cam: push(t, d, [KX - 0.4, 1.85, 4.2], [KX - 0.3, 1.8, 3.6]), look: [KX - 0.3, 1.45, 0.2], fov: 52,
  actors: [act('guardB', KX, 0, -0.75, { expr: 'grin', R: { a: 120 + Math.sin(t * 7) * 15, e: 30 } }, [{ kind: 'ticket', hand: 1 }], {}, t), act(VIS(T.OUTFITS.gent), KX - 0.5, 0, 0.2, { expr: 'smile' }, [], {}, t), act(VIS(T.OUTFITS.lady), KX - 1.0, 0, 0.8, { expr: 'grin' }, [], {}, t), act(VIS(T.OUTFITS.civA), KX - 1.5, 0, 1.4, { expr: 'smile' }, [], {}, t), act(VIS(T.OUTFITS.civB), KX - 2.0, 0, 2.0, { expr: 'laugh' }, [], {}, t)] }));
// ======== 11 "'Come see the Bean Wall!'"
shot(41.2, (t, d) => ({ preset: 'stall', cam: snap(t, [KX + 0.4, 1.35, 1.6], [KX + 0.35, 1.35, 1.45]), look: [KX, 1.95, -0.75], fov: 48,
  actors: [act('guardB', KX, 0, -0.75, { expr: 'yell', talk: true, L: 'up', R: { a: 120, e: 30 } }, [{ kind: 'ticket', hand: 1 }], {}, t)] }));
shot(42.25, (t, d) => ({ preset: 'cell', beans: 1, cam: push(t, d, [CX + 1.5, 1.4, 2.6], [CX + 1.35, 1.4, 2.3]), look: [CX + 0.2, 1.65, -0.2], fov: 52,
  actors: [act(VIS(T.OUTFITS.lady), CX - 0.3, 0, 0.35, { expr: 'shock', L: 'cheek', R: 'cheek' }, [], {}, t), act(VIS(T.OUTFITS.gent), CX + 0.95, 0, 0.4, { expr: 'shock', L: 'hip', R: 'temple' }, [], {}, t)] }));
// ======== 12 "But one hungry guard keeps stealing beans for his soup."
shot(43.4, (t, d) => ({ preset: 'cell', beans: 0.95, cam: push(t, d, [CX + 1.3, 1.2, 1.5], [CX + 1.2, 1.2, 1.3]), look: [CX - 0.05, 1.65, -0.1], fov: 50,
  actors: [act('guardA', CX - 0.05, 0, WZ, { expr: 'smug', R: { a: 120 + Math.sin(t * 6) * 15, e: 60 }, L: { a: 40, e: 70 } }, [{ kind: 'beans', hand: 1 }], {}, t)] }));
shot(44.85, (t, d) => ({ preset: 'cell', cam: push(t, d, [CX + 3.9, 1.25, 3.1], [CX + 3.75, 1.25, 2.9]), look: [CX + 3.0, 1.6, 1.4], fov: 50,
  actors: [act('guardA', CX + 3.0, 0, 1.4, { expr: 'lick', L: { a: 40, e: 60 }, R: { a: 70, e: 40 } }, [{ kind: 'pot', hand: 0 }, { kind: 'beans', hand: 1 }], {}, t)] }));
shot(45.95, (t, d) => ({ preset: 'cell', beans: 0.9, minD: 1.3, zoomOut: 1, cam: snap(t, [CX + 0.3, 1.5, 1.4], [CX + 0.25, 1.52, 1.25]), look: [CX - 0.25, 1.85, -0.1], fov: 46,
  actors: [conv(CX - 0.25, WZ, { expr: 'rage', flush: 0.6, L: 'fist', R: 'fist' }, [], t)] }));
// ======== 13 "So the prisoner shouts, 'The wall is thirsty!'"
shot(47.1, (t, d) => ({ preset: 'cell', beans: 0.9, cam: push(t, d, [CX - 0.25, 1.35, 2.3], [CX - 0.25, 1.38, 2.0]), look: [CX - 0.25, 1.75, 0], fov: 48,
  actors: [conv(CX - 0.25, WZ, { expr: 'yell', talk: true, R: 'up', L: 'hip' }, [], t)] }));
shot(48.45, (t, d) => ({ preset: 'cell', beans: 0.9, minD: 1.4, zoomOut: 1, cam: snap(t, [CX + 0.2, 1.4, 1.6], [CX + 0.15, 1.42, 1.45]), look: [CX - 0.25, 1.95, -0.1], fov: 46,
  actors: [conv(CX - 0.25, WZ, { expr: 'yell', talk: true, R: { a: 175, e: 0, finger: true }, L: 'hip' }, [], t)] }));
// ======== 14 "The warden grabs a bucket and soaks the crack himself."
shot(50.3, (t, d) => ({ preset: 'stall', shake: 0.01, cam: snap(t, [WX + 0.4, 1.2, 2.6], [WX + 0.35, 1.2, 2.35]), look: [WX + 0.1, 1.65, 0.6], fov: 48,
  actors: [act('warden', WX + 0.1, 0, 0.6, { expr: 'yell', flush: 1, talk: true, L: 'fist', R: { a: 130, e: 40 } }, [{ kind: 'bucket', hand: 1 }], {}, t)] }));
shot(51.55, (t, d) => ({ preset: 'cell', beans: 0.9, cam: push(t, d, [CX + 1.7, 1.35, 1.2], [CX + 1.5, 1.38, 1.0]), look: [CX - 0.05, 1.6, -0.2], fov: 50,
  actors: [act('warden', CX - 0.25, 0, WZ + 0.15, { expr: 'rage', flush: 1, R: { a: 120, e: 30 }, L: { a: 110, e: 40 } }, [{ kind: 'bucketTip', hand: 1 }], {}, t), fx(water(t), CX + 0.05, 0.45, WZ + 0.1, 1.0)] }));
shot(52.55, (t, d) => ({ preset: 'cell', beans: 0.95, minD: 1.1, cam: push(t, d, [CK + 0.45, 1.7, 1.0], [CK + 0.3, 1.65, 0.8]), look: [CK, 1.55, -0.49], fov: 44,
  actors: [fx(water(t + 0.3), CK - 0.35, 0.6, -0.35, 0.9)] }));
// ======== 15 "That night, everyone sleeps."
shot(53.85, (t, d) => ({ preset: 'night', beans: 1, swell: 0.05, cam: push(t, d, [CX + 3.5, 1.35, 3.1], [CX + 3.4, 1.35, 2.9]), look: [CX + 2.9, 1.7, 1.1], fov: 50,
  actors: [act('guardA', CX + 2.8, 0, 0.6, { expr: 'smile_closed', L: 'belly', R: 'belly', headTilt: 14 }, [], {}, t), act('guardB', CX + 3.0, 0, 1.6, { expr: 'smile_closed', L: 'belly', R: 'belly', headTilt: -12 }, [], {}, t), fx(zz(t), CX + 3.1, 1.5, 0.7, 0.6, { face: true })] }));
shot(55.0, (t, d) => ({ preset: 'night', beans: 1, swell: 0.08, cam: push(t, d, [CX + 1.8, 1.4, 1.65], [CX + 1.6, 1.42, 1.45]), look: [CX + 0.05, 1.6, -0.25], fov: 50,
  actors: [conv(CX - 0.25, WZ, { expr: 'smug', L: 'hip', R: 'hip', blink: 0 }, [], t)] }));
// ======== 16 "And the wall starts to creak."
shot(56.15, (t, d) => ({ preset: 'night', beans: 1, swell: 0.15 + t * 0.1, shake: 0.006, cam: push(t, d, [CX - 1.0, 1.7, 3.9], [CX - 0.8, 1.7, 3.5]), look: [CX + 0.4, 1.45, -0.4], fov: 52, actors: [conv(CX + 1.0, 0.4, { expr: 'smug', L: 'hip', R: 'hip' }, [], t)] }));
shot(57.2, (t, d) => ({ preset: 'night', beans: 1, swell: 0.3 + t * 0.1, shake: 0.01, minD: 1.2, cam: push(t, d, [CK + 0.3, 1.75, 1.3], [CK + 0.2, 1.7, 1.0]), look: [CK, 1.6, -0.49], fov: 44, actors: [] }));
// ======== 17 "You see, dry beans soaked in water swell up with huge force."
shot(58.45, (t, d) => ({ preset: 'night', beans: 1, swell: 0.4 + ez(t / d) * 0.25, minD: 0.7, zoomOut: 1, cam: push(t, d, [CK + 0.12, 1.65, 0.75], [CK + 0.05, 1.6, 0.5]), look: [CK, 1.6, -0.49], fov: 44, actors: [] }));
shot(60.7, (t, d) => ({ preset: 'night', beans: 1, swell: 0.65 + ez(t / d) * 0.15, minD: 0.7, zoomOut: 1, shake: 0.004, cam: push(t, d, [CK - 0.3, 1.2, 0.8], [CK - 0.2, 1.25, 0.6]), look: [CK, 1.35, -0.49], fov: 44, actors: [] }));
// ======== 18 "Packed tight in a crack, ten thousand of them push like a giant fist."
shot(62.95, (t, d) => ({ preset: 'night', beans: 1, swell: 0.8 + t * 0.05, burst: 0.1 * t, shake: 0.012, cam: push(t, d, [CX + 1.6, 1.4, 2.4], [CX + 1.4, 1.4, 2.1]), look: [CX + 0.35, 1.5, -0.5], fov: 50, actors: [] }));
shot(64.45, (t, d) => ({ preset: 'night', beans: 1, swell: 0.9 + t * 0.05, burst: 0.15 + t * 0.08, shake: 0.02, cam: snap(t, [CK + 0.6, 1.6, 1.8], [CK + 0.5, 1.6, 1.5]), look: [CK, 1.5, -0.49], fov: 46, actors: [popA('PUSH!', t)] }));
shot(66.0, (t, d) => ({ preset: 'night', beans: 1, swell: 1, burst: 0.3, shake: 0.015, cam: push(t, d, [CX + 3.5, 1.3, 3.0], [CX + 3.4, 1.3, 2.8]), look: [CX + 2.9, 1.85, 1.1], fov: 48,
  actors: [act('guardA', CX + 2.8, 0, 0.6, { expr: 'shock', L: 'up', R: 'up' }, [], {}, t), act('guardB', CX + 3.0, 0, 1.6, { expr: 'terror', L: 'temple', R: 'temple', sweat: 1 }, [], {}, t)] }));
// ======== 19 "With one loud crack, the wall splits open,"
shot(67.7, (t, d) => ({ preset: 'night', beans: 1, swell: 1, burst: 0.4 + t, flood: Math.min(0.9, t * 0.9), fly: Math.min(1, t * 0.8), flash: Math.max(0, 1 - t * 4) * 0.8, shake: Math.max(0, 0.05 - t * 0.03), cam: push(t, d, [CX + 0.3, 1.9, 3.6], [CX + 0.3, 2.0, 3.9]), look: [CX + 0.2, 1.2, -0.3], fov: 54, actors: [] }));
shot(69.5, (t, d) => ({ preset: 'night', beans: 1, swell: 1, burst: 1.5, flood: 0.95, cam: push(t, d, [CX + 1.2, 1.5, 3.0], [CX + 1.0, 1.5, 2.7]), look: [CX - 0.3, 1.4, 0.6], fov: 52,
  actors: [conv(CX - 0.45, 0.8, { expr: 'grin', L: 'up', R: 'up' }, [], t, { y: 0.15 })] }));
// ======== 20 "and the prisoner the warden fed walks right out."
shot(71.05, (t, d) => ({ preset: 'out', flood: 0.8, floodAt: [OX, 1.0], cam: push(t, d, [OX + 0.4, 1.75, 4.2], [OX + 0.3, 1.7, 3.7]), look: [OX, 1.4, 0.8], fov: 50,
  actors: [act('convict', OX - 0.1, 0, 0.8 + ez(t / 1.3) * 1.2, { expr: 'wink', L: 'hip', R: 'wave', wv: t * 8, step: t * 1.6, stride: 6 }, [], {}, t)] }));
shot(72.65, (t, d) => ({ preset: 'night', beans: 1, swell: 1, burst: 1.5, flood: 0.95, cam: snap(t, [CX + 1.2, 1.35, 3.1], [CX + 1.1, 1.35, 2.9]), look: [CX + 0.2, 1.6, 0.6], fov: 48,
  actors: [act('warden', CX + 0.2, 0.12, 0.6, { expr: 'scream', flush: 1, L: 'temple', R: 'temple' }, [], {}, t)] }));
export const TOTAL = Math.ceil(73.9 * FPS);
export const stateAt = (f) => { SEED = 0; const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--; const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0; const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i; frame(S); return S; };
function frame(S) { const MIN = S.minD ?? 1.6; const c = S.cam, l = S.look; let dx = c[0] - l[0], dy = c[1] - l[1], dz = c[2] - l[2]; const dist = Math.hypot(dx, dy, dz);
  if (dist < MIN) { const k = MIN / Math.max(dist, 1e-3); dx *= k; dz *= k; dy *= k; S.cam = [l[0] + dx, l[1] + dy, l[2] + dz]; }
  // keep every character (and its props) fully inside the 9:16 frame with a margin on every side
  { const acts = (S.actors || []).filter((a) => !a.fx && !a.hud && !a.face && !a.crop);
    if (acts.length) { const asp = 1080 / 1920, c0 = S.cam; let f = [S.look[0] - c0[0], S.look[1] - c0[1], S.look[2] - c0[2]]; const dist = Math.hypot(...f); f = f.map((v) => v / dist);
      let r = [-f[2], 0, f[0]]; const rl = Math.hypot(...r) || 1; r = r.map((v) => v / rl); const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; let mn = 9, mx = -9, zs = 0, zn = 0, top = -9;
      for (const a of acts) { const sc = a.s || 1, w = 0.58 * sc; for (const hy of [0.3, 1.0, 1.7]) { const q = [a.x - c0[0], (a.y || 0) + hy * sc - c0[1], a.z - c0[2]]; const z = dot(q, f); if (z < 0.15) continue; const xs = dot(q, r); mn = Math.min(mn, Math.atan2(xs - w, z)); mx = Math.max(mx, Math.atan2(xs + w, z)); zs += z; zn++; }
        const qt = [a.x - c0[0], (a.y || 0) + 2.15 * sc - c0[1], a.z - c0[2]]; const zt = dot(qt, f); if (zt > 0.15) top = Math.max(top, Math.atan2(dot(qt, u), zt)); }
      for (const k of S.keep || []) { const q = [k[0] - c0[0], k[1] - c0[1], k[2] - c0[2]]; const z = dot(q, f); if (z < 0.15) continue; const xs = dot(q, r); mn = Math.min(mn, Math.atan2(xs - 0.12, z)); mx = Math.max(mx, Math.atan2(xs + 0.12, z)); zs += z; zn++; }
      if (zn) { const c = (mn + mx) / 2, cs = Math.cos(c), sn = Math.sin(c); let d = [f[0] * cs + r[0] * sn, f[1] * cs + r[1] * sn, f[2] * cs + r[2] * sn];
        const h = (mx - mn) / 2 * 1.1; let vf = (S.fov || 45) * Math.PI / 180; const hf = Math.atan(Math.tan(vf / 2) * asp); let cam = c0;
        if (h > hf) { vf = 2 * Math.atan(Math.tan(h) / asp); const cap = 72 * Math.PI / 180; if (vf > cap) { const zc = zs / zn, need = Math.tan(h), have = Math.tan(cap / 2) * asp; const back = zc * (need / have - 1); vf = cap; cam = [c0[0] - d[0] * back, c0[1] - d[1] * back, c0[2] - d[2] * back]; } }
        const lim = vf / 2 * 0.86; if (top > lim) { const tilt = top - lim; d = [d[0] * Math.cos(tilt) + u[0] * Math.sin(tilt), d[1] * Math.cos(tilt) + u[1] * Math.sin(tilt), d[2] * Math.cos(tilt) + u[2] * Math.sin(tilt)]; }
        S.cam = cam; S.look = [cam[0] + d[0] * dist, cam[1] + d[1] * dist, cam[2] + d[2] * dist]; S.fov = vf * 180 / Math.PI; } } }
  const Z = S.zoomOut ?? 1.0; const c2 = S.cam; S.cam = [l[0] + (c2[0] - l[0]) * Z, l[1] + (c2[1] - l[1]) * Z, l[2] + (c2[2] - l[2]) * Z]; }
export const SHOTS = SH.map((s) => s.t0);
