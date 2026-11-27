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
// ================= CANYON + TWO BRIDGES =================
// canyon runs along z; bridges cross it along x. Kid's teal bridge at z = 0 (gap at x = 0); rival's orange bridge at z = ZR.
ZONE = 'canyon';
const ZR = -46, DEPTH = 36, DW = 7.2, DY = 0.0;  // deck width, deck top y
const xEdge = (z, s) => s * (21 + 2.2 * Math.sin(z * 0.045 + (s > 0 ? 1.3 : 0)) + 1.4 * Math.sin(z * 0.11 + s)) ;
const skyEnv = (top, hor, gnd) => { const [c, g] = cv(512, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.5, hor); gr.addColorStop(0.52, gnd); gr.addColorStop(1, gnd); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return pmrem.fromEquirectangular(t).texture; };
const ENV = { day: skyEnv('#3a72e0', '#d8ecff', '#d8b070'), hot: skyEnv('#4a7ad0', '#fff0c8', '#e8b060'), gold: skyEnv('#3a64c8', '#ffd8a0', '#d8a060') };

// --- painted textures ---
const sandTex = (() => { const [c, g] = cv(1024, 1024), r = R(11); g.fillStyle = '#e6c07a'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 60; i++) { const x = r() * 1024, y = r() * 1024, rr = 60 + r() * 200, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, r() < 0.5 ? 'rgba(255,230,170,.35)' : 'rgba(190,140,70,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024); }
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '150,100,50' : '255,240,200'},${0.1 + r() * 0.2})`; g.fillRect(r() * 1024, r() * 1024, 1 + r() * 2, 1 + r() * 2); }
  for (let i = 0; i < 260; i++) { const x = r() * 1024, y = r() * 1024, s = 2 + r() * 6; g.fillStyle = `hsl(${20 + r() * 20},${30 + r() * 20}%,${40 + r() * 25}%)`; g.beginPath(); g.ellipse(x, y, s, s * 0.7, r() * 3, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,30,10,.5)'; g.lineWidth = 1.5; g.stroke(); }
  const t = P.tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; })();
const strataTex = (() => { const [c, g] = cv(512, 1024), r = R(21); const bands = ['#e8a050', '#c8642a', '#d87a3a', '#b04a22', '#e8b468', '#c25a2a', '#a8441e', '#d8884a', '#b85428', '#8a3a1a']; let y = 0;
  for (let k = 0; y < 1024; k++) { const h = 40 + r() * 110; g.fillStyle = bands[k % bands.length]; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + k) * 8); g.lineTo(512, y + h + 8); g.lineTo(0, y + h + 8); g.fill();
    for (let i = 0; i < 220; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '70,25,10' : '255,220,170'},${0.06 + r() * 0.12})`; g.fillRect(r() * 512, y + r() * h, 3 + r() * 16, 1 + r() * 2.5); }
    g.strokeStyle = 'rgba(60,20,8,.55)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + k) * 8); g.stroke(); y += h; }
  for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(60,20,8,${0.2 + r() * 0.25})`; g.lineWidth = 2 + r() * 4; const x = r() * 512; g.beginPath(); g.moveTo(x, r() * 300); g.lineTo(x + (r() - 0.5) * 30, 300 + r() * 700); g.stroke(); }
  const t = P.tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; })();
const asphaltTex = (() => { const [c, g] = cv(512, 512), r = R(41); g.fillStyle = '#5a5650'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 9000; i++) { const l = 26 + r() * 26; g.fillStyle = `hsl(30,6%,${l}%)`; g.fillRect(r() * 512, r() * 512, 1 + r() * 2.5, 1 + r() * 2.5); }
  for (let i = 0; i < 20; i++) { const x = r() * 512, y = r() * 512, rr = 30 + r() * 90, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(${r() < 0.5 ? '30,28,26' : '140,130,120'},.18)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); }
  const t = P.tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; })();
const girderTex = (base) => { const [c, g] = cv(1024, 256), r = R(base.length * 7); g.fillStyle = base; g.fillRect(0, 0, 1024, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,.25)'); gr.addColorStop(0.2, 'rgba(255,255,255,0)'); gr.addColorStop(0.8, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.3)'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.03 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * 1024, r() * 256, 2 + r() * 10, 1 + r() * 4, 0, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(20,14,10,.75)'; g.lineWidth = 4; for (let x = 0; x <= 1024; x += 256) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  for (let x = 16; x < 1024; x += 32) for (const y of [26, 230]) { g.fillStyle = 'rgba(20,14,10,.8)'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(x - 1.5, y - 1.5, 2.5, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(20,14,10,.85)'; g.lineWidth = 5; g.strokeRect(2, 2, 1020, 252); const t = P.tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
const cloudTex = (seed) => { const [c, g] = cv(512, 256), r = R(seed); for (let i = 0; i < 14; i++) { const x = 90 + r() * 330, y = 120 + (r() - 0.3) * 60, rr = 40 + r() * 60; const gr = g.createRadialGradient(x, y - rr * 0.3, rr * 0.1, x, y, rr); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.75, '#f4f8ff'); gr.addColorStop(1, 'rgba(220,232,250,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
  g.globalCompositeOperation = 'source-atop'; const sh = g.createLinearGradient(0, 100, 0, 230); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(120,140,180,.4)'); g.fillStyle = sh; g.fillRect(0, 0, 512, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const skyTex = (stops) => { const [c, g] = cv(16, 512); const gr = g.createLinearGradient(0, 0, 0, 512); stops.forEach(([k, col]) => gr.addColorStop(k, col)); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const SKYT = { day: skyTex([[0, '#1a4ec8'], [0.3, '#3a80ea'], [0.47, '#9ccaff'], [0.5, '#e4f0ff'], [1, '#e4f0ff']]), hot: skyTex([[0, '#2a5ac0'], [0.3, '#5a92e0'], [0.46, '#ffe0a8'], [0.5, '#fff0d0'], [1, '#fff0d0']]), gold: skyTex([[0, '#2a58c8'], [0.3, '#5a8ae0'], [0.46, '#ffc890'], [0.5, '#ffe0b8'], [1, '#ffe0b8']]) };
const SKY = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), new THREE.MeshBasicMaterial({ map: SKYT.day, side: THREE.BackSide, fog: false, depthWrite: false })); SKY.userData.ndSkip = true; SKY.renderOrder = -1; scene.add(SKY);
const CLOUDS = []; for (let i = 0; i < 22; i++) { const r = R(400 + i); const a = r() * 6.283, d = 500 + r() * 500; const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), new THREE.MeshBasicMaterial({ map: cloudTex(410 + i), transparent: true, depthWrite: false, fog: false }));
  m.position.set(Math.cos(a) * d, 90 + r() * 170, Math.sin(a) * d); m.scale.setScalar(150 + r() * 150); m.lookAt(0, m.position.y, 0); m.userData.ndSkip = true; scene.add(m); CLOUDS.push(m); }

// --- desert ground on both rims (shape with the canyon edge), canyon walls, floor + river ---
const SAND = new THREE.MeshStandardMaterial({ map: (() => { const t = sandTex.clone(); t.repeat.set(40, 40); t.needsUpdate = true; return t; })(), roughness: 0.95 });
for (const s of [-1, 1]) { const pts = []; for (let z = -700; z <= 700; z += 4) pts.push(new THREE.Vector2(xEdge(z, s), z)); pts.push(new THREE.Vector2(s * 800, 700), new THREE.Vector2(s * 800, -700));
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)); g.rotateX(Math.PI / 2); { const p = g.attributes.position, uv = []; for (let i = 0; i < p.count; i++) uv.push(p.getX(i) / 25, p.getZ(i) / 25); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); } g.computeVertexNormals();
  const m = new THREE.Mesh(g, SAND); m.material.side = THREE.DoubleSide; m.receiveShadow = true; scene.add(m); }
const WALLM = new THREE.MeshStandardMaterial({ map: (() => { const t = strataTex.clone(); t.repeat.set(1, 1); t.needsUpdate = true; return t; })(), roughness: 0.92 });
for (const s of [-1, 1]) { const seg = 350, rows = 14, pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) { const z = -700 + i / seg * 1400; for (let j = 0; j <= rows; j++) { const v = j / rows, y = -v * DEPTH; const ter = Math.floor(v * 4) / 4; const off = (v * 6 + Math.sin(z * 0.13 + j) * 0.8 + (Math.sin(z * 0.031 + j * 1.7) * 1.4) * Math.sin(v * Math.PI)) + ter * 2.5;
      pos.push(xEdge(z, s) - s * off, y, z); uv.push(z / 40, 1 - v); } }
  for (let i = 0; i < seg; i++) for (let j = 0; j < rows; j++) { const a = i * (rows + 1) + j, b = a + 1, c = a + rows + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, WALLM); m.material.side = THREE.DoubleSide; m.receiveShadow = true; m.castShadow = true; scene.add(m); }
{ const fl = plane(80, 1400, new THREE.MeshStandardMaterial({ map: (() => { const t = sandTex.clone(); t.repeat.set(4, 60); t.needsUpdate = true; return t; })(), color: '#e0a070', roughness: 1 }), 0, -DEPTH + 0.1, 0, -Math.PI / 2); fl.receiveShadow = true;
  const rv = new THREE.MeshStandardMaterial({ color: '#2aa8b0', roughness: 0.08, metalness: 0.15, envMapIntensity: 1.6 }); const pts = []; for (let z = -700; z <= 700; z += 6) pts.push([Math.sin(z * 0.02) * 4, z]);
  const pos = [], idx = []; pts.forEach(([x, z], i) => { pos.push(x - 5.5, -DEPTH + 0.25, z, x + 5.5, -DEPTH + 0.25, z); if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const rm = new THREE.Mesh(g, rv); rm.material.side = THREE.DoubleSide; rm.receiveShadow = true; scene.add(rm);
  // foam edges
  const fm = std({ color: '#e8f8f4', roughness: 0.5 }); for (const s of [-1, 1]) { const p2 = [], i2 = []; pts.forEach(([x, z], i) => { p2.push(x + s * 5.5, -DEPTH + 0.27, z, x + s * 6.2, -DEPTH + 0.27, z); if (i) { const a = (i - 1) * 2; i2.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }); const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(p2, 3)); g2.setIndex(i2); g2.computeVertexNormals(); const f = new THREE.Mesh(g2, fm); f.material.side = THREE.DoubleSide; scene.add(f); } }
// --- distant mesas / buttes ---
{ for (let i = 0; i < 18; i++) { const r = R(600 + i), a = r() * 6.283, d = 380 + r() * 420; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 120) continue; const rad0 = 30 + r() * 70, h = 35 + r() * 70;
    const g = new THREE.CylinderGeometry(rad0 * 0.82, rad0, h, 9 + Math.floor(r() * 4), 4); { const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const yy = p.getY(k), ang = Math.atan2(p.getZ(k), p.getX(k)); const n = 1 + 0.12 * Math.sin(ang * 3 + i) + 0.06 * Math.sin(ang * 7); if (Math.abs(yy) < h / 2 - 0.01) { p.setX(k, p.getX(k) * n); p.setZ(k, p.getZ(k) * n); } } g.computeVertexNormals(); }
    const mt = new THREE.MeshStandardMaterial({ map: (() => { const t = strataTex.clone(); t.repeat.set(3, 0.7); t.needsUpdate = true; return t; })(), roughness: 1 }); const m = add(g, mt, x, h / 2 - 2, z, scene, false); m.receiveShadow = false;
    add(new THREE.CylinderGeometry(rad0 * 0.84, rad0 * 0.84, 1.5, 12), std({ color: '#d8a868', roughness: 1 }), x, h - 1.5, z, scene, false).userData.ndSkip = true; m.userData.ndSkip = true; }
  for (let i = 0; i < 14; i++) { const r = R(700 + i), a = r() * 6.283, d = 160 + r() * 200; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 70) continue; const rr = 6 + r() * 10, h = 8 + r() * 18;
    add(new THREE.CylinderGeometry(rr * 0.6, rr, h, 7), new THREE.MeshStandardMaterial({ map: (() => { const t = strataTex.clone(); t.repeat.set(1, 0.4); t.needsUpdate = true; return t; })(), roughness: 1 }), x, h / 2 - 1, z, scene, false); } }
// --- scrub bushes, rocks, cacti on the rims ---
const nearRoad = (x, z) => Math.abs(z) < 7 || Math.abs(z - ZR) < 7;
{ const n = 1600, im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.6, 1), std({ color: '#ffffff', roughness: 0.85 }), n), m4 = new THREE.Matrix4(), c = new THREE.Color(), r = R(31); let i = 0;
  while (i < n) { const s = r() < 0.5 ? -1 : 1, z = (r() - 0.5) * 500, x = xEdge(z, s) + s * (2 + Math.pow(r(), 1.5) * 220); if (nearRoad(x, z) || (Math.abs(z) < 30 && Math.abs(x) < 40) ) continue; const k = 0.5 + r() * 1.1; m4.compose(new THREE.Vector3(x, 0.25 * k, z), new THREE.Quaternion(), new THREE.Vector3(k * (1 + r() * 0.5), k * 0.75, k)); im.setMatrixAt(i, m4); im.setColorAt(i, c.setHSL(0.2 + r() * 0.08, 0.45, 0.28 + r() * 0.12)); i++; }
  im.castShadow = true; im.receiveShadow = true; im.userData.ndSkip = true; scene.add(im);
  const rk = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.5, 0), std({ color: '#ffffff', roughness: 0.9 }), 500); i = 0; while (i < 500) { const s = r() < 0.5 ? -1 : 1, z = (r() - 0.5) * 400, x = xEdge(z, s) + s * (1 + r() * 160); if (nearRoad(x, z)) continue; const k = 0.3 + r() * 0.9; m4.compose(new THREE.Vector3(x, 0.1, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(r(), r() * 6, r())), new THREE.Vector3(k * 1.3, k * 0.7, k)); rk.setMatrixAt(i, m4); rk.setColorAt(i, c.setHSL(0.05 + r() * 0.04, 0.45, 0.4 + r() * 0.15)); i++; }
  rk.castShadow = true; rk.receiveShadow = true; rk.userData.ndSkip = true; scene.add(rk);
  const CAC = std({ color: '#4a8a3a', roughness: 0.7 }); for (let k = 0; k < 26; k++) { const s = k % 2 ? 1 : -1, z = (R(800 + k)() - 0.5) * 220, x = xEdge(z, s) + s * (14 + R(900 + k)() * 90); if (nearRoad(x, z)) continue; const h = 2.5 + R(950 + k)() * 2.5;
    add(cyl(0.32, 0.36, h, 10), CAC, x, h / 2, z); for (const a of [-1, 1]) { const ah = h * 0.35; add(cyl(0.22, 0.22, ah, 8), CAC, x + a * 0.7, h * 0.45 + ah / 2, z); const arm = add(cyl(0.2, 0.2, 0.7, 8), CAC, x + a * 0.38, h * 0.42, z); arm.rotation.z = Math.PI / 2; } } }

// --- roads on both rims leading to each bridge ---
const ASPH = (rep) => new THREE.MeshStandardMaterial({ map: (() => { const t = asphaltTex.clone(); t.repeat.set(rep, 1); t.needsUpdate = true; return t; })(), roughness: 0.8, envMapIntensity: 0.5 });
const WHITE = std({ color: '#f4f2ea', roughness: 0.6 }), YELM = std({ color: '#f2c41a', roughness: 0.55 });
for (const zc of [0, ZR]) for (const s of [-1, 1]) { const x0 = s * 21, len = 420; const r0 = plane(len, DW, ASPH(len / 6), x0 + s * len / 2 - s * 2, 0.02, zc, -Math.PI / 2); r0.receiveShadow = true;
  for (const e of [-1, 1]) plane(len, 0.18, WHITE, x0 + s * len / 2, 0.03, zc + e * (DW / 2 - 0.4), -Math.PI / 2);
  for (let k = 0; k < 60; k++) plane(2.4, 0.16, YELM, x0 + s * (4 + k * 7), 0.03, zc, -Math.PI / 2); }

// ================= THE KID'S BRIDGE (teal, z = 0, two halves with a gap at x = 0) =================
const TEAL = new THREE.MeshStandardMaterial({ map: girderTex('#1ea89a'), roughness: 0.4, metalness: 0.2, envMapIntensity: 1.1 }), TEALP = std({ color: '#1ea89a', roughness: 0.38, metalness: 0.25, envMapIntensity: 1.1 });
const DECKM = (rep) => new THREE.MeshStandardMaterial({ map: (() => { const t = asphaltTex.clone(); t.repeat.set(rep, 1.2); t.needsUpdate = true; return t; })(), roughness: 0.82, envMapIntensity: 0.5 });
const CONC = std({ color: '#cfc8ba', roughness: 0.85 });
const HALF = []; // two groups; each built with its inner (gap) edge at local x = 0, extending outward
for (const s of [-1, 1]) { const G = new THREE.Group(); scene.add(G); HALF.push(G); const L = 34, cx = -s * 0 + s * L / 2;
  add(box(L, 0.5, DW), DECKM(L / 6), cx, DY - 0.25, 0, G); // deck slab
  for (const e of [-1, 1]) { plane(L, 0.18, WHITE, cx, DY + 0.012, e * (DW / 2 - 0.4), -Math.PI / 2, 0, G); }
  for (let k = 0; k < 5; k++) plane(2.4, 0.16, YELM, s * (2.2 + k * 6.5), DY + 0.012, 0, -Math.PI / 2, 0, G);
  for (const e of [-1, 1]) { const gd = add(box(L, 1.5, 0.35), TEAL, cx, DY - 0.75, e * (DW / 2 + 0.1), G); // side girders
    add(box(L, 0.18, 0.45), CONC, cx, DY + 0.1, e * (DW / 2 - 0.05), G); // curb
    for (let x = 0.4; x < L; x += 2.2) { add(box(0.16, 1.05, 0.16), TEALP, s * x, DY + 0.6, e * (DW / 2 + 0.05), G); } // posts
    for (const hy of [0.55, 1.05]) add(box(L, 0.12, 0.12), TEALP, cx, DY + hy, e * (DW / 2 + 0.05), G); }
  for (let x = 1.5; x < L; x += 3) add(box(0.3, 1.2, DW), TEALP, s * x, DY - 1.0, 0, G, false); // cross beams under
  // comb plate on this half (hidden until placed)
  G.userData.s = s; }
// arch under the kid's bridge (fixed), spanning the canyon
{ const n = 40; for (const e of [-1, 1]) { const pts = []; for (let i = 0; i <= n; i++) { const u = i / n, x = -22 + u * 44, y = -DEPTH * 0.55 + Math.sin(u * Math.PI) * (DEPTH * 0.55 - 2.4); pts.push(new THREE.Vector3(x, y, e * 2.6)); }
    const curve = new THREE.CatmullRomCurve3(pts); add(new THREE.TubeGeometry(curve, 80, 0.55, 8), TEALP, 0, 0, 0);
    for (let i = 2; i < n - 1; i += 3) { const p = pts[i]; const h = (DY - 1.3) - p.y; if (h > 0.3) add(box(0.3, h, 0.3), TEALP, p.x, p.y + h / 2, e * 2.6); } }
  for (let i = 2; i < 40; i += 3) { const u = i / 40, x = -22 + u * 44, y = -DEPTH * 0.55 + Math.sin(u * Math.PI) * (DEPTH * 0.55 - 2.4); add(box(0.25, 0.25, 5.2), TEALP, x, y, 0, scene, false); } }
// abutments
for (const zc of [0, ZR]) for (const s of [-1, 1]) add(box(3, 3, DW + 1.2), CONC, s * 21.5, -1.5, zc);

// --- steel comb plates (fingers interleave across the gap) ---
const COMB = []; const COMBM = std({ color: '#aab2bc', metalness: 0.45, roughness: 0.42, envMapIntensity: 0.55 }), COMBD = std({ color: '#7a828c', metalness: 0.8, roughness: 0.35 });
const FING = 0.34, FL = 0.62; // finger pitch (z) and length
const fingerGeo = (() => { const w = FING * 0.2, sh = new THREE.Shape(); sh.moveTo(0, -w); sh.lineTo(FL - w, -w); sh.absarc(FL - w, 0, w, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(0, w); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1 }); g.rotateX(Math.PI / 2); return g; })();
for (const s of [-1, 1]) { const G = new THREE.Group(); scene.add(G); COMB.push(G); // local x=0 at the gap edge, plate extends outward (-s)
  add(box(1.0, 0.06, DW - 1.2), COMBM, s * (FL / 2 + 0.5), DY + 0.03, 0, G);
  for (let z = -DW / 2 + 0.8, k = 0; z < DW / 2 - 0.6; z += 0.5, k++) { add(cyl(0.05, 0.05, 0.03, 8), COMBD, s * (FL / 2 + 0.25 + (k % 2) * 0.5), DY + 0.07, z, G, false); }
  const off = s > 0 ? FING / 2 : 0; for (let z = -DW / 2 + 0.6 + off; z < DW / 2 - 0.6; z += FING) { const f = add(fingerGeo, COMBM, s * FL / 2, DY + 0.05, z, G); f.rotation.y = s > 0 ? Math.PI : 0; } }

// ================= THE RIVAL BRIDGE (orange, z = ZR): sliced so it can bulge =================
const ORG = new THREE.MeshStandardMaterial({ map: girderTex('#e8641e'), roughness: 0.4, metalness: 0.2, envMapIntensity: 1.1 }), ORGP = std({ color: '#e8641e', roughness: 0.38, metalness: 0.25, envMapIntensity: 1.1 });
const RSL = []; const RN = 56, RX0 = -34, RX1 = 34, RW = (RX1 - RX0) / RN;
{ const dm = DECKM(1 / 6 * RW * 6); for (let i = 0; i < RN; i++) { const G = new THREE.Group(); scene.add(G); const x = RX0 + (i + 0.5) * RW; G.position.set(x, 0, ZR); RSL.push(G); G.userData.x = x;
    add(box(RW + 0.02, 0.5, DW), dm, 0, DY - 0.25, 0, G);
    for (const e of [-1, 1]) { plane(RW + 0.02, 0.18, WHITE, 0, DY + 0.012, e * (DW / 2 - 0.4), -Math.PI / 2, 0, G); const gm = ORG.clone(); gm.map = ORG.map.clone(); gm.map.repeat.set(RW / 8, 1); gm.map.offset.set(i * RW / 8, 0); gm.map.needsUpdate = true; add(box(RW + 0.02, 1.5, 0.35), gm, 0, DY - 0.75, e * (DW / 2 + 0.1), G);
      add(box(RW + 0.02, 0.18, 0.45), CONC, 0, DY + 0.1, e * (DW / 2 - 0.05), G); if (i % 2 === 0) add(box(0.16, 1.05, 0.16), ORGP, 0, DY + 0.6, e * (DW / 2 + 0.05), G); for (const hy of [0.55, 1.05]) add(box(RW + 0.03, 0.12, 0.12), ORGP, 0, DY + hy, e * (DW / 2 + 0.05), G); }
    if (i % 3 === 0) plane(RW * 0.95, 0.16, YELM, 0, DY + 0.013, 0, -Math.PI / 2, 0, G);
    if (i % 3 === 1) add(box(0.3, 1.2, DW), ORGP, 0, DY - 1.0, 0, G, false); } }
// trestle towers (X-braced) under the rival bridge
{ const lat = (x0) => { const top = DY - 1.5, bot = -DEPTH + 0.2; for (const e of [-1, 1]) for (const dx of [-1.6, 1.6]) add(box(0.4, top - bot, 0.4), ORGP, x0 + dx, (top + bot) / 2, ZR + e * 2.8);
    for (let y = bot; y < top - 2; y += 4.5) { for (const e of [-1, 1]) { const a = add(box(0.18, Math.hypot(3.2, 4.5), 0.18), ORGP, x0, y + 2.25, ZR + e * 2.8, scene, false); a.rotation.z = Math.atan2(3.2, 4.5); const b = add(box(0.18, Math.hypot(3.2, 4.5), 0.18), ORGP, x0, y + 2.25, ZR + e * 2.8, scene, false); b.rotation.z = -Math.atan2(3.2, 4.5); }
      for (const dx of [-1.6, 1.6]) { const c = add(box(0.18, Math.hypot(5.6, 4.5), 0.18), ORGP, x0 + dx, y + 2.25, ZR, scene, false); c.rotation.x = Math.atan2(5.6, 4.5); } add(box(3.6, 0.22, 0.22), ORGP, x0, y, ZR - 2.8, scene, false); add(box(3.6, 0.22, 0.22), ORGP, x0, y, ZR + 2.8, scene, false); } };
  for (const x0 of [-13, 13]) lat(x0); }
// rivets that pop off the rival girder (side facing the kid's bridge, +z)
const RIV = []; { const rm = std({ color: '#3a3a40', metalness: 0.8, roughness: 0.3 }); for (let i = 0; i < 40; i++) { const m = add(new THREE.SphereGeometry(0.09, 8, 6), rm, 0, -50, 0, scene, false); RIV.push(m); } }

// ================= vintage cars =================
const CARS = {}; const mkCar = (name, col, open = false) => { const G = new THREE.Group(); scene.add(G); const W = []; const P0 = std({ color: col, roughness: 0.25, metalness: 0.15, envMapIntensity: 1.4 }), BK = std({ color: '#18181c', roughness: 0.45 }), CH = std({ color: '#e8ecf0', metalness: 1, roughness: 0.15, envMapIntensity: 1.8 }), TIRE = std({ color: '#1a1a1e', roughness: 0.7 }), WW = std({ color: '#f4f0e8', roughness: 0.5 }), SEAT = std({ color: '#6a2a1e', roughness: 0.6 });
  const B = new THREE.Group(); G.add(B); // body (can pitch)
  add(box(2.0, 0.75, 1.55), P0, -0.35, 0.95, 0, B); // cabin tub
  const hood = add(box(1.35, 0.62, 1.15), P0, 1.25, 0.95, 0, B); add(box(1.3, 0.06, 0.06), CH, 1.25, 1.28, 0, B, false);
  for (let k = 0; k < 6; k++) add(box(0.5, 0.03, 0.02), BK, 1.25, 1.05 - k * 0.0, -0.59 + 0, B, false).position.set(1.0 + k * 0.1, 1.0, 0.585);
  add(box(0.12, 0.8, 1.0), CH, 1.98, 1.0, 0, B); for (let k = 0; k < 7; k++) add(box(0.02, 0.62, 0.02), BK, 2.05, 1.0, -0.36 + k * 0.12, B, false); // grille
  for (const e of [-1, 1]) { const hl = add(new THREE.SphereGeometry(0.17, 14, 10), CH, 2.08, 1.35, e * 0.55, B); add(new THREE.CircleGeometry(0.13, 14), std({ color: '#fffbe0', emissive: '#fff4c0', emissiveIntensity: 0.6 }), 2.22, 1.35, e * 0.55, B, false).rotation.y = Math.PI / 2; }
  add(box(0.25, 0.08, 1.6), CH, 2.1, 0.62, 0, B); add(box(0.2, 0.08, 1.6), CH, -1.45, 0.62, 0, B); // bumpers
  for (const e of [-1, 1]) { // fenders + running board
    for (const fx of [1.35, -0.95]) { const f = add(new THREE.CylinderGeometry(0.52, 0.52, 0.38, 20, 1, true, -Math.PI / 2, Math.PI), P0.clone(), fx, 0.5, e * 0.72, B); f.rotation.x = Math.PI / 2; f.material.side = THREE.DoubleSide; }
    add(box(1.6, 0.06, 0.28), BK, 0.2, 0.55, e * 0.85, B); }
  add(box(0.6, 0.3, 1.3), SEAT, -0.8, 1.3, 0, B); add(box(0.15, 0.45, 1.3), SEAT, -1.05, 1.5, 0, B); add(box(0.08, 0.5, 1.2), std({ color: '#bcd8e8', metalness: 0.4, roughness: 0.05, transparent: true, opacity: 0.55 }), 0.6, 1.6, 0, B); add(box(0.06, 0.08, 1.25), CH, 0.6, 1.86, 0, B);
  if (!open) { add(box(1.25, 0.08, 1.5), BK, -0.55, 2.35, 0, B); for (const e of [-1, 1]) for (const fx of [-1.15, 0.05]) add(box(0.06, 1.0, 0.06), BK, fx, 1.85, e * 0.72, B); }
  add(box(0.4, 0.55, 0.9), BK, -1.55, 1.05, 0, B); // trunk
  const steer = add(new THREE.TorusGeometry(0.17, 0.025, 6, 16), BK, 0.35, 1.5, 0.3, B); steer.rotation.y = Math.PI / 2; steer.rotation.z = 0.5;
  for (const fx of [1.35, -0.95]) for (const e of [-1, 1]) { const Wg = new THREE.Group(); Wg.position.set(fx, 0.45, e * 0.72); G.add(Wg); W.push(Wg); const t = add(new THREE.TorusGeometry(0.36, 0.1, 10, 24), TIRE, 0, 0, 0, Wg); const ww = add(new THREE.TorusGeometry(0.3, 0.035, 6, 24), WW, 0, 0, e * 0.06, Wg, false);
    for (let k = 0; k < 10; k++) { const sp = add(box(0.03, 0.56, 0.03), WW, 0, 0, e * 0.02, Wg, false); sp.rotation.z = k / 10 * Math.PI; } add(cyl(0.08, 0.08, 0.16, 12), CH, 0, 0, 0, Wg, false).rotation.x = Math.PI / 2; }
  // spare wheel on the back
  { const sw = add(new THREE.TorusGeometry(0.33, 0.09, 10, 24), TIRE, -1.85, 1.05, 0, B); sw.rotation.y = Math.PI / 2; }
  G.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); G.userData = { W, B }; G.visible = false; CARS[name] = G; return G; };
mkCar('cream', '#f2e6c4', true); mkCar('green', '#2a7a4a'); mkCar('blue', '#2a4a9a'); mkCar('red', '#c8222a', true); mkCar('green2', '#2a7a4a'); mkCar('blue2', '#2a4a9a', true);
// low-detail queue cars for the final mile-long line
const QN = 90; const QCAR = new THREE.InstancedMesh(new THREE.BoxGeometry(3.4, 1.2, 1.6), std({ color: '#ffffff', roughness: 0.3, metalness: 0.15, envMapIntensity: 1.2 }), QN), QTOP = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.9, 1.4), std({ color: '#ffffff', roughness: 0.3 }), QN);
QCAR.castShadow = QTOP.castShadow = true; scene.add(QCAR); scene.add(QTOP); QCAR.frustumCulled = QTOP.frustumCulled = false;
{ const m4 = new THREE.Matrix4(), c = new THREE.Color(); const cols = ['#c8222a', '#2a7a4a', '#2a4a9a', '#f2e6c4', '#e8a01a', '#6a2a6a', '#1a1a1e', '#3a9ab0']; for (let i = 0; i < QN; i++) { const x = 28 + i * 5.2; m4.makeTranslation(x, 0.9, -1.6); QCAR.setMatrixAt(i, m4); m4.makeTranslation(x - 0.3, 1.9, -1.6); QTOP.setMatrixAt(i, m4); c.set(cols[(i * 5) % cols.length]); QCAR.setColorAt(i, c); QTOP.setColorAt(i, c.multiplyScalar(0.6)); } }

// --- ribbon for the opening (rival bridge) + tumbleweed + thermometer post + welding sparks ---
const RIBBON = new THREE.Group(); scene.add(RIBBON); { const RB = std({ color: '#d8222a', roughness: 0.4 }); for (const e of [-1, 1]) { add(cyl(0.06, 0.06, 1.3, 8), std({ color: '#f4f0e8' }), 0, 0.65, e * 2.6, RIBBON); add(new THREE.SphereGeometry(0.1, 10, 8), std({ color: '#e8c25a', metalness: 1, roughness: 0.2 }), 0, 1.33, e * 2.6, RIBBON); }
  const half = (e) => { const m = add(box(0.02, 0.12, 2.6), RB, 0, 1.1, e * 1.3, RIBBON, false); m.userData.e = e; return m; }; RIBBON.userData.h = [half(-1), half(1)]; const bow = add(new THREE.TorusGeometry(0.16, 0.05, 8, 16), RB, 0, 1.1, 0, RIBBON, false); bow.rotation.y = Math.PI / 2; RIBBON.userData.bow = bow; }
const TUMBLE = new THREE.Group(); scene.add(TUMBLE); { const tm = std({ color: '#b8925a', roughness: 0.9 }); for (let i = 0; i < 26; i++) { const r = R(1200 + i); const t = add(new THREE.TorusGeometry(0.35 + r() * 0.15, 0.025, 4, 14), tm, 0, 0, 0, TUMBLE, true); t.rotation.set(r() * 6, r() * 6, r() * 6); } }
const THERMO = new THREE.Group(); scene.add(THERMO); { const tt = (() => { const [c, g] = cv(256, 1024); g.fillStyle = '#2a4a8a'; g.beginPath(); g.roundRect(0, 0, 256, 1024, 30); g.fill(); g.fillStyle = '#f4f0e6'; g.beginPath(); g.roundRect(30, 90, 196, 900, 20); g.fill(); g.fillStyle = '#fff'; g.font = '900 60px Arial'; g.textAlign = 'center'; g.fillText('°F', 128, 64);
    g.fillStyle = '#2a2a30'; g.font = '700 30px Arial'; for (let k = 0; k <= 6; k++) { const y = 900 - k * 120; g.fillRect(140, y, 40, 5); g.fillText(String(k * 20), 90, y + 12); } g.fillStyle = '#d8d0c4'; g.beginPath(); g.roundRect(175, 150, 26, 780, 13); g.fill(); return P.tex(c); })();
  add(box(0.8, 3.2, 0.12), new THREE.MeshStandardMaterial({ map: tt, roughness: 0.5 }), 0, 2.2, 0, THERMO); add(box(0.12, 1.4, 0.12), std({ color: '#5a5a62', metalness: 0.6 }), 0, 0.7, -0.1, THERMO);
  const bulb = add(new THREE.SphereGeometry(0.11, 12, 8), std({ color: '#e02a2a', roughness: 0.3, emissive: '#600', emissiveIntensity: 0.5 }), 0.18, 0.95, 0.08, THERMO); const col = add(box(0.07, 1, 0.03), std({ color: '#e02a2a', roughness: 0.3, emissive: '#600', emissiveIntensity: 0.5 }), 0.18, 1.5, 0.08, THERMO); THERMO.userData.col = col; }
const SPARKS = []; for (let i = 0; i < 40; i++) { const m = add(box(0.02, 0.02, 0.25), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3, 1.2) }), 0, -50, 0, scene, false); m.userData.ndSkip = true; SPARKS.push(m); }
const SUN = add(new THREE.CircleGeometry(30, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.8, 2.0), fog: false }), -500, 520, -900, scene, false); SUN.lookAt(0, 0, 0); SUN.userData.ndSkip = true;
const dustTex = (() => { const [c, g] = cv(128, 128); for (let i = 0; i < 9; i++) { const x = 34 + (i * 37) % 60, y = 34 + (i * 53) % 60, gr = g.createRadialGradient(x, y, 0, x, y, 34); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const DUST = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: dustTex, transparent: true, depthWrite: false, color: '#e8d0a8' })); m.userData.ndSkip = true; m.renderOrder = 3; m.visible = false; scene.add(m); DUST.push(m); }
ZONE = 'fx';
const PRESET = {
  day: { sky: 'day', cardTint: '#f6f0e8', vig: 0.3, hemi: ['#d8e8ff', '#c89a5a', 1.15], key: ['#fff2dc', 3.0], fog: ['#e4eefa', 0.0009], sun: [-0.55, 0.85, 0.5], expo: 1.0, sat: 1.12, env: ENV.day, bloomK: 0.3, thr: 1.3 },
  hot: { sky: 'hot', cardTint: '#fff0e0', vig: 0.35, hemi: ['#ffe8c8', '#d8904a', 1.2], key: ['#ffe2b0', 3.4], fog: ['#fff0d8', 0.0014], sun: [-0.4, 0.92, 0.35], expo: 1.04, sat: 1.15, env: ENV.hot, bloomK: 0.45, thr: 1.15, haze: 1 },
  gold: { sky: 'gold', cardTint: '#fff0e0', vig: 0.32, hemi: ['#ffe8d0', '#c89a5a', 1.1], key: ['#ffd8a8', 3.0], fog: ['#ffe8cc', 0.001], sun: [-0.7, 0.55, 0.5], expo: 1.02, sat: 1.15, env: ENV.gold, bloomK: 0.35, thr: 1.2 },
};
const TAPE = (() => { const [c, g] = cv(512, 32); g.fillStyle = '#ffd21a'; g.fillRect(0, 0, 512, 32); g.fillStyle = '#1a1414'; for (let x = 0; x < 512; x += 16) g.fillRect(x, 0, 2, x % 64 ? 10 : 18); const m = add(box(1.3, 0.012, 0.07), new THREE.MeshStandardMaterial({ map: P.tex(c), roughness: 0.4 }), 0, 0.075, 0.3, scene, false); m.visible = false; return m; })();
import { stateAt, TOTAL } from './shots.js';
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const BUMP_W = 9; const bumpY = (x, b) => (Math.abs(x) < BUMP_W ? b * Math.pow(Math.cos(Math.PI * x / (2 * BUMP_W)), 2) : 0);
const bumpS = (x, b) => (Math.abs(x) < BUMP_W ? -b * Math.PI / BUMP_W * Math.sin(Math.PI * x / BUMP_W) / 2 : 0);
window.renderFrame = (f) => {
  const S = stateAt(f, {}), t = f / 30; const L = PRESET[S.preset || 'day'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2]; moon.color.set(L.key[0]); moon.intensity = S.key ?? L.key[1];
  scene.fog.color.set(L.fog[0]); scene.fog.density = S.fog ?? L.fog[1]; scene.environment = L.env;
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(0, 0, 0); inkU.flash.value = S.flash || 0; inkU.vig.value = L.vig ?? 0.35; inkU.bloomK.value = S.bloomK ?? L.bloomK; brightU.thr.value = S.thr ?? L.thr; inkU.split.value = 0; inkU.greenK.value = 0; inkU.raysK.value = 0; inkU.worldInk.value = 0.6;
  SKY.material.map = SKYT[L.sky]; CLOUDS.forEach((c) => c.material.color.set(L.sky === 'hot' ? '#fff4e4' : '#ffffff'));
  // ---- kid's bridge: gap + combs ----
  const gap = S.gap ?? 0.34; HALF.forEach((G) => (G.position.x = G.userData.s * gap / 2));
  const ck = S.comb; COMB.forEach((G, i) => { const s = i ? 1 : -1; G.visible = ck !== undefined && ck > 0; G.position.set(s * gap / 2, (1 - (ck || 0)) * 2.5, 0); });
  // ---- rival bridge: bulge ----
  const B = (S.bulge || 0) * 1.7; RSL.forEach((G) => { const x = G.userData.x; G.position.y = bumpY(x, B); G.rotation.z = Math.atan(bumpS(x, B)); });
  RIV.forEach((m, i) => { const k = S.rivets; if (k === undefined || k < (i % 10) * 0.08) { m.position.set(0, -60, 0); return; } const tt = k - (i % 10) * 0.08, x = -8 + (i * 0.43 % 16), y0 = bumpY(x, B) - 0.4 - (i % 3) * 0.35;
    m.position.set(x + (rnd(i, 1) - 0.5) * tt * 3, y0 + tt * 3.5 - tt * tt * 6, ZR + DW / 2 + 0.3 + tt * (2 + rnd(i, 2) * 3)); });
  // ---- cars ----
  Object.values(CARS).forEach((c) => (c.visible = false));
  for (const cs of S.cars || []) { const C0 = CARS[cs.name]; if (!C0) continue; C0.visible = true; const onR = Math.abs(cs.z - ZR) < 5 && !cs.free; const y = (cs.y || 0) + (onR ? bumpY(cs.x, B) : 0);
    C0.position.set(cs.x, y, cs.z); C0.rotation.set(cs.roll || 0, cs.ry || 0, (cs.pitch || 0) + (onR && !cs.free ? Math.atan(bumpS(cs.x, B)) * Math.cos(cs.ry || 0) : 0)); C0.userData.W.forEach((w) => (w.rotation.z = -(cs.spin ?? cs.x) / 0.46)); C0.userData.B.position.y = cs.bounce || 0; C0.userData.B.rotation.z = cs.bodyPitch || 0; }
  QCAR.visible = QTOP.visible = !!S.queue; TAPE.visible = !!S.tape;
  RIBBON.visible = !!S.ribbon; if (S.ribbon) { RIBBON.position.set(S.ribbon.x, 0, S.ribbon.z); const k = S.ribbon.cut || 0; RIBBON.userData.h.forEach((h) => { const e = h.userData.e; h.position.set(0, 1.1 - k * 0.6, e * (1.3 + k * 0.2)); h.rotation.x = e * k * 1.1; h.scale.z = 1 - k * 0.3; }); RIBBON.userData.bow.visible = k < 0.1; }
  TUMBLE.visible = !!S.tumble; if (S.tumble) { TUMBLE.position.set(...S.tumble.slice(0, 3)); TUMBLE.rotation.set(0, 0, -S.tumble[3]); }
  THERMO.visible = !!S.thermo; if (S.thermo) { THERMO.position.set(S.thermo.x, 0, S.thermo.z); THERMO.rotation.y = S.thermo.ry || 0; const h = 0.15 + S.thermo.k * 2.2; THERMO.userData.col.scale.y = h; THERMO.userData.col.position.y = 0.95 + h / 2; }
  SPARKS.forEach((m, i) => { if (!S.sparks) { m.position.y = -60; return; } const k = (t * 2.2 + rnd(i, 1)) % 1, d = new THREE.Vector3(rnd(i, 2) - 0.5, rnd(i, 3) * 0.8 + 0.2, rnd(i, 4) - 0.5).normalize(); m.position.set(S.sparks[0] + d.x * k * 1.6, S.sparks[1] + d.y * k * 1.4 - k * k * 1.2, S.sparks[2] + d.z * k * 1.6); m.lookAt(m.position.clone().add(d)); m.visible = true; m.scale.setScalar(1 - k); });
  // ---- camera ----
  const sh = S.shake || 0, hh = S.handheld ?? 0.006; let look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); if (S.topdown) camera.up.set(0, 0, -1); camera.lookAt(look.x, look.y, look.z); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.far = 3000; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); SKY.position.copy(camera.position);
  const fc = S.shadowAt ? S.shadowAt : [look.x, Math.max(-DEPTH, look.y - 1), look.z], sd = new THREE.Vector3(...(S.sun || L.sun)).normalize(); moon.position.set(fc[0] + sd.x * 120, fc[1] + sd.y * 120, fc[2] + sd.z * 120); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 18; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 300; sc.updateProjectionMatrix(); }
  DUST.forEach((m, i) => { m.visible = false; if (!S.dust) return; const [dx, dy, dz, k0] = S.dust; const k = (k0 + rnd(i, 1) * 0.3); if (k > 1.2) return; const a = rnd(i, 2) * 6.28; m.visible = true; m.position.set(dx + Math.cos(a) * k * 2.2, dy + 0.2 + k * 0.9 * rnd(i, 3), dz + Math.sin(a) * k * 2.2); m.scale.setScalar(0.6 + k * 1.6); m.quaternion.copy(camera.quaternion); m.material.opacity = Math.max(0, 1 - k) * 0.7; });
  for (const g of glows) { g.quaternion.copy(camera.quaternion); g.material.opacity = g.userData.k0 * Math.exp(-g.position.distanceTo(camera.position) * 0.012); }
  if (bang.userData.g) bang.userData.g.quaternion.copy(camera.quaternion); bang.visible = false; bangLight.intensity = 0;
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); const upv = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw, !a.fx); c.mesh.visible = true; let px = a.x, py = a.y, pz = a.z;
    if (a.hud) { const d = a.hud.d || 1.2; const o = camera.position.clone().addScaledVector(fwd, d).addScaledVector(upv, a.hud.up || 0); if (a.hud.right) o.addScaledVector(new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), a.hud.right); px = o.x; py = o.y; pz = o.z; }
    c.mesh.position.set(px, py, pz); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s * (a.scaleY || 1), s);
    if (a.hud || a.face || S.topdown) c.mesh.quaternion.copy(camera.quaternion); else c.mesh.rotation.set(0, a.yaw ?? Math.atan2(camera.position.x - px, camera.position.z - pz), a.roll || 0);
    if (a.rot) c.mesh.rotateZ(a.rot);
    c.mat.color.set(a.tint || (a.fx ? '#ffffff' : L.cardTint) || '#ffffff'); c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2; c.mat.depthTest = !a.hud && !a.over; c.mesh.castShadow = !a.fx;
    c.blob.visible = !a.fx && a.blob !== false && !S.topdown; c.blob.position.set(px, (a.ground ?? py) + 0.015, pz); c.blob.scale.set(1.0 * s, 0.55 * s, 1); });
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.autoUpdate = false; swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false); scene.fog = fog; renderer.shadowMap.autoUpdate = true;
  renderer.setRenderTarget(rtB1); renderer.render(brightScene, fsCam);
  for (let k = 0; k < 3; k++) { const r = 1 + k * 1.2; blurU.src.value = rtB1.texture; blurU.dir.value.set(r / (W / 2), 0); renderer.setRenderTarget(rtB2); renderer.render(blurScene, fsCam); blurU.src.value = rtB2.texture; blurU.dir.value.set(0, r / (H / 2)); renderer.setRenderTarget(rtB1); renderer.render(blurScene, fsCam); }
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = 5; dofU.cinf.value = 0; dofU.haze.value = S.haze ?? (L.haze ? 0.5 : 0); dofU.time.value = t; renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL; window.ready = true;
