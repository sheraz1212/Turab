// Airport EMAS short (66 s, 30 fps). Reference angles: low runway shots, wheel close-ups sinking into blocks, cliff drone, director close-ups with bubbles.
import * as T from './toon.js';
const FPS = 30;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)); const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t)); const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); }; const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const talkE = (t, e) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(e, 'o') : e);
const U = 2.36;
const prop = (p, pr, h, t) => { const [x, y] = h; const u = U;
  if (pr.kind === 'block') { p.poly([[x - 26 * u, y - 18 * u], [x + 26 * u, y - 18 * u], [x + 26 * u, y + 12 * u], [x - 26 * u, y + 12 * u]], '#c4c8cc', 2.6 * u); p.poly([[x - 26 * u, y - 18 * u], [x + 26 * u, y - 18 * u], [x + 20 * u, y - 26 * u], [x - 32 * u, y - 26 * u]], '#dde0e4', 2.2 * u); for (let k = 0; k < 8; k++) p.dot(x - 18 * u + (k * 37 % 36) * u, y - 10 * u + (k * 13 % 18) * u, 1.4 * u, '#8a9098'); }
  if (pr.kind === 'phone') { p.poly([[x - 7 * u, y - 22 * u], [x + 7 * u, y - 22 * u], [x + 7 * u, y + 6 * u], [x - 7 * u, y + 6 * u]], '#1a1c22', 2 * u); p.poly([[x - 5 * u, y - 19 * u], [x + 5 * u, y - 19 * u], [x + 5 * u, y + 2 * u], [x - 5 * u, y + 2 * u]], '#5ab0e8', 0); }
  if (pr.kind === 'sledge') { p.stroke([[x, y + 10 * u], [x + 6 * u, y - 46 * u]], 4 * u + 5, '#1a1414'); p.stroke([[x, y + 10 * u], [x + 6 * u, y - 46 * u]], 4 * u, '#c89a5a'); p.poly([[x - 10 * u, y - 58 * u], [x + 22 * u, y - 54 * u], [x + 21 * u, y - 42 * u], [x - 11 * u, y - 46 * u]], '#4a4e58', 2.4 * u); }
  if (pr.kind === 'clip') { p.poly([[x - 16 * u, y - 24 * u], [x + 16 * u, y - 24 * u], [x + 16 * u, y + 16 * u], [x - 16 * u, y + 16 * u]], '#c89a5a', 2.2 * u); p.poly([[x - 12 * u, y - 18 * u], [x + 12 * u, y - 18 * u], [x + 12 * u, y + 12 * u], [x - 12 * u, y + 12 * u]], '#f6f2ea', 1 * u); for (let k = 0; k < 4; k++) p.stroke([[x - 8 * u, y - 10 * u + k * 6 * u], [x + 8 * u, y - 10 * u + k * 6 * u]], 1.4 * u, '#5a5a6a'); } };
const life = (t, seed = 1) => ({ bob: 0.006 * Math.sin((t * 30 + seed * 11) * 0.11), headTilt: 2 * Math.sin(t * 1.6 + seed), blink: ((t * 30 + seed * 13) % (40 + seed * 7)) < 3 ? 1 : 0 });
const C = (who, o = {}, props = [], t = 0, seed = 1) => (p) => { const out = {}; const oo = { ...life(t, seed), ...o }; if (o.talk) { oo.expr = talkE(t, o.expr || 'smile'); if (!o.R) oo.R = { a: 55 + 28 * Math.sin(t * 7 + seed), e: 25 + 20 * Math.sin(t * 5) }; if (!o.L) oo.L = { a: 25 + 12 * Math.sin(t * 6 + 1), e: 15 }; } T.romanFront(p, who, { ...oo, out }); for (const pr of props) prop(p, pr, out.hands[pr.hand ?? 1], t); };
let SEED = 1; const act = (who, x, y, z, o = {}, props = [], extra = {}, t = 0) => ({ x, y, z, draw: C(who, o, props, t, (SEED = (SEED % 7) + 1)), ...extra });
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const pop = (txt, col = ['#fff6a0', '#ffd21a', '#e88a00']) => (t) => (p) => { const g = p.g, k = (1 - Math.pow(1 - cl(t * 4), 3)) * (1 + 0.12 * Math.sin(cl(t * 4) * Math.PI)); g.save(); g.translate(300, 190); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); g.rotate(-0.03); g.font = '900 70px Arial Black, Arial'; const w = g.measureText(txt).width + 60;
  g.fillStyle = '#1a1414'; g.beginPath(); g.roundRect(-w / 2 + 6, -54 + 8, w, 108, 18); g.fill(); g.fillStyle = '#ffffff'; g.strokeStyle = '#1a1414'; g.lineWidth = 8; g.beginPath(); g.roundRect(-w / 2, -54, w, 108, 18); g.fill(); g.stroke();
  g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#3a1a04'; g.strokeText(txt, 0, 25); const gr = g.createLinearGradient(0, -28, 0, 26); gr.addColorStop(0, col[0]); gr.addColorStop(0.45, col[1]); gr.addColorStop(1, col[2]); g.fillStyle = gr; g.fillText(txt, 0, 25);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-w / 2 + 30, -40, w - 60, 6); g.restore(); };
