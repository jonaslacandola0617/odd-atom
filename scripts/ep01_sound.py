"""Episode 1 sound: original score, foley, broadcast voice treatment and mix.

Inputs: voice lines from scripts/ep01_voice.py, src/data/ep01-moon-timeline.json,
Curio library cues (user-authorised).  Everything else is synthesised here
(seeded).  Outputs stems, mix.m4a and PROVENANCE.json under
public/assets/audio/ep01-moon/.  Run: python3 scripts/ep01_sound.py
"""
import hashlib, json, subprocess, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep01-moon'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep01-moon-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(DUR * SR)
T = np.arange(N) / SR
rng = np.random.default_rng(1042)
LINES = {l['id']: l for l in TL['lines']}


def db(x):
    return 10 ** (x / 20)


def st(x):
    return np.stack([x, x], 1) if x.ndim == 1 else x


def fft_filter(x, lo=None, hi=None, sr=SR, slope=1.0):
    """Zero-phase band filter with smooth (Butterworth-like) magnitude."""
    x = np.asarray(x, np.float64)
    if x.ndim == 2:
        return np.stack([fft_filter(x[:, c], lo, hi, sr, slope) for c in range(x.shape[1])], 1)
    n = len(x)
    f = np.fft.rfftfreq(n, 1 / sr)
    X = np.fft.rfft(x)
    g = np.ones_like(f)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** (4 * slope))
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (4 * slope))
    return np.fft.irfft(X * g, n)


def reverb(x, seconds, wet, seed, bright=6000):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)], 1) * np.exp(-6.9 * t / seconds)[:, None]
    ir = fft_filter(ir, hi=bright)
    ir /= np.sqrt((ir ** 2).sum() / 2)
    x = st(x)
    m = 1 << int(np.ceil(np.log2(len(x) + n)))
    out = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], m) * np.fft.rfft(ir[:, c], m), m)[: len(x)] for c in range(2)], 1)
    return x * (1 - wet) + out * wet


def place(bus, clip, at, gain=0.0):
    i = int(at * SR)
    if i >= len(bus):
        return
    clip = st(clip)
    n = min(len(clip), len(bus) - i)
    bus[i:i + n] += clip[:n] * db(gain)


def env(points):
    xs, ys = zip(*points)
    return np.interp(T, xs, ys)


def load_wav(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f64le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float64).copy()


USED = {}


def lib(name):
    path = next(LIB.rglob(f'*_{name}_v1.flac'))
    USED[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f64le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float64).reshape(-1, 2).copy()


def write(path, x):
    x = np.clip(st(x), -1, 1)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())


def tone(freqs, dur, amps=None, decay=None, phase=0.0):
    t = np.arange(int(dur * SR)) / SR
    amps = amps or [1] * len(freqs)
    y = sum(a * np.sin(2 * np.pi * f * t + phase) for f, a in zip(freqs, amps))
    if decay:
        y *= np.exp(-t / decay)
    return y


def plus(*xs):
    n = max(len(x) for x in xs)
    return sum(np.pad(x, (0, n - len(x))) for x in xs)


def fade(x, a=0.01, b=0.01):
    n = len(x)
    e = np.ones(n)
    ia, ib = int(a * SR), int(b * SR)
    if ia:
        e[:ia] = np.linspace(0, 1, ia)
    if ib:
        e[-ib:] = np.linspace(1, 0, ib)
    return x * e if x.ndim == 1 else x * e[:, None]


TV_DIES = 68.9
BLACK = 78.6
OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in LINES.items():
    v = load_wav(OUT / 'voice' / f'{lid}.wav')
    v /= np.abs(v).max() + 1e-9
    if lid in ('l11', 'l12'):
        # the broadcast is now outside the window: muffled through glass, big space
        v = fft_filter(v, lo=180, hi=950)
        v = np.tanh(v * 1.2)
        v = reverb(v, 2.2, 0.55, seed=11, bright=2500)
        v[:, 1] = np.roll(v[:, 1], int(0.012 * SR))
        place(voice, v, l['start'], gain=-5)
    else:
        # small TV speaker in a quiet room
        v = fft_filter(v, lo=300, hi=3300, slope=1.5)
        v = np.tanh(v * 1.8) / np.tanh(1.8)
        v = reverb(v, 0.45, 0.16, seed=7, bright=4000)
        place(voice, v, l['start'], gain=-2)
