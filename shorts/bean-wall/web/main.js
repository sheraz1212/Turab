import * as THREE from './lib/three.module.js';
import { GLTFLoader } from './lib/GLTFLoader.js';
import * as T from './toon.js';
import * as P from './paint.js';
import * as BufferGeometryUtils from './lib/BufferGeometryUtils.js';

const W = 1080, H = 1920;
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
const glows = []; const pLights = []; let ZONE = 'dungeon';
const glow = (x, y, z, size, col, k = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: k }));
  m.position.set(x, y, z); m.scale.setScalar(size); m.userData.k0 = k; m.userData.zone = ZONE; m.userData.ndSkip = true; m.renderOrder = 5; scene.add(m); glows.push(m); return m; };
const lamp = (x, y, z, col = '#ffb25a', I = 6, dist = 14, gs = 1.6) => { const l = new THREE.PointLight(col, I, dist, 1.6); l.position.set(x, y, z); scene.add(l); l.userData = { zone: ZONE, I0: I }; pLights.push(l); glow(x, y, z, gs, '255,190,110', 0.9); glow(x, y, z, gs * 0.3, '255,240,210', 1); return l; };


const NAMES = ['Lantern_01', 'wooden_bucket_01', 'Chandelier_01', 'brass_candleholders', 'wooden_stool_01', 'wooden_crate_01', 'wooden_barrels_01'];
await Promise.all(NAMES.map(load));
const hemi = new THREE.HemisphereLight('#8ab090', '#2a2418', 0.8); scene.add(hemi);
const moon = new THREE.DirectionalLight('#ffe0a0', 2.5); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.03; scene.add(moon); scene.add(moon.target);
scene.fog = new THREE.FogExp2('#1a2418', 0.02);
const pmrem = new THREE.PMREMGenerator(renderer);
const skyU = { day: { value: 0 }, sunD: { value: new THREE.Vector3() } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 8, 4), new THREE.MeshBasicMaterial({ color: '#000', side: THREE.BackSide })); sky.visible = false; scene.add(sky);

// ---------------- cards ----------------
const CW = 1800, CH = 3000, CM = 2.25;
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('10,8,16', 0.65));
const cardNd = (map) => new THREE.ShaderMaterial({ uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`, side: THREE.DoubleSide });
class Card { constructor() { [this.c] = cv(CW, CH); this.g = this.c.getContext('2d'); this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 8; this.t.generateMipmaps = false; this.t.minFilter = THREE.LinearFilter;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); }
  draw(fn, ol = false) { const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0); fn(new T.Pen(g));
    if (ol) { if (!this.tmp) { [this.tmp] = cv(CW, CH); this.tg = this.tmp.getContext('2d'); [this.wc] = cv(CW, CH); this.wg = this.wc.getContext('2d'); }
      this.tg.clearRect(0, 0, CW, CH); this.tg.drawImage(this.c, 0, 0); const wg = this.wg; wg.globalCompositeOperation = 'source-over'; wg.clearRect(0, 0, CW, CH); wg.drawImage(this.c, 0, 0); wg.globalCompositeOperation = 'source-in'; wg.fillStyle = '#efe4cc'; wg.fillRect(0, 0, CW, CH); wg.globalCompositeOperation = 'source-over';
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); const r = Math.round(11 * CW / 1200); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.drawImage(this.wc, Math.cos(a) * r, Math.sin(a) * r); } g.filter = 'saturate(0.86)'; g.drawImage(this.tmp, 0, 0); g.filter = 'none'; }
    this.t.needsUpdate = true; } }
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
const rtB1 = new THREE.WebGLRenderTarget(W / 2, H / 2, { type: THREE.HalfFloatType }), rtB2 = new THREE.WebGLRenderTarget(W / 2, H / 2, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const fsv = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
const brightU = { src: { value: rtColor.texture }, thr: { value: 1.2 }, px: { value: new THREE.Vector2(1 / W, 1 / H) } }, blurU = { src: { value: null }, dir: { value: new THREE.Vector2() } };
const brightScene = fs(new THREE.ShaderMaterial({ uniforms: brightU, vertexShader: fsv, fragmentShader: `uniform sampler2D src; uniform float thr; uniform vec2 px; varying vec2 vUv; vec3 tap(vec2 o){ vec3 c = texture2D(src, vUv + o * px).rgb; float l = max(c.r, max(c.g, c.b)); c *= smoothstep(thr, thr + .6, l); return c / (1. + max(c.r, max(c.g, c.b)) * .25); } void main(){ vec3 a = vec3(0.); float ws = 0.; for (int y = -2; y <= 2; y++) for (int x = -2; x <= 2; x++) { float w = exp(-float(x*x + y*y) * .35); a += tap(vec2(float(x), float(y)) * .9) * w; ws += w; } gl_FragColor = vec4(a / ws, 1.); }` }));
const blurScene = fs(new THREE.ShaderMaterial({ uniforms: blurU, vertexShader: fsv, fragmentShader: `uniform sampler2D src; uniform vec2 dir; varying vec2 vUv; void main(){ vec3 a = vec3(0.); float w[5]; w[0]=.227; w[1]=.194; w[2]=.121; w[3]=.054; w[4]=.016;
    a += texture2D(src, vUv).rgb*w[0]; for(int i=1;i<5;i++){ a += texture2D(src, vUv+dir*float(i)*2.).rgb*w[i]; a += texture2D(src, vUv-dir*float(i)*2.).rgb*w[i]; } gl_FragColor = vec4(a,1.); }` }));
const inkU = { split: { value: 0 }, shTint: { value: new THREE.Color(0.24, 0.14, 0.34) }, hiTint: { value: new THREE.Color(1.0, 0.82, 0.84) }, greenK: { value: 0 }, sunUV: { value: new THREE.Vector2(0.5, 1.2) }, raysK: { value: 0 }, bloom: { value: rtB1.texture }, bloomK: { value: 0.55 }, expo: { value: 1.0 }, worldInk: { value: 0.95 }, col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 2.2 },
  sat: { value: 1.15 }, lift: { value: new THREE.Color(0.01, 0.012, 0.03) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.35 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: fsv,
  fragmentShader: `uniform sampler2D col, nd, bloom; uniform vec2 res, sunUV; uniform float split, greenK; uniform vec3 shTint, hiTint; uniform float raysK, px, sat, vig, flash, bloomK, expo, worldInk; uniform vec3 lift, gain; varying vec2 vUv;
  vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.); }
  float edgeAt(vec2 uv, float r){ vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.; float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.; vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o); float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue; if (card) ds = 1e4; vec3 ns = s.rgb*2.-1.; e = max(e, smoothstep(.006, .02, (ds - d)/d)); if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); }
    return e * (1. - smoothstep(20., 80., d)*.85); }
  void main(){ vec3 c = texture2D(col, vUv).rgb; float e = edgeAt(vUv, px); { vec2 bp = vec2(${(2 / W).toFixed(6)}, ${(2 / H).toFixed(6)}); vec3 bb = texture2D(bloom, vUv).rgb * 4. + (texture2D(bloom, vUv + vec2(bp.x, 0.)).rgb + texture2D(bloom, vUv - vec2(bp.x, 0.)).rgb + texture2D(bloom, vUv + vec2(0., bp.y)).rgb + texture2D(bloom, vUv - vec2(0., bp.y)).rgb) * 2. + texture2D(bloom, vUv + bp).rgb + texture2D(bloom, vUv - bp).rgb + texture2D(bloom, vUv + vec2(bp.x, -bp.y)).rgb + texture2D(bloom, vUv - vec2(bp.x, -bp.y)).rgb; c += bb / 16. * bloomK; } if (raysK > 0.) { vec2 dd = (sunUV - vUv) / 32.; vec2 uv = vUv; float dec = 1.; vec3 rr = vec3(0.); for (int i=0;i<32;i++){ uv += dd; rr += texture2D(bloom, clamp(uv, 0., 1.)).rgb * dec; dec *= .955; } c += rr / 32. * raysK; } c = aces(c * expo); c = mix(c, vec3(.012,.01,.02), e * worldInk);
    float l = dot(c, vec3(.299,.587,.114)); float gx = clamp((c.g - max(c.r, c.b)) * 3., 0., 1.) * greenK; c.g = mix(c.g, max(c.r, c.b) * .9, gx); c.b += gx * .08; c = mix(vec3(l), c, sat); l = dot(c, vec3(.299,.587,.114)); c = mix(c, c * mix(shTint * 2.6, vec3(1.), smoothstep(.0, .55, l)), split * (1. - smoothstep(.2, .6, l))); c = mix(c, c * hiTint * 1.08, split * smoothstep(.55, 1., l)); c = c*gain + lift; vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2; c = mix(c, vec3(1.,.95,.85), flash); gl_FragColor = vec4(c,1.); }` }));
const dofU = { haze: { value: 0 }, time: { value: 0 }, src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: fsv.replace(/vUv/g, 'vUv0'),
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, haze, time; varying vec2 vUv0;
  vec2 vUv; float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf, cinf*1.4); }
  vec3 sharp(vec2 uv, vec3 c){ vec2 px = 1. / res; vec3 n = texture2D(src, uv + vec2(px.x, 0.)).rgb + texture2D(src, uv - vec2(px.x, 0.)).rgb + texture2D(src, uv + vec2(0., px.y)).rgb + texture2D(src, uv - vec2(0., px.y)).rgb; return clamp(c + (c - n * .25) * .8, 0., 1.); }
  void main(){ vUv = vUv0 + vec2(sin(vUv0.y * 140. + time * 7.) * 0.0022 + sin(vUv0.y * 61. - time * 4.) * 0.0014, 0.) * haze * smoothstep(0.75, 0.2, vUv0.y); float c0 = coc(vUv); if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(sharp(vUv, texture2D(src, vUv).rgb), 1.)); return; }
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
const PBRN = ['cobblestone_floor_04', 'weathered_planks', 'fine_grained_wood', 'red_brick_03', 'medieval_blocks_02', 'castle_brick_07', 'plastered_wall_02', 'old_planks_02'];
await Promise.all(PBRN.flatMap((n) => ['diff', 'nor', 'rough'].map((k) => new Promise((res) => TXL.load(`tex/${n}_${k}.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (k === 'diff') t.colorSpace = THREE.SRGBColorSpace; TX[n + k] = t; res(); }, undefined, () => res())))));
const pbr = (n, rep, o = {}) => { const r = Array.isArray(rep) ? rep : [rep, rep]; const cl = (t) => { const c = t.clone(); c.repeat.set(r[0], r[1]); c.needsUpdate = true; return c; };
  return new THREE.MeshStandardMaterial({ map: cl(TX[n + 'diff']), normalMap: cl(TX[n + 'nor']), roughnessMap: cl(TX[n + 'rough']), roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2), ...o }); };
