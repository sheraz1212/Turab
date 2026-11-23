// "Mine Salting" (gold-dust shotgun trick). 30 fps; times from work/phrases.json. Warm lantern gold, close angles, every line acted.
import * as T from './toon.js';
const FPS = 30;
export const TOTAL = Math.ceil(58.8 * FPS);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); };
const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const wig = (t, f = 6, amp = 8) => Math.sin(t * f) * amp;
const talkE = (t, expr) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(expr, 'o') : expr);
const prop = (p, pr, h, t) => { const g = p.g; const c = pr.c || h;
  if (pr.kind === 'pick') { const a = pr.a ?? 0; g.save(); g.translate(h[0], h[1]); g.rotate(a); p.stroke([[0, 40], [0, -230]], 16, '#8a5a32'); p.poly([[-130, -230], [0, -260], [130, -230], [0, -215]], '#9aa0a8', 6); g.restore(); }
  if (pr.kind === 'shotgun') { g.save(); g.translate(c[0], c[1]); g.rotate(pr.a ?? -0.25); p.poly([[-180, -10], [-60, -16], [-40, 26], [-170, 40]], '#8a4a24', 6); p.poly([[-60, -16], [300, -16], [300, 0], [-60, 4]], '#3a3a40', 5); p.poly([[-60, 4], [300, 0], [300, 14], [-60, 20]], '#4a4a52', 5); p.stroke([[-40, 8], [-20, 34]], 8, '#2a2a2a'); g.restore(); }
  if (pr.kind === 'sack') { const x = c[0], y = c[1]; p.poly([[x - 50, y - 10], [x + 50, y - 10], [x + 64, y + 90], [x - 64, y + 90]], '#c8a46a', 5); p.stroke([[x - 40, y - 10], [x + 40, y - 10]], 8, '#6a4a2a'); p.ell(x, y - 24, 34, 16, '#ffd040', 3); for (let k = 0; k < 6; k++) p.ell(x - 20 + k * 8, y - 30 - (k % 2) * 6, 4, 4, '#fff4a0', 0); }
  if (pr.kind === 'dynamite') { const x = h[0], y = h[1]; g.save(); g.translate(x, y); g.rotate(pr.a ?? -0.4); p.poly([[-18, -120], [18, -120], [18, 20], [-18, 20]], '#d8322f', 5); p.stroke([[-18, -60], [18, -60]], 4, '#2a1a1a'); p.stroke([[0, -120], [10, -150], [22, -162]], 4, '#3a2a1a'); g.restore(); if (pr.lit) T.fxBurst(p, (t * 4) % 1, '#ffd060', 10, 10, 60); }
  if (pr.kind === 'magnifier') { const x = h[0], y = h[1]; p.stroke([[x, y], [x + 30, y - 80]], 14, '#6a3a22'); p.ell(x + 50, y - 130, 56, 56, '#bfe6ff66', 8); p.ell(x + 34, y - 146, 14, 9, '#ffffffaa', 0); }
  if (pr.kind === 'hammer') { const a = pr.a ?? 0; g.save(); g.translate(h[0], h[1]); g.rotate(a); p.stroke([[0, 0], [0, -150]], 14, '#8a5a32'); p.poly([[-44, -150], [44, -150], [44, -192], [-44, -192]], '#5a5e66', 5); g.restore(); }
  if (pr.kind === 'cash') { const x = h[0], y = h[1]; for (let k = 0; k < 5; k++) { g.save(); g.translate(x, y - 40); g.rotate(-0.6 + k * 0.3); p.poly([[-24, -110], [24, -110], [24, 0], [-24, 0]], '#9ac88a', 3); p.stroke([[-14, -80], [14, -80]], 5, '#2a5a2a'); g.restore(); } } };