write(OUT / 'stem-voice.wav', voice)

# ------------------------------------------------------------------ broadcast: SAME burst, attention tone, TV hum, static
bc = np.zeros((N, 2))
# SAME-style FSK header burst (mark 2083.3 Hz / space 1562.5 Hz at 520.83 baud)
bits = rng.integers(0, 2, int(0.42 * 520.83))
fsk = np.concatenate([np.sin(2 * np.pi * (2083.3 if b else 1562.5) * np.arange(int(SR / 520.83)) / SR) for b in bits])
place(bc, fade(fft_filter(fsk, lo=300, hi=3300) * 0.5, 0.005, 0.01), 0.05)
att = tone([853, 960], 2.75) * 0.32
place(bc, fade(fft_filter(np.tanh(att * 2), lo=300, hi=3300), 0.01, 0.03), 0.55)
hum = (np.sin(2 * np.pi * 60 * T) * 0.5 + np.sin(2 * np.pi * 120 * T) * 0.3 + np.sin(2 * np.pi * 180 * T) * 0.15) * 0.012
hiss = fft_filter(rng.standard_normal(N), lo=2500, hi=9000) * 0.006
tv_on = env([(0, 1), (TV_DIES - 0.01, 1), (TV_DIES, 0), (DUR, 0)])
bc += st((hum + hiss) * tv_on)
# picture roll + static as it dies
roll = fft_filter(rng.standard_normal(int(1.5 * SR)), lo=400, hi=7000) * np.linspace(0.05, 0.22, int(1.5 * SR))
place(bc, roll, 67.4)
# CRT power-off: thunk + collapsing whine
t = np.arange(int(0.6 * SR)) / SR
off = np.sin(2 * np.pi * (2400 * np.exp(-t * 18) + 60) * t) * np.exp(-t * 7) * 0.18 + fft_filter(rng.standard_normal(len(t)), hi=250) * np.exp(-t * 14) * 0.6
place(bc, off, TV_DIES)
write(OUT / 'stem-broadcast.wav', bc)

# ------------------------------------------------------------------ score (original)
mus = np.zeros((N, 2))
# low drone D1 + A1 with slow beating, rising across the film
drone = np.sin(2 * np.pi * 36.71 * T) + 0.7 * np.sin(2 * np.pi * 36.95 * T) + 0.6 * np.sin(2 * np.pi * 55.0 * T) + 0.25 * np.sin(2 * np.pi * 73.4 * T + 1)
d_env = env([(0, 0.0), (3.5, 0.35), (16, 0.45), (34, 0.6), (49.6, 0.8), (50.0, 0.0), (50.4, 0.0), (50.5, 1.0), (55.6, 0.45), (67.2, 0.6), (TV_DIES, 0.15), (73.6, 0.35), (76.7, 0.4), (BLACK - 0.02, 1.2), (BLACK, 0), (DUR, 0)])
mus += st(drone * d_env * 0.09)


def saw(f, t):
    return sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 7))


# dissonant cluster pad: D3 Eb3 A3 (+ G#3 tritone later)
pad = saw(146.83, T) + saw(155.56, T) * 0.9 + saw(220.0, T) * 0.7 + saw(207.65, T) * env([(0, 0), (50, 0), (54.4, 0.9), (DUR, 0.9)])
pad = fft_filter(pad, lo=90, hi=1100)
lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * T)
p_env = env([(0, 0), (16, 0), (19, 0.25), (25.6, 0.15), (34.2, 0.2), (41.4, 0.5), (46.4, 0.6), (49.6, 0.9), (50.0, 0.0), (54.4, 0.0), (54.45, 1.3), (55.6, 0.55), (60.6, 0.45), (67.2, 0.75), (TV_DIES, 0.0), (73.6, 0.0), (76.7, 0.2), (BLACK - 0.02, 1.1), (BLACK, 0), (DUR, 0)])
pad_st = np.stack([pad, np.roll(pad, int(0.017 * SR))], 1) * (p_env * lfo * 0.022)[:, None]
mus += reverb(pad_st, 3.5, 0.45, seed=3, bright=2500)


