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

const NAMES = ['Barrel_01', 'wooden_crate_01', 'wooden_crate_02', 'tea_set_01', 'WoodenTable_01', 'ArmChair_01', 'Chandelier_01', 'book_encyclopedia_set_01', 'fancy_picture_frame_01', 'vintage_grandfather_clock_01', 'wooden_bookshelf_worn', 'brass_candleholders', 'GreenChair_01', 'pocket_watch'];
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
const rtB1 = new THREE.WebGLRenderTarget(W / 4, H / 4, { type: THREE.HalfFloatType }), rtB2 = new THREE.WebGLRenderTarget(W / 4, H / 4, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const fsv = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
const brightU = { src: { value: rtColor.texture }, thr: { value: 1.2 } }, blurU = { src: { value: null }, dir: { value: new THREE.Vector2() } };
const brightScene = fs(new THREE.ShaderMaterial({ uniforms: brightU, vertexShader: fsv, fragmentShader: `uniform sampler2D src; uniform float thr; varying vec2 vUv; void main(){ vec3 c = texture2D(src, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(thr, thr + .5, l), 1.); }` }));
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
  void main(){ vec3 c = texture2D(col, vUv).rgb; float e = edgeAt(vUv, px); c += texture2D(bloom, vUv).rgb * bloomK; if (raysK > 0.) { vec2 dd = (sunUV - vUv) / 32.; vec2 uv = vUv; float dec = 1.; vec3 rr = vec3(0.); for (int i=0;i<32;i++){ uv += dd; rr += texture2D(bloom, clamp(uv, 0., 1.)).rgb * dec; dec *= .955; } c += rr / 32. * raysK; } c = aces(c * expo); c = mix(c, vec3(.012,.01,.02), e * worldInk);
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
const PBRN = ['snow_02', 'snow_field_aerial', 'excavated_soil_wall', 'asphalt_snow', 'grey_roof_01', 'weathered_plank_siding', 'wood_floor_worn', 'old_planks_02', 'stone_wall', 'fine_grained_wood', 'cobblestone_floor_04', 'plastered_wall_02', 'clay_roof_tiles'];
await Promise.all(PBRN.flatMap((n) => ['diff', 'nor', 'rough'].map((k) => new Promise((res) => TXL.load(`tex/${n}_${k}.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (k === 'diff') t.colorSpace = THREE.SRGBColorSpace; TX[n + k] = t; res(); }, undefined, () => res())))));
const pbr = (n, rep, o = {}) => { const r = Array.isArray(rep) ? rep : [rep, rep]; const cl = (t) => { const c = t.clone(); c.repeat.set(r[0], r[1]); c.needsUpdate = true; return c; };
  return new THREE.MeshStandardMaterial({ map: cl(TX[n + 'diff']), normalMap: cl(TX[n + 'nor']), roughnessMap: cl(TX[n + 'rough']), roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2), ...o }); };
const R = (s) => P.rng(s);
ZONE = 'town';
// ================= SNOWY STREET (along z), big painted houses both sides =================
const SNOW = pbr('snow_field_aerial', 200, { color: '#f4f0ff', roughness: 0.6, envMapIntensity: 1.4 });
const ground = add(new THREE.PlaneGeometry(900, 900), SNOW, 0, 0, -150, scene, false); ground.rotation.x = -Math.PI / 2;
const road = add(new THREE.PlaneGeometry(8, 160), pbr('asphalt_snow', [2, 40], { color: '#e8e4f4', roughness: 0.5 }), 0, 0.01, -30, scene, false); road.rotation.x = -Math.PI / 2;
for (const s of [-1, 1]) { const w = add(new THREE.PlaneGeometry(2.2, 160), pbr('cobblestone_floor_04', [1, 60], { color: '#d8d0e8' }), s * 5.2, 0.02, -30, scene, false); w.rotation.x = -Math.PI / 2; }
const COLS = ['#f4a0c0', '#5ac0b8', '#f4cc5a', '#a8e0b8', '#b8a0f0', '#f49478', '#7ab4f0', '#e8b0e8'];
const TRIMW = std({ color: '#fffaf4', roughness: 0.25, envMapIntensity: 1.4 }), SNOWCAP = std({ color: '#f8f8ff', roughness: 0.3, envMapIntensity: 1.6 });
const WINLIT = new THREE.MeshStandardMaterial({ color: '#ffd890', emissive: '#ffb050', emissiveIntensity: 1.6, roughness: 0.2 });
const WINDARK = new THREE.MeshStandardMaterial({ color: '#283048', emissive: '#000000', roughness: 0.1, metalness: 0.4 });
const gable = (w, h, d) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(0, h); sh.lineTo(w / 2, 0); sh.lineTo(-w / 2, 0); const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g; };
const HOUSES = [];
const house = (x, z, side, ci, seed, opts = {}) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(g); const r = R(seed);
  const W = 8 + r() * 2, D = 7, H1 = 3.4, floors = opts.floors || (2 + (r() < 0.4 ? 1 : 0)), col = COLS[ci % COLS.length];
  const SID = pbr('weathered_plank_siding', [3, 2], { color: col, roughness: 0.32, envMapIntensity: 1.4 }); add(box(W, H1 * floors, D), SID, 0, H1 * floors / 2 + 0.4, 0, g); add(box(W + 0.3, 0.45, D + 0.3), pbr('stone_wall', [3, 0.3], { color: '#c8b8d0' }), 0, 0.22, 0, g);
  for (let f = 1; f < floors; f++) add(box(W + 0.15, 0.18, D + 0.15), TRIMW, 0, f * H1 + 0.4, 0, g);
  const roofH = 2.8 + r() * 1.2, rf = add(gable(W + 1.2, roofH, D + 1.2), pbr('grey_roof_01', [3, 2], { color: '#6a5878', roughness: 0.5 }), 0, H1 * floors + 0.4, 0, g); rf.rotation.y = Math.PI / 2;
  const cap = add(gable(W + 1.3, roofH * 0.35, D + 1.3), SNOWCAP, 0, H1 * floors + 0.4 + roofH * 0.66, 0, g); cap.rotation.y = Math.PI / 2;
  const fg = add(gable(W * 0.55, roofH * 0.8, 0.3), TRIMW, 0, H1 * floors + 0.4, D / 2 + 0.05, g); // front gable trim
  add(box(0.8, 2.2, 0.8), pbr('stone_wall', [1, 2], { color: '#b88878' }), W * 0.3, H1 * floors + roofH * 0.7 + 0.4, -1, g);
  // windows on every floor (lit or dark), with white frames and shutters
  const wins = []; for (let f = 0; f < floors; f++) for (const wx of [-W * 0.3, W * 0.3]) { if (f === 0 && Math.abs(wx) < 0.1) continue; const wy = f * H1 + 0.4 + 1.9; const lit = r() < 0.7;
    const wm = add(box(1.2, 1.6, 0.08), lit ? WINLIT : WINDARK, wx, wy, D / 2 + 0.02, g, false); wins.push(wm); add(box(1.42, 0.14, 0.14), TRIMW, wx, wy + 0.86, D / 2 + 0.06, g); add(box(1.42, 0.14, 0.2), TRIMW, wx, wy - 0.86, D / 2 + 0.08, g); add(box(0.1, 1.7, 0.12), TRIMW, wx, wy, D / 2 + 0.06, g);
    for (const s of [-1, 1]) add(box(0.4, 1.7, 0.06), std({ color: '#3a2a4a', roughness: 0.6 }), wx + s * 0.95, wy, D / 2 + 0.05, g); }
  // bay window on the ground floor
  const bay = add(box(2.4, 2.2, 1.0), SID, -W * 0.28, 1.6, D / 2 + 0.5, g); add(box(2.0, 1.4, 0.06), r() < 0.8 ? WINLIT : WINDARK, -W * 0.28, 1.8, D / 2 + 1.02, g, false); add(box(2.7, 0.2, 1.3), TRIMW, -W * 0.28, 2.8, D / 2 + 0.55, g); add(box(2.7, 0.12, 1.3), SNOWCAP, -W * 0.28, 2.94, D / 2 + 0.55, g, false);
  // porch: deck, columns, railing, roof with snow, steps, door, lamp
  const P0 = D / 2, PD = 2.4; add(box(W * 0.62, 0.3, PD), pbr('wood_floor_worn', [2, 1], { color: '#c8a8b8' }), W * 0.18, 0.55, P0 + PD / 2, g);
  for (let k = 0; k < 3; k++) add(box(1.4, 0.18, 0.4), TRIMW, W * 0.18, 0.09 + k * 0.18, P0 + PD + 0.2 + (2 - k) * 0.4, g);
  for (const px of [-W * 0.12, W * 0.18 - 0.7, W * 0.18 + 0.7, W * 0.48]) add(cyl(0.11, 0.13, 2.7, 10), TRIMW, px, 2.05, P0 + PD - 0.15, g);
  add(box(W * 0.66, 0.22, PD + 0.3), TRIMW, W * 0.18, 3.45, P0 + PD / 2, g); add(box(W * 0.68, 0.14, PD + 0.4), SNOWCAP, W * 0.18, 3.62, P0 + PD / 2, g, false);
  for (const [x0, x1] of [[-W * 0.12, W * 0.18 - 0.7], [W * 0.18 + 0.7, W * 0.48]]) { add(box(x1 - x0, 0.08, 0.08), TRIMW, (x0 + x1) / 2, 1.5, P0 + PD - 0.15, g); for (let bx = x0 + 0.25; bx < x1; bx += 0.25) add(box(0.05, 0.75, 0.05), TRIMW, bx, 1.1, P0 + PD - 0.15, g); }
  const door = add(box(1.1, 2.3, 0.1), std({ color: ['#7a2a4a', '#2a4a7a', '#2a6a5a', '#8a4a2a'][ci % 4], roughness: 0.35, metalness: 0.1 }), W * 0.18, 1.85, P0 + 0.05, g); add(box(0.6, 0.5, 0.05), WINLIT, W * 0.18, 2.45, P0 + 0.11, g, false); add(new THREE.TorusGeometry(0.75, 0.08, 6, 20, Math.PI), TRIMW, W * 0.18, 3.0, P0 + 0.1, g);
  const lampM = add(box(0.25, 0.4, 0.25), new THREE.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ffb050', emissiveIntensity: 2.0 }), W * 0.18 + 0.9, 2.6, P0 + 0.2, g, false);
  for (let k = 0; k < 8; k++) add(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(...[[2, 0.3, 0.3], [0.3, 2, 0.5], [2, 1.6, 0.3], [0.4, 0.8, 2.2]][k % 4]) }), -W * 0.12 + k * (W * 0.6) / 7, 3.3, P0 + PD - 0.1, g, false); // string lights
  // fence + snowy hedge in front yard
  for (let k = 0; k < 9; k++) { const fx = -W / 2 + k * (W / 8); if (Math.abs(fx - W * 0.18) < 0.8) continue; add(box(0.08, 1.0, 0.08), TRIMW, fx, 0.5, P0 + PD + 1.9, g); }
  add(box(W, 0.08, 0.08), TRIMW, 0, 0.85, P0 + PD + 1.9, g);
  const glob = { g, wins, lamp: lampM, door, porch: [x, z], side }; HOUSES.push(glob); return glob; };
let hi = 0; for (let z = 22; z > -80; z -= 13) { for (const s of [-1, 1]) { house(s * 13.2, z + (s > 0 ? 3 : 0), s, hi, 100 + hi, {}); hi++; } }
window.HOUSES = HOUSES;
// street lamps (gas) + glow; a few porch point lights near the main set
for (let z = 18; z > -80; z -= 10) for (const s of [-1, 1]) { add(cyl(0.07, 0.09, 4.2, 8), std({ color: '#2a2438', metalness: 0.7, roughness: 0.3 }), s * 6.4, 2.1, z + s * 2); add(box(0.45, 0.6, 0.45), new THREE.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ffb050', emissiveIntensity: 2.2 }), s * 6.4, 4.4, z + s * 2, scene, false); glow(s * 6.4, 4.4, z + s * 2, 1.6, '255,190,110', 0.9); }
for (const [x, z] of [[-6.4, 8], [6.4, -2], [-6.4, -12], [6.4, -22], [-6.4, -32]]) lamp(x, 4.2, z, '#ffb060', 6, 14, 0.01);
// snowy trees (bare purple trunks with snow) and bushes
const TRK = std({ color: '#4a3a5a', roughness: 0.8 });
const bareTree = (x, z, s = 1, seed = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); const r = R(seed); add(cyl(0.18, 0.3, 4, 8), TRK, 0, 2, 0, g);
  for (let k = 0; k < 7; k++) { const b = add(cyl(0.04, 0.1, 2.2, 6), TRK, (r() - 0.5) * 0.4, 3.2 + r() * 1.5, (r() - 0.5) * 0.4, g); b.rotation.set((r() - 0.5) * 1.6, r() * 6, (r() - 0.5) * 1.6); b.geometry.translate(0, 1.1, 0); }
  for (let k = 0; k < 5; k++) { const sn = add(new THREE.SphereGeometry(0.4 + r() * 0.3, 8, 6), SNOWCAP, (r() - 0.5) * 2, 4 + r() * 1.5, (r() - 0.5) * 2, g, false); sn.scale.y = 0.4; } return g; };
const pine = (x, z, s = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); add(cyl(0.15, 0.2, 1.2, 8), TRK, 0, 0.6, 0, g); for (let k = 0; k < 4; k++) { add(new THREE.ConeGeometry(1.6 - k * 0.32, 1.6, 10), std({ color: '#2f5a6a', roughness: 0.7 }), 0, 1.4 + k * 0.9, 0, g); add(new THREE.ConeGeometry(1.5 - k * 0.32, 0.6, 10), SNOWCAP, 0, 1.75 + k * 0.9, 0, g, false); } return g; };
for (let z = 15; z > -80; z -= 13) { pine(-19.5, z - 5, 1.2); pine(19.5, z - 2, 1.1); bareTree(-8.3, z - 7, 0.9, z * 3); bareTree(8.3, z - 3, 0.85, z * 7); }
for (let i = 0; i < 40; i++) { const r = R(2000 + i), a = r() * Math.PI * 2, d = 60 + r() * 120; pine(Math.cos(a) * d, Math.sin(a) * d - 60, 1.4 + r()); }
for (let i = 0; i < 14; i++) { const r = R(2100 + i), a = r() * Math.PI * 2, d = 280 + r() * 120; const m = add(new THREE.IcosahedronGeometry(70 + r() * 50, 2), std({ color: i % 2 ? '#e8e4f8' : '#c8c0e8', roughness: 0.7, flatShading: true }), Math.cos(a) * d, -20, Math.sin(a) * d - 80, scene, false); m.scale.y = 0.7; }
// ================= CEMETERY (end of the street, z -100) =================
const CEM = new THREE.Group(); CEM.position.set(0, 0, -100); scene.add(CEM);
const STONE = pbr('stone_wall', [1, 1], { color: '#c8c0d8' });
const BELLGEO = (() => { const pts = []; for (let i = 0; i <= 16; i++) { const k = i / 16; const y = 0.14 - k * 0.3; const r = 0.035 + 0.07 * Math.pow(k, 1.6) + (k > 0.85 ? (k - 0.85) * 0.5 : 0) + 0.02 * Math.sin(k * Math.PI); pts.push(new THREE.Vector2(r, y)); } return new THREE.LatheGeometry(pts, 24); })();
const grave = (x, z, s = 1, bell = true, seed = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); CEM.add(g); const r = R(seed);
  add(box(0.9, 1.1, 0.22), STONE, 0, 0.55, 0, g); add(cyl(0.45, 0.45, 0.22, 16, 1, false, 0, Math.PI), STONE, 0, 1.1, 0, g).rotation.set(Math.PI / 2, 0, Math.PI / 2); add(box(0.95, 0.08, 0.3), SNOWCAP, 0, 1.38, 0, g, false);
  const mound = add(new THREE.SphereGeometry(1, 16, 8), SNOWCAP, 0, 0, 1.2, g, false); mound.scale.set(0.7, 0.25, 1.1);
  if (bell) { const post = new THREE.Group(); post.position.set(0.9, 0, 1.6); g.add(post); add(box(0.14, 2.0, 0.14), pbr('old_planks_02', [0.3, 1], { color: '#8a6a5a' }), 0, 1.0, 0, post); add(box(0.7, 0.12, 0.14), pbr('old_planks_02', [0.3, 0.3], { color: '#8a6a5a' }), -0.28, 1.95, 0, post); add(box(0.8, 0.08, 0.6), SNOWCAP, -0.25, 2.15, 0, post, false); add(box(0.75, 0.25, 0.55), pbr('old_planks_02', [0.5, 0.3], { color: '#6a5060' }), -0.25, 2.07, 0, post);
    const B = new THREE.Group(); B.position.set(-0.45, 1.9, 0); post.add(B); add(BELLGEO, std({ color: '#e8b84a', metalness: 1, roughness: 0.18, side: THREE.DoubleSide }), 0, -0.16, 0, B); add(new THREE.SphereGeometry(0.05, 8, 6), std({ color: '#c8962e', metalness: 1, roughness: 0.2 }), 0, -0.3, 0, B);
    add(cyl(0.006, 0.006, 1.6, 4), std({ color: '#d8322f' }), -0.45, 1.0, 0, post, false); g.userData.bell = B; }
  return g; };
const GRAVES = []; for (let i = 0; i < 18; i++) { const r = R(3000 + i); const x = -12 + (i % 6) * 4.8 + (r() - 0.5), z = -4 - Math.floor(i / 6) * 5 + (r() - 0.5); if (Math.abs(x) < 2.5 && z > -6) continue; GRAVES.push(grave(x, z, 0.9 + r() * 0.2, r() < 0.6, 3000 + i)); }
const EDGAR = grave(0, 0, 1.1, true, 7); EDGAR.position.set(0, 0, 0); // Edgar's grave front and centre of the cemetery (world 0,0,-100)
const SIGN = (() => { const [c, g] = cv(512, 128); g.fillStyle = '#3a2a3a'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#f4ead8'; g.font = '900 64px Georgia'; g.textAlign = 'center'; g.fillText('E. PRATT', 256, 70); g.font = 'italic 34px Georgia'; g.fillText('1841 - 1894', 256, 112); return P.tex(c); })();
add(new THREE.PlaneGeometry(0.9, 0.24), std({ map: SIGN }), 0, 0.75, 0.13, EDGAR, false);
for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI; const x = Math.cos(a) * 22, z = -10 - Math.sin(a) * 14; add(box(0.05, 1.6, 0.05), std({ color: '#2a2438', metalness: 0.7, roughness: 0.3 }), x, 0.8, z, CEM); }
add(box(3, 0.1, 0.1), std({ color: '#2a2438', metalness: 0.7 }), -4, 1.4, 6, CEM); add(box(3, 0.1, 0.1), std({ color: '#2a2438', metalness: 0.7 }), 4, 1.4, 6, CEM);
for (let i = 0; i < 6; i++) bareTree(-16 + i * 6.5, -122 - (i % 2) * 6, 1.3, 400 + i);
// ================= UNDERGROUND CUTAWAY (x = 300) =================
ZONE = 'cut';
const CUT = new THREE.Group(); CUT.position.set(300, 0, 0); scene.add(CUT);
{ const SOIL = pbr('excavated_soil_wall', [3, 2], { color: '#c88a6a' }); add(box(14, 6, 3), SOIL, 0, -3, -1.5, CUT); add(box(5, 1.1, 1.1), SOIL, -4.0, -3.55, 0.55, CUT); add(box(5, 1.1, 1.1), SOIL, 4.0, -3.55, 0.55, CUT); add(box(14, 2.2, 1.1), SOIL, 0, -5.2, 0.55, CUT); add(box(14, 3.0, 1.1), SOIL, 0, -1.5, 0.55, CUT);
  for (let i = 0; i < 40; i++) { const r = R(5000 + i); add(new THREE.DodecahedronGeometry(0.06 + r() * 0.12), std({ color: '#8a7a7a' }), -6.5 + r() * 13, -0.4 - r() * 5.4, 1.12, CUT, false); }
  add(box(14, 0.25, 4.2), SNOWCAP, 0, 0.12, -0.4, CUT); add(box(14, 0.08, 4.2), pbr('snow_02', [4, 1.2]), 0, 0.26, -0.4, CUT); }
const COFFIN = new THREE.Group(); COFFIN.position.set(300, -3.6, 0.3); COFFIN.scale.set(0.56, 1, 1); scene.add(COFFIN);
{ const CW = pbr('fine_grained_wood', [2, 0.5], { color: '#8a5a4a' }); add(box(4.6, 0.12, 1.0), CW, 0, -0.5, 0, COFFIN); add(box(4.6, 1.0, 0.12), CW, 0, 0, -0.45, COFFIN); add(box(0.12, 1.0, 1.0), CW, -2.3, 0, 0, COFFIN); add(box(0.12, 1.0, 1.0), CW, 2.3, 0, 0, COFFIN); add(box(4.4, 0.15, 0.8), std({ color: '#e8dce8', roughness: 0.8 }), 0, -0.38, 0, COFFIN);
  add(new THREE.SphereGeometry(0.28, 12, 8), std({ color: '#f4e8f0' }), -1.8, -0.2, 0, COFFIN).scale.set(1.3, 0.6, 1); }
const CUTSTR = add(cyl(0.012, 0.012, 1, 6), std({ color: '#e8322f', emissive: '#801010', emissiveIntensity: 0.6 }), 0, 0, 0, scene, false); CUTSTR.userData.ndSkip = true;
const CUTPOST = new THREE.Group(); CUTPOST.position.set(301.6, 0.26, 0.2); scene.add(CUTPOST); add(box(0.14, 2.0, 0.14), pbr('old_planks_02', [0.3, 1], { color: '#8a6a5a' }), 0, 1.0, 0, CUTPOST); add(box(0.75, 0.25, 0.55), pbr('old_planks_02', [0.5, 0.3], { color: '#6a5060' }), -0.25, 2.07, 0, CUTPOST); add(box(0.8, 0.08, 0.6), SNOWCAP, -0.25, 2.15, 0, CUTPOST, false);
const CUTBELL = new THREE.Group(); CUTBELL.position.set(-0.45, 1.9, 0); CUTPOST.add(CUTBELL); add(BELLGEO, std({ color: '#e8b84a', metalness: 1, roughness: 0.18, side: THREE.DoubleSide }), 0, -0.16, 0, CUTBELL);
{ const a = new THREE.Vector3(301.15, 2.0, 0.2), b = new THREE.Vector3(299.95, -3.4, 0.75); CUTSTR.position.copy(a).add(b).multiplyScalar(0.5); CUTSTR.scale.y = a.distanceTo(b); CUTSTR.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize()); }
// ================= BEDROOM (x = -300): the neighbour =================
ZONE = 'bed';
const BED = new THREE.Group(); BED.position.set(-300, 0, 0); scene.add(BED);
{ const WP = (() => { const [c, g] = cv(256, 256); g.fillStyle = '#4a3a7a'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#6a5aa0'; for (let y = 0; y < 256; y += 32) for (let x = (y / 32 % 2) * 16; x < 256; x += 32) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } return P.tex(c, 6, 3); })();
  add(box(8, 3.4, 0.1), std({ map: WP }), 0, 1.7, -2.4, BED); add(box(0.1, 3.4, 6), std({ map: WP }), -3.0, 1.7, 0.5, BED); add(box(8, 0.1, 6), pbr('wood_floor_worn', [3, 2], { color: '#a87860' }), 0, 0, 0.5, BED);
  const quilt = (() => { const [c, g] = cv(256, 256); const cols = ['#b8324a', '#e8c8b0', '#6a3a8a', '#d86a7a', '#4a3a9a', '#f0a070']; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = cols[(x * 3 + y * 5) % 6]; g.fillRect(x * 16, y * 16, 16, 16); g.strokeStyle = '#f0e0d0aa'; g.setLineDash([3, 2]); g.lineWidth = 1; g.strokeRect(x * 16 + 1.5, y * 16 + 1.5, 13, 13); } return P.tex(c); })();
  add(box(2.2, 0.5, 2.6), pbr('fine_grained_wood', [1, 1], { color: '#8a5a3a' }), 0.4, 0.45, -0.9, BED); add(box(2.25, 0.25, 2.2), std({ map: quilt, roughness: 0.85 }), 0.4, 0.82, -0.6, BED); add(box(2.2, 1.6, 0.15), pbr('fine_grained_wood', [1, 1], { color: '#7a4a2a' }), 0.4, 1.0, -2.2, BED);
  add(box(0.6, 0.7, 0.5), pbr('fine_grained_wood', [1, 1], { color: '#7a4a2a' }), -1.3, 0.35, -1.6, BED); add(cyl(0.05, 0.05, 0.25, 8), std({ color: '#f4ead8' }), -1.3, 0.83, -1.6, BED);
  const win = add(new THREE.PlaneGeometry(1.4, 1.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.4, 1.1) }), 1.8, 1.9, -2.33, BED, false); for (const [w, h, x, y] of [[1.6, 0.12, 1.8, 2.75], [1.6, 0.12, 1.8, 1.05], [0.12, 1.8, 1.0, 1.9], [0.12, 1.8, 2.6, 1.9], [0.08, 1.7, 1.8, 1.9], [1.5, 0.08, 1.8, 1.9]]) add(box(w, h, 0.1), TRIMW, x, y, -2.3, BED); }
const BEDL = [lamp(-301.3, 1.05, -1.6, '#ffb050', 5, 7, 0.4)];
// ================= PARLOUR (x = 200): the wife in the dark =================
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
const dustTex = (() => { const [c, g] = cv(128, 128); for (let i = 0; i < 9; i++) { const x = 34 + (i * 37) % 60, y = 34 + (i * 53) % 60, gr = g.createRadialGradient(x, y, 0, x, y, 34); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const DUST = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: dustTex, transparent: true, depthWrite: false, color: '#f0e8f8', fog: true })); m.userData.ndSkip = true; m.renderOrder = 3; m.visible = false; scene.add(m); DUST.push(m); }
const flakeTex = glowTex('255,255,255');
const SNOWF = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: flakeTex, transparent: true, depthWrite: false, fog: true, opacity: 0.95 }), 1400); SNOWF.frustumCulled = false; SNOWF.userData.ndSkip = true; SNOWF.renderOrder = 4; SNOWF.visible = false; scene.add(SNOWF);
const MOTES = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex('255,230,200'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.userData.ndSkip = true; m.renderOrder = 5; m.visible = false; scene.add(m); MOTES.push(m); }
const MOON = add(new THREE.CircleGeometry(9, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.3, 2.6), fog: false }), 40, 70, -320, scene, false); MOON.userData.ndSkip = true;
// ================= light presets (reference grade: purple shadows, warm pink highlights) =================
const skyEnv = (top, hor, gnd, sun) => { const [c, g] = cv(512, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.5, hor); gr.addColorStop(0.52, gnd); gr.addColorStop(1, gnd); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  g.fillStyle = sun; g.beginPath(); g.ellipse(380, 90, 30, 22, 0, 0, 7); g.fill(); const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return pmrem.fromEquirectangular(t).texture; };
const NIGHTENV = skyEnv('#101840', '#4a5090', '#b8c0d8', '#ffe8d0');
const PRESET = {
  night: { hemi: ['#98a0c8', '#806060', 1.6], key: ['#c0c8f0', 2.2], fog: ['#2a2a50', 0.005], sky: 4, sun: [0.4, 0.55, -0.7], expo: 1.18, lamps: 1, sat: 1.22, env: NIGHTENV, bloomK: 1.35, thr: 0.87, rays: 0, zone: 'town' },
  dawn: { hemi: ['#e8b8c8', '#6a5a90', 1.2], key: ['#ffb890', 2.8], fog: ['#a070c0', 0.003], sky: 5, sun: [0.7, 0.2, -0.7], expo: 0.88, lamps: 0, sat: 1.22, env: skyEnv('#5a6ae0', '#ffb0c8', '#f0e0f8', '#fff4d0'), bloomK: 1.0, thr: 0.95, rays: 0.6, zone: 'town' },
  day: { hemi: ['#d8e8ff', '#8a9ad0', 1.6], key: ['#fff4e8', 4.2], fog: ['#d0e0ff', 0.002], sky: 1, sun: [0.55, 0.62, 0.6], expo: 1.12, lamps: 0, sat: 1.45, env: skyEnv('#2a6ad8', '#e8f2ff', '#e0e8ff', '#ffffff'), bloomK: 0.9, thr: 1.0, rays: 0.4, zone: 'town' },
  cut: { hemi: ['#b0a0c8', '#7a5a5a', 1.6], key: ['#c8c0f0', 1.6], fog: ['#3a2e58', 0.002], sky: 4, sun: [0.4, 0.55, -0.7], expo: 1.2, lamps: 1, sat: 1.22, env: NIGHTENV, bloomK: 1.35, thr: 0.87, rays: 0, zone: 'cut' },
  bed: { hemi: ['#a090c8', '#5a3a4a', 1.2], key: ['#c8c0f0', 0.8], fog: ['#3a2e58', 0.0004], sky: 4, sun: [0.4, 0.55, -0.7], expo: 1.2, lamps: 1, sat: 1.22, env: NIGHTENV, bloomK: 1.35, thr: 0.87, rays: 0, zone: 'bed' },
  warm: { hemi: ['#ffd8c0', '#6a3a4a', 1.3], key: ['#ffe0c0', 1.2], fog: ['#2a1a5a', 0.0004], sky: 5, sun: [0.4, 0.55, -0.7], expo: 1.15, lamps: 1, sat: 1.22, env: skyEnv('#5a6ae0', '#ffb0c8', '#f0e0f8', '#fff4d0'), bloomK: 1.35, thr: 0.87, rays: 0, zone: 'office' },
  parlor: { hemi: ['#8a78b0', '#4a2a3a', 1.0], key: ['#b8b0e8', 1.0], fog: ['#2a1a5a', 0.0004], sky: 4, sun: [0.4, 0.55, -0.7], expo: 1.15, lamps: 0, sat: 1.22, env: NIGHTENV, bloomK: 1.35, thr: 0.87, rays: 0, zone: 'office' },
};

// ================= per-frame =================
import { stateAt, TOTAL } from './shots.js';
const camR = new THREE.Vector3(), M4 = new THREE.Matrix4(), SC = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3();
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
window.renderFrame = (f) => {
  const S = stateAt(f, {}), t = f / 30;
  const L = PRESET[S.preset || 'night'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2]; moon.color.set(L.key[0]); moon.intensity = L.key[1];
  scene.fog.color.set(L.fog[0]); scene.fog.density = S.fog ?? L.fog[1]; skyU.day.value = L.sky; skyU.sunD.value.set(...L.sun); scene.environment = L.env;
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(0, 0, 0); inkU.flash.value = S.flash || 0; inkU.bloomK.value = S.bloomK ?? L.bloomK; brightU.thr.value = S.thr ?? L.thr; inkU.split.value = S.split ?? 0.55; inkU.greenK.value = 1;
  const zone = L.zone; for (const l of pLights) { l.visible = L.lamps > 0 && l.userData.zone === zone; l.intensity = l.userData.I0; } for (const g of glows) g.visible = (L.lamps > 0 && g.userData.zone === zone) || g.userData.zone === 'fx';
  { const DH = HOUSES[3]; if (!DH.em) { DH.em = []; DH.g.traverse((o) => { if (o.isMesh && o.material.emissive && o.material.emissiveIntensity > 0 && !DH.wins.includes(o)) DH.em.push(o); }); DH.wp = new THREE.Vector3(); DH.g.getWorldPosition(DH.wp); }
    DH.em.forEach((o) => (o.visible = !S.darkPorch)); DH.wins.forEach((w) => (w.material = S.darkPorch ? WINDARK : WINLIT)); DH.g.traverse((o) => { if (o.isMesh && o.material === WINLIT && S.darkPorch) o.material = WINDARK; });
    pLights.forEach((l) => { if (Math.abs(l.position.z - DH.wp.z) < 6 && l.position.x > 7 && l.position.x < 20 && S.darkPorch) l.intensity = 0; }); glows.forEach((g) => { g.userData.dark = !!S.darkPorch && Math.abs(g.position.z - DH.wp.z) < 6 && g.position.x > 7 && g.position.x < 20; }); }
  MOON.visible = L.sky === 4; WINLIT.emissiveIntensity = L.sky === 4 ? 1.8 : 0.4;
  // bells swing when ringing
  const ring = S.ring || 0; const sw = ring ? Math.sin(t * (S.ringRate || 14)) * 0.5 * ring : 0;
  if (EDGAR.userData.bell) EDGAR.userData.bell.rotation.z = sw; CUTBELL.rotation.z = sw;
  // camera
  const sh = S.shake || 0, hh = S.handheld ?? 0.012; const look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  if (S.orbit) { const d = pos.clone().sub(look); d.applyAxisAngle(new THREE.Vector3(0, 1, 0), S.orbit); pos.copy(look).add(d); }
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look.x + (rnd(f, 3) - 0.5) * sh * 1.5, look.y + (rnd(f, 4) - 0.5) * sh * 1.5, look.z); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); camR.setFromMatrixColumn(camera.matrixWorld, 0); sky.position.copy(camera.position);
  MOON.position.set(camera.position.x + 40, camera.position.y + 70, camera.position.z - 300); MOON.quaternion.copy(camera.quaternion);
  const fc = S.shadowAt || S.look, sd = new THREE.Vector3(...L.sun).normalize(); moon.position.set(fc[0] + sd.x * 60, fc[1] + Math.max(sd.y, 0.25) * 60, fc[2] + sd.z * 60); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 16; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 220; sc.updateProjectionMatrix(); }
  { const sv = sd.clone().multiplyScalar(500).add(camera.position).project(camera); inkU.sunUV.value.set(sv.x * 0.5 + 0.5, sv.y * 0.5 + 0.5); inkU.raysK.value = sv.z < 1 ? (S.rays ?? L.rays) : 0; }
  // falling snow around the camera
  SNOWF.visible = S.snow !== false && (zone === 'town' || zone === 'cut'); if (SNOWF.visible) { const k = S.snowK ?? 1; for (let i = 0; i < SNOWF.count; i++) { const fall = ((t * 0.18 * (0.6 + rnd(i, 5)) + rnd(i, 1)) % 1);
    V.set(camera.position.x + (rnd(i, 2) - 0.5) * 16 + Math.sin(t * 0.7 + i) * 0.4, camera.position.y + 5 - fall * 10, camera.position.z + (rnd(i, 3) - 0.5) * 16 - 4); M4.compose(V, camera.quaternion, SC.setScalar((0.04 + rnd(i, 4) * 0.06) * (i < SNOWF.count * k ? 1 : 0))); SNOWF.setMatrixAt(i, M4); } SNOWF.instanceMatrix.needsUpdate = true; }
  DUST.forEach((m, i) => { const em = (S.dust || [])[i % Math.max(1, (S.dust || []).length)]; m.visible = !!em && i < (S.dustN ?? 30); if (!m.visible) return; const a = ((t * (em.rate || 1)) + rnd(i, 3)) % 1;
    m.position.set(em.p[0] + (rnd(i, 4) - 0.5) * (em.w || 2), em.p[1] + 0.2 + a * (em.h || 1.2), em.p[2] + (rnd(i, 5) - 0.5) * (em.w || 2)); m.scale.setScalar((0.6 + a * 2.4) * (em.s || 1)); m.quaternion.copy(camera.quaternion); m.material.opacity = (1 - a) * (em.k ?? 0.45); });
  MOTES.forEach((m, i) => { m.visible = !!S.motes; if (!m.visible) return; m.position.set(camera.position.x + (rnd(i, 1) - 0.5) * 6 + Math.sin(t * 0.3 + i) * 0.3, camera.position.y - 1 + rnd(i, 2) * 3 + Math.sin(t * 0.5 + i * 2) * 0.2, camera.position.z - 1.5 - rnd(i, 3) * 6);
    m.scale.setScalar(0.03 + rnd(i, 4) * 0.05); m.quaternion.copy(camera.quaternion); m.material.opacity = 0.6 + 0.4 * Math.sin(t * 3 + i); });
  for (const g of glows) { g.quaternion.copy(camera.quaternion); g.material.opacity = g.userData.dark ? 0 : g.userData.k0 * Math.exp(-g.position.distanceTo(camera.position) * 0.04); }
  if (bang.userData.g) { bang.userData.g.quaternion.copy(camera.quaternion); } bang.visible = false; bangLight.intensity = 0;
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw); c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, a.yaw ?? Math.atan2(camera.position.x - a.x, camera.position.z - a.z), a.roll || 0); c.mat.color.set(a.tint || S.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2; c.mesh.castShadow = !a.fx;
    c.blob.visible = !a.fx && a.blob !== false; c.blob.position.set(a.x, (a.ground ?? a.y) + 0.015, a.z); c.blob.scale.set(1.0 * s, 0.55 * s, 1); });
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.autoUpdate = false; swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false); scene.fog = fog; renderer.shadowMap.autoUpdate = true;
  renderer.setRenderTarget(rtB1); renderer.render(brightScene, fsCam);
  for (let k = 0; k < 2; k++) { blurU.src.value = rtB1.texture; blurU.dir.value.set(1 / (W / 4), 0); renderer.setRenderTarget(rtB2); renderer.render(blurScene, fsCam); blurU.src.value = rtB2.texture; blurU.dir.value.set(0, 1 / (H / 4)); renderer.setRenderTarget(rtB1); renderer.render(blurScene, fsCam); }
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = 5; dofU.cinf.value = 0; dofU.haze.value = 0; dofU.time.value = t; renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;

window.ready = true;
