# Explainer Short E01: Why Pilots Can't Grow Big Beards

**Format:** reference-channel formula (strange-action hook → setup → mockery → the wrong side wins first → the turn → payoff → mechanism). About 60 s, 9:16.
**Pipeline:** Flow (Nano Banana Pro images + Veo image-to-video, driven by the Claude in Chrome extension or by the user) → clips uploaded to the Claude Code chat → edit, captions, SFX, music, voice.

> Facts to verify before upload: at ~35,000 ft the time of useful consciousness after a rapid decompression is roughly 30–60 seconds; flight-crew quick-donning oxygen masks must seal against the skin, and facial hair can break that seal. Many airlines and air forces limit beards for this reason.

---

## Narration (≈165 words)
1. Captain Benny had the biggest beard in aviation. And he refused to shave it.
2. You see, he'd flown jets for thirty years, and that beard was his lucky charm.
3. His co-pilot laughed at it every single flight. "One day, that thing is gonna get you killed."
4. Benny just combed it.
5. The airline sent warning letters. He framed them.
6. Years went by, and nothing happened. "See?" he said. "Totally fine."
7. Then one night, at thirty-five thousand feet, a cockpit window cracked.
8. The air rushed out. The temperature dropped. Alarms everywhere.
9. Oxygen masks dropped from the ceiling. The co-pilot slapped his on and breathed.
10. Benny pressed his mask down hard… but it wouldn't seal. Air hissed out through the beard.
11. His fingers started tingling. His vision went grey.
12. Up there, you get maybe thirty seconds before your brain switches off.
13. An oxygen mask only works if it seals against skin, and every hair is a tiny leak.
14. That's why airlines don't let pilots grow big beards.

---

## Character lock (paste into EVERY image prompt, with the cockpit two-shot image as the reference)
> Keep the exact same flat 2D cartoon character from the reference image: perfectly round white head with a thick black outline, small black dot eyes, simple mouth, big fluffy orange beard, orange beanie, teal shirt, thin black stick arms and legs. He is a flat 2D cartoon composited into a detailed 3D scene. Do NOT make him 3D, clay, or realistic.

**Co-pilot:** same flat 2D style, round white head, no beard, navy pilot cap, light-blue shirt.

## Style anchor (start of every image prompt)
> Vertical 9:16. Stylized 3D game-engine environment, bright saturated colours, soft cinematic light, gentle depth of field, highly detailed. No text, no logos, no watermark.

---

## Scenes: image prompt → Veo movement prompt
Veo clip length 8 s; the edit uses 3–5 s of each. Say "no dialogue, no subtitles" unless a line is given.

| # | Image prompt (after style anchor + character lock) | Veo movement prompt |
|---|---|---|
| 1 | Close-up of Benny in an airport pilot lounge, huge orange beard filling the frame, proud smile, big windows with a passenger jet behind him, morning sun. | Benny strokes his beard proudly and grins; slow camera push-in toward his face. No dialogue. |
| 2 | Medium shot of Benny in a navy pilot jacket over his teal shirt, walking past a row of framed photos of jets on a corridor wall, beard swaying. | Benny walks confidently toward the camera, beard bouncing; camera tracks backwards. No dialogue. |
| 3 | Inside an airliner cockpit from behind the seats: Benny in the left seat, the co-pilot in the right seat laughing and pointing at the beard; blue sky and clouds outside. | The co-pilot laughs and points at the beard, Benny turns his head with a smug look; slight camera drift. Co-pilot says: "One day, that thing is gonna get you killed." |
| 4 | Close-up of Benny combing his beard with a small comb in the cockpit, calm happy face. | Benny slowly combs his beard, eyes closed, relaxed; static camera. No dialogue. |
| 5 | Benny's apartment: a wall with three framed letters titled "WARNING" from the airline, Benny admiring them with arms crossed. | Benny hangs a third frame on the wall and nods proudly; slow pan right. No dialogue. |
| 6 | A sunny cockpit, Benny leaning back with feet up, giving a thumbs-up, the co-pilot rolling his eyes. | Benny gives a thumbs-up toward the camera and smiles; co-pilot shakes his head. Benny says: "See? Totally fine." |
| 7 | Night cockpit at 35,000 feet, dark-blue sky with stars; a crack spreading across the front window, both pilots frozen in shock. | The crack spreads across the window with a loud crack; both pilots jump in their seats; camera shakes. No dialogue. |
| 8 | Same cockpit: papers and maps flying toward the cracked window, frost forming on the glass, red warning lights. | Papers whip through the air toward the window, frost spreads; red lights flash; violent camera shake. No dialogue. |
| 9 | Yellow oxygen masks dropping from the cockpit ceiling, the co-pilot pressing his mask to his face, breathing. | Masks fall and swing; the co-pilot grabs one, presses it on and breathes in relief. No dialogue. |
| 10 | Close-up of Benny pressing a yellow mask against his face, but his huge beard pushes it away from the skin; little air puffs escaping around the edges. | Benny pushes the mask harder, white air puffs hiss out through the beard; his eyes go wide; slight handheld shake. No dialogue. |
| 11 | Benny's point of view: his own tingling cartoon hands in front of the instrument panel, vision going grey and blurry at the edges. | The view slowly blurs and darkens at the edges; the hands tremble; slow drift. No dialogue. |
| 12 | Explanation shot: a big digital countdown clock reading 0:30 floating in the dark cockpit, Benny small and dizzy below it. | The clock counts down 30, 29, 28; Benny sways dizzily; slow push-in. No dialogue. |
| 13 | Explanation cut-away: a giant cross-section close-up of an oxygen mask edge on a cartoon face, beard hairs creating tiny gaps with glowing blue air arrows leaking out. | Blue air streams leak through the gaps between the hairs; slow orbit around the mask edge. No dialogue. |
| 14 | Ending: a crew room with a big poster of a clean-shaven Benny; Benny himself standing in front of it, freshly shaved, touching his bare chin, sad face. | Benny touches his bare chin and sighs; slow push-in on his face. No dialogue. |

---

## Message for the Claude in Chrome extension (copy-paste)
> I'm making a YouTube Short in Google Flow (already open and logged in, in this browser). For each scene below, do this in Flow: 1) create an image with Nano Banana Pro at 9:16 using the reference image I uploaded (the cockpit two-shot) and the full prompt (style anchor + character lock + scene prompt); 2) turn that image into an 8-second video with Veo (frames to video) using the movement prompt; 3) download the video and name it scene_01.mp4, scene_02.mp4, and so on. Ask me before spending credits on any regeneration. Scenes: [paste the table above].