# music-box lullaby motif (inharmonic bell partials), distant
def bell(f, dur=2.2, a=1.0):
    return tone([f, f * 2.76, f * 5.4, f * 8.93], dur, [1, 0.45, 0.22, 0.08], decay=0.55) * a


motif = [880.0, 698.46, 587.33, 554.37, 587.33, 0, 523.25, 440.0]
box = np.zeros((N, 2))
for start, rate, detune, gain in [(8.7, 0.48, 1.0, 1.0), (60.8, 0.78, 0.944, 0.55)]:
    for i, f in enumerate(motif):
        if f:
            wob = 1 + 0.004 * np.sin(i * 1.7)
            place(box, bell(f * detune * wob, a=gain), start + i * rate)
box = reverb(fft_filter(box, lo=300, hi=5000), 2.8, 0.6, seed=5, bright=5000)
mus += box * 0.05
# reversed swell into the doorway reveal, then silence, then the hit
swell = fft_filter(rng.standard_normal(int(2.0 * SR)), lo=200, hi=5000) * np.linspace(0, 1, int(2.0 * SR)) ** 3
place(mus, reverb(swell * 0.12, 1.5, 0.5, seed=9), 47.6)
mus[int(49.95 * SR):int(50.4 * SR)] *= 0.05
# tinnitus over the reveal of the light
tin = np.sin(2 * np.pi * 7400 * T) * env([(0, 0), (54.4, 0), (55.5, 0.012), (60.5, 0.012), (60.6, 0), (DUR, 0)])
mus += st(tin)
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ foley and effects
fx = np.zeros((N, 2))


def swish(dur, lo=900, hi=4200, gain=1.0):
    n = int(dur * SR)
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return fft_filter(rng.standard_normal(n), lo=lo, hi=hi) * e * 0.3 * gain


def rings(dur, count, gain=1.0):
    out = np.zeros(int((dur + 0.3) * SR))
    for k in range(count):
        at = int((k / count) * dur * SR + rng.integers(0, int(0.02 * SR)))
        tt = np.arange(int(0.12 * SR)) / SR
        c = sum(np.sin(2 * np.pi * f * tt) * a for f, a in [(2380, 1), (3910, 0.6), (5620, 0.35)]) * np.exp(-tt * 45)
        out[at:at + len(c)] += c[: len(out) - at] * 0.15 * gain
    return out


def step(gain=1.0):
    n = int(0.09 * SR)
    tt = np.arange(n) / SR
    return (fft_filter(rng.standard_normal(n), lo=200, hi=2200) * np.exp(-tt * 45) * 0.5 + np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 40) * 0.4) * gain


def cricket_bed(t0, t1, gain=1.0):
    t = np.arange(int((t1 - t0) * SR)) / SR
    chirp = np.sin(2 * np.pi * 4300 * t) * (np.sin(2 * np.pi * 28 * t) > 0.2) * ((t % 0.82) < 0.16)
    chirp2 = np.sin(2 * np.pi * 4650 * t) * (np.sin(2 * np.pi * 31 * t) > 0.3) * (((t + 0.37) % 0.95) < 0.14)
    c = np.stack([chirp, chirp2 * 0.8], 1) * 0.012 * gain
    return fade(c, 0.4, 0.05)


# crickets in every exterior shot... until the yard, where they have stopped
for t0, t1 in [(8.6, 12.1), (16.0, 19.8), (22.6, 25.6)]:
    place(fx, cricket_bed(t0, t1, 0.7 if t0 == 16.0 else 1.0), t0)
# neighbours' curtains (distant, through glass)
for at in (16.6, 17.6, 18.7):
    place(fx, fft_filter(plus(swish(0.7), rings(0.6, 6, 0.6)), hi=1500), at, -10)
# our curtains: close, both panels
place(fx, plus(swish(1.6, gain=1.2), rings(1.4, 14)), 20.2, -2)
# neighbour hurrying: footsteps, then a door shut
for k in range(7):
    place(fx, step(0.6), 22.75 + k * 0.33, -8)
place(fx, lib('steel_latch'), 24.85, -14)
place(fx, fft_filter(step(1.5), hi=400), 24.95, -6)
# phone buzz on the wooden table, twice; then flipped face down
for at in (26.15, 26.95):
    n = int(0.45 * SR)
    tt = np.arange(n) / SR
    buzz = np.sign(np.sin(2 * np.pi * 172 * tt)) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt)) * np.sin(np.linspace(0, np.pi, n)) ** 0.3
    place(fx, fft_filter(buzz, lo=120, hi=2500) * 0.12, at)
