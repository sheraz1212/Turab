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

const NAMES = ['wooden_barrels_01', 'wooden_crate_01', 'wooden_crate_02', 'old_military_crate', 'metal_jerrycan'];
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
const PBRN = ['leafy_grass', 'farm_soil', 'snow_02', 'cobblestone_floor_04', 'dry_ground_01', 'plastered_wall_02', 'grey_roof_tiles', 'weathered_planks', 'fine_grained_wood'];
await Promise.all(PBRN.flatMap((n) => ['diff', 'nor', 'rough'].map((k) => new Promise((res) => TXL.load(`tex/${n}_${k}.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (k === 'diff') t.colorSpace = THREE.SRGBColorSpace; TX[n + k] = t; res(); }, undefined, () => res())))));
const pbr = (n, rep, o = {}) => { const r = Array.isArray(rep) ? rep : [rep, rep]; const cl = (t) => { const c = t.clone(); c.repeat.set(r[0], r[1]); c.needsUpdate = true; return c; };
  return new THREE.MeshStandardMaterial({ map: cl(TX[n + 'diff']), normalMap: cl(TX[n + 'nor']), roughnessMap: cl(TX[n + 'rough']), roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2), ...o }); };
const R = (s) => P.rng(s);
ZONE = 'town';
// ================= TANK WORLD =================
ZONE = 'land';
const GROUND = { summer: pbr('leafy_grass', [90, 90], { color: '#8ad860', roughness: 0.9 }), autumn: pbr('farm_soil', [80, 80], { color: '#8a6a4a', roughness: 0.35, envMapIntensity: 1.2 }), winter: pbr('snow_02', [120, 120], { color: '#ffffff', roughness: 0.6, envMapIntensity: 0.9 }) };
const ground = add(new THREE.PlaneGeometry(900, 900), GROUND.summer, 0, 0, 0, scene, false); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
const YARD = add(new THREE.PlaneGeometry(60, 40), pbr('cobblestone_floor_04', [14, 10], { color: '#c8b8a8', roughness: 0.6 }), 8, 0.02, -6, scene, false); YARD.rotation.x = -Math.PI / 2; YARD.receiveShadow = true;
const ROAD = add(new THREE.PlaneGeometry(9, 900), pbr('dry_ground_01', [3, 300], { color: '#c8a070', roughness: 0.8 }), -200, 0.02, 0, scene, false); ROAD.rotation.x = -Math.PI / 2; ROAD.receiveShadow = true;
// ---------- buildings ----------
const brickM = (() => { const t = brickTex([10, 55, 40]); t.wrapS = t.wrapT = THREE.RepeatWrapping; return (rx, ry) => { const c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return std({ map: c, roughness: 0.7 }); }; })();
const plasterM = (rx, ry) => pbr('plastered_wall_02', [rx, ry], { color: '#fbf6ee', roughness: 0.6 });
const roofM = (rx, ry, col = '#8a8a92') => pbr('grey_roof_tiles', [rx, ry], { color: col, roughness: 0.5 });
const prism = (w, h, d) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g; };
const archWin = (parent, x, y, z, w, h, ry = 0, glass = '#2a3a5a') => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); add(box(w, h, 0.1), std({ color: glass, roughness: 0.08, metalness: 0.5, envMapIntensity: 1.5 }), 0, 0, 0, g, false); const a = add(new THREE.CircleGeometry(w / 2, 20, 0, Math.PI), std({ color: glass, roughness: 0.08, metalness: 0.5, envMapIntensity: 1.5 }), 0, h / 2, 0.051, g, false);
  add(box(w + 0.24, 0.16, 0.2), std({ color: '#f4ece0' }), 0, -h / 2 - 0.08, 0.06, g); for (const k of [-1, 0, 1]) add(box(0.06, h, 0.14), std({ color: '#e8e0d4' }), k * w / 3, 0, 0.06, g); add(box(w, 0.06, 0.14), std({ color: '#e8e0d4' }), 0, 0, 0.06, g); return g; };
// German workshop hall (white plaster, grey gabled roof, arched windows, big arched door)
const HALL = new THREE.Group(); HALL.position.set(-6, 0, -22); scene.add(HALL);
{ add(box(16, 8, 12), plasterM(4, 2), 0, 4, 0, HALL); const r = add(prism(17, 5, 12.8), roofM(6, 3), 0, 8, 0, HALL); r.rotation.y = 0; add(prism(16, 4.6, 0.3), plasterM(4, 1), 0, 8, 6.05, HALL);
  add(box(6, 6.4, 0.3), std({ color: '#2a2a30', roughness: 0.6 }), 0, 3.2, 6.05, HALL); add(new THREE.CircleGeometry(3, 24, 0, Math.PI), std({ color: '#2a2a30' }), 0, 6.4, 6.21, HALL, false); add(new THREE.TorusGeometry(3.15, 0.22, 8, 24, Math.PI), std({ color: '#d8d0c4' }), 0, 6.4, 6.2, HALL);
  for (const x of [-5.6, 5.6]) { archWin(HALL, x, 4.3, 6.05, 2.0, 3.0); } archWin(HALL, 0, 10.0, 6.25, 1.4, 1.4);
  for (const z of [-3.5, 0, 3.5]) for (const s of [-1, 1]) archWin(HALL, s * 8.05, 4.3, z, 1.8, 3.0, s * Math.PI / 2);
  add(box(16.4, 0.5, 12.4), std({ color: '#c8c0b4' }), 0, 0.25, 0, HALL); add(box(0.4, 9, 0.4), std({ color: '#3a3a40', metalness: 0.6, roughness: 0.4 }), -3.6, 4.5, 7.5, HALL); add(box(0.4, 9, 0.4), std({ color: '#3a3a40', metalness: 0.6, roughness: 0.4 }), 3.6, 4.5, 7.5, HALL); add(box(8, 0.5, 0.5), std({ color: '#3a3a40', metalness: 0.6, roughness: 0.4 }), 0, 9, 7.5, HALL); add(cyl(0.02, 0.02, 3, 4), std({ color: '#222' }), 1.5, 7.5, 7.5, HALL); add(box(0.5, 0.3, 0.3), std({ color: '#e8b84a', metalness: 0.8, roughness: 0.3 }), 1.5, 6, 7.5, HALL); }
// red-brick annexes with stepped gables (German side)
for (const [x, z, w] of [[-24, -20, 10], [12, -26, 9]]) { const G = new THREE.Group(); G.position.set(x, 0, z); scene.add(G); add(box(w, 7, 9), brickM(w / 2, 3.5), 0, 3.5, 0, G); add(prism(w + 0.6, 4, 9.6), roofM(4, 2, '#b84a32'), 0, 7, 0, G); for (let k = 0; k < 3; k++) archWin(G, -w / 3 + k * w / 3, 3.6, 4.55, 1.3, 2.2, 0, '#1a2a44'); add(cyl(0.45, 0.55, 5, 10), brickM(1, 2), w / 3, 9.5, -1.5, G); }
// Soviet tractor factory across the fence: long brick hall with sawtooth roof, chimneys, sign
const FAC = new THREE.Group(); FAC.position.set(46, 0, -24); scene.add(FAC);
{ add(box(36, 9, 16), brickM(16, 4), 0, 4.5, 0, FAC); for (let k = 0; k < 6; k++) { const t = add(prism(6, 3, 16.4), roofM(2, 3, '#7a7a84'), -15 + k * 6, 9, 0, FAC); t.rotation.y = 0; const sk = new THREE.Shape(); sk.moveTo(0, 0); sk.lineTo(6, 0); sk.lineTo(6, 3); const sg = new THREE.ExtrudeGeometry(sk, { depth: 16.4, bevelEnabled: false }); sg.translate(-3, 0, -8.2); }
  for (let k = 0; k < 3; k++) { add(box(7, 7, 0.3), std({ color: '#1e1e24' }), -12 + k * 12, 3.5, 8.05, FAC); add(box(7.6, 0.5, 0.5), std({ color: '#d8c8b0' }), -12 + k * 12, 7.2, 8.1, FAC); }
  for (const x of [-16, -6, 6]) { add(cyl(0.9, 1.2, 18, 14), brickM(2, 6), x, 9, -5, FAC); add(cyl(1.05, 1.05, 0.6, 14), std({ color: '#2a2a2a' }), x, 18.2, -5, FAC); }
  const [c, g] = cv(1024, 192); g.fillStyle = '#1f3a7a'; g.fillRect(0, 0, 1024, 192); g.strokeStyle = '#f2c94a'; g.lineWidth = 12; g.strokeRect(10, 10, 1004, 172); g.fillStyle = '#ffffff'; g.font = '900 104px Arial Black, Arial'; g.textAlign = 'center'; g.fillText('TRACTOR FACTORY', 512, 134);
  add(box(16, 3, 0.2), [std({ color: '#1f3a7a' }), std({ color: '#1f3a7a' }), std({ color: '#1f3a7a' }), std({ color: '#1f3a7a' }), new THREE.MeshStandardMaterial({ map: P.tex(c), roughness: 0.4 }), std({ color: '#1f3a7a' })], 0, 11.5, 8.3, FAC); }
const SMOKE_P = [[30, 19, -29], [40, 19, -29], [52, 19, -29]];
// wooden fence between the two yards (x = 24)
{ const fm = pbr('weathered_planks', [0.3, 1], { color: '#c89a6a', roughness: 0.6 }); for (let z = -18; z < 14; z += 0.42) add(box(0.06, 1.7 + (Math.round(z * 10) % 3) * 0.05, 0.32), fm, 24, 0.85, z); for (const y of [0.45, 1.3]) add(box(0.08, 0.14, 32), fm, 23.95, y, -2); }
// crates, oil drums, piles of tank parts in the German yard
const tankPartsM = std({ color: '#5a5e62', metalness: 0.6, roughness: 0.4 });
// ---------- countryside along the road (x = -200) ----------
const POLES = new THREE.Group(); scene.add(POLES); { const pm = pbr('fine_grained_wood', [1, 4], { color: '#6a4a32' }); const wm = std({ color: '#1a1a1a' }); for (let z = -300; z < 300; z += 28) { add(cyl(0.12, 0.15, 9, 8), pm, -194, 4.5, z, POLES); add(box(2.2, 0.14, 0.14), pm, -194, 8.4, z, POLES); }
  for (const dx of [-0.9, 0, 0.9]) { const w = add(cyl(0.015, 0.015, 600, 3), wm, -194 + dx, 8.55, 0, POLES, false); w.rotation.x = Math.PI / 2; } }
const TREES = []; const leafM = { summer: std({ color: '#3aa84a', roughness: 0.6 }), autumn: std({ color: '#e8962a', roughness: 0.6 }), winter: std({ color: '#f4f4fa', roughness: 0.7 }) };
const tree = (x, z, s = 1, kind = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); add(cyl(0.18, 0.28, 4, 8), pbr('fine_grained_wood', [1, 2], { color: kind ? '#e8e4dc' : '#5a3a24' }), 0, 2, 0, g); const r = R(7 + x * 3 + z);
  const blobs = []; for (let k = 0; k < 6; k++) { const b = add(new THREE.IcosahedronGeometry(1.1 + r() * 0.6, 1), leafM.summer, (r() - 0.5) * 2.2, 4 + r() * 2.4, (r() - 0.5) * 2.2, g); b.scale.y = kind ? 1.4 : 0.9; blobs.push(b); } TREES.push({ g, blobs }); return g; };
for (let i = 0; i < 40; i++) { const r = R(300 + i); const side = i % 2 ? 1 : -1; tree(-200 + side * (14 + r() * 40), -260 + i * 13 + r() * 6, 0.9 + r() * 0.6, i % 3 === 0 ? 1 : 0); }
for (const [x, z] of [[-30, -34], [-36, -10], [28, -40], [70, -10], [-14, -40], [60, 10]]) tree(x, z, 1.3, 0);
// wheat field (instanced golden stalk tufts) on the far side of the road; becomes stubble in autumn/winter
const wheatTex = (() => { const [c, g] = cv(64, 128); for (let i = 0; i < 9; i++) { const x = 8 + i * 6; g.strokeStyle = i % 2 ? '#e8c050' : '#f4d870'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 128); g.quadraticCurveTo(x + 3, 60, x + (i % 3 - 1) * 4, 20); g.stroke(); g.fillStyle = '#f8dc78'; g.beginPath(); g.ellipse(x + (i % 3 - 1) * 4, 18, 3.5, 12, 0, 0, 7); g.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const WHEAT = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.2, 1.4), new THREE.MeshStandardMaterial({ map: wheatTex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 }), 5000); WHEAT.userData.ndSkip = true;
{ const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); for (let i = 0; i < WHEAT.count; i++) { const r = R(9000 + i); const x = -212 - r() * 70, z = -200 + r() * 400; e.set(0, r() * Math.PI, 0); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, 0.65, z), q, new THREE.Vector3(1, 0.8 + r() * 0.4, 1)); WHEAT.setMatrixAt(i, m4); } } scene.add(WHEAT);
const HILLS = new THREE.Group(); scene.add(HILLS); for (let i = 0; i < 14; i++) { const r = R(700 + i); const h = add(new THREE.SphereGeometry(40 + r() * 40, 18, 10), std({ color: '#5ab85a', roughness: 0.9 }), -200 + (r() - 0.5) * 700, -18, -340 + (r() - 0.5) * 200, HILLS, false); h.scale.y = 0.35; } for (let i = 0; i < 14; i++) { const r = R(760 + i); const h = add(new THREE.SphereGeometry(40 + r() * 40, 18, 10), std({ color: '#5ab85a', roughness: 0.9 }), 30 + (r() - 0.5) * 300, -18, -260 + (r() - 0.5) * 80, HILLS, false); h.scale.y = 0.35; }
// ---------- tanks ----------
const trackLinkGeo = new THREE.BoxGeometry(0.62, 0.06, 0.13);
const makeTrack = (parent, x, len, h, w, r0) => { const g = new THREE.Group(); g.position.x = x; parent.add(g); const s = new THREE.Shape(); const L2 = len / 2 - r0; s.moveTo(-L2, -r0); s.lineTo(L2, -r0); s.absarc(L2, 0, r0, -Math.PI / 2, Math.PI / 2, false); s.lineTo(-L2, r0); s.absarc(-L2, 0, r0, Math.PI / 2, Math.PI * 1.5, false);
  const eg = new THREE.ExtrudeGeometry(s, { depth: w * 0.92, bevelEnabled: false, curveSegments: 10 }); eg.translate(0, 0, -w * 0.46); const m = new THREE.Mesh(eg, std({ color: '#2e2c2a', roughness: 0.8 })); m.rotation.y = Math.PI / 2; m.position.y = r0 + 0.02; m.castShadow = true; g.add(m);
  const per = 2 * (len - 2 * r0) + 2 * Math.PI * r0; const n = Math.floor(per / 0.16); const links = new THREE.InstancedMesh(trackLinkGeo, std({ color: '#4a4846', metalness: 0.7, roughness: 0.45 }), n); links.castShadow = true; g.add(links);
  return { g, links, n, per, len, r0, w }; };
const updTrack = (T, off) => { const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); const L2 = T.len / 2 - T.r0, flat = 2 * L2, arc = Math.PI * T.r0;
  for (let i = 0; i < T.n; i++) { let d = ((i * T.per / T.n + off) % T.per + T.per) % T.per; let z, y, a;
    if (d < flat) { z = -L2 + d; y = 0; a = 0; } else if ((d -= flat) < arc) { const t = d / T.r0; z = L2 + Math.sin(t) * T.r0; y = T.r0 - Math.cos(t) * T.r0; a = t; } else if ((d -= arc) < flat) { z = L2 - d; y = 2 * T.r0; a = Math.PI; } else { d -= flat; const t = d / T.r0; z = -L2 - Math.sin(t) * T.r0; y = T.r0 + Math.cos(t) * T.r0; a = Math.PI + t; }
    e.set(a, 0, 0); q.setFromEuler(e); m4.compose(new THREE.Vector3(0, y + 0.02, z), q, new THREE.Vector3(1, 1, 1)); T.links.setMatrixAt(i, m4); } T.links.instanceMatrix.needsUpdate = true; };
const numTex = (txt, fg = '#ffffff', bg = null) => { const [c, g] = cv(256, 160); if (bg) { g.fillStyle = bg; g.fillRect(0, 0, 256, 160); } g.font = '900 120px Arial Black, Arial'; g.textAlign = 'center'; g.lineWidth = 10; g.strokeStyle = '#1a1a1a'; g.strokeText(txt, 128, 128); g.fillStyle = fg; g.fillText(txt, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const decal = (parent, tex, x, y, z, w, h, ry) => { const m = add(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5 }), x, y, z, parent, false); m.rotation.y = ry; m.userData.ndSkip = true; return m; };
const TANKS = [];
// painted armour textures: camo/olive base + panel lines, welds, rivets, grime
const armourTex = (kind, seed = 1) => { const [c, g] = cv(1024, 1024), r = P.rng(seed); if (kind === 'tiger') { g.fillStyle = '#c8a868'; g.fillRect(0, 0, 1024, 1024);
    for (const [col, n] of [['#6e7040', 22], ['#7a4a2c', 16]]) for (let i = 0; i < n; i++) { g.fillStyle = col; g.beginPath(); const cx = r() * 1024, cy = r() * 1024; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283, rr = 60 + r() * 70; g[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr * 1.6, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); } }
  else { g.fillStyle = '#4a5a2c'; g.fillRect(0, 0, 1024, 1024); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '90,110,50' : '40,50,25'},.25)`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 40 + r() * 90, 30 + r() * 60, r() * 3, 0, 7); g.fill(); } }
  g.strokeStyle = 'rgba(30,25,15,.45)'; g.lineWidth = 4; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(k * 256, 0); g.lineTo(k * 256, 1024); g.stroke(); g.beginPath(); g.moveTo(0, k * 256); g.lineTo(1024, k * 256); g.stroke(); }
  g.fillStyle = 'rgba(20,18,12,.55)'; for (let k = 1; k < 4; k++) for (let y = 12; y < 1024; y += 34) { g.beginPath(); g.arc(k * 256 + 10, y, 4, 0, 7); g.fill(); g.beginPath(); g.arc(y, k * 256 + 10, 4, 0, 7); g.fill(); }
  if (kind !== 'tiger') { g.strokeStyle = 'rgba(80,70,40,.6)'; g.lineWidth = 7; for (let i = 0; i < 6; i++) { g.beginPath(); let x = r() * 1024, y = r() * 1024; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 30; y += 14; g.lineTo(x, y); } g.stroke(); } }
  for (let i = 0; i < 26; i++) { const x = r() * 1024; const gr = g.createLinearGradient(0, 760, 0, 1024); gr.addColorStop(0, 'rgba(70,50,30,0)'); gr.addColorStop(1, 'rgba(70,50,30,.35)'); g.fillStyle = gr; g.fillRect(x, 760, 20 + r() * 60, 264); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.05})`; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 4, 1 + r() * 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
const TIGTEX = armourTex('tiger', 4), T34TEX = armourTex('t34', 9);
const armour = (tex, rep = 1, rough = 0.55) => { const t = tex.clone(); t.repeat.set(rep, rep); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, roughness: rough, metalness: 0.25, envMapIntensity: 1.0 }); };
const gunmetal = std({ color: '#3a3a3c', metalness: 0.8, roughness: 0.35 }), rubber = std({ color: '#1e1c1a', roughness: 0.9 }), woodH = std({ color: '#8a5a32', roughness: 0.7 }), glassL = std({ color: '#fff4d0', emissive: '#a08040', emissiveIntensity: 0.3, roughness: 0.05, metalness: 0.4 });
const grille = (w, d) => { const [c, g] = cv(128, 128); g.fillStyle = '#2a2a24'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#585848'; for (let i = 0; i < 128; i += 8) { g.fillRect(i, 0, 3, 128); g.fillRect(0, i, 128, 3); } const t = P.tex(c); t.repeat.set(w * 2, d * 2); t.wrapS = t.wrapT = THREE.RepeatWrapping; return new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, metalness: 0.5 })); };
const tool = (G, x, y, z, len, ry = 0, kind = 0) => { const h = add(box(0.05, 0.05, len), woodH, x, y, z, G); h.rotation.y = ry; if (kind === 1) add(box(0.22, 0.03, 0.28), gunmetal, x, y, z + len / 2, G); if (kind === 2) add(box(0.04, 0.16, 0.24), gunmetal, x, y + 0.05, z + len / 2, G); };
const makeTiger = () => { const G = new THREE.Group(); scene.add(G); const B = { G, kind: 'tiger', wheels: [] };
  const P0 = armour(TIGTEX, 0.5), Pd = armour(TIGTEX, 0.35, 0.6); const paint = () => P0;
  add(box(1.9, 1.0, 5.8), Pd, 0, 0.95, 0, G); add(box(3.5, 0.9, 6.2), P0, 0, 1.85, -0.1, G); const fp = add(box(3.5, 1.0, 0.24), P0, 0, 1.75, 3.0, G); fp.rotation.x = -0.15; add(box(3.6, 0.08, 6.5), P0, 0, 2.33, -0.1, G);
  add(box(1.9, 0.6, 0.3), P0, 0, 1.2, 3.05, G).rotation.x = 0.5; for (const s of [-1, 1]) { add(box(0.12, 0.12, 0.35), gunmetal, s * 1.2, 1.05, 3.25, G); add(new THREE.TorusGeometry(0.1, 0.03, 6, 10), gunmetal, s * 1.2, 0.9, 3.35, G); }
  add(box(0.6, 0.22, 0.12), P0, -0.8, 2.05, 3.13, G); add(box(0.5, 0.06, 0.04), std({ color: '#101014' }), -0.8, 2.05, 3.2, G); add(new THREE.SphereGeometry(0.17, 12, 10), P0, 0.9, 1.95, 3.12, G); add(cyl(0.04, 0.04, 0.45, 6), gunmetal, 0.9, 1.95, 3.35, G).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) { const hl = add(cyl(0.11, 0.11, 0.22, 12), gunmetal, s * 1.3, 2.5, 2.85, G); hl.rotation.x = Math.PI / 2; add(new THREE.CircleGeometry(0.09, 12), glassL, s * 1.3, 2.5, 2.97, G, false); }
  // engine deck: grilles, air filters, exhausts, tools, tow cable
  const g1 = grille(1.2, 1.6); g1.position.set(0.7, 2.39, -2.2); G.add(g1); const g2 = grille(1.2, 1.6); g2.position.set(-0.7, 2.39, -2.2); G.add(g2);
  for (const s of [-1, 1]) { add(cyl(0.22, 0.22, 0.6, 14), P0, s * 0.75, 2.4, -3.0, G).rotation.x = Math.PI / 2; add(cyl(0.12, 0.14, 0.9, 10), std({ color: '#4a2a1a', roughness: 0.9 }), s * 0.6, 2.55, -3.32, G); add(box(0.4, 0.5, 0.06), P0, s * 0.6, 2.55, -3.45, G); }
  tool(G, -1.55, 2.42, -1.2, 1.4, 0, 1); tool(G, -1.55, 2.42, 0.6, 1.1, 0, 2); tool(G, 1.55, 2.42, 0.2, 1.6, 0, 0);
  { const pts = []; for (let k = 0; k <= 10; k++) pts.push(new THREE.Vector3(1.78, 2.05 + Math.sin(k / 10 * Math.PI) * 0.08, -2.8 + k * 0.56)); add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.035, 6), gunmetal, 0, 0, 0, G); }
  for (const s of [-1, 1]) { const T = makeTrack(G, s * 1.42, 6.3, 0, 0.72, 0.55); B['track' + (s > 0 ? 'R' : 'L')] = T; add(box(0.78, 0.06, 6.7), P0, s * 1.45, 2.34, -0.1, G);
    for (let k = 0; k < 8; k++) { for (const inner of [0, 1]) { const w = add(cyl(0.4, 0.4, 0.1, 22), P0, s * (1.42 + (inner ? -0.12 : 0.2)), 0.58, -2.45 + k * 0.7 + (inner ? 0.35 : 0), G); w.rotation.z = Math.PI / 2; if (k === 7 && inner) w.visible = false; B.wheels.push(w); const rim = add(new THREE.TorusGeometry(0.36, 0.035, 6, 20), rubber, s * (1.42 + (inner ? -0.07 : 0.26)), 0.58, -2.45 + k * 0.7 + (inner ? 0.35 : 0), G); rim.rotation.y = Math.PI / 2; add(cyl(0.12, 0.12, 0.12, 10), gunmetal, s * (1.42 + (inner ? -0.05 : 0.27)), 0.58, -2.45 + k * 0.7 + (inner ? 0.35 : 0), G).rotation.z = Math.PI / 2; } }
    const sp = add(cyl(0.44, 0.44, 0.3, 14), gunmetal, s * 1.42, 0.95, 2.85, G); sp.rotation.z = Math.PI / 2; const id = add(cyl(0.36, 0.36, 0.3, 14), gunmetal, s * 1.42, 0.95, -2.95, G); id.rotation.z = Math.PI / 2; }
  const TU = new THREE.Group(); TU.position.set(0, 2.36, 0.2); G.add(TU); B.turret = TU; const tb = add(new THREE.CylinderGeometry(1.38, 1.45, 1.05, 32), P0, 0, 0.52, 0, TU); tb.scale.z = 1.08; add(new THREE.CylinderGeometry(1.36, 1.38, 0.05, 32), P0, 0, 1.06, 0, TU).scale.z = 1.08;
  const ml = add(new THREE.CylinderGeometry(0.55, 0.55, 1.9, 20, 1, false, -Math.PI / 2, Math.PI), P0, 0, 0.55, 1.4, TU); ml.rotation.z = Math.PI / 2; add(box(0.3, 0.3, 0.2), P0, 0.55, 0.85, 1.55, TU);
  const cup = add(cyl(0.38, 0.4, 0.32, 18), P0, -0.6, 1.22, -0.55, TU); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; add(box(0.1, 0.08, 0.06), std({ color: '#101014', roughness: 0.1 }), -0.6 + Math.cos(a) * 0.39, 1.24, -0.55 + Math.sin(a) * 0.39, TU).rotation.y = -a; } add(cyl(0.36, 0.36, 0.05, 18), P0, -0.6, 1.4, -0.55, TU);
  add(cyl(0.32, 0.32, 0.06, 16), P0, 0.6, 1.1, -0.2, TU); add(box(1.6, 0.7, 0.6), P0, 0, 0.6, -1.62, TU);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const sd = add(cyl(0.05, 0.05, 0.3, 8), gunmetal, s * (1.1 + k * 0.08), 0.95, 1.0 - k * 0.12, TU); sd.rotation.x = -0.7; }
  const GUN = new THREE.Group(); GUN.position.set(0, 0.55, 1.75); TU.add(GUN); B.gun = GUN; const bar = add(cyl(0.12, 0.15, 5.0, 16), P0, 0, 0, 2.5, GUN); bar.rotation.x = Math.PI / 2; add(cyl(0.18, 0.18, 0.6, 16), P0, 0, 0, 0.3, GUN).rotation.x = Math.PI / 2;
  for (const z of [4.95, 5.25]) { const m1 = add(cyl(0.2, 0.2, 0.16, 16), gunmetal, 0, 0, z, GUN); m1.rotation.x = Math.PI / 2; } add(cyl(0.14, 0.14, 0.5, 14), gunmetal, 0, 0, 5.1, GUN).rotation.x = Math.PI / 2;
  B.rings = []; for (let k = 0; k < 8; k++) { const r = add(new THREE.TorusGeometry(0.135, 0.022, 6, 16), std({ color: '#fbfbf4', roughness: 0.5 }), 0, 0, 3.4 - k * 0.15, GUN); r.visible = false; B.rings.push(r); }
  decal(TU, numTex('13'), 1.41, 0.55, -0.4, 1.0, 0.62, Math.PI / 2); decal(TU, numTex('13'), -1.41, 0.55, -0.4, 1.0, 0.62, -Math.PI / 2);
  for (let k = 0; k < 5; k++) { add(box(0.3, 0.07, 0.5), gunmetal, 1.43, 0.3, 0.4 + k * 0.2, TU).rotation.z = Math.PI / 2; add(box(0.3, 0.07, 0.5), gunmetal, -1.43, 0.3, 0.4 + k * 0.2, TU).rotation.z = Math.PI / 2; }
  B.snow = add(box(3.0, 0.06, 4.2), std({ color: '#f8f8ff', roughness: 0.7 }), 0, 2.37, -1.0, G); B.snow.visible = false;
  G.traverse((o) => { if (o.isMesh) o.castShadow = true; }); TANKS.push(B); return B; };
const makeT34 = (num = '85') => { const G = new THREE.Group(); scene.add(G); const B = { G, kind: 't34', wheels: [] };
  const P0 = armour(T34TEX, 0.45), Pd = armour(T34TEX, 0.3, 0.6);
  const s = new THREE.Shape(); [[-3.0, 0.55], [2.75, 0.55], [3.1, 0.95], [1.75, 1.75], [-2.55, 1.75], [-3.05, 1.2]].forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y))); const hg = new THREE.ExtrudeGeometry(s, { depth: 2.95, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 }); hg.translate(0, 0, -1.475);
  { const uv = hg.attributes.uv, p = hg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + 3) / 4, (p.getY(i) + p.getZ(i)) / 4); }
  const hull = new THREE.Mesh(hg, P0); hull.rotation.y = -Math.PI / 2; hull.castShadow = true; G.add(hull);
  // glacis details: driver hatch, MG ball, headlight, spare tracks, tow hooks
  const gl = new THREE.Group(); gl.position.set(0, 1.35, 2.42); gl.rotation.x = -1.0; G.add(gl); add(box(0.75, 0.6, 0.08), Pd, -0.55, 0, 0, gl); add(box(0.4, 0.08, 0.06), std({ color: '#101014' }), -0.55, 0.12, 0.06, gl); for (const x of [-0.85, -0.25]) add(box(0.06, 0.06, 0.06), gunmetal, x, -0.2, 0.06, gl);
  for (let k = 0; k < 3; k++) add(box(0.55, 0.22, 0.06), gunmetal, 0.35 + (k % 2) * 0.1, -0.35 + k * 0.25, 0.05, gl);
  add(new THREE.SphereGeometry(0.13, 10, 8), Pd, 0.75, 1.45, 2.42, G); add(cyl(0.035, 0.035, 0.35, 6), gunmetal, 0.75, 1.45, 2.6, G).rotation.x = Math.PI / 2; const hl = add(cyl(0.1, 0.1, 0.2, 12), gunmetal, -1.15, 1.8, 2.0, G); hl.rotation.x = Math.PI / 2; add(new THREE.CircleGeometry(0.08, 12), glassL, -1.15, 1.8, 2.11, G, false);
  for (const sd of [-1, 1]) add(new THREE.TorusGeometry(0.1, 0.03, 6, 10), gunmetal, sd * 1.1, 0.85, 3.08, G);
  // deck: engine grille, exhausts, handrails, tools
  const eg = grille(1.6, 1.2); eg.position.set(0, 1.78, -1.8); G.add(eg); for (const sd of [-1, 1]) { const ex = add(cyl(0.09, 0.09, 0.3, 10), std({ color: '#5a2e1a', roughness: 0.9 }), sd * 0.55, 1.05, -3.12, G); ex.rotation.x = Math.PI / 2; }
  tool(G, 1.3, 1.8, 0.2, 1.4, 0, 1); tool(G, -1.3, 1.8, -0.6, 1.2, 0, 2);
  for (const sd of [-1, 1]) { const T = makeTrack(G, sd * 1.3, 6.0, 0, 0.55, 0.5); B['track' + (sd > 0 ? 'R' : 'L')] = T; add(box(0.62, 0.05, 6.3), P0, sd * 1.32, 1.12, 0, G);
    for (let k = 0; k < 5; k++) { const w = add(cyl(0.44, 0.44, 0.22, 24), rubber, sd * 1.33, 0.52, -2.3 + k * 1.15, G); w.rotation.z = Math.PI / 2; const hb = add(cyl(0.34, 0.34, 0.24, 18), P0, sd * 1.34, 0.52, -2.3 + k * 1.15, G); hb.rotation.z = Math.PI / 2; const hc = add(cyl(0.1, 0.1, 0.27, 8), gunmetal, sd * 1.36, 0.52, -2.3 + k * 1.15, G); hc.rotation.z = Math.PI / 2;
      for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2; const hole = add(cyl(0.05, 0.05, 0.26, 8), std({ color: '#1a1a16' }), sd * 1.345, 0.52 + Math.cos(a) * 0.2, -2.3 + k * 1.15 + Math.sin(a) * 0.2, G); hole.rotation.z = Math.PI / 2; } B.wheels.push({ w, hb, hc, k, sd }); }
    for (const z of [-2.0, -0.8]) { add(cyl(0.22, 0.22, 0.85, 14), Pd, sd * 1.58, 1.5, z, G).rotation.x = Math.PI / 2; add(new THREE.TorusGeometry(0.23, 0.02, 6, 14), gunmetal, sd * 1.58, 1.5, z, G).rotation.y = Math.PI / 2; } }
  const TU = new THREE.Group(); TU.position.set(0, 1.77, 0.6); G.add(TU); B.turret = TU; const tb = add(new THREE.CylinderGeometry(1.0, 1.18, 0.85, 6), P0, 0, 0.42, 0, TU); tb.rotation.y = Math.PI / 6; tb.scale.z = 1.18;
  for (const x of [0.38, -0.38]) { add(cyl(0.3, 0.3, 0.12, 16), Pd, x, 0.9, -0.35, TU); add(cyl(0.05, 0.05, 0.1, 6), gunmetal, x, 0.98, -0.35, TU); }
  for (const sd of [-1, 1]) { const pts = [new THREE.Vector3(sd * 1.0, 0.45, 0.6), new THREE.Vector3(sd * 1.12, 0.5, 0.1), new THREE.Vector3(sd * 1.12, 0.5, -0.5), new THREE.Vector3(sd * 1.0, 0.45, -0.9)]; add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.025, 6), gunmetal, 0, 0, 0, TU); add(box(0.08, 0.1, 0.08), std({ color: '#101014' }), sd * 0.6, 0.88, 0.5, TU); }
  const GUN = new THREE.Group(); GUN.position.set(0, 0.42, 1.0); TU.add(GUN); B.gun = GUN; add(box(0.7, 0.5, 0.4), Pd, 0, 0, 0, GUN); add(cyl(0.16, 0.16, 0.5, 12), Pd, 0, 0, 0.4, GUN).rotation.x = Math.PI / 2; const bar = add(cyl(0.085, 0.1, 3.6, 14), P0, 0, 0, 1.9, GUN); bar.rotation.x = Math.PI / 2;
  decal(TU, numTex(num), 1.1, 0.42, 0, 0.8, 0.5, Math.PI / 2); decal(TU, numTex(num), -1.1, 0.42, 0, 0.8, 0.5, -Math.PI / 2);
  B.snow = add(box(2.9, 0.06, 2.4), std({ color: '#f8f8ff', roughness: 0.7 }), 0, 1.79, -1.4, G); B.snow.visible = false; B.rings = [];
  G.traverse((o) => { if (o.isMesh) o.castShadow = true; }); TANKS.push(B); return B; };
const makeTractor = (col = '#c8382a') => { const G = new THREE.Group(); scene.add(G); const B = { G, kind: 'tractor', wheels: [] }; const P0 = std({ color: col, roughness: 0.35, metalness: 0.3, envMapIntensity: 1.2 }), blk = std({ color: '#2a2622', roughness: 0.8 });
  add(box(0.9, 0.85, 2.1), P0, 0, 1.25, 0.6, G); add(box(0.95, 0.95, 0.12), std({ color: '#3a3a3a', metalness: 0.7, roughness: 0.3 }), 0, 1.25, 1.7, G); add(box(0.6, 0.5, 1.2), P0, 0, 0.75, -0.6, G); add(box(0.5, 0.08, 0.5), blk, 0, 1.5, -1.0, G); add(cyl(0.05, 0.06, 1.0, 8), blk, 0.25, 2.0, 1.1, G);
  const sw = add(new THREE.TorusGeometry(0.2, 0.025, 6, 16), blk, 0, 1.85, -0.5, G); sw.rotation.x = -0.6;
  for (const s of [-1, 1]) { const rw = add(cyl(0.78, 0.78, 0.38, 22), blk, s * 0.82, 0.78, -0.75, G); rw.rotation.z = Math.PI / 2; const hub = add(cyl(0.5, 0.5, 0.4, 16), P0, s * 0.83, 0.78, -0.75, G); hub.rotation.z = Math.PI / 2; B.wheels.push(rw, hub);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const lug = add(box(0.38, 0.12, 0.08), blk, s * 0.82, 0.78 + Math.cos(a) * 0.8, -0.75 + Math.sin(a) * 0.8, rw.parent); lug.rotation.x = -a; }
    const fw = add(cyl(0.38, 0.38, 0.2, 16), blk, s * 0.55, 0.38, 1.4, G); fw.rotation.z = Math.PI / 2; B.wheels.push(fw); add(box(1.0, 0.08, 0.6), P0, s * 0.82, 1.6, -0.75, G); }
  G.traverse((o) => { if (o.isMesh) o.castShadow = true; }); TANKS.push(B); return B; };
const TIG = [makeTiger(), makeTiger()]; const T34 = ['85', '12', '3', '47', '21', '9', '33', '64'].map((n) => makeT34(n)); const TRAC = [makeTractor('#c8382a'), makeTractor('#3a7ac8'), makeTractor('#2a8a4a')];
const LOOSEWHEEL = new THREE.Group(); scene.add(LOOSEWHEEL); { const w = add(cyl(0.44, 0.44, 0.22, 20), std({ color: '#2a2a28', roughness: 0.85 }), 0, 0, 0, LOOSEWHEEL); w.rotation.z = Math.PI / 2; const hb = add(cyl(0.33, 0.33, 0.24, 16), std({ color: '#3e5a2a', roughness: 0.5 }), 0, 0, 0, LOOSEWHEEL); hb.rotation.z = Math.PI / 2; add(cyl(0.09, 0.09, 0.26, 8), std({ color: '#5a5a50', metalness: 0.6 }), 0, 0, 0, LOOSEWHEEL).rotation.z = Math.PI / 2; }
// shells in flight + muzzle flash reuse `bang`
const SHELLS = [0, 1, 2, 3].map(() => { const m = add(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3, 1.4) }), 0, 0, 0, scene, false); m.userData.ndSkip = true; m.visible = false; return m; });
// mile line: a dashed yellow tape on the ground
const MILE = new THREE.Group(); scene.add(MILE); MILE.visible = false; { const tm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.25, 0.2) }); for (let k = 0; k < 60; k++) { const d = add(box(0.5, 0.05, 1.2), tm, 0, 0.08, -k * 2.5, MILE, false); d.userData.ndSkip = true; } }
// ================= POCKET WATCH (x = 300) =================
ZONE = 'watch';
const WAT = new THREE.Group(); WAT.position.set(300, 0, 0); scene.add(WAT);
const velvet = (() => { const [c, g] = cv(256, 256); g.fillStyle = '#5a1a2a'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255,.03' : '0,0,0,.08'})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); } return P.tex(c); })();
add(box(12, 0.4, 8), std({ map: velvet, roughness: 0.95 }), 0, 0.8, 0, WAT);
const goldM = std({ color: '#f0b848', metalness: 1, roughness: 0.18, envMapIntensity: 1.6 }), brassM = std({ color: '#d89a3a', metalness: 1, roughness: 0.25, envMapIntensity: 1.5 }), steelM = std({ color: '#c8d0d8', metalness: 1, roughness: 0.2 });
const gearGeo = (r, teeth, th = 0.06, hole = 0.3) => { const s = new THREE.Shape(); const n = teeth * 4; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; const rr = (i % 4 < 2) ? r : r * 0.88; const p = [Math.cos(a) * rr, Math.sin(a) * rr]; i ? s.lineTo(...p) : s.moveTo(...p); }
  const hp = new THREE.Path(); hp.absarc(0, 0, r * hole, 0, Math.PI * 2, true); s.holes.push(hp); for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4; const sp = new THREE.Path(); sp.absarc(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, r * 0.16, 0, Math.PI * 2, true); s.holes.push(sp); }
  const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1, curveSegments: 6 }); g.rotateX(-Math.PI / 2); return g; };
const GEARS = []; { const GW = new THREE.Group(); GW.position.set(0.8, 1.05, 0); WAT.add(GW); add(cyl(2.2, 2.2, 0.15, 48), brassM, 0, 0, 0, GW);
  for (const [x, z, r, n, sp, m] of [[0, 0, 0.9, 24, 0.5, goldM], [1.2, 0.5, 0.5, 14, -0.9, brassM], [-0.9, 0.9, 0.6, 16, -0.75, goldM], [0.3, -1.25, 0.55, 15, -0.8, brassM], [-1.1, -0.6, 0.42, 12, 1.0, steelM], [1.4, -0.7, 0.35, 10, 1.3, goldM]]) { const gm = new THREE.Mesh(gearGeo(r, n), m); gm.position.set(x, 0.12, z); gm.castShadow = true; GW.add(gm); GEARS.push({ m: gm, sp }); add(cyl(0.07, 0.07, 0.3, 10), std({ color: '#c8322f', roughness: 0.1, metalness: 0.2 }), x, 0.2, z, GW); }
  WAT.userData.gw = GW; }
{ const WC = new THREE.Group(); WC.position.set(-2.6, 1.05, 0.4); WAT.add(WC); add(cyl(1.6, 1.6, 0.3, 48), goldM, 0, 0.1, 0, WC); add(new THREE.TorusGeometry(1.6, 0.12, 12, 48), goldM, 0, 0.25, 0, WC).rotation.x = Math.PI / 2;
  const [c, g] = cv(512, 512); g.fillStyle = '#fbf6ea'; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill(); g.fillStyle = '#1a1a24'; g.font = '700 54px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((t, i) => { const a = i / 12 * Math.PI * 2; g.fillText(t, 256 + Math.sin(a) * 195, 256 - Math.cos(a) * 195); }); for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; g.fillRect(256 + Math.sin(a) * 236 - 2, 256 - Math.cos(a) * 236 - 2, 4, 4); }
  const face = add(new THREE.CircleGeometry(1.5, 48), new THREE.MeshStandardMaterial({ map: P.tex(c), roughness: 0.15 }), 0, 0.27, 0, WC, false); face.rotation.x = -Math.PI / 2; const hm = std({ color: '#1a1a24', metalness: 0.5, roughness: 0.3 });
  const hh = add(box(0.07, 0.02, 0.8), hm, 0, 0.3, -0.35, WC, false); const mh = add(box(0.05, 0.02, 1.2), hm, 0, 0.31, -0.55, WC, false); WAT.userData.hands = [hh, mh]; add(cyl(0.08, 0.08, 0.06, 10), goldM, 0, 0.31, 0, WC);
  add(cyl(0.18, 0.18, 0.35, 14), goldM, 0, 0.12, -1.85, WC).rotation.x = Math.PI / 2; add(new THREE.TorusGeometry(0.22, 0.05, 8, 16), goldM, 0, 0.12, -2.15, WC); for (let k = 0; k < 9; k++) { const l = add(new THREE.TorusGeometry(0.1, 0.03, 6, 12), goldM, 0.1 * Math.sin(k), 0.1, -2.4 - k * 0.17, WC); l.rotation.y = k % 2 ? 0 : Math.PI / 2; } }
const WATL = [lamp(301, 6, 4, '#fff0d8', 30, 20, 0.01), lamp(296, 4, -3, '#ffd8a0', 12, 14, 0.01)];
// rain + snow + splash instanced around the camera
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
const SUMENV = skyEnv('#2a6ae0', '#d8ecff', '#5a8a3a', '#ffffff'), AUTENV = skyEnv('#6a7488', '#c8ccd0', '#5a4a3a', '#e8e8f0'), WINENV = skyEnv('#3a78e0', '#e0ecff', '#e8eef8', '#ffffff'), WATENV = skyEnv('#3a2a20', '#ffe0b0', '#4a2a20', '#ffffff');
const PRESET = {
  summer: { hemi: ['#d8ecff', '#7a9a5a', 1.4], key: ['#fff2dc', 4.0], fog: ['#b8d8ff', 0.0016], sky: 1, sun: [0.55, 0.6, 0.55], expo: 1.05, lamps: 0, sat: 1.32, env: SUMENV, bloomK: 0.8, thr: 1.05, rays: 0.25, zone: 'land', season: 'summer' },
  autumn: { hemi: ['#c8d0e0', '#5a4a3a', 1.6], key: ['#e8e4dc', 1.8], fog: ['#9aa4b4', 0.006], sky: 3, sun: [0.4, 0.6, 0.6], expo: 1.08, lamps: 0, sat: 1.3, env: AUTENV, bloomK: 0.7, thr: 1.1, rays: 0, zone: 'land', season: 'autumn' },
  winter: { hemi: ['#e8f0ff', '#9aa8c8', 1.5], key: ['#fff4e8', 3.2], fog: ['#d8e6fa', 0.0035], sky: 1, sun: [0.55, 0.45, 0.6], expo: 0.95, lamps: 0, sat: 1.3, env: WINENV, bloomK: 0.75, thr: 1.1, rays: 0.25, zone: 'land', season: 'winter' },
  watch: { hemi: ['#ffe8d0', '#4a2a20', 0.8], key: ['#fff4e0', 2.2], fog: ['#2a1a14', 0.0005], sky: 1, sun: [0.3, 0.9, 0.4], expo: 1.05, lamps: 1, sat: 1.25, env: WATENV, bloomK: 0.9, thr: 1.0, rays: 0, zone: 'watch', season: 'summer' },
};
// ================= per-frame =================
import { stateAt, TOTAL } from './shots.js';
const camR = new THREE.Vector3(), M4 = new THREE.Matrix4(), SC = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3();
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const tankById = (id) => id[0] === 'T' ? TIG[+id.slice(1)] : id[0] === 'S' ? T34[+id.slice(1)] : TRAC[+id.slice(1)];
const tankW = (id, p) => { const B = tankById(id); B.G.updateMatrixWorld(true); return V.set(p[0], p[1], p[2]).applyMatrix4(B.G.matrixWorld).clone(); };
let lastSeason = '';
window.renderFrame = (f) => {
  const S = stateAt(f, {}), t = f / 30;
  const L = PRESET[S.preset || 'summer'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2]; moon.color.set(L.key[0]); moon.intensity = S.key ?? L.key[1];
  scene.fog.color.set(L.fog[0]); scene.fog.density = S.fog ?? L.fog[1]; skyU.day.value = L.sky; skyU.sunD.value.set(...L.sun); scene.environment = L.env;
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(0, 0, 0); inkU.flash.value = S.flash || 0; inkU.bloomK.value = S.bloomK ?? L.bloomK; brightU.thr.value = S.thr ?? L.thr; inkU.split.value = 0; inkU.greenK.value = 0;
  const zone = L.zone; for (const l of pLights) { l.visible = L.lamps > 0 && l.userData.zone === zone; l.intensity = l.userData.I0; } for (const g of glows) g.visible = (L.lamps > 0 && g.userData.zone === zone) || g.userData.zone === 'fx';
  const season = L.season; if (season !== lastSeason) { ground.material = GROUND[season]; TREES.forEach((tr) => tr.blobs.forEach((b) => (b.material = leafM[season]))); WHEAT.visible = season === 'summer'; HILLS.children.forEach((h) => h.material.color.set(season === 'summer' ? '#5ab85a' : season === 'autumn' ? '#8a7a4a' : '#f4f8ff')); YARD.material.color.set(season === 'winter' ? '#e8e8f4' : '#c8b8a8'); if (!ROAD.userData.m0) ROAD.userData.m0 = ROAD.material; ROAD.material = season === 'winter' ? GROUND.winter : ROAD.userData.m0; ROAD.userData.m0.color.set(season === 'summer' ? '#c8a070' : '#5a4028'); lastSeason = season; }
  // tanks
  TANKS.forEach((B) => (B.G.visible = false)); LOOSEWHEEL.visible = false;
  (S.tanks || []).forEach((tk) => { const B = tankById(tk.id); B.G.visible = true; B.G.position.set(tk.x, tk.y || 0, tk.z); B.G.rotation.set(tk.pitch || 0, tk.yaw || 0, tk.roll || 0);
    if (B.turret) B.turret.rotation.y = tk.turret || 0; if (B.gun) { B.gun.rotation.x = -(tk.gun || 0); B.gun.position.z = (B.kind === 'tiger' ? 1.5 : 1.0) - (tk.recoil || 0) * 0.5; }
    const mv = tk.move || 0; if (B.trackL) { updTrack(B.trackL, mv); updTrack(B.trackR, mv); }
    if (B.kind === 't34') B.wheels.forEach((w) => { const off = (tk.wheelOff || []).includes(w.k + (w.sd > 0 ? 10 : 0)); w.w.visible = w.hb.visible = w.hc.visible = !off; w.w.rotation.x = w.hb.rotation.x = mv / 0.44; });
    else if (B.kind === 'tiger') B.wheels.forEach((w) => (w.rotation.x = mv / 0.4)); else B.wheels.forEach((w, i) => (w.rotation.x = mv / (i % 3 === 2 ? 0.38 : 0.78)));
    (B.rings || []).forEach((r, i) => (r.visible = i < (tk.rings || 0))); if (B.snow) B.snow.visible = !!tk.snow;  });
  if (S.loose) { LOOSEWHEEL.visible = true; const p = S.loose.tank ? tankW(S.loose.tank, S.loose.p) : new THREE.Vector3(...S.loose.p); LOOSEWHEEL.position.copy(p); LOOSEWHEEL.rotation.set(S.loose.rx || 0, S.loose.ry || 0, S.loose.rz || 0); }
  // watch gears
  WAT.visible = zone === 'watch'; if (WAT.visible) { GEARS.forEach((g) => (g.m.rotation.y = t * g.sp * (S.gearSpeed ?? 1))); const [hh, mh] = WAT.userData.hands; hh.rotation.y = -t * 0.05; mh.rotation.y = -t * 0.6; hh.position.set(Math.sin(hh.rotation.y) * -0.35, 0.3, Math.cos(hh.rotation.y) * -0.35); mh.position.set(Math.sin(mh.rotation.y) * -0.55, 0.31, Math.cos(mh.rotation.y) * -0.55); }
  // camera
  const sh = S.shake || 0, hh = S.handheld ?? 0.012; let look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  if (S.camTank) { pos = tankW(S.camTank, S.cam); look = tankW(S.camTank, S.look); }
  if (S.orbit) { const d = pos.clone().sub(look); d.applyAxisAngle(new THREE.Vector3(0, 1, 0), S.orbit); pos.copy(look).add(d); }
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look.x + (rnd(f, 3) - 0.5) * sh * 1.5, look.y + (rnd(f, 4) - 0.5) * sh * 1.5, look.z); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); camR.setFromMatrixColumn(camera.matrixWorld, 0); sky.position.copy(camera.position);
  const fc = S.shadowAt ? S.shadowAt : [look.x, look.y, look.z], sd = new THREE.Vector3(...L.sun).normalize(); moon.position.set(fc[0] + sd.x * 60, fc[1] + Math.max(sd.y, 0.25) * 60, fc[2] + sd.z * 60); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 18; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 220; sc.updateProjectionMatrix(); }
  { const sv = sd.clone().multiplyScalar(500).add(camera.position).project(camera); inkU.sunUV.value.set(sv.x * 0.5 + 0.5, sv.y * 0.5 + 0.5); inkU.raysK.value = sv.z < 1 ? (S.rays ?? L.rays) : 0; }
  // shells / mile tape
  SHELLS.forEach((m, i) => { const sh2 = (S.shells || [])[i]; m.visible = !!sh2; if (!sh2) return; const a = new THREE.Vector3(...sh2.from), b = new THREE.Vector3(...sh2.to); const k = sh2.k; if (k <= 1) m.position.copy(a.lerp(b, k)); else { const bb = new THREE.Vector3(...sh2.to); const d = new THREE.Vector3(...(sh2.bounce || [3, 4, -6])); m.position.copy(bb.add(d.multiplyScalar(k - 1))); } m.scale.setScalar(sh2.s || 1); });
  MILE.visible = !!S.mile; if (S.mile) { MILE.position.set(...S.mile.p); MILE.rotation.y = S.mile.ry || 0; MILE.children.forEach((d, i) => (d.visible = i < (S.mile.n ?? 60))); }
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
  if (S.bang) { bang.visible = true; const bp = S.bang.tank ? tankW(S.bang.tank, S.bang.p) : new THREE.Vector3(...S.bang.p); bang.position.copy(bp); bang.scale.setScalar(S.bang.s || 1); bangLight.position.copy(bp); bangLight.intensity = 30 * (S.bang.k ?? 1); }
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw); c.mesh.visible = true; let px = a.x, py = a.y, pz = a.z; if (a.tank) { const w = tankW(a.tank, [a.x, a.y, a.z]); px = w.x; py = w.y; pz = w.z; }
    c.mesh.position.set(px, py, pz); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, a.yaw ?? Math.atan2(camera.position.x - px, camera.position.z - pz), a.roll || 0); c.mat.color.set(a.tint || S.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2; c.mesh.castShadow = !a.fx;
    c.blob.visible = !a.fx && a.blob !== false && !a.tank; c.blob.position.set(px, (a.ground ?? py) + 0.015, pz); c.blob.scale.set(1.0 * s, 0.55 * s, 1); });
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
