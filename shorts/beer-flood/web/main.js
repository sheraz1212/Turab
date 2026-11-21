import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });
const M = {
  plank: texM(P.planks(1), 1, 6), beam: texM(P.beam(2), 1, 2), beamDark: texM(P.beam(3, [28, 36, 30]), 1, 2),
  rot: texM(P.rotten(4), 1, 1), rotB: texM(P.rotten(14), 1, 1),
  stone: texM(P.stone(4), 1, 1), stoneMoss: texM(P.mossy(P.stone(4), 5, 1.2), 1, 1),
  grass: texM(P.grass(6), 40, 40), dirt: texM(P.dirt(7), 6, 30), plaster: texM(P.plaster(8), 1, 1), plaster2: texM(P.plaster(18, 28), 1, 1),
  roof: texM(P.roof(9), 2, 2), marble: texM(P.marble(10), 1, 1), marbleTop: toon({ color: '#ece2cf' }),
  trunk: toon({ color: '#6a4a32' }), cypress: toon({ color: '#3f6b36' }), pine: toon({ color: '#5c8a3c' }), bush: toon({ color: '#6c9a42' }),
  hill: toon({ color: '#7aa64c' }), hillFar: toon({ color: '#86ad60' }), mount: toon({ color: '#8fa7b8' }), snow: toon({ color: '#f4f6fa' }),
  iron: toon({ color: '#5c5a57' }), bronze: toon({ color: '#b08a4a' }), wood: toon({ color: '#7a5434' }), door: toon({ color: '#5a3a24' }),
  window: toon({ color: '#2b2430' }), red: toon({ color: '#b8282b' }),
};
M.banner = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.banner()), alphaTest: 0.5, side: THREE.DoubleSide });
// helmet
const helmetIn = P.tex(P.helmetInside()); helmetIn.wrapS = helmetIn.wrapT = THREE.ClampToEdgeWrapping;
M.helmIn = new THREE.MeshToonMaterial({ gradientMap: grad, map: helmetIn, side: THREE.BackSide });
M.helmOut = toon({ color: '#8f8a7e' });

// ---------- ink / normal-depth contract ----------
const NOINK = 'noink'; // userData flag: never outlined (cards, fx, water handled specially)
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});
const waterNd = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,1.,.5,vD); }`,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);

// ---------- world ----------
// The Beer Flood, London 1814. Ground is y = 0 everywhere.
const DECK = 0;
const world = new THREE.Group(); scene.add(world);
const waterU = { t: { value: 0 }, deep: { value: new THREE.Color('#3a1f10') }, shal: { value: new THREE.Color('#6b3a1c') }, glint: { value: new THREE.Color('#e8cfa0') } };
const BRICK = texM(P.stone(21, 12, 42, 44, 64, 28), 1, 1), BRICK2 = texM(P.stone(22, 18, 30, 52, 64, 28), 1, 1);
const COBBLE = texM(P.stone(23, 30, 8, 56, 40, 30), 40, 40);
const STAVE = texM(P.planks(24), 1, 1); STAVE.map.rotation = 0;
const FLOOR = texM(P.planks(25), 6, 6);
const PANEL = texM(P.beam(26, [24, 34, 30]), 1, 1), GREENWALL = texM(P.plaster(27, 110), 1, 1), CREAM = texM(P.plaster(28, 42), 1, 1);
const SOOT = toon({ color: '#3b3438' }), WIN = toon({ color: '#263042' }), FRAME = toon({ color: '#ede4d2' }), FOAM = toon({ color: '#f1dfb8' });
const PORTER = toon({ color: '#5b3016' }), PORTER2 = toon({ color: '#3d1f0e', side: THREE.DoubleSide });
// cobbled ground
const ground = add(new THREE.PlaneGeometry(900, 900), COBBLE, 0, 0, 0, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
COBBLE.map.repeat.set(220, 220);

// ---- liquid (porter) shader: same toon-water idea, brown with foam streaks ----
const liquidMat = (flow = 1) => new THREE.ShaderMaterial({
  uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...waterU, flow: { value: flow } }, fog: true,
  vertexShader: `#include <fog_pars_vertex>
    varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
  fragmentShader: `#include <fog_pars_fragment>
    uniform float t, flow; uniform vec3 deep, shal, glint; varying vec3 vW;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
    void main(){ vec2 p = vW.xz*.45 + vec2(0., t*.5*flow);
      float n = noise(p)*.6 + noise(p*2.3+7.)*.4;
      vec3 c = mix(deep, shal, .3 + .5*n);
      float foam = smoothstep(.66, .74, noise(vW.xz*vec2(.9,.6) + vec2(t*.2, t*.7*flow)));
      c = mix(c, glint, foam*.8);
      gl_FragColor = vec4(c,1.);
      #include <fog_fragment>
    }`,
});
const hallPool = add(new THREE.CircleGeometry(1, 64), liquidMat(0.3), 0, 0, 0, world, { cast: false }); hallPool.rotation.x = -Math.PI / 2; hallPool.userData.nd = waterNd;
const crest = add(new THREE.CylinderGeometry(1, 1.06, 1, 64, 1, true), PORTER2, 0, 0, 0, world, { cast: false });
const crestFoam = add(new THREE.TorusGeometry(1, 0.12, 6, 64), FOAM, 0, 0, 0, world, { cast: false }); crestFoam.rotation.x = Math.PI / 2;
const streetPool = add(new THREE.PlaneGeometry(1, 1), liquidMat(-1.2), 0, 0, 0, world, { cast: false }); streetPool.rotation.x = -Math.PI / 2; streetPool.userData.nd = waterNd;
const streetCrest = add(new THREE.BoxGeometry(1, 1, 1), PORTER, 0, 0, 0, world, { cast: false });
const streetFoam = add(new THREE.BoxGeometry(1, 0.25, 1.2), FOAM, 0, 0, 0, world, { cast: false });

