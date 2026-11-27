// Ka-Thunk Bridge short (69.2 s, 30 fps). Reference angles: low road shots along the gap, two characters with the gap between them,
// top-down comb macros with a hand in the gap, side tracking shots of cars behind the railings, canyon overview with arrows.
import * as T from './toon.js';
const FPS = 30;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)); const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t)); const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); }; const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const talkE = (t, e) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(e, 'o') : e);
const U = 2.36; const ZR = -46, G0 = 0.34;
const prop = (p, pr, h, t) => { const [x, y] = h; const u = U, g = p.g;
  if (pr.kind === 'tape') { p.poly([[x - 16 * u, y - 18 * u], [x + 16 * u, y - 18 * u], [x + 16 * u, y + 12 * u], [x - 16 * u, y + 12 * u]], '#f2c41a', 2.4 * u); p.ell(x, y - 3 * u, 8 * u, 8 * u, '#2a2a30', 1.6 * u); p.poly([[x + 16 * u, y + 4 * u], [x + 70 * u, y + 10 * u], [x + 70 * u, y + 16 * u], [x + 16 * u, y + 10 * u]], '#ffe27a', 1.2 * u); for (let k = 0; k < 6; k++) p.stroke([[x + 22 * u + k * 8 * u, y + 7 * u], [x + 22 * u + k * 8 * u, y + 11 * u]], 1 * u, '#2a2a30'); }
  if (pr.kind === 'scissors') { g.save(); g.translate(x, y); g.rotate(-0.6); for (const s of [-1, 1]) { p.poly([[0, 0], [60 * u, s * 6 * u], [62 * u, s * 1 * u], [0, -s * 2 * u]], '#e8eef4', 1.6 * u); p.ell(-12 * u, s * 10 * u, 9 * u, 7 * u, null, 3.4 * u); } g.restore(); }
  if (pr.kind === 'torch') { p.poly([[x - 6 * u, y - 4 * u], [x + 34 * u, y - 10 * u], [x + 36 * u, y - 2 * u], [x - 6 * u, y + 6 * u]], '#3a3a44', 2 * u); p.ell(x + 40 * u, y - 6 * u, 6 * u, 6 * u, '#fff6c0', 0); }
  if (pr.kind === 'hat') { p.ell(x, y - 6 * u, 26 * u, 8 * u, '#16161c', 2 * u); p.poly([[x - 16 * u, y - 6 * u], [x + 16 * u, y - 6 * u], [x + 14 * u, y - 30 * u], [x - 14 * u, y - 30 * u]], '#16161c', 2 * u); } };
const life = (t, seed = 1) => ({ bob: 0.006 * Math.sin((t * 30 + seed * 11) * 0.11), headTilt: 2 * Math.sin(t * 1.6 + seed), blink: ((t * 30 + seed * 13) % (40 + seed * 7)) < 3 ? 1 : 0 });
const C = (who, o = {}, props = [], t = 0, seed = 1) => (p) => { const out = {}; const oo = { ...life(t, seed), ...o }; if (o.talk) { oo.expr = talkE(t, o.expr || 'smile'); if (!o.R) oo.R = { a: 55 + 28 * Math.sin(t * 7 + seed), e: 25 + 20 * Math.sin(t * 5) }; if (!o.L) oo.L = { a: 25 + 12 * Math.sin(t * 6 + 1), e: 15 }; } T.romanFront(p, who, { ...oo, out }); for (const pr of props) prop(p, pr, out.hands[pr.hand ?? 1], t); };
let SEED = 1; const act = (who, x, y, z, o = {}, props = [], extra = {}, t = 0) => ({ x, y, z, draw: C(who, o, props, t, (SEED = (SEED % 7) + 1)), ...extra });
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const hud = (fn, up = 0, s = 0.36, extra = {}) => fx(fn, 0, 0, 0, s, { hud: { d: 1.2, up, ...(extra.right ? { right: extra.right } : {}) }, order: 9, ...extra });
const pop = (txt, col = ['#fff6a0', '#ffd21a', '#e88a00'], sz = 70) => (t) => (p) => { const g = p.g, k = (1 - Math.pow(1 - cl(t * 4), 3)) * (1 + 0.12 * Math.sin(cl(t * 4) * Math.PI)); g.save(); g.translate(300, 190); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); g.rotate(-0.03); g.font = `900 ${sz}px Arial Black, Arial`; const w = g.measureText(txt).width + 60;
  g.fillStyle = '#1a1414'; g.beginPath(); g.roundRect(-w / 2 + 6, -54 + 8, w, 108, 18); g.fill(); g.fillStyle = '#ffffff'; g.strokeStyle = '#1a1414'; g.lineWidth = 8; g.beginPath(); g.roundRect(-w / 2, -54, w, 108, 18); g.fill(); g.stroke();
  g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#3a1a04'; g.strokeText(txt, 0, 25); const gr = g.createLinearGradient(0, -28, 0, 26); gr.addColorStop(0, col[0]); gr.addColorStop(0.45, col[1]); gr.addColorStop(1, col[2]); g.fillStyle = gr; g.fillText(txt, 0, 25); g.restore(); };
const popA = (txt, t, up = -0.6, col) => hud(pop(txt, col)(t), up);
const RED = ['#ffb0a0', '#ff4a2a', '#c8120a'], GRN = ['#d8ffb0', '#6ad83a', '#2a9a1a'];
// big word with 3D extrusion, no box
const big = (txt, t, up = 0.25, sz = 130, col = ['#ffb070', '#ff5a1a', '#c8220a']) => hud((p) => { const g = p.g, k = eo(t * 4) * (1 + 0.12 * Math.sin(cl(t * 4) * Math.PI)); g.save(); g.translate(300, 200); g.scale(k, k); g.font = `900 ${sz}px Arial Black, Arial`; g.textAlign = 'center'; g.lineJoin = 'round';
  for (let d = 10; d > 0; d -= 2) { g.fillStyle = '#5a1404'; g.fillText(txt, d * 0.5, 50 + d); } g.lineWidth = 18; g.strokeStyle = '#1a0a04'; g.strokeText(txt, 0, 50); const gr = g.createLinearGradient(0, -60, 0, 50); gr.addColorStop(0, col[0]); gr.addColorStop(0.5, col[1]); gr.addColorStop(1, col[2]); g.fillStyle = gr; g.fillText(txt, 0, 50); g.restore(); }, up);
