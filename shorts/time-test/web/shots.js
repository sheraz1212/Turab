// Time Test short (38.5 s). Reference style: almost no hard cuts; the camera never stops, rides with the falling
// jumper, orbits groups, and dives INTO an eye / window to reach the next scene (white flash at the join).
import * as T from './toon.js';
const FPS = 30;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)); const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t)); const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); }; const eo = (t) => 1 - Math.pow(1 - cl(t), 3); const ei = (t) => Math.pow(cl(t), 2.4);
const talkE = (t, e) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(e, 'o') : e);
const U = 2.36; const TH = 45, SR = -700, DRX = -700, DRZ = 80, BR = 700, NETZ = 6.2;
const prop = (p, pr, h, t) => { const [x, y] = h; const u = U, g = p.g;
  if (pr.kind === 'watch') { p.poly([[x - 14 * u, y - 12 * u], [x + 14 * u, y - 12 * u], [x + 14 * u, y + 8 * u], [x - 14 * u, y + 8 * u]], '#1a1a22', 2.4 * u); g.save(); g.font = `900 ${13 * u}px Courier New`; g.textAlign = 'center'; g.fillStyle = '#ff4a2a'; g.fillText(String(10 + Math.floor(t * 20) % 89), x, y + 3 * u); g.restore(); }
  if (pr.kind === 'clip') { p.poly([[x - 16 * u, y - 24 * u], [x + 16 * u, y - 24 * u], [x + 16 * u, y + 16 * u], [x - 16 * u, y + 16 * u]], '#c89a5a', 2.2 * u); p.poly([[x - 12 * u, y - 18 * u], [x + 12 * u, y - 18 * u], [x + 12 * u, y + 12 * u], [x - 12 * u, y + 12 * u]], '#f6f2ea', 1 * u); for (let k = 0; k < 4; k++) p.stroke([[x - 8 * u, y - 10 * u + k * 6 * u], [x + 8 * u, y - 10 * u + k * 6 * u]], 1.4 * u, '#5a5a6a'); }
  if (pr.kind === 'stopwatch') { p.ell(x, y - 4 * u, 15 * u, 15 * u, '#f4f4f0', 2.6 * u); p.ell(x, y - 21 * u, 4 * u, 3 * u, '#c8c8d0', 1.6 * u); p.stroke([[x, y - 4 * u], [x + 8 * u, y - 10 * u]], 2 * u, '#e0262a'); }
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
// flying red cap and pigeon (world cards that face the camera)
const capFx = (t, x, y, z, s = 0.35) => fx((p) => { const g = p.g; g.save(); g.translate(300, 820); g.rotate(t * 5); p.poly([[-90, 0], [90, 0], [70, -80], [-70, -80]], '#e0262a', 10); p.poly([[60, 0], [170, 0], [160, 22], [60, 22]], '#b81a1e', 8); g.restore(); }, x, y, z, s, { face: true, order: 7 });
const birdFx = (t, x, y, z, s = 0.6) => fx((p) => { const g = p.g, w = Math.sin(t * 22) * 70; g.save(); g.translate(300, 820); p.poly([[-40, -100 - w], [10, 0], [-90, -10]], '#8a8a9a', 8); p.ell(0, 0, 90, 46, '#9a9aaa', 9); p.ell(80, -30, 34, 32, '#7a7a8a', 8); p.ell(90, -36, 9, 9, '#ffffff', 4); p.ell(93, -36, 4, 4, '#1a1a1a', 0); p.poly([[110, -28], [140, -22], [110, -18]], '#f2a01a', 4); p.poly([[40, -90 + w], [-10, 0], [80, -10]], '#aaaabb', 8); p.poly([[-80, 0], [-150, 20], [-140, -20]], '#7a7a8a', 6); g.restore(); }, x, y, z, s, { face: true, order: 7 });
// the brain character (pink, glasses, stick limbs) drawn on a card
const brain = (o = {}) => (p) => { const g = p.g, t = o.t || 0, pan = o.panic ? 1 : 0, sh = pan ? Math.sin(t * 40) * 6 : 0; g.save(); g.translate(sh, 0);
  const cx = 300, cy = 470; for (const s of [-1, 1]) { p.stroke([[cx + s * 50, 640], [cx + s * 70, 820], [cx + s * 60, 960]], 16, '#1a1414'); p.ell(cx + s * 75, 965, 40, 16, '#1a1414', 0); }
  const body = []; for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI * 2, r = 1 + 0.06 * Math.sin(a * 9) + 0.03 * Math.sin(a * 17); body.push([cx + Math.cos(a) * 210 * r, cy + Math.sin(a) * 175 * r]); }
  p.poly(body, '#f49ab8', 14); g.save(); g.beginPath(); body.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.clip(); g.strokeStyle = '#d86a90'; g.lineWidth = 9; for (let k = 0; k < 9; k++) { g.beginPath(); const y0 = 330 + k * 34; g.moveTo(100, y0); for (let x = 100; x < 500; x += 20) g.lineTo(x, y0 + Math.sin(x * 0.07 + k) * 14); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(220, 360, 70, 30, -0.3, 0, 7); g.fill(); g.restore();
  p.stroke([[cx, 300], [cx, 640]], 0.1, '#00000000');
  for (const s of [-1, 1]) { p.ell(cx + s * 62, 450, pan ? 46 : 40, pan ? 50 : 40, '#ffffff', 9); p.ell(cx + s * 62 + (o.look || 0) * 10, 456, 15, 15, '#1a1414', 0); } p.stroke([[cx - 22, 450], [cx + 22, 450]], 8, '#1a1414');
  for (const s of [-1, 1]) p.ell(cx + s * 62, 450, 52, 52, null, 7);
  if (pan) p.ell(cx, 560, 38, 30, '#5a1e28', 8); else p.stroke([[cx - 40, 560], [cx, 578], [cx + 40, 560]], 9, '#1a1414');
  if (pan) for (const s of [-1, 1]) p.poly([[cx + s * 190, 360], [cx + s * 205, 395], [cx + s * 175, 395]], '#9fd4ff', 4);
  const wr = o.write ? Math.sin(t * (pan ? 40 : 14)) * 18 : 0; p.stroke([[cx - 170, 520], [cx - 230, 600 + wr], [cx - 200, 690]], 15, '#1a1414'); p.stroke([[cx + 170, 520], [cx + 240, 610 - wr], [cx + 200, 690 + wr]], 15, '#1a1414');
  if (o.write) { p.poly([[cx + 196, 690 + wr], [cx + 206, 690 + wr], [cx + 150, 800 + wr], [cx + 140, 796 + wr]], '#ffc21a', 5); }
  if (o.wave) { p.stroke([[cx - 170, 500], [cx - 250, 420], [cx - 230 + Math.sin(t * 12) * 30, 320]], 15, '#1a1414'); }
  g.restore(); };
const BRN = (x, y, z, o = {}, extra = {}) => ({ x, y, z, draw: brain(o), s: 1.0, ...extra });
// HUD device screen (TIME-O-METER)
const device = (t, k = 1) => hud((p) => { const g = p.g; const sc = 0.85 + 0.15 * eo(t * 3); g.save(); g.translate(300, 560); g.scale(sc * k, sc * k);
  g.fillStyle = '#1a1a22'; g.beginPath(); g.roundRect(-230, -300, 460, 620, 50); g.fill(); g.strokeStyle = '#0a0a0e'; g.lineWidth = 12; g.stroke(); g.fillStyle = '#3a3a44'; g.beginPath(); g.roundRect(-205, -275, 410, 570, 36); g.fill();
  g.fillStyle = '#120404'; g.beginPath(); g.roundRect(-170, -200, 340, 380, 18); g.fill(); const n = String(Math.floor(((Math.sin(Math.floor(t * 15) * 91.7) + 1) * 0.5) * 99)).padStart(2, '0');
  g.font = '900 250px Courier New, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#ff2a1a'; g.shadowBlur = 40; g.fillStyle = '#ff5a3a'; g.fillText(n, 0, -5); g.shadowBlur = 0; g.fillStyle = 'rgba(0,0,0,.35)'; for (let y = -200; y < 180; y += 10) g.fillRect(-170, y, 340, 4);
  g.fillStyle = '#f2c41a'; g.beginPath(); g.roundRect(-150, 205, 300, 64, 10); g.fill(); g.font = '900 40px Arial Black, Arial'; g.fillStyle = '#1a1414'; g.fillText('TIME-O-METER', 0, 238);
  for (const s of [-1, 1]) { g.fillStyle = '#2a2a30'; g.fillRect(s * 230 - (s > 0 ? 0 : 60), -120, 60, 240); } g.fillStyle = '#c8c8d0'; g.fillRect(-20, -330, 40, 40); g.restore(); }, -0.65, 0.42);
// blueprint hypothesis board
const blueprint = (t, focus = 0) => hud((p) => { const g = p.g, z = 1 + focus * 0.55, oy = focus * -260; g.save(); g.translate(300, 500 + oy); g.scale(z, z); g.translate(-300, -500);
  g.fillStyle = '#1a4aa8'; g.fillRect(-40, 40, 680, 940); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; for (let x = -40; x < 640; x += 30) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x, 980); g.stroke(); } for (let y = 40; y < 980; y += 30) { g.beginPath(); g.moveTo(-40, y); g.lineTo(640, y); g.stroke(); }
  g.strokeStyle = '#e8f0ff'; g.fillStyle = '#e8f0ff'; g.lineWidth = 5; g.font = '700 40px Courier New'; g.fillText('HYPOTHESIS:', 30, 110); g.font = '700 26px Courier New'; g.fillText('SCARED BRAIN = SLOW TIME', 30, 150); g.fillText('-> CAN READ THE NUMBER', 30, 182);
  const k = eo(t * 1.5); g.beginPath(); g.moveTo(80, 900); g.lineTo(80, 260); g.moveTo(150, 900); g.lineTo(150, 260); for (let y = 280; y < 900; y += 60) { g.moveTo(80, y); g.lineTo(150, y + 50); g.moveTo(150, y); g.lineTo(80, y + 50); } g.moveTo(60, 260); g.lineTo(260, 260); g.stroke();
  const fy = 300 + k * 330; g.beginPath(); g.arc(300, fy, 26, 0, 7); g.moveTo(300, fy + 26); g.lineTo(300, fy + 100); g.moveTo(300, fy + 50); g.lineTo(250, fy + 10); g.moveTo(300, fy + 50); g.lineTo(350, fy + 10); g.moveTo(300, fy + 100); g.lineTo(270, fy + 160); g.moveTo(300, fy + 100); g.lineTo(330, fy + 160); g.stroke();
  g.setLineDash([10, 10]); g.beginPath(); g.moveTo(350, fy + 10); g.lineTo(450, fy - 60); g.stroke(); g.setLineDash([]); g.beginPath(); g.arc(500, fy - 110, 80, 0, 7); g.stroke(); g.font = '900 70px Courier New'; g.fillStyle = '#ff6a4a'; g.fillText('47', 460, fy - 88);
  g.fillStyle = '#e8f0ff'; g.font = '700 22px Courier New'; g.fillText('DETAIL A: WRIST DISPLAY', 380, fy - 10); g.beginPath(); g.moveTo(40, 905); g.lineTo(560, 905); g.stroke(); g.fillText('NET', 280, 940);
  if (focus > 0.5) { g.strokeStyle = '#6ad83a'; g.lineWidth = 12; g.beginPath(); g.moveTo(560, fy - 150); g.lineTo(580, fy - 120); g.lineTo(620, fy - 180); g.stroke(); } g.restore(); }, -0.58, 0.52);