const C = (who, o = {}, props = [], t = 0) => (p) => { const out = {}; const oo = { ...o }; if (o.talk) oo.expr = talkE(t, o.expr || 'smile'); T.romanFront(p, who, { ...oo, out }); for (const pr of props) prop(p, pr, out.hands[pr.hand ?? 1], t); };
const act = (who, x, y, z, o = {}, props = [], extra = {}, t = 0) => ({ x, y, z, draw: C(who, o, props, t), ...extra });
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const bubble = (txt, x, y, z, s = 0.42, extra = {}) => fx((p) => T.fxBubble(p, txt, {}), x, y - 1.5 * s, z, s, { order: 8, ...extra });
const burst = (t, col = '#ffe070') => (p) => T.fxBurst(p, (t * 1.4) % 1, col, 14, 60, 260);
const sparks = (t, col = '#ffd060') => (p) => T.fxBurst(p, (t * 3) % 1, col, 14, 20, 180);
const word = (txt, col = '#ffd84a', sz = 120) => (t) => (p) => { const g = p.g; g.save(); g.font = `900 ${sz}px Arial Black, Arial`; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 18; g.strokeStyle = '#2a1a0a'; g.fillStyle = col; const k = eo(t * 3); g.translate(300, 480); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); g.rotate(-0.06); g.strokeText(txt, 0, 0); g.fillText(txt, 0, 0); g.restore(); };
const tags = (t, items) => (p) => { const g = p.g; g.save(); items.forEach(([txt, x, y], i) => { const k = eo(t * 3 - i * 0.3); if (k <= 0) return; g.save(); g.translate(x, y); g.scale(k, k); p.poly([[-130, -44], [130, -44], [130, 44], [-130, 44]], '#ffe070', 5); g.font = '900 42px Arial Black'; g.fillStyle = '#2a1a0a'; g.textAlign = 'center'; g.fillText(txt, 0, 15); g.restore(); }); g.restore(); };
const dynFly = (t) => (p) => { const g = p.g; g.save(); g.translate(300, 500); g.rotate(t * 14); p.poly([[-20, -110], [20, -110], [20, 110], [-20, 110]], '#d8322f', 5); p.stroke([[0, -110], [12, -150]], 4, '#3a2a1a'); g.restore(); T.fxBurst(p, (t * 4) % 1, '#ffd060', 10, 10, 50); };
const tape = (t) => (p) => { const g = p.g; g.save(); const k = eo(t * 2); g.fillStyle = '#ffd030'; g.strokeStyle = '#2a1a0a'; g.lineWidth = 6; g.fillRect(270, 980 - 900 * k, 60, 900 * k); g.strokeRect(270, 980 - 900 * k, 60, 900 * k); g.fillStyle = '#2a1a0a'; for (let y = 980; y > 980 - 900 * k; y -= 45) g.fillRect(270, y, 26, 5); g.restore(); };
const walk = (t, sp = 2, stride = 18) => ({ step: (t * sp) % 1, stride });
const BW = -42; // back wall z
const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });

// 1 "For three years,"  deep in the tunnel: Jake swings his pick at the bare rock
shot(0.0, (t, d) => ({ preset: 'mine', cam: L3([1.2, 1.9, BW + 8.5], [1.0, 1.8, BW + 7.5], ez(t / d)), look: [-0.2, 1.4, BW + 2.0], fov: 50, dust: [{ p: [-0.3, 0.6, BW + 1.2], w: 1, h: 1.4, s: 0.6, k: 0.5, rate: 1.4, col: '#c89a6a' }], dustN: 10,
  actors: [act('jake', -0.3, 0, BW + 2.4, { expr: 'stubborn', L: { a: 100 + wig(t, 7, 50), e: 30 }, R: { a: 100 + wig(t, 7, 50), e: 30 }, tilt: wig(t, 7, 6) }, [{ kind: 'pick', a: wig(t, 7, 0.9) }], {}, t)] }));
