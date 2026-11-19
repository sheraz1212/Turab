import * as THREE from 'three';
import {useMemo} from 'react';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {fbm, mulberry32} from './noise';
import {BACK_Z} from './constants';

// Organic blob for canopy / shrubs
const blobGeo = (seed: number, detail = 4) => {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm(v.x * 1.7 + 10, v.y * 1.7 + v.z * 1.3, seed, 3);
    const n2 = fbm(v.x * 8 + 3, v.y * 8 + v.z * 8, seed + 1, 2);
    v.multiplyScalar(0.75 + n * 0.5 + (n2 - 0.5) * 0.12);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};

type Tree = {x: number; z: number; h: number; r: number; lean: number; blobs: {p: [number, number, number]; s: [number, number, number]; c: string; g: number}[]};
type Culm = {x: number; z: number; h: number; r: number; tx: number; tz: number; c: string};

export const Jungle: React.FC = () => {
  const data = useMemo(() => {
    const rnd = mulberry32(4242);
    const geos = [0, 1, 2, 3, 4].map((s) => blobGeo(s * 13 + 5));
    const greens = ['#2c4420', '#35502a', '#3f5d27', '#2a3f1c', '#4b6a2e', '#516f32', '#304a24'];
    const trees: Tree[] = [];
    for (let i = 0; i < 46; i++) {
      const z = BACK_Z - 3 - rnd() * 32;
      const x = (rnd() - 0.5) * (14 + -z * 1.4);
      const h = 5 + rnd() * 9;
      const r = 0.12 + rnd() * 0.25;
      const blobs = [];
      const nb = 4 + Math.floor(rnd() * 5);
      for (let b = 0; b < nb; b++) {
        const s = 1 + rnd() * 1.6;
        blobs.push({
          p: [(rnd() - 0.5) * 3, h - 0.5 + rnd() * 2.2, (rnd() - 0.5) * 3] as [number, number, number],
          s: [s * (1 + rnd() * 0.4), s * (0.6 + rnd() * 0.3), s * (1 + rnd() * 0.4)] as [number, number, number],
          c: greens[Math.floor(rnd() * greens.length)],
          g: Math.floor(rnd() * geos.length),
        });
      }
      trees.push({x, z, h, r, lean: (rnd() - 0.5) * 0.12, blobs});
    }
    // bamboo clumps close behind the cut block
    const culms: Culm[] = [];
    const clumps = [
      [-2.6, BACK_Z - 1.2],
      [2.4, BACK_Z - 1.8],
      [-0.2, BACK_Z - 3.5],
      [4.8, BACK_Z - 0.8],
      [-5, BACK_Z - 2.5],
      [6.5, BACK_Z - 5],
    ];
    const bambooCols = ['#7c8a34', '#6c7f2e', '#8f9a3e', '#5e7228', '#9a9346'];
    for (const [cx, cz] of clumps) {
      const n = 7 + Math.floor(rnd() * 7);
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2;
        const d = rnd() * 0.6;
        culms.push({
          x: cx + Math.cos(a) * d,
          z: cz + Math.sin(a) * d,
          h: 4.5 + rnd() * 4,
          r: 0.035 + rnd() * 0.03,
          tx: Math.cos(a) * (0.05 + rnd() * 0.12),
          tz: Math.sin(a) * (0.05 + rnd() * 0.12),
          c: bambooCols[Math.floor(rnd() * bambooCols.length)],
        });
      }
    }
    // shrubs / ferns hugging the back edge
    const shrubs = [];
    for (let i = 0; i < 40; i++) {
      const s = 0.4 + rnd() * 0.9;
      shrubs.push({
        p: [(rnd() - 0.5) * 22, s * 0.3, BACK_Z - 0.6 - rnd() * 6] as [number, number, number],
        s: [s * 1.3, s * 0.7, s] as [number, number, number],
        c: greens[Math.floor(rnd() * greens.length)],
        g: Math.floor(rnd() * geos.length),
      });
    }
    const leafGeo = new THREE.PlaneGeometry(0.06, 0.5);
    leafGeo.translate(0, 0.25, 0);
    return {geos, trees, culms, shrubs, leafGeo, rnd};
  }, []);

  const leaves = useMemo(() => {
    const rnd = mulberry32(77);
    const list: {pos: [number, number, number]; rot: [number, number, number]; c: string}[] = [];
    for (const c of data.culms) {
      const n = 14;
      for (let i = 0; i < n; i++) {
        const t = 0.55 + rnd() * 0.45;
        list.push({
          pos: [c.x + c.tx * c.h * t, c.h * t, c.z + c.tz * c.h * t],
          rot: [(rnd() - 0.5) * 2.4, rnd() * Math.PI * 2, 1.1 + (rnd() - 0.5) * 1.4],
          c: rnd() < 0.5 ? '#5a7a2a' : '#6f8f34',
        });
      }
    }
    return list;
  }, [data]);

  return (
    <group>
      {data.trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} rotation={[t.lean, 0, -t.lean]}>
          <mesh position={[0, t.h / 2, 0]} castShadow>
            <cylinderGeometry args={[t.r * 0.6, t.r, t.h + 1, 7]} />
            <meshStandardMaterial color="#4a3a2a" roughness={0.95} />
          </mesh>
          {t.blobs.map((b, j) => (
            <mesh key={j} geometry={data.geos[b.g]} position={b.p} scale={b.s} castShadow>
              <meshStandardMaterial color={b.c} roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}
      {data.culms.map((c, i) => {
        const len = Math.hypot(c.h, c.tx * c.h, c.tz * c.h);
        const nodes = Math.floor(c.h / 0.45);
        return (
          <group key={i} position={[c.x, 0, c.z]} rotation={[c.tz, 0, -c.tx]}>
            <mesh position={[0, len / 2, 0]} castShadow>
              <cylinderGeometry args={[c.r * 0.7, c.r, len, 8]} />
              <meshStandardMaterial color={c.c} roughness={0.55} />
            </mesh>
            {Array.from({length: nodes}).map((_, k) => (
              <mesh key={k} position={[0, (k + 1) * 0.45, 0]}>
                <torusGeometry args={[c.r * 0.95, c.r * 0.18, 4, 10]} />
                <meshStandardMaterial color="#59612a" roughness={0.6} />
              </mesh>
            ))}
          </group>
        );
      })}
      {leaves.map((l, i) => (
        <mesh key={i} geometry={data.leafGeo} position={l.pos} rotation={l.rot}>
          <meshStandardMaterial color={l.c} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {data.shrubs.map((s, i) => (
        <mesh key={i} geometry={data.geos[s.g]} position={s.p} scale={s.s} castShadow receiveShadow>
          <meshStandardMaterial color={s.c} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};
