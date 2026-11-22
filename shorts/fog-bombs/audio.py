"""Synthesized music bed + SFX stems for the fog-signal short (mix with mix.py)."""
import numpy as np, subprocess, wave

SR = 48000
DUR = 1883 / 30
N = int(DUR * SR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def load_voice():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "voice.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    v = np.frombuffer(raw, np.float32).copy()
    out = np.zeros(N, np.float32); out[:min(N, len(v))] = v[:N]; return out

def env(n, a=0.005, r=0.2, sus=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
    return e

def lp(x, k):  # one-pole low-pass, k in (0,1)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += k * (x[i] - acc); y[i] = acc
    return y

def lp_fast(x, cutoff):
    # FFT brick-ish low-pass (fast, fine for beds)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i < N and j > i: buf[i:j] += sig[: j - i] * gain

midi = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------------- music ----------------
music = np.zeros(N, np.float32)
BPM = 100; beat = 60 / BPM
prog = [(50, [50, 53, 57]), (46, [46, 50, 53]), (48, [48, 52, 55]), (45, [45, 49, 52])]  # Dm Bb C A
def pluck(f, dur=0.35, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.003, dur * 0.35)).astype(np.float32)
def brass(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        ph = 2 * np.pi * f * t + 0.003 * np.sin(2 * np.pi * 5 * t)
        s += sum(np.sin((k + 1) * ph) / (k + 1) ** 1.3 for k in range(8))
    a = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.15).clip(0)
    return lp_fast((s * a).astype(np.float32), 1800) / len(fs)
def drum(kind):
    if kind == "kick":
        n = int(0.35 * SR); t = np.arange(n) / SR; f = 50 + 90 * np.exp(-t * 30)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)).astype(np.float32)
    n = int(0.18 * SR); t = np.arange(n) / SR
    s = rng.standard_normal(n) * np.exp(-t * 28) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 20) * 0.5
    return hp_fast(s.astype(np.float32), 300)

def play(t0, t1, vol=1.0, fan=True):
    bar = 0; tt = t0
    while tt < t1:
        root, ch = prog[bar % 4]
        place(music, brass([midi(m) for m in ch], min(beat * 4 * 0.98, t1 - tt)), tt, 0.10 * vol)
        for b in range(4):
            tb = tt + b * beat
            if tb >= t1: break
            place(music, drum("kick" if b % 2 == 0 else "snare"), tb, (0.55 if b % 2 == 0 else 0.32) * vol)
            place(music, pluck(midi(root - 12), 0.4, 0.4), tb, 0.35 * vol)
            place(music, pluck(midi(ch[(b + bar) % 3] + 12), 0.22, 0.6), tb + beat / 2, 0.13 * vol)
        if fan and bar % 2 == 1:
            for k, m in enumerate([ch[0] + 12, ch[1] + 12, ch[2] + 12]):
                place(music, brass([midi(m)], beat * 0.45), tt + 2 * beat + k * beat * 0.5, 0.07 * vol)
        bar += 1; tt += beat * 4
    i = int((t1 - 0.08) * SR); j = min(N, int((t1 + 0.6) * SR)); music[i:j] *= np.linspace(1, 0, j - i) ** 6
    music[j:] = music[j:]  # later sections are placed after this call
def drone(t0, t1, vol=0.09):
    dn = int((t1 - t0) * SR); td = np.arange(dn) / SR
    d = (np.sin(2 * np.pi * 55 * td) + 0.5 * np.sin(2 * np.pi * 82.4 * td) + 0.3 * np.sin(2 * np.pi * 110.3 * td)) * np.minimum(1, td / 1.2) * np.minimum(1, (t1 - t0 - td) / 0.6).clip(0)
    place(music, lp_fast(d.astype(np.float32), 600), t0, vol)
play(0.0, 21.2, 0.55, fan=False)
play(21.2, 32.9, 1.0)
drone(32.9, 40.4, 0.12); play(35.8, 40.35, 0.9, fan=False)
play(41.4, 48.0, 0.7, fan=False)
play(48.0, 56.0, 0.55, fan=False)
play(56.0, DUR - 0.3, 1.0)
# ---------------- sfx ----------------
sfx = np.zeros(N, np.float32)
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def thunk(f0=90, d=0.3):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 14) + lp_fast(noise(d), 1200) * np.exp(-t * 30) * 0.5).astype(np.float32)
def rumble(d):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 160) * 3 * np.minimum(1, t / 0.15) * np.exp(-t / (d * 0.45))
    return s.astype(np.float32)
def crash(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n, np.float32)
    for k in range(14):
        tk = rng.uniform(0, d * 0.6); i = int(tk * SR); g = thunk(rng.uniform(60, 160), 0.35) * rng.uniform(0.3, 0.9)
        s[i:i + len(g)] += g[: n - i]
    s += lp_fast(noise(d), 2500) * np.exp(-t * 3) * 0.25
    return s