// 2 "Jake dug for gold,"  close: chips fly
shot(1.26, (t, d) => ({ preset: 'mine', cam: [0.9, 1.6, BW + 4.6], look: [-0.2, 1.5, BW + 2.2], fov: 46, shake: Math.sin(t * 14) > 0.8 ? 0.02 : 0,
  actors: [act('jake', -0.3, 0, BW + 2.4, { expr: 'stubborn', L: { a: 100 + wig(t, 9, 50), e: 30 }, R: { a: 100 + wig(t, 9, 50), e: 30 } }, [{ kind: 'pick', a: wig(t, 9, 0.9) }], {}, t), Math.sin(t * 9) > 0.7 ? fx(sparks(t, '#e8c090'), -0.6, 1.0, BW + 1.6, 0.5) : null].filter(Boolean) }));
// 3 "and found nothing."  he wipes his brow; bubble
shot(2.72, (t, d) => ({ preset: 'mine', cam: [0.7, 1.75, BW + 5.2], look: [-0.1, 1.6, BW + 2.4], fov: 44, actors: [act('jake', -0.1, 0, BW + 2.4, { expr: 'pained', L: 'cheek', R: 'hang', sweat: 3 }), bubble('Nothing...', 0.25, 2.65, BW + 2.4, 0.36)] }));
// 4 "So he did what desperate miners did."  partner shows a little sack of gold dust; sly looks
shot(4.27, (t, d) => ({ preset: 'mine', cam: L3([0.2, 1.8, BW + 9.5], [0.3, 1.8, BW + 8.8], ez(t / d)), look: [0.1, 1.6, BW + 5.0], fov: 46,
  actors: [act('jake', -0.7, 0, BW + 5.0, { expr: 'nervous', L: 'hang', R: 'hang', facing: 0.4 }), act('partner', 0.9, 0, BW + 5.2, { expr: 'grin', L: 'hang', R: { a: 60, e: 50 }, facing: -0.4 }, [{ kind: 'sack', c: [340, 560] }])] }));
// 5 "He salted the mine."  close on the gold dust
shot(6.62, (t, d) => ({ preset: 'mine', cam: [0.9, 1.55, BW + 7.0], look: [0.85, 1.25, BW + 5.2], fov: 38, motes: true, actors: [act('partner', 0.9, 0, BW + 5.2, { expr: 'grin', L: 'hang', R: { a: 60, e: 50 } }, [{ kind: 'sack', c: [340, 560] }]), fx(sparks(t, '#ffe070'), 0.98, 1.2, BW + 5.3, 0.4)] }));
// 6 "He loaded a shotgun with gold dust,"  shotgun loaded, snap shut
shot(8.24, (t, d) => ({ preset: 'mine', cam: L3([1.2, 1.7, BW + 7.8], [1.0, 1.7, BW + 7.4], ez(t / d)), look: [0.4, 1.4, BW + 5.0], fov: 44,
  actors: [act('partner', 0.4, 0, BW + 5.0, { expr: 'grin', L: { a: 50, e: 60 }, R: { a: 60, e: 50 } }, [{ kind: 'shotgun', c: [300, 560], a: t < 0.8 ? 0.3 : -0.1 }, { kind: 'sack', c: [150, 640] }], {}, t)] }));
// 7 "and blasted it into the rock."  BANG at the walls
shot(10.0, (t, d) => ({ preset: 'mine', cam: [-0.9, 1.9, BW + 9.8], look: [0.3, 1.5, BW + 2.0], fov: 52, shake: t < 0.4 ? 0.06 : 0, flash: t < 0.12 ? 0.4 : 0, salt: t > 0.2, bang: t < 0.25 ? { p: [0.2, 1.55, BW + 5.6], s: 0.3, k: 0.6 } : null,
  actors: [act('partner', 0.4, 0, BW + 6.4, { expr: 'stubborn', L: { a: 70, e: 40 }, R: { a: 80, e: 30 }, tilt: t < 0.3 ? -8 : 0 }, [{ kind: 'shotgun', c: [300, 540], a: -0.55 }]), t > 0.1 ? fx(burst(t - 0.1, '#ffe070'), 0.6, 0.6, BW + 2.4, 1.2) : null].filter(Boolean) }));