// ---- the vat house (open roof so the camera can crane in) ----
const hall = new THREE.Group(); world.add(hall);
const hallFloor = add(new THREE.PlaneGeometry(28, 13), FLOOR, 0, 0.02, -0.5, hall, { cast: false }); hallFloor.rotation.x = -Math.PI / 2;
for (const s of [-1, 1]) add(tbox(0.7, 9, 13.6, 2.4), BRICK, s * 14.3, 4.5, -0.6, hall);
const WALL_Z = -7.3;
add(tbox(8.3, 9, 0.7, 2.4), BRICK, -10.3, 4.5, WALL_Z, hall); add(tbox(12.3, 9, 0.7, 2.4), BRICK, 8.3, 4.5, WALL_Z, hall);
for (let x = -13; x <= 13; x += 3.2) add(tbox(0.4, 0.5, 14, 2), M.beam, x, 9.2, -0.6, hall);
// breakable middle of the back wall: brick chunks
const chunks = []; { const r = P.rng(71);
  for (let iy = 0; iy < 10; iy++) for (let ix = 0; ix < 8; ix++) {
    const c = add(tbox(0.98, 0.88, 0.7, 2.4), (ix + iy) % 3 ? BRICK : BRICK2, -5.6 + ix + 0.5, 0.45 + iy * 0.9, WALL_Z, hall);
    c.userData.base = c.position.clone();
    const ang = (r() - 0.5) * 1.6; c.userData.v = new THREE.Vector3(Math.sin(ang) * 6 + (ix - 3.5) * 0.6, 2 + r() * 4 - iy * 0.15, -(7 + r() * 7));
    c.userData.spin = new THREE.Vector3(r() * 6 - 3, r() * 6 - 3, r() * 6 - 3); c.userData.delay = Math.abs(ix - 3.5) * 1.2 + Math.abs(iy - 2) * 0.8 + r() * 2;
    c.userData.rest = 0.3 + r() * 0.5 * (iy < 4 ? 1.4 : 0.6);
    chunks.push(c);
  } }
