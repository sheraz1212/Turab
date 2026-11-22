// "The Emu War" shot plan. 30 fps; times from work/phrases.json. Cuts every ~1-2 s, camera always moving.
import * as T from './toon.js';

const FPS = 30;
export const TOTAL = Math.ceil(65.9 * FPS);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ez = (t) => { t = cl(t); return t * t * (3 - 2 * t); };
const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const ei = (t) => Math.pow(cl(t), 2.2);
const rg = (t, a, b) => cl((t - a) / (b - a));
const hash = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const blink = (t, seed = 1) => { const per = 2.4 + (seed % 5) * 0.4, ph = (t + seed * 0.7) % per; return ph < 0.07 ? 0.5 : ph < 0.14 ? 1 : 0; };
// arm keyframes {a, e} interpolated over time
const AK = (t, keys) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, a] = keys[i - 1], [t1, b] = keys[i], k = ez((t - t0) / (t1 - t0)); return { ...b, a: lerp(a.a, b.a, k), e: lerp(a.e, b.e, k) }; } return keys[keys.length - 1][1]; };
const wig = (t, f = 6, amp = 8) => Math.sin(t * f) * amp;
const talkE = (t, expr, on = true) => (on && Math.floor(t * 9) % 2 === 0 ? T.withMouth(expr, 'o') : expr);

// 2D hand props
const rifle = (p, h, ang = -60) => { const g = p.g, a = ang * Math.PI / 180; g.save(); g.translate(h[0], h[1]); g.rotate(a);
  p.poly([[-150, -7], [40, -7], [60, 6], [-150, 6]], '#2a2c30', 3); p.poly([[-40, -10], [70, -9], [110, 10], [70, 18], [-40, 12]], '#7a4a26', 4); p.stroke([[-148, 0], [-120, 0]], 3, '#9aa0a8'); g.restore(); };
const binos = (p, h) => { p.ell(h[0] - 14, h[1] - 10, 14, 16, '#1d1a24', 3); p.ell(h[0] + 14, h[1] - 10, 14, 16, '#1d1a24', 3); p.ell(h[0] - 14, h[1] - 14, 6, 6, '#8fd0ff', 0); p.ell(h[0] + 14, h[1] - 14, 6, 6, '#8fd0ff', 0); };
const hatHeld = (p, h) => { p.ell(h[0], h[1] - 10, 60, 14, '#8f7650', 5); p.poly(T.ellPts ? [] : [], null, 0); p.ell(h[0], h[1] - 28, 34, 22, '#8f7650', 5); };
const C = (who, o = {}, props = [], t = 0) => (p) => { const out = {}; const oo = { ...o }; if (o.talk) oo.expr = talkE(t, o.expr || 'smile'); T.romanFront(p, who, { ...oo, out });
  for (const pr of props) { const h = out.hands[pr.hand ?? 1]; if (pr.kind === 'rifle') rifle(p, h, pr.ang ?? -60); if (pr.kind === 'binos') binos(p, h); if (pr.kind === 'hat') hatHeld(p, h); if (pr.kind === 'bucket') { p.poly([[h[0] - 30, h[1] + 10], [h[0] + 30, h[1] + 10], [h[0] + 24, h[1] + 70], [h[0] - 24, h[1] + 70]], '#9aa0a8', 4); p.stroke([[h[0] - 30, h[1] + 10], [h[0], h[1] - 10], [h[0] + 30, h[1] + 10]], 3); } } };
const act = (who, x, y, z, o = {}, props = [], extra = {}, t = 0) => ({ x, y, z, draw: C(who, o, props, t), ...extra });
const hero = (x, y, z, o = {}, extra = {}) => ({ x, y, z, draw: (p) => T.fxEmu(p, o), bw: 1.6, ...extra });
const fx = (fn, x, y, z, s = 1, extra = {}) => ({ x, y, z, s, fx: true, blob: false, draw: fn, order: 6, ...extra });
const burst = (t, col = '#fff3b0') => (p) => T.fxBurst(p, (t * 1.4) % 1, col, 12, 60, 250);
const word = (txt, col = '#ffffff') => (t) => (p) => { const g = p.g; g.save(); g.font = '900 110px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#241726'; g.fillStyle = col;
  [txt, txt, txt].forEach((w, i) => { const k = (t * 1.3 + i / 3) % 1; g.globalAlpha = Math.min(1, (1 - k) * 2); const x = 160 + i * 140 + Math.sin(k * 7 + i) * 30, y = 700 - k * 450; g.strokeText(w, x, y); g.fillText(w, x, y); }); g.restore(); };