const R = (s) => P.rng(s);


const GOLD = std({ color: '#f2c24a', metalness: 1, roughness: 0.2, envMapIntensity: 1.6 });
const IRON = std({ color: '#2a2e34', metalness: 0.85, roughness: 0.35, envMapIntensity: 1.3 });
const plane = (w, h, mat, x, y, z, rxx = 0, ryy = 0, parent = scene) => { const m = add(new THREE.PlaneGeometry(w, h), mat, x, y, z, parent, false); m.rotation.set(rxx, ryy, 0); return m; };

// ---- toon textures: every brick/block/tile outlined in ink, like the reference ----
const toonTex = (kind, rep = [1, 1]) => { const [c, g] = cv(1024, 1024), r = P.rng(kind.length * 31 + 5); const ink = (w) => { g.strokeStyle = 'rgba(18,12,8,.95)'; g.lineWidth = w; g.lineJoin = 'round'; };
  const shade = (x, y, w, h, base, hl) => { g.fillStyle = base; g.fillRect(x, y, w, h); g.fillStyle = hl; g.fillRect(x + 4, y + 4, w - 8, Math.max(4, h * 0.18)); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 4, y + h - h * 0.2, w - 8, h * 0.16); for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(x + r() * w, y + r() * h, 2 + r() * 5, 1.5 + r() * 3, 0, 0, 7); g.fill(); } };
  if (kind === 'brick') { g.fillStyle = '#4a2214'; g.fillRect(0, 0, 1024, 1024); const bh = 64, bw = 160; for (let row = 0, y = 0; y < 1024; y += bh, row++) for (let x = -(row % 2) * bw / 2; x < 1024; x += bw) { const h = 10 + r() * 14, l = 40 + r() * 12; shade(x + 5, y + 5, bw - 10, bh - 10, `hsl(${h},68%,${l}%)`, `hsl(${h + 8},80%,${l + 14}%)`); ink(5); g.strokeRect(x + 5, y + 5, bw - 10, bh - 10); } }
  if (kind === 'stone' || kind === 'teal') { const TL = kind === 'teal'; g.fillStyle = TL ? '#0e1c20' : '#16200e'; g.fillRect(0, 0, 1024, 1024); const bh = TL ? 205 : 256, bw = TL ? 342 : 512; for (let row = 0, y = 0; y < 1024; y += bh, row++) for (let x = -(row % 2) * bw / 2; x < 1024; x += bw) { const l = (TL ? 46 : 34) + r() * 10; shade(x + 6, y + 6, bw - 12, bh - 12, `hsl(${(TL ? 178 : 88) + r() * 14},${TL ? 30 : 34}%,${l}%)`, `hsl(${(TL ? 176 : 84) + r() * 10},${TL ? 36 : 40}%,${l + 12}%)`); ink(9); g.strokeRect(x + 6, y + 6, bw - 12, bh - 12);
      g.strokeStyle = 'rgba(18,12,8,.6)'; g.lineWidth = 3; g.beginPath(); const cx0 = x + 60 + r() * (bw - 120), cy0 = y + 40 + r() * 60; g.moveTo(cx0, cy0); g.lineTo(cx0 + 20 + r() * 30, cy0 + 30 + r() * 30); g.lineTo(cx0 + r() * 40, cy0 + 70 + r() * 40); g.stroke(); } }
  if (kind === 'floor') { g.fillStyle = '#1a140c'; g.fillRect(0, 0, 1024, 1024); const s = 256; for (let y = 0; y < 1024; y += s) for (let x = 0; x < 1024; x += s) { const l = 30 + r() * 10; shade(x + 6, y + 6, s - 12, s - 12, `hsl(${30 + r() * 20},30%,${l}%)`, `hsl(${35 + r() * 10},34%,${l + 10}%)`); ink(9); g.strokeRect(x + 6, y + 6, s - 12, s - 12); } }
  if (kind === 'warmfloor') { g.fillStyle = '#2a140a'; g.fillRect(0, 0, 1024, 1024); const s = 256; for (let y = 0; y < 1024; y += s) for (let x = 0; x < 1024; x += s) { const l = 44 + r() * 10; shade(x + 6, y + 6, s - 12, s - 12, `hsl(${24 + r() * 8},60%,${l}%)`, `hsl(${30},70%,${l + 12}%)`); ink(9); g.strokeRect(x + 6, y + 6, s - 12, s - 12); } }
  if (kind === 'plank') { g.fillStyle = '#2a160a'; g.fillRect(0, 0, 1024, 1024); const ph = 128; for (let y = 0; y < 1024; y += ph) { const l = 34 + r() * 10; shade(0, y + 4, 1024, ph - 8, `hsl(${26 + r() * 6},48%,${l}%)`, `hsl(30,55%,${l + 10}%)`); ink(6); g.strokeRect(-10, y + 4, 1044, ph - 8); for (let k = 0; k < 3; k++) { g.strokeStyle = 'rgba(18,12,8,.35)'; g.lineWidth = 2; g.beginPath(); const yy = y + 20 + r() * (ph - 40); g.moveTo(0, yy); g.bezierCurveTo(300, yy + 8, 700, yy - 8, 1024, yy); g.stroke(); } const jx = r() * 900; ink(6); g.beginPath(); g.moveTo(jx, y + 4); g.lineTo(jx, y + ph - 4); g.stroke(); } }
  if (kind === 'plaster') { g.fillStyle = '#5a9a62'; g.fillRect(0, 0, 1024, 1024); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.03 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 10 + r() * 40, 6 + r() * 20, r() * 3, 0, 7); g.fill(); } ink(7); for (let x = 0; x <= 1024; x += 512) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); } }
  const t = P.tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 8; return t; };
const toonM = (kind, rep, o = {}) => new THREE.MeshStandardMaterial({ map: toonTex(kind, rep), roughness: 0.55, envMapIntensity: 0.9, ...o });

