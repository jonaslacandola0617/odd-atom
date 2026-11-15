"""Episode 40 "Patayin ang Ilaw" (Season 4 finale: Malinta Tunnel, Corregidor; history and the reported
haunting on the night lateral tour) sound.

Sound language: the island's cicadas, cut dead at the tunnel; inside, concrete room tone and drips; the
group's steps; a flashlight click for every beam that goes out or comes on. In the black (no score at
all): breathing, drips, then more footsteps than there are of us, closing in from every side, a hospital
bed's metal frame creaking, a far handbell. Lights on; my beam finds him (a stinger); the lights die with
a buzz; the guide's count; at dawn, the sea and the wind at the mouth. A loop-quantised eerie score
everywhere else. The tunnel's room tone and a drip run across the loop seam. -14 LUFS with an
encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep40_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep40-malinta-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep40-malinta-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(40040)
L = {l['id']: l for l in TL['lines']}



def plus(*xs):
    n = max(len(x) for x in xs)
    return sum(np.pad(x, (0, n - len(x))) for x in xs)


def qf(f):
    """Whole number of cycles over the episode: continuous tones meet themselves at the loop."""
    return round(f * DUR) / DUR


def db(x):
    return 10 ** (x / 20)


def st(x):
    return np.stack([x, x], 1) if x.ndim == 1 else x


filt = hs._filt


def verb(x, seconds, wet, seed, bright=6000):
    return hs._verb(x, SR, seconds, wet, seed, bright)


def place(bus, clip, at, gain=0.0):
    i = int(at * SR)
    if i >= len(bus) or i + len(clip) <= 0:
        return
    clip = st(clip)
    if i < 0:
        clip, i = clip[-i:], 0
    n = min(len(clip), len(bus) - i)
    bus[i:i + n] += clip[:n] * db(gain)


def env(points):
    xs, ys = zip(*points)
    return np.interp(T, xs, ys)


def load(path, ch=1):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f64le', '-ac', str(ch), '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float64).copy()
    return x.reshape(-1, 2) if ch == 2 else x


USED = {}


def lib(name):
    path = next(LIB.rglob(f'*_{name}_v1.flac'))
    USED[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    return load(path, 2)


def write(path, x):
    x = np.clip(st(x), -1, 1)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())


def fade(x, a=0.01, b=0.01):
    e = np.ones(len(x))
    ia, ib = int(a * SR), int(b * SR)
    if ia:
        e[:ia] = np.linspace(0, 1, ia)
    if ib:
        e[-ib:] = np.linspace(1, 0, ib)
    return x * e if x.ndim == 1 else x * e[:, None]








# key times: must match K in src/horror/ep40/Episode40.tsx
l = lambda i: L[i]
NB = 7
HOOK_OUT = 2.0
CUT_ISLAND = l('l02')['start'] - 0.3
CUT_TUNNEL = l('l02')['start'] + 0.45 * (l('l02')['end'] - l('l02')['start'])
CUT_RUBBLE = l('l03')['start'] - 0.3
DUST = l('l03')['start'] + 1.5
CUT_GUIDE = l('l04')['start'] - 0.3
CUT_OFF = l('l05')['start'] - 0.3
OUT_START = l('l05')['end'] + 0.25
BLACK = OUT_START + NB * 0.22
CUT_ON = l('l06')['start'] - 0.3
GLOW = CUT_ON - 2.4
FOUND = l('l06')['end'] + 0.5
DIE = FOUND + 1.0
CUT_COUNT = l('l07')['start'] - 0.3
SEVENTH = l('l07')['end'] + 0.2
CUT_HONOR = l('l08')['start'] - 0.3
LOOP = DUR - 1.7
STINGERS = [FOUND, SEVENTH]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep40-{name}.mp3'
    SFX_USED[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    x = load(path, 2)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-12) * 0.1  # unit level: -20 dB RMS
    return x * db(gain_db)


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


def pan(x, p):
    x = x if x.ndim == 1 else x.mean(1)
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1)


def noise(seconds, lo, hi):
    return filt(rng.standard_normal(int(seconds * SR)), SR, lo=lo, hi=hi)


def hit(at, gain=0.3, f=46):
    n = int(0.9 * SR)
    tt = np.arange(n) / SR
    place(fx, st((np.sin(2 * np.pi * f * tt) + 0.6 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 5) * gain), at)


def loop_to(x, seconds):
    n = int(seconds * SR)
    reps = int(np.ceil(n / len(x))) + 1
    return np.concatenate([x] * reps)[:n]


def xloop(x, seconds, fade_s=0.25):
    """Loop a clip with short crossfades, so a 2 s effect becomes a bed without clicks."""
    f = int(fade_s * SR)
    x = st(x)
    seg = x.copy()
    seg[:f] *= np.linspace(0, 1, f)[:, None]
    seg[-f:] *= np.linspace(1, 0, f)[:, None]
    hop = len(seg) - f
    n = int(seconds * SR)
    out = np.zeros((n + len(seg), 2))
    for i in range(0, n, hop):
        out[i:i + len(seg)] += seg
    return out[:n]


def compress(x, thresh_db=-24.0, ratio=3.0, att=0.005, rel=0.15):
    """A gentle feed-forward compressor, so the narration carries the loudness without the limiter
    having to squash it (there is no score to carry it in this episode)."""
    e = np.abs(x)
    a, r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    env_ = np.zeros_like(e)
    lvl = 0.0
    for i in range(0, len(e), 48):  # 1 ms blocks
        m = e[i:i + 48].max()
        lvl = a ** 48 * lvl + (1 - a ** 48) * m if m > lvl else r ** 48 * lvl + (1 - r ** 48) * m
        env_[i:i + 48] = lvl
    over = np.maximum(0, 20 * np.log10(env_ + 1e-9) - thresh_db)
    y = x * 10 ** (-over * (1 - 1 / ratio) / 20)
    y = y * 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-12)) / 20)
    c = 10 ** ((-21.0 + 12.0) / 20)  # soft-clip what remains above 12 dB over the line's RMS (plosives)
    return np.tanh(y / c) * c







# ------------------------------------------------------------------ voice (dry, close)
voice = np.zeros((N, 2))
for lid, ln in L.items():
    v = load(VOICE / f'{lid}.wav')
    v = filt(v, SR, lo=80, hi=11000)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = compress(v)
    v = verb(v, 0.6, 0.04, seed=30, bright=3000)
    place(voice, v, ln['start'], gain=-1.0)
speech = np.zeros(N)
for ln in L.values():
    speech = np.maximum(speech, env([(0, 0), (ln['start'] - 0.1, 0), (ln['start'], 1), (ln['end'], 1), (ln['end'] + 0.25, 0), (DUR, 0)]))
duck = 1 - speech * (1 - db(-9))


OUT.mkdir(parents=True, exist_ok=True)
unit = lambda x: x / (np.sqrt(np.mean(x ** 2)) + 1e-12)


def wrap(x):
    """Fold a bed longer than the episode back onto its start, so it runs on across the loop seam."""
    y = x[:N].copy()
    y[:len(x) - N] += x[N:]
    return y


island = span(CUT_ISLAND, CUT_TUNNEL, 0.002)
walk = span(CUT_TUNNEL, CUT_RUBBLE, 0.002)
dark = span(BLACK, CUT_ON, 0.002) + span(DIE + 0.35, CUT_COUNT, 0.002)  # the blacks: no score
honor = span(CUT_HONOR, LOOP, 0.002)
inside = np.clip(1 - island, 0, 1)

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
# the tunnel's room tone (looped, folded across the seam); a little louder in the black
t3 = sfx('tunnel-3')
amb += wrap(xloop(filt(t3.mean(1), SR, lo=160, hi=9000), DUR + 3)) * (db(-17) * inside * (0.55 + 0.45 * duck) * (1 + 0.6 * dark))[:, None]
amb += st(unit(filt(rng.standard_normal(N), SR, lo=110, hi=500)) * 0.003 * inside * duck)
# the island: cicadas and crickets, cut dead at the tunnel
c3 = sfx('cicadas-3')
amb += xloop(c3, DUR) * (db(-13) * island * (0.5 + 0.5 * duck))[:, None]
amb += st(unit(filt(rng.standard_normal(N), SR, lo=150, hi=900)) * 0.008 * island * duck)  # the sea below
# dawn at the mouth: wind and the sea, far
amb += st(unit(filt(rng.standard_normal(N), SR, lo=200, hi=1500)) * 0.006 * honor * duck)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def click(at, gain=0.03, p=0.0):
    """A flashlight's slide switch: a short plastic click."""
    n = int(0.03 * SR)
    tt = np.arange(n) / SR
    x = filt(rng.standard_normal(n), SR, lo=1800, hi=7000) * np.exp(-tt * 300) + np.sin(2 * np.pi * 2300 * tt) * np.exp(-tt * 500) * 0.4
    place(fx, pan(x * gain, p), at)


