import * as THREE from './lib/three.module.js';
import { GLTFLoader } from './lib/GLTFLoader.js';
import * as T from './toon.js';
import * as P from './paint.js';
import * as BufferGeometryUtils from './lib/BufferGeometryUtils.js';

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

const NAMES = ['Barrel_01', 'wooden_crate_01', 'wooden_crate_02', 'Lantern_01', 'wooden_barrels_01', 'rusted_spade_01', 'wooden_bucket_01', 'painted_wooden_bench', 'wooden_ladder', 'wicker_basket_01', 'wooden_stool_01', 'rock_07', 'rock_09', 'tree_stump_01', 'wooden_military_crate', 'metal_jug', 'WoodenTable_01', 'ArmChair_01', 'Chandelier_01', 'book_encyclopedia_set_01', 'fancy_picture_frame_01', 'vintage_grandfather_clock_01', 'wooden_bookshelf_worn', 'brass_candleholders', 'tea_set_01', 'GreenChair_01', 'pocket_watch', 'old_military_crate', 'ammo_box', 'metal_jerrycan', 'hatchet', 'wooden_picnic_table', 'dead_quiver_trunk', 'namaqualand_boulder_02', 'namaqualand_boulder_04', 'wild_rooibos_bush', 'watering_can_metal_01', 'vintage_binocular', 'bolt_action_rifle_7_62'];
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
const skyU = { day: { value: 0 }, sunD: { value: new THREE.Vector3(0.5, 0.5, -1) } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float day; uniform vec3 sunD; varying vec3 vP; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5); }
    float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
    void main(){ float y = clamp(vP.y,0.,1.); vec3 c = mix(vec3(.07,.09,.17), vec3(.008,.012,.035), pow(y,.45));
      vec2 q = vP.xz/(vP.y+.25)*1.6; float cl = n(q)*.55 + n(q*2.3+3.)*.3 + n(q*5.+7.)*.15; cl = smoothstep(.45,.85,cl)*smoothstep(0.,.25,vP.y);
      vec3 md = normalize(vec3(-.35,.42,-1.)); float m = dot(vP, md);
      c = mix(c, vec3(.10,.12,.2), cl*.8); c += vec3(.9,.92,1.)*smoothstep(.9993,.9996,m)*1.6 + vec3(.12,.15,.25)*pow(max(m,0.),40.)*1.2;
      if (day > .5) { bool g = day > 1.5; vec3 sd = normalize(sunD); float sm = dot(vP, sd);
        vec3 top = g ? vec3(.05,.12,.42) : vec3(.06,.22,.75), hor = g ? vec3(1.0,.5,.22) : vec3(.5,.72,1.0);
        vec3 d = mix(hor, top, pow(y, g ? .45 : .6)); d = mix(d, g ? vec3(1.1,.6,.38) : vec3(1.1,1.1,1.15), cl*.7);
        d += (g ? vec3(4.,2.8,1.6) : vec3(3.,2.7,2.2))*smoothstep(.9982,.999,sm) + (g ? vec3(1.3,.6,.22) : vec3(.5,.4,.2))*pow(max(sm,0.), g ? 5. : 10.); c = d; }
      gl_FragColor = vec4(c,1.); }` }));
sky.userData.sky = true; scene.add(sky);

// office (re-used: the minister's office in Perth)
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

ZONE = 'fx';
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
const inkU = { sunUV: { value: new THREE.Vector2(0.5, 1.2) }, raysK: { value: 0 }, bloom: { value: rtB1.texture }, bloomK: { value: 0.55 }, expo: { value: 1.0 }, worldInk: { value: 0.3 }, col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 2.2 },
  sat: { value: 1.15 }, lift: { value: new THREE.Color(0.01, 0.012, 0.03) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.35 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: fsv,
  fragmentShader: `uniform sampler2D col, nd, bloom; uniform vec2 res, sunUV; uniform float raysK, px, sat, vig, flash, bloomK, expo, worldInk; uniform vec3 lift, gain; varying vec2 vUv;
  vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.); }
  float edgeAt(vec2 uv, float r){ vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.; float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.; vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o); float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue; if (card) ds = 1e4; vec3 ns = s.rgb*2.-1.; e = max(e, smoothstep(.006, .02, (ds - d)/d)); if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); }
    return e * (1. - smoothstep(20., 80., d)*.85); }
  void main(){ vec3 c = texture2D(col, vUv).rgb; float e = edgeAt(vUv, px); c += texture2D(bloom, vUv).rgb * bloomK; if (raysK > 0.) { vec2 dd = (sunUV - vUv) / 32.; vec2 uv = vUv; float dec = 1.; vec3 rr = vec3(0.); for (int i=0;i<32;i++){ uv += dd; rr += texture2D(bloom, clamp(uv, 0., 1.)).rgb * dec; dec *= .955; } c += rr / 32. * raysK; } c = aces(c * expo); c = mix(c, vec3(.012,.01,.02), e * worldInk);
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

const TXL = new THREE.TextureLoader(); const TX = {};
const PBRN = ['red_laterite_soil_stones', 'eucalyptus_bark', 'farm_soil', 'red_sand', 'rock_boulder_dry', 'corrugated_iron', 'weathered_planks', 'dry_ground_01'];
await Promise.all(PBRN.flatMap((n) => ['diff', 'nor', 'rough'].map((k) => new Promise((res) => TXL.load(`tex/${n}_${k}.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (k === 'diff') t.colorSpace = THREE.SRGBColorSpace; TX[n + k] = t; res(); }, undefined, () => res())))));
const pbr = (n, rep, o = {}) => { const r = Array.isArray(rep) ? rep : [rep, rep]; const cl = (t) => { const c = t.clone(); c.repeat.set(r[0], r[1]); c.needsUpdate = true; return c; };
  return new THREE.MeshStandardMaterial({ map: cl(TX[n + 'diff']), normalMap: cl(TX[n + 'nor']), roughnessMap: cl(TX[n + 'rough']), roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2), ...o }); };
// ================= OUTBACK WORLD (Western Australia, 1932) =================
ZONE = 'farm';
const R = (s) => P.rng(s);
// ground: red-brown dirt with darker blotches and pebbles
const dirtTex = (() => { const [c, g] = cv(1024, 1024), r = R(5); g.fillStyle = '#b8683a'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 900; i++) { g.fillStyle = `hsla(${16 + r() * 14},${40 + r() * 20}%,${30 + r() * 28}%,${0.25 + r() * 0.4})`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 4 + r() * 40, 3 + r() * 24, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 3000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(60,30,15,.6)' : 'rgba(240,200,160,.5)'; g.fillRect(r() * 1024, r() * 1024, 1 + r() * 3, 1 + r() * 2); } return P.tex(c, 40, 40); })();
const GROUND = pbr('red_laterite_soil_stones', 160, { color: '#f0c0a0' });
const ground = add(new THREE.PlaneGeometry(900, 900), GROUND, 0, 0, 0, scene, false); ground.rotation.x = -Math.PI / 2;
// dirt road along x = -8
const road = add(new THREE.PlaneGeometry(5, 600), pbr('red_sand', [2, 240]), -8, 0.01, -100, scene, false); road.rotation.x = -Math.PI / 2;
for (const s of [-1, 1]) { const rut = add(new THREE.PlaneGeometry(0.35, 600), std({ color: '#8a4a28', roughness: 1 }), -8 + s * 0.8, 0.015, -100, scene, false); rut.rotation.x = -Math.PI / 2; }
const FSOIL = add(new THREE.PlaneGeometry(45, 82), pbr('farm_soil', [10, 18], { color: '#f0c060' }), 18, 0.012, -30, scene, false); FSOIL.rotation.x = -Math.PI / 2;
// instanced vegetation: wheat (golden), dry grass tufts, spinifex
const cardTex = (draw, w = 128, h = 256) => { const [c, g] = cv(w, h); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const wheatTex = cardTex((g, w, h) => { const r = R(8); for (let i = 0; i < 26; i++) { const x = 6 + r() * (w - 12), top = 20 + r() * 50, lean = (r() - 0.5) * 16;
  g.strokeStyle = `hsl(${40 + r() * 8},${60 + r() * 15}%,${50 + r() * 15}%)`; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + lean * 0.3, h * 0.6, x + lean, top + 20); g.stroke();
  g.fillStyle = `hsl(${38 + r() * 8},${70 + r() * 15}%,${55 + r() * 15}%)`; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + lean + (k % 2 ? 2.5 : -2.5), top + k * 5, 3, 5, (k % 2 ? 0.4 : -0.4), 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(255,240,200,.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + lean, top - 2); g.lineTo(x + lean + 3, top - 16); g.stroke(); } });
const grassTex = cardTex((g, w, h) => { const r = R(9); for (let i = 0; i < 40; i++) { const x = w / 2 + (r() - 0.5) * w * 0.7, l = h * (0.4 + r() * 0.6), a = (r() - 0.5) * 1.1;
  g.strokeStyle = `hsl(${42 + r() * 25},${35 + r() * 30}%,${40 + r() * 30}%)`; g.lineWidth = 1.5 + r() * 1.5; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + Math.sin(a) * l * 0.4, h - l * 0.6, x + Math.sin(a) * l, h - l); g.stroke(); } });
const greenTex = cardTex((g, w, h) => { const r = R(10); for (let i = 0; i < 46; i++) { const x = w / 2 + (r() - 0.5) * w * 0.8, l = h * (0.3 + r() * 0.5), a = (r() - 0.5) * 1.3;
  g.strokeStyle = `hsl(${70 + r() * 30},${30 + r() * 25}%,${30 + r() * 22}%)`; g.lineWidth = 2; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + Math.sin(a) * l * 0.4, h - l * 0.6, x + Math.sin(a) * l, h - l); g.stroke(); } });
const vegMat = (map) => new THREE.MeshStandardMaterial({ map, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.75 });
const crossGeo = (w, h) => { const a = new THREE.PlaneGeometry(w, h); a.translate(0, h / 2, 0); const b = a.clone(); b.rotateY(Math.PI / 2); const c = a.clone(); c.rotateY(Math.PI / 4); return BufferGeometryUtils.mergeGeometries([a, b, c]); };
const scatter = (geo, mat, n, fn) => { const im = new THREE.InstancedMesh(geo, mat, n); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  let k = 0; for (let i = 0; i < n * 4 && k < n; i++) { const v = fn(i); if (!v) continue; p.set(v[0], 0, v[1]); e.set(0, v[2] || 0, 0); q.setFromEuler(e); s.setScalar(v[3] || 1); m.compose(p, q, s); im.setMatrixAt(k++, m); }
  im.count = k; im.castShadow = false; im.receiveShadow = true; im.userData.ndSkip = true; scene.add(im); return im; };
// wheat field: x in [-4, 40], z in [-70, 10] (eaten patches near emus are animated by hiding a second field)
const CLEAR = [[20, -40, 7.5], [8.3, -44, 3.2], [9, -58, 4]];
const WHEAT = scatter(crossGeo(0.9, 0.72), vegMat(wheatTex), 9000, (i) => { const r = R(1000 + i); const x = -4 + r() * 44, z = -70 + r() * 80; for (const [cx, cz, cr] of CLEAR) if (Math.hypot(x - cx, z - cz) < cr) return null; return [x, z, r() * 6, 0.8 + r() * 0.4]; });
const GRASS = scatter(crossGeo(0.9, 0.6), vegMat(grassTex), 5000, (i) => { const r = R(20000 + i); const x = -120 + r() * 240, z = -260 + r() * 300; if (x > -4.5 && x < 40.5 && z > -70.5 && z < 10.5) return null; if (Math.abs(x + 8) < 3) return null; if (Math.hypot(x + 60, z - 24) < 9) return null; return [x, z, r() * 6, 0.5 + r() * 0.8]; });
const GREEN = scatter(crossGeo(1.0, 0.6), vegMat(greenTex), 1400, (i) => { const r = R(40000 + i); const x = -120 + r() * 240, z = -260 + r() * 300; if (x > -4.5 && x < 40.5 && z > -70.5 && z < 10.5) return null; if (Math.abs(x + 8) < 3) return null; if (Math.hypot(x + 60, z - 24) < 9) return null; return [x, z, r() * 6, 0.6 + r() * 0.6]; });
// gum trees (eucalyptus): pale twisting trunks + clumpy olive canopies
const BARK = pbr('eucalyptus_bark', [1, 3], { color: '#f4ece0' }), LEAF = std({ color: '#6f8a4a', roughness: 0.8 }), LEAF2 = std({ color: '#8a9a5a', roughness: 0.8 });
const gum = (x, z, s = 1, seed = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); const r = R(seed);
  const tr = add(cyl(0.18, 0.32, 6, 9), BARK, 0, 3, 0, g); tr.rotation.z = (r() - 0.5) * 0.25;
  for (let k = 0; k < 3; k++) { const b = add(cyl(0.06, 0.14, 3, 7), BARK, (r() - 0.5) * 0.8, 4.5 + k * 0.6, (r() - 0.5) * 0.8, g); b.rotation.set((r() - 0.5) * 1.2, 0, (r() - 0.5) * 1.6); }
  for (let k = 0; k < 9; k++) { const m = add(new THREE.IcosahedronGeometry(1 + r() * 0.9, 1), k % 3 ? LEAF : LEAF2, (r() - 0.5) * 4, 6 + r() * 2.5, (r() - 0.5) * 4, g); m.scale.y = 0.6; } return g; };
for (let i = 0; i < 46; i++) { const r = R(600 + i); let x = -100 + r() * 200, z = -240 + r() * 280; if (x > -6 && x < 42 && z > -72 && z < 12) x += 60; if (Math.abs(x + 8) < 4) x += 8; gum(x, z, 0.8 + r() * 0.6, 600 + i); }
// rocks, logs, debris
for (let i = 0; i < 40; i++) { const r = R(800 + i); const x = -60 + r() * 120, z = -200 + r() * 230; if (x > -5 && x < 41 && z > -71 && z < 11) continue; put(i % 2 ? 'rock_07' : 'rock_09', x, 0, z, r() * 6, 1 + r() * 3); }
put('namaqualand_boulder_04', -22, 0, -30, 0.5, 1.4); put('namaqualand_boulder_02', 52, 0, -48, 1.2, 1.6); put('dead_quiver_trunk', -16, 0, -12, 0.3, 1.3); put('dead_quiver_trunk', 48, 0, -70, 2.1, 1.1);
for (let i = 0; i < 6; i++) { const r = R(850 + i); put('wild_rooibos_bush', -14 + r() * 8, 0, -4 - r() * 30, r() * 6, 1.5 + r()); }
// fences: posts + three wires around the wheat field
const POST = std({ map: P.tex(P.beam(4, [28, 25, 35]), 1, 1), roughness: 0.85 }), WIRE = std({ color: '#c8c8c8', metalness: 0.9, roughness: 0.3 });
const fenceLine = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 3); for (let i = 0; i <= n; i++) { const t = i / n, p = add(cyl(0.06, 0.08, 1.2, 6), POST, x0 + (x1 - x0) * t, 0.6, z0 + (z1 - z0) * t); p.rotation.z = Math.sin(i * 7.7) * 0.06; }
  for (const h of [0.45, 0.75, 1.05]) { const w = add(cyl(0.008, 0.008, L, 4), WIRE, (x0 + x1) / 2, h, (z0 + z1) / 2, scene, false); w.rotation.z = Math.PI / 2; w.rotation.y = -Math.atan2(z1 - z0, x1 - x0); } };
fenceLine(-4.5, 11, 40.5, 11); fenceLine(-4.5, 11, -4.5, -71); fenceLine(40.5, 11, 40.5, -71); fenceLine(-4.5, -71, 40.5, -71);
// broken fence section where the emus come through (x 10..16 on the north side z=-71)
// farmhouse with corrugated iron roof + verandah, water tank, windmill
const IRON = (() => { const [c, g] = cv(256, 256); for (let x = 0; x < 256; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#8a9098'); gr.addColorStop(0.5, '#d8dde2'); gr.addColorStop(1, '#7a8088'); g.fillStyle = gr; g.fillRect(x, 0, 16, 256); }
  g.fillStyle = 'rgba(150,70,30,.35)'; const r = R(3); for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(r() * 256, r() * 256, 4 + r() * 14, 3 + r() * 8, 0, 0, 7); g.fill(); } return P.tex(c, 4, 1); })();
const IRON2 = pbr('corrugated_iron', [3, 2], { metalness: 0.6 });
const HOUSE = new THREE.Group(); HOUSE.position.set(22, 0, 22); HOUSE.rotation.y = Math.PI; scene.add(HOUSE);
{ const WB = pbr('weathered_planks', [3, 1], { color: '#f4ead8' }), TRIM = std({ color: '#2f5a3a', roughness: 0.4 });
  add(box(9, 3, 6), WB, 0, 1.5, 0, HOUSE); const roof = add(new THREE.CylinderGeometry(0.01, 5.6, 2.2, 4, 1), IRON2, 0, 4.1, 0, HOUSE); roof.rotation.y = Math.PI / 4; roof.scale.set(1.25, 1, 0.85);
  add(box(9.6, 0.12, 2.6), IRON2, 0, 2.75, 4.2, HOUSE).rotation.x = 0.18; add(box(9.4, 0.25, 2.6), std({ map: P.tex(P.planks(42), 3, 1), color: '#8a6040' }), 0, 0.12, 4.2, HOUSE);
  for (let i = 0; i < 6; i++) add(cyl(0.07, 0.07, 2.5, 8), TRIM, -4.4 + i * 1.76, 1.35, 5.4, HOUSE);
  for (const x of [-2.8, 2.8]) { add(box(1.2, 1.3, 0.08), std({ color: '#ffd890', emissive: '#ffb050', emissiveIntensity: 0.4 }), x, 1.7, 3.02, HOUSE, false); add(box(1.4, 0.12, 0.12), TRIM, x, 2.4, 3.05, HOUSE); for (const s of [-1, 1]) add(box(0.4, 1.4, 0.06), TRIM, x + s * 0.85, 1.7, 3.05, HOUSE); }
  add(box(1.1, 2.1, 0.08), std({ color: '#7a3a22', roughness: 0.5 }), 0, 1.05, 3.04, HOUSE); add(box(0.5, 1.2, 0.5), std({ color: '#b86a4a' }), 3.5, 4.6, -1, HOUSE);
  put('painted_wooden_bench', -2.5, 0.25, 4.6, 0, 1, HOUSE); put('wooden_barrels_01', 5.4, 0, 3.6, 0, 1, HOUSE); put('watering_can_metal_01', 1.4, 0.25, 4.8, 0.5, 1.4, HOUSE); put('wooden_bucket_01', -1.4, 0.25, 4.9, 0, 1, HOUSE); }
const TANK = new THREE.Group(); TANK.position.set(32, 0, 18); scene.add(TANK);
{ for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(cyl(0.08, 0.08, 3, 6), POST, x * 1.1, 1.5, z * 1.1, TANK);
  const tk = add(cyl(1.6, 1.6, 2.6, 28), std({ map: (() => { const t = IRON.clone(); t.repeat.set(1, 6); t.rotation = Math.PI / 2; t.needsUpdate = true; return t; })(), metalness: 0.75, roughness: 0.3 }), 0, 4.3, 0, TANK); add(new THREE.ConeGeometry(1.7, 0.6, 28), std({ color: '#9aa0a8', metalness: 0.8, roughness: 0.3 }), 0, 5.9, 0, TANK); }
const MILL = new THREE.Group(); MILL.position.set(-1, 0, 16); scene.add(MILL);
{ const ST = std({ color: '#7a8088', metalness: 0.7, roughness: 0.35 }); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = add(cyl(0.05, 0.05, 9.2, 6), ST, x * 0.6, 4.5, z * 0.6, MILL); l.rotation.set(-z * 0.06, 0, x * 0.06); }
  for (let y = 1; y < 9; y += 1.6) for (const s of [-1, 1]) { const b = add(cyl(0.02, 0.02, 1.3, 4), ST, 0, y, s * (0.6 - y * 0.06), MILL); b.rotation.z = Math.PI / 2; }
  const head = new THREE.Group(); head.position.set(0, 9.2, 0.3); MILL.add(head); MILL.userData.head = head;
  for (let k = 0; k < 18; k++) { const bl = add(box(0.18, 1.7, 0.02), std({ color: k % 2 ? '#d8dde2' : '#c8322f', metalness: 0.6, roughness: 0.35 }), 0, 0, 0, head); bl.geometry.translate(0, 1.1, 0); bl.rotation.z = k / 18 * Math.PI * 2; bl.rotation.y = 0.3; }
  add(cyl(0.18, 0.18, 0.4, 12), ST, 0, 0, -0.1, head).rotation.x = Math.PI / 2; const tail = add(box(0.04, 1.0, 1.8), std({ color: '#d8dde2', metalness: 0.6, roughness: 0.3 }), 0, 9.3, -1.4, MILL); }
// the dam: a muddy waterhole with a glossy surface (x 60, z -60)
const DAM = new THREE.Group(); DAM.position.set(70, 0, -60); scene.add(DAM);
{ const bank = add(new THREE.CylinderGeometry(16, 19, 0.6, 40), pbr('dry_ground_01', [6, 6], { color: '#c89070' }), 0, 0.0, 0, DAM, false);
  const water = add(new THREE.CircleGeometry(14.5, 48), std({ color: '#1f4f62', metalness: 0.1, roughness: 0.12, envMapIntensity: 0.55 }), 0, 0.32, 0, DAM, false); water.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 30; i++) { const r = R(900 + i), a = r() * 6.28; put('rock_09', Math.cos(a) * (15 + r() * 3), 0.2, Math.sin(a) * (15 + r() * 3), r() * 6, 2 + r() * 2, DAM); }
  for (let i = 0; i < 4; i++) gum(70 + Math.cos(i * 1.7) * 24, -60 + Math.sin(i * 1.7) * 24, 1.1, 700 + i); }
// army camp (x -60, z 20): bell tents, crates, ammo, flagless pole, cooking fire
const CAMP = new THREE.Group(); CAMP.position.set(-60, 0, 20); scene.add(CAMP);
{ const CAN = std({ map: P.tex(P.plaster(77, 40), 2, 2), color: '#d8c8a0', roughness: 0.8 });
  for (const [x, z, s] of [[0, 0, 1], [6, -2, 0.9], [-6, -3, 1.1], [3, -8, 1]]) { const t = add(new THREE.ConeGeometry(2.4 * s, 3.2 * s, 18, 1, true), CAN, x, 1.6 * s, z, CAMP); add(cyl(0.04, 0.04, 3.6 * s, 6), POST, x, 1.8 * s, z, CAMP);
    const fl = add(new THREE.PlaneGeometry(1.0 * s, 1.6 * s), std({ color: '#3a2a20', side: THREE.DoubleSide }), x, 0.8 * s, z + 2.0 * s, CAMP, false); }
  put('wooden_military_crate', 2.5, 0, 3, 0.3, 1, CAMP); put('wooden_military_crate', 2.9, 0.38, 3.1, 0.9, 1, CAMP); put('old_military_crate', -2.4, 0, 3.4, 0.2, 14, CAMP); put('ammo_box', 1.4, 0, 4.2, 0.6, 14, CAMP); put('metal_jerrycan', -1.2, 0, 4.6, 0.4, 1, CAMP);
  put('wooden_picnic_table', -4.5, 0, 4, 0.2, 1, CAMP); put('hatchet', 4.2, 0, 5.2, 1, 3, CAMP); put('Lantern_01', -4.5, 0.7, 4, 0, 1.5, CAMP);
  const fire = new THREE.Group(); fire.position.set(0.5, 0, 6.5); CAMP.add(fire); for (let k = 0; k < 8; k++) add(new THREE.DodecahedronGeometry(0.25), std({ color: '#5a5550' }), Math.cos(k / 8 * 6.28) * 0.6, 0.1, Math.sin(k / 8 * 6.28) * 0.6, fire);
  for (let k = 0; k < 4; k++) { const l = add(cyl(0.07, 0.07, 1.1, 6), std({ color: '#3a2418' }), 0, 0.25, 0, fire); l.rotation.set(Math.PI / 2 - 0.3, k * 0.8, 0); } }
const CAMPFIRE = lamp(-59.5, 0.6, 26.5, '#ff8a3a', 12, 10, 1.4);
// ---- 1930s army truck (Ford AA style), faces +z ----
const TRUCK = new THREE.Group(); scene.add(TRUCK);
{ const PAINT = std({ color: '#4a5a32', metalness: 0.35, roughness: 0.22 }), BLK = std({ color: '#18181c', metalness: 0.5, roughness: 0.3 }), CHR = std({ color: '#dfe4ea', metalness: 1, roughness: 0.12 }), WOOD = std({ map: P.tex(P.planks(61), 2, 1), color: '#a07a50', roughness: 0.6 }), GLS = std({ color: '#203040', metalness: 0.8, roughness: 0.05 });
  add(box(1.5, 1.3, 1.4), PAINT, 0, 1.75, 0.2, TRUCK); add(box(1.6, 0.1, 1.5), PAINT, 0, 2.45, 0.2, TRUCK); add(box(1.3, 0.55, 0.05), GLS, 0, 2.1, 0.92, TRUCK);
  const hood = add(box(1.1, 0.7, 1.5), PAINT, 0, 1.45, 1.65, TRUCK); add(box(1.0, 0.85, 0.08), CHR, 0, 1.45, 2.42, TRUCK); for (let i = 0; i < 9; i++) add(box(0.03, 0.75, 0.02), BLK, -0.4 + i * 0.1, 1.45, 2.47, TRUCK);
  for (const s of [-1, 1]) { const hl = add(cyl(0.14, 0.12, 0.18, 16), CHR, s * 0.62, 1.85, 2.3, TRUCK); hl.rotation.x = Math.PI / 2; add(new THREE.CircleGeometry(0.11, 16), new THREE.MeshBasicMaterial({ color: '#fff6d8' }), s * 0.62, 1.85, 2.4, TRUCK, false);
    const fd = add(new THREE.CylinderGeometry(0.55, 0.55, 0.36, 20, 1, true, 0, Math.PI), BLK, s * 0.78, 0.65, 1.7, TRUCK); fd.rotation.z = Math.PI / 2; fd.rotation.y = s > 0 ? 0 : Math.PI;
    add(box(0.3, 0.06, 2.4), BLK, s * 0.85, 0.95, 0.9, TRUCK); }
  add(box(1.7, 0.18, 0.2), CHR, 0, 0.75, 2.55, TRUCK);
  add(box(2.0, 0.15, 3.2), WOOD, 0, 1.15, -1.9, TRUCK); for (const s of [-1, 1]) add(box(0.08, 0.5, 3.2), WOOD, s * 0.98, 1.45, -1.9, TRUCK); add(box(2.0, 0.5, 0.08), WOOD, 0, 1.45, -3.45, TRUCK);
  add(box(1.6, 0.3, 5.2), BLK, 0, 0.75, -0.6, TRUCK);
  TRUCK.userData.wheels = []; for (const [z, s] of [[1.7, -1], [1.7, 1], [-2.6, -1], [-2.6, 1]]) { const w = new THREE.Group(); w.position.set(s * 0.82, 0.48, z); TRUCK.add(w); const t = add(cyl(0.48, 0.48, 0.25, 22), BLK, 0, 0, 0, w); t.rotation.z = Math.PI / 2;
    const hub = add(cyl(0.22, 0.22, 0.27, 16), std({ color: '#b8322f', metalness: 0.4, roughness: 0.3 }), 0, 0, 0, w); hub.rotation.z = Math.PI / 2; for (let k = 0; k < 8; k++) { const sp = add(box(0.03, 0.4, 0.03), CHR, s * 0.13, 0, 0, w); sp.rotation.x = k / 8 * Math.PI; } TRUCK.userData.wheels.push(w); }
  // Lewis gun on a post in the tray
  const LG = new THREE.Group(); LG.position.set(0, 2.0, -2.2); TRUCK.add(LG); TRUCK.userData.gun = LG; }
const lewis = (parent) => { const g = new THREE.Group(); parent.add(g); const GM = std({ color: '#2a2c30', metalness: 0.85, roughness: 0.28 }), GW = std({ color: '#6a4426', roughness: 0.45 });
  const sh = add(cyl(0.075, 0.075, 1.0, 20), GM, 0, 0, 0.45, g); sh.rotation.x = Math.PI / 2; for (let k = 0; k < 10; k++) { const f = add(cyl(0.085, 0.085, 0.02, 20), GM, 0, 0, 0.1 + k * 0.08, g); f.rotation.x = Math.PI / 2; }
  const br = add(cyl(0.02, 0.02, 0.4, 10), GM, 0, 0, 1.12, g); br.rotation.x = Math.PI / 2; add(box(0.1, 0.12, 0.45), GM, 0, -0.02, -0.15, g); add(box(0.07, 0.14, 0.5), GW, 0, -0.06, -0.6, g); add(box(0.04, 0.12, 0.06), GW, 0, -0.14, -0.25, g);
  const drum = add(cyl(0.2, 0.2, 0.06, 28), GM, 0, 0.1, -0.05, g); for (let k = 0; k < 12; k++) { const rb = add(box(0.18, 0.065, 0.02), std({ color: '#40444a', metalness: 0.9, roughness: 0.25 }), Math.cos(k / 12 * 6.28) * 0.1, 0.1, -0.05 + Math.sin(k / 12 * 6.28) * 0.1, g); rb.rotation.y = -k / 12 * 6.28; }
  for (const s of [-1, 1]) { const l = add(cyl(0.012, 0.012, 0.55, 6), GM, s * 0.12, -0.22, 0.8, g); l.rotation.z = s * 0.4; }
  const flash = add(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3, 1) }), 0, 0, 1.45, g, false); flash.userData.ndSkip = true; flash.visible = false; g.userData.flash = flash; return g; };
const GUN_T = lewis(TRUCK.userData.gun);
const GUN_G = new THREE.Group(); scene.add(GUN_G); const GUN_GG = lewis(GUN_G); // ground-mounted copy (ambush)
{ const GM = std({ color: '#2a2c30', metalness: 0.85, roughness: 0.28 }); for (const a of [0, 2.1, 4.2]) { const l = add(cyl(0.02, 0.02, 1.0, 6), GM, Math.cos(a) * 0.25, -0.45, Math.sin(a) * 0.25, GUN_G); l.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); } }
// glossy ammo belts / brass shells for macro shots
const SHELLS = []; for (let i = 0; i < 40; i++) { const m = add(cyl(0.006, 0.006, 0.05, 8), std({ color: '#e8b84a', metalness: 1, roughness: 0.18 }), 0, 0, 0, scene, false); m.visible = false; SHELLS.push(m); }
// tracers + dust
const TRACERS = []; for (let i = 0; i < 24; i++) { const m = add(box(0.03, 0.03, 1.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.8, 1.2) }), 0, 0, 0, scene, false); m.userData.ndSkip = true; m.visible = false; TRACERS.push(m); }
const dustTex = (() => { const [c, g] = cv(128, 128); for (let i = 0; i < 9; i++) { const x = 34 + (i * 37) % 60, y = 34 + (i * 53) % 60, gr = g.createRadialGradient(x, y, 0, x, y, 34); gr.addColorStop(0, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const DUST = []; for (let i = 0; i < 60; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: dustTex, transparent: true, depthWrite: false, color: '#d8a070', fog: true })); m.userData.ndSkip = true; m.renderOrder = 3; m.visible = false; scene.add(m); DUST.push(m); }
const MOTES = []; for (let i = 0; i < 50; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex('255,230,170'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.userData.ndSkip = true; m.renderOrder = 5; m.visible = false; scene.add(m); MOTES.push(m); }
// feathers burst
const FEATH = []; for (let i = 0; i < 20; i++) { const m = add(new THREE.PlaneGeometry(0.08, 0.2), std({ color: i % 2 ? '#4a3220' : '#6a4a32', side: THREE.DoubleSide }), 0, 0, 0, scene, false); m.userData.ndSkip = true; m.visible = false; FEATH.push(m); }

// ---- emu flock: shared pre-drawn frames (run cycle, idle, peck, moods) on cheap billboards ----
const EMUF = {}; const emuFrame = (key, o) => { const [c, g] = cv(300, 500); g.setTransform(0.5, 0, 0, 0.5, 0, 0); T.fxEmu(new T.Pen(g), o); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; EMUF[key] = t; };
for (let k = 0; k < 8; k++) emuFrame('run' + k, { run: k / 8, mood: 'calm' });
for (let k = 0; k < 8; k++) emuFrame('runA' + k, { run: k / 8, mood: 'angry' });
emuFrame('idle', { mood: 'calm' }); emuFrame('idleS', { mood: 'smug' }); emuFrame('peck0', { peck: 0.5, mood: 'calm' }); emuFrame('peck1', { peck: 1, mood: 'calm' }); emuFrame('shock', { mood: 'shock' });
const EMU_GEO = new THREE.PlaneGeometry(1.3, 2.17); EMU_GEO.translate(0, 2.17 / 2 - 0.05, 0);
const EMUS = []; for (let i = 0; i < 140; i++) { const mat = new THREE.MeshBasicMaterial({ map: EMUF.idle, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, fog: true });
  const m = new THREE.Mesh(EMU_GEO, mat); m.userData.nd = cardNd(EMUF.idle); m.castShadow = true; m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: EMUF.idle, alphaTest: 0.5 }); m.visible = false; scene.add(m); EMUS.push(m); }
const setEmuTex = (m, t) => { if (m.material.map !== t) { m.material.map = t; m.userData.nd.uniforms.map.value = t; m.customDepthMaterial.map = t; m.material.needsUpdate = true; m.customDepthMaterial.needsUpdate = true; } };

// shell pile (camp), a comic row of shells, and the victory crate
const SHELL_GEO = (() => { const a = new THREE.CylinderGeometry(0.008, 0.008, 0.045, 10); const b = new THREE.ConeGeometry(0.008, 0.016, 10); b.translate(0, 0.03, 0); return BufferGeometryUtils.mergeGeometries([a, b]); })(); const BRASS = std({ color: '#ffd060', metalness: 1, roughness: 0.12, envMapIntensity: 1.6 });
const PILE = new THREE.InstancedMesh(SHELL_GEO, BRASS, 1400); { const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(3.2, 3.2, 3.2), p = new THREE.Vector3();
  for (let i = 0; i < 1400; i++) { const r = R(5000 + i), a = r() * 6.28, rr = Math.sqrt(r()) * 1.6, h = (1 - rr / 1.6) * 1.1 * r() ** 0.3; p.set(-57.5 + Math.cos(a) * rr, h + 0.03, 25.2 + Math.sin(a) * rr); e.set(r() * 6, r() * 6, r() * 6); q.setFromEuler(e); mm.compose(p, q, sc); PILE.setMatrixAt(i, mm); } }
PILE.castShadow = true; PILE.receiveShadow = true; scene.add(PILE); PILE.visible = false;
const ROW = []; for (let i = 0; i < 10; i++) { const m = add(SHELL_GEO, BRASS, 0, 0, 0, scene); m.scale.setScalar(4); m.visible = false; ROW.push(m); }
const VCRATE = put('wooden_military_crate', 0, 0, 0, 0.3, 1.2); if (VCRATE) VCRATE.visible = false;
for (const [x, z] of [[-24.4, -78], [-26.2, -84], [-23.6, -92], [-25.8, -100], [-24.9, -66]]) put('wild_rooibos_bush', x, 0, z, x * 3, 2.2);
// ================= light presets =================
const skyEnv = (top, hor, gnd, sun) => { const [c, g] = cv(512, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.5, hor); gr.addColorStop(0.52, gnd); gr.addColorStop(1, gnd); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  g.fillStyle = sun; g.beginPath(); g.ellipse(380, 90, 30, 22, 0, 0, 7); g.fill(); const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return pmrem.fromEquirectangular(t).texture; };
const PRESET = {
  day: { hemi: ['#bfd8ff', '#a0603a', 1.2], key: ['#fff0d0', 3.8], fog: ['#c8d8f0', 0.0018], sky: 1, sun: [0.6, 0.6, 0.5], expo: 1.0, lamps: 0, sat: 1.28, lift: [0, 0, 0], env: skyEnv('#2a6ad8', '#e8f0ff', '#b86a3a', '#ffffff'), bloomK: 0.8, thr: 1.0, rays: 0.5 },
  gold: { hemi: ['#ffd8a8', '#7a3820', 1.05], key: ['#ffc070', 4.2], fog: ['#d89060', 0.0022], sky: 2, sun: [0.85, 0.24, 0.55], expo: 0.95, lamps: 0, sat: 1.32, lift: [0, 0, 0], env: skyEnv('#2a4aa0', '#ffb070', '#7a3418', '#fff0b0'), bloomK: 0.55, thr: 1.25, rays: 0.55 },
  night: { hemi: ['#6a7fb0', '#2a2430', 0.85], key: ['#9fb4e8', 1.2], fog: ['#1a2238', 0.012], sky: 0, sun: [-0.35, 0.42, -1], expo: 1.0, lamps: 1, sat: 1.2, lift: [0.01, 0.012, 0.03], env: env, bloomK: 0.7, thr: 1.1, rays: 0 },
  office: { hemi: ['#8a7a70', '#2a1a14', 0.8], key: ['#ffe0b0', 0.8], fog: ['#1e2840', 0.0005], sky: 0, sun: [0.5, 0.5, -1], expo: 1.05, lamps: 1, sat: 1.2, lift: [0.012, 0.008, 0.01], env: env, bloomK: 0.7, thr: 1.05, rays: 0, zone: 'office' },
};

// ================= per-frame =================
import { stateAt, TOTAL } from './shots.js';
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), camR = new THREE.Vector3();
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const emuTexFor = (e, f) => { const ph = ((f * (e.rate ?? 0.55)) / 8 + (e.ph || 0)) % 1, k = Math.floor(ph * 8) % 8;
  if (e.mode === 'run') return EMUF['run' + k]; if (e.mode === 'runA') return EMUF['runA' + k];
  if (e.mode === 'peck') return (Math.floor(f / 9 + (e.ph || 0) * 7) % 3 === 0) ? EMUF.peck1 : EMUF.peck0;
  return EMUF[e.mode] || EMUF.idle; };

window.renderFrame = (f) => {
  const S = stateAt(f, {});
  const L = PRESET[S.preset || 'day'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2] * (S.hemiK ?? 1);
  moon.color.set(L.key[0]); moon.intensity = L.key[1] * (S.keyK ?? 1);
  scene.fog.color.set(L.fog[0]); scene.fog.density = S.fog ?? L.fog[1];
  skyU.day.value = L.sky; skyU.sunD.value.set(...L.sun); scene.environment = L.env;
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(...L.lift); inkU.flash.value = S.flash || 0; inkU.bloomK.value = L.bloomK; brightU.thr.value = L.thr;
  const zone = L.zone || S.zone || 'farm';
  for (const l of pLights) { l.visible = L.lamps > 0 && l.userData.zone === zone; l.intensity = l.userData.I0 * (S.lampK ?? 1); }
  for (const g of glows) g.visible = (L.lamps > 0 && g.userData.zone === zone) || g.userData.zone === 'fx';
  // camera: optional orbit around the look point + handheld drift + shake
  const sh = S.shake || 0, hh = S.handheld ?? 0.012;
  const look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  if (S.orbit) { const d = pos.clone().sub(look); d.applyAxisAngle(new THREE.Vector3(0, 1, 0), S.orbit); pos.copy(look).add(d); }
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look.x + (rnd(f, 3) - 0.5) * sh * 1.5, look.y + (rnd(f, 4) - 0.5) * sh * 1.5, look.z);
  if (S.roll) camera.rotateZ(rx(S.roll)); camera.fov = S.fov || 45; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  camR.setFromMatrixColumn(camera.matrixWorld, 0);
  sky.position.copy(camera.position);
  const fc = S.shadowAt || S.look, sd = new THREE.Vector3(...L.sun).normalize(); moon.position.set(fc[0] + sd.x * 60, fc[1] + Math.max(sd.y, 0.25) * 60, fc[2] + sd.z * 60); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 18; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix(); }
  // sun rays: project the sun direction to the screen
  { const sv = sd.clone().multiplyScalar(500).add(camera.position).project(camera); inkU.sunUV.value.set(sv.x * 0.5 + 0.5, sv.y * 0.5 + 0.5); inkU.raysK.value = sv.z < 1 ? (S.rays ?? L.rays) : 0; }
  PILE.visible = !!S.pile; ROW.forEach((r, i) => { r.visible = !!S.row && i < (S.rowN ?? 10); if (S.row) r.position.set(S.row[0] + i * 0.16, S.row[1] + 0.11, S.row[2]); });
  if (VCRATE) { VCRATE.visible = !!S.crate; if (S.crate) VCRATE.position.set(...S.crate); }
  // windmill always turning
  MILL.userData.head.rotation.z = -f * 0.08;
  // truck
  TRUCK.visible = !!S.truck; if (S.truck) { TRUCK.position.set(...S.truck.p); TRUCK.rotation.set(S.truck.pitch || 0, S.truck.ry || 0, S.truck.roll || 0); TRUCK.userData.wheels.forEach((w) => (w.rotation.x = (S.truck.dist || 0) / 0.48)); TRUCK.updateMatrixWorld(true);
    TRUCK.userData.gun.rotation.set(S.truck.gunPitch || 0, S.truck.gunYaw || 0, 0); }
  GUN_G.visible = !!S.gunG; if (S.gunG) { GUN_G.position.set(...S.gunG.p); GUN_G.rotation.set(S.gunG.pitch || 0, S.gunG.ry || 0, 0); GUN_G.updateMatrixWorld(true); }
  // muzzle flashes + tracers
  const firing = S.fire && (Math.floor(f / 2) % 2 === 0), gun = S.fire === 'truck' ? GUN_T : GUN_GG;
  GUN_T.userData.flash.visible = firing && S.fire === 'truck'; GUN_GG.userData.flash.visible = firing && S.fire === 'ground';
  TRACERS.forEach((m, i) => { m.visible = !!S.fire && TRACERS.length > 0 && i < (S.tracers ?? 12); if (!m.visible) return; gun.updateMatrixWorld(true);
    const a = ((f * 0.5 + i * 0.37) % 1), from = new THREE.Vector3(0, 0, 1.45).applyMatrix4(gun.matrixWorld), dir = new THREE.Vector3(0, 0, 1).transformDirection(gun.matrixWorld);
    dir.x += (rnd(i, 5) - 0.5) * 0.06; dir.y += (rnd(i, 6) - 0.5) * 0.04; m.position.copy(from).addScaledVector(dir, a * 60); m.lookAt(tmp.copy(m.position).add(dir)); });
  SHELLS.forEach((m, i) => { m.visible = !!S.fire && S.shells; if (!m.visible) return; const a = ((f * 0.13 + i / SHELLS.length) % 1), from = new THREE.Vector3(0.12, 0.05, -0.1).applyMatrix4(gun.matrixWorld);
    m.position.set(from.x + a * 0.8 * (0.5 + rnd(i, 1)), from.y + a * 0.9 - a * a * 2.2, from.z + (rnd(i, 2) - 0.5) * a * 0.6); m.rotation.set(a * 20 + i, a * 13, 0); });
  // emus
  EMUS.forEach((m, i) => { const e = (S.emus || [])[i]; m.visible = !!e; if (!e) return; setEmuTex(m, emuTexFor(e, f)); m.position.set(e.x, e.y || 0, e.z); const s = e.s || 1;
    m.rotation.set(0, Math.atan2(camera.position.x - e.x, camera.position.z - e.z), 0); const dirx = e.dir ? (e.dir[0] * camR.x + e.dir[1] * camR.z) : 1; m.scale.set(s * (dirx < 0 ? -1 : 1), s, s); });
  // dust puffs from emitters
  DUST.forEach((m, i) => { const em = (S.dust || [])[i % Math.max(1, (S.dust || []).length)]; m.visible = !!em && i < (S.dustN ?? 40); if (!m.visible) return; const a = ((f / 30) * (em.rate || 1.2) + rnd(i, 3)) % 1;
    m.position.set(em.p[0] + (rnd(i, 4) - 0.5) * (em.w || 2) + (em.drift ? em.drift[0] * a : 0), em.p[1] + 0.2 + a * (em.h || 1.2), em.p[2] + (rnd(i, 5) - 0.5) * (em.w || 2) + (em.drift ? em.drift[1] * a : 0));
    m.scale.setScalar((0.5 + a * 2.2) * (em.s || 1)); m.quaternion.copy(camera.quaternion); m.material.opacity = (1 - a) * (em.k ?? 0.55); m.material.color.set(em.col || '#d8a070'); });
  MOTES.forEach((m, i) => { m.visible = !!S.motes; if (!m.visible) return; const t = f / 30; m.position.set(camera.position.x + (rnd(i, 1) - 0.5) * 6 + Math.sin(t * 0.3 + i) * 0.3, camera.position.y - 1 + rnd(i, 2) * 3 + Math.sin(t * 0.5 + i * 2) * 0.2, camera.position.z - 1.5 - rnd(i, 3) * 6);
    m.scale.setScalar(0.03 + rnd(i, 4) * 0.05); m.quaternion.copy(camera.quaternion); m.material.opacity = 0.6 + 0.4 * Math.sin(t * 3 + i); });
  FEATH.forEach((m, i) => { const F = S.feathers; m.visible = !!F; if (!F) return; const a = Math.min(1, F.k + rnd(i, 1) * 0.1); m.position.set(F.p[0] + (rnd(i, 2) - 0.5) * 2 * a, F.p[1] + a * 1.2 - a * a * 1.0 + rnd(i, 3) * 0.5, F.p[2] + (rnd(i, 4) - 0.5) * 2 * a); m.rotation.set(a * 9 + i, a * 7, a * 5); });
  // bang (re-used for gun jam puff / dynamite-like pops)
  bang.visible = !!S.bang; bangLight.intensity = S.bang ? 10 * S.bang.k : 0; if (S.bang) { bang.position.set(...S.bang.p); bang.scale.setScalar(0.2 + 0.4 * S.bang.k); bangLight.position.set(S.bang.p[0], S.bang.p[1] + 0.5, S.bang.p[2] + 0.5); }
  for (const g of glows) { g.quaternion.copy(camera.quaternion); g.material.opacity = g.userData.k0 * Math.exp(-g.position.distanceTo(camera.position) * 0.04); }
  if (bang.userData.g) { bang.userData.g.quaternion.copy(camera.quaternion); bang.userData.g.scale.setScalar(1.4); }
  // cards (characters, hero emus, fx)
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw); c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(camera.position.x - a.x, camera.position.z - a.z), a.roll || 0); c.mat.color.set(a.tint || S.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2; c.mesh.castShadow = !a.fx;
    c.blob.visible = !a.fx && a.blob !== false; c.blob.position.set(a.x, (a.ground ?? a.y) + 0.015, a.z); c.blob.scale.set(1.0 * s * (a.bw || 1), 0.55 * s, 1); });
  // passes
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.autoUpdate = false; swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false); scene.fog = fog; renderer.shadowMap.autoUpdate = true;
  renderer.setRenderTarget(rtB1); renderer.render(brightScene, fsCam);
  for (let k = 0; k < 3; k++) { blurU.src.value = rtB1.texture; blurU.dir.value.set(1 / (W / 4), 0); renderer.setRenderTarget(rtB2); renderer.render(blurScene, fsCam); blurU.src.value = rtB2.texture; blurU.dir.value.set(0, 1 / (H / 4)); renderer.setRenderTarget(rtB1); renderer.render(blurScene, fsCam); }
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = S.focus || 5; dofU.cinf.value = Math.min(2.2, (S.cinf ?? 3) * 0.35); renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;

window.ready = true;