// ---- painted stone (reference look): mottled hand-painted blocks, soft edge shading, thin dark ink seams, grime ----
const paintTex = (kind, rep = [1, 1]) => { const [c, g] = cv(1024, 1024), r = P.rng(kind.length * 97 + 11); const SL = kind === 'slate', BR = kind === 'pbrick';
  const hue = SL ? 192 : BR ? 10 : 176, sat0 = SL ? 14 : BR ? 30 : 20; g.fillStyle = BR ? '#2a1610' : SL ? '#10181c' : '#0c1a1e'; g.fillRect(0, 0, 1024, 1024);
  const rows = SL ? [0, 256, 512, 768, 1024] : BR ? Array.from({ length: 17 }, (_, i) => i * 64) : [0, 150, 300, 450, 600, 750, 900, 1024];
  for (let ri = 0; ri < rows.length - 1; ri++) { const y0 = rows[ri], y1 = rows[ri + 1]; let x = -r() * 200; while (x < 1024) { const w = SL ? 256 : BR ? 150 + r() * 30 : 220 + r() * 160, x0 = x, x1 = x + w; x = x1;
      const L = (SL ? 28 : BR ? 30 : 36) + r() * 10, H = hue + (r() - 0.5) * 10; const gr = g.createLinearGradient(x0, y0, x1 * 0.3 + x0 * 0.7, y1); gr.addColorStop(0, `hsl(${H},${sat0 + 6}%,${L + 9}%)`); gr.addColorStop(1, `hsl(${H + 4},${sat0}%,${L - 6}%)`);
      g.fillStyle = gr; g.beginPath(); g.roundRect(x0 + (BR ? 3 : 5), y0 + (BR ? 3 : 5), w - (BR ? 6 : 10), y1 - y0 - (BR ? 6 : 10), BR ? 4 : 10); g.fill();
      g.save(); g.clip();
      for (let k = 0; k < (BR ? 6 : 26); k++) { const bx = x0 + r() * w, by = y0 + r() * (y1 - y0), rr = 14 + r() * 60, dk = r() < 0.55; const rg = g.createRadialGradient(bx, by, 0, bx, by, rr); rg.addColorStop(0, dk ? `rgba(8,28,34,${0.12 + r() * 0.16})` : `rgba(200,240,236,${0.06 + r() * 0.1})`); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(bx - rr, by - rr, rr * 2, rr * 2); }
      for (let k = 0; k < 90; k++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,20,24' : '220,250,245'},${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(x0 + r() * w, y0 + r() * (y1 - y0), 1 + r() * 3, 1 + r() * 2, 0, 0, 7); g.fill(); }
      const ig = g.createLinearGradient(0, y0, 0, y1); ig.addColorStop(0, 'rgba(230,255,250,.16)'); ig.addColorStop(0.12, 'rgba(230,255,250,0)'); ig.addColorStop(0.8, 'rgba(0,10,14,0)'); ig.addColorStop(1, 'rgba(0,10,14,.35)'); g.fillStyle = ig; g.fillRect(x0, y0, w, y1 - y0);
      if (r() < 0.35) { g.strokeStyle = 'rgba(10,22,26,.55)'; g.lineWidth = 2.2; g.beginPath(); let cx0 = x0 + 30 + r() * (w - 60), cy0 = y0 + 10; g.moveTo(cx0, cy0); for (let s2 = 0; s2 < 4; s2++) { cx0 += (r() - 0.5) * 40; cy0 += (y1 - y0) / 5; g.lineTo(cx0, cy0); } g.stroke(); }
      g.restore(); g.strokeStyle = 'rgba(14,20,18,.85)'; g.lineWidth = BR ? 2.5 : 3.5; g.beginPath(); g.roundRect(x0 + (BR ? 3 : 5), y0 + (BR ? 3 : 5), w - (BR ? 6 : 10), y1 - y0 - (BR ? 6 : 10), BR ? 4 : 10); g.stroke(); } }
  for (let k = 0; k < 14; k++) { const gx = r() * 1024, gw = 20 + r() * 60, gg = g.createLinearGradient(0, 0, 0, 1024); gg.addColorStop(0, 'rgba(10,20,18,0)'); gg.addColorStop(1, `rgba(10,20,18,${0.1 + r() * 0.15})`); g.fillStyle = gg; g.fillRect(gx, 300 + r() * 400, gw, 724); }
  const t = P.tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 8; return t; };
const paintM = (kind, rep, o = {}) => new THREE.MeshStandardMaterial({ map: paintTex(kind, rep), roughness: 0.7, envMapIntensity: 0.5, ...o });
// ================= DUNGEON CELL =================
ZONE = 'dungeon';
const DG = new THREE.Group(); scene.add(DG);
const GSTONE = paintM('teal', [5, 2.2]);
const GSTONE2 = paintM('teal', [3.8, 0.4]);
const BRICK = paintM('pbrick', [2.2, 1.6]);
const FLOOR = toonM('floor', [4, 5], { roughness: 0.4 });
plane(8, 10, FLOOR, 0, 0, 0, -Math.PI / 2).receiveShadow = true;
for (const s of [-1, 1]) { const w = plane(10, 4.2, GSTONE, s * 3.2, 2.1, 0, 0, -s * Math.PI / 2); w.receiveShadow = true; }
plane(6.4, 0.7, GSTONE2, 0, 3.85, -1.62); // header above the bars
// ceiling with skylight grate (the throne-room floor grate)
{ const cm = GSTONE.clone(); const pts = [[-3.2, -1.62, -0.75, 4.5], [0.75, -1.62, 3.2, 4.5], [-0.75, -1.62, 0.75, -1.45], [-0.75, 0.05, 0.75, 4.5]];
  for (const [x0, z0, x1, z1] of pts) { const c = add(box(x1 - x0, 0.3, z1 - z0), cm, (x0 + x1) / 2, 4.35, (z0 + z1) / 2, DG, false); c.castShadow = false; }
  for (let k = -3; k <= 3; k++) { add(box(0.06, 0.08, 1.5), IRON, k * 0.2, 4.22, -0.7, DG, false); add(box(1.5, 0.08, 0.06), IRON, 0, 4.22, -0.7 + k * 0.2, DG, false); }
  for (const [x, z] of [[-0.78, -0.7], [0.78, -0.7]]) add(box(0.06, 0.12, 1.6), IRON, x, 4.2, z, DG, false); }
// bars
{ for (let x = -3.1; x <= 3.1; x += 0.24) add(cyl(0.035, 0.035, 3.5, 8), IRON, x, 1.75, -1.62, DG);
  for (const y of [0.12, 1.9, 3.45]) add(box(6.4, 0.08, 0.08), IRON, 0, y, -1.62, DG);
  for (let x = -0.6; x <= 0.61; x += 1.2) add(box(0.12, 3.5, 0.12), IRON, x, 1.75, -1.6, DG);
  add(box(0.18, 0.22, 0.1), std({ color: '#c8a050', metalness: 0.9, roughness: 0.3 }), 0.45, 1.3, -1.55, DG); }
// corridor behind bars: warm brick, wooden beams, lanterns
plane(10, 4, BRICK, 0, 2, -5.0); for (const s of [-1, 1]) plane(4, 4, BRICK, s * 3.2, 2, -3.3, 0, -s * Math.PI / 2);
add(box(6.4, 0.2, 3.6), toonM('plank', [1.5, 1.2]), 0, 3.75, -3.3, DG, false);
for (const z of [-2.2, -3.4, -4.6]) add(box(6.4, 0.22, 0.24), toonM('plank', [2, 0.2]), 0, 3.55, z, DG, false);
plane(6.4, 3.6, toonM('warmfloor', [3, 2], { roughness: 0.35 }), 0, 0.01, -3.3, -Math.PI / 2);
for (const x of [-2.2, 0.2, 2.4]) { lamp(x, 2.4, -4.75, '#ff9a40', 7, 9, 1.4); const l = put('Lantern_01', x, 2.1, -4.8, 0, 1.0); }
put('wooden_barrels_01', -2.5, 0, -4.4, 0.4, 1); put('wooden_crate_01', 2.4, 0, -4.4, 0.2, 1.1); put('wooden_crate_01', 2.6, 0.55, -4.5, 0.6, 0.8);
// chains on the side walls
{ const lm = IRON; for (const s of [-1, 1]) for (let k = 0; k < 8; k++) { const t = add(new THREE.TorusGeometry(0.06, 0.018, 6, 10), lm, s * 3.15, 2.6 - k * 0.11, 1.6, DG); t.rotation.set(0, k % 2 ? Math.PI / 2 : 0, 0); } for (const s of [-1, 1]) add(cyl(0.1, 0.1, 0.06, 12), lm, s * 3.16, 2.68, 1.6, DG).rotation.z = Math.PI / 2; }
put('wooden_bucket_01', 2.4, 0, 2.2, 0.3, 1.1); lamp(0, 3.6, -1.9, '#ffb060', 4, 7, 0.01); put('wooden_stool_01', -2.4, 0, 2.6, 0.5, 1);
// straw pile (instanced)
const STRAW = (() => { const n = 9000; const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.012, 0.36), std({ color: '#ffffff', roughness: 0.55, envMapIntensity: 0.8 }), n); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(); const r = R(77);
  for (let i = 0; i < n; i++) { const a = r() * 6.283, rr = Math.sqrt(r()) * 2.2; const x = Math.cos(a) * rr * 1.2, z = -0.6 + Math.sin(a) * rr * 0.9; const h = Math.max(0, 0.32 * (1 - rr / 2.2)) * r();
    e.set((r() - 0.5) * 0.5, r() * 6.283, (r() - 0.5) * 0.5); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, 0.01 + h, z), q, new THREE.Vector3(1, 1, 0.6 + r() * 0.8)); im.setMatrixAt(i, m4); im.setColorAt(i, c.setHSL(0.09 + r() * 0.04, 0.6, 0.22 + r() * 0.22)); }
  im.castShadow = true; im.receiveShadow = true; scene.add(im); return im; })();