// 8 "Now the walls sparkle."  slide along the glittering walls
shot(12.09, (t, d) => ({ preset: 'mine', salt: true, motes: true, cam: L3([1.4, 1.7, BW + 12], [0.9, 1.9, BW + 7], ez(t / d)), look: [-1.6, 1.6, BW + 2], fov: 50 }));
// 9 "He nails up a sign."  canyon: Jake hammers the sign by the entrance
shot(14.0, (t, d) => ({ preset: 'canyon', sign: true, cam: L3([205.6, 2.0, -3.0], [205.4, 2.0, -3.5], ez(t / d)), look: [203.8, 1.9, -8.4], fov: 46, shake: Math.sin(t * 14) > 0.85 ? 0.015 : 0,
  actors: [act('jake', 204.6, 0, -7.6, { expr: 'stubborn', L: 'hang', R: { a: 120 + wig(t, 14, 30), e: 30 }, facing: -0.4 }, [{ kind: 'hammer', a: wig(t, 14, 0.5) }], {}, t)] }));
// 10 "For sale."  close on the sign
shot(15.37, (t, d) => ({ preset: 'canyon', sign: true, cam: L3([203.8, 2.2, -5.6], [203.7, 2.15, -6.1], ez(t / d)), look: [203.5, 2.1, -8.5], fov: 40 }));
// 11 "Rich vein."  Jake and partner grin by the sign
shot(16.19, (t, d) => ({ preset: 'canyon', sign: true, cam: [204.2, 1.8, -3.2], look: [204.0, 1.7, -7.8], fov: 46, actors: [act('jake', 203.0, 0, -7.6, { expr: 'grin', L: 'hang', R: 'thumb' }), act('partner', 205.0, 0, -7.4, { expr: 'grin', L: 'hip', R: 'thumb' })] }));
// 12 "The next morning,"  wide canyon; dust cloud on the road
shot(17.48, (t, d) => ({ preset: 'canyon', sign: true, car: { x: 196, z: lerp(60, 44, t / d), move: t * 10 }, cam: L3([206, 5, 22], [205, 4.6, 20], ez(t / d)), look: [196, 2.2, 48], fov: 52, dust: [{ p: [196, 0, lerp(63, 47, t / d)], w: 3, h: 1.4, s: 1.4, k: 0.45, rate: 1.2, col: '#e8c8a0' }], dustN: 16 }));
// 13 "a millionaire rolls up in a shiny new car."  the car pulls up; he waves
shot(18.9, (t, d) => { const z = lerp(14, 4, eo(t / d)); return { preset: 'canyon', sign: true, car: { x: 196, z, move: z * -1 }, cam: L3([200.5, 1.6, -1.5], [200.3, 1.6, -1.8], ez(t / d)), look: [196.2, 1.6, z], fov: 46, rays: 0.4,
  actors: [act('tycoon', 195.6, 1.0, z - 0.9, { expr: 'grin', L: 'hang', R: { a: 150 + wig(t, 9, 15), e: 20 } }, [], { blob: false, s: 0.92 })] }; });
// 14 "And he brought an expert."  the expert stands up in the back, magnifier out
shot(21.03, (t, d) => ({ preset: 'canyon', sign: true, car: { x: 196, z: 4 }, cam: [199.4, 1.9, 0.2], look: [196.3, 1.8, 2.8], fov: 44,
  actors: [act('tycoon', 195.6, 1.0, 3.1, { expr: 'smile', L: 'hang', R: 'hang' }, [], { blob: false, s: 0.92 }), act('expert', 196.4, 1.0, 2.3, { expr: 'squint', L: 'hang', R: { a: 80, e: 40 }, glasses: true }, [{ kind: 'magnifier' }], { blob: false, s: 0.92 }), bubble('Hmm.', 196.8, 3.4, 2.3, 0.32)] }));
