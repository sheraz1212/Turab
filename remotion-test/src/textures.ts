import * as THREE from 'three';
import {fbm, hash2, mulberry32, smooth, clamp01} from './noise';

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

const mkCanvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const toTex = (c: HTMLCanvasElement, srgb: boolean, repeat = false) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
};

export type TexSet = {map: THREE.Texture; bumpMap: THREE.Texture; roughnessMap: THREE.Texture};

// Colours (sRGB)
const C = {
  grass: hex('#3d4a1f'),
  litter: hex('#4a3a22'),
  topsoil: hex('#33221a'),
  topsoil2: hex('#4a3122'),
  lat: hex('#a3432a'),
  lat2: hex('#b9592f'),
  latDeep: hex('#86311f'),
  ochre: hex('#b8763c'),
  pale: hex('#d2a77c'),
  iron: hex('#4e1d12'),
};

/** Soil cross-section texture: x across, y = depth from surface (top row = surface). */
export const makeSoilTextures = (seed: number, wUnits: number, hUnits: number, ppu = 150): TexSet => {
  const W = Math.round(wUnits * ppu);
  const H = Math.round(hUnits * ppu);
  const col = mkCanvas(W, H);
  const bump = mkCanvas(W, H);
  const rough = mkCanvas(W, H);
  const cc = col.getContext('2d')!;
  const bc = bump.getContext('2d')!;
  const rc = rough.getContext('2d')!;
  const ci = cc.createImageData(W, H);
  const bi = bc.createImageData(W, H);
  const ri = rc.createImageData(W, H);

  for (let py = 0; py < H; py++) {
    const d = py / ppu; // depth in units
    for (let px = 0; px < W; px++) {
      const x = px / ppu;
      const i = (py * W + px) * 4;
      const grassEdge = 0.06 + 0.03 * fbm(x * 3, 0.5, seed + 1, 3);
      const topEdge = 0.55 + 0.35 * fbm(x * 0.7, 2.5, seed + 2, 4) + 0.08 * fbm(x * 6, d * 2, seed + 3, 3);
      const lowF = fbm(x * 0.9, d * 0.9, seed + 4, 4);
      const midF = fbm(x * 4, d * 4, seed + 5, 5);
      const strata = fbm(x * 0.6, d * 7, seed + 6, 4);
      const grain = hash2(px, py, seed) ;
      const grain2 = hash2(px >> 1, py >> 1, seed + 9);

      let c: RGB;
      let h = 0.5;
      let r = 0.92;
      if (d < grassEdge) {
        c = mix(C.grass, C.litter, midF);
        h = 0.65 + 0.3 * grain;
        r = 0.95;
      } else {
        // topsoil -> laterite blend
        const tBlend = smooth(topEdge - 0.12, topEdge + 0.22, d + (midF - 0.5) * 0.25);
        const top = mix(C.topsoil, C.topsoil2, lowF * 1.2);
        // laterite mottling
        const mott = smooth(0.52, 0.68, fbm(x * 2.2, d * 1.6, seed + 7, 5));
        const ironN = smooth(0.62, 0.72, fbm(x * 3.5, d * 3.5, seed + 8, 4));
        let lat = mix(C.lat, C.lat2, lowF);
        lat = mix(lat, C.latDeep, smooth(2.5, 6.5, d) * 0.8);
        lat = mix(lat, C.ochre, mott * (0.22 + 0.18 * smooth(1, 4, d)));
        lat = mix(lat, C.pale, smooth(0.66, 0.74, fbm(x * 1.5, d * 2.5, seed + 12, 4)) * smooth(3.5, 6, d) * 0.6);
        lat = mix(lat, C.iron, ironN * 0.55);
        c = mix(top, lat, tBlend);
        h = 0.45 + 0.25 * midF + 0.15 * (strata - 0.5) - ironN * 0.1 + mott * 0.05;
        r = 0.9 - tBlend * 0.08 + ironN * 0.05;
      }
      // strata streaks, fine grain
      const s = 1 + (strata - 0.5) * 0.18 + (midF - 0.5) * 0.22;
      const g = 1 + (grain - 0.5) * 0.22 + (grain2 - 0.5) * 0.12;
      ci.data[i] = Math.min(255, c[0] * s * g);
      ci.data[i + 1] = Math.min(255, c[1] * s * g);
      ci.data[i + 2] = Math.min(255, c[2] * s * g);
      ci.data[i + 3] = 255;
      const hv = clamp01(h + (grain - 0.5) * 0.25 + (grain2 - 0.5) * 0.15) * 255;
      bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = hv;
      bi.data[i + 3] = 255;
      const rv = clamp01(r + (grain - 0.5) * 0.08) * 255;
      ri.data[i] = ri.data[i + 1] = ri.data[i + 2] = rv;
      ri.data[i + 3] = 255;
    }
  }
  cc.putImageData(ci, 0, 0);
  bc.putImageData(bi, 0, 0);
  rc.putImageData(ri, 0, 0);

  const rnd = mulberry32(seed * 7 + 3);

  // Cracks (desiccation / shrinkage) – mostly vertical, in laterite
  for (let k = 0; k < 55 * wUnits / 7; k++) {
    let x = rnd() * W;
    let y = (0.8 + rnd() * (hUnits - 1)) * ppu;
    const len = 20 + rnd() * 140;
    let ang = Math.PI / 2 + (rnd() - 0.5) * 1.2;
    const w0 = 0.6 + rnd() * 2.2;
    const pts: [number, number][] = [[x, y]];
    for (let s = 0; s < len; s += 4) {
      ang += (rnd() - 0.5) * 0.7;
      x += Math.cos(ang) * 4;
      y += Math.sin(ang) * 4;
      pts.push([x, y]);
    }
    const stroke = (ctx: CanvasRenderingContext2D, style: string, w: number) => {
      ctx.strokeStyle = style;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      pts.forEach(([a, b], idx) => (idx ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
      ctx.stroke();
    };
    stroke(cc, 'rgba(40,12,6,0.75)', w0);
    stroke(cc, 'rgba(210,140,90,0.18)', w0 * 0.4);
    stroke(bc, 'rgba(0,0,0,0.9)', w0 * 1.4);
    stroke(rc, 'rgba(255,255,255,0.8)', w0);
  }

  // Roots from the surface
  const drawRoot = (x: number, y: number, ang: number, w: number, len: number, depth: number) => {
    const pts: [number, number][] = [[x, y]];
    let a = ang;
    for (let s = 0; s < len; s += 3) {
      a += (rnd() - 0.5) * 0.35;
      a = a * 0.95 + (Math.PI / 2) * 0.05;
      x += Math.cos(a) * 3;
      y += Math.sin(a) * 3;
      pts.push([x, y]);
      if (depth < 3 && rnd() < 0.025) drawRoot(x, y, a + (rnd() - 0.5) * 1.8, w * 0.6, len * 0.4 * rnd(), depth + 1);
    }
    for (let p = 1; p < pts.length; p++) {
      const t = 1 - p / pts.length;
      const lw = Math.max(0.5, w * t);
      cc.strokeStyle = 'rgba(25,12,6,0.6)';
      cc.lineWidth = lw + 1.2;
      cc.beginPath();
      cc.moveTo(pts[p - 1][0], pts[p - 1][1]);
      cc.lineTo(pts[p][0], pts[p][1]);
      cc.stroke();
      cc.strokeStyle = `rgba(${150 + rnd() * 40},${110 + rnd() * 30},${70 + rnd() * 20},0.95)`;
      cc.lineWidth = lw;
      cc.stroke();
      bc.strokeStyle = 'rgba(255,255,255,0.8)';
      bc.lineWidth = lw + 0.5;
      bc.beginPath();
      bc.moveTo(pts[p - 1][0], pts[p - 1][1]);
      bc.lineTo(pts[p][0], pts[p][1]);
      bc.stroke();
    }
  };
  for (let k = 0; k < 30 * wUnits / 7; k++) {
    drawRoot(rnd() * W, 4, Math.PI / 2 + (rnd() - 0.5) * 0.8, 1 + rnd() * 4, (0.3 + rnd() * rnd() * 2.2) * ppu, 0);
  }

  // Pebbles / ironstone nodules / quartz grit
  const pebbleCount = Math.round(900 * (wUnits * hUnits) / 49);
  for (let k = 0; k < pebbleCount; k++) {
    const x = rnd() * W;
    const y = (0.08 + rnd() * (hUnits - 0.1)) * ppu;
    const big = rnd() < 0.08;
    const rr = big ? 3 + rnd() * 7 : 0.8 + rnd() * 2.6;
    const ry = rr * (0.55 + rnd() * 0.45);
    const rot = rnd() * Math.PI;
    const kind = rnd();
    const base = kind < 0.45 ? [70 + rnd() * 30, 30 + rnd() * 15, 18] : kind < 0.8 ? [160 + rnd() * 50, 140 + rnd() * 40, 115 + rnd() * 30] : [120, 70 + rnd() * 30, 40];
    const gr = cc.createRadialGradient(x - rr * 0.3, y - ry * 0.3, 0, x, y, rr);
    gr.addColorStop(0, `rgb(${base[0] * 1.3},${base[1] * 1.3},${base[2] * 1.3})`);
    gr.addColorStop(1, `rgb(${base[0] * 0.55},${base[1] * 0.55},${base[2] * 0.55})`);
    cc.fillStyle = 'rgba(20,8,4,0.5)';
    cc.beginPath();
    cc.ellipse(x + 0.8, y + 1, rr + 0.8, ry + 0.8, rot, 0, Math.PI * 2);
    cc.fill();
    cc.fillStyle = gr;
    cc.beginPath();
    cc.ellipse(x, y, rr, ry, rot, 0, Math.PI * 2);
    cc.fill();
    const bg = bc.createRadialGradient(x, y, 0, x, y, rr);
    bg.addColorStop(0, 'rgba(255,255,255,1)');
    bg.addColorStop(1, 'rgba(160,160,160,0.6)');
    bc.fillStyle = bg;
    bc.beginPath();
    bc.ellipse(x, y, rr, ry, rot, 0, Math.PI * 2);
    bc.fill();
    rc.fillStyle = `rgba(${kind > 0.45 && kind < 0.8 ? 90 : 160},0,0,1)`;
    rc.fillStyle = kind > 0.45 && kind < 0.8 ? 'rgb(100,100,100)' : 'rgb(170,170,170)';
    rc.beginPath();
    rc.ellipse(x, y, rr, ry, rot, 0, Math.PI * 2);
    rc.fill();
  }
  // tiny root/insect holes
  for (let k = 0; k < pebbleCount * 0.4; k++) {
    const x = rnd() * W;
    const y = (0.1 + rnd() * rnd() * hUnits) * ppu;
    const rr = 0.6 + rnd() * 1.6;
    cc.fillStyle = 'rgba(15,5,2,0.8)';
    cc.beginPath();
    cc.arc(x, y, rr, 0, Math.PI * 2);
    cc.fill();
    bc.fillStyle = 'black';
    bc.beginPath();
    bc.arc(x, y, rr, 0, Math.PI * 2);
    bc.fill();
  }

  return {map: toTex(col, true), bumpMap: toTex(bump, false), roughnessMap: toTex(rough, false)};
};

/** Tileable forest floor: dark soil, leaf litter, moss */
export const makeGroundTextures = (seed: number, size = 1024, period = 8, leafCount = 2600): TexSet => {
  const col = mkCanvas(size, size);
  const bump = mkCanvas(size, size);
  const rough = mkCanvas(size, size);
  const cc = col.getContext('2d')!;
  const bc = bump.getContext('2d')!;
  const rc = rough.getContext('2d')!;
  const ci = cc.createImageData(size, size);
  const bi = bc.createImageData(size, size);
  const ri = rc.createImageData(size, size);
  const soil = hex('#3a2a1c');
  const moss = hex('#46562a');
  const moss2 = hex('#5f6b2e');
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const u = (px / size) * period;
      const v = (py / size) * period;
      const i = (py * size + px) * 4;
      const m = smooth(0.42, 0.62, fbm(u, v, seed, 5, period));
      const n = fbm(u * 4, v * 4, seed + 3, 4, period * 4);
      const g = hash2(px, py, seed);
      let c = mix(soil, mix(moss, moss2, n), m);
      const s = 0.8 + n * 0.4 + (g - 0.5) * 0.25;
      c = [c[0] * s, c[1] * s, c[2] * s];
      ci.data[i] = c[0];
      ci.data[i + 1] = c[1];
      ci.data[i + 2] = c[2];
      ci.data[i + 3] = 255;
      const hv = clamp01(0.4 + m * 0.3 + n * 0.3 + (g - 0.5) * 0.2) * 255;
      bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = hv;
      bi.data[i + 3] = 255;
      ri.data[i] = ri.data[i + 1] = ri.data[i + 2] = 235;
      ri.data[i + 3] = 255;
    }
  }
  cc.putImageData(ci, 0, 0);
  bc.putImageData(bi, 0, 0);
  rc.putImageData(ri, 0, 0);
  const rnd = mulberry32(seed + 99);
  const leafCols = ['#6b4a26', '#7d5a2c', '#5a3a1e', '#8a6a34', '#4a3018', '#6f6a2c', '#9a7440'];
  for (let k = 0; k < leafCount; k++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const l = 4 + rnd() * 12;
    const w = l * (0.25 + rnd() * 0.25);
    const rot = rnd() * Math.PI * 2;
    for (const [ox, oy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) {
      cc.save();
      cc.translate(x + ox, y + oy);
      cc.rotate(rot);
      cc.fillStyle = 'rgba(15,8,4,0.45)';
      cc.beginPath();
      cc.ellipse(1, 1.5, l, w, 0, 0, Math.PI * 2);
      cc.fill();
      cc.fillStyle = leafCols[Math.floor(rnd() * leafCols.length)];
      cc.beginPath();
      cc.ellipse(0, 0, l, w, 0, 0, Math.PI * 2);
      cc.fill();
      cc.strokeStyle = 'rgba(30,18,8,0.5)';
      cc.lineWidth = 0.7;
      cc.beginPath();
      cc.moveTo(-l, 0);
      cc.lineTo(l, 0);
      cc.stroke();
      cc.restore();
      bc.save();
      bc.translate(x + ox, y + oy);
      bc.rotate(rot);
      bc.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.4})`;
      bc.beginPath();
      bc.ellipse(0, 0, l, w, 0, 0, Math.PI * 2);
      bc.fill();
      bc.restore();
      rc.save();
      rc.translate(x + ox, y + oy);
      rc.rotate(rot);
      rc.fillStyle = 'rgb(200,200,200)';
      rc.beginPath();
      rc.ellipse(0, 0, l, w, 0, 0, Math.PI * 2);
      rc.fill();
      rc.restore();
    }
  }
  return {map: toTex(col, true, true), bumpMap: toTex(bump, false, true), roughnessMap: toTex(rough, false, true)};
};

/** Loose dug laterite (for the spoil pile and hole floor) – tileable */
export const makeLooseDirt = (seed: number, size = 512, period = 6): TexSet => {
  const col = mkCanvas(size, size);
  const bump = mkCanvas(size, size);
  const cc = col.getContext('2d')!;
  const bc = bump.getContext('2d')!;
  const ci = cc.createImageData(size, size);
  const bi = bc.createImageData(size, size);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const u = (px / size) * period;
      const v = (py / size) * period;
      const i = (py * size + px) * 4;
      // cellular-ish clods: high-frequency fbm with sharp thresholds
      const n = fbm(u * 3, v * 3, seed, 4, period * 3);
      const n2 = fbm(u, v, seed + 5, 4, period);
      const g = hash2(px, py, seed);
      let c = mix(C.lat, C.lat2, n2);
      c = mix(c, C.ochre, smooth(0.6, 0.75, n) * 0.4);
      c = mix(c, C.latDeep, smooth(0.45, 0.3, n) * 0.6);
      const s = 0.7 + n * 0.5 + (g - 0.5) * 0.3;
      ci.data[i] = Math.min(255, c[0] * s);
      ci.data[i + 1] = Math.min(255, c[1] * s);
      ci.data[i + 2] = Math.min(255, c[2] * s);
      ci.data[i + 3] = 255;
      const hv = clamp01(n * 1.1 + (g - 0.5) * 0.3) * 255;
      bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = hv;
      bi.data[i + 3] = 255;
    }
  }
  cc.putImageData(ci, 0, 0);
  bc.putImageData(bi, 0, 0);
  const rough = mkCanvas(4, 4);
  const r = rough.getContext('2d')!;
  r.fillStyle = 'rgb(240,240,240)';
  r.fillRect(0, 0, 4, 4);
  return {map: toTex(col, true, true), bumpMap: toTex(bump, false, true), roughnessMap: toTex(rough, false, true)};
};