// light shaft from the skylight + motes
const shaftTex = (() => { const [c, g] = cv(64, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,240,190,.55)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const SHAFT = []; { const rt = (() => { const [c, g] = cv(64, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,246,210,.9)'); gr.addColorStop(0.7, 'rgba(255,240,200,.25)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const g2 = g.createLinearGradient(0, 0, 64, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  for (let k = 0; k < 7; k++) { const w = 0.08 + (k % 3) * 0.06; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 4.2), new THREE.MeshBasicMaterial({ map: rt, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.1, fog: false })); m.position.set(-0.6 + k * 0.2, 2.15, -1.1 + (k % 2) * 0.5); m.rotation.set(0.12, k * 0.45, 0.05 * (k - 3)); m.userData.ndSkip = true; m.renderOrder = 4; scene.add(m); SHAFT.push(m); } }
// glowing skylight above the grate
{ const sk = add(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.1, 1.8), fog: false }), 0, 4.48, -0.7, DG, false); sk.rotation.x = Math.PI / 2; sk.userData.ndSkip = true; }
// golden dust specks (sharp, small)
const SPECK = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.25, 0.55), fog: false }), 140); SPECK.userData.ndSkip = true; SPECK.frustumCulled = false; scene.add(SPECK);
// upper room seen through the grate (for the look-up shot)
plane(8, 8, toonM('plaster', [2, 2]), 0, 9, 1, Math.PI / 2);
for (const s of [-1, 1]) plane(8, 5, toonM('plaster', [2, 1]), s * 2.5, 6.8, 1, 0, -s * Math.PI / 2);
plane(8, 5, toonM('plaster', [2, 1]), 0, 6.8, -1.5); plane(8, 5, toonM('plaster', [2, 1]), 0, 6.8, 3.5, 0, Math.PI);
lamp(0, 7.5, 1, '#ffd890', 4, 8, 0.01);

// ================= THRONE ROOM (x = 100) =================
ZONE = 'throne'; const X0 = 100;
const marble = (() => { const [c, g] = cv(512, 512); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#f4ead8' : '#2a6a5a'; g.fillRect(x * 64, y * 64, 64, 64); } g.strokeStyle = '#c9962e'; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke(); } const t = P.tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t; })();
plane(16, 16, new THREE.MeshStandardMaterial({ map: marble, roughness: 0.12, metalness: 0.1, envMapIntensity: 1.5 }), X0, 0, 0, -Math.PI / 2).receiveShadow = true;
{ const cr = add(box(4, 0.02, 12), std({ color: '#b8222a', roughness: 0.7 }), X0, 0.011, 1, scene, false); add(box(4.3, 0.021, 12), GOLD, X0, 0.009, 1, scene, false); }
const TWALL = toonM('plaster', [4, 2]);
plane(16, 8, TWALL, X0, 4, -6); for (const s of [-1, 1]) plane(16, 8, TWALL, X0 + s * 7, 4, 2, 0, -s * Math.PI / 2);
add(box(16, 0.3, 0.2), GOLD, X0, 0.15, -5.9, scene, false); add(box(16, 0.25, 0.2), GOLD, X0, 6.2, -5.9, scene, false);
for (const x of [-5.5, -2.8, 2.8, 5.5]) { add(box(0.7, 7, 0.4), std({ color: '#5a9a62', roughness: 0.5 }), X0 + x, 3.5, -5.8); add(box(0.9, 0.3, 0.6), GOLD, X0 + x, 6.9, -5.75); add(box(0.9, 0.3, 0.6), GOLD, X0 + x, 0.15, -5.75); }
const bannerTex = (() => { const [c, g] = cv(256, 640); g.fillStyle = '#c8222a'; g.fillRect(0, 0, 256, 640); g.fillStyle = '#f2c24a'; g.fillRect(0, 0, 256, 22); g.fillRect(16, 30, 8, 560); g.fillRect(232, 30, 8, 560); g.beginPath(); g.moveTo(0, 560); g.lineTo(128, 640); g.lineTo(256, 560); g.lineTo(256, 640); g.lineTo(0, 640); g.fill();
  g.fillStyle = '#f2c24a'; g.beginPath(); g.moveTo(68, 300); g.lineTo(60, 200); g.lineTo(98, 250); g.lineTo(128, 180); g.lineTo(158, 250); g.lineTo(196, 200); g.lineTo(188, 300); g.closePath(); g.fill(); g.fillRect(66, 300, 124, 28); g.fillStyle = '#1e6a5a'; for (const x of [90, 128, 166]) { g.beginPath(); g.arc(x, 314, 8, 0, 7); g.fill(); } const t = P.tex(c); return t; })();
for (const x of [-4.2, 4.2]) { const b = plane(1.6, 4, new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.6, side: THREE.DoubleSide, transparent: true }), X0 + x, 4.4, -5.7); add(cyl(0.05, 0.05, 1.9, 8), GOLD, X0 + x, 6.45, -5.65).rotation.z = Math.PI / 2; }
// thrones
const throne = (x, col) => { const G = new THREE.Group(); G.position.set(X0 + x, 0, -4.4); scene.add(G); const red = std({ color: col, roughness: 0.45, envMapIntensity: 1.2 });
  add(box(1.5, 0.5, 1.2), GOLD, 0, 0.25, 0, G); add(box(1.35, 0.25, 1.05), red, 0, 0.62, 0.05, G); add(box(1.5, 3.2, 0.25), GOLD, 0, 2.0, -0.5, G); add(box(1.2, 2.8, 0.1), red, 0, 2.1, -0.36, G);
  const top = add(new THREE.CylinderGeometry(0.75, 0.75, 0.25, 24, 1, false, 0, Math.PI), GOLD, 0, 3.6, -0.5, G); top.rotation.set(Math.PI / 2, 0, Math.PI / 2); top.scale.set(1, 1, 1);
  for (const s of [-1, 1]) { add(box(0.2, 0.9, 1.1), GOLD, s * 0.75, 0.9, 0, G); add(new THREE.SphereGeometry(0.14, 12, 8), GOLD, s * 0.75, 1.4, 0.5, G); add(new THREE.SphereGeometry(0.16, 12, 8), GOLD, s * 0.75, 3.7, -0.5, G); }
  add(new THREE.SphereGeometry(0.12, 12, 8), std({ color: '#22a8b8', roughness: 0.05, metalness: 0.3 }), 0, 3.2, -0.3, G); return G; };