// sign on the street side of the back wall (reads correctly from the street)
const signTex = P.tex(P.signBoard('HORSE SHOE BREWERY', '#2c3a2a', '#f1d98a'));
const sign = add(new THREE.PlaneGeometry(5.6, 0.9), toon({ map: signTex }), 5.2, 7.4, WALL_Z - 0.37, hall, { cast: false }); sign.rotation.y = Math.PI;
// vats: staves on pivots (so they can burst outward), hoops as two half-rings (so one can snap)
const vats = [];
const makeVat = (x, z, r, h, seed) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); hall.add(g);
  const n = 26, sw = 2 * Math.PI * r / n * 1.04, staves = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, piv = new THREE.Group(); piv.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); piv.rotation.y = -a + Math.PI / 2; g.add(piv);
    const tilt = new THREE.Group(); piv.add(tilt); add(tbox(sw, h, 0.28, 1.6), STAVE, 0, h / 2, 0, tilt);
    piv.userData.a = a; piv.userData.tilt = tilt; piv.userData.base = piv.position.clone(); staves.push(piv);
  }
  const hoops = [];
  for (let k = 0; k < 6; k++) {
    const y = 0.45 + k * (h - 0.8) / 5, hp = new THREE.Group(); hp.position.y = y; g.add(hp);
    const halves = [0, 1].map((j) => { const m = add(new THREE.TorusGeometry(r + 0.17, 0.11, 6, 40, Math.PI), M.iron, 0, 0, 0, hp); m.rotation.x = Math.PI / 2; m.rotation.z = j * Math.PI; return m; });
    hp.userData.y0 = y; hp.userData.halves = halves; hoops.push(hp);
  }
  const top = add(new THREE.CircleGeometry(r - 0.05, 48), toon({ color: '#3a1d0c' }), 0, h - 0.35, 0, g, { cast: false }); top.rotation.x = -Math.PI / 2;
  const froth = add(new THREE.TorusGeometry(r - 0.4, 0.22, 6, 40), FOAM, 0, h - 0.3, 0, g, { cast: false }); froth.rotation.x = Math.PI / 2;
  add(tbox(0.12, h + 0.4, 0.12, 1), M.wood, r + 0.5, (h + 0.4) / 2, 0.6, g); add(tbox(0.12, h + 0.4, 0.12, 1), M.wood, r + 0.5, (h + 0.4) / 2, -0.6, g);
  for (let y = 0.6; y < h; y += 0.6) add(tbox(0.08, 0.08, 1.3, 1), M.wood, r + 0.5, y, 0, g);
  const v = { g, r, h, staves, hoops, top, froth }; vats.push(v); return v;
};
const V1 = makeVat(-1.6, -3.2, 3.0, 6.7, 1), V2 = makeVat(6.2, -3.4, 2.4, 5.8, 2), V3 = makeVat(-9.0, -3.0, 2.3, 5.4, 3);
// sacks, barrels, a cart in the hall
const barrel = (x, z, s = 1, parent = hall) => { const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g); add(new THREE.CylinderGeometry(0.42 * s, 0.42 * s, 1.0 * s, 16), STAVE, 0, 0.5 * s, 0, g); for (const y of [0.2, 0.8]) { const h = add(new THREE.TorusGeometry(0.43 * s, 0.035 * s, 4, 20), M.iron, 0, y * s, 0, g); h.rotation.x = Math.PI / 2; } return g; };
[[10.5, 2.5], [11.4, 2.0], [10.9, 3.3], [-12, 2.6], [-11.2, 3.2]].forEach(([x, z]) => barrel(x, z));
for (const [x, z] of [[9.6, -0.4], [10.4, -0.2]]) { const s = add(new THREE.SphereGeometry(0.55, 10, 8), toon({ color: '#c9b48a' }), x, 0.45, z, hall); s.scale.set(1, 0.8, 0.8); }

