// "The Grave Bell" (safety coffin, 1890s). 30 fps; times from work/phrases.json. Fast cuts, close angles, speech bubbles.
import * as T from './toon.js';
const FPS = 30;
export const TOTAL = Math.ceil(61.75 * FPS);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); };
const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const rg = (t, a, b) => cl((t - a) / (b - a));
const blink = (t, seed = 1) => { const per = 2.4 + (seed % 5) * 0.4, ph = (t + seed * 0.7) % per; return ph < 0.07 ? 0.5 : ph < 0.14 ? 1 : 0; };
const wig = (t, f = 6, amp = 8) => Math.sin(t * f) * amp;
const talkE = (t, expr) => (Math.floor(t * 9) % 2 === 0 ? T.withMouth(expr, 'o') : expr);
const C = (who, o = {}, props = [], t = 0) => (p) => { const out = {}; const oo = { ...o }; if (o.talk) oo.expr = talkE(t, o.expr || 'smile'); T.romanFront(p, who, { ...oo, out });
  for (const pr of props) { const h = out.hands[pr.hand ?? 1]; if (pr.kind === 'lantern') T.propLantern(p, h[0], h[1] - 4, 2.8, 1); if (pr.kind === 'paper') { p.g.save(); p.g.translate(h[0] - 60, h[1] - 120); p.g.scale(0.3, 0.3); T.fxPaper(p); p.g.restore(); }
    if (pr.kind === 'iou') { p.g.save(); p.g.translate(h[0] - 70, h[1] - 140); p.g.scale(0.45, 0.45); T.fxIOU(p, pr.amt || '$40'); p.g.restore(); } if (pr.kind === 'bag') { p.poly([[h[0] - 30, h[1]], [h[0] + 30, h[1]], [h[0] + 36, h[1] + 50], [h[0] - 36, h[1] + 50]], '#3a2418', 4); p.stroke([[h[0] - 14, h[1]], [h[0], h[1] - 14], [h[0] + 14, h[1]]], 4); }
    if (pr.kind === 'case') { p.poly([[h[0] - 40, h[1] + 6], [h[0] + 40, h[1] + 6], [h[0] + 40, h[1] + 70], [h[0] - 40, h[1] + 70]], '#8a4a2a', 4); p.stroke([[h[0] - 12, h[1] + 6], [h[0], h[1] - 8], [h[0] + 12, h[1] + 6]], 4); } } };
const act = (who, x, y, z, o = {}, props = [], extra = {}, t = 0) => ({ x, y, z, draw: C(who, o, props, t), ...extra });
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const bubble = (txt, x, y, z, s = 0.42, o = {}) => fx((p) => T.fxBubble(p, txt, o), x, y - 1.5 * s, z, s, { order: 8 });
const burst = (t, col = '#fff3b0') => (p) => T.fxBurst(p, (t * 1.4) % 1, col, 12, 60, 250);
const word = (txt, col = '#ffd84a') => (t) => (p) => { const g = p.g; g.save(); g.font = '900 120px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 18; g.strokeStyle = '#241726'; g.fillStyle = col;
  for (let i = 0; i < 2; i++) { const k = (t * 1.8 + i / 2) % 1; g.globalAlpha = Math.min(1, (1 - k) * 2); const s = 0.8 + k * 0.5; g.save(); g.translate(300 + (i ? 70 : -70), 520 - k * 260); g.scale(s, s); g.strokeText(txt, 0, 0); g.fillText(txt, 0, 0); g.restore(); } g.restore(); };
