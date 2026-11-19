// Keyframe helpers mirroring Blender's keyframes (frame numbers are Blender frames, 1-based).
export type V3 = [number, number, number];
export const B = (x: number, y: number, z: number): V3 => [x, z, -y]; // Blender (x,y,z-up) -> three (x,y-up,z towards camera)
export const BS = (x: number, y: number, z: number): V3 => [x, z, y]; // Blender scale -> three scale
export const R = (deg: number) => (deg * Math.PI) / 180;
const ease = (t: number) => t * t * (3 - 2 * t);

export const trk = (f: number, keys: [number, number][]): number => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i][0]) {
      const [f0, v0] = keys[i - 1];
      const [f1, v1] = keys[i];
      return v0 + (v1 - v0) * ease((f - f0) / (f1 - f0));
    }
  }
  return keys[keys.length - 1][1];
};

export const trkV = (f: number, keys: [number, number[]][]): number[] => {
  const n = keys[0][1].length;
  return Array.from({length: n}, (_, c) => trk(f, keys.map(([k, v]) => [k, v[c]] as [number, number])));
};

/** pop(): scale 0 -> 1 over 4 frames (Blender helper pop) */
export const pop = (f: number, f0: number, hideAfter?: number) => {
  let s = trk(f, [[f0 - 1, 0], [f0 + 2, 1.12], [f0 + 4, 1]]);
  if (hideAfter !== undefined) s *= trk(f, [[hideAfter, 1], [hideAfter + 4, 0]]);
  return s;
};

/** Walk cycle angle for one leg (sign +1/-1). */
export const walkAng = (f: number, f0: number, f1: number, sign: number, step = 6, swing = 28) => {
  if (f < f0 || f > f1 + step) return 0;
  const a = R(swing) * Math.cos((Math.PI * (f - f0)) / step) * sign;
  if (f > f1) return a * (1 - (f - f1) / step);
  if (f < f0 + 3) return a * ((f - f0) / 3);
  return a;
};

/** Shovel strokes: alternates up/down every `step` frames. */
export const digAng = (f: number, segs: [number, number, number][], up: number, down: number) => {
  for (const [f0, f1, step] of segs) {
    if (f >= f0 - 6 && f <= f1 + step) {
      const mid = (up + down) / 2;
      const amp = (up - down) / 2;
      const v = mid + amp * Math.cos((Math.PI * (f - f0)) / step);
      if (f < f0) return R(up) * ((f - (f0 - 6)) / 6);
      if (f > f1) return R(v) * (1 - (f - f1) / step);
      return R(v);
    }
  }
  return 0;
};

export const rand = (seed: number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
export const uni = (r: () => number, a: number, b: number) => a + (b - a) * r();