const push = (t, d, a, b) => L3(a, b, ez(t / d)); const snap = (t, a, b, k = 0.25) => L3(a, b, eo(t / k));
const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });
const J = (who, x, y, z, o, props = [], t = 0, extra = {}) => act(who, x, y, z, o, props, extra, t);
// falling jumper (slow-motion gravity so the fall reads)
const FALL0 = 1.3, GSLOW = 2.4; const jy = (t) => TH + 0.4 - 0.5 * GSLOW * Math.max(0, t - FALL0) ** 2; const JZ = 4.4;
// dive-in helper: camera flies from `from` toward a target point and the frame flashes white at the end
const dive = (t, d, from, target, k0 = 0.35) => { const k = ei((t / d - k0) / (1 - k0)); return { cam: L3(from, target.map((v, i) => v + (from[i] - v) * 0.04), k), look: target, flash: cl((t / d - 0.82) / 0.18) }; };
const flashIn = (t) => cl(1 - t / 0.25);

// ======== "A scientist talked people into falling off a fifteen-story tower," (0.00)
shot(0.0, (t, d) => { const a = lerp(0.9, -0.5, ez(t / d)); return { cam: [Math.sin(a) * 8, TH + 2.6 - t * 0.6, JZ - 1 + Math.cos(a) * 8], look: [0, TH + 1.2, JZ - 1], fov: 58, mb: [0.006, 0], shadowExt: 14,
  actors: [J('sci', -1.4, TH + 0.2, 2.2, { expr: 'smug', L: 'hip', R: 'point', talk: true }, [{ kind: 'clip', hand: 0 }], t), J('jmp1', 0, TH + 0.4, JZ, { expr: 'nervous', L: 'up', R: 'up', sweat: 2, headTilt: 8 * Math.sin(t * 9) }, [], t)] }; });
