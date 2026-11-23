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
const glows = []; const pLights = []; let ZONE = 'rail';
const glow = (x, y, z, size, col, k = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: k }));
  m.position.set(x, y, z); m.scale.setScalar(size); m.userData.k0 = k; m.userData.zone = ZONE; m.userData.ndSkip = true; m.renderOrder = 5; scene.add(m); glows.push(m); return m; };
const lamp = (x, y, z, col = '#ffb25a', I = 6, dist = 14, gs = 1.6) => { const l = new THREE.PointLight(col, I, dist, 1.6); l.position.set(x, y, z); scene.add(l); l.userData = { zone: ZONE, I0: I }; pLights.push(l); glow(x, y, z, gs, '255,190,110', 0.9); glow(x, y, z, gs * 0.3, '255,240,210', 1); return l; };

const NAMES = ['wooden_barrels_01', 'wooden_crate_01'];
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
      if (day > 5.5) { vec3 d = mix(vec3(.12,.22,.58), vec3(.015,.03,.14), pow(y,.45)); d = mix(d, vec3(.03,.05,.15), smoothstep(.05,.7,cl)*.9); d += vec3(.06,.1,.26)*smoothstep(.4,.9,cl)*(1.-y); gl_FragColor = vec4(d,1.); return; }
      if (day > 4.5) { vec3 d = mix(vec3(.95,.48,.66), vec3(.2,.2,.66), pow(y,.45)); d = mix(d, vec3(.92,.62,.84), cl*.7); gl_FragColor = vec4(d,1.); return; }
      if (day > 3.5) { vec3 d = mix(vec3(.26,.2,.5), vec3(.03,.03,.15), pow(y,.45)); d = mix(d, vec3(.3,.27,.52), cl*.75); float st = step(.996, h(floor(vP.xz/(vP.y+.3)*220.))) * smoothstep(.15,.5,y); d += vec3(1.2,1.1,1.4)*st; gl_FragColor = vec4(d,1.); return; }
      if (day > 2.5) { vec3 d = mix(vec3(.32,.36,.46), vec3(.14,.17,.24), pow(y,.5)); d = mix(d, vec3(.42,.46,.56), cl*.9); gl_FragColor = vec4(d,1.); return; }
      if (day > .5) { bool g = day > 1.5; vec3 sd = normalize(sunD); float sm = dot(vP, sd);
        vec3 top = g ? vec3(.04,.1,.45) : vec3(.015,.11,.6), hor = g ? vec3(1.0,.46,.18) : vec3(.2,.48,.98);
        vec3 d = mix(hor, top, pow(y, g ? .45 : .6)); d = mix(d, g ? vec3(1.1,.6,.38) : vec3(1.05,1.08,1.15), cl*.8);
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
  draw(fn, ol = false) { const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0); fn(new T.Pen(g));
    if (ol) { if (!this.tmp) { [this.tmp] = cv(CW, CH); this.tg = this.tmp.getContext('2d'); [this.wc] = cv(CW, CH); this.wg = this.wc.getContext('2d'); }
      this.tg.clearRect(0, 0, CW, CH); this.tg.drawImage(this.c, 0, 0); const wg = this.wg; wg.globalCompositeOperation = 'source-over'; wg.clearRect(0, 0, CW, CH); wg.drawImage(this.c, 0, 0); wg.globalCompositeOperation = 'source-in'; wg.fillStyle = '#ffffff'; wg.fillRect(0, 0, CW, CH); wg.globalCompositeOperation = 'source-over';
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); const r = 11; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.drawImage(this.wc, Math.cos(a) * r, Math.sin(a) * r); } g.drawImage(this.tmp, 0, 0); }
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
const inkU = { split: { value: 0 }, shTint: { value: new THREE.Color(0.24, 0.14, 0.34) }, hiTint: { value: new THREE.Color(1.0, 0.82, 0.84) }, greenK: { value: 0 }, sunUV: { value: new THREE.Vector2(0.5, 1.2) }, raysK: { value: 0 }, bloom: { value: rtB1.texture }, bloomK: { value: 0.55 }, expo: { value: 1.0 }, worldInk: { value: 0.3 }, col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 2.2 },
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
const PBRN = ['leafy_grass', 'cobblestone_floor_04', 'weathered_planks', 'fine_grained_wood'];
await Promise.all(PBRN.flatMap((n) => ['diff', 'nor', 'rough'].map((k) => new Promise((res) => TXL.load(`tex/${n}_${k}.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (k === 'diff') t.colorSpace = THREE.SRGBColorSpace; TX[n + k] = t; res(); }, undefined, () => res())))));
const pbr = (n, rep, o = {}) => { const r = Array.isArray(rep) ? rep : [rep, rep]; const cl = (t) => { const c = t.clone(); c.repeat.set(r[0], r[1]); c.needsUpdate = true; return c; };
  return new THREE.MeshStandardMaterial({ map: cl(TX[n + 'diff']), normalMap: cl(TX[n + 'nor']), roughnessMap: cl(TX[n + 'rough']), roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2), ...o }); };
const R = (s) => P.rng(s);
ZONE = 'town';
// ================= AMUSEMENT PARK + COASTER =================
ZONE = 'park';
const steel = (c) => std({ color: c, metalness: 0.75, roughness: 0.22, envMapIntensity: 1.5 });
const GRASS = pbr('leafy_grass', [120, 120], { color: '#8ae070', roughness: 0.85 });
const ground = add(new THREE.PlaneGeometry(1200, 1200), GRASS, 0, 0, 0, scene, false); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
const pathM = pbr('cobblestone_floor_04', [8, 40], { color: '#e8d8c8', roughness: 0.6 });
const PATHW = add(new THREE.PlaneGeometry(8, 160), pathM, -6, 0.02, 30, scene, false); PATHW.rotation.x = -Math.PI / 2; PATHW.receiveShadow = true;
const PATHW2 = add(new THREE.PlaneGeometry(8, 160), pathM, -306, 0.02, 30, scene, false); PATHW2.rotation.x = -Math.PI / 2;
// ---- coaster track: planar in x-y with z drift through the loop ----
const LOOPC = 22;
const loopPt = (th, k1, k2, R = 8) => { const w = R * (1 + 0.55 * k1 * Math.pow((Math.cos(th) + 1) / 2, 3) - 0.38 * k2 * Math.pow((1 - Math.cos(th)) / 2, 1.5)); const H = 2 * R * (1 + 0.3 * k2); return [LOOPC + w * Math.sin(th), 1.2 + (H / 2) * (1 - Math.cos(th)), (th / (Math.PI * 2)) * 2.2]; };
const trackPts = (k1, k2) => { const P0 = []; const push = (x, y, z) => P0.push(new THREE.Vector3(x, y, z));
  for (let x = -46; x <= -30; x += 2) push(x, 1.8, 0); // station
  for (let k = 0; k <= 12; k++) { const t = k / 12; push(-28 + t * 14, 1.8 + 17 * (t * t * (3 - 2 * t)), 0); } // lift hill
  push(-12.5, 19.2, 0); push(-10.5, 19.0, 0); for (let k = 1; k <= 12; k++) { const t = k / 12; push(-10 + t * 18, 19 - 17.8 * (t * t * (3 - 2 * t)), 0); } // drop
  push(10, 1.2, 0); push(14, 1.2, 0);
  const lead = 6 + 6 * k1; for (let k = 1; k <= 60; k++) { const th = k / 60 * Math.PI * 2; const p = loopPt(th, k1, k2); push(p[0], p[1], p[2]); }
  for (let x = LOOPC + 4; x <= 70; x += 3) push(x, 1.2 + Math.max(0, Math.sin((x - LOOPC - 4) / 46 * Math.PI)) * 4, 2.2); return P0; };
const railM = steel('#dfe4ec'), spineM = steel('#e8322f'), tieM = steel('#3a3a44');
const buildCoaster = (G, k1, k2, col = '#e8322f') => { while (G.children.length) { const c = G.children.pop(); c.geometry && c.geometry.dispose(); }
  const pts = trackPts(k1, k2); const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); G.userData.curve = curve; const N = 900;
  const frames = []; for (let i = 0; i <= N; i++) { const u = i / N; const p = curve.getPointAt(u), tg = curve.getTangentAt(u); const side = new THREE.Vector3(0, 0, 1); const up = new THREE.Vector3().crossVectors(side, tg).normalize(); frames.push({ p, tg, up, side }); } G.userData.frames = frames;
  const railCurve = (off, upOff) => new THREE.CatmullRomCurve3(frames.filter((_, i) => i % 3 === 0).map((f) => f.p.clone().addScaledVector(f.side, off).addScaledVector(f.up, upOff)));
  for (const s of [-0.55, 0.55]) { const m = new THREE.Mesh(new THREE.TubeGeometry(railCurve(s, 0), 600, 0.09, 8, false), railM); m.castShadow = true; G.add(m); }
  const sp = new THREE.Mesh(new THREE.TubeGeometry(railCurve(0, -0.42), 600, 0.17, 8, false), steel(col)); sp.castShadow = true; G.add(sp);
  const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(1.25, 0.08, 0.14), tieM, 300); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), basis = new THREE.Matrix4();
  for (let i = 0; i < 300; i++) { const f = frames[Math.floor(i / 300 * N)]; basis.makeBasis(f.side, f.up, f.tg); q.setFromRotationMatrix(basis); m4.compose(f.p.clone().addScaledVector(f.up, -0.2), q, new THREE.Vector3(1, 1, 1)); ties.setMatrixAt(i, m4); } ties.castShadow = true; G.add(ties);
  // supports: every ~4 m along the track where it is above ground and not inside the loop top half
  const colM = steel('#f0f0f6'); for (let i = 0; i < N; i += 14) { const f = frames[i]; if (f.p.y < 2.2) continue; if (f.p.x > LOOPC - 12 && f.p.x < LOOPC + 12 && f.up.y < 0.2) continue; const h = f.p.y - 0.5; const c = add(cyl(0.12, 0.16, h, 8), colM, f.p.x, h / 2, f.p.z, G); c.castShadow = true; add(cyl(0.3, 0.3, 0.2, 10), std({ color: '#b8b8c0' }), f.p.x, 0.1, f.p.z, G); }
  for (const s of [-1, 1]) { const c = add(cyl(0.25, 0.35, 9, 10), colM, LOOPC + s * 9.5, 4.5, 1.1, G); c.castShadow = true; }
  return curve; };
const COASTER = new THREE.Group(); scene.add(COASTER); let coasterKey = '';
const RIVAL = new THREE.Group(); RIVAL.position.set(-300, 0, 0); scene.add(RIVAL); buildCoaster(RIVAL, 0, 0, '#2a6ad8');
// carts
const makeCart = (col) => { const G = new THREE.Group(); scene.add(G); const body = std({ color: col, metalness: 0.4, roughness: 0.18, envMapIntensity: 1.5 }); const B = new THREE.Group(); B.position.y = 0.55; G.add(B);
  add(box(1.5, 0.7, 2.2), body, 0, 0.1, 0, B); add(box(1.55, 0.12, 2.3), steel('#f2c94a'), 0, 0.5, 0, B); const nose = add(new THREE.CylinderGeometry(0.75, 0.75, 1.5, 16, 1, false, 0, Math.PI), body, 0, 0.1, 1.1, B); nose.rotation.z = Math.PI / 2; nose.scale.set(1, 1, 0.6);
  add(box(1.3, 0.5, 0.12), std({ color: '#2a2a2a', roughness: 0.6 }), 0, 0.5, -0.3, B); add(box(1.3, 0.12, 0.7), std({ color: '#2a2a2a', roughness: 0.6 }), 0, 0.3, -0.6, B); add(cyl(0.035, 0.035, 1.3, 8), steel('#f2c94a'), 0, 0.75, 0.25, B).rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) for (const z of [-0.7, 0.7]) { const w = add(cyl(0.18, 0.18, 0.14, 12), steel('#2a2a30'), s * 0.62, -0.32, z, B); w.rotation.z = Math.PI / 2; }
  const [c, g] = cv(256, 96); g.fillStyle = col; g.fillRect(0, 0, 256, 96); g.fillStyle = '#ffe070'; g.font = '900 54px Arial Black'; g.textAlign = 'center'; g.fillText('LOOP-O', 128, 66); const lbl = add(new THREE.PlaneGeometry(1.0, 0.38), new THREE.MeshStandardMaterial({ map: P.tex(c), transparent: true }), 0.77, 0.15, 0, B, false); lbl.rotation.y = Math.PI / 2; lbl.userData.ndSkip = true;
  G.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return G; };
const CART = makeCart('#e8322f'), RCART = makeCart('#2a6ad8');
// ---- park dressing ----
const FERRIS = new THREE.Group(); FERRIS.position.set(-30, 0, -26); scene.add(FERRIS); { const fm = steel('#f4f4fa'), WHEEL = new THREE.Group(); WHEEL.position.y = 15; FERRIS.add(WHEEL); FERRIS.userData.wheel = WHEEL;
  for (const z of [-0.6, 0.6]) { add(new THREE.TorusGeometry(13, 0.18, 8, 64), fm, 0, 0, z, WHEEL); add(new THREE.TorusGeometry(4, 0.12, 8, 32), fm, 0, 0, z, WHEEL); for (let k = 0; k < 16; k++) { const s = add(cyl(0.06, 0.06, 13, 6), fm, 0, 0, z, WHEEL); s.rotation.z = k / 16 * Math.PI * 2; s.position.set(Math.cos(k / 16 * Math.PI * 2 + Math.PI / 2) * -6.5, Math.sin(k / 16 * Math.PI * 2 + Math.PI / 2) * 6.5 * 0 + 0, z); s.position.set(-Math.sin(k / 16 * Math.PI * 2) * 6.5, Math.cos(k / 16 * Math.PI * 2) * 6.5, z); } }
  const cols = ['#e8322f', '#f2c94a', '#2a8ae8', '#3ac85a', '#e87ab8', '#f08a3a']; FERRIS.userData.gond = []; for (let k = 0; k < 16; k++) { const gd = new THREE.Group(); FERRIS.add(gd); add(box(1.4, 1.2, 1.4), std({ color: cols[k % 6], roughness: 0.25, metalness: 0.3 }), 0, -0.6, 0, gd); add(new THREE.ConeGeometry(1.0, 0.5, 4), std({ color: '#f4f4fa' }), 0, 0.15, 0, gd).rotation.y = Math.PI / 4; FERRIS.userData.gond.push(gd); }
  for (const s of [-1, 1]) for (const z of [-1.5, 1.5]) { const leg = add(cyl(0.25, 0.3, 17, 8), fm, s * 4.5, 7.5, z, FERRIS); leg.rotation.z = s * 0.27; }
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 6, 4), new THREE.MeshStandardMaterial({ color: '#fff4c0', emissive: '#ffd060', emissiveIntensity: 2.4 }), 64); const m4 = new THREE.Matrix4(); for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; m4.makeTranslation(Math.cos(a) * 13, Math.sin(a) * 13, 0.75); bulbs.setMatrixAt(i, m4); } bulbs.userData.ndSkip = true; WHEEL.add(bulbs); FERRIS.userData.bulbs = bulbs; }
const prismG = (w, h, d) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g; };
const tentTex = (a, b) => { const [c, g] = cv(512, 64); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * 32, 0, 32, 64); } return P.tex(c); };
const tent = (x, z, r, a, b) => { const G = new THREE.Group(); G.position.set(x, 0, z); scene.add(G); add(new THREE.CylinderGeometry(r, r, 3, 24, 1, true), new THREE.MeshStandardMaterial({ map: tentTex(a, b), roughness: 0.5, side: THREE.DoubleSide }), 0, 1.5, 0, G); add(new THREE.ConeGeometry(r * 1.15, r * 1.1, 24), new THREE.MeshStandardMaterial({ map: tentTex(a, b), roughness: 0.4 }), 0, 3 + r * 0.55, 0, G); add(cyl(0.05, 0.05, 1.4, 6), std({ color: '#3a3a3a' }), 0, 3.6 + r * 1.1, 0, G); const fl = add(new THREE.PlaneGeometry(0.8, 0.5), std({ color: a, side: THREE.DoubleSide }), 0.4, 4.0 + r * 1.1, 0, G); return G; };
for (const [x, z, r, a, b] of [[-16, 8, 3, '#e8322f', '#fff4e8'], [4, -18, 3.5, '#2a6ad8', '#fff4e8'], [-22, 30, 2.6, '#f2a020', '#fff4e8'], [12, 24, 3, '#3ab86a', '#fff4e8'], [40, -16, 3.4, '#a83ad8', '#fff4e8']]) tent(x, z, r, a, b);
// bunting + lamp posts with bulbs along the path
const LAMPS = []; for (let z = -6; z < 80; z += 10) for (const s of [-1, 1]) { const x = -6 + s * 5; add(cyl(0.08, 0.1, 4, 8), steel('#2a2a34'), x, 2, z); add(cyl(0.22, 0.12, 0.3, 10), std({ color: '#f2c24a', metalness: 1, roughness: 0.2 }), x, 3.95, z); add(cyl(0.2, 0.26, 0.4, 10), std({ color: '#f2c24a', metalness: 1, roughness: 0.2 }), x, 0.2, z); const bulb = add(new THREE.SphereGeometry(0.28, 12, 8), new THREE.MeshStandardMaterial({ color: '#fff0c0', emissive: '#ffc060', emissiveIntensity: 1.2 }), x, 4.15, z, scene, false); bulb.userData.ndSkip = true; LAMPS.push(bulb); }
const BUNT = new THREE.Group(); scene.add(BUNT); { const cols = ['#e8322f', '#f2c94a', '#2a8ae8', '#3ac85a']; for (let z = -6; z < 70; z += 10) { for (let k = 0; k < 9; k++) { const t = k / 8; const x = -11 + t * 10, y = 3.9 - Math.sin(t * Math.PI) * 0.7; const fl = add(new THREE.ConeGeometry(0.22, 0.42, 3), std({ color: cols[k % 4], roughness: 0.5 }), x, y, z, BUNT, false); fl.rotation.z = Math.PI; } } }

// station pavilion
const STA = new THREE.Group(); STA.position.set(-38, 0, 0); scene.add(STA); { const wood = pbr('weathered_planks', [2, 1], { color: '#e8c8a0', roughness: 0.5 }); add(box(18, 1.4, 7), wood, 0, 0.7, 2.2, STA); for (const x of [-8, -4, 0, 4, 8]) for (const z of [-1.8, 5.8]) add(cyl(0.18, 0.18, 5, 10), steel('#f4f4fa'), x, 3.3, z, STA);
  const roofT = tentTex('#e8322f', '#ffffff'); roofT.repeat.set(3, 1); const roof = add(prismG(19, 2.4, 9), new THREE.MeshStandardMaterial({ map: roofT, roughness: 0.4 }), 0, 5.8, 2.0, STA); roof.rotation.y = Math.PI / 2; roof.scale.set(9 / 19 * 1, 1, 19 / 9 * 1);
  const [c, g] = cv(1024, 256); g.fillStyle = '#1f3a8a'; g.fillRect(0, 0, 1024, 256); g.strokeStyle = '#f2c94a'; g.lineWidth = 16; g.strokeRect(12, 12, 1000, 232); g.fillStyle = '#ffd84a'; g.font = '900 140px Arial Black'; g.textAlign = 'center'; g.fillText('THE LOOP', 512, 180);
  const sg = add(box(10, 2.4, 0.2), new THREE.MeshStandardMaterial({ map: P.tex(c), roughness: 0.4 }), 0, 9.0, 6.6, STA); for (let x = -8.5; x <= 8.5; x += 0.85) { const b = add(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshStandardMaterial({ color: '#fff0c0', emissive: '#ffc060', emissiveIntensity: 1.2 }), x, 4.6, 5.9, STA, false); b.userData.ndSkip = true; LAMPS.push(b); } }
// carousel
const CARO = new THREE.Group(); CARO.position.set(12, 0, 30); scene.add(CARO); { add(cyl(6, 6, 0.6, 40), std({ color: '#f4e8d8', roughness: 0.4 }), 0, 0.3, 0, CARO); const rT = tentTex('#e87ab8', '#ffffff'); add(new THREE.ConeGeometry(6.8, 3, 40), new THREE.MeshStandardMaterial({ map: rT, roughness: 0.35 }), 0, 6.3, 0, CARO); add(cyl(6.6, 6.6, 0.6, 40), std({ color: '#f2c94a', metalness: 0.6, roughness: 0.25 }), 0, 4.6, 0, CARO); add(cyl(0.9, 0.9, 4.2, 16), std({ color: '#e8322f', roughness: 0.3 }), 0, 2.6, 0, CARO);
  const RIDE = new THREE.Group(); CARO.add(RIDE); CARO.userData.ride = RIDE; const hc = ['#ffffff', '#f2c94a', '#8ad0ff', '#ffb0d0']; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; const h = new THREE.Group(); h.position.set(Math.cos(a) * 4.6, 0, Math.sin(a) * 4.6); h.rotation.y = -a; RIDE.add(h); add(cyl(0.05, 0.05, 4.0, 6), steel('#f2c94a'), 0, 2.6, 0, h); const bm = std({ color: hc[k % 4], roughness: 0.3 }); add(box(0.35, 0.5, 1.3), bm, 0, 1.6, 0, h); add(box(0.3, 0.6, 0.35), bm, 0, 2.0, 0.65, h).rotation.x = -0.4; for (const z of [-0.45, 0.45]) for (const x of [-0.12, 0.12]) add(cyl(0.05, 0.05, 0.7, 6), bm, x, 1.1, z, h); }
  for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; const b = add(new THREE.SphereGeometry(0.11, 6, 4), new THREE.MeshStandardMaterial({ color: '#fff4c0', emissive: '#ffd060', emissiveIntensity: 1.5 }), Math.cos(a) * 6.65, 4.3, Math.sin(a) * 6.65, CARO, false); b.userData.ndSkip = true; LAMPS.push(b); } }
// food stalls
const stall = (x, z, ry, col, txt) => { const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = ry; scene.add(G); add(box(3, 2.2, 2), std({ color: '#fff4e8', roughness: 0.5 }), 0, 1.1, 0, G); add(box(3.2, 0.15, 2.4), std({ color: col }), 0, 2.25, 0.2, G); const aw = add(box(3.4, 0.08, 1.4), new THREE.MeshStandardMaterial({ map: tentTex(col, '#ffffff'), roughness: 0.4 }), 0, 2.4, 1.4, G); aw.rotation.x = 0.35;
  const [c, g] = cv(512, 128); g.fillStyle = col; g.fillRect(0, 0, 512, 128); g.fillStyle = '#ffffff'; g.font = '900 78px Arial Black'; g.textAlign = 'center'; g.fillText(txt, 256, 96); add(box(3.0, 0.7, 0.1), new THREE.MeshStandardMaterial({ map: P.tex(c), roughness: 0.4 }), 0, 3.0, 1.0, G); add(box(2.6, 0.9, 0.5), std({ color: col, roughness: 0.4 }), 0, 0.45, 1.1, G); return G; };
stall(-13.5, 14, Math.PI / 2, '#e8322f', 'POPCORN'); stall(1.5, 18, -Math.PI / 2, '#2a8ae8', 'CANDY'); stall(-13.5, 26, Math.PI / 2, '#3ab86a', 'LEMONADE'); stall(1.5, 32, -Math.PI / 2, '#f2a020', 'HOT DOGS');
// flower beds + white picket fences along the path
{ const fl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 6, 4), std({ color: '#ffffff', roughness: 0.5 }), 900); const cols = ['#e8322f', '#f2c94a', '#ff7ab8', '#ffffff', '#a86ae8']; const m4 = new THREE.Matrix4(), col = new THREE.Color(); for (let i = 0; i < 900; i++) { const side = i % 2 ? 1 : -1; const z = -8 + (i / 900) * 90; const x = -6 + side * (4.4 + ((i * 0.37) % 1) * 0.6); m4.makeTranslation(x, 0.15, z + ((i * 0.61) % 1) * 0.4); fl.setMatrixAt(i, m4); fl.setColorAt(i, col.set(cols[i % 5])); } scene.add(fl);
  const fm = std({ color: '#fbfbf6', roughness: 0.5 }); const pick = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.8, 0.12), fm, 700); let n = 0; for (const s of [-1, 1]) for (let z = -8; z < 80 && n < 700; z += 0.25) { m4.makeTranslation(-6 + s * 5.4, 0.4, z); pick.setMatrixAt(n++, m4); } pick.count = n; scene.add(pick); for (const s of [-1, 1]) add(box(0.06, 0.08, 88), fm, -6 + s * 5.4, 0.6, 36); }


// ---- luxury upgrades: grand entrance pavilion, fountain, swing ride, drop tower, string lights ----
const GOLD = std({ color: '#f2c24a', metalness: 1, roughness: 0.18, envMapIntensity: 1.6 }), CREAM = std({ color: '#fff6ea', roughness: 0.35, envMapIntensity: 1.2 }), ROSE = std({ color: '#e85a7a', roughness: 0.3, envMapIntensity: 1.2 });
const PAV = new THREE.Group(); PAV.position.set(-6, 0, 72); scene.add(PAV); { add(box(26, 8, 8), CREAM, 0, 4, 0, PAV); add(box(26.6, 0.5, 8.6), GOLD, 0, 8.2, 0, PAV); add(box(26.6, 0.4, 8.6), GOLD, 0, 0.2, 0, PAV);
  for (const x of [-12, 12]) { add(cyl(2.2, 2.4, 14, 20), CREAM, x, 7, 0, PAV); add(cyl(2.5, 2.5, 0.4, 20), GOLD, x, 14.2, 0, PAV); const dm = add(new THREE.SphereGeometry(2.4, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), ROSE, x, 14.3, 0, PAV); add(cyl(0.12, 0.05, 2.2, 8), GOLD, x, 17.7, 0, PAV); add(new THREE.SphereGeometry(0.3, 12, 8), GOLD, x, 18.9, 0, PAV); }
  const cd = add(new THREE.SphereGeometry(4.2, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), ROSE, 0, 8.4, 0, PAV); add(cyl(0.18, 0.06, 3, 8), GOLD, 0, 13.5, 0, PAV);
  for (let k = -5; k <= 5; k++) { if (Math.abs(k) < 1) continue; const x = k * 2.0; const w = add(box(1.3, 3.2, 0.2), std({ color: '#3a6ad8', roughness: 0.05, metalness: 0.4, envMapIntensity: 1.6 }), x, 4.6, -4.05, PAV, false); add(new THREE.CircleGeometry(0.65, 16, 0, Math.PI), std({ color: '#3a6ad8', roughness: 0.05, metalness: 0.4 }), x, 6.2, -4.16, PAV, false).rotation.y = Math.PI; add(box(1.5, 0.15, 0.3), GOLD, x, 2.9, -4.1, PAV); }
  add(box(5, 6, 0.3), std({ color: '#7a1f2a', roughness: 0.4 }), 0, 3, -4.1, PAV); for (let x = -12.5; x <= 12.5; x += 0.7) { const b = add(new THREE.SphereGeometry(0.1, 6, 4), new THREE.MeshStandardMaterial({ color: '#fff4c0', emissive: '#ffd060', emissiveIntensity: 1.4 }), x, 8.55, -4.4, PAV, false); b.userData.ndSkip = true; LAMPS.push(b); } }
const FOUNT = new THREE.Group(); FOUNT.position.set(-6, 0, 56); scene.add(FOUNT); { const stone = CREAM, water = std({ color: '#4ab0f0', roughness: 0.02, metalness: 0.2, envMapIntensity: 1.8, transparent: true, opacity: 0.85 });
  add(cyl(4.2, 4.4, 0.9, 40), stone, 0, 0.45, 0, FOUNT); add(cyl(3.9, 3.9, 0.1, 40), water, 0, 0.82, 0, FOUNT); add(new THREE.TorusGeometry(4.25, 0.12, 8, 40), GOLD, 0, 0.92, 0, FOUNT).rotation.x = Math.PI / 2; add(cyl(0.5, 0.7, 2.4, 16), stone, 0, 1.6, 0, FOUNT); add(cyl(2.0, 1.2, 0.4, 32), stone, 0, 2.9, 0, FOUNT); add(cyl(1.8, 1.8, 0.08, 32), water, 0, 3.08, 0, FOUNT); add(cyl(0.3, 0.4, 1.6, 12), stone, 0, 3.8, 0, FOUNT); add(cyl(1.0, 0.6, 0.3, 24), GOLD, 0, 4.7, 0, FOUNT);
  FOUNT.userData.jets = []; for (let k = 0; k < 10; k++) { const j = add(new THREE.SphereGeometry(0.09, 6, 4), std({ color: '#d8f0ff', emissive: '#6ab8f0', emissiveIntensity: 0.4, transparent: true, opacity: 0.8 }), 0, 0, 0, FOUNT, false); j.userData.ndSkip = true; FOUNT.userData.jets.push(j); } }
const SWING = new THREE.Group(); SWING.position.set(18, 0, 50); scene.add(SWING); { add(cyl(0.6, 0.9, 16, 16), GOLD, 0, 8, 0, SWING); const top = new THREE.Group(); top.position.y = 15; SWING.add(top); SWING.userData.top = top; add(new THREE.ConeGeometry(5, 2.2, 32), new THREE.MeshStandardMaterial({ map: tentTex('#2a8ae8', '#ffffff'), roughness: 0.35 }), 0, 1.4, 0, top); add(cyl(5.1, 5.1, 0.4, 32), GOLD, 0, 0.2, 0, top);
  const sc = ['#e8322f', '#f2c94a', '#3ac85a', '#e87ab8']; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const arm = new THREE.Group(); arm.position.set(Math.cos(a) * 4.8, 0, Math.sin(a) * 4.8); arm.userData.a = a; top.add(arm); add(cyl(0.02, 0.02, 5, 4), std({ color: '#3a3a3a' }), 0, -2.5, 0, arm); add(box(0.6, 0.12, 0.6), std({ color: sc[k % 4], roughness: 0.3 }), 0, -5, 0, arm); } }
const DROP = new THREE.Group(); DROP.position.set(-30, 0, 52); scene.add(DROP); { add(box(1.6, 34, 1.6), steel('#e8322f'), 0, 17, 0, DROP); add(box(2.4, 1, 2.4), GOLD, 0, 34.5, 0, DROP); const car = new THREE.Group(); DROP.add(car); DROP.userData.car = car; add(new THREE.TorusGeometry(2.0, 0.4, 10, 24), steel('#f2c94a'), 0, 0, 0, car).rotation.x = Math.PI / 2;
  for (let y = 2; y < 34; y += 1.5) for (const s of [-1, 1]) { const b = add(new THREE.SphereGeometry(0.12, 6, 4), new THREE.MeshStandardMaterial({ color: '#fff4c0', emissive: '#ffd060', emissiveIntensity: 1.2 }), s * 0.85, y, 0.85, DROP, false); b.userData.ndSkip = true; LAMPS.push(b); } }
{ const cols = ['#ff6a6a', '#ffe070', '#7ad8ff', '#a0ff8a', '#ff9ae0']; const n = 22 * 9; const sb = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.0, roughness: 0.2 }), n); const m4 = new THREE.Matrix4(), c = new THREE.Color(); let i = 0;
  for (let z = -4; z < 82 && i < n; z += 10) for (let k = 0; k < 22 && i < n; k++) { const t = k / 21; m4.makeTranslation(-11 + t * 10, 4.4 - Math.sin(t * Math.PI) * 0.9, z + 5); sb.setMatrixAt(i, m4); sb.setColorAt(i, c.set(cols[k % 5])); i++; } sb.count = i; sb.userData.ndSkip = true; scene.add(sb); window.__SB = sb; }

// GRAND OPENING arch + OPENING TOMORROW banner
const ARCH = new THREE.Group(); ARCH.position.set(-6, 0, 40); scene.add(ARCH); { for (const s of [-1, 1]) add(cyl(0.3, 0.35, 7, 12), steel('#f4f4fa'), s * 4.5, 3.5, 0, ARCH); const [c, g] = cv(1024, 192); g.fillStyle = '#c8282a'; g.fillRect(0, 0, 1024, 192); g.strokeStyle = '#f2c94a'; g.lineWidth = 14; g.strokeRect(10, 10, 1004, 172); g.fillStyle = '#ffffff'; g.font = '900 104px Arial Black'; g.textAlign = 'center'; ARCH.userData.ctx = [c, g];
  const ban = add(box(10, 1.9, 0.2), [std({ color: '#c8282a' }), std({ color: '#c8282a' }), std({ color: '#c8282a' }), std({ color: '#c8282a' }), new THREE.MeshStandardMaterial({ map: P.tex(c), roughness: 0.4 }), null], 0, 6.6, 0, ARCH); ban.material[5] = ban.material[4]; ARCH.userData.ban = ban;
  ARCH.userData.setText = (txt) => { g.fillStyle = '#c8282a'; g.fillRect(20, 20, 984, 152); g.fillStyle = '#ffffff'; g.font = `900 ${txt.length > 14 ? 84 : 104}px Arial Black`; g.fillText(txt, 512, 130); ban.material[4].map.needsUpdate = true; }; ARCH.userData.setText('GRAND OPENING'); }
// balloons
const BALL = []; for (let i = 0; i < 10; i++) { const r = R(800 + i * 31); const b = add(new THREE.SphereGeometry(0.45, 14, 10), std({ color: ['#e8322f', '#f2c94a', '#2a8ae8', '#e87ab8'][i % 4], roughness: 0.15, envMapIntensity: 1.4 }), -12 + (i % 5) * 1.2, 5.5 + (i % 3) * 0.6, 38 + Math.floor(i / 5) * 2, scene); b.scale.y = 1.2; BALL.push(b); }
// trees + hills
const TREEM = std({ color: '#3aa84a', roughness: 0.6 }); for (let i = 0; i < 40; i++) { const r = R(5000 + i * 17); const a = i * 2.39996, rr = 60 + (i % 7) * 12; const x = Math.cos(a) * rr, z = Math.sin(a) * rr - 10; const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(1 + (i % 4) * 0.3); scene.add(g); add(cyl(0.2, 0.3, 3, 8), std({ color: '#5a3a24' }), 0, 1.5, 0, g); for (let k = 0; k < 4; k++) add(new THREE.IcosahedronGeometry(1.4 + (k % 2) * 0.4, 1), TREEM, Math.sin(k * 2.1) * 1.1, 3.6 + k * 0.5, Math.cos(k * 1.7) * 1.1, g); }
for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const h = add(new THREE.SphereGeometry(70, 18, 10), std({ color: '#6ac85a', roughness: 0.9 }), Math.cos(a) * 260, -45, Math.sin(a) * 260, scene, false); h.scale.y = 0.45; }
// crowd stand-ins handled as cards; dummy + sandbag
// ---- road for the hairpin explainer (x = 200) ----
ZONE = 'road';
const ROADG = new THREE.Group(); ROADG.position.set(200, 0, 0); scene.add(ROADG);
{ const asph = (() => { const [c, g] = cv(256, 256); g.fillStyle = '#4a4a52'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); } return P.tex(c); })(); asph.wrapS = asph.wrapT = THREE.RepeatWrapping;
  const pts = []; for (let k = 0; k <= 60; k++) { const t = k / 60; const a = t * Math.PI; pts.push(new THREE.Vector3(Math.sin(a) * 12 - 0, 0, -Math.cos(a) * 12 + 0)); } pts.unshift(new THREE.Vector3(-30, 0, -12)); pts.push(new THREE.Vector3(-30, 0, 12));
  const rc = new THREE.CatmullRomCurve3(pts); ROADG.userData.curve = rc; const pos = [], idx = [], uv = []; const N = 160; for (let i = 0; i <= N; i++) { const u = i / N; const p = rc.getPointAt(u), tg = rc.getTangentAt(u); const n = new THREE.Vector3(-tg.z, 0, tg.x); for (const s of [-1, 1]) { const q = p.clone().addScaledVector(n, s * 3.5); pos.push(q.x, 0.03, q.z); uv.push((s + 1) / 2, u * 20); } if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); rg.setIndex(idx); rg.computeVertexNormals(); const road = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: asph, roughness: 0.6, side: THREE.DoubleSide })); road.receiveShadow = true; ROADG.add(road);
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(0.18, 0.02, 1.2), std({ color: '#f2c94a', emissive: '#806010', emissiveIntensity: 0.3 }), 60); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(); for (let i = 0; i < 60; i++) { const u = i / 60; const p = rc.getPointAt(u), tg = rc.getTangentAt(u); q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tg); m4.compose(new THREE.Vector3(p.x, 0.05, p.z), q, new THREE.Vector3(1, 1, 1)); dash.setMatrixAt(i, m4); } ROADG.add(dash);
  const sg = new THREE.Group(); sg.position.set(-8, 0, -18); ROADG.add(sg); add(cyl(0.06, 0.06, 2.6, 8), steel('#c8c8d0'), 0, 1.3, 0, sg); const [c, g] = cv(256, 256); g.fillStyle = '#f2c020'; g.save(); g.translate(128, 128); g.rotate(Math.PI / 4); g.fillRect(-88, -88, 176, 176); g.strokeStyle = '#1a1a1a'; g.lineWidth = 10; g.strokeRect(-80, -80, 160, 160); g.restore(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); g.moveTo(100, 190); g.lineTo(100, 110); g.arc(128, 110, 28, Math.PI, 0); g.lineTo(156, 150); g.stroke(); g.beginPath(); g.moveTo(140, 140); g.lineTo(156, 160); g.lineTo(172, 140); g.stroke();
  const sign = add(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshStandardMaterial({ map: P.tex(c), transparent: true, side: THREE.DoubleSide }), 0, 2.6, 0, sg, false); sign.rotation.y = 0.6; }
// sedan for the road
const CAR = new THREE.Group(); scene.add(CAR); { const paint = std({ color: '#3ac8b8', roughness: 0.15, metalness: 0.4, envMapIntensity: 1.6 }), chrome = steel('#f4f4fa'), glass = std({ color: '#9ad0ff', roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.7 });
  add(box(1.9, 0.6, 4.6), paint, 0, 0.75, 0, CAR); add(box(1.7, 0.55, 2.2), paint, 0, 1.3, -0.2, CAR); add(box(1.62, 0.45, 2.1), glass, 0, 1.32, -0.2, CAR); add(box(1.95, 0.18, 0.2), chrome, 0, 0.55, 2.32, CAR); add(box(1.95, 0.18, 0.2), chrome, 0, 0.55, -2.32, CAR);
  for (const s of [-1, 1]) { add(cyl(0.16, 0.16, 0.1, 12), std({ color: '#fff4d0', emissive: '#a08040', emissiveIntensity: 0.6 }), s * 0.65, 0.85, 2.3, CAR).rotation.x = Math.PI / 2; } CAR.userData.wheels = []; for (const s of [-1, 1]) for (const z of [1.4, -1.4]) { const w = add(cyl(0.38, 0.38, 0.3, 16), std({ color: '#1a1a1a', roughness: 0.8 }), s * 0.92, 0.38, z, CAR); w.rotation.z = Math.PI / 2; add(cyl(0.2, 0.2, 0.32, 12), chrome, s * 0.93, 0.38, z, CAR).rotation.z = Math.PI / 2; CAR.userData.wheels.push(w); }
  CAR.traverse((o) => { if (o.isMesh) o.castShadow = true; }); }
ZONE = 'fx';

const rainTex = (() => { const [c, g] = cv(16, 128); const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(220,235,255,0)'); gr.addColorStop(0.5, 'rgba(220,235,255,.7)'); gr.addColorStop(1, 'rgba(220,235,255,0)'); g.fillStyle = gr; g.fillRect(6, 0, 4, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const RAIN = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: rainTex, transparent: true, depthWrite: false, fog: false }), 900); RAIN.frustumCulled = false; RAIN.userData.ndSkip = true; RAIN.renderOrder = 4; RAIN.visible = false; scene.add(RAIN);



ZONE = 'fx';
const dustTex = (() => { const [c, g] = cv(128, 128); for (let i = 0; i < 9; i++) { const x = 34 + (i * 37) % 60, y = 34 + (i * 53) % 60, gr = g.createRadialGradient(x, y, 0, x, y, 34); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const DUST = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: dustTex, transparent: true, depthWrite: false, color: '#f0e8f8', fog: true })); m.userData.ndSkip = true; m.renderOrder = 3; m.visible = false; scene.add(m); DUST.push(m); }
const flakeTex = glowTex('255,255,255');
const SNOWF = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: flakeTex, transparent: true, depthWrite: false, fog: true, opacity: 0.95 }), 1400); SNOWF.frustumCulled = false; SNOWF.userData.ndSkip = true; SNOWF.renderOrder = 4; SNOWF.visible = false; scene.add(SNOWF);
const MOTES = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex('255,230,200'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.userData.ndSkip = true; m.renderOrder = 5; m.visible = false; scene.add(m); MOTES.push(m); }


// ================= light presets =================
const skyEnv = (top, hor, gnd, sun) => { const [c, g] = cv(512, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.5, hor); gr.addColorStop(0.52, gnd); gr.addColorStop(1, gnd); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  g.fillStyle = sun; g.beginPath(); g.ellipse(380, 90, 30, 22, 0, 0, 7); g.fill(); const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return pmrem.fromEquirectangular(t).texture; };
const DAYENV = skyEnv('#2a6ae0', '#e0f0ff', '#5a9a4a', '#ffffff'), NIGHTENV = skyEnv('#0a1440', '#2a3a80', '#1a2a3a', '#d8e0ff');
const PRESET = {
  day: { hemi: ['#d8ecff', '#6a9a5a', 1.5], key: ['#fff4e0', 4.2], fog: ['#b8dcff', 0.0005], sky: 1, sun: [0.55, 0.65, 0.5], expo: 1.04, lamps: 0, sat: 1.38, env: DAYENV, bloomK: 0.6, thr: 1.12, rays: 0.3, zone: 'park' },
  night: { hemi: ['#6a88d8', '#1a2a3a', 1.2], key: ['#a8b8ff', 1.4], fog: ['#162a5a', 0.004], sky: 6, sun: [0.3, 0.7, -0.6], expo: 1.15, lamps: 1, sat: 1.3, env: NIGHTENV, bloomK: 1.2, thr: 0.85, rays: 0, zone: 'park' },
  road: { hemi: ['#d8ecff', '#6a9a5a', 1.5], key: ['#fff4e0', 4.2], fog: ['#b8dcff', 0.0005], sky: 1, sun: [0.55, 0.65, 0.5], expo: 1.04, lamps: 0, sat: 1.38, env: DAYENV, bloomK: 0.6, thr: 1.12, rays: 0.25, zone: 'road' },
};
// ================= per-frame =================
import { stateAt, TOTAL } from './shots.js';
const camR = new THREE.Vector3(), M4 = new THREE.Matrix4(), SC = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3();
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
window.renderFrame = (f) => {
  const S = stateAt(f, {}), t = f / 30;
  const L = PRESET[S.preset || 'summer'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2]; moon.color.set(L.key[0]); moon.intensity = S.key ?? L.key[1];
  scene.fog.color.set(L.fog[0]); scene.fog.density = S.fog ?? L.fog[1]; skyU.day.value = L.sky; skyU.sunD.value.set(...L.sun); scene.environment = L.env;
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(0, 0, 0); inkU.flash.value = S.flash || 0; inkU.bloomK.value = S.bloomK ?? L.bloomK; brightU.thr.value = S.thr ?? L.thr; inkU.split.value = 0; inkU.greenK.value = 0;
  const zone = L.zone; for (const l of pLights) { l.visible = L.lamps > 0 && l.userData.zone === zone; l.intensity = l.userData.I0; } for (const g of glows) g.visible = (L.lamps > 0 && g.userData.zone === zone) || g.userData.zone === 'fx';
  // coaster shape (rebuild when changed), carts, park
  const k1 = S.k1 ?? 0, k2 = S.k2 ?? 0, key = k1.toFixed(3) + ':' + k2.toFixed(3); if (key !== coasterKey) { buildCoaster(COASTER, k1, k2); coasterKey = key; }
  const placeCart = (G, track, u, rot = 0) => { G.visible = u != null; if (u == null) return; const fr = track.userData.frames; const i = Math.max(0, Math.min(fr.length - 1, Math.round(u * (fr.length - 1)))); const f = fr[i]; const basis = new THREE.Matrix4().makeBasis(f.side, f.up, f.tg); G.quaternion.setFromRotationMatrix(basis); G.position.copy(f.p).add(track.position); if (rot) G.rotateZ(rot); };
  placeCart(CART, COASTER, S.cart ?? null); placeCart(RCART, RIVAL, S.rcart ?? null, S.rcartRot || 0); if (S.cartCrush) { RCART.scale.set(1.3, 0.45, 1.1); } else RCART.scale.set(1, 1, 1);
  FERRIS.userData.wheel.rotation.z = t * 0.12; CARO.userData.ride.rotation.y = t * 0.5; SWING.userData.top.rotation.y = t * 0.9; SWING.userData.top.children.forEach((a) => { if (a.userData.a != null) a.rotation.set(0, 0, 0.5); }); DROP.userData.car.position.y = 4 + (Math.sin(t * 0.7) * 0.5 + 0.5) * 26; FOUNT.userData.jets.forEach((j, k) => { const a = k / 10 * Math.PI * 2, ph = (t * 1.2 + k * 0.1) % 1; j.position.set(Math.cos(a) * ph * 1.6, 5 + Math.sin(ph * Math.PI) * 1.6 - ph * 2.5, Math.sin(a) * ph * 1.6); }); FERRIS.userData.gond.forEach((g, k) => { const a = k / 16 * Math.PI * 2 + t * 0.12; g.position.set(-Math.sin(a) * 13, 15 + Math.cos(a) * 13 - 0.2, 0); });
  const night = (S.preset === 'night'); LAMPS.forEach((b) => (b.material.emissiveIntensity = night ? 3.0 : 0.6)); if (window.__SB) window.__SB.material.emissiveIntensity = night ? 2.4 : 0.5; FERRIS.userData.bulbs.material.emissiveIntensity = night ? 3.2 : 1.0;
  if (S.arch && S.arch !== ARCH.userData.txt) { ARCH.userData.setText(S.arch); ARCH.userData.txt = S.arch; }
  BALL.forEach((b, i) => (b.position.y = 5.5 + (i % 3) * 0.6 + Math.sin(t * 1.3 + i) * 0.15));
  CAR.visible = !!S.car; if (S.car) { const rc = ROADG.userData.curve; const p = rc.getPointAt(Math.min(0.999, S.car.u)), tg = rc.getTangentAt(Math.min(0.999, S.car.u)); CAR.position.set(p.x + 200, (S.car.y || 0), p.z); CAR.rotation.set(S.car.pitch || 0, Math.atan2(tg.x, tg.z) + (S.car.yaw || 0), S.car.roll || 0); CAR.userData.wheels.forEach((w) => (w.rotation.x = S.car.u * 60)); }
  // camera
  const sh = S.shake || 0, hh = S.handheld ?? 0.012; let look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  if (S.orbit) { const d = pos.clone().sub(look); d.applyAxisAngle(new THREE.Vector3(0, 1, 0), S.orbit); pos.copy(look).add(d); }
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look.x + (rnd(f, 3) - 0.5) * sh * 1.5, look.y + (rnd(f, 4) - 0.5) * sh * 1.5, look.z); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); camR.setFromMatrixColumn(camera.matrixWorld, 0); sky.position.copy(camera.position);
  const fc = S.shadowAt ? S.shadowAt : [look.x, look.y, look.z], sd = new THREE.Vector3(...L.sun).normalize(); moon.position.set(fc[0] + sd.x * 60, fc[1] + Math.max(sd.y, 0.25) * 60, fc[2] + sd.z * 60); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 18; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 220; sc.updateProjectionMatrix(); }
  { const sv = sd.clone().multiplyScalar(500).add(camera.position).project(camera); inkU.sunUV.value.set(sv.x * 0.5 + 0.5, sv.y * 0.5 + 0.5); inkU.raysK.value = sv.z < 1 ? (S.rays ?? L.rays) : 0; }
  // rain / snow / dust
  RAIN.visible = !!S.rain; if (RAIN.visible) { const k = S.rain; const cq = camera.quaternion; for (let i = 0; i < RAIN.count; i++) { const fall = ((t * 1.6 * (0.7 + rnd(i, 5)) + rnd(i, 1)) % 1); V.set((rnd(i, 2) - 0.5) * 24, 9 - fall * 18, -3 - rnd(i, 3) * 16).applyQuaternion(cq).add(camera.position);
      M4.compose(V, cq, SC.set(0.03, (0.6 + rnd(i, 4) * 0.5) * (i < RAIN.count * k ? 1 : 0), 1)); RAIN.setMatrixAt(i, M4); } RAIN.instanceMatrix.needsUpdate = true; }
  SNOWF.visible = !!S.snow; if (SNOWF.visible) { const k = S.snow; for (let i = 0; i < SNOWF.count; i++) { const fall = ((t * 0.12 * (0.6 + rnd(i, 5)) + rnd(i, 1)) % 1); V.set(camera.position.x + (rnd(i, 2) - 0.5) * 20 + Math.sin(t * 0.7 + i) * 0.4, camera.position.y + 6 - fall * 12, camera.position.z + (rnd(i, 3) - 0.5) * 20); const dcam = V.distanceTo(camera.position);
      M4.compose(V, camera.quaternion, SC.setScalar((0.035 + rnd(i, 4) * 0.04) * (i < SNOWF.count * k && dcam > 2.5 ? 1 : 0))); SNOWF.setMatrixAt(i, M4); } SNOWF.instanceMatrix.needsUpdate = true; }
  DUST.forEach((m, i) => { const em = (S.dust || [])[i % Math.max(1, (S.dust || []).length)]; m.visible = !!em && i < (S.dustN ?? 30); if (!m.visible) return; const a = ((t * (em.rate || 1)) + rnd(i, 3)) % 1;
    m.position.set(em.p[0] + (rnd(i, 4) - 0.5) * (em.w || 2), em.p[1] + 0.2 + a * (em.h || 1.2), em.p[2] + (rnd(i, 5) - 0.5) * (em.w || 2)); m.scale.setScalar((0.6 + a * 2.4) * (em.s || 1)); m.quaternion.copy(camera.quaternion); m.material.opacity = (1 - a) * (em.k ?? 0.45); m.material.color.set(em.col || '#f0e8f8'); });
  MOTES.forEach((m) => (m.visible = false));
  for (const g of glows) { g.quaternion.copy(camera.quaternion); g.material.opacity = g.userData.k0 * Math.exp(-g.position.distanceTo(camera.position) * 0.04); }
  if (bang.userData.g) { bang.userData.g.quaternion.copy(camera.quaternion); } bang.visible = false; bangLight.intensity = 0;
  if (S.bang) { bang.visible = true; const bp = new THREE.Vector3(...S.bang.p); bang.position.copy(bp); bang.scale.setScalar(S.bang.s || 1); bangLight.position.copy(bp); bangLight.intensity = 30 * (S.bang.k ?? 1); }
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw, !a.fx); c.mesh.visible = true; let px = a.x, py = a.y, pz = a.z; if (a.onCart) { const G = a.onCart === 'R' ? RCART : CART; const o = new THREE.Vector3(a.x || 0, a.y || 0.3, a.z || -0.4).applyQuaternion(G.quaternion).add(G.position); px = o.x; py = o.y; pz = o.z; }
    c.mesh.position.set(px, py, pz); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s * (a.scaleY || 1), s);
    c.mesh.rotation.set(0, a.yaw ?? Math.atan2(camera.position.x - px, camera.position.z - pz), a.roll || 0); c.mat.color.set(a.tint || S.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2; c.mesh.castShadow = !a.fx;
    c.blob.visible = !a.fx && a.blob !== false; c.blob.position.set(px, (a.ground ?? py) + 0.015, pz); c.blob.scale.set(1.0 * s, 0.55 * s, 1); });
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.autoUpdate = false; swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false); scene.fog = fog; renderer.shadowMap.autoUpdate = true;
  renderer.setRenderTarget(rtB1); renderer.render(brightScene, fsCam);
  for (let k = 0; k < 3; k++) { const r = 1 + k * 1.2; blurU.src.value = rtB1.texture; blurU.dir.value.set(r / (W / 2), 0); renderer.setRenderTarget(rtB2); renderer.render(blurScene, fsCam); blurU.src.value = rtB2.texture; blurU.dir.value.set(0, r / (H / 2)); renderer.setRenderTarget(rtB1); renderer.render(blurScene, fsCam); }
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = 5; dofU.cinf.value = 0; dofU.haze.value = 0; dofU.time.value = t; renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;

window.ready = true;
