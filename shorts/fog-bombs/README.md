# Fog signals ("Every foggy night...") — engine v3 (reference-style look)

What changed vs. earlier shorts (after the user's feedback, 2026-11-22):
- Night palette like the reference: deep navy sky, dark fog, warm lamp/fire pools; avoid washed-out pale frames.
- Real 3D props from Poly Haven (CC0) loaded as glTF: `python3 get_models.py <names...>` (list in web/main.js `NAMES`), into `web/models/` (not committed, ~70 MB).
- `web/lib/` needs three r160 `three.module.js`, `GLTFLoader.js`, `BufferGeometryUtils.js` (npm pack three@0.160.0; imports patched to `./three.module.js`).
- Characters: bigger in frame, close camera, patterned clothes (stripe/pin/check/tartan, waistcoats, coats with brass buttons, overalls, hi-vis), sweat/blush, hand props (lantern, detonator).
- Every line of narration = a visible action (shot plan in `web/shots.js`, 35 shots, cut every 1–3 s).
- Render: 720x1280 in headless Chromium (~5 s/frame), captions.py upscales to 1080x1920 and draws one-word captions + yellow tags.