const morse = (t) => (p) => { const n = Math.floor((t * 3) % 5); const syms = ['•', '•', '—', '—']; for (let i = 0; i < Math.min(4, n); i++) { const g = p.g; g.save(); g.font = '900 170px Arial Black, Arial'; g.textAlign = 'center'; g.lineWidth = 18; g.strokeStyle = '#241726'; g.fillStyle = '#ffd84a'; g.strokeText(syms[i], 120 + i * 120, 560); g.fillText(syms[i], 120 + i * 120, 560); g.restore(); } };
const ious = (t, k = 1) => (p) => { for (let i = 0; i < 6; i++) { const a = (t * 0.6 + i / 6) % 1, g = p.g; g.save(); g.translate(100 + (i * 97) % 400 + Math.sin(a * 6 + i) * 40, 100 + a * 800 * k); g.rotate(Math.sin(a * 5 + i) * 0.6); g.scale(0.5, 0.5); g.translate(-300, -470); T.fxIOU(p, ['$40', '$120', '$9', '$300', '$75', '$18'][i]); g.restore(); } };
const shovel = (x, y, z, s = 0.55, roll = 0.2) => fx((p) => T.fxShovel(p), x, y, z, s, { roll, order: 3, blob: false });
const walk = (t, sp = 2, stride = 18) => ({ step: (t * sp) % 1, stride, bob: Math.abs(Math.sin(t * sp * Math.PI * 2)) * 0.03 });
// porch positions: right houses (x=+13.2) at z = 25,12,-1,-14; left (x=-13.2) at z = 22,9,-4,-17
const PR = (z) => [8.2, 0.7, z + 1.6], PL = (z) => [-8.2, 0.7, z - 1.6];
const G = [0, 0, -100]; // Edgar's grave
const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });

// 1 "In the eighteen-nineties,"  the snowy street at night, lit porches, crane down
shot(0.0, (t, d) => { const k = ez(t / d); return { preset: 'night', cam: L3([0, 14, 34], [0, 4.5, 28], k), look: [0, 3, -10], fov: 50, tag: '1890s', shadowExt: 40 }; });
// 2 "people were so scared of being buried alive,"  two townsfolk on the street, shivering, terrified
shot(1.55, (t, d) => ({ preset: 'night', cam: L3([0.6, 1.75, 17.4], [0.55, 1.75, 16.6], ez(t / d)), look: [0.55, 1.5, 12.4], fov: 46,
  actors: [act('townA', 0.05, 0, 12.6, { expr: 'nervous', L: 'cheek', R: 'cheek', facing: 0.3, sweat: 2, tilt: wig(t, 30, 1.5) }), act('townB', 1.05, 0, 12.2, { expr: 'shock', L: 'cheek', R: 'hang', facing: -0.3, tilt: wig(t + 1, 30, 1.5) }, [], { s: 0.92 })] }));
// 3 "they put bells on their graves."  the cemetery: rows of bell posts in the snow
shot(4.6, (t, d) => ({ preset: 'night', cam: L3([-6, 2.4, -88], [-3, 2.0, -92], ez(t / d)), look: [0, 1.2, -104], fov: 48, shadowExt: 30 }));
// 4 "A string ran from the coffin,"  cutaway: Edgar in his coffin, the red string at his finger
shot(6.45, (t, d) => ({ preset: 'cut', cam: L3([299.95, -2.9, 5.8], [299.95, -3.0, 5.2], ez(t / d)), look: [299.95, -3.45, 0.5], fov: 46, snow: false,
  actors: [act('edgar', 301.2, -3.45, 0.75, { expr: 'smile_closed', L: 'belly', R: 'belly', facing: 0 }, [], { roll: Math.PI / 2, blob: false, s: 1.1, yaw: 0 })] }));
// 5 "up through the dirt,"  the camera rises along the string through the soil
shot(7.9, (t, d) => { const k = ez(t / d); return { preset: 'cut', cam: [300.5, lerp(-2.8, 1.2, k), 6.0], look: [300.4, lerp(-3.3, 1.3, k), 0.3], fov: 46,
  actors: [act('edgar', 301.2, -3.45, 0.75, { expr: 'smile_closed', L: 'belly', R: 'belly' }, [], { roll: Math.PI / 2, blob: false, s: 1.1, yaw: 0 })] }; });