const popA = (txt, t, up = -0.36) => fx(pop(txt)(t), 0, 0, 0, 0.36, { hud: { d: 1.2, up }, order: 9 });
// big 3D-ish gold word with no box (EMAS title)
const gold = (txt, t, up = -0.3, sz = 150) => fx((p) => { const g = p.g, k = eo(t * 3) * (1 + 0.1 * Math.sin(cl(t * 3) * Math.PI)); g.save(); g.translate(300, 200); g.scale(k, k); g.font = `900 ${sz}px Arial Black, Arial`; g.textAlign = 'center'; g.lineJoin = 'round';
  for (let d = 12; d > 0; d -= 2) { g.fillStyle = '#7a4a00'; g.fillText(txt, d * 0.6, 50 + d); } g.lineWidth = 18; g.strokeStyle = '#2a1600'; g.strokeText(txt, 0, 50); const gr = g.createLinearGradient(0, -60, 0, 50); gr.addColorStop(0, '#fff8b0'); gr.addColorStop(0.5, '#ffd21a'); gr.addColorStop(1, '#e88a00'); g.fillStyle = gr; g.fillText(txt, 0, 50); g.restore(); }, 0, 0, 0, 0.36, { hud: { d: 1.2, up }, order: 9 });
const bub = (txt, t, x, y, z, s = 0.9, tail = -40) => fx((p) => { const k = eo(t * 5); p.g.save(); p.g.translate(300, 330); p.g.scale(k, k); p.g.translate(-300, -330); T.fxBubble(p, txt, { size: 64, tail }); p.g.restore(); }, x, y, z, s, { face: true, order: 8 });
const excl = (t, x, y, z, s = 0.6) => fx((p) => { const g = p.g, k = eo(t * 6); g.save(); g.translate(300, 300); g.scale(k, k); g.lineCap = 'round'; for (const a of [-0.5, 0, 0.5]) { g.strokeStyle = '#1a1414'; g.lineWidth = 26; g.beginPath(); g.moveTo(Math.sin(a) * 80, -Math.cos(a) * 80); g.lineTo(Math.sin(a) * 170, -Math.cos(a) * 170); g.stroke(); } g.restore(); }, x, y, z, s, { face: true });
const arrows = (t, label = 'ENERGY', k = 1) => (p) => { const g = p.g; g.save(); for (let i = 0; i < 3; i++) { const y = 380 + i * 110, off = ((t * 1.2 + i * 0.33) % 1) * 80; g.globalAlpha = k; g.fillStyle = '#2a9aff'; g.strokeStyle = '#0a2a5a'; g.lineWidth = 8; g.beginPath(); g.moveTo(40 + off, y - 16); g.lineTo(330 + off, y - 16); g.lineTo(330 + off, y - 40); g.lineTo(400 + off, y); g.lineTo(330 + off, y + 40); g.lineTo(330 + off, y + 16); g.lineTo(40 + off, y + 16); g.closePath(); g.fill(); g.stroke(); }
  g.globalAlpha = 1; g.font = '900 64px Arial Black, Arial'; g.textAlign = 'center'; g.lineWidth = 12; g.strokeStyle = '#2a1600'; g.strokeText(label, 300, 300); g.fillStyle = '#ffd21a'; g.fillText(label, 300, 300); g.restore(); };
