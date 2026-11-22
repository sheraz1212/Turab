import * as THREE from './lib/three.module.js';
import { GLTFLoader } from './lib/GLTFLoader.js';
import * as T from './toon.js';
import * as P from './paint.js';

const W = 720, H = 1280;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 1500);
const rx = (a) => a * Math.PI / 180;
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0, ...o });
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

// ---------------- painted textures ----------------
const ballastTex = () => { const [c, g] = cv(512, 512), r = P.rng(3); g.fillStyle = '#5a5652'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { const l = 30 + r() * 45; g.fillStyle = `hsl(${25 + r() * 20},${6 + r() * 8}%,${l}%)`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 3 + r() * 7, 2 + r() * 5, r() * 3, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(r() * 512, r() * 512, 1.5, 1, 0, 0, 7); g.fill(); } return P.tex(c); };
const brickTex = (base = [12, 45, 36]) => { const [c, g] = cv(512, 512), r = P.rng(8); g.fillStyle = '#5a4a40'; g.fillRect(0, 0, 512, 512);
  for (let y = 0, row = 0; y < 512; y += 32, row++) for (let x = -(row % 2) * 32; x < 512; x += 64) { g.fillStyle = `hsl(${base[0] + r() * 8},${base[1]}%,${base[2] + r() * 10}%)`; g.fillRect(x + 2, y + 2, 60, 28); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + 2, y + 24, 60, 6); } return P.tex(c); };
const stoneEdgeTex = () => { const [c, g] = cv(512, 128), r = P.rng(9); g.fillStyle = '#8a8478'; g.fillRect(0, 0, 512, 128); for (let x = 0; x < 512; x += 96) { g.fillStyle = `hsl(40,8%,${48 + r() * 12}%)`; g.fillRect(x + 2, 2, 92, 124); } for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(r() * 512, r() * 128, 3, 2); } return P.tex(c); };
const wallpaperTex = () => { const [c, g] = cv(256, 256); g.fillStyle = '#5a1f2a'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#7a2f3a'; for (let y = 0; y < 256; y += 64) for (let x = (y / 64 % 2) * 32; x < 256; x += 64) { g.beginPath(); g.ellipse(x + 16, y + 32, 10, 22, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 16, y + 32, 22, 8, 0, 0, 7); g.fill(); }
  g.strokeStyle = '#c9962e66'; g.lineWidth = 2; for (let x = 0; x < 256; x += 64) { g.beginPath(); g.moveTo(x + 48, 0); g.lineTo(x + 48, 256); g.stroke(); } return P.tex(c); };
const carpetTex = () => { const [c, g] = cv(512, 512); g.fillStyle = '#8a1f24'; g.fillRect(0, 0, 512, 512); g.strokeStyle = '#e8b84a'; g.lineWidth = 10; g.strokeRect(24, 24, 464, 464); g.strokeStyle = '#1f2a4a'; g.lineWidth = 26; g.strokeRect(54, 54, 404, 404);
  g.fillStyle = '#1f2a4a'; g.beginPath(); g.ellipse(256, 256, 130, 90, 0, 0, 7); g.fill(); g.fillStyle = '#e8b84a'; g.beginPath(); g.ellipse(256, 256, 70, 46, 0, 0, 7); g.fill(); g.fillStyle = '#c8322f'; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; g.beginPath(); g.ellipse(256 + Math.cos(a) * 100, 256 + Math.sin(a) * 68, 12, 12, 0, 0, 7); g.fill(); } return P.tex(c); };
const glowTex = (col) => P.tex(P.radial(col, 1));
const fogTex = (() => { const [c, g] = cv(256, 128), r = P.rng(4); for (let i = 0; i < 40; i++) { const x = 40 + r() * 176, y = 40 + r() * 50, rr = 20 + r() * 40, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();

// ---------------- helpers ----------------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (a, b, h, n = 16) => new THREE.CylinderGeometry(a, b, h, n);
const MODELS = {};
const loader = new GLTFLoader();
const load = (n) => new Promise((res) => loader.load(`models/${n}/${n}.gltf`, (g) => { g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material) o.material.envMapIntensity = 0.6; } }); MODELS[n] = g.scene; res(); }, undefined, (e) => { console.log('model fail ' + n + ' ' + e); res(); }));
const put = (n, x, y, z, ry = 0, s = 1, parent = scene) => { if (!MODELS[n]) return null; const m = MODELS[n].clone(true); m.position.set(x, y, z); m.rotation.y = ry; m.scale.setScalar(s); parent.add(m); return m; };
const glows = []; const pLights = []; let ZONE = 'rail';
const glow = (x, y, z, size, col, k = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: k }));
  m.position.set(x, y, z); m.scale.setScalar(size); m.userData.k0 = k; m.userData.zone = ZONE; m.userData.ndSkip = true; m.renderOrder = 5; scene.add(m); glows.push(m); return m; };
const lamp = (x, y, z, col = '#ffb25a', I = 6, dist = 14, gs = 1.6) => { const l = new THREE.PointLight(col, I, dist, 1.6); l.position.set(x, y, z); scene.add(l); l.userData = { zone: ZONE, I0: I }; pLights.push(l); glow(x, y, z, gs, '255,190,110', 0.9); glow(x, y, z, gs * 0.3, '255,240,210', 1); return l; };

const NAMES = ['Barrel_01', 'wooden_crate_01', 'wooden_crate_02', 'Lantern_01', 'vintage_oil_lamp', 'street_lamp_01', 'wooden_barrels_01', 'rusted_spade_01', 'sledgehammer_01', 'wooden_bucket_01', 'painted_wooden_bench', 'wooden_ladder', 'vintage_suitcase', 'wicker_basket_01', 'wooden_stool_01', 'barrel_stove', 'shrub_01', 'shrub_02', 'rock_07', 'tree_stump_01', 'wooden_military_crate', 'metal_jug', 'WoodenTable_01', 'ArmChair_01', 'Chandelier_01', 'book_encyclopedia_set_01', 'fancy_picture_frame_01', 'vintage_grandfather_clock_01', 'wooden_bookshelf_worn', 'brass_candleholders', 'tea_set_01', 'GreenChair_01', 'pocket_watch', 'wooden_lantern_01', 'dead_tree_trunk'];
await Promise.all(NAMES.map(load));

