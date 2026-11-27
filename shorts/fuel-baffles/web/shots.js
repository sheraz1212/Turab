// Time Test short (38.5 s). Reference style: almost no hard cuts; the camera never stops, rides with the falling
// jumper, orbits groups, and dives INTO an eye / window to reach the next scene (white flash at the join).
import * as T from './toon.js';
const FPS = 30;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)); const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t)); const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); }; const eo = (t) => 1 - Math.pow(1 - cl(t), 3); const ei = (t) => Math.pow(cl(t), 2.4);
const talkE = (t, e) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(e, 'o') : e);
const U = 2.36; const TX = 600, TR = 3.2, TL = 34, GX = 900, DX = 1200, XX = -600;
const prop = (p, pr, h, t) => { const [x, y] = h; const u = U, g = p.g;
  if (pr.kind === 'watch') { p.poly([[x - 14 * u, y - 12 * u], [x + 14 * u, y - 12 * u], [x + 14 * u, y + 8 * u], [x - 14 * u, y + 8 * u]], '#1a1a22', 2.4 * u); g.save(); g.font = `900 ${13 * u}px Courier New`; g.textAlign = 'center'; g.fillStyle = '#ff4a2a'; g.fillText(String(10 + Math.floor(t * 20) % 89), x, y + 3 * u); g.restore(); }
  if (pr.kind === 'clip') { p.poly([[x - 16 * u, y - 24 * u], [x + 16 * u, y - 24 * u], [x + 16 * u, y + 16 * u], [x - 16 * u, y + 16 * u]], '#c89a5a', 2.2 * u); p.poly([[x - 12 * u, y - 18 * u], [x + 12 * u, y - 18 * u], [x + 12 * u, y + 12 * u], [x - 12 * u, y + 12 * u]], '#f6f2ea', 1 * u); for (let k = 0; k < 4; k++) p.stroke([[x - 8 * u, y - 10 * u + k * 6 * u], [x + 8 * u, y - 10 * u + k * 6 * u]], 1.4 * u, '#5a5a6a'); }
  if (pr.kind === 'stopwatch') { p.ell(x, y - 4 * u, 15 * u, 15 * u, '#f4f4f0', 2.6 * u); p.ell(x, y - 21 * u, 4 * u, 3 * u, '#c8c8d0', 1.6 * u); p.stroke([[x, y - 4 * u], [x + 8 * u, y - 10 * u]], 2 * u, '#e0262a'); }
  if (pr.kind === 'torch') { p.poly([[x - 6 * u, y - 4 * u], [x + 34 * u, y - 10 * u], [x + 36 * u, y - 2 * u], [x - 6 * u, y + 6 * u]], '#3a3a44', 2 * u); p.ell(x + 40 * u, y - 6 * u, 7 * u, 7 * u, '#d8f8ff', 0); }
  if (pr.kind === 'toycar') { p.poly([[x - 16 * u, y - 4 * u], [x + 16 * u, y - 4 * u], [x + 16 * u, y + 6 * u], [x - 16 * u, y + 6 * u]], '#e0262a', 2 * u); p.poly([[x - 8 * u, y - 12 * u], [x + 6 * u, y - 12 * u], [x + 9 * u, y - 4 * u], [x - 10 * u, y - 4 * u]], '#b8d8f0', 1.6 * u); } };