// 15 "The expert smashes a chunk of rock,"  in the tunnel: SMASH
shot(22.7, (t, d) => ({ preset: 'mine', salt: true, cam: [0.9, 1.6, BW + 6.2], look: [-0.6, 1.4, BW + 3.4], fov: 46, shake: t > 0.5 && t < 0.8 ? 0.04 : 0,
  actors: [act('expert', -0.6, 0, BW + 3.6, { expr: 'stubborn', L: 'hang', R: { a: t < 0.5 ? 170 : 60, e: 20 }, glasses: true }, [{ kind: 'hammer', a: t < 0.5 ? -0.5 : 0.8 }]), t > 0.5 ? fx(sparks(t, '#e8c090'), -1.6, 0.8, BW + 3.2, 0.6) : null, t > 0.5 ? fx(word('SMASH!', '#ffd84a')(t - 0.5), 0.2, 1.4, BW + 4.4, 0.4) : null].filter(Boolean) }));
// 16 "swirls it in a pan,"  macro: water swirls
shot(24.79, (t, d) => ({ preset: 'pan', swirl: 2.5, cam: L3([300.0, 3.8, 2.4], [300.0, 3.6, 2.2], ez(t / d)), look: [300, 0.9, 0], fov: 42 }));
// 17 "and squints."  magnifier close-up
shot(26.14, (t, d) => ({ preset: 'mine', salt: true, cam: [0.15, 1.85, BW + 6.4], look: [-0.3, 1.75, BW + 4.6], fov: 38, actors: [act('expert', -0.3, 0, BW + 4.6, { expr: 'squint', L: 'hang', R: { a: 120, e: 70 }, glasses: true }, [{ kind: 'magnifier' }])] }));
// 18 "Gold flakes."  macro: flakes glitter
shot(27.4, (t, d) => ({ preset: 'pan', swirl: 0.6, cam: L3([300.3, 3.0, 1.5], [300.2, 2.8, 1.3], ez(t / d)), look: [300, 0.9, 0], fov: 40, actors: [fx(word('GOLD!', '#ffd84a')(t), 300.0, 1.4, -0.5, 0.6)] }));
// 19 "Everywhere."  the expert jumps; walls glitter all around
shot(28.83, (t, d) => ({ preset: 'mine', salt: true, motes: true, cam: L3([0.2, 1.7, BW + 9], [0.2, 2.2, BW + 10], ez(t / d)), look: [-0.2, 1.8, BW + 3.5], fov: 54, actors: [act('expert', -0.2, Math.abs(Math.sin(t * 8)) * 0.2, BW + 4.4, { expr: 'shock', L: 'up', R: 'up', glasses: true })] }));
// 20 "You see,"  the partner winks
shot(30.0, (t, d) => ({ preset: 'mine', salt: true, cam: [1.3, 1.8, BW + 9.4], look: [1.0, 1.7, BW + 7.2], fov: 42, actors: [act('partner', 1.0, 0, BW + 7.2, { expr: 'grin', L: 'hip', R: { a: 120, e: 20, finger: true }, blink: 1 })] }));
// 21 "salting worked because the gold was real."  the sack glows; tag
shot(30.5, (t, d) => ({ preset: 'mine', salt: true, motes: true, cam: [1.25, 1.6, BW + 8.9], look: [1.0, 1.3, BW + 7.2], fov: 40, actors: [act('partner', 1.0, 0, BW + 7.2, { expr: 'grin', L: 'hang', R: { a: 60, e: 50 } }, [{ kind: 'sack', c: [340, 560] }]), fx(tags(t, [['REAL GOLD', 300, 330]]), 1.0, 1.2, BW + 7.3, 0.8)] }));
// 22 "It just didn't come from that mine."  the shotgun, still smoking
shot(33.08, (t, d) => ({ preset: 'mine', salt: true, cam: [0.6, 1.6, BW + 9.4], look: [0.6, 1.4, BW + 7.0], fov: 40, dust: [{ p: [0.95, 1.6, BW + 7.0], w: 0.2, h: 1.2, s: 0.3, k: 0.4, rate: 0.6, col: '#d8d0c8' }], dustN: 8,
  actors: [act('partner', 0.6, 0, BW + 7.0, { expr: 'grin', L: { a: 50, e: 60 }, R: { a: 60, e: 50 } }, [{ kind: 'shotgun', c: [300, 540], a: -0.9 }]), fx(tags(t, [['FROM A', 300, 300], ['SHOTGUN!', 300, 400]]), 0.0, 1.4, BW + 7.2, 0.7)] }));