const ft3 = (t) => (p) => { const g = p.g, k = eo(t * 4); g.save(); g.globalAlpha = k; g.strokeStyle = '#ffd21a'; g.fillStyle = '#ffd21a'; g.lineWidth = 12; g.beginPath(); g.moveTo(120, 520); g.lineTo(480, 520); g.stroke(); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(300 + s * 180, 520); g.lineTo(300 + s * 140, 490); g.lineTo(300 + s * 140, 550); g.fill(); }
  g.font = '900 110px Arial Black, Arial'; g.textAlign = 'center'; g.lineWidth = 16; g.strokeStyle = '#2a1600'; g.strokeText('3 FT', 300, 470); g.fillText('3 FT', 300, 470); g.restore(); };
const push = (t, d, a, b) => L3(a, b, ez(t / d)); const snap = (t, a, b, k = 0.2) => L3(a, b, eo(t / k));
const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });
const EDGE = 33.5, STOP = EDGE - 1.0; // nose-gear stop point (3 ft from the edge)
const WK = (x, z, o, props = [], t = 0, extra = {}) => act('aworker', x, 0, z, o, props, extra, t);
const DR = (x, z, o, props = [], t = 0, extra = {}) => act('director', x, 0, z, { glasses: true, ...o }, props, extra, t);
// jet nose-gear position during the Sunday run (x along the runway)
const jetRun = (t) => ({ x: t, alt: 0, pitch: 0 });
const crush = (tIn, x0, x1, d) => lerp(x0, x1, 1 - Math.pow(1 - cl(tIn / d), 2.2));

// ======== 1 "Every night, a quiet worker sneaks onto the runway with a cart full of gray blocks."
shot(0.0, (t, d) => ({ preset: 'night', laid: 0, jet: { x: -420 + t * 55, alt: 30 - t * 3, pitch: 0.06 }, cart: { x: -3.5 + t * 0.55, z: 8.5, ry: 0 }, cam: push(t, d, [4.5, 0.75, 12.5], [4.0, 0.8, 12.2]), look: [-4, 1.6, 8.2], fov: 50,
  actors: [WK(-5.0 + t * 0.55, 8.8, { expr: 'squint', L: { a: 70, e: 20 }, R: { a: 70, e: 20 }, step: t * 1.4, stride: 5 }, [], t)] }));
shot(2.3, (t, d) => ({ preset: 'night', laid: 0, cart: { x: -1.2, z: 8.5, ry: 0 }, cam: push(t, d, [0.6, 1.5, 11.6], [0.4, 1.5, 11.2]), look: [-2.6, 1.8, 8.8], fov: 46,
  actors: [WK(-2.6, 8.8, { expr: 'nervous', L: 'hip', R: { a: 30, e: 60 }, headTilt: 10 * Math.sin(t * 3) }, [], t)] }));
// ======== 2 "At the very end, right before a giant cliff,"
shot(4.79, (t, d) => ({ preset: 'night', laid: 0.08, cart: { x: 2.5, z: 9.5 }, cam: push(t, d, [-22, 9, 24], [-18, 8, 21]), look: [16, 0, 0], fov: 50, shadowExt: 40, actors: [WK(1.4, 10.2, { expr: 'squint', L: 'hip', R: 'hip' }, [], t)] }));
shot(5.74, (t, d) => ({ preset: 'night', laid: 0.1, sun: [0.7, 0.6, 0.3], key: 2.4, cam: push(t, d, [EDGE + 46, -22, 40], [EDGE + 40, -18, 34]), look: [EDGE, -14, 4], fov: 55, shadowExt: 40, actors: [] }));
// ======== 3 "he lays them down one by one."
shot(7.40, (t, d) => ({ preset: 'night', laid: 0.12 + t * 0.03, cart: { x: 31.4, z: 13.4, ry: 0.2 }, cam: push(t, d, [25.4, 1.2, 15.6], [25.6, 1.2, 15.2]), look: [29.5, 0.9, 10.5], fov: 50,
  actors: [WK(29.4, 11.8, { expr: 'smile_closed', R: { a: 80 + Math.sin(t * 5) * 10, e: 20 }, L: { a: 60, e: 30 } }, [{ kind: 'block', hand: 1 }], t)] }));