def drip(at, gain=0.02, p=0.0):
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    f = 1400 * np.exp(-tt * 12) + 700
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 30)
    place(fx, verb(pan(x * gain, p), 1.6, 0.35, seed=4001, bright=3500), at)


# the hook's beams go out one by one (and the loop's own seven, before the seam: on negative time they are on)
for k in range(NB):
    click(HOOK_OUT + k * 0.33, 0.03, -0.6 + 0.2 * k)
# "Patayin ang ilaw": out one by one; back on one by one; they die by themselves with a buzz
for k in range(NB):
    click(OUT_START + (NB - 1 - k) * 0.22, 0.035, 0.6 - 0.2 * k)
    click(CUT_ON + 0.1 + k * 0.08, 0.03, -0.6 + 0.2 * k)
n = int(0.4 * SR)
tt = np.arange(n) / SR
bz = filt(np.sign(np.sin(2 * np.pi * 120 * tt)) * (rng.standard_normal(n) * 0.3 + 0.7), SR, lo=200, hi=5000) * (np.sin(2 * np.pi * 37 * tt) > 0) * np.exp(-tt * 4)
place(fx, st(bz * 0.02), DIE)
# drips: a slow irregular rhythm inside, loop-quantised positions so one crosses the seam
r2 = np.random.default_rng(4004)
for at in np.arange(0.4, DUR, 2.3):
    if not (CUT_ISLAND <= at < CUT_TUNNEL):
        drip(at + r2.uniform(-0.3, 0.3), 0.012 * (0.5 + 0.5 * float(duck[min(N - 1, int(at * SR))])), r2.uniform(-0.6, 0.6))
