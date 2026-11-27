"""Synthesized music bed + SFX stems for the coaster loop short (mix with mix.py)."""
import numpy as np, subprocess, wave
SR = 48000
DUR = 1566 / 30
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
BPM = 116; beat = 60 / BPM
prog = [(55, [55, 59, 62]), (50, [50, 54, 57]), (52, [52, 55, 59]), (48, [48, 52, 55])]  # Dm Bb C A (sneaky medieval)
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
def gunfire(t0, t1, rate=11, g=0.6):
    t = t0
    while t < t1:
        d = 0.09; n = int(d * SR); tt = np.arange(n) / SR
        place(sfx, (hp_fast(noise(d), 600) * np.exp(-tt * 45) * 1.2 + np.pad(thunk(110, 0.06), (0, n - int(0.06 * SR))) * 0.8).astype(np.float32), t, g); t += 1 / rate
def stampede(t0, t1, g=0.4):
    t = t0; k = 0
    while t < t1:
        place(sfx, thunk(60 + (k % 5) * 9, 0.14), t, g * (0.6 + 0.4 * ((k * 7) % 3) / 2)); t += 0.045; k += 1
    place(sfx, rumble(t1 - t0), t0, g * 1.4)
def engine(t0, t1, g=0.35):
    d = t1 - t0; n = int(d * SR); tt = np.arange(n) / SR
    s = (np.mod(np.cumsum(np.full(n, 34.0)) / SR, 1) < 0.35).astype(np.float32); s = lp_fast(s * (0.7 + 0.3 * rng.random(n).astype(np.float32)), 400) * np.minimum(1, tt / 0.3) * np.minimum(1, (d - tt) / 0.4).clip(0)
    place(sfx, s * 2, t0, g)
def crickets(t0, t1, g=0.2):
    t = t0
    while t < t1:
        d = 0.05; n = int(d * SR); tt = np.arange(n) / SR
        for k in range(3): place(sfx, (np.sin(2 * np.pi * 4300 * tt) * np.exp(-tt * 60)).astype(np.float32), t + k * 0.06, g)
        t += 0.55
def drill(t0, t1, g=0.4):
    t = t0
    while t < t1: place(sfx, scrape(0.28), t, g); t += 0.3
def hiss(t0, d, g=0.4):
    n = int(d * SR); tt = np.arange(n) / SR; s = hp_fast(noise(d), 3500) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * tt)) * np.minimum(1, tt / 0.05) * np.minimum(1, (d - tt) / 0.1).clip(0)
    for k in range(int(d * 14)): i = int((k / 14 + rng.random() * 0.05) * SR); s[i:i + 300] += rng.standard_normal(min(300, n - i)).astype(np.float32) * 0.8 if i < n else 0
    place(sfx, s.astype(np.float32), t0, g)
def whistle_r(t0, d=1.4, g=0.3, f0=2400, f1=900):
    n = int(d * SR); tt = np.arange(n) / SR; f = f0 + (f1 - f0) * tt / d; s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) + hp_fast(noise(d), 2000) * 0.2 * np.sin(np.pi * tt / d)
    place(sfx, s.astype(np.float32), t0, g)
def volley(t0, g=0.8):
    place(sfx, crash(1.4), t0, g * 0.6); place(sfx, rumble(2.6), t0, g)
    for k in range(40): place(sfx, whoosh(0.5), t0 + rng.random() * 0.6, g * 0.18)
    hiss(t0, 2.0, g * 0.35)
    for k in range(6): whistle_r(t0 + 0.2 + k * 0.15, 1.6, g * 0.12, 2600 - k * 120, 800)
def march(t0, t1, g=0.4, step=0.36):
    t = t0; k = 0
    while t < t1: place(sfx, thunk(60 if k % 2 else 75, 0.22), t, g); place(sfx, (hp_fast(noise(0.08), 1500) * np.exp(-np.arange(int(0.08 * SR)) / SR * 40)).astype(np.float32), t, g * 0.4); t += step; k += 1
def wardrum(t0, t1, g=0.5):
    t = t0
    while t < t1: place(sfx, drum("kick"), t, g); place(sfx, drum("kick"), t + 0.18, g * 0.6); t += 0.9
def chirps(t0, t1, g=0.15):
    t = t0
    while t < t1:
        d = 0.12; n = int(d * SR); tt = np.arange(n) / SR; f = 3200 + 1400 * np.sin(np.pi * tt / d)
        place(sfx, (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d)).astype(np.float32), t, g); t += 0.45 + rng.random() * 0.5
def whistle3(t0, d=1.1, g=0.5):
    n = int(d * SR); t = np.arange(n) / SR; a = np.minimum(1, t / 0.06) * np.minimum(1, (d - t) / 0.2).clip(0)
    s = sum(np.sin(2 * np.pi * f * t + 0.004 * np.sin(2 * np.pi * 6 * t)) for f in (587, 740, 880)) / 3 + hp_fast(noise(d), 2000) * 0.15
    place(sfx, (s * a).astype(np.float32), t0, g)