const bub = (txt, t, x, y, z, s = 0.9, tail = -40) => fx((p) => { const k = eo(t * 5); p.g.save(); p.g.translate(300, 330); p.g.scale(k, k); p.g.translate(-300, -330); T.fxBubble(p, txt, { size: 64, tail }); p.g.restore(); }, x, y, z, s, { face: true, order: 8 });
const excl = (t, x, y, z, s = 0.6) => fx((p) => { const g = p.g, k = eo(t * 6); g.save(); g.translate(300, 300); g.scale(k, k); g.lineCap = 'round'; for (const a of [-0.5, 0, 0.5]) { g.strokeStyle = '#1a1414'; g.lineWidth = 26; g.beginPath(); g.moveTo(Math.sin(a) * 80, -Math.cos(a) * 80); g.lineTo(Math.sin(a) * 170, -Math.cos(a) * 170); g.stroke(); } g.restore(); }, x, y, z, s, { face: true });
// "6 IN" with a double arrow
const inch = (txt, t, w = 170) => hud((p) => { const g = p.g, k = eo(t * 4); g.save(); g.translate(300, 560); g.scale(k, k); g.lineCap = 'round'; g.strokeStyle = '#1a1414'; g.lineWidth = 22; g.beginPath(); g.moveTo(-w, 0); g.lineTo(w, 0); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.beginPath(); g.moveTo(-w, 0); g.lineTo(w, 0); g.stroke();
  for (const s of [-1, 1]) { g.fillStyle = '#1a1414'; g.beginPath(); g.moveTo(s * (w + 30), 0); g.lineTo(s * (w - 18), -30); g.lineTo(s * (w - 18), 30); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(s * (w + 18), 0); g.lineTo(s * (w - 10), -20); g.lineTo(s * (w - 10), 20); g.fill(); }
  g.font = '900 92px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#1a1414'; g.strokeText(txt, 0, -40); g.fillStyle = '#ffffff'; g.fillText(txt, 0, -40); g.restore(); }, -0.45);
// comic burst "KA-THUNK!"
const burst = (txt, t, up = 0.1, right = 0) => hud((p) => { const g = p.g, k = eo(t * 6) * (1 + 0.15 * Math.sin(cl(t * 5) * Math.PI)); g.save(); g.translate(300, 300); g.scale(k, k); g.rotate(-0.12); const pts = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, r = i % 2 ? 150 : 250; pts.push([Math.cos(a) * r * 1.15, Math.sin(a) * r * 0.62]); }
  g.fillStyle = '#1a1414'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x + 8, y + 10) : g.moveTo(x + 8, y + 10))); g.fill(); g.fillStyle = '#ffe23a'; g.strokeStyle = '#1a1414'; g.lineWidth = 8; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.stroke();
  g.font = '900 84px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#1a1414'; g.strokeText(txt, 0, 30); const gr = g.createLinearGradient(0, -30, 0, 30); gr.addColorStop(0, '#ff7a5a'); gr.addColorStop(1, '#d8120a'); g.fillStyle = gr; g.fillText(txt, 0, 30); g.restore(); }, up, 0.4, { right });
// newspaper
const paper = (t) => hud((p) => { const g = p.g, k = eo(t * 2.2), sp = (1 - k) * 9; g.save(); g.translate(300, 470); g.rotate(sp - 0.06); g.scale(0.2 + 0.8 * k, 0.2 + 0.8 * k);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-236, -316, 480, 640); g.fillStyle = '#f6f0e0'; g.fillRect(-244, -326, 480, 640); g.strokeStyle = '#2a2420'; g.lineWidth = 4; g.strokeRect(-244, -326, 480, 640);
  g.fillStyle = '#1a1414'; g.textAlign = 'center'; g.font = '900 44px Georgia'; g.fillText('The Desert Daily', -4, -270); g.fillRect(-224, -255, 440, 4); g.font = '700 16px Georgia'; g.fillText('FIVE CENTS        SPECIAL EDITION        CANYON COUNTY', -4, -232); g.fillRect(-224, -222, 440, 2);
  g.font = '900 64px Arial Black, Arial'; g.fillText('THE', -4, -160); g.fillText('KA-THUNK', -4, -92); g.fillText('BRIDGE!', -4, -24); g.font = 'italic 700 22px Georgia'; g.fillText('"Every car goes THUNK," say drivers', -4, 14);
  g.fillStyle = '#e8e0cc'; g.fillRect(-214, 34, 200, 150); g.strokeStyle = '#2a2420'; g.lineWidth = 3; g.strokeRect(-214, 34, 200, 150); g.fillStyle = '#5a5a62'; g.beginPath(); g.roundRect(-190, 110, 140, 40, 10); g.fill(); g.beginPath(); g.roundRect(-160, 82, 80, 34, 8); g.fill(); g.fillStyle = '#1a1414'; for (const x of [-160, -80]) { g.beginPath(); g.arc(x, 152, 14, 0, 7); g.fill(); } g.font = '900 24px Arial Black, Arial'; g.fillText('THUNK!', -114, 66);
  g.fillStyle = '#5a544a'; for (let i = 0; i < 12; i++) g.fillRect(10, 40 + i * 12, 204, 5); for (let i = 0; i < 8; i++) g.fillRect(-214, 200 + i * 12, 428, 5); g.restore(); }, -0.5, 0.4);