drip(DUR - 0.25, 0.012, 0.3)
drip(-0.25, 0.012, 0.3)  # the same drip, continued past the seam
# the group's steps on the walk (looped) and a shuffle in the lateral before the guide turns
s2 = sfx('steps-2')
fx += xloop(s2, DUR) * (db(-17) * walk * (0.5 + 0.5 * duck))[:, None]
place(fx, s2[:int(1.5 * SR)] * np.linspace(1, 0, int(1.5 * SR))[:, None], CUT_GUIDE + 0.1, -22)
# the rubble: dust trickling, a low creak of the slab
n = int((CUT_GUIDE - DUST) * SR)
place(fx, pan(filt(rng.standard_normal(n), SR, lo=2500, hi=8000) * np.minimum(1, np.arange(n) / (1.0 * SR)) * 0.004, 0.1), DUST)
n = int(1.6 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=60, hi=300) * np.sin(np.pi * tt / tt[-1]) * 0.03), DUST + 2.2)
# ---- the black: breathing, then more steps than there are of us, a bed creaking, a far bell
for k, at in enumerate(np.arange(BLACK + 0.3, CUT_ON - 0.3, 1.9)):
    n = int(1.3 * SR)
    tt = np.arange(n) / SR
    place(fx, pan(filt(rng.standard_normal(n), SR, lo=300, hi=2400) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.012, (-1) ** k * 0.3), at)