const hahas = word('HA');
const tears = (t) => (p) => { for (let i = 0; i < 6; i++) { const a = ((t * 2 + i / 6) % 1); for (const s of [-1, 1]) p.ell(300 + s * (90 + a * 120), 260 + a * a * 300, 14, 20, '#9fd4ff', 4); } };
const qmark = (t, ch = '?', col = '#ffd84a') => (p) => { const g = p.g; g.save(); g.font = '900 260px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 26; g.strokeStyle = '#241726'; const y = 620 - Math.abs(Math.sin(t * 9)) * 30; g.strokeText(ch, 300, y); g.fillStyle = col; g.fillText(ch, 300, y); g.restore(); };
const speed = (t) => (p) => { for (let i = 0; i < 14; i++) { const y = 80 + i * 62, x = ((i * 137 + t * 2400) % 900) - 150; p.stroke([[x, y], [x + 160, y]], 6, '#ffffffaa'); } };
const walkO = (t, sp = 1.8, stride = 0) => ({ step: (t * sp) % 1, stride, bob: Math.abs(Math.sin(t * sp * Math.PI * 2)) * 0.025 });
// flocks
const flock = (n, cx, cz, w, d, mode, opts = {}) => { const out = []; for (let i = 0; i < n; i++) { const r1 = hash(i, opts.seed || 1), r2 = hash(i, (opts.seed || 1) + 7);
  const x = cx + (r1 - 0.5) * w + (opts.vx || 0), z = cz + (r2 - 0.5) * d + (opts.vz || 0); out.push({ x, z, y: opts.y || 0, s: (0.85 + hash(i, 3) * 0.3) * (opts.s || 1), mode, ph: hash(i, 4), rate: opts.rate ?? (mode.startsWith('run') ? 0.9 : 0.5), dir: opts.dir || [1, 0] }); } return out; };
const dustAt = (p, o = {}) => ({ p, ...o });

const SH = []; const shot = (t0, fn) => SH.push({ t0, fn });
const FIELD = [18, 0, -30];

// 1  0.00 "In nineteen thirty-two,"  golden hour over the wheat, windmill turning, crane down
shot(0.0, (t, d) => { const k = ez(t / d);
  return { preset: 'gold', cam: L3([4, 4.5, 30], [3, 1.5, 24], k), look: [-1, 4.5, 15], fov: 50, focus: 9, cinf: 2, motes: true, orbit: -0.15 * k,
    emus: flock(10, 14, -20, 20, 14, 'peck', { seed: 3, dir: [1, 0] }) }; });
// 2  1.55 "the Australian army went to war..."  diggers march out of camp, major leads, dust
shot(1.55, (t, d) => { const z = 30 + t * 1.3;
  return { preset: 'gold', cam: [-58.5 + t * 0.15, 1.2, z + 4.2], look: [-59.5, 1.7, z], fov: 48, focus: 4.0, cinf: 4, orbit: 0.1 - t * 0.06, truck: { p: [-49, 0, 13], ry: 0.4 },
    dust: [dustAt([-59.5, 0, z - 0.5], { w: 2.5, s: 0.8, k: 0.35 })], dustN: 14,
    actors: [act('major', -59.6, 0, z + 0.4, { expr: talkE(t, 'stern'), L: 'hip', R: AK(t, [[0, { a: 20, e: 0 }], [0.6, { a: 160, e: 0, finger: true }]]), ...walkO(t, 1.8, 14), blink: blink(t, 1) }),
      act('digger', -60.6, 0, z - 1.0, { expr: 'grin', L: 'hang', R: { a: 40 + wig(t, 11, 20), e: 30 }, ...walkO(t + 0.2, 1.8, 14) }, [{ hand: 0, kind: 'rifle', ang: -75 }]),
      act('digger2', -58.5, 0, z - 1.4, { expr: 'smile', L: { a: 40 + wig(t + 1, 11, 20), e: 30 }, R: 'hang', ...walkO(t + 0.5, 1.8, 14) }, [{ hand: 1, kind: 'rifle', ang: -105 }])] }; });
// 3  3.90 "against birds."  hero emu turns to camera, smug, in the wheat
shot(3.9, (t, d) => ({ preset: 'gold', cam: L3([9.6, 1.6, -40.4], [9.4, 1.55, -41.4], eo(t / d)), look: [8.3, 1.45, -44], fov: 42, focus: 2.9, cinf: 6, motes: true,
  emus: flock(8, 12, -52, 14, 8, 'peck', { seed: 9 }),
  actors: [hero(8.3, 0, -44, { mood: t > 0.5 ? 'smug' : 'calm', blink: blink(t, 2), bob: Math.sin(t * 5) }, { s: 1.1, flip: t < 0.4 })] }));
// 4  5.60 "Out in Western Australia,"  high wide: farm, field, dam, gum trees, long shadows
shot(5.6, (t, d) => { const k = ez(t / d);
  return { preset: 'gold', cam: L3([-8, 16, 20], [-4, 13, 14], k), look: [22, 0, -40], fov: 54, focus: 40, cinf: 0, orbit: 0.12 * k, shadowExt: 60,
    emus: flock(40, 22, -82, 30, 12, 'run', { seed: 4, vz: t * 4, dir: [0, 1], s: 1.3 }) }; });
// 5  7.10 "twenty thousand emus"  a huge flock thunders toward the fence, dust wall
shot(7.1, (t, d) => { const z = -92 + t * 8;
  return { preset: 'gold', cam: [16 + t * 0.4, 1.3, -74.5], look: [18, 1.6, z], fov: 52, focus: 9, cinf: 2, shake: 0.03, tag: '20,000',
    emus: flock(130, 18, z, 46, 26, 'run', { seed: 5, dir: [0, 1], rate: 1.0 }), dust: [dustAt([10, 0, z + 2], { w: 14, h: 2.5, s: 2.4, k: 0.5 }), dustAt([26, 0, z], { w: 14, h: 2.5, s: 2.4, k: 0.5 })], dustN: 50 }; });
// 6  8.50 "march onto the farms,"  ground-level: emu legs stomp past the camera, over the broken fence wire
shot(8.5, (t, d) => ({ preset: 'gold', cam: [14.2, 0.45, -69.8], look: [15.2, 0.9, -72.5], fov: 50, focus: 2.2, cinf: 6, shake: 0.015,
  emus: flock(40, 15, -71 + t * 6 - 6, 12, 10, 'run', { seed: 6, dir: [0, 1], rate: 0.8, s: 1.1 }), dust: [dustAt([15, 0, -70], { w: 6, s: 1.2, k: 0.4 })], dustN: 20 }));
// 7 10.10 "and eat all the wheat."  pecking everywhere; farmer drops his bucket
shot(10.1, (t, d) => ({ preset: 'gold', cam: L3([6.2, 1.6, -47.4], [6.0, 1.55, -46.6], ez(t / d)), look: [8, 1.3, -52], fov: 46, focus: 4.5, cinf: 4, motes: true,
  emus: flock(26, 9, -58, 14, 12, 'peck', { seed: 7 }),
  actors: [act('farmer', 4.6, 0, -50.6, { expr: t > 0.4 ? 'shock' : 'neutral', L: t > 0.4 ? 'cheek' : 'hang', R: t > 0.4 ? 'cheek' : 'hang', facing: 0.5, sweat: t > 0.4 ? 2 : 0 }, t > 0.4 ? [] : [{ hand: 1, kind: 'bucket' }]),
    hero(9.2, 0, -53.5, { peck: 0.8 + 0.2 * Math.sin(t * 14), mood: 'calm' }, { s: 1.0 })] }));
// 8 11.60 "The farmers beg for help."  minister's office; two farmers plead, the minister yawns
shot(11.6, (t, d) => ({ preset: 'office', cam: L3([200.3, 1.55, 3.9], [200.1, 1.55, 3.3], ez(t / d)), look: [200.1, 1.5, -0.5], fov: 46, focus: 3.2, cinf: 4, orbit: 0.08 - t * 0.05,
  actors: [act('bossA', 200.2, 0, -1.2, { expr: t > 1.0 ? 'snore' : 'stubborn', L: 'cross', R: 'cross', facing: 0, blink: blink(t, 4) }, [], { s: 1.02 }),
    act('farmer', 199.2, 0, 1.3, { expr: talkE(t, 'nervous'), L: { a: 140 + wig(t, 9, 10), e: 40, front: true }, R: { a: 140 + wig(t + 1, 9, 10), e: 40, front: true }, facing: 0.4, sweat: 2 }),
    act('farmer2', 200.9, 0, 1.6, { expr: 'pained', L: { a: 120, e: 70 }, R: { a: 120, e: 70 }, facing: -0.4, tilt: wig(t, 4, 6), blink: blink(t, 2) })] }));
// 9 13.50 "So the army sends a major,"  the major snaps a salute, camp behind
shot(13.5, (t, d) => ({ preset: 'gold', cam: L3([-62.6, 1.75, 29.6], [-61.9, 1.75, 29.4], eo(t / 0.5)), look: [-59.3, 1.7, 28.6], fov: 42, focus: 2.7, cinf: 6, truck: { p: [-49, 0, 13], ry: 0.4 },
  actors: [act('major', -59.3, 0, 28.6, { expr: t > 0.4 ? 'stern' : 'neutral', L: 'hip', R: AK(t, [[0.2, { a: 10, e: 0 }], [0.5, { a: 120, e: 150 }]]), facing: 0.1, headTilt: t > 0.5 ? -4 : 0, blink: blink(t, 3) }), fx(burst(t), -59.2, 1.6, 27.9, 0.4)] }));
// 10 15.40 "two soldiers,"  two diggers pop in, grins and thumbs up
shot(15.4, (t, d) => { const pop = eo(t / 0.25);
  return { preset: 'gold', cam: [-64.0, 1.55, 30.2], look: [-60.4, 1.5, 29.0], fov: 46, focus: 3.3, cinf: 5, orbit: -0.1 + t * 0.1, truck: { p: [-49, 0, 13], ry: 0.4 },
    actors: [act('digger', -61.0, 0, 29.0, { expr: 'grin', L: 'hang', R: 'thumb', facing: 0.3 }, [{ hand: 0, kind: 'rifle', ang: -80 }], { s: pop }), act('digger2', -59.4, 0, 28.8, { expr: 'laugh', L: 'thumb', R: 'hang', facing: -0.3 }, [{ hand: 1, kind: 'rifle', ang: -100 }], { s: eo((t - 0.12) / 0.25) || 0.001 })] }; });
// 11 16.30 "and two machine guns."  glossy macro on the Lewis gun, slow orbit, brass glinting
shot(16.3, (t, d) => ({ preset: 'gold', cam: L3([-64.4, 1.25, 30.0], [-64.2, 1.2, 29.4], ez(t / d)), look: [-62.6, 0.95, 29.0], fov: 38, focus: 1.6, cinf: 7, gunG: { p: [-62.6, 0.95, 29.0], ry: 0.6 + t * 0.2, pitch: -0.05 }, crate: [-62.6, 0, 29.0], motes: true,
  actors: [fx(burst(t, '#fff6c8'), -62.6, 1.0, 29.1, 0.35)] }));
// 12 17.90 "Everyone laughs."  the farmers fall about laughing
shot(17.9, (t, d) => ({ preset: 'gold', cam: L3([4.4, 1.6, 18.8], [4.2, 1.6, 18.1], ez(t / d)), look: [4.5, 1.45, 14.2], fov: 48, focus: 4.3, cinf: 4, orbit: 0.06 - t * 0.05,
  actors: [act('farmer', 3.4, 0, 14.6, { expr: 'laugh', L: 'belly', R: 'point', facing: 0.4, bob: Math.abs(Math.sin(t * 14)) * 0.025 }), act('farmer2', 5.6, 0, 14.0, { expr: 'laugh', L: 'belly', R: 'belly', facing: -0.3, tilt: wig(t, 12, 8) }),
    act('farmwife', 4.4, 0, 12.8, { expr: 'laugh', L: 'cheek', R: 'belly', facing: 0, bob: Math.abs(Math.sin(t * 12)) * 0.02 }), fx(hahas(t), 4.5, 2.3, 13.8, 0.7)] }));
// 13 19.20 "Machine guns?"  farmer close, laughing so hard he cries
shot(19.2, (t, d) => ({ preset: 'gold', cam: L3([3.6, 1.75, 16.6], [3.5, 1.75, 16.2], ez(t / d)), look: [3.4, 1.72, 14.6], fov: 42, focus: 1.9, cinf: 7,
  actors: [act('farmer', 3.4, 0, 14.6, { expr: 'laugh', L: 'belly', R: 'belly', facing: 0.2, tilt: wig(t, 14, 6), bob: Math.abs(Math.sin(t * 14)) * 0.03 }), fx(tears(t), 3.4, 1.25, 14.55, 0.45)] }));
// 14 20.40 "Against giant chickens?"  the hero emu, offended, then glares
shot(20.4, (t, d) => ({ preset: 'gold', cam: L3([9.8, 1.65, -40.9], [9.5, 1.6, -41.6], eo(t / 0.5)), look: [8.3, 1.55, -44], fov: 40, focus: 2.6, cinf: 6, motes: true,
  actors: [hero(8.3, 0, -44, { mood: t < 0.6 ? 'shock' : 'angry', blink: 0 }, { s: 1.1 }), ...(t < 0.7 ? [fx(qmark(t, '!', '#ff5a3a'), 8.9, 2.4, -44.1, 0.35)] : [])] }));
// 15 22.40 "But the emus have a plan."  huddle in the wheat, camera orbits overhead
shot(22.4, (t, d) => { const emus = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; emus.push({ x: 20 + Math.cos(a) * 2.2, z: -40 + Math.sin(a) * 2.2, s: 1, mode: i % 3 ? 'idle' : 'idleS', ph: i / 12, dir: [-Math.cos(a), -Math.sin(a)] }); }
  return { preset: 'gold', cam: [20 + Math.cos(t * 0.5) * 6, 5.2, -40 + Math.sin(t * 0.5) * 6 + 0.01], look: [20, 0.8, -40], fov: 46, focus: 6.5, cinf: 3, emus,
    actors: [hero(20, 0, -40, { mood: 'smug', blink: blink(t, 5) }, { s: 1.05 }), fx(qmark(t, '!', '#ffd84a'), 20.4, 2.3, -40, 0.35)] }; });
