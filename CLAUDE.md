# PROJECT BRIEF: Faceless History YouTube Channel

> **Read this file first.** (Claude Code loads it automatically. For any other AI tool or new chat, paste its whole text.) It holds everything an AI tool or a new chat needs to know about this project: who the user is, what we make, how we make it, and the rules.
> **Keep it up to date:** whenever a new decision, rule, script, tool or result is added, update this file in the same change. Add a dated line to the Changelog at the bottom.

Last updated: 2026-11-19

---

## 1. The user
- Runs a **faceless English YouTube channel** for a **US audience**.
- Writes in **Roman Urdu**. Reply in simple Roman Urdu, short and direct. Don't spend effort (or usage limits) on extras; give the result.
- Laptop: Intel UHD 620, **no GPU**, so heavy renders are slow on the PC. Prefers rendering in the **cloud**.

## 2. Hard rules (always follow)
1. **Never save anything on the user's PC** (no files in Downloads, etc.). Work in temp/scratch folders, deliver finished videos **in the chat**, and the user downloads them. Clean up temp renders afterwards.
2. **Videos are NOT pushed to the repo.** The repo keeps only **references**: scripts, templates, plans, code, notes, small preview stills.
3. In this repo: **never modify, move or delete existing files** unless asked. Put new work in new folders. Work on a feature branch; never push or merge into the default branch without permission.
4. **Never commit secrets**: keys, tokens, `.claude.json`, session keys, chat transcripts.
5. Before deleting anything on the user's PC, get explicit confirmation **and** verify that a copy exists on GitHub.
6. When the user pastes context, don't assume it's a task. Acknowledge or ask.

## 3. Channel
- Niche: **WW1 / WW2, focused on Germany and Japan**, plus "how a hole becomes a famous tunnel/hideout" 3D shorts.
- Angle: true soldier stories, plus "why Germany/Japan failed" strategy videos.
- Competitors: Mark Felton, Simple History, Yarnhub, The History Guy, Kings and Generals.
- Output: long videos 12–20 min plus 3–4 Shorts each. Schedule: 1 long + 3 Shorts per week, upload 5–8 PM US Eastern.
- Channel name ideas: Iron & Ash, The War Files, Frontline Archives, Last Stand History, Theater of War.
- Long-video ideas: Onoda (29 years), Barbarossa doomed, Midway's 6 minutes, Japan's balloon bombs, What if no Pearl Harbor, Hitler's bunker last days, Why Germany couldn't stop D-Day, Kamikaze motives, Stalingrad, Operation Downfall.

### Monetization / safety rules
- No swastika or Nazi symbols in thumbnails. No big glorifying flags.
- Educational framing only, never glorifying. No blood or corpses (fire and explosions are OK).
- **Original scripts only**: no re-uploads, no copying a reference's words.
- Check facts and numbers (e.g. on Wikipedia) before upload.

## 4. Main format: "How a ___ Hole Becomes the ___" 3D shorts
Reference short: **"How a Jungle Hole Becomes the Cu Chi Tunnels"** (70 s, vertical, 3D, red soil cross-section). Every new short **clones its structure, camera, caption style and rhythm**; only the topic changes.
Full second-by-second breakdown: `channel-notes/scripts-docs/Clone-Template_Cu-Chi-Breakdown.md`.

