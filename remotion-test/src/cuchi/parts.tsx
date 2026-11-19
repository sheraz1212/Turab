import * as THREE from 'three';
import {B, R, V3, rand, uni, trk} from './anim';

const lin = (r: number, g: number, b: number) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);
const std = (c: THREE.Color, rough = 0.85, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({color: c, roughness: rough, ...extra});

export const M = {
  clay: std(lin(0.36, 0.08, 0.03), 1),
  hard: std(lin(0.48, 0.17, 0.07), 0.95),
  bark: std(lin(0.07, 0.06, 0.05), 0.9),
  leaf: std(lin(0.03, 0.075, 0.02), 0.8),
  leaf2: std(lin(0.06, 0.11, 0.025), 0.8),
  dleaf: std(lin(0.12, 0.1, 0.02), 0.9),
  bamboo: std(lin(0.16, 0.24, 0.05), 0.6),
  wood: std(lin(0.17, 0.09, 0.04), 0.8),
  olive: std(lin(0.1, 0.11, 0.05), 0.85),
  pack: std(lin(0.17, 0.16, 0.1), 0.85),
  black: std(lin(0.02, 0.02, 0.025), 0.9),
  straw: std(lin(0.45, 0.36, 0.18), 0.9),
  skin: std(lin(0.42, 0.25, 0.15), 0.6),
  boot: std(lin(0.025, 0.02, 0.015), 0.6),
  metal: std(lin(0.3, 0.3, 0.3), 0.4, {metalness: 0.7}),
  water: std(lin(0.03, 0.13, 0.11), 0.05, {transparent: true, opacity: 0.8}),
  bed: std(lin(0.55, 0.52, 0.42), 0.9),
  can: std(lin(0.12, 0.14, 0.08), 0.6),
  cloud: new THREE.MeshStandardMaterial({color: '#f2f4f8', emissive: '#ffffff', emissiveIntensity: 0.25, roughness: 1, fog: false}),
  fire: new THREE.MeshBasicMaterial({color: new THREE.Color(1.0, 0.42, 0.08), toneMapped: false}),
  lamp: new THREE.MeshBasicMaterial({color: new THREE.Color(5, 2.6, 1.0)}),
  outline: new THREE.MeshBasicMaterial({color: new THREE.Color(1.0, 0.5, 0.16), toneMapped: false}),
  arrow: new THREE.MeshBasicMaterial({color: new THREE.Color(1.6, 1.6, 1.6), toneMapped: false}),
  smoke: new THREE.MeshStandardMaterial({color: '#7b7670', roughness: 1, transparent: true, opacity: 0.85, depthWrite: false}),
  ksmoke: new THREE.MeshStandardMaterial({color: '#bdb8b0', roughness: 1, transparent: true, opacity: 0.7, depthWrite: false}),
  mist: new THREE.MeshStandardMaterial({color: '#e6eaee', roughness: 1, transparent: true, opacity: 0.45, depthWrite: false}),
  gas: new THREE.MeshStandardMaterial({color: '#c9d64a', emissive: '#4a5010', roughness: 1, transparent: true, opacity: 0.7, depthWrite: false}),
};

export const ico = (detail = 2) => new THREE.IcosahedronGeometry(1, detail);
const G = {
  ico2: ico(2),
  ico3: ico(3),
  box: new THREE.BoxGeometry(1, 1, 1),
};

type ManProps = {
  pos: V3; // Blender location
  rotZ: number; // Blender rotation z (radians)
  scale: V3; // Blender scale
  cloth: THREE.Material;
  hat: 'cone' | 'helmet';
  pack?: boolean;
  basket?: boolean;
  legs: [number, number];
  arms: [number, number];
  armsZ?: [number, number];
};

/** Port of make_man() from the Blender script. */
export const Man: React.FC<ManProps> = ({pos, rotZ, scale, cloth, hat, pack, basket, legs, arms, armsZ = [0, 0]}) => {
  if (scale[0] < 0.001 || scale[2] < 0.001) return null;
  return (
    <group position={B(...pos)} rotation={[0, rotZ, 0]} scale={[scale[0], scale[2], scale[1]]}>
      {[-0.11, 0.11].map((sx, i) => (
        <group key={sx} position={[sx, 0.84, 0]} rotation={[legs[i], 0, 0]}>
          <mesh material={cloth} position={[0, -0.42, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.085, 0.84, 12]} />
          </mesh>
          <mesh material={M.boot} position={[0, -0.85, 0.045]} scale={[0.14, 0.1, 0.23]} geometry={G.box} castShadow />
        </group>
      ))}
      <mesh material={cloth} position={[0, 1.13, 0]} castShadow>
        <cylinderGeometry args={[0.21, 0.21, 0.62, 14]} />
      </mesh>
      <mesh material={cloth} geometry={G.ico2} position={[0, 1.27, 0]} scale={[0.23, 0.17, 0.18]} castShadow />
      <mesh material={M.boot} position={[0, 0.86, 0]}>
        <cylinderGeometry args={[0.215, 0.215, 0.07, 14]} />
      </mesh>
      <mesh material={M.skin} position={[0, 1.47, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
      </mesh>
      <mesh material={M.skin} geometry={G.ico2} position={[0, 1.6, 0]} scale={0.14} castShadow />
      {hat === 'cone' ? (
        <mesh material={M.straw} position={[0, 1.76, 0]} castShadow>
          <coneGeometry args={[0.34, 0.16, 20]} />
        </mesh>
      ) : (
        <mesh material={M.olive} geometry={G.ico2} position={[0, 1.68, 0]} scale={[0.18, 0.117, 0.18]} castShadow />
      )}
      {pack && <mesh material={M.pack} geometry={G.box} position={[0, 1.2, -0.31]} scale={[0.34, 0.5, 0.22]} castShadow />}
      {[-0.28, 0.28].map((sx, i) => (
        <group key={sx} position={[sx, 1.38, 0]} rotation={[arms[i], 0, armsZ[i]]}>
          <mesh material={cloth} position={[0, -0.28, 0]} castShadow>
            <cylinderGeometry args={[0.065, 0.065, 0.56, 10]} />
          </mesh>
          <mesh material={M.skin} geometry={G.ico2} position={[0, -0.6, 0]} scale={0.06} />
        </group>
      ))}
      {basket && (
        <>
          <mesh material={M.straw} position={[0, 1.95, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.3, 0.25, 14]} />
          </mesh>
          <mesh material={M.clay} geometry={G.ico2} position={[0, 2.06, 0]} scale={[0.24, 0.11, 0.24]} />
        </>
      )}
    </group>
  );
};

/** Shovel held by the digger's right arm (port of shovel parented to arms[1]). */
export const ManWithShovel: React.FC<ManProps> = (p) => {
  if (p.scale[0] < 0.001 || p.scale[2] < 0.001) return null;
  return (
    <group>
      <Man {...p} />
      <group position={B(...p.pos)} rotation={[0, p.rotZ, 0]} scale={[p.scale[0], p.scale[2], p.scale[1]]}>
        <group position={[0.28, 1.38, 0]} rotation={[p.arms[1], 0, 0]}>
          <mesh material={M.wood} position={[0, -0.7, 0.1]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 0.7, 8]} />
          </mesh>
          <mesh material={M.metal} geometry={G.box} position={[0, -1.175, 0.1]} scale={[0.2, 0.25, 0.04]} castShadow />
        </group>
      </group>
    </group>
  );
};

/** Orange highlight frame. plane 'ground' = horizontal (Blender rot 0), 'front' = on the cut face. */
export const Outline: React.FC<{w: number; h: number; loc: V3; plane: 'ground' | 'front'; s: number}> = ({w, h, loc, plane, s}) => {
  if (s < 0.001) return null;
  const t = 0.06;
  const bars: [V3, V3][] = [
    [[0, h / 2, 0], [w + t, t, t]],
    [[0, -h / 2, 0], [w + t, t, t]],
    [[w / 2, 0, 0], [t, h + t, t]],
    [[-w / 2, 0, 0], [t, h + t, t]],
  ];
  return (
    <group position={B(...loc)} rotation={plane === 'ground' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]} scale={[s, s, 1]}>
      {bars.map(([p, sc], i) => (
        <mesh key={i} geometry={G.box} material={M.outline} position={p} scale={sc} />
      ))}
    </group>
  );
};

/** White arrow moving along a path of Blender points. */
export const Arrow: React.FC<{f: number; path: V3[]; f0: number; step: number}> = ({f, path, f0, step}) => {
  const fEnd = f0 + step * (path.length - 1);
  if (f < f0 || f > fEnd + 6) return null;
  const s = trk(f, [[fEnd + 2, 1], [fEnd + 6, 0]]);
  const seg = Math.min(path.length - 2, Math.max(0, Math.floor((f - f0) / step)));
  const t0 = f0 + seg * step;
  const tt = Math.min(1, (f - t0) / step);
  const e = tt * tt * (3 - 2 * tt);
  const a = new THREE.Vector3(...B(...path[seg]));
  const b = new THREE.Vector3(...B(...path[seg + 1]));
  const p = a.clone().lerp(b, e);
  const dir = b.clone().sub(a).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  return (
    <group position={p} quaternion={q} scale={s}>
      <mesh material={M.arrow} position={[0, -0.14, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.11, 0.18, 12]} />
      </mesh>
      <mesh material={M.arrow} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.25, 8]} />
      </mesh>
    </group>
  );
};

