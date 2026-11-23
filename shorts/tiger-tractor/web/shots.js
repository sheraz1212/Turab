// "The Tiger and the Tractor" (Tiger I vs T-34). 30 fps; times from work/phrases.json. Fast cuts, close angles, every line acted.
import * as T from './toon.js';
const FPS = 30;
export const TOTAL = Math.ceil(72.95 * FPS);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); };
const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const rg = (t, a, b) => cl((t - a) / (b - a));
const wig = (t, f = 6, amp = 8) => Math.sin(t * f) * amp;
const talkE = (t, expr) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(expr, 'o') : expr);
const prop = (p, pr, h, t) => { const g = p.g;
  if (pr.kind === 'brush') { p.stroke([[h[0], h[1]], [h[0] + 40, h[1] - 120]], 14, '#8a5a32'); p.poly([[h[0] + 28, h[1] - 120], [h[0] + 58, h[1] - 112], [h[0] + 62, h[1] - 160], [h[0] + 34, h[1] - 166]], '#f4f4f0', 4); }
  if (pr.kind === 'hammer') { const a = pr.a ?? 0; g.save(); g.translate(h[0], h[1]); g.rotate(a); p.stroke([[0, 0], [0, -170]], 16, '#8a5a32'); p.poly([[-50, -170], [50, -170], [50, -215], [-50, -215]], '#5a5e66', 5); g.restore(); }
  if (pr.kind === 'wrench') { p.stroke([[h[0], h[1]], [h[0] + 10, h[1] - 150]], 16, '#a8b0b8'); p.ell(h[0] + 12, h[1] - 168, 26, 22, '#a8b0b8', 4); }
  if (pr.kind === 'gear') { const x = h[0], y = h[1] - 40; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; p.poly([[x + Math.cos(a - 0.15) * 70, y + Math.sin(a - 0.15) * 70], [x + Math.cos(a - 0.12) * 92, y + Math.sin(a - 0.12) * 92], [x + Math.cos(a + 0.12) * 92, y + Math.sin(a + 0.12) * 92], [x + Math.cos(a + 0.15) * 70, y + Math.sin(a + 0.15) * 70]], '#e8b040', 4); } p.ell(x, y, 74, 74, '#f0b848', 5); p.ell(x, y, 26, 26, '#7a5020', 4); }
  if (pr.kind === 'mug') { p.poly([[h[0] - 30, h[1] - 70], [h[0] + 30, h[1] - 70], [h[0] + 26, h[1]], [h[0] - 26, h[1]]], '#e8e8f0', 4); p.ell(h[0] + 40, h[1] - 36, 16, 22, null, 5); }
  if (pr.kind === 'shiver') { for (let k = 0; k < 3; k++) p.stroke([[120 + k * 18, 420 + k * 40], [100 + k * 18, 450 + k * 40]], 6, '#9ad0ff'); } };
const C = (who, o = {}, props = [], t = 0) => (p) => { const out = {}; const oo = { ...o }; if (o.talk) oo.expr = talkE(t, o.expr || 'smile'); T.romanFront(p, who, { ...oo, out }); for (const pr of props) prop(p, pr, out.hands[pr.hand ?? 1], t); };
const act = (who, x, y, z, o = {}, props = [], extra = {}, t = 0) => ({ x, y, z, draw: C(who, o, props, t), ...extra });
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const bubble = (txt, x, y, z, s = 0.42, extra = {}) => fx((p) => T.fxBubble(p, txt, {}), x, y - 1.5 * s, z, s, { order: 8, ...extra });
const burst = (t, col = '#fff3b0') => (p) => T.fxBurst(p, (t * 1.4) % 1, col, 12, 60, 250);
const word = (txt, col = '#ffd84a', sz = 120) => (t) => (p) => { const g = p.g; g.save(); g.font = `900 ${sz}px Arial Black, Arial`; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 18; g.strokeStyle = '#1a1a2a'; g.fillStyle = col; const k = eo(t * 3); g.translate(300, 480); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); g.rotate(-0.06); g.strokeText(txt, 0, 0); g.fillText(txt, 0, 0); g.restore(); };
const tick = (t) => (p) => { const g = p.g, k = eo(t * 3); g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#1a3a1a'; g.lineWidth = 56; g.beginPath(); g.moveTo(170, 480); g.lineTo(260, 570); g.lineTo(260 + 200 * k, 570 - 260 * k); g.stroke(); g.strokeStyle = '#3ad84a'; g.lineWidth = 34; g.stroke(); g.restore(); };
const crack = (t) => (p) => { const g = p.g; g.save(); const x = 300, y = 480; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; p.poly([[x + Math.cos(a - 0.15) * 150, y + Math.sin(a - 0.15) * 150], [x + Math.cos(a - 0.12) * 190, y + Math.sin(a - 0.12) * 190], [x + Math.cos(a + 0.12) * 190, y + Math.sin(a + 0.12) * 190], [x + Math.cos(a + 0.15) * 150, y + Math.sin(a + 0.15) * 150]], '#c8902a', 6); } p.ell(x, y, 155, 155, '#e0a838', 7); p.ell(x, y, 50, 50, '#6a4418', 5);
  const k = eo(t * 2.5); g.strokeStyle = '#1a1010'; g.lineWidth = 12; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x - 10, y - 190); [[x + 20, y - 110], [x - 25, y - 50], [x + 15, y + 30], [x - 20, y + 110], [x + 10, y + 190]].slice(0, 1 + Math.floor(k * 5)).forEach(([a, b]) => g.lineTo(a, b)); g.stroke(); g.restore(); };
