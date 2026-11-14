"""Episode 31 "Dalawa Sila" sound, v2 (an eerie score and a seamless loop, at the user's request) (Season 4 opener: Clarita Villanueva, Manila City Jail, 1953).

Sound language: NO SCORE. The jail itself: room tone, a far ceiling fan, the bulbs' hum, crickets
outside; a typewriter, the press, a cup, a cell door (ElevenLabs SFX); the bites are a soft, close,
wet pressure (synthesized), never a crunch; her voice is never heard. Presence is measured with the
whole non-voice bed. -14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep31_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep31-clarita-v2'
VOICE = ROOT / 'public/assets/audio/ep31-clarita-v1/voice'  # the v1 lines, unchanged
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep31-clarita-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(31031)
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









# key times: must match K in src/horror/ep31/Episode31.tsx
l = lambda i: L[i]
BITE = (0.3, 2.6)
CUT_WALL = l('l02')['start'] - 0.3
CUT_COR = l('l02')['start'] + 4.8
DOOR = (l('l03')['start'] - 1.6, l('l03')['start'] - 0.5)
CUT_CELL = l('l03')['start'] - 0.3
CUP = (l('l03')['start'] + 0.1, l('l03')['start'] + 1.6)
TALL = l('l03')['start'] + 2.9
SMALL = l('l03')['start'] + 5.6
CUT_EXAM = l('l04')['start'] - 0.3
TOUCH = (l('l04')['start'] + 3.0, l('l04')['start'] + 5.6)
BITE2 = (l('l04')['end'] + 0.15, l('l04')['end'] + 1.0)
CUT_PRESS = l('l05')['start'] - 0.3
CUT_MAYOR = l('l05')['start'] + 2.4
HAT = l('l05')['end'] + 0.15
CUT_PHOTO = l('l06')['start'] - 0.3
FLASH1 = l('l06')['start'] - 0.15
SIT = (l('l06')['start'] + 2.2, l('l06')['end'] - 0.4)
FLASH2 = l('l06')['end'] + 0.18
CUT_PRAYER = l('l07')['start'] - 0.3
RIPPLE = (l('l07')['start'] + 1.4, l('l07')['start'] + 4.4)
CUT_REPORT = l('l08')['start'] - 0.3
TYPE_STOP = l('l08')['end'] + 0.3
WRIST = (l('l08')['end'] + 0.6, l('l08')['end'] + 2.0)
LOOP = l('l08')['end'] + 2.25  # v2: the last shot is the first shot (her clean forearm); no black
BLACK = DUR
STINGERS = [CUT_WALL, CUT_CELL, BITE2[0], HAT, FLASH1, FLASH2, WRIST[0]]
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep31-{name}.mp3'
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
inside = span(0, CUT_WALL, 0.002) + span(CUT_CELL, CUT_PRESS, 0.002) + span(CUT_MAYOR, BLACK, 0.002)
outside = span(CUT_WALL, CUT_COR, 0.002)
corridor = span(CUT_COR, CUT_CELL, 0.002)
press = span(CUT_PRESS, CUT_MAYOR, 0.002)

# ------------------------------------------------------------------ beds: the jail (no score)
amb = np.zeros((N, 2))
room = unit(np.stack([filt(rng.standard_normal(N), SR, lo=60, hi=500), filt(rng.standard_normal(N), SR, lo=60, hi=500)], 1))
amb += room * (0.02 * (inside + corridor) * duck)[:, None]
# a slow ceiling fan somewhere down the block: a soft whir with a tick each turn
fan = filt(rng.standard_normal(N), SR, lo=300, hi=1800) * (0.6 + 0.4 * np.sin(2 * np.pi * qf(2.2) * T))
amb += st(unit(fan) * 0.006 * inside * duck)
# mains hum of the bulbs in the corridor
hum = np.sin(2 * np.pi * 120 * T) * 0.5 + 0.25 * np.sin(2 * np.pi * 240 * T)
amb += st(hum * 0.006 * (corridor + 0.4 * inside))
# outside: crickets and a far city
cr = np.zeros(N)
for f0 in (4200, 4700, 5300):
    cr += np.sin(2 * np.pi * f0 * T) * (np.sin(2 * np.pi * rng.uniform(13, 18) * T) > 0.4) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(0.6, 1.1) * T))
amb += st(cr * 0.004 * outside * duck)
city = unit(filt(rng.standard_normal(N), SR, lo=80, hi=700))
amb += st(city * 0.005 * outside * duck)
# the press
amb += xloop(sfx('press-2'), DUR) * (0.7 * press * (0.5 + 0.5 * duck))[:, None]
# the flame of the lamp in the prayer: a soft flutter that bends with it
pray = span(CUT_PRAYER, CUT_REPORT, 0.002)
fl = filt(rng.standard_normal(N), SR, lo=200, hi=1200) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 5.3 * T)))
bend = env([(0, 0.3), (RIPPLE[0], 0.3), ((RIPPLE[0] + RIPPLE[1]) / 2, 1.0), (RIPPLE[1], 0.3), (DUR, 0.3)])
amb += st(unit(fl) * 0.01 * pray * bend)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def bite(at, gain=0.12, n_press=3, spacing=0.22):
    """A bite: soft, close and wet: a low pressure thump and a short damp squelch, tooth by tooth."""
    for i in range(n_press):
        k = int(0.18 * SR)
        tt = np.arange(k) / SR
        thump = np.sin(2 * np.pi * (70 - 25 * tt) * tt) * np.exp(-tt * 22)
        sq = filt(rng.standard_normal(k), SR, lo=500, hi=3500) * np.exp(-tt * 35) * (0.5 + 0.5 * np.sin(2 * np.pi * 38 * tt))
        place(fx, st((thump * 0.7 + sq * 0.5) * gain), at + i * spacing + rng.uniform(-0.02, 0.02))


def breath_in(at, seconds=0.9, gain=0.05):
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    b = filt(rng.standard_normal(n), SR, lo=700, hi=5000) * np.sin(np.pi * tt / seconds) ** 2
    place(fx, st(b * gain), at)


def step(at, gain=0.08, hard=False):
    k = int(0.07 * SR)
    tt = np.arange(k) / SR
    x = filt(rng.standard_normal(k), SR, lo=200 if not hard else 900, hi=2500 if not hard else 6000) * np.exp(-tt * (60 if not hard else 90))
    place(fx, st(x * gain), at)


# the hook: a held breath, then the teeth press in. v2: the breath starts before the loop point and
# finishes after it, so the seam is inside one breath
breath_in(DUR - 0.3, 0.6, 0.04)
breath_in(-0.3, 0.6, 0.04)
bite(BITE[0] + 0.05, 0.14, 4, 0.5)
# outside: the guard runs along the wall, his lamp's chain swinging
for t0 in np.arange(CUT_WALL + 0.2, CUT_COR - 0.1, 0.28):
    step(t0, 0.04 * float(duck[int(t0 * SR)]) + 0.01)
    k = int(0.05 * SR)
    place(fx, pan(np.sin(2 * np.pi * 3100 * np.arange(k) / SR) * np.exp(-np.arange(k) / SR * 80) * 0.012, -0.3), t0 + 0.12)
# the corridor: our footsteps, then keys and the door
for t0 in np.arange(CUT_COR + 0.2, DOOR[0] - 0.6, 0.62):
    step(t0, 0.035 * float(duck[int(t0 * SR)]) + 0.01)
place(fx, sfx('door-3'), DOOR[0] - 0.5, -8)
# the cell: the cup rolls by itself; the shadows come with a low swell
cup = sfx('cup-4')[: int((CUP[1] - CUP[0] + 0.4) * SR)]
place(fx, fade(cup, 0.02, 0.2), CUP[0], -10)
for at, g in ((TALL - 0.6, 0.016), (SMALL - 0.6, 0.012)):
    n = int(2.2 * SR)
    tt = np.arange(n) / SR
    sw = (np.sin(2 * np.pi * 110 * tt) + 0.5 * np.sin(2 * np.pi * 164.8 * tt) + 0.3 * np.sin(2 * np.pi * 233 * tt)) * np.sin(np.pi * tt / 2.2) ** 2 * g
    place(fx, st(sw), at)
# the exam: the finger on the wet mark; then the second bite, in the gap
k0 = (TOUCH[0] + TOUCH[1]) / 2
n = int(0.25 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=1500, hi=6000) * np.exp(-tt * 25) * 0.02), k0)
bite(BITE2[0], 0.13, 3, 0.22)
hit(BITE2[0] + 0.02, 0.18, 44)
# the mayor: heel clicks on concrete, then the hat falls
for t0 in np.arange(CUT_MAYOR + 0.05, CUT_MAYOR + 1.6, 0.45):
    step(t0, 0.06, hard=True)
k = int(0.3 * SR)
tt = np.arange(k) / SR
place(fx, st(filt(rng.standard_normal(k), SR, lo=120, hi=1500) * np.exp(-tt * 18) * 0.12), HAT + 0.38)
place(fx, st(filt(rng.standard_normal(int(0.5 * SR)), SR, lo=300, hi=2000) * np.exp(-np.arange(int(0.5 * SR)) / SR * 6) * 0.025), HAT + 0.45)
# the photographer's flashbulbs: a pop and the bulb's tick; a low hit on the second
for fa in (FLASH1, FLASH2):
    k = int(0.12 * SR)
    tt = np.arange(k) / SR
    place(fx, st(filt(rng.standard_normal(k), SR, lo=600, hi=8000) * np.exp(-tt * 40) * 0.2 + np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 30) * 0.06), fa)
    k = int(0.6 * SR)
    tt = np.arange(k) / SR
    place(fx, st(np.sin(2 * np.pi * (5200 + 900 * tt) * tt) * np.exp(-tt * 5) * 0.006), fa + 0.12)
hit(FLASH2 + 0.03, 0.22, 42)
# the cot takes weight: its springs creak, slowly
for i, t0 in enumerate(np.linspace(SIT[0], SIT[1] - 0.4, 4)):
    k = int(0.45 * SR)
    tt = np.arange(k) / SR
    cr2 = filt(np.sign(np.sin(2 * np.pi * (330 + 60 * i + 80 * np.sin(2 * np.pi * 2 * tt)) * tt)) * rng.uniform(0.5, 1, k), SR, lo=400, hi=3000) * np.sin(np.pi * tt / 0.45) * 0.012
    place(fx, pan(cr2, 0.2), t0)
# prayer: something crosses under the blanket (a slow drag of cloth)
n = int((RIPPLE[1] - RIPPLE[0]) * SR)
tt = np.arange(n) / SR
dr = filt(rng.standard_normal(n), SR, lo=400, hi=4000) * np.sin(np.pi * tt / (RIPPLE[1] - RIPPLE[0])) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * tt))
seg = speech[int(RIPPLE[0] * SR):int(RIPPLE[0] * SR) + n]
place(fx, st(dr * 0.03 * (1 - 0.5 * seg)), RIPPLE[0])
# the report: the typewriter, until the hands stop; then the bite on the wrist, and silence
tw = xloop(sfx('typewriter-4'), TYPE_STOP - CUT_REPORT)
tw[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))[:, None]
place(fx, tw * (0.55 + 0.45 * duck[int(CUT_REPORT * SR):int(CUT_REPORT * SR) + len(tw)])[:, None], CUT_REPORT, -6)
breath_in(WRIST[0] - 0.5, 0.45, 0.035)
bite(WRIST[0], 0.15, 4, 0.32)
hit(WRIST[1] - 0.1, 0.24, 40)
write(OUT / 'stem-foley-fx.wav', fx)
# ------------------------------------------------------------------ v2: the score (eerie, low, minor; the user asked for it)
# Built to loop: every tone has a whole number of cycles over the episode (qf) and every envelope
# ends where it starts, so the score meets itself at the seam.
mus = np.zeros((N, 2))
loop_lvl = 0.7
drone_e = env([(0, loop_lvl), (CUT_CELL, 0.9), (TALL, 1.1), (CUT_EXAM, 0.8), (BITE2[0], 1.1), (CUT_PHOTO, 0.9), (FLASH2, 1.4), (CUT_PRAYER, 0.8), (RIPPLE[1], 1.0), (WRIST[0], 1.3), (LOOP, loop_lvl), (DUR, loop_lvl)])
mus += st(hs.drone_mid(T, qf, drone_e, root=58.27) * 1.7)
str_e = env([(0, 0.45), (CUT_WALL, 0.55), (CUT_CELL, 0.8), (SMALL, 1.1), (CUT_EXAM, 0.7), (BITE2[1], 1.0), (CUT_PRESS, 0.6), (FLASH1, 0.9), (FLASH2, 1.5), (CUT_PRAYER, 0.7), (WRIST[0], 1.3), (LOOP, 0.45), (DUR, 0.45)])
trem = env([(0, 0.25), (CUT_CELL, 0.5), (TALL, 0.8), (CUT_EXAM, 0.4), (SIT[0], 0.7), (FLASH2, 1.0), (CUT_PRAYER, 0.4), (TYPE_STOP, 0.9), (LOOP, 0.25), (DUR, 0.25)])
mus += st(hs.strings(T, qf, [116.54, 123.47, 174.61], str_e, trem, SR, seed=3101) * 2.3)
# a detuned music-box lullaby (an original tune), once after the hook and once, slower, before the end
THEME = [329.63, 311.13, 261.63, 0, 246.94, 261.63, 220.0, 0, 207.65, 220.0, 196.0]
place(mus, hs.music_box(SR, THEME, 0.42, 0.975, seed=3103), l('l01')['end'] + 0.05, -1.0)
place(mus, hs.music_box(SR, THEME[:7], 0.55, 0.96, seed=3104), CUT_PRAYER + 0.2, -3.0)
# bowed metal under the shadows
place(mus, st(hs.metal_bow(SR, 5.0, 1120.0, seed=3105)), TALL - 1.0, 2.0)
# the second flash: a riser and a reversed swell end on it, then the stinger
place(mus, st(hs.riser(SR, 1.6, seed=3106)), FLASH2 - 1.6, -2.0)
place(mus, st(hs.reverse_swell(SR, [116.54, 174.61, 246.94], 0.9, seed=3107)), FLASH2 - 0.9)
place(mus, hs.stinger(SR, seed=3108, size=1.2), FLASH2)
place(mus, hs.stinger(SR, seed=3109, size=0.7), BITE2[0])
# a heartbeat from the prayer to the last bite, quickening; then the last stinger on the wrist
place(mus, st(hs.heartbeat(SR, CUT_PRAYER + 1.0, WRIST[0], 58, 112, gain=0.9, seed=3110)), CUT_PRAYER + 1.0)
place(mus, hs.stinger(SR, seed=3111, size=1.0), WRIST[0])
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-2.8)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep31-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep31DalawaSila',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep31-clarita/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep31-clarita/prompt.json'},
    'original_synthesis': [
        'v2 SCORE (the user asked for eerie/scary music): a mid-band drone, a detuned string cluster with tremolo, an original detuned music-box lullaby, bowed metal, a riser and reversed swell into the second flash, stingers, a heartbeat (scripts/horror_score.py); all tones loop-quantised',
        'the jail itself: room tone, a ceiling fan, bulbs humming, crickets outside',
        'the bites (a soft, close, wet pressure, never a crunch), a held breath, running and walking steps, a lamp chain, heel clicks, the hat falling, flashbulbs, the cot springs, the blanket dragging, the lamp flame, low hits (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'yHb6WbLuxxQMhDPhRmGR', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (about 68 credits per prompt); picked by measurement, not by listening'},
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