// ---------------- lights ----------------
const hemi = new THREE.HemisphereLight('#6a7fb0', '#2a2430', 0.9); scene.add(hemi);
const moon = new THREE.DirectionalLight('#9fb4e8', 1.4); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.03;
scene.add(moon); scene.add(moon.target);
scene.fog = new THREE.FogExp2('#1e2840', 0.03);
const pmrem = new THREE.PMREMGenerator(renderer);
const env = (() => { const [c, g] = cv(512, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#1a2440'); gr.addColorStop(0.5, '#5a6a90'); gr.addColorStop(0.52, '#2a2a30'); gr.addColorStop(1, '#141418'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(255,200,120,.9)'; g.beginPath(); g.ellipse(40 + i * 60, 120, 6, 6, 0, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return pmrem.fromEquirectangular(t).texture; })();
scene.environment = env;

// sky dome: deep navy, moon glow, cloud bands
const skyU = { day: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float day; varying vec3 vP; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5); }
    float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
    void main(){ float y = clamp(vP.y,0.,1.); vec3 c = mix(vec3(.07,.09,.17), vec3(.008,.012,.035), pow(y,.45));
      vec2 q = vP.xz/(vP.y+.25)*1.6; float cl = n(q)*.55 + n(q*2.3+3.)*.3 + n(q*5.+7.)*.15; cl = smoothstep(.45,.85,cl)*smoothstep(0.,.25,vP.y);
      vec3 md = normalize(vec3(-.35,.42,-1.)); float m = dot(vP, md);
      c = mix(c, vec3(.10,.12,.2), cl*.8); c += vec3(.9,.92,1.)*smoothstep(.9993,.9996,m)*1.6 + vec3(.12,.15,.25)*pow(max(m,0.),40.)*1.2;
      if (day > .5) { vec3 d = mix(vec3(.55,.75,1.05), vec3(.12,.32,.85), pow(y,.6)); d = mix(d, vec3(1.15,1.15,1.2), cl*.9); vec3 sd = normalize(vec3(.4,.5,-1.)); float sm = dot(vP, sd); d += vec3(1.6,1.4,1.0)*smoothstep(.9985,.999,sm) + vec3(.4,.3,.15)*pow(max(sm,0.),12.); c = d; }
      gl_FragColor = vec4(c,1.); }` }));
sky.userData.sky = true; scene.add(sky);

// ================= RAILWAY (origin, track along z) =================
const BAL = std({ map: ballastTex(), roughness: 0.95 }); BAL.map.repeat.set(3, 60);
const ground = add(new THREE.PlaneGeometry(400, 400), std({ map: P.tex(P.dirt(11), 60, 60), color: '#5a6a4a', roughness: 1 }), 0, -0.02, 0, scene, false); ground.rotation.x = -Math.PI / 2;
{ const g = new THREE.CylinderGeometry(1.7, 2.3, 0.3, 4, 1, false, Math.PI / 4); const b = add(g, BAL, 0, 0.1, -60, scene, false); b.scale.set(1, 1, 100 / 2.83); b.rotation.y = 0; b.scale.set(1, 1, 1); b.geometry = new THREE.BoxGeometry(3.6, 0.3, 200); b.position.set(0, 0.12, -60); BAL.map.repeat.set(4, 220); }
const SLEEPER = std({ map: P.tex(P.beam(5, [25, 30, 26]), 1, 1), roughness: 0.85 });
const RAIL = std({ color: '#9aa0a8', metalness: 0.9, roughness: 0.25 }), RAILSIDE = std({ color: '#5a3a2a', metalness: 0.5, roughness: 0.7 });
for (let z = 8; z > -150; z -= 0.65) add(box(2.6, 0.14, 0.24), SLEEPER, 0, 0.32, z, scene, true).rotation.y = (Math.sin(z * 7.1) * 0.02);
for (const s of [-1, 1]) { add(box(0.08, 0.16, 200), RAILSIDE, s * 0.7175, 0.46, -60); add(box(0.075, 0.03, 200), RAIL, s * 0.7175, 0.55, -60); }
// platform + station on the right (+x)
const EDGE = std({ map: stoneEdgeTex(), roughness: 0.8 }); EDGE.map.repeat.set(30, 1);
add(box(5, 0.95, 80), std({ map: P.tex(P.stone(21, 30, 6, 46), 10, 80), roughness: 0.9 }), 4.4, 0.47, -20);
add(box(0.4, 0.12, 80), std({ color: '#d8c890', roughness: 0.6 }), 2.1, 0.98, -20);
const BRICK = std({ map: brickTex(), roughness: 0.85 }); BRICK.map.repeat.set(6, 2);
const station = new THREE.Group(); station.position.set(8.2, 0.95, -14); scene.add(station);
add(box(3.2, 3.6, 18), BRICK, 0, 1.8, 0, station);
add(box(4.2, 0.25, 19), std({ color: '#3a2a2a' }), -0.3, 3.75, 0, station);
add(new THREE.CylinderGeometry(0.01, 2.6, 1.6, 4, 1), std({ color: '#4a3030', roughness: 0.6 }), 0, 4.6, 0, station).scale.set(1, 1, 5);
for (let i = -3; i <= 3; i++) { const w = add(box(0.1, 1.3, 1.0), std({ color: '#ffc46a', emissive: '#ffb04a', emissiveIntensity: 1.6 }), -1.62, 1.9, i * 2.4, station, false);
  add(box(0.12, 1.45, 0.08), std({ color: '#2a1e1a' }), -1.64, 1.9, i * 2.4, station); add(box(0.12, 0.08, 1.1), std({ color: '#2a1e1a' }), -1.64, 1.9, i * 2.4, station); }
// canopy posts
for (let z = 6; z > -40; z -= 5) { add(cyl(0.07, 0.07, 3.2, 8), std({ color: '#2a4a3a', metalness: 0.5, roughness: 0.4 }), 3.2, 2.55, z); }
add(box(2.4, 0.12, 50), std({ color: '#3f5f4a', metalness: 0.3, roughness: 0.5 }), 4.0, 4.2, -16);
// platform lamps
const PLAT = []; for (let z = 3; z > -40; z -= 7) { put('street_lamp_01', 2.6, 0.95, z, Math.PI / 2, 1); const l = lamp(2.6, 4.0, z, '#ffb25a', 8, 16, 1.8); PLAT.push({ l, g: glows.slice(-2), z }); }
// station sign + clock + benches + luggage
put('painted_wooden_bench', 4.8, 0.95, -2, -Math.PI / 2, 1); put('painted_wooden_bench', 4.8, 0.95, -9, -Math.PI / 2, 1);
put('vintage_suitcase', 3.6, 0.95, -4.5, 0.4, 1); put('vintage_suitcase', 3.8, 1.2, -4.4, 1.2, 1); put('wicker_basket_01', 3.4, 0.95, -5.4, 0, 1.2);
put('Barrel_01', 3.5, 0.95, 1.5, 0, 1); put('wooden_crate_01', 3.4, 0.95, 0.4, 0.3, 1); put('wooden_crate_02', 3.5, 1.5, 0.4, 0.8, 0.8);
{ const [c, g] = cv(1024, 192); g.fillStyle = '#1f3a2a'; g.fillRect(0, 0, 1024, 192); g.strokeStyle = '#e8c25a'; g.lineWidth = 10; g.strokeRect(10, 10, 1004, 172); g.fillStyle = '#f4ecd0'; g.font = '900 104px Georgia'; g.textAlign = 'center'; g.fillText('MARLOW JUNCTION', 512, 132);
  const s = add(new THREE.PlaneGeometry(4, 0.75), std({ map: P.tex(c), roughness: 0.5 }), 6.55, 3.1, -3, scene, false); s.rotation.y = -Math.PI / 2; }
// left side: platelayers' hut, brazier, tools, fence, telegraph poles, grass, trees
const hut = new THREE.Group(); hut.position.set(-5.2, 0, -5); scene.add(hut);
add(box(3, 2.4, 2.6), std({ map: P.tex(P.planks(4), 2, 1), color: '#8a6a4a', roughness: 0.8 }), 0, 1.2, 0, hut);
add(box(3.4, 0.15, 3.0), std({ color: '#2a2a30', metalness: 0.4, roughness: 0.5 }), 0, 2.5, 0, hut).rotation.z = 0.12;
add(box(0.05, 0.8, 0.8), std({ color: '#ffc46a', emissive: '#ffa040', emissiveIntensity: 1.5 }), 1.52, 1.4, 0.4, hut, false);
add(box(0.06, 1.9, 0.9), std({ color: '#3a2a20' }), 1.52, 0.95, -0.7, hut);
put('barrel_stove', -3.2, 0, -2.6, 0, 1.2); lamp(-3.2, 1.1, -2.6, '#ff7a2a', 10, 9, 2.2);
put('wooden_stool_01', -3.9, 0, -1.9, 0.4, 1); put('wooden_bucket_01', -3.6, 0, -3.6, 0, 1); put('rusted_spade_01', -2.7, 0, -4.0, 1.1, 1); put('sledgehammer_01', -2.6, 0, -1.6, 2.2, 1);
put('wooden_ladder', -6.8, 0, -3.5, 0.2, 1); put('wooden_barrels_01', -6.5, 0, -7.6, 0.5, 1); put('wooden_military_crate', -3.4, 0, -6.6, 0.3, 1); put('metal_jug', -3.0, 0, -3.2, 0, 1);
put('Lantern_01', -2.9, 0, -0.6, 0, 1.3); lamp(-2.9, 0.35, -0.6, '#ffb25a', 2.5, 4, 0.9);
put('wooden_lantern_01', -1.8, 0.33, 2.2, 0, 1.2);
for (let z = 6; z > -60; z -= 2.2) { add(cyl(0.05, 0.06, 1.1, 6), std({ color: '#4a3a2a' }), -2.6, 0.55, z); }
add(box(0.04, 0.06, 70), std({ color: '#5a4a3a' }), -2.6, 0.95, -27); add(box(0.04, 0.06, 70), std({ color: '#5a4a3a' }), -2.6, 0.6, -27);
for (let z = 4; z > -120; z -= 14) { add(cyl(0.12, 0.15, 7, 8), std({ color: '#3a2a20' }), -4.2, 3.5, z); add(box(1.6, 0.1, 0.1), std({ color: '#3a2a20' }), -4.2, 6.6, z); for (const s of [-0.6, 0, 0.6]) add(cyl(0.04, 0.04, 0.12, 6), std({ color: '#d8e0e8' }), -4.2 + s, 6.72, z); }
for (let i = 0; i < 70; i++) { const r = P.rng(100 + i); const x = -3 - r() * 10, z = 6 - r() * 70; put(i % 3 ? 'shrub_01' : 'shrub_02', x, 0, z, r() * 6, 0.8 + r() * 0.8); }
for (let i = 0; i < 40; i++) { const r = P.rng(300 + i); const x = (i % 2 ? -1 : 1) * (14 + r() * 30), z = -10 - r() * 90; const h = 8 + r() * 8; add(new THREE.ConeGeometry(2 + r() * 1.5, h, 7), std({ color: '#1e2a26', roughness: 1 }), x, h / 2, z, scene, false); }
put('tree_stump_01', -2.0, 0, 3.0, 0, 1); put('dead_tree_trunk', -8, 0, -14, 1, 1.2); put('rock_07', -1.9, 0, 0.5, 0, 0.6);
// signal post with a red lamp, further up the line
const sig = new THREE.Group(); sig.position.set(-1.6, 0, -22); scene.add(sig);
add(cyl(0.09, 0.12, 7, 8), std({ color: '#d8d0c0' }), 0, 3.5, 0, sig); add(box(0.25, 1.3, 0.06), std({ color: '#c8322f' }), 0.5, 6.0, 0, sig); add(box(0.3, 0.3, 0.2), std({ color: '#1a1a1a' }), 0.12, 5.3, 0.1, sig);
const SIGL = lamp(-1.48, 5.3, -21.85, '#ff3a2a', 4, 10, 1.4); const SIGG = glows.slice(-2); SIGG[0].material.map = glowTex('255,60,40'); add(cyl(0.11, 0.11, 0.04, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.3, 0.2) }), -1.48, 5.3, -21.88, scene, false).rotation.x = Math.PI / 2;
// fog: soft cards drifting low over the line
const fogs = [];
for (let i = 0; i < 14; i++) { const r = P.rng(500 + i); const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), new THREE.MeshBasicMaterial({ map: fogTex, transparent: true, depthWrite: false, opacity: 0.10 + r() * 0.08, color: '#5a6890', fog: false }));
  m.position.set(-10 + r() * 20, 0.4 + r() * 1.6, -6 - r() * 50); m.scale.setScalar(6 + r() * 8); m.userData.ndSkip = true; m.userData.z0 = m.position.z; m.renderOrder = 4; scene.add(m); fogs.push(m); }

// ================= LOCOMOTIVE (front faces +z) =================
const LOCO = new THREE.Group(); scene.add(LOCO);
{ const G = std({ color: '#1f5a3a', metalness: 0.35, roughness: 0.3 }), BLK = std({ color: '#1a1a1e', metalness: 0.4, roughness: 0.45 }), BR = std({ color: '#e0b04a', metalness: 0.9, roughness: 0.25 }), RED = std({ color: '#b8222a', metalness: 0.2, roughness: 0.35 });
  const boiler = add(cyl(0.95, 0.95, 5.2, 32), G, 0, 2.35, -2.2, LOCO); boiler.rotation.x = Math.PI / 2;
  for (const z of [-0.3, -1.6, -2.9, -4.2]) { const b = add(cyl(0.97, 0.97, 0.08, 32), BR, 0, 2.35, z, LOCO); b.rotation.x = Math.PI / 2; }
  const smoke = add(cyl(1.0, 1.0, 1.0, 32), BLK, 0, 2.35, 0.7, LOCO); smoke.rotation.x = Math.PI / 2;
  const door = add(cyl(0.8, 0.8, 0.1, 32), BLK, 0, 2.35, 1.22, LOCO); door.rotation.x = Math.PI / 2; add(new THREE.SphereGeometry(0.08, 12, 8), BR, 0, 2.35, 1.3, LOCO);
  add(cyl(0.32, 0.25, 1.4, 20), BLK, 0, 3.9, 0.6, LOCO); add(cyl(0.4, 0.4, 0.15, 20), BR, 0, 4.6, 0.6, LOCO);
  add(new THREE.SphereGeometry(0.42, 20, 12, 0, 6.3, 0, 1.6), BR, 0, 3.3, -2.0, LOCO); add(cyl(0.38, 0.38, 0.3, 20), BR, 0, 3.4, -2.0, LOCO);
  add(box(2.9, 0.5, 0.35), RED, 0, 1.0, 1.4, LOCO); for (const s of [-1, 1]) { const bf = add(cyl(0.2, 0.2, 0.45, 16), BLK, s * 1.0, 1.0, 1.75, LOCO); bf.rotation.x = Math.PI / 2; const bh = add(cyl(0.26, 0.26, 0.06, 16), std({ color: '#c8c8c8', metalness: 0.9, roughness: 0.2 }), s * 1.0, 1.0, 2.0, LOCO); bh.rotation.x = Math.PI / 2; }
  add(box(2.6, 0.2, 7.0), BLK, 0, 1.3, -2.1, LOCO);
  for (const s of [-1, 1]) add(box(0.5, 0.12, 6.4), BLK, s * 1.2, 1.9, -2.4, LOCO);
  // headlamp
  add(box(0.4, 0.45, 0.35), BLK, 0, 3.4, 1.15, LOCO); const hl = add(new THREE.CircleGeometry(0.15, 20), new THREE.MeshBasicMaterial({ color: '#fff6d8' }), 0, 3.4, 1.34, LOCO, false); hl.userData.ndSkip = true;
  for (const s of [-1, 1]) { add(box(0.3, 0.35, 0.25), BLK, s * 1.1, 1.55, 1.45, LOCO); }
  // cab
  add(box(2.7, 2.4, 2.4), G, 0, 2.9, -5.6, LOCO); add(box(3.0, 0.15, 2.8), BLK, 0, 4.15, -5.6, LOCO);
  for (const s of [-1, 1]) { const w = add(new THREE.CircleGeometry(0.28, 20), std({ color: '#ffd27a', emissive: '#ff9a3a', emissiveIntensity: 1.2 }), s * 0.75, 3.4, -4.39, LOCO, false); }
  // wheels
  const wheel = (z, r, x) => { const g = new THREE.Group(); g.position.set(x, r + 0.5, z); LOCO.add(g);
    const t = add(cyl(r, r, 0.14, 32), RED, 0, 0, 0, g); t.rotation.z = Math.PI / 2; const tyre = add(new THREE.TorusGeometry(r, 0.06, 8, 32), std({ color: '#c0c4c8', metalness: 0.9, roughness: 0.2 }), 0.03 * Math.sign(x), 0, 0, g); tyre.rotation.y = Math.PI / 2;
    for (let k = 0; k < 12; k++) { const sp = add(box(0.06, r * 1.9, 0.05), std({ color: '#7a1218' }), Math.sign(x) * 0.08, 0, 0, g); sp.rotation.x = k / 12 * Math.PI; }
    add(cyl(0.12, 0.12, 0.22, 16), BR, 0, 0, 0, g).rotation.z = Math.PI / 2; return g; };
  LOCO.userData.wheels = [];
  for (const s of [-1, 1]) for (const [z, r] of [[0.4, 0.5], [-2.2, 0.88], [-4.3, 0.88]]) LOCO.userData.wheels.push(wheel(z, r, s * 0.72));
  for (const s of [-1, 1]) { add(box(0.06, 0.12, 2.3), std({ color: '#c0c4c8', metalness: 0.9, roughness: 0.2 }), s * 0.86, 1.2, -3.25, LOCO); const cy = add(cyl(0.3, 0.3, 1.2, 20), BLK, s * 1.15, 1.25, -0.4, LOCO); cy.rotation.x = Math.PI / 2; }
}
LOCO.userData.light = new THREE.SpotLight('#fff0d0', 14, 60, rx(22), 0.6, 1.2); LOCO.add(LOCO.userData.light); LOCO.userData.light.position.set(0, 3.4, 1.4); LOCO.add(LOCO.userData.light.target); LOCO.userData.light.target.position.set(0, 0.5, 20);
LOCO.userData.hg = glow(0, 0, 0, 0.9, '255,240,200', 1); LOCO.userData.hg2 = glow(0, 0, 0, 1.2, '255,240,210', 0.6);

// ================= BOSSES' OFFICE (x = 200) =================
ZONE = 'office';
const OFF = new THREE.Group(); OFF.position.set(200, 0, 0); scene.add(OFF);
{ const WP = std({ map: wallpaperTex(), roughness: 0.8 }); WP.map.repeat.set(5, 2);
  const floor = add(new THREE.PlaneGeometry(10, 10), std({ map: P.tex(P.planks(12), 3, 3), color: '#a07050', roughness: 0.45 }), 0, 0, 0, OFF, false); floor.rotation.x = -Math.PI / 2;
  const carpet = add(new THREE.PlaneGeometry(5.5, 4), std({ map: carpetTex(), roughness: 0.9 }), 0, 0.01, 0.3, OFF, false); carpet.rotation.x = -Math.PI / 2;
  add(box(10, 3.6, 0.2), WP, 0, 1.8, -3.2, OFF); const lw = add(box(0.2, 3.6, 10), WP, -4.2, 1.8, 0, OFF); const rw = add(box(0.2, 3.6, 10), WP, 4.2, 1.8, 0, OFF);
  add(box(10, 0.9, 0.24), std({ color: '#3a2418', roughness: 0.4 }), 0, 0.45, -3.15, OFF); add(box(10, 0.1, 0.28), std({ color: '#c9962e', metalness: 0.7, roughness: 0.3 }), 0, 0.92, -3.12, OFF);
  add(box(10, 0.2, 10), std({ color: '#5a4636' }), 0, 3.6, 0, OFF);
  // window with foggy night outside
  const [c, g] = cv(256, 384); const gr = g.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, '#1a2a4a'); gr.addColorStop(1, '#5a6a8a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 384); g.fillStyle = 'rgba(255,190,110,.8)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(30 + i * 50, 260 - i * 6, 5, 0, 7); g.fill(); } g.fillStyle = '#ffffff'; g.beginPath(); g.arc(190, 70, 18, 0, 7); g.fill();
  add(new THREE.PlaneGeometry(1.4, 2.0), new THREE.MeshBasicMaterial({ map: P.tex(c) }), 1.9, 1.9, -3.08, OFF, false).userData.ndSkip = false;
  for (const [w, h, x, y] of [[1.55, 0.1, 1.9, 2.9], [1.55, 0.1, 1.9, 0.9], [0.1, 2.1, 1.15, 1.9], [0.1, 2.1, 2.65, 1.9], [0.06, 2.0, 1.9, 1.9], [1.5, 0.06, 1.9, 1.9]]) add(box(w, h, 0.1), std({ color: '#e8dcc4' }), x, y, -3.05, OFF);
  for (const s of [-1, 1]) add(box(0.5, 2.6, 0.08), std({ color: '#2a4a3a', roughness: 0.9 }), 1.9 + s * 0.95, 2.0, -3.0, OFF);
  window.TABLE = put('WoodenTable_01', 0, 0, -0.3, 0, 1.38, OFF); put('tea_set_01', -0.3, 0.757, -0.35, 0.3, 1.2, OFF); put('brass_candleholders', 0.55, 0.757, -0.5, 0, 1.2, OFF); put('book_encyclopedia_set_01', -0.9, 0.757, -0.6, 0.2, 1, OFF); put('pocket_watch', 0.3, 0.76, 0.1, 0, 2, OFF);
  put('wooden_bookshelf_worn', -2.8, 0, -2.85, 0, 1.1, OFF); put('vintage_grandfather_clock_01', -0.6, 0, -2.85, 0, 1.05, OFF); put('fancy_picture_frame_01', -1.6, 2.1, -3.08, 0, 1.2, OFF); put('fancy_picture_frame_01', 3.4, 2.1, -3.08, 0, 0.9, OFF);
  put('ArmChair_01', -2.6, 0, 0.3, 0.9, 1, OFF); put('GreenChair_01', 2.6, 0, 0.0, -0.9, 1, OFF); put('Chandelier_01', 0, 2.6, -0.6, 0, 0.8, OFF);
  const ch = new THREE.PointLight('#ffc070', 12, 12, 1.5); ch.userData = { zone: 'office', I0: 12 }; pLights.push(ch); ch.position.set(200, 2.7, -0.6); scene.add(ch); glow(200, 2.75, -0.6, 0.9, '255,200,120', 0.5);
  const cd = new THREE.PointLight('#ffb050', 4, 5, 1.6); cd.userData = { zone: 'office', I0: 4 }; pLights.push(cd); cd.position.set(200.55, 1.2, -0.5); scene.add(cd); glow(200.55, 1.12, -0.5, 0.35, '255,200,120', 0.8);
}

// ================= CAB INTERIOR (x = -200) =================
ZONE = 'cab';
const CAB = new THREE.Group(); CAB.position.set(-200, 0, 0); scene.add(CAB);
{ const G = std({ color: '#1f5a3a', metalness: 0.3, roughness: 0.35 }), BLK = std({ color: '#1a1a1e', metalness: 0.5, roughness: 0.4 }), BR = std({ color: '#e0b04a', metalness: 0.9, roughness: 0.22 }), CU = std({ color: '#c87a4a', metalness: 0.9, roughness: 0.25 });
  add(box(3, 0.1, 4), std({ map: P.tex(P.planks(22), 2, 2), color: '#7a5a3a' }), 0, 0, 0, CAB);
  add(box(3, 3, 0.1), G, 0, 1.5, -1.4, CAB); // backhead plate
  const fd = add(box(0.7, 0.55, 0.08), BLK, 0, 0.75, -1.33, CAB); const fire = add(box(0.5, 0.36, 0.02), new THREE.MeshBasicMaterial({ color: '#ffb03a' }), 0, 0.75, -1.28, CAB, false); fire.userData.ndSkip = false;
  const fl = new THREE.PointLight('#ff7a2a', 10, 6, 1.4); fl.userData = { zone: 'cab', I0: 10 }; pLights.push(fl); fl.position.set(-200, 0.8, -0.9); scene.add(fl); glow(-200, 0.75, -1.2, 0.9, '255,140,60', 0.6);
  for (const [x, y, r] of [[-0.55, 2.05, 0.18], [0.55, 2.05, 0.18], [0, 2.3, 0.14]]) { const g = add(cyl(r, r, 0.08, 24), BR, x, y, -1.3, CAB); g.rotation.x = Math.PI / 2; const f = add(new THREE.CircleGeometry(r * 0.8, 24), std({ color: '#f4ecd8' }), x, y, -1.25, CAB, false); for (let k = 0; k < 8; k++) { const t = add(box(0.008, 0.03, 0.005), std({ color: '#222' }), x + Math.cos(k * 0.6 + 2.5) * r * 0.65, y + Math.sin(k * 0.6 + 2.5) * r * 0.65, -1.24, CAB, false); t.rotation.z = k * 0.6 + 2.5 + Math.PI / 2; } const n = add(box(0.01, r * 0.6, 0.006), std({ color: '#c8322f' }), x, y + r * 0.2, -1.235, CAB, false); n.rotation.z = -0.9; }
  for (let k = 0; k < 5; k++) { const p = add(cyl(0.04, 0.04, 1.6, 12), CU, -1.0 + k * 0.5, 1.6, -1.3, CAB); p.rotation.z = k % 2 ? 0.2 : -0.15; }
  const lv = new THREE.Group(); lv.position.set(0.95, 0.9, -1.0); CAB.add(lv); add(cyl(0.035, 0.035, 1.1, 10), std({ color: '#c0c4c8', metalness: 0.9, roughness: 0.2 }), 0, 0.55, 0, lv); add(new THREE.SphereGeometry(0.07, 12, 8), std({ color: '#c8322f' }), 0, 1.1, 0, lv); lv.rotation.z = 0.5; CAB.userData.lever = lv;
  for (const s of [-1, 1]) { add(box(0.1, 3, 4), G, s * 1.5, 1.5, 0.6, CAB); }
  add(box(3.1, 0.12, 4.2), BLK, 0, 3.0, 0.6, CAB);
  // spectacle windows looking out into the fog + coal + shovel + oil can
  for (const s of [-1, 1]) { const w = add(new THREE.CircleGeometry(0.28, 24), new THREE.MeshBasicMaterial({ color: '#7a8aaa' }), s * 0.85, 2.65, -1.34, CAB, false); add(new THREE.TorusGeometry(0.28, 0.035, 8, 24), BR, s * 0.85, 2.65, -1.33, CAB); }
  put('rusted_spade_01', -1.0, 0, -0.8, 0.4, 1.1, CAB); put('vintage_oil_lamp', 1.2, 1.4, -1.15, 0, 1.2, CAB); const ol = new THREE.PointLight('#ffb050', 3, 4, 1.6); ol.userData = { zone: 'cab', I0: 3 }; pLights.push(ol); ol.position.set(-198.8, 1.7, -1.1); scene.add(ol); glow(-198.8, 1.65, -1.1, 0.6, '255,200,120', 1);
  for (let i = 0; i < 40; i++) { const r = P.rng(700 + i); add(new THREE.DodecahedronGeometry(0.08 + r() * 0.08), std({ color: '#1a1a1e', metalness: 0.3, roughness: 0.3 }), -1.1 + r() * 0.7, 0.05 + r() * 0.2, 0.9 + r() * 0.8, CAB); }
}

ZONE = 'fx';
// ---------------- cards ----------------
const CW = 1200, CH = 2000, CM = 2.25;
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('10,8,16', 0.65));
const cardNd = (map) => new THREE.ShaderMaterial({ uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`, side: THREE.DoubleSide });
class Card { constructor() { [this.c] = cv(CW, CH); this.g = this.c.getContext('2d'); this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); }
  draw(fn) { const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0); fn(new T.Pen(g)); this.t.needsUpdate = true; } }
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());
const toWorld = (a, px, py) => { const s = a.s || 1, yaw = Math.atan2(camera.position.x - a.x, camera.position.z - a.z); const lx = (px - 300) / 600 * CM * 0.6 * s * (a.flip ? -1 : 1), ly = (1000 - py) / 1000 * CM * s - CM * 0.025 * s;
  return [a.x + lx * Math.cos(yaw), a.y + ly, a.z - lx * Math.sin(yaw)]; };