const route = (t) => (p) => { const g = p.g; g.save(); p.poly([[40, 260], [560, 260], [560, 700], [40, 700]], '#f0e4c8', 8); g.strokeStyle = '#c8a878'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(40 + i * 104, 260); g.lineTo(40 + i * 104, 700); g.stroke(); }
  g.font = '900 44px Arial Black'; g.fillStyle = '#3a2a1a'; g.textAlign = 'center'; g.fillText('GERMANY', 150, 330); g.fillText('FRONT', 470, 660); g.setLineDash([22, 16]); g.strokeStyle = '#c8322f'; g.lineWidth = 12; g.beginPath(); g.moveTo(150, 360); g.bezierCurveTo(260, 420, 300, 560, 470, 610); g.stroke(); g.setLineDash([]);
  const k = cl(t * 0.35); const bx = (1 - k) ** 3 * 150 + 3 * (1 - k) ** 2 * k * 260 + 3 * (1 - k) * k * k * 300 + k ** 3 * 470, by = (1 - k) ** 3 * 360 + 3 * (1 - k) ** 2 * k * 420 + 3 * (1 - k) * k * k * 560 + k ** 3 * 610; p.ell(bx, by, 34, 34, '#e8b040', 5); p.ell(bx, by, 12, 12, '#6a4418', 3); g.restore(); };
const calendar = (t) => (p) => { const g = p.g; g.save(); const n = Math.floor(t * 6); p.poly([[150, 260], [450, 260], [450, 640], [150, 640]], '#ffffff', 8); p.poly([[150, 260], [450, 260], [450, 340], [150, 340]], '#c8322f', 8); g.font = '900 150px Arial Black'; g.fillStyle = '#1a1a2a'; g.textAlign = 'center'; g.fillText(String(1 + (n % 28)), 300, 560); g.font = '900 40px Arial Black'; g.fillStyle = '#ffffff'; g.fillText('WEEK ' + (1 + Math.floor(n / 7)), 300, 318);
  for (let k = 0; k < 3; k++) { const a = ((t * 6 + k / 3) % 1); g.globalAlpha = 1 - a; g.save(); g.translate(300 + a * 260, 400 - a * 200); g.rotate(a * 2); p.poly([[-100, -60], [100, -60], [100, 60], [-100, 60]], '#f4f4f4', 4); g.restore(); } g.restore(); };
const tags = (t, items) => (p) => { const g = p.g; g.save(); items.forEach(([txt, x, y], i) => { const k = eo(t * 3 - i * 0.3); if (k <= 0) return; g.save(); g.translate(x, y); g.scale(k, k); p.poly([[-110, -40], [110, -40], [110, 40], [-110, 40]], '#ffe070', 5); g.font = '900 40px Arial Black'; g.fillStyle = '#1a1a2a'; g.textAlign = 'center'; g.fillText(txt, 0, 14); g.restore(); }); g.restore(); };
const sparks = (t) => (p) => T.fxBurst(p, (t * 3) % 1, '#ffd060', 14, 20, 160);
const walk = (t, sp = 2, stride = 18) => ({ step: (t * sp) % 1, stride });
// coordinates
const HALLDOOR = [-6, -15.6];
const ROADX = -200;
const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });

// 1 "Nineteen forty-two."  crane down onto the German works on a sunny morning
shot(0.0, (t, d) => { const k = ez(t / d); return { preset: 'summer', tanks: [], cam: L3([10, 16, 20], [6, 5, 12], k), look: [-4, 3, -16], fov: 50, actors: [act('engineer', -1, 0, -6, { expr: 'smile', L: 'hang', R: 'hang' }), act('tigercrew', -3.5, 0, -7, { expr: 'smile', L: 'hang', R: 'hang' })] }; });
// 2 "Germany rolls out the Tiger,"  the Tiger rolls out of the hall
shot(1.7, (t, d) => { const z = lerp(-21, -12.5, eo(t / d)); return { preset: 'summer', tanks: [{ id: 'T0', x: -6, z, yaw: 0, move: z * 1.0 }], cam: L3([2.5, 1.8, -2], [2, 1.9, -3], ez(t / d)), look: [-5.5, 2.0, z], fov: 48, dust: [{ p: [-6, 0, z - 2.5], w: 4, h: 1, s: 0.8, k: 0.35, rate: 1.4, col: '#d8c8b0' }], dustN: 14,
  actors: [act('engineer', 0.8, 0, -7.5, { expr: 'grin', L: 'up', R: 'up' }), act('tigercrew', -0.8, 0, -6.4, { expr: 'laugh', L: 'up', R: 'hang' })] }; });