step_n = int(0.22 * SR)
step = s2[int(0.4 * SR):int(0.4 * SR) + step_n] * np.hanning(step_n)[:, None]
r3 = np.random.default_rng(4040)
t0 = BLACK + 1.8
for at in np.arange(t0, CUT_ON - 0.2, 0.05):
    dens = ((at - t0) / (CUT_ON - 0.2 - t0)) ** 1.5  # one set of steps, then many
    if r3.uniform() < 0.05 + 0.6 * dens:
        place(fx, pan(step.mean(1), r3.uniform(-1, 1)) * (0.5 + 0.5 * dens), at, -14 - 6 * (1 - dens))
b1 = sfx('bed-1')
place(fx, pan(verb(b1.mean(1), 1.4, 0.3, seed=4002, bright=4000), -0.5), BLACK + 3.4, -15)


def bell(at, gain=0.012):
    n = int(2.6 * SR)
    tt = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in ((1180, 1.0, 2.2), (2950, 0.5, 3.5), (4100, 0.3, 5.0)))
    place(fx, verb(pan(filt(x, SR, lo=600, hi=5000) * gain, 0.4), 2.4, 0.6, seed=4003, bright=3000), at)


bell(GLOW + 0.2)
bell(GLOW + 0.75, 0.008)
# my turn: a rustle; the found: a low hit; the count: a breath out, a low hit on the seventh
n = int(0.4 * SR)
place(fx, st(filt(rng.standard_normal(n), SR, lo=600, hi=4000) * np.sin(np.pi * np.arange(n) / n) * 0.01), FOUND - 0.45)
hit(FOUND, 0.24, 41)
hit(SEVENTH, 0.18, 38)
# a breath at the ear across the loop seam
n = int(1.2 * SR)
tt = np.arange(n) / SR
br = pan(filt(rng.standard_normal(n), SR, lo=300, hi=2500) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.016, -0.4)
place(fx, br, DUR - 0.6)
place(fx, br, -0.6)
write(OUT / 'stem-foley-fx.wav', fx)
# ------------------------------------------------------------------ the score (eerie, low; loop-quantised; silent in the blacks)
mus = np.zeros((N, 2))
lv = 0.75
drone_e = env([(0, lv), (CUT_ISLAND, 0.6), (CUT_TUNNEL, 0.9), (CUT_RUBBLE, 1.1), (CUT_GUIDE, 1.2), (CUT_OFF, 0.9), (OUT_START, 0.4), (BLACK, 0.0), (CUT_ON, 0.0), (CUT_ON + 0.4, 0.6), (FOUND, 0.6), (FOUND + 0.1, 1.6), (DIE + 0.3, 0.0), (CUT_COUNT, 0.0), (CUT_COUNT + 0.5, 0.9), (SEVENTH + 0.1, 1.4), (CUT_HONOR, 0.7), (LOOP, lv), (DUR, lv)])
mus += st(hs.drone_mid(T, qf, drone_e, root=41.2) * 1.8)
str_e = env([(0, 0.5), (CUT_TUNNEL, 0.6), (CUT_RUBBLE, 0.9), (CUT_OFF, 1.0), (OUT_START, 0.3), (BLACK, 0.0), (CUT_ON, 0.0), (CUT_ON + 0.4, 0.5), (FOUND + 0.1, 1.5), (DIE + 0.3, 0.0), (CUT_COUNT, 0.0), (CUT_COUNT + 0.5, 0.8), (SEVENTH + 0.1, 1.3), (CUT_HONOR, 0.6), (LOOP, 0.5), (DUR, 0.5)])
trem = env([(0, 0.4), (CUT_RUBBLE, 0.6), (CUT_OFF, 0.8), (BLACK, 0.0), (CUT_ON, 0.4), (FOUND + 0.1, 1.0), (CUT_HONOR, 0.3), (LOOP, 0.4), (DUR, 0.4)])
mus += st(hs.strings(T, qf, [82.41, 87.31, 123.47], str_e, trem, SR, seed=4001) * 2.3)
# an original music-box figure: a slow falling line, once in the tunnel, once (softer, slower) at dawn
THEME = [329.63, 311.13, 261.63, 0, 246.94, 220.0, 207.65, 0, 196.0]
place(mus, hs.music_box(SR, THEME, 0.5, 0.95, seed=4003), CUT_TUNNEL + 0.3, -3.0)
place(mus, hs.music_box(SR, THEME, 0.7, 0.93, seed=4008), CUT_HONOR + 0.6, -6.0)
place(mus, st(hs.metal_bow(SR, 4.0, 930.0, seed=4004)), CUT_RUBBLE + 0.4, 0.0)
place(mus, st(hs.heartbeat(SR, CUT_ON + 0.3, DIE, 66, 96, gain=0.5, seed=4005)), CUT_ON + 0.3)
place(mus, st(hs.reverse_swell(SR, [82.41, 123.47, 164.81], 0.8, seed=4006)), FOUND - 0.8, -3.0)
place(mus, hs.stinger(SR, seed=4007, size=1.2), FOUND)
place(mus, hs.stinger(SR, seed=4009, size=0.9), SEVENTH, -4.0)
mus = np.stack([filt(mus[:, 0], SR, lo=100, hi=12000), filt(mus[:, 1], SR, lo=100, hi=12000)], 1)  # keep the score in the phone band
mus *= (1 - speech * (1 - db(-6)))[:, None] * db(2.0)
write(OUT / 'stem-score.wav', mus)
tvb = np.zeros((N, 2))
bed = amb + fx + mus
PRESENCE = hs.presence(voice, bed, TL['lines'], SR)