### Beat template (14 beats, ~70 s)
| # | Time | Beat | Camera |
|---|---|---|---|
| 1 | 0–3 | Danger (bomb/attack) → "You dig a hole to hide" | Side view, static, cross-section from frame 1 |
| 2 | 3–6 | Enemy passes right by | Side |
| 3 | 6–10 | Hide it (lid, camouflage) + orange outline | High angle → side |
| 4 | 10–15 | Wall/soil problem → material fix | Push-in |
| 5 | 16–17 | Dig sideways | Pan down + track |
| 6 | 18–22 | Hide the evidence (spoil pile, tracks) | 3/4 low angle, night |
| 7 | 23–26 | Deeper → air runs out | Inside close-up → pull-out |
| 8 | 27–30 | Hidden air holes + white arrows | Side wide |
| 9 | 31–40 | Smoke/heat problem → send it far away | 3/4 → FPV inside → ground level |
| 10 | 41–51 | Enemy attacks inside (gas/fire/water) → trap/fix + outline | Side → push-in |
| 11 | 52–55 | Levels: kitchen, hospital… pop in | Crane up / pull-out |
| 12 | 56–58 | BIG NUMBER reveal (e.g. "100+ KM") | Extreme wide |
| 13 | 59–65 | Enemy enters → gets stuck/trapped | Close-up, low angle |
| 14 | 66–70 | "Congratulations, you have built the ___." | Final wide, static |

### Fixed style
- Frame: top 35–40% surface, bottom 60% soil cross-section. One soil colour for the whole video (red laterite for jungle).
- **One-word captions**: white, bold rounded font, black shadow, near the centre/surface line.
- Highlight = **orange/peach outline**. Air/gas path = **white arrows**. Big number = **yellow text at the top**.
- A camera move or new element every 3–4 s.
- Voice in second person: starts with "You…", ends with "Congratulations, you have built the ___."
- Vertical 1080x1920 (tests at 720x1280), 24–30 fps.

### Audio style (from the reference analysis)
- Voice at about **−16 LUFS**, heavily compressed, mono. Voice made with **ElevenLabs** (calm documentary voice).
- A quiet music bed ~30 dB under the voice. Sparse SFX: pop/chime on reveals, rumble and explosions in battle scenes.

### Scripts written
| Short | File | Status |
|---|---|---|
| Iwo Jima tunnels (beach hole) | `channel-notes/scripts-docs/Short-01_Iwo-Jima-Tunnels.md` | Script + shot list done; hook (first ~20 s) test-rendered in Blender |
| Great Escape tunnel (Stalag Luft III) | `channel-notes/scripts-docs/Short-02_Great-Escape-Tunnel.md`, scene `channel-notes/blender/great-escape/` | **Done 2026-11-20**: 70 s rendered in the cloud (~13 s/frame, ~6 h), sent to the user via chat. No voice yet. Known flaws: FPV shot shows the rider's head; dark shadow blob in the escape scene |
| Wellington Quarry / tunnels under Arras (WW1) | `channel-notes/scripts-docs/Short-03_Wellington-Quarry-Arras.md`, scene `channel-notes/blender/wellington-quarry/` | **Done 2026-11-20**: 66 s rendered in the cloud (~2 h 50 min, ~6.5 s/frame), sent to the user via chat. No voice yet |
| Desert underground home | `channel-notes/scripts-docs/Short-01_Desert-Hole-Script.md` | Script + shot list done |
| Cu Chi jungle hideout (clone) | `channel-notes/blender/cu-chi-jungle/` | Full ~63 s made in Blender; looked too cartoonish |

Story ideas pitched 2026-11-19 (hook → twist ending; verify facts before scripting):
1. Great Escape tunnel "Harry" (Stalag Luft III, 1944). Hook: "You're a prisoner, and the guards buried microphones in the ground." Twist: the tunnel comes up short of the trees.
2. Wellington Quarry, Arras (WW1, 1917). Hook: "24,000 soldiers vanish underground overnight." Twist: they burst out right under the German lines.
3. Messines Ridge mines (WW1, 1917). Hook: "You dig toward the enemy while the enemy digs toward you." Twist: the blast is heard in London.
4. Onoda's jungle hideout (Lubang, 1945–74). Hook: "The war ended. Nobody told you." Twist: only his old commander can order him out, 29 years later.
5. Warsaw Uprising sewers (1944). Hook: "The only way out of the city is under it." Twist: the Germans throw gas and grenades into the manholes.
6. Derinkuyu underground city. Hook: "A man knocks down a wall in his basement and finds a city." Twist: 18 floors and rolling stone doors.
7. Tunnel 57 (Berlin, 1964). Hook: "You dig back into the country you escaped from." Twist: 57 people crawl out under the Wall.
8. Fort Eben-Emael (1940). Reverse format: the "unbreakable" fort is beaten from the roof by glider troops.
Next topic ideas: Great Escape tunnel "Harry", Messines Ridge WW1 tunnel, Tunnel 57 (Berlin Wall), Derinkuyu, Maginot Line fort, Führerbunker (no symbols), WW1 trench network, Atlantic Wall bunker.