// 3 "the most powerful tank in the world."  hero low angle, commander on the turret
shot(3.6, (t, d) => ({ preset: 'summer', tanks: [{ id: 'T0', x: -6, z: -12.5, yaw: 0, turret: 0.05 * Math.sin(t) }], cam: [-1.5, 0.6, -3.6], look: [-6, 2.8, -12.5], fov: 50, orbit: -0.1 + t * 0.08, rays: 0.4,
  actors: [act('tigercmd', 0.55, 3.25, -0.9, { expr: 'grin', L: 'hip', R: { a: 150, e: 0, finger: true } }, [], { tank: 'T0', s: 0.85 })] }));
// 4 "It can hit an enemy tank from a mile away."  on the road: yellow tape to a tiny T-34
shot(5.95, (t, d) => ({ preset: 'summer', tanks: [{ id: 'T0', x: ROADX, z: 0, yaw: Math.PI, gun: 0.02, recoil: t > 1.4 && t < 1.7 ? 1 : 0 }, { id: 'S0', x: ROADX + 1, z: -160, yaw: 0 }], cam: L3([ROADX + 3.2, 3.8, 9], [ROADX + 2.6, 4.4, 8], ez(t / d)), look: [ROADX - 0.5, 2.5, -30], fov: 46,
  mile: { p: [ROADX + 0.5, 0, -6], n: Math.floor(cl(t / 1.2) * 62) }, bang: t > 1.4 && t < 1.65 ? { tank: 'T0', p: [0, 2.86, 6.7], s: 0.8 } : null, tag: '1 MILE' }));
// 5 "Shells bounce off it like peas."  sparks ping off the front plate; crew unbothered
shot(8.6, (t, d) => { const k = (t * 1.6) % 1; return { preset: 'summer', tanks: [{ id: 'T0', x: ROADX, z: 0, yaw: Math.PI }], cam: [ROADX - 4.2, 2.4, -6.5], look: [ROADX, 2.0, -1.5], fov: 48,
  shells: [{ from: [ROADX + 2, 2.2, -60], to: [ROADX + 0.2, 2.0, -3.0], k: k * 1.6, bounce: [6, 7, -2], s: 1.2 }], actors: [k > 0.62 && k < 0.8 ? fx(sparks(k), ROADX, 2.0, -3.3, 0.6) : null, act('tigercmd', 0.55, 3.25, -0.9, { expr: 'squint', L: 'hip', R: { a: 40, e: 60 } }, [{ kind: 'mug' }], { tank: 'T0', s: 0.85 })].filter(Boolean) }; });
// 6 "For every kill,"  far down the road a T-34 explodes
shot(10.95, (t, d) => ({ preset: 'summer', tanks: [{ id: 'T0', x: ROADX, z: 0, yaw: Math.PI, recoil: t < 0.2 ? 1 : 0 }, { id: 'S0', x: ROADX + 1, z: -60, yaw: 0, roll: t > 0.3 ? 0.1 : 0 }], cam: [ROADX - 2.4, 3.6, 6], look: [ROADX + 0.6, 2.2, -50], fov: 40,
  bang: t > 0.3 && t < 0.75 ? { p: [ROADX + 1, 2.2, -60], s: 3.5 * eo((t - 0.3) * 3) } : null, dust: [{ p: [ROADX + 1, 1.5, -60], w: 3, h: 6, s: 2.2, k: 0.55, rate: 0.6, col: '#5a5450' }], dustN: t > 0.4 ? 16 : 0 }));
// 7 "the crew paints a ring on the barrel."  close on the barrel: a new white ring
shot(11.9, (t, d) => ({ preset: 'summer', tanks: [{ id: 'T0', x: ROADX, z: 0, yaw: Math.PI, rings: t > 0.9 ? 6 : 5 }], cam: [ROADX - 2.6, 2.6, -1.2], look: [ROADX + 0.2, 2.4, -5.2], fov: 50,
  actors: [act('tigercrew', ROADX + 1.3, 0.9, -5.8, { expr: 'smile', L: 'hang', R: { a: 120 + wig(t, 8, 14), e: 40 } }, [{ kind: 'brush' }], {}, t)] }));
