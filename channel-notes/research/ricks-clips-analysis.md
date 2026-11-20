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
