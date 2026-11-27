import { stateAt, TOTAL } from './shots.js';
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E3 = new THREE.Euler(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3();
let ledTxt = '';
window.renderFrame = (f) => {
  const S = stateAt(f, {}), t = f / 30; const L = PRESET[S.preset || 'day'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2]; moon.color.set(L.key[0]); moon.intensity = S.key ?? L.key[1];
  scene.fog.color.set(L.fog[0]); scene.fog.density = L.fog[1]; scene.environment = L.env; SKY.visible = L.sky;
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(0, 0, 0); inkU.flash.value = S.flash || 0; inkU.vig.value = L.vig; inkU.bloomK.value = S.bloomK ?? L.bloomK; brightU.thr.value = L.thr; inkU.split.value = 0; inkU.greenK.value = 0; inkU.raysK.value = 0; inkU.worldInk.value = 0.6;
  for (const l of pLights) { l.visible = L.zones.includes(l.userData.zone); l.intensity = l.userData.I0; }
  for (const g of glows) g.visible = g.userData.zone === 'fx' || L.zones.includes(g.userData.zone);
  // siren
  const sir = L.siren ? 0.5 + 0.5 * Math.sin(t * 9) : 0; SIREN.light.intensity = sir * 90; SIREN.mesh.material.emissiveIntensity = sir * 3;
  // ferris wheel
  { const hub = FERRIS.userData.hub; hub.rotation.z = t * 0.12; FERRIS.userData.gond.forEach((g, k) => { const a = k / 16 * Math.PI * 2; g.position.set(Math.cos(a) * 15, Math.sin(a) * 15 - 1.2, 0); g.rotation.z = -hub.rotation.z; }); }
  CAROUSEL.userData.spin.rotation.y = t * 0.6; SWING.userData.top.rotation.y = t * 1.2; RACKLED.forEach((l, i) => (l.visible = Math.sin(t * 6 + i * 1.7) > -0.2));
  // net sag
  { const p = NET.geometry.attributes.position, b = NET.userData.base, n = S.net; for (let i = 0; i < p.count; i++) { let y = b[i * 3 + 1]; const x = b[i * 3], z = b[i * 3 + 2]; y -= 0.25 * (1 - (x * x + z * z) / 50) ; if (n) { const d2 = (x - n.x) ** 2 + (z - (n.z - NETZ)) ** 2; y -= n.k * 1.8 * Math.exp(-d2 / 6); } p.setY(i, y); } p.needsUpdate = true; NET.geometry.computeVertexNormals(); }
  // toy car crash
  TOYS.forEach((g, i) => { g.visible = !!S.toys; if (!S.toys) return; const k = S.toys.k, s = i ? 1 : -1; const hit = Math.min(k, 0.5), after = Math.max(0, k - 0.5); g.position.set(SR + s * (0.9 - hit * 1.62) + s * after * 0.3, 0.76 + (after > 0 ? Math.sin(after * 3) * 0.12 : 0), 0); g.rotation.set(0, i ? Math.PI : 0, s * after * 0.8); });
  BITS.forEach((m, i) => { if (!S.toys || S.toys.k < 0.5) { m.position.y = -50; return; } const a = S.toys.k - 0.5, d = new THREE.Vector3(rnd(i, 1) - 0.5, rnd(i, 2) * 0.8 + 0.3, rnd(i, 3) - 0.5); m.position.set(SR + d.x * a * 2.4, 0.95 + d.y * a * 2 - a * a * 2.5, d.z * a * 2.4); m.rotation.set(a * 9 * rnd(i, 4), a * 7, 0); });
  // LED digits
  if (S.led && S.led !== ledTxt) { drawLED(S.led); ledTxt = S.led; }
  // memory pages
  { const n = Math.min(PAGE_N, Math.round(S.pages || 0)); for (let i = 0; i < PAGE_N; i++) { if (i < n) { E3.set(0, (rnd(i, 1) - 0.5) * 0.25, 0); Q.setFromEuler(E3); M4.compose(V3.set(BR + 2.4 + (rnd(i, 2) - 0.5) * 0.06, 0.01 + i * 0.012, -1.8), Q, S3.set(1, 1, 1)); } else M4.makeScale(0, 0, 0); PAGES.setMatrixAt(i, M4); } PAGES.instanceMatrix.needsUpdate = true; }
  FLY.forEach((m, i) => { if (!S.fly) { m.position.y = -50; return; } const k = (t * 0.9 + rnd(i, 1)) % 1, a = rnd(i, 2) * 6.28 + t * 1.5; m.position.set(BR + Math.cos(a) * (0.6 + k * 2.2), 1.5 + k * 3.4, -3.2 + Math.sin(a) * (0.4 + k * 1.4)); m.rotation.set(k * 6 + i, k * 4, i); });
  // ---- camera ----
  const sh = S.shake || 0, hh = S.handheld ?? 0.01; let look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look.x, look.y, look.z); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.far = 3000; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); SKY.position.copy(camera.position);
  const fc = S.shadowAt ? S.shadowAt : [look.x, Math.max(0, look.y - 1), look.z], sd = new THREE.Vector3(...L.sun).normalize(); moon.position.set(fc[0] + sd.x * 80, fc[1] + sd.y * 80, fc[2] + sd.z * 80); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 16; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix(); }
  for (const g of glows) { g.quaternion.copy(camera.quaternion); g.material.opacity = g.userData.k0 * Math.exp(-g.position.distanceTo(camera.position) * 0.012); }
  if (bang.userData.g) bang.userData.g.quaternion.copy(camera.quaternion); bang.visible = false; bangLight.intensity = 0;
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); const upv = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion), rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw, !a.fx); c.mesh.visible = true; let px = a.x, py = a.y, pz = a.z;
    if (a.hud) { const d = a.hud.d || 1.2; const o = camera.position.clone().addScaledVector(fwd, d).addScaledVector(upv, a.hud.up || 0).addScaledVector(rgt, a.hud.right || 0); px = o.x; py = o.y; pz = o.z; }
    c.mesh.position.set(px, py, pz); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s * (a.scaleY || 1), s);
    if (a.hud || a.face) c.mesh.quaternion.copy(camera.quaternion); else c.mesh.rotation.set(0, a.yaw ?? Math.atan2(camera.position.x - px, camera.position.z - pz), 0);
    if (a.rot) c.mesh.rotateZ(a.rot);
    c.mat.color.set(a.tint || (a.fx ? '#ffffff' : L.cardTint)); c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2; c.mat.depthTest = !a.hud; c.mesh.castShadow = !a.fx;
    c.blob.visible = !a.fx && a.blob !== false; c.blob.position.set(px, (a.ground ?? py) + 0.015, pz); c.blob.scale.set(1.0 * s, 0.55 * s, 1); });
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.autoUpdate = false; swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false); scene.fog = fog; renderer.shadowMap.autoUpdate = true;
  renderer.setRenderTarget(rtB1); renderer.render(brightScene, fsCam);
  for (let k = 0; k < 3; k++) { const r = 1 + k * 1.2; blurU.src.value = rtB1.texture; blurU.dir.value.set(r / (W / 2), 0); renderer.setRenderTarget(rtB2); renderer.render(blurScene, fsCam); blurU.src.value = rtB2.texture; blurU.dir.value.set(0, r / (H / 2)); renderer.setRenderTarget(rtB1); renderer.render(blurScene, fsCam); }
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = 5; dofU.cinf.value = 0; dofU.haze.value = 0; dofU.time.value = t; dofU.mb.value.set(...(S.mb || [0, 0])); renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL; window.ready = true;