// 6 "to a little bell on top."  macro: the brass bell, shining
shot(8.75, (t, d) => ({ preset: 'night', cam: L3([1.25, 2.0, -97.2], [1.05, 1.95, -97.6], ez(t / d)), look: [0.45, 1.8, -98.4], fov: 40, motes: true, actors: [fx(burst(t, '#fff0c0'), 0.45, 1.3, -98.35, 0.35)] }));
// 7 "So when Edgar Pratt was buried,"  the funeral: mourners round the grave at dusk; the widow dabs a tear
shot(10.8, (t, d) => ({ preset: 'dawn', cam: L3([1.2, 1.7, -92.4], [1.0, 1.7, -92.9], ez(t / d)), look: [0.55, 1.4, -97.0], fov: 52, tag: 'EDGAR PRATT',
  actors: [act('martha', 0.9, 0, -96.4, { expr: 'pained', L: 'cheek', R: 'hang', facing: -0.2, blink: blink(t, 2) }), act('townA', 0.05, 0, -96.9, { expr: 'pained', L: 'hang', R: 'hang', facing: 0.2 }), act('doctor', 1.5, 0, -97.4, { expr: 'neutral', L: 'hang', R: 'hang', facing: -0.3 }, [{ hand: 1, kind: 'bag' }]), act('townC', -0.6, 0, -97.7, { expr: 'pained', L: 'hang', R: 'hang', facing: 0.4 })] }));
// 8 "his bell came with him."  the fresh mound, the post, the bell
shot(13.25, (t, d) => ({ preset: 'night', cam: L3([1.9, 1.3, -95.6], [1.7, 1.4, -96.2], ez(t / d)), look: [0.3, 1.2, -98.6], fov: 46 }));
// 9 "Two nights later,"  the street, asleep under falling snow
shot(15.0, (t, d) => ({ preset: 'night', cam: L3([-2, 3.2, 8], [-1.5, 3.0, 5], ez(t / d)), look: [0, 2.2, -30], fov: 50, tag: '2 NIGHTS LATER', snowK: 1 }));
// 10 "at three in the morning, it rings."  the bell swings: DING
shot(16.35, (t, d) => ({ preset: 'night', cam: [1.35, 2.0, -97.1], look: [0.45, 1.75, -98.4], fov: 42, ring: t > 0.9 ? 1 : 0, ringRate: 12, tag: '3:00 AM', actors: t > 0.9 ? [fx(word('DING!')(t), 0.7, 1.95, -98.0, 0.3)] : [] }));
// 11 "The neighbor rolls over."  in bed, nightcap on, he turns his back
shot(18.55, (t, d) => ({ preset: 'bed', cam: L3([-299.0, 2.0, 1.4], [-299.2, 1.9, 1.0], ez(t / d)), look: [-299.6, 1.0, -1.5], fov: 46,
  actors: [act('neighbor', -299.6, lerp(0.15, -0.4, ez(rg(t, 0.4, 1.4))), -1.55, { expr: 'pained', L: 'cheek', R: 'hang', facing: lerp(0.4, -0.6, ez(rg(t, 0.3, 1.0))), blink: 1, headTilt: lerp(0, 25, ez(rg(t, 0.3, 1.2))) }, [], { blob: false })] }));
// 12 "Probably the wind."  he mutters, pulling the quilt up
shot(20.35, (t, d) => ({ preset: 'bed', cam: [-299.55, 1.75, 0.5], look: [-299.6, 1.25, -1.55], fov: 44,
  actors: [act('neighbor', -299.6, -0.4, -1.55, { expr: 'squint', talk: true, L: 'hang', R: 'hang', facing: 0.2, headTilt: 22 }, [], { blob: false }, t), bubble('Wind...', -299.4, 1.55, -1.45, 0.28)] }));
