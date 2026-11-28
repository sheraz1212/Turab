"""F1 short: synthesized driving music bed + SFX stems (mix with mix.py)."""
import numpy as np, wave, re
SR = 48000; DUR = 104.2; N = int(DUR * SR); rng = np.random.default_rng(11)
def env(n, a=0.005, r=0.2): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def lpf(x, c): X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def hpf(x, c): X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 - 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def place(buf, sig, t0, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if 0 <= i < N and j > i: buf[i:j] += sig[: j - i] * g
midi = lambda m: 440 * 2 ** ((m - 69) / 12)
# ---------------- music: 120 bpm minor drive (kick/snare/hats, bass, pad, arpeggio) ----------------
music = np.zeros(N, np.float32); BPM = 120; beat = 60 / BPM
prog = [57, 53, 48, 55]  # Am F C G
def tone(f, dur, harm=5, bright=0.55, a=0.01, r=None):
    n = int(dur * SR); t = np.arange(n) / SR; s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) for k in range(harm))
    return (s * env(n, a, r or dur * 0.5)).astype(np.float32)
kick = (lambda n: np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-np.arange(n) / SR * 35)) / SR) * np.exp(-np.arange(n) / SR * 8))(int(0.4 * SR)).astype(np.float32)
snare = hpf((rng.standard_normal(int(0.2 * SR)) * np.exp(-np.arange(int(0.2 * SR)) / SR * 22)).astype(np.float32), 900)
hat = hpf((rng.standard_normal(int(0.05 * SR)) * np.exp(-np.arange(int(0.05 * SR)) / SR * 90)).astype(np.float32), 6000)
bars = int(DUR / (4 * beat)) + 1
for b in range(bars):
    root = prog[b % 4]; t0 = b * 4 * beat; calm = 22 < t0 < 34 or 89 < t0 < 99 or t0 > 99
    pad = sum(tone(midi(root + iv), 4 * beat, 3, 0.4, 0.3, 4 * beat) for iv in (0, 3, 7, 12)) / 4
    place(music, lpf(pad, 1400), t0, 0.35)
    for k in range(8): place(music, tone(midi(root - 12), beat / 2 * 0.9, 4, 0.6, 0.005, 0.12), t0 + k * beat / 2, 0.5 if not calm else 0.25)
    if not calm:
        for k in range(4): place(music, kick, t0 + k * beat, 0.9)
        for k in (1, 3): place(music, snare, t0 + k * beat, 0.45)
        for k in range(8): place(music, hat, t0 + k * beat / 2, 0.25)
        arp = [0, 7, 12, 15, 12, 7, 3, 7]
        for k in range(8): place(music, tone(midi(root + 12 + arp[k]), beat / 2, 4, 0.5, 0.003, 0.09), t0 + k * beat / 2, 0.22)
    else:
        for k in range(4): place(music, tone(midi(root + 24 + (0, 3, 7, 10)[k]), beat, 3, 0.4, 0.01, 0.4), t0 + k * beat, 0.18)
# finale swell at the championship
for k, m in enumerate([69, 72, 76, 81]): place(music, tone(midi(m), 3.0, 6, 0.6, 0.05, 1.5), 86.9 + k * 0.08, 0.25)
music = lpf(music, 9000)
# ---------------- SFX ----------------
sfx = np.zeros(N, np.float32)
def whoosh(d=0.35): n = int(d * SR); x = rng.standard_normal(n).astype(np.float32); x = lpf(hpf(x, 600), 3500); return x * np.sin(np.linspace(0, np.pi, n)) ** 2
def engine(d, f0=140, f1=420, gain=1.0):
    n = int(d * SR); t = np.arange(n) / SR; f = f0 + (f1 - f0) * (t / d) ** 0.6 + 6 * np.sin(2 * np.pi * 7 * t); ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(np.sin((k + 1) * ph) / (k + 1) for k in range(10)) + 0.25 * rng.standard_normal(n); a = np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.25).clip(0)
    return lpf((s * a).astype(np.float32), 4000) * gain
