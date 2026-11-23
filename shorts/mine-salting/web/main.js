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

const NAMES = ['wooden_barrels_01', 'wooden_crate_01', 'wooden_crate_02', 'old_military_crate', 'wooden_bucket_01'];
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
const PBRN = ['rock_boulder_dry', 'gravel_floor_02', 'weathered_brown_planks', 'dry_ground_rocks', 'red_sandstone_wall', 'weathered_planks', 'fine_grained_wood'];
await Promise.all(PBRN.flatMap((n) => ['diff', 'nor', 'rough'].map((k) => new Promise((res) => TXL.load(`tex/${n}_${k}.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (k === 'diff') t.colorSpace = THREE.SRGBColorSpace; TX[n + k] = t; res(); }, undefined, () => res())))));
const pbr = (n, rep, o = {}) => { const r = Array.isArray(rep) ? rep : [rep, rep]; const cl = (t) => { const c = t.clone(); c.repeat.set(r[0], r[1]); c.needsUpdate = true; return c; };
  return new THREE.MeshStandardMaterial({ map: cl(TX[n + 'diff']), normalMap: cl(TX[n + 'nor']), roughnessMap: cl(TX[n + 'rough']), roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2), ...o }); };
const R = (s) => P.rng(s);
ZONE = 'town';
// ================= MINE WORLD =================
ZONE = 'mine';
const rockM = (rx, ry, col = '#c89068') => pbr('rock_boulder_dry', [rx, ry], { color: col, roughness: 0.7, normalScale: new THREE.Vector2(2.2, 2.2), side: THREE.DoubleSide });
const timberM = pbr('weathered_brown_planks', [0.5, 2], { color: '#c89060', roughness: 0.6 });
const ironM = std({ color: '#4a4440', metalness: 0.8, roughness: 0.35 });
// tunnel along -z from z=6 to z=-46, arched rock tube with uneven walls
const TUN = new THREE.Group(); scene.add(TUN);
{ const g = new THREE.CylinderGeometry(3.0, 3.0, 52, 40, 60, true, Math.PI / 2, Math.PI * 1.0); g.rotateX(Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = Math.sin(z * 1.3 + x * 2.1) * 0.18 + Math.sin(z * 3.1 - y * 2.7) * 0.12 + Math.sin(x * 5 + z * 4.3) * 0.06; const k = 1 + n / 3; p.setX(i, x * k * 1.05); p.setY(i, y * k); }
  g.computeVertexNormals(); const tube = new THREE.Mesh(g, rockM(5, 26)); tube.rotation.z = Math.PI / 2 * 0; tube.position.set(0, 0.0, -20); tube.scale.set(1, 1.08, 1); tube.receiveShadow = true; TUN.add(tube);
  const fl = add(new THREE.PlaneGeometry(6.4, 52), pbr('gravel_floor_02', [3, 24], { color: '#b08a60', roughness: 0.8 }), 0, 0.01, -20, TUN, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  for (const x of [-0.55, 0.55]) add(box(0.08, 0.1, 52), ironM, x, 0.12, -20, TUN); for (let z = 5; z > -46; z -= 0.8) add(box(1.6, 0.1, 0.22), timberM, 0, 0.06, z, TUN);
  for (let z = 4; z > -44; z -= 4.5) { for (const s of [-1, 1]) { const post = add(box(0.32, 3.2, 0.32), timberM, s * 2.45, 1.6, z, TUN); post.rotation.z = -s * 0.06; } add(box(5.4, 0.36, 0.38), timberM, 0, 3.2, z, TUN); for (const s of [-1, 1]) add(box(0.6, 0.28, 0.3), timberM, s * 2.0, 2.98, z, TUN).rotation.z = s * 0.6; }
}
// back wall (end face of the dig) at z = -42, and the hidden vein behind
const BACKW = new THREE.Group(); BACKW.position.set(0, 0, -42); scene.add(BACKW);
{ const g = new THREE.CircleGeometry(3.3, 48); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 2.3) * 0.15 + Math.sin(p.getY(i) * 3.1) * 0.12); g.computeVertexNormals(); const w = add(g, rockM(3, 3), 0, 1.4, 0, BACKW); w.receiveShadow = true; BACKW.userData.wall = w; }
const VEIN = new THREE.Group(); VEIN.position.set(0, 0, -41.8); scene.add(VEIN); VEIN.visible = false;
{ const goldV = std({ color: '#f0b030', emissive: '#a06808', emissiveIntensity: 0.35, metalness: 1, roughness: 0.25, envMapIntensity: 1.4 }); const s = new THREE.Shape(); const pts = []; for (let k = 0; k <= 16; k++) { const y = -0.2 + k * 0.24; pts.push([0.25 + Math.sin(k * 1.7) * 0.18 + k * 0.03, y]); } s.moveTo(-pts[0][0], pts[0][1]); pts.forEach(([x, y]) => s.lineTo(x * 1.2, y)); for (let k = pts.length - 1; k >= 0; k--) s.lineTo(-pts[k][0] - Math.sin(k * 2.3) * 0.12, pts[k][1]);
  const vg = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }); const v = add(vg, goldV, 0.2, 0, 0, VEIN); v.rotation.z = 0.12;
  for (let i = 0; i < 18; i++) { const r = R(1200 + i); add(new THREE.DodecahedronGeometry(0.04 + r() * 0.07), goldV, (r() - 0.5) * 1.2, r() * 3.4, 0.2 + r() * 0.15, VEIN).userData.ndSkip = true; }
  VEIN.userData.light = new THREE.PointLight('#ffc860', 0, 6, 1.6); VEIN.userData.light.position.set(0, 1.8, 1.2); VEIN.add(VEIN.userData.light); }
// rubble that appears after the blast
const RUBBLE = new THREE.Group(); RUBBLE.position.set(0, 0, -39.5); scene.add(RUBBLE); RUBBLE.visible = false; for (let i = 0; i < 30; i++) { const r = R(1300 + i); add(new THREE.DodecahedronGeometry(0.15 + r() * 0.35), rockM(1, 1), (r() - 0.5) * 4, 0.1 + r() * 0.3, (r() - 0.5) * 3, RUBBLE); }
// salted gold specks on the walls (instanced, sparkle)
const SPECK = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.035), std({ color: '#ffd860', emissive: '#e8a020', emissiveIntensity: 1.6, metalness: 1, roughness: 0.2 }), 500); scene.add(SPECK); SPECK.visible = false; SPECK.userData.ndSkip = true;
{ const m4 = new THREE.Matrix4(); for (let i = 0; i < 500; i++) { const r = R(2000 + i); const z = -28 - r() * 13, a = Math.PI * (0.05 + r() * 0.9), s = r() < 0.5 ? -1 : 1; const x = Math.cos(a) * 2.75 * (r() < 0.5 ? 1 : -1), y = Math.sin(a) * 2.9; m4.makeTranslation(x, Math.max(0.2, y), z); SPECK.setMatrixAt(i, m4); } }
// lanterns hanging from the caps
const lantern = (x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g); add(cyl(0.12, 0.14, 0.28, 10), std({ color: '#ffd890', emissive: '#ffb040', emissiveIntensity: 2.2, roughness: 0.2 }), 0, 0, 0, g, false); add(cyl(0.16, 0.16, 0.05, 10), ironM, 0, 0.16, 0, g); add(cyl(0.16, 0.16, 0.05, 10), ironM, 0, -0.16, 0, g); add(new THREE.TorusGeometry(0.08, 0.015, 6, 10), ironM, 0, 0.25, 0, g); return g; };
for (let z = 4; z > -44; z -= 9) { lantern(1.2, 2.75, z); lamp(1.2, 2.6, z, '#ffb050', 9, 12, 0.3); }
lamp(0, 2.6, -38, '#ffb050', 10, 12, 0.25);
// mine cart on the rails + props
const CART = new THREE.Group(); CART.position.set(0, 0, -14); scene.add(CART); { const cm = pbr('weathered_brown_planks', [1, 1], { color: '#a86a3a' }); add(box(1.3, 0.8, 1.9), cm, 0, 0.75, 0, CART); for (const s of [-1, 1]) for (const z of [-0.6, 0.6]) { const w = add(cyl(0.22, 0.22, 0.08, 14), ironM, s * 0.55, 0.24, z, CART); w.rotation.z = Math.PI / 2; } for (const y of [0.45, 1.05]) add(box(1.35, 0.07, 1.95), ironM, 0, y, 0, CART); for (let i = 0; i < 10; i++) { const r = R(1500 + i); add(new THREE.DodecahedronGeometry(0.18 + r() * 0.12), rockM(1, 1), (r() - 0.5) * 0.9, 1.15, (r() - 0.5) * 1.4, CART); } }
put('wooden_barrels_01', 1.7, 0, -20, 0.4, 1.0); put('wooden_crate_01', -1.8, 0, -24, 0.2, 1.1); put('wooden_crate_02', -1.9, 0, -9, 0.5, 1.0); put('wooden_bucket_01', 1.6, 0, -31, 0, 1.4); put('old_military_crate', 1.7, 0, -37, 0.2, 1.0);
// pickaxes leaning on the wall
for (const [x, z, a] of [[-2.2, -33, 0.3], [2.2, -27, -0.3]]) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.z = a; scene.add(g); add(box(0.06, 1.3, 0.06), timberM, 0, 0.65, 0, g); add(box(0.7, 0.08, 0.08), ironM, 0, 1.28, 0, g); }
// ---------- canyon outside (x = 200): mine entrance, shack, sign, pines, car ----------
ZONE = 'canyon';
const CAN = new THREE.Group(); CAN.position.set(200, 0, 0); scene.add(CAN);
{ const gr = add(new THREE.PlaneGeometry(260, 260), pbr('dry_ground_rocks', [40, 40], { color: '#d8a878', roughness: 0.85 }), 0, 0, 0, CAN, false); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true;
  const cliffM = pbr('rock_boulder_dry', [5, 4], { color: '#e8a070', roughness: 0.75 }); for (const [x, z, w, h, d] of [[0, -16, 40, 22, 10], [-26, -8, 14, 16, 24], [26, -6, 16, 18, 22], [-14, -30, 30, 30, 10], [16, -34, 30, 34, 10]]) { const c = add(box(w, h, d), cliffM, x, h / 2, z, CAN); c.receiveShadow = true; }
  for (let i = 0; i < 18; i++) { const r = R(3000 + i); const x = (r() - 0.5) * 50; if (Math.abs(x) < 9) continue; const rk = add(new THREE.DodecahedronGeometry(0.6 + r() * 1.2, 1), cliffM, x, 0.3, -10 + r() * 4, CAN); rk.scale.y = 0.6; }
  // portal
  const P0 = new THREE.Group(); P0.position.set(0, 0, -10.9); CAN.add(P0); add(box(5.2, 4.4, 0.4), std({ color: '#140c08', roughness: 1 }), 0, 2.2, 0.1, P0); for (const s of [-1, 1]) add(box(0.45, 4.6, 0.45), timberM, s * 2.6, 2.3, 0.4, P0); add(box(6.2, 0.5, 0.55), timberM, 0, 4.7, 0.4, P0);
  const [c, g] = cv(1024, 192); g.fillStyle = '#5a3a1e'; g.fillRect(0, 0, 1024, 192); g.strokeStyle = '#e8c070'; g.lineWidth = 10; g.strokeRect(12, 12, 1000, 168); g.fillStyle = '#ffe8b0'; g.font = '900 96px Georgia'; g.textAlign = 'center'; g.fillText('LUCKY JAKE MINE', 512, 128);
  add(box(6, 1.1, 0.12), [timberM, timberM, timberM, timberM, new THREE.MeshStandardMaterial({ map: P.tex(c), roughness: 0.6 }), timberM], 0, 5.6, 0.5, P0);
  for (const x of [-0.55, 0.55]) add(box(0.08, 0.1, 14), ironM, x, 0.12, 6.5, P0); for (let z = 0; z < 14; z += 0.8) add(box(1.6, 0.1, 0.22), timberM, 0, 0.06, z, P0);
  // shack
  const SHK = new THREE.Group(); SHK.position.set(10, 0, -4); SHK.rotation.y = -0.4; CAN.add(SHK); add(box(5, 3.2, 4), pbr('weathered_planks', [3, 2], { color: '#c8905a' }), 0, 1.6, 0, SHK); const rf = add(new THREE.BoxGeometry(5.6, 0.2, 4.8), std({ color: '#7a6a5a', metalness: 0.5, roughness: 0.5 }), 0, 3.45, 0, SHK); rf.rotation.x = 0.12; add(box(1.0, 2.0, 0.1), pbr('fine_grained_wood', [1, 1], { color: '#6a3a22' }), -1, 1.0, 2.02, SHK); add(box(1.1, 0.8, 0.08), std({ color: '#ffd890', emissive: '#a06020', emissiveIntensity: 0.6 }), 1.2, 1.7, 2.02, SHK);
  for (let i = 0; i < 26; i++) { const r = R(3100 + i); const x = (r() - 0.5) * 90, z = -40 - r() * 40; const t = new THREE.Group(); t.position.set(x, 18 + r() * 8, z); CAN.add(t); add(cyl(0.3, 0.4, 3, 6), std({ color: '#5a3a24' }), 0, 1.5, 0, t); for (let k = 0; k < 3; k++) add(new THREE.ConeGeometry(2.4 - k * 0.6, 3, 9), std({ color: '#2a6a3a', roughness: 0.8 }), 0, 3.5 + k * 1.6, 0, t); }
}
// FOR SALE sign (appears when nailed up)
const SIGN = new THREE.Group(); SIGN.position.set(203.5, 0, -8.6); scene.add(SIGN); { add(box(0.18, 2.4, 0.18), timberM, 0, 1.2, 0, SIGN); const [c, g] = cv(512, 320); g.fillStyle = '#f0dcae'; g.fillRect(0, 0, 512, 320); g.strokeStyle = '#5a3a1e'; g.lineWidth = 14; g.strokeRect(8, 8, 496, 304); g.fillStyle = '#c8322f'; g.font = '900 104px Georgia'; g.textAlign = 'center'; g.fillText('FOR SALE', 256, 140); g.fillStyle = '#3a2414'; g.font = '900 64px Georgia'; g.fillText('RICH VEIN!', 256, 250);
  add(box(1.8, 1.12, 0.08), [timberM, timberM, timberM, timberM, new THREE.MeshStandardMaterial({ map: P.tex(c), roughness: 0.6 }), timberM], 0, 2.1, 0.1, SIGN); }
// the millionaire's car: white touring car, red seats, brass lamps, spoked wheels
const CAR = new THREE.Group(); scene.add(CAR); { const white = std({ color: '#f8f6f0', roughness: 0.18, metalness: 0.2, envMapIntensity: 1.4 }), red = std({ color: '#c8282a', roughness: 0.4 }), brass = std({ color: '#f0b848', metalness: 1, roughness: 0.2 });
  add(box(1.7, 0.7, 4.2), white, 0, 0.95, 0, CAR); add(box(1.5, 0.75, 1.5), white, 0, 1.0, 1.6, CAR); add(box(1.3, 0.5, 0.1), brass, 0, 1.0, 2.36, CAR); for (const z of [-0.6, -1.6]) { add(box(1.6, 0.35, 0.8), red, 0, 1.45, z, CAR); add(box(1.6, 0.7, 0.2), red, 0, 1.7, z - 0.45, CAR); }
  const sw = add(new THREE.TorusGeometry(0.22, 0.03, 6, 16), std({ color: '#2a2a2a' }), -0.4, 1.75, 0.35, CAR); sw.rotation.x = -0.9; for (const s of [-1, 1]) { add(cyl(0.16, 0.16, 0.26, 12), brass, s * 0.65, 1.35, 2.35, CAR).rotation.x = Math.PI / 2; add(new THREE.CircleGeometry(0.13, 12), std({ color: '#fff4d0', emissive: '#a08040', emissiveIntensity: 0.5 }), s * 0.65, 1.35, 2.49, CAR, false); }
  CAR.userData.wheels = []; for (const s of [-1, 1]) for (const z of [1.5, -1.5]) { const w = new THREE.Group(); w.position.set(s * 0.95, 0.6, z); CAR.add(w); add(new THREE.TorusGeometry(0.5, 0.1, 10, 24), std({ color: '#1a1a1a', roughness: 0.8 }), 0, 0, 0, w).rotation.y = Math.PI / 2; for (let k = 0; k < 10; k++) { const sp = add(cyl(0.025, 0.025, 0.9, 6), red, 0, 0, 0, w); sp.rotation.x = k / 10 * Math.PI; } add(cyl(0.1, 0.1, 0.16, 10), brass, 0, 0, 0, w).rotation.z = Math.PI / 2; CAR.userData.wheels.push(w); }
  for (const s of [-1, 1]) add(box(0.3, 0.06, 4.6), white, s * 0.98, 0.95, 0, CAR); CAR.traverse((o) => { if (o.isMesh) o.castShadow = true; }); }
// ---------- gold pan macro (x = 300) ----------
ZONE = 'pan';
const PAN = new THREE.Group(); PAN.position.set(300, 0, 0); scene.add(PAN);
{ add(box(10, 0.4, 8), pbr('weathered_brown_planks', [3, 2], { color: '#b07a4a' }), 0, 0.6, 0, PAN); const prof = []; for (let i = 0; i <= 14; i++) { const a = i / 14; prof.push(new THREE.Vector2(0.05 + 1.3 * a, 0.02 + 0.32 * Math.pow(a, 2.2))); } add(new THREE.LatheGeometry(prof, 48), std({ color: '#5a5a62', metalness: 0.85, roughness: 0.28, side: THREE.DoubleSide, envMapIntensity: 1.4 }), 0, 0.82, 0, PAN);
  const wt = add(new THREE.CircleGeometry(1.15, 48), std({ color: '#6a9ac8', roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.18, envMapIntensity: 1.0, depthWrite: false }), 0, 1.0, 0, PAN, false); wt.rotation.x = -Math.PI / 2; PAN.userData.water = wt;
  const sand = add(new THREE.CircleGeometry(0.75, 32), std({ color: '#1e1a18', roughness: 0.9 }), 0, 0.855, 0, PAN, false); sand.rotation.x = -Math.PI / 2;
  PAN.userData.flakes = []; for (let i = 0; i < 110; i++) { const r = R(4000 + i * 977); const a = i * 2.39996 + Math.sin(i * 12.9898) * 0.6, rr = 0.1 + 0.62 * Math.sqrt((i + 0.5) / 110) * (0.8 + 0.4 * ((i * 0.618) % 1)); const f = add(new THREE.CircleGeometry(0.022 + 0.03 * ((i * 0.37) % 1), 6), std({ color: '#ffd040', emissive: '#c88a10', emissiveIntensity: 0.5, metalness: 1, roughness: 0.15 }), Math.cos(a) * rr, 0.87 + r() * 0.01, Math.sin(a) * rr, PAN, false); f.rotation.x = -Math.PI / 2; PAN.userData.flakes.push(f); } }
const PANL = [lamp(301.5, 4, 2, '#ffd8a0', 18, 14, 0.01)];
// cash stack (money on the crate)
const CASH = new THREE.Group(); scene.add(CASH); CASH.visible = false; { const [c, g] = cv(256, 128); g.fillStyle = '#9ac88a'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#2a5a2a'; g.lineWidth = 8; g.strokeRect(8, 8, 240, 112); g.fillStyle = '#2a5a2a'; g.font = '900 60px Georgia'; g.textAlign = 'center'; g.fillText('$100', 128, 86); const bm = new THREE.MeshStandardMaterial({ map: P.tex(c), roughness: 0.6 });
  for (let i = 0; i < 10; i++) { const b = add(box(0.62, 0.12, 0.3), [std({ color: '#cfe0c0' }), std({ color: '#cfe0c0' }), bm, std({ color: '#cfe0c0' }), std({ color: '#cfe0c0' }), std({ color: '#cfe0c0' })], (i % 2) * 0.66 - 0.33, 0.06 + Math.floor(i / 2) * 0.12, 0, CASH); b.rotation.y = (i % 3) * 0.05; add(box(0.12, 0.125, 0.31), std({ color: '#c8322f' }), (i % 2) * 0.66 - 0.33, 0.06 + Math.floor(i / 2) * 0.12, 0, CASH); } }
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
const MINEENV = skyEnv('#3a2414', '#ffb860', '#4a2a14', '#fff0c0'), CANENV = skyEnv('#3a7ae0', '#ffe8c8', '#c89060', '#ffffff');
const PRESET = {
  mine: { hemi: ['#ffd8a8', '#3a2214', 0.55], key: ['#ffe0b0', 0.8], fog: ['#2a1a10', 0.02], sky: 1, sun: [0.2, 0.9, 0.3], expo: 1.12, lamps: 1, sat: 1.3, env: MINEENV, bloomK: 0.95, thr: 0.95, rays: 0, zone: 'mine' },
  canyon: { hemi: ['#ffe8d0', '#a0704a', 1.4], key: ['#fff0d8', 3.8], fog: ['#f0d0a8', 0.0025], sky: 1, sun: [0.5, 0.6, 0.6], expo: 1.04, lamps: 0, sat: 1.3, env: CANENV, bloomK: 0.8, thr: 1.05, rays: 0.3, zone: 'canyon' },
  pan: { hemi: ['#ffe8d0', '#4a2a14', 0.8], key: ['#fff4e0', 2.0], fog: ['#2a1a10', 0.0005], sky: 1, sun: [0.3, 0.9, 0.4], expo: 1.05, lamps: 1, sat: 1.3, env: MINEENV, bloomK: 0.9, thr: 1.0, rays: 0, zone: 'pan' },
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
  // props
  SPECK.visible = !!S.salt; SPECK.material.emissiveIntensity = 1.2 + 0.8 * Math.sin(t * 9); VEIN.visible = !!S.vein; VEIN.userData.light.intensity = S.vein ? 6 : 0; RUBBLE.visible = !!S.rubble; SIGN.visible = !!S.sign; CART.position.z = S.cartZ ?? -14;
  CAR.visible = !!S.car; if (S.car) { CAR.position.set(S.car.x, 0, S.car.z); CAR.rotation.y = S.car.yaw || 0; CAR.userData.wheels.forEach((w) => (w.rotation.x = (S.car.move || 0) / 0.55)); }
  CASH.visible = !!S.cash; if (S.cash) CASH.position.set(...S.cash);
  PAN.visible = zone === 'pan'; if (PAN.visible) { PAN.userData.water.rotation.z = t * (S.swirl || 0); PAN.userData.flakes.forEach((f, i) => { const a = Math.atan2(f.position.z, f.position.x) + (S.swirl || 0) * 0.01 * (i % 2 ? 1 : 0.7); const rr = Math.hypot(f.position.x, f.position.z); f.position.x = Math.cos(a) * rr; f.position.z = Math.sin(a) * rr; f.material.emissiveIntensity = 0.35 + Math.max(0, Math.sin(t * 7 + i * 1.7)) * 0.9; }); }
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
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw); c.mesh.visible = true; let px = a.x, py = a.y, pz = a.z;
    c.mesh.position.set(px, py, pz); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
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
