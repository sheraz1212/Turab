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

const NAMES = ['Barrel_01', 'wooden_crate_01', 'wooden_crate_02', 'wooden_barrels_01', 'tea_set_01', 'WoodenTable_01', 'ArmChair_01', 'Chandelier_01', 'book_encyclopedia_set_01', 'fancy_picture_frame_01', 'vintage_grandfather_clock_01', 'wooden_bookshelf_worn', 'brass_candleholders', 'GreenChair_01', 'pocket_watch'];
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
const dofU = { haze: { value: 0 }, time: { value: 0 }, src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: fsv.replace(/vUv/g, 'vUv0'),
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, haze, time; varying vec2 vUv0;
  vec2 vUv; float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf, cinf*1.4); }
  vec3 sharp(vec2 uv, vec3 c){ vec2 px = 1. / res; vec3 n = texture2D(src, uv + vec2(px.x, 0.)).rgb + texture2D(src, uv - vec2(px.x, 0.)).rgb + texture2D(src, uv + vec2(0., px.y)).rgb + texture2D(src, uv - vec2(0., px.y)).rgb; return clamp(c + (c - n * .25) * .45, 0., 1.); }
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
const PBRN = ['leafy_grass', 'cobblestone_floor_04', 'japanese_stone_wall', 'clay_roof_tiles', 'plastered_wall_02', 'dry_riverbed_rock', 'old_planks_02', 'stone_wall', 'wood_planks_dirt', 'fine_grained_wood', 'rock_boulder_dry', 'grass_path_2'];
await Promise.all(PBRN.flatMap((n) => ['diff', 'nor', 'rough'].map((k) => new Promise((res) => TXL.load(`tex/${n}_${k}.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (k === 'diff') t.colorSpace = THREE.SRGBColorSpace; TX[n + k] = t; res(); }, undefined, () => res())))));
const pbr = (n, rep, o = {}) => { const r = Array.isArray(rep) ? rep : [rep, rep]; const cl = (t) => { const c = t.clone(); c.repeat.set(r[0], r[1]); c.needsUpdate = true; return c; };
  return new THREE.MeshStandardMaterial({ map: cl(TX[n + 'diff']), normalMap: cl(TX[n + 'nor']), roughnessMap: cl(TX[n + 'rough']), roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2), ...o }); };
const R = (s) => P.rng(s);
ZONE = 'town';
// ================= OAKVALE: a spiral town around a lever =================
const ground = add(new THREE.PlaneGeometry(900, 900), pbr('leafy_grass', 300, { color: '#a0d060' }), 0, 0, 0, scene, false); ground.rotation.x = -Math.PI / 2;
// spiral street: r = R0 + B * th, from the plaza out
const R0 = 10, B = 2.6, TH1 = Math.PI * 2 * 3.1; window.SPIRAL = { R0, B, TH1 };
const spiralPt = (th, off = 0) => { const r = R0 + B * th + off; return [Math.cos(th) * r, Math.sin(th) * r]; };
const ribbon = (offA, offB, y0, y1, mat, segs = 700) => { const pos = [], uv = [], idx = []; let s = 0;
  for (let i = 0; i <= segs; i++) { const th = TH1 * i / segs; const [ax, az] = spiralPt(th, offA), [bx, bz] = spiralPt(th, offB); if (i > 0) { const [px, pz] = spiralPt(TH1 * (i - 1) / segs, (offA + offB) / 2), [cx, cz] = spiralPt(th, (offA + offB) / 2); s += Math.hypot(cx - px, cz - pz); }
    pos.push(ax, y0, az, bx, y1, bz); uv.push(s / 4, 0, s / 4, 1); if (i < segs) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.castShadow = false; scene.add(m); return m; };
const STREET = pbr('cobblestone_floor_04', [1, 1], { color: '#e8e0d4', side: THREE.DoubleSide }), CURB = pbr('stone_wall', [1, 0.25], { color: '#d8d0c4', side: THREE.DoubleSide });
ribbon(-2.2, 2.2, 0.03, 0.03, STREET); ribbon(-2.2, -2.2, 0.03, 0.55, CURB); ribbon(2.2, 2.2, 0.03, 0.55, CURB); ribbon(-2.55, -2.2, 0.55, 0.55, CURB); ribbon(2.2, 2.55, 0.55, 0.55, CURB);
// street water (rises with S.water), flowing
const waterNormal = (() => { const [c, g] = cv(256, 256), r = R(5); g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 260; i++) { const x = r() * 256, y = r() * 256, rr = 6 + r() * 22, gr = g.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 1, x, y, rr); gr.addColorStop(0, 'rgba(170,170,255,.5)'); gr.addColorStop(1, 'rgba(90,90,255,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
const WATER = new THREE.MeshStandardMaterial({ color: '#2f86c8', metalness: 0.25, roughness: 0.06, normalMap: waterNormal, normalScale: new THREE.Vector2(1.4, 1.4), transparent: true, opacity: 0.9, envMapIntensity: 1.6, side: THREE.DoubleSide }); waterNormal.repeat.set(1, 1);
const SWATER = ribbon(-2.2, 2.2, 0.05, 0.05, WATER); SWATER.visible = false; SWATER.userData.ndSkip = true;
// houses on the outer side of every turn, facing the street
const ROOFM = pbr('clay_roof_tiles', [2, 2], { color: '#ffb0a0', roughness: 0.6 }), PLM = pbr('plastered_wall_02', [1.5, 1]), TRIM = std({ color: '#f4ead8' });
const WALLCOLS = ['#fff2d8', '#ffd8c8', '#d8ecff', '#e8ffd8', '#fff0a8', '#f4d8ff'];
const roofGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(-3.0, 0); sh.lineTo(0, 2.0); sh.lineTo(3.0, 0); sh.lineTo(-3.0, 0); const g = new THREE.ExtrudeGeometry(sh, { depth: 5.4, bevelEnabled: false }); g.translate(0, 0, -2.7); return g; })();
const HOUSES = []; let hs = 0;
for (let th = 0.9; th < TH1 - 0.2; ) { const r = R0 + B * th; const [x, z] = spiralPt(th, 7.0); const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -th + Math.PI / 2 + Math.PI; scene.add(g); const rr = R(50 + hs);
  const wc = WALLCOLS[hs % WALLCOLS.length]; const pm = PLM.clone(); pm.color = new THREE.Color(wc); add(box(5, 3, 4.6), pm, 0, 1.5, 0, g); const rf = add(roofGeo, ROOFM, 0, 3, 0, g); rf.scale.set(0.95, 0.9 + rr() * 0.3, 0.98);
  add(box(5.1, 0.2, 4.7), TRIM, 0, 3.0, 0, g); add(box(0.6, 1.4, 0.6), std({ color: '#b86a4a' }), 1.4, 4.0, 0.8, g);
  add(box(1.0, 1.8, 0.08), std({ color: ['#2f5a9a', '#c8322f', '#2f8a5a', '#8a5a2a'][hs % 4], roughness: 0.4 }), 0, 0.9, 2.32, g); add(cyl(0.05, 0.05, 0.06, 8), std({ color: '#e8c25a', metalness: 0.9 }), 0.35, 0.95, 2.37, g).rotation.x = Math.PI / 2;
  for (const s of [-1.6, 1.6]) { const w = add(box(0.9, 0.9, 0.08), std({ color: '#bfe4ff', emissive: '#ffc070', emissiveIntensity: 0, metalness: 0.3, roughness: 0.1 }), s, 1.7, 2.32, g, false); HOUSES.push(w); add(box(1.05, 0.08, 0.12), TRIM, s, 1.22, 2.35, g); add(box(1.0, 0.22, 0.25), std({ color: '#8a5a3a' }), s, 1.14, 2.45, g); for (let k = 0; k < 4; k++) add(new THREE.SphereGeometry(0.1, 6, 4), std({ color: ['#ff5a7a', '#ffd84a', '#ffffff', '#ff8a3a'][k] }), s - 0.36 + k * 0.24, 1.3, 2.5, g, false); }
  hs++; th += 9.5 / r; }
// central plaza + lever on a pedestal + drain grates + warning sign + founders' statue
const PLAZA = add(new THREE.CircleGeometry(R0 - 1.0, 48), pbr('cobblestone_floor_04', [5, 5], { color: '#f0e8dc' }), 0, 0.02, 0, scene, false); PLAZA.rotation.x = -Math.PI / 2;
add(new THREE.TorusGeometry(R0 - 1.0, 0.22, 6, 64), pbr('stone_wall', [8, 1]), 0, 0.12, 0, scene).rotation.x = Math.PI / 2;
for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const gr = add(new THREE.CircleGeometry(0.45, 16), std({ color: '#1a1a20', metalness: 0.6, roughness: 0.4 }), Math.cos(a) * 6.6, 0.035, Math.sin(a) * 6.6, scene, false); gr.rotation.x = -Math.PI / 2; for (let k = -2; k <= 2; k++) { const b = add(box(0.06, 0.02, 0.8), std({ color: '#5a5a64', metalness: 0.8, roughness: 0.3 }), Math.cos(a) * 6.6 + k * 0.15, 0.05, Math.sin(a) * 6.6, scene, false); } }
const PED = new THREE.Group(); scene.add(PED); add(cyl(0.9, 1.1, 1.0, 20), pbr('stone_wall', [2, 1], { color: '#d8d0c8' }), 0, 0.5, 0, PED); add(cyl(1.15, 1.15, 0.12, 20), pbr('stone_wall', [2, 0.2]), 0, 1.04, 0, PED);
const RUST = std({ color: '#8a4a2a', metalness: 0.7, roughness: 0.55 }); add(box(0.5, 0.4, 0.5), RUST, 0, 1.3, 0, PED); add(cyl(0.12, 0.12, 0.6, 12), RUST, 0, 1.45, 0, PED).rotation.x = Math.PI / 2;
const LEVER = new THREE.Group(); LEVER.position.set(0, 1.45, 0); PED.add(LEVER); add(cyl(0.06, 0.07, 1.6, 10), RUST, 0, 0.8, 0, LEVER); add(new THREE.SphereGeometry(0.16, 16, 10), std({ color: '#c8222a', metalness: 0.3, roughness: 0.25 }), 0, 1.65, 0, LEVER);
for (let k = 0; k < 10; k++) add(new THREE.SphereGeometry(0.03 + (k % 3) * 0.01, 6, 4), std({ color: '#c86a3a', roughness: 1 }), (k % 2 ? 0.06 : -0.06), 0.2 + k * 0.13, (k % 3 - 1) * 0.04, LEVER, false);
const signTex = (() => { const [c, g] = cv(1024, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData = { c, g, k: -1 }; return t; })();
const drawSign = (k) => { const U = signTex.userData; if (Math.abs(U.k - k) < 0.01) return; U.k = k; const g = U.g; g.drawImage(TX['old_planks_02diff'].image, 0, 0, 1024, 512); g.fillStyle = 'rgba(80,50,30,.25)'; g.fillRect(0, 0, 1024, 512);
  g.strokeStyle = '#3a2418'; g.lineWidth = 18; g.strokeRect(9, 9, 1006, 494); g.fillStyle = '#f4ead8'; g.strokeStyle = '#2a1810'; g.lineWidth = 10; g.font = '900 150px Georgia'; g.textAlign = 'center'; g.strokeText('NEVER PULL', 512, 210); g.fillText('NEVER PULL', 512, 210);
  g.font = 'italic 900 78px Georgia'; g.fillStyle = '#ffd870'; g.strokeText('...UNTIL YOU NEED IT', 512, 380); g.fillText('...UNTIL YOU NEED IT', 512, 380);
  const r = R(77); g.save(); g.beginPath(); g.rect(1024 * k, 280, 1024 * (1 - k), 160); g.clip(); for (let i = 0; i < 160; i++) { g.fillStyle = `hsl(${85 + r() * 40},${35 + r() * 25}%,${22 + r() * 18}%)`; g.beginPath(); g.ellipse(r() * 1024, 290 + r() * 140, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, 7); g.fill(); } g.restore(); signTex.needsUpdate = true; };
drawSign(0);
const SIGN = new THREE.Group(); SIGN.position.set(0, 0, 2.2); scene.add(SIGN); add(cyl(0.07, 0.07, 1.4, 8), std({ color: '#4a3220' }), -0.8, 0.7, 0, SIGN); add(cyl(0.07, 0.07, 1.4, 8), std({ color: '#4a3220' }), 0.8, 0.7, 0, SIGN); add(new THREE.PlaneGeometry(2.0, 1.0), std({ map: signTex, roughness: 0.7 }), 0, 1.35, 0.05, SIGN, false); add(box(2.1, 1.1, 0.08), std({ color: '#3a2418' }), 0, 1.35, 0, SIGN);
// lamp posts around the plaza
for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; const x = Math.cos(a) * 8.4, z = Math.sin(a) * 8.4; add(cyl(0.06, 0.08, 3.4, 8), std({ color: '#2a2a30', metalness: 0.7, roughness: 0.3 }), x, 1.7, z); add(box(0.4, 0.5, 0.4), std({ color: '#ffe0a0', emissive: '#ffb050', emissiveIntensity: 0.3 }), x, 3.55, z, scene, false); lamp(x, 3.5, z, '#ffc070', 4, 10, 0.8); }
// river: a dry bed from the hills (north, -z) down into the town, and hills around
const RIVZ0 = -64; const riverbed = add(new THREE.PlaneGeometry(18, 360, 1, 60), pbr('dry_riverbed_rock', [3, 60], { color: '#e8d8c0' }), 0, 0.04, RIVZ0 - 180, scene, false); riverbed.rotation.x = -Math.PI / 2;
const RWATER = add(new THREE.PlaneGeometry(18, 360), WATER, 0, 0.2, RIVZ0 - 180, scene, false); RWATER.rotation.x = -Math.PI / 2; RWATER.visible = false; RWATER.userData.ndSkip = true;
for (let i = 0; i < 26; i++) { const r = R(1700 + i); const side = i % 2 ? -1 : 1, z = -80 - Math.floor(i / 2) * 32 - r() * 10; const h = add(new THREE.SphereGeometry(30 + r() * 22, 24, 12), pbr('leafy_grass', [6, 6], { color: i % 3 ? '#80c050' : '#6aa848' }), side * (40 + r() * 30), -12, z, scene, false); h.scale.y = 0.6 + r() * 0.3; }
for (let i = 0; i < 16; i++) { const r = R(1800 + i), a = r() * Math.PI * 2, d = 320 + r() * 140; const m = add(new THREE.IcosahedronGeometry(80 + r() * 60, 2), std({ color: i % 2 ? '#5a9a5a' : '#4a8a6a', roughness: 0.9, flatShading: true }), Math.cos(a) * d, -30, Math.sin(a) * d, scene, false); m.scale.y = 0.6; }
// trees (round, bright) in the gaps
const LEAF = std({ color: '#5aa83a', roughness: 0.7 }), LEAF2 = std({ color: '#7ac84a', roughness: 0.7 }), TRK = std({ color: '#7a5034' });
const tree = (x, z, s = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); add(cyl(0.18, 0.26, 2.2, 8), TRK, 0, 1.1, 0, g); add(new THREE.SphereGeometry(1.3, 14, 10), LEAF, 0, 2.9, 0, g); add(new THREE.SphereGeometry(0.9, 12, 8), LEAF2, 0.5, 3.5, 0.3, g); return g; };
for (let th = 1.4; th < TH1; th += 0.9) { const [x, z] = spiralPt(th, -5.2); if (Math.hypot(x, z) < 11) continue; tree(x, z, 0.8 + R(th * 100)() * 0.4); }
for (let i = 0; i < 60; i++) { const r = R(2000 + i), a = r() * Math.PI * 2, d = 72 + r() * 60; if (Math.abs(Math.cos(a)) < 0.2 && Math.sin(a) < 0) continue; tree(Math.cos(a) * d, Math.sin(a) * d, 1 + r() * 0.6); }
// founders' statue (bronze) by the plaza
const STAT = new THREE.Group(); STAT.position.set(-6.2, 0, -3.8); scene.add(STAT); add(box(2.6, 1.0, 1.4), pbr('stone_wall', [1, 0.5], { color: '#d8d0c8' }), 0, 0.5, 0, STAT);
// the flood: a rolling wall of water down the riverbed
const WAVE = new THREE.Group(); scene.add(WAVE); WAVE.visible = false;
{ const g = new THREE.PlaneGeometry(40, 9, 40, 12); const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i) + 4.5, k = y / 9; pa.setY(i, y); pa.setZ(i, Math.sin(k * Math.PI * 0.9) * 5 * k + Math.sin(x * 0.4) * 0.6); } g.computeVertexNormals();
  const wm = add(g, new THREE.MeshStandardMaterial({ color: '#5a8ab0', metalness: 0.2, roughness: 0.1, normalMap: waterNormal, side: THREE.DoubleSide, envMapIntensity: 1.4 }), 0, 0, 0, WAVE, false); wm.userData.ndSkip = true;
  const foam = add(new THREE.CylinderGeometry(0.9, 0.9, 40, 12), std({ color: '#f4f8ff', roughness: 0.5 }), 0, 8.6, 4.4, WAVE, false); foam.rotation.z = Math.PI / 2; foam.userData.ndSkip = true; }
// whirlpool at the plaza (spinning cone of water)
const swirlTex = (() => { const [c, g] = cv(512, 512); g.fillStyle = '#2a76b8'; g.fillRect(0, 0, 512, 512); g.strokeStyle = 'rgba(230,245,255,.85)'; for (let k = 0; k < 14; k++) { g.lineWidth = 4 + (k % 3) * 3; g.beginPath(); for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2.4 + k * 0.45, r = i / 80 * 250; const x = 256 + Math.cos(a) * r, y = 256 + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const VORTEX = add(new THREE.ConeGeometry(R0 + 2, 3.4, 48, 1, true), new THREE.MeshStandardMaterial({ map: swirlTex, metalness: 0.2, roughness: 0.08, side: THREE.DoubleSide, transparent: true, opacity: 0.92, envMapIntensity: 1.4 }), 0, -1.6, 0, scene, false); VORTEX.rotation.x = Math.PI; VORTEX.visible = false; VORTEX.userData.ndSkip = true;
const SPIRALSWIRL = add(new THREE.CircleGeometry(R0 + B * TH1 + 2.5, 64), new THREE.MeshStandardMaterial({ map: swirlTex, metalness: 0.2, roughness: 0.08, transparent: true, opacity: 0.0, depthWrite: false, envMapIntensity: 1.4 }), 0, 0.62, 0, scene, false); SPIRALSWIRL.rotation.x = -Math.PI / 2; SPIRALSWIRL.userData.ndSkip = true; SPIRALSWIRL.visible = false;
// rain + lightning
const RAIN = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.012, 0.55), new THREE.MeshBasicMaterial({ color: '#cfe2ff', transparent: true, opacity: 0.55, depthWrite: false, fog: true }), 1600); RAIN.frustumCulled = false; RAIN.userData.ndSkip = true; RAIN.renderOrder = 4; RAIN.visible = false; scene.add(RAIN);
const SPLASH = []; for (let i = 0; i < 40; i++) { const m = add(new THREE.RingGeometry(0.02, 0.06, 12), new THREE.MeshBasicMaterial({ color: '#e8f2ff', transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }), 0, 0, 0, scene, false); m.rotation.x = -Math.PI / 2; m.userData.ndSkip = true; m.visible = false; SPLASH.push(m); }
// ================= INTERIORS =================
// grandpa's attic (x = -300)
ZONE = 'attic';
const ATT = new THREE.Group(); ATT.position.set(-300, 0, 0); scene.add(ATT);
{ const PL = pbr('old_planks_02', [3, 3], { color: '#c89870' }); add(box(8, 0.1, 8), PL, 0, 0, 0, ATT); for (const s of [-1, 1]) { const r = add(box(0.1, 6, 8.4), pbr('wood_planks_dirt', [3, 3], { color: '#a07850' }), s * 2.2, 2.2, 0, ATT); r.rotation.z = s * 0.75; }
  add(box(8, 3.2, 0.1), pbr('wood_planks_dirt', [3, 1], { color: '#8a6040' }), 0, 1.6, -3.2, ATT); for (let k = -3; k <= 3; k++) add(box(0.14, 0.14, 8.2), std({ color: '#5a3a24' }), k * 0.9, 3.9 - Math.abs(k) * 0.9, 0, ATT);
  const win = add(new THREE.CircleGeometry(0.55, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.7, 1.2) }), 0, 2.2, -3.14, ATT, false); add(new THREE.TorusGeometry(0.55, 0.06, 8, 24), std({ color: '#5a3a24' }), 0, 2.2, -3.12, ATT);
  for (let i = 0; i < 9; i++) { const r = R(3000 + i); put(i % 2 ? 'wooden_crate_01' : 'wooden_crate_02', -2.4 + r() * 4.8, 0, -2.6 + r() * 1.6, r() * 6, 1 + r() * 0.4, ATT); }
  put('Barrel_01', 2.4, 0, -1.2, 0, 1, ATT); const chest = add(box(1.1, 0.6, 0.7), pbr('fine_grained_wood', [1, 1], { color: '#8a5a34' }), 0.6, 0.3, -0.6, ATT); add(box(1.12, 0.06, 0.72), std({ color: '#e8b84a', metalness: 0.9, roughness: 0.25 }), 0.6, 0.6, -0.6, ATT); }
const ATL = [lamp(-300.9, 1.6, -0.2, '#ffb050', 6, 8, 0.7)];
// mayor's office (x = 200)
ZONE = 'office';
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

// underground cavern with the stone gates (x = 300)
ZONE = 'cave';
const CAVE = new THREE.Group(); CAVE.position.set(300, 0, 0); scene.add(CAVE);
const ROCKC = pbr('rock_boulder_dry', [4, 3], { color: '#a8a0b0' });
{ const shell = add(new THREE.SphereGeometry(16, 40, 24), ROCKC, 0, 2, 0, CAVE, false); shell.material = ROCKC.clone(); shell.material.side = THREE.BackSide; shell.scale.set(1.2, 0.6, 1.4);
  const pa = shell.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const n = 1 + Math.sin(pa.getX(i) * 0.6) * 0.06 + Math.sin(pa.getY(i) * 0.9 + pa.getZ(i)) * 0.06; pa.setXYZ(i, pa.getX(i) * n, pa.getY(i) * n, pa.getZ(i) * n); } shell.geometry.computeVertexNormals();
  add(new THREE.PlaneGeometry(40, 40), pbr('rock_boulder_dry', [8, 8], { color: '#8a8490' }), 0, -0.5, 0, CAVE, false).rotation.x = -Math.PI / 2;
  add(box(16, 9, 2), pbr('stone_wall', [4, 2], { color: '#c8c0b8' }), 0, 4, -6, CAVE); }
const GATES = [-1, 1].map((s) => { const g = add(box(3.2, 6.4, 0.9), pbr('stone_wall', [1, 2], { color: '#d8d0c8' }), s * 1.6, 3.2, -5.4, CAVE); for (let k = 0; k < 4; k++) add(box(3.3, 0.18, 0.95), std({ color: '#5a4a3a', metalness: 0.6, roughness: 0.5 }), 0, -2.6 + k * 1.7, 0, g); return g; });
const LAKE = add(new THREE.PlaneGeometry(40, 30), WATER, 0, -0.4, 6, CAVE, false); LAKE.rotation.x = -Math.PI / 2; LAKE.userData.ndSkip = true;
const POUR = add(new THREE.PlaneGeometry(3.0, 7, 1, 10), new THREE.MeshStandardMaterial({ color: '#8ac4ff', metalness: 0.2, roughness: 0.1, normalMap: waterNormal, transparent: true, opacity: 0.85, side: THREE.DoubleSide, envMapIntensity: 1.5 }), 0, 3, -4.8, CAVE, false); POUR.userData.ndSkip = true; POUR.visible = false;
const CAVL = [lamp(296, 3, 2, '#ffb060', 12, 16, 1.0), lamp(304, 3, 2, '#ffb060', 12, 16, 1.0), lamp(300, 6, -2, '#9fc0ff', 14, 14, 0.6)];
for (const [x, z] of [[-4, 2], [4, 2]]) { add(cyl(0.06, 0.06, 2.6, 8), std({ color: '#3a2418' }), x, 1.3, z, CAVE); add(box(0.3, 0.4, 0.3), std({ color: '#ffe0a0', emissive: '#ffa040', emissiveIntensity: 1.2 }), x, 3, z, CAVE, false); }
ZONE = 'fx';
const DUST = []; const dustTex = (() => { const [c, g] = cv(128, 128); for (let i = 0; i < 9; i++) { const x = 34 + (i * 37) % 60, y = 34 + (i * 53) % 60, gr = g.createRadialGradient(x, y, 0, x, y, 34); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
for (let i = 0; i < 50; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: dustTex, transparent: true, depthWrite: false, color: '#e8e0d0', fog: true })); m.userData.ndSkip = true; m.renderOrder = 3; m.visible = false; scene.add(m); DUST.push(m); }
const MOTES = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex('255,230,170'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.userData.ndSkip = true; m.renderOrder = 5; m.visible = false; scene.add(m); MOTES.push(m); }
const SPARKS = []; for (let i = 0; i < 30; i++) { const m = add(box(0.01, 0.01, 0.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.5, 1.8, 0.6) }), 0, 0, 0, scene, false); m.userData.ndSkip = true; m.visible = false; SPARKS.push(m); }
const BOLT = add(new THREE.PlaneGeometry(14, 60), new THREE.MeshBasicMaterial({ map: (() => { const [c, g] = cv(128, 512); let x = 64, y = 0; g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.shadowColor = '#bcd8ff'; g.shadowBlur = 18; g.beginPath(); g.moveTo(x, y); const r = R(3); while (y < 512) { x += (r() - 0.5) * 50; y += 25 + r() * 25; g.lineTo(x, y); } g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0, 0, 0, scene, false); BOLT.userData.ndSkip = true; BOLT.visible = false;
const RAINBOW = (() => { const [c, g] = cv(16, 256); const cols = ['#ff3a3a', '#ff9a2a', '#ffe23a', '#4ad84a', '#3a8aff', '#7a4aff']; cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * 42, 16, 42); }); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.RingGeometry(70, 82, 64, 1, 0, Math.PI); const uv = geo.attributes.uv, pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) { const r = Math.hypot(pa.getX(i), pa.getY(i)); uv.setXY(i, 0.5, (r - 70) / 12); }
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide })); m.position.set(0, -10, -170); m.userData.ndSkip = true; m.visible = false; scene.add(m); return m; })();
// ================= light presets =================
const skyEnv = (top, hor, gnd, sun) => { const [c, g] = cv(512, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.5, hor); gr.addColorStop(0.52, gnd); gr.addColorStop(1, gnd); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  g.fillStyle = sun; g.beginPath(); g.ellipse(380, 90, 30, 22, 0, 0, 7); g.fill(); const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return pmrem.fromEquirectangular(t).texture; };
const PRESET = {
  day: { hemi: ['#d0e4ff', '#6a9a3a', 1.45], key: ['#fff4e0', 4.4], fog: ['#cfe4ff', 0.0007], sky: 1, sun: [0.55, 0.62, 0.6], expo: 1.12, lamps: 0, sat: 1.42, lift: [0, 0, 0], env: skyEnv('#2a6ad8', '#e8f2ff', '#5a8a3a', '#ffffff'), bloomK: 0.9, thr: 1.0, rays: 0.5, zone: 'town' },
  night: { hemi: ['#7a90c8', '#2a2a3a', 1.0], key: ['#a8c0f0', 1.4], fog: ['#1e2a44', 0.004], sky: 0, sun: [-0.4, 0.5, 0.6], expo: 1.15, lamps: 1, sat: 1.3, lift: [0.012, 0.014, 0.03], env: env, bloomK: 0.9, thr: 1.0, rays: 0, zone: 'town' },
  storm: { hemi: ['#8a9ab8', '#3a4a3a', 1.15], key: ['#c8d4e8', 1.6], fog: ['#56627a', 0.006], sky: 3, sun: [0.3, 0.7, 0.5], expo: 1.15, lamps: 1, sat: 1.25, lift: [0.01, 0.012, 0.02], env: skyEnv('#2a3448', '#6a7890', '#3a4a3a', '#8a98b0'), bloomK: 0.8, thr: 1.05, rays: 0, zone: 'town' },
  attic: { hemi: ['#7a6a80', '#2a1a14', 0.8], key: ['#a8c0f0', 0.8], fog: ['#1e2840', 0.0004], sky: 0, sun: [0.5, 0.5, -1], expo: 1.15, lamps: 1, sat: 1.3, lift: [0.012, 0.008, 0.01], env: env, bloomK: 0.9, thr: 1.0, rays: 0, zone: 'attic' },
  office: { hemi: ['#8a7a70', '#2a1a14', 0.9], key: ['#ffe0b0', 0.8], fog: ['#1e2840', 0.0004], sky: 0, sun: [0.5, 0.5, -1], expo: 1.12, lamps: 1, sat: 1.3, lift: [0.012, 0.008, 0.01], env: env, bloomK: 0.85, thr: 1.0, rays: 0, zone: 'office' },
  cave: { hemi: ['#8a9ab8', '#3a3040', 1.4], key: ['#a8c0f0', 0.6], fog: ['#1a1e2a', 0.01], sky: 0, sun: [0.5, 0.5, -1], expo: 1.2, lamps: 1, sat: 1.3, lift: [0.01, 0.012, 0.02], env: env, bloomK: 0.9, thr: 1.0, rays: 0, zone: 'cave' },
};

// ================= per-frame =================
import { stateAt, TOTAL } from './shots.js';
const tmp = new THREE.Vector3(), camR = new THREE.Vector3(), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), SC = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3();
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
window.renderFrame = (f) => {
  const S = stateAt(f, {}), t = f / 30;
  const L = PRESET[S.preset || 'day'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2]; moon.color.set(L.key[0]); moon.intensity = L.key[1];
  scene.fog.color.set(L.fog[0]); scene.fog.density = S.fog ?? L.fog[1]; skyU.day.value = L.sky; skyU.sunD.value.set(...L.sun); scene.environment = L.env;
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(...L.lift); inkU.flash.value = S.flash || 0; inkU.bloomK.value = L.bloomK; brightU.thr.value = L.thr;
  const zone = L.zone; for (const l of pLights) { l.visible = L.lamps > 0 && l.userData.zone === zone; l.intensity = l.userData.I0; } for (const g of glows) g.visible = (L.lamps > 0 && g.userData.zone === zone) || g.userData.zone === 'fx';
  HOUSES.forEach((w) => (w.material.emissiveIntensity = S.windows ?? (S.preset === 'night' || S.preset === 'storm' ? 1.4 : 0)));
  RAINBOW.visible = !!S.rainbow;
  // lever, sign, water, flood, whirlpool, gates
  LEVER.rotation.x = S.lever ?? -0.5; drawSign(S.signK ?? 0);
  SWATER.visible = (S.water || 0) > 0.01; SWATER.position.y = (S.water || 0); waterNormal.offset.set(-t * (S.flow ?? 0.6), t * 0.05);
  RWATER.visible = S.river != null; if (S.river != null) { RWATER.position.z = S.river - 180; }
  WAVE.visible = S.wave != null; if (S.wave != null) { WAVE.position.set(0, 0, S.wave); WAVE.scale.set(1, 1 + 0.03 * Math.sin(t * 6), 1); }
  VORTEX.visible = (S.vortex || 0) > 0.01; if (VORTEX.visible) { VORTEX.rotation.y = -t * 2.2; VORTEX.position.y = 0.5 - S.vortex * 1.6; VORTEX.scale.set(1, S.vortex, 1); }
  SPIRALSWIRL.visible = (S.swirl || 0) > 0.01; SPIRALSWIRL.material.opacity = (S.swirl || 0) * 0.7; SPIRALSWIRL.rotation.z = t * 0.9;
  GATES.forEach((g, i) => { g.position.x = (i ? 1 : -1) * (1.6 + (S.gates || 0) * 3.2); }); POUR.visible = (S.gates || 0) > 0.25; POUR.scale.x = Math.max(0.01, S.gates || 0); LAKE.position.y = -0.4 + (S.lake || 0) * 0.5;
  // camera
  const sh = S.shake || 0, hh = S.handheld ?? 0.012; const look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  if (S.orbit) { const d = pos.clone().sub(look); d.applyAxisAngle(new THREE.Vector3(0, 1, 0), S.orbit); pos.copy(look).add(d); }
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look.x + (rnd(f, 3) - 0.5) * sh * 1.5, look.y + (rnd(f, 4) - 0.5) * sh * 1.5, look.z); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); camR.setFromMatrixColumn(camera.matrixWorld, 0); sky.position.copy(camera.position);
  const fc = S.shadowAt || S.look, sd = new THREE.Vector3(...L.sun).normalize(); moon.position.set(fc[0] + sd.x * 60, fc[1] + Math.max(sd.y, 0.25) * 60, fc[2] + sd.z * 60); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 16; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 220; sc.updateProjectionMatrix(); }
  { const sv = sd.clone().multiplyScalar(500).add(camera.position).project(camera); inkU.sunUV.value.set(sv.x * 0.5 + 0.5, sv.y * 0.5 + 0.5); inkU.raysK.value = sv.z < 1 ? (S.rays ?? L.rays) : 0; }
  // rain around the camera
  RAIN.visible = !!S.rain; if (S.rain) { const dirr = new THREE.Vector3(0.12, -1, 0.05).normalize(); Q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirr.clone().negate());
    for (let i = 0; i < RAIN.count; i++) { const fall = ((t * 1.7 + rnd(i, 1)) % 1); V.set(camera.position.x + (rnd(i, 2) - 0.5) * 18, camera.position.y + 6 - fall * 12, camera.position.z + (rnd(i, 3) - 0.5) * 18 - 4); const q2 = camera.quaternion.clone(); M4.compose(V, q2, SC); RAIN.setMatrixAt(i, M4); } RAIN.instanceMatrix.needsUpdate = true; }
  SPLASH.forEach((m, i) => { m.visible = !!S.rain && !!S.splashAt; if (!m.visible) return; const a = ((t * 2.5 + rnd(i, 1)) % 1); m.position.set(S.splashAt[0] + (rnd(i, 2) - 0.5) * 6, S.splashAt[1] + 0.04, S.splashAt[2] + (rnd(i, 3) - 0.5) * 6); m.scale.setScalar(0.5 + a * 3); m.material.opacity = (1 - a) * 0.7; });
  BOLT.visible = !!S.bolt; if (S.bolt) { BOLT.position.set(...S.bolt); BOLT.quaternion.copy(camera.quaternion); }
  SPARKS.forEach((m, i) => { const sp = S.sparks; m.visible = !!sp; if (!sp) return; const a = ((f * 0.37 + i * 0.61) % 1); m.position.set(sp[0] + (rnd(i, 7) - 0.5) * 0.5 * a, sp[1] + a * 0.4 - a * a * 0.6, sp[2] + (rnd(i, 9) - 0.5) * 0.5 * a); m.lookAt(m.position.x + (rnd(i, 7) - 0.5), m.position.y + 0.3, m.position.z + (rnd(i, 9) - 0.5)); });
  DUST.forEach((m, i) => { const em = (S.dust || [])[i % Math.max(1, (S.dust || []).length)]; m.visible = !!em && i < (S.dustN ?? 30); if (!m.visible) return; const a = ((t * (em.rate || 1)) + rnd(i, 3)) % 1;
    m.position.set(em.p[0] + (rnd(i, 4) - 0.5) * (em.w || 2), em.p[1] + 0.2 + a * (em.h || 1.2), em.p[2] + (rnd(i, 5) - 0.5) * (em.w || 2)); m.scale.setScalar((0.6 + a * 2.4) * (em.s || 1)); m.quaternion.copy(camera.quaternion); m.material.opacity = (1 - a) * (em.k ?? 0.45); m.material.color.set(em.col || '#e8e0d0'); });
  MOTES.forEach((m, i) => { m.visible = !!S.motes; if (!m.visible) return; m.position.set(camera.position.x + (rnd(i, 1) - 0.5) * 6 + Math.sin(t * 0.3 + i) * 0.3, camera.position.y - 1 + rnd(i, 2) * 3 + Math.sin(t * 0.5 + i * 2) * 0.2, camera.position.z - 1.5 - rnd(i, 3) * 6);
    m.scale.setScalar(0.03 + rnd(i, 4) * 0.05); m.quaternion.copy(camera.quaternion); m.material.opacity = 0.6 + 0.4 * Math.sin(t * 3 + i); });
  bang.visible = !!S.bang; bangLight.intensity = S.bang ? 10 * S.bang.k : 0; if (S.bang) { bang.position.set(...S.bang.p); bang.scale.setScalar(0.2 + 0.4 * S.bang.k); }
  for (const g of glows) { g.quaternion.copy(camera.quaternion); g.material.opacity = g.userData.k0 * Math.exp(-g.position.distanceTo(camera.position) * 0.04); }
  if (bang.userData.g) { bang.userData.g.quaternion.copy(camera.quaternion); bang.userData.g.scale.setScalar(1.4); }
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw); c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(camera.position.x - a.x, camera.position.z - a.z), a.roll || 0); c.mat.color.set(a.tint || S.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2; c.mesh.castShadow = !a.fx;
    c.blob.visible = !a.fx && a.blob !== false; c.blob.position.set(a.x, (a.ground ?? a.y) + 0.015, a.z); c.blob.scale.set(1.0 * s, 0.55 * s, 1); });
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.autoUpdate = false; swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false); scene.fog = fog; renderer.shadowMap.autoUpdate = true;
  renderer.setRenderTarget(rtB1); renderer.render(brightScene, fsCam);
  for (let k = 0; k < 3; k++) { blurU.src.value = rtB1.texture; blurU.dir.value.set(1 / (W / 4), 0); renderer.setRenderTarget(rtB2); renderer.render(blurScene, fsCam); blurU.src.value = rtB2.texture; blurU.dir.value.set(0, 1 / (H / 4)); renderer.setRenderTarget(rtB1); renderer.render(blurScene, fsCam); }
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = S.focus || 5; dofU.cinf.value = Math.min(1.5, (S.cinf ?? 3) * 0.25); dofU.haze.value = S.haze || 0; dofU.time.value = t; renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;

window.ready = true;
