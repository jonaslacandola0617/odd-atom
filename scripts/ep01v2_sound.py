"""Episode 1 VIRAL CUT (v2) sound: hook tone at frame 0, tighter score/foley map and a
seamless loop (the end flows back into the opening tone).  Same synthesis tools as v1.

Inputs: voice lines from scripts/ep01_voice.py, src/data/ep01-moon-timeline.json,
Curio library cues (user-authorised).  Everything else is synthesised here
(seeded).  Outputs stems, mix.m4a and PROVENANCE.json under
public/assets/audio/ep01-moon/.  Run: python3 scripts/ep01_sound.py
"""
import hashlib, json, subprocess, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep01-moon-v2'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep01-moon-v2-timeline.json').read_text())
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


TV_DIES = 39.4
BLACK = 46.4
LOOP_ON = 48.2
RINGS = 47.25
OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in LINES.items():
    v = load_wav(OUT / 'voice' / f'{lid}.wav')
    v /= np.abs(v).max() + 1e-9
    if lid in ('l08', 'l09'):
        v = fft_filter(v, lo=180, hi=950)
        v = np.tanh(v * 1.2)
        v = reverb(v, 2.2, 0.55, seed=11, bright=2500)
        v[:, 1] = np.roll(v[:, 1], int(0.012 * SR))
        place(voice, v, l['start'], gain=-4)
    else:
        v = fft_filter(v, lo=300, hi=3300, slope=1.5)
        v = np.tanh(v * 1.8) / np.tanh(1.8)
        v = reverb(v, 0.45, 0.16, seed=7, bright=4000)
        place(voice, v, l['start'], gain=-1.5)
write(OUT / 'stem-voice.wav', voice)

# ------------------------------------------------------------------ broadcast
bc = np.zeros((N, 2))
# HOOK: the attention tone hits on frame 0 (short, loud), voice comes in under its tail
att = tone([853, 960], 0.62) * 0.24
place(bc, fade(fft_filter(np.tanh(att * 2.2), lo=300, hi=3300), 0.004, 0.08), 0.0)
tv_on = env([(0, 1), (TV_DIES - 0.01, 1), (TV_DIES, 0), (LOOP_ON + 0.1, 0), (LOOP_ON + 0.14, 1), (DUR, 1)])
hum = (np.sin(2 * np.pi * 60 * T) * 0.5 + np.sin(2 * np.pi * 120 * T) * 0.3 + np.sin(2 * np.pi * 180 * T) * 0.15) * 0.012
hiss = fft_filter(rng.standard_normal(N), lo=2500, hi=9000) * 0.006
bc += st((hum + hiss) * tv_on)
roll = fft_filter(rng.standard_normal(int(0.6 * SR)), lo=400, hi=7000) * np.linspace(0.05, 0.25, int(0.6 * SR))
place(bc, roll, 38.8)
t = np.arange(int(0.6 * SR)) / SR
off = np.sin(2 * np.pi * (2400 * np.exp(-t * 18) + 60) * t) * np.exp(-t * 7) * 0.18 + fft_filter(rng.standard_normal(len(t)), hi=250) * np.exp(-t * 14) * 0.6
place(bc, off, TV_DIES)
# the dead TV turns itself back on: a SAME-style data burst in the dark, then the CRT power-on
bits = rng.integers(0, 2, int(0.38 * 520.83))
fsk = np.concatenate([np.sin(2 * np.pi * (2083.3 if b else 1562.5) * np.arange(int(SR / 520.83)) / SR) for b in bits])
place(bc, fade(fft_filter(fsk, lo=300, hi=3300) * 0.32, 0.005, 0.01), 47.75)
t = np.arange(int(0.5 * SR)) / SR
on = fft_filter(rng.standard_normal(len(t)), lo=200) * np.exp(-t * 30) * 0.25 + np.sin(2 * np.pi * (80 + 3000 * (1 - np.exp(-t * 9))) * t) * np.exp(-t * 6) * 0.06
place(bc, on, LOOP_ON)
write(OUT / 'stem-broadcast.wav', bc)

# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
drone = np.sin(2 * np.pi * 36.71 * T) + 0.7 * np.sin(2 * np.pi * 36.95 * T) + 0.6 * np.sin(2 * np.pi * 55.0 * T) + 0.25 * np.sin(2 * np.pi * 73.4 * T + 1)
# starts already playing (0.35) and ends at the same level so the loop is seamless
d_env = env([(0, 0.35), (17, 0.55), (28.2, 0.8), (28.5, 0.0), (28.6, 0.0), (28.65, 0.8), (28.8, 0.45), (30.3, 0.45), (31.8, 0.9), (32.8, 0.45), (38.6, 0.6), (TV_DIES, 0.15), (43.4, 0.35), (45.7, 0.4), (BLACK - 0.02, 1.2), (BLACK, 0), (LOOP_ON, 0), (LOOP_ON + 0.3, 0.35), (DUR, 0.35)])
mus += st(drone * d_env * 0.09)


def saw(f, t):
    return sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 7))


pad = saw(146.83, T) + saw(155.56, T) * 0.9 + saw(220.0, T) * 0.7 + saw(207.65, T) * env([(0, 0), (31.0, 0), (31.8, 0.9), (46.4, 0.9), (46.5, 0), (DUR, 0)])
pad = fft_filter(pad, lo=90, hi=1100)
lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * T)
p_env = env([(0, 0.15), (3.9, 0.25), (12.4, 0.15), (17, 0.25), (22.6, 0.45), (25.6, 0.55), (28.2, 0.9), (28.5, 0.0), (31.8, 0.0), (31.85, 1.3), (32.9, 0.55), (35.6, 0.45), (38.6, 0.7), (TV_DIES, 0.0), (43.4, 0.0), (45.7, 0.2), (BLACK - 0.02, 1.1), (BLACK, 0), (LOOP_ON, 0), (DUR, 0.15)])
pad_st = np.stack([pad, np.roll(pad, int(0.017 * SR))], 1) * (p_env * lfo * 0.022)[:, None]
mus += reverb(pad_st, 3.5, 0.45, seed=3, bright=2500)


def bell(f, dur=2.2, a=1.0):
    return tone([f, f * 2.76, f * 5.4, f * 8.93], dur, [1, 0.45, 0.22, 0.08], decay=0.55) * a


motif = [880.0, 698.46, 587.33, 554.37, 587.33, 0, 523.25, 440.0]
box = np.zeros((N, 2))
for start, rate, detune, gain in [(4.9, 0.42, 1.0, 0.9), (35.7, 0.62, 0.944, 0.55)]:
    for i, f in enumerate(motif):
        if f:
            place(box, bell(f * detune * (1 + 0.004 * np.sin(i * 1.7)), a=gain), start + i * rate)
box = reverb(fft_filter(box, lo=300, hi=5000), 2.8, 0.6, seed=5, bright=5000)
mus += box * 0.05
swell = fft_filter(rng.standard_normal(int(2.0 * SR)), lo=200, hi=5000) * np.linspace(0, 1, int(2.0 * SR)) ** 3
place(mus, reverb(swell * 0.12, 1.5, 0.5, seed=9), 26.6)
mus[int(28.15 * SR):int(28.6 * SR)] *= 0.05
tin = np.sin(2 * np.pi * 7400 * T) * env([(0, 0), (31.8, 0), (32.6, 0.012), (35.5, 0.012), (35.6, 0), (DUR, 0)])
mus += st(tin)
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ foley
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
    return fade(np.stack([chirp, chirp2 * 0.8], 1) * 0.012 * gain, 0.3, 0.05)


# crickets outside the window; in the yard they have stopped
place(fx, cricket_bed(3.9, 6.2, 0.8), 3.9)
for at in (4.1, 4.8, 5.5):
    place(fx, fft_filter(plus(swish(0.6), rings(0.5, 6, 0.6)), hi=1500), at, -10)
place(fx, plus(swish(1.5, gain=1.2), rings(1.3, 14)), 6.5, -2)
for at in (12.65, 13.3):
    n = int(0.45 * SR)
    tt = np.arange(n) / SR
    buzz = np.sign(np.sin(2 * np.pi * 172 * tt)) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt)) * np.sin(np.linspace(0, np.pi, n)) ** 0.3
    place(fx, fft_filter(buzz, lo=120, hi=2500) * 0.12, at)