shot(FALL0, (t0, d) => { const t = FALL0 + t0, y = jy(t), a = -0.9 + t0 * 0.9; return { cam: [Math.sin(a) * 3.6, y + 1.8, JZ + Math.cos(a) * 3.6], look: [0, y + 0.9, JZ], fov: 62, roll: 14 * Math.sin(t0 * 2.2), mb: [0, 0.012], minD: 1, shadowAt: [0, y, JZ], shadowExt: 12,
  actors: [J('jmp1', 0, y, JZ, { expr: 'scream', L: 'up', R: 'up', step: t0 * 4, stride: 14 }, [], t, { crop: true, blob: false }), capFx(t0, 0.3 + t0 * 0.4, y + 2.4 + t0 * 1.6, JZ - 0.3), ...(t0 > 0.6 ? [birdFx(t0, 2.4 - (t0 - 0.6) * 2.5, y + 1.6, JZ + 1.2)] : [])] }; });
// ======== "just to catch time cheating." (3.36) — swing to the face and dive into the eye
shot(3.36, (t0, d) => { const t = 3.36 + t0, y = jy(t), eye = [0.08, y + 1.84, JZ + 0.05]; const D = dive(t0, d, [0.6, y + 2.2, JZ + 3.2], eye, 0.3); return { ...D, fov: 55, minD: 0.05, roll: 8 * Math.sin(t0 * 3), shadowExt: 10,
  actors: [J('jmp1', 0, y, JZ, { expr: 'terror', L: 'up', R: 'up', sweat: 2 }, [], t, { crop: true, blob: false }), birdFx(t0 + 1, -0.9, y + 2.1, JZ + 0.6, 0.5)] }; });
