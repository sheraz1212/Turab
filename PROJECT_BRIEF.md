# PROJECT BRIEF: Faceless History YouTube Channel

> **Read this file first.** It holds everything an AI tool or a new chat needs to know about this project: who the user is, what we make, how we make it, and the rules.
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
| Desert underground home | `channel-notes/scripts-docs/Short-01_Desert-Hole-Script.md` | Script + shot list done |
| Cu Chi jungle hideout (clone) | `channel-notes/blender/cu-chi-jungle/` | Full ~63 s made in Blender; looked too cartoonish |

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

### B. Remotion + three.js (cloud, tested 2026-11-19)
- Code: `remotion-test/` (React Three Fiber via `@remotion/three`, procedural canvas soil textures, bump/roughness maps, ACES tone mapping, soft shadows, fog).
- Speed: 5 s at 720x1280, 24 fps, software WebGL (`--gl=swangle`), 4 CPU cores: **172 s total = 1.43 s/frame**, roughly 36 min for a 63 s video.
- Look: the soil cross-section looks good and not cartoon-like. Bushes and trees still look game-like, and the figure is low-poly. There is no ray-traced light, so it is less realistic than Blender Cycles.
- Render: `cd remotion-test && npm i && npx remotion render SoilTest out/soil_test.mp4 --gl=swangle`

## 6. Repo map
- `PROJECT_BRIEF.md`: this file (the single source of truth).
- `CLAUDE.md`: tells Claude to read and update this file.
- `channel-notes/memory/`: original memory notes from the PC sessions.
- `channel-notes/scripts-docs/`: templates and scripts.
- `channel-notes/blender/`: Blender scene and render scripts.
- `remotion-test/`: Remotion code-rendered 3D test.
- Working branch: `claude/peaceful-brahmagupta-3lxb4a`.

## 7. Open decisions / next steps
- Choose the final pipeline (Blender vs Remotion) for the shorts, based on the soil test.
- The test mp4 at `remotion-test/out/soil_test.mp4` was pushed before the "no videos in repo" rule; ask before removing it.
- Pick the channel name.

## Changelog
- 2026-11-17: Channel plan made; reference long video analysed.
- 2026-11-19: Cu Chi clone template, Iwo Jima and Desert scripts; Blender full render (~2.5 h, cartoonish).
- 2026-11-19: Remotion soil test rendered in the cloud (1.43 s/frame). PC `.claude` data restored into `channel-notes/`. This brief created.