place(fx, plus(step(0.8), fft_filter(rng.standard_normal(int(0.03 * SR)), lo=1500) * 0.2), 14.65, -3)
for a, b in [(0, 3.9), (6.2, 22.6), (25.6, 31.8), (35.6, BLACK), (LOOP_ON, DUR)]:
    k = np.ceil(a)
    while k < b:
        tk = np.arange(int(0.03 * SR)) / SR
        place(fx, np.sin(2 * np.pi * (2900 if int(k) % 2 else 2500) * tk) * np.exp(-tk * 220) * 0.05, k)
        k += 1.0
place(fx, lib('wood_stress'), 18.4, -13)
place(fx, lib('heartbeat_breath'), 19.5, -10)
place(fx, lib('heartbeat_breath'), 21.0, -8)
wind = lib('cavern_lowwind')
place(fx, fade(wind[: int(3.1 * SR)], 0.2, 0.4), 22.6, -6)
place(fx, lib('steel_latch'), 26.0, -4)
place(fx, lib('heavy_hinge'), 26.65, -5)
place(fx, swish(1.9, lo=150, hi=900, gain=1.2), 26.7, -6)
place(fx, lib('low_cinematic_hit'), 28.6, -1)
place(fx, lib('restrained_boom'), 31.8, -2)
place(fx, lib('wood_stress'), 36.6, -9)
place(fx, lib('heartbeat_breath'), 37.1, -12)
place(fx, fft_filter(step(0.5), lo=800, hi=4000), 44.6, -10)
# black: silence, then someone opens the curtains
place(fx, plus(fft_filter(swish(1.0, gain=1.0), hi=3500), rings(0.8, 10, 1.2)), RINGS, -1)
room = fft_filter(rng.standard_normal(N), lo=60, hi=500) * 0.004 * env([(0, 1), (BLACK - 0.01, 1), (BLACK, 0), (LOOP_ON, 0), (LOOP_ON + 0.2, 1), (DUR, 1)])
fx += st(room)
fx[int(BLACK * SR):int((RINGS - 0.05) * SR)] = 0
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ mix (no fade at the end: it loops)
mix = voice + bc + mus + fx
mix[int(BLACK * SR):int((RINGS - 0.05) * SR)] *= 0.0


def lufs(x):
    write(OUT / 'probe.wav', x)
    out = subprocess.run(['ffmpeg', '-i', str(OUT / 'probe.wav'), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    (OUT / 'probe.wav').unlink()
    return float([l for l in out.splitlines() if l.strip().startswith('I:')][-1].split()[1])


# loudness-target with a soft limiter (ceiling -1 dBFS) instead of plain peak normalisation
ceil = db(-1.2)
base = mix / np.abs(mix).max()
g = 1.0
for _ in range(4):
    y = np.tanh(base * g / ceil) * ceil
    g *= db(-14.0 - lufs(y))
mix = np.tanh(base * g / ceil) * ceil
write(OUT / 'mix.wav', mix)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(OUT / 'mix.wav'), '-c:a', 'aac', '-b:a', '192k', str(OUT / 'mix.m4a')], check=True)
(OUT / 'mix.wav').unlink()
for stem in OUT.glob('stem-*.wav'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(stem), '-c:a', 'flac', str(stem.with_suffix('.flac'))], check=True)
    stem.unlink()
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep01ViralCut',
    'duration_seconds': DUR,
    'voice': TL['voice'] + '; TV-speaker band-pass + saturation + small room (l01-l07); muffled glass + large outdoor space (l08-l09)',
    'original_synthesis': [
        'hook: 853+960 Hz attention tone on frame 0; SAME-style FSK burst before the TV turns itself back on',
        'score: D1/A1 beating drone, D3-Eb3-A3(+G#3) cluster pad, inharmonic music-box motif (normal, then slower and flatter)',
        'reversed swell, tinnitus tone, TV hum/hiss/roll static/CRT power-off and power-on',
        'foley: curtain rings and fabric, phone buzz, wall clock, crickets (absent in the yard), glass tap',
        'loop: drone/pad/room tone/clock run at the same level at the end as at the start',
    ],
    'library_cues': USED,
    'loudness_target_lufs': -14.0,
    'limiter': 'tanh soft limiter, ceiling -1.2 dBFS',
    'listening_pass': 'not performed (no audio audition in this runtime)',
}, indent=2) + '\n')
print('ok', DUR)