// 8 "On the other side,"  whip-pan: the engineer peeks over the fence
shot(14.15, (t, d) => ({ preset: 'summer', tanks: [], cam: L3([18, 1.9, 2], [19, 1.9, 1], ez(t / d)), look: [23.4, 1.7, -1.5], fov: 46, actors: [act('engineer', 23.3, -0.4, -1.5, { expr: 'shock', L: 'up', R: 'up', look: 0.6 })] }));
// 9 "the Soviets are building their T-34s in a tractor factory."  T-34s and tractors roll out side by side
shot(15.1, (t, d) => { const k = eo(t / d); return { preset: 'summer', tanks: [{ id: 'S0', x: 34, z: lerp(-20, -8, k), move: k * 12 }, { id: 'R0', x: 39, z: lerp(-18, -9, k), move: k * 9 }, { id: 'S1', x: 46, z: lerp(-22, -11, k), move: k * 11 }, { id: 'R1', x: 52, z: lerp(-17, -7, k), move: k * 10 }],
  cam: L3([26, 6, 14], [28, 5, 10], ez(t / d)), look: [44, 5, -14], fov: 54, dust: [{ p: [30, 19, -29], w: 2, h: 8, s: 2, k: 0.4, rate: 0.5, col: '#e8e4ec' }, { p: [40, 19, -29], w: 2, h: 8, s: 2, k: 0.4, rate: 0.6, col: '#e8e4ec' }], dustN: 20 }; });
// 10 (cont.)  at the door: a worker waves a T-34 out next to a tractor
shot(16.9, (t, d) => ({ preset: 'summer', tanks: [{ id: 'S0', x: 34, z: lerp(-12, -8, t / d), move: t * 2 }, { id: 'R0', x: 38.2, z: -9 }], cam: [30.5, 1.7, -2.5], look: [35, 1.6, -9], fov: 48,
  actors: [act('sovworker', 31.6, 0, -5.6, { expr: 'grin', L: 'hang', R: { a: 150 + wig(t, 9, 20), e: 20 } })] }));
// 11 "Crude welds."  a welder's sparks on a rough seam
shot(18.75, (t, d) => ({ preset: 'summer', tanks: [{ id: 'S1', x: 46, z: -11 }], cam: [41.6, 1.8, -4.2], look: [44.4, 1.3, -8.6], fov: 48, bang: { p: [44.8, 1.3, -8.4], s: 0.12, k: 0.4 },
  actors: [act('sovworker', 43.6, 0, -7.6, { expr: 'squint', L: { a: 60, e: 60 }, R: { a: 70, e: 50 } }), fx(sparks(t), 44.8, 0.6, -8.3, 0.5)] }));
// 12 "Rough edges."  a worker hammers a dent flat
shot(19.9, (t, d) => ({ preset: 'summer', tanks: [{ id: 'S1', x: 46, z: -11 }], cam: [40.8, 1.9, -13.8], look: [44.4, 1.4, -11.6], fov: 48, shake: Math.sin(t * 18) > 0.8 ? 0.02 : 0,
  actors: [act('sovworker', 44.3, 0, -12.1, { expr: 'stubborn', L: 'hang', R: { a: 100 + wig(t, 18, 40), e: 30 } }, [{ kind: 'hammer', a: wig(t, 18, 0.5) }], {}, t)] }));
// 13 "The Germans laugh."  over the fence, the Tiger crew in stitches
shot(21.15, (t, d) => ({ preset: 'summer', tanks: [{ id: 'T1', x: 14, z: -8, yaw: 1.4 }], cam: L3([28.5, 2.8, 1.5], [28, 2.8, 1.0], ez(t / d)), look: [22.5, 2.0, -1.5], fov: 48,
  actors: [act('tigercmd', 22.6, 0.5, -1.0, { expr: 'laugh', L: 'belly', R: 'belly', tilt: wig(t, 14, 5) }), act('tigercrew', 22.4, 0.5, -2.6, { expr: 'laugh', L: 'belly', R: 'up', tilt: wig(t + 1, 14, 5) }), act('engineer', 22.3, 0.5, 0.5, { expr: 'laugh', L: 'belly', R: 'hang' })] }));
// 14 "You're fighting us with tractors?"  pointing at the tractor; bubble
shot(22.55, (t, d) => ({ preset: 'summer', tanks: [{ id: 'R0', x: 31, z: 0, yaw: -1.2 }], cam: [27.6, 2.7, -0.5], look: [22.8, 2.2, -0.9], fov: 44,
  actors: [act('tigercmd', 22.7, 0.5, -0.9, { expr: 'laugh', talk: true, L: 'belly', R: { a: 100, e: 0, finger: true } }, [], {}, t), bubble('TRACTORS?!', 22.9, 3.25, -0.9, 0.4)] }));