shot(8.35, (t, d) => ({ preset: 'night', laid: 0.16, hblock: [27.9, Math.max(0.27, 0.9 - t * 1.2), 10.1], minD: 1.6, cam: push(t, d, [26.2, 2.3, 13.6], [26.4, 2.2, 13.2]), look: [28.6, 0.3, 9.8], fov: 46, actors: [] }));
// ======== 4 "But these blocks are weak. Step on one, and it crumbles like a cookie."
shot(9.52, (t, d) => ({ preset: 'day', laid: 1, cam: push(t, d, [-3, 1.0, 9.5], [-2.2, 0.9, 8.6]), look: [6, 0.2, 2], fov: 50, shadowExt: 24, actors: [WK(2.6, 8.3, { expr: 'smug', L: 'hip', R: 'thumb' }, [], t)] }));
shot(10.89, (t, d) => ({ preset: 'day', laid: 1, tracks: [[7.4, 5.0 + ez(t / 0.8) * 1.3, 0.3, 5.0]], shake: t > 0.6 && t < 0.9 ? 0.03 : 0, cam: push(t, d, [7.2, 1.3, 12.2], [7.2, 1.25, 11.6]), look: [5.6, 1.4, 7.4], fov: 50,
  actors: [WK(5.6, 7.4, { expr: t < 0.7 ? 'smile' : 'shock', L: 'up', R: 'up', step: Math.min(t, 0.7) * 1.4, stride: 5 }, [], t, { y: t > 0.7 ? 0.52 - 0.18 * ez((t - 0.7) / 0.3) : 0.56 })] }));
shot(12.1, (t, d) => ({ preset: 'day', laid: 1, tracks: [[7.4, 6.3, 0.3, 5.0]], minD: 0.7, cam: push(t, d, [7.2, 1.5, 9.2], [7.0, 1.4, 8.9]), look: [5.7, 0.3, 7.4], fov: 42, actors: [] }));
// ======== 5 "A truck rolls over them, and its wheels sink right in."
shot(13.43, (t, d) => ({ preset: 'day', laid: 1, truck: { x: -7 + t * 4.2, z: -4.5 }, cam: push(t, d, [6.0, 1.0, 4.2], [6.0, 1.0, 3.8]), look: [-1.0, 1.6, -4.5], fov: 52, shadowExt: 20, actors: [] }));
shot(14.7, (t, d) => ({ preset: 'day', laid: 1, truck: { x: -0.4 + ez(t / d) * 2.4, z: -4.5 }, minD: 1.0, shake: 0.01, cam: push(t, d, [3.6, 0.6, -0.9], [3.8, 0.55, -1.2]), look: [1.6, 0.5, -3.3], fov: 46, actors: [] }));
// ======== 6 "The airport boss sees it and turns bright red."
shot(16.43, (t, d) => ({ preset: 'day', laid: 1, truck: { x: 2.0, z: -4.5 }, cam: snap(t, [-3.2, 1.45, 18.6], [-3.0, 1.45, 18.2]), look: [-3.0, 1.75, 15.5], fov: 48,
  actors: [DR(-3.0, 15.5, { expr: 'shock', L: 'hip', R: 'hip' }, [{ kind: 'clip', hand: 0 }], t), excl(t, -3.0, 2.75, 15.5, 0.7)] }));
shot(17.5, (t, d) => ({ preset: 'day', laid: 1, minD: 1.4, shake: 0.006, cam: push(t, d, [-2.6, 1.6, 17.3], [-2.7, 1.62, 17.05]), look: [-3.0, 1.95, 15.5], fov: 46,
  actors: [DR(-3.0, 15.5, { expr: 'rage', flush: ez(t / 0.6), L: 'fist', R: 'fist' }, [], t)] }));
