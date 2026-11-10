"""Episode 5 "Nine Hikers, One Cut Tent" sound: archive narrator (MBROLA us1), mountain wind
and canvas, the tear of the blade through the tent (on the hook and again into the loop,
on one continuous timebase), the forest, a thawing stream, a typewriter and a stamp for
the file, the crack and rumble of a slab, an original score and Curio library cues.
Nothing of the deaths is heard.

Inputs: voice lines from scripts/ep05_voice.py, src/data/ep05-tent-v1-timeline.json,
Curio library cues (user-authorised).  Everything else is synthesised here (seeded).
Outputs FLAC stems, mix.m4a and PROVENANCE.json under public/assets/audio/ep05-tent-v1/.
Run: python3 scripts/ep05_sound.py
"""
import hashlib, json, subprocess, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep05-tent-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep05-tent-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(DUR * SR)
T = np.arange(N) / SR
rng = np.random.default_rng(1959)
LINES = {l['id']: l for l in TL['lines']}


def qf(f):
    """Snap a frequency to a whole number of cycles over the episode, so every
    continuous tone (and every beat between two tones) has the same phase at the
    last sample as at the first: the loop has no click and no level jump."""
    return round(f * DUR) / DUR


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


# key times (must match K and the shot list in src/horror/ep05/Episode05.tsx)
LOOP_ON = DUR - 1.6
SLAB = 40.6
SHOTS = [('A', 0, 'tent'), ('B', 5.8, 'out'), ('B2', 9.8, 'out'), ('C', 13.6, 'out'), ('D', 19.4, 'out'), ('E', 24.8, 'forest'), ('F', 29.3, 'stream'),
         ('G', 34.0, 'desk'), ('H', 39.1, 'out'), ('I', 46.3, 'out'), ('J', 49.2, 'tent'), ('A2', LOOP_ON, 'tent')]
OUT.mkdir(parents=True, exist_ok=True)


def where(kind):
    pts = [(0, 0)]
    for i, (_, t0, k) in enumerate(SHOTS):
        t1 = SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR
        v = 1.0 if k == kind else 0.0
        pts += [(t0 + 0.001, v), (max(t0 + 0.002, t1 - 0.03), v)]
    pts.append((DUR, pts[-1][1]))
    return env(pts)


# ------------------------------------------------------------------ voice: archive narrator
voice = np.zeros((N, 2))
for lid, l in LINES.items():
    v = load_wav(OUT / 'voice' / f'{lid}.wav')
    v /= np.abs(v).max() + 1e-9
    v = fft_filter(v, lo=110, hi=7000)
    v = np.tanh(v * 1.3) / np.tanh(1.3)
    v = reverb(v, 0.6, 0.12, seed=21, bright=5000)
    place(voice, v, l['start'], gain=-2.0)
write(OUT / 'stem-voice.wav', voice)

# ------------------------------------------------------------------ ambience
amb = np.zeros((N, 2))
gust = 0.55 + 0.45 * np.sin(2 * np.pi * qf(0.12) * T) * np.sin(2 * np.pi * qf(0.043) * T + 1.3)
wind = np.stack([fft_filter(rng.standard_normal(N), lo=120, hi=1800), fft_filter(rng.standard_normal(N), lo=120, hi=1800)], 1)
out_e, tent_e, forest_e, stream_e, desk_e = where('out'), where('tent'), where('forest'), where('stream'), where('desk')
amb += wind * (gust * (0.06 * out_e + 0.03 * tent_e + 0.025 * forest_e + 0.015 * stream_e))[:, None]
amb += st(fft_filter(np.sin(2 * np.pi * (qf(520) + 70 * np.sin(2 * np.pi * qf(0.15) * T)) * T) * 0.02 * gust, lo=300, hi=1400) * (out_e + 0.4 * tent_e))
# canvas: flapping thumps and rustle inside the tent
flapn = fft_filter(rng.standard_normal(N), lo=300, hi=3500) * (np.abs(np.sin(2 * np.pi * qf(2.6) * T)) ** 6) * 0.03 * gust
amb += st(flapn * tent_e)
# a thawing stream
amb += st(fft_filter(rng.standard_normal(N), lo=1200, hi=6000) * (0.6 + 0.4 * np.sin(2 * np.pi * qf(7.3) * T) ** 2) * 0.012 * stream_e)
amb += st(fft_filter(rng.standard_normal(N), lo=60, hi=400) * 0.004 * desk_e)
write(OUT / 'stem-ambience.wav', amb)