# ------------------------------------------------------------------ every line at least 4.5 dB over everything else (lift at most 8 dB)
LIFTS = {}
for lid, l in L.items():
    a, b = int(l['start'] * SR), int((l['end'] + 0.12) * SR)
    rest = (tvb + amb + mus + fx)[a:b].mean(1)
    m = 20 * np.log10(np.sqrt(np.mean(voice[a:b].mean(1) ** 2)) + 1e-12) - 20 * np.log10(np.sqrt(np.mean(rest ** 2)) + 1e-12)
    LIFTS[lid] = round(float(min(8.0, max(0.0, 4.6 - m))), 1)
    voice[a:b] *= db(LIFTS[lid])
write(OUT / 'stem-voice.wav', voice)
PRESENCE = hs.presence(voice, bed, TL['lines'], SR)

# ------------------------------------------------------------------ mix (no fade at the end: it loops)
mix = voice + tvb + amb + mus + fx


def lufs(x):
    write(OUT / 'probe.wav', x)
    out = subprocess.run(['ffmpeg', '-i', str(OUT / 'probe.wav'), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    (OUT / 'probe.wav').unlink()
    return float([l for l in out.splitlines() if l.strip().startswith('I:')][-1].split()[1])


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


def encode_peak(x):
    write(OUT / 'mix.wav', x)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(OUT / 'mix.wav'), '-c:a', 'aac', '-b:a', '192k', str(OUT / 'mix.m4a')], check=True)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(OUT / 'mix.m4a'), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return 20 * np.log10(np.abs(np.frombuffer(raw, np.float32)).max())


