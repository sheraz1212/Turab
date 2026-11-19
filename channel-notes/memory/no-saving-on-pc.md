---
name: no-saving-on-pc
description: "User does not want videos/files saved into their folders — deliver via chat, they download themselves"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 38384067-f947-44f5-9298-d100460bea54
  modified: 2026-11-19T15:41:43.062Z
---

Don't save outputs (videos, scripts, docs) into the user's folders like Downloads\video. Keep working files in the session scratchpad/temp, send finished videos via SendUserFile in chat, and clean up temp renders afterwards. The user downloads what they want themselves.

**Why:** User said (2026-11-19): "tm kch bhe mery pc py save ni kro gy, mujhy jo video chaheya hogi m khud download krn ga".
**How to apply:** For Blender renders (see [[reference-video-style]], [[yt-ww-channel-plan]]), render into a temp folder, deliver via chat, then delete frames. Blender portable stays in %LOCALAPPDATA%\BlenderPortable only because rendering needs it; ask before removing it. Note: Claude's PowerShell tool runs sandboxed — Blender must be run via the user's real terminal (run_in_terminal, with `powershell -ExecutionPolicy Bypass -File`).