// ---- St Giles street behind the brewery ----
const houses = [];
const townhouse = (x, z, w, floors, rotY, mat, seed) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; world.add(g);
  const h = floors * 3.0 + 0.6, r = P.rng(seed);
  add(tbox(w, h, 6, 2.4), mat, 0, h / 2, -3, g);
  add(tbox(w + 0.3, 0.4, 6.3, 2), SOOT, 0, h + 0.2, -3, g);
  for (let k = 0; k < 2; k++) { const cx = (k ? 1 : -1) * w * 0.32; add(tbox(1.1, 1.6, 0.8, 1.2), mat, cx, h + 1.1, -4.5, g); for (let j = 0; j < 3; j++) add(new THREE.CylinderGeometry(0.13, 0.15, 0.5, 8), toon({ color: '#b5653a' }), cx - 0.35 + j * 0.35, h + 2.1, -4.5, g); }
  for (let fl = 0; fl < floors; fl++) for (let i = 0; i < 2; i++) {
    const wx = (i ? 1 : -1) * w * 0.24, wy = 1.6 + fl * 3.0;
    if (fl === 0 && i === 0) continue;
    add(box(1.0, 1.5, 0.12), WIN, wx, wy, 0.04, g, { cast: false }); add(box(1.2, 0.14, 0.2), FRAME, wx, wy - 0.82, 0.08, g, { cast: false }); add(box(0.08, 1.5, 0.14), FRAME, wx, wy, 0.08, g, { cast: false });
  }
  add(box(1.0, 2.1, 0.12), M.door, -w * 0.24, 1.05, 0.04, g, { cast: false });
  // cellar window at the pavement ("area" well)
  const cw = add(box(1.4, 0.55, 0.14), toon({ color: '#141018' }), w * 0.24, 0.32, 0.06, g, { cast: false });
  for (let k = 0; k < 4; k++) add(box(0.06, 0.6, 0.18), M.iron, w * 0.24 - 0.55 + k * 0.37, 0.32, 0.12, g, { cast: false });
  g.userData.w = w; houses.push(g); return g;
};
{ // terrace row; one house is centred at x = 1.5 (width 6) so the cellar window sits at x = 2.94 and the candle window above it
  const r = P.rng(81), row = []; let x = -40;
  while (x < 40) { const w = 5 + r() * 2; row.push([x + w / 2, w, 3 + (r() < 0.4 ? 1 : 0), r() < 0.5 ? BRICK : BRICK2]); x += w + 0.05; }
  let best = 0; row.forEach((h, i) => { if (Math.abs(h[0] - 1.5) < Math.abs(row[best][0] - 1.5)) best = i; });
  const dx = 1.5 - row[best][0]; row[best][1] = 6;
  row.forEach((h, i) => { const cx = h[0] + dx + (i > best ? 0.5 : i < best ? -0.5 : 0); townhouse(cx, -21, h[1], h[2], 0, h[3], 90 + i); }); }
// side street fronts (left/right of the brewery) so the street is a canyon
for (const [x, s] of [[-17.5, 1], [17.5, -1]]) for (let k = 0; k < 2; k++) townhouse(x, -9.5 - k * 6.5 + 3, 6, 3, s * Math.PI / 2, BRICK2, 300 + k);
// distant London: rows of roofs, chimneys and a spire, softened by fog
{ const r = P.rng(91);
  for (let i = 0; i < 90; i++) { const a = r() * Math.PI * 2, d = 70 + r() * 220, w = 8 + r() * 14, h = 8 + r() * 10;
    const b = add(tbox(w, h, 8, 3), r() < 0.5 ? BRICK : BRICK2, Math.cos(a) * d, h / 2, Math.sin(a) * d, world, { cast: false }); b.rotation.y = r() * 3;
    add(tbox(1, 2.2, 1, 1), SOOT, b.position.x, h + 1.1, b.position.z, world, { cast: false }); }
  for (const [x, z, h] of [[-90, -160, 60], [120, -210, 48], [40, 190, 44]]) { add(tbox(8, h * 0.6, 8, 3), CREAM, x, h * 0.3, z, world, { cast: false }); add(new THREE.ConeGeometry(4.5, h * 0.5, 8), M.iron, x, h * 0.85, z, world, { cast: false }); }
}
// floating hat + barrel for the hook
const hat = new THREE.Group(); world.add(hat);
add(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 24), toon({ color: '#2e2a36' }), 0, 0, 0, hat); add(new THREE.CylinderGeometry(0.3, 0.32, 0.6, 24), toon({ color: '#2e2a36' }), 0, 0.3, 0, hat);
const floatBarrel = barrel(0, 0, 1, world);
// candles for the eight
const candles = []; for (let i = 0; i < 8; i++) { const c = add(new THREE.CylinderGeometry(0.05, 0.055, 0.26, 10), new THREE.MeshBasicMaterial({ color: '#fff2d6' }), 0, 0, 0, world); candles.push(c); }
// the cellar 'area' in front of one house: a dark well in the pavement (shown above the beer line)
const area = add(new THREE.PlaneGeometry(1.7, 1.0), toon({ color: '#120c10' }), 2.94, 0.01, -20.3, world, { cast: false }); area.rotation.x = -Math.PI / 2;
for (let k = 0; k < 6; k++) add(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), M.iron, 2.2 + k * 0.3, 0.45, -19.75, world);
add(new THREE.BoxGeometry(1.8, 0.05, 0.05), M.iron, 2.94, 0.9, -19.75, world);