# loudness to -14 LUFS under a soft limiter; if the decoded AAC overshoots -1 dBFS, lower
# the limiter ceiling (not the loudness) and try again
base = mix / np.abs(mix).max()
ceil_db = -1.2
for _ in range(6):
    ceil = db(ceil_db)
    g = 1.0
    for _ in range(5):
        g *= db(-14.0 - lufs(np.tanh(base * g / ceil) * ceil))
    out_mix = np.tanh(base * g / ceil) * ceil
    encoded_peak = encode_peak(out_mix)
    if encoded_peak <= -1.0:
        break
    ceil_db -= (encoded_peak + 1.0) + 0.3
mix = out_mix
final_lufs = lufs(mix)
(OUT / 'mix.wav').unlink()

others = tvb + amb + mus + fx
band = lambda x: filt(x.mean(1), SR, lo=200, hi=4000)
margins = []
for lid, l in L.items():
    a, b = int(l['start'] * SR), int(l['end'] * SR)
    margins.append({'id': lid, 'voice_minus_all_db': round(float(rms_db(voice[a:b].mean(1)) - rms_db(others[a:b].mean(1))), 1),
                    'phone_band_voice_minus_all_db': round(float(rms_db(band(voice[a:b])) - rms_db(band(others[a:b]))), 1),
                    'voice_minus_bed_db': round(float(rms_db(voice[a:b].mean(1)) - rms_db(bed[a:b].mean(1))), 1)})
clash = [h for h in STINGERS for l in L.values() if l['start'] - 0.05 <= h <= l['end'] + 0.1]
head = rms_db(mix[:SR // 4].mean(1))
tail = rms_db(mix[-SR // 4:].mean(1))
for stem in OUT.glob('stem-*.wav'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(stem), '-c:a', 'flac', str(stem.with_suffix('.flac'))], check=True)
    stem.unlink()
take = ROOT / 'public/assets/audio/eleven-takes/ep40-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep40PatayinAngIlaw',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep40-malinta/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep40-malinta/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, an original falling music-box figure (in the tunnel and at dawn), bowed metal at the rubble, a heartbeat from the lights coming back to their dying, a reversed swell and a stinger when my beam finds him, a smaller stinger on the seventh (scripts/horror_score.py); loop-quantised; silent in both blacks',
        'flashlight clicks for every beam out and on, the lights dying with a buzz, drips (one across the loop seam), dust trickling, the slab creaking, breathing in the black, many footsteps cut from one ElevenLabs step take, a far handbell, a rustle, low hits, the sea and wind, a breath across the loop seam (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'UHsHawCfAljwSC64eMFR', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (about 68 credits per prompt); picked by measurement, not by listening'},
    'music_presence_note': 'music_presence measures the whole non-voice bed (score, ambience, effects) against the voice',
    'real_recordings_used': False,
    'library_cues': USED,
    'stingers': STINGERS, 'stingers_inside_speech': clash,
    'loudness_target_lufs': -14.0,
    'measured_integrated_lufs': final_lufs,
    'encoded_sample_peak_dbfs': round(float(encoded_peak), 2),
    'loop_seam_rms_dbfs': {'first_quarter_second': round(float(head), 1), 'last_quarter_second': round(float(tail), 1)},
    'limiter': f'tanh soft limiter, ceiling {ceil_db:.2f} dBFS (lowered until the decoded AAC peaks at or below -1 dBFS)',
    'line_lifts_db': LIFTS,
    'voice_margins_db': margins,
    'music_presence': PRESENCE,
    'listening_pass': 'not performed (no audio audition in this runtime)',
}, indent=2, ensure_ascii=False) + '\n')
print('ok', DUR, 'LUFS', final_lufs, 'encoded peak', round(float(encoded_peak), 2), 'presence', PRESENCE['music_minus_voice_during_speech_db'], PRESENCE['music_minus_voice_in_gaps_db'], 'seam', round(head, 1), round(tail, 1), 'clash', clash)
for m in margins:
    print(m)