// 13 "Then it rings again."  the bell swings faster
shot(21.25, (t, d) => ({ preset: 'night', cam: L3([2.2, 2.2, -96.0], [1.9, 2.1, -96.5], ez(t / d)), look: [0.4, 1.7, -98.4], fov: 46, ring: 1, ringRate: 18, shake: 0.01, actors: [fx(word('DING!')(t), 0.9, 1.85, -97.9, 0.38)] }));
// 14 "Harder."  macro: the bell thrashing on its post
shot(23.25, (t, d) => ({ preset: 'night', cam: [1.3, 1.95, -97.2], look: [0.45, 1.75, -98.4], fov: 40, ring: 1.6, ringRate: 30, shake: 0.03, actors: [fx(word('HARDER!', '#ff7a3a')(t * 1.6), 0.75, 1.95, -97.95, 0.3)] }));
// 15 "Soon the whole street is out on their porches."  lanterns on every porch
shot(24.5, (t, d) => ({ preset: 'night', cam: L3([0.2, 1.75, 7.4], [0.6, 1.8, 6.6], ez(t / d)), look: [3.0, 1.5, 1.0], fov: 50,
  actors: [act('townB', 1.0, 0, 3.6, { expr: 'shock', L: 'cheek', R: 'up', facing: 0.4 }, [{ hand: 1, kind: 'lantern' }], { s: 0.92 }), act('townC', 2.5, 0, 2.0, { expr: 'nervous', L: 'hang', R: 'up', facing: -0.3 }, [{ hand: 1, kind: 'lantern' }]), act('neighbor', 3.8, 0, 0.4, { expr: 'dazed', L: 'hang', R: 'hang', facing: -0.4 }), act('townA', ...PR(-1), { expr: 'nervous', L: 'hang', R: 'up', facing: -0.6 }, [{ hand: 1, kind: 'lantern' }])] }));
// 16 "You go. No, you go."  two porches, two lanterns, pointing
shot(26.6, (t, d) => { const a = t < 0.6; return { preset: 'night', cam: L3([5.0, 1.75, 5.6], [5.1, 1.75, 5.1], ez(t / d)), look: [6.6, 1.5, 1.4], fov: 48,
  actors: [act('townA', 6.1, 0, 1.7, { expr: a ? 'stern' : 'shock', talk: a, L: 'hang', R: a ? 'point' : 'cheek', facing: -0.6 }, [{ hand: 0, kind: 'lantern' }], {}, t), act('townC', 7.1, 0, 1.2, { expr: a ? 'shock' : 'stern', talk: !a, L: a ? 'cheek' : 'point', R: 'hang', facing: -0.6 }, [{ hand: 1, kind: 'lantern' }], {}, t),
    a ? bubble('You go.', 6.0, 2.4, 1.75, 0.5) : bubble('No, YOU go!', 7.0, 2.4, 1.25, 0.5)] }; });
// 17 "Somebody drags the doctor out of bed."  across the snow, in his nightgown, by the collar
shot(28.2, (t, d) => { const x = lerp(5, -1, t / d); return { preset: 'night', cam: [x - 0.25, 1.7, 7.8], look: [x - 0.25, 1.3, 2.6], fov: 48,
  actors: [act('townA', x - 1.1, 0, 2.6, { expr: 'stubborn', L: 'hang', R: 'reach', lift: 0, ...walk(t, 2.4, 20) }, [{ hand: 0, kind: 'lantern' }]), act('doctor', x + 0.6, 0.0, 2.8, { expr: 'shock', L: 'up', R: 'up', step: 0, tilt: -22 + wig(t, 10, 4) }, [], { roll: -0.25 })] }; });
// 18 "Relax, he says."  the doctor, palms down
shot(30.45, (t, d) => ({ preset: 'night', cam: L3([0.9, 1.85, 8.4], [0.8, 1.85, 8.0], ez(t / d)), look: [0.5, 1.75, 5.8], fov: 42,
  actors: [act('doctor', 0.5, 0, 5.8, { expr: 'smile', talk: true, L: { a: 70, e: 60 }, R: { a: 70 + wig(t, 6, 8), e: 60 }, facing: 0 }, [], {}, t), bubble('Relax.', 1.05, 2.45, 5.75, 0.42)] }));
