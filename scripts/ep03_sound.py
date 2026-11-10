"""Episode 3 "Footprints in the Snow" sound: archive narrator (MBROLA us1), winter wind and
snow, slow steps crunching towards the door (on the hook and again into the loop), the
house (stove, creaking boards overhead, the hatch, a lantern, one held breath), the barn,
an original score (drone, a plucked zither-like lullaby that returns out of tune) and
Curio library cues.  Silence when the last window goes dark.

Inputs: voice lines from scripts/ep03_voice.py, src/data/ep03-snow-v1-timeline.json,
Curio library cues (user-authorised).  Everything else is synthesised here (seeded).
Outputs FLAC stems, mix.m4a and PROVENANCE.json under public/assets/audio/ep03-snow-v1/.
Run: python3 scripts/ep03_sound.py
"""
import hashlib, json, subprocess, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep03-snow-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep03-snow-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(DUR * SR)
T = np.arange(N) / SR
rng = np.random.default_rng(1922)
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


# key times (must match K and the shot list in src/horror/ep03/Episode03.tsx)
GLINT, RISE, BREATH, DOWN, LIGHT_OUT = 20.6, 24.0, 25.6, 26.9, 37.2
BLACK_A, BLACK_B = 38.7, 40.0
LOOP_ON = DUR - 1.8
SHOTS = [('A', 0, 'out'), ('B', 4.6, 'out'), ('C', 7.0, 'out'), ('C2', 10.0, 'out'), ('D', 12.8, 'in'), ('E', 15.2, 'in'), ('F', 18.4, 'in'),
         ('G', 23.4, 'attic'), ('H', 28.1, 'in'), ('I', 33.9, 'out'), ('J', 40.0, 'out'), ('K', 43.0, 'barn'), ('L', 45.6, 'in'), ('M', 49.2, 'out'),
         ('N', 52.1, 'attic'), ('A2', LOOP_ON, 'out')]
OUT.mkdir(parents=True, exist_ok=True)


def where(kind):
    """0/1 envelope (with 40 ms ramps) for the shots of one kind."""
    pts = [(0, 0)]
    for i, (_, t0, k) in enumerate(SHOTS):
        t1 = SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR
        v = 1.0 if k == kind else 0.0
        pts += [(t0 + 0.001, v), (max(t0 + 0.002, t1 - 0.04), v)]
    pts.append((DUR, pts[-1][1]))
    e = env(pts)
    e[int(BLACK_A * SR):int(BLACK_B * SR)] = 0
    return e


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
gust = 0.6 + 0.4 * np.sin(2 * np.pi * qf(0.11) * T) * np.sin(2 * np.pi * qf(0.047) * T + 1)
wind = np.stack([fft_filter(rng.standard_normal(N), lo=120, hi=1400), fft_filter(rng.standard_normal(N), lo=120, hi=1400)], 1)
whistle = np.sin(2 * np.pi * (qf(620) + 40 * np.sin(2 * np.pi * qf(0.2) * T)) * T) * 0.03
out_e = where('out')
amb += wind * (gust * 0.05 * out_e)[:, None] + st(fft_filter(whistle, lo=300, hi=1200) * gust * out_e * 0.4)
hush = fft_filter(rng.standard_normal(N), lo=3000, hi=9000) * 0.006 * out_e
amb += st(hush)
lw = lib('cavern_lowwind')
for t0, t1 in [(0, 4.6), (7.0, 12.8), (33.9, BLACK_A), (49.2, 52.1)]:
    seg = np.tile(lw, (int(np.ceil((t1 - t0) * SR / len(lw))) + 1, 1))[: int((t1 - t0) * SR)]
    place(amb, fade(seg, 0.05, 0.05), t0, -8)
seg = np.tile(lw, (2, 1))[: int((DUR - LOOP_ON) * SR)]
place(amb, fade(seg, 0.05, 0.0), LOOP_ON, -8)
# interiors: room tone, the stove (day/evening), the roof wind in the attic
in_e = where('in') + where('barn')
amb += st(fft_filter(rng.standard_normal(N), lo=60, hi=500) * 0.004 * in_e)
amb += wind * (gust * 0.012 * in_e)[:, None]
crack = np.zeros(N)
for _ in range(220):
    i = rng.integers(int(12.8 * SR), int(23.4 * SR))
    n = int(0.006 * SR)
    crack[i:i + n] += rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 900) * rng.uniform(0.02, 0.08)