throne(-1.2, '#c8222a'); throne(1.2, '#c8222a');
// feast table
const TAB = new THREE.Group(); TAB.position.set(X0, 0, -1.6); scene.add(TAB);
{ add(box(6.4, 0.14, 1.6), pbr('fine_grained_wood', [3, 1], { color: '#c88a5a', roughness: 0.3 }), 0, 1.0, 0, TAB); add(box(6.5, 0.6, 1.66), std({ color: '#fffaf0', roughness: 0.6 }), 0, 0.78, 0, TAB, false); add(box(6.52, 0.02, 0.6), std({ color: '#b8222a', roughness: 0.5 }), 0, 1.085, 0, TAB, false);
  for (const x of [-2.9, 2.9]) for (const z of [-0.6, 0.6]) add(cyl(0.07, 0.07, 1.0, 8), GOLD, x, 0.5, z, TAB);
  const roast = (x, z, s = 1) => { const G = new THREE.Group(); G.position.set(x, 1.1, z); G.scale.setScalar(s); TAB.add(G); add(cyl(0.42, 0.36, 0.05, 24), std({ color: '#e8e8f0', metalness: 0.8, roughness: 0.15 }), 0, 0.02, 0, G);
    const meat = std({ color: '#c8702a', roughness: 0.25, envMapIntensity: 1.4 }); const b = add(new THREE.SphereGeometry(0.26, 18, 12), meat, 0, 0.2, 0, G); b.scale.set(1.2, 0.8, 1); for (const s2 of [-1, 1]) { const l = add(new THREE.CapsuleGeometry(0.07, 0.2, 4, 8), meat, s2 * 0.22, 0.22, 0.18, G); l.rotation.set(0.9, 0, s2 * 0.5); add(new THREE.SphereGeometry(0.04, 8, 6), std({ color: '#fff8e8' }), s2 * 0.3, 0.32, 0.3, G); }
    for (let k = 0; k < 6; k++) add(new THREE.SphereGeometry(0.05, 8, 6), std({ color: k % 2 ? '#3a9a3a' : '#e8322f' }), Math.cos(k) * 0.34, 0.06, Math.sin(k) * 0.34, G); return G; };
  TAB.userData.roast = roast(0, 0.1, 1.1);
  const bowl = (x, z) => { add(cyl(0.2, 0.12, 0.12, 20), std({ color: '#f4f0e8', roughness: 0.2 }), x, 1.14, z, TAB); add(cyl(0.18, 0.18, 0.01, 20), std({ color: '#d8582a', roughness: 0.1 }), x, 1.19, z, TAB, false); };
  bowl(-1.4, 0.2); bowl(1.4, 0.2); bowl(-2.4, 0.3); bowl(2.4, 0.3);
  const grapes = (x, z) => { const r = R(x * 100 + 7); for (let k = 0; k < 22; k++) add(new THREE.SphereGeometry(0.045, 8, 6), std({ color: '#7a2a8a', roughness: 0.15, envMapIntensity: 1.5 }), x + (r() - 0.5) * 0.18, 1.12 + (k / 22) * 0.12 * (1 - (k % 3) * 0.2), z + (r() - 0.5) * 0.14, TAB); };
  grapes(-0.8, -0.3); grapes(0.9, -0.35);
  for (let k = 0; k < 8; k++) add(new THREE.SphereGeometry(0.08, 12, 8), std({ color: k % 3 ? '#e8322f' : '#f2a020', roughness: 0.2, envMapIntensity: 1.4 }), -2.0 + k * 0.55, 1.15, -0.5 + (k % 2) * 0.1, TAB);
  for (const x of [-2.0, -0.4, 0.5, 2.0]) { add(cyl(0.06, 0.04, 0.2, 12), GOLD, x, 1.18, 0.5, TAB); add(cyl(0.015, 0.015, 0.12, 6), GOLD, x, 1.07, 0.5, TAB); }
  for (const x of [-3.0, 3.0]) { add(cyl(0.05, 0.08, 0.5, 10), GOLD, x, 1.3, 0, TAB); add(cyl(0.03, 0.03, 0.25, 8), std({ color: '#fff8e8' }), x, 1.66, 0, TAB); lamp(X0 + x, 1.85, -1.6, '#ffb060', 3, 6, 0.5); } }
put('Chandelier_01', X0, 5.4, -1.5, 0, 1.6); lamp(X0, 5.0, -1.5, '#ffd890', 8, 14, 1.2);
for (const x of [-6.2, 6.2]) { put('brass_candleholders', X0 + x, 0, -5.2, 0, 2.5); }

// ================= STAIRS + HALL (x = 50) =================
ZONE = 'stairs'; const SX = 50;
{ const STEP = toonM('floor', [0.6, 0.15], { roughness: 0.4 }); for (let k = 0; k < 12; k++) { add(box(2.2, 0.2 * (k + 1), 0.32), STEP, SX, 0.1 * (k + 1), -k * 0.3 - 0.16, scene); add(box(2.2, 0.03, 0.04), std({ color: '#1a120a' }), SX, 0.2 * (k + 1), -k * 0.3 - 0.01, scene, false); }
  plane(2.4, 14, toonM('warmfloor', [1, 6], { roughness: 0.35 }), SX, 2.41, -10.6, -Math.PI / 2); plane(2.4, 4, toonM('warmfloor', [1, 2]), SX, 0.0, 2.0, -Math.PI / 2);
  for (const s of [-1, 1]) plane(22, 7, toonM('brick', [6, 2.2], { roughness: 0.45 }), SX + s * 1.1, 3.0, -6, 0, -s * Math.PI / 2);
  plane(2.4, 5, toonM('brick', [1, 1.6]), SX, 4.9, -17.5); add(box(2.4, 0.25, 22), toonM('plank', [1, 8]), SX, 5.6, -6, scene, false);
  for (let z = 1; z > -17; z -= 2.2) add(box(2.4, 0.22, 0.26), toonM('plank', [1, 0.2]), SX, 5.4, z, scene, false);
  for (const z of [-1.5, -6, -10.5, -15]) { lamp(SX - 0.95, (z < -3 ? 4.2 : 2.4), z, '#ff9a40', 6, 8, 1.2); put('Lantern_01', SX - 1.0, (z < -3 ? 3.9 : 2.1), z, Math.PI / 2, 1.0); }
  add(box(1.4, 2.4, 0.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.6, 1.0) }), SX, 3.6, -17.4, scene, false).userData.ndSkip = true;
  for (const s of [-1, 1]) add(box(0.2, 2.6, 0.3), GOLD, SX + s * 0.8, 3.7, -17.35, scene); add(box(1.8, 0.25, 0.3), GOLD, SX, 5.0, -17.35, scene);
  put('wooden_barrels_01', SX + 0.6, 2.4, -8, 0.3, 0.8); put('wooden_crate_01', SX - 0.6, 2.4, -12.5, 0.5, 0.9); }
ZONE = 'throne';
{ add(box(1.2, 0.04, 1.2), std({ color: '#0a0806' }), X0 + 2.6, 0.012, 1.4, scene, false); for (let k = -2; k <= 2; k++) { add(box(0.05, 0.06, 1.2), IRON, X0 + 2.6 + k * 0.22, 0.04, 1.4, scene, false); add(box(1.2, 0.06, 0.05), IRON, X0 + 2.6, 0.04, 1.4 + k * 0.22, scene, false); } }
const HALF = []; { const meat = std({ color: '#c8702a', roughness: 0.25, envMapIntensity: 1.4 }); for (const s of [-1, 1]) { const G = new THREE.Group(); TAB.add(G); const b = add(new THREE.SphereGeometry(0.29, 18, 12, s > 0 ? 0 : Math.PI, Math.PI), meat, 0, 0.22, 0, G); b.scale.set(1.2, 0.8, 1); b.rotation.y = Math.PI / 2;
    const cut = add(new THREE.CircleGeometry(0.29, 18), std({ color: '#fff0d8', roughness: 0.4 }), 0, 0.22, 0, G); cut.scale.set(1.0, 0.8, 1); cut.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; G.position.set(0, 1.1, 0.1); G.visible = false; G.userData.s = s; HALF.push(G); } }
