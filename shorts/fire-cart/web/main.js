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

const NAMES = ['Barrel_01', 'wooden_crate_01', 'wooden_crate_02', 'wooden_barrels_01', 'wooden_bucket_01', 'rock_07', 'rock_09', 'vintage_hand_drill', 'wooden_hammer_01', 'hand_plane_no4', 'wooden_axe_02', 'wooden_bucket_02', 'wooden_stool_02', 'wooden_bowl_01', 'lantern_chandelier_01', 'brass_diya_lantern', 'katana_stand_01'];
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
const PBRN = ['japanese_stone_wall', 'grass_path_2', 'leafy_grass', 'grey_roof_tiles', 'hinoki_planks', 'japanese_cedar_planks', 'cobblestone_floor_04', 'castle_wall_slates', 'fine_grained_wood', 'sparse_grass', 'rock_boulder_dry'];
await Promise.all(PBRN.flatMap((n) => ['diff', 'nor', 'rough'].map((k) => new Promise((res) => TXL.load(`tex/${n}_${k}.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (k === 'diff') t.colorSpace = THREE.SRGBColorSpace; TX[n + k] = t; res(); }, undefined, () => res())))));
const pbr = (n, rep, o = {}) => { const r = Array.isArray(rep) ? rep : [rep, rep]; const cl = (t) => { const c = t.clone(); c.repeat.set(r[0], r[1]); c.needsUpdate = true; return c; };
  return new THREE.MeshStandardMaterial({ map: cl(TX[n + 'diff']), normalMap: cl(TX[n + 'nor']), roughnessMap: cl(TX[n + 'rough']), roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2), ...o }); };
const R = (s) => P.rng(s);

// ================= HAENGJU HILLTOP FORT, 1593 =================
ZONE = 'fort';
// terrain: plateau (y 0) inside the wall (z > -12), a steep grassy slope down to the valley outside (z < -16), hills far away
const hgt = (x, z) => { let y = 0; if (z < -16) { const d = -16 - z; y = -3 - Math.min(30, d * 0.36) + Math.sin(x * 0.07) * Math.min(1, d / 20) * 1.2; } else if (z < -12) y = -3 * ((-12 - z) / 4) ** 0.2 * 0;
  if (z < -16) y = Math.max(y, -33); const far = Math.max(0, Math.hypot(x, z + 40) - 150); y += far * 0.35 + Math.sin(x * 0.03 + z * 0.02) * Math.min(1, far / 40) * 8; return y; };
window.HGT = hgt;
{ const g = new THREE.PlaneGeometry(700, 700, 260, 260); g.rotateX(-Math.PI / 2); const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); pa.setY(i, z > -16 && z < -12 ? -3 : hgt(x, z)); } g.computeVertexNormals();
  const GR = pbr('leafy_grass', 180, { color: '#8ab850' }); const terr = add(g, GR, 0, 0, -40, scene, false); terr.position.set(0, 0, 0); terr.geometry.translate(0, 0, 0); }
// courtyard stone paving + dirt path
const yard = add(new THREE.PlaneGeometry(26, 40), pbr('cobblestone_floor_04', [6, 9], { color: '#f0e8dc' }), 0, 0.015, 8, scene, false); yard.rotation.x = -Math.PI / 2;
const path = add(new THREE.PlaneGeometry(3.4, 90), pbr('grass_path_2', [1, 26]), 0, 0, 0, scene, false); { const pg = path.geometry; pg.rotateX(-Math.PI / 2); const pa = pg.attributes.position; for (let i = 0; i < pa.count; i++) { const z = pa.getZ(i) - 62; pa.setZ(i, z); pa.setY(i, hgt(pa.getX(i) * 0 + 4, z) + 0.06); pa.setX(i, pa.getX(i) + 4 + Math.sin(z * 0.08) * 3); } pg.computeVertexNormals(); }
// the wall: outer face from the slope to the walkway (y 3), crenellated parapet on the outer edge
const STONE = pbr('japanese_stone_wall', [30, 3], { color: '#f4efe6' }), STONE2 = pbr('japanese_stone_wall', [1, 1], { color: '#e0dcd4' });
const WALL_Z0 = -16, WALL_Z1 = -12, WALK = 3;
add(box(110, 6.6, 4), STONE, 0, -0.3, -14, scene); add(box(110, 0.12, 3.6), pbr('cobblestone_floor_04', [40, 1], { color: '#d8d0c4' }), 0, WALK + 0.02, -13.8, scene);
const CARTX = [-38, -32.9, -27.8, -22.7, -17.6, -12.5, -7.4, 7.9, 13, 18.1, 23.2, 28.3, 33.4, 38.5]; for (let x = -54; x <= 54; x += 2.4) { if (CARTX.some((c) => Math.abs(c - x) < 1.5)) continue; add(box(1.6, 1.3, 0.6), STONE2, x, WALK + 0.65, -15.7, scene); }
add(box(110, 0.5, 0.65), pbr('japanese_stone_wall', [50, 0.4], { color: '#e0dcd4' }), 0, WALK + 0.25, -15.7, scene);
for (const sx of [-22, 22]) for (let k = 0; k < 10; k++) add(box(2.2, 0.3, 0.6), STONE2, sx, 0.15 + k * 0.3, -11.7 + (9 - k) * 0.6, scene); // stairs up to the walkway
// Korean tiled roof: hip roof grid with upturned eaves
const ROOF = pbr('grey_roof_tiles', [4, 4], { color: '#8a929c', roughness: 0.7, metalness: 0.15 });
const dancheong = (() => { const [c, g] = cv(512, 64); const cols = ['#2f8a6a', '#c8322f', '#2f5a9a', '#e8c25a', '#f4ead8']; for (let x = 0; x < 512; x += 32) { g.fillStyle = cols[(x / 32) % 5]; g.fillRect(x, 0, 32, 64); g.fillStyle = '#ffffff55'; g.beginPath(); g.arc(x + 16, 32, 10, 0, 7); g.fill(); } return P.tex(c, 4, 1); })();
const koreanRoof = (w, d, h, parent, x = 0, y = 0, z = 0) => { const n = 30, geo = new THREE.PlaneGeometry(w, d, n, n); geo.rotateX(-Math.PI / 2); const pa = geo.attributes.position;
  for (let i = 0; i < pa.count; i++) { const u = pa.getX(i) / (w / 2), v = pa.getZ(i) / (d / 2), ridge = Math.max(Math.abs(u) * 0.75 + 0.25 * Math.abs(u) ** 6, Math.abs(v)); let yy = h * (1 - ridge); yy += h * 0.45 * Math.pow(Math.abs(u * v), 4); yy += h * 0.12 * Math.pow(ridge, 6); pa.setY(i, yy); }
  geo.computeVertexNormals(); const m = add(geo, ROOF, x, y, z, parent); m.material.side = THREE.DoubleSide;
  add(box(w * 0.55, 0.22, 0.22), std({ color: '#5a606a', roughness: 0.5 }), x, y + h + 0.05, z, parent); for (const s of [-1, 1]) { add(box(w * 0.78, 0.3, 0.16), std({ map: dancheong }), x, y - 0.12, z + s * d * 0.39, parent); add(box(0.16, 0.3, d * 0.78), std({ map: dancheong }), x + s * w * 0.39, y - 0.12, z, parent); }
  const ceil = add(new THREE.PlaneGeometry(w * 0.78, d * 0.78), std({ color: '#6a4a32', roughness: 0.8, side: THREE.DoubleSide }), x, y - 0.05, z, parent, false); ceil.rotation.x = Math.PI / 2; return m; };
const PILLAR = std({ color: '#a8262c', roughness: 0.45 }), BEAM = std({ map: dancheong, roughness: 0.6 });
const pavilion = (x, y, z, w = 6, d = 4, s = 1) => { const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g);
  for (const px of [-1, 1]) for (const pz of [-1, 1]) add(cyl(0.18, 0.2, 3.2, 12), PILLAR, px * (w / 2 - 0.4), 1.6, pz * (d / 2 - 0.4), g);
  add(box(w - 0.4, 0.4, 0.3), BEAM, 0, 3.15, d / 2 - 0.4, g); add(box(w - 0.4, 0.4, 0.3), BEAM, 0, 3.15, -d / 2 + 0.4, g);
  koreanRoof(w + 2.4, d + 2.2, 1.9, g, 0, 3.5, 0); return g; };
const GATE = pavilion(0, WALK, -13.9, 8, 3.4, 1.05); pavilion(-46, WALK, -13.9, 4.4, 3.2, 0.9); pavilion(46, WALK, -13.9, 4.4, 3.2, 0.9);
// buildings inside the fort (white plaster + timber + tiled roofs)
const PLAS = std({ map: P.tex(P.plaster(33, 40), 2, 1), color: '#f6f0e4', roughness: 0.8 }), TIMB = pbr('japanese_cedar_planks', [2, 1], { color: '#8a5a3a' });
const house = (x, z, w, d, ry = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); add(box(w, 2.8, d), PLAS, 0, 1.4, 0, g); add(box(w + 0.1, 0.3, d + 0.1), TIMB, 0, 2.8, 0, g);
  for (let k = -1; k <= 1; k++) add(box(0.22, 2.8, d + 0.06), TIMB, k * w / 3, 1.4, 0, g); add(box(w + 0.1, 0.5, d + 0.1), std({ color: '#7a6a5a' }), 0, 0.25, 0, g); koreanRoof(w + 2, d + 2, 1.6, g, 0, 3.1, 0); return g; };
house(-14, 18, 8, 5); house(14, 24, 7, 5); house(-26, 6, 6, 4.5, 0.4); house(28, 4, 6, 4.5, -0.3); house(0, 32, 10, 6);
// courtyard props, banners, weapon racks, lanterns
const FLAG = (c1, c2, sym) => { const [c, g] = cv(256, 384); g.fillStyle = c1; g.fillRect(0, 0, 256, 384); g.fillStyle = c2; g.fillRect(0, 0, 256, 34); g.fillRect(0, 0, 34, 384); g.strokeStyle = c2; g.lineWidth = 12; g.beginPath(); g.arc(140, 190, 62, 0, 7); g.stroke(); g.fillStyle = c2; g.beginPath(); g.arc(140, 190, 26, 0, 7); g.fill(); for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(256, i * 48); g.lineTo(230, i * 48 + 24); g.lineTo(256, i * 48 + 48); g.fill(); } return P.tex(c); };
const FLAGS = []; const banner = (x, y, z, c1, c2) => { add(cyl(0.05, 0.06, 7, 8), std({ color: '#4a3220' }), x, y + 3.5, z); const geo = new THREE.PlaneGeometry(1.4, 2.2, 12, 6); geo.translate(0.75, 0, 0);
  const m = add(geo, std({ map: FLAG(c1, c2), side: THREE.DoubleSide, roughness: 0.7 }), x, y + 5.6, z, scene, false); m.userData.base = geo.attributes.position.array.slice(); m.userData.ph = x * 0.3; FLAGS.push(m); return m; };
for (let i = 0; i < 9; i++) { const x = -40 + i * 10; banner(x + 1.5, WALK, -12.4, ['#2f5a9a', '#c8322f', '#2f8a6a', '#e8c25a'][i % 4], ['#f4ead8', '#ffd84a', '#f4ead8', '#c8322f'][i % 4]); }
for (const [x, z] of [[-8, 2], [8, 2], [-8, 14], [8, 14]]) banner(x, 0, z, '#c8322f', '#ffd84a');
const rack = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); const W = pbr('fine_grained_wood', [1, 1], { color: '#8a5a3a' }); add(box(2, 0.12, 0.12), W, 0, 1.6, 0, g); add(box(2, 0.12, 0.12), W, 0, 0.5, 0, g); for (const s of [-1, 1]) add(box(0.12, 1.8, 0.12), W, s * 0.95, 0.9, 0, g);
  for (let k = 0; k < 6; k++) { add(cyl(0.02, 0.02, 2.4, 6), std({ color: '#6a4426' }), -0.8 + k * 0.32, 1.2, 0.08, g); add(new THREE.ConeGeometry(0.04, 0.22, 6), std({ color: '#c8d0d8', metalness: 0.9, roughness: 0.2 }), -0.8 + k * 0.32, 2.5, 0.08, g); } };
rack(-6, -9.4, 0); rack(6, -9.4, 0); rack(-18, 10, 0.6);
for (let i = 0; i < 14; i++) { const r = R(300 + i); put(i % 3 ? 'wooden_barrels_01' : 'wooden_crate_02', -24 + r() * 48, 0, -6 + r() * 30, r() * 6, 1); }
// workshop pavilion (night scenes): bench, tools, hanging lanterns, shavings, the wood block
const WS = new THREE.Group(); WS.position.set(16, 0, 10); scene.add(WS);
{ for (const px of [-1, 1]) for (const pz of [-1, 1]) add(cyl(0.16, 0.18, 3, 10), PILLAR, px * 3.2, 1.5, pz * 2.2, WS); koreanRoof(8.6, 6.4, 1.6, WS, 0, 3.2, 0);
  const W = pbr('fine_grained_wood', [2, 1], { color: '#a87850' }); add(box(3.2, 0.14, 1.2), W, 0, 0.92, 0, WS); for (const sx of [-1.4, 1.4]) for (const sz of [-0.45, 0.45]) add(box(0.12, 0.92, 0.12), W, sx, 0.46, sz, WS);
  put('vintage_hand_drill', -1.0, 0.99, 0.3, 0.5, 1.3, WS); put('wooden_hammer_01', 1.1, 0.99, 0.35, 1.2, 1.3, WS); put('hand_plane_no4', 0.9, 0.99, -0.3, 0.3, 1.2, WS); put('wooden_axe_02', -2.4, 0, 1.4, 1.5, 1.2, WS);
  put('wooden_bucket_02', 2.4, 0, 1.2, 0, 1.2, WS); put('wooden_stool_02', -0.4, 0, 1.0, 0.4, 1.1, WS); put('wooden_bowl_01', 0.6, 0.99, 0.45, 0, 1.3, WS);
  for (let i = 0; i < 60; i++) { const r = R(900 + i); const sh = add(new THREE.PlaneGeometry(0.06, 0.03), std({ color: '#e8c89a', side: THREE.DoubleSide }), -1.2 + r() * 2.6, 0.02 + (r() < 0.3 ? 0.98 : 0), -1 + r() * 2.4, WS, false); sh.rotation.set(-Math.PI / 2, 0, r() * 6); } }
const WSL = [lamp(14.6, 2.5, 10.6, '#ffb050', 7, 10, 1.0), lamp(17.6, 2.5, 9.4, '#ffb050', 6, 10, 0.9)]; put('lantern_chandelier_01', -1.4, 2.6, 0.6, 0, 1.0, WS); put('brass_diya_lantern', 1.6, 2.6, -0.6, 0, 1.4, WS);
for (const [x, z] of [[-8, 2], [8, 2], [-14, 15], [6, 22]]) lamp(x, 1.8, z + 0.6, '#ffb060', 5, 12, 0.9);
for (const [x, z] of [[-8, 2.6], [8, 2.6], [-14, 15.6], [6, 22.6]]) { add(cyl(0.05, 0.05, 1.8, 6), std({ color: '#3a2418' }), x, 0.9, z); add(box(0.3, 0.4, 0.3), std({ color: '#ffd890', emissive: '#ffa040', emissiveIntensity: 1.2 }), x, 1.8, z, scene, false); }
// the wooden block that gets drilled (canvas texture shows n holes)
const holeTex = (() => { const [c, g] = cv(512, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData = { c, g, n: -1 }; return t; })();
const HOLE_ORDER = [...Array(100).keys()].sort((a, b) => Math.hypot(a % 10 - 4.5, Math.floor(a / 10) - 4.5) - Math.hypot(b % 10 - 4.5, Math.floor(b / 10) - 4.5));
const drawHoles = (n) => { const { c, g } = holeTex.userData; if (holeTex.userData.n === n) return; holeTex.userData.n = n; const img = TX['fine_grained_wooddiff'].image; g.drawImage(img, 0, 0, 512, 512); g.fillStyle = 'rgba(200,140,80,.35)'; g.fillRect(0, 0, 512, 512);
  for (let j = 0; j < Math.min(100, n); j++) { const i = HOLE_ORDER[j]; const cx = 46 + (i % 10) * 46.7, cy = 46 + Math.floor(i / 10) * 46.7; const gr = g.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 15); gr.addColorStop(0, '#120a06'); gr.addColorStop(0.7, '#2a1a0e'); gr.addColorStop(1, '#8a5a34'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 14, 0, 7); g.fill(); g.strokeStyle = '#f0d0a0'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, 15, 3.6, 5.6); g.stroke(); }
  holeTex.needsUpdate = true; };
drawHoles(0);
const BLOCK = add(box(0.9, 0.9, 0.45), [std({ map: TX['fine_grained_wooddiff'], color: '#d8a878' }), std({ map: TX['fine_grained_wooddiff'], color: '#d8a878' }), std({ map: TX['fine_grained_wooddiff'], color: '#d8a878' }), std({ map: TX['fine_grained_wooddiff'], color: '#d8a878' }), std({ map: holeTex, roughness: 0.6 }), std({ map: TX['fine_grained_wooddiff'], color: '#c89868' })], 16, 1.44, 10.1, scene);
// pine trees (Korean red pine): orange trunks, flat layered canopies
const PBARK = std({ color: '#a85a3a', roughness: 0.8 }), PNEED = std({ color: '#2f6a3a', roughness: 0.75 }), PNEED2 = std({ color: '#3f8a4a', roughness: 0.75 });
const pine = (x, z, s = 1, seed = 1) => { const y = hgt(x, z); if (z > -16 && z < -11) return; const g = new THREE.Group(); g.position.set(x, z > -12 ? 0 : y, z); g.scale.setScalar(s); scene.add(g); const r = R(seed);
  const tr = add(cyl(0.16, 0.3, 7, 8), PBARK, 0, 3.5, 0, g); tr.rotation.z = (r() - 0.5) * 0.3;
  for (let k = 0; k < 5; k++) { const c = add(new THREE.SphereGeometry(1.4 + r() * 0.8, 12, 6), k % 2 ? PNEED : PNEED2, (r() - 0.5) * 2.4, 4.5 + k * 0.9, (r() - 0.5) * 2.4, g); c.scale.y = 0.35; } };
for (let i = 0; i < 90; i++) { const r = R(1200 + i); const x = -120 + r() * 240, z = -110 + r() * 170; if (z > -18 && z < 40 && Math.abs(x) < 56) continue; pine(x, z, 0.9 + r() * 0.7, 1200 + i); }
for (let i = 0; i < 10; i++) pine(-40 + i * 9 + R(i)() * 3, 36 + R(i + 9)() * 6, 1.1, 1500 + i);
// grass tufts and wildflowers on the slope and plateau (instanced, heights follow the terrain)
const tuftTex = (() => { const [c, g] = cv(128, 128), r = R(9); for (let i = 0; i < 50; i++) { const x = 64 + (r() - 0.5) * 90, l = 40 + r() * 80, a = (r() - 0.5) * 1.2; g.strokeStyle = `hsl(${85 + r() * 30},${45 + r() * 25}%,${30 + r() * 25}%)`; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, 128); g.quadraticCurveTo(x + Math.sin(a) * l * 0.4, 128 - l * 0.6, x + Math.sin(a) * l, 128 - l); g.stroke(); }
  for (let i = 0; i < 6; i++) { g.fillStyle = ['#ffffff', '#ffd84a', '#ff8ab0', '#a8c8ff'][i % 4]; g.beginPath(); g.arc(20 + r() * 88, 20 + r() * 50, 4, 0, 7); g.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
{ const a = new THREE.PlaneGeometry(0.9, 0.7); a.translate(0, 0.35, 0); const b = a.clone(); b.rotateY(Math.PI / 2); const geo = BufferGeometryUtils.mergeGeometries([a, b]);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ map: tuftTex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 }), 7000); const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3(); let k = 0;
  for (let i = 0; i < 20000 && k < 7000; i++) { const r = R(30000 + i); const x = -90 + r() * 180, z = -95 + r() * 130; if (z > -17 && z < -11) continue; if (z > -11 && Math.abs(x) < 14 && z < 30) continue; const y = z > -12 ? 0 : hgt(x, z); p.set(x, y, z); e.set(0, r() * 6, 0); q.setFromEuler(e); sc.setScalar(0.7 + r() * 0.9); mm.compose(p, q, sc); im.setMatrixAt(k++, mm); }
  im.count = k; im.receiveShadow = true; im.userData.ndSkip = true; scene.add(im); }
for (let i = 0; i < 30; i++) { const r = R(700 + i); const x = -60 + r() * 120, z = -90 + r() * 70; if (z > -18) continue; put('rock_07', x, hgt(x, z), z, r() * 6, 2 + r() * 3); }
// far mountains
for (let i = 0; i < 26; i++) { const r = R(1600 + i), a = -Math.PI * 0.95 + r() * Math.PI * 0.9 - Math.PI * 0.05, d = 260 + r() * 140; const m = add(new THREE.IcosahedronGeometry(60 + r() * 50, 2), std({ color: i % 3 ? '#4f8a4a' : '#3f7a5a', roughness: 0.9, flatShading: true }), Math.cos(a) * d, -20, Math.sin(a) * d - 40, scene, false); m.scale.y = 0.55 + r() * 0.4; }

// ================= HWACHA =================
const HOLES_TEX = (() => { drawHoles(100); const t = holeTex.clone(); const [c, g] = cv(512, 512); g.drawImage(holeTex.userData.c, 0, 0); const tt = new THREE.CanvasTexture(c); tt.colorSpace = THREE.SRGBColorSpace; drawHoles(0); return tt; })();
const ARROW_GEO = (() => { const sh = new THREE.CylinderGeometry(0.008, 0.008, 1.1, 5); sh.rotateX(Math.PI / 2); const tb = new THREE.CylinderGeometry(0.022, 0.022, 0.2, 8); tb.rotateX(Math.PI / 2); tb.translate(0, 0, -0.32);
  const hd = new THREE.ConeGeometry(0.014, 0.06, 6); hd.rotateX(-Math.PI / 2); hd.translate(0, 0, -0.58); const fl = new THREE.PlaneGeometry(0.05, 0.12); fl.rotateX(Math.PI / 2); fl.rotateZ(Math.PI / 2); fl.translate(0, 0, 0.5); const fl2 = fl.clone(); fl2.rotateZ(Math.PI / 2);
  return BufferGeometryUtils.mergeGeometries([sh, tb, hd, fl, fl2].map((g) => g.toNonIndexed())); })(); // points -z
const ARROW_MAT = std({ color: '#d8b080', roughness: 0.5 }); ARROW_MAT.onBeforeCompile = () => {};
const TUBE_COL = new THREE.Color('#c8322f');
const HW = [];
const hwacha = (x, y, z, ry = 0, n = 100) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); const W = pbr('fine_grained_wood', [1, 1], { color: '#b88858' }), W2 = pbr('fine_grained_wood', [1, 2], { color: '#8a6040' });
  for (const s of [-1, 1]) { const wh = new THREE.Group(); wh.position.set(s * 0.72, 0.55, 0.2); g.add(wh); const rim = add(new THREE.TorusGeometry(0.52, 0.05, 8, 24), W2, 0, 0, 0, wh); rim.rotation.y = Math.PI / 2; for (let k = 0; k < 8; k++) { const sp = add(box(0.04, 1.0, 0.05), W2, 0, 0, 0, wh); sp.rotation.x = k / 8 * Math.PI; } add(cyl(0.1, 0.1, 0.18, 12), W2, 0, 0, 0, wh).rotation.z = Math.PI / 2; }
  add(cyl(0.04, 0.04, 1.6, 8), W2, 0, 0.55, 0.2, g).rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) { const sh = add(box(0.1, 0.1, 3.0), W, s * 0.45, 0.62, 0.7, g); sh.rotation.x = -0.12; }
  const L = new THREE.Group(); L.position.set(0, 0.95, 0.1); L.rotation.x = 0.42; g.add(L); g.userData.launcher = L;
  add(box(1.05, 1.05, 0.5), W, 0, 0.5, 0, L); const face = add(new THREE.PlaneGeometry(1.0, 1.0), std({ map: HOLES_TEX, roughness: 0.6 }), 0, 0.5, -0.255, L, false); face.rotation.y = Math.PI;
  for (const s of [-1, 1]) add(box(0.06, 1.1, 0.56), W2, s * 0.53, 0.5, 0, L); add(box(1.12, 0.06, 0.56), W2, 0, 1.03, 0, L); add(box(1.12, 0.06, 0.56), W2, 0, -0.03, 0, L);
  const im = new THREE.InstancedMesh(ARROW_GEO, ARROW_MAT, n); const mm = new THREE.Matrix4(); const pts = [];
  for (let i = 0; i < n; i++) { const hx = -0.41 + (i % 10) * 0.091, hy = 0.09 + Math.floor(i / 10) * 0.091; pts.push([hx, hy]); mm.makeTranslation(hx, hy, 0.25); im.setMatrixAt(i, mm); im.setColorAt(i, new THREE.Color(1, 1, 1)); }
  im.castShadow = true; L.add(im); g.userData.arrows = im; g.userData.holes = pts;
  // fuses: thin dark cords from each arrow tail to a knot behind, then one string to the side
  const fz = []; for (let i = 0; i < n; i += 3) { const [hx, hy] = pts[i]; const c = add(cyl(0.004, 0.004, 1, 4), std({ color: '#2a2018' }), 0, 0, 0, L, false); const a = new THREE.Vector3(hx, hy, 0.82), b = new THREE.Vector3(0, 0.5, 1.15); c.position.copy(a).add(b).multiplyScalar(0.5); c.scale.y = a.distanceTo(b); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); c.userData.ndSkip = true; fz.push(c); }
  const knot = new THREE.Vector3(0, 0.5, 1.15), end = new THREE.Vector3(0.9, -0.2, 1.4); const st = add(cyl(0.007, 0.007, 1, 5), std({ color: '#3a2a18' }), 0, 0, 0, L, false); st.position.copy(knot).add(end).multiplyScalar(0.5); st.scale.y = knot.distanceTo(end); st.userData.ndSkip = true;
  g.userData.fuse = [end, knot]; st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), knot.clone().sub(end).normalize());
  HW.push(g); return g; };
// hero cart in the workshop (index 0), carts on the wall (1..)
hwacha(15.2, 0, 12.6, Math.PI);
for (let i = 0; i < 16; i++) { const x = -38 + i * 5.1; if (Math.abs(x) < 6) continue; hwacha(x, WALK, -13.4, 0, i === 9 ? 100 : 40); }
const HERO_WALL = HW.find((h) => Math.abs(h.position.x - 2.8) < 0.01) || HW[9];
// flying rockets + smoke trails + flame glows (pooled)
const NR = 700, ROCK = new THREE.InstancedMesh(ARROW_GEO, std({ color: '#d8b080', roughness: 0.5 }), NR); ROCK.count = 0; ROCK.frustumCulled = false; scene.add(ROCK);
const smokeTex = (() => { const [c, g] = cv(128, 128); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const NT = 3200, TRAIL = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: smokeTex, transparent: true, depthWrite: false, color: '#e8ecf4', opacity: 0.5, fog: true }), NT); TRAIL.count = 0; TRAIL.frustumCulled = false; TRAIL.userData.ndSkip = true; TRAIL.renderOrder = 3; scene.add(TRAIL);
const NF = 700, FLAME = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex('255,180,80'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), NF); FLAME.count = 0; FLAME.frustumCulled = false; FLAME.userData.ndSkip = true; FLAME.renderOrder = 5; scene.add(FLAME);
const SPARK = []; for (let i = 0; i < 110; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex('255,220,140'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.userData.ndSkip = true; m.renderOrder = 6; m.visible = false; scene.add(m); SPARK.push(m); }
const DUST = []; for (let i = 0; i < 50; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: smokeTex, transparent: true, depthWrite: false, color: '#c8b8a0', fog: true })); m.userData.ndSkip = true; m.renderOrder = 3; m.visible = false; scene.add(m); DUST.push(m); }
const MOTES = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex('255,230,170'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.userData.ndSkip = true; m.renderOrder = 5; m.visible = false; scene.add(m); MOTES.push(m); }
const CHIPS = []; for (let i = 0; i < 24; i++) { const m = add(new THREE.PlaneGeometry(0.03, 0.015), std({ color: '#f0d0a0', side: THREE.DoubleSide }), 0, 0, 0, scene, false); m.userData.ndSkip = true; m.visible = false; CHIPS.push(m); }

// ================= enemy army: shared pre-drawn frames on billboards =================
const ARMF = {}; const armyFrame = (key, who, o) => { const [c, g] = cv(300, 500); g.setTransform(0.5, 0, 0, 0.5, 0, 0); T.romanFront(new T.Pen(g), who, o); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; ARMF[key] = t; };
for (const [v, who] of [[0, 'ashi'], [1, 'ashi2']]) { for (let k = 0; k < 4; k++) { armyFrame(`m${v}_${k}`, who, { expr: v ? 'stern' : 'stubborn', L: 'hang', R: 'spear', step: k / 4, stride: 14, bob: Math.abs(Math.sin(k / 4 * Math.PI * 2)) * 0.02 });
  armyFrame(`r${v}_${k}`, who, { expr: 'shock', L: 'up', R: 'up', step: k / 4, stride: 26, sweat: 2 }); } armyFrame(`s${v}`, who, { expr: 'stubborn', L: 'shield', R: 'spear' }); }
const ARMY_GEO = new THREE.PlaneGeometry(CM * 0.6, CM); ARMY_GEO.translate(0, CM / 2 - CM * 0.025, 0);
const ARMY = []; for (let i = 0; i < 420; i++) { const mat = new THREE.MeshBasicMaterial({ map: ARMF.m0_0, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, fog: true });
  const m = new THREE.Mesh(ARMY_GEO, mat); m.userData.nd = cardNd(ARMF.m0_0); m.castShadow = true; m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: ARMF.m0_0, alphaTest: 0.5 }); m.visible = false; scene.add(m); ARMY.push(m); }
const setArmyTex = (m, t) => { if (m.material.map !== t) { m.material.map = t; m.userData.nd.uniforms.map.value = t; m.customDepthMaterial.map = t; m.material.needsUpdate = true; m.customDepthMaterial.needsUpdate = true; } };

// ================= light presets =================
const skyEnv = (top, hor, gnd, sun) => { const [c, g] = cv(512, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.5, hor); gr.addColorStop(0.52, gnd); gr.addColorStop(1, gnd); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  g.fillStyle = sun; g.beginPath(); g.ellipse(380, 90, 30, 22, 0, 0, 7); g.fill(); const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return pmrem.fromEquirectangular(t).texture; };
const PRESET = {
  day: { hemi: ['#cfe4ff', '#6a8a3a', 1.4], key: ['#fff4e0', 4.2], fog: ['#cfe0f4', 0.0009], sky: 1, sun: [0.55, 0.62, 0.55], expo: 1.12, lamps: 0, sat: 1.3, lift: [0, 0, 0], env: skyEnv('#2a6ad8', '#e8f2ff', '#5a8a3a', '#ffffff'), bloomK: 0.55, thr: 1.3, rays: 0.35 },
  dawn: { hemi: ['#ffd8b8', '#5a6a3a', 1.25], key: ['#ffc890', 4.0], fog: ['#f0c8a8', 0.0008], sky: 2, sun: [0.85, 0.2, 0.5], expo: 1.08, lamps: 0, sat: 1.3, lift: [0, 0, 0], env: skyEnv('#3a5ab0', '#ffc090', '#5a6a3a', '#fff0c0'), bloomK: 0.6, thr: 1.2, rays: 0.6 },
  night: { hemi: ['#7a90c8', '#2a2a3a', 1.0], key: ['#a8c0f0', 1.5], fog: ['#1e2a44', 0.006], sky: 0, sun: [-0.4, 0.5, 0.6], expo: 1.15, lamps: 1, sat: 1.25, lift: [0.012, 0.014, 0.03], env: env, bloomK: 0.7, thr: 1.1, rays: 0 },
};

// ================= per-frame =================
import { stateAt, TOTAL } from './shots.js';
const tmp = new THREE.Vector3(), camR = new THREE.Vector3(), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), SC = new THREE.Vector3(), V = new THREE.Vector3(), V2 = new THREE.Vector3();
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const Z = new THREE.Vector3(0, 0, -1);
// world position of arrow i of cart h (tail end when tail = true)
const arrowWorld = (h, i, z = 0.25) => { const [hx, hy] = h.userData.holes[i]; return h.userData.launcher.localToWorld(V.set(hx, hy, z)); };
window.renderFrame = (f) => {
  const S = stateAt(f, {}), t = f / 30;
  const L = PRESET[S.preset || 'day'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2] * (S.hemiK ?? 1);
  moon.color.set(L.key[0]); moon.intensity = L.key[1] * (S.keyK ?? 1);
  scene.fog.color.set(L.fog[0]); scene.fog.density = S.fog ?? L.fog[1];
  skyU.day.value = L.sky; skyU.sunD.value.set(...L.sun); scene.environment = L.env;
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(...L.lift); inkU.flash.value = S.flash || 0; inkU.bloomK.value = L.bloomK; brightU.thr.value = L.thr;
  for (const l of pLights) { l.visible = L.lamps > 0 && l.userData.zone === 'fort'; l.intensity = l.userData.I0 * (S.lampK ?? 1); }
  for (const g of glows) g.visible = (L.lamps > 0 && g.userData.zone === 'fort') || g.userData.zone === 'fx';
  if (S.track) { const h = HW[S.track.h], i = S.track.i, tf = S.fired[S.track.h]; h.updateMatrixWorld(true); const dirW = new THREE.Vector3(0, 0, -1).transformDirection(h.userData.launcher.matrixWorld); const tau = Math.max(0, t - tf - (i % 17) * 0.012);
    const p0 = arrowWorld(h, i, 0.25).clone(), d = dirW.clone(); d.x += (rnd(i, S.track.h) - 0.5) * 0.16; d.y += (rnd(i, S.track.h + 3) - 0.5) * 0.12; d.normalize(); const spd = 34 + rnd(i, 7) * 8;
    const p = p0.clone().addScaledVector(d, spd * Math.min(tau, 0.2) * 0.6 + spd * Math.max(0, tau - 0.2)); p.y -= 2.6 * tau * tau; S.look = [p.x, p.y, p.z]; S.cam = [p.x + S.track.off[0], p.y + S.track.off[1], p.z + S.track.off[2]]; }
  // camera
  const sh = S.shake || 0, hh = S.handheld ?? 0.012; const look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  if (S.orbit) { const d = pos.clone().sub(look); d.applyAxisAngle(new THREE.Vector3(0, 1, 0), S.orbit); pos.copy(look).add(d); }
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look.x + (rnd(f, 3) - 0.5) * sh * 1.5, look.y + (rnd(f, 4) - 0.5) * sh * 1.5, look.z);
  if (S.roll) camera.rotateZ(rx(S.roll)); camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); camR.setFromMatrixColumn(camera.matrixWorld, 0);
  sky.position.copy(camera.position);
  const fc = S.shadowAt || S.look, sd = new THREE.Vector3(...L.sun).normalize(); moon.position.set(fc[0] + sd.x * 60, fc[1] + Math.max(sd.y, 0.25) * 60, fc[2] + sd.z * 60); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 16; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix(); }
  { const sv = sd.clone().multiplyScalar(500).add(camera.position).project(camera); inkU.sunUV.value.set(sv.x * 0.5 + 0.5, sv.y * 0.5 + 0.5); inkU.raysK.value = sv.z < 1 ? (S.rays ?? L.rays) : 0; }
  // waving banners
  for (const m of FLAGS) { const pa = m.geometry.attributes.position, b = m.userData.base; for (let i = 0; i < pa.count; i++) { const x = b[i * 3]; pa.setZ(i, Math.sin(x * 3 - t * 5 + m.userData.ph) * 0.12 * x); } pa.needsUpdate = true; }
  HW[0].visible = t >= 19.4;
  // drilled block
  drawHoles(S.holes ?? 0); BLOCK.visible = S.block !== false;
  // hero hwacha loading: arrows visible up to S.loaded, arrow i slides in (S.slide {i, k})
  HW.forEach((h, hi) => { const im = h.userData.arrows, n = im.count; const loaded = hi === 0 ? (S.loaded ?? 100) : 100; const fired = (S.fired || {})[hi];
    for (let i = 0; i < n; i++) { const [hx, hy] = h.userData.holes[i]; let z = 0.25, vis = i < loaded; if (hi === 0 && S.slide && i === S.slide.i) { z = 0.25 - (1 - S.slide.k) * 1.2; vis = true; } if (fired != null && t >= fired + (i % 17) * 0.012) vis = false;
      M4.makeTranslation(hx, hy, z); if (!vis) M4.makeScale(0, 0, 0); im.setMatrixAt(i, M4); } im.instanceMatrix.needsUpdate = true; });
  // rockets in flight
  let nr = 0, nt = 0, nf = 0; const fires = S.fired || {};
  for (const key in fires) { const hi = +key, h = HW[hi], tf = fires[key]; if (t < tf) continue; h.updateMatrixWorld(true); const n = h.userData.arrows.count, step = n > 60 && hi !== 0 && !S.heroAll ? 2 : 1;
    const dirW = new THREE.Vector3(0, 0, -1).transformDirection(h.userData.launcher.matrixWorld);
    for (let i = 0; i < n && nr < NR; i += step) { const tau = t - tf - (i % 17) * 0.012; if (tau < 0 || tau > (S.flight || 3.2)) continue; const p0 = arrowWorld(h, i, 0.25).clone();
      const d = dirW.clone(); d.x += (rnd(i, hi) - 0.5) * 0.16; d.y += (rnd(i, hi + 3) - 0.5) * 0.12; d.normalize(); const spd = 34 + rnd(i, 7) * 8;
      const p = p0.clone().addScaledVector(d, spd * Math.min(tau, 0.2) * 0.6 + spd * Math.max(0, tau - 0.2)); p.y -= 2.6 * tau * tau; const vel = d.clone().multiplyScalar(spd); vel.y -= 5.2 * tau;
      Q.setFromUnitVectors(Z, vel.clone().normalize()); M4.compose(p, Q, SC.set(1, 1, 1)); ROCK.setMatrixAt(nr++, M4);
      if (nf < NF) { const fp = p.clone().addScaledVector(vel.clone().normalize(), 0.34); M4.compose(fp, camera.quaternion, SC.setScalar((0.35 + rnd(f + i, 2) * 0.15) * (S.flameS ?? 1))); FLAME.setMatrixAt(nf++, M4); }
      for (let k = 1; k <= 6 && nt < NT; k++) { const ta = tau - k * 0.07; if (ta < 0) break; const q = p0.clone().addScaledVector(d, spd * Math.min(ta, 0.2) * 0.6 + spd * Math.max(0, ta - 0.2)); q.y -= 2.6 * ta * ta; q.y += k * 0.05;
        M4.compose(q, camera.quaternion, SC.setScalar((0.12 + k * 0.1 + (tau - ta) * 0.3) * Math.min(1, 0.3 + tau))); TRAIL.setMatrixAt(nt++, M4); } } }
  ROCK.count = nr; TRAIL.count = nt; FLAME.count = nf; ROCK.instanceMatrix.needsUpdate = TRAIL.instanceMatrix.needsUpdate = FLAME.instanceMatrix.needsUpdate = true;
  // fuse spark (S.spark {h, k: 0..1 along the string}) and the split (S.split {h, k})
  SPARK.forEach((m) => (m.visible = false));
  if (S.spark) { const h = HW[S.spark.h]; h.updateMatrixWorld(true); const [a, b] = h.userData.fuse; const p = h.userData.launcher.localToWorld(a.clone().lerp(b, S.spark.k)); const m = SPARK[0]; m.visible = true; m.position.copy(p); m.scale.setScalar(0.14 + 0.05 * Math.sin(f * 2.3)); m.quaternion.copy(camera.quaternion);
    for (let j = 1; j < 8; j++) { const s2 = SPARK[j]; s2.visible = true; s2.position.copy(p).add(V2.set((rnd(f, j) - 0.5) * 0.12, rnd(f, j + 9) * 0.1, (rnd(f, j + 4) - 0.5) * 0.12)); s2.scale.setScalar(0.03 + rnd(f, j) * 0.03); s2.quaternion.copy(camera.quaternion); } }
  if (S.split) { const h = HW[S.split.h]; h.updateMatrixWorld(true); const kn = h.userData.launcher.localToWorld(h.userData.fuse[1].clone()); const n = Math.min(100, h.userData.arrows.count);
    for (let i = 0; i < n && i + 8 < SPARK.length; i++) { const m = SPARK[i + 8]; m.visible = true; const tail = arrowWorld(h, i, 0.82).clone(); m.position.copy(kn).lerp(tail, Math.min(1, S.split.k * (0.8 + rnd(i, 3) * 0.4))); m.scale.setScalar(0.06); m.quaternion.copy(camera.quaternion); } }
  // wood chips while drilling
  CHIPS.forEach((m, i) => { m.visible = !!S.chips; if (!S.chips) return; const a = ((t * 2.2 + i / CHIPS.length) % 1); m.position.set(S.chips[0] + (rnd(i, 1) - 0.5) * 0.4 * a, S.chips[1] + a * 0.25 - a * a * 0.7, S.chips[2] + 0.05 + rnd(i, 2) * 0.3 * a); m.rotation.set(a * 9 + i, a * 7, 0); });
  // army
  const AR = S.army || []; ARMY.forEach((m, i) => { const e = AR[i]; m.visible = !!e; if (!e) return; const k = Math.floor(((t * (e.rate ?? 1.8)) + (e.ph || 0)) * 4) % 4;
    setArmyTex(m, e.mode === 'run' ? ARMF[`r${e.v}_${k}`] : e.mode === 'stand' ? ARMF[`s${e.v}`] : ARMF[`m${e.v}_${k}`]); const y = e.y ?? hgt(e.x, e.z); m.position.set(e.x, y, e.z);
    m.rotation.set(0, Math.atan2(camera.position.x - e.x, camera.position.z - e.z), 0); const s = e.s || 1; m.scale.set(s * (e.flip ? -1 : 1), s, s); m.material.color.set(e.tint || '#ffffff'); });
  DUST.forEach((m, i) => { const em = (S.dust || [])[i % Math.max(1, (S.dust || []).length)]; m.visible = !!em && i < (S.dustN ?? 30); if (!m.visible) return; const a = ((t * (em.rate || 1)) + rnd(i, 3)) % 1;
    m.position.set(em.p[0] + (rnd(i, 4) - 0.5) * (em.w || 2), em.p[1] + 0.2 + a * (em.h || 1.2), em.p[2] + (rnd(i, 5) - 0.5) * (em.w || 2)); m.scale.setScalar((0.6 + a * 2.4) * (em.s || 1)); m.quaternion.copy(camera.quaternion); m.material.opacity = (1 - a) * (em.k ?? 0.45); m.material.color.set(em.col || '#c8b8a0'); });
  MOTES.forEach((m, i) => { m.visible = !!S.motes; if (!m.visible) return; m.position.set(camera.position.x + (rnd(i, 1) - 0.5) * 6 + Math.sin(t * 0.3 + i) * 0.3, camera.position.y - 1 + rnd(i, 2) * 3 + Math.sin(t * 0.5 + i * 2) * 0.2, camera.position.z - 1.5 - rnd(i, 3) * 6);
    m.scale.setScalar(0.03 + rnd(i, 4) * 0.05); m.quaternion.copy(camera.quaternion); m.material.opacity = 0.6 + 0.4 * Math.sin(t * 3 + i); });
  bang.visible = !!S.bang; bangLight.intensity = S.bang ? 12 * S.bang.k : 0; if (S.bang) { bang.position.set(...S.bang.p); bang.scale.setScalar(0.2 + 0.5 * S.bang.k); bangLight.position.set(S.bang.p[0], S.bang.p[1] + 0.5, S.bang.p[2] + 0.5); }
  for (const g of glows) { g.quaternion.copy(camera.quaternion); g.material.opacity = g.userData.k0 * Math.exp(-g.position.distanceTo(camera.position) * 0.04); }
  if (bang.userData.g) { bang.userData.g.quaternion.copy(camera.quaternion); bang.userData.g.scale.setScalar(1.4); }
  // cards
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw); c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(camera.position.x - a.x, camera.position.z - a.z), a.roll || 0); c.mat.color.set(a.tint || S.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2; c.mesh.castShadow = !a.fx;
    c.blob.visible = !a.fx && a.blob !== false; c.blob.position.set(a.x, (a.ground ?? a.y) + 0.015, a.z); c.blob.scale.set(1.0 * s, 0.55 * s, 1); });
  if (location.hash === '#dbg') console.log('DBG', S.shotIndex, (S.actors || []).length, cards.map((c) => [c.mesh.visible, c.mesh.position.toArray().map((v) => v.toFixed(2)).join(','), c.mesh.scale.x.toFixed(2)].join('|')).join(' ; '), camera.position.toArray().map((v) => v.toFixed(2)).join(','));
  // passes
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.autoUpdate = false; swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false); scene.fog = fog; renderer.shadowMap.autoUpdate = true;
  renderer.setRenderTarget(rtB1); renderer.render(brightScene, fsCam);
  for (let k = 0; k < 3; k++) { blurU.src.value = rtB1.texture; blurU.dir.value.set(1 / (W / 4), 0); renderer.setRenderTarget(rtB2); renderer.render(blurScene, fsCam); blurU.src.value = rtB2.texture; blurU.dir.value.set(0, 1 / (H / 4)); renderer.setRenderTarget(rtB1); renderer.render(blurScene, fsCam); }
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = S.focus || 5; dofU.cinf.value = Math.min(1.8, (S.cinf ?? 3) * 0.3); renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;

window.ready = true;