amb += st(fft_filter(crack, lo=800, hi=6000))
attic_e = where('attic')
amb += wind * (gust * 0.03 * attic_e)[:, None]
amb += st(fft_filter(rng.standard_normal(N), lo=40, hi=200) * 0.02 * attic_e * gust)
write(OUT / 'stem-ambience.wav', amb)

# ------------------------------------------------------------------ score (original)
mus = np.zeros((N, 2))
drone = np.sin(2 * np.pi * qf(36.71) * T) + 0.7 * np.sin(2 * np.pi * qf(36.93) * T) + 0.5 * np.sin(2 * np.pi * qf(55.0) * T)
d_env = env([(0, 0.4), (7.0, 0.45), (12.8, 0.35), (18.4, 0.55), (23.4, 0.75), (27.5, 0.5), (33.9, 0.6), (LIGHT_OUT, 0.9), (BLACK_A - 0.02, 1.0), (BLACK_A, 0), (BLACK_B, 0), (BLACK_B + 0.4, 0.45), (45.6, 0.7), (49.2, 0.5), (52.1, 0.7), (LOOP_ON - 0.2, 0.5), (DUR, 0.4)])
mus += st(drone * d_env * 0.08)


def saw(f, t):
    return sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 6))


pad = fft_filter(saw(qf(146.83), T) + saw(qf(174.61), T) * 0.8 + saw(qf(207.65), T) * 0.7, lo=90, hi=1000)
p_env = env([(0, 0.1), (4.6, 0.2), (7.0, 0.35), (12.8, 0.2), (18.4, 0.4), (23.4, 0.6), (28.1, 0.35), (33.9, 0.5), (BLACK_A, 0), (BLACK_B, 0), (BLACK_B + 1.0, 0.3), (45.6, 0.55), (52.1, 0.6), (LOOP_ON, 0.25), (DUR, 0.1)])
lfo = 0.6 + 0.4 * np.sin(2 * np.pi * qf(0.05) * T)
mus += reverb(np.stack([pad, np.roll(pad, int(0.02 * SR))], 1) * (p_env * lfo * 0.02)[:, None], 3.0, 0.45, seed=13, bright=2400)


def pluck(f, dur=2.0, seed=0):
    """Karplus-Strong plucked string (a zither-like voice)."""
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    p = int(SR / f)
    buf = r.uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out


# an original lullaby in D minor, plucked; it returns slower and a quarter-tone flat over the hollow
lull = [587.33, 698.46, 659.25, 587.33, 523.25, 587.33, 0, 440.0, 466.16, 440.0]
box = np.zeros((N, 2))
for start, rate, detune, gain in [(7.2, 0.42, 1.0, 0.8), (52.3, 0.62, 0.971, 0.7)]:
    for i, f in enumerate(lull):
        if f:
            place(box, pluck(f * detune, 2.0, seed=i) * gain, start + i * rate)
box = reverb(fft_filter(box, lo=200, hi=6000), 2.6, 0.5, seed=17, bright=5000)
mus += box * 0.06
mus[int(BLACK_A * SR):int(BLACK_B * SR)] = 0
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ foley + library
fx = np.zeros((N, 2))


def crunch(gain=1.0):
    n = int(0.22 * SR)
    tt = np.arange(n) / SR
    grains = np.zeros(n)
    for _ in range(40):
        i = rng.integers(0, int(0.16 * SR))
        m = int(0.004 * SR)
        grains[i:i + m] += rng.standard_normal(m) * rng.uniform(0.3, 1.0)
    body = fft_filter(rng.standard_normal(n), lo=200, hi=1600) * np.exp(-tt * 18) * 0.5
    return fft_filter(grains, lo=1200, hi=7000) * np.exp(-tt * 9) * 0.35 * gain + body * gain