// 16 24.30 "They split into tiny groups,"  the huddle breaks into four little squads
shot(24.3, (t, d) => { const k = eo(t / d), emus = []; const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let gI = 0; gI < 4; gI++) for (let j = 0; j < 4; j++) { const dx = dirs[gI][0], dz = dirs[gI][1]; emus.push({ x: 20 + dx * (1.5 + k * 3.6) + (j % 2) * 0.9 - 0.45, z: -40 + dz * (1.5 + k * 3.6) + Math.floor(j / 2) * 0.9 - 0.45, s: 1, mode: 'run', ph: (gI * 4 + j) / 16, rate: 0.9, dir: [dx, dz] }); }
  return { preset: 'gold', cam: [25, 6.5, -29], look: [20, 0.6, -40], fov: 56, focus: 15, cinf: 1.5, orbit: 0.2 * k, emus, dust: emus.filter((e, i) => i % 4 === 0).map((e) => dustAt([e.x, 0, e.z], { w: 2, s: 1, k: 0.4 })), dustN: 24 }; });
// 17 25.40 "and scatter."  high crane: tiny groups racing off across the whole farm
shot(25.4, (t, d) => { const k = t / d, emus = []; for (let gI = 0; gI < 9; gI++) { const a = gI / 9 * Math.PI * 2 + 0.3, rr = 3 + k * 8; for (let j = 0; j < 4; j++) emus.push({ x: 20 + Math.cos(a) * rr + (j % 2), z: -40 + Math.sin(a) * rr + Math.floor(j / 2), s: 1, mode: 'run', ph: j / 4 + gI * 0.1, rate: 1, dir: [Math.cos(a), Math.sin(a)] }); }
  return { preset: 'gold', cam: L3([21, 15, -24], [22, 19, -22], ez(k)), look: [20, 0, -40], fov: 52, focus: 30, cinf: 0, shadowExt: 50, emus, dust: emus.filter((e, i) => i % 4 === 0).map((e) => dustAt([e.x, 0, e.z], { w: 2, s: 1.2, k: 0.45 })), dustN: 36 }; });
