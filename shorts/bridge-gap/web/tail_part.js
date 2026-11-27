import { stateAt, TOTAL } from './shots.js';
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const BUMP_W = 9; const bumpY = (x, b) => (Math.abs(x) < BUMP_W ? b * Math.pow(Math.cos(Math.PI * x / (2 * BUMP_W)), 2) : 0);
const bumpS = (x, b) => (Math.abs(x) < BUMP_W ? -b * Math.PI / BUMP_W * Math.sin(Math.PI * x / BUMP_W) / 2 : 0);
window.renderFrame = (f) => {
  const S = stateAt(f, {}), t = f / 30; const L = PRESET[S.preset || 'day'];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2]; moon.color.set(L.key[0]); moon.intensity = S.key ?? L.key[1];
  scene.fog.color.set(L.fog[0]); scene.fog.density = S.fog ?? L.fog[1]; scene.environment = L.env;
  inkU.expo.value = S.expo ?? L.expo; inkU.sat.value = L.sat; inkU.lift.value.setRGB(0, 0, 0); inkU.flash.value = S.flash || 0; inkU.vig.value = L.vig ?? 0.35; inkU.bloomK.value = S.bloomK ?? L.bloomK; brightU.thr.value = S.thr ?? L.thr; inkU.split.value = 0; inkU.greenK.value = 0; inkU.raysK.value = 0; inkU.worldInk.value = 0.6;
  SKY.material.map = SKYT[L.sky]; CLOUDS.forEach((c) => c.material.color.set(L.sky === 'hot' ? '#fff4e4' : '#ffffff'));
  // ---- kid's bridge: gap + combs ----
  const gap = S.gap ?? 0.34; HALF.forEach((G) => (G.position.x = G.userData.s * gap / 2));
  const ck = S.comb; COMB.forEach((G, i) => { const s = i ? 1 : -1; G.visible = ck !== undefined && ck > 0; G.position.set(s * gap / 2, (1 - (ck || 0)) * 2.5, 0); });
  // ---- rival bridge: bulge ----
  const B = (S.bulge || 0) * 1.7; RSL.forEach((G) => { const x = G.userData.x; G.position.y = bumpY(x, B); G.rotation.z = Math.atan(bumpS(x, B)); });
  RIV.forEach((m, i) => { const k = S.rivets; if (k === undefined || k < (i % 10) * 0.08) { m.position.set(0, -60, 0); return; } const tt = k - (i % 10) * 0.08, x = -8 + (i * 0.43 % 16), y0 = bumpY(x, B) - 0.4 - (i % 3) * 0.35;
    m.position.set(x + (rnd(i, 1) - 0.5) * tt * 3, y0 + tt * 3.5 - tt * tt * 6, ZR + DW / 2 + 0.3 + tt * (2 + rnd(i, 2) * 3)); });
  // ---- cars ----
  Object.values(CARS).forEach((c) => (c.visible = false));
  for (const cs of S.cars || []) { const C0 = CARS[cs.name]; if (!C0) continue; C0.visible = true; const onR = Math.abs(cs.z - ZR) < 5 && !cs.free; const y = (cs.y || 0) + (onR ? bumpY(cs.x, B) : 0);
    C0.position.set(cs.x, y, cs.z); C0.rotation.set(cs.roll || 0, cs.ry || 0, (cs.pitch || 0) + (onR && !cs.free ? Math.atan(bumpS(cs.x, B)) * Math.cos(cs.ry || 0) : 0)); C0.userData.W.forEach((w) => (w.rotation.z = -(cs.spin ?? cs.x) / 0.46)); C0.userData.B.position.y = cs.bounce || 0; C0.userData.B.rotation.z = cs.bodyPitch || 0; }
  QCAR.visible = QTOP.visible = !!S.queue; TAPE.visible = !!S.tape;
  RIBBON.visible = !!S.ribbon; if (S.ribbon) { RIBBON.position.set(S.ribbon.x, 0, S.ribbon.z); const k = S.ribbon.cut || 0; RIBBON.userData.h.forEach((h) => { const e = h.userData.e; h.position.set(0, 1.1 - k * 0.6, e * (1.3 + k * 0.2)); h.rotation.x = e * k * 1.1; h.scale.z = 1 - k * 0.3; }); RIBBON.userData.bow.visible = k < 0.1; }
  TUMBLE.visible = !!S.tumble; if (S.tumble) { TUMBLE.position.set(...S.tumble.slice(0, 3)); TUMBLE.rotation.set(0, 0, -S.tumble[3]); }
  THERMO.visible = !!S.thermo; if (S.thermo) { THERMO.position.set(S.thermo.x, 0, S.thermo.z); THERMO.rotation.y = S.thermo.ry || 0; const h = 0.15 + S.thermo.k * 2.2; THERMO.userData.col.scale.y = h; THERMO.userData.col.position.y = 0.95 + h / 2; }
  SPARKS.forEach((m, i) => { if (!S.sparks) { m.position.y = -60; return; } const k = (t * 2.2 + rnd(i, 1)) % 1, d = new THREE.Vector3(rnd(i, 2) - 0.5, rnd(i, 3) * 0.8 + 0.2, rnd(i, 4) - 0.5).normalize(); m.position.set(S.sparks[0] + d.x * k * 1.6, S.sparks[1] + d.y * k * 1.4 - k * k * 1.2, S.sparks[2] + d.z * k * 1.6); m.lookAt(m.position.clone().add(d)); m.visible = true; m.scale.setScalar(1 - k); });
  // ---- camera ----
  const sh = S.shake || 0, hh = S.handheld ?? 0.006; let look = new THREE.Vector3(...S.look), pos = new THREE.Vector3(...S.cam);
  pos.x += (Math.sin(f * 0.11) * 0.6 + Math.sin(f * 0.27) * 0.4) * hh + (rnd(f, 1) - 0.5) * sh; pos.y += (Math.sin(f * 0.13 + 1) * 0.6 + Math.sin(f * 0.31) * 0.4) * hh + (rnd(f, 2) - 0.5) * sh;
  camera.position.copy(pos); camera.up.set(0, 1, 0); if (S.topdown) camera.up.set(0, 0, -1); camera.lookAt(look.x, look.y, look.z); if (S.roll) camera.rotateZ(rx(S.roll));
  camera.fov = S.fov || 45; camera.near = S.near || 0.05; camera.far = 3000; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); SKY.position.copy(camera.position);
  const fc = S.shadowAt ? S.shadowAt : [look.x, Math.max(-DEPTH, look.y - 1), look.z], sd = new THREE.Vector3(...(S.sun || L.sun)).normalize(); moon.position.set(fc[0] + sd.x * 120, fc[1] + sd.y * 120, fc[2] + sd.z * 120); moon.target.position.set(...fc);
  { const sc = moon.shadow.camera, e = S.shadowExt || 18; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 300; sc.updateProjectionMatrix(); }
  DUST.forEach((m, i) => { m.visible = false; if (!S.dust) return; const [dx, dy, dz, k0] = S.dust; const k = (k0 + rnd(i, 1) * 0.3); if (k > 1.2) return; const a = rnd(i, 2) * 6.28; m.visible = true; m.position.set(dx + Math.cos(a) * k * 2.2, dy + 0.2 + k * 0.9 * rnd(i, 3), dz + Math.sin(a) * k * 2.2); m.scale.setScalar(0.6 + k * 1.6); m.quaternion.copy(camera.quaternion); m.material.opacity = Math.max(0, 1 - k) * 0.7; });
  for (const g of glows) { g.quaternion.copy(camera.quaternion); g.material.opacity = g.userData.k0 * Math.exp(-g.position.distanceTo(camera.position) * 0.012); }
  if (bang.userData.g) bang.userData.g.quaternion.copy(camera.quaternion); bang.visible = false; bangLight.intensity = 0;
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); const upv = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  (S.actors || []).forEach((a, i) => { const c = getCard(i); c.draw(a.draw, !a.fx); c.mesh.visible = true; let px = a.x, py = a.y, pz = a.z;
    if (a.hud) { const d = a.hud.d || 1.2; const o = camera.position.clone().addScaledVector(fwd, d).addScaledVector(upv, a.hud.up || 0); if (a.hud.right) o.addScaledVector(new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), a.hud.right); px = o.x; py = o.y; pz = o.z; }
    c.mesh.position.set(px, py, pz); const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s * (a.scaleY || 1), s);
    if (a.hud || a.face || S.topdown) c.mesh.quaternion.copy(camera.quaternion); else c.mesh.rotation.set(0, a.yaw ?? Math.atan2(camera.position.x - px, camera.position.z - pz), a.roll || 0);
    if (a.rot) c.mesh.rotateZ(a.rot);
    c.mat.color.set(a.tint || (a.fx ? '#ffffff' : L.cardTint) || '#ffffff'); c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2; c.mat.depthTest = !a.hud && !a.over; c.mesh.castShadow = !a.fx;
    c.blob.visible = !a.fx && a.blob !== false && !S.topdown; c.blob.position.set(px, (a.ground ?? py) + 0.015, pz); c.blob.scale.set(1.0 * s, 0.55 * s, 1); });
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.autoUpdate = false; swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false); scene.fog = fog; renderer.shadowMap.autoUpdate = true;
  renderer.setRenderTarget(rtB1); renderer.render(brightScene, fsCam);
  for (let k = 0; k < 3; k++) { const r = 1 + k * 1.2; blurU.src.value = rtB1.texture; blurU.dir.value.set(r / (W / 2), 0); renderer.setRenderTarget(rtB2); renderer.render(blurScene, fsCam); blurU.src.value = rtB2.texture; blurU.dir.value.set(0, r / (H / 2)); renderer.setRenderTarget(rtB1); renderer.render(blurScene, fsCam); }
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = 5; dofU.cinf.value = 0; dofU.haze.value = S.haze ?? (L.haze ? 0.5 : 0); dofU.time.value = t; renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL; window.ready = true;
