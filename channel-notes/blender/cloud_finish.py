"""Cloud finishing step (replaces finish.ps1): one-word captions + big numbers drawn with PIL,
synthesised SFX mixed with numpy, encoded to H.264/AAC with ffmpeg.
Usage: python cloud_finish.py <config.py> <frames_dir> <out.mp4> [ffmpeg_path]
The config file defines LINES [(start_s, text)], BIG [(start_s, end_s, text, y_frac)], CUES [(name, t, vol)],
RANGES [(name, a, b, step, vol)], DUR (seconds) and optionally VOICE (wav path)."""
import sys, os, wave, subprocess, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.signal import butter, sosfilt

cfg = {}
exec(open(sys.argv[1]).read(), cfg)
frames_dir, out = sys.argv[2], sys.argv[3]
FF = sys.argv[4] if len(sys.argv) > 4 else "ffmpeg"
FPS, SR = 24, 48000
DUR = cfg["DUR"]
rng = np.random.default_rng(3)

# ---------------- SFX
def noise(color, d):
    n = int(d * SR); w = rng.standard_normal(n)
    if color == "white":
        return w * 0.3
    if color == "brown":
        b = np.cumsum(w); b -= np.convolve(b, np.ones(2000) / 2000, mode="same"); return b / (np.abs(b).max() + 1e-9)
    f = np.fft.rfft(w); f /= np.sqrt(np.arange(1, len(f) + 1)); p = np.fft.irfft(f, n); return p / (np.abs(p).max() + 1e-9)
def lp(x, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)
def bp(x, f, w): return sosfilt(butter(2, [max(20, f - w / 2), f + w / 2], "band", fs=SR, output="sos"), x)
def env(x, fin=0.0, fout=0.0):
    n = len(x); t = np.arange(n) / SR; g = np.ones(n)
    if fin: g *= np.clip(t / fin, 0, 1)
    if fout: g *= np.clip((n / SR - t) / fout, 0, 1)
    return x * g
def sine(f, d): return np.sin(2 * np.pi * f * np.arange(int(d * SR)) / SR)
S = {
    "boom": env(lp(noise("brown", 3), 160), fout=2.8) * 1.3 + np.pad(env(lp(noise("white", 0.25), 2500), fout=0.25) * 0.8, (0, int(2.75 * SR))),
    "rumble": env(lp(noise("brown", 2.0), 120), fin=0.2, fout=1.5) * 0.9,
    "wind": lp(noise("pink", DUR), 700) * 0.05,
    "scrape": env(lp(hp(noise("white", 0.12), 400), 3000), fout=0.12) * 0.8,
    "step": env(lp(noise("brown", 0.09), 300), fout=0.09) * 0.5,
    "thud": env(lp(noise("brown", 0.35), 220), fout=0.35) * 0.9,
    "tok": env(lp(noise("brown", 0.08), 900), fout=0.08) * 0.6,
    "metal": env(bp(noise("white", 0.7), 2400, 1600), fin=0.05, fout=0.4) * 0.5,
    "crackle": env(hp(noise("white", 2.0) * (rng.random(int(2 * SR)) > 0.995), 1500) * 6, fin=0.2, fout=0.5) * 0.4,
    "pulse": env(lp(noise("brown", 0.5), 90), fout=0.45) * 1.2,
    "beep": env(sine(1250, 0.18), fout=0.05) * 0.18,
    "whoosh": env(bp(noise("pink", 2.0), 900, 600), fin=0.4, fout=0.8) * 0.8,
    "slide": env(lp(noise("pink", 1.4), 1400), fin=0.05, fout=1.0) * 0.8,
    "trickle": env(hp(noise("white", 4.4), 3000), fin=0.5, fout=0.8) * 0.12,
    "wheeze": env(bp(noise("pink", 0.6), 700, 500), fin=0.25, fout=0.3) * 0.5,
    "clack": env(hp(noise("white", 0.05), 1200), fout=0.05) * 0.6,
    "pop": env(sine(660, 0.12) * np.exp(-np.arange(int(0.12 * SR)) / SR * 30), fout=0.02) * 0.4,
    "chime": env((sine(1046, 1.5) + sine(1568, 1.5) * 0.5) * np.exp(-np.arange(int(1.5 * SR)) / SR * 3), fout=0.2) * 0.2,
    "swell": env((sine(110, 2.5) + sine(165, 2.5)) / 2, fin=0.6, fout=1.3) * 0.45,
    "chord": env((sine(196, 4) + sine(247, 4) + sine(294, 4)) / 3, fin=0.3, fout=2.5) * 0.5,
    "crunch": env(lp(noise("white", 0.15), 2000) * (rng.random(int(0.15 * SR)) > 0.7), fout=0.1) * 1.2,
    "heart": np.concatenate([env(lp(noise("brown", 0.12), 70), fout=0.1), np.zeros(int(0.12 * SR)), env(lp(noise("brown", 0.12), 70), fout=0.1) * 0.7]) * 1.4,
}
cues = list(cfg.get("CUES", []))
for name, a, b, st, v in cfg.get("RANGES", []):
    t = a
    while t < b:
        cues.append((name, t, v)); t += st