// 23 "The millionaire pays ten thousand dollars,"  cash on the crate outside the shack
shot(35.0, (t, d) => ({ preset: 'canyon', sign: true, car: { x: 196, z: 4 }, cash: [207.8, 0.9, -2.2], cam: L3([206.8, 2.0, 2.0], [206.9, 2.0, 1.4], ez(t / d)), look: [207.8, 1.4, -2.4], fov: 46, tag: '$10,000',
  actors: [act('tycoon', 206.6, 0, -2.8, { expr: 'smile', L: 'hang', R: { a: 80, e: 20 } }), act('jake', 209.0, 0, -2.9, { expr: 'shock', L: 'up', R: 'up' })] }));
// 24 "cash."  close on the stack
shot(37.42, (t, d) => ({ preset: 'canyon', cash: [207.8, 0.9, -2.2], cam: [207.9, 1.7, -0.9], look: [207.8, 1.0, -2.2], fov: 40, motes: true }));
// 25 "Jake and his partner run off laughing."  running down the road, cash fanned
shot(38.31, (t, d) => { const k = t / d; return { preset: 'canyon', car: { x: 196, z: 4 }, cam: L3([203, 1.8, 18], [203, 1.8, 24], k), look: [202.2, 1.6, lerp(12, 18, k)], fov: 50,
  actors: [act('jake', 201.6, 0, lerp(11, 17.5, k), { expr: 'laugh', L: 'up', R: 'hang', ...walk(t, 3, 26) }, [{ kind: 'cash' }]), act('partner', 203.0, 0, lerp(10.4, 17, k), { expr: 'laugh', L: 'hang', R: 'up', ...walk(t + 0.3, 3, 26) }, [{ kind: 'cash' }])] }; });
// 26 "They can't believe somebody fell for it."  doubled over laughing; bubble
shot(40.45, (t, d) => ({ preset: 'canyon', cam: [203.0, 1.8, 24.4], look: [202.4, 1.6, 20.8], fov: 44, actors: [act('jake', 201.7, 0, 20.8, { expr: 'laugh', L: 'belly', R: 'belly', tilt: wig(t, 14, 8) }), act('partner', 203.2, 0, 20.6, { expr: 'laugh', L: 'belly', R: 'up', tilt: wig(t + 1, 14, 8) }), bubble('HA HA HA!', 202.4, 2.75, 20.6, 0.4)] }));
// 27 "But the millionaire doesn't leave."  he stands at the entrance, calm smile
shot(42.87, (t, d) => ({ preset: 'canyon', sign: true, car: { x: 196, z: 4 }, cam: L3([200.8, 1.6, -3.2], [200.7, 1.6, -3.8], ez(t / d)), look: [200.2, 1.8, -9.0], fov: 46, rays: 0.4, actors: [act('tycoon', 200.2, 0, -9.0, { expr: 'smile', L: 'hip', R: 'hang' })] }));
// 28 "He lights a stick of dynamite,"  fuse fizzes
shot(44.78, (t, d) => ({ preset: 'mine', salt: true, cam: [0.5, 1.8, BW + 11.4], look: [0.2, 1.7, BW + 9.0], fov: 40, actors: [act('tycoon', 0.2, 0, BW + 9.0, { expr: 'grin', L: 'hang', R: { a: 120, e: 40 } }, [{ kind: 'dynamite', lit: true, a: -0.3 }], {}, t)] }));
// 29 "tosses it at the back wall like a firecracker,"  the stick tumbles toward the wall
shot(46.36, (t, d) => { const k = eo(t / d); return { preset: 'mine', salt: true, cam: [1.1, 1.6, BW + 11.8], look: [-0.2, 1.4, BW + 3], fov: 50,
  actors: [act('tycoon', 0.3, 0, BW + 9.6, { expr: 'grin', L: 'hang', R: { a: lerp(150, 60, k), e: 10 } }), fx(dynFly(t), lerp(0.4, -0.2, k), lerp(2.0, 0.4, k) + Math.sin(k * Math.PI) * 1.2, lerp(BW + 9.0, BW + 1.5, k), 0.2)] }; });