def cuckoo():
    out = []
    for f, d in [(740, 0.16), (587, 0.24)]:
        n = int(d * SR); t = np.arange(n) / SR
        out.append(np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.01) * np.exp(-t * 6)); out.append(np.zeros(int(0.06 * SR)))
    return np.concatenate(out).astype(np.float32)
def scrape(d=0.8):
    n = int(d * SR); t = np.arange(n) / SR
    s = noise(d) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t)) * np.sin(np.pi * t / d)
    s = hp_fast(lp_fast(s, 5000), 1500)
    ring = np.sin(2 * np.pi * 1870 * t) * np.exp(-t * 3) * 0.2
    return (s * 0.6 + ring).astype(np.float32)
def ting():
    n = int(1.2 * SR); t = np.arange(n) / SR
    return (sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(2093, 4), (3136, 6), (4186, 8)]) * 0.3).astype(np.float32)
def sting():
    n = int(2.0 * SR); t = np.arange(n) / SR
    low = np.sin(2 * np.pi * 41 * t) * np.exp(-t * 1.5) * 1.2
    hit = lp_fast(noise(2.0), 900) * np.exp(-t * 6) * 0.8
    stab = brass([midi(45), midi(48), midi(51)], 1.4); s = low + hit; s[: len(stab)] += stab * 2.2 * np.exp(-np.arange(len(stab)) / SR * 2)
    return s.astype(np.float32)
def creak(d=0.6, f0=140):
    n = int(d * SR); t = np.arange(n) / SR
    rate = f0 * (1 + 0.35 * np.sin(2 * np.pi * 1.3 * t / d))
    ph = np.cumsum(rate) / SR; pulses = (np.mod(ph, 1) < 0.08).astype(np.float32)
    s = lp_fast(pulses * (0.6 + 0.4 * rng.random(n).astype(np.float32)), 2200) * np.sin(np.pi * t / d)
    return hp_fast(s, 200) * 2.5
def snap():
    d = 0.5; n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 800) * np.exp(-t * 18) * 1.4 + np.pad(thunk(120, 0.4), (0, n - int(0.4 * SR))) * 0.6).astype(np.float32)
def splash(d=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 4000) * (np.exp(-t * 4) * np.minimum(1, t / 0.01)) + lp_fast(noise(d), 400) * np.exp(-t * 7) * 1.5
    return s.astype(np.float32)
def whoosh(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 1500) * np.sin(np.pi * t / d) ** 2 * 0.6).astype(np.float32)
def snore(d=1.1):
    n = int(d * SR); t = np.arange(n) / SR
    buzz = (np.mod(np.cumsum(60 + 25 * np.sin(np.pi * t / d)) / SR, 1) < 0.3).astype(np.float32)
    return (lp_fast(buzz * 0.5 + noise(d) * 0.15, 700) * np.sin(np.pi * t / d) ** 2).astype(np.float32)
def leaves(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 6000), 2500) * (0.3 + 0.3 * np.sin(2 * np.pi * 0.7 * t) ** 2) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4)).astype(np.float32)
def water(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 900) * 0.5 + hp_fast(lp_fast(noise(d), 3000), 1200) * 0.15 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t))).astype(np.float32)

F = lambda f: f / 30
def chuff(t0, t1, rate0=2.0, rate1=2.0, g=0.5):
    t = t0
    while t < t1:
        k = (t - t0) / max(t1 - t0, 1e-3); r = rate0 + (rate1 - rate0) * k
        d = 0.22; n = int(d * SR); tt = np.arange(n) / SR
        place(sfx, (lp_fast(noise(d), 1800) * np.exp(-tt * 14)).astype(np.float32), t, g); t += 1 / r
def whistle(t0, d=1.1, g=0.6):
    n = int(d * SR); t = np.arange(n) / SR; a = np.minimum(1, t / 0.06) * np.minimum(1, (d - t) / 0.2).clip(0)
    s = sum(np.sin(2 * np.pi * f * t + 0.004 * np.sin(2 * np.pi * 6 * t)) for f in (587, 740, 880)) / 3 + hp_fast(noise(d), 2000) * 0.15
    place(sfx, (s * a).astype(np.float32), t0, g)
def crunch(t0, t1, step=0.55, g=0.35):
    t = t0
    while t < t1:
        d = 0.12; n = int(d * SR); tt = np.arange(n) / SR
        place(sfx, (hp_fast(lp_fast(noise(d), 5000), 900) * np.exp(-tt * 30)).astype(np.float32), t, g); t += step
def click():
    d = 0.12; n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 60) + hp_fast(noise(d), 3000) * np.exp(-t * 80)).astype(np.float32)
