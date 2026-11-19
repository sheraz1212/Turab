"""Synthesises the Cu Chi SFX bed (same cues as the Blender finish.ps1) into public/cuchi_sfx.wav."""
import numpy as np, wave, sys
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 1524 / 24
rng = np.random.default_rng(7)

def noise(color, d):
    n = int(d * SR)
    w = rng.standard_normal(n)
    if color == 'white':
        return w * 0.3
    if color == 'brown':
        b = np.cumsum(w); b -= np.convolve(b, np.ones(2000) / 2000, mode='same'); return b / (np.abs(b).max() + 1e-9)
    f = np.fft.rfft(w); f /= np.sqrt(np.arange(1, len(f) + 1)); p = np.fft.irfft(f, n); return p / (np.abs(p).max() + 1e-9)

def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def bp(x, f, w): return sosfilt(butter(2, [max(20, f - w / 2), f + w / 2], 'band', fs=SR, output='sos'), x)
def fade(x, fin=0.0, fout_st=None, fout=0.0):
    n = len(x); t = np.arange(n) / SR; g = np.ones(n)
    if fin: g *= np.clip(t / fin, 0, 1)
    if fout: st = fout_st if fout_st is not None else (n / SR - fout); g *= np.clip(1 - (t - st) / fout, 0, 1)
    return x * g
def sine(f, d): return np.sin(2 * np.pi * f * np.arange(int(d * SR)) / SR)

boom = fade(lp(noise('brown', 3), 160), fout_st=0.2, fout=2.8) * 1.2
boom[: int(0.25 * SR)] += fade(lp(noise('white', 0.25), 2500), fout_st=0, fout=0.25) * 0.8
bed = lp(noise('pink', DUR), 900) * 0.045
scrape = fade(lp(hp(noise('white', 0.12), 400), 3000), fout_st=0, fout=0.12) * 0.8
step = fade(lp(noise('brown', 0.09), 300), fout_st=0, fout=0.09) * 0.5
thud = fade(lp(noise('brown', 0.35), 220), fout_st=0, fout=0.35) * 0.9
rustle = fade(hp(noise('white', 0.9), 1500), fin=0.2, fout_st=0.4, fout=0.5) * 0.25
crickets = fade(sine(4200, 5.0) * (0.5 + 0.5 * np.sin(2 * np.pi * 28 * np.arange(int(5 * SR)) / SR)), fin=0.8) * 0.05
whoosh = fade(bp(noise('pink', 2.0), 900, 600), fin=0.4, fout_st=1.2, fout=0.8) * 0.8
hiss = fade(hp(noise('white', 4.0), 2500), fin=0.6, fout_st=3.0, fout=1.0) * 0.18
splash = fade(lp(noise('pink', 1.2), 1200) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * np.arange(int(1.2 * SR)) / SR)), fout_st=0.4, fout=0.8) * 0.9
chord = fade((sine(196, 4) + sine(247, 4) + sine(294, 4)) / 3, fin=0.3, fout_st=1.5, fout=2.5) * 0.5
swell = fade((sine(110, 2.5) + sine(165, 2.5)) / 2, fin=0.6, fout_st=1.2, fout=1.3) * 0.45

S = {'boom': boom, 'bed': bed, 'scrape': scrape, 'step': step, 'thud': thud, 'rustle': rustle, 'crickets': crickets,
     'whoosh': whoosh, 'hiss': hiss, 'splash': splash, 'chord': chord, 'swell': swell}
cues = [('boom', 0.25, 1.0), ('boom', 10.42, 1.15), ('bed', 0, 1.0), ('thud', 7.1, 1.0), ('rustle', 7.25, 1.0), ('crickets', 18.2, 1.0)]
def rng_cues(name, a, b, st, v):
    s = a
    while s < b:
        cues.append((name, round(s, 2), v)); s += st
rng_cues('scrape', 1.3, 6.0, 0.29, 0.45); rng_cues('scrape', 11.9, 15.4, 0.29, 0.4); rng_cues('scrape', 16.8, 18.3, 0.25, 0.4)
rng_cues('step', 2.45, 7.2, 0.25, 0.6); rng_cues('step', 7.45, 11.2, 0.25, 0.7); rng_cues('step', 19.6, 22.7, 0.25, 0.35)
cues += [('whoosh', 28.3, 1.0), ('whoosh', 29.0, 0.8), ('hiss', 31.0, 1.0), ('hiss', 34.0, 0.8), ('hiss', 37.7, 1.2), ('splash', 41.9, 1.0),
         ('whoosh', 45.5, 0.6), ('swell', 51.0, 1.0), ('thud', 55.4, 1.0), ('chord', 59.4, 1.0)]
rng_cues('scrape', 40.6, 41.9, 0.29, 0.4); rng_cues('scrape', 45.2, 50.0, 0.6, 0.35)
rng_cues('step', 55.8, 58.8, 0.42, 0.8); rng_cues('step', 59.2, 63.3, 0.25, 0.4)

mix = np.zeros(int(DUR * SR) + SR)
for name, t, v in cues:
    x = S[name] * v; i = int(t * SR); mix[i:i + len(x)] += x[: len(mix) - i]
mix = mix[: int(DUR * SR)]
mix = np.tanh(mix * 1.1) * 0.9
pcm = (np.stack([mix, mix], 1) * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', len(mix) / SR)