// big thermometer with a number above it (115°)
const thermoHud = (t, k0, k1, num) => hud((p) => { const g = p.g, k = lerp(k0, k1, ez(t * 1.5)); g.save(); g.translate(300, 560); g.fillStyle = '#2a4a8a'; g.beginPath(); g.roundRect(-110, -330, 220, 720, 24); g.fill(); g.strokeStyle = '#1a1414'; g.lineWidth = 8; g.stroke(); g.fillStyle = '#f4f0e6'; g.beginPath(); g.roundRect(-84, -270, 168, 620, 16); g.fill();
  g.fillStyle = '#fff'; g.font = '900 44px Arial'; g.textAlign = 'center'; g.fillText('°F', 0, -284); g.fillStyle = '#2a2a30'; g.font = '700 26px Arial'; for (let i = 0; i <= 6; i++) { const y = 300 - i * 90; g.fillRect(20, y, 34, 5); g.fillText(String(i * 20), -36, y + 10); }
  g.fillStyle = '#d8d0c4'; g.beginPath(); g.roundRect(54, -250, 20, 560, 10); g.fill(); const top = 300 - k * 560; g.fillStyle = '#e02a2a'; g.beginPath(); g.roundRect(54, top, 20, 310 - top, 10); g.fill(); g.beginPath(); g.arc(64, 320, 22, 0, 7); g.fill(); g.restore();
  if (num) { const nk = eo((t - 0.25) * 4); g.save(); g.translate(300, 150); g.scale(nk, nk); g.font = '900 150px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 20; g.strokeStyle = '#1a1414'; g.strokeText(num, 0, 50); const gr = g.createLinearGradient(0, -60, 0, 50); gr.addColorStop(0, '#ffb070'); gr.addColorStop(1, '#e8320a'); g.fillStyle = gr; g.fillText(num, 0, 50);
    if (t > 0.3) { g.strokeStyle = '#1a1414'; g.lineWidth = 8; for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * 0.3, r0 = 150 + ((t * 3 + i * 0.2) % 1) * 40; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 0.6 + 20); g.lineTo(Math.cos(a) * (r0 + 50), Math.sin(a) * (r0 + 50) * 0.6 + 20); g.stroke(); } } g.restore(); } }, -0.62, 0.4);
// calendar page (top right)
const cal = (month, t) => hud((p) => { const g = p.g, k = eo(t * 5); g.save(); g.translate(470, 150); g.scale(k, k); g.rotate(0.08); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-96, -86, 200, 200); g.fillStyle = '#ffffff'; g.fillRect(-104, -96, 200, 200); g.strokeStyle = '#1a1414'; g.lineWidth = 5; g.strokeRect(-104, -96, 200, 200); g.fillStyle = '#d8222a'; g.fillRect(-104, -96, 200, 52);
  g.font = '900 36px Arial Black, Arial'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(month, -4, -56); g.fillStyle = '#1a1414'; g.font = '700 20px Arial'; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) g.fillText(String(r * 6 + c + 1), -82 + c * 31, -14 + r * 34); for (const s of [-1, 1]) { g.fillStyle = '#5a5a62'; g.fillRect(-4 + s * 50 - 4, -108, 8, 24); } g.restore(); }, -0.38, 0.36);
// hand reaching into the gap from the top of the frame, holding an object (top-down shots)
const handIn = (kind, t) => (p) => { const g = p.g, k = eo(t * 3); g.save(); g.translate(0, (1 - k) * -500); const hx = 300, hy = 640;
  p.poly([[hx - 70, -40], [hx + 70, -40], [hx + 62, hy - 70], [hx - 62, hy - 70]], '#f6f4ee', 10); p.poly([[hx - 66, hy - 110], [hx + 66, hy - 110], [hx + 62, hy - 70], [hx - 62, hy - 70]], '#e4e0d4', 8);
  p.ell(hx, hy - 10, 66, 70, '#f2c4a0', 10); for (let i = 0; i < 4; i++) p.ell(hx - 45 + i * 30, hy + 52, 15, 26, '#f2c4a0', 7); p.ell(hx + 64, hy - 10, 18, 34, '#f2c4a0', 7);
  if (kind === 'sandwich') { const y = hy + 120; p.poly([[hx - 120, y - 40], [hx + 120, y - 40], [hx + 120, y + 60], [hx - 120, y + 60]], '#e8c07a', 9); p.poly([[hx - 112, y - 10], [hx + 112, y - 10], [hx + 112, y + 6], [hx - 112, y + 6]], '#6ac23a', 0); p.poly([[hx - 112, y + 6], [hx + 112, y + 6], [hx + 112, y + 20], [hx - 112, y + 20]], '#d8322f', 0); p.poly([[hx - 112, y + 20], [hx + 112, y + 20], [hx + 112, y + 32], [hx - 112, y + 32]], '#ffd84a', 0); }
  if (kind === 'pencil') { const y = hy + 40; p.poly([[hx - 14, y], [hx + 14, y], [hx + 14, y + 210], [hx - 14, y + 210]], '#ffc21a', 7); p.poly([[hx - 14, y + 210], [hx + 14, y + 210], [hx, y + 250]], '#f2d8a8', 6); p.poly([[hx - 5, y + 238], [hx + 5, y + 238], [hx, y + 250]], '#2a2a30', 0); p.poly([[hx - 14, y - 26], [hx + 14, y - 26], [hx + 14, y], [hx - 14, y]], '#ff8aa0', 6); }
  if (kind === 'coin') { const y = hy + 110; p.ell(hx, y, 16, 58, '#e8b83a', 8); p.ell(hx - 4, y - 10, 5, 30, '#fff0a0', 0); }
  g.restore(); };