// ---- the courtroom (far away at x = 200) ----
const COURT = new THREE.Vector3(200, 0, 0);
const court = new THREE.Group(); court.position.copy(COURT); world.add(court);
{ const fl = add(new THREE.PlaneGeometry(16, 14), FLOOR, 0, 0.02, 0, court, { cast: false }); fl.rotation.x = -Math.PI / 2;
  add(tbox(16, 9, 0.5, 3), GREENWALL, 0, 4.5, -6.5, court); for (const s of [-1, 1]) add(tbox(0.5, 9, 14, 3), GREENWALL, s * 8, 4.5, 0, court);
  add(tbox(16, 2.2, 0.55, 2), PANEL, 0, 1.1, -6.3, court);
  add(tbox(7, 2.4, 1.6, 2), PANEL, 0, 1.2, -4.6, court); add(tbox(7.6, 0.25, 2.0, 2), M.wood, 0, 2.45, -4.6, court);
  add(tbox(3.2, 4.6, 0.4, 2), toon({ color: '#7a2730' }), 0, 4.6, -6.1, court);
  add(box(2.2, 3.4, 0.1), WIN, -5.2, 5.0, -6.2, court); add(box(2.2, 3.4, 0.1), WIN, 5.2, 5.0, -6.2, court);
  add(tbox(4.4, 1.1, 1.6, 2), M.wood, 0, 0.55, 0.2, court);
  for (const x of [-4.5, 4.5]) add(tbox(4, 1.0, 0.6, 2), M.wood, x, 0.5, 3.2, court);
}
const paperTex0 = P.tex(P.paper('')), paperTex1 = P.tex(P.paper('ACT OF GOD'));
const paperMat = toon({ map: paperTex0 });
const paper = add(new THREE.PlaneGeometry(1.1, 0.8), paperMat, COURT.x + 0, 2.59, COURT.z - 4.1, world, { cast: false }); paper.rotation.x = -Math.PI / 2;
const exhibitA = barrel(COURT.x - 1.3, 0.2, 0.55, world); exhibitA.position.y = 1.1;
const hoopPieces = [0, 1].map((j) => { const m = add(new THREE.TorusGeometry(0.55, 0.06, 6, 24, Math.PI * 0.95), M.iron, COURT.x + 1.1 + j * 0.25, 1.16, 0.2 + j * 0.2, world); m.rotation.x = Math.PI / 2; m.rotation.z = j * 2.6; return m; });
const lab = (t, x, y, z) => { const m = add(new THREE.PlaneGeometry(0.9, 0.3), toon({ map: P.tex(P.signBoard(t, '#efe6cf', '#3a2a1e', 512, 160)) }), x, y, z, world, { cast: false }); m.rotation.x = -0.5; return m; };
lab('EXHIBIT A', COURT.x - 1.3, 1.14, 0.95); lab('EXHIBIT B', COURT.x + 1.2, 1.14, 0.95);

