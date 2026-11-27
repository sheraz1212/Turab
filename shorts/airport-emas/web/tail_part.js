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
  for (let k = 0; k < BLOCK_N; k++) { const b = BLKP[k]; const on = LAYRANK[k] < laid; let cr = 0; if (on) for (const [z, x1, w] of tracks) if (b.x - BS / 2 < x1 && Math.abs(b.z - z) < w + BS / 2 - 0.15) cr = Math.max(cr, cl01((x1 - (b.x - BS / 2)) / BS));
    const h = on ? b.h * (1 - 0.68 * cr) : 0.0001; E3.set(0, (cr > 0 ? (b.c - 0.5) * 0.2 : 0), cr * (b.c - 0.5) * 0.25); Q.setFromEuler(E3); M4.compose(V3.set(b.x, h / 2 + 0.02, b.z), Q, S3.set(BS - 0.06, h, BS - 0.06)); BLK.setMatrixAt(k, M4);
    BLK.setColorAt(k, COL.setHSL(0.58, 0.05, (0.86 + b.c * 0.08) * (1 - cr * 0.28))); if (cr > 0.2) for (let q = 0; q < 4 && nr < RUBBLE_N; q++, nr++) { const s = (0.05 + rnd(k, q) * 0.09); E3.set(rnd(k, q + 9) * 6, rnd(k, q + 3) * 6, 0); Q.setFromEuler(E3); M4.compose(V3.set(b.x + (rnd(k, q + 1) - 0.5) * BS * 1.3, h + 0.04 + rnd(k, q + 5) * 0.05, b.z + (rnd(k, q + 2) - 0.5) * BS * 1.3), Q, S3.set(s, s * 0.7, s)); RUB.setMatrixAt(nr, M4); RUB.setColorAt(nr, COL.setHSL(0.58, 0.05, 0.62 + rnd(k, q) * 0.25)); } }
  for (let q = nr; q < RUBBLE_N; q++) { M4.makeScale(0, 0, 0); RUB.setMatrixAt(q, M4); } BLK.instanceMatrix.needsUpdate = true; BLK.instanceColor.needsUpdate = true; RUB.instanceMatrix.needsUpdate = true; if (RUB.instanceColor) RUB.instanceColor.needsUpdate = true;
  // ---- camera ----
  const sh = S.shake || 0, hh = S.handheld ?? 0.008; let look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look.x, look.y, look.z); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.far = 3000; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); SKY.position.copy(camera.position);
  const fc = S.shadowAt ? S.shadowAt : [look.x, Math.max(0, look.y - 1), look.z], sd = new THREE.Vector3(...L.sun).normalize(); moon.position.set(fc[0] + sd.x * 80, fc[1] + sd.y * 80, fc[2] + sd.z * 80); moon.target.position.set(...fc);
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