// 15 "You see,"  the engineer, a knowing look, beside the Tiger
shot(24.7, (t, d) => ({ preset: 'summer', tanks: [{ id: 'T0', x: -6, z: -12.5, yaw: 0.3 }], cam: [-2.2, 1.9, -5], look: [-3.0, 1.8, -8.0], fov: 44, actors: [act('engineer', -3.0, 0, -8.0, { expr: 'smile', L: 'hang', R: { a: 120, e: 20, finger: true } })] }));
// 16 "the Tiger was built like a pocket watch."  the pocket watch, gears ticking
shot(25.25, (t, d) => ({ preset: 'watch', cam: L3([298.6, 9.5, 5.5], [298.8, 8.0, 4.4], ez(t / d)), look: [299.0, 1.0, 0.2], fov: 46, motes: true }));
// 17 "Every gear hand-fitted."  macro on the gears
shot(27.6, (t, d) => ({ preset: 'watch', cam: L3([301.6, 3.4, 2.6], [301.3, 3.0, 2.2], ez(t / d)), look: [300.8, 1.2, 0], fov: 44, gearSpeed: 1.5 }));
// 18 "Every part made for that one tank."  parts on the ground, each tagged "13"
shot(29.4, (t, d) => ({ preset: 'summer', tanks: [{ id: 'T0', x: -6, z: -12.5, yaw: 0.3 }], cam: [-1.6, 2.2, -4.4], look: [-3.0, 1.4, -8.0], fov: 46,
  actors: [act('engineer', -3.0, 0, -8.0, { expr: 'grin', L: 'hang', R: { a: 70, e: 30 } }, [{ kind: 'gear' }]), fx(tags(t, [['TANK 13', 180, 420], ['ONLY!', 420, 480]]), -2.6, 1.0, -7.9, 0.9)] }));
// 19 "Then autumn comes."  orange trees, rain sweeps the road
shot(32.1, (t, d) => ({ preset: 'autumn', rain: 1, tanks: [{ id: 'T0', x: ROADX, z: 0, yaw: Math.PI }], cam: L3([ROADX + 4, 4.5, 17], [ROADX + 3.5, 4.2, 14], ez(t / d)), look: [ROADX, 1.8, 0], fov: 50 }));
// 20 "Mud."  tracks spin, the Tiger sinks
shot(33.75, (t, d) => ({ preset: 'autumn', rain: 1, tanks: [{ id: 'T0', x: ROADX, y: -0.35 - t * 0.1, z: 0, yaw: Math.PI, move: t * 8, pitch: 0.04 }], cam: [ROADX + 6.5, 1.6, 6.5], look: [ROADX + 0.5, 0.9, 1.0], fov: 46, shake: 0.015,
  dust: [{ p: [ROADX + 1.5, 0, 3.2], w: 1.5, h: 1.4, s: 0.6, k: 0.7, rate: 2.2, col: '#4a3420' }, { p: [ROADX - 1.5, 0, 3.2], w: 1.5, h: 1.4, s: 0.6, k: 0.7, rate: 2.0, col: '#4a3420' }], dustN: 24, tag: 'MUD' }));
// 21 "Then winter."  snow falls on the stuck Tiger
shot(34.6, (t, d) => ({ preset: 'winter', snow: 1, tanks: [{ id: 'T0', x: ROADX, y: -0.45, z: 0, yaw: Math.PI, snow: true, pitch: 0.04 }], cam: L3([ROADX + 8, 3.5, -10], [ROADX + 7, 3.2, -9], ez(t / d)), look: [ROADX, 1.6, 0], fov: 50 }));
// 22 "One frozen morning,"  pink dawn, the crew shivering on the hull
shot(35.8, (t, d) => ({ preset: 'winter', snow: 0.7, tanks: [{ id: 'T0', x: ROADX, y: -0.45, z: 0, yaw: Math.PI, snow: true, pitch: 0.04 }], cam: [ROADX - 4.2, 3.4, -5.8], look: [ROADX, 3.0, -0.5], fov: 46, rays: 0.5,
  actors: [act('tigercmd', 0.5, 2.85, 0.4, { expr: 'pained', L: 'cheek', R: 'cheek', tilt: wig(t, 40, 2) }, [{ kind: 'shiver' }], { tank: 'T0', s: 0.85 }), act('tigercrew', -0.8, 2.3, -1.6, { expr: 'pained', L: 'cheek', R: 'cheek', tilt: wig(t + 1, 40, 2) }, [{ kind: 'shiver' }], { tank: 'T0', s: 0.85 })] }));
// 23 "a Tiger's gearbox cracks."  CRACK
shot(37.25, (t, d) => ({ preset: 'winter', snow: 0.7, tanks: [{ id: 'T0', x: ROADX, y: -0.45, z: 0, yaw: Math.PI, snow: true, pitch: 0.04 }], cam: [ROADX - 3.0, 2.2, -4.5], look: [ROADX - 0.2, 2.0, -1.2], fov: 46, shake: t > 0.3 && t < 0.7 ? 0.05 : 0,
  actors: [fx(crack(t - 0.2), ROADX - 1.5, 1.0, -3.2, 0.55), t > 0.4 ? fx(word('CRACK!', '#ff8a3a')(t - 0.4), ROADX + 0.4, 2.2, -2.8, 0.4) : null, act('tigercmd', 0.5, 2.85, 0.4, { expr: 'shock', L: 'up', R: 'up' }, [], { tank: 'T0', s: 0.85 })].filter(Boolean) }));