export const Lamp: React.FC<{f: number; loc: V3; f0: number; energy: number}> = ({f, loc, f0, energy}) => {
  const s = trk(f, [[f0 - 1, 0], [f0 + 3, 1.15], [f0 + 6, 1]]);
  const e = trk(f, [[f0, 0], [f0 + 4, energy]]);
  if (s <= 0) return null;
  return (
    <group>
      <mesh geometry={G.ico2} material={M.lamp} position={B(...loc)} scale={0.06 * s} />
      <pointLight position={B(loc[0], loc[1] - 0.4, loc[2] - 0.1)} color="#ff9c50" intensity={e * 0.09} distance={5} decay={1.6} />
    </group>
  );
};

/** Port of explosion(): fireball, light flash, rising smoke, flying clods. */
export const Explosion: React.FC<{f: number; loc: V3; f0: number; size: number; seed: number}> = ({f, loc, f0, size, seed}) => {
  if (f < f0 || f > f0 + 96) return null;
  const r = rand(seed);
  const [x, y, z] = loc;
  const fb = trk(f, [[f0, 0], [f0 + 3, size], [f0 + 9, size * 1.3], [f0 + 15, 0]]);
  const light = trk(f, [[f0, 0], [f0 + 2, 1], [f0 + 14, 0]]);
  const smoke = Array.from({length: 12}).map(() => {
    const sx = x + uni(r, -0.9, 0.9) * size;
    const sy = y + uni(r, -0.6, 0.6);
    const sz = z + uni(r, 0.2, 1.4) * size;
    const rr = uni(r, 0.5, 0.9) * size;
    const dx = uni(r, -1, 1);
    const sc = trk(f, [[f0 + 2, 0], [f0 + 12, rr], [f0 + 70, rr * 1.6], [f0 + 95, 0]]);
    const k = trk(f, [[f0 + 12, 0], [f0 + 70, 1]]);
    return {p: B(sx + dx * k, sy, sz + 3 * size * k), s: sc};
  });
  const chunks = Array.from({length: 10}).map(() => {
    const vx = uni(r, -3, 3), vy = uni(r, -2.5, 1), vz = uni(r, 3, 6), rs = uni(r, 0.06, 0.13);
    const t = Math.min(1, (f - f0) / 18);
    const px = x + vx * t, py = y + vy * t;
    const pz = f - f0 <= 18 ? z + (vz * 0.45 * 4 * t * (1 - t)) + (0.05 - z) * t * t : 0.05;
    const s = f - f0 < 1 ? 0 : trk(f, [[f0 + 40, 1], [f0 + 46, 0]]);
    return {p: B(px, py, pz), s: rs * s};
  });
  return (
    <group>
      {fb > 0.001 && <mesh geometry={G.ico3} material={M.fire} position={B(...loc)} scale={[fb, fb * 0.85, fb]} />}
      {light > 0.001 && <pointLight position={B(x, y - 1.5, z + 1.5)} color="#ff8030" intensity={light * 90 * size} distance={18} decay={1.2} />}
      {smoke.map((s, i) => s.s > 0.001 && <mesh key={i} geometry={G.ico3} material={M.smoke} position={s.p} scale={s.s} />)}
      {chunks.map((c, i) => c.s > 0.001 && <mesh key={'c' + i} geometry={G.ico2} material={M.clay} position={c.p} scale={c.s} castShadow />)}
    </group>
  );
};

export {G, R};