ZONE = 'dungeon';
const DROP = new THREE.Group(); scene.add(DROP); { const meat = std({ color: '#c8702a', roughness: 0.25, envMapIntensity: 1.4 }); const b = add(new THREE.SphereGeometry(0.26, 18, 12, 0, Math.PI), meat, 0, 0, 0, DROP); b.scale.set(1.2, 0.8, 1); b.rotation.y = Math.PI / 2; const c = add(new THREE.CircleGeometry(0.26, 18), std({ color: '#fff0d8', roughness: 0.4 }), 0, 0, 0, DROP); c.scale.set(1, 0.8, 1); c.rotation.y = -Math.PI / 2; const l = add(new THREE.CapsuleGeometry(0.06, 0.18, 4, 8), meat, 0.1, 0.05, 0.2, DROP); l.rotation.x = 0.9; } DROP.visible = false;
const PUDDLE = add(new THREE.CircleGeometry(0.5, 32), std({ color: '#ffaa10', roughness: 0.05, metalness: 0.1, envMapIntensity: 2.0 }), 0.6, 0.02, -0.5, scene, false); PUDDLE.rotation.x = -Math.PI / 2; PUDDLE.scale.set(1.4, 0.8, 1); PUDDLE.visible = false;
// grate hatch set (x = -50): the king glaring down through the floor grate, staged vertically
{ const HX = -50;
  for (const [y0, h] of [[0, 2.0], [3.6, 2.4]]) add(box(6, h, 0.3), GSTONE, HX, y0 + h / 2, 0, scene, false); for (const s of [-1, 1]) add(box(2.2, 1.6, 0.3), GSTONE, HX + s * 1.9, 2.8, 0, scene, false);
  for (let k = -3; k <= 3; k++) add(box(0.07, 1.6, 0.08), IRON, HX + k * 0.21, 2.8, 0.12, scene, false); for (const y of [2.15, 2.8, 3.45]) add(box(1.6, 0.07, 0.08), IRON, HX, y, 0.14, scene, false);
  add(box(1.75, 0.12, 0.12), IRON, HX, 2.0, 0.16, scene, false); add(box(1.75, 0.12, 0.12), IRON, HX, 3.6, 0.16, scene, false); for (const s of [-1, 1]) add(box(0.12, 1.75, 0.12), IRON, HX + s * 0.82, 2.8, 0.16, scene, false);
  const sb = (() => { const [c, g] = cv(512, 512); g.fillStyle = '#f4a040'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#e8702a' : '#ffb85a'; g.beginPath(); g.moveTo(256, 256); g.arc(256, 256, 400, i / 16 * 6.283, (i + 1) / 16 * 6.283); g.fill(); } return P.tex(c); })();
  plane(5, 5, new THREE.MeshBasicMaterial({ map: sb }), HX, 2.8, -1.4); lamp(HX, 3.2, 1.2, '#ffe0a0', 5, 6, 0.01); }

// ================= CRACK CELL (x = -100) =================
ZONE = 'cell'; const CX = -100;
const TEAL = paintM('teal', [3.2, 2.2]), TEALF = paintM('slate', [3, 3], { roughness: 0.5 });
plane(8, 8, TEALF, CX, 0, 0, -Math.PI / 2).receiveShadow = true;
plane(8, 5, TEAL, CX, 2.5, -0.5).receiveShadow = true;
plane(8, 5, paintM('teal', [3.2, 2.2]), CX - 2.4, 2.5, 2, 0, Math.PI / 2).receiveShadow = true;
add(box(8, 0.3, 8), paintM('slate', [3, 3]), CX, 4.6, 2, scene, false).castShadow = false;
// bars on the right side, brick corridor beyond
for (let z = -0.4; z <= 4; z += 0.24) add(cyl(0.035, 0.035, 3.6, 8), IRON, CX + 1.9, 1.8, z); for (const y of [0.12, 1.9, 3.5]) add(box(0.08, 0.08, 4.6), IRON, CX + 1.9, y, 1.8);
plane(8, 5, paintM('pbrick', [2.2, 1.6]), CX + 4.2, 2.5, 2, 0, -Math.PI / 2); plane(3, 8, toonM('warmfloor', [2, 4]), CX + 3, 0.005, 2, -Math.PI / 2);
for (const z of [0.4, 3.0]) { lamp(CX + 4.0, 2.5, z, '#ff9a40', 7, 8, 1.2); put('Lantern_01', CX + 4.1, 2.2, z, -Math.PI / 2, 1.0); }
lamp(CX - 0.6, 3.2, 1.4, '#ffe2b0', 3, 7, 0.01);
put('wooden_bucket_01', CX - 1.7, 0, 0.2, 0.3, 1.0); put('wooden_stool_01', CX - 1.5, 0, 1.6, 0.5, 1);
// bed: plank + blanket
add(box(0.9, 0.12, 2.0), toonM('plank', [1, 1]), CX - 1.9, 0.45, 2.2); add(box(0.92, 0.06, 1.5), std({ color: '#7a4a3a', roughness: 0.8 }), CX - 1.9, 0.54, 2.4); for (const z of [1.3, 3.1]) add(box(0.1, 0.45, 0.1), IRON, CX - 1.5, 0.22, z);
// the crack: jagged black split in the wall, beans packed inside
const CRK = { x: CX + 0.35, y0: 0.55, y1: 2.65, z: -0.49 };
const crackPts = (() => { const L = [], Rr = []; const n = 22; for (let i = 0; i <= n; i++) { const t = i / n, y = CRK.y0 + (CRK.y1 - CRK.y0) * t, w = 0.012 + 0.045 * Math.sin(Math.PI * Math.min(1, t * 1.1)) + (i % 3 === 1 ? 0.012 : 0), off = Math.sin(t * 11) * 0.05 + (i % 2 ? 0.022 : -0.022);
    L.push([off - w, y]); Rr.push([off + w * (0.8 + (i % 4) * 0.12), y]); } return [L, Rr]; })();
const CRACK = new THREE.Group(); CRACK.position.set(CRK.x, 0, CRK.z); scene.add(CRACK);
{ const sh = new THREE.Shape(); const [L, Rr] = crackPts; sh.moveTo(L[0][0], L[0][1]); L.forEach((q) => sh.lineTo(q[0], q[1])); [...Rr].reverse().forEach((q) => sh.lineTo(q[0], q[1])); sh.closePath();
  const m = add(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: '#06080a' }), 0, 0, 0.004, CRACK, false); m.receiveShadow = false;
  const rim = add(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: '#2a3a3c' }), 0, 0, 0.002, CRACK, false); rim.scale.set(1.6, 1.01, 1); }
const BEAN_N = 520; const BEANS = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), std({ color: '#ffffff', roughness: 0.28, envMapIntensity: 1.2 }), BEAN_N); BEANS.castShadow = true; scene.add(BEANS);
const BEANP = []; { const r = R(321); const [L, Rr] = crackPts; for (let i = 0; i < BEAN_N; i++) { const t = (i + r()) / BEAN_N, k = t * (L.length - 1), j = Math.min(L.length - 2, Math.floor(k)), f = k - j; const lx = L[j][0] + (L[j + 1][0] - L[j][0]) * f, rx2 = Rr[j][0] + (Rr[j + 1][0] - Rr[j][0]) * f;
    BEANP.push({ t, x: lx + (rx2 - lx) * (0.15 + r() * 0.7), y: L[j][1] + (L[j + 1][1] - L[j][1]) * f + (r() - 0.5) * 0.02, z: 0.01 + r() * 0.06, ry: r() * 6.28, rz: r() * 6.28, c: r() }); BEANS.setColorAt(i, new THREE.Color().setHSL(0.12 + r() * 0.03, 0.82, 0.55 + r() * 0.12)); } }
const FLOOD_N = 2200; const FLOOD = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 7), std({ color: '#ffffff', roughness: 0.28, envMapIntensity: 1.2 }), FLOOD_N); FLOOD.castShadow = true; FLOOD.receiveShadow = true; FLOOD.frustumCulled = false; scene.add(FLOOD);
{ const r = R(888); for (let i = 0; i < FLOOD_N; i++) FLOOD.setColorAt(i, new THREE.Color().setHSL(0.12 + r() * 0.03, 0.8, 0.52 + r() * 0.14)); }
const BEAN_GLOW = glow(CRK.x, 1.8, CRK.z + 0.2, 0.01, '255,220,120', 0);

// ================= TICKET STALL (x = -150) =================
ZONE = 'stall'; const KX = -150;
plane(10, 8, toonM('warmfloor', [4, 3]), KX, 0, 0, -Math.PI / 2).receiveShadow = true;
plane(10, 5, paintM('pbrick', [2.6, 1.6]), KX, 2.5, -1.6); for (const s of [-1, 1]) plane(8, 5, paintM('pbrick', [2, 1.6]), KX + s * 3.5, 2.5, 1.4, 0, -s * Math.PI / 2);
add(box(10, 0.25, 8), toonM('plank', [3, 3]), KX, 4.4, 0.5, scene, false).castShadow = false; for (const z of [-0.8, 0.6, 2.0]) add(box(10, 0.22, 0.24), toonM('plank', [3, 0.2]), KX, 4.2, z, scene, false);
add(box(2.4, 1.0, 0.7), toonM('plank', [1.5, 0.6]), KX, 0.5, -0.3); add(box(2.6, 0.08, 0.85), std({ color: '#2a6a5a', roughness: 0.4 }), KX, 1.04, -0.3);
const signTex = (() => { const [c, g] = cv(768, 512); g.fillStyle = '#f4e6c8'; g.fillRect(0, 0, 768, 512); g.strokeStyle = '#1a1414'; g.lineWidth = 18; g.strokeRect(9, 9, 750, 494); g.fillStyle = '#c8222a'; g.fillRect(30, 30, 708, 452);
  g.fillStyle = '#fff6e0'; g.textAlign = 'center'; g.font = '900 108px Arial Black, Arial'; g.lineWidth = 14; g.strokeStyle = '#3a0a0a'; g.lineJoin = 'round'; for (const [tx, y] of [['SEE THE', 150], ['BEAN WALL', 290]]) { g.strokeText(tx, 384, y); g.fillText(tx, 384, y); }
  g.font = '900 64px Arial Black, Arial'; g.fillStyle = '#ffd21a'; g.strokeText('1 COIN', 384, 420); g.fillText('1 COIN', 384, 420); return P.tex(c); })();