// ======== 7 "You put garbage at the end of my runway?"
shot(19.02, (t, d) => ({ preset: 'day', laid: 1, cam: push(t, d, [-0.6, 1.3, 19.2], [-0.8, 1.3, 18.7]), look: [-1.4, 1.75, 15.0], fov: 50,
  actors: [DR(-2.6, 15.2, { expr: 'yell', flush: 0.7, talk: true, L: 'hip', R: 'point' }, [], t), WK(-0.4, 14.6, { expr: 'nervous', L: 'hip', R: 'cheek', sweat: 1 }, [], t), bub('GARBAGE?!', t, -2.4, 2.4, 15.2, 1.5)] }));
// ======== 8 "A plane hits this and people die!"
shot(21.4, (t, d) => ({ preset: 'day', laid: 1, minD: 1.4, shake: 0.008, cam: snap(t, [-2.2, 1.35, 17.5], [-2.3, 1.38, 17.2]), look: [-2.6, 1.95, 15.2], fov: 48,
  actors: [DR(-2.6, 15.2, { expr: 'yell', flush: 0.8, talk: true, L: 'fist', R: { a: 165, e: 10 } }, [], t), bub('PEOPLE DIE!', t, -2.6, 2.4, 15.2, 0.62)] }));
// ======== 9 "He slams a sign into the ground:"
shot(23.65, (t, d) => ({ preset: 'day', laid: 1, sign: { x: 0.0, y: Math.max(0, 1.6 - ez(t / 0.45) * 1.6), z: 14.2, ry: 0.15 }, shake: t > 0.45 && t < 0.75 ? 0.05 : 0, cam: push(t, d, [2.2, 1.3, 19.4], [2.0, 1.3, 18.9]), look: [0.2, 1.55, 14.4], fov: 52, keep: [[-1.2, 2.4, 14.2], [1.2, 2.4, 14.2], [-1.2, 0.2, 14.2], [1.2, 0.2, 14.2]],
  actors: [DR(-1.7, 14.8, { expr: 'rage', flush: 0.5, L: 'hip', R: { a: 120 - ez(t / 0.45) * 70, e: 20 } }, [], t)] }));
// ======== 10 "RIP IT OUT. MONDAY 8 AM."
shot(25.54, (t, d) => ({ preset: 'day', laid: 1, sign: { x: 0.0, z: 14.2, ry: 0.15 }, cam: push(t, d, [0.8, 1.6, 17.6], [0.6, 1.62, 17.2]), look: [0.0, 1.75, 14.2], fov: 46, keep: [[-1.1, 1.4, 14.2], [1.1, 1.4, 14.2]],
  actors: [DR(-1.9, 14.6, { expr: 'yell', talk: true, L: 'hip', R: 'point' }, [], t)] }));
shot(26.9, (t, d) => ({ preset: 'day', laid: 1, sign: { x: 0.0, z: 14.2, ry: 0.15 }, cam: push(t, d, [1.8, 1.35, 17.4], [1.7, 1.35, 17.1]), look: [1.1, 1.5, 14.2], fov: 48,
  actors: [WK(1.9, 14.8, { expr: 'pained', L: { a: 40, e: 60 }, R: { a: 40, e: 60 } }, [{ kind: 'block', hand: 1 }], t)] }));