const life = (t, seed = 1) => ({ bob: 0.006 * Math.sin((t * 30 + seed * 11) * 0.11), headTilt: 2 * Math.sin(t * 1.6 + seed), blink: ((t * 30 + seed * 13) % (40 + seed * 7)) < 3 ? 1 : 0 });
const C = (who, o = {}, props = [], t = 0, seed = 1) => (p) => { const out = {}; const oo = { ...life(t, seed), ...o }; if (o.talk) { oo.expr = talkE(t, o.expr || 'smile'); if (!o.R) oo.R = { a: 55 + 28 * Math.sin(t * 7 + seed), e: 25 + 20 * Math.sin(t * 5) }; if (!o.L) oo.L = { a: 25 + 12 * Math.sin(t * 6 + 1), e: 15 }; } T.romanFront(p, who, { ...oo, out }); for (const pr of props) prop(p, pr, out.hands[pr.hand ?? 1], t); };
let SEED = 1; const act = (who, x, y, z, o = {}, props = [], extra = {}, t = 0) => ({ x, y, z, draw: C(who, o, props, t, (SEED = (SEED % 7) + 1)), ...extra });
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const hud = (fn, up = 0, s = 0.36, extra = {}) => fx(fn, 0, 0, 0, s, { hud: { d: 1.2, up, right: extra.right || 0 }, order: 9, ...extra });
const pop = (txt, col = ['#fff6a0', '#ffd21a', '#e88a00'], sz = 70) => (t) => (p) => { const g = p.g, k = (1 - Math.pow(1 - cl(t * 4), 3)) * (1 + 0.12 * Math.sin(cl(t * 4) * Math.PI)); g.save(); g.translate(300, 190); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); g.rotate(-0.03); g.font = `900 ${sz}px Arial Black, Arial`; const w = g.measureText(txt).width + 60;
  g.fillStyle = '#1a1414'; g.beginPath(); g.roundRect(-w / 2 + 6, -54 + 8, w, 108, 18); g.fill(); g.fillStyle = '#ffffff'; g.strokeStyle = '#1a1414'; g.lineWidth = 8; g.beginPath(); g.roundRect(-w / 2, -54, w, 108, 18); g.fill(); g.stroke();
  g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#3a1a04'; g.strokeText(txt, 0, 25); const gr = g.createLinearGradient(0, -28, 0, 26); gr.addColorStop(0, col[0]); gr.addColorStop(0.45, col[1]); gr.addColorStop(1, col[2]); g.fillStyle = gr; g.fillText(txt, 0, 25); g.restore(); };
const popA = (txt, t, up = -0.6, col) => hud(pop(txt, col)(t), up);
const RED = ['#ffb0a0', '#ff4a2a', '#c8120a'], GRN = ['#d8ffb0', '#6ad83a', '#2a9a1a'];
const bub = (txt, t, x, y, z, s = 0.9, tail = -40) => fx((p) => { const k = eo(t * 5); p.g.save(); p.g.translate(300, 330); p.g.scale(k, k); p.g.translate(-300, -330); T.fxBubble(p, txt, { size: 64, tail }); p.g.restore(); }, x, y, z, s, { face: true, order: 8 });
const qmark = (t, x, y, z, s = 0.5) => fx((p) => { const g = p.g, k = eo(t * 5); g.save(); g.translate(300, 860); g.scale(k, k); g.rotate(Math.sin(t * 6) * 0.15); g.font = '900 220px Arial Black, Arial'; g.textAlign = 'center'; g.lineWidth = 22; g.strokeStyle = '#1a1414'; g.strokeText('?', 0, 0); g.fillStyle = '#ffd21a'; g.fillText('?', 0, 0); g.restore(); }, x, y, z, s, { face: true, order: 7 });
const push = (t, d, a, b) => L3(a, b, ez(t / d)); const snap = (t, a, b, k = 0.25) => L3(a, b, eo(t / k));
const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });
const J = (who, x, y, z, o, props = [], t = 0, extra = {}) => act(who, x, y, z, o, props, extra, t);
// falling jumper (slow-motion gravity so the fall reads)
const FALL0 = 1.3, GSLOW = 2.4; const jy = (t) => TH + 0.4 - 0.5 * GSLOW * Math.max(0, t - FALL0) ** 2; const JZ = 4.4;
// dive-in helper: camera flies from `from` toward a target point and the frame flashes white at the end
const dive = (t, d, from, target, k0 = 0.35) => { const k = ei((t / d - k0) / (1 - k0)); return { cam: L3(from, target.map((v, i) => v + (from[i] - v) * 0.04), k), look: target, flash: cl((t / d - 0.82) / 0.18) }; };
const flashIn = (t) => cl(1 - t / 0.25);


// ---- HUD counter box (GALLONS / INCHES LEFT / tons) like the reference ----
const counter = (label, val, t, col = '#ffd21a', up = 0.05, delta = '') => hud((p) => { const g = p.g, k = eo(t * 5); g.save(); g.translate(300, 860); g.scale(k, k); g.fillStyle = '#1a1c24'; g.strokeStyle = '#f4f4f0'; g.lineWidth = 6; g.beginPath(); g.roundRect(-150, -92, 300, 150, 22); g.fill(); g.stroke();
  g.textAlign = 'center'; g.fillStyle = '#c8ccd4'; g.font = '900 30px Arial'; g.fillText(label, 0, -50); g.font = '900 84px Arial Black, Arial'; g.fillStyle = col; g.fillText(val, 0, 36);
  if (delta) { g.font = '900 64px Arial Black, Arial'; g.lineWidth = 10; g.strokeStyle = '#1a1414'; g.strokeText(delta, 0, -120 - t * 30); g.fillStyle = '#ff4a2a'; g.fillText(delta, 0, -120 - t * 30); } g.restore(); }, up, 0.36);
