import * as THREE from 'three';
import {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {makeGroundTextures, makeLooseDirt, makeSoilTextures} from '../textures';
import {makePlane, mat4} from '../geo';
import {fbm, mulberry32} from '../noise';
import {B, BS, R, V3, digAng, pop, rand, trk, trkV, uni, walkAng} from './anim';
import {CUTS, cutRect} from './cuts';
import {cutU, patchCut} from './cutShader';
import {Arrow, Explosion, G, Lamp, M, Man, ManWithShovel, Outline} from './parts';
import {Captions} from './Captions';

export const CUCHI_FRAMES = 1524;
const BOT = -3.2;
const NIGHT = (bf: number) => trk(bf, [[425, 0], [452, 1], [552, 1], [578, 0]]);

// ---------------------------------------------------------------- camera (port of look() keys)
const CAM: [number, V3, V3][] = [
  [1, [0, -10.2, 1.3], [0, 0, -0.35]],
  [70, [0, -9.6, 1.3], [0, 0, -0.35]],
  [140, [0.2, -9.2, 1.35], [0.2, 0, -0.35]],
  [172, [0.35, -3.0, 3.4], [0.35, 3.2, 0.1]],
  [236, [0.35, -2.7, 3.3], [0.35, 3.4, 0.1]],
  [262, [-1.2, -9.4, 1.1], [0.4, 2.0, -0.4]],
  [282, [-1.0, -9.0, 1.0], [0.4, 2.0, -0.4]],
  [318, [0, -5.0, 0.35], [0, 0.4, -1.75]],
  [380, [0, -4.8, 0.3], [0, 0.4, -1.75]],
  [410, [1.6, -6.2, -0.3], [1.6, 0, -2.35]],
  [430, [1.8, -6.0, -0.35], [1.8, 0, -2.35]],
  [462, [-4.6, -4.4, 0.9], [1.2, 2.2, -0.6]],
  [566, [-4.2, -4.0, 0.85], [1.6, 2.4, -0.5]],
  [590, [2.4, -7.4, 0.7], [2.4, 0, -1.2]],
  [712, [2.2, -7.6, 0.6], [2.2, 0, -1.2]],
  [735, [-2.6, -6.6, -0.2], [-2.6, 0, -2.3]],
  [760, [-2.8, -6.4, -0.3], [-2.8, 0, -2.0]],
  [766, [-3.0, 0.85, -1.22], [-12, 0.85, -1.22]],
  [812, [-7.6, 0.85, -1.22], [-12, 0.85, -1.22]],
  [820, [-9.5, -4.8, 0.55], [-9.5, 5.0, 0.4]],
  [890, [-9.3, -4.4, 0.55], [-9.3, 5.0, 0.4]],
  [898, [6.2, -7.4, 0.4], [6.2, 0, -1.5]],
  [965, [6.0, -7.0, 0.3], [6.0, 0, -1.6]],
  [985, [5.5, -4.6, -1.5], [5.5, 0, -2.9]],
  [1070, [5.4, -4.4, -1.55], [5.4, 0, -2.95]],
  [1092, [1.2, -11.0, 0.2], [1.2, 0, -3.6]],
  [1215, [1.2, -15.5, 1.2], [1.2, 0, -3.8]],
  [1238, [0, -40, 15], [0, 8, -3]],
  [1292, [0, -44, 16], [0, 8, -3]],
  [1302, [7.0, -3.2, -0.6], [7.0, 0.5, 0.2]],
  [1418, [7.0, -3.0, -0.65], [7.0, 0.5, 0.2]],
  [1430, [1.5, -14.5, 1.3], [1.5, 0, -2.9]],
  [1524, [1.5, -15.5, 1.4], [1.5, 0, -2.9]],
];
const shake = (bf: number) => {
  const segs: [number, number, number][] = [[7, 20, 0.15], [251, 266, 0.18], [1333, 1342, 0.08]];
  for (const [a, b, amp] of segs) {
    if (bf >= a && bf < b) {
      const k = amp * (1 - (bf - a) / (b - a));
      const r = rand(Math.floor(bf) * 13 + 1);
      return [uni(r, -k, k), uni(r, -k, k)];
    }
  }
  return [0, 0];
};

const CameraRig: React.FC<{bf: number}> = ({bf}) => {
  const {camera} = useThree();
  useLayoutEffect(() => {
    const pos = trkV(bf, CAM.map(([f, p]) => [f, p]));
    const tgt = trkV(bf, CAM.map(([f, , t]) => [f, t]));
    const [sx, sy] = shake(bf);
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(...B(pos[0], pos[1], pos[2]));
    cam.lookAt(new THREE.Vector3(...B(tgt[0], tgt[1], tgt[2])));
    cam.translateX(sx);
    cam.translateY(sy);
    cam.fov = 58.7; // 32 mm lens on a 36 mm vertical sensor (same as Blender)
    cam.near = 0.05;
    cam.far = 900;
    cam.updateProjectionMatrix();
  }, [bf, camera]);
  return null;
};

// ---------------------------------------------------------------- sky + fog + tone mapping
const Sky: React.FC<{night: number}> = ({night}) => {
  const {scene, gl} = useThree();
  const sky = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {uNight: {value: 0}},
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);}',
        fragmentShader: `varying vec3 vP; uniform float uNight;
          void main(){ float h = clamp(vP.y, 0.0, 1.0);
            vec3 dayC = mix(vec3(0.78,0.86,0.93), vec3(0.32,0.55,0.9), pow(h, 0.6));
            vec3 nightC = mix(vec3(0.07,0.09,0.16), vec3(0.01,0.02,0.06), pow(h, 0.6));
            gl_FragColor = vec4(mix(dayC, nightC, uNight), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  sky.uniforms.uNight.value = night;
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);
  const fogC = new THREE.Color().setRGB(0.78, 0.86, 0.93).lerp(new THREE.Color().setRGB(0.07, 0.09, 0.16), night);
  scene.fog = new THREE.FogExp2(fogC, 0.0095);
  return (
    <mesh material={sky} renderOrder={-1}>
      <sphereGeometry args={[800, 32, 16]} />
    </mesh>
  );
};

// ---------------------------------------------------------------- jungle (port of tree(), bamboo, bushes, clouds)
const blob = (seed: number) => {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 4);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm(v.x * 1.4 + 10, v.y * 1.4 + v.z * 1.2, seed, 3);
    const n2 = fbm(v.x * 6 + 3, v.y * 6 + v.z * 6, seed + 1, 2);
    v.multiplyScalar(0.72 + n * 0.55 + (n2 - 0.5) * 0.15);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};

type Obj = {geo: THREE.BufferGeometry; mat: THREE.Material; pos: V3; rot?: V3; scale: V3; shadow?: boolean};

const buildJungle = () => {
  const r = mulberry32(11);
  const U = (a: number, b: number) => a + (b - a) * r();
  const blobs = [0, 1, 2, 3, 4, 5].map((s) => blob(s * 17 + 3));
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const out: Obj[] = [];
  const cone = (rb: number, rt: number, h: number, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);
  const tree = (x: number, y: number, h: number, rr: number, roots = true, near = true) => {
    out.push({geo: cone(0.32 * rr, 0.18 * rr, h), mat: M.bark, pos: B(x, y, h / 2), scale: [1, 1, 1], shadow: near});
    if (roots) {
      const n = 2 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) {
        const a = U(0, 6.28), d = U(0.35, 0.9) * rr;
        const rx = x + Math.cos(a) * d, ry = y + Math.sin(a) * d;
        const hh = U(0.35, 0.7) * h;
        out.push({geo: cone(0.08 * rr, 0.08 * rr, hh * 1.05, 6), mat: M.bark, pos: B((x + rx) / 2, (y + ry) / 2, hh / 2),
          rot: [-(Math.atan2(-(ry - y), hh) * 0.9), 0, -(Math.atan2(rx - x, hh) * 0.9)], scale: [1, 1, 1], shadow: near});
      }
    }
    const n = 5 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const s = U(1.0, 1.6) * rr;
      out.push({geo: pick(blobs), mat: pick([M.leaf, M.leaf2]), pos: B(x + U(-1.6, 1.6) * rr, y + U(-1.2, 1.2) * rr, h + U(-0.4, 1.0) * rr),
        scale: BS(s, s, s * U(0.55, 0.8)), shadow: near});
    }
  };
  const placed: [number, number, number, number][] = [[-2.6, 3.4, 5.5, 1.0], [2.9, 6.0, 6.0, 1.1], [-6.0, 5.0, 6.5, 1.2], [6.5, 4.0, 5.8, 1.1],
    [-0.6, 10.0, 6.8, 1.2], [4.0, 12.0, 6.5, 1.2], [-4.5, 13.0, 6.8, 1.2], [8.5, 9.0, 6.0, 1.1],
    [-9.0, 9.0, 6.4, 1.2], [1.5, 17.0, 7.0, 1.3], [-7.5, 19.0, 7.0, 1.3], [7.0, 18.0, 7.0, 1.3]];
  for (const [x, y, h, rr] of placed) tree(x, y, h, rr);
  for (let i = 0; i < 26; i++) tree(U(-22, 22), U(22, 40), U(6, 8), U(1.2, 1.6), false, false);
  for (let i = 0; i < 45; i++) {
    const s = U(3, 5);
    out.push({geo: pick(blobs), mat: pick([M.leaf, M.leaf2]), pos: B(U(-60, 60), U(45, 70), U(3, 6)), scale: BS(s, s, s * 0.7)});
  }
  for (const [cx, cy] of [[2.9, 3.7], [-4.2, 3.8], [5.5, 7.5]]) {
    for (let i = 0; i < 9; i++) {
      const h = U(5, 8);
      out.push({geo: cone(0.045, 0.04, h, 8), mat: M.bamboo, pos: B(cx + U(-0.4, 0.4), cy + U(-0.3, 0.3), h / 2),
        rot: [-U(-0.06, 0.06), 0, -U(-0.08, 0.08)], scale: [1, 1, 1], shadow: true});
    }
  }
  for (let i = 0; i < 40; i++) {
    const x = U(-9, 9), y = U(0.6, 18);
    if (Math.abs(x) < 2.2 && y < 3.5) continue;
    const s = U(0.15, 0.45);
    out.push({geo: pick(blobs), mat: pick([M.leaf2, M.dleaf]), pos: B(x, y, 0.05), scale: BS(s, s, s * 0.45), shadow: true});
  }
  for (let i = 0; i < 12; i++) {
    const s = U(5, 9);
    out.push({geo: pick(blobs), mat: M.cloud, pos: B(U(-50, 50), U(90, 120), U(18, 30)), scale: BS(s * 1.6, s, s * 0.5)});
  }
  // extra forest for the wide shot (added in part 2 of the Blender script)
  for (let i = 0; i < 40; i++) {
    const x = (r() < 0.5 ? -1 : 1) * U(14, 62);
    tree(x, U(3, 38), U(6, 8), U(1.1, 1.5), false, false);
  }
  return out;
};

const Jungle: React.FC = () => {
  const objs = useMemo(buildJungle, []);
  return (
    <group>
      {objs.map((o, i) => (
        <mesh key={i} geometry={o.geo} material={o.mat} position={o.pos} rotation={o.rot ?? [0, 0, 0]} scale={o.scale} castShadow={!!o.shadow} receiveShadow />
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- the dig site
const World: React.FC<{bf: number}> = ({bf}) => {
  const A = useMemo(() => {
    const soil = makeSoilTextures(11, 24, 16, 80);
    for (const t of [soil.map, soil.bumpMap, soil.roughnessMap]) t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
    const ground = makeGroundTextures(5, 1024, 8, 2600);
    for (const t of [ground.map, ground.bumpMap, ground.roughnessMap]) t.repeat.set(30, 30);
    const loose = makeLooseDirt(9);
    for (const t of [loose.map, loose.bumpMap]) t.repeat.set(4, 3);

    // front cut face: one big uneven plane, opened by the shader where tunnels are dug
    const front = makePlane(140, 60, 1120, 200, mat4([0, -30, 0]),
      (p) => {
        if (Math.abs(p.x) > 16 || p.y < -12) return 0;
        return -(fbm(p.x * 1.1 + 3, p.y * 1.1, 1, 4) * 0.08 + fbm(p.x * 6, p.y * 6, 2, 3) * 0.03) * Math.min(1, -p.y / 0.1);
      },
      (p) => [(p.x + 12) / 24, (p.y + 16) / 16]);
    const frontMat = new THREE.MeshStandardMaterial({map: soil.map, bumpMap: soil.bumpMap, bumpScale: 5, roughnessMap: soil.roughnessMap, roughness: 1});
    patchCut(frontMat, 'front');

    const top = new THREE.PlaneGeometry(140, 140, 1, 1);
    top.rotateX(-Math.PI / 2);
    top.translate(0, 0, -70);
    const topMat = new THREE.MeshStandardMaterial({map: ground.map, bumpMap: ground.bumpMap, bumpScale: 1.5, roughnessMap: ground.roughnessMap, roughness: 1, color: '#c8c8b8'});
    patchCut(topMat, 'top');

    const interiors = CUTS.map((_, i) => {
      const m = new THREE.MeshStandardMaterial({map: soil.map, roughness: 0.95, side: THREE.BackSide, color: '#d8c4bc'});
      patchCut(m, 'interior', i);
      return m;
    });
    const ductMat = new THREE.MeshStandardMaterial({map: soil.map, roughness: 0.95, side: THREE.BackSide, color: '#d8c4bc'});
    patchCut(ductMat, 'interior', -1);

    // grass
    const blade = new THREE.ConeGeometry(0.014, 0.2, 3);
    blade.translate(0, 0.1, 0);
    const N = 16000;
    const grass = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({roughness: 0.8}), N);
    const gr = mulberry32(5);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const col = new THREE.Color();
    const blocked = (x: number, y: number) =>
      (Math.abs(x) < 0.85 && y < 1.9) || (Math.abs(x - 1.5) < 0.6 && Math.abs(y - 0.55) < 0.6) || (Math.abs(x - 3.3) < 0.6 && Math.abs(y - 0.55) < 0.6) ||
      (Math.abs(x + 9.5) < 0.3 && y < 1.7) || (Math.abs(x - 7) < 0.45 && y < 1.7) || (Math.abs(x - 1.45) < 0.9 && Math.abs(y - 0.9) < 0.7);
    let n = 0;
    while (n < N) {
      const x = (gr() - 0.5) * 30;
      const y = gr() * gr() * 14 + 0.02;
      if (blocked(x, y)) continue;
      if (gr() > fbm(x * 0.8, y * 0.8, 3, 3) * 1.7) continue;
      e.set((gr() - 0.5) * 0.6 + (y < 0.15 ? -0.5 : 0), gr() * 6.28, (gr() - 0.5) * 0.6);
      q.setFromEuler(e);
      const s = 0.6 + gr() * 1.2;
      m4.compose(new THREE.Vector3(...B(x, y, -0.01)), q, new THREE.Vector3(s, s * (0.6 + gr() * 0.9), s));
      grass.setMatrixAt(n, m4);
      col.setHSL(0.2 + gr() * 0.07, 0.45 + gr() * 0.2, 0.13 + gr() * 0.1);
      grass.setColorAt(n, col);
      n++;
    }
    grass.receiveShadow = true;

    const pileMat = new THREE.MeshStandardMaterial({map: loose.map, bumpMap: loose.bumpMap, bumpScale: 6, roughness: 1, color: '#d0a090'});
    const hangMat = new THREE.MeshStandardMaterial({map: soil.map, roughness: 1});
    const leafR = rand(21);
    const leaves = Array.from({length: 22}).map(() => ({
      p: [uni(leafR, -0.75, 0.75), uni(leafR, 0.05, 1.7), 0.1] as V3,
      r: uni(leafR, 0.12, 0.22),
      m: [M.leaf2, M.dleaf, M.leaf][Math.floor(leafR() * 3)],
      rot: uni(leafR, 0, 6.3),
    }));
    const smokeR = rand(31);
    const ksmoke = Array.from({length: 14}).map(() => ({ex: uni(smokeR, -3, 3), ey: uni(smokeR, 1, 7), sx: uni(smokeR, 1, 1.6), sy: uni(smokeR, 1, 1.6)}));
    const mist = Array.from({length: 10}).map(() => ({x: -9.5 + uni(smokeR, -5, 5), y: uni(smokeR, 2, 12), sx: uni(smokeR, 1.5, 2.6), sy: uni(smokeR, 1.5, 2.6)}));
    const gasR = rand(41);
    const gas = Array.from({length: 12}).map(() => ({stop: 5.95 + uni(gasR, 0, 0.8), dz: uni(gasR, -0.3, 0.3)}));
    const stuckR = rand(51);
    const stuck: [number, number[]][] = [];
    for (let f = 1336; f < 1524; f += 5) stuck.push([f, [uni(stuckR, -0.03, 0.03), uni(stuckR, -0.05, 0.08), R(uni(stuckR, -170, -40)), R(uni(stuckR, -170, -40)), R(uni(stuckR, -25, 25)), R(uni(stuckR, -25, 25))]]);
    const pileGeo = new THREE.SphereGeometry(1, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    {
      const ps = pileGeo.attributes.position as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let i = 0; i < ps.count; i++) {
        v.fromBufferAttribute(ps, i);
        const n = fbm(v.x * 2 + 5, v.z * 2 + v.y * 2, 50, 3);
        const n2 = fbm(v.x * 9 + 1, v.z * 9 + v.y * 9, 51, 3);
        const rr = 0.8 + n * 0.4 + (n2 - 0.5) * 0.18;
        v.set(v.x * rr, v.y * (0.75 + n * 0.5 + (n2 - 0.5) * 0.3), v.z * rr);
        ps.setXYZ(i, v.x, v.y, v.z);
      }
      pileGeo.computeVertexNormals();
    }
    const hardMat = new THREE.MeshStandardMaterial({map: soil.map, bumpMap: soil.bumpMap, bumpScale: 4, roughness: 0.95, color: '#e0b8a0'});
    return {pileGeo, hardMat, front, frontMat, top, topMat, interiors, ductMat, grass, pileMat, hangMat, leaves, ksmoke, mist, gas, stuck, blob: blob(99)};
  }, []);

  // ---- update dug rectangles (uniform slot i = cut i; zero-size when not dug yet)
  const rects = CUTS.map((c) => cutRect(c, bf));
  rects.forEach((r, i) => {
    if (!r) cutU.uRects.value[i].set(0, 0, 0, 0);
    else cutU.uRects.value[i].set(r[0], r[2], r[1], r[3]);
  });
  cutU.uCount.value = CUTS.length;

  // ---- digger
  const dx = trk(bf, [[1, 0], [395, 0.1], [445, 3.6], [584, 3.0], [700, 2.6], [730, -2.2]]);
  const dsc = trkV(bf, [[1, [0, 0, 0]], [26, [0, 0, 0]], [32, [1, 1, 1]], [160, [1, 1, 1]], [170, [1, 1, 0.78]], [270, [1, 1, 0.78]], [280, [1, 1, 1]],
    [395, [1, 1, 1]], [402, [1.05, 1.05, 0.6]], [452, [1.05, 1.05, 0.6]], [458, [0, 0, 0]], [584, [0, 0, 0]], [588, [1.05, 1.05, 0.6]],
    [700, [1.05, 1.05, 0.6]], [736, [1, 1, 0.66]], [900, [1, 1, 0.66]], [904, [0, 0, 0]]]) as V3;
  const segs: [number, number, number][] = [[32, 150, 7], [283, 372, 7], [402, 440, 6]];

  const lidZ = trk(bf, [[156, 3], [170, 0], [173, 0.08], [176, 0]]);
  const lidS = trk(bf, [[156, 0], [160, 1]]);
  const pileS = trkV(bf, [[1, [0, 0, 0]], [14, [0.15, 0.12, 0.05]], [56, [0.75, 0.55, 0.32]], [470, [0.75, 0.55, 0.32]], [540, [0.08, 0.06, 0.02]]]);
  const stuckV = bf >= 1336 ? trkV(bf, A.stuck) : [0, 0, R(-90), R(-90), 0, 0];

  return (
    <group>
      <mesh geometry={A.front} material={A.frontMat} receiveShadow />
      <mesh geometry={A.top} material={A.topMat} receiveShadow />
      {CUTS.map((c, i) => {
        const r = rects[i];
        if (!r || r[1] - r[0] < 0.002 || r[3] - r[2] < 0.002) return null;
        const [x0, x1, z0, z1] = r;
        return <mesh key={i} geometry={G.box} material={A.interiors[i]} position={[(x0 + x1) / 2, (z0 + z1) / 2, -0.8]} scale={[x1 - x0, z1 - z0, 1.6]} receiveShadow />;
      })}
      {/* closed smoke duct for the FPV shot */}
      {bf > 746 && bf < 900 && <mesh geometry={G.box} material={A.ductMat} position={B((-9.6 - 2.97) / 2, 0.85, -1.22)} scale={[6.63, 0.65, 1.1]} />}
      <primitive object={A.grass} />
      <Jungle />

      {/* hardened clay walls */}
      {([[-0.6, -0.52, 0.0, 1.6, 3.2], [-0.6, 0.6, 1.52, 1.6, 3.2], [0.52, 0.6, 0.0, 1.6, 2.05]] as number[][]).map(([xa, xb, ya, yb, d], i) => {
        const h = d * trk(bf, [[300, 0], [340, 1]]);
        if (h < 0.01) return null;
        return <mesh key={i} geometry={G.box} material={A.hardMat} position={B((xa + xb) / 2, (ya + yb) / 2, -h / 2)} scale={[xb - xa, h, yb - ya]} receiveShadow />;
      })}

      {/* spoil pile */}
      {pileS[0] > 0.001 && <mesh geometry={A.pileGeo} material={A.pileMat} position={B(1.45, 0.9, -0.02)} scale={BS(pileS[0], pileS[1], pileS[2] * 1.6)} castShadow receiveShadow />}

      {/* lid, leaves, outline */}
      {lidS > 0.001 && (
        <group position={B(0, 0, lidZ)} scale={lidS}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} geometry={G.box} material={M.wood} position={B(-0.72 + i * 0.29 + 0.135, 0.875, 0.04)} scale={[0.27, 0.08, 1.75]} castShadow receiveShadow />
          ))}
        </group>
      )}
      {A.leaves.map((l, i) => {
        const s = pop(bf, 174 + i);
        if (s <= 0) return null;
        return <mesh key={i} geometry={G.ico2} material={l.m} position={B(...l.p)} rotation={[0, l.rot, 0]} scale={[l.r * s, l.r * 0.25 * s, l.r * s]} castShadow />;
      })}
      <Outline w={1.7} h={1.95} loc={[0, 0.88, 0.16]} plane="ground" s={trk(bf, [[196, 0], [201, 1.08], [204, 1], [226, 1], [231, 0]])} />
      <Outline w={1.3} h={3.3} loc={[0, -0.02, -1.6]} plane="front" s={trk(bf, [[342, 0], [347, 1.06], [350, 1], [372, 1], [377, 0]])} />
      <Outline w={0.95} h={1.9} loc={[5.4, -0.02, -3.0]} plane="front" s={trk(bf, [[1038, 0], [1043, 1.08], [1046, 1], [1066, 1], [1070, 0]])} />

      {/* people */}
      <ManWithShovel pos={[dx, 0.8, BOT]} rotZ={R(90)} scale={dsc} cloth={M.black} hat="cone" legs={[0, 0]}
        arms={[digAng(bf, segs, -60, 10), digAng(bf, segs, -80, 20)]} />
      {[[2.0, 0], [2.9, 14]].map(([y, d]) => (
        <Man key={'a' + y} pos={[trk(bf, [[58 + d, -7], [168 + d, 7]]), y, 0]} rotZ={R(90)} scale={[1, 1, 1]} cloth={M.olive} hat="helmet" pack
          legs={[walkAng(bf, 58 + d, 168 + d, 1), walkAng(bf, 58 + d, 168 + d, -1)]} arms={[walkAng(bf, 58 + d, 168 + d, -1), walkAng(bf, 58 + d, 168 + d, 1)]} />
      ))}
      {[[0.05, 0], [0.75, 10]].map(([x, d]) => {
        const s = trk(bf, [[176 + d, 0], [178 + d, 1]]);
        return (
          <Man key={'b' + x} pos={[x, trk(bf, [[176 + d, 0.15], [262 + d, 8.5]]), trk(bf, [[176 + d, 0.06], [262 + d, 0]])]} rotZ={R(180)} scale={[s, s, s]}
            cloth={M.olive} hat="helmet" pack legs={[walkAng(bf, 178 + d, 262 + d, 1), walkAng(bf, 178 + d, 262 + d, -1)]}
            arms={[walkAng(bf, 178 + d, 262 + d, -1), walkAng(bf, 178 + d, 262 + d, 1)]} />
        );
      })}
      {(() => {
        const s = trk(bf, [[455, 0], [458, 1]]);
        const p = trkV(bf, [[455, [0.1, 0.8, -0.6]], [470, [0.3, 0.9, 0]], [545, [4.2, 4.6, 0]]]) as V3;
        return <Man pos={p} rotZ={R(-60)} scale={[s, s, s]} cloth={M.black} hat="cone" basket legs={[walkAng(bf, 470, 545, 1), walkAng(bf, 470, 545, -1)]} arms={[R(170), R(170)]} />;
      })()}
      {(() => {
        const s = trk(bf, [[886, 0], [890, 1], [1070, 1], [1074, 0]]);
        return <Man pos={[7.75, 0.9, 0]} rotZ={R(-90)} scale={[s, s, s]} cloth={M.olive} hat="helmet" pack legs={[0, 0]} arms={[R(-60), R(-60)]} />;
      })()}
      {(() => {
        const s = trk(bf, [[1296, 0], [1299, 1.3]]);
        const z = trk(bf, [[1316, 0], [1324, 0.45], [1332, -1.05]]);
        return <Man pos={[7.0 + stuckV[0], 0.8, z + stuckV[1]]} rotZ={0} scale={[s, s, s]} cloth={M.olive} hat="helmet" pack legs={[0, 0]}
          arms={[stuckV[2], stuckV[3]]} armsZ={[stuckV[4], stuckV[5]]} />;
      })()}
      {[[2.4, 0], [3.1, 10]].map(([y, d]) => {
        const s = trk(bf, [[1418 + d, 0], [1420 + d, 1]]);
        return <Man key={'v' + y} pos={[trk(bf, [[1418 + d, -4], [1524, 3]]), y, 0]} rotZ={R(90)} scale={[s, s, s]} cloth={M.black} hat="cone"
          legs={[walkAng(bf, 1420 + d, 1524, 1), walkAng(bf, 1420 + d, 1524, -1)]} arms={[walkAng(bf, 1420 + d, 1524, -1), walkAng(bf, 1420 + d, 1524, 1)]} />;
      })}

      {/* explosions */}
      <Explosion f={bf} loc={[-2.0, 7.0, 0.2]} f0={6} size={1.4} seed={1} />
      <Explosion f={bf} loc={[2.6, 4.0, 0.2]} f0={250} size={1.5} seed={2} />

      {/* lamps */}
      <Lamp f={bf} loc={[2.2, 0.9, -2.25]} f0={430} energy={60} />
      <Lamp f={bf} loc={[-2.0, 0.9, -2.2]} f0={728} energy={20} />
      <Lamp f={bf} loc={[10.0, 0.9, -2.2]} f0={1150} energy={18} />
      <Lamp f={bf} loc={[3.5, 0.9, -5.75]} f0={1180} energy={18} />
      <Lamp f={bf} loc={[-4.8, 0.9, -5.75]} f0={1203} energy={18} />
      <Lamp f={bf} loc={[-6.5, 0.9, -4.85]} f0={1130} energy={12} />
      <Lamp f={bf} loc={[6.0, 0.9, -4.85]} f0={1132} energy={12} />

      {/* S7 termite mounds + air arrows */}
      {[1.5, 3.3].map((x, i) => {
        const s = pop(bf, 655 + i * 8);
        return s > 0 ? (
          <mesh key={x} material={M.clay} position={B(x, 0.55, 0.5)} scale={s} castShadow receiveShadow>
            <cylinderGeometry args={[0.06, 0.42, 1.1, 14]} />
          </mesh>
        ) : null;
      })}
      {[1.5, 3.3].flatMap((x, i) => [0, 1].map((kk) => (
        <Arrow key={`air${i}${kk}`} f={bf} path={[[x, -0.15, 1.3], [x, -0.15, 0.2], [x, -0.15, -1.9]]} f0={680 + kk * 14 + i * 6} step={14} />
      )))}

      {/* S8 kitchen */}
      {pop(bf, 726) > 0 && <mesh geometry={G.box} material={M.boot} position={B(-3.075, 0.8, -3.025)} scale={[0.55 * pop(bf, 726), 0.35, 0.5]} />}
      {pop(bf, 730) > 0 && (
        <mesh material={M.metal} position={B(-3.07, 0.8, -2.75)} scale={pop(bf, 730)}>
          <cylinderGeometry args={[0.17, 0.17, 0.2, 14]} />
        </mesh>
      )}
      {pop(bf, 728) > 0 && <mesh geometry={G.ico2} material={M.fire} position={B(-3.07, 0.6, -2.95)} scale={0.1 * pop(bf, 728)} />}
      {A.ksmoke.map((s, i) => {
        const f0 = 742 + i * 4;
        if (bf < f0 || bf > 915) return null;
        const p = trkV(bf, [[f0, [-3.06, 0.8, -2.6]], [f0 + 10, [-3.06, 0.8, -1.22]], [f0 + 60, [-9.5, 0.8, -1.22]], [f0 + 72, [-9.5, 0.8, 0.25]], [f0 + 110, [-9.5 + s.ex, s.ey, 0.3]]]);
        const sc = trkV(bf, [[f0, [0.08, 0.08, 0.08]], [f0 + 72, [0.08, 0.08, 0.08]], [f0 + 110, [s.sx, s.sy, 0.22]], [905, [1.2, 1.2, 0.22]], [915, [0, 0, 0]]]);
        return <mesh key={i} geometry={G.ico3} material={M.ksmoke} position={B(p[0], p[1], p[2])} scale={BS(sc[0], sc[1], sc[2])} />;
      })}
      {A.mist.map((m, i) => {
        const s = trk(bf, [[815 + i * 3, 0], [850 + i * 3, 1], [905, 1], [915, 0]]);
        return s > 0.001 ? <mesh key={i} geometry={G.ico3} material={M.mist} position={B(m.x, m.y, 0.35)} scale={BS(m.sx * s, m.sy * s, 0.25 * s)} /> : null;
      })}
      {bf > 762 && bf < 818 && <FpvLight intensity={trk(bf, [[762, 0], [766, 1], [815, 1], [818, 0]])} />}

      {/* gas attack + U-bend */}
      {(() => {
        const h = trk(bf, [[998, 0.001], [1008, 1.38]]);
        return h > 0.01 ? <mesh geometry={G.box} material={A.hangMat} position={B(5.4, 0.8, -2.1 - h / 2)} scale={[0.36, h, 1.6]} /> : null;
      })()}
      {(() => {
        const h = trk(bf, [[1005, 0.001], [1025, 0.72]]);
        return h > 0.01 ? <mesh geometry={G.box} material={M.water} position={B(5.4, 0.8, -3.95 + h / 2)} scale={[0.88, h, 1.6]} /> : null;
      })()}
      {pop(bf, 890, 1070) > 0 && <mesh geometry={G.box} material={M.can} position={B(8.15, 0.8, 0.275)} scale={[0.4 * pop(bf, 890, 1070), 0.55, 0.4]} castShadow />}
      {pop(bf, 892, 1070) > 0 && (
        <mesh material={M.boot} position={B(7.25, 0.9, 0.35)} rotation={[0, 0, -R(70)]} scale={pop(bf, 892, 1070)}>
          <cylinderGeometry args={[0.035, 0.035, 0.6, 8]} />
        </mesh>
      )}
      {A.gas.map((g, i) => {
        const f0 = 905 + i * 3;
        if (bf < f0) return null;
        const p = trkV(bf, [[f0, [7.0, 0.8, 0.2]], [f0 + 18, [7.0, 0.8, -2.6]], [f0 + 40, [g.stop, 0.8, -2.6 + g.dz]], [1028, [g.stop - 0.25, 0.8, -2.55]], [1036, [g.stop - 0.15, 0.8, -2.6]]]);
        const s = 0.26 * trk(bf, [[f0 - 1, 0], [f0, 1], [1075, 1], [1085, 0]]);
        return s > 0.001 ? <mesh key={i} geometry={G.ico3} material={M.gas} position={B(p[0], p[1], p[2])} scale={s} /> : null;
      })}
      {[0, 1, 2].map((kk) => (
        <Arrow key={'g' + kk} f={bf} path={[[7.0, -0.15, 0.9], [7.0, -0.15, -2.6], [5.9, -0.15, -2.6]]} f0={910 + kk * 10} step={16} />
      ))}

      {/* S11 rooms */}
      {[9.6, 10.4].map((x) => pop(bf, 1152) > 0 && (
        <mesh key={x} material={M.metal} position={B(x, 0.8, -3.05)} scale={pop(bf, 1152)}>
          <cylinderGeometry args={[0.16, 0.16, 0.22, 12]} />
        </mesh>
      ))}
      {[2.3, 3.3, 4.3].map((x, i) => {
        const s = pop(bf, 1180 + i * 3);
        return s > 0 ? <mesh key={x} geometry={G.box} material={M.bed} position={B(x, 0.8, -6.725)} scale={[0.7 * s, 0.35 * s, 0.8]} /> : null;
      })}
      {[-6.0, -5.0, -4.0].map((x, i) => {
        const s = pop(bf, 1203 + i * 3);
        return s > 0 ? (
          <mesh key={x} material={M.straw} position={B(x + 0.35, 0.8, -6.35)} rotation={[0, 0, -R(90)]} scale={s}>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 6]} />
          </mesh>
        ) : null;
      })}
    </group>
  );
};

const FpvLight: React.FC<{intensity: number}> = ({intensity}) => {
  const {camera} = useThree();
  return <pointLight position={camera.position.clone()} intensity={intensity * 3} distance={8} decay={1.5} color="#ffb070" />;
};

const Lights: React.FC<{night: number}> = ({night}) => (
  <>
    <hemisphereLight args={['#d8e6f5', '#4a3020', 0.75 * (1 - night) + 0.1 * night]} />
    <directionalLight
      position={B(-7.7, -13.3, 12.9)}
      intensity={3.0 * (1 - night) + 0.25 * night}
      color="#ffe2bd"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-14}
      shadow-camera-right={14}
      shadow-camera-top={14}
      shadow-camera-bottom={-14}
      shadow-camera-near={1}
      shadow-camera-far={60}
      shadow-bias={-0.0004}
      shadow-normalBias={0.03}
    />
    {night > 0.01 && <directionalLight position={B(6, -12.8, 14.1)} intensity={0.9 * night} color="#8098ff" />}
  </>
);

export const CuChi: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const bf = frame + 1;
  const night = NIGHT(bf);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: true, preserveDrawingBuffer: true}} camera={{fov: 58.7, near: 0.05, far: 900}}>
        <CameraRig bf={bf} />
        <Sky night={night} />
        <Lights night={night} />
        <World bf={bf} />
      </ThreeCanvas>
      <Captions frame={frame} />
      <Audio src={staticFile('cuchi_sfx.wav')} />
    </AbsoluteFill>
  );
};
