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
const CLOUDS = []; for (let i = 0; i < 26; i++) { const r = R(400 + i); const a = r() * 6.283, d = 500 + r() * 500; const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), new THREE.MeshBasicMaterial({ map: cloudTex(410 + i), transparent: true, depthWrite: false, fog: false }));
  m.position.set(Math.cos(a) * d, 70 + r() * 160, Math.sin(a) * d); m.scale.setScalar(160 + r() * 160); m.lookAt(0, m.position.y, 0); m.userData.ndSkip = true; m.renderOrder = 0; scene.add(m); CLOUDS.push(m); }
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
{ const cm = new THREE.MeshStandardMaterial({ map: (() => { const t = cliffTex.clone(); t.repeat.set(10, 1); t.needsUpdate = true; return t; })(), roughness: 0.95 });
  const seg = 48, pts = []; for (let i = 0; i <= seg; i++) { const zz = -260 + i / seg * 520; pts.push([EDGE + Math.sin(zz * 0.035) * 2.2 + Math.pow(Math.abs(zz) / 110, 2) * 18, zz]); }
  const pos = [], uv = [], idx = []; for (let i = 0; i <= seg; i++) for (const [j, y] of [[0, 0.02], [1, -70]]) { pos.push(pts[i][0] + j * 3, y, pts[i][1]); uv.push(i / seg, j ? 0 : 1); }
  for (let i = 0; i < seg; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
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
  tops.receiveShadow = true; scene.add(tops); scene.add(trunks);
  // distant hills / mountains
  for (let i = 0; i < 16; i++) { const r2 = R(500 + i), a = -1.4 + i / 15 * 2.8 + (r2() - 0.5) * 0.1, d = 650 + r2() * 250; const h = add(new THREE.SphereGeometry(1, 20, 12), std({ color: `hsl(${150 + r2() * 30},${30 + r2() * 15}%,${34 + r2() * 12}%)`, roughness: 1 }), Math.cos(a) * d + 100, -70, Math.sin(a) * d, scene, false); h.scale.set(140 + r2() * 120, 90 + r2() * 120, 140 + r2() * 100); }
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
{ const liv = (() => { const [c, g] = cv(2048, 512); g.fillStyle = '#f6f8fa'; g.fillRect(0, 0, 2048, 512); // u = along length (tail->nose), v = around (0 = bottom)
    g.fillStyle = '#c8ced8'; g.fillRect(0, 0, 2048, 150); g.fillStyle = '#e8ecf0'; g.fillRect(0, 150, 2048, 40); g.fillStyle = '#c8ced8'; g.fillRect(0, 362, 2048, 150);
    g.fillStyle = '#12808a'; g.fillRect(0, 196, 2048, 26); g.fillStyle = '#ff7a1a'; g.fillRect(0, 226, 2048, 8);
    g.fillStyle = '#e8ecf0'; g.fillRect(0, 290, 2048, 0); for (let x = 140; x < 1880; x += 44) { if (Math.abs(x - 1180) < 50 || Math.abs(x - 400) < 40) continue; g.fillStyle = '#1e2a3a'; g.beginPath(); g.roundRect(x, 262, 20, 28, 8); g.fill(); g.fillStyle = 'rgba(160,200,255,.45)'; g.fillRect(x + 3, 265, 6, 10); }
    for (const dx of [1180, 400, 1900]) { g.strokeStyle = '#9aa4b0'; g.lineWidth = 3; g.strokeRect(dx - 22, 246, 44, 70); }
    g.strokeStyle = 'rgba(120,130,145,.35)'; g.lineWidth = 2; for (let x = 0; x < 2048; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
    g.font = '900 64px Arial Black, Arial'; g.fillStyle = '#12808a'; g.fillText('SKYLARK', 700, 345); return P.tex(c); })();
  const BODY = new THREE.MeshStandardMaterial({ map: liv, roughness: 0.28, metalness: 0.1, envMapIntensity: 1.3 });
  const WHT = std({ color: '#f2f4f8', roughness: 0.3, envMapIntensity: 1.3 }), GRY = std({ color: '#b8c0cc', roughness: 0.35, metalness: 0.4, envMapIntensity: 1.3 }), TEALM = std({ color: '#12808a', roughness: 0.3, envMapIntensity: 1.2 }), ORG = std({ color: '#ff7a1a', roughness: 0.35 }), CHR = std({ color: '#dde2ea', metalness: 1, roughness: 0.15, envMapIntensity: 1.8 }), DK = std({ color: '#1a1c22', roughness: 0.5 });
  const RAD = 1.7, LEN = 18, CY = 3.6;
  const body = add(new THREE.CylinderGeometry(RAD, RAD, LEN, 40, 1, true), BODY, 0, CY, 0, JET); body.rotation.z = -Math.PI / 2; body.rotation.y = 0; body.rotation.x = Math.PI / 2 * 0; { const g = body.geometry; g.rotateY(-Math.PI / 2); }
  const nose = add(new THREE.SphereGeometry(RAD, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), WHT, LEN / 2, CY, 0, JET); nose.rotation.z = -Math.PI / 2; nose.scale.set(1, 2.1, 1); nose.position.y = CY - 0.05;
  // cockpit windows
  for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { const w = add(box(0.5, 0.32, 0.06), std({ color: '#141e2e', metalness: 0.7, roughness: 0.05, envMapIntensity: 2 }), LEN / 2 + 1.55 - k * 0.55, CY + 0.72, s * (0.95 + k * 0.25), JET, false); w.rotation.y = s * (0.6 + k * 0.3); w.rotation.x = s * -0.35; }
  // tail cone (tapering up)
  const tailG = new THREE.CylinderGeometry(RAD, 0.35, 7, 40, 1, true); tailG.rotateZ(Math.PI / 2); tailG.translate(-3.5, 0, 0); { const p = tailG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), k = -x / 7; p.setY(i, p.getY(i) + k * k * 1.1); } tailG.computeVertexNormals(); }
  add(tailG, BODY, -LEN / 2, CY, 0, JET);
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
  JET.userData.ll = glow(0, 0, 0, 0.01, '255,250,230', 0); for (const s of [-1, 1]) { const g2 = glow(0.6, CY - 0.6, s * 13.2, 1.6, s > 0 ? '80,255,120' : '255,60,60', 0.9); JET.add(g2); g2.position.set(-1.8, CY - 0.4, s * 13.4); g2.userData.zone = 'fx'; }
  JET.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
// streaks of spray / sparks behind the main wheels
const SPRAY = []; for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: dustTexA(), transparent: true, depthWrite: false, color: '#e8eef8', fog: true })); m.userData.ndSkip = true; m.renderOrder = 3; m.visible = false; scene.add(m); SPRAY.push(m); }
function dustTexA() { if (dustTexA.t) return dustTexA.t; const [c, g] = cv(128, 128); for (let i = 0; i < 9; i++) { const x = 34 + (i * 37) % 60, y = 34 + (i * 53) % 60, gr = g.createRadialGradient(x, y, 0, x, y, 34); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } dustTexA.t = new THREE.CanvasTexture(c); dustTexA.t.colorSpace = THREE.SRGBColorSpace; return dustTexA.t; }
// rain streaks around the camera
const RAIN_N = 2600; const RAIN = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.012, 0.7), new THREE.MeshBasicMaterial({ color: '#d8e4f4', transparent: true, opacity: 0.55, depthWrite: false, fog: false }), RAIN_N); RAIN.frustumCulled = false; RAIN.userData.ndSkip = true; RAIN.renderOrder = 4; scene.add(RAIN);
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