def clack(t0, t1, g=0.45):
    t = t0
    while t < t1: place(sfx, thunk(160, 0.12), t, g); place(sfx, click(), t, g * 0.6); place(sfx, thunk(150, 0.12), t + 0.12, g * 0.8); place(sfx, click(), t + 0.12, g * 0.5); t += 0.55
def hum(t0, t1, g=0.3, f0=55):
    d = t1 - t0; n = int(d * SR); tt = np.arange(n) / SR; s = (np.sin(2 * np.pi * f0 * tt) + 0.4 * np.sin(2 * np.pi * f0 * 2.01 * tt)) * np.minimum(1, tt / 0.5) * np.minimum(1, (d - tt) / 0.5).clip(0)
    place(sfx, (s + lp_fast(noise(d), 300) * 0.4).astype(np.float32), t0, g)
def cicadas(t0, t1, g=0.12):
    d = t1 - t0; n = int(d * SR); tt = np.arange(n) / SR; s = hp_fast(noise(d), 4000) * (0.5 + 0.5 * np.sin(2 * np.pi * 38 * tt)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * tt)) * np.minimum(1, tt / 1.0) * np.minimum(1, (d - tt) / 1.0).clip(0)
    place(sfx, s.astype(np.float32), t0, g)
def groan(t0, d=1.6, g=0.4):
    n = int(d * SR); tt = np.arange(n) / SR; f = 70 + 30 * np.sin(2 * np.pi * 0.7 * tt); s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3 * np.sin(np.pi * tt / d)
    place(sfx, lp_fast(s.astype(np.float32), 900) + creak(d, 60) * 0.5, t0, g)
def rainbed(t0, t1, g=0.3):
    d = t1 - t0; n = int(d * SR); tt = np.arange(n) / SR; s = hp_fast(lp_fast(noise(d), 7000), 800) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.3 * tt)) * np.minimum(1, tt / 0.8) * np.minimum(1, (d - tt) / 0.8).clip(0)
    place(sfx, s.astype(np.float32), t0, g)
def flood(t0, d, g=0.5):
    n = int(d * SR); tt = np.arange(n) / SR; s = (lp_fast(noise(d), 500) * 1.2 + hp_fast(lp_fast(noise(d), 3000), 600) * 0.5) * np.minimum(1, tt / 0.4) * np.minimum(1, (d - tt) / 0.6).clip(0)
    place(sfx, s.astype(np.float32), t0, g)
def thunder(t0, g=0.7):
    place(sfx, crash(1.4), t0, g * 0.6); place(sfx, rumble(3.2), t0 + 0.05, g)
def birds(t0, t1, g=0.15):
    t = t0
    while t < t1:
        d = 0.14; n = int(d * SR); tt = np.arange(n) / SR; f = 2800 + 1800 * np.sin(np.pi * tt / d) * (1 if int(t * 7) % 2 else -0.4)
        place(sfx, (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d)).astype(np.float32), t, g); t += 0.3 + rng.random() * 0.6
def boom(t0, g=0.8): place(sfx, crash(1.4), t0, g * 0.6); place(sfx, rumble(3.0), t0, g)
def clank(t0, g=0.5): place(sfx, thunk(240, 0.12), t0, g); place(sfx, ting(), t0, g * 0.5)
def rattle(t0, t1, g=0.3):
    t = t0
    while t < t1: place(sfx, thunk(180, 0.06), t, g); t += 0.11

def buzz(t0, t1, g=0.3, f0=210):
    n = int((t1 - t0) * SR); t = np.arange(n) / SR
    s = np.zeros(n, np.float32)
    for k in range(4):
        f = f0 * (1 + 0.08 * k) * (1 + 0.04 * np.sin(2 * np.pi * (3 + k) * t + k))
        ph = np.cumsum(f) / SR; s += (np.mod(ph, 1) - 0.5) * (0.6 + 0.4 * np.sin(2 * np.pi * (0.7 + k * 0.3) * t + k))
    s = lp_fast(hp_fast(s.astype(np.float32), 150), 3000) * np.minimum(1, t / 0.3) * np.minimum(1, (t1 - t0 - t) / 0.3).clip(0)
    place(sfx, s.astype(np.float32), t0, g)
def drip():
    n = int(0.25 * SR); t = np.arange(n) / SR; f = 900 * np.exp(-t * 9) + 300
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * 0.6).astype(np.float32)
def smack():
    d = 0.4; n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 600) * np.exp(-t * 30) * 1.6 + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 25)).astype(np.float32)
def shing():
    n = int(1.0 * SR); t = np.arange(n) / SR
    return (hp_fast(noise(1.0), 4000) * np.exp(-t * 6) * 0.4 + sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 3) for f in (2600, 3900, 5200)) * 0.15).astype(np.float32)
