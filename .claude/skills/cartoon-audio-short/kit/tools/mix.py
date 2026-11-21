"""Level-locked mix: voice untouched, music bed at exactly 50 % of the voice (-6 dB gated RMS),
SFX at 50 % with peaks capped at 0.7x the voice peak. Writes mix_raw.wav for finish.sh.

Usage: python3 mix.py voice.mp3 music.wav sfx.wav [--out mix_raw.wav] [--sfx-db -6]
- No ducking, no compression: one gain per stem, then one linear gain + peak limiter on the whole mix,
  so the music/voice ratio stays exactly as set.
- Prints the measured levels so the ratio can be confirmed (music -6.0 dB vs voice, SFX <= -6 dB).
"""
import argparse, subprocess, wave
import numpy as np

SR = 48000

def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)

def gated_rms(x, block=0.4, hop=0.1, abs_gate_db=-60.0, rel_gate_db=-20.0):
    """RMS over 400 ms blocks, ignoring silence: absolute gate, then a relative gate under the mean (like EBU R128)."""
    b, h = int(block * SR), int(hop * SR)
    if len(x) < b:
        return float(np.sqrt(np.mean(x ** 2) + 1e-20))
    p = np.array([np.mean(x[i:i + b] ** 2) for i in range(0, len(x) - b + 1, h)])
    p = p[p > 10 ** (abs_gate_db / 10)]
    if p.size == 0:
        return 1e-10
    p = p[p > np.mean(p) * 10 ** (rel_gate_db / 10)]
    return float(np.sqrt(np.mean(p)))

def db(v):
    return 20 * np.log10(max(v, 1e-12))

def fit(x, n):
    return x[:n] if len(x) >= n else np.pad(x, (0, n - len(x)))

ap = argparse.ArgumentParser()
ap.add_argument("voice"); ap.add_argument("music"); ap.add_argument("sfx")
ap.add_argument("--out", default="mix_raw.wav")
ap.add_argument("--music-db", type=float, default=-6.0, help="music level vs voice (gated RMS)")
ap.add_argument("--sfx-db", type=float, default=-6.0, help="SFX level vs voice (gated RMS), 50 % or less")
a = ap.parse_args()

voice = load(a.voice); N = len(voice)
music = fit(load(a.music), N); sfx = fit(load(a.sfx), N)
v_rms, v_peak = gated_rms(voice), float(np.max(np.abs(voice)) + 1e-12)

m_rms = gated_rms(music)
g_music = (v_rms * 10 ** (a.music_db / 20)) / m_rms if m_rms > 1e-9 else 0.0
music *= g_music

s_rms = gated_rms(sfx)
g_sfx = (v_rms * 10 ** (a.sfx_db / 20)) / s_rms if s_rms > 1e-9 else 0.0
sfx *= g_sfx
cap = 0.7 * v_peak                     # no SFX hit may poke out over the narration
sp = float(np.max(np.abs(sfx)) + 1e-12)
if sp > cap:
    sfx *= cap / sp

mix = voice + music + sfx
# one linear gain so the mix peak sits at -1 dBFS, then a soft peak limiter for any stragglers
peak = float(np.max(np.abs(mix)) + 1e-12)
mix *= min(1.0, 10 ** (-1 / 20) / peak)
lim = 10 ** (-1 / 20)
over = np.abs(mix) > lim
mix[over] = np.sign(mix[over]) * (lim + (1 - lim) * np.tanh((np.abs(mix[over]) - lim) / (1 - lim)))
fade = int(0.04 * SR); mix[-fade:] *= np.linspace(1, 0, fade)

pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open(a.out, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

print(f"voice  gated RMS {db(v_rms):6.1f} dBFS   peak {db(v_peak):6.1f} dBFS")
print(f"music  vs voice  {db(gated_rms(music)) - db(v_rms):+6.1f} dB   (target {a.music_db:+.1f})")
print(f"sfx    vs voice  {db(gated_rms(sfx)) - db(v_rms):+6.1f} dB   (target <= {a.sfx_db:+.1f}), peak {db(np.max(np.abs(sfx))) - db(v_peak):+.1f} dB vs voice peak")
print(f"wrote {a.out}  {N / SR:.2f} s")
