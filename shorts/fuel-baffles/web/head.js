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
  draw(fn, ol = false) { const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0); fn(new T.Pen(g)); if (ol) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; const gr = g.createLinearGradient(CW * 0.25, 0, CW * 0.75, 0); gr.addColorStop(0, 'rgba(255,255,255,0.12)'); gr.addColorStop(0.42, 'rgba(0,0,0,0)'); gr.addColorStop(0.58, 'rgba(20,30,60,0.2)'); gr.addColorStop(1, 'rgba(20,30,60,0.48)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH); g.restore(); }
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
const dofU = { mb: { value: new THREE.Vector2() }, haze: { value: 0 }, time: { value: 0 }, src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: fsv.replace(/vUv/g, 'vUv0'),
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, haze, time; uniform vec2 mb; varying vec2 vUv0;
  vec2 vUv; float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf, cinf*1.4); }
  vec3 sharp(vec2 uv, vec3 c){ vec2 px = 1. / res; vec3 n = texture2D(src, uv + vec2(px.x, 0.)).rgb + texture2D(src, uv - vec2(px.x, 0.)).rgb + texture2D(src, uv + vec2(0., px.y)).rgb + texture2D(src, uv - vec2(0., px.y)).rgb; return clamp(c + (c - n * .25) * .8, 0., 1.); }
  void main(){ if (dot(mb, mb) > 0.) { vec3 ac = vec3(0.); for (int i = 0; i < 14; i++) { float k = float(i) / 13. - .5; ac += texture2D(src, clamp(vUv0 + mb * k, 0., 1.)).rgb; } gl_FragColor = linearToOutputTexel(vec4(ac / 14., 1.)); return; } vUv = vUv0 + vec2(sin(vUv0.y * 140. + time * 7.) * 0.0022 + sin(vUv0.y * 61. - time * 4.) * 0.0014, 0.) * haze * smoothstep(0.75, 0.2, vUv0.y); float c0 = coc(vUv); if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(sharp(vUv, texture2D(src, vUv).rgb), 1.)); return; }
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
