# Flow / Nano Banana test: "Why Pilots Can't Grow Beards"

**Workflow:** the user generates images in Google Flow (Nano Banana Pro / Nano Banana 2.1) and uploads them to the chat. Claude does everything else: script, motion (zoom/pan/parallax), character animation, one-word captions, SFX/music, voice and the final edit.

## 1. Style anchor (paste at the START of every prompt)
> Vertical 9:16 frame. Stylized 3D game-engine look, like a bright modern animated short: saturated colours, soft cinematic sunlight, gentle depth of field, highly detailed environment with clean shapes. A flat 2D cartoon character composited into the 3D scene: big perfectly round white head with a thick dark outline, small black dot eyes, simple expressive mouth, thin black stick arms and legs, simple flat-coloured clothes. No text, no logos, no watermark.

## 2. Character reference (generate once, then reuse it as the reference image in every scene)
Upload `benny_neutral.png` (sent in chat) as a reference, or use:
> Character sheet of "Captain Benny": a flat 2D cartoon pilot with a big round white head, thick dark outline, black dot eyes, a proud bushy brown beard, a navy pilot cap with gold trim, a navy pilot jacket, thin black stick arms and legs. Front view, three expressions side by side: proud smile, shocked, embarrassed. Plain light-blue background.

## 3. Test scenes (3 images)
1. **Hook, close-up:** [style anchor] Medium close-up of Captain Benny standing proudly in an airport pilot lounge, stroking his huge bushy beard, big confident smile. Large windows behind him with a passenger jet on the runway, warm morning light.
2. **Mocking, two-shot:** [style anchor] Inside a modern airliner cockpit, view from behind the seats. Captain Benny with his huge beard sits in the left seat; a clean-shaven co-pilot cartoon in the right seat laughs and points at the beard. Bright blue sky and clouds through the cockpit windows, glowing instruments.
3. **Turn, dramatic:** [style anchor] Cockpit emergency at 35,000 feet: yellow oxygen masks dropping from the ceiling, red warning lights flashing, frost on the windows. Captain Benny presses an oxygen mask to his face but his giant beard sticks out around the edges of the mask, shocked expression.

Generate each at 9:16 at the highest resolution and upload all 3 here. They will be animated into a ~10-second test clip with captions and sound.

> Fact to keep straight in the final script: the reason is that facial hair can break the seal of a quick-donning oxygen mask, which is why many airlines and air forces restrict beards. Verify before publishing.
