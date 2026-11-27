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