// ======== 11 "But on Sunday, a passenger jet lands too fast in the rain."
shot(28.61, (t, d) => ({ preset: 'rain', laid: 1, jet: { x: -190 + t * 40, alt: 13 - t * 4, pitch: 0.07 }, cam: push(t, d, [-140, 1.6, 30], [-140, 1.8, 28]), look: [-196 + t * 40, 9, 0], fov: 50, shadowExt: 40, actors: [popA('SUNDAY', t)] }));
shot(29.46, (t, d) => ({ preset: 'rain', laid: 1, jet: { x: -330 + t * 60, alt: Math.max(0, 9 - t * 5), pitch: 0.07 - t * 0.025 }, cam: push(t, d, [-195, 2.0, 30], [-192, 2.2, 28]), look: [-300 + t * 50, 4, 0], fov: 46, shadowExt: 40, actors: [] }));
shot(30.6, (t, d) => ({ preset: 'rain', laid: 1, jet: { x: -248 + t * 45, alt: 0, pitch: 0.02 }, spray: 1, sprayLen: 3, cam: push(t, d, [-236, 1.4, 40], [-222, 1.6, 38]), look: [-256 + t * 45, 3, 0], fov: 50, shadowExt: 40, actors: [] }));
// ======== 12 "Its brakes scream."
shot(31.9, (t, d) => ({ preset: 'rain', laid: 1, jet: { x: -170 + t * 38, alt: 0, pitch: -0.01 }, spray: 1, sprayLen: 2.2, shake: 0.03, cam: (() => { const gx = -170 + t * 38 - 8.1; return [gx + 2.6, 0.7, 6.4]; })(), look: [-170 + t * 38 - 8.1, 0.7, 2.9], fov: 50, actors: [popA('SCREECH!', t, -0.6)] }));
// ======== 13 "The runway runs out."
shot(33.36, (t, d) => ({ preset: 'rain', laid: 1, jet: { x: -90 + t * 34, alt: 0 }, spray: 1, shake: 0.02, cam: (() => { const nx = -90 + t * 34; return [nx + 5, 4.8, 0.0]; })(), look: [40, 0.5, 0], fov: 55, near: 0.3, actors: [] }));
// ======== 14 "The cliff gets closer."
shot(34.66, (t, d) => ({ preset: 'rain', laid: 1, jet: { x: -50 + t * 30, alt: 0 }, spray: 1, sun: [0.6, 0.7, 0.3], cam: push(t, d, [EDGE + 44, -24, 26], [EDGE + 38, -18, 20]), look: [EDGE - 10, 0, 0], fov: 52, shadowExt: 60, actors: [] }));
// ======== 15 "Then the wheels hit the soft blocks."
shot(36.17, (t, d) => ({ preset: 'rain', laid: 1, jet: { x: -16 + t * 14, alt: 0 }, spray: 0.8, shake: 0.02, cam: push(t, d, [8, 0.7, 19], [8.5, 0.7, 18.5]), look: [-8 + t * 10, 1.4, 0], fov: 52, shadowExt: 30, actors: [] }));
// ======== 16 "Crunch. Crunch. Crunch."
const CR = (x0, x1) => (t, d) => ({ preset: 'rain', laid: 1, jet: { x: crush(t, x0, x1, d) + 8.1, alt: 0 }, spray: 1, sprayCol: '#d8dce4', shake: 0.04 * Math.max(0, 1 - t * 3), minD: 0.9,
  cam: [crush(t, x0, x1, d) + 2.4, 0.8, -2.9 + 3.2], look: [crush(t, x0, x1, d) - 0.2, 0.45, -2.9], fov: 46, actors: [popA('CRUNCH!', t, -0.6)] });
