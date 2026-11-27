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


const NAMES = ['street_lamp_01'];
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
    return e * (1. - smoothstep(25., 90., d)); }
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
// ================= AIRPORT WORLD =================
// runway runs along +x and ends at x = 0; EMAS bed x 0..30; cliff edge at x = EDGE
ZONE = 'air';
const EDGE = 33.5, BEDL = 30.0, BEDW = 22;
const skyEnv = (top, hor, gnd) => { const [c, g] = cv(512, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.5, hor); gr.addColorStop(0.52, gnd); gr.addColorStop(1, gnd); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return pmrem.fromEquirectangular(t).texture; };
const ENV = { day: skyEnv('#3a6ad8', '#cfe6ff', '#5a7a3a'), night: skyEnv('#0a1440', '#3a5aa8', '#141a2a'), rain: skyEnv('#4a5870', '#a8b8cc', '#3a4a3a'), morn: skyEnv('#4a7ae0', '#ffe8c8', '#5a7a3a') };

// --- painted textures ---
const tileTex = (s = 512, base = 82, seam = 'rgba(40,44,52,.55)', n = 4) => { const [c, g] = cv(s, s), r = R(s + base); g.fillStyle = `hsl(215,8%,${base}%)`; g.fillRect(0, 0, s, s); const q = s / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const L = base - 4 + r() * 7; const gr = g.createLinearGradient(x * q, y * q, x * q + q, y * q + q); gr.addColorStop(0, `hsl(210,9%,${L + 3}%)`); gr.addColorStop(1, `hsl(220,8%,${L - 4}%)`); g.fillStyle = gr; g.fillRect(x * q + 2, y * q + 2, q - 4, q - 4);
    for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.03 + r() * 0.05})`; g.beginPath(); g.ellipse(x * q + r() * q, y * q + r() * q, 1 + r() * 4, 1 + r() * 3, 0, 0, 7); g.fill(); }
    if (r() < 0.25) { g.strokeStyle = 'rgba(40,44,52,.35)'; g.lineWidth = 1.5; g.beginPath(); let cx0 = x * q + r() * q, cy0 = y * q + 4; g.moveTo(cx0, cy0); for (let k = 0; k < 4; k++) { cx0 += (r() - 0.5) * 30; cy0 += q / 5; g.lineTo(cx0, cy0); } g.stroke(); } }
  g.strokeStyle = seam; g.lineWidth = 4; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * q, 0); g.lineTo(i * q, s); g.stroke(); g.beginPath(); g.moveTo(0, i * q); g.lineTo(s, i * q); g.stroke(); }
  const t = P.tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
const asphaltTex = (() => { const [c, g] = cv(512, 512), r = R(41); g.fillStyle = '#4a4e58'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 9000; i++) { const l = 22 + r() * 26; g.fillStyle = `hsl(220,6%,${l}%)`; g.fillRect(r() * 512, r() * 512, 1 + r() * 2.5, 1 + r() * 2.5); }
  for (let i = 0; i < 20; i++) { const x = r() * 512, y = r() * 512, rr = 30 + r() * 90, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(${r() < 0.5 ? '20,22,28' : '120,124,134'},.18)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); }
  const t = P.tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; })();
const grassTex = (() => { const [c, g] = cv(512, 512), r = R(52); g.fillStyle = '#4ea832'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 26; i++) { const x = r() * 512, y = r() * 512, rr = 40 + r() * 110, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, r() < 0.5 ? 'rgba(120,200,60,.35)' : 'rgba(30,110,40,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); }
  for (let i = 0; i < 5000; i++) { g.strokeStyle = `hsl(${88 + r() * 30},${55 + r() * 20}%,${30 + r() * 25}%)`; g.lineWidth = 1.6; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 5, y - 5 - r() * 8); g.stroke(); }
  const t = P.tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; })();
const blockTex = (() => { const [c, g] = cv(256, 256), r = R(63); g.fillStyle = '#c4c8cc'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '70,74,80' : '250,250,250'},${0.08 + r() * 0.16})`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 0.8 + r() * 2.4, 0.8 + r() * 1.8, 0, 0, 7); g.fill(); }
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(0.15, 'rgba(255,255,255,0)'); gr.addColorStop(0.85, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.22)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(40,44,50,.75)'; g.lineWidth = 6; g.strokeRect(3, 3, 250, 250); return P.tex(c); })();
const cliffTex = (() => { const [c, g] = cv(512, 1024), r = R(71); const bands = ['#7a8a3a', '#8a7a4a', '#a8946a', '#8a7452', '#b8a27a', '#7a6646', '#a08a62', '#6a5a40', '#9a8660', '#7a6a4c']; let y = 60;
  g.fillStyle = '#5a9a30'; g.fillRect(0, 0, 512, 70); for (let k = 0; y < 1024; k++) { const h = 50 + r() * 90; g.fillStyle = bands[k % bands.length]; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.03 + k) * 6); g.lineTo(512, y + h); g.lineTo(0, y + h); g.fill();
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '40,30,20' : '255,240,210'},${0.06 + r() * 0.1})`; g.fillRect(r() * 512, y + r() * h, 2 + r() * 10, 1 + r() * 2); } g.strokeStyle = 'rgba(40,30,20,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.03 + k) * 6); g.stroke(); y += h; }
  for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(30,22,14,.25)'; g.lineWidth = 2 + r() * 3; const x = r() * 512; g.beginPath(); g.moveTo(x, 80 + r() * 200); g.lineTo(x + (r() - 0.5) * 20, 400 + r() * 600); g.stroke(); }
  g.fillStyle = '#4e9a2c'; for (let x = 0; x < 512; x += 10) { g.beginPath(); g.moveTo(x, 66); g.lineTo(x + 5, 80 + r() * 26); g.lineTo(x + 10, 66); g.fill(); }
  const t = P.tex(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; return t; })();
const cloudTex = (seed) => { const [c, g] = cv(512, 256), r = R(seed); for (let i = 0; i < 14; i++) { const x = 90 + r() * 330, y = 120 + (r() - 0.3) * 60, rr = 40 + r() * 60; const gr = g.createRadialGradient(x, y - rr * 0.3, rr * 0.1, x, y, rr); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.75, '#f4f8ff'); gr.addColorStop(1, 'rgba(220,232,250,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
  g.globalCompositeOperation = 'source-atop'; const sh = g.createLinearGradient(0, 100, 0, 230); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(120,140,180,.45)'); g.fillStyle = sh; g.fillRect(0, 0, 512, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const skyTex = (stops) => { const [c, g] = cv(16, 512); const gr = g.createLinearGradient(0, 0, 0, 512); stops.forEach(([k, col]) => gr.addColorStop(k, col)); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const SKYT = { day: skyTex([[0, '#1e48c8'], [0.32, '#3a78e8'], [0.48, '#9cc8ff'], [0.5, '#d8ecff'], [1, '#d8ecff']]), night: skyTex([[0, '#060c30'], [0.35, '#12205a'], [0.48, '#2a4290'], [0.5, '#3a56a8'], [1, '#3a56a8']]),
  rain: skyTex([[0, '#3a4660'], [0.35, '#5a6a84'], [0.48, '#8a9ab0'], [0.5, '#a8b6c8'], [1, '#a8b6c8']]), morn: skyTex([[0, '#2a58d0'], [0.32, '#5a90ea'], [0.47, '#ffd8a8'], [0.5, '#ffe8c8'], [1, '#ffe8c8']]) };
const SKY = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), new THREE.MeshBasicMaterial({ map: SKYT.day, side: THREE.BackSide, fog: false, depthWrite: false })); SKY.userData.ndSkip = true; SKY.renderOrder = -1; scene.add(SKY);
const CLOUDS = []; for (let i = 0; i < 26; i++) { const r = R(400 + i); const a = r() * 6.283, d = 300 + r() * 450; const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), new THREE.MeshBasicMaterial({ map: cloudTex(410 + i), transparent: true, depthWrite: false, fog: false }));
  m.position.set(Math.cos(a) * d, 45 + r() * 110, Math.sin(a) * d); m.scale.setScalar(160 + r() * 160); m.lookAt(0, m.position.y, 0); m.userData.ndSkip = true; m.renderOrder = 0; scene.add(m); CLOUDS.push(m); }
const STARS = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 1200 }, (_, i) => { const a = rnd0(i, 1) * 6.283, e = 0.15 + rnd0(i, 2) * 1.3, d = 1300; return [Math.cos(a) * Math.cos(e) * d, Math.sin(e) * d, Math.sin(a) * Math.cos(e) * d]; }).flat(), 3)), new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false }));
STARS.userData.ndSkip = true; scene.add(STARS);
function rnd0(i, k) { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }

// --- ground: grass everywhere, runway asphalt, concrete apron + safety area tiles ---
const GRASS = new THREE.MeshStandardMaterial({ map: (() => { const t = grassTex.clone(); t.repeat.set(60, 60); t.needsUpdate = true; return t; })(), roughness: 0.9 });
{ const gp = plane(800, 800, GRASS, EDGE - 400, 0, 0, -Math.PI / 2); gp.receiveShadow = true; }
const ASPH = new THREE.MeshStandardMaterial({ map: (() => { const t = asphaltTex.clone(); t.repeat.set(60, 4); t.needsUpdate = true; return t; })(), roughness: 0.78, envMapIntensity: 0.6 });
const RWY = plane(600, 30, ASPH, -300, 0.02, 0, -Math.PI / 2); RWY.receiveShadow = true;
const APRON = new THREE.MeshStandardMaterial({ map: (() => { const t = tileTex(512, 80); t.repeat.set(8, 6); return t; })(), roughness: 0.7, envMapIntensity: 0.6 });
{ const a = plane(EDGE + 40, 36, APRON, (EDGE - 40) / 2, 0.025, 31, -Math.PI / 2); a.receiveShadow = true; }  // apron beside the runway end (truck, worker, director)
const SAFE = new THREE.MeshStandardMaterial({ map: (() => { const t = tileTex(512, 76, 'rgba(40,44,52,.6)', 4); t.repeat.set(BEDL / 4.8, 13 / 4.8); return t; })(), roughness: 0.7, envMapIntensity: 0.6 });
{ const a = plane(EDGE, 30, SAFE, EDGE / 2, 0.022, 0, -Math.PI / 2); a.receiveShadow = true; }
// markings
const WHITE = std({ color: '#f4f6f8', roughness: 0.6 }), YEL = std({ color: '#f2c41a', roughness: 0.55 });
for (let x = -590; x < -6; x += 18) plane(9, 0.45, WHITE, x, 0.03, 0, -Math.PI / 2);
for (const s of [-1, 1]) plane(600, 0.35, WHITE, -300, 0.03, s * 14.2, -Math.PI / 2);
for (let k = 0; k < 8; k++) for (const s of [-1, 1]) plane(1.0, 9, WHITE, -1.5 - k * 0, 0.031, s * (2.2 + k * 1.6), -Math.PI / 2).scale.set(1, 0.6, 1);
plane(0.5, 30, WHITE, -0.4, 0.03, 0, -Math.PI / 2);
// yellow chevrons on the safety area (like real overrun areas)
for (let k = 0; k < 4; k++) for (const s of [-1, 1]) { const m = plane(9, 0.5, YEL, 3 + k * 7 - 0, 0.026, s * 2.8, -Math.PI / 2); m.rotation.z = s * 0.55; m.position.z = s * 3.2; }
// runway edge lights (glow at night / rain)
const RLIGHTS = []; { const lm = std({ color: '#2a2a30', metalness: 0.6, roughness: 0.4 }); for (let x = -300; x <= 0; x += 12) for (const s of [-1, 1]) { add(cyl(0.08, 0.1, 0.35, 8), lm, x, 0.17, s * 15, scene, false); const gl = glow(x, 0.4, s * 15, 1.2, x > -2 ? '255,80,60' : '255,236,190', 1); gl.userData.rl = true; RLIGHTS.push(gl); } }
// grass tufts (instanced clumps), denser near the runway end
const TUFT = (() => { const n = 5200; const geo = new THREE.ConeGeometry(0.16, 0.42, 5); geo.translate(0, 0.21, 0); const im = new THREE.InstancedMesh(geo, std({ color: '#ffffff', roughness: 0.8 }), n); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(); const r = R(91); let i = 0;
  while (i < n) { const x = -140 + r() * (EDGE + 138), z = (r() < 0.5 ? -1 : 1) * (15.5 + Math.pow(r(), 1.6) * 60); if (z > 12 && z < 49.5 && x > -40 && x < EDGE - 0.5) continue; if (x > EDGE - 0.6) continue;
    for (let k = 0; k < 3 && i < n; k++, i++) { e.set((r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5); q.setFromEuler(e); const s = 0.7 + r() * 0.9; m4.compose(new THREE.Vector3(x + (r() - 0.5) * 0.4, 0, z + (r() - 0.5) * 0.4), q, new THREE.Vector3(s, s * (0.8 + r() * 0.6), s)); im.setMatrixAt(i, m4); im.setColorAt(i, c.setHSL(0.24 + r() * 0.08, 0.6, 0.28 + r() * 0.18)); } }
  im.castShadow = true; im.receiveShadow = true; scene.add(im); return im; })();
// flowers specks
{ const n = 900, im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 4), std({ color: '#ffffff', roughness: 0.6 }), n), m4 = new THREE.Matrix4(), c = new THREE.Color(), r = R(93); let i = 0; while (i < n) { const x = -120 + r() * (EDGE + 118), z = (r() < 0.5 ? -1 : 1) * (16 + r() * 50); if ((z > 12 && z < 49.5 && x > -40) || x > EDGE - 1) continue; m4.makeTranslation(x, 0.12 + r() * 0.2, z); im.setMatrixAt(i, m4); im.setColorAt(i, c.set(['#ff5a5a', '#ffd84a', '#ffffff', '#c86aff'][i % 4])); i++; } scene.add(im); }

// --- cliff + valley below ---
{ const cm = new THREE.MeshStandardMaterial({ map: (() => { const t = cliffTex.clone(); t.repeat.set(1, 1); t.needsUpdate = true; return t; })(), roughness: 0.95 });
  const seg = 260, vs = 26, pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) { const zz = -260 + i / seg * 520; const bx = EDGE + Math.sin(zz * 0.035) * 2.2 + Math.pow(Math.abs(zz) / 110, 2) * 18;
    for (let j = 0; j <= vs; j++) { const y = 0.02 - j / vs * 70, n = j === 0 ? 0 : (Math.sin(zz * 0.9 + j * 1.7) * 0.5 + Math.sin(zz * 0.37 - j * 0.9) * 0.8 + Math.sin(j * 2.3 + zz * 0.13) * 0.6) * Math.min(1, j / 3); pos.push(bx + j / vs * 4 + n, y, zz); uv.push(i / seg * 10, 1 - j / vs); } }
  for (let i = 0; i < seg; i++) for (let j = 0; j < vs; j++) { const a = i * (vs + 1) + j, b = a + 1, c = a + vs + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const cliff = new THREE.Mesh(g, cm); cliff.material.side = THREE.DoubleSide; cliff.receiveShadow = true; cliff.castShadow = true; scene.add(cliff);
  // grass lip along the edge
  const lip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 520), std({ color: '#4e9a2c', roughness: 0.85 })); lip.position.set(EDGE - 0.1, 0.0, 0); scene.add(lip); lip.visible = false;
  const vg = new THREE.MeshStandardMaterial({ map: (() => { const t = grassTex.clone(); t.repeat.set(80, 80); t.needsUpdate = true; return t; })(), color: '#7ab86a', roughness: 1 }); plane(1600, 1600, vg, EDGE + 800, -70, 0, -Math.PI / 2);
  // river in the valley
  { const rv = plane(30, 1600, std({ color: '#3a8ad8', roughness: 0.1, metalness: 0.2, envMapIntensity: 1.5 }), EDGE + 240, -69.8, 0, -Math.PI / 2); rv.rotation.z = 0.25; }
  // forest below: instanced round trees
  const n = 2600, trunkG = new THREE.CylinderGeometry(0.4, 0.6, 4, 6); trunkG.translate(0, 2, 0); const topG = new THREE.IcosahedronGeometry(3.2, 1); topG.translate(0, 6, 0);
  const tops = new THREE.InstancedMesh(topG, std({ color: '#ffffff', roughness: 0.85 }), n), trunks = new THREE.InstancedMesh(trunkG, std({ color: '#5a3a22' }), n); const m4 = new THREE.Matrix4(), c = new THREE.Color(), r = R(97);
  for (let i = 0; i < n; i++) { let x, z; do { x = EDGE + 10 + Math.pow(r(), 0.8) * 700; z = (r() - 0.5) * 1200; } while (Math.abs(z - (x - EDGE - 240) * -0.25 * 0 ) < 0 ); const s = 0.8 + r() * 0.9; m4.compose(new THREE.Vector3(x, -70, z), new THREE.Quaternion(), new THREE.Vector3(s, s * (0.9 + r() * 0.5), s)); tops.setMatrixAt(i, m4); trunks.setMatrixAt(i, m4); tops.setColorAt(i, c.setHSL(0.27 + r() * 0.07, 0.55, 0.22 + r() * 0.14)); }
  tops.receiveShadow = true; tops.userData.ndSkip = true; trunks.userData.ndSkip = true; scene.add(tops); scene.add(trunks);
  // distant hills / mountains
  for (let i = 0; i < 16; i++) { const r2 = R(500 + i), a = -1.4 + i / 15 * 2.8 + (r2() - 0.5) * 0.1, d = 650 + r2() * 250; const h = add(new THREE.SphereGeometry(1, 20, 12), new THREE.MeshBasicMaterial({ color: `hsl(${195 + r2() * 20},${22 + r2() * 10}%,${62 + r2() * 10}%)`, fog: false }), Math.cos(a) * d + 100, -70, Math.sin(a) * d, scene, false); h.scale.set(140 + r2() * 120, 80 + r2() * 60, 140 + r2() * 100); h.userData.ndSkip = true; }
  for (let i = 0; i < 10; i++) { const r2 = R(530 + i), a = 1.8 + i / 9 * 2.6, d = 500 + r2() * 200; const h = add(new THREE.SphereGeometry(1, 20, 12), std({ color: `hsl(${105 + r2() * 30},${35}%,${36 + r2() * 12}%)`, roughness: 1 }), Math.cos(a) * d - 100, -10, Math.sin(a) * d, scene, false); h.scale.set(90 + r2() * 90, 40 + r2() * 60, 90 + r2() * 90); } }

// --- terminal + control tower + hangar far down the runway (left side) ---
{ const GL = std({ color: '#5aa0d8', metalness: 0.6, roughness: 0.08, envMapIntensity: 1.6 }), WH = std({ color: '#eef0f4', roughness: 0.45 }), GR = std({ color: '#a8b0bc', roughness: 0.5 });
  const T0 = [-150, 0, 70]; add(box(90, 12, 22), WH, T0[0], 6, T0[2]); add(box(88, 8, 0.3), GL, T0[0], 6.5, T0[2] - 11.1, scene, false); for (let x = -44; x <= 44; x += 4) add(box(0.4, 9, 0.5), GR, T0[0] + x, 6.4, T0[2] - 11.2, scene, false);
  const roof = add(new THREE.CylinderGeometry(14, 14, 92, 24, 1, false, 0, Math.PI), std({ color: '#c8d0dc', metalness: 0.5, roughness: 0.3 }), T0[0], 12, T0[2], scene, false); roof.rotation.set(0, 0, Math.PI / 2); roof.scale.set(1, 1, 0.35);
  const TW = [-95, 0, 52]; add(cyl(2.6, 3.2, 34, 16), WH, TW[0], 17, TW[2]); add(cyl(5.2, 4.0, 2.6, 16), WH, TW[0], 35, TW[2]); add(cyl(5.4, 5.0, 3.4, 16), GL, TW[0], 38.2, TW[2]); add(cyl(5.8, 5.8, 0.6, 16), GR, TW[0], 40.2, TW[2]); add(cyl(0.15, 0.15, 5, 6), GR, TW[0], 43, TW[2]); glow(TW[0], 45.6, TW[2], 3, '255,70,60', 1);
  for (let k = 0; k < 2; k++) { const h = add(new THREE.CylinderGeometry(14, 14, 30, 24, 1, false, 0, Math.PI), std({ color: '#d8dce4', metalness: 0.4, roughness: 0.4 }), -230 - k * 36, 0, 58, scene, false); h.rotation.set(Math.PI / 2, 0, Math.PI / 2); add(box(26, 14, 0.3), std({ color: '#3a4a5a' }), -230 - k * 36, 6, 43, scene, false); }
  for (let i = 0; i < 6; i++) { const x = -40 - i * 7; add(box(1.2, 3.6, 0.3), std({ color: i % 2 ? '#d8322f' : '#f4f4f4' }), x, 1.8, 50, scene, false); } }

// --- props near the runway end: lamp posts, cones, fence, approach light bars, windsock ---
{ const lp = std({ color: '#3a3e48', metalness: 0.6, roughness: 0.4 });
  for (const x of [-30, -6, 18]) { add(cyl(0.12, 0.16, 8, 8), lp, x, 4, 46, scene); add(box(1.6, 0.25, 0.5), lp, x + 0.6, 8, 46, scene); const L = new THREE.PointLight('#ffe0b0', 0, 30, 1.5); L.position.set(x + 1.2, 7.7, 46); scene.add(L); L.userData = { zone: 'airnight', I0: 60 }; pLights.push(L); glow(x + 1.2, 7.7, 46, 3, '255,220,160', 0.8).userData.zone = 'airnight'; }
  for (let k = 0; k < 7; k++) { const c = add(new THREE.ConeGeometry(0.22, 0.6, 12), std({ color: k % 2 ? '#ff6a1a' : '#ff6a1a', roughness: 0.4 }), -8 + k * 2.2, 0.3, 15.8, scene); add(cyl(0.2, 0.2, 0.06, 12), WHITE, -8 + k * 2.2, 0.35, 15.8, scene, false); }
  // windsock
  add(cyl(0.08, 0.08, 6, 8), std({ color: '#e8e8ec' }), 8, 3, 44); const ws = add(new THREE.CylinderGeometry(0.5, 0.25, 3, 12, 1, true), std({ color: '#ff5a1a', side: THREE.DoubleSide }), 9.5, 5.8, 44, scene, false); ws.rotation.z = Math.PI / 2 - 0.2;
  // fence along the cliff side of the apron
  for (let z = 16; z <= 49; z += 2.5) { add(cyl(0.05, 0.05, 1.4, 6), lp, EDGE - 1.2, 0.7, z, scene); } add(box(0.05, 0.05, 33), lp, EDGE - 1.2, 1.35, 32.5, scene); add(box(0.05, 0.05, 33), lp, EDGE - 1.2, 0.8, 32.5, scene); }

// --- EMAS bed: instanced blocks ---
const BS = 1.2, ROWS = Math.round(BEDL / BS), COLS = Math.round(BEDW / BS); const BLOCK_N = ROWS * COLS;
const BLK = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ map: blockTex, roughness: 0.85, envMapIntensity: 0.5 }), BLOCK_N); BLK.castShadow = true; BLK.receiveShadow = true; scene.add(BLK);
const BLKP = []; { const r = R(123); for (let i = 0; i < ROWS; i++) for (let j = 0; j < COLS; j++) { const x = 0.8 + i * BS + BS / 2, z = -BEDW / 2 + j * BS + BS / 2; const h = 0.32 + (i / ROWS) * 0.42; BLKP.push({ x, z, h, row: i, col: j, c: r() }); } }
// order in which the worker lays them: from the cliff end back toward the runway
const LAYORDER = BLKP.map((b, k) => k).sort((a, b) => (BLKP[b].row - BLKP[a].row) * 100 + (BLKP[a].col - BLKP[b].col)); const LAYRANK = new Array(BLOCK_N); LAYORDER.forEach((k, n) => (LAYRANK[k] = n));
const RUBBLE_N = 1600; const RUB = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }), RUBBLE_N); RUB.castShadow = true; RUB.receiveShadow = true; RUB.frustumCulled = false; scene.add(RUB);
// loose blocks on the worker's cart
const CART = new THREE.Group(); scene.add(CART);
{ const fr = std({ color: '#3a4a6a', metalness: 0.5, roughness: 0.4 }); add(box(1.6, 0.08, 1.0), std({ color: '#6a4a2a', roughness: 0.7 }), 0, 0.55, 0, CART); for (const s of [-1, 1]) { const w = add(cyl(0.28, 0.28, 0.12, 16), std({ color: '#1a1a1e', roughness: 0.6 }), 0.2, 0.28, s * 0.56, CART); w.rotation.x = Math.PI / 2; add(cyl(0.12, 0.12, 0.13, 10), std({ color: '#c8c8cc', metalness: 0.8, roughness: 0.3 }), 0.2, 0.28, s * 0.57, CART).rotation.x = Math.PI / 2; }
  for (const s of [-1, 1]) { const h = add(cyl(0.03, 0.03, 1.3, 8), fr, -1.15, 0.9, s * 0.4, CART); h.rotation.z = 1.0; } add(cyl(0.03, 0.03, 0.85, 8), fr, -1.68, 1.28, 0, CART).rotation.x = Math.PI / 2; add(box(0.06, 0.4, 0.06), fr, 0.7, 0.35, 0.4, CART); add(box(0.06, 0.4, 0.06), fr, 0.7, 0.35, -0.4, CART);
  const bm = new THREE.MeshStandardMaterial({ map: blockTex, roughness: 0.85 }); for (let k = 0; k < 6; k++) add(box(0.62, 0.32, 0.42), bm, -0.38 + (k % 2) * 0.68, 0.76 + Math.floor(k / 2) * 0.34, (k % 3 - 1) * 0.01 + (Math.floor(k / 2) % 2 ? 0.2 : -0.2) * 0, CART).rotation.y = (k % 3) * 0.05; }
const HBLOCK = add(box(0.9, 0.38, 0.9), new THREE.MeshStandardMaterial({ map: blockTex, roughness: 0.85 }), 0, -50, 0, scene); // single block the worker sets down

// --- yellow airport truck ---
const TRUCK = new THREE.Group(); scene.add(TRUCK); const TWHEELS = [];
{ const Y = std({ color: '#f2b81a', roughness: 0.35, metalness: 0.1, envMapIntensity: 1.2 }), BLK0 = std({ color: '#1e1e22', roughness: 0.5 }), GLS = std({ color: '#1a2a3a', metalness: 0.7, roughness: 0.06, envMapIntensity: 1.8 });
  add(box(5.4, 1.3, 2.5), Y, 0, 1.25, 0, TRUCK); add(box(2.2, 1.5, 2.3), Y, -1.2, 2.6, 0, TRUCK); add(box(2.0, 1.1, 2.32), GLS, -1.2, 2.7, 0, TRUCK); add(box(2.24, 0.08, 2.36), BLK0, -1.2, 3.38, 0, TRUCK);
  for (const s of [-1, 1]) { add(box(0.08, 1.2, 0.08), BLK0, -1.2 + s * 1.05, 2.7, 1.16, TRUCK); add(box(0.08, 1.2, 0.08), BLK0, -1.2 + s * 1.05, 2.7, -1.16, TRUCK); }
  add(box(0.25, 0.5, 2.6), BLK0, 2.78, 0.8, 0, TRUCK); add(box(0.25, 0.5, 2.6), BLK0, -2.78, 0.8, 0, TRUCK); add(box(5.5, 0.12, 2.56), BLK0, 0, 0.62, 0, TRUCK);
  for (const s of [-1, 1]) { add(box(0.3, 0.2, 0.05), std({ color: '#ffffe0', emissive: '#ffffa0', emissiveIntensity: 1.5 }), 2.92, 1.4, s * 0.9, TRUCK); add(box(4.6, 0.12, 0.04), BLK0, 0.4, 1.0, s * 1.27, TRUCK); }
  for (let k = 0; k < 8; k++) add(box(0.25, 0.4, 0.02), k % 2 ? BLK0 : Y, 2.92, 1.25, -1.0 + k * 0.28, TRUCK, false);
  add(cyl(0.2, 0.2, 0.15, 10), std({ color: '#ff8a1a', emissive: '#ff6a00', emissiveIntensity: 1.2 }), -1.2, 3.5, 0, TRUCK);
  { const dec = (() => { const [c, g] = cv(1024, 256); g.fillStyle = '#f2b81a'; g.fillRect(0, 0, 1024, 256); for (let x = -40; x < 1024; x += 80) { g.fillStyle = '#1e1e22'; g.beginPath(); g.moveTo(x, 256); g.lineTo(x + 40, 256); g.lineTo(x + 100, 180); g.lineTo(x + 60, 180); g.fill(); } g.fillStyle = '#1e1e22'; g.font = '900 110px Arial Black, Arial'; g.textAlign = 'center'; g.fillText('RAMP 7', 512, 130); return P.tex(c); })();
    for (const s2 of [-1, 1]) { const d2 = plane(4.6, 1.1, new THREE.MeshStandardMaterial({ map: dec, roughness: 0.4 }), 0.4, 1.3, s2 * 1.256, 0, s2 < 0 ? Math.PI : 0, TRUCK); d2.castShadow = false; }
    for (const s2 of [-1, 1]) { add(box(0.06, 0.4, 0.3), BLK0, -0.05, 2.9, s2 * 1.35, TRUCK); add(box(0.04, 0.32, 0.24), std({ color: '#a8c0d8', metalness: 0.9, roughness: 0.05 }), -0.02, 2.9, s2 * 1.36, TRUCK, false); }
    add(box(1.6, 0.12, 0.3), BLK0, -1.2, 3.47, 0, TRUCK); for (const s2 of [-1, 1]) add(box(0.3, 0.14, 0.32), std({ color: '#ff8a1a', emissive: '#ff6a00', emissiveIntensity: 1.5 }), -1.2, 3.56, s2 * 0.5, TRUCK);
    for (let k = 0; k < 3; k++) add(box(0.04, 0.9, 2.2), BLK0, 1.0 + k * 0.6, 1.95, 0, TRUCK, false).scale.set(1, 0.001 + 1, 1); add(box(2.6, 0.6, 2.3), std({ color: '#d8a014', roughness: 0.45 }), 1.3, 2.2, 0, TRUCK); add(box(2.66, 0.08, 2.36), BLK0, 1.3, 2.5, 0, TRUCK); }
  for (const x of [-1.7, 1.7]) for (const s of [-1, 1]) { const W = new THREE.Group(); W.position.set(x, 0.62, s * 1.25); TRUCK.add(W); const t = add(cyl(0.62, 0.62, 0.5, 20), std({ color: '#16161a', roughness: 0.7 }), 0, 0, 0, W); t.rotation.x = Math.PI / 2; const hb = add(cyl(0.32, 0.32, 0.52, 14), std({ color: '#d8d8dc', metalness: 0.8, roughness: 0.3 }), 0, 0, 0, W); hb.rotation.x = Math.PI / 2; for (let k = 0; k < 5; k++) { const n = add(box(0.06, 0.06, 0.54), BLK0, Math.cos(k * 1.26) * 0.2, Math.sin(k * 1.26) * 0.2, 0, W, false); } TWHEELS.push(W); } }

// --- demolition sign (can be torn in two) ---
const SIGN = new THREE.Group(); scene.add(SIGN); const SIGNH = [];
{ const tx = (() => { const [c, g] = cv(1024, 640); g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, 1024, 640); g.strokeStyle = '#d8222a'; g.lineWidth = 28; g.strokeRect(14, 14, 996, 612); g.textAlign = 'center'; g.font = '900 150px Arial Black, Arial'; g.fillStyle = '#d8222a'; g.fillText('DEMOLITION', 512, 270); g.font = '900 118px Arial Black, Arial'; g.fillStyle = '#1a1a1e'; g.fillText('MONDAY 8 AM', 512, 470); return P.tex(c); })();
  const post = std({ color: '#c89a5a', roughness: 0.7 });
  for (const s of [-1, 1]) { const h = new THREE.Group(); SIGN.add(h); SIGNH.push(h); h.userData.s = s; add(box(0.12, 2.3, 0.12), post, s * 1.0, 1.15, -0.06, h);
    const t = tx.clone(); t.repeat.set(0.5, 1); t.offset.set(s < 0 ? 0 : 0.5, 0); t.needsUpdate = true;
    const half = add(new THREE.PlaneGeometry(1.1, 1.4), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, side: THREE.DoubleSide }), s * 0.55, 1.75, 0, h); } }

// --- the passenger jet (original livery: white, teal cheatline, orange pinstripe, teal tail) ---
const JET = new THREE.Group(); scene.add(JET); const JWHEELS = []; const JFAN = [];
{ const liv = (() => { const [c, g] = cv(2048, 512); g.fillStyle = '#f6f8fa'; g.fillRect(0, 0, 2048, 512);
    const Y = (d, side) => side < 0 ? 256 - d * 128 : (d >= 0 ? d * 128 : 512 + d * 128);
    g.fillStyle = '#ccd2dc'; g.fillRect(0, 330, 2048, 110); // belly
    for (const side of [-1, 1]) { const band = (d, h, col) => { g.fillStyle = col; g.fillRect(0, Y(d, side) - h / 2, 2048, h); }; band(-0.16, 22, '#12808a'); band(-0.3, 8, '#ff7a1a');
      const wy = Y(0.22, side); for (let x = 150; x < 1880; x += 44) { if (Math.abs(x - 1200) < 50 || Math.abs(x - 420) < 40) continue; g.fillStyle = '#1e2a3a'; g.beginPath(); g.roundRect(x, wy - 13, 20, 26, 8); g.fill(); g.fillStyle = 'rgba(160,200,255,.5)'; g.fillRect(x + 3, wy - 10, 6, 9); }
      for (const dx of [1200, 420, 1910]) { g.strokeStyle = '#9aa4b0'; g.lineWidth = 3; g.strokeRect(dx - 22, wy - 40, 44, 74); } }
    g.strokeStyle = 'rgba(120,130,145,.3)'; g.lineWidth = 2; for (let x = 0; x < 2048; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); } return P.tex(c); })();
  const BODY = new THREE.MeshStandardMaterial({ map: liv, roughness: 0.28, metalness: 0.1, envMapIntensity: 1.3 });
  const WHT = std({ color: '#f2f4f8', roughness: 0.3, envMapIntensity: 1.3 }), GRY = std({ color: '#b8c0cc', roughness: 0.35, metalness: 0.4, envMapIntensity: 1.3 }), TEALM = std({ color: '#12808a', roughness: 0.3, envMapIntensity: 1.2 }), ORG = std({ color: '#ff7a1a', roughness: 0.35 }), CHR = std({ color: '#dde2ea', metalness: 1, roughness: 0.15, envMapIntensity: 1.8 }), DK = std({ color: '#1a1c22', roughness: 0.5 });
  const RAD = 1.7, LEN = 18, CY = 3.6;
  const body = add(new THREE.CylinderGeometry(RAD, RAD, LEN, 40, 1, true), BODY, 0, CY, 0, JET); body.rotation.z = -Math.PI / 2; body.rotation.y = 0; body.rotation.x = Math.PI / 2 * 0; { const uvA = body.geometry.attributes.uv; for (let i = 0; i < uvA.count; i++) { const u = uvA.getX(i), v = uvA.getY(i); uvA.setXY(i, v, u); } }
  const nose = add(new THREE.SphereGeometry(RAD, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), WHT, LEN / 2, CY, 0, JET); nose.rotation.z = -Math.PI / 2; nose.scale.set(1, 2.1, 1); nose.position.y = CY - 0.05;
  // cockpit windows
  { const WM = std({ color: '#141e2e', metalness: 0.7, roughness: 0.05, envMapIntensity: 2 }); const rN = (x) => RAD * Math.sqrt(Math.max(0, 1 - Math.pow((x - LEN / 2) / (RAD * 2.1), 2)));
    for (const [x, th, w] of [[11.25, 0, 0.42], [10.95, 0.55, 0.5], [10.95, -0.55, 0.5], [10.45, 1.05, 0.46], [10.45, -1.05, 0.46]]) { const r = rN(x) + 0.02, y = Math.cos(th) * r, z = Math.sin(th) * r; const m = add(box(w, 0.36, 0.05), WM, x, CY + y, z, JET, false); m.lookAt(new THREE.Vector3(x + 0.9, CY + y * 2, z * 2).applyMatrix4(new THREE.Matrix4())); m.position.set(x, CY + y, z); m.lookAt(x + (x - LEN / 2) * 0.35, CY + y * 2, z * 2); m.rotateY(Math.PI / 2); } }
  // tail cone (tapering up)
  const tailG = new THREE.CylinderGeometry(RAD, 0.35, 7, 40, 1, true); tailG.rotateZ(Math.PI / 2); tailG.translate(-3.5, 0, 0); { const p = tailG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), k = -x / 7; p.setY(i, p.getY(i) + k * k * 1.1); } tailG.computeVertexNormals(); }
  add(tailG, WHT, -LEN / 2, CY, 0, JET);
  // wings
  const wingShape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(4.2, 0), new THREE.Vector2(-2.2, 12.5), new THREE.Vector2(-3.4, 12.5), new THREE.Vector2(-2.6, 0)].map((v) => v));
  for (const s of [-1, 1]) { const g = new THREE.ExtrudeGeometry(wingShape, { depth: 0.28, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 }); g.rotateX(Math.PI / 2); if (s < 0) g.scale(1, 1, -1); const w = add(g, GRY, 0.6, CY - 1.0, s * 1.1, JET); w.rotation.x = s * -0.08;
    const tip = add(box(1.0, 1.4, 0.12), TEALM, -2.8, CY - 0.2 + 0.9, s * 13.5, JET); tip.rotation.z = -0.4;
    // engine under each wing
    const E = new THREE.Group(); E.position.set(2.6, CY - 1.9, s * 4.6); JET.add(E); const nac = add(new THREE.CylinderGeometry(0.95, 0.75, 3.6, 28, 1, true), WHT, 0, 0, 0, E); nac.rotation.z = Math.PI / 2; nac.material = WHT.clone(); nac.material.side = THREE.DoubleSide;
    add(new THREE.TorusGeometry(0.92, 0.1, 10, 28), CHR, 1.8, 0, 0, E).rotation.y = Math.PI / 2; const fan = add(new THREE.CircleGeometry(0.88, 28), DK, 1.6, 0, 0, E); fan.rotation.y = Math.PI / 2;
    const blades = new THREE.Group(); blades.position.x = 1.62; E.add(blades); for (let k = 0; k < 14; k++) { const b = add(box(0.02, 0.78, 0.14), std({ color: '#8a929e', metalness: 0.9, roughness: 0.3 }), 0, 0, 0, blades, false); b.rotation.x = k / 14 * Math.PI * 2; b.geometry = b.geometry.clone(); b.geometry.translate(0, 0.42, 0); } JFAN.push(blades);
    add(new THREE.ConeGeometry(0.28, 0.5, 16), CHR, 1.85, 0, 0, E).rotation.z = -Math.PI / 2; add(new THREE.ConeGeometry(0.55, 1.2, 20), GRY, -2.2, 0, 0, E).rotation.z = Math.PI / 2; add(box(1.8, 0.9, 0.2), GRY, 0.2, 0.9, 0, E); add(box(3.62, 0.08, 1.9), TEALM, 0, 0, 0, E, false).visible = false; }
  // tail fin + stabilisers
  const finS = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(3.4, 0), new THREE.Vector2(-0.8, 5.4), new THREE.Vector2(-2.6, 5.4), new THREE.Vector2(-1.4, 0)]); const fg = new THREE.ExtrudeGeometry(finS, { depth: 0.24, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 1 }); fg.translate(0, 0, -0.12);
  const finTex = (() => { const [c, g] = cv(512, 512); g.fillStyle = '#12808a'; g.fillRect(0, 0, 512, 512); g.fillStyle = '#ff7a1a'; g.beginPath(); g.moveTo(0, 330); g.lineTo(512, 140); g.lineTo(512, 190); g.lineTo(0, 380); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(300, 300, 60, 0, 7); g.fill(); g.fillStyle = '#12808a'; g.beginPath(); g.moveTo(260, 300); g.quadraticCurveTo(300, 250, 345, 290); g.quadraticCurveTo(300, 270, 260, 300); g.fill(); return P.tex(c); })();
  const fin = add(fg, new THREE.MeshStandardMaterial({ map: finTex, roughness: 0.3, envMapIntensity: 1.2 }), -LEN / 2 - 4.0, CY + 1.2, 0, JET); { const uvA = fg.attributes.uv; for (let i = 0; i < uvA.count; i++) { uvA.setXY(i, (fg.attributes.position.getX(i) + 2.6) / 6, fg.attributes.position.getY(i) / 5.4); } }
  for (const s of [-1, 1]) { const st = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(2.2, 0), new THREE.Vector2(-0.6, 4.6), new THREE.Vector2(-1.6, 4.6), new THREE.Vector2(-1.2, 0)]); const g = new THREE.ExtrudeGeometry(st, { depth: 0.16, bevelEnabled: false }); g.rotateX(Math.PI / 2); if (s < 0) g.scale(1, 1, -1); add(g, WHT, -LEN / 2 - 4.6, CY + 1.0, s * 0.3, JET); }
  // landing gear: nose gear at x = +7.5, mains at x = -0.6, z = +-2.9 (dual wheels)
  const gear = (x, z, n, r) => { const G = new THREE.Group(); G.position.set(x, 0, z); JET.add(G); add(cyl(0.12, 0.12, CY - 1.4, 10), CHR, 0, (CY - 1.4) / 2 + r, 0, G); add(box(0.3, 0.3, n * 0.5), GRY, 0, r, 0, G);
    for (let k = 0; k < n; k++) { const W = new THREE.Group(); W.position.set(0, r, (k - (n - 1) / 2) * 0.55); G.add(W); const t = add(cyl(r, r, 0.42, 24), std({ color: '#17171b', roughness: 0.65 }), 0, 0, 0, W); t.rotation.x = Math.PI / 2; const h = add(cyl(r * 0.55, r * 0.55, 0.44, 16), std({ color: '#c8ccd4', metalness: 0.8, roughness: 0.3 }), 0, 0, 0, W); h.rotation.x = Math.PI / 2; for (let q = 0; q < 6; q++) add(box(0.05, 0.05, 0.46), DK, Math.cos(q) * r * 0.32, Math.sin(q) * r * 0.32, 0, W, false); JWHEELS.push(W); } return G; };
  JET.userData.gears = [gear(7.5, 0, 2, 0.42), gear(-0.6, -2.9, 2, 0.62), gear(-0.6, 2.9, 2, 0.62)];
  // landing lights + beacon
  JET.userData.ll = glow(0, 0, 0, 0.01, '255,250,230', 0); for (const s of [-1, 1]) { const g2 = glow(0.6, CY - 0.6, s * 13.2, 0.5, s > 0 ? '80,255,120' : '255,60,60', 0.9); JET.add(g2); g2.position.set(-1.8, CY - 0.4, s * 13.4); g2.userData.zone = 'fx'; }
  JET.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
// streaks of spray / sparks behind the main wheels
const SPRAY = []; for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: dustTexA(), transparent: true, depthWrite: false, color: '#e8eef8', fog: true })); m.userData.ndSkip = true; m.renderOrder = 3; m.visible = false; scene.add(m); SPRAY.push(m); }
function dustTexA() { if (dustTexA.t) return dustTexA.t; const [c, g] = cv(128, 128); for (let i = 0; i < 9; i++) { const x = 34 + (i * 37) % 60, y = 34 + (i * 53) % 60, gr = g.createRadialGradient(x, y, 0, x, y, 34); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } dustTexA.t = new THREE.CanvasTexture(c); dustTexA.t.colorSpace = THREE.SRGBColorSpace; return dustTexA.t; }
// rain streaks around the camera
const RAIN_N = 2600; const RAIN = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.03, 0.9), new THREE.MeshBasicMaterial({ color: '#eef4ff', transparent: true, opacity: 0.7, depthWrite: false, fog: false }), RAIN_N); RAIN.frustumCulled = false; RAIN.userData.ndSkip = true; RAIN.renderOrder = 4; scene.add(RAIN);
// puddle sheen on wet asphalt
const WET = plane(600, 30, new THREE.MeshStandardMaterial({ color: '#2a3040', roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.35, envMapIntensity: 2.2 }), -300, 0.035, 0, -Math.PI / 2); WET.userData.ndSkip = true;
const SUN = add(new THREE.CircleGeometry(30, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.6, 1.8), fog: false }), -800, 330, -700, scene, false); SUN.lookAt(0, 0, 0); SUN.userData.ndSkip = true;
const MOON = add(new THREE.CircleGeometry(22, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.3, 2.6), fog: false }), -700, 380, -800, scene, false); MOON.lookAt(0, 0, 0); MOON.userData.ndSkip = true;
const dustTex = dustTexA();
ZONE = 'fx';
const PRESET = {
  night: { sky: 'night', cardTint: '#b8c2e8', vig: 0.45, hemi: ['#6a88e8', '#1a2440', 0.9], key: ['#9ab4ff', 1.5], fog: ['#1a2858', 0.0016], sun: [-0.5, 0.8, -0.6], expo: 1.25, sat: 1.15, env: ENV.night, bloomK: 0.45, thr: 1.05, lights: true },
  day: { sky: 'day', cardTint: '#f4eee6', vig: 0.3, hemi: ['#cfe4ff', '#6a7a4a', 1.1], key: ['#fff2dc', 2.9], fog: ['#cfe2ff', 0.0011], sun: [-0.6, 0.85, 0.45], expo: 1.0, sat: 1.12, env: ENV.day, bloomK: 0.3, thr: 1.3 },
  rain: { sky: 'rain', cardTint: '#d4dae6', vig: 0.45, hemi: ['#b8c8e0', '#3a4a3a', 1.05], key: ['#dce6f4', 1.4], fog: ['#8a9ab0', 0.0042], sun: [-0.4, 0.9, 0.3], expo: 1.08, sat: 1.1, env: ENV.rain, bloomK: 0.45, thr: 1.05, lights: true, rain: true },
  morn: { sky: 'morn', cardTint: '#f6ece0', vig: 0.3, hemi: ['#ffe8d0', '#6a7a4a', 1.05], key: ['#ffe2b8', 2.8], fog: ['#ffe0c8', 0.0011], sun: [-0.7, 0.6, 0.5], expo: 1.02, sat: 1.12, env: ENV.morn, bloomK: 0.3, thr: 1.3 },
};
import { stateAt, TOTAL } from './shots.js';
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E3 = new THREE.Euler(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3(), COL = new THREE.Color();
const bedH = (x) => (x < 0.8 || x > 0.8 + BEDL) ? 0 : 0.32 + ((x - 0.8) / BEDL) * 0.42;
window.renderFrame = (f) => {
  const S = stateAt(f, {}), t = f / 30; const L = PRESET[S.preset || 'day'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2]; moon.color.set(L.key[0]); moon.intensity = S.key ?? L.key[1];
  scene.fog.color.set(L.fog[0]); scene.fog.density = S.fog ?? L.fog[1]; scene.environment = L.env;
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(0, 0, 0); inkU.flash.value = S.flash || 0; inkU.vig.value = L.vig ?? 0.35; inkU.bloomK.value = S.bloomK ?? L.bloomK; brightU.thr.value = S.thr ?? L.thr; inkU.split.value = 0; inkU.greenK.value = 0; inkU.raysK.value = 0; inkU.worldInk.value = 0.55;
  SKY.material.map = SKYT[L.sky]; STARS.visible = L.sky === 'night'; MOON.visible = L.sky === 'night'; SUN.visible = L.sky === 'day' || L.sky === 'morn'; CLOUDS.forEach((c) => { c.visible = L.sky !== 'night'; c.material.color.set(L.sky === 'rain' ? '#9aa6b8' : L.sky === 'morn' ? '#fff0e0' : '#ffffff'); });
  for (const l of pLights) { l.visible = l.userData.zone === 'airnight' ? !!L.lights : true; l.intensity = l.userData.I0; }
  for (const g of glows) g.visible = g.userData.rl || g.userData.zone === 'airnight' ? !!L.lights : true;
  WET.visible = !!L.rain; RAIN.visible = !!L.rain;
  // ---- jet ----
  const J = S.jet; JET.visible = !!J; let gearX = -1e9, noseX = -1e9;
  if (J) { const alt = J.alt || 0; noseX = J.x; gearX = J.x - 8.1; const sinkM = alt > 0 ? 0 : bedH(gearX) * 0.62, sinkN = alt > 0 ? 0 : bedH(noseX) * 0.62;
    JET.position.set(J.x - 7.5, alt - sinkM, J.z || 0); JET.rotation.set(J.roll || 0, J.yaw || 0, (J.pitch || 0) + Math.atan2(sinkM - sinkN, 8.1));
    JWHEELS.forEach((w) => (w.rotation.z = -(J.x) / 0.55)); JFAN.forEach((b) => (b.rotation.x = t * 25));
    JET.userData.gears.forEach((g) => (g.visible = J.gear !== false)); }
  // ---- truck ----
  const TK = S.truck; TRUCK.visible = !!TK; if (TK) { const sink = bedH(TK.x) * 0.55; TRUCK.position.set(TK.x, -sink, TK.z); TRUCK.rotation.set(0, TK.ry || 0, 0); TWHEELS.forEach((w) => (w.rotation.z = -TK.x / 0.62)); }
  CART.visible = !!S.cart; if (S.cart) { CART.position.set(S.cart.x, 0, S.cart.z); CART.rotation.y = S.cart.ry || 0; }
  HBLOCK.position.set(...(S.hblock || [0, -50, 0]));
  SIGN.visible = !!S.sign; if (S.sign) { SIGN.position.set(S.sign.x, S.sign.y || 0, S.sign.z); SIGN.rotation.y = S.sign.ry || 0; const k = S.sign.tear || 0; SIGNH.forEach((h) => { const s = h.userData.s; h.position.set(s * k * 0.5, k * 0.6, 0); h.rotation.set(0, 0, -s * k * 0.9); }); }
  // ---- EMAS blocks: laid fraction + crushing by wheel tracks ----
  const tracks = []; if (J && !(J.alt > 0)) { for (const z of [-2.9, 2.9]) tracks.push([z + (J.z || 0), gearX + 0.35, 0.85]); tracks.push([(J.z || 0), noseX + 0.3, 0.55]); }
  if (TK) for (const z of [-1.25, 1.25]) { const c = Math.cos(TK.ry || 0); tracks.push([TK.z + z * c, TK.x + 2.3, 0.5]); }
  for (const tr of S.tracks || []) tracks.push(tr);
  const laid = Math.round((S.laid ?? 1) * BLOCK_N); let nr = 0;
  for (let k = 0; k < BLOCK_N; k++) { const b = BLKP[k]; const on = LAYRANK[k] < laid; let cr = 0; if (on) for (const [z, x1, w, x0] of tracks) if (b.x - BS / 2 < x1 && (x0 === undefined || b.x + BS / 2 > x0) && Math.abs(b.z - z) < w + BS / 2 - 0.15) cr = Math.max(cr, cl01((x1 - (b.x - BS / 2)) / BS));
    const h = on ? b.h * (1 - 0.68 * cr) : 0.0001; E3.set(0, (cr > 0 ? (b.c - 0.5) * 0.2 : 0), cr * (b.c - 0.5) * 0.25); Q.setFromEuler(E3); M4.compose(V3.set(b.x, h / 2 + 0.02, b.z), Q, S3.set(BS - 0.06, h, BS - 0.06)); BLK.setMatrixAt(k, M4);
    BLK.setColorAt(k, COL.setHSL(0.58, 0.05, (0.86 + b.c * 0.08) * (1 - cr * 0.28))); if (cr > 0.2) for (let q = 0; q < 4 && nr < RUBBLE_N; q++, nr++) { const s = (0.05 + rnd(k, q) * 0.09); E3.set(rnd(k, q + 9) * 6, rnd(k, q + 3) * 6, 0); Q.setFromEuler(E3); M4.compose(V3.set(b.x + (rnd(k, q + 1) - 0.5) * BS * 1.3, h + 0.04 + rnd(k, q + 5) * 0.05, b.z + (rnd(k, q + 2) - 0.5) * BS * 1.3), Q, S3.set(s, s * 0.7, s)); RUB.setMatrixAt(nr, M4); RUB.setColorAt(nr, COL.setHSL(0.58, 0.05, 0.62 + rnd(k, q) * 0.25)); } }
  for (let q = nr; q < RUBBLE_N; q++) { M4.makeScale(0, 0, 0); RUB.setMatrixAt(q, M4); } BLK.instanceMatrix.needsUpdate = true; BLK.instanceColor.needsUpdate = true; RUB.instanceMatrix.needsUpdate = true; if (RUB.instanceColor) RUB.instanceColor.needsUpdate = true;
  // ---- camera ----
  const sh = S.shake || 0, hh = S.handheld ?? 0.008; let look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look.x, look.y, look.z); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.far = 3000; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); SKY.position.copy(camera.position);
  const fc = S.shadowAt ? S.shadowAt : [look.x, Math.max(0, look.y - 1), look.z], sd = new THREE.Vector3(...(S.sun || L.sun)).normalize(); moon.position.set(fc[0] + sd.x * 80, fc[1] + sd.y * 80, fc[2] + sd.z * 80); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 16; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix(); }
  // ---- rain around the camera ----
  if (RAIN.visible) { const fwd0 = new THREE.Vector3(); camera.getWorldDirection(fwd0); for (let i = 0; i < RAIN_N; i++) { const a = rnd(i, 1), d = 1.2 + rnd(i, 2) * 28; const ang = (rnd(i, 3) - 0.5) * 1.6 + Math.atan2(fwd0.x, fwd0.z); const y = ((rnd(i, 4) * 14 - t * 16 * (0.8 + rnd(i, 5) * 0.4)) % 14 + 14) % 14 - 2;
      E3.set(0, Math.atan2(camera.position.x - camera.position.x, 1) + ang, 0.18); Q.setFromEuler(E3); M4.compose(V3.set(camera.position.x + Math.sin(ang) * d, camera.position.y + y, camera.position.z + Math.cos(ang) * d), Q, S3.set(1 + d * 0.06, 1, 1)); RAIN.setMatrixAt(i, M4); } RAIN.instanceMatrix.needsUpdate = true; }
  // ---- spray / crush dust behind the wheels ----
  SPRAY.forEach((m, i) => { m.visible = false; if (!J || !S.spray) return; const k = (t * 1.6 + rnd(i, 1)) % 1; const side = i % 3 === 0 ? 0 : i % 3 === 1 ? -2.9 : 2.9; const x0 = (side === 0 ? noseX : gearX) - k * 6 * (S.sprayLen || 1);
    m.visible = true; m.position.set(x0, 0.3 + k * 1.6 + rnd(i, 2) * 0.4, side + (J.z || 0) + (rnd(i, 3) - 0.5) * 1.6); m.scale.setScalar(0.8 + k * 2.4); m.quaternion.copy(camera.quaternion); m.material.opacity = (1 - k) * 0.55 * S.spray; m.material.color.set(S.sprayCol || '#e8eef8'); });
  for (const g of glows) { g.quaternion.copy(camera.quaternion); g.material.opacity = g.userData.k0 * Math.exp(-g.position.distanceTo(camera.position) * 0.012); }
  if (bang.userData.g) bang.userData.g.quaternion.copy(camera.quaternion); bang.visible = false; bangLight.intensity = 0;
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); const upv = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw, !a.fx); c.mesh.visible = true; let px = a.x, py = a.y, pz = a.z;
    if (a.hud) { const d = a.hud.d || 1.2; const o = camera.position.clone().addScaledVector(fwd, d).addScaledVector(upv, a.hud.up || 0); px = o.x; py = o.y; pz = o.z; }
    c.mesh.position.set(px, py, pz); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s * (a.scaleY || 1), s);
    if (a.hud || a.face) c.mesh.quaternion.copy(camera.quaternion); else c.mesh.rotation.set(0, a.yaw ?? Math.atan2(camera.position.x - px, camera.position.z - pz), a.roll || 0);
    c.mat.color.set(a.tint || (a.fx ? '#ffffff' : L.cardTint) || '#ffffff'); c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2; c.mat.depthTest = !a.hud; c.mesh.castShadow = !a.fx;
    c.blob.visible = !a.fx && a.blob !== false; c.blob.position.set(px, (a.ground ?? py) + 0.015, pz); c.blob.scale.set(1.0 * s, 0.55 * s, 1); });
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.autoUpdate = false; swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false); scene.fog = fog; renderer.shadowMap.autoUpdate = true;
  renderer.setRenderTarget(rtB1); renderer.render(brightScene, fsCam);
  for (let k = 0; k < 3; k++) { const r = 1 + k * 1.2; blurU.src.value = rtB1.texture; blurU.dir.value.set(r / (W / 2), 0); renderer.setRenderTarget(rtB2); renderer.render(blurScene, fsCam); blurU.src.value = rtB2.texture; blurU.dir.value.set(0, r / (H / 2)); renderer.setRenderTarget(rtB1); renderer.render(blurScene, fsCam); }
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = 5; dofU.cinf.value = 0; dofU.haze.value = 0; dofU.time.value = t; renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
function cl01(x) { return Math.max(0, Math.min(1, x)); }
window.TOTAL = TOTAL; window.ready = true;