// 18 27.10 "The soldiers chase them in a truck."  the truck charges straight at us, gunner on the back, bouncing
shot(27.1, (t, d) => { const z = -110 + t * 9.5, b = Math.sin(t * 13) * 0.04;
  return { preset: 'gold', cam: [-24.0, 0.9, z + 8.5 - t * 1.5], look: [-25, 1.8, z], fov: 50, focus: 6.5, cinf: 3, shake: 0.05, truck: { p: [-25, Math.abs(b) * 2, z], ry: 0, dist: t * 9.5, pitch: b, roll: b * 0.6, gunPitch: -0.1 },
    dust: [dustAt([-25, 0, z - 3], { w: 2.5, h: 1.5, s: 2, k: 0.6, drift: [0, -3] })], dustN: 26,
    actors: [act('digger', -25.3, 1.25, z - 2.0, { expr: 'stern', L: { a: 70, e: 40 }, R: { a: 70, e: 30 }, facing: 0.1 }, [], { s: 0.9, blob: false }), act('digger2', -24.5, 1.25, z - 2.8, { expr: 'shock', L: 'up', R: 'cheek', facing: -0.2, tilt: b * 200 }, [], { s: 0.9, blob: false }),
      act('major', -25.3, 1.3, z + 0.3, { expr: 'stern', L: 'hang', R: { a: 160, e: 0, finger: true }, facing: 0 }, [], { s: 0.85, blob: false })] }; });
