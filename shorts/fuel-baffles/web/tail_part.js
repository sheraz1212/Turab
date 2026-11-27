import { stateAt, TOTAL } from './shots.js';
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const surfAt = (x, S) => { const w = S.wave || {}; const h = w.h ?? 0.35, tilt = w.tilt || 0; let y = h + tilt * x; if (w.amp) y += w.amp * Math.exp(-Math.pow((x - (w.pos || 0)) / (w.width || 1.2), 2)); if (w.chop) y += w.chop * Math.sin(x * 6 + (w.t || 0) * 9) * 0.5; return y; };
window.renderFrame = (f) => {
  const S = stateAt(f, {}), t = f / 30; const L = PRESET[S.preset || 'snow'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2]; moon.color.set(L.key[0]); moon.intensity = S.key ?? L.key[1];
  scene.fog.color.set(L.fog[0]); scene.fog.density = L.fog[1]; scene.environment = L.env; SKY.visible = L.sky; CLOUDS.forEach((c) => (c.visible = L.sky));
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(0, 0, 0); inkU.flash.value = S.flash || 0; inkU.vig.value = L.vig; inkU.bloomK.value = L.bloomK; brightU.thr.value = L.thr; inkU.split.value = 0; inkU.greenK.value = 0; inkU.raysK.value = 0; inkU.worldInk.value = 0.95; inkU.px.value = 2.0;
  for (const l of pLights) { l.visible = L.zones.includes(l.userData.zone); l.intensity = l.userData.I0; }
  for (const g of glows) g.visible = g.userData.zone === 'fx' || L.zones.includes(g.userData.zone);
  // trucks
  Object.values(TRUCKS).forEach((T) => (T.visible = false));
  for (const ts of S.trucks || []) { const T = TRUCKS[ts.name]; T.visible = true; T.position.set(ts.x, ts.y || 0, ts.z || 0); T.rotation.set(ts.roll || 0, ts.ry || 0, ts.pitch || 0); T.userData.W.forEach((w) => (w.rotation.z = -(ts.spin ?? ts.x) / 0.62)); T.userData.C.rotation.z = ts.cabTilt || 0;
    const xr = !!ts.xray; T.userData.tankMats.forEach((m) => { if (!m.userData.mat0) m.userData.mat0 = m.material; m.material = xr ? GLASS : m.userData.mat0; m.castShadow = !xr; });
    const F = T.userData.F; F.visible = xr && ts.fuel !== false; if (F.visible) { const p = F.geometry.attributes.position, b = F.geometry.userData.base; const SS = { wave: ts.wave }; for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1]; const s = surfAt(x, SS); p.setY(i, Math.min(y, s)); p.setX(i, x); p.setZ(i, b[i * 3 + 2]); } p.needsUpdate = true; F.geometry.computeVertexNormals(); }
    T.userData.B.forEach((b, i) => (b.visible = xr && !!ts.baffles && i < (ts.nb ?? 5))); }
  // big tank interior
  BAF.forEach((b, i) => { const on = S.baf === undefined ? false : i < S.baf; b.visible = on; b.userData.lip.visible = on; });
  TFUEL.visible = !!S.tfuel; if (S.tfuel) { const p = TFUEL.geometry.attributes.position, b = TFUEL.userData.base, w = S.tfuel; for (let i = 0; i < p.count; i++) { const x = b[i * 3], z = b[i * 3 + 2]; let y = 0; if (w.amp) y += w.amp * Math.exp(-Math.pow((x - w.pos) / (w.width || 2.5), 2)); if (w.chop) for (let k = 0; k < 5; k++) { const bx = -10 + k * 5 - TL / 2 * 0 + 0; y += w.chop * Math.exp(-Math.pow((x - (bx + 1.8)) / 0.9, 2)) * (0.6 + 0.4 * Math.sin(t * 8 + k)); } y += Math.sin(x * 2 + t * 4) * 0.04 + Math.sin(z * 3 + t * 3) * 0.03; p.setY(i, y); const half = Math.sqrt(Math.max(0, TR * TR - Math.pow(1.6 + y - TR, 2))) - 0.05; p.setZ(i, Math.sign(z) * Math.min(Math.abs(b[i * 3 + 2]), half)); } p.needsUpdate = true; TFUEL.geometry.computeVertexNormals(); TFUEL.position.y = w.h ?? 1.6; }
  // sparks
  SPARK.forEach((m, i) => { if (!S.spark) { m.position.y = -90; return; } const k = (t * 2.4 + rnd(i, 1)) % 1, d = new THREE.Vector3(rnd(i, 2) - 0.5, rnd(i, 3) * 0.9 - 0.1, rnd(i, 4) - 0.5).normalize(); m.position.set(S.spark[0] + d.x * k * 1.8, S.spark[1] + d.y * k * 1.6 - k * k * 1.4, S.spark[2] + d.z * k * 1.8); m.lookAt(m.position.clone().add(d)); m.scale.setScalar(1 - k); });
  WELDGLOW.visible = !!S.spark; if (S.spark) { WELDGLOW.position.set(...S.spark); WELDGLOW.material.opacity = 0.7 + 0.3 * Math.sin(t * 40); }
  BOULDER.position.set(...(S.boulder || [0, -50, 0])); BOULDER.rotation.x = t * 2;
  FOOD.forEach((g, i) => { const fp = S.food && S.food[i]; g.visible = !!fp; if (fp) g.position.set(...fp); }); CUP.visible = !!S.cup; if (S.cup) CUP.position.set(...S.cup);
  // ---- camera ----
  const sh = S.shake || 0, hh = S.handheld ?? 0.012; let look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look.x, look.y, look.z); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.far = 3000; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); SKY.position.copy(camera.position);
  const fc = S.shadowAt ? S.shadowAt : [look.x, Math.max(0, look.y - 1), look.z], sd = new THREE.Vector3(...L.sun).normalize(); moon.position.set(fc[0] + sd.x * 80, fc[1] + sd.y * 80, fc[2] + sd.z * 80); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 16; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix(); }
  for (const g of glows) { g.quaternion.copy(camera.quaternion); }
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