shot(38.54, CR(2.0, 4.6)); shot(39.31, CR(6.0, 8.4)); shot(40.05, CR(9.6, 12.0));
// ======== 17 "The jet sinks deeper with every row, slower and slower,"
shot(41.16, (t, d) => ({ preset: 'rain', laid: 1, jet: { x: crush(t, 20.5, 27.0, d), alt: 0 }, spray: 0.7, sprayCol: '#d8dce4', cam: push(t, d, [10, 3.0, 46], [13, 3.0, 44]), look: [16, 3.0, 0], fov: 50, shadowExt: 30, actors: [] }));
shot(43.27, (t, d) => ({ preset: 'rain', laid: 1, jet: { x: crush(t, 27.0, 31.2, d * 1.3), alt: 0 }, spray: 0.4, sprayCol: '#d8dce4', cam: push(t, d, [EDGE + 6, 2.2, -9], [EDGE + 5, 2.0, -8]), look: [26, 3.5, 0], fov: 52, shadowExt: 30, actors: [] }));
// ======== 18 "until it stops just three feet from the edge."
shot(44.77, (t, d) => ({ preset: 'rain', laid: 1, jet: { x: crush(t, 31.8, STOP, 0.8), alt: 0 }, minD: 1.0, cam: push(t, d, [EDGE + 0.4, 0.5, 3.2], [EDGE + 0.6, 0.5, 2.8]), look: [STOP - 0.4, 0.6, 0], fov: 54, actors: t > 0.9 ? [fx(ft3(t - 0.9), STOP + 0.5, 0.0, 0.6, 1.0, { face: true })] : [] }));
shot(45.95, (t, d) => ({ preset: 'rain', laid: 1, jet: { x: STOP, alt: 0 }, cam: push(t, d, [EDGE + 10, 9, 14], [EDGE + 12, 8, 16]), look: [EDGE - 4, -4, 0], fov: 55, shadowExt: 40, actors: [] }));
// ======== 19 "You see, this crushable concrete is built to break."
shot(47.48, (t, d) => ({ preset: 'day', laid: 1, jet: { x: 12, alt: 0 }, cam: push(t, d, [6.3, 0.7, 1.8], [6.1, 0.7, 1.4]), look: [3.6, 0.7, -2.9], fov: 48, actors: [] }));
shot(48.02, (t, d) => ({ preset: 'day', laid: 1, tracks: [[2.0, 14.6 + ez(t / d) * 2.4, 0.4]], minD: 0.8, cam: push(t, d, [17.8, 0.9, 4.4], [17.6, 0.8, 3.8]), look: [15.8, 0.2, 2.0], fov: 46, actors: [] }));
// ======== 20 "Every block that crumbles under the wheels eats up the plane's speed, like a giant sponge."
shot(50.64, (t, d) => ({ preset: 'day', laid: 1, jet: { x: crush(t, 13, 17.5, d), alt: 0 }, minD: 1.0, cam: [crush(t, 13, 17.5, d) - 8.1 + 0.4, 1.0, 1.6], look: [crush(t, 13, 17.5, d) - 8.1 - 0.4, 0.7, -2.9], fov: 52,
  actors: [fx(arrows(t, 'ENERGY', 1 - ez(t / d) * 0.75), 0, 0, 0, 0.36, { hud: { d: 1.2, up: -0.62 }, order: 9 })] }));
shot(52.7, (t, d) => ({ preset: 'day', laid: 1, jet: { x: crush(t, 22, 26, d), alt: 0 }, cam: push(t, d, [16, 2.2, 24], [18, 2.0, 23]), look: [18, 2.8, 0], fov: 50, shadowExt: 30, actors: [fx(arrows(t, 'SPEED', 1 - ez(t / d) * 0.8), 0, 0, 0, 0.36, { hud: { d: 1.2, up: -0.4 }, order: 9 })] }));
shot(55.17, (t, d) => ({ preset: 'day', laid: 1, tracks: [[2.0, 14.0, 0.5]], minD: 0.8, cam: push(t, d, [12.8, 1.0, 4.2], [12.6, 0.95, 3.8]), look: [11.2, 0.3, 1.8], fov: 44, actors: [popA('SPONGE!', t, -0.6)] }));
// ======== 21 "It's called EMAS, and real airports use it today."
shot(55.79, (t, d) => ({ preset: 'day', laid: 1, jet: { x: STOP, alt: 0 }, cam: push(t, d, [-20, 26, 42], [-16, 22, 38]), look: [16, 0, 0], fov: 50, shadowExt: 50, actors: [gold('EMAS', t, -0.28)] }));
shot(57.02, (t, d) => ({ preset: 'day', laid: 1, jet: { x: -60 + t * 6, alt: 0, z: 0 }, cam: push(t, d, [-20, 70, 170], [-10, 64, 160]), look: [-90, 0, 30], fov: 50, shadowExt: 80, actors: [] }));
// ======== 22 "On Monday, the demolition crew shows up and finds a jet sitting in the blocks."
shot(59.07, (t, d) => ({ preset: 'morn', laid: 1, jet: { x: STOP, alt: 0 }, sign: { x: 0.0, z: 14.2, ry: 0.15 }, cam: push(t, d, [-8, 1.4, 22], [-7.4, 1.4, 21.2]), look: [0, 1.8, 15], fov: 52,
  actors: [act('crewA', -2.0 + t * 0.9, 0, 16.4, { expr: 'smile', L: 'hip', R: { a: 140, e: 30 }, step: t * 1.6, stride: 6 }, [{ kind: 'sledge', hand: 1 }], {}, t), act('crewB', -3.6 + t * 0.9, 0, 17.4, { expr: 'grin', L: 'hip', R: { a: 140, e: 30 }, step: t * 1.6 + 0.5, stride: 6 }, [{ kind: 'sledge', hand: 1 }], {}, t), popA('MONDAY 8 AM', t)] }));