### Long-video style reference
"Entire History of Russia in 45 minutes": stick-figure narrator mascot at the screen edge; plain grey scenes; satellite maps with coloured overlays, arrows and pins; flat 2D cartoon scenes; framed public-domain paintings/photos; handwritten-style font; year tag top-left; ~6 s per shot with constant pop-in animation.
Footage sources: US National Archives, Wikimedia (public domain).

## 5. Production pipelines
### A. Blender (PC, older pipeline)
- Portable Blender 4.2 LTS at `%LOCALAPPDATA%\BlenderPortable\`. FFmpeg installed via winget (`Gyan.FFmpeg`, not on PATH).
- Python build scripts generate the whole scene; PowerShell scripts render the frames, then `finish.ps1` adds the voice, one-word captions (ffmpeg drawtext) and synthesised SFX.
- Code: `channel-notes/blender/`.
- Run Blender through the user's real terminal (`powershell -ExecutionPolicy Bypass -File …`). Claude's own PowerShell is sandboxed.
- Problem: on the laptop a 63 s video took **~2.5 hours** to render. Flat colours and the Standard view transform looked cartoonish.

### A2. Blender in the cloud (works, 2026-11-19), so the PC can stay off
- Install: `python3 -m venv bvenv && bvenv/bin/pip install bpy` (Blender 5.3 as a Python module; download.blender.org is blocked but PyPI works). EEVEE also needs `apt-get install libegl1 libegl-mesa0 libgl1-mesa-dri`, but it is slow on CPU, so use **Cycles CPU**.
- Speed on 4 cloud CPUs, 720x1280: Cycles 10 samples + denoise ≈ **12 s/frame**, so a 70 s video ≈ 5.5 h. EEVEE (software GL) ≈ 30 s/frame.
- Run: `GE_OUT=<dir> bvenv/bin/python channel-notes/blender/great-escape/render_cloud.py` (resumable). Then finish with `python3 channel-notes/blender/cloud_finish.py <finish_config.py> <frames_dir> <out.mp4> <ffmpeg>`. That draws one-word captions + big yellow numbers with PIL, synthesises SFX with numpy/scipy, and encodes with ffmpeg; the Remotion ffmpeg binary works.
- Look: AgX view transform (not Standard), stronger soil noise/strata/pebbles.
- **Gotcha:** the cloud container is shut down when the session goes idle, which kills detached renders. Keep the session busy (blocking ~9-min wait calls) while rendering. Renders are resumable (`use_overwrite=False`): delete 0-byte placeholder frames, then restart.
- To add a voiceover later: set `VOICE` in the short's `finish_config.py` and re-run `cloud_finish.py` on the existing frames (no re-render needed).

### B. Remotion + three.js (cloud, tested 2026-11-19)
- Code: `remotion-test/` (React Three Fiber via `@remotion/three`, procedural canvas soil textures, bump/roughness maps, ACES tone mapping, soft shadows, fog).
- Speed: 5 s at 720x1280, 24 fps, software WebGL (`--gl=swangle`), 4 CPU cores: **172 s total = 1.43 s/frame**, roughly 36 min for a 63 s video.
- Look: the soil cross-section looks good and not cartoon-like. Bushes and trees still look game-like, and the figure is low-poly. There is no ray-traced light, so it is less realistic than Blender Cycles.
- Render: `cd remotion-test && npm i && npx remotion render SoilTest out/soil_test.mp4 --gl=swangle`
- **Full Cu Chi short remade in Remotion (2026-11-19):** composition `CuChi` in `remotion-test/src/cuchi/`. It is a 1:1 port of the Blender scene: the same 15 voiceover lines, camera keys, beats, lid/outline/arrows, explosions, night, gas U-bend, levels, "100+ KM" and stuck soldier.
  - Render time: 1524 frames (63.5 s, 720x1280) in **32.2 min = 1.27 s/frame** on 4 cloud CPUs. On the laptop the same video took ~2.5 h in Blender.
  - Audio: synthesised SFX only (`scripts/make_sfx.py` → `public/cuchi_sfx.wav`, not committed). **No voiceover yet**; ElevenLabs voice files still need to be added.
  - Captions: one word at a time, timed by estimate because there is no voice track.
  - Render it: `python3 scripts/make_sfx.py public/cuchi_sfx.wav && npx remotion render CuChi out.mp4 --gl=swangle`

## 6. Repo map
- `CLAUDE.md`: this file, the single source of truth. Claude Code reads it automatically; for other tools, paste its text.
- `channel-notes/memory/`: original memory notes from the PC sessions.
- `channel-notes/scripts-docs/`: templates and scripts.
- `channel-notes/blender/`: Blender scene and render scripts.
- `remotion-test/`: Remotion code-rendered 3D test.
- Working branch: `claude/peaceful-brahmagupta-3lxb4a`.

## 7. Open decisions / next steps
- **2026-11-21: NEW PIPELINE = skill `cartoon-audio-short`** (`.claude/skills/cartoon-audio-short/SKILL.md`, follow it exactly; kit in its `kit/` folder; the user's kit): audio in, finished vertical cartoon Short out. 2D bean-head cards in an inked, painted three.js world, rendered in headless Chromium (no GPU), with a synthesized music bed + SFX. Kit README: `.claude/skills/cartoon-audio-short/kit/README.md`. `kit/tools/mix.py` was written by Claude per the skill rules (tested: music exactly -6.0 dB vs voice, SFX <= -6 dB, peaks capped). The vendored three.js/toon.ts are not in the upload; setup.sh fetches them via npm/git. Worked example: `example/soldier/` (story.js shot plan + audio.py cues). Tools: setup.sh, timing.py (word timings from voice.mp3 + script.txt), render.mjs, sheet.py, finish.sh. Old approaches below are history only.
- **2026-11-20: User wants to CHANGE NICHE** (not enjoying WW tunnels). New target: curiosity-explainer Shorts in the style of the reference channel **Ricks Clips** (@ricksclips3000). Analysis: `channel-notes/research/ricks-clips-analysis.md` (2D round-head cartoon characters in detailed 3D sets, one-word captions, "Why/How" fact topics, 5–35M views). Original characters and topics only. **Script formula** (from 3 uploaded videos): strange-action hook → "You see," setup → everyone mocks → the wrong side wins first → nature/time turns it → big payoff → the mechanism explained in the last 10–15 s; third person, ~170 words, ~60–65 s, captions at ~70% height. Details in the analysis file.
- **Decision (2026-11-19): Blender is the final pipeline.** The user did not like the Remotion version. Remotion code is kept only as reference.
- Add the voiceover (ElevenLabs) to the Remotion version.
- The test mp4 at `remotion-test/out/soil_test.mp4` was pushed before the "no videos in repo" rule; ask before removing it.
- Channel name: **Victor Tales** (final, 2026-11-23).

## Changelog
- 2026-11-26: **Honey Knight** rendered and sent (71 s, 42 shots, 1080x1920, ~2.7 h render with 2 parallel jobs, -15.7 LUFS, 117 MB). Code in `shorts/honey-knight/`. New look rules from the user (copy the reference): peach skin with freckles and blush (not white), close-up framing, guards visible right behind the bars, toon textures with black ink lines on every brick/tile (worldInk 0.95), no haze/fog, thin skylight rays + golden specks, gold 3D pop-text, fat short warden, soft messy hair. Gotcha: a `str.replace` whose target is missing fails silently; assert that the target exists.
- 2026-11-25: Next story **Honey Knight** (reference 'Honey on His Shoulders Every Morning'): analysis + original script in `shorts/honey-knight/`. New sets needed: green-stone dungeon cell with bars + skylight grate, throne-room feast, stairs/corridor; fly swarms; king/queen/captain/guard cast; pop-text boxes (NO MORE HONEY!, KNIGHTED!). Clean 3D-text Tiger thumbnail sent.
- 2026-11-23: **Channel name final: VICTOR TALES** (user's choice). Branding in `channel-notes/branding/`: profile_victor_tales.png (800x800, big 3D comic 'V', white face, gold extrusion, black outline, royal purple sunburst + gold sparkles; Ricks Clips layout, our colours) and banner_victor_tales.jpg (2560x1440; title + 8 of our characters in different roles inside the central 423 px band so it shows on desktop). Font: Luckiest Guy (Google Fonts, Apache licence, downloaded from the google/fonts GitHub repo). User said no red; wants attractive, luxury colours.
- 2026-11-23: User changed the channel name to **Rory's Stories** (Ricks Clips style, rhyme). Profile picture ('RS', builder character, red/gold sunburst) and banner in `channel-notes/branding/` (the Victor K. Films files there are now unused).
- 2026-11-23: **Channel name decided: Victor K. Films** (user had no preference between the Victor options; Claude picked it). First profile picture (builder character head on a blue/gold sunburst, 'VK') and banner (2560x1440, four scenes from our shorts + name + tagline 'Weird true stories, animated. New Shorts every week') in `channel-notes/branding/`.
- 2026-11-23: **The Loop** (clothoid coaster loop) in `shorts/coaster-loop/`: luxury amusement park (coaster built from a CatmullRom path with tube rails, spine, instanced ties and supports; loop shape morphs circle -> lazy bottom (k1) -> tall skinny teardrop (k2); carts ride the track via frames; ferris wheel, carousel, swing ride, drop tower, fountain, domed entrance pavilion with gold trim, striped tents, food stalls, flowers, picket fences, string lights, GRAND OPENING arch with live text), hairpin road + car flip, rival park with a crash. **New engine rule: characters get a white sticker outline** (Card.draw(fn, ol) dilates the card in white) so they look solid. Day grade: low fog, bloom 0.6, thr 1.12 for clarity; finish contrast 1.18. 36 shots, 67 s, -16.1 LUFS, sent. Channel name chosen direction: Zack D. Films style; user liked 'Victor' (suggested Victor K. Films).
- 2026-11-23: **Mine Salting** in `shorts/mine-salting/`: lantern-lit gold mine tunnel (noise-displaced rock tube, timber sets, rails, cart, glittering salted specks), back-wall gold vein + rubble after the dynamite, red-rock canyon with mine portal 'LUCKY JAKE MINE', shack, FOR SALE sign, white touring car, gold-pan macro, cash stacks. New outfits: cowboy hat (+ star), bowler, white top hat (hatCol). 35 shots, 59 s, -15.7 LUFS, sent. Gotcha: P.rng with nearby seeds gives correlated first values, so use golden-angle spreads for scattered items.
- 2026-11-23: **Tiger vs Tractor** (Tiger I vs T-34) in `shorts/tiger-tractor/`: German works yard (white hall, brick annexes), Soviet TRACTOR FACTORY behind a fence, countryside road with seasons (summer grass/wheat, autumn mud+rain, winter snow), detailed procedural Tiger (painted camo texture with panel lines/rivets/welds, interleaved wheels, instanced track links, engine grilles, air filters, tools, cupola, smoke dischargers, double muzzle brake, kill rings) and T-34 (sloped extruded hull, olive weathered texture, hatches, handrails, fuel drums, spoked wheels), tractors, pocket-watch gear macro. New outfits: peaked cap, side cap, monocle, padded Soviet tank helmet, goggles. 40 shots, 73 s, ~3.5 s/frame at 1080p, -16.3 LUFS, sent. User asked for more contrast: finish now uses `eq=saturation=1.15:contrast=1.12`. User rejected the first boxy tanks/uniforms as too plain: always add surface detail (painted textures + small parts). Next: **Mine Salting** (`shorts/mine-salting/`), voice received, rendering.
- 2026-11-23: Storm Oil v2 sent. User feedback: the oil fell onto the hull, not the water; the chase was unclear; the pirate uniforms didn't match. Fixed by re-rendering only the affected frame ranges (delete those frames, then `RESUME=1 node render.mjs frames a-b,c-d`), not the whole video. Final encode now adds `eq=saturation=1.18:contrast=1.04,unsharp=5:5:0.45` (finish_cap.sh). **Lesson: show the user a stills contact sheet BEFORE the full render** and check props/actions match the narration (pour into water, not on deck). Next: `shorts/tiger-tractor/script.txt` (reference 'Why Did the Nazi Tiger Lose to a Tractor', our own words; say 'German Tiger', no Nazi symbols).
- 2026-11-23: **Storm Oil** (why sailors carried oil; reference 'Why Sailors Carried Storm Oil', own words) in `shorts/storm-oil/`: CPU-displaced ocean that follows the camera (peaked waves, foam, oil patch damps waves), procedural galleons (lofted hull, striped sails that billow, flags, rigging, portholes/cannons), ship-relative actors and cameras (`ship: 'H'|'P'`, `camShip`), giant curling wave sheet, galley set, soup-bowl macro with flat oily spots. New outfits: chef hat, navy bicorne, pirate tricorn + feather + skull, bandana, eyepatch. 39 shots, 69 s, native 1080x1920 (~85 min, 2 parallel), -15.8 LUFS, sent. **Engine fixes for all future videos:** the old bloom was built at 1/4 res, which caused blocky 'pixel boxes' around lights in every previous video; it is now built at 1/2 res with a soft 5x5 downsample, 3 blur passes and a tent upsample. Render at native 1080x1920 (no 720p upscale) for a clear, smooth picture. Gotchas: card hand props near the card edge get clipped (draw big props at the body centre); never put Poly Haven `Barrel_01` (modern red oil drum) in historic scenes.
- 2026-11-22: **The Grave Bell** (safety coffin, 1890s) in `shorts/grave-bell/`: big snowy Victorian street, cemetery with bell posts, coffin cutaway, bedroom, parlour; 39 shots, 1–2-word speech bubbles (fxBubble, `bubble()` y = bubble centre), dark-porch toggle, lathe bell, per-shot expo/bloomK/thr overrides. 62 s, ~35 min render (2 parallel), -15.6 LUFS, sent. User said the first grade was too purple: reduced violet lights/sky/env, sat 1.5 → 1.22, split 0.55 (measured sat 0.49 vs ref 0.52). Rule: match the reference stats, but don't let the whole world turn lavender; snow should be blue-white.
- 2026-11-22: User: Oakvale saturation was not good enough. For grave-bell copy the reference GRADING exactly: split-tone (shadows purple ~rgb(31,19,45), mids mauve ~(113,89,103), highlights warm pink-cream ~(232,201,204)), saturation ~0.52 (56% of pixels > 0.5), hues mostly blue-violet + red-orange, almost no green/yellow. Plus more shine, HD 3D, more attractive; big luxurious detailed houses and an upgraded rich background (modern-quality, not simple).
- 2026-11-22: Next: original script `shorts/grave-bell/script.txt` (safety coffins, 1890s; reference 'What the Grave Bell Really Meant' used for style only). Style asks from the user: characters may 'talk' with 1–2-word speech bubbles on screen (not voiced); match the reference saturation (deep purple-blue snowy night + warm porch/interior light), shine and speed; colourful Victorian houses with porches CLOSE behind characters; same close focus/angles; underground cross-section shots of the coffin; bright and shiny.
- 2026-11-22: User feedback on Oakvale: houses were too small and simple. **Rule for next videos: buildings/houses must be bigger, richer and more luxurious** (multi-storey, porches/balconies, trim, chimneys, fences, gardens, lamps, varied shapes), like the reference sets. Don't change Oakvale.
- 2026-11-22: **The Lever of Oakvale** (original story, inspired by the 'Town Built Around a Button' style) in `shorts/spiral-town/`: spiral-street town (ribbon geometry streets/curbs/water), lever + moss-covered sign revealing '...UNTIL YOU NEED IT', attic, mayor office, storm (rain instancing, lightning), flood wave, street water, whirlpool, cavern gates + hidden lake, rainbow. 69 s, 41 shots (~1.5 s cuts), -15.3 LUFS, sent. User rules now: **no blur** (DOF off), keep clear + shiny (tight bloom, unsharp mask 0.8), deeper sky, more saturation, every character clearly visible.
- 2026-11-22: **Why Rails Have Gaps** (thermal expansion / sun kink) in `shorts/rail-gaps/`: red-sandstone canyon desert, gapped 39-ft track vs deformable 'perfect' track (vertex-displaced rails + instanced sleepers for the S-bend kink), rail heat glow + heat-haze post, station, luxury coaches + interior set, modern train + tensioner. User asked mid-render for deeper sky, more saturation, clearer image (added unsharp mask) and more shine (stronger bloom, glossier metal/paint). 65 s, 36 shots, ~45 min render, -15.6 LUFS, sent. Next: user's reference 'The Town Built Around a Button' — wrote an ORIGINAL story in that style (`shorts/spiral-town/script.txt`, lever + spiral flood-drain town), not a copy of its plot. User wants every character clearly visible and in focus.
- 2026-11-22: **The Fire Cart** (hwacha, Haengju 1593) in `shorts/fire-cart/`: Korean hilltop fort (stone wall with crenels + gaps for carts, tiled hip roofs with upturned eaves and dancheong beams, waving banners), night workshop, hwacha carts (100-hole launcher, instanced arrows with powder tubes, fuse cords), pooled rocket flight + smoke trails + flame glows, rocket-tracking camera, enemy army billboards (march/run frames), brighter day grade. 64 s, 36 shots, ~75 min render, -15.6 LUFS, sent. Lesson: always check every contact-sheet frame for characters hidden behind props or outside the narrow vertical frame (9:16 view is only ~1.1 m wide at 2 m).
- 2026-11-22: **The Emu War** (1932) made with engine v4 in `shorts/emu-war/`: outback world with real Poly Haven PBR textures, instanced wheat/grass, emu flock billboards + hero emu cards, 1930s truck, Lewis guns, tracers/shells/dust; keyframed arms, talking mouths, camera always moving, cuts every 1–2 s, low DOF (user said too much blur), sun behind camera so nothing looks hazy. 66 s, 38 shots, ~65 min render (2 parallel), -16.1 LUFS, sent. User's second reference: 'How Mine Salting Worked' (warm gold palette, glossy gold macros, rich rock/wood textures, characters big and close).
- 2026-11-22: User rejected Sky Thunder ("fzool") and re-sent the reference ("Why Samurai Feared The Flying Thunder"). Frame analysis: the reference characters are ALSO stick-limb bean heads; the real gap was (1) dark night palette (brightness 0.40 vs ours 0.74: deep navy + warm lamp/fire pools, never washed out), (2) every shot packed with props and 3–5 characters, (3) close eye-level camera, characters big in frame, (4) **every narration line shown as an on-screen action**. New engine in `shorts/fog-bombs/` (Poly Haven glTF props, patterned clothes, hand props, 35-shot action plan). **Bombs On The Track** rendered (63 s, 35 shots, 720p render upscaled to 1080x1920, ~2 h with 2 parallel renders, -15.5 LUFS) and sent. Rule: keep shine/bloom but never fade/wash out the colours. Perf gotcha: Poly Haven `shrub_01` is 156k tris — don't scatter it (4x slowdown); use `shrub_02`.
- 2026-11-22: **The Sky Sent Its Own** (samurai vs Mongol thunder bombs, original take on a Ricks Clips topic): 63 s, 2.2 s/frame, ~70 min render, sent. Characters now whiter/brighter (skin #fffdf8, card boost) and taller (legs 1.72). New cast: samurai (kabuto, lacquer armour), Mongols, horse + rider cards. Code in `shorts/sky-thunder/`. Next request: railway fog-signal "bombs on the track" story, inspired by Wobbly Tales (@wobblytale) — user wants that level of detail, close character camera angles and fast pacing.
- 2026-11-22: User wants the **Ricks Clips look** (shine, strong colours, 3D world + 2D characters). Engine changed in `shorts/beer-flood/web/main.js`: PBR glossy materials + sky env reflections, ACES grade, bloom, god rays, faint world ink (characters keep outlines), more set dressing; captions at 70% height via `captions.py`. Beer Flood v2 rendered (2.9 s/frame, ~95 min) and sent. Still less detailed than Ricks' game-engine sets.
- 2026-11-21: First short with the cartoon-audio-short skill: **The London Beer Flood** (66 s, 1976 frames, 1.9 s/frame, ~65 min render, QA clean, -15.7 LUFS). Code + stills in `shorts/beer-flood/`; video sent via chat.
- 2026-11-21: User asked to clear old work data (cloud scratch only, repo kept) and switch to their `cartoon-short-kit` (added to the repo), then added their skill `cartoon-audio-short` with the kit inside it.
- 2026-11-17: Channel plan made; reference long video analysed.
- 2026-11-19: Cu Chi clone template, Iwo Jima and Desert scripts; Blender full render (~2.5 h, cartoonish).
- 2026-11-19: Remotion soil test rendered in the cloud (1.43 s/frame). PC `.claude` data restored into `channel-notes/`. This brief created and merged into one file, `CLAUDE.md`.
- 2026-11-19: Full Cu Chi short remade in Remotion (32 min render, SFX only, no voice). Sent to the user via chat for comparison with Blender.
- 2026-11-19: User chose Blender over Remotion. 8 creative story ideas with hooks added.
- 2026-11-19: Short #02 Great Escape script + shot list written (user picked idea 1; idea 2 Wellington Quarry is next).
- 2026-11-19: Blender runs in the cloud (bpy from PyPI). Great Escape scene built and rendering in the cloud overnight; then Wellington Quarry (user asked: finish video 1, then make video 2). Both scenes built; renders chained overnight.
- 2026-11-20: Great Escape and Wellington Quarry videos finished and sent via chat (captions + SFX, no voice).
- 2026-11-20: Explainer-style test in cloud Blender (Poly Haven assets + original 2D character "Benny", `channel-notes/explainer/`). **User verdict: far below the reference ("zameen asman ka frq").** About 9 min per frame. Free CPU Blender cannot match the game-engine look; next options are AI-generated scene images plus 2D animation, or GPU + paid assets.
- 2026-11-20: **New workflow works:** the user makes scene images in Google Flow (Nano Banana Pro / 2.1) and uploads them; Claude animates them with `channel-notes/explainer/assemble/make_clip.py` (Ken Burns, shake, red flash, captions at 70% height, SFX). 11 s beard test sent. Image quality is close to the reference, but the character was inconsistent across images (2D vs 3D clay), so a fixed character reference must be used in every prompt.
- 2026-11-20: 3 reference videos uploaded and analysed (scripts via caption OCR, cuts, shots, audio); formula added to the research file.
- 2026-11-20: User wants a niche change; reference channel Ricks Clips analysed (YouTube hosts allowed in the cloud env; video pages bot-blocked, thumbnails/frames work).
