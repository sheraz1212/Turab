# Remotion soil test

- 720x1280, 24 fps, 120 frames (5 s), H.264 (`out/soil_test.mp4`)
- Renderer: Remotion 4 + React Three Fiber, software WebGL (`--gl=swangle`), cloud container with 4 CPU cores, no GPU
- Wall-clock render time: 172.2 s total = 1.43 s per frame
- Stills: `out/frame_0.png`, `out/frame_60.png`, `out/frame_119.png`

Re-render: `npm i` then `npx remotion render SoilTest out/soil_test.mp4 --gl=swangle`