plane(2.1, 1.4, new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6 }), KX, 2.4, -1.5); for (const s of [-1, 1]) add(box(0.1, 2.0, 0.1), toonM('plank', [0.2, 1]), KX + s * 1.05, 2.0, -1.45);
for (let k = 0; k < 6; k++) add(box(0.14, 0.01, 0.08), std({ color: '#ffd8a0', roughness: 0.6 }), KX - 0.6 + k * 0.12, 1.09, -0.15 + (k % 2) * 0.05, scene, false);
for (let k = 0; k < 8; k++) add(cyl(0.035, 0.035, 0.012, 14), GOLD, KX + 0.5 + (k % 4) * 0.08, 1.09 + Math.floor(k / 4) * 0.012, -0.2, scene, false);
for (const x of [-2.8, 2.8]) { lamp(KX + x, 2.6, -1.4, '#ff9a40', 7, 8, 1.2); put('Lantern_01', KX + x, 2.3, -1.45, 0, 1.0); }
put('wooden_barrels_01', KX - 2.6, 0, -0.8, 0.4, 1); put('wooden_crate_01', KX + 2.6, 0, -0.9, 0.2, 1.1);

// ================= OUTSIDE AT SUNSET (x = -200) =================
ZONE = 'out'; const OX = -200;
{ const gt = (() => { const [c, g] = cv(512, 512), r = R(55); g.fillStyle = '#5a7a2a'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 3000; i++) { g.strokeStyle = `hsl(${70 + r() * 30},${40 + r() * 20}%,${22 + r() * 22}%)`; g.lineWidth = 2; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - 8 - r() * 10); g.stroke(); } const t = P.tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 12); return t; })();
  plane(80, 80, new THREE.MeshStandardMaterial({ map: gt, roughness: 0.9 }), OX, 0, -20, -Math.PI / 2).receiveShadow = true;
  const sk = (() => { const [c, g] = cv(64, 512); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#2a3a7a'); gr.addColorStop(0.45, '#c86a8a'); gr.addColorStop(0.75, '#ffb060'); gr.addColorStop(1, '#ffe0a0'); g.fillStyle = gr; g.fillRect(0, 0, 64, 512); return P.tex(c); })();
  const bd = plane(140, 50, new THREE.MeshBasicMaterial({ map: sk, fog: false }), OX, 18, -45); bd.userData.ndSkip = true;
  const sun = add(new THREE.CircleGeometry(2.6, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 1.1), fog: false }), OX + 6, 3.2, -44, scene, false); sun.userData.ndSkip = true;
  for (let i = 0; i < 9; i++) { const r = R(600 + i); const x = OX + (i - 4) * 4.2 + (r() - 0.5) * 2, z = -10 - r() * 14; add(cyl(0.18, 0.25, 2.4, 8), std({ color: '#5a3a22' }), x, 1.2, z); const f = add(new THREE.SphereGeometry(1.4 + r() * 0.6, 14, 10), std({ color: `hsl(${85 + r() * 25},45%,${26 + r() * 10}%)`, roughness: 0.8 }), x, 3.0 + r() * 0.5, z); f.scale.y = 0.9; }
  for (let k = 0; k < 3; k++) for (const s2 of [-1, 1]) add(box(1.1, 1.0 + k * 0.4, 0.9), GSTONE, OX + s2 * (1.2 + k * 1.05), (1.0 + k * 0.4) / 2, 1.0, scene).rotation.y = s2 * 0.1;
  for (let i = 0; i < 14; i++) { const r = R(700 + i); add(box(0.3 + r() * 0.3, 0.2 + r() * 0.2, 0.3 + r() * 0.3), GSTONE, OX + (r() - 0.5) * 4, 0.12, 0.2 + r() * 2.5, scene).rotation.set(r(), r() * 3, r()); } }
ZONE = 'fx';

const dustTex = (() => { const [c, g] = cv(128, 128); for (let i = 0; i < 9; i++) { const x = 34 + (i * 37) % 60, y = 34 + (i * 53) % 60, gr = g.createRadialGradient(x, y, 0, x, y, 34); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const DUST = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: dustTex, transparent: true, depthWrite: false, color: '#f0e8f8', fog: true })); m.userData.ndSkip = true; m.renderOrder = 3; m.visible = false; scene.add(m); DUST.push(m); }
const flakeTex = glowTex('255,255,255');
const SNOWF = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: flakeTex, transparent: true, depthWrite: false, fog: true, opacity: 0.95 }), 1400); SNOWF.frustumCulled = false; SNOWF.userData.ndSkip = true; SNOWF.renderOrder = 4; SNOWF.visible = false; scene.add(SNOWF);
const MOTES = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex('255,230,200'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.userData.ndSkip = true; m.renderOrder = 5; m.visible = false; scene.add(m); MOTES.push(m); }

const SWORD = new THREE.Group(); scene.add(SWORD); { const bl = std({ color: '#eef2f8', metalness: 1, roughness: 0.12, envMapIntensity: 2 }); add(box(0.07, 1.25, 0.014), bl, 0, 0.72, 0, SWORD); const tip = add(new THREE.ConeGeometry(0.05, 0.14, 4), bl, 0, 1.41, 0, SWORD); tip.scale.z = 0.3;
  add(box(0.012, 1.15, 0.018), std({ color: '#b8c0cc', metalness: 1, roughness: 0.3 }), 0, 0.7, 0, SWORD); add(box(0.34, 0.05, 0.06), GOLD, 0, 0.08, 0, SWORD); add(cyl(0.025, 0.025, 0.18, 8), std({ color: '#5a2a14', roughness: 0.6 }), 0, -0.04, 0, SWORD); add(new THREE.SphereGeometry(0.04, 10, 8), GOLD, 0, -0.15, 0, SWORD); for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.03, 8, 6), GOLD, s * 0.18, 0.08, 0, SWORD); add(new THREE.SphereGeometry(0.025, 8, 6), std({ color: '#d8222a', roughness: 0.1 }), 0, 0.08, 0.03, SWORD); }