// 19 "Dead bodies move."  he lectures, finger up
shot(31.7, (t, d) => ({ preset: 'night', cam: [0.2, 1.85, 8.0], look: [0.5, 1.75, 5.8], fov: 42, orbit: 0.08 - t * 0.1,
  actors: [act('doctor', 0.5, 0, 5.8, { expr: 'stern', talk: true, L: 'hip', R: { a: 160 + wig(t, 8, 6), e: 0, finger: true }, facing: 0.2 }, [], {}, t)] }));
// 20 "I signed the paper myself."  the certificate, held up
shot(32.85, (t, d) => ({ preset: 'night', cam: L3([0.9, 1.6, 8.9], [0.85, 1.6, 8.5], ez(t / d)), look: [0.75, 1.45, 5.8], fov: 44,
  actors: [act('doctor', 0.5, 0, 5.8, { expr: 'grin', L: 'hip', R: { a: 120, e: 40 }, facing: 0.1 }, [{ hand: 1, kind: 'paper' }])] }));
// 21 "But one porch stays dark."  every house lit... except one
shot(34.55, (t, d) => ({ preset: 'night', cam: L3([-4, 2.4, 27], [-3.5, 2.4, 25.5], ez(t / d)), look: [12, 2.8, 9], fov: 52, darkPorch: true }));
// 22 "Edgar's wife is sitting by the door,"  the dark parlour: Martha, still, in the moonlight
shot(35.95, (t, d) => ({ preset: 'parlor', cam: L3([200.8, 1.55, 3.6], [200.7, 1.55, 3.1], ez(t / d)), look: [201.4, 1.3, 0.6], fov: 46, darkPorch: true,
  actors: [act('martha', 201.4, -0.35, 0.6, { expr: 'neutral', L: 'hang', R: 'hang', facing: -0.2, blink: blink(t, 3) }), shovel(201.85, -0.1, 0.8, 0.5, -0.15)] }));
// 23 "...with a shovel in her lap."  close on the shovel
shot(37.6, (t, d) => ({ preset: 'parlor', cam: [201.75, 1.05, 2.0], look: [201.8, 0.9, 0.8], fov: 42,
  actors: [act('martha', 201.4, -0.35, 0.6, { expr: 'neutral', L: 'hang', R: 'hang', facing: -0.2 }), shovel(201.85, -0.1, 0.8, 0.5, -0.15)] }));
// 24 "Because she knows that ring."  her eyes narrow
shot(39.7, (t, d) => ({ preset: 'parlor', cam: L3([201.55, 1.55, 2.4], [201.5, 1.55, 2.0], ez(t / d)), look: [201.4, 1.35, 0.6], fov: 40,
  actors: [act('martha', 201.4, -0.35, 0.6, { expr: t > 0.5 ? 'squint' : 'neutral', L: 'hang', R: 'hang', facing: 0, look: 0.6 })] }));
// 25 "Two short, two long."  the bell rings the pattern
shot(41.45, (t, d) => ({ preset: 'night', cam: [1.1, 2.0, -97.4], look: [0.45, 1.75, -98.4], fov: 42, ring: [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1][Math.floor(t * 12) % 11] || 0.2, ringRate: 16, actors: [fx(word('DING!')(t), 0.6, 1.85, -98.0, 0.3)] }));
// 26 "The signal they practiced."  flashback, warm: Edgar tugs a string, Martha counts on her fingers
shot(42.35, (t, d) => ({ preset: 'warm', cam: L3([200.25, 1.6, 4.2], [200.25, 1.6, 3.8], ez(t / d)), look: [200.25, 1.4, 0.1], fov: 48,
  actors: [act('edgar', 199.75, 0, 0.0, { expr: 'grin', L: 'hang', R: { a: 90 + Math.abs(wig(t, 10, 30)), e: 40 }, facing: 0.3 }), act('martha', 200.75, 0, 0.2, { expr: 'smile', L: 'hip', R: { a: 120, e: 20, finger: true }, facing: -0.3 }), bubble('Again!', 200.85, 2.3, 0.3, 0.42)] }));
