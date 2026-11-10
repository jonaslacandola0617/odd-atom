"""Episode 4 "Rules for the Night Shift" sound: the rule voice (MBROLA us2) like a recorded
orientation tape, a two-note announcement chime before every rule (detuned before the
last one), the blizzard outside and the dead calm when the cups spin, the station
(fluorescent hum until the lights go, the CRT whine, the phone bell, steel knocks, the
bolt), the same voice muffled through the steel door, an original score and Curio cues.

Inputs: voice lines from scripts/ep04_voice.py, src/data/ep04-night-v1-timeline.json,
Curio library cues (user-authorised).  Everything else is synthesised here (seeded).
Outputs FLAC stems, mix.m4a and PROVENANCE.json under public/assets/audio/ep04-night-v1/.
Run: python3 scripts/ep04_sound.py
"""
import hashlib, json, subprocess, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep04-night-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep04-night-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(DUR * SR)
T = np.arange(N) / SR
rng = np.random.default_rng(4004)
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


# key times (must match K and the shot list in src/horror/ep04/Episode04.tsx)
LIGHTS_OFF, BOLT_OFF, REFLECT = 25.8, 40.6, 52.3
KNOCKS = [27.0, 27.55, 28.1, 31.9, 32.45, 33.0]
LOOP_ON = DUR - 1.45
OUT.mkdir(parents=True, exist_ok=True)
SHOTS = [('A', 0, 'in'), ('B', 4.3, 'out'), ('C', 7.2, 'in'), ('D', 9.3, 'calm'), ('E', 12.0, 'in'), ('F1', 14.4, 'in'), ('F2', 17.0, 'in'), ('G', 19.6, 'in'),
         ('H', 25.3, 'in'), ('I', 26.6, 'in'), ('J', 29.3, 'in'), ('K', 31.4, 'in'), ('L', 34.3, 'peep'), ('M', 37.9, 'in'), ('N', 41.7, 'in'), ('O', 45.0, 'in'), ('P', 50.6, 'in'), ('A2', LOOP_ON, 'in')]


def where(kind):
    pts = [(0, 0)]
    for i, (_, t0, k) in enumerate(SHOTS):
        t1 = SHOTS[i + 1][1] if i + 1 < len(SHOTS) else DUR
        v = 1.0 if k == kind else 0.0
        pts += [(t0 + 0.001, v), (max(t0 + 0.002, t1 - 0.03), v)]
    pts.append((DUR, pts[-1][1]))
    return env(pts)


# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in LINES.items():
    v = load_wav(OUT / 'voice' / f'{lid}.wav')
    v /= np.abs(v).max() + 1e-9
    if l['kind'] == 'door':
        v = fft_filter(v, lo=120, hi=850, slope=1.5)
        v = np.tanh(v * 1.6)
        v = reverb(v, 1.2, 0.35, seed=31, bright=1500)
        place(voice, v, l['start'], gain=-3)
    elif lid == 'l11':
        v = fft_filter(v, lo=90, hi=9000)
        v = reverb(v, 0.3, 0.06, seed=33, bright=6000)
        place(voice, v, l['start'], gain=-3)
    else:
        v = fft_filter(v, lo=220, hi=4800, slope=1.2)
        v = np.tanh(v * 1.5) / np.tanh(1.5)
        v = reverb(v, 0.5, 0.12, seed=7, bright=4500)
        place(voice, v, l['start'], gain=-1.5)
write(OUT / 'stem-voice.wav', voice)