const skyEnv = (top, hor, gnd) => { const [c, g] = cv(512, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.5, hor); gr.addColorStop(0.52, gnd); gr.addColorStop(1, gnd); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,210,140,1)'; g.beginPath(); g.ellipse(40 + i * 85, 110, 14, 10, 0, 0, 7); g.fill(); } const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return pmrem.fromEquirectangular(t).texture; };
const DENV = skyEnv('#3a5a3a', '#c8783a', '#2a2418'), TENV = skyEnv('#5a8a5a', '#ffe0b0', '#8a2a2a');
const PRESET = {
  dungeon: { cardTint: '#e4d8c6', vig: 0.8, hemi: ['#a8c898', '#3a2a1a', 0.75], key: ['#ffe0a0', 2.0], fog: ['#0e160e', 0.006], sun: [0.08, 1, 0.12], expo: 1.20, sat: 1.08, env: DENV, bloomK: 0.26, thr: 1.35, zone: 'dungeon' },
  cell: { cardTint: '#e2dcd0', hemi: ['#a8d4d0', '#22282a', 0.85], key: ['#fff2dc', 2.6], fog: ['#0a1416', 0.012], sun: [0.7, 0.9, 0.9], expo: 2.04, sat: 1.05, vig: 0.6, env: DENV, bloomK: 0.35, thr: 1.35, zone: 'cell' },
  night: { cardTint: '#a4b0dc', vig: 0.6, hemi: ['#5a78e0', '#1a2038', 0.75], key: ['#8aa8ff', 1.2], fog: ['#0a1028', 0.006], sun: [0.4, 1, 0.8], expo: 1.08, sat: 1.15, env: DENV, bloomK: 0.3, thr: 1.25, zone: 'cell' },
  stall: { cardTint: '#e6d8c4', vig: 0.8, hemi: ['#ffc890', '#2a1a10', 0.7], key: ['#ffe0b0', 1.6], fog: ['#1a100a', 0.01], sun: [0.3, 1, 0.6], expo: 1.01, sat: 1.15, env: DENV, bloomK: 0.26, thr: 1.35, zone: 'stall' },
  out: { cardTint: '#f2dcc8', vig: 0.55, hemi: ['#ffc8a0', '#3a2a1a', 0.9], key: ['#ffc080', 2.4], fog: ['#c88a7a', 0.012], sun: [0.4, 0.35, -1], expo: 1.05, sat: 1.15, env: DENV, bloomK: 0.35, thr: 1.25, zone: 'out' },
  stairs: { hemi: ['#ffd8b0', '#4a2a1a', 0.9], key: ['#ffe0b0', 1.4], fog: ['#1a100a', 0.004], sun: [0.3, 1, 0.5], expo: 1.30, sat: 1.32, env: DENV, bloomK: 0.35, thr: 1.35, zone: 'stairs' },
  throne: { hemi: ['#fff0d8', '#5a2a1a', 1.0], key: ['#fff0d0', 2.2], fog: ['#2a1a14', 0.004], sun: [0.3, 0.9, 0.6], expo: 1.24, sat: 1.32, env: TENV, bloomK: 0.35, thr: 1.35, zone: 'throne' },
};
import { stateAt, TOTAL } from './shots.js';
const V = new THREE.Vector3();
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
window.renderFrame = (f) => {
  const S = stateAt(f, {}), t = f / 30; const L = PRESET[S.preset || 'dungeon'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2]; moon.color.set(L.key[0]); moon.intensity = S.key ?? L.key[1];
  scene.fog.color.set(L.fog[0]); scene.fog.density = S.fog ?? L.fog[1]; scene.environment = L.env;
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(0, 0, 0); inkU.flash.value = S.flash || 0; inkU.vig.value = L.vig ?? 0.35; inkU.bloomK.value = S.bloomK ?? L.bloomK; brightU.thr.value = S.thr ?? L.thr; inkU.split.value = 0; inkU.greenK.value = 0; inkU.raysK.value = 0;
  for (const l of pLights) { l.visible = l.userData.zone === L.zone; l.intensity = l.userData.I0 * (1 + 0.08 * Math.sin(t * 13 + l.position.x * 7)); } for (const g of glows) g.visible = g.userData.zone === L.zone || g.userData.zone === 'fx';
  SHAFT.forEach((m, k) => { m.visible = L.zone === 'dungeon' && S.shaft !== false; m.material.opacity = 0.06 + 0.025 * Math.sin(t * 1.5 + k * 1.7); });
  SPECK.visible = L.zone === 'dungeon' && S.motes !== false; if (SPECK.visible) { const M4 = new THREE.Matrix4(); for (let i = 0; i < SPECK.count; i++) { const a = (t * 0.03 * (0.5 + rnd(i, 2)) + rnd(i, 1)) % 1; const p = new THREE.Vector3(-1.4 + rnd(i, 3) * 2.8 + Math.sin(t * 0.6 + i) * 0.08, 4.0 - a * 3.9, -1.2 + rnd(i, 5) * 3.6); const sc = p.distanceTo(camera.position) < 0.9 ? 0 : 0.006 + rnd(i, 6) * 0.007; M4.compose(p, camera.quaternion, new THREE.Vector3(sc, sc, sc)); SPECK.setMatrixAt(i, M4); } SPECK.instanceMatrix.needsUpdate = true; }
  TAB.userData.roast.visible = !S.cutRoast; HALF.forEach((h) => { h.visible = !!S.cutRoast; if (S.cutRoast) { const k = Math.min(1, S.cutRoast); h.position.x = h.userData.s * 0.22 * k; h.rotation.z = -h.userData.s * 0.5 * k; h.position.y = 1.1 - 0.04 * k; } }); DROP.visible = !!S.drop; if (S.drop) { DROP.position.set(...S.drop.p); DROP.rotation.set(S.drop.r || 0, 0.5, S.drop.r * 0.6 || 0); }
  { const fill = S.beans ?? 0.6, sw = S.swell ?? 0, M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); for (let i = 0; i < BEAN_N; i++) { const b = BEANP[i], on = b.t < fill; const sc = on ? (0.019 + 0.004 * b.c) * (1 + sw * 1.4) : 0; const jx = sw * Math.sin(i * 1.7) * 0.06, jz = sw * 0.05 * b.c;
    e.set(0, b.ry, b.rz); q.setFromEuler(e); M4.compose(new THREE.Vector3(CRK.x + b.x * (1 + sw * 0.4) + jx, b.y, CRK.z + b.z + jz + sw * 0.02), q, new THREE.Vector3(sc * 1.45, sc, sc * 0.95)); BEANS.setMatrixAt(i, M4); } BEANS.instanceMatrix.needsUpdate = true; CRACK.scale.set(1 + sw * 0.9 + (S.burst || 0) * 2, 1, 1); }
  FLOOD.visible = !!S.flood; if (S.flood) { const [fx0, fz0] = S.floodAt || [CRK.x, CRK.z + 0.3], M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); for (let i = 0; i < FLOOD_N; i++) { const a = rnd(i, 7) * 3.1416, rr = Math.sqrt(rnd(i, 8)) * 3.2 * S.flood, h = Math.max(0, 0.6 * S.flood * (1 - rr / 3.3)) * rnd(i, 9) + (S.fly ? Math.max(0, Math.sin(rnd(i, 10) * 3 + S.fly * 3)) * 1.5 * (1 - S.fly) : 0);
      e.set(rnd(i, 11) * 6, rnd(i, 12) * 6, 0); q.setFromEuler(e); const sc = 0.03 + 0.008 * rnd(i, 13); M4.compose(new THREE.Vector3(fx0 + Math.cos(a) * rr * 1.3, 0.025 + h, fz0 + Math.sin(a) * rr), q, new THREE.Vector3(sc * 1.45, sc, sc)); FLOOD.setMatrixAt(i, M4); } FLOOD.instanceMatrix.needsUpdate = true; }
  PUDDLE.visible = !!S.puddle; if (S.puddle) PUDDLE.scale.set(1.4 * S.puddle, 0.8 * S.puddle, 1);
  SWORD.visible = !!S.sword; if (S.sword) { SWORD.position.set(...S.sword.p); SWORD.rotation.set(S.sword.rx || 0, S.sword.ry || 0, S.sword.rz || 0); SWORD.scale.setScalar(S.sword.s || 1); }
  const sh = S.shake || 0, hh = S.handheld ?? 0.008; let look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look.x, look.y, look.z); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const fc = S.shadowAt ? S.shadowAt : [look.x, look.y, look.z], sd = new THREE.Vector3(...L.sun).normalize(); moon.position.set(fc[0] + sd.x * 30, fc[1] + sd.y * 30, fc[2] + sd.z * 30); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 8; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 80; sc.updateProjectionMatrix(); }
  DUST.forEach((m) => (m.visible = false));
  MOTES.forEach((m, i) => { m.visible = false; if (!m.visible) return; const a = (t * 0.04 * (0.5 + rnd(i, 2)) + rnd(i, 1)) % 1; m.position.set(-1 + rnd(i, 3) * 2.2 + Math.sin(t * 0.5 + i) * 0.2, 0.3 + ((rnd(i, 4) + a) % 1) * 3.8, 0.2 + rnd(i, 5) * 2.0); m.scale.setScalar(0.012 + rnd(i, 6) * 0.01); m.quaternion.copy(camera.quaternion); m.material.opacity = m.position.distanceTo(camera.position) < 1.4 ? 0 : 0.8; });
  for (const g of glows) { g.quaternion.copy(camera.quaternion); g.material.opacity = g.userData.k0 * Math.exp(-g.position.distanceTo(camera.position) * 0.04); }
  if (bang.userData.g) bang.userData.g.quaternion.copy(camera.quaternion); bang.visible = false; bangLight.intensity = 0;
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); const upv = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw, !a.fx); c.mesh.visible = true; let px = a.x, py = a.y, pz = a.z;
    if (a.hud) { const d = a.hud.d || 1.2; const o = camera.position.clone().addScaledVector(fwd, d).addScaledVector(upv, a.hud.up || 0); px = o.x; py = o.y; pz = o.z; }
    c.mesh.position.set(px, py, pz); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s * (a.scaleY || 1), s);
    if (a.hud || a.face) c.mesh.quaternion.copy(camera.quaternion); else c.mesh.rotation.set(0, a.yaw ?? Math.atan2(camera.position.x - px, camera.position.z - pz), a.roll || 0);
    c.mat.color.set(a.tint || L.cardTint || '#ffffff'); c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2; c.mat.depthTest = !a.hud; c.mesh.castShadow = !a.fx;
    c.blob.visible = !a.fx && a.blob !== false; c.blob.position.set(px, (a.ground ?? py) + 0.015, pz); c.blob.scale.set(1.0 * s, 0.55 * s, 1); });
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.autoUpdate = false; swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false); scene.fog = fog; renderer.shadowMap.autoUpdate = true;
  renderer.setRenderTarget(rtB1); renderer.render(brightScene, fsCam);
  for (let k = 0; k < 3; k++) { const r = 1 + k * 1.2; blurU.src.value = rtB1.texture; blurU.dir.value.set(r / (W / 2), 0); renderer.setRenderTarget(rtB2); renderer.render(blurScene, fsCam); blurU.src.value = rtB2.texture; blurU.dir.value.set(0, r / (H / 2)); renderer.setRenderTarget(rtB1); renderer.render(blurScene, fsCam); }
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = 5; dofU.cinf.value = 0; dofU.haze.value = 0; dofU.time.value = t; renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL; window.ready = true;