place(fx, plus(step(0.8), fft_filter(rng.standard_normal(int(0.03 * SR)), lo=1500) * 0.2), 30.65, -3)
# wall clock ticking indoors (continues through the silence after the TV dies)
inside = [(4.6, 8.6), (12.1, 16.0), (19.8, 22.6), (25.6, 41.4), (46.4, 54.4), (60.6, BLACK)]
for a, b in inside:
    k = np.ceil(a)
    while k < b:
        tk = np.arange(int(0.03 * SR)) / SR
        tick = np.sin(2 * np.pi * (2900 if int(k) % 2 else 2500) * tk) * np.exp(-tk * 220) * 0.05
        place(fx, tick, k)
        k += 1.0
# kitchen floor creak on the way to the back door
place(fx, lib('wood_stress'), 36.1, -13)
# heartbeat as we see him
place(fx, lib('heartbeat_breath'), 38.2, -11)
place(fx, lib('heartbeat_breath'), 40.0, -9)
# the yard: no crickets, only low wind
wind = lib('cavern_lowwind')
place(fx, fade(wind[: int(5.0 * SR)], 0.3, 0.6), 41.4, -6)
# the handle turns, latch, slow hinge, outside air
place(fx, lib('steel_latch'), 46.95, -4)
place(fx, lib('heavy_hinge'), 47.65, -5)
place(fx, swish(2.2, lo=150, hi=900, gain=1.2), 47.7, -6)
# he is in the doorway: hit on the cut
place(fx, lib('low_cinematic_hit'), 50.4, -1)
# the light over the rooftops
place(fx, lib('restrained_boom'), 54.4, -2)
# he leans closer behind her
place(fx, lib('wood_stress'), 63.4, -9)
place(fx, lib('heartbeat_breath'), 64.2, -12)
# outside the window: one soft tap on the glass under the last line
place(fx, fft_filter(step(0.5), lo=800, hi=4000), 75.6, -10)
# cut to black: full silence, then the curtain rings slide open
place(fx, plus(fft_filter(swish(1.1, gain=1.0), hi=3500), rings(0.9, 10, 1.2)), 79.55, -1)
# room tone (cuts out with the TV; returns thinner)
room = fft_filter(rng.standard_normal(N), lo=60, hi=500) * 0.004 * env([(0, 1), (BLACK - 0.01, 1), (BLACK, 0), (DUR, 0)])
fx += st(room)
fx[int(BLACK * SR):int(79.5 * SR)] = 0
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ mix
mix = voice + bc + mus + fx
mix[int(BLACK * SR):int(79.5 * SR)] *= 0.0
mix = fade(mix, 0.0, 0.25)
peak = np.abs(mix).max()
mix *= db(-1.0) / peak
write(OUT / 'mix.wav', mix)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(OUT / 'mix.wav'), '-c:a', 'aac', '-b:a', '192k', str(OUT / 'mix.m4a')], check=True)
(OUT / 'mix.wav').unlink()
for stem in OUT.glob('stem-*.wav'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(stem), '-c:a', 'flac', str(stem.with_suffix('.flac'))], check=True)
    stem.unlink()
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep01DoNotLookAtTheMoon',
    'duration_seconds': DUR,
    'voice': TL['voice'] + '; TV-speaker band-pass + saturation + small room (l01-l10); muffled glass + large outdoor space (l11-l12)',
    'original_synthesis': [
        'SAME-style FSK header burst and 853+960 Hz attention tone (generic EAS signal design)',
        'score: D1/A1 beating drone, D3-Eb3-A3(+G#3) cluster pad, inharmonic music-box motif (normal, then slower and flatter)',
        'reversed swell, tinnitus tone, TV hum/hiss/roll static/CRT power-off',
        'foley: curtain rings and fabric, footsteps, phone buzz, wall clock, crickets (absent in the yard), glass tap',
    ],
    'library_cues': USED,
    'normalised_peak_dbfs': -1.0,
    'listening_pass': 'not performed (no audio audition in this runtime)',
}, indent=2) + '\n')
print('ok', DUR)