// ======== "You see, car crash survivors all swear the same thing:" (5.03) — orbit the support group
const MEMB = ['civA', 'lady', 'grandpa', 'newsboy', 'gent', 'drvC', 'civB'];
const group = (t, exprs = {}) => MEMB.map((w, k) => { const a = k / 7 * Math.PI * 2 + 0.2; return J(w, SR + Math.cos(a) * 3.3, 0.3, Math.sin(a) * 3.3, { expr: exprs[k] || (k % 2 ? 'nervous' : 'shock'), L: k % 3 ? 'cheek' : 'hip', R: k === 2 ? 'point' : 'cheek', talk: k === (Math.floor(t * 2) % 7) }, [], t, { s: 0.92, blob: false, crop: true }); });
shot(5.03, (t, d) => { const a = lerp(1.9, 4.3, ez(t / d)); return { preset: 'room', flash: flashIn(t), cam: [SR + Math.cos(a) * 7.0, 3.4, Math.sin(a) * 7.0], look: [SR, 1.2, 0], fov: 56, mb: t < 0.3 ? [0.01, 0] : [0, 0], shadowExt: 10,
  actors: [...group(t), ...(t > 1.2 ? [bub('SLOW-MO!', t - 1.2, SR + Math.cos(0.2 + 2 * Math.PI / 7 * 2) * 3.3, 2.5, Math.sin(0.2 + 2 * Math.PI / 7 * 2) * 3.3, 0.6)] : [])] }; });