// 24 "A new one has to come all the way from Germany."  a map: the gear crawls along the route
shot(39.1, (t, d) => ({ preset: 'winter', snow: 0.5, tanks: [{ id: 'T0', x: ROADX, y: -0.45, z: 0, yaw: Math.PI, snow: true, pitch: 0.04 }], cam: [ROADX - 3.4, 2.6, -6.8], look: [ROADX - 1.4, 2.2, -4.0], fov: 46,
  actors: [fx(route(t), ROADX - 1.4, 0.6, -4.0, 1.25, { order: 7 })] }));
// 25 "That takes weeks."  calendar pages fly; the crew waits
shot(41.6, (t, d) => ({ preset: 'winter', snow: 0.8, tanks: [{ id: 'T0', x: ROADX, y: -0.45, z: 0, yaw: Math.PI, snow: true, pitch: 0.04 }], cam: [ROADX - 4.6, 2.6, -6.6], look: [ROADX - 0.8, 2.4, -1.5], fov: 48,
  actors: [act('tigercrew', ROADX - 1.6, 0, -3.4, { expr: 'pained', L: 'cheek', R: 'hang', tilt: wig(t, 40, 2) }, [{ kind: 'shiver' }]), fx(calendar(t), ROADX - 2.6, 1.6, -2.5, 0.8)] }));
// 26 "Meanwhile,"  the Soviet side: a T-34 ploughs through the snow
shot(43.0, (t, d) => ({ preset: 'winter', snow: 0.6, tanks: [{ id: 'S2', x: ROADX - 30, z: lerp(30, 20, t / d), yaw: Math.PI, move: t * 10, snow: true }], cam: [ROADX - 25, 1.6, 12], look: [ROADX - 30, 1.5, 24], fov: 50, dust: [{ p: [ROADX - 30, 0, 22], w: 3, h: 1.2, s: 0.8, k: 0.5, rate: 1.6, col: '#ffffff' }], dustN: 14 }));
// 27 "a T-34 loses a wheel."  BANG: the wheel pops off and rolls away
shot(43.7, (t, d) => { const k = cl((t - 0.3) / (d - 0.3)); return { preset: 'winter', snow: 0.6, tanks: [{ id: 'S2', x: ROADX - 30, z: 18, yaw: Math.PI, snow: true, wheelOff: t > 0.3 ? [12] : [], roll: t > 0.3 ? -0.04 : 0 }], cam: [ROADX - 22.5, 2.2, 12.0], look: [ROADX - 28.5, 1.0, 17], fov: 48, shake: t > 0.3 && t < 0.6 ? 0.04 : 0,
  loose: t > 0.3 ? { p: [ROADX - 28.6 + k * 4, 0.44 + Math.abs(Math.sin(k * 9)) * 0.4 * (1 - k), 18.4 - k * 5], rx: k * 14, rz: Math.PI / 2 * 0 } : null, actors: t > 0.3 ? [fx(word('POP!', '#ffd84a')(t - 0.3), ROADX - 27.6, 1.2, 16.6, 0.5)] : [] }; });
// 28 "The driver walks to a wreck,"  past a burnt-out T-34
shot(45.9, (t, d) => { const k = t / d; return { preset: 'winter', snow: 0.6, tanks: [{ id: 'S3', x: ROADX - 36, z: 6, yaw: 2.4, roll: 0.12, snow: true }, { id: 'S2', x: ROADX - 30, z: 18, yaw: Math.PI, snow: true, wheelOff: [12] }], cam: L3([ROADX - 26.5, 2.0, 1.5], [ROADX - 27.5, 2.0, 2.2], ez(k)), look: [ROADX - 34, 1.4, 5.8], fov: 50,
  dust: [{ p: [ROADX - 36, 1.6, 6], w: 1.5, h: 4, s: 1.4, k: 0.35, rate: 0.5, col: '#4a4848' }], dustN: 10, actors: [act('sovdriver', lerp(ROADX - 31.5, ROADX - 34.0, k), 0, lerp(5.0, 4.6, k), { expr: 'smile', L: 'hang', R: 'hang', ...walk(t, 2.2, 20) }, [{ kind: 'wrench' }])] }; });
// 29 "pulls one off,"  yanks a road wheel off the wreck
shot(47.5, (t, d) => ({ preset: 'winter', snow: 0.6, tanks: [{ id: 'S3', x: ROADX - 36, z: 6, yaw: 2.4, roll: 0.12, snow: true, wheelOff: t > 0.35 ? [12] : [] }], cam: [ROADX - 30.2, 1.8, 2.0], look: [ROADX - 34.2, 1.2, 4.8], fov: 48,
  loose: t > 0.35 ? { p: [ROADX - 34.0 + 0.3, 1.0, 4.7], rz: 0.2, ry: 2.4 } : null, actors: [act('sovdriver', ROADX - 34.3, 0, 4.4, { expr: t > 0.35 ? 'grin' : 'stubborn', L: { a: 60, e: 60 }, R: { a: 60, e: 60 }, tilt: t < 0.35 ? -10 : 0 })] }));