// 19 28.90 "The emus run fifty kilometres an hour,"  side tracking: emus flat out, speed lines
shot(28.9, (t, d) => { const z = -95 + t * 14;
  return { preset: 'gold', cam: [-17.5, 1.3, z], look: [-25, 1.2, z + 0.5], fov: 48, focus: 7.5, cinf: 2.5, shake: 0.03, tag: '50 KM/H',
    emus: flock(7, -25, z + 1, 3, 4, 'run', { seed: 19, dir: [0, 1], rate: 1.6 }), dust: [dustAt([-25, 0, z - 1], { w: 4, s: 1.4, k: 0.55, drift: [0, -4] })], dustN: 24,
    actors: [hero(-23.8, 0, z + 1.6, { run: (t * 3) % 1, mood: 'smug' }, { s: 1.0, flip: true }), fx(speed(t), -22.5, 0.3, z + 0.5, 1.0, { alpha: 0.8 })] }; });
// 20 30.60 "straight through the bushes."  emus burst through a bush, leaves fly, the truck follows
shot(30.6, (t, d) => { const z = -86 + t * 10;
  return { preset: 'gold', cam: [-21.4, 1.0, -74], look: [-24.5, 1.2, z], fov: 50, focus: 6, cinf: 3, shake: 0.03, truck: { p: [-25.3, 0.05, z - 9], ry: 0, dist: t * 10, pitch: Math.sin(t * 13) * 0.04, gunPitch: -0.05 },
    emus: flock(6, -24.6, z, 2.5, 3, 'run', { seed: 20, dir: [0, 1], rate: 1.5 }), feathers: { p: [-24.5, 0.6, -78], k: rg(t, 0.4, 1.6) }, dust: [dustAt([-24.6, 0, z - 1.5], { w: 3, s: 1.3, k: 0.5 })], dustN: 18 }; });
// 21 32.90 "The truck can't keep up."  the truck bounces, the gunner fires at the sky, an emu glances back smugly
shot(32.9, (t, d) => { const z = -70 + t * 5, b = Math.sin(t * 16) * 0.07;
  return { preset: 'gold', cam: [-21.5, 2.2, z + 6.5], look: [-25, 1.8, z], fov: 50, focus: 6.8, cinf: 3, shake: 0.08, truck: { p: [-25, Math.abs(b) * 3, z], ry: 0.05, dist: t * 5, pitch: b, roll: -b, gunPitch: -0.5 + b * 3 }, fire: 'truck', tracers: 8, shells: true,
    dust: [dustAt([-25, 0, z - 2.5], { w: 3, h: 2, s: 2.2, k: 0.6 })], dustN: 26,
    actors: [act('digger', -25.0, 1.25 + Math.abs(b) * 3, z - 2.2, { expr: 'shock', L: { a: 80, e: 30 }, R: { a: 80, e: 20 }, facing: 0, tilt: b * 250, sweat: 2 }, [], { s: 0.9, blob: false }),
      act('digger2', -24.3, 1.3 + Math.abs(b) * 2, z - 3.0, { expr: 'pained', L: 'up', R: 'up', facing: -0.3, tilt: -b * 250 }, [], { s: 0.85, blob: false })] }; });