# ------------------------------------------------------------------ ambience
amb = np.zeros((N, 2))
gust = 0.55 + 0.45 * np.sin(2 * np.pi * qf(0.13) * T) * np.sin(2 * np.pi * qf(0.051) * T + 0.7)
wind = np.stack([fft_filter(rng.standard_normal(N), lo=150, hi=2200), fft_filter(rng.standard_normal(N), lo=150, hi=2200)], 1)
howl = np.sin(2 * np.pi * (qf(480) + 60 * np.sin(2 * np.pi * qf(0.17) * T)) * T) * 0.02 * gust
out_e = where('out') + where('peep') * 0.5
in_e = where('in')
amb += wind * (gust * (0.06 * out_e + 0.012 * in_e))[:, None] + st(fft_filter(howl, lo=300, hi=1500) * (out_e + 0.25 * in_e))
lights = env([(0, 1), (LIGHTS_OFF - 0.01, 1), (LIGHTS_OFF, 0), (LOOP_ON, 0), (LOOP_ON + 0.01, 1), (DUR, 1)])
hum = (np.sin(2 * np.pi * qf(120) * T) * 0.5 + np.sin(2 * np.pi * qf(240) * T) * 0.25 + np.sign(np.sin(2 * np.pi * qf(120) * T)) * 0.1) * 0.006
amb += st(fft_filter(hum, lo=90, hi=3000) * lights * in_e)
amb += st(np.sin(2 * np.pi * qf(15625) * T) * 0.0015 * in_e)
amb += st(fft_filter(rng.standard_normal(N), lo=60, hi=400) * 0.004 * in_e)
# the calm: no wind at all, only the cups squeaking as they spin
calm = where('calm')
sq = np.sin(2 * np.pi * (qf(2200) + 300 * np.sin(2 * np.pi * qf(1.43) * T)) * T) * (np.sin(2 * np.pi * qf(1.43) * T) > 0.7) * 0.012
amb += st(sq * calm)
write(OUT / 'stem-ambience.wav', amb)

# ------------------------------------------------------------------ score + chimes (original)
mus = np.zeros((N, 2))
drone = np.sin(2 * np.pi * qf(30.87) * T) + 0.7 * np.sin(2 * np.pi * qf(31.07) * T) + 0.5 * np.sin(2 * np.pi * qf(46.25) * T)
d_env = env([(0, 0.4), (9.3, 0.45), (19.6, 0.6), (LIGHTS_OFF, 0.8), (26.9, 0.15), (28.6, 0.6), (31.8, 0.15), (33.4, 0.7), (37.9, 0.8), (45.0, 0.7), (50.6, 0.9), (LOOP_ON - 0.05, 0.4), (DUR, 0.4)])
mus += st(drone * d_env * 0.08)
cluster = sum(np.sin(2 * np.pi * qf(f) * T + i) for i, f in enumerate([1318.5, 1396.9, 1975.5, 2093.0]))
c_env = env([(0, 0.0), (14.4, 0.0), (20, 0.3), (LIGHTS_OFF, 0.5), (34.3, 0.7), (45, 0.9), (53.8, 1.0), (LOOP_ON - 0.05, 0.0), (DUR, 0)])
mus += reverb(st(cluster * c_env * 0.004), 2.5, 0.5, seed=19, bright=7000)


def chime(f, dur=1.4):
    return tone([f, f * 2.0, f * 3.0], dur, [1, 0.3, 0.1], decay=0.5)


chimes = np.zeros((N, 2))
for lid, l in LINES.items():
    if lid in ('l02', 'l03', 'l04', 'l05', 'l06', 'l07', 'l10'):
        det = 0.971 if lid == 'l10' else 1.0
        place(chimes, chime(784 * det), l['start'] - 0.55, -6)
        place(chimes, chime(622.3 * det), l['start'] - 0.3, -6)