def crowd(d): n = int(d * SR); x = lpf(hpf(rng.standard_normal(n).astype(np.float32), 300), 2500); a = np.minimum(1, np.arange(n) / SR / 0.3) * np.minimum(1, (d - np.arange(n) / SR) / 0.6).clip(0); return x * a * (0.8 + 0.2 * np.sin(np.arange(n) / SR * 9))
def crash():
    n = int(1.4 * SR); t = np.arange(n) / SR; x = rng.standard_normal(n).astype(np.float32) * np.exp(-t * 4); m = sum(np.sin(2 * np.pi * f * t) for f in (310, 470, 830, 1290)) * np.exp(-t * 6) * 0.5
    return (lpf(x, 5000) + m.astype(np.float32) + np.sin(2 * np.pi * 60 * t) * np.exp(-t * 7)).astype(np.float32)
def beep(f=880, d=0.18): n = int(d * SR); t = np.arange(n) / SR; return (np.sign(np.sin(2 * np.pi * f * t)) * 0.4 * env(n, 0.002, d * 0.8)).astype(np.float32)
def click(): n = int(0.06 * SR); return hpf((rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 120)).astype(np.float32), 2000)
def pop(): n = int(0.5 * SR); t = np.arange(n) / SR; return (lpf(rng.standard_normal(n).astype(np.float32), 1500) * np.exp(-t * 7) + np.sin(2 * np.pi * 70 * t) * np.exp(-t * 10)).astype(np.float32)
def ding(f=1318): n = int(0.8 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) * np.exp(-t * 4) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 6)).astype(np.float32)
def scribble(d): n = int(d * SR); return hpf(rng.standard_normal(n).astype(np.float32), 2500) * (0.5 + 0.5 * np.abs(np.sin(np.arange(n) / SR * 20)))
src = open('web/shots_f1.js').read(); cuts = [float(x) for x in re.findall(r"^shot\(([\d.]+),", src, re.M)]
for c in cuts[1:]: place(sfx, whoosh(), c - 0.12, 0.35)
# cars
for t0, d, g in [(6.76, 2.0, 1.0), (8.74, 1.2, 0.9), (37.4 + 0.75, 1.5, 1.0), (49.18, 1.4, 0.6), (52.84, 2.3, 0.9), (64.0, 1.1, 0.7), (67.39, 0.8, 0.8), (71.19, 1.5, 0.5), (75.35, 2.4, 0.8), (77.74, 0.8, 0.6), (78.51, 1.8, 0.8), (80.35, 2.5, 0.9), (84.57, 2.0, 0.8), (85.52, 1.3, 1.0)]: place(sfx, engine(d), t0, g * 0.6)
for t0, d in [(1.47, 1.0), (2.45, 1.2)]: place(sfx, engine(d, 220, 300, 0.5), t0, 0.35)
place(sfx, crash(), 55.4, 0.9)
for k in range(5): place(sfx, beep(660), 37.4 + k * 0.125, 0.4)
place(sfx, beep(990, 0.3), 38.15, 0.5)
for t0, d in [(9.96, 1.1), (11.12, 2.2), (13.41, 2.0), (50.68, 2.1), (67.39, 0.8), (86.83, 3.0), (88.4, 1.5)]: place(sfx, crowd(d), t0, 0.35)
for k in range(10): place(sfx, pop(), 86.9 + k * 0.28 + rng.random() * 0.1, 0.35)
for t0 in (89.91, 90.88, 92.6, 94.3):
    for k in range(6): place(sfx, click(), t0 + rng.random() * 1.2, 0.5)
for t0 in (11.12, 13.41, 49.18, 94.3, 86.83 + 1.2): place(sfx, ding(), t0 + 0.05, 0.35)
for t0 in (21.96, 23.65): place(sfx, scribble(1.0), t0 + 0.1, 0.12)
place(sfx, scribble(2.4), 18.8, 0.1)
for k in range(4): place(sfx, ding(1568), 50.7 + k * 0.42, 0.25)
def save(name, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(name, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
save("music.wav", music / (np.abs(music).max() + 1e-9) * 0.9); save("sfx.wav", sfx / (np.abs(sfx).max() + 1e-9) * 0.9); print("ok")