// 22 34.50 "So they set an ambush at a dam."  behind the boulder: gun on its tripod, the major with binoculars
shot(34.5, (t, d) => ({ preset: 'gold', cam: L3([47.0, 1.5, -40.6], [47.6, 1.45, -41.4], ez(t / d)), look: [58, 1.0, -54], fov: 48, focus: 4.5, cinf: 4, motes: true,
  gunG: { p: [50.4, 0.62, -45.2], ry: 2.45, pitch: 0 },
  actors: [act('major', 49.2, 0, -44.0, { expr: 'grin', L: 'hang', R: { a: 150, e: 140 }, facing: 0.3, blink: 0 }, [{ hand: 1, kind: 'binos' }]), act('digger', 51.2, 0, -44.2, { expr: 'stern', L: { a: 60, e: 50 }, R: { a: 60, e: 40 }, facing: -0.2, tilt: 8 }, [], { s: 0.95 })] }));
// 23 36.95 "A thousand emus walk right into it."  the dam fills with emus; tag 1,000
shot(36.95, (t, d) => { const k = ez(t / d);
  return { preset: 'gold', cam: L3([46, 4.2, -38], [48, 3.4, -40], k), look: [68, 0.6, -60], fov: 50, focus: 25, cinf: 1.5, tag: '1,000', shadowExt: 40, gunG: { p: [50.4, 0.62, -45.2], ry: 2.45 },
    emus: [...flock(90, 70, -60, 34, 34, 'peck', { seed: 23 }).filter((e) => Math.hypot(e.x - 70, e.z + 60) > 14.8), ...flock(30, 86, -80 + t * 4, 12, 10, 'run', { seed: 24, dir: [-0.6, 0.8], rate: 0.6 })],
    actors: [act('major', 49.2, 0, -44.0, { expr: 'grin', L: 'hang', R: { a: 150, e: 140 }, facing: 0.3 }, [{ hand: 1, kind: 'binos' }]), act('digger', 51.2, 0, -44.2, { expr: 'grin', L: 'thumb', R: { a: 60, e: 40 }, facing: -0.2 }, [], { s: 0.95 })] }; });
// 24 39.65 "The gunner opens fire,"  muzzle flashes, tracers, brass flying
shot(39.65, (t, d) => ({ preset: 'gold', cam: [52.8, 1.35, -42.4], look: [50.2, 0.95, -45.6], fov: 50, focus: 3.0, cinf: 6, shake: 0.06, gunG: { p: [50.4, 0.62, -45.2], ry: 2.45 + wig(t, 9, 0.03), pitch: wig(t, 31, 0.02) }, fire: 'ground', tracers: 14, shells: true,
  actors: [act('digger', 51.3, 0, -44.9, { expr: 'stubborn', L: { a: 60, e: 50 }, R: { a: 60, e: 40 }, facing: -0.3, tilt: 10 + wig(t, 30, 2) }, [], { s: 0.95 })] }));
// 25 41.20 "and the gun jams."  clunk: smoke puff, the gunner stares, slaps it; emus bolt
shot(41.2, (t, d) => ({ preset: 'gold', cam: L3([53.0, 1.55, -41.8], [52.6, 1.55, -42.4], eo(t / 0.4)), look: [50.6, 1.2, -45.0], fov: 48, focus: 2.0, cinf: 6, gunG: { p: [50.4, 0.62, -45.2], ry: 2.45 }, bang: t < 0.5 ? { p: [50.0, 0.7, -45.8], k: 0.3 * (1 - t * 2) } : null,
  actors: [act('digger', 51.3, 0, -44.9, { expr: t < 0.6 ? 'shock' : 'pained', L: t < 0.6 ? 'up' : { a: 70 + Math.abs(wig(t, 16, 40)), e: 20 }, R: 'cheek', facing: -0.3, sweat: 3 }, [], { s: 0.95 }), fx(qmark(t, '?'), 51.2, 2.25, -44.5, 0.35)] }));
// 26 42.90 "After a month,"  night at camp: tired soldiers by the fire
shot(42.9, (t, d) => ({ preset: 'night', zone: 'farm', cam: L3([-57.6, 1.4, 30.6], [-57.9, 1.4, 30.0], ez(t / d)), look: [-59.5, 1.0, 26.5], fov: 46, focus: 3.6, cinf: 4, tag: '1 MONTH LATER', dust: [dustAt([-59.5, 0.4, 26.5], { w: 0.4, h: 2.5, s: 0.6, k: 0.35, col: '#8a90a8', rate: 0.6 })], dustN: 10,
  actors: [act('digger', -60.6, 0, 27.8, { expr: 'dazed', L: 'hang', R: 'hang', facing: 0.4, tilt: -6, headTilt: 8, blink: 0.6 }), act('digger2', -58.4, 0, 27.6, { expr: 'snore', L: 'cross', R: 'cross', facing: -0.4, headTilt: -14 })] }));