const charDraw = (who, o, props = []) => (p) => { const out = {}; T.romanFront(p, who, { ...o, out }); const u = 2.36; for (const pr of props) { const h = out.hands[pr.hand]; if (pr.kind === 'lantern') T.propLantern(p, h[0], h[1] - 4, u * 1.2); if (pr.kind === 'det') T.propDetonator(p, h[0], h[1] - 12, u * 1.3); } p.out = out; };

// ---------------- post (bloom + ink + grade + DOF) ----------------
const ndMat = new THREE.ShaderMaterial({ vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`, side: THREE.DoubleSide });
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const rtB1 = new THREE.WebGLRenderTarget(W / 4, H / 4, { type: THREE.HalfFloatType }), rtB2 = new THREE.WebGLRenderTarget(W / 4, H / 4, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const fsv = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
const brightU = { src: { value: rtColor.texture }, thr: { value: 1.2 } }, blurU = { src: { value: null }, dir: { value: new THREE.Vector2() } };
const brightScene = fs(new THREE.ShaderMaterial({ uniforms: brightU, vertexShader: fsv, fragmentShader: `uniform sampler2D src; uniform float thr; varying vec2 vUv; void main(){ vec3 c = texture2D(src, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(thr, thr + .5, l), 1.); }` }));
const blurScene = fs(new THREE.ShaderMaterial({ uniforms: blurU, vertexShader: fsv, fragmentShader: `uniform sampler2D src; uniform vec2 dir; varying vec2 vUv; void main(){ vec3 a = vec3(0.); float w[5]; w[0]=.227; w[1]=.194; w[2]=.121; w[3]=.054; w[4]=.016;
    a += texture2D(src, vUv).rgb*w[0]; for(int i=1;i<5;i++){ a += texture2D(src, vUv+dir*float(i)*2.).rgb*w[i]; a += texture2D(src, vUv-dir*float(i)*2.).rgb*w[i]; } gl_FragColor = vec4(a,1.); }` }));
const inkU = { bloom: { value: rtB1.texture }, bloomK: { value: 0.55 }, expo: { value: 1.0 }, worldInk: { value: 0.3 }, col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 2.2 },
  sat: { value: 1.15 }, lift: { value: new THREE.Color(0.01, 0.012, 0.03) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.35 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: fsv,
  fragmentShader: `uniform sampler2D col, nd, bloom; uniform vec2 res; uniform float px, sat, vig, flash, bloomK, expo, worldInk; uniform vec3 lift, gain; varying vec2 vUv;
  vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.); }
  float edgeAt(vec2 uv, float r){ vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.; float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.; vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o); float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue; if (card) ds = 1e4; vec3 ns = s.rgb*2.-1.; e = max(e, smoothstep(.006, .02, (ds - d)/d)); if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); }
    return e * (1. - smoothstep(20., 80., d)*.85); }
  void main(){ vec3 c = texture2D(col, vUv).rgb; float e = edgeAt(vUv, px); c += texture2D(bloom, vUv).rgb * bloomK; c = aces(c * expo); c = mix(c, vec3(.012,.01,.02), e * worldInk);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat); c = c*gain + lift; vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2; c = mix(c, vec3(1.,.95,.85), flash); gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: fsv,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf, cinf*1.4); }
  void main(){ float c0 = coc(vUv); if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float ws = 0.; for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996; vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o); float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5); acc += texture2D(src, vUv+o).rgb*w; ws += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(ws,1e-3), 1.)); }` }));
dofScene.children[0].material.toneMapped = false;
const swapForNd = (on) => scene.traverse((o) => { if (!o.isMesh) return;
  if (on) { o.userData.mat0 = o.material; if (o.userData.ndSkip || o === sky) { o.userData.vis0 = o.visible; o.visible = false; return; } o.material = o.userData.nd || ndMat; }
  else { o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; } } });

// ---------------- extra fx: bang ----------------
const bang = new THREE.Group(); scene.add(bang);
{ const core = add(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.6, 1.0) }), 0, 0, 0, bang, false); core.userData.ndSkip = true;
  glow(0, 0, 0, 1, '255,200,120', 1); bang.userData.g = glows.pop(); bang.add(bang.userData.g); bang.userData.g.position.set(0, 0, 0);
  for (let i = 0; i < 26; i++) { const r = P.rng(900 + i); const s = add(box(0.03, 0.03, 0.5 + r() * 0.8), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2, 0.6) }), 0, 0, 0, bang, false); s.userData.ndSkip = true; const d = new THREE.Vector3(r() - 0.5, r() * 0.9 + 0.1, r() - 0.5).normalize(); s.position.copy(d.clone().multiplyScalar(0.8 + r() * 1.2)); s.lookAt(d.clone().multiplyScalar(5)); }
  for (let i = 0; i < 10; i++) { const r = P.rng(950 + i); const m = add(new THREE.SphereGeometry(0.4 + r() * 0.4, 12, 8), std({ color: '#3a3a44', roughness: 1 }), (r() - 0.5) * 1.6, 0.2 + r() * 0.6, -0.4 - r() * 0.8, bang, false); m.userData.ndSkip = true; } }
const bangLight = new THREE.PointLight('#ffb060', 0, 14, 1.4); scene.add(bangLight);

// ================= extra props for the full story =================
const RAILTOP = 0.565;
// detonators: a red tin clipped on the rail head with two lead straps
const DETS = [];
for (let i = 0; i < 3; i++) { const g = new THREE.Group(); scene.add(g); g.visible = false;
  add(cyl(0.042, 0.042, 0.022, 20), std({ color: '#c8222a', metalness: 0.3, roughness: 0.35 }), 0, 0.011, 0, g);
  add(cyl(0.026, 0.026, 0.024, 16), std({ color: '#e8504a', metalness: 0.3, roughness: 0.3 }), 0, 0.014, 0, g);
  for (const s of [-1, 1]) { add(box(0.022, 0.006, 0.1), std({ color: '#8a9098', metalness: 0.8, roughness: 0.35 }), s * 0.03, 0.004, 0, g).rotation.y = Math.PI / 2; add(box(0.006, 0.07, 0.022), std({ color: '#8a9098', metalness: 0.8, roughness: 0.35 }), s * 0.05, -0.03, 0, g); }
  DETS.push(g); }
const COIN = add(cyl(0.012, 0.012, 0.003, 24), std({ color: '#e8b84a', metalness: 1, roughness: 0.25 }), 0, 0, 0, scene); COIN.visible = false;
COIN.scale.setScalar(1.9);
// drawings on the office table
const [pc, pg] = cv(512, 384); pg.fillStyle = '#efe4c8'; pg.fillRect(0, 0, 512, 384); pg.strokeStyle = '#2a3a6a'; pg.lineWidth = 4; pg.beginPath(); pg.arc(160, 190, 70, 0, 7); pg.stroke(); pg.beginPath(); pg.arc(160, 190, 40, 0, 7); pg.stroke();
pg.strokeRect(60, 180, 40, 20); pg.strokeRect(220, 180, 40, 20); pg.beginPath(); pg.moveTo(300, 260); pg.lineTo(480, 260); pg.stroke(); pg.font = 'italic 28px Georgia'; pg.fillStyle = '#2a3a6a'; pg.fillText('fog signal', 300, 120); pg.fillText('— bang! —', 320, 200); pg.fillText('1841', 380, 330);
const PAPER = add(new THREE.PlaneGeometry(0.5, 0.375), std({ map: P.tex(pc), roughness: 0.8 }), 0, 0, 0, scene, false); PAPER.rotation.x = -Math.PI / 2; PAPER.visible = false;
// stopped goods train ahead: a brake van with red tail lamps + two wagons
const VAN = new THREE.Group(); scene.add(VAN); VAN.visible = false;
{ const WD = std({ map: P.tex(P.planks(31), 3, 1), color: '#7a3a2a', roughness: 0.7 }), BLK = std({ color: '#1a1a1e', metalness: 0.4, roughness: 0.5 });
  for (const [z0, col] of [[0, '#7a3a2a'], [-6.4, '#4a5a6a'], [-12.8, '#6a5a3a']]) { const w = add(box(2.6, 2.3, 6), std({ map: P.tex(P.planks(32 + z0), 3, 1), color: col, roughness: 0.7 }), 0, 2.0, z0 - 3, VAN); add(box(2.8, 0.15, 6.2), BLK, 0, 3.2, z0 - 3, VAN); add(box(2.6, 0.3, 6.2), BLK, 0, 0.85, z0 - 3, VAN);
    for (const s of [-1, 1]) for (const dz of [-1.8, -4.2]) { const wh = add(cyl(0.45, 0.45, 0.12, 20), BLK, s * 0.72, 0.95, z0 + dz, VAN); wh.rotation.z = Math.PI / 2; } }
  for (const s of [-1, 1]) { const b = add(cyl(0.18, 0.18, 0.4, 16), BLK, s * 1.0, 1.0, 0.2, VAN); b.rotation.x = Math.PI / 2; }
  for (const s of [-1, 1]) { add(box(0.24, 0.3, 0.2), BLK, s * 0.95, 2.9, 0.05, VAN); add(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.25, 0.15) }), s * 0.95, 2.9, 0.16, VAN, false); } }
const VANG = [glow(0, 0, 0, 1.6, '255,40,30', 0.9), glow(0, 0, 0, 1.6, '255,40,30', 0.9)];
// modern train + LED signal (day, present time)
const MOD = new THREE.Group(); scene.add(MOD); MOD.visible = false;
{ const WH = std({ color: '#f2f4f6', metalness: 0.3, roughness: 0.25 }), BL = std({ color: '#1f4fa8', metalness: 0.3, roughness: 0.3 }), YL = std({ color: '#ffd21a', roughness: 0.35 }), GL = std({ color: '#10141c', metalness: 0.6, roughness: 0.08 });
  add(box(2.9, 3.0, 20), WH, 0, 2.3, -10.5, MOD); add(box(2.92, 0.45, 20), BL, 0, 1.25, -10.5, MOD); add(box(2.94, 0.6, 18), GL, 0, 2.75, -10.5, MOD);
  const nose = add(new THREE.SphereGeometry(1.45, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), YL, 0, 0.8, -0.5, MOD); nose.scale.set(1, 1.6, 1.6); nose.rotation.x = Math.PI / 2;
  add(box(2.2, 0.8, 0.5), GL, 0, 3.1, 0.15, MOD).rotation.x = -0.5;
  for (const s of [-1, 1]) add(new THREE.CircleGeometry(0.13, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 2.6) }), s * 0.85, 1.55, 1.75, MOD, false);
  for (const s of [-1, 1]) for (const z of [-3, -18]) { const b = add(box(0.3, 0.6, 2.4), std({ color: '#2a2a30' }), s * 0.72, 0.7, z, MOD); } }
const MODG = [glow(0, 0, 0, 1.2, '255,250,230', 0.8), glow(0, 0, 0, 1.2, '255,250,230', 0.8)];
const LED = new THREE.Group(); LED.position.set(-1.7, 0, -26); scene.add(LED); LED.visible = false;
add(cyl(0.08, 0.08, 4.2, 10), std({ color: '#8a9098', metalness: 0.7, roughness: 0.3 }), 0, 2.1, 0, LED); add(box(0.5, 1.3, 0.3), std({ color: '#14161a', roughness: 0.4 }), 0, 4.4, 0, LED);
const LEDS = [0, 1, 2].map((i) => add(new THREE.CircleGeometry(0.13, 20), new THREE.MeshBasicMaterial({ color: '#202020' }), 0, 4.8 - i * 0.4, 0.16, LED, false));
// day-only scenery: rolling hills and a hedge line (hidden at night)
const DAYSET = new THREE.Group(); scene.add(DAYSET);
{ const r = P.rng(77); for (let i = 0; i < 16; i++) { const h = add(new THREE.SphereGeometry(30 + r() * 25, 24, 12), std({ color: i % 2 ? '#5aa04a' : '#4a9040', roughness: 0.9 }), (i % 2 ? -1 : 1) * (45 + r() * 40), -14, -60 - i * 18, DAYSET, false); h.scale.y = 0.5; }
  for (let i = 0; i < 30; i++) { const t = new THREE.Group(); t.position.set((i % 2 ? -1 : 1) * (12 + r() * 18), 0, -40 - r() * 110); DAYSET.add(t); add(cyl(0.25, 0.35, 3, 8), std({ color: '#6a4a32' }), 0, 1.5, 0, t); for (let k = 0; k < 3; k++) add(new THREE.SphereGeometry(1.8 - k * 0.3, 14, 10), std({ color: k % 2 ? '#3f8a3a' : '#5aa84a', roughness: 0.7 }), (r() - 0.5), 3.2 + k * 0.9, (r() - 0.5), t); } }
const NIGHTTREES = scene.children.filter((o) => o.isMesh && o.geometry && o.geometry.type === 'ConeGeometry');
// steam puffs and sparks
const puffTex = (() => { const [c, g] = cv(128, 128); for (let i = 0; i < 9; i++) { const x = 34 + (i * 37) % 60, y = 34 + (i * 53) % 60, gr = g.createRadialGradient(x, y, 0, x, y, 34); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const PUFFS = []; for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: puffTex, transparent: true, depthWrite: false, fog: true })); m.userData.ndSkip = true; m.renderOrder = 3; scene.add(m); PUFFS.push(m); }
const SPARKS = []; for (let i = 0; i < 40; i++) { const m = add(box(0.012, 0.012, 0.18), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.8, 0.5) }), 0, 0, 0, scene, false); m.userData.ndSkip = true; m.visible = false; SPARKS.push(m); }
// sound rings (the bang travelling through the fog)
const ringTex = (() => { const [c, g] = cv(256, 256); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 110, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,230,170,.6)'; g.lineWidth = 4; g.beginPath(); g.arc(128, 128, 96, 0, 7); g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const RINGS = []; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.userData.ndSkip = true; m.renderOrder = 6; m.visible = false; scene.add(m); RINGS.push(m); }
// measure the office table top once
const TABLE_TOP = (() => { const b = new THREE.Box3().setFromObject(window.TABLE); return b.max.y; })();
window.TABLE_TOP = TABLE_TOP;

// ================= light presets =================
const PRESET = {
  night: { hemi: ['#6a7fb0', '#2a2430', 0.9], key: ['#9fb4e8', 1.4], fog: ['#1e2840', 0.03], day: 0, expo: 1.0, lamps: 1, sat: 1.15, lift: [0.01, 0.012, 0.03], env: 0.6 },
  day: { hemi: ['#cfe0ff', '#7a6a4a', 1.5], key: ['#fff1d6', 3.2], fog: ['#b8d0ec', 0.006], day: 1, expo: 1.0, lamps: 0, sat: 1.18, lift: [0, 0, 0], env: 1.0 },
  office: { hemi: ['#6a5a70', '#2a1a14', 0.7], key: ['#7f94c8', 0.4], fog: ['#1e2840', 0.0005], day: 0, expo: 1.05, lamps: 1, sat: 1.15, lift: [0.012, 0.008, 0.01], env: 0.6 },
  cab: { hemi: ['#5a6a90', '#3a2010', 0.7], key: ['#9fb4e8', 0.3], fog: ['#1e2840', 0.0005], day: 0, expo: 1.0, lamps: 1, sat: 1.15, lift: [0.012, 0.008, 0.01], env: 0.5 },
};
const dayEnv = (() => { const [c, g] = cv(512, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#3a7ad8'); gr.addColorStop(0.5, '#cfe4ff'); gr.addColorStop(0.52, '#6a8a4a'); gr.addColorStop(1, '#3a4a2a'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(150, 50, 24, 16, 0, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return pmrem.fromEquirectangular(t).texture; })();
const TREE_NIGHT = '#1e2a26';

import { stateAt, TOTAL } from './shots.js';
const tmp = new THREE.Vector3();
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

window.renderFrame = (f) => {
  const S = stateAt(f, { TABLE_TOP, RAILTOP });
  const L = PRESET[S.preset || 'night'];
  // ---- lights / atmosphere
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2];
  moon.color.set(L.key[0]); moon.intensity = L.key[1] * (S.keyK ?? 1);
  scene.fog.color.set(S.fogCol || L.fog[0]); scene.fog.density = S.fog ?? L.fog[1];
  skyU.day.value = L.day; scene.environment = L.day ? dayEnv : env;
  inkU.expo.value = (S.expo ?? L.expo); inkU.sat.value = L.sat; inkU.lift.value.setRGB(...L.lift); inkU.flash.value = S.flash || 0;
  DAYSET.visible = !!L.day; for (const t of NIGHTTREES) t.visible = !L.day;
  const zone = S.zone || 'rail';
  for (const l of pLights) { l.visible = L.lamps > 0 && l.userData.zone === zone; l.intensity = l.userData.I0 * (S.lampK ?? 1); }
  for (const g of glows) g.visible = L.lamps > 0 && (g.userData.zone === zone || g.userData.zone === 'fx');
  if (zone === 'rail') { SIGL.intensity = 4 * (S.sigK ?? 1); SIGG.forEach((g) => (g.userData.kMul = S.sigK ?? 1)); PLAT.forEach((p) => { const k = S.platK && S.platK.z === p.z ? S.platK.k : 1; p.l.intensity = 8 * k * (S.lampK ?? 1); p.g.forEach((g) => (g.userData.kMul = k)); }); }
  // ---- camera (+ shake)
  const sh = S.shake || 0;
  camera.position.set(S.cam[0] + (rnd(f, 1) - 0.5) * sh, S.cam[1] + (rnd(f, 2) - 0.5) * sh, S.cam[2]); camera.up.set(0, 1, 0);
  camera.lookAt(S.look[0] + (rnd(f, 3) - 0.5) * sh * 2, S.look[1] + (rnd(f, 4) - 0.5) * sh * 2, S.look[2]); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  sky.position.copy(camera.position);
  const fc = S.shadowAt || S.look; moon.position.set(fc[0] + (L.day ? 25 : 20), fc[1] + 30, fc[2] + (L.day ? 20 : -30)); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 15; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 140; sc.updateProjectionMatrix(); }
  // ---- locomotive
  LOCO.visible = S.loco != null;
  if (LOCO.visible) { LOCO.position.set(0, 0.05, S.loco); LOCO.updateMatrixWorld(true);
    for (const w of LOCO.userData.wheels) { const r = w.position.y - 0.5; w.rotation.x = -(S.loco) / Math.max(r, 0.3); }
    tmp.set(0, 3.4, 1.45).applyMatrix4(LOCO.matrixWorld); LOCO.userData.hg.position.copy(tmp); LOCO.userData.hg2.position.copy(tmp); }
  LOCO.userData.hg.visible = LOCO.userData.hg2.visible = LOCO.visible && !L.day; LOCO.userData.light.visible = LOCO.visible && !L.day;
  // steam puffs from the chimney
  PUFFS.forEach((m, i) => { m.visible = LOCO.visible && (S.steam ?? 1) > 0; if (!m.visible) return; const age = ((f / 30) * 1.6 + i / PUFFS.length) % 1;
    tmp.set(0, 4.7 + age * 2.2, 0.6 - age * (S.steamDrift ?? 6) + Math.sin(i * 3.1) * 0.3).applyMatrix4(LOCO.matrixWorld); tmp.x += Math.sin(i * 1.7) * age * 1.2; m.position.copy(tmp);
    m.scale.setScalar(0.8 + age * 3.2); m.quaternion.copy(camera.quaternion); m.material.opacity = (1 - age) * 0.8 * (S.steam ?? 1); m.material.color.set(L.day ? '#ffffff' : '#9aa6c4'); });
  // goods van, modern train, LED signal
  VAN.visible = S.van != null; if (VAN.visible) { VAN.position.set(0, 0.05, S.van); VAN.rotation.y = S.vanRot ? Math.PI : 0; VAN.updateMatrixWorld(true); [-1, 1].forEach((s, i) => { tmp.set(s * 0.95, 2.9, 0.2).applyMatrix4(VAN.matrixWorld); VANG[i].position.copy(tmp); }); }
  VANG.forEach((g) => (g.visible = VAN.visible));
  MOD.visible = S.modern != null; if (MOD.visible) { MOD.position.set(0, 0.05, S.modern); MOD.updateMatrixWorld(true); [-1, 1].forEach((s, i) => { tmp.set(s * 0.85, 1.55, 1.8).applyMatrix4(MOD.matrixWorld); MODG[i].position.copy(tmp); }); }
  MODG.forEach((g) => (g.visible = MOD.visible));
  LED.visible = !!S.led; sig.visible = !S.led; LEDS.forEach((m, i) => m.material.color.set(S.led && i === 2 ? new THREE.Color(0.3, 3, 0.8) : '#202020'));
  // detonators, coin, paper
  DETS.forEach((d, i) => { const D = (S.dets || [])[i]; d.visible = !!D; if (D) { d.position.set(...D.p); d.scale.setScalar(D.s ?? 1); d.rotation.set(0, D.ry || 0, 0); } });
  COIN.visible = !!S.coin; if (S.coin) COIN.position.set(...S.coin);
  PAPER.visible = !!S.paper; if (S.paper) PAPER.position.set(...S.paper);
  CAB.userData.lever.rotation.z = S.lever ?? 0.5;
  // bang
  bang.visible = !!S.bang; bangLight.intensity = S.bang ? 14 * S.bang.k : 0;
  if (S.bang) { bang.position.set(...S.bang.p); bang.scale.setScalar(0.25 + 0.6 * S.bang.k); bangLight.position.set(S.bang.p[0], S.bang.p[1] + 0.5, S.bang.p[2] + 0.5); }
  // sparks (wheel/brake)
  SPARKS.forEach((m, i) => { const sp = S.sparks; m.visible = !!sp; if (!sp) return; const src = sp.at[i % sp.at.length], a = ((f * 0.37 + i * 0.61) % 1), dir = sp.dir || 1;
    m.position.set(src[0] + (rnd(i, 7) - 0.5) * 0.3, src[1] + a * 0.5 * rnd(i, 8), src[2] + dir * a * (0.6 + rnd(i, 9))); m.lookAt(m.position.x, m.position.y + 0.3, m.position.z + dir * 2); });
  // sound rings
  RINGS.forEach((m, i) => { const R = S.rings; m.visible = !!R; if (!R) return; const a = ((f / 30) * (R.rate || 1.2) + i / RINGS.length) % 1; m.position.set(R.p[0], R.p[1], R.p[2] + (R.dz || 0) * a); m.scale.setScalar(0.3 + a * (R.size || 6)); m.quaternion.copy(camera.quaternion); m.material.opacity = (1 - a) * (R.k ?? 1); });
  // glows face camera and fade with distance
  for (const g of glows) { g.quaternion.copy(camera.quaternion); g.material.opacity = g.userData.k0 * (g.userData.kMul ?? 1) * Math.exp(-g.position.distanceTo(camera.position) * (S.glowFade ?? 0.05)); }
  for (const m of fogs) { m.quaternion.copy(camera.quaternion); m.visible = !L.day && S.fogCards !== 0; m.material.opacity = (m.userData.o0 ??= m.material.opacity) * (S.fogCards ?? 1); if (S.fogRoll != null) m.position.z = m.userData.z0 + S.fogRoll; }
  if (bang.userData.g) { bang.userData.g.quaternion.copy(camera.quaternion); bang.userData.g.scale.setScalar(1.6); }
  for (const o of NIGHTTREES) o.material.color.set(TREE_NIGHT);
  // ---- cards
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw); c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(camera.position.x - a.x, camera.position.z - a.z), a.roll || 0); c.mat.color.set(a.tint || S.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2; c.mesh.castShadow = !a.fx;
    c.blob.visible = !a.fx && a.blob !== false; c.blob.position.set(a.x, (a.ground ?? a.y) + 0.015, a.z); c.blob.scale.set(1.0 * s, 0.55 * s, 1); });
  // ---- render passes
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.autoUpdate = false; swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false); scene.fog = fog; renderer.shadowMap.autoUpdate = true;
  renderer.setRenderTarget(rtB1); renderer.render(brightScene, fsCam);
  for (let k = 0; k < 3; k++) { blurU.src.value = rtB1.texture; blurU.dir.value.set(1 / (W / 4), 0); renderer.setRenderTarget(rtB2); renderer.render(blurScene, fsCam); blurU.src.value = rtB2.texture; blurU.dir.value.set(0, 1 / (H / 4)); renderer.setRenderTarget(rtB1); renderer.render(blurScene, fsCam); }
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = S.focus || 5; dofU.cinf.value = S.cinf ?? 3; renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;

window.ready = true;