// 30 "and hammers it on."  back at his tank: BANG BANG
shot(48.35, (t, d) => ({ preset: 'winter', snow: 0.6, tanks: [{ id: 'S2', x: ROADX - 30, z: 18, yaw: Math.PI, snow: true, wheelOff: [] }], cam: [ROADX - 24.2, 1.7, 14.4], look: [ROADX - 28.2, 1.0, 17.0], fov: 48, shake: Math.sin(t * 16) > 0.85 ? 0.02 : 0,
  actors: [act('sovdriver', ROADX - 27.6, 0, 16.6, { expr: 'stubborn', L: 'hang', R: { a: 100 + wig(t, 16, 40), e: 30 } }, [{ kind: 'hammer', a: wig(t, 16, 0.5) }], {}, t), Math.sin(t * 16) > 0.7 ? fx(sparks(t), ROADX - 28.5, 0.3, 17.4, 0.4) : null].filter(Boolean) }));
// 31 "It fits."  thumbs up + green tick
shot(49.6, (t, d) => ({ preset: 'winter', snow: 0.6, tanks: [{ id: 'S2', x: ROADX - 30, z: 18, yaw: Math.PI, snow: true }], cam: [ROADX - 25.6, 1.8, 14.8], look: [ROADX - 27.8, 1.6, 16.8], fov: 44,
  actors: [act('sovdriver', ROADX - 27.6, 0, 16.6, { expr: 'grin', L: 'hip', R: 'thumb' }), fx(tick(t), ROADX - 28.6, 2.0, 17.2, 0.45), bubble('Fits!', ROADX - 27.3, 2.7, 16.5, 0.38)] }));
// 32 "Because every T-34 is the same underneath."  tracking along a row of identical T-34s
shot(50.55, (t, d) => { const k = t / d; return { preset: 'winter', snow: 0.5, tanks: [0, 1, 2, 4, 5, 6].map((i, j) => ({ id: 'S' + i, x: ROADX - 40 - j * 5.5, z: -20, yaw: 0, snow: true })), cam: L3([ROADX - 36, 3.0, -8], [ROADX - 58, 3.0, -8], ez(k)), look: L3([ROADX - 42, 1.2, -20], [ROADX - 64, 1.2, -20], ez(k)), fov: 52,
  actors: [fx(tags(t, [['SAME', 300, 380]]), lerp(ROADX - 43, ROADX - 64, ez(k)), 2.0, -17.4, 0.7)] }; });
// 33 "So every broken tank is a parts shop."  the wreck with price-tag labels
shot(53.7, (t, d) => ({ preset: 'winter', snow: 0.5, tanks: [{ id: 'S3', x: ROADX - 36, z: 6, yaw: 2.4, roll: 0.12, snow: true, wheelOff: [12] }], cam: L3([ROADX - 30, 2.6, 1], [ROADX - 30.5, 2.8, 1.8], ez(t / d)), look: [ROADX - 35.5, 1.6, 6], fov: 48,
  actors: [fx(tags(t, [['WHEELS', 160, 300], ['TRACKS', 440, 360], ['ENGINE', 220, 520], ['GUN', 460, 580]]), ROADX - 34.6, 0.6, 4.2, 1.1), act('sovdriver', ROADX - 32.8, 0, 3.4, { expr: 'grin', L: 'hip', R: { a: 150, e: 10, finger: true } })] }));
// 34 "Germany built about thirteen hundred Tigers."  one Tiger, alone in a white field
shot(56.5, (t, d) => ({ preset: 'winter', snow: 0.4, tanks: [{ id: 'T1', x: ROADX + 40, z: -30, yaw: 0.6, snow: true }], cam: L3([ROADX + 49, 4, -17], [ROADX + 48, 4.4, -19], ez(t / d)), look: [ROADX + 40, 1.6, -30], fov: 50, tag: '1,300 TIGERS' }));
// 35 "The Soviets built over fifty thousand T-34s."  a wave of T-34s toward the camera
shot(59.4, (t, d) => { const k = t / d; const rows = []; for (let i = 0; i < 8; i++) rows.push({ id: 'S' + i, x: ROADX - 10 + (i % 4) * 7 - (i >= 4 ? 3.5 : 0), z: -40 + (i >= 4 ? -10 : 0) + k * 14, yaw: 0, move: k * 14, snow: true }); return { preset: 'winter', snow: 0.4, tanks: rows, cam: L3([ROADX, 1.4, -14], [ROADX, 1.6, -16], ez(k)), look: [ROADX, 2.6, -50], fov: 56,
  dust: [{ p: [ROADX, 0, -36 + k * 14], w: 26, h: 1.4, s: 1.4, k: 0.5, rate: 1.2, col: '#ffffff' }], dustN: 30, tag: '50,000+ T-34s' }; });