// 27 43.95 "the army has fired ten thousand bullets."  a mountain of empty brass; tag 10,000
shot(43.95, (t, d) => ({ preset: 'night', zone: 'farm', cam: L3([-56.6, 0.6, 27.6], [-56.2, 3.2, 29.6], ez(t / d)), look: [-57.5, 0.5, 25.2], fov: 50, focus: 3, cinf: 3, pile: true, tag: '10,000',
  actors: [act('major', -58.9, 0, 24.6, { expr: 'pained', L: 'temple', R: 'hip', facing: 0.3, blink: blink(t, 2) })] }));
// 28 46.85 "About ten bullets for every bird they hit."  ten shells in a row... and one emu strolls past, feathers puffing, unbothered
shot(46.85, (t, d) => ({ preset: 'gold', cam: L3([-5.0, 0.6, -29.2], [-5.2, 0.65, -29.8], ez(t / d)), look: [-7.4, 0.6, -33.2], fov: 44, focus: 3.6, cinf: 5, row: [-8.4, 0.02, -32.4], rowN: Math.min(10, Math.floor(t * 8) + 1),
  feathers: t > 1.0 ? { p: [-9.1, 1.4, -33.0], k: rg(t, 1.0, 2.0) } : null,
  actors: [hero(-9.1, 0, lerp(-37.5, -31.5, ez(t / d)), { run: -1, mood: 'smug', bob: Math.sin(t * 6), blink: blink(t, 3) }, { s: 1.0, flip: true })] }));
// 29 49.55 "You see,"  hero emu straight to camera
shot(49.55, (t, d) => ({ preset: 'gold', cam: [9.4, 1.7, -41.4], look: [8.3, 1.65, -44], fov: 40, focus: 2.8, cinf: 6, motes: true, actors: [hero(8.3, 0, -44, { mood: 'smug', blink: blink(t, 6) }, { s: 1.1 })] }));
// 30 50.10 "an emu is fast,"  whoosh: an emu streaks past the lens
shot(50.1, (t, d) => { const z = lerp(-50, -22, t / d);
  return { preset: 'gold', cam: [-5.4, 1.1, -36], look: [-8.6, 1.2, -36], fov: 50, focus: 4.5, cinf: 3, shake: 0.03, emus: flock(4, -8.5, z - 4, 2, 3, 'run', { seed: 30, dir: [0, 1], rate: 1.6 }),
    dust: [dustAt([-8, 0, z - 1], { w: 2, s: 1.2, k: 0.5 })], dustN: 14, actors: [hero(-8, 0, z, { run: (t * 3.4) % 1, mood: 'angry' }, { s: 1.0, flip: true }), fx(speed(t), -8.2, 0.3, z - 1.2, 1.0, { alpha: 0.8 })] }; });
// 31 51.60 "tough,"  a bullet pings off: feathers puff, the emu shrugs it off
shot(51.6, (t, d) => ({ preset: 'gold', cam: [9.2, 1.6, -41.6], look: [8.3, 1.4, -44], fov: 42, focus: 2.6, cinf: 6, feathers: { p: [8.1, 1.4, -44], k: rg(t, 0, 0.6) },
  actors: [hero(8.3, 0, -44, { mood: t < 0.25 ? 'shock' : 'smug', blink: 0 }, { s: 1.1 }), ...(t < 0.3 ? [fx(burst(t, '#ffffff'), 8.1, 1.0, -43.9, 0.35)] : [])] }));
// 32 52.30 "and it never stays in one big crowd."  crane up: dozens of little groups spread to the horizon
shot(52.3, (t, d) => { const emus = []; for (let gI = 0; gI < 16; gI++) { const gx = -10 + (gI % 4) * 14 + hash(gI, 1) * 6, gz = -80 - Math.floor(gI / 4) * 12 - hash(gI, 2) * 6; for (let j = 0; j < 3; j++) emus.push({ x: gx + j * 0.8 + t * 1.4, z: gz + (j % 2) * 0.7, s: 1, mode: j % 2 ? 'run' : 'peck', ph: j / 3, rate: 0.6, dir: [1, 0] }); }
  return { preset: 'gold', cam: L3([12, 3, -68], [12, 9, -64], ez(t / d)), look: [14, 0, -96], fov: 54, focus: 30, cinf: 0, shadowExt: 60, emus }; });