// ======== "the world went into slow motion." (7.45) — dive to the toy cars crashing in slow motion
shot(7.45, (t, d) => ({ preset: 'room', toys: { k: lerp(0.32, 0.78, t / d) }, cam: push(t, d, [SR + 1.6, 1.5, 1.6], [SR + 1.0, 1.15, 1.1]), look: [SR, 0.85, 0], fov: 46, minD: 0.6, shadowExt: 6,
  actors: [J('grandpa', SR - 0.4, 0.3, -3.0, { expr: 'shock', L: 'cheek', R: 'cheek' }, [], t, { s: 0.92, blob: false, crop: true }), popA('S L O W   M O', t - 0.3, -0.62)] }));
// ======== "So he strapped a tiny screen to every jumper's wrist." (9.3) — fast truck along the line of jumpers
const LINE = ['jmp1', 'jmp2', 'jmp3', 'jmp4'];
shot(9.3, (t, d) => { const x = lerp(-7, 0.2, eo(t / d)); return { flash: flashIn(t) * 0.6, cam: [x, 1.6, -5.6], look: [x - 0.6, 1.5, -11.5], fov: 54, mb: t < 0.4 ? [0.012, 0] : [0, 0],
  actors: [J('sci', -1.0, 0, -11.0, { expr: 'grin', L: { a: 70, e: 60 }, R: { a: 80, e: 40 } }, [], t), ...LINE.map((w, k) => J(w, 0.4 + k * 1.6 - (k ? 0 : 0), 0, -11.4 - (k % 2) * 0.3, { expr: k ? 'nervous' : 'squint', L: k ? 'hip' : { a: 60, e: 70 }, R: 'hang' }, k ? [{ kind: 'watch', hand: 0 }] : [{ kind: 'watch', hand: 0 }], t, { crop: k > 0 }))] }; });
shot(10.9, (t, d) => ({ cam: push(t, d, [-0.4, 1.7, -8.6], [-0.2, 1.45, -9.6]), look: [0.1, 1.35, -11.4], fov: 46, minD: 0.8,
  actors: [J('sci', -1.0, 0, -11.0, { expr: 'smug', L: 'hip', R: 'point', talk: true }, [], t, { crop: true }), J('jmp1', 0.4, 0, -11.4, { expr: 'nervous', L: { a: 75, e: 80 }, R: 'hang' }, [{ kind: 'watch', hand: 0 }], t, { crop: true })] }));
// ======== "It flashed numbers just a little too fast to read." (12.2) — the screen fills the frame
shot(12.2, (t, d) => ({ cam: push(t, d, [0.2, 1.5, -9.4], [0.3, 1.45, -10.2]), look: [0.4, 1.3, -11.4], fov: 46, minD: 0.5, actors: [device(t, 1 + t * 0.05), ...(t > 1.2 ? [popA('TOO FAST!', t - 1.2, -0.62, RED)] : [])] }));
// ======== "If a scared brain really slows time down, they should read them in mid-air." (14.75)
shot(14.75, (t, d) => ({ cam: [3, 2, -6], look: [0, 4, -14], fov: 50, actors: [blueprint(t, 0)] }));
shot(17.1, (t, d) => ({ cam: [3, 2, -6], look: [0, 4, -14], fov: 50, actors: [blueprint(1 + t, ez(t / 0.6))] }));
// ======== "One by one, they dropped, screaming, straight into the net." (18.6)
const dropY = (t, y0) => Math.max(2.75, y0 - 0.5 * 9.8 * 0.9 * t * t);
shot(18.6, (t, d) => { const y2 = dropY(t, 16), y3 = dropY(Math.max(0, t - 0.5), 18); const land = Math.max(0, t - 0.86); return { flash: flashIn(t) * 0.5, cam: [3.2, Math.max(3.6, y2 + 0.4), JZ + 5.6], look: [0, Math.max(2.8, y2 + 0.9), JZ + 1.4], fov: 56, shadowExt: 14, mb: y2 > 3 ? [0, 0.01] : [0, 0],
  net: y2 <= 2.76 ? { k: 0.9 * Math.exp(-land * 2.2) * Math.cos(land * 10) + 0.2, x: -0.6, z: JZ + 1.4 } : undefined,
  actors: [J('jmp2', -0.6, y2 - (y2 <= 2.76 ? 0.7 * Math.exp(-land * 2.2) * Math.cos(land * 10) : 0), JZ + 1.4, { expr: 'scream', L: 'up', R: 'up' }, [], t, { crop: true, blob: false }), J('jmp3', 1.2, y3, JZ + 2.2, { expr: 'scream', L: 'up', R: 'up' }, [], t, { crop: true, blob: false }), ...(y2 > 3 ? [bub('AAAH!', t, -0.6, y2 + 2.5, JZ + 1.4, 0.7)] : [])] }; });