const cash = (t, x, y, z, s = 0.5) => fx((p) => { const g = p.g; for (let i = 0; i < 6; i++) { const k = (t * 0.9 + i / 6) % 1; g.save(); g.translate(150 + i * 60 + Math.sin(k * 8 + i) * 30, 900 - k * 800); g.rotate(k * 4 + i); p.poly([[-50, -24], [50, -24], [50, 24], [-50, 24]], '#5ac85a', 5); p.ell(0, 0, 14, 14, '#2a8a3a', 3); g.restore(); } }, x, y, z, s, { face: true, order: 7 });
const check = (ok, t, up = 0.1) => hud((p) => { const g = p.g, k = eo(t * 5); g.save(); g.translate(300, 860); g.scale(k, k); if (ok) { g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#1a1414'; g.lineWidth = 60; g.beginPath(); g.moveTo(-90, 0); g.lineTo(-20, 70); g.lineTo(110, -90); g.stroke(); g.strokeStyle = '#4ae04a'; g.lineWidth = 36; g.stroke(); } else { g.lineWidth = 36; g.strokeStyle = '#1a1414'; g.beginPath(); g.arc(0, 0, 100, 0, 7); g.stroke(); g.strokeStyle = '#ff3a2a'; g.lineWidth = 22; g.beginPath(); g.arc(0, 0, 100, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-70, -70); g.lineTo(70, 70); g.stroke(); } g.restore(); }, up, 0.3);
const arrowHud = (t, label, up = -0.2) => hud((p) => { const g = p.g, off = ((t * 1.5) % 1) * 60; g.save(); for (let i = 0; i < 3; i++) { const y = 700 + i * 90; g.fillStyle = '#ff7a14'; g.strokeStyle = '#1a1414'; g.lineWidth = 8; g.beginPath(); g.moveTo(80 + off, y - 16); g.lineTo(380 + off, y - 16); g.lineTo(380 + off, y - 40); g.lineTo(460 + off, y); g.lineTo(380 + off, y + 40); g.lineTo(380 + off, y + 16); g.lineTo(80 + off, y + 16); g.closePath(); g.fill(); g.stroke(); } g.font = '900 64px Arial Black, Arial'; g.textAlign = 'center'; g.lineWidth = 12; g.strokeStyle = '#1a1414'; g.strokeText(label, 300, 640); g.fillStyle = '#ffffff'; g.fillText(label, 300, 640); g.restore(); }, up, 0.38);

const WD = (x, z, o, props = [], t = 0, extra = {}) => J('welder', x, extra.y || 0, z, o, props, t, extra);
const RV = (x, z, o, props = [], t = 0, extra = {}) => J('rival', x, extra.y || 0, z, { shades: true, ...o }, props, t, extra);
const BS = (x, z, o, props = [], t = 0, extra = {}) => J('tboss', x, extra.y || 0, z, o, props, t, extra);
// a driver card sitting in a truck cab (truck front +x)
const DRV = (who, tr, o = {}, t = 0) => { const c = Math.cos(tr.ry || 0), s = Math.sin(tr.ry || 0); return act(who, tr.x + 1.35 * c, (tr.y || 0) + 1.75, (tr.z || 0) - 1.35 * s - 0.35 * c, { L: { a: 60, e: 70 }, R: { a: 60, e: 70 }, ...(who === 'rival' ? { shades: true } : {}), ...o }, [], { s: 0.72, crop: true, blob: false }, t); };
const TANKY = TR; // tank axis height (interior set)
// ======== 1 "This welder spent all night building walls inside an empty fuel tank."
shot(0.0, (t, d) => ({ preset: 'tank', baf: 3, spark: [TX + 0.0 - 0.05, TANKY + 0.2, -1.6], cam: [TX - 2.6 + t * 0.5, 2.7, 1.6 - t * 0.3], look: [TX + 0.2, 2.6, -0.9], fov: 52, minD: 1.2,
  actors: [WD(TX - 0.6, -1.0, { expr: 'squint', L: { a: 70, e: 40 }, R: { a: 85, e: 30 } }, [{ kind: 'torch', hand: 1 }], t, { y: 0.65 })] }));
shot(1.6, (t, d) => ({ preset: 'tank', baf: 3, spark: [TX - 0.05, TANKY + 0.3, -1.2], cam: push(t, d, [TX - 1.9, 2.0, 0.6], [TX - 1.7, 2.1, 0.3]), look: [TX - 0.6, 2.7, -1.0], fov: 46, minD: 0.9,
  actors: [WD(TX - 0.6, -1.0, { expr: 'squint', L: { a: 70, e: 40 }, R: { a: 95, e: 20 } }, [{ kind: 'torch', hand: 1 }], t, { y: 0.65, crop: true })] }));
// ======== 2 "Five of them,"
shot(3.3, (t, d) => ({ preset: 'tank', baf: 5, cam: [TX - 15.5 + ez(t / d) * 3, TANKY + 0.2, 0], look: [TX + 5, TANKY - 0.1, 0], fov: 60, mb: [0.006, 0], actors: [counter('WALLS', String(Math.min(5, 1 + Math.floor(t / 0.16))), t, '#ffd21a', 0.0)] }));
// ======== 3 "each with a big round hole in the middle."
shot(4.2, (t, d) => ({ preset: 'tank', baf: 5, cam: [TX - 11 + ei(t / d) * 4.0, TANKY, 0.05], look: [TX + 3, TANKY, 0], fov: 54, minD: 0.5, mb: t / d > 0.6 ? [0, 0.008] : [0, 0],
  actors: [WD(TX - 3.4, 0.0, { expr: 'smug', L: 'hip', R: 'thumb' }, [], t, { y: 0.65, crop: true })] }));
// ======== 4 "His boss nearly fainted."
shot(6.0, (t, d) => ({ preset: 'garage', flash: flashIn(t), trucks: [{ name: 'yel', x: GX - 1, z: -2.2, xray: false }], cam: snap(t, [GX + 2.6, 1.6, 4.2], [GX + 2.3, 1.6, 3.6]), look: [GX + 1.6, 1.85, 0.2], fov: 48,
  actors: [BS(GX + 1.6, 0.3, { expr: t < 0.4 ? 'shock' : 'terror', L: 'cheek', R: 'cheek', sweat: 2 }, [], t, { rot: t > 0.6 ? -ez((t - 0.6) / 0.6) * 0.5 : 0 })] }));
// ======== 5 "Every wall stole space,"
shot(7.4, (t, d) => { const nb = Math.min(5, Math.floor(t / 0.3) + 1); return { preset: 'xray', trucks: [{ name: 'yel', x: XX - 1.5, z: 0, xray: true, baffles: true, nb, wave: { h: 0.95 - nb * 0.06 } }], cam: push(t, d, [XX - 1.5, 3.4, 11.5], [XX - 1.2, 3.2, 10.8]), look: [XX - 3.2, 2.4, 0], fov: 46,
  actors: [counter('GALLONS', String(8000 - nb * 300).replace(/(\d)(\d{3})$/, '$1,$2'), t, nb > 2 ? '#ff6a4a' : '#ffd21a', 0.05, '-300')] }; });
// ======== 6 "and every gallon of space was money he would never haul."
shot(9.0, (t, d) => ({ preset: 'garage', trucks: [{ name: 'yel', x: GX - 1, z: -2.2 }], cam: push(t, d, [GX + 3.2, 1.5, 3.4], [GX + 2.8, 1.55, 3.0]), look: [GX + 1.4, 1.8, 0.4], fov: 46,
  actors: [BS(GX + 1.4, 0.4, { expr: 'pained', L: 'cheek', R: { a: 100, e: 30 }, sweat: 1 }, [{ kind: 'clip', hand: 1 }], t), WD(GX - 0.4, -0.4, { expr: 'smug', L: 'hip', R: 'hip' }, [], t), cash(t, GX + 1.4, 2.0, 0.4, 0.6)] }));
// ======== 7 "Down the road, a rival driver did the opposite:"
shot(11.9, (t, d) => ({ preset: 'snow', trucks: [{ name: 'red', x: -6, z: -1.8 }], cam: push(t, d, [-1.2, 0.9, 4.6], [-1.6, 1.0, 3.8]), look: [-2.6, 2.2, -0.2], fov: 54,
  actors: [RV(-2.4, 0.6, { expr: 'smug', L: 'hip', R: 'thumb' }, [], t)] }));
// ======== 8 "a tank with nothing inside but fuel."
shot(14.2, (t, d) => ({ preset: 'tank', baf: 0, cam: [TX + 4 - ez(t / d) * 5, TANKY + 0.3, 0], look: [TX + 14, TANKY - 0.6, 0], fov: 56, flash: flashIn(t),
  actors: [RV(TX + 8, 0, { expr: 'laugh', L: 'up', R: 'up' }, [], t, { y: 0.65, crop: true, s: 1.1 })] }));
// ======== 9 "More gallons, more cash."
shot(16.1, (t, d) => ({ preset: 'xray', trucks: [{ name: 'red', x: XX - 1.5, z: 0, xray: true, wave: { h: 1.0 } }], cam: push(t, d, [XX - 1.4, 3.3, 11.2], [XX - 1.1, 3.2, 10.4]), look: [XX - 3.2, 2.4, 0], fov: 46,
  actors: [counter('GALLONS', '8,000', t, '#4ae04a', 0.05), ...(t > 0.7 ? [cash(t, XX - 3, 4.4, 0, 1.0)] : [])] }));
// ======== 10 "By winter, he was buying lunch for the whole truck stop."
shot(18.1, (t, d) => { const x = lerp(-6, 3.5, ez(t / d)); return { preset: 'diner', food: Array.from({ length: 6 }, (_, i) => [DX - 6 + i * 2, 1.26, 1.0 + (t > 0.4 + i * 0.15 ? 0 : 0.6)]), cup: [DX + 3.6, 1.26, 1.0], cam: [DX + lerp(-3.4, 1.6, ez(t / d)), 1.75, 7.2], look: [DX + lerp(-3.0, 1.8, ez(t / d)), 1.6, 1.8], fov: 52,
  actors: [RV(DX - 2.4, 2.5, { expr: 'laugh', talk: true, L: 'up', R: 'point' }, [], t, { crop: true }), J('trucker', DX - 4.4, 0, 2.6, { expr: 'laugh', L: 'up', R: 'hip' }, [], t, { y: 0.4, crop: true }), J('trucker2', DX - 0.6, 0, 2.6, { expr: 'grin', L: 'thumb', R: 'hip' }, [], t, { y: 0.4, crop: true }), J('cook', DX + 0.8, 0, -1.2, { expr: 'smile', L: 'hip', R: 'wave' }, [], t, { crop: true }), WD(DX + 3.6, 2.6, { expr: 'squint', L: 'hip', R: { a: 60, e: 80 } }, [], t, { y: 0.4, crop: true })] }; });
// ======== 11 "Then came the mountain pass, covered in ice."
shot(21.1, (t, d) => ({ preset: 'snow', trucks: [{ name: 'red', x: -30 + t * 9, z: 2 }, { name: 'yel', x: -42 + t * 9, z: -2 }], cam: [-46 + t * 6, lerp(34, 16, ez(t / d)), 30], look: [-30 + t * 8, 0, 0], fov: 50, shadowExt: 40, mb: [0.003, 0] }));
// ======== 12 "Both drivers spotted a rock slide ahead and slammed the brakes."
shot(23.8, (t, d) => { const tr = { name: 'red', x: 0 + t * 9, z: 2 }; return { preset: 'snow', trucks: [tr, { name: 'yel', x: -12 + t * 9, z: -2 }], boulder: [40 + 0, Math.max(2, 18 - t * t * 12), 1], cam: [tr.x + 2.9, 3.3, 2.0], look: [tr.x + 30, 2.4, 1], fov: 62, minD: 0.3, near: 0.05,
  actors: [hud((p) => { const g = p.g; g.save(); g.fillStyle = '#1c1e28'; g.beginPath(); g.rect(-100, -100, 800, 1200); g.roundRect(40, 140, 520, 600, 40); g.fill('evenodd'); g.strokeStyle = '#0a0a10'; g.lineWidth = 10; g.beginPath(); g.roundRect(40, 140, 520, 600, 40); g.stroke(); g.fillStyle = '#2a2e3a'; g.fillRect(-100, 760, 800, 400); g.translate(430, 860); p.poly([[-55, -170], [55, -170], [62, 80], [-62, 80]], '#f4f4f0', 7); p.poly([[-50, -150], [50, -150], [55, -20], [-55, -20]], '#5a3a22', 0); p.ell(0, 110, 72, 42, '#fffdf8', 7); g.restore(); }, -0.66, 0.5), popA('ROCK SLIDE!', t - 0.6, -0.15, RED)] }; });
shot(25.2, (t, d) => { const b = ez(t / 0.6); return { preset: 'snow', trucks: [{ name: 'red', x: 12.6 + t * 6 * (1 - t / 3), z: 2, pitch: -0.06 * Math.sin(Math.min(1, t * 3) * Math.PI) }, { name: 'yel', x: 0.6 + t * 6 * (1 - t / 3), z: -2, pitch: -0.05 * Math.sin(Math.min(1, t * 3) * Math.PI) }], boulder: [40, 2, 1], cam: push(t, d, [26, 2.2, 9], [24, 2.0, 8]), look: [10, 2.0, 0], fov: 54, shadowExt: 24, shake: 0.03 * (1 - b),
  actors: [] }; });
// ======== 13 "The welder's truck groaned, and stopped."
shot(26.9, (t, d) => { const x = 8.0 + 3 * eo(t / 1.2); return { preset: 'snow', trucks: [{ name: 'yel', x, z: -2, pitch: -0.04 * Math.exp(-t * 3) * Math.cos(t * 9) }, { name: 'red', x: 17 + t * 4, z: 2 }], cam: push(t, d, [x + 11.5, 2.4, -7.5], [x + 10.5, 2.5, -7.0]), look: [x + 1.5, 2.4, -2], fov: 50, minD: 2,
  actors: [DRV('welder', { x, z: -2 }, { expr: 'smug', R: { a: 120, e: 40 } }, t)] }; });
// ======== 14 "The smooth truck kept going... sliding..."
shot(29.2, (t, d) => { const k = ez(t / 2.6); const tr = { name: 'red', x: 18 + k * 9, z: 2 + k * 4.2, ry: -k * 0.45 }; return { preset: 'snow', trucks: [tr], cam: [tr.x + 9, 2.6, tr.z - 3.0], look: [tr.x + 2.5, 2.8, tr.z], fov: 52, minD: 2, shake: 0.015,
  actors: [DRV('rival', tr, { expr: 'terror', L: 'up', R: 'up', sweat: 2 }, t), counter('INCHES LEFT', String(Math.max(1, 3 - Math.floor(t / 0.8))), t, '#ff4a2a', 0.08)] }; });
// ======== 15 "until its bumper hung over the cliff."
shot(31.7, (t, d) => { const tr = { name: 'red', x: 27, z: 7.0 + ez(t / 0.6) * 1.4, ry: -0.45 }; return { preset: 'snow', trucks: [tr], cam: push(t, d, [35.5, 3.6, 17.5], [34.5, 3.2, 16.5]), look: [29.5, 0.2, 9.0], fov: 56, shadowExt: 18, shadowAt: [30, 0, 8],
  actors: [counter('INCHES LEFT', '0', t, '#ff3a2a', 0.32), DRV('rival', tr, { expr: 'scream', L: 'up', R: 'up', sweat: 2 }, t)] }; });
// ======== 16 "You see, a full tanker carries about twenty-five tons of fuel."
shot(33.8, (t, d) => ({ preset: 'xray', trucks: [{ name: 'red', x: XX - 1.5, z: 0, xray: true, wave: { h: 1.0 } }], cam: push(t, d, [XX + 4, 2.2, 9.5], [XX + 2, 2.6, 9.0]), look: [XX - 3.0, 2.3, 0], fov: 50, flash: flashIn(t) * 0.6,
  actors: [...(t > 0.6 ? [popA('25 TONS', t - 0.6, -0.2)] : [])] }));
// ======== 17 "When the truck stops, the fuel doesn't."
shot(37.3, (t, d) => { const st = Math.min(1, t / 0.8), tilt = t > 0.8 ? Math.min(0.32, (t - 0.8) * 0.5) : 0; return { preset: 'xray', trucks: [{ name: 'red', x: XX - 1.5 + st * 2.5 - st * st * 1.25, z: 0, xray: true, wave: { h: 1.0, tilt } }], cam: [XX - 1.2, 3.0, 10.2], look: [XX - 3, 2.4, 0], fov: 48, shake: t > 0.75 && t < 1.0 ? 0.03 : 0,
  actors: [...(t > 1.0 ? [arrowHud(t, 'FUEL', -0.05)] : [])] }; });
// ======== 18 "In a smooth tank, it rushes forward in one giant wave"
shot(39.6, (t, d) => ({ preset: 'tank', baf: 0, tfuel: { h: 1.6, amp: 0.2 + ez(t / d) * 2.0, pos: -10 + t * 9, width: 2.4 }, cam: [TX - 14 + t * 2, 4.9, 0.6], look: [TX + 10, 2.2, 0], fov: 58, mb: [0.004, 0] }));
// ======== 19 "and shoves the whole truck ahead."
shot(41.9, (t, d) => { const k = ez((t - 0.4) / 0.8); return { preset: 'xray', trucks: [{ name: 'red', x: XX - 1.5 + k * 2.2, z: 0, xray: true, wave: { h: 0.6, amp: 1.6 * (1 - k * 0.3), pos: 1.5 + k * 1.6, width: 1.3 } }], cam: [XX + 1.5, 2.8, 10.0], look: [XX - 1.5, 2.4, 0], fov: 50, shake: k > 0 && k < 1 ? 0.04 : 0,
  actors: [arrowHud(t, 'SHOVE!', -0.05)] }; });
// ======== 20 "The walls break that wave into tiny splashes,"
shot(44.3, (t, d) => ({ preset: 'tank', baf: 5, tfuel: { h: 1.9, chop: 0.7 }, cam: [TX - 13 + ez(t / d) * 8, 4.4, 0.05], look: [TX + 6, 2.6, 0], fov: 56, minD: 0.5, mb: [0, 0.003] }));
// ======== 21 "so the fuel has nothing to push with."
shot(46.7, (t, d) => ({ preset: 'xray', trucks: [{ name: 'yel', x: XX - 1.5, z: 0, xray: true, baffles: true, wave: { h: 0.7, chop: 0.12, t } }], cam: push(t, d, [XX - 1.4, 3.3, 11.0], [XX - 1.2, 3.2, 10.4]), look: [XX - 3.2, 2.4, 0], fov: 46,
  actors: [...(t > 0.5 ? [check(true, t - 0.5, 0.08)] : [])] }));
// ======== 22 "Next spring, the rival paid the welder to fill his tank with walls."
shot(48.5, (t, d) => ({ preset: 'garage', flash: flashIn(t) * 0.5, trucks: [{ name: 'red', x: GX - 1, z: -2.2 }], cam: push(t, d, [GX + 0.5, 1.6, 3.4], [GX + 0.4, 1.6, 2.9]), look: [GX + 0.4, 1.8, 0.2], fov: 50,
  actors: [RV(GX - 0.6, 0.2, { expr: 'pained', L: 'hip', R: { a: 70, e: 20 }, sweat: 1 }, [], t), WD(GX + 1.4, 0.4, { expr: 'smug', L: 'hip', R: { a: 80, e: 40 } }, [], t), cash(t, GX + 0.4, 1.4, 0.4, 0.55)] }));
shot(50.4, (t, d) => ({ preset: 'tank', baf: 5, spark: [TX + 5.0, TANKY + 0.3, -1.4], cam: push(t, d, [TX - 2.6, 2.9, 0.4], [TX - 3.6, 3.0, 0.4]), look: [TX + 5, 2.6, -0.6], fov: 52,
  actors: [WD(TX + 4.4, -1.0, { expr: 'grin', L: { a: 70, e: 40 }, R: { a: 85, e: 30 } }, [{ kind: 'torch', hand: 1 }], t, { y: 0.65, crop: true }), RV(TX + 0.2, 0.0, { expr: 'nervous', L: 'cheek', R: 'hip', sweat: 1 }, [], t, { y: 0.65, crop: true })] }));
export const TOTAL = Math.ceil(52.2 * FPS);
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