// overview arrows over a bridge (world-space card above the deck, faces camera): kind 'out' | 'in' | 'block'
const span = (kind, t, x, z, s = 26, lbl = '') => fx((p) => { const g = p.g, k = eo(t * 2); g.save(); g.translate(300, 930); const L = 240 * (0.4 + 0.6 * k), col = kind === 'block' ? '#ff4a2a' : kind === 'in' ? '#4ae04a' : '#ffd21a';
  const arrow = (x0, x1) => { const dir = Math.sign(x1 - x0); for (const [w, c] of [[16, '#1a1414'], [8, col]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x1 - dir * 14, 0); g.stroke(); g.fillStyle = c; g.beginPath(); g.moveTo(x1 + dir * (w > 10 ? 8 : 0), 0); g.lineTo(x1 - dir * (w > 10 ? 34 : 26), w > 10 ? -26 : -18); g.lineTo(x1 - dir * (w > 10 ? 34 : 26), w > 10 ? 26 : 18); g.fill(); } };
  if (kind === 'out' || kind === 'block') { arrow(-20, -L); arrow(20, L); } if (kind === 'in') { arrow(-L - 40, -14); arrow(L + 40, 14); }
  if (lbl) { g.font = '900 60px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = '#1a1414'; g.strokeText(lbl, 0, -40); g.fillStyle = col; g.fillText(lbl, 0, -40); } g.restore(); }, x, 1.5, z, s, { face: true, order: 7 });
const mark = (kind, t, x, y, z, s = 9) => fx((p) => { const g = p.g, k = eo(t * 5); g.save(); g.translate(300, 840); g.scale(k, k); if (kind === 'ok') { g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#1a1414'; g.lineWidth = 70; g.beginPath(); g.moveTo(-120, 0); g.lineTo(-30, 90); g.lineTo(140, -110); g.stroke(); g.strokeStyle = '#4ae04a'; g.lineWidth = 42; g.stroke(); }
  else { g.lineWidth = 40; g.strokeStyle = '#1a1414'; g.beginPath(); g.arc(0, 0, 120, 0, 7); g.stroke(); g.strokeStyle = '#ff3a2a'; g.lineWidth = 24; g.beginPath(); g.arc(0, 0, 120, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-84, -84); g.lineTo(84, 84); g.stroke(); } g.restore(); }, x, y, z, s, { face: true, order: 8 });
const confetti = (t) => hud((p) => { const g = p.g; for (let i = 0; i < 70; i++) { const x = (i * 97) % 600, y = ((i * 53) % 400) - 200 + t * (300 + (i % 5) * 60); if (y > 1000) continue; g.save(); g.translate(x, y); g.rotate(i + t * (3 + i % 4)); g.fillStyle = ['#ff4a4a', '#ffd21a', '#3ac8ff', '#4ae04a', '#ff7ad8'][i % 5]; g.fillRect(-10, -5, 20, 10); g.restore(); } }, 0, 0.4);
const creak = (t, x, y, z, s = 1.6) => fx((p) => T.fxCreak(p, t), x, y, z, s, { face: true });
const sweatK = (t) => 1 + Math.floor(t * 3) % 2;
const push = (t, d, a, b) => L3(a, b, ez(t / d)); const snap = (t, a, b, k = 0.2) => L3(a, b, eo(t / k));
const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });
const K = (x, z, o, props = [], t = 0, extra = {}) => act('kid', x, 0, z, o, props, extra, t);
const BO = (x, z, o, props = [], t = 0, extra = {}) => act('bboss', x, 0, z, o, props, extra, t);
// a driver card sitting in a car (excluded from auto-framing)
const DRV = (who, car, o = {}, t = 0) => act(who, car.x - 0.25 * Math.cos(car.ry || 0), (car.y || 0) + (car.lift || 0) + 0.45 + (car.bounce || 0), car.z + 0.25 * Math.sin(car.ry || 0) * 0, { L: { a: 70, e: 60 }, R: { a: 70, e: 60 }, ...o }, [], { s: 0.75, crop: true, blob: false }, t);
const BUMP_W = 9, bumpY = (x, b) => (Math.abs(x) < BUMP_W ? b * 1.7 * Math.pow(Math.cos(Math.PI * x / (2 * BUMP_W)), 2) : 0);
const gapAt = (k) => lerp(G0, 0.03, k); // k: 0 = cold spring, 1 = hottest day

// ======== 1 "This young engineer just built his very first bridge,"  (0.00)
shot(0.0, (t, d) => ({ gap: G0, cam: push(t, d, [-16, 5.5, 9], [-12, 4.2, 7.2]), look: [-1.5, 0.4, -1], fov: 52, shadowExt: 26,
  actors: [K(-2.2, 0.8, { expr: 'grin', L: 'hip', R: 'hip' }, [], t)] }));
shot(1.30, (t, d) => ({ gap: G0, cam: push(t, d, [-4.8, 1.45, 4.4], [-4.2, 1.45, 3.9]), look: [-2.0, 1.45, 0.6], fov: 46,
  actors: [K(-2.2, 0.8, { expr: 'smile_closed', L: 'hip', R: 'thumb' }, [], t)] }));
// ======== 2 "and it stops six inches short."  (2.75)
shot(2.75, (t, d) => ({ gap: G0, minD: 1.2, cam: push(t, d, [0.0, 0.75, 3.2], [0.0, 0.7, 2.8]), look: [0, 0.6, -1.5], fov: 50, keep: [[0, 0, 1.6]],
  actors: [K(-1.0, -1.4, { expr: 'smile', L: 'hip', R: 'hip' }, [], t), inch('6 IN', t - 0.2)] }));
// ======== 3 "Not by mistake."  (4.50)
shot(4.50, (t, d) => ({ gap: G0, minD: 1.4, cam: push(t, d, [-1.2, 1.75, 0.9], [-1.15, 1.75, 0.7]), look: [-1.0, 1.85, -1.4], fov: 44,
  actors: [K(-1.0, -1.4, { expr: 'smug', L: 'cross', R: 'cross' }, [], t)] }));
// ======== 4 "He measured that gap twice."  (5.56)
shot(5.56, (t, d) => ({ gap: G0, cam: push(t, d, [1.6, 1.2, 2.6], [1.4, 1.1, 2.3]), look: [-0.4, 0.9, 0.2], fov: 48, keep: [[0, 0, 0.3]],
  actors: [K(-0.55, 0.3, { expr: 'squint', L: { a: 40, e: 50 }, R: { a: 75 + Math.sin(t * 6) * 8, e: 30 } }, [{ kind: 'tape', hand: 1 }], t), popA(t < 0.7 ? 'CHECK!' : 'CHECK! CHECK!', t, -0.75, GRN)], tape: 1 }));
// ======== 5 "His boss turns purple."  (7.35)
shot(7.35, (t, d) => ({ gap: G0, minD: 1.4, cam: snap(t, [3.6, 1.6, 3.4], [3.4, 1.6, 3.1]), look: [2.2, 1.85, 0.4], fov: 46, shake: t > 0.4 ? 0.006 : 0,
  actors: [BO(2.2, 0.4, { expr: t < 0.35 ? 'shock' : 'rage', flush: ez((t - 0.3) / 0.5), flushCol: '#9a2ad8', L: 'fist', R: 'fist' }, [], t), excl(t, 2.2, 2.85, 0.4, 0.7)] }));
// ======== 6 "Did you run out of steel, boy?"  (8.87)
shot(8.87, (t, d) => ({ gap: G0, cam: push(t, d, [0.0, 1.35, 3.3], [0.0, 1.35, 3.0]), look: [0, 1.4, -1.0], fov: 50, keep: [[0, 0, 1.2]],
  actors: [K(-1.25, -1.0, { expr: 'nervous', L: 'hip', R: 'cheek', sweat: 1 }, [], t), BO(1.3, -1.0, { expr: 'yell', flush: 0.8, flushCol: '#9a2ad8', talk: true, L: 'hip', R: 'point', facing: -1 }, [], t), bub('OUT OF STEEL?!', t, 0.9, 2.55, -1.0, 0.8, -50)] }));
// ======== 7 "So the kid plugs the hole with two giant steel combs,"  (10.56)
shot(10.56, (t, d) => ({ gap: G0, comb: ez(t / 1.4), cam: push(t, d, [3.0, 3.0, 4.6], [2.6, 2.7, 4.0]), look: [0, 0.2, 0.4], fov: 50, keep: [[0, 0, -2.5], [0, 0, 2.5]],
  actors: [K(-1.9, 2.4, { expr: 'grin', L: 'hip', R: 'point' }, [], t), popA('STEEL COMBS', t - 0.6, -0.62)] }));
shot(12.10, (t, d) => ({ gap: G0, comb: 1, topdown: true, minD: 0.5, handheld: 0.002, cam: push(t, d, [0, 4.2, 0.6], [0, 3.6, 0.55]), look: [0, 0, 0.55], fov: 45, actors: [] }));
// ======== 8 "their fingers sliding together."  (13.67)
shot(13.67, (t, d) => ({ gap: G0 - 0.12 * Math.sin(t * 2.6) ** 2, comb: 1, topdown: true, minD: 0.5, handheld: 0.001, cam: push(t, d, [0, 2.0, 1.2], [0, 1.8, 1.1]), look: [0, 0, 1.1], fov: 42, actors: [] }));
// ======== 9 "Next door, a rival company builds a flawless bridge."  (15.46)
shot(15.46, (t, d) => ({ gap: G0, comb: 1, cam: push(t, d, [-4, 3, -29], [-2, 2.6, -32]), look: [0, -3.5, ZR], fov: 50, shadowExt: 50, actors: [] }));
shot(16.90, (t, d) => ({ gap: G0, comb: 1, cam: push(t, d, [-1.0, 1.45, ZR + 5.2], [-1.0, 1.45, ZR + 4.7]), look: [-1.0, 1.5, ZR + 0.6], fov: 48,
  actors: [act('rworkA', -2.2, 0, ZR + 0.6, { expr: 'smug', L: 'hip', R: 'thumb' }, [], {}, t), act('rworkB', 0.2, 0, ZR + 0.4, { expr: 'stern', L: 'cross', R: 'cross' }, [], {}, t)] }));
// ======== 10 "No gaps."  (18.40)
shot(18.40, (t, d) => ({ gap: G0, comb: 1, cam: push(t, d, [-5.5, 0.6, ZR + 1.2], [-4.6, 0.6, ZR + 1.2]), look: [4, 0.25, ZR + 0.6], fov: 50, actors: [popA('NO GAPS!', t, -0.6, RED)] }));
// ======== 11 "Welded solid from cliff to cliff."  (19.22)
shot(19.22, (t, d) => ({ gap: G0, comb: 1, sparks: [-20.6, 0.2, ZR + 2.6], cam: push(t, d, [-16.6, 1.3, ZR + 5.4], [-17.0, 1.2, ZR + 5.0]), look: [-19.8, 0.7, ZR + 2.2], fov: 48,
  actors: [act('rworkA', -19.6, 0, ZR + 2.2, { expr: 'squint', L: { a: 60, e: 40 }, R: { a: 70, e: 30 } }, [{ kind: 'torch', hand: 1 }], {}, t), popA('WELDED!', t - 0.4, -0.6, RED)] }));
shot(20.30, (t, d) => ({ gap: G0, comb: 1, cam: push(t, d, [-4, -6, ZR + 32], [3, -5, ZR + 28]), look: [0, -6, ZR], fov: 50, shadowExt: 60, actors: [] }));
// ======== 12 "It opens first,"  (21.36)
shot(21.36, (t, d) => ({ gap: G0, comb: 1, ribbon: { x: -16, z: ZR, cut: ez((t - 0.35) / 0.25) }, cam: push(t, d, [-20.4, 1.5, ZR + 3.2], [-20.0, 1.5, ZR + 3.0]), look: [-16.2, 1.5, ZR + 0.2], fov: 50,
  actors: [act('ladyG', -16.0, 0, ZR + 1.3, { expr: t < 0.4 ? 'smile' : 'laugh', L: 'up', R: { a: 80, e: 20 } }, [{ kind: 'scissors', hand: 1 }], {}, t), act('rboss', -15.6, 0, ZR - 1.2, { expr: 'laugh', L: 'up', R: 'up' }, [], {}, t), ...(t > 0.35 ? [confetti(t - 0.35)] : [])] }));
// ======== 13 "and fancy cars float across like butter."  (22.26)
shot(22.26, (t, d) => { const car = { name: 'cream', x: -12 + t * 5.5, z: ZR + 1.8, ry: 0 }; return { gap: G0, comb: 1, cars: [car], cam: [car.x - 0.6, 1.5, ZR + 6.8], look: [car.x + 0.2, 1.3, ZR + 1.8], fov: 46, handheld: 0.002,
  actors: [DRV('drvC', car, { expr: 'smile_closed' }, t)] }; });
shot(23.30, (t, d) => { const car = { name: 'blue', x: -6 + t * 6, z: ZR - 1.8, ry: 0 }; return { gap: G0, comb: 1, cars: [car, { name: 'cream', x: 4 + t * 6, z: ZR + 1.8 }], cam: push(t, d, [6, 2.4, ZR + 5.0], [6.5, 2.3, ZR + 4.6]), look: [car.x, 1.1, ZR - 1.2], fov: 48,
  actors: [DRV('drvA', car, { expr: 'grin' }, t)] }; });
// ======== 14 "On the kid's bridge,"  (24.61)
shot(24.61, (t, d) => { const car = { name: 'green', x: -9 + t * 5, z: 1.8 }; return { gap: G0, comb: 1, cars: [car], cam: [car.x - 0.4, 1.4, 7.0], look: [car.x + 0.3, 1.2, 1.8], fov: 46, handheld: 0.002, actors: [DRV('drvB', car, { expr: 'smile' }, t)] }; });
// ======== 15 "every tire hits the comb."  (25.56)
shot(25.56, (t, d) => { const car = { name: 'green', x: lerp(-4.6, -1.36, ez(t / d)), z: 1.8 }; return { gap: G0, comb: 1, cars: [car], minD: 0.6, cam: [1.4, 0.45, 3.3], look: [-0.6, 0.4, 1.9], fov: 46, handheld: 0.002, actors: [] }; });
// ======== 16 "Ka-thunk!"  (27.11)
shot(27.11, (t, d) => { const x = -1.4 + t * 3.0; const b1 = Math.exp(-Math.pow((x + 1.35) / 0.18, 2)) * 0.18, b2 = Math.exp(-Math.pow((x - 0.95) / 0.18, 2)) * 0.16; const car = { name: 'green', x, z: 1.8, bounce: b1 + b2, bodyPitch: b1 * 0.6 - b2 * 0.6 };
  return { gap: G0, comb: 1, cars: [car], cam: [0.6, 1.25, 7.4], look: [0, 1.2, 1.8], fov: 46, shake: t < 0.4 ? 0.05 : 0, actors: [DRV('drvB', car, { expr: 'shock' }, t), burst('KA-THUNK!', t, -0.45)] }; });
// ======== 17 "The newspaper gives it a nickname: The Ka-Thunk Bridge."  (28.18)
shot(28.18, (t, d) => ({ gap: G0, comb: 1, cam: push(t, d, [-8, 2.4, 6], [-7, 2.2, 5]), look: [0, 1, 0], fov: 50, actors: [paper(t)] }));
shot(29.72, (t, d) => ({ gap: G0, comb: 1, cam: push(t, d, [-7, 2.2, 5], [-6.5, 2.1, 4.6]), look: [0, 1, 0], fov: 50, actors: [paper(3), ...(t > 0.1 ? [burst('THUNK!', t - 0.1, -0.55, 0.12)] : [])] }));
// ======== 18 "Everyone takes the smooth one."  (31.18)
shot(31.18, (t, d) => ({ gap: G0, comb: 1, tumble: [-6 + t * 2.6, 0.45, 2.2, t * 6], cars: [{ name: 'cream', x: -20 + t * 6, z: ZR + 1.8 }, { name: 'blue', x: -8 + t * 6, z: ZR + 1.8 }, { name: 'red', x: 4 + t * 6, z: ZR + 1.8 }],
  cam: push(t, d, [-2.4, 1.5, 6.4], [-2.2, 1.5, 5.9]), look: [-1.2, 1.4, 0], fov: 50, actors: [K(-1.4, 0.4, { expr: 'pained', L: 'hip', R: 'cheek' }, [], t)] }));
// ======== 19 "But as spring turns to summer,"  (32.87)
shot(32.87, (t, d) => ({ preset: 'gold', gap: gapAt(0.05 + t * 0.1), comb: 1, thermo: { x: -2.4, z: 3.2, ry: 0, k: 0.35 + t * 0.12 }, minD: 1.6, cam: push(t, d, [-3.0, 1.6, 6.4], [-2.8, 1.6, 6.0]), look: [-2.6, 1.8, 2.6], fov: 44, keep: [[-2.4, 3.8, 3.2]],
  actors: [K(-3.3, 2.6, { expr: 'smile_closed', L: 'hip', R: { a: 30 + t * 10, e: 30 } }, [], t), cal(t < 0.7 ? 'APRIL' : 'MAY', t)] }));
// ======== 20 "something strange happens."  (34.41)
shot(34.41, (t, d) => ({ preset: 'gold', gap: gapAt(0.2), comb: 1, minD: 1.2, cam: push(t, d, [0.8, 0.45, 2.6], [0.7, 0.45, 2.3]), look: [-0.8, 0.9, -0.6], fov: 48, keep: [[0, 0.05, 1.2]],
  actors: [K(-1.0, -0.8, { expr: 'squint', L: 'hip', R: 'temple', headTilt: -10 }, [], t)] }));
// ======== 21 "The gap starts closing."  (35.95)
shot(35.95, (t, d) => ({ preset: 'gold', gap: gapAt(0.2 + ez(t / d) * 0.15), comb: 1, topdown: true, minD: 0.5, handheld: 0.001, cam: [0, 2.6, 0.6], look: [0, 0, 0.6], fov: 44,
  actors: [hud((p) => { const g = p.g; for (const s of [-1, 1]) { const x = 300 + s * (210 - ((t * 1.5) % 1) * 40); g.fillStyle = '#ffd21a'; g.strokeStyle = '#1a1414'; g.lineWidth = 8; g.beginPath(); g.moveTo(x + s * 60, 480); g.lineTo(x - s * 10, 480); g.lineTo(x - s * 10, 450); g.lineTo(x - s * 60, 500); g.lineTo(x - s * 10, 550); g.lineTo(x - s * 10, 520); g.lineTo(x + s * 60, 520); g.closePath(); g.fill(); g.stroke(); } }, 0, 0.4)] }));
// ======== 22 "A sandwich in April."  (37.63)
const gapShot = (kind, month, k0, k1) => (t, d) => ({ preset: 'gold', gap: gapAt(lerp(k0, k1, ez(t / d))), comb: 1, topdown: true, minD: 0.5, handheld: 0.001, cam: push(t, d, [0, 1.9, 0.45], [0, 1.7, 0.42]), look: [0, 0, 0.42], fov: 44,
  actors: [fx(handIn(kind, t), 0, 0.12, 0.62, 0.42, { order: 8 }), cal(month, t)] });
shot(37.63, gapShot('sandwich', 'APRIL', 0.38, 0.42));
// ======== 23 "A pencil in June."  (38.89)
shot(38.89, gapShot('pencil', 'JUNE', 0.62, 0.66));
// ======== 24 "A coin in July."  (40.16)
shot(40.16, gapShot('coin', 'JULY', 0.86, 0.9));
// ======== 25 "Look!" the boss cheers.  (41.53)
shot(41.53, (t, d) => ({ preset: 'gold', gap: gapAt(0.92), comb: 1, cam: snap(t, [0.0, 1.2, 3.3], [0.0, 1.25, 3.0]), look: [0, 1.4, -1.0], fov: 50, keep: [[0, 0, 1.3]],
  actors: [K(-1.0, -0.4, { expr: 'smile_closed', L: 'cross', R: 'cross' }, [], t), BO(1.05, -0.4, { expr: 'laugh', L: 'up', R: 'up', bob: 0.02 * Math.abs(Math.sin(t * 9)) }, [], t), excl(t, 1.05, 2.75, -0.4, 0.6)] }));
// ======== 26 "It finally fits!"  (43.05)
shot(43.05, (t, d) => ({ preset: 'gold', gap: gapAt(0.92), comb: 1, minD: 1.4, cam: push(t, d, [1.9, 1.55, 3.4], [1.8, 1.55, 3.1]), look: [1.3, 1.85, 0.5], fov: 46,
  actors: [BO(1.3, 0.5, { expr: 'laugh', talk: true, L: 'up', R: 'thumb' }, [], t), bub('IT FITS!', t, 1.5, 2.6, 0.5, 0.75, -50)] }));
// ======== 27 "Then comes the hottest day of the year."  (44.42)
shot(44.42, (t, d) => ({ preset: 'hot', gap: 0.03, comb: 1, cars: [{ name: 'cream', x: -6 + t * 3, z: ZR + 1.8 }, { name: 'blue', x: -14 + t * 3, z: ZR + 1.8 }], cam: push(t, d, [-15, 2.6, ZR + 10], [-13, 2.4, ZR + 9]), look: [-2, 1.2, ZR], fov: 50,
  actors: [] }));
shot(45.40, (t, d) => ({ preset: 'hot', gap: 0.03, comb: 1, thermo: { x: -3, z: ZR + 3.3, ry: 0, k: lerp(0.8, 0.92, ez(t / d)) }, minD: 1.4, cam: push(t, d, [-2.6, 2.0, ZR + 6.0], [-2.7, 2.1, ZR + 5.4]), look: [-3, 2.2, ZR + 3.3], fov: 44, keep: [[-3, 3.8, ZR + 3.3], [-3, 0.8, ZR + 3.3]], actors: [] }));
// ======== 28 "One hundred fifteen degrees."  (46.40)
shot(46.40, (t, d) => ({ preset: 'hot', gap: 0.03, comb: 1, cam: push(t, d, [-6, 1.5, ZR + 7], [-5.6, 1.5, ZR + 6.6]), look: [0, 1.5, ZR], fov: 50, shake: t > 0.25 && t < 0.6 ? 0.02 : 0, actors: [thermoHud(t, 0.86, 0.96, '115°')] }));
// ======== 29 "The flawless bridge groans,"  (48.46)
shot(48.46, (t, d) => ({ preset: 'hot', gap: 0.03, comb: 1, bulge: ez(t / d) * 0.18, rivets: t > 0.3 ? t - 0.3 : undefined, shake: 0.01, cam: push(t, d, [-1.5, -0.6, ZR + 8.5], [-1.0, -0.6, ZR + 8.0]), look: [0, -0.4, ZR + 3.7], fov: 50,
  actors: [creak(t, -2.5, 0.9, ZR + 4.4), creak(t + 0.3, 2.6, 0.6, ZR + 4.4)] }));
// ======== 30 "and its middle bulges up"  (49.60)
shot(49.60, (t, d) => ({ preset: 'hot', gap: 0.03, comb: 1, bulge: lerp(0.18, 1, ez(t / 1.2)), shake: t < 1.2 ? 0.05 : 0.01, cam: push(t, d, [0, -0.5, ZR + 30], [0, 0, ZR + 27]), look: [0, -0.5, ZR], fov: 52, shadowExt: 40, actors: [] }));
// ======== 31 "like a giant speed bump."  (51.00)
shot(51.00, (t, d) => ({ preset: 'hot', gap: 0.03, comb: 1, bulge: 1, cam: push(t, d, [-17, 1.1, ZR + 1.0], [-15.5, 1.1, ZR + 1.0]), look: [0, 1.4, ZR], fov: 46, actors: [popA('SPEED BUMP!', t - 0.3, -0.6, RED)] }));
// ======== 32 "Cars launch off the top"  (52.66)
shot(52.66, (t, d) => { const v = 11, x0 = -9; let x = x0 + t * v, car; const tl = (0 - x0) / v;
  if (t < tl) car = { name: 'red', x, z: ZR + 1.8, lift: bumpY(x, 1) }; else { const tau = t - tl; car = { name: 'red', x, z: ZR + 1.8, free: true, y: Math.max(0, bumpY(0, 1) + 3.0 * tau - 4.9 * tau * tau), pitch: 0.25 - tau * 1.1 }; }
  return { preset: 'hot', gap: 0.03, comb: 1, bulge: 1, cars: [car], cam: [lerp(-2, 4, t / d), 1.6, ZR + 12], look: [car.x, 1.8, ZR + 1.5], fov: 48, actors: [DRV('drvA', car, { expr: t < tl ? 'grin' : 'shock', L: 'up', R: 'up' }, t)] }; });
// ======== 33 "and land on their bumpers."  (53.80)
shot(53.80, (t, d) => { const k = ez(t / 0.25); const car = { name: 'red', x: 10.0, z: ZR + 1.8, free: true, y: lerp(1.2, 0.0, k) + 0.75, pitch: lerp(-0.4, -0.95, k) };
  return { preset: 'hot', gap: 0.03, comb: 1, bulge: 1, cars: [car], dust: t > 0.2 ? [11.6, 0, ZR + 1.8, (t - 0.2) * 1.3] : undefined, shake: t > 0.2 && t < 0.5 ? 0.06 : 0, minD: 1.2, cam: push(t, d, [16.5, 1.6, ZR + 8.5], [16.0, 1.6, ZR + 8.0]), look: [10.6, 1.4, ZR + 1.8], fov: 50,
    actors: [act('drvA', 9.6, 1.4, ZR + 1.6, { expr: 'shock', L: 'up', R: 'up' }, [], { s: 0.75, crop: true, blob: false }, t), ...(t > 0.2 ? [burst('CRUNCH!', t - 0.2, -0.4)] : [])] }; });
// ======== 34 "You see, steel swells when it gets hot."  (55.26)
const OV = (t, d, a, b) => ({ preset: 'day', gap: G0, comb: 1, cam: push(t, d, a, b), look: [0, -6, -23], fov: 50, handheld: 0.01, shadowExt: 50 });
shot(55.26, (t, d) => ({ ...OV(t, d, [0, 62, 30], [0, 58, 27]), actors: [span('out', t, 0, 0, 22), span('out', t, 0, ZR, 22)] }));
// ======== 35 "On a long bridge, it can push out by several inches."  (57.59)
shot(57.59, (t, d) => ({ ...OV(t, d, [0, 58, 27], [0, 55, 25]), actors: [span('out', 1, 0, 0, 22, '+6 IN'), span('out', 1, 0, ZR, 22, '+6 IN')] }));
// ======== 36 "The kid's combs gave the steel room to stretch."  (60.43)
shot(60.43, (t, d) => ({ ...OV(t, d, [0, 55, 25], [0, 52, 23]), gap: lerp(G0, 0.04, ez(t / d)), actors: [span('in', t, 0, 0, 22, 'ROOM TO GROW'), mark('ok', t - 0.6, 13, 3, 0, 8)] }));
// ======== 37 "The welded bridge had nowhere to go,"  (62.94)
shot(62.94, (t, d) => ({ ...OV(t, d, [0, 52, 23], [0, 50, 21]), actors: [span('in', 1, 0, 0, 22), mark('ok', 1, 13, 3, 0, 8), span('block', t, 0, ZR, 22, 'NOWHERE TO GO'), mark('no', t - 0.2, -15, 3, ZR, 8), mark('no', t - 0.3, 15, 3, ZR, 8)] }));
// ======== 38 "so it bent."  (64.59)
shot(64.59, (t, d) => ({ preset: 'hot', gap: 0.03, comb: 1, bulge: ez(t / 0.6), shake: t < 0.6 ? 0.04 : 0, cam: push(t, d, [6, -1.5, ZR + 27], [5, -1, ZR + 24]), look: [0, -0.8, ZR], fov: 52, shadowExt: 40, actors: [] }));
// ======== 39 "By August,"  (65.73)
shot(65.73, (t, d) => { const car = { name: 'green2', x: -3.2 + t * 5, z: -1.6 }; const b = Math.exp(-Math.pow((car.x + 1.35) / 0.2, 2)) * 0.14; car.bounce = b;
  return { preset: 'gold', gap: 0.06, comb: 1, cars: [car], cam: push(t, d, [0.4, 1.45, 3.4], [0.4, 1.45, 3.15]), look: [0.2, 1.4, -0.4], fov: 50, keep: [[0, 0.2, -1.6]],
    actors: [K(-1.0, 0.6, { expr: 'grin', L: 'hip', R: 'wave' }, [], t), BO(1.1, 0.6, { expr: 'laugh', L: 'up', R: 'up' }, [], t), DRV('drvD', car, { expr: 'laugh' }, t), ...(t > 0.3 ? [burst('KA-THUNK!', t - 0.3, -0.3)] : [])] }; });
// ======== 40 "the line to cross the Ka-Thunk Bridge is a mile long."  (66.42)
shot(66.42, (t, d) => { const car = { name: 'blue2', x: 2.8 - t * 4, z: -1.6, ry: Math.PI }; const b = Math.exp(-Math.pow((car.x - 1.35) / 0.2, 2)) * 0.14; car.bounce = b;
  return { preset: 'gold', gap: 0.06, comb: 1, queue: true, cars: [car], cam: push(t, d, [-9, 3, 10], [-26, 26, 34]), look: [lerp(2, 30, ez(t / d)), 0, 0], fov: 50, shadowExt: lerp(20, 80, ez(t / d)),
    actors: [K(-1.3, 2.4, { expr: 'laugh', L: 'up', R: 'wave' }, [], t, { crop: t > 0.8 }), BO(1.4, 2.4, { expr: 'laugh', L: 'up', R: 'up' }, [], t, { crop: t > 0.8 }), ...(t > 0.9 ? [popA('1 MILE LINE!', t - 0.9, -0.6)] : [])] }; });
export const TOTAL = Math.ceil(69.2 * FPS);
export const stateAt = (f) => { SEED = 0; const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--; const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0; const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i; frame(S); return S; };
function frame(S) { const MIN = S.minD ?? 1.6; const c = S.cam, l = S.look; let dx = c[0] - l[0], dy = c[1] - l[1], dz = c[2] - l[2]; const dist = Math.hypot(dx, dy, dz);
  if (dist < MIN) { const k = MIN / Math.max(dist, 1e-3); dx *= k; dz *= k; dy *= k; S.cam = [l[0] + dx, l[1] + dy, l[2] + dz]; }
  if (S.topdown) return;
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