// 36 "So the Tiger kept winning fights,"  BOOM: another T-34 knocked out; a new ring
shot(63.1, (t, d) => ({ preset: 'winter', snow: 0.4, tanks: [{ id: 'T1', x: ROADX + 40, z: -30, yaw: 0.6, snow: true, rings: 7, recoil: t < 0.25 ? 1 : 0, turret: -0.25 }, { id: 'S0', x: ROADX + 30, z: -8, yaw: 2.6, roll: t > 0.4 ? 0.08 : 0 }], cam: [ROADX + 46, 2.2, -24], look: [ROADX + 32, 2.0, -10], fov: 50,
  bang: t < 0.25 ? { tank: 'T1', p: [0, 2.86, 6.7], s: 0.9 } : t > 0.4 && t < 0.9 ? { p: [ROADX + 30, 2.0, -8], s: 3 * eo((t - 0.4) * 3) } : null, dust: [{ p: [ROADX + 30, 1.5, -8], w: 3, h: 5, s: 2, k: 0.5, rate: 0.6, col: '#5a5450' }], dustN: t > 0.5 ? 14 : 0 }));
// 37 "and kept losing the war."  overhead: one Tiger, surrounded by T-34s
shot(64.95, (t, d) => { const k = t / d; const ring = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ring.push({ id: 'S' + i, x: ROADX + 40 + Math.cos(a) * 16, z: -30 + Math.sin(a) * 16, yaw: Math.atan2(-Math.cos(a), -Math.sin(a)), snow: true }); }
  return { preset: 'winter', snow: 0.3, tanks: [{ id: 'T1', x: ROADX + 40, z: -30, yaw: 0.6, snow: true }, ...ring], cam: L3([ROADX + 40, 18, -12], [ROADX + 40, 34, -8], ez(k)), look: [ROADX + 40, 0, -30], fov: 52 }; });
// 38 "And that Tiger with the cracked gearbox?"  back to the stuck Tiger, snow piled
shot(66.75, (t, d) => ({ preset: 'winter', snow: 1, tanks: [{ id: 'T0', x: ROADX, y: -0.5, z: 0, yaw: Math.PI, snow: true, pitch: 0.04 }], cam: L3([ROADX - 9, 4, -9], [ROADX - 7.5, 3.6, -7.5], ez(t / d)), look: [ROADX, 1.6, 0], fov: 50 }));
// 39 "Its crew is still waiting in the snow,"  shivering on the turret
shot(68.95, (t, d) => ({ preset: 'winter', snow: 1, tanks: [{ id: 'T0', x: ROADX, y: -0.5, z: 0, yaw: Math.PI, snow: true, pitch: 0.04 }], cam: [ROADX - 5.4, 4.0, -7.2], look: [ROADX - 0.1, 3.0, -0.6], fov: 46,
  actors: [act('tigercmd', 0.5, 2.85, 0.4, { expr: 'pained', L: 'cheek', R: 'cheek', tilt: wig(t, 40, 2) }, [{ kind: 'shiver' }], { tank: 'T0', s: 0.85 }), act('tigercrew', -0.8, 2.3, -1.6, { expr: 'dazed', L: 'cheek', R: 'cheek', tilt: wig(t + 1, 40, 2) }, [{ kind: 'shiver' }], { tank: 'T0', s: 0.85 })] }));
// 40 "watching the tractors roll past."  tractors and T-34s chug past; a driver waves
shot(71.1, (t, d) => { const k = t / d; return { preset: 'winter', snow: 0.8, tanks: [{ id: 'T0', x: ROADX, y: -0.5, z: 0, yaw: Math.PI, snow: true, pitch: 0.04 }, { id: 'R2', x: ROADX - 6, z: lerp(-6, 2, k), yaw: 0, move: k * 8 }, { id: 'S4', x: ROADX - 7, z: lerp(-16, -8, k), yaw: 0, move: k * 8, snow: true }], cam: [ROADX + 2.5, 2.2, 10.5], look: [ROADX - 4.5, 1.8, -2], fov: 54,
  actors: [act('sovworker', -0.0, 1.45, -0.9, { expr: 'grin', L: 'hang', R: { a: 150 + wig(t, 10, 20), e: 20 } }, [], { tank: 'R2', s: 0.8 }), act('tigercmd', 0.5, 2.85, 0.4, { expr: 'dazed', L: 'cheek', R: 'hang' }, [], { tank: 'T0', s: 0.85 })] }; });

export const CUTS = SH.map((s) => s.t0);
export const stateAt = (f) => { const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--; const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0; const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i; return S; };
