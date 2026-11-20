# Reference channel: Ricks Clips (@ricksclips3000), analysed 2026-11-20

**Size:** ~201K subscribers, 154 Shorts (no long videos).
**Data used:** the full Shorts list with titles and views (yt-dlp), cover thumbnails and in-video frames (i.ytimg.com). Video pages and subtitles were bot-blocked from the cloud ("Sign in to confirm you're not a bot"), so the exact scripts and voice are not analysed yet; upload 2–3 videos to get them.

## Two eras
1. **Old (lower part of the list):** comedy skits with emoji titles ("Oh Nah 💀", "Low And Slow 😭🤣"). Mostly 50K–1M views, some 2–7M.
2. **New (top ~32 Shorts): curiosity explainers.** These carry the channel: 5–35M views each.
   - "The Ancient Jar That Warned an Empire" 35M · "Why Perfect Railroads Don't Work" 30M · "The Job Nobody Wants in Japan" 18M
   - "Why Sailors Carried Storm Oil" 16M · "Your Brain's Secret Idea Zone" 16M · "The Window That Breaks Japan's Gambling Law" 16M
   - "What the Grave Bell Really Meant" 13M · "This Shape Saved Roller Coasters" 12M · "The Pink Prison Cell Experiment" 11M
   - "Why Cashiers Keep Winning The Lottery" 10M · "The Instinct That Makes You Crash" 10M · "How One Cart Stopped an Entire Army" 9.4M · "How Mine Salting Worked" 7M

## Formula
- **Topic:** one surprising "why/how" fact: history tricks, engineering, psychology, Japan, casinos/lottery, pirates/sailors, medieval, crime.
- **Title patterns:** "Why ___", "How ___ Worked", "The ___ That ___", "This ___ Saved ___". Short, curiosity gap, no emojis.
- **Length:** Short, roughly 30–60 s (exact durations not readable).

## Visual style
- **2D cartoon characters inside detailed 3D environments.** Characters have big round white heads, simple faces (dot or line eyes, expressive mouths), thick dark outlines, thin stick legs, and era costumes and hats (top hat, samurai helmet, pirate hat, captain cap).
- **3D sets** (game-engine look, saturated colours, cinematic lighting, light depth of field): castle walls at night, pirate ships at sea, roller coasters, offices, Japanese prize counters, gold mines with lanterns, prison cells, battlefields.
- **Camera:** mostly portrait close and medium shots with a character centred; low angles; wide establishing shots; over-the-shoulder; occasional big crowd or army shots.
- **Captions:** one word at a time, white bold with black outline, in the middle of the screen (same as our pipeline).
- **Lighting:** strong mood per scene (night blue, golden lantern, pink cell, dramatic sky).

## What we can reuse
- Our Blender cloud pipeline already does 3D sets, camera keys, one-word captions and SFX.
- New pieces needed:
  1. Our own 2D character style: an original round-head design, drawn procedurally as PNG sprites (poses, mouths, outfits) and shown as camera-facing planes in Blender.
  2. Voiceover (ElevenLabs).
  3. Faster scenes: fewer heavy booleans, more image planes.
- Use original topics and scripts. Do not copy their titles, characters or wording.

---

## Deep dive on 3 uploaded videos (2026-11-20)
Analysed "The Instinct That Makes You Crash" (59.5 s), "The Ancient Jar That Warned an Empire" (64.9 s) and "Why Perfect Railroads Don't Work" (65.3 s), all 720x1280 at 30 fps. Scripts were read from the burned-in captions (OCR), cuts were measured from frame differences, and loudness from the audio.

### Script formula (the real secret: it is a STORY, not a list of facts)
Third person, past or present tense, about 165–180 words, ~60–65 s.
1. **Hook = a strange action, with no explanation** (first line, 0–3 s):
   - "He sawed gaps into a railroad every 39 feet."
   - "He put a bronze ball in a dragon's mouth and told the emperor: if this ever falls out, run."
   - "If you plant a tree beside an empty road, cars will steer right into it."
2. **"You see,…"** gives the setting in 1–2 lines (a race, a court, a lonely road). Stakes are set.
3. **Everyone mocks or opposes the hero**: the boss turns purple, the court laughs, a short funny quoted line ("You're wrecking my railroad!").
4. **The "wrong" side wins at first**: the rival finishes first, the ball falls and nothing happens, the town adds a flashing arrow and crashes double. A comic escalation beat (the tow-truck guy sets up a lawn chair).
5. **The turn, caused by nature or time**: summer comes, one night all eight balls drop, the sheriff hits the stump.
6. **Payoff**: a big visual consequence (the rail kicks sideways like a snake; the palace is a pile of rubble; the sheriff plows into the stump). Often an ironic twist on the mockers.
7. **The explanation in the last ~10–15 s**: name the mechanism ("It's called target fixation", the pendulum inside, thermal expansion) in 2–3 simple lines. No outro and no call to action; it ends on the explanation.
- Running jokes and quoted dialogue in every video; times shown as props ("in May", "by July").
- Titles: "The Instinct That Makes You Crash", "The Ancient Jar That Warned an Empire", "Why Perfect Railroads Don't Work". Each names the mystery, not the answer.

### Visual language
- **Characters:** 2D flat cartoon cutouts (round white head, black outline, dot eyes, big expressive mouth, stick limbs, era hat and outfit) standing in **3D sets**. Faces change colour with emotion (an angry boss turns purple); sweat drops and steam puffs.
- **Sets:** game-engine 3D (desert canyon with red rock layers, prairie road, Chinese palace). Bright saturated colours, soft sky, cinematic sun.
- **Shot types:** close-up face at the centre (most common), medium two-shot, wide establishing / drone shot, low-angle hero shot, **driver POV** through a windshield, an insert close-up of the key object (the gap, the frog, the ball), over-the-shoulder.
- **Explainer props built into the world:** a green road sign reading "TARGET FIXATION", a newspaper headline "THE CLICKETY CLACK LINE", a wall calendar "MAY", a thermometer, rails glowing pink→yellow to show heat, and slow-motion inserts.
- **Pacing:** cuts every ~1.3 s in the fast videos (crash, rail) and every ~3 s in the jar video, where the camera keeps moving inside each shot. Something always moves (camera drift, a character reacting).
- **Captions:** one word at a time, white bold with a thin black outline, small (about 4% of the height), at **~70% of the frame height** (lower third), not the centre.
- **Audio:** loud and consistent (~ −17 dB RMS), a male narrator, music bed plus cartoon SFX.

### How to make ours (plan)
- Script template = the 7 steps above, with our own topics. Verify every fact.
- Characters: our own original 2D design, rendered as camera-facing image planes in Blender (several mouth/eye poses per character, recoloured per emotion).
- Sets: procedural Blender sets (road, canyon, palace, ship…), kept light so Cycles renders fast; reuse camera rigs (close-up, POV, drone).
- Captions at 70% height, smaller font; ElevenLabs narrator; music + SFX.