shot(20.0, (t, d) => { const y4 = dropY(t, 9); const land = Math.max(0, t - 0.36); const bo = y4 <= 2.76 ? 0.7 * Math.exp(-land * 2.2) * Math.cos(land * 10) : 0; return { cam: push(t, d, [4.2, 5.6, NETZ + 6.2], [3.6, 5.0, NETZ + 5.4]), look: [0, 3.0, NETZ + 0.6], fov: 60, shake: land > 0 && land < 0.3 ? 0.04 : 0, shadowExt: 12,
  net: y4 <= 2.76 ? { k: bo / 0.7 * 0.9 + 0.25, x: 0.8, z: NETZ + 1 } : { k: 0.25, x: -1.6, z: NETZ - 1.2 },
  actors: [J('jmp4', 0.8, y4 - bo, NETZ + 1, { expr: 'terror', L: 'up', R: 'up' }, [], t, { crop: true, blob: false }), J('jmp2', -1.8, 2.3, NETZ - 1.2, { expr: 'shock', L: 'cheek', R: 'cheek' }, [], t, { crop: true, blob: false }), J('jmp3', 2.2, 2.3, NETZ - 2.0, { expr: 'nervous', L: 'hip', R: 'temple' }, [], t, { crop: true, blob: false })] }; });
// ======== "Every jumper swore the fall took forever." (21.6)
shot(21.6, (t, d) => { const x = lerp(-3.8, 2.0, ez(t / d)); return { cam: [x, 1.6, 16.4], look: [x + 0.3, 1.5, 13.2], fov: 52, mb: t < 0.25 ? [0.01, 0] : [0, 0],
  actors: [J('jmp2', -3.0, 0, 13, { expr: 'yell', talk: true, L: 'up', R: 'up' }, [], t), J('jmp3', -1.4, 0, 13.2, { expr: 'shock', L: 'cheek', R: 'cheek' }, [], t), J('jmp4', 0.2, 0, 13, { expr: 'yell', talk: true, L: { a: 160, e: 10 }, R: { a: 160, e: 10 } }, [], t), J('jmp1', 1.8, 0, 13.2, { expr: 'nervous', L: 'hip', R: 'temple', sweat: 1 }, [], t),
    ...(t > 0.3 ? [bub('FOREVER!', t - 0.3, -3.0, 2.5, 13, 1.0)] : []), ...(t > 1.3 ? [bub('LIKE A MINUTE!', t - 1.3, 0.2, 2.5, 13, 1.0)] : [])] }; });
// ======== "Way longer than it really did." (23.9)
shot(23.9, (t, d) => ({ cam: snap(t, [4.6, 1.5, 16.6], [4.3, 1.5, 16.2]), look: [3.6, 1.6, 13.2], fov: 48,
  actors: [J('sci', 3.6, 0, 13.2, { expr: 'smug', L: 'hip', R: { a: 120, e: 30 } }, [{ kind: 'stopwatch', hand: 1 }], t), popA('REAL FALL: 3 SEC', t - 0.3, -0.62)] }));