// 33 54.70 "And here's the crazy part."  the major, close, eyebrow up
shot(54.7, (t, d) => ({ preset: 'gold', cam: L3([-62.4, 1.78, 29.4], [-61.6, 1.78, 29.2], ez(t / d)), look: [-59.3, 1.72, 28.6], fov: 42, focus: 2.2, cinf: 7, truck: { p: [-49, 0, 13], ry: 0.4 },
  actors: [act('major', -59.3, 0, 28.6, { expr: 'smile', L: 'hip', R: { a: 130, e: 120 }, facing: 0, headTilt: 6, blink: blink(t, 1) })] }));
// 34 56.40 "The major said,"  he talks, finger raised
shot(56.4, (t, d) => ({ preset: 'gold', cam: [-61.9, 1.7, 30.0], look: [-59.3, 1.65, 28.6], fov: 44, focus: 2.9, cinf: 6, orbit: -0.1 + t * 0.12, truck: { p: [-49, 0, 13], ry: 0.4 },
  actors: [act('major', -59.3, 0, 28.6, { expr: 'stern', talk: true, L: 'hip', R: { a: 160 + wig(t, 8, 6), e: 0, finger: true }, facing: 0.2 }, [], {}, t)] }));
// 35 57.30 "if he had soldiers who could take bullets like those birds,"  his daydream: emus in slouch hats, marching in line
shot(57.3, (t, d) => { const emus = []; for (let i = 0; i < 14; i++) emus.push({ x: 4 + i * 1.5 + t * 0.9, z: -86 - (i % 2) * 0.4, s: 1, mode: 'run', ph: (i % 2) * 0.5, rate: 0.55, dir: [1, 0] });
  return { preset: 'gold', cam: L3([6, 1.2, -79.5], [12, 1.3, -79.5], ez(t / d)), look: [12, 1.4, -86], fov: 48, focus: 6.5, cinf: 3, motes: true, rays: 1.6, emus: emus.slice(3),
    actors: [0, 1, 2].map((i) => hero(4 + (i + 4) * 1.5 + t * 0.9 - 1.0, 0, -85.0 + i * 0.2, { run: (t * 1.5 + i * 0.5) % 1, mood: 'smug', hat: true }, { s: 1.0 })) }; });
// 36 60.30 "he could beat any army in the world."  the emu army charges over the ridge into the sun
shot(60.3, (t, d) => { const z = -112 + t * 8;
  return { preset: 'gold', cam: [20, 0.8, -76], look: [20, 2.4, z], fov: 52, focus: 12, cinf: 2, rays: 1.8, shake: 0.04, emus: flock(80, 20, z, 40, 18, 'runA', { seed: 36, dir: [0, 1], rate: 1.0 }),
    dust: [dustAt([12, 0, z - 4], { w: 16, h: 3, s: 2.6, k: 0.5 }), dustAt([28, 0, z - 4], { w: 16, h: 3, s: 2.6, k: 0.5 })], dustN: 40,
    actors: [0, 1].map((i) => hero(18 + i * 3.4, 0, z + 6, { run: (t * 3 + i * 0.4) % 1, mood: 'angry', hat: true }, { s: 1.1 })) }; });
// 37 63.00 "The army went home."  the truck rattles off into the sunset, soldiers slumped
shot(63.0, (t, d) => { const z = 0 - t * 4;
  return { preset: 'gold', cam: [-7.0, 1.3, 9], look: [-8, 1.6, z - 6], fov: 46, focus: 10, cinf: 2, rays: 1.8, truck: { p: [-8, 0, z], ry: Math.PI, dist: t * 4, pitch: Math.sin(t * 10) * 0.02 },
    dust: [dustAt([-8, 0, z + 2.5], { w: 2.5, s: 1.8, k: 0.5 })], dustN: 16,
    actors: [act('digger', -8.3, 1.25, z + 2.1, { expr: 'pained', L: 'hang', R: 'hang', facing: 0, headTilt: 10 }, [], { s: 0.85, blob: false }), act('digger2', -7.6, 1.25, z + 2.8, { expr: 'dazed', L: 'cross', R: 'cross', facing: 0, headTilt: -10 }, [], { s: 0.85, blob: false })] }; });
// 38 64.55 "The emus won."  the hero emu on an ammo crate in the wheat at sunset, the flock cheering
shot(64.55, (t, d) => ({ preset: 'gold', cam: L3([10.2, 1.5, -38.4], [10.0, 1.9, -39.2], ez(t / d)), look: [8.3, 2.0, -44], fov: 44, focus: 4.6, cinf: 4, rays: 1.6, motes: true, crate: [8.3, 0, -44],
  emus: flock(14, 8, -48, 12, 6, 'idleS', { seed: 38 }),
  actors: [hero(8.3, 0.45, -44, { mood: 'smug', hat: true, blink: blink(t, 2), bob: Math.sin(t * 6) }, { s: 1.1, ground: 0.45 }), fx(burst(t, '#fff3b0'), 8.3, 1.2, -44.1, 0.9)] }));

export const CUTS = SH.map((s) => s.t0);
export const stateAt = (f) => {
  const t = f / FPS; let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--;
  const d = (i + 1 < SH.length ? SH[i + 1].t0 : TOTAL / FPS) - SH[i].t0;
  const S = SH[i].fn(t - SH[i].t0, d); S.shotIndex = i; return S;
};