// ---- the tax office (x = 300) ----
const OFFICE = new THREE.Vector3(300, 0, 0);
const office = new THREE.Group(); office.position.copy(OFFICE); world.add(office);
{ const fl = add(new THREE.PlaneGeometry(14, 12), FLOOR, 0, 0.02, 0, office, { cast: false }); fl.rotation.x = -Math.PI / 2;
  add(tbox(14, 8, 0.5, 3), CREAM, 0, 4, -5.5, office); for (const s of [-1, 1]) add(tbox(0.5, 8, 12, 3), CREAM, s * 7, 4, 0, office);
  add(tbox(14, 1.4, 0.55, 2), PANEL, 0, 0.7, -5.3, office);
  add(tbox(4.6, 1.15, 2.0, 2), M.wood, 0, 0.58, -1.2, office);
  for (let i = 0; i < 6; i++) add(tbox(0.9, 0.25, 0.7, 1), toon({ color: ['#7a2a24', '#2a4a6a', '#3e5a2a'][i % 3] }), -5 + i * 0.95, 2.2 + (i % 2) * 0.05, -5.0, office);
  add(tbox(6, 0.12, 0.8, 1), M.wood, -2.6, 2.0, -5.0, office);
  add(box(2.4, 3.0, 0.1), WIN, 3.8, 4.4, -5.2, office);
}
const ledger = add(new THREE.PlaneGeometry(1.1, 0.75), toon({ map: P.tex(P.paper('DUTY REFUND\n£7,250', true)) }), OFFICE.x - 0.4, 1.17, OFFICE.z - 1.0, world, { cast: false }); ledger.rotation.x = -Math.PI / 2;
const bag = new THREE.Group(); world.add(bag);
{ const b = add(new THREE.SphereGeometry(0.42, 16, 12), toon({ color: '#b89a64' }), 0, 0.36, 0, bag); b.scale.set(1, 0.95, 1);
  add(new THREE.CylinderGeometry(0.12, 0.2, 0.26, 12), toon({ color: '#b89a64' }), 0, 0.82, 0, bag); add(new THREE.TorusGeometry(0.13, 0.04, 6, 16), toon({ color: '#6a4a2a' }), 0, 0.72, 0, bag).rotation.x = Math.PI / 2;
  const coin = add(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 16), toon({ color: '#e2b84a' }), 0, 0.8, 0.3, bag); coin.rotation.x = 1.2; }

// clouds: painted billboards far away (no fog, no ink)
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 16; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = r() * Math.PI * 2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 110 + r() * 150, Math.sin(a) * d); m.scale.setScalar(160 + r() * 140);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }

// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.006, .02, (ds - d)/d));                           // depth jump, near side only
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.012,.01,.014), e);
    if (flash < -0.5) c = vec3(e);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
    gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
// final copy with sRGB handled by the renderer output (we render to screen with linear->sRGB in the shader chunk)
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
  waterU.deep.value.set(L.waterDeep); waterU.shal.value.set(L.waterShal); waterU.glint.value.set(L.glint);
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