shot(59.79, (t, d) => ({ preset: 'morn', laid: 1, jet: { x: STOP, alt: 0 }, sign: { x: 0.0, z: 14.2, ry: 0.15 }, cam: snap(t, [2.2, 1.2, 20.4], [2.0, 1.2, 20.0]), look: [0.6, 1.9, 16.6], fov: 48,
  actors: [act('crewA', -0.2, 0, 16.4, { expr: 'shock', L: 'cheek', R: 'cheek' }, [], {}, t), act('crewB', 1.4, 0, 16.9, { expr: 'shock', L: 'hip', R: 'temple' }, [{ kind: 'sledge', hand: 0 }], {}, t), excl(t, 0.6, 2.9, 16.6, 0.7)] }));
shot(61.6, (t, d) => ({ preset: 'morn', laid: 1, jet: { x: STOP, alt: 0 }, cam: push(t, d, [6, 2.0, 30], [8, 2.2, 28]), look: [20, 3.5, 2], fov: 52, shadowExt: 40,
  actors: [act('crewA', 6.0, 0, 15.6, { expr: 'shock', L: 'up', R: 'up' }, [], {}, t), act('crewB', 7.6, 0, 16.2, { expr: 'shock', L: 'cheek', R: 'temple' }, [], {}, t)] }));
// ======== 23 "So the boss tears up the sign, and orders more garbage."
shot(63.37, (t, d) => ({ preset: 'morn', laid: 1, jet: { x: STOP, alt: 0 }, sign: { x: 0.0, z: 14.2, ry: 0.15, tear: ez((t - 0.3) / 0.6) }, cam: push(t, d, [0.8, 1.5, 18.4], [0.7, 1.5, 18.0]), look: [-0.3, 1.7, 14.6], fov: 50, keep: [[-1.2, 1.5, 14.2], [1.2, 1.5, 14.2]],
  actors: [DR(-2.1, 15.2, { expr: 'grin', L: { a: 150 - ez((t - 0.3) / 0.6) * 60, e: 40 }, R: { a: 150 - ez((t - 0.3) / 0.6) * 60, e: 40 } }, [], t)] }));
shot(64.75, (t, d) => ({ preset: 'morn', laid: 1, jet: { x: STOP, alt: 0 }, cart: { x: 1.6, z: 15.4, ry: 0.3 }, cam: push(t, d, [-1.0, 1.35, 19.6], [-0.9, 1.35, 19.2]), look: [-0.4, 1.7, 15.6], fov: 50,
  actors: [DR(-1.6, 15.6, { expr: 'wink', L: 'hip', R: 'thumb' }, [{ kind: 'phone', hand: 0 }], t), WK(0.6, 15.2, { expr: 'grin', L: 'up', R: 'up' }, [], t), popA('MORE GARBAGE!', t)] }));
export const TOTAL = Math.ceil(66.3 * FPS);
export const stateAt = (f) => { SEED = 0; const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--; const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0; const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i; frame(S); return S; };
function frame(S) { const MIN = S.minD ?? 1.6; const c = S.cam, l = S.look; let dx = c[0] - l[0], dy = c[1] - l[1], dz = c[2] - l[2]; const dist = Math.hypot(dx, dy, dz);
  if (dist < MIN) { const k = MIN / Math.max(dist, 1e-3); dx *= k; dz *= k; dy *= k; S.cam = [l[0] + dx, l[1] + dy, l[2] + dz]; }
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
        S.cam = cam; S.look = [cam[0] + d[0] * dist, cam[1] + d[1] * dist, cam[2] + d[2] * dist]; S.fov = vf * 180 / Math.PI; } } } }
export const SHOTS = SH.map((s) => s.t0);