mus += reverb(chimes, 1.2, 0.3, seed=21, bright=6000) * 0.5
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ foley + library
fx = np.zeros((N, 2))
# pen on paper
tt = np.arange(int(1.6 * SR)) / SR
scratch = fft_filter(rng.standard_normal(len(tt)), lo=2500, hi=8000) * (0.5 + 0.5 * np.sin(2 * np.pi * 22 * tt) ** 2) * 0.03
place(fx, fade(scratch, 0.05, 0.1), 7.6)
# the monitor alarm beeps when the wind reading jumps
place(fx, lib('telemetry_ping'), 11.0, -12)
# the phone bell: a hammer on two bells, in bursts
for t0 in (14.6, 17.0):
    n = int(1.2 * SR)
    tt = np.arange(n) / SR
    ham = (np.sin(2 * np.pi * 20 * tt) > 0).astype(float)
    ring = (np.sin(2 * np.pi * 1180 * tt) + 0.7 * np.sin(2 * np.pi * 1640 * tt) + 0.3 * np.sin(2 * np.pi * 2950 * tt)) * (0.55 + 0.45 * ham)
    place(fx, fade(ring * 0.06, 0.005, 0.05), t0)
# the switch, the lights die
place(fx, np.sin(2 * np.pi * 2400 * np.arange(int(0.02 * SR)) / SR) * np.exp(-np.arange(int(0.02 * SR)) / SR * 300) * 0.2, LIGHTS_OFF - 0.02)
place(fx, lib('low_cinematic_hit'), LIGHTS_OFF, -8)
# heavy knocks on a steel door
for k in KNOCKS:
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    knock = np.sin(2 * np.pi * 85 * tt) * np.exp(-tt * 25) * 0.7 + fft_filter(rng.standard_normal(n), lo=100, hi=1200) * np.exp(-tt * 45) * 0.5 + np.sin(2 * np.pi * 410 * tt) * np.exp(-tt * 12) * 0.08
    place(fx, knock, k, -8)  # every knock lands under speech: kept present but 8 dB under
# footsteps to the door
for i in range(5):
    n = int(0.09 * SR)
    tt = np.arange(n) / SR
    place(fx, fft_filter(rng.standard_normal(n), lo=200, hi=2500) * np.exp(-tt * 50) * 0.25 + np.sin(2 * np.pi * 95 * tt) * np.exp(-tt * 40) * 0.2, 31.7 + i * 0.42, -4)
# the hand leaves the bolt; breath at the door; the riser into the last rule
place(fx, lib('steel_latch'), BOLT_OFF - 0.05, -10)
place(fx, lib('heartbeat_breath'), 42.0, -10)
place(fx, lib('suspense_riser'), 51.39 - 2.75, -10)
# hidden: as the figure shows in the dark monitor, a single creak behind the chair
place(fx, lib('wood_stress')[: int(0.7 * SR)], REFLECT, -14)
# the cable car: motor hum and the wheel over the tower
tt = np.arange(int(2.9 * SR)) / SR
place(fx, fade(np.sin(2 * np.pi * 55 * tt) * 0.03 + fft_filter(rng.standard_normal(len(tt)), lo=200, hi=900) * 0.02, 0.1, 0.2), 4.3)
place(fx, lib('gear_ratchet'), 5.0, -12)
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
    'episode': 'Ep04RulesForTheNightShift',
    'duration_seconds': DUR,
    'voice': TL['voice'] + '; light band-limit, soft saturation, small room (archive narrator, not a TV speaker)',
    'original_synthesis': [
        'voice treatment: us2 rules as a recorded orientation tape (band-limit, light saturation, small room); the door line through a steel door (low-pass, outdoor wind); the last line close and dry',
        'structure: a two-note announcement chime before each numbered rule; before rule seven it is detuned a quarter-tone',
        'ambience: blizzard wind with gusts outside and muffled inside; dead calm in the anemometer shot (only the cups squeak); fluorescent hum until the lights go off; CRT whine; heater ticks',
        'foley: pen on paper, electromechanical phone bell, light switch, heavy knocks on a steel door, footsteps on linoleum, cable-car hum',
        'score: B0/F#1 beating drone, a high sine cluster that thickens through the night, silence under the knocks',
        'loop: wind, drone and room tone end at their frame-0 levels; continuous tones snapped to whole cycles',
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
