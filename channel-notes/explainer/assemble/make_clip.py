"""Turn still images (from Flow / Nano Banana) into an animated Short: Ken Burns camera moves, shake,
light flashes, one-word captions at ~70% height (reference style), SFX bed, H.264 encode.
Usage: python make_clip.py <shots.json> <out.mp4> <ffmpeg>
shots.json: {"fps":30, "shots":[{"img":..., "dur":3.5, "zoom":[1.0,1.12], "pan":[[0,0],[0.03,-0.02]],
            "shake":0, "flash":null|"red", "lines":["text", ...]}], "sfx":[[name, t, vol], ...]}"""
import sys, json, io, math, subprocess, wave, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

cfg = json.load(open(sys.argv[1])); OUT = sys.argv[2]; FF = sys.argv[3]
FPS = cfg.get("fps", 30); W, H = 1080, 1920
FONT = next(p for p in ("/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf") if os.path.exists(p))
font = ImageFont.truetype(FONT, 58)
ease = lambda t: t * t * (3 - 2 * t)

# word timings: spread each shot's lines over the shot (no voice yet)
words = []; t0 = 0.0
for sh in cfg["shots"]:
    ws = " ".join(sh.get("lines", [])).split()
    if ws:
        span = sh["dur"] - 0.25; tot = sum(len(w) + 2 for w in ws); acc = 0
        for w in ws:
            a = t0 + 0.1 + span * acc / tot; acc += len(w) + 2; words.append((a, t0 + 0.1 + span * acc / tot, w))
    sh["t0"] = t0; t0 += sh["dur"]
DUR = t0

def frame_at(sh, im, t):
    u = ease(min(1, max(0, (t - sh["t0"]) / sh["dur"])))
    z = sh["zoom"][0] + (sh["zoom"][1] - sh["zoom"][0]) * u
    (px0, py0), (px1, py1) = sh.get("pan", [[0, 0], [0, 0]])
    px, py = px0 + (px1 - px0) * u, py0 + (py1 - py0) * u
    if sh.get("shake"):
        k = sh["shake"]; px += k * math.sin(t * 53) * 0.6; py += k * math.cos(t * 47) * 0.6
    iw, ih = im.size
    base = max(W / iw, H / ih)                    # cover scale
    s = base * z
    cw, ch = W / s, H / s                         # crop size in image pixels
    cx = iw / 2 + px * iw; cy = ih / 2 + py * ih
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    fr = im.transform((W, H), Image.EXTENT, box, Image.BICUBIC)
    if sh.get("flash") == "red":
        a = 0.18 * (0.5 + 0.5 * math.sin(t * 9))
        fr = Image.blend(fr, Image.new("RGB", (W, H), (255, 30, 20)), a)
    return fr

def draw_caption(fr, t):
    for a, b, w in words:
        if a <= t < b:
            d = ImageDraw.Draw(fr); tw = d.textlength(w, font=font); x = (W - tw) / 2; y = H * 0.70
            pop = min(1, (t - a) / 0.05)
            d.text((x, y), w, font=font, fill=(255, 255, 255), stroke_width=5, stroke_fill=(0, 0, 0))
            break
    return fr

# audio bed
SR = 48000; mix = np.zeros(int((DUR + 1) * SR)); rng = np.random.default_rng(1)
def add(x, t, v):
    i = int(t * SR); mix[i:i + len(x)] += x[: len(mix) - i] * v
def env(x, fin, fout):
    n = len(x); tt = np.arange(n) / SR; g = np.clip(tt / max(fin, 1e-3), 0, 1) * np.clip((n / SR - tt) / max(fout, 1e-3), 0, 1); return x * g
def noise(d): return rng.standard_normal(int(d * SR))
def lowpass(x, k): return np.convolve(x, np.ones(k) / k, mode="same")
SFX = {
    "hum": lambda: env(lowpass(noise(DUR), 60) * 0.25, 0.5, 0.5),
    "whoosh": lambda: env(lowpass(noise(0.6), 8) * np.linspace(0.2, 1, int(0.6 * SR)), 0.2, 0.3) * 0.6,
    "pop": lambda: env(np.sin(2 * np.pi * 700 * np.arange(int(0.1 * SR)) / SR) * np.exp(-np.arange(int(0.1 * SR)) / SR * 35), 0.002, 0.02) * 0.5,
    "alarm": lambda: env(np.sign(np.sin(2 * np.pi * 880 * np.arange(int(0.35 * SR)) / SR)) * 0.12, 0.01, 0.05),
    "hiss": lambda: env(noise(1.5) - lowpass(noise(1.5), 4), 0.1, 0.8) * 0.12,
    "boing": lambda: env(np.sin(2 * np.pi * np.cumsum(np.linspace(300, 120, int(0.4 * SR))) / SR) * 0.5, 0.005, 0.2),
}
for name, t, v in cfg.get("sfx", []):
    add(SFX[name](), t, v)
mix = np.tanh(mix * 1.2) * 0.85
wav = OUT + ".wav"
with wave.open(wav, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.stack([mix, mix], 1) * 32767).astype("<i2").tobytes())

p = subprocess.Popen([FF, "-v", "error", "-y", "-f", "image2pipe", "-c:v", "png", "-r", str(FPS), "-i", "-", "-i", wav,
                      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-c:a", "aac", "-b:a", "192k", "-shortest", OUT], stdin=subprocess.PIPE)
imgs = [Image.open(sh["img"]).convert("RGB") for sh in cfg["shots"]]
n = int(DUR * FPS)
for k in range(n):
    t = k / FPS
    si = max(i for i, sh in enumerate(cfg["shots"]) if sh["t0"] <= t)
    fr = frame_at(cfg["shots"][si], imgs[si], t)
    # quick crossfade-free cut with a 3-frame zoom punch on each cut (reference uses hard cuts)
    fr = draw_caption(fr, t)
    b = io.BytesIO(); fr.save(b, "PNG", compress_level=1); p.stdin.write(b.getvalue())
p.stdin.close(); p.wait(); os.remove(wav)
print("CLIP_OK", OUT, round(DUR, 2), "s")
