# The Emu War (1932) — engine v4 (outback, reference-matched look)
- Real PBR textures from Poly Haven (`web/tex/`, not committed: red_laterite_soil_stones, eucalyptus_bark, farm_soil, red_sand, rock_boulder_dry, corrugated_iron, weathered_planks, dry_ground_01; 1k diff/nor/rough jpg).
- glTF props from Poly Haven (`web/models/`, not committed; names in main.js NAMES). Avoid heavy ones (didelta_spinosa 417k, searsia_lucida 377k, quiver_tree_01 150k tris).
- Instanced wheat / grass (cheap), procedural gum trees, windmill, farmhouse, dam, camp, 1930s truck, Lewis guns (truck + tripod), tracers, brass shells, dust, motes, feathers.
- Emu flock = shared pre-drawn frames (run cycle, idle, peck, moods) on billboards; hero emu = full card (`T.fxEmu`, with slouch-hat option).
- Characters: free arm angles `{a, e}` keyframed (AK), talking mouth (`T.withMouth`), boots, pockets, Sam Browne belt, slouch hats, head shine.
- Grade: saturated, not hazy (sun behind camera), small DOF (user: "blur ziada"), cuts every 1–2 s, camera always moving.
