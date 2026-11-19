import * as THREE from 'three';
import {useMemo, useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {makeGroundTextures, makeLooseDirt, makeSoilTextures, TexSet} from './textures';
import {makePlane, mat4, patchDiscard} from './geo';
import {fbm, mulberry32} from './noise';
import {BACK_Z, BOTTOM, CYCLE, FRONT_Z, HALF_W, HOLE_HW, HOLE_X, HOLE_Z0, MAX_DEPTH, PILE} from './constants';
import {Jungle} from './Jungle';
import {Digger} from './Digger';

const FOG = '#a7b3a0';

const depthAt = (frame: number) => {
  const cyc = frame / CYCLE;
  const i = Math.floor(cyc);
  const p = cyc - i;
  // depth grows in steps: each shovel bite (around phase 0.3) removes soil
  const bite = interpolate(p, [0.2, 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return 0.55 + ((i + bite) / (120 / CYCLE)) * 2.0;
};

const CameraRig: React.FC<{frame: number}> = ({frame}) => {
  const {camera} = useThree();
  useLayoutEffect(() => {
    const t = interpolate(frame, [0, 119], [0, 1], {easing: Easing.inOut(Easing.sin)});
    const from = new THREE.Vector3(5.4, 4.6, 12.8);
    const to = new THREE.Vector3(3.1, 2.7, 8.2);
    const tFrom = new THREE.Vector3(-0.2, -0.7, 0.4);
    const tTo = new THREE.Vector3(-0.5, -1.0, 1.0);
    camera.position.lerpVectors(from, to, t);
    camera.lookAt(new THREE.Vector3().lerpVectors(tFrom, tTo, t));
    (camera as THREE.PerspectiveCamera).fov = 40;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [frame, camera]);
  return null;
};

const SceneSetup: React.FC = () => {
  const {scene, gl} = useThree();
  useLayoutEffect(() => {
    scene.background = new THREE.Color(FOG);
    scene.fog = new THREE.FogExp2(FOG, 0.03);
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [scene, gl]);
  return null;
};

const soilMat = (t: TexSet, bump = 5, tint = '#ffffff') =>
  new THREE.MeshStandardMaterial({map: t.map, bumpMap: t.bumpMap, bumpScale: bump, roughnessMap: t.roughnessMap, roughness: 1, color: tint});

const World: React.FC<{frame: number}> = ({frame}) => {
  const depth = depthAt(frame);
  const assets = useMemo(() => {
    const uDepth = {value: 0.5};
    const front = makeSoilTextures(11, 7, 7, 150);
    const side = makeSoilTextures(23, 5, 7, 150);
    const ground = makeGroundTextures(5);
    const loose = makeLooseDirt(9);

    // --- front cut face (displaced, uneven) ---
    const edgeFade = (p: THREE.Vector3) => Math.min(1, -p.y / 0.15, (HALF_W - p.x) / 0.15 + 0.0);
    const frontGeo = makePlane(7, 7, 240, 240, mat4([0, BOTTOM / 2, FRONT_Z]),
      (p) => {
        const n = (fbm(p.x * 1.1 + 3, p.y * 1.1, 1, 4) - 0.5) * 0.22 + (fbm(p.x * 5, p.y * 5, 2, 3) - 0.5) * 0.07 + (fbm(p.x * 16, p.y * 16, 3, 2) - 0.5) * 0.02;
        return n * Math.max(0, edgeFade(p));
      },
      (p) => [(p.x + HALF_W) / 7, (p.y - BOTTOM) / 7]);
    const frontMat = soilMat(front);
    patchDiscard(frontMat, uDepth, `abs(vWPos.x - (${HOLE_X.toFixed(3)})) < ${HOLE_HW.toFixed(3)} && vWPos.y > -uDepth`);

    // --- right side cut face ---
    const sideGeo = makePlane(5, 7, 170, 240, mat4([HALF_W, BOTTOM / 2, (FRONT_Z + BACK_Z) / 2], [0, Math.PI / 2, 0]),
      (p) => {
        const f = Math.max(0, Math.min(1, -p.y / 0.15, (FRONT_Z - p.z) / 0.15));
        return ((fbm(p.z * 1.1, p.y * 1.1, 4, 4) - 0.5) * 0.22 + (fbm(p.z * 5, p.y * 5, 5, 3) - 0.5) * 0.07 + (fbm(p.z * 16, p.y * 16, 6, 2) - 0.5) * 0.02) * f;
      },
      (p) => [(FRONT_Z - p.z) / 5, (p.y - BOTTOM) / 7]);
    const sideMat = soilMat(side);

    // --- top (jungle floor on the block) ---
    const topGeo = makePlane(7, 5, 210, 150, mat4([0, 0, (FRONT_Z + BACK_Z) / 2], [-Math.PI / 2, 0, 0]),
      (p) => {
        const edge = Math.max(0, Math.min(1, (FRONT_Z - p.z) / 0.25, (HALF_W - p.x) / 0.25));
        const hx = Math.max(0, Math.abs(p.x - HOLE_X) - HOLE_HW);
        const hz = Math.max(0, HOLE_Z0 - p.z);
        const hole = Math.min(1, Math.hypot(hx, hz) / 0.2);
        return (fbm(p.x * 1.3, p.z * 1.3, 7, 4) - 0.4) * 0.08 * edge * hole;
      },
      (p) => [p.x / 3.5, p.z / 3.5]);
    const topMat = soilMat(ground, 1.4);
    patchDiscard(topMat, uDepth, `abs(vWPos.x - (${HOLE_X.toFixed(3)})) < ${HOLE_HW.toFixed(3)} && vWPos.z > ${HOLE_Z0.toFixed(3)}`);

    // --- jungle floor beyond the block ---
    const farGround = makeGroundTextures(6, 512, 8, 900);
    for (const t of [farGround.map, farGround.bumpMap, farGround.roughnessMap]) t.repeat.set(40, 20);
    const farGeo = new THREE.PlaneGeometry(160, 80, 1, 1);
    farGeo.rotateX(-Math.PI / 2);
    farGeo.translate(0, 0, BACK_Z - 40);
    const farMat = soilMat(farGround, 1);

    // step cut faces left/right of the block, so the ground does not float
    const stepMat = soilMat(side);

    // --- hole walls (full depth; front face hides the undug part) ---
    const wallDisp = (s: number) => (p: THREE.Vector3) => (fbm(p.x * 4 + p.z * 4, p.y * 4, s, 4) - 0.5) * 0.07 * Math.min(1, -p.y / 0.08);
    const uvFront = (p: THREE.Vector3): [number, number] => [(p.x + HALF_W) / 7, (p.y - BOTTOM) / 7];
    const uvSideways = (p: THREE.Vector3): [number, number] => [(p.z + 2) / 7, (p.y - BOTTOM) / 7];
    const hd = FRONT_Z - HOLE_Z0;
    const walls = [
      makePlane(HOLE_HW * 2 + 0.2, MAX_DEPTH, 40, 110, mat4([HOLE_X, -MAX_DEPTH / 2, HOLE_Z0]), wallDisp(31), uvFront),
      makePlane(hd + 0.4, MAX_DEPTH, 40, 110, mat4([HOLE_X - HOLE_HW, -MAX_DEPTH / 2, HOLE_Z0 + hd / 2 + 0.05], [0, Math.PI / 2, 0]), wallDisp(32), uvSideways),
      makePlane(hd + 0.4, MAX_DEPTH, 40, 110, mat4([HOLE_X + HOLE_HW, -MAX_DEPTH / 2, HOLE_Z0 + hd / 2 + 0.05], [0, -Math.PI / 2, 0]), wallDisp(33), uvSideways),
    ];
    const wallMat = soilMat(front, 2.6, '#d8c8c0');
    wallMat.side = THREE.DoubleSide;
    patchDiscard(wallMat, uDepth, 'vWPos.y < -uDepth - 0.06');

    const floorGeo = makePlane(HOLE_HW * 2 + 0.2, hd + 0.4, 30, 30, mat4([HOLE_X, 0, HOLE_Z0 + hd / 2 + 0.05], [-Math.PI / 2, 0, 0]),
      (p) => (fbm(p.x * 5, p.z * 5, 40, 3) - 0.5) * 0.08, (p) => [p.x, p.z]);
    const floorMat = soilMat(loose, 3, '#d0b8a8');

    // --- spoil pile ---
    const pileGeo = new THREE.SphereGeometry(1, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    {
      const ps = pileGeo.attributes.position as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let i = 0; i < ps.count; i++) {
        v.fromBufferAttribute(ps, i);
        const n = fbm(v.x * 2 + 5, v.z * 2 + v.y * 2, 50, 3);
        const n2 = fbm(v.x * 9 + 1, v.z * 9 + v.y * 9, 51, 3);
        const r = 0.8 + n * 0.4 + (n2 - 0.5) * 0.18;
        v.set(v.x * r, v.y * (0.75 + n * 0.5 + (n2 - 0.5) * 0.3), v.z * r);
        ps.setXYZ(i, v.x, v.y, v.z);
      }
      pileGeo.computeVertexNormals();
    }
    const pileTex = {map: loose.map.clone(), bumpMap: loose.bumpMap.clone(), roughnessMap: loose.roughnessMap};
    for (const t of [pileTex.map, pileTex.bumpMap]) { t.repeat.set(5, 3); t.needsUpdate = true; }
    const pileMat = soilMat(pileTex, 8, '#c8a090');

    // --- clods ---
    const clodGeo = new THREE.DodecahedronGeometry(1, 0);
    const clodMat = new THREE.MeshStandardMaterial({map: loose.map, bumpMap: loose.bumpMap, bumpScale: 3, roughness: 0.95});
    const rnd = mulberry32(321);
    const restClods = Array.from({length: 70}).map(() => {
      const a = rnd() * Math.PI * 2;
      const d = 0.4 + rnd() * 0.75;
      return {
        p: [PILE.x + Math.cos(a) * d, 0.01, PILE.z + Math.sin(a) * d * 0.8] as [number, number, number],
        s: 0.02 + rnd() * 0.05,
        r: [rnd() * 3, rnd() * 3, rnd() * 3] as [number, number, number],
        appear: rnd() * 110,
      };
    });
    const throwClods = Array.from({length: 14}).map(() => ({
      dx: (rnd() - 0.5) * 0.5,
      dz: (rnd() - 0.5) * 0.5,
      s: 0.025 + rnd() * 0.04,
      delay: rnd() * 2,
      spin: rnd() * 10,
    }));

    // --- grass tufts on the block top and behind ---
    const bladeGeo = new THREE.ConeGeometry(0.008, 0.09, 3);
    bladeGeo.translate(0, 0.045, 0);
    const N = 14000;
    const grass = new THREE.InstancedMesh(bladeGeo, new THREE.MeshStandardMaterial({roughness: 0.75}), N);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const col = new THREE.Color();
    const gr = mulberry32(909);
    let placed = 0;
    while (placed < N) {
      const x = (gr() - 0.5) * 2 * (placed < 10000 ? HALF_W : 9);
      const z = placed < 10000 ? BACK_Z + gr() * (FRONT_Z - BACK_Z) : BACK_Z - gr() * 6;
      if (Math.abs(x - HOLE_X) < HOLE_HW + 0.12 && z > HOLE_Z0 - 0.12) continue;
      if (Math.hypot(x - PILE.x, (z - PILE.z) * 1.2) < 0.85) continue;
      const clump = fbm(x * 1.5, z * 1.5, 77, 3);
      if (gr() > clump * 1.6) continue;
      const nearFront = FRONT_Z - z < 0.1;
      e.set((gr() - 0.5) * 0.7 + (nearFront ? 0.5 : 0), gr() * 6.28, (gr() - 0.5) * 0.7);
      q.setFromEuler(e);
      const s = 0.5 + gr() * 1.3;
      m.compose(new THREE.Vector3(x, -0.01, z), q, new THREE.Vector3(s, s * (0.7 + gr() * 0.8), s));
      grass.setMatrixAt(placed, m);
      col.setHSL(0.2 + gr() * 0.08, 0.45 + gr() * 0.2, 0.16 + gr() * 0.12);
      grass.setColorAt(placed, col);
      placed++;
    }
    grass.receiveShadow = true;

    return {uDepth, frontGeo, frontMat, sideGeo, sideMat, topGeo, topMat, farGeo, farMat, stepMat, walls, wallMat, floorGeo, floorMat, pileGeo, pileMat, clodGeo, clodMat, restClods, throwClods, grass};
  }, []);

  assets.uDepth.value = depth;
  const progress = frame / 119;
  const cyc = frame / CYCLE;
  const phase = cyc - Math.floor(cyc);
  const pileS = 0.35 + 0.65 * progress;

  // Clods currently flying (spawned at phase ~0.72 of each stroke)
  const flying: {p: [number, number, number]; s: number; r: number}[] = [];
  for (let c = 0; c <= Math.floor(cyc); c++) {
    const t0 = c * CYCLE + 0.72 * CYCLE;
    const startY = -depthAt(t0) + 0.9;
    for (const k of assets.throwClods) {
      const t = (frame - t0 - k.delay) / 11;
      if (t < 0 || t > 1) continue;
      const sx = HOLE_X + 0.25, sz = 1.5;
      const ex = PILE.x + k.dx, ez = PILE.z + k.dz;
      const ey = 0.35 * pileS;
      const apex = 0.9;
      const y = startY + (ey - startY) * t + 4 * (apex + Math.max(0, ey - startY) * 0.0) * t * (1 - t) + (startY < 0 ? -startY * 4 * t * (1 - t) * 0.6 : 0);
      flying.push({p: [sx + (ex - sx) * t, y, sz + (ez - sz) * t], s: k.s, r: k.spin * t});
    }
  }

  const stepW = 20;
  return (
    <group>
      <mesh geometry={assets.frontGeo} material={assets.frontMat} receiveShadow />
      <mesh geometry={assets.sideGeo} material={assets.sideMat} receiveShadow />
      <mesh geometry={assets.topGeo} material={assets.topMat} receiveShadow />
      <mesh geometry={assets.farGeo} material={assets.farMat} receiveShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (HALF_W + stepW / 2), BOTTOM / 2, BACK_Z]} material={assets.stepMat} receiveShadow>
          <planeGeometry args={[stepW, -BOTTOM]} />
        </mesh>
      ))}
      {assets.walls.map((g, i) => (
        <mesh key={i} geometry={g} material={assets.wallMat} castShadow receiveShadow />
      ))}
      <mesh geometry={assets.floorGeo} material={assets.floorMat} position={[0, -depth, 0]} receiveShadow castShadow />
      <Digger phase={phase} position={[HOLE_X + 0.05, -depth, 1.5]} rotY={0.5} />
      <mesh geometry={assets.pileGeo} material={assets.pileMat} position={[PILE.x, -0.03, PILE.z]} scale={[0.72 * pileS, 0.42 * pileS, 0.6 * pileS]} castShadow receiveShadow />
      {assets.restClods.filter((c) => c.appear < frame).map((c, i) => (
        <mesh key={i} geometry={assets.clodGeo} material={assets.clodMat} position={c.p} rotation={c.r} scale={c.s} castShadow receiveShadow />
      ))}
      {flying.map((c, i) => (
        <mesh key={'f' + i} geometry={assets.clodGeo} material={assets.clodMat} position={c.p} rotation={[c.r, c.r * 0.7, 0]} scale={c.s} castShadow />
      ))}
      <primitive object={assets.grass} />
      <Jungle />
    </group>
  );
};

export const SoilScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: FOG}}>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: true, preserveDrawingBuffer: true}} camera={{fov: 40, near: 0.1, far: 120}}>
        <SceneSetup />
        <CameraRig frame={frame} />
        <hemisphereLight args={['#d6e4f0', '#5a3a24', 0.9]} />
        <directionalLight
          position={[-4, 9, 8]}
          intensity={3.2}
          color="#ffd7a6"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
          shadow-camera-near={1}
          shadow-camera-far={30}
          shadow-bias={-0.0004}
          shadow-normalBias={0.03}
          shadow-radius={4}
        />
        <directionalLight position={[6, 3, 4]} intensity={0.35} color="#b8c8ff" />
        <pointLight position={[HOLE_X + 0.2, -0.6, 2.6]} intensity={2.2} distance={4} decay={1.5} color="#ff9a66" />
        <World frame={frame} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