// ======== "But not one of them could read a single number." (25.5) — dark room, glowing display
shot(25.5, (t, d) => { const a = lerp(-0.6, 0.5, ez(t / d)); return { preset: 'dark', led: String(100000 + Math.floor(((Math.sin(Math.floor(t * 12) * 13.1) + 1) / 2) * 899999)), cam: [DRX + Math.sin(a) * 6.5, 2.0, DRZ + 5.5 + Math.cos(a) * 1.0], look: [DRX, 2.2, DRZ - 2], fov: 56, shadowExt: 10,
  actors: LINE.map((w, k) => J(w, DRX - 2.4 + k * 1.6, 0, DRZ + 0.4 + (k % 2) * 0.3, { expr: k % 2 ? 'squint' : 'nervous', L: 'temple', R: 'hip', look: 0 }, [], t, { crop: true })).concat(t > 0.5 ? LINE.map((w, k) => qmark(t - 0.5 - k * 0.12, DRX - 2.4 + k * 1.6, 2.4, DRZ + 0.4 + (k % 2) * 0.3)) : []) }; });
// ======== "Here's the trick. When you're terrified," (27.8) — dive into a terrified eye
shot(27.8, (t, d) => { const eye = [DRX - 0.8 + 0.07, 1.84, DRZ + 0.4 + 0.05]; const D = dive(t, d, [DRX - 0.8, 1.9, DRZ + 3.2], eye, 0.45); return { preset: 'dark', led: '??????', ...D, fov: 50, minD: 0.05,
  actors: [J('jmp1', DRX - 0.8, 0, DRZ + 0.4, { expr: 'terror', L: 'cheek', R: 'cheek', sweat: 2 }, [], t, { crop: true })] }; });
// ======== "your brain doesn't slow time down." (29.7) — out of the porthole into the brain room
shot(29.7, (t, d) => ({ preset: 'brain', flash: flashIn(t), cam: L3([BR, 3.8, -5.0], [BR + 2.6, 3.0, 3.6], eo(t / 1.2)), look: L3([BR, 3.8, -6], [BR, 1.9, -3.2], eo(t / 1.2)), fov: 54, minD: 0.5, shadowExt: 10,
  actors: [BRN(BR, 0.6, -2.6, { t, write: true }, { crop: true }), ...(t > 0.6 ? [popA('TIME: NORMAL', t - 0.6, -0.62, GRN)] : [])] }));
// ======== "It just takes way more notes." (31.5) — alarm, frantic writing, pages pile up
shot(31.5, (t, d) => { const a = lerp(0.4, -0.5, ez(t / d)); return { preset: 'alarm', fly: true, pages: t * 140, cam: [BR + Math.sin(a) * 4.6, 2.6, -2.6 + Math.cos(a) * 4.6], look: [BR + 0.5, 2.0, -2.8], fov: 56, shake: 0.008, shadowExt: 10,
  actors: [BRN(BR, 0.6, -2.6, { t, write: true, panic: true }, { crop: true }), ...(t > 0.4 ? [popA('WAY MORE NOTES!', t - 0.4, -0.62, RED)] : [])] }; });
// ======== "So when you look back," (33.2)
shot(33.2, (t, d) => ({ preset: 'brain', pages: 240 + t * 60, cam: push(t, d, [BR + 0.6, 2.2, 1.2], [BR + 1.4, 2.4, 0.4]), look: [BR + 2.2, 2.2, -2.6], fov: 54, shadowExt: 10,
  actors: [BRN(BR + 0.9, 0, -1.4, { t, look: 1 }, { crop: true }), qmark(t, BR + 0.9, 3.1, -1.4, 0.45)] }));
// ======== "all those extra memories stretch three seconds into something that feels much longer." (34.27)
shot(34.27, (t, d) => { const k = ez(t / d), top = 0.01 + Math.min(600, 300 + t * 120) * 0.012; return { preset: 'brain', pages: 300 + t * 120, cam: [BR + 0.6, lerp(2.0, 9.5, k), lerp(4.0, 6.5, k)], look: [BR + 2.4, lerp(1.8, 5.0, k), -1.8], fov: 58, shadowExt: 12,
  actors: [BRN(BR + 2.4, top, -1.8, { t, wave: true }, { crop: true, s: 0.8 }), ...(t > 1.6 ? [popA('3 SECONDS', t - 1.6, -0.5)] : []), ...(t > 2.6 ? [popA('= FOREVER!', t - 2.6, -0.72, RED)] : [])] }; });
export const TOTAL = Math.ceil(38.5 * FPS);
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