# ------------------------------------------------------------------ score (original)
mus = np.zeros((N, 2))
drone = np.sin(2 * np.pi * qf(55.0) * T) + 0.7 * np.sin(2 * np.pi * qf(55.28) * T) + 0.5 * np.sin(2 * np.pi * qf(82.41) * T)
d_env = env([(0, 0.45), (5.8, 0.4), (13.6, 0.55), (19.4, 0.6), (24.8, 0.7), (29.3, 0.6), (34.0, 0.35), (39.1, 0.7), (SLAB + 1.8, 1.0), (46.3, 0.5), (49.2, 0.6), (LOOP_ON - 0.05, 0.45), (DUR, 0.45)])
mus += st(drone * d_env * 0.08)


def saw(f, t):
    return sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 6))


pad = fft_filter(saw(qf(220.0), T) + saw(qf(261.63), T) * 0.8 + saw(qf(311.13), T) * 0.7, lo=100, hi=1100)
p_env = env([(0, 0.15), (5.8, 0.3), (13.6, 0.45), (24.8, 0.55), (34.0, 0.2), (39.1, 0.5), (46.3, 0.6), (LOOP_ON - 0.05, 0.15), (DUR, 0.15)])
lfo = 0.6 + 0.4 * np.sin(2 * np.pi * qf(0.05) * T)
mus += reverb(np.stack([pad, np.roll(pad, int(0.02 * SR))], 1) * (p_env * lfo * 0.018)[:, None], 3.0, 0.45, seed=13, bright=2400)


def glass(f, dur=2.6):
    tt = np.arange(int(dur * SR)) / SR
    e = np.minimum(1, tt / 0.35) * np.exp(-tt * 0.9)
    return (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.01 * tt) + 0.12 * np.sin(2 * np.pi * f * 3.02 * tt)) * e * (1 + 0.02 * np.sin(2 * np.pi * 5 * tt))


motif = [659.25, 587.33, 523.25, 493.88, 440.0]
box = np.zeros((N, 2))
for start, rate, detune, gain in [(6.2, 0.7, 1.0, 0.7), (49.6, 0.95, 0.971, 0.6)]:
    for i, f in enumerate(motif):
        place(box, glass(f * detune) * gain, start + i * rate)
mus += reverb(fft_filter(box, lo=250, hi=6000), 3.0, 0.55, seed=17, bright=5000) * 0.05
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ foley + library
fx = np.zeros((N, 2))


def tear(dur, gain=1.0, seed=0):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    crackle = np.zeros(n)
    for _ in range(int(dur * 260)):
        i = r.integers(0, n - 200)
        m = r.integers(20, 160)
        crackle[i:i + m] += r.standard_normal(m) * r.uniform(0.3, 1.0)
    return fft_filter(crackle, lo=900, hi=7000) * 0.12 * gain


# the blade through the canvas: one long tear on the loop-continuous timebase (u from loopOn-DUR to 4.6)
u0, u1 = LOOP_ON - DUR, 3.8
whole = tear(u1 - u0, 1.0, seed=3) * np.linspace(0.6, 1.0, int((u1 - u0) * SR))
cut = int((0 - u0) * SR)
place(fx, whole[cut:], 0.0)
place(fx, whole[:cut], LOOP_ON)
# torches at the camp, a gust snapping canvas
tt = np.arange(int(7.8 * SR)) / SR
place(fx, fade(fft_filter(rng.standard_normal(len(tt)), lo=300, hi=3000) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt) ** 2) * 0.012, 0.3, 0.3), 5.8)
# a branch creaks at the cedar
place(fx, lib('wood_stress'), 26.2, -10)
# the file: typing the conclusion, then the stamp
place(fx, lib('typewriter_cluster'), 35.2, -6)
place(fx, lib('document_stamp'), 38.0, -2)
# the slab: a crack, then the slide and a low rumble
place(fx, lib('low_cinematic_hit'), SLAB - 0.05, -4)
tt = np.arange(int(3.0 * SR)) / SR
rumble = fft_filter(rng.standard_normal(len(tt)), lo=30, hi=400) * np.sin(np.linspace(0, np.pi, len(tt))) ** 1.5 * 0.3
place(fx, rumble, SLAB + 0.1)
place(fx, lib('restrained_boom'), SLAB + 1.8, -6)
place(fx, lib('suspense_riser'), 49.4 - 2.75, -14)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ mix (no fade at the end: it loops)
mix = voice + amb + mus + fx