mix = np.zeros(int(DUR * SR) + 4 * SR)
for name, t, v in cues:
    x = S[name] * v; i = int(t * SR); mix[i:i + len(x)] += x[: max(0, len(mix) - i)]
mix = mix[: int(DUR * SR)]
if cfg.get("VOICE") and os.path.exists(cfg["VOICE"]):
    with wave.open(cfg["VOICE"]) as w:
        v = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(float) / 32767
        if w.getnchannels() == 2: v = v[::2]
    mix[: len(v)] += v[: len(mix)] * 1.0
mix = np.tanh(mix * 1.1) * 0.9
wav = out + ".wav"
with wave.open(wav, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.stack([mix, mix], 1) * 32767).astype("<i2").tobytes())

# ---------------- captions
WORDS = []
LINES = cfg["LINES"]
for i, (t, s) in enumerate(LINES):
    words = s.replace(",", "").replace(".", "").split()
    nxt = LINES[i + 1][0] if i + 1 < len(LINES) else DUR
    dur = min(nxt - t - 0.15, len(words) * 0.34 + 0.2)
    tot = sum(len(w) + 2 for w in words); acc = 0
    for wd in words:
        a = t + dur * acc / tot; acc += len(wd) + 2; b = t + dur * acc / tot
        WORDS.append((a, b, wd[0].upper() + wd[1:]))
fp = next((p for p in ("/usr/share/fonts/opentype/inter/InterDisplay-Black.otf", "/usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf",
                       "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf") if os.path.exists(p)))
def draw_text(im, txt, y_frac, size, fill):
    d = ImageDraw.Draw(im); f = ImageFont.truetype(fp, size)
    w = d.textlength(txt, font=f); x = (im.width - w) / 2; y = im.height * y_frac
    d.text((x + 2, y + 3), txt, font=f, fill=(0, 0, 0, 140), stroke_width=4, stroke_fill=(0, 0, 0, 140))
    d.text((x, y), txt, font=f, fill=fill, stroke_width=4, stroke_fill=(0, 0, 0))

files = sorted(glob.glob(os.path.join(frames_dir, "*.png")))
im0 = Image.open(files[0]); W_, H_ = im0.size
p = subprocess.Popen([FF, "-v", "error", "-y", "-f", "image2pipe", "-c:v", "png", "-r", str(FPS), "-i", "-",
                      "-i", wav, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-shortest", out],
                     stdin=subprocess.PIPE)
for k, fpath in enumerate(files):
    t = k / FPS
    im = Image.open(fpath).convert("RGB")
    for a, b, wd in WORDS:
        if a <= t < b:
            draw_text(im, wd, 0.455, int(46 * W_ / 720), (255, 255, 255)); break
    for a, b, txt, yf in cfg.get("BIG", []):
        if a <= t < b:
            draw_text(im, txt, yf, int(84 * W_ / 720), (255, 210, 30))
    buf = __import__("io").BytesIO(); im.save(buf, "PNG", compress_level=1); p.stdin.write(buf.getvalue())
p.stdin.close(); p.wait()
os.remove(wav)
print("FINISH_OK", out)