def steps(t0, t1, step=0.42, g=0.4):
    tt = t0
    while tt < t1: place(sfx, thunk(70 + rng.uniform(0, 30), 0.18), tt, g); tt += step
def pop():
    n = int(0.15 * SR); t = np.arange(n) / SR; f = 400 + 900 * t / 0.15
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 20)).astype(np.float32)
def fanfare(t0, g=0.5):
    for k, (m, d) in enumerate([(62, 0.18), (62, 0.18), (62, 0.18), (67, 0.7)]):
        place(sfx, brass([midi(m), midi(m + 4), midi(m + 7)], d), t0 + k * 0.2, g)
def roar(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 700) * 1.5 + np.sin(2 * np.pi * np.cumsum(90 + 20 * np.sin(2 * np.pi * 7 * t)) / SR) * 0.4
    return (s * np.minimum(1, t / 0.05) * np.exp(-t * 1.8)).astype(np.float32)
# ---------------- music ----------------
play(0.0, 21.0, 0.75)
drone(21.1, 33.7, 0.16)
play(33.8, DUR, 0.8)
def honk(t0, g=0.4):
    d = 0.5; n = int(d * SR); tt = np.arange(n) / SR; s = (np.sign(np.sin(2 * np.pi * 220 * tt)) + np.sign(np.sin(2 * np.pi * 277 * tt))) * 0.25 * np.minimum(1, tt / 0.02) * np.minimum(1, (d - tt) / 0.05).clip(0)
    place(sfx, lp_fast(s.astype(np.float32), 2000), t0, g)
def slosh(t0, d=1.2, g=0.4):
    n = int(d * SR); tt = np.arange(n) / SR; s = lp_fast(noise(d), 700) * (0.5 + 0.5 * np.sin(2 * np.pi * 2.2 * tt)) * np.sin(np.pi * tt / d)
    place(sfx, s.astype(np.float32), t0, g)
def screech(t0, d=1.6, g=0.35):
    n = int(d * SR); tt = np.arange(n) / SR; f = 1900 + 300 * np.sin(2 * np.pi * 7 * tt); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + hp_fast(noise(d), 2500) * 0.3
    place(sfx, (s * np.minimum(1, tt / 0.05) * np.minimum(1, (d - tt) / 0.3).clip(0)).astype(np.float32), t0, g)
# ---------------- sfx ----------------
hiss(0.0, 3.2, 0.3)
for k in range(8): place(sfx, click(), 0.2 + k * 0.35, 0.15)
for k in range(5): place(sfx, pop(), 3.35 + k * 0.16, 0.3)
place(sfx, whoosh(1.0), 4.3, 0.4); place(sfx, sting(), 6.1, 0.3); place(sfx, boing(), 6.7, 0.3)
for k in range(5): place(sfx, thunk(160, 0.12), 7.5 + k * 0.3, 0.35); place(sfx, click(), 7.55 + k * 0.3, 0.3)
place(sfx, scrape(0.6), 9.4, 0.2); engine(11.9, 14.1, 0.3); honk(12.6, 0.3)
place(sfx, whoosh(0.8), 14.2, 0.35); place(sfx, ting(), 16.3, 0.3); place(sfx, ting(), 17.2, 0.3)
for k in range(6): place(sfx, thunk(220, 0.1), 18.6 + k * 0.15, 0.2)
wind(21.1, 33.7, 0.25); engine(21.1, 25.2, 0.35); place(sfx, rumble(2.0), 23.9, 0.6); place(sfx, crash(1.2), 24.4, 0.4)
screech(25.2, 1.8, 0.35); place(sfx, thunk(60, 0.5), 27.3, 0.5); place(sfx, creak(0.8, 70), 27.4, 0.35)
screech(29.2, 2.4, 0.3); slosh(29.4, 2.0, 0.4); place(sfx, crash(0.8), 31.9, 0.4)
for k in range(6): place(sfx, ting(), 32.0 + k * 0.1, 0.05)
place(sfx, whoosh(0.6), 33.8, 0.35); place(sfx, pop(), 34.5, 0.3)
place(sfx, thunk(70, 0.4), 38.1, 0.5); slosh(38.2, 1.4, 0.5)
slosh(39.6, 2.3, 0.6); place(sfx, rumble(1.2), 40.5, 0.4); place(sfx, crash(1.0), 42.4, 0.5); place(sfx, thunk(50, 0.5), 42.4, 0.6)
for k in range(8): place(sfx, splash(0.3), 44.4 + k * 0.28, 0.2)
place(sfx, ting(), 47.2, 0.35); place(sfx, pop(), 48.6, 0.3); fanfare(49.0, 0.35); hiss(50.4, 1.7, 0.25)

def save(name, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(name, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
pk = max(np.abs(music).max(), np.abs(sfx).max(), 1e-9)
save("music.wav", music / pk * 0.9); save("sfx.wav", sfx / pk * 0.9)
print("stems ok", DUR)