function worldState(W, f) {
  waterU.t.value = f / 30;
  // ---- vats: hoop slip, snap, burst ----
  const burst = (v, k) => {
    v.staves.forEach((piv) => {
      const a = piv.userData.a, back = 0.5 + 0.5 * Math.sin(a), st = Math.min(1, Math.max(0, k * 1.5 - (1 - back) * 0.45)), e = st * st;
      piv.position.copy(piv.userData.base).add(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(e * 2.6));
      piv.userData.tilt.rotation.x = e * 1.45;
    });
    v.hoops.forEach((hp, i) => { const e = Math.min(1, k * 1.3); hp.position.y = hp.userData.y0 - e * (hp.userData.y0 - 0.12) * Math.min(1, k); hp.scale.setScalar(1 + e * 0.35); hp.rotation.set(e * 0.3 * (i % 2 ? 1 : -1), 0, e * 0.2); hp.visible = k < 1.15; });
    v.top.position.y = Math.max(0.1, v.h - 0.35 - Math.min(1, k * 1.6) * v.h); v.froth.position.y = v.top.position.y + 0.05; v.top.visible = v.froth.visible = k < 0.7;
  };
  burst(V1, W.b1); burst(V2, W.b2); burst(V3, 0);
  const sh = V1.hoops[1]; if (W.b1 <= 0) { sh.position.y = sh.userData.y0 - W.slip * 0.3; sh.scale.setScalar(1); sh.rotation.set(0, 0, 0); sh.visible = true; }
  sh.userData.halves.forEach((m, j) => { const k = W.snap, s = j ? 1 : -1; m.position.set(s * k * 0.12, -k * 0.08, k * 0.45); m.rotation.y = s * k * 0.1; m.scale.setScalar(1 + k * 0.06); });
  // ---- back wall chunks ----
  for (const c of chunks) {
    const u = c.userData; c.position.copy(u.base); c.rotation.set(0, 0, 0);
    if (W.wallT <= 0) continue;
    let t = Math.max(0, W.wallT - u.delay / 30);
    const tl = (u.v.y + Math.sqrt(u.v.y * u.v.y + 2 * 9.8 * (u.base.y - u.rest))) / 9.8; if (t > tl) t = tl;
    c.position.set(u.base.x + u.v.x * t * 0.7, Math.max(u.rest, u.base.y + u.v.y * t - 4.9 * t * t), u.base.z + u.v.z * t * 0.7);
    c.rotation.set(u.spin.x * t, u.spin.y * t, u.spin.z * t);
  }
  // ---- porter: hall pool + crest, street pool + crest ----
  const P1 = W.hall; hallPool.visible = crest.visible = crestFoam.visible = P1.R > 0.05;
  hallPool.position.set(V1.g.position.x, P1.h, V1.g.position.z); hallPool.scale.setScalar(P1.R);
  crest.position.set(V1.g.position.x, P1.H / 2, V1.g.position.z); crest.scale.set(P1.R, P1.H, P1.R); crest.visible = crest.visible && P1.H > 0.05;
  crestFoam.position.set(V1.g.position.x, P1.H, V1.g.position.z); crestFoam.scale.set(P1.R, P1.R, 1); crestFoam.visible = crest.visible;
  const P2 = W.street, zs = WALL_Z - 0.4; streetPool.visible = P2.L > 0.05; streetCrest.visible = streetFoam.visible = P2.L > 0.05 && P2.H > 0.05;
  streetPool.position.set(P2.xc, P2.h, zs - P2.L / 2); streetPool.scale.set(P2.ex * 2, P2.L, 1);
  streetCrest.position.set(P2.xc, P2.H / 2, zs - P2.L); streetCrest.scale.set(P2.ex * 2, P2.H, 0.9);
  streetFoam.position.set(P2.xc, P2.H + 0.05, zs - P2.L); streetFoam.scale.set(P2.ex * 2, 1, 1);
  // ---- props ----
  hat.visible = floatBarrel.visible = !!W.float;
  if (W.float) { const b = Math.sin(f * 0.12) * 0.05; hat.position.set(W.float.hat[0], P2.h + 0.02 + b, W.float.hat[2]); hat.rotation.set(0.18 * Math.sin(f * 0.07), f * 0.004, 0.12 * Math.cos(f * 0.09));
    floatBarrel.position.set(W.float.barrel[0], P2.h - 0.45 + b * 0.6, W.float.barrel[2]); floatBarrel.rotation.set(Math.PI / 2, f * 0.003, 0.1); }
  candles.forEach((c, i) => { c.visible = !!W.candles; if (W.candles) c.position.set(W.candles[0] - 0.42 + i * 0.12, W.candles[1] + 0.13, W.candles[2] + 0.1); });
  area.position.y = P2.L > 0.05 ? P2.h + 0.015 : 0.01;
  paperMat.map = W.stamped ? paperTex1 : paperTex0;
  bag.visible = !!W.bag; if (W.bag) { bag.position.set(...W.bag.p); bag.rotation.set(0, W.bag.ry || 0, W.bag.rz || 0); }
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < DECK + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position);
  for (const c of clouds) c.quaternion.copy(camera.quaternion);
  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;