# slow steps in the snow towards the door: on the hook, and again in the loop shot, on one cadence
k = np.ceil((LOOP_ON - DUR) / 0.82)
while k * 0.82 < 4.3:
    u = k * 0.82
    at = u if u >= 0 else u + DUR
    if 0 <= at < DUR:
        place(fx, crunch(0.5), at, -6)
    k += 1
# footfalls and creaking boards overhead; dust
for i, at in enumerate([19.1, 19.75, 20.45, 21.2, 21.9]):
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    thud = (np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 30) + fft_filter(rng.standard_normal(n), hi=600) * np.exp(-tt * 40) * 0.4) * 0.45
    place(fx, thud, at, -2)
place(fx, lib('wood_stress'), 19.4, -6)
place(fx, lib('wood_stress'), 21.4, -9)
place(fx, fft_filter(rng.standard_normal(int(2.5 * SR)), lo=3000, hi=9000) * np.linspace(0.006, 0, int(2.5 * SR)), 19.3)
# hidden: as the two points of light show, a breath above the ceiling
place(fx, lib('heartbeat_breath')[: int(0.8 * SR)], GLINT - 0.1, -18)
# the attic: the hatch lifts, the ladder creaks, the lantern rattles; one held breath right by us
place(fx, lib('heavy_hinge'), RISE - 0.6, -6)
place(fx, lib('wood_stress'), RISE + 0.1, -10)
for at in np.arange(RISE + 0.3, DOWN + 0.6, 0.37):
    n = int(0.03 * SR)
    tt = np.arange(n) / SR
    place(fx, np.sin(2 * np.pi * 3100 * tt) * np.exp(-tt * 160) * 0.05 + np.sin(2 * np.pi * 4700 * tt) * np.exp(-tt * 200) * 0.03, at + rng.uniform(-0.05, 0.05))
place(fx, lib('heartbeat_breath'), BREATH - 0.2, -14)
place(fx, lib('wood_stress'), DOWN, -11)
place(fx, lib('heavy_hinge'), 27.6, -10)
# the newspaper, the keys
place(fx, lib('paper_light_turn'), 15.4, -8)
place(fx, lib('metallic_rivet'), 13.2, -14)
# the last window goes dark: a low hit, then nothing
place(fx, lib('low_cinematic_hit'), LIGHT_OUT, -5)
# the barn: breathing, chewing, a chain, hay
tt = np.arange(int(2.6 * SR)) / SR
breath_cow = fft_filter(rng.standard_normal(len(tt)), lo=80, hi=700) * (np.sin(2 * np.pi * 0.35 * tt) ** 8) * 0.12
chew = fft_filter(rng.standard_normal(len(tt)), lo=600, hi=3000) * ((np.sin(2 * np.pi * 1.6 * tt) > 0.6) * 1.0) * 0.03
place(fx, fade(breath_cow + chew, 0.1, 0.1), 43.0)
place(fx, lib('cable_tension')[: int(0.6 * SR)], 44.2, -16)
# the hatch, open: the attic breathes cold air; a restrained boom as we see it
place(fx, lib('restrained_boom'), 45.65, -6)
place(fx, lib('suspense_riser'), 49.2 - 0.2, -14)
fx[int(BLACK_A * SR):int(BLACK_B * SR)] = 0
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
    'episode': 'Ep03FootprintsInTheSnow',
    'duration_seconds': DUR,
    'voice': TL['voice'] + '; light band-limit, soft saturation, small room (archive narrator, not a TV speaker)',
    'original_synthesis': [
        'ambience: winter wind (filtered noise with gusts) and snow hush in every exterior; room tone and a stove inside; wind on the roof in the attic',
        'foley: slow steps crunching in snow on the hook and again into the loop (same cadence, so the seam is a step); creaking ceiling boards and footfalls overhead; dust sifting; a lantern rattle; ladder creaks; cattle breathing and chewing; hay rustle; a chain',
        'score: D1/A1 beating drone; a D-F-Ab pad (diminished); a plucked zither-like (Karplus-Strong) lullaby in D minor that returns slower and a quarter-tone flat over the hollow in the hay',
        'silence: everything cuts out for the black hold after the last window goes dark',
        'loop: drone, pad and wind run at their frame-0 levels at the end; drone partials snapped to whole cycles over the episode',
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