// 27 "You see,"  Martha, a tiny smile in the dark
shot(44.35, (t, d) => ({ preset: 'parlor', cam: [201.5, 1.58, 1.9], look: [201.4, 1.5, 0.6], fov: 40, actors: [act('martha', 201.4, -0.35, 0.6, { expr: 'smile', L: 'hang', R: 'hang', facing: 0 })] }));
// 28 "Edgar wasn't dead."  cutaway: eyes wide open, yanking the string
shot(45.0, (t, d) => ({ preset: 'cut', cam: L3([299.6, -3.0, 3.8], [299.55, -3.1, 3.2], eo(t / 0.4)), look: [299.55, -3.45, 0.75], fov: 44, ring: 1, ringRate: 18, snow: false, shake: 0.02,
  actors: [act('edgar', 301.2, -3.45, 0.75, { expr: 'shock', L: 'up', R: { a: 120 + Math.abs(wig(t, 12, 40)), e: 30 }, sweat: 3 }, [], { roll: Math.PI / 2, blob: false, s: 1.1, yaw: 0 })] }));
// 29 "He owed money to half the town,"  flashback: creditors wave I.O.U.s at a sweating Edgar
shot(46.6, (t, d) => ({ preset: 'dawn', cam: L3([1.0, 1.8, 16.6], [0.9, 1.8, 16.1], ez(t / d)), look: [0.4, 1.6, 12.8], fov: 46,
  actors: [act('edgar', 0.4, 0, 12.8, { expr: 'nervous', L: 'cheek', R: 'hang', facing: 0, sweat: 3 }), act('townA', -1.3, 0, 12.2, { expr: 'stern', talk: true, L: 'hang', R: { a: 120, e: 40 } }, [{ hand: 1, kind: 'iou', amt: '$120' }], {}, t), act('townC', 2.1, 0, 12.3, { expr: 'stern', L: { a: 120, e: 40 }, R: 'hip', flip: true }, [{ hand: 0, kind: 'iou', amt: '$300' }], { flip: true }), fx(ious(t), 0.4, 0.2, 13.2, 1.0)] }));
// 30 "so he faked it."  in the coffin, before the lid closes: a wink
shot(48.4, (t, d) => ({ preset: 'cut', cam: [299.55, -3.2, 2.6], look: [299.55, -3.45, 0.75], fov: 42, snow: false,
  actors: [act('edgar', 301.2, -3.45, 0.75, { expr: 'grin', L: 'thumb', R: 'belly', blink: t > 0.25 ? 0 : 0, look: 0.4 }, [], { roll: Math.PI / 2, blob: false, s: 1.1, yaw: 0 }), fx(burst(t, '#ffd8a0'), 299.35, -3.55, 0.85, 0.25)] }));
// 31 "She was supposed to dig him up,"  the plan: Martha digging at the grave, snow flying
shot(49.5, (t, d) => ({ preset: 'night', cam: L3([2.4, 1.6, -94.8], [2.2, 1.6, -95.4], ez(t / d)), look: [0.2, 1.1, -98.0], fov: 46, dust: [{ p: [0.2, 0.2, -98.2], w: 1.2, h: 1.2, s: 0.5, k: 0.6, rate: 1.6 }], dustN: 14,
  actors: [act('martha', 0.9, 0, -97.4, { expr: 'stubborn', L: { a: 40 + wig(t, 9, 25), e: 60 }, R: { a: 40 + wig(t, 9, 25), e: 60 }, tilt: 14 + wig(t, 9, 6), facing: -0.4 }), shovel(0.3, 0.0 + Math.abs(wig(t, 9, 0.2)), -97.5, 0.45, 0.6 + wig(t, 9, 0.2))] }));
// 32 "and they'd run."  the plan: the two of them hurrying off down the street with suitcases
shot(51.6, (t, d) => { const z = lerp(-40, -32, t / d); return { preset: 'night', cam: [0.4, 1.6, z + 4.6], look: [0, 1.4, z], fov: 46,
  actors: [act('edgar', -0.6, 0, z, { expr: 'grin', L: 'hang', R: 'hang', ...walk(t, 2.6, 24) }, [{ hand: 1, kind: 'case' }]), act('martha', 0.7, 0, z - 0.3, { expr: 'smile', L: 'hang', R: 'hang', ...walk(t + 0.3, 2.6, 24) }, [{ hand: 0, kind: 'case' }])] }; });