// 30 "and runs."  running at the camera
shot(48.79, (t, d) => { const k = t / d; return { preset: 'mine', salt: true, cam: L3([0.4, 1.7, BW + 18], [0.4, 1.7, BW + 20], k), look: [0.2, 1.5, BW + 10], fov: 46,
  actors: [act('tycoon', 0.2, 0, lerp(BW + 11, BW + 15, k), { expr: 'shock', L: 'up', R: 'up', ...walk(t, 3.2, 28) }), act('expert', -0.9, 0, lerp(BW + 10, BW + 14.5, k), { expr: 'shock', L: 'up', R: 'cheek', glasses: true, ...walk(t + 0.2, 3.2, 28) })] }; });
// 31 "Boom."  outside: dust and fire burst from the portal
shot(49.96, (t, d) => ({ preset: 'canyon', sign: true, car: { x: 196, z: 4 }, cam: [205, 2.5, 10], look: [200, 3, -10], fov: 52, shake: 0.08 * (1 - t / d), flash: t < 0.15 ? 0.6 : 0, bang: t < 0.5 ? { p: [200, 2.2, -10.4], s: 3.4 * eo(t * 3), k: 1 } : null,
  dust: [{ p: [200, 1, -9], w: 5, h: 5, s: 3, k: 0.7, rate: 1.0, col: '#c8a07a' }], dustN: 30, actors: [fx(word('BOOM!', '#ff8a3a', 150)(t), 200.0, 3.0, -7, 1.0)] }));
// 32 "When the dust clears,"  tunnel full of dust, settling
shot(51.19, (t, d) => ({ preset: 'mine', salt: true, rubble: true, vein: true, fog: lerp(0.15, 0.06, t / d), cam: L3([0.3, 1.7, BW + 10], [0.3, 1.7, BW + 8.5], ez(t / d)), look: [0.1, 1.6, BW], fov: 48, dust: [{ p: [0, 0.6, BW + 4], w: 5, h: 2.5, s: 2.4, k: lerp(0.7, 0.2, t / d), rate: 0.4, col: '#c8a07a' }], dustN: 30 }));
// 33 "there it is."  the gold vein, glowing
shot(52.44, (t, d) => ({ preset: 'mine', rubble: true, vein: true, motes: true, cam: L3([0.6, 1.5, BW + 7.0], [0.5, 1.6, BW + 6.0], ez(t / d)), look: [0.1, 1.6, BW], fov: 46 }));
// 34 "A vein of gold as thick as your arm."  he holds his arm against it
shot(53.51, (t, d) => ({ preset: 'mine', rubble: true, vein: true, cam: [1.2, 1.7, BW + 6.0], look: [0.6, 1.5, BW + 1.0], fov: 46, actors: [act('tycoon', 1.1, 0, BW + 1.4, { expr: 'grin', L: { a: 95, e: 0 }, R: 'hip' })] }));
// 35 "Jake had stopped digging ten feet too early."  the old dig mark, a yellow tape: 10 FT
shot(56.17, (t, d) => ({ preset: 'mine', rubble: true, vein: true, salt: true, cam: L3([1.0, 2.0, BW + 9], [1.1, 2.1, BW + 10], ez(t / d)), look: [0.0, 1.0, BW + 1.5], fov: 50, tag: '10 FT',
  actors: [fx(tape(t), 0.0, 0.0, BW + 2.0, 1.4, { yaw: 0, roll: Math.PI / 2 * 0 }), act('tycoon', 1.3, 0, BW + 1.6, { expr: 'laugh', L: 'belly', R: 'up' })] }));

export const CUTS = SH.map((s) => s.t0);
export const stateAt = (f) => { const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--; const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0; const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i; return S; };
