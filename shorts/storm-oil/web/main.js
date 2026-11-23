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

const NAMES = ['Barrel_01', 'wooden_barrels_01', 'wooden_crate_01', 'wooden_crate_02', 'Lantern_01', 'wooden_bucket_01', 'barrel_stove', 'wooden_bowl_01'];
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
const PBRN = ['wood_planks_dirt', 'weathered_planks', 'weathered_brown_planks', 'old_planks_02', 'fine_grained_wood', 'rock_boulder_dry'];
await Promise.all(PBRN.flatMap((n) => ['diff', 'nor', 'rough'].map((k) => new Promise((res) => TXL.load(`tex/${n}_${k}.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (k === 'diff') t.colorSpace = THREE.SRGBColorSpace; TX[n + k] = t; res(); }, undefined, () => res())))));
const pbr = (n, rep, o = {}) => { const r = Array.isArray(rep) ? rep : [rep, rep]; const cl = (t) => { const c = t.clone(); c.repeat.set(r[0], r[1]); c.needsUpdate = true; return c; };
  return new THREE.MeshStandardMaterial({ map: cl(TX[n + 'diff']), normalMap: cl(TX[n + 'nor']), roughnessMap: cl(TX[n + 'rough']), roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2), ...o }); };
const R = (s) => P.rng(s);
ZONE = 'town';
// ================= SEA WORLD =================
ZONE = 'sea';
// ---- ocean: CPU-displaced grid that follows the camera ----
const SEA = { amp: 0.3, chop: 0.3, t: 0, oil: 0, ox: 0, oz: 0, or: 0, wave: null };
const pk = (th) => { const s = 0.5 + 0.5 * Math.sin(th); return s * s * 1.6 - 0.55; };
const seaH = (x, z, t) => { const a = SEA.amp; let h = a * (0.62 * pk(x * 0.16 + z * 0.21 + t * 1.3) + 0.45 * pk(-x * 0.24 + z * 0.27 + t * 1.6 + 1.3) + 0.3 * pk(x * 0.41 - z * 0.33 + t * 2.2 + 2.1) + 0.25 * Math.sin(x * 0.07 + z * 0.05 + t * 0.7))
    + SEA.chop * a * (0.14 * Math.sin(x * 0.9 + z * 0.63 + t * 3.6) + 0.1 * Math.sin(-x * 0.77 + z * 1.05 + t * 4.2));
  if (SEA.oil > 0) { const d = Math.hypot(x - SEA.ox, z - SEA.oz); const m = 1 - Math.min(1, Math.max(0, (d - SEA.or) / 6)); h *= 1 - 0.85 * SEA.oil * m; }
  const w = SEA.wave; if (w) { const dz = z - w.z; h += w.h * 0.35 * Math.exp(-dz * dz / ((w.w || 14) * (w.w || 14))) * (1 - Math.min(1, Math.abs(x - (w.x || 0)) / 90)); }
  return h; };
const OCN = 180, OSZ = 240; const ocGeo = new THREE.PlaneGeometry(OSZ, OSZ, OCN, OCN); ocGeo.rotateX(-Math.PI / 2);
const ocCol = new Float32Array(ocGeo.attributes.position.count * 3); ocGeo.setAttribute('color', new THREE.BufferAttribute(ocCol, 3));
const ocBase = ocGeo.attributes.position.array.slice();
const OCEAN = new THREE.Mesh(ocGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.22, metalness: 0.0, envMapIntensity: 0.55 })); OCEAN.receiveShadow = true; OCEAN.userData.ndSkip = true; scene.add(OCEAN);
const SEACOL = { deep: new THREE.Color('#0a3aa8'), crest: new THREE.Color('#1aa0f0'), foam: new THREE.Color('#e8f6ff'), oil: new THREE.Color('#58c0f8') };
const updOcean = (cx, cz, t, deepC, crestC) => { const step = OSZ / OCN; const gx = Math.round(cx / step) * step, gz = Math.round(cz / step) * step; OCEAN.position.set(gx, 0, gz);
  const p = ocGeo.attributes.position.array, A = Math.max(0.2, SEA.amp); const tmp = new THREE.Color();
  for (let i = 0; i < p.length; i += 3) { const x = ocBase[i] + gx, z = ocBase[i + 2] + gz; const h = seaH(x, z, t); p[i + 1] = h;
    const k = Math.min(1, Math.max(0, h / (A * 1.2) * 0.55 + 0.45)); tmp.copy(deepC).lerp(crestC, k * k * k); const fo = Math.max(0, (h / A - 0.75) * 2.2) * Math.min(1, SEA.chop + 0.2); tmp.lerp(SEACOL.foam, Math.min(0.9, fo * 1.4));
    if (SEA.oil > 0) { const d = Math.hypot(x - SEA.ox, z - SEA.oz); const m = (1 - Math.min(1, Math.max(0, (d - SEA.or * 0.7) / 5))) * SEA.oil; tmp.lerp(SEACOL.oil, m * 0.55); }
    ocCol[i] = tmp.r; ocCol[i + 1] = tmp.g; ocCol[i + 2] = tmp.b; }
  ocGeo.attributes.position.needsUpdate = true; ocGeo.attributes.color.needsUpdate = true; ocGeo.computeVertexNormals(); };
// ---- the giant wave: a curling sheet across x, travelling +z ----
const WV = new THREE.Group(); scene.add(WV); WV.visible = false;
const WAVEN = [60, 28]; const wvGeo = new THREE.PlaneGeometry(1, 1, WAVEN[0], WAVEN[1]); const wvCol = new Float32Array(wvGeo.attributes.position.count * 3); wvGeo.setAttribute('color', new THREE.BufferAttribute(wvCol, 3));
const WAVE = new THREE.Mesh(wvGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, envMapIntensity: 0.6, side: THREE.DoubleSide })); WAVE.userData.ndSkip = true; WV.add(WAVE);
const waveProfile = (v, curl, Hh) => { // v 0..1 from back trough over crest to lip; returns [z, y]
  const back = [[26, 0], [14, 0.35], [5, 0.8], [0, 1.0]]; const lip = [[-3 * curl - 2 * (1 - curl), 1.0 - 0.02], [-6 * curl - 4 * (1 - curl), 0.92 * curl + 0.55 * (1 - curl)], [-6.5 * curl - 7 * (1 - curl), 0.55 * curl + 0.25 * (1 - curl)], [-4.5 * curl - 11 * (1 - curl), 0.3 * curl + 0.04 * (1 - curl)]];
  const pts = back.concat(lip); const f = v * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), u = f - i; const a = pts[i], b = pts[i + 1]; const s = u * u * (3 - 2 * u); return [(a[0] + (b[0] - a[0]) * s) * Hh / 14, (a[1] + (b[1] - a[1]) * s) * Hh]; };
const updWave = (W, t) => { WV.visible = !!W; if (!W) return; const pos = wvGeo.attributes.position.array; const deep = new THREE.Color('#041c66'), mid = new THREE.Color('#0a50c0'), lipC = new THREE.Color('#38b0f0'), foam = new THREE.Color('#f4fbff'); const tmp = new THREE.Color();
  for (let j = 0; j <= WAVEN[1]; j++) for (let i = 0; i <= WAVEN[0]; i++) { const k = (j * (WAVEN[0] + 1) + i); const u = i / WAVEN[0], v = j / WAVEN[1]; const x = (u - 0.5) * 180; const taper = Math.max(0, 1 - Math.pow(Math.abs(u - 0.5) * 2, 3));
      const cu = (W.curl ?? 0) * Math.max(0, 1 - Math.pow(Math.abs(u - 0.5 - (W.cx || 0)) * 2.4, 2)); const [z, y] = waveProfile(v, cu, W.h * taper + 0.01); pos[k * 3] = x; pos[k * 3 + 1] = y + Math.sin(x * 0.3 + t * 3) * 0.15 * v; pos[k * 3 + 2] = -z;
      tmp.copy(deep).lerp(mid, Math.min(1, v * 1.6)); if (v > 0.45) tmp.lerp(lipC, Math.min(1, (v - 0.45) * 2.2)); if (v > 0.5 && v < 0.75) tmp.lerp(foam, 0.55 * Math.sin((v - 0.5) * 4 * Math.PI) * (0.6 + 0.4 * Math.sin(x * 0.8 + t * 5)) * cu + 0.15); wvCol[k * 3] = tmp.r; wvCol[k * 3 + 1] = tmp.g; wvCol[k * 3 + 2] = tmp.b; }
  wvGeo.attributes.position.needsUpdate = true; wvGeo.attributes.color.needsUpdate = true; wvGeo.computeVertexNormals(); WV.position.set(W.x || 0, -0.2, W.z); };
// ---- ships ----
const hullGeo = (L, Wd, Fb, keel, sheerB, sheerS, y0, y1, nS = 40, nV = 10) => { // section strip between heights y0..y1 (fractions 0 top,1 keel)
  const pos = [], uv = [], col = [], idx = []; const wd = (s) => { const b = s > 0.62 ? Math.pow(Math.max(0, 1 - Math.pow((s - 0.62) / 0.38, 2)), 0.62) : 1; const st = s < 0.12 ? 0.8 + 0.2 * (s / 0.12) : 1; return Wd / 2 * b * st + 0.04; };
  const top = (s) => Fb + sheerB * Math.pow(s, 3) + sheerS * Math.pow(1 - s, 4);
  for (let i = 0; i <= nS; i++) { const s = i / nS, z = L / 2 - s * L; const w = wd(s), yt = top(s), yk = -keel * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, s * 1.05)));
    for (const side of [-1, 1]) for (let j = 0; j <= nV; j++) { const v = y0 + (y1 - y0) * j / nV; const y = yt - v * (yt - yk); const x = side * w * Math.pow(Math.max(0, 1 - Math.pow(v, 2.4)), 0.75); pos.push(x, y, z); uv.push(s * L / 3, y / 2); } }
  const per = 2 * (nV + 1); for (let i = 0; i < nS; i++) for (let sd = 0; sd < 2; sd++) for (let j = 0; j < nV; j++) { const a = i * per + sd * (nV + 1) + j, b = a + per; if (sd) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return { g, wd, top }; };
const sailTex = (c1, c2, skull) => { const [c, g] = cv(512, 512); const n = 7; for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c2 : c1; g.fillRect(i * 512 / n, 0, 512 / n + 1, 512); } g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 3; for (let y = 64; y < 512; y += 96) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  if (skull) { g.fillStyle = '#f4f0e8'; g.beginPath(); g.ellipse(256, 230, 90, 84, 0, 0, 7); g.fill(); g.fillRect(206, 280, 100, 60); g.fillStyle = '#1a1418'; g.beginPath(); g.ellipse(222, 230, 26, 30, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(290, 230, 26, 30, 0, 0, 7); g.fill(); g.fillRect(250, 268, 12, 22); for (let k = 0; k < 4; k++) g.fillRect(214 + k * 24, 316, 6, 24);
    g.strokeStyle = '#f4f0e8'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(130, 380); g.lineTo(382, 470); g.moveTo(382, 380); g.lineTo(130, 470); g.stroke(); }
  g.strokeStyle = 'rgba(60,30,20,.55)'; g.lineWidth = 10; g.strokeRect(4, 4, 504, 504); return P.tex(c); };
const flagTex = (kind) => { const [c, g] = cv(256, 160); if (kind === 'pirate') { g.fillStyle = '#121014'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#f4f0e8'; g.beginPath(); g.ellipse(128, 66, 30, 28, 0, 0, 7); g.fill(); g.fillRect(112, 84, 32, 18); g.fillStyle = '#121014'; g.beginPath(); g.ellipse(117, 66, 9, 10, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(139, 66, 9, 10, 0, 0, 7); g.fill(); g.strokeStyle = '#f4f0e8'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(84, 112); g.lineTo(172, 146); g.moveTo(172, 112); g.lineTo(84, 146); g.stroke(); }
  else { g.fillStyle = '#1f4ab8'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#f4f0e8'; g.fillRect(0, 60, 256, 40); g.fillRect(100, 0, 40, 160); g.fillStyle = '#d8322f'; g.fillRect(0, 70, 256, 20); g.fillRect(110, 0, 20, 160); } return P.tex(c); };
const lineBetween = (a, b, r, mat, parent) => { const d = new THREE.Vector3().subVectors(b, a); const m = add(cyl(r, r, 1, 5), mat, 0, 0, 0, parent, false); m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.y = d.length(); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m; };
const SHIPS = {};
const ship = (key, o) => { const G = new THREE.Group(); scene.add(G); const S0 = { G, o, sails: [], flags: [], lights: [] }; SHIPS[key] = S0;
  const L = o.L, Wd = o.W, Fb = o.Fb, keel = 2.4;
  const mk = (y0, y1, mat) => { const h = hullGeo(L, Wd, Fb + 1.0, keel, 1.4, 1.0, y0, y1); const m = new THREE.Mesh(h.g, mat); m.castShadow = true; m.receiveShadow = true; G.add(m); return h; };
  const hullMat = (c, r = 0.3) => { const m = pbr('weathered_brown_planks', [1, 1], { color: c, roughness: r, side: THREE.DoubleSide, envMapIntensity: 1.2 }); m.map = null; return m; };
  const H0 = mk(0, 0.16, hullMat(o.upper, 0.35)); mk(0.16, 0.24, std({ color: o.trim, roughness: 0.25, metalness: o.trimMetal || 0, side: THREE.DoubleSide, envMapIntensity: 1.4 })); mk(0.24, 0.46, hullMat(o.mid, 0.3)); mk(0.46, 1.0, hullMat(o.bottom, 0.28));
  S0.wd = H0.wd; S0.top = H0.top;
  // rail cap
  { const pts = []; for (let i = 0; i <= 40; i++) { const s = i / 40; pts.push(new THREE.Vector3(H0.wd(s), H0.top(s) + 0.06, L / 2 - s * L)); } for (let i = 40; i >= 0; i--) { const s = i / 40; pts.push(new THREE.Vector3(-H0.wd(s), H0.top(s) + 0.06, L / 2 - s * L)); }
    const cap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 160, 0.11, 6, true), std({ color: o.rail, roughness: 0.3, envMapIntensity: 1.3 })); cap.castShadow = true; G.add(cap); }
  // deck
  { const sh = new THREE.Shape(); for (let i = 0; i <= 40; i++) { const s = i / 40; const p = [H0.wd(s) * 0.985, L / 2 - s * L]; i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]); } for (let i = 40; i >= 0; i--) { const s = i / 40; sh.lineTo(-H0.wd(s) * 0.985, L / 2 - s * L); }
    const dg = new THREE.ShapeGeometry(sh, 4); dg.rotateX(Math.PI / 2); const uvA = dg.attributes.uv, pA = dg.attributes.position; for (let i = 0; i < uvA.count; i++) uvA.setXY(i, pA.getX(i) / 3, pA.getZ(i) / 3);
    const deck = new THREE.Mesh(dg, pbr(o.deckTex || 'wood_planks_dirt', [1, 1], { color: o.deck, roughness: 0.4, envMapIntensity: 1.1, side: THREE.DoubleSide })); deck.position.y = Fb; deck.receiveShadow = true; G.add(deck); }
  // portholes / cannons on the sides
  for (let i = 0; i < o.ports; i++) { const s = 0.22 + i * (0.5 / Math.max(1, o.ports - 1)); const z = L / 2 - s * L; const y = Fb + 0.35; for (const sd of [-1, 1]) { const x = sd * (H0.wd(s) + 0.02);
      if (o.cannons) { const gp = add(box(0.75, 0.6, 0.08), std({ color: '#1a1214' }), x, y, z, G); gp.rotation.y = Math.PI / 2; const cn = add(cyl(0.16, 0.2, 1.1, 12), std({ color: '#2a2a30', metalness: 0.8, roughness: 0.3 }), x + sd * 0.35, y, z, G); cn.rotation.z = Math.PI / 2; }
      else { const ring = add(new THREE.TorusGeometry(0.28, 0.07, 8, 20), std({ color: '#e8b84a', metalness: 1, roughness: 0.2 }), x + sd * 0.12, y + 0.1, z, G); ring.rotation.y = Math.PI / 2; const gl = add(new THREE.CircleGeometry(0.26, 20), std({ color: '#7ac8ff', emissive: '#2a6ab8', emissiveIntensity: 0.6, roughness: 0.05, metalness: 0.2 }), x + sd * 0.1, y + 0.1, z, G, false); gl.rotation.y = sd * Math.PI / 2; } } }
  // masts, yards, sails
  const mastM = pbr('fine_grained_wood', [1, 4], { color: o.mast, roughness: 0.35 }); const lineM = std({ color: '#3a2a20', roughness: 0.8 });
  o.masts.forEach(([s, h], mi) => { const z = L / 2 - s * L; add(cyl(0.2, 0.28, h, 12), mastM, 0, Fb + h / 2, z, G); add(new THREE.CylinderGeometry(0.9, 0.7, 0.5, 14), mastM, 0, Fb + h * 0.72, z, G);
    [[0.52, 0.95, Wd * 1.35, h * 0.3], [0.84, 0.7, Wd * 1.0, h * 0.2]].forEach(([fy, fw, sw, shh], k) => { const yy = Fb + h * fy; const yard = add(cyl(0.09, 0.09, sw * 1.08, 8), mastM, 0, yy, z, G); yard.rotation.z = Math.PI / 2;
      const sg = new THREE.PlaneGeometry(sw, shh, 12, 8); const sm = new THREE.MeshStandardMaterial({ map: sailTex(o.sail1, o.sail2, o.skull && k === 0), side: THREE.DoubleSide, roughness: 0.6 }); const sail = new THREE.Mesh(sg, sm); sail.position.set(0, yy - shh / 2 - 0.1, z - 0.3); sail.castShadow = true; G.add(sail); sail.userData.base = sg.attributes.position.array.slice(); sail.userData.h = shh; S0.sails.push(sail); });
    for (const sd of [-1, 1]) for (let k = -1; k <= 1; k++) { const s2 = s + k * 0.03; lineBetween(new THREE.Vector3(0, Fb + h * 0.95, z), new THREE.Vector3(sd * H0.wd(s2), H0.top(s2) + 0.1, L / 2 - s2 * L), 0.025, lineM, G); }
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4, 10, 4), new THREE.MeshStandardMaterial({ map: flagTex(o.flag), side: THREE.DoubleSide, roughness: 0.6 })); fl.position.set(0, Fb + h + 0.75, z); fl.rotation.y = Math.PI / 2; fl.geometry.translate(1.1, 0, 0); fl.userData.base = fl.geometry.attributes.position.array.slice(); G.add(fl); S0.flags.push(fl); });
  // bowsprit
  { const bs = add(cyl(0.12, 0.16, 7, 10), mastM, 0, Fb + 2.2, -L / 2 - 2.0, G); bs.rotation.x = Math.PI / 2 - 0.35; lineBetween(new THREE.Vector3(0, Fb + 3.3, -L / 2 - 4.6), new THREE.Vector3(0, Fb + o.masts[o.masts.length - 1][1] * 0.95, L / 2 - o.masts[o.masts.length - 1][0] * L), 0.03, lineM, G); }
  // stern cabin
  { const z0 = L / 2 - 0.1 * L; const cab = add(box(Wd * 0.62, 2.4, 3.2), pbr('weathered_planks', [2, 1], { color: o.cabin, roughness: 0.4 }), 0, Fb + 1.2, z0 + 0.6, G); add(box(Wd * 0.7, 0.18, 3.6), std({ color: o.rail, roughness: 0.3 }), 0, Fb + 2.45, z0 + 0.6, G);
    const door = add(box(1.1, 1.9, 0.08), pbr('fine_grained_wood', [1, 1], { color: '#6a3a22' }), 0, Fb + 0.95, z0 - 1.02, G); add(new THREE.SphereGeometry(0.06, 8, 6), std({ color: '#e8b84a', metalness: 1, roughness: 0.2 }), 0.38, Fb + 0.95, z0 - 1.07, G);
    for (const sd of [-1, 1]) { add(box(0.7, 0.7, 0.06), std({ color: '#ffd890', emissive: '#ffb050', emissiveIntensity: 0.9 }), sd * 1.45, Fb + 1.4, z0 - 1.02, G, false); add(box(0.86, 0.86, 0.04), std({ color: o.rail }), sd * 1.45, Fb + 1.4, z0 - 1.0, G); }
    S0.lights.push(lamp(0, 0, 0, '#ffb050', 4, 8, 0.9)); S0.lamp0 = [1.9, Fb + 2.1, z0 - 1.1]; }
  // wheel
  { const z = L / 2 - 0.25 * L; const wg = new THREE.Group(); wg.position.set(0, Fb + 1.15, z); G.add(wg); const wm = pbr('fine_grained_wood', [1, 1], { color: '#8a5a32', roughness: 0.3 }); add(new THREE.TorusGeometry(0.72, 0.06, 8, 28), wm, 0, 0, 0, wg); add(new THREE.TorusGeometry(0.2, 0.08, 8, 16), wm, 0, 0, 0, wg);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const sp = add(cyl(0.035, 0.035, 1.75, 6), wm, 0, 0, 0, wg); sp.rotation.z = a; } add(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 10), std({ color: '#e8b84a', metalness: 1, roughness: 0.2 }), 0, 0, 0.05, wg).rotation.x = Math.PI / 2;
    add(box(0.35, 1.0, 0.35), wm, 0, Fb + 0.5, z + 0.25, G); S0.wheel = wg; }
  // deck clutter
  const props = o.props || []; props.forEach(([n, s, x, ry, sc]) => { const m = put(n, x, Fb, L / 2 - s * L, ry, sc, G); if (m) m.traverse((q) => { if (q.isMesh) { q.castShadow = true; } }); });
  for (const [s, x] of o.ropes || []) { for (let k = 0; k < 3; k++) add(new THREE.TorusGeometry(0.42 - k * 0.1, 0.06, 6, 20), std({ color: '#c8a46a', roughness: 0.9 }), x, Fb + 0.06 + k * 0.1, L / 2 - s * L, G).rotation.x = Math.PI / 2; }
  return S0; };
const HERO = ship('H', { L: 26, W: 7.4, Fb: 2.3, upper: '#8a4a2a', trim: '#f4ead0', mid: '#a83226', bottom: '#c8362a', rail: '#5a2e1a', deck: '#e8b878', mast: '#a8784a', sail1: '#fbf4e4', sail2: '#e84a32', flag: 'navy', cabin: '#a85a32', ports: 5, masts: [[0.4, 17], [0.68, 15]],
  props: [['wooden_barrels_01', 0.5, -2.2, 0, 1.0],  ['wooden_barrels_01', 0.82, 1.8, 0.6, 1.0], ['wooden_barrels_01', 0.15, -2.0, 0.6, 1.0]], ropes: [[0.62, -2.5], [0.3, -2.6]] });
const PIR = ship('P', { L: 28, W: 7.8, Fb: 2.5, upper: '#2a2228', trim: '#e8b84a', trimMetal: 0.6, mid: '#3a2a30', bottom: '#8a1f24', rail: '#2a1a1a', deck: '#a87a5a', mast: '#5a3a2a', sail1: '#2a2228', sail2: '#8a1f24', skull: true, flag: 'pirate', cabin: '#3a2228', ports: 5, cannons: true, masts: [[0.4, 19], [0.68, 16]], deckTex: 'old_planks_02',
  props: [['wooden_barrels_01', 0.5, 2.4, 0, 1.0],  ['wooden_barrels_01', 0.8, -1.8, 0.2, 1.0]], ropes: [[0.6, -2.4]] });
// distant islands for the sunny opening
const ISL = new THREE.Group(); scene.add(ISL); { const rockM = pbr('rock_boulder_dry', [3, 3], { color: '#c8b8a8', roughness: 0.8 }), grn = std({ color: '#3aa85a', roughness: 0.7 });
  for (const [x, z, s] of [[-140, -260, 30], [-100, -280, 18], [160, -300, 26], [210, -250, 14]]) { const r = add(new THREE.ConeGeometry(s, s * 1.3, 9), rockM, x, s * 0.5, z, ISL, false); r.scale.set(1.4, 1, 1); const top = add(new THREE.SphereGeometry(s * 0.55, 12, 8), grn, x, s * 1.0, z, ISL, false); top.scale.set(1.6, 0.4, 1.2); } }
// grappling hook + boarding ropes
const HOOK = new THREE.Group(); scene.add(HOOK); { const hm = std({ color: '#5a5a66', metalness: 0.9, roughness: 0.3 }); add(cyl(0.05, 0.05, 0.7, 8), hm, 0, 0.35, 0, HOOK); for (let k = 0; k < 3; k++) { const c = add(new THREE.TorusGeometry(0.22, 0.045, 6, 12, Math.PI), hm, 0, 0.1, 0, HOOK); c.rotation.y = k * Math.PI * 2 / 3; c.rotation.x = Math.PI; } }
const HOOKROPE = add(cyl(0.025, 0.025, 1, 5), std({ color: '#b8925a', roughness: 0.9 }), 0, 0, 0, scene, false); HOOKROPE.userData.ndSkip = true;
const SWROPES = [0, 1, 2].map(() => { const m = add(cyl(0.03, 0.03, 1, 5), std({ color: '#b8925a', roughness: 0.9 }), 0, 0, 0, scene, false); m.userData.ndSkip = true; return m; });
const setLine = (m, a, b) => { const d = new THREE.Vector3().subVectors(b, a); m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.y = d.length(); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); };
// pouring oil stream (golden, glossy)
const POUR = add(cyl(0.035, 0.025, 1, 8), new THREE.MeshStandardMaterial({ color: '#ffc840', emissive: '#c88a10', emissiveIntensity: 0.8, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.92 }), 0, 0, 0, scene, false); POUR.userData.ndSkip = true;
// ================= GALLEY (x = 300) =================
ZONE = 'galley';
const GAL = new THREE.Group(); GAL.position.set(300, 0, 0); scene.add(GAL);
{ const wall = pbr('weathered_planks', [3, 1.2], { color: '#f0c890', roughness: 0.45 }); add(box(9, 3.4, 0.2), wall, 0, 1.7, -2.6, GAL); add(box(0.2, 3.4, 7), wall, -4.4, 1.7, 0.5, GAL); add(box(0.2, 3.4, 7), wall, 4.4, 1.7, 0.5, GAL);
  add(box(9, 0.1, 7), pbr('wood_planks_dirt', [3, 2], { color: '#c89060', roughness: 0.4 }), 0, 0, 0.5, GAL); for (let k = -3; k <= 3; k++) add(box(0.25, 0.3, 7), pbr('fine_grained_wood', [1, 2], { color: '#7a4a2a' }), k * 1.4, 3.3, 0.5, GAL);
  add(box(9, 0.14, 0.12), std({ color: '#2a8a5a', roughness: 0.4 }), 0, 1.25, -2.48, GAL);
  // porthole with sea view
  for (const px of [-2.2, 2.4]) { const ring = add(new THREE.TorusGeometry(0.5, 0.11, 10, 28), std({ color: '#e8b84a', metalness: 1, roughness: 0.18 }), px, 2.1, -2.46, GAL); const [c, g] = cv(128, 128); const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#5ab8ff'); gr.addColorStop(0.55, '#d8f0ff'); gr.addColorStop(0.56, '#1a6ad8'); gr.addColorStop(1, '#0a3aa8'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    add(new THREE.CircleGeometry(0.48, 28), new THREE.MeshBasicMaterial({ map: P.tex(c) }), px, 2.1, -2.48, GAL, false); }
  // counter + stove
  add(box(5.2, 1.0, 1.0), pbr('fine_grained_wood', [2, 1], { color: '#8a4a2a', roughness: 0.35 }), 0.3, 0.5, -1.95, GAL); add(box(5.4, 0.12, 1.15), pbr('fine_grained_wood', [2, 1], { color: '#e0a870', roughness: 0.25 }), 0.3, 1.06, -1.95, GAL);
  for (let k = 0; k < 4; k++) { add(box(1.1, 0.7, 0.04), pbr('fine_grained_wood', [1, 1], { color: '#6a3a22' }), -1.9 + k * 1.3, 0.5, -1.43, GAL); add(new THREE.SphereGeometry(0.04, 8, 6), std({ color: '#e8b84a', metalness: 1, roughness: 0.2 }), -1.9 + k * 1.3, 0.7, -1.4, GAL); }
  put('barrel_stove', -3.3, 0, -1.9, 0, 1.0, GAL); const potM = std({ color: '#d8783a', metalness: 0.9, roughness: 0.22 }); add(cyl(0.38, 0.32, 0.5, 20), potM, -1.2, 1.37, -2.0, GAL); add(new THREE.TorusGeometry(0.38, 0.03, 6, 20), potM, -1.2, 1.62, -2.0, GAL).rotation.x = Math.PI / 2;
  add(cyl(0.3, 0.26, 0.4, 20), potM, 1.6, 1.32, -2.05, GAL);
  // STORM OIL tin
  { const [c, g] = cv(256, 256); g.fillStyle = '#d8322f'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#f4e8c8'; g.fillRect(14, 60, 228, 136); g.fillStyle = '#d8322f'; g.font = '900 64px Arial Black, Arial'; g.textAlign = 'center'; g.fillText('STORM', 128, 122); g.fillText('OIL', 128, 184); g.strokeStyle = '#e8b84a'; g.lineWidth = 10; g.strokeRect(6, 6, 244, 244);
    const tin = add(box(0.55, 0.7, 0.4), [std({ color: '#c82a2a', metalness: 0.6, roughness: 0.25 }), std({ color: '#c82a2a', metalness: 0.6, roughness: 0.25 }), std({ color: '#d8d8e0', metalness: 1, roughness: 0.2 }), std({ color: '#c82a2a' }), new THREE.MeshStandardMaterial({ map: P.tex(c), roughness: 0.3, metalness: 0.3 }), std({ color: '#c82a2a' })], 2.6, 1.47, -1.95, GAL); add(cyl(0.07, 0.07, 0.14, 10), std({ color: '#d8d8e0', metalness: 1, roughness: 0.2 }), 2.75, 1.88, -2.0, GAL); }
  // shelves with jars
  add(box(3.4, 0.08, 0.4), pbr('fine_grained_wood', [2, 1], { color: '#8a4a2a' }), 0.4, 2.55, -2.35, GAL); const jc = ['#e8b84a', '#c83a2a', '#3a8a5a', '#f4e8c8', '#8a3a8a', '#e87a2a']; for (let k = 0; k < 8; k++) add(cyl(0.12, 0.12, 0.3 + (k % 3) * 0.08, 12), std({ color: jc[k % 6], roughness: 0.3, envMapIntensity: 0.6 }), -1.0 + k * 0.38, 2.75 + (k % 3) * 0.04, -2.35, GAL);
  for (let k = 0; k < 3; k++) { const pan = add(cyl(0.28, 0.24, 0.06, 18), potM, -2.0 + k * 0.7, 2.95, -2.42, GAL); pan.rotation.x = Math.PI / 2; }
  put('Lantern_01', 3.4, 2.4, -1.9, 0, 1.2, GAL); }
const GALL = [lamp(303.3, 2.8, -1.6, '#ffb050', 9, 10, 0.9), lamp(299, 3.0, 1.0, '#ffd8a0', 6, 12, 0.01)];
// soup bowl macro: broth disc with ripples and oily spots (on the counter, x=300.2)
ZONE = 'fx';
const BOWL = new THREE.Group(); BOWL.position.set(300.4, 1.12, -1.85); BOWL.scale.setScalar(0.45); scene.add(BOWL);
{ const prof = []; for (let i = 0; i <= 12; i++) { const a = i / 12; prof.push(new THREE.Vector2(0.05 + 0.42 * Math.sin(a * Math.PI / 2), 0.02 + 0.22 * (1 - Math.cos(a * Math.PI / 2)))); } add(new THREE.LatheGeometry(prof, 40), std({ color: '#f4f0f8', roughness: 0.15, side: THREE.DoubleSide, envMapIntensity: 1.4 }), 0, 0, 0, BOWL); add(new THREE.TorusGeometry(0.47, 0.025, 8, 40), std({ color: '#2a6ad8', roughness: 0.2 }), 0, 0.24, 0, BOWL).rotation.x = Math.PI / 2; }
const BRN = 64; const brGeo = new THREE.CircleGeometry(0.44, BRN, 0, Math.PI * 2); { const g2 = new THREE.PlaneGeometry(0.88, 0.88, BRN, BRN); brGeo.copy(g2); } brGeo.rotateX(-Math.PI / 2); const brBase = brGeo.attributes.position.array.slice(); const brCol = new Float32Array(brGeo.attributes.position.count * 3); brGeo.setAttribute('color', new THREE.BufferAttribute(brCol, 3));
const BROTH = new THREE.Mesh(brGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.06, envMapIntensity: 1.8, transparent: true, alphaTest: 0.5 })); BROTH.position.y = 0.2; BROTH.userData.ndSkip = true; BOWL.add(BROTH);
{ const [c, g] = cv(256, 256); g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill(); BROTH.material.alphaMap = new THREE.CanvasTexture(c); }
const SPOTS = [[0.12, 0.05, 0.08], [-0.15, -0.1, 0.06], [0.02, -0.2, 0.07], [-0.08, 0.17, 0.05], [0.22, -0.12, 0.045], [-0.25, 0.06, 0.05]];
{ const [c, g] = cv(1024, 1024); const gr = g.createRadialGradient(512, 512, 40, 512, 512, 520); gr.addColorStop(0, '#f0a428'); gr.addColorStop(1, '#c8701a'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  for (const [sx, sz, r] of SPOTS) { const X = 512 + sx / 0.88 * 1024, Y = 512 + sz / 0.88 * 1024, Rr = r / 0.88 * 1024; const sg = g.createRadialGradient(X - Rr * 0.3, Y - Rr * 0.3, 2, X, Y, Rr); sg.addColorStop(0, '#fff2a0'); sg.addColorStop(0.7, '#ffd85a'); sg.addColorStop(1, '#f4b830'); g.fillStyle = sg; g.beginPath(); g.arc(X, Y, Rr, 0, 7); g.fill(); g.strokeStyle = '#a85a10'; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#ffffffcc'; g.lineWidth = 6; g.beginPath(); g.arc(X, Y, Rr * 0.72, 3.6, 4.6); g.stroke(); }
  BROTH.material.map = P.tex(c); BROTH.material.vertexColors = false; BROTH.material.color.set('#ffffff'); BROTH.material.needsUpdate = true; }
const updBroth = (t, blow) => { const p = brGeo.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) { const x = brBase[i], z = brBase[i + 2]; let m = 1; for (const [sx, sz, r] of SPOTS) { const d = Math.hypot(x - sx, z - sz); if (d < r * 1.05) m = 0; else if (d < r * 1.5) m = Math.min(m, (d - r * 1.05) / (r * 0.45)); }
    p[i + 1] = blow * (0.014 * Math.sin(x * 30 - t * 10) + 0.006 * Math.sin(Math.hypot(x + 0.5, z) * 40 - t * 9)) * m; }
  brGeo.attributes.position.needsUpdate = true; brGeo.computeVertexNormals(); };
// splash / spray particles + rain
const sprayTex = glowTex('255,255,255');
const SPRAY = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: sprayTex, transparent: true, depthWrite: false, color: '#e8f6ff' }), 260); SPRAY.frustumCulled = false; SPRAY.userData.ndSkip = true; SPRAY.renderOrder = 4; SPRAY.visible = false; scene.add(SPRAY);
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
const DAYENV = skyEnv('#1a5ae0', '#cfe8ff', '#1a5ab8', '#ffffff'), STORMENV = skyEnv('#0a1440', '#3a5ab0', '#0a2a70', '#c8d8ff'), GALENV = skyEnv('#5a3a2a', '#ffd8a0', '#6a3a22', '#fff0d0');
const PRESET = {
  day: { hemi: ['#d8ecff', '#6a8ac0', 1.5], key: ['#fff4e0', 3.8], fog: ['#8ac0ff', 0.0012], sky: 1, sun: [0.5, 0.55, 0.65], expo: 1.08, lamps: 0, sat: 1.32, env: DAYENV, bloomK: 0.85, thr: 1.05, rays: 0.25, zone: 'sea', deep: '#0a4ac0', crest: '#22b0f8' },
  dusk: { hemi: ['#a8b8f0', '#3a4a8a', 1.4], key: ['#d8dcff', 2.6], fog: ['#3a5aa8', 0.004], sky: 6, sun: [0.5, 0.5, 0.65], expo: 1.1, lamps: 1, sat: 1.3, env: STORMENV, bloomK: 1.0, thr: 0.95, rays: 0, zone: 'sea', deep: '#08309a', crest: '#1a7ae0' },
  storm: { hemi: ['#7a98e8', '#1a2a6a', 1.5], key: ['#b8c8ff', 2.2], fog: ['#16307a', 0.005], sky: 6, sun: [0.3, 0.6, 0.7], expo: 1.15, lamps: 1, sat: 1.3, env: STORMENV, bloomK: 1.05, thr: 0.95, rays: 0, zone: 'sea', deep: '#041c66', crest: '#1a82e8' },
  galley: { hemi: ['#ffe0c0', '#6a3a2a', 1.1], key: ['#fff0d8', 1.6], fog: ['#3a2a20', 0.0005], sky: 1, sun: [0.5, 0.8, 0.4], expo: 1.1, lamps: 1, sat: 1.25, env: GALENV, bloomK: 0.9, thr: 1.0, rays: 0, zone: 'galley', deep: '#0a4ac0', crest: '#22b0f8' },
};
// ================= per-frame =================
import { stateAt, TOTAL } from './shots.js';
const camR = new THREE.Vector3(), M4 = new THREE.Matrix4(), SC = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3(), Q = new THREE.Quaternion(), E3 = new THREE.Euler();
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const placeShip = (S0, sp, t) => { if (!sp) { S0.G.visible = false; return; } S0.G.visible = true; const yaw = sp.yaw || 0, L = S0.o.L, Wd = S0.o.W, c = Math.cos(yaw), s = Math.sin(yaw);
  const at = (lx, lz) => seaH(sp.x + lx * c + lz * s, sp.z - lx * s + lz * c, t); const hb = at(0, -L * 0.42), hs = at(0, L * 0.42), hl = at(-Wd * 0.5, 0), hr = at(Wd * 0.5, 0), h0 = at(0, 0);
  const lift = sp.lift || 0; S0.G.position.set(sp.x, (h0 + hb + hs) / 3 - 0.35 + lift, sp.z); const k = sp.rock ?? 0.7; E3.set(Math.atan2(hb - hs, L * 0.84) * k + (sp.pitch || 0), yaw, Math.atan2(hl - hr, Wd) * k * 1.3 + (sp.roll || 0), 'YXZ'); S0.G.quaternion.setFromEuler(E3); S0.G.updateMatrixWorld(true);
  const wind = sp.wind ?? 1; S0.sails.forEach((sl, i) => { const pa = sl.geometry.attributes.position.array, b = sl.userData.base, h = sl.userData.h; for (let j = 0; j < pa.length; j += 3) { const yy = (b[j + 1] / h + 0.5); const xx = b[j] / (Wd * 1.2); pa[j + 2] = b[j + 2] - wind * (0.9 + 0.12 * Math.sin(t * 2 + i)) * Math.sin(Math.PI * Math.min(1, Math.max(0, yy))) * (1 - xx * xx * 0.6) - 0.15 * Math.sin(t * 6 + xx * 4 + i) * wind * (1 - yy); } sl.geometry.attributes.position.needsUpdate = true; sl.geometry.computeVertexNormals(); });
  S0.flags.forEach((fl) => { const pa = fl.geometry.attributes.position.array, b = fl.userData.base; for (let j = 0; j < pa.length; j += 3) { const u = b[j] / 2.2; pa[j + 2] = b[j + 2] + Math.sin(u * 6 - t * 8 * wind) * 0.22 * u * wind; pa[j + 1] = b[j + 1] + Math.sin(u * 4 - t * 6) * 0.05 * u; } fl.geometry.attributes.position.needsUpdate = true; fl.geometry.computeVertexNormals(); });
  if (S0.wheel) S0.wheel.rotation.z = sp.wheel || 0; S0.lights.forEach((l) => { V.set(...S0.lamp0).applyMatrix4(S0.G.matrixWorld); l.position.copy(V); }); };
const shipW = (key, p) => { const S0 = SHIPS[key]; return V.set(p[0], p[1], p[2]).applyMatrix4(S0.G.matrixWorld).clone(); };
window.renderFrame = (f) => {
  const S = stateAt(f, {}), t = f / 30;
  const L = PRESET[S.preset || 'day'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2]; moon.color.set(L.key[0]); moon.intensity = S.key ?? L.key[1];
  scene.fog.color.set(L.fog[0]); scene.fog.density = S.fog ?? L.fog[1]; skyU.day.value = L.sky; skyU.sunD.value.set(...L.sun); scene.environment = L.env;
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(0, 0, 0); inkU.flash.value = S.flash || 0; inkU.bloomK.value = S.bloomK ?? L.bloomK; brightU.thr.value = S.thr ?? L.thr; inkU.split.value = 0; inkU.greenK.value = 0;
  const zone = L.zone; for (const l of pLights) { l.visible = L.lamps > 0 && l.userData.zone === zone; l.intensity = l.userData.I0; } for (const g of glows) g.visible = (L.lamps > 0 && g.userData.zone === zone) || g.userData.zone === 'fx';
  // sea + ships
  SEA.amp = S.amp ?? 0.35; SEA.chop = S.chop ?? 0.3; const oil = S.oil || null; SEA.oil = oil ? oil.k : 0; if (oil) { SEA.or = oil.r; } SEA.wave = S.wave || null;
  const sh0 = S.ships || {}; if (oil && sh0.H) { const o2 = oil.off || [ -6, 0 ]; SEA.ox = sh0.H.x + o2[0]; SEA.oz = sh0.H.z + o2[1]; }
  placeShip(HERO, sh0.H, t); placeShip(PIR, sh0.P, t); ISL.visible = !!S.islands; updWave(S.wave ? { ...S.wave } : null, t);
  // camera (optionally riding a ship)
  const sh = S.shake || 0, hh = S.handheld ?? 0.012; let look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  if (S.camShip) { pos = shipW(S.camShip, S.cam); look = shipW(S.camShip, S.look); }
  if (S.orbit) { const d = pos.clone().sub(look); d.applyAxisAngle(new THREE.Vector3(0, 1, 0), S.orbit); pos.copy(look).add(d); }
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  if (!S.camShip && zone === 'sea') pos.y = Math.max(pos.y, seaH(pos.x, pos.z, t) + 0.4);
  camera.position.copy(pos); camera.up.set(0, 1, 0); if (S.camShip && S.tilt !== false) { camera.up.set(0, 1, 0).applyQuaternion(SHIPS[S.camShip].G.quaternion).lerp(new THREE.Vector3(0, 1, 0), 0.45).normalize(); }
  camera.lookAt(look.x + (rnd(f, 3) - 0.5) * sh * 1.5, look.y + (rnd(f, 4) - 0.5) * sh * 1.5, look.z); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); camR.setFromMatrixColumn(camera.matrixWorld, 0); sky.position.copy(camera.position);
  OCEAN.visible = zone === 'sea'; if (OCEAN.visible) updOcean(camera.position.x, camera.position.z - 60, t, new THREE.Color(S.deep || L.deep), new THREE.Color(S.crest || L.crest));
  BOWL.visible = zone === 'galley'; if (BOWL.visible) updBroth(t, S.blow ?? 0);
  const fc = S.shadowAt ? S.shadowAt : [look.x, look.y, look.z], sd = new THREE.Vector3(...L.sun).normalize(); moon.position.set(fc[0] + sd.x * 60, fc[1] + Math.max(sd.y, 0.25) * 60, fc[2] + sd.z * 60); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 22; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 220; sc.updateProjectionMatrix(); }
  { const sv = sd.clone().multiplyScalar(500).add(camera.position).project(camera); inkU.sunUV.value.set(sv.x * 0.5 + 0.5, sv.y * 0.5 + 0.5); inkU.raysK.value = sv.z < 1 ? (S.rays ?? L.rays) : 0; }
  // grappling hook / boarding ropes / oil stream
  HOOK.visible = HOOKROPE.visible = !!S.hook; if (S.hook) { const a = S.hook.ship ? shipW(S.hook.ship, S.hook.from) : new THREE.Vector3(...S.hook.from), b = S.hook.toShip ? shipW(S.hook.toShip, S.hook.to) : new THREE.Vector3(...S.hook.to); const k = S.hook.k; const p = a.clone().lerp(b, k); p.y += Math.sin(Math.PI * Math.min(1, k)) * 2.5; HOOK.position.copy(p); HOOK.rotation.set(t * 9, t * 5, 0); setLine(HOOKROPE, a, p); }
  SWROPES.forEach((m, i) => { const r = (S.ropes || [])[i]; m.visible = !!r; if (r) setLine(m, shipW(r.ship, r.top), new THREE.Vector3(...r.end)); });
  POUR.visible = !!S.pour; if (S.pour) { const a = S.pour.ship ? shipW(S.pour.ship, S.pour.from) : new THREE.Vector3(...S.pour.from); const b = a.clone(); b.y = seaH(a.x, a.z, t) - 0.1; if (S.pour.to) b.set(...S.pour.to); b.x += (S.pour.dx || 0); setLine(POUR, a, b); POUR.scale.x = POUR.scale.z = S.pour.w || 1; }
  // rain + spray around the camera
  RAIN.visible = !!S.rain; if (RAIN.visible) { const k = S.rain; const cq = camera.quaternion; for (let i = 0; i < RAIN.count; i++) { const fall = ((t * 1.6 * (0.7 + rnd(i, 5)) + rnd(i, 1)) % 1); V.set((rnd(i, 2) - 0.5) * 24, 9 - fall * 18, -3 - rnd(i, 3) * 16).applyQuaternion(cq).add(camera.position);
      M4.compose(V, cq, SC.set(0.035, (0.6 + rnd(i, 4) * 0.5) * (i < RAIN.count * k ? 1 : 0), 1)); RAIN.setMatrixAt(i, M4); } RAIN.instanceMatrix.needsUpdate = true; }
  SPRAY.visible = !!S.spray; if (SPRAY.visible) { const sp = S.spray; const P0 = sp.ship ? shipW(sp.ship, sp.p) : new THREE.Vector3(...sp.p); for (let i = 0; i < SPRAY.count; i++) { const a = ((t * (sp.rate || 1.2)) + rnd(i, 3)) % 1; const ang = rnd(i, 4) * Math.PI * 2, rr = rnd(i, 5) * (sp.w || 6);
      V.set(P0.x + Math.cos(ang) * rr * (0.4 + a), P0.y + a * (sp.h || 5) * (1 - a) * 4 * (0.5 + rnd(i, 6)), P0.z + Math.sin(ang) * rr * (0.4 + a)); M4.compose(V, camera.quaternion, SC.setScalar((0.3 + a * 1.2) * (sp.s || 1) * (i < SPRAY.count * (sp.k ?? 1) ? 1 : 0))); SPRAY.setMatrixAt(i, M4); } SPRAY.instanceMatrix.needsUpdate = true; SPRAY.material.opacity = 0.85; }
  DUST.forEach((m, i) => { const em = (S.dust || [])[i % Math.max(1, (S.dust || []).length)]; m.visible = !!em && i < (S.dustN ?? 30); if (!m.visible) return; const a = ((t * (em.rate || 1)) + rnd(i, 3)) % 1;
    m.position.set(em.p[0] + (rnd(i, 4) - 0.5) * (em.w || 2), em.p[1] + 0.2 + a * (em.h || 1.2), em.p[2] + (rnd(i, 5) - 0.5) * (em.w || 2)); m.scale.setScalar((0.6 + a * 2.4) * (em.s || 1)); m.quaternion.copy(camera.quaternion); m.material.opacity = (1 - a) * (em.k ?? 0.45); });
  MOTES.forEach((m) => (m.visible = false)); SNOWF.visible = false;
  for (const g of glows) { g.quaternion.copy(camera.quaternion); g.material.opacity = g.userData.k0 * Math.exp(-g.position.distanceTo(camera.position) * 0.04); }
  if (bang.userData.g) { bang.userData.g.quaternion.copy(camera.quaternion); } bang.visible = false; bangLight.intensity = 0;
  if (S.bang) { bang.visible = true; const bp = S.bang.ship ? shipW(S.bang.ship, S.bang.p) : new THREE.Vector3(...S.bang.p); bang.position.copy(bp); bang.scale.setScalar(S.bang.s || 1); bangLight.position.copy(bp); bangLight.intensity = 30 * (S.bang.k ?? 1); }
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw); c.mesh.visible = true; let px = a.x, py = a.y, pz = a.z, extraRoll = 0;
    if (a.ship) { const w = shipW(a.ship, [a.x, a.y, a.z]); px = w.x; py = w.y; pz = w.z; E3.setFromQuaternion(SHIPS[a.ship].G.quaternion, 'YXZ'); extraRoll = E3.z * 0.8; }
    c.mesh.position.set(px, py, pz); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, a.yaw ?? Math.atan2(camera.position.x - px, camera.position.z - pz), (a.roll || 0) + extraRoll); c.mat.color.set(a.tint || S.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2; c.mesh.castShadow = !a.fx;
    c.blob.visible = !a.fx && a.blob !== false && !a.ship; c.blob.position.set(px, (a.ground ?? py) + 0.015, pz); c.blob.scale.set(1.0 * s, 0.55 * s, 1); });
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