def lufs(x):
    write(OUT / 'probe.wav', x)
    out = subprocess.run(['ffmpeg', '-i', str(OUT / 'probe.wav'), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    (OUT / 'probe.wav').unlink()
    return float([l for l in out.splitlines() if l.strip().startswith('I:')][-1].split()[1])


ceil = db(-1.2)
peak = np.abs(mix).max()
base = mix / peak
g = 1.0
for _ in range(5):
    y = np.tanh(base * g / ceil) * ceil
    g *= db(-14.0 - lufs(y))
mix = np.tanh(base * g / ceil) * ceil
write(OUT / 'mix.wav', mix)
final_lufs = lufs(mix)

# voice-over-bed margin per line, measured from stems with the same mix gain
def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


margins = []
for lid, l in LINES.items():
    a, b = int(l['start'] * SR), int(l['end'] * SR)
    vv = voice[a:b].mean(1)
    margins.append({'id': lid, 'voice_minus_score_db': float(round(rms_db(vv) - rms_db(mus[a:b].mean(1)), 1)), 'voice_minus_all_other_stems_db': float(round(rms_db(vv) - rms_db((amb + mus + fx)[a:b].mean(1)), 1))})
def encode_peak(x):
    write(OUT / 'mix.wav', x)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(OUT / 'mix.wav'), '-c:a', 'aac', '-b:a', '192k', str(OUT / 'mix.m4a')], check=True)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(OUT / 'mix.m4a'), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return 20 * np.log10(np.abs(np.frombuffer(raw, np.float32)).max())


# AAC can overshoot the limiter ceiling on the clipped buzz; pull the whole mix down until the
# decoded file peaks at or below -1 dBFS, and report the loudness of what is actually delivered
encoded_peak = encode_peak(mix)
while encoded_peak > -1.0:
    mix = mix * db(-1.0 - encoded_peak - 0.1)
    encoded_peak = encode_peak(mix)
final_lufs = lufs(mix)
(OUT / 'mix.wav').unlink()
for stem in OUT.glob('stem-*.wav'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(stem), '-c:a', 'flac', str(stem.with_suffix('.flac'))], check=True)
    stem.unlink()
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep05NineHikersOneCutTent',
    'duration_seconds': DUR,
    'voice': TL['voice'] + '; light band-limit, soft saturation, small room (archive narrator, not a TV speaker)',
    'original_synthesis': [
        'ambience: mountain wind with gusts on the open slope; canvas flapping and wind on the tent from inside; a quieter forest; a thawing stream in the ravine; a room for the file',
        'foley: the blade tearing the canvas, timed to the cut on one continuous timebase so the loop seam is mid-tear; torches; a branch creak at the cedar; the crack and rumble of the slab',
        'score: A1/E2 beating drone; an A-C-Eb pad; a slow descending motif on a glassy bowed tone that returns slower and a quarter-tone flat over the last line',
        'loop: wind, canvas, drone and pad end at their frame-0 levels; continuous tones snapped to whole cycles',
        'nothing of the deaths is depicted in sound',
    ],
    'library_cues': USED,
    'loudness_target_lufs': -14.0,
    'measured_integrated_lufs': final_lufs,
    'encoded_sample_peak_dbfs': round(float(encoded_peak), 2),
    'limiter': 'tanh soft limiter, ceiling -1.2 dBFS',
    'voice_margins_db': margins,
    'listening_pass': 'not performed (no audio audition in this runtime)',
}, indent=2) + '\n')
print('ok', DUR, 'LUFS', final_lufs, 'encoded peak', round(float(encoded_peak), 2))
for m in margins:
    print(m)
