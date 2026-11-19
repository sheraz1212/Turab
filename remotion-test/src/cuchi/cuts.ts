import {trk, rand, uni} from './anim';

// Rectangular cuts in the cross-section, Blender coords (x0,x1,z0,z1). They grow over f0..f1.
export type Cut = {x0: number; x1: number; z0: number; z1: number; f0: number; f1: number; mode: 'x' | 'xl' | 'z'; keys?: [number, number][]};

const C = (x0: number, x1: number, z0: number, z1: number, f0: number, f1: number, mode: Cut['mode']): Cut => ({x0, x1, z0, z1, f0, f1, mode});

export const CUTS: Cut[] = [
  // shaft: top fixed at 0.3, depth keyed 0 -> 0.08 -> 3.5
  {x0: -0.6, x1: 0.6, z0: -3.2, z1: 0.3, f0: 1, f1: 56, mode: 'z', keys: [[1, 0.001], [10, 0.08], [56, 3.5]]},
  C(0, 4.2, -3.2, -2.1, 392, 445, 'x'), // tunnel sideways
  C(1.45, 1.55, -2.15, 0.3, 618, 646, 'z'), // air vents
  C(3.25, 3.35, -2.15, 0.3, 636, 664, 'z'),
  C(-1.3, -0.55, -3.2, -2.3, 700, 712, 'xl'), // kitchen link
  C(-3.9, -1.25, -3.2, -2.0, 708, 728, 'xl'), // kitchen
  C(-3.15, -2.97, -2.05, -1.15, 738, 748, 'z'), // chimney 1
  C(-9.6, -2.97, -1.32, -1.12, 746, 772, 'xl'), // smoke tunnel
  C(-9.6, -9.4, -1.3, 0.3, 770, 780, 'z'), // chimney 2
  C(4.15, 5.0, -3.2, -2.1, 880, 890, 'x'),
  C(5.8, 7.0, -3.2, -2.1, 880, 890, 'x'),
  C(6.7, 7.3, -2.2, 0.3, 880, 892, 'z'), // second entrance
  C(4.95, 5.85, -3.95, -2.1, 975, 1000, 'z'), // U-bend pit
  C(-0.3, 0.3, -5.6, -3.1, 1112, 1122, 'z'),
  C(-8.0, 9.5, -5.6, -4.7, 1112, 1135, 'x'), // level 2
  C(8.8, 9.4, -4.8, -2.0, 1125, 1135, 'z'),
  C(8.6, 11.2, -3.2, -2.0, 1140, 1152, 'x'), // kitchen 2
  C(1.8, 5.2, -6.9, -5.55, 1166, 1180, 'x'), // hospital
  C(-6.6, -3.0, -6.9, -5.55, 1190, 1203, 'x'), // bedrooms
];
// network across the jungle (S12)
{
  const r = rand(77);
  for (let i = 0; i < 34; i++) {
    let x0 = uni(r, -60, 55);
    const ln = uni(r, 3, 11);
    if (x0 > -10 && x0 < 12) x0 += x0 > 0 ? 24 : -24;
    const z = uni(r, -8.5, -1.6);
    const f0 = 1222 + i;
    CUTS.push(C(x0, x0 + ln, z - 0.35, z + 0.35, f0, f0 + 10, 'x'));
    if (r() < 0.6) CUTS.push(C(x0 + ln * 0.5, x0 + ln * 0.5 + 0.4, z - 0.3, Math.min(0.3, z + uni(r, 1.5, 4)), f0 + 4, f0 + 12, 'z'));
  }
}

/** current extent of a cut in Blender coords, or null if not started */
export const cutRect = (c: Cut, f: number): [number, number, number, number] | null => {
  if (c.keys) {
    const d = trk(f, c.keys);
    return [c.x0, c.x1, c.z1 - d, c.z1];
  }
  if (f <= c.f0) return null;
  const t = trk(f, [[c.f0, 0.001], [c.f1, 1]]);
  if (c.mode === 'x') return [c.x0, c.x0 + (c.x1 - c.x0) * t, c.z0, c.z1];
  if (c.mode === 'xl') return [c.x1 - (c.x1 - c.x0) * t, c.x1, c.z0, c.z1];
  return [c.x0, c.x1, c.z1 - (c.z1 - c.z0) * t, c.z1];
};
