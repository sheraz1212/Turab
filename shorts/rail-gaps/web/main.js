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

const NAMES = ['Barrel_01', 'wooden_crate_01', 'wooden_crate_02', 'wooden_barrels_01', 'tea_set_01'];
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
const PBRN = ['red_sandstone_wall', 'rock_wall_08', 'aerial_sand', 'red_sand', 'gravel_floor_02', 'river_small_rocks', 'weathered_brown_planks', 'weathered_plank_siding', 'wood_floor_worn', 'dry_ground_rocks', 'corrugated_iron', 'fine_grained_wood'];
await Promise.all(PBRN.flatMap((n) => ['diff', 'nor', 'rough'].map((k) => new Promise((res) => TXL.load(`tex/${n}_${k}.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (k === 'diff') t.colorSpace = THREE.SRGBColorSpace; TX[n + k] = t; res(); }, undefined, () => res())))));
const pbr = (n, rep, o = {}) => { const r = Array.isArray(rep) ? rep : [rep, rep]; const cl = (t) => { const c = t.clone(); c.repeat.set(r[0], r[1]); c.needsUpdate = true; return c; };
  return new THREE.MeshStandardMaterial({ map: cl(TX[n + 'diff']), normalMap: cl(TX[n + 'nor']), roughnessMap: cl(TX[n + 'rough']), roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2), ...o }); };
const R = (s) => P.rng(s);
ZONE = 'rail';
// ================= DESERT + CANYON =================
const ground = add(new THREE.PlaneGeometry(1400, 1400), pbr('aerial_sand', 260, { color: '#f0b080' }), 0, 0, -300, scene, false); ground.rotation.x = -Math.PI / 2;
const SAND2 = pbr('red_sand', [8, 120], { color: '#f8c8a0' });
// canyon walls: tall displaced cliffs on both sides, banded strata, plus mesas on the horizon
const cliffMat = pbr('red_sandstone_wall', [14, 3], { color: '#ffb890' });
const cliff = (x, z0, z1, h, side) => { const L = z1 - z0, g = new THREE.PlaneGeometry(L, h, 90, 24); const pa = g.attributes.position, r = R(Math.abs(x * 7 + z0));
  for (let i = 0; i < pa.count; i++) { const u = pa.getX(i), v = pa.getY(i); const n = Math.sin(u * 0.08 + r() * 0) * 3 + Math.sin(u * 0.31 + v * 0.2) * 1.2 + Math.sin(v * 0.9) * 0.6 + (v > h * 0.42 ? 0 : (0.5 - v / h) * 4); pa.setZ(i, n); }
  g.computeVertexNormals(); const m = add(g, cliffMat, x, h / 2, (z0 + z1) / 2, scene); m.rotation.y = side * Math.PI / 2; m.receiveShadow = true; m.castShadow = false;
  const top = add(new THREE.PlaneGeometry(L, 60), pbr('dry_ground_rocks', [30, 3], { color: '#e8a070' }), x + side * 30, h + 1.5, (z0 + z1) / 2, scene, false); top.rotation.set(-Math.PI / 2, 0, Math.PI / 2); return m; };
cliff(-46, -620, 120, 46, 1); cliff(46, -620, 120, 52, -1);
for (let i = 0; i < 22; i++) { const r = R(400 + i); const x = (r() - 0.5) * 900, z = -700 - r() * 400; const h = 40 + r() * 80, rad = 40 + r() * 70;
  const m = add(new THREE.CylinderGeometry(rad * 0.8, rad, h, 9), pbr('red_sandstone_wall', [6, 2], { color: '#ff9a70' }), x, h / 2, z, scene, false); m.rotation.y = r() * 6; }
// stratified rock boulders + cacti + tumbleweeds + telegraph poles
const ROCK = pbr('rock_wall_08', [2, 2], { color: '#ffb088' });
for (let i = 0; i < 80; i++) { const r = R(800 + i); const x = (r() < 0.5 ? -1 : 1) * (5 + r() * 36), z = 60 - r() * 600; const s = 0.6 + r() * 2.6; const m = add(new THREE.DodecahedronGeometry(s, 1), ROCK, x, s * 0.4, z, scene); m.scale.y = 0.6 + r() * 0.4; m.rotation.set(r(), r() * 6, r()); }
const CACT = std({ color: '#3f8a4a', roughness: 0.6 }), CACT2 = std({ color: '#5aa85a', roughness: 0.6 });
const cactus = (x, z, s = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); add(new THREE.CapsuleGeometry(0.32, 3.2, 6, 12), CACT, 0, 1.9, 0, g);
  for (const [sx, hy, l] of [[-1, 1.6, 1.2], [1, 2.2, 1.0]]) { const a = add(new THREE.CapsuleGeometry(0.22, 0.6, 4, 10), CACT2, sx * 0.55, hy, 0, g); a.rotation.z = Math.PI / 2; const b = add(new THREE.CapsuleGeometry(0.22, l, 4, 10), CACT2, sx * 0.85, hy + l / 2, 0, g); }
  for (let k = 0; k < 12; k++) add(new THREE.SphereGeometry(0.04, 4, 3), std({ color: '#f4ead8' }), Math.cos(k) * 0.33, 0.6 + k * 0.25, Math.sin(k) * 0.33, g, false); return g; };
for (let i = 0; i < 46; i++) { const r = R(900 + i); const x = (r() < 0.5 ? -1 : 1) * (6 + r() * 34), z = 70 - r() * 560; if (Math.abs(x + 12) < 4 && z > -70) continue; cactus(x, z, 0.8 + r() * 0.7); }
const TUMB = []; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); scene.add(g); for (let k = 0; k < 18; k++) { const c = add(new THREE.TorusGeometry(0.35 + (k % 3) * 0.08, 0.012, 3, 12), std({ color: '#b8905a' }), 0, 0, 0, g, false); c.rotation.set(k * 0.7, k * 1.3, k * 0.4); } g.position.set(8 + i * 5, 0.42, -20 - i * 30); TUMB.push(g); }
for (let z = 60; z > -600; z -= 30) { add(cyl(0.12, 0.15, 7, 8), pbr('weathered_brown_planks', [1, 3]), 4.2, 3.5, z); add(box(1.8, 0.12, 0.12), std({ color: '#5a3a24' }), 4.2, 6.6, z); for (const s of [-0.7, 0, 0.7]) add(cyl(0.04, 0.04, 0.12, 6), std({ color: '#7ac8e8', metalness: 0.2, roughness: 0.1 }), 4.2 + s, 6.72, z); }
for (let z = 45; z > -600; z -= 30) { const w = add(cyl(0.008, 0.008, 30, 4), std({ color: '#3a3030' }), 4.2, 6.55, z, scene, false); w.rotation.x = Math.PI / 2; w.userData.ndSkip = true; }

// ================= TRACKS =================
// track B (the "perfect" line) at x = 0: deformable rails + instanced sleepers, kink region around z = KZ
const KZ = -150, KW = 26;
window.KINK = 0; const kinkX = (z) => { const u = (z - KZ) / KW; return window.KINK * 1.7 * Math.sin(u * Math.PI) * Math.exp(-u * u * 0.9); };
const BAL = add(new THREE.BoxGeometry(3.6, 0.3, 700, 1, 1, 350), pbr('gravel_floor_02', [3, 500], { color: '#e0b8a0' }), 0, 0.12, -280, scene); BAL.receiveShadow = true;
const BALBASE = BAL.geometry.attributes.position.array.slice();
const SLEEP_GEO = new THREE.BoxGeometry(2.6, 0.14, 0.24); const SLEEP_MAT = pbr('weathered_brown_planks', [1, 0.2], { color: '#c89070' });
const SLEEPERS = new THREE.InstancedMesh(SLEEP_GEO, SLEEP_MAT, 1100); SLEEPERS.castShadow = true; SLEEPERS.receiveShadow = true; scene.add(SLEEPERS);
const SZ = []; for (let z = 70; z > -630; z -= 0.65) SZ.push(z); SLEEPERS.count = SZ.length;
const RAILMAT = new THREE.MeshStandardMaterial({ color: '#d8dce4', metalness: 1.0, roughness: 0.1, envMapIntensity: 1.6, emissive: new THREE.Color(0, 0, 0) });
const RAILSIDE = new THREE.MeshStandardMaterial({ color: '#6a4030', metalness: 0.6, roughness: 0.6, emissive: new THREE.Color(0, 0, 0) });
const RAILS = [-1, 1].map((s) => { const head = add(new THREE.BoxGeometry(0.075, 0.05, 700, 1, 1, 700), RAILMAT, s * 0.7175, 0.56, -280, scene); const web = add(new THREE.BoxGeometry(0.03, 0.12, 700, 1, 1, 700), RAILSIDE, s * 0.7175, 0.47, -280, scene); const foot = add(new THREE.BoxGeometry(0.14, 0.03, 700, 1, 1, 700), RAILSIDE, s * 0.7175, 0.41, -280, scene);
  return [head, web, foot].map((m) => ({ m, base: m.geometry.attributes.position.array.slice(), x0: m.position.x })); });
let lastKink = -1;
const applyKink = () => { if (window.KINK === lastKink) return; lastKink = window.KINK; for (const pair of RAILS) for (const { m, base } of pair) { const pa = m.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const z = base[i * 3 + 2] - 280; pa.setX(i, base[i * 3] + kinkX(z)); } pa.needsUpdate = true; m.geometry.computeBoundingSphere(); }
  { const pa = BAL.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const z = BALBASE[i * 3 + 2] - 280; pa.setX(i, BALBASE[i * 3] + kinkX(z) * 0.85); } pa.needsUpdate = true; }
  const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  SZ.forEach((z, i) => { const dx = (kinkX(z + 0.1) - kinkX(z - 0.1)) / 0.2; p.set(kinkX(z), 0.32, z); e.set(0, -Math.atan(dx) + Math.sin(i * 7.1) * 0.02, 0); q.setFromEuler(e); mm.compose(p, q, sc); SLEEPERS.setMatrixAt(i, mm); }); SLEEPERS.instanceMatrix.needsUpdate = true; };
applyKink();
// track A (the worker's line with gaps) at x = -12: 39-ft rails (11.9 m) with gaps and joint bars
const AX = -12, AL = 11.9;
add(box(3.6, 0.3, 140), pbr('gravel_floor_02', [3, 100], { color: '#e0b8a0' }), AX, 0.12, -40);
const SLA = new THREE.InstancedMesh(SLEEP_GEO, SLEEP_MAT, 230); { const mm = new THREE.Matrix4(); let k = 0; for (let z = 30; z > -110; z -= 0.65) { mm.makeTranslation(AX, 0.32, z); SLA.setMatrixAt(k++, mm); } SLA.count = k; } SLA.castShadow = true; SLA.receiveShadow = true; scene.add(SLA);
const ASEG = []; for (let j = 0; j < 12; j++) { const zc = 30 - AL / 2 - j * (AL + 0.04); for (const s of [-1, 1]) { const g = new THREE.Group(); g.position.set(AX + s * 0.7175, 0, zc); scene.add(g);
  add(box(0.075, 0.05, AL), RAILMAT, 0, 0.56, 0, g); add(box(0.03, 0.12, AL), RAILSIDE, 0, 0.47, 0, g); add(box(0.14, 0.03, AL), RAILSIDE, 0, 0.41, 0, g);
  for (const e of [-1, 1]) { add(box(0.025, 0.1, 0.6), std({ color: '#5a4a40', metalness: 0.7, roughness: 0.4 }), 0.04, 0.48, e * (AL / 2 - 0.15), g); for (let b = 0; b < 2; b++) add(cyl(0.018, 0.018, 0.08, 8), std({ color: '#8a8a90', metalness: 0.9, roughness: 0.3 }), 0.07, 0.48, e * (AL / 2 - 0.05 - b * 0.2), g).rotation.z = Math.PI / 2; }
  g.userData = { zc, s, j }; ASEG.push(g); } }
// ================= STATION (z +10, platform on the east side of track B) =================
const ST = new THREE.Group(); ST.position.set(0, 0, 12); scene.add(ST);
{ const PL = pbr('wood_floor_worn', [3, 12], { color: '#e8c8a8' }); add(box(5, 0.95, 40), PL, 4.4, 0.47, 0, ST); add(box(0.3, 0.1, 40), std({ color: '#f4e4a0' }), 2.0, 0.98, 0, ST);
  const SID = pbr('weathered_plank_siding', [4, 1], { color: '#f4d8b8' }); add(box(3.4, 3.6, 16), SID, 8.6, 2.75, 2, ST); add(box(4.6, 0.25, 17), std({ color: '#6a3a2a' }), 8.0, 4.65, 2, ST);
  for (let k = -3; k <= 3; k++) { add(box(0.1, 1.4, 1.1), std({ color: '#ffe0a0', emissive: '#ffb050', emissiveIntensity: 0.5 }), 6.88, 2.4, 2 + k * 2.2, ST, false); add(box(0.12, 1.5, 0.08), std({ color: '#3a2a20' }), 6.86, 2.4, 2 + k * 2.2, ST); }
  for (let z = -18; z <= 18; z += 4.5) add(cyl(0.08, 0.08, 3.4, 8), std({ color: '#2f5a4a', metalness: 0.5, roughness: 0.4 }), 3.0, 2.65, z, ST);
  add(box(3.2, 0.12, 40), pbr('corrugated_iron', [2, 12], { metalness: 0.6, color: '#c8d0d8' }), 4.6, 4.35, 0, ST).rotation.z = -0.1;
  const sign = (txt, bg, fg, w = 1024, h = 200) => { const [c, g] = cv(w, h); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 12; g.strokeRect(12, 12, w - 24, h - 24); g.fillStyle = fg; g.font = `900 ${h * 0.55}px Georgia`; g.textAlign = 'center'; g.fillText(txt, w / 2, h * 0.7); return P.tex(c); };
  const s1 = add(new THREE.PlaneGeometry(5, 1), std({ map: sign('THE SMOOTH LINE', '#7a1f2a', '#ffd870') }), 6.86, 4.0, 2, ST, false); s1.rotation.y = -Math.PI / 2;
  const s2 = add(new THREE.PlaneGeometry(3.2, 0.64), std({ map: sign('DUSTWATER', '#1f3a5a', '#f4ead8') }), 3.0, 3.6, -9, ST, false); s2.rotation.y = -Math.PI / 2;
  for (let k = 0; k < 6; k++) { const b = add(new THREE.PlaneGeometry(1.2, 0.7), std({ color: ['#c8322f', '#f4ead8', '#2f5a9a'][k % 3], side: THREE.DoubleSide }), 3.0, 4.0, -15 + k * 6, ST, false); b.rotation.y = Math.PI / 2; }
  put('Barrel_01', 5.6, 0.95, -6, 0, 1, ST); put('wooden_crate_01', 5.2, 0.95, -4, 0.4, 1, ST); put('wooden_crate_02', 5.3, 1.3, -4, 1.1, 0.8, ST); put('wooden_barrels_01', 6.0, 0.95, 12, 0, 1, ST); }
const STL = []; for (let z = -6; z <= 30; z += 9) STL.push(lamp(3.0, 3.6, z, '#ffc070', 2.5, 8, 0.7));
// big heat thermometer sign beside the kink, and a calendar board
const thermoTex = (() => { const [c, g] = cv(256, 768); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData = { c, g, k: -1 }; return t; })();
const drawThermo = (k) => { const T0 = thermoTex.userData; if (Math.abs(T0.k - k) < 0.004) return; T0.k = k; const g = T0.g; g.fillStyle = '#f4ead8'; g.fillRect(0, 0, 256, 768); g.strokeStyle = '#3a2a20'; g.lineWidth = 14; g.strokeRect(7, 7, 242, 754);
  g.fillStyle = '#3a2a20'; for (let i = 0; i <= 10; i++) { g.fillRect(150, 90 + i * 52, i % 2 ? 30 : 50, 6); } g.font = '900 40px Arial'; g.fillText('°F', 160, 70);
  g.fillStyle = '#e8e8e8'; g.strokeStyle = '#3a2a20'; g.lineWidth = 6; g.beginPath(); g.roundRect(84, 70, 44, 560, 22); g.fill(); g.stroke(); g.beginPath(); g.arc(106, 670, 52, 0, 7); g.fill(); g.stroke();
  const top = 620 - k * 530; const gr = g.createLinearGradient(0, top, 0, 700); gr.addColorStop(0, '#ff3a2a'); gr.addColorStop(1, '#c81a1a'); g.fillStyle = gr; g.beginPath(); g.roundRect(94, top, 24, 640 - top, 12); g.fill(); g.beginPath(); g.arc(106, 670, 40, 0, 7); g.fill(); g.fillStyle = '#ffffff88'; g.fillRect(98, top + 6, 6, 600 - top); thermoTex.needsUpdate = true; };
drawThermo(0.2);
const THERMO = new THREE.Group(); THERMO.position.set(3.4, 0, KZ + 18); scene.add(THERMO); add(cyl(0.08, 0.08, 2.2, 8), std({ color: '#4a3220' }), 0, 1.1, 0, THERMO); const tp = add(new THREE.PlaneGeometry(0.9, 2.7), std({ map: thermoTex, roughness: 0.5 }), 0, 3.4, 0.06, THERMO, false); add(box(1.0, 2.8, 0.1), std({ color: '#5a3a24' }), 0, 3.4, 0, THERMO);
// ================= TRAIN (loco + 3 luxury coaches on track B, facing +z) =================
// ================= LOCOMOTIVE (front faces +z) =================
const LOCO = new THREE.Group(); scene.add(LOCO);
{ const G = std({ color: '#1f6a42', metalness: 0.45, roughness: 0.14, envMapIntensity: 1.5 }), BLK = std({ color: '#1a1a1e', metalness: 0.4, roughness: 0.45 }), BR = std({ color: '#e0b04a', metalness: 0.9, roughness: 0.25 }), RED = std({ color: '#b8222a', metalness: 0.2, roughness: 0.35 });
  const boiler = add(cyl(0.95, 0.95, 5.2, 32), G, 0, 2.35, -2.2, LOCO); boiler.rotation.x = Math.PI / 2;
  for (const z of [-0.3, -1.6, -2.9, -4.2]) { const b = add(cyl(0.97, 0.97, 0.08, 32), BR, 0, 2.35, z, LOCO); b.rotation.x = Math.PI / 2; }
  const smoke = add(cyl(1.0, 1.0, 1.0, 32), BLK, 0, 2.35, 0.7, LOCO); smoke.rotation.x = Math.PI / 2;
  const door = add(cyl(0.8, 0.8, 0.1, 32), BLK, 0, 2.35, 1.22, LOCO); door.rotation.x = Math.PI / 2; add(new THREE.SphereGeometry(0.08, 12, 8), BR, 0, 2.35, 1.3, LOCO);
  add(cyl(0.32, 0.25, 1.4, 20), BLK, 0, 3.9, 0.6, LOCO); add(cyl(0.4, 0.4, 0.15, 20), BR, 0, 4.6, 0.6, LOCO);
  add(new THREE.SphereGeometry(0.42, 20, 12, 0, 6.3, 0, 1.6), BR, 0, 3.3, -2.0, LOCO); add(cyl(0.38, 0.38, 0.3, 20), BR, 0, 3.4, -2.0, LOCO);
  add(box(2.9, 0.5, 0.35), RED, 0, 1.0, 1.4, LOCO); for (const s of [-1, 1]) { const bf = add(cyl(0.2, 0.2, 0.45, 16), BLK, s * 1.0, 1.0, 1.75, LOCO); bf.rotation.x = Math.PI / 2; const bh = add(cyl(0.26, 0.26, 0.06, 16), std({ color: '#c8c8c8', metalness: 0.9, roughness: 0.2 }), s * 1.0, 1.0, 2.0, LOCO); bh.rotation.x = Math.PI / 2; }
  add(box(2.6, 0.2, 7.0), BLK, 0, 1.3, -2.1, LOCO);
  for (const s of [-1, 1]) add(box(0.5, 0.12, 6.4), BLK, s * 1.2, 1.9, -2.4, LOCO);
  // headlamp
  add(box(0.4, 0.45, 0.35), BLK, 0, 3.4, 1.15, LOCO); const hl = add(new THREE.CircleGeometry(0.15, 20), new THREE.MeshBasicMaterial({ color: '#fff6d8' }), 0, 3.4, 1.34, LOCO, false); hl.userData.ndSkip = true;
  for (const s of [-1, 1]) { add(box(0.3, 0.35, 0.25), BLK, s * 1.1, 1.55, 1.45, LOCO); }
  // cab
  add(box(2.7, 2.4, 2.4), G, 0, 2.9, -5.6, LOCO); add(box(3.0, 0.15, 2.8), BLK, 0, 4.15, -5.6, LOCO);
  for (const s of [-1, 1]) { const w = add(new THREE.CircleGeometry(0.28, 20), std({ color: '#ffd27a', emissive: '#ff9a3a', emissiveIntensity: 1.2 }), s * 0.75, 3.4, -4.39, LOCO, false); }
  // wheels
  const wheel = (z, r, x) => { const g = new THREE.Group(); g.position.set(x, r + 0.5, z); LOCO.add(g);
    const t = add(cyl(r, r, 0.14, 32), RED, 0, 0, 0, g); t.rotation.z = Math.PI / 2; const tyre = add(new THREE.TorusGeometry(r, 0.06, 8, 32), std({ color: '#c0c4c8', metalness: 0.9, roughness: 0.2 }), 0.03 * Math.sign(x), 0, 0, g); tyre.rotation.y = Math.PI / 2;
    for (let k = 0; k < 12; k++) { const sp = add(box(0.06, r * 1.9, 0.05), std({ color: '#7a1218' }), Math.sign(x) * 0.08, 0, 0, g); sp.rotation.x = k / 12 * Math.PI; }
    add(cyl(0.12, 0.12, 0.22, 16), BR, 0, 0, 0, g).rotation.z = Math.PI / 2; return g; };
  LOCO.userData.wheels = [];
  for (const s of [-1, 1]) for (const [z, r] of [[0.4, 0.5], [-2.2, 0.88], [-4.3, 0.88]]) LOCO.userData.wheels.push(wheel(z, r, s * 0.72));
  for (const s of [-1, 1]) { add(box(0.06, 0.12, 2.3), std({ color: '#c0c4c8', metalness: 0.9, roughness: 0.2 }), s * 0.86, 1.2, -3.25, LOCO); const cy = add(cyl(0.3, 0.3, 1.2, 20), BLK, s * 1.15, 1.25, -0.4, LOCO); cy.rotation.x = Math.PI / 2; }
}
LOCO.userData.light = new THREE.SpotLight('#fff0d0', 14, 60, rx(22), 0.6, 1.2); LOCO.add(LOCO.userData.light); LOCO.userData.light.position.set(0, 3.4, 1.4); LOCO.add(LOCO.userData.light.target); LOCO.userData.light.target.position.set(0, 0.5, 20);
LOCO.userData.hg = glow(0, 0, 0, 0.9, '255,240,200', 1); LOCO.userData.hg2 = glow(0, 0, 0, 1.2, '255,240,210', 0.6);

const COACHES = []; for (let k = 0; k < 3; k++) { const g = new THREE.Group(); scene.add(g); const RED = std({ color: '#9a1f2a', metalness: 0.45, roughness: 0.14, envMapIntensity: 1.5 }), GOLD = std({ color: '#e8b84a', metalness: 0.9, roughness: 0.25 }), BLK = std({ color: '#1a1a1e', metalness: 0.4, roughness: 0.4 });
  add(box(2.7, 2.6, 12), RED, 0, 2.6, 0, g); add(new THREE.CylinderGeometry(1.5, 1.5, 12, 24, 1, false, 0, Math.PI), std({ color: '#3a2a2a', roughness: 0.5 }), 0, 3.9, 0, g).rotation.set(Math.PI / 2, 0, Math.PI / 2);
  for (const s of [-1, 1]) { add(box(0.04, 0.08, 12), GOLD, s * 1.36, 3.6, 0, g); add(box(0.04, 0.08, 12), GOLD, s * 1.36, 1.6, 0, g); for (let w = -2; w <= 2; w++) { add(box(0.06, 0.8, 1.3), std({ color: '#ffe8b0', emissive: '#ffc070', emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.1 }), s * 1.36, 2.85, w * 2.2, g, false); add(box(0.07, 0.92, 0.08), GOLD, s * 1.37, 2.85, w * 2.2 - 0.68, g); } }
  add(box(2.6, 0.3, 12.4), BLK, 0, 1.15, 0, g); for (const z of [-4.2, 4.2]) for (const s of [-1, 1]) { const w = add(cyl(0.46, 0.46, 0.12, 20), std({ color: '#2a2a30', metalness: 0.6, roughness: 0.3 }), s * 0.72, 0.95, z, g); w.rotation.z = Math.PI / 2; }
  for (const z of [-6.2, 6.2]) add(box(2.2, 2.2, 0.2), std({ color: '#5a1a22' }), 0, 2.5, z, g); COACHES.push(g); }
// coach interior set (x = 300): red velvet seats, brass lamps, bright windows with desert
const INT = new THREE.Group(); INT.position.set(300, 0, 0); scene.add(INT);
{ add(box(3, 0.1, 14), pbr('wood_floor_worn', [2, 8], { color: '#a06040' }), 0, 0, 0, INT); add(box(3.2, 0.1, 14), std({ color: '#f4e4c8' }), 0, 3.0, 0, INT); for (let k = -6; k <= 6; k += 1.5) add(box(3.2, 0.08, 0.1), std({ color: '#c8962e', metalness: 0.8, roughness: 0.3 }), 0, 2.94, k, INT);
  const [c, g] = cv(512, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#4a90e8'); gr.addColorStop(0.55, '#bfe0ff'); gr.addColorStop(0.56, '#e89060'); gr.addColorStop(1, '#c86a3a'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256); for (let i = 0; i < 6; i++) { g.fillStyle = '#b84a2a'; g.fillRect(i * 90 + 10, 110, 50, 34); }
  const winT = P.tex(c, 1, 1); for (const s of [-1, 1]) { add(box(0.1, 3, 14), std({ color: '#6a1a22', roughness: 0.6 }), s * 1.5, 1.5, 0, INT); for (let w = -2; w <= 2; w++) { const wi = add(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshBasicMaterial({ map: winT }), s * 1.44, 1.75, w * 2.6, INT, false); wi.rotation.y = -s * Math.PI / 2; add(box(0.1, 1.05, 1.35), std({ color: '#c8962e', metalness: 0.8, roughness: 0.3 }), s * 1.46, 1.75, w * 2.6, INT); } }
  const VEL = std({ color: '#a8222a', roughness: 0.85 }); for (let w = -2; w <= 2; w++) for (const s of [-1, 1]) { add(box(1.0, 0.45, 0.6), VEL, s * 0.85, 0.45, w * 2.6, INT); add(box(1.0, 0.9, 0.18), VEL, s * 0.85, 0.95, w * 2.6 + 0.35, INT); add(box(1.02, 0.08, 0.2), std({ color: '#e8b84a', metalness: 0.9, roughness: 0.25 }), s * 0.85, 1.42, w * 2.6 + 0.35, INT); }
  add(box(0.5, 0.05, 0.5), pbr('fine_grained_wood', [1, 1]), 1.15, 0.85, 0.4, INT); put('tea_set_01', 1.15, 0.88, 0.4, 0, 1, INT); }
for (const z of [-3, 3]) { const l = new THREE.PointLight('#ffd090', 4, 6, 1.5); l.position.set(300, 2.6, z); l.userData = { zone: 'int', I0: 4 }; pLights.push(l); scene.add(l); }
// modern train (present day) + yellow rail tensioner machine
const MOD = new THREE.Group(); scene.add(MOD); MOD.visible = false;
{ const WH = std({ color: '#f2f4f6', metalness: 0.3, roughness: 0.2 }), BL = std({ color: '#1f4fa8', metalness: 0.3, roughness: 0.3 }), YL = std({ color: '#ffd21a', roughness: 0.3 }), GL = std({ color: '#10141c', metalness: 0.7, roughness: 0.06 });
  add(box(2.9, 3.0, 22), WH, 0, 2.3, -11.5, MOD); add(box(2.92, 0.45, 22), BL, 0, 1.25, -11.5, MOD); add(box(2.94, 0.6, 20), GL, 0, 2.75, -11.5, MOD);
  const nose = add(new THREE.SphereGeometry(1.45, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), YL, 0, 0.8, -0.5, MOD); nose.scale.set(1, 1.6, 1.6); nose.rotation.x = Math.PI / 2; add(box(2.2, 0.8, 0.5), GL, 0, 3.1, 0.15, MOD).rotation.x = -0.5;
  for (const s of [-1, 1]) add(new THREE.CircleGeometry(0.13, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 2.6) }), s * 0.85, 1.55, 1.75, MOD, false); }
const TENS = new THREE.Group(); scene.add(TENS); TENS.visible = false;
{ const YL = std({ color: '#ffc81a', metalness: 0.3, roughness: 0.3 }), ST2 = std({ color: '#b8c0c8', metalness: 0.9, roughness: 0.2 }); add(box(1.0, 0.5, 2.2), YL, -0.2, 0.85, 0, TENS); add(box(0.6, 0.35, 0.5), std({ color: '#2a2a30' }), -0.2, 1.25, -0.5, TENS);
  for (const z of [-0.9, 0.9]) { const c = add(cyl(0.09, 0.09, 1.0, 12), ST2, 0.4, 0.62, z * 0.5, TENS); c.rotation.x = Math.PI / 2; add(box(0.3, 0.3, 0.3), YL, 0.55, 0.6, z, TENS); } add(cyl(0.02, 0.02, 1.6, 6), std({ color: '#1a1a1e' }), -0.6, 0.9, 0, TENS).rotation.z = 0.8; }
// saw sparks, steam puffs, dust, heat motes
const puffTex = (() => { const [c, g] = cv(128, 128); for (let i = 0; i < 9; i++) { const x = 34 + (i * 37) % 60, y = 34 + (i * 53) % 60, gr = g.createRadialGradient(x, y, 0, x, y, 34); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const PUFFS = []; for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: puffTex, transparent: true, depthWrite: false, fog: true })); m.userData.ndSkip = true; m.renderOrder = 3; m.visible = false; scene.add(m); PUFFS.push(m); }
const SPARKS = []; for (let i = 0; i < 40; i++) { const m = add(box(0.008, 0.008, 0.12), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.4, 0.6) }), 0, 0, 0, scene, false); m.userData.ndSkip = true; m.visible = false; SPARKS.push(m); }
const DUST = []; for (let i = 0; i < 50; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: puffTex, transparent: true, depthWrite: false, color: '#e8b890', fog: true })); m.userData.ndSkip = true; m.renderOrder = 3; m.visible = false; scene.add(m); DUST.push(m); }
const MOTES = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex('255,230,170'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.userData.ndSkip = true; m.renderOrder = 5; m.visible = false; scene.add(m); MOTES.push(m); }
const ARROWS = []; for (let i = 0; i < 2; i++) { const g = new THREE.Group(); scene.add(g); const M = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.0, 0.2) }); const sh = add(cyl(0.05, 0.05, 1.2, 10), M, 0, 0, 0, g, false); sh.rotation.z = Math.PI / 2; const hd = add(new THREE.ConeGeometry(0.14, 0.32, 12), M, 0.75, 0, 0, g, false); hd.rotation.z = -Math.PI / 2; g.children.forEach((c) => (c.userData.ndSkip = true)); g.visible = false; ARROWS.push(g); }

// ================= light presets =================
const skyEnv = (top, hor, gnd, sun) => { const [c, g] = cv(512, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.5, hor); gr.addColorStop(0.52, gnd); gr.addColorStop(1, gnd); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  g.fillStyle = sun; g.beginPath(); g.ellipse(380, 90, 30, 22, 0, 0, 7); g.fill(); const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return pmrem.fromEquirectangular(t).texture; };
const PRESET = {
  day: { hemi: ['#d0e4ff', '#a05a3a', 1.45], key: ['#fff2dc', 4.4], fog: ['#f0c8a8', 0.0006], sky: 1, sun: [0.55, 0.62, 0.6], expo: 1.12, lamps: 0, sat: 1.42, lift: [0, 0, 0], env: skyEnv('#2a6ad8', '#e8f2ff', '#c86a3a', '#ffffff'), bloomK: 0.9, thr: 1.0, rays: 0.55 },
  hot: { hemi: ['#ffe0b8', '#a04a2a', 1.4], key: ['#fff0c8', 5.0], fog: ['#ffc890', 0.0009], sky: 1, sun: [0.3, 0.85, 0.4], expo: 1.14, lamps: 0, sat: 1.44, lift: [0.01, 0, 0], env: skyEnv('#2a5ac8', '#fff0d0', '#c86a3a', '#ffffff'), bloomK: 1.05, thr: 0.95, rays: 0.9 },
  gold: { hemi: ['#ffd0a0', '#7a3a20', 1.15], key: ['#ffb070', 4.4], fog: ['#f0a070', 0.0008], sky: 2, sun: [0.85, 0.2, 0.5], expo: 1.1, lamps: 0, sat: 1.42, lift: [0, 0, 0], env: skyEnv('#3a4ab0', '#ffb070', '#8a3a1a', '#fff0b0'), bloomK: 0.95, thr: 0.98, rays: 0.95 },
  int: { hemi: ['#ffe0c0', '#5a2a20', 1.0], key: ['#fff2dc', 1.0], fog: ['#f0c8a8', 0.0003], sky: 1, sun: [0.55, 0.62, 0.6], expo: 1.15, lamps: 1, sat: 1.3, lift: [0.01, 0.005, 0], env: skyEnv('#2a6ad8', '#e8f2ff', '#c86a3a', '#ffffff'), bloomK: 0.9, thr: 1.0, rays: 0, zone: 'int' },
};

// ================= per-frame =================
import { stateAt, TOTAL } from './shots.js';
const tmp = new THREE.Vector3(), camR = new THREE.Vector3();
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const HEAT0 = new THREE.Color(0, 0, 0), HEAT1 = new THREE.Color(1.6, 0.45, 0.25), HEAT2 = new THREE.Color(2.2, 1.1, 1.4);
window.renderFrame = (f) => {
  const S = stateAt(f, {}), t = f / 30;
  const L = PRESET[S.preset || 'day'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2]; moon.color.set(L.key[0]); moon.intensity = L.key[1];
  scene.fog.color.set(L.fog[0]); scene.fog.density = S.fog ?? L.fog[1]; skyU.day.value = L.sky; skyU.sunD.value.set(...L.sun); scene.environment = L.env;
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(...L.lift); inkU.flash.value = S.flash || 0; inkU.bloomK.value = L.bloomK; brightU.thr.value = L.thr;
  const zone = L.zone || 'rail'; for (const l of pLights) { l.visible = l.userData.zone === zone; l.intensity = l.userData.I0; } for (const g of glows) g.visible = g.userData.zone === zone || g.userData.zone === 'fx';
  // kink + heat
  window.KINK = S.kink || 0; applyKink();
  const h = S.heat || 0; const ec = h < 0.6 ? HEAT0.clone().lerp(HEAT1, h / 0.6) : HEAT1.clone().lerp(HEAT2, (h - 0.6) / 0.4); RAILMAT.emissive.copy(ec); RAILSIDE.emissive.copy(ec).multiplyScalar(0.5);
  ASEG.forEach((g) => { g.scale.z = 1 + (S.grow || 0) * 0.0028; });
  drawThermo(S.thermo ?? 0.25); THERMO.visible = S.thermo != null;
  // camera
  const sh = S.shake || 0, hh = S.handheld ?? 0.012; const look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  if (S.orbit) { const d = pos.clone().sub(look); d.applyAxisAngle(new THREE.Vector3(0, 1, 0), S.orbit); pos.copy(look).add(d); }
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look.x + (rnd(f, 3) - 0.5) * sh * 1.5, look.y + (rnd(f, 4) - 0.5) * sh * 1.5, look.z); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); camR.setFromMatrixColumn(camera.matrixWorld, 0); sky.position.copy(camera.position);
  const fc = S.shadowAt || S.look, sd = new THREE.Vector3(...L.sun).normalize(); moon.position.set(fc[0] + sd.x * 60, fc[1] + Math.max(sd.y, 0.25) * 60, fc[2] + sd.z * 60); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 16; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 220; sc.updateProjectionMatrix(); }
  { const sv = sd.clone().multiplyScalar(500).add(camera.position).project(camera); inkU.sunUV.value.set(sv.x * 0.5 + 0.5, sv.y * 0.5 + 0.5); inkU.raysK.value = sv.z < 1 ? (S.rays ?? L.rays) : 0; }
  // train on track B (loco faces +z), coaches behind
  LOCO.visible = S.train != null; COACHES.forEach((c) => (c.visible = LOCO.visible && !S.noCoach));
  if (LOCO.visible) { const z = S.train; LOCO.position.set((S.trainX || 0) + kinkX(z), 0.05 + (S.bounce || 0) * Math.abs(Math.sin(t * 9)) * 0.06, z); LOCO.rotation.y = -Math.atan((kinkX(z + 0.2) - kinkX(z - 0.2)) / 0.4); LOCO.updateMatrixWorld(true);
    for (const w of LOCO.userData.wheels) { const r = w.position.y - 0.5; w.rotation.x = -z / Math.max(r, 0.3); }
    tmp.set(0, 3.4, 1.45).applyMatrix4(LOCO.matrixWorld); LOCO.userData.hg.position.copy(tmp); LOCO.userData.hg2.position.copy(tmp);
    COACHES.forEach((c, k) => { const cz = z - 12.2 - k * 12.8; c.position.set((S.trainX || 0) + kinkX(cz), 0.05 + (S.bounce || 0) * Math.abs(Math.sin(t * 9 + k)) * 0.08, cz); c.rotation.y = -Math.atan((kinkX(cz + 0.2) - kinkX(cz - 0.2)) / 0.4); }); }
  LOCO.userData.hg.visible = LOCO.userData.hg2.visible = false; LOCO.userData.light.visible = false;
  PUFFS.forEach((m, i) => { m.visible = LOCO.visible && (S.steam ?? 1) > 0; if (!m.visible) return; const age = ((f / 30) * 1.6 + i / PUFFS.length) % 1;
    tmp.set(0, 4.7 + age * 2.6, 0.6 - age * (S.steamDrift ?? 6) + Math.sin(i * 3.1) * 0.3).applyMatrix4(LOCO.matrixWorld); tmp.x += Math.sin(i * 1.7) * age * 1.2; m.position.copy(tmp); m.scale.setScalar(0.8 + age * 3.4); m.quaternion.copy(camera.quaternion); m.material.opacity = (1 - age) * 0.85; m.material.color.set('#ffffff'); });
  MOD.visible = S.modern != null; if (MOD.visible) MOD.position.set(0, 0.05, S.modern);
  TENS.visible = !!S.tens; if (S.tens) { TENS.position.set(...S.tens); }
  // tumbleweeds roll
  TUMB.forEach((g, i) => { g.position.x = 8 + i * 5 + ((t * 2.2 + i * 7) % 40) - 20; g.rotation.z = -g.position.x / 0.42; });
  SPARKS.forEach((m, i) => { const sp = S.sparks; m.visible = !!sp; if (!sp) return; const a = ((f * 0.37 + i * 0.61) % 1); m.position.set(sp[0] + (rnd(i, 7) - 0.5) * 0.5 * a, sp[1] + a * 0.4 - a * a * 0.6, sp[2] + (rnd(i, 9) - 0.2) * 0.8 * a); m.lookAt(m.position.x + (rnd(i, 7) - 0.5), m.position.y + 0.3, m.position.z + (rnd(i, 9) - 0.2)); });
  DUST.forEach((m, i) => { const em = (S.dust || [])[i % Math.max(1, (S.dust || []).length)]; m.visible = !!em && i < (S.dustN ?? 30); if (!m.visible) return; const a = ((t * (em.rate || 1)) + rnd(i, 3)) % 1;
    m.position.set(em.p[0] + (rnd(i, 4) - 0.5) * (em.w || 2), em.p[1] + 0.2 + a * (em.h || 1.2), em.p[2] + (rnd(i, 5) - 0.5) * (em.w || 2)); m.scale.setScalar((0.6 + a * 2.4) * (em.s || 1)); m.quaternion.copy(camera.quaternion); m.material.opacity = (1 - a) * (em.k ?? 0.45); });
  MOTES.forEach((m, i) => { m.visible = !!S.motes; if (!m.visible) return; m.position.set(camera.position.x + (rnd(i, 1) - 0.5) * 6 + Math.sin(t * 0.3 + i) * 0.3, camera.position.y - 1 + rnd(i, 2) * 3 + Math.sin(t * 0.5 + i * 2) * 0.2, camera.position.z - 1.5 - rnd(i, 3) * 6);
    m.scale.setScalar(0.03 + rnd(i, 4) * 0.05); m.quaternion.copy(camera.quaternion); m.material.opacity = 0.6 + 0.4 * Math.sin(t * 3 + i); });
  ARROWS.forEach((g, i) => { const A = (S.arrows || [])[i]; g.visible = !!A; if (!A) return; g.position.set(...A.p); g.rotation.set(0, A.ry || 0, 0); g.scale.setScalar((A.s || 1) * (1 + 0.12 * Math.sin(t * 10))); });
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
  dofU.focus.value = S.focus || 5; dofU.cinf.value = Math.min(1.8, (S.cinf ?? 3) * 0.3); dofU.haze.value = S.haze || 0; dofU.time.value = t; renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;

window.ready = true;