def boing():
    d = 0.6; n = int(d * SR); t = np.arange(n) / SR; f = 180 + 260 * np.exp(-t * 6) * (1 + 0.3 * np.sin(2 * np.pi * 14 * t))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4)).astype(np.float32)
def tick(t0, t1, g=0.3):
    t = t0
    while t < t1: place(sfx, click(), t, g); t += 0.5
def wind(t0, t1, g=0.3):
    d = t1 - t0; n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * t)) * np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6).clip(0)
    place(sfx, s.astype(np.float32), t0, g)
def hooves(t0, t1, g=0.5):
    t = t0
    while t < t1:
        for d in (0, 0.09, 0.2): place(sfx, thunk(70 + (int(t * 10) % 3) * 12, 0.18), t + d, g)
        t += 0.42
wind(0.0, 6.2, 0.5); wind(13.25, 21.3, 0.6); wind(32.9, 40.4, 0.5); wind(41.4, 56.0, 0.35)
crunch(1.5, 3.9, 0.5, 0.4)
place(sfx, click(), 4.65, 0.7); place(sfx, ting(), 4.7, 0.25)                    # clamp
place(sfx, leaves(2.3), 6.2, 0.25); whistle(6.5, 1.0, 0.45); chuff(6.2, 8.6, 1.2, 1.2, 0.15)   # station
chuff(8.6, 13.2, 3.0, 5.5, 0.5); place(sfx, rumble(4.6), 8.6, 0.6); whistle(9.6, 1.2, 0.5); place(sfx, whoosh(1.0), 10.9, 0.7)
hooves(11.8, 13.2, 0.45)
place(sfx, rumble(2.0), 13.25, 0.5); place(sfx, whoosh(1.6), 13.3, 0.4)        # fog rolls in
chuff(14.7, 16.7, 1.6, 1.6, 0.25)
place(sfx, whoosh(2.0), 19.0, 0.35); place(sfx, sting(), 20.6, 0.55)            # van looms
place(sfx, ting(), 22.3, 0.6); place(sfx, ting(), 24.15, 0.4); place(sfx, ting(), 25.6, 0.35)  # idea / tin / coin
place(sfx, cuckoo(), 27.2, 0.5); place(sfx, boing(), 28.9, 0.55); place(sfx, boing(), 30.05, 0.35)
place(sfx, thunk(80, 0.4), 32.35, 0.8); place(sfx, crash(0.6), 32.35, 0.4)        # boss falls over
place(sfx, click(), 33.5, 0.7); tick(34.5, 35.85, 0.3)
whistle(36.0, 1.2, 0.35); chuff(35.85, 38.7, 2.5, 6.5, 0.45); place(sfx, rumble(3.0), 35.9, 0.7); place(sfx, whoosh(1.3), 37.6, 0.8)
place(sfx, rumble(1.7), 38.7, 0.8); place(sfx, creak(1.6, 90), 38.7, 0.3)
place(sfx, crash(1.6), 40.42, 1.0); place(sfx, thunk(60, 0.6), 40.4, 1.0); place(sfx, rumble(2.4), 40.4, 1.0)   # BANG
place(sfx, boing(), 43.0, 0.5); place(sfx, sting(), 42.95, 0.35)
place(sfx, thunk(140, 0.3), 45.2, 0.8); place(sfx, scrape(0.4), 45.2, 0.4)        # lever
place(sfx, scrape(2.3), 46.25, 0.75); place(sfx, scrape(2.0), 46.6, 0.5); place(sfx, thunk(70, 0.5), 48.0, 0.6)   # screech + stop
for k in range(6): place(sfx, thunk(70, 0.4), 48.3 + k / 1.1, 0.45); place(sfx, whoosh(0.6), 48.3 + k / 1.1, 0.3)  # rings
place(sfx, whoosh(1.6), 51.3, 0.3)
place(sfx, crash(0.8), 52.8, 0.5); [place(sfx, whoosh(0.5), 52.8 + k * 0.7, 0.45) for k in range(3)]
place(sfx, ting(), 54.6, 0.35)
place(sfx, leaves(6.5), 56.05, 0.25); place(sfx, click(), 56.65, 0.7)
place(sfx, hp_fast(lp_fast(noise(2.3), 3000), 300) * np.sin(np.pi * np.arange(int(2.3 * SR)) / SR / 2.3).astype(np.float32), 57.95, 0.8); place(sfx, whoosh(1.0), 58.8, 0.8)
place(sfx, ting(), 61.2, 0.5)

def save(name, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(name, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
pk = max(np.abs(music).max(), np.abs(sfx).max(), 1e-9)
save("music.wav", music / pk * 0.9); save("sfx.wav", sfx / pk * 0.9)
print("stems ok", DUR)