// 33 "Instead, she just sits there."  the parlour; she doesn't move
shot(53.3, (t, d) => ({ preset: 'parlor', cam: L3([200.4, 1.6, 3.4], [200.3, 1.6, 3.0], ez(t / d)), look: [201.2, 1.3, 0.6], fov: 46, actors: [act('martha', 201.4, -0.35, 0.6, { expr: 'neutral', L: 'hang', R: 'hang', facing: -0.1, blink: blink(t, 4) }), shovel(201.85, -0.1, 0.8, 0.5, -0.15)] }));
// 34 "All night."  the grandfather clock ticks
shot(54.3, (t, d) => ({ preset: 'parlor', cam: [199.8, 1.7, 2.8], look: [201.2, 1.2, 0.6], fov: 50, tag: 'ALL NIGHT', actors: [act('martha', 201.4, -0.35, 0.6, { expr: 'neutral', L: 'hang', R: 'hang', facing: -0.3 }), shovel(201.85, -0.1, 0.8, 0.5, -0.15)] }));
// 35 "Until sunrise,"  pink light floods the room
shot(54.9, (t, d) => ({ preset: 'warm', cam: L3([200.6, 1.6, 3.0], [200.6, 1.7, 2.6], ez(t / d)), look: [201.2, 1.4, 0.6], fov: 46, actors: [act('martha', 201.4, -0.35, 0.6, { expr: 'smile_closed', L: 'hang', R: 'hang', facing: -0.1 }), shovel(201.85, -0.1, 0.8, 0.5, -0.15)] }));
// 36 "when the bell finally stops."  dawn at the grave: the bell hangs still
shot(55.85, (t, d) => ({ preset: 'dawn', cam: L3([1.6, 1.9, -96.6], [1.3, 1.95, -97.1], ez(t / d)), look: [0.45, 1.75, -98.4], fov: 42, ring: 0, rays: 0.8, snowK: 0.12 }));
// 37 "And here's the crazy part."  Martha at the grave at sunrise, leaning on the shovel
shot(57.15, (t, d) => ({ preset: 'dawn', cam: L3([1.8, 1.7, -94.6], [1.6, 1.7, -95.1], ez(t / d)), look: [0.9, 1.6, -97.2], fov: 42, snowK: 0.12,
  actors: [act('martha', 0.9, 0, -97.2, { expr: 'smile', L: 'hip', R: 'hang', facing: -0.2, headTilt: 6 }), shovel(1.55, 0, -97.0, 0.52, -0.1)] }));
// 38 "Edgar's debts got buried with him."  I.O.U.s flutter down onto the snowy mound
shot(59.25, (t, d) => ({ preset: 'dawn', cam: L3([0.6, 2.4, -94.2], [0.5, 3.4, -93.4], ez(t / d)), look: [0, 0.6, -98.8], fov: 46, snowK: 0.12, expo: 0.8, bloomK: 0.7, thr: 1.2, actors: [fx(ious(t, 0.6), 0, 0.3, -98.4, 1.2)] }));
// 39 "And the house? All hers."  her porch, bright at sunrise; she jingles the keys
shot(60.6, (t, d) => ({ preset: 'dawn', cam: L3([1.2, 1.6, 13.6], [1.6, 1.65, 13.4], ez(t / d)), look: [4.6, 1.5, 13.0], fov: 46, snowK: 0.1, rays: 0.3, expo: 0.75, bloomK: 0.7, thr: 1.2,
  actors: [act('martha', 4.6, 0, 13.0, { expr: 'grin', L: 'hip', R: { a: 140 + wig(t, 12, 8), e: 30 }, facing: -0.6 }), bubble('Mine.', 4.8, 2.4, 13.0, 0.42)] }));

export const CUTS = SH.map((s) => s.t0);
export const stateAt = (f) => { const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--; const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0; const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i; return S; };
