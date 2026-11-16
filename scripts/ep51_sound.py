"""Episode 51 "Po Po Po" (Season 6 opener: the too-tall woman in the white hat at a grandparents' farmhouse in
the Japanese countryside; retold from a 2ch post) sound.

Sound language (this episode's own signature; nothing from Episode 41's kit): summer cicadas that go dead
silent when she looks over the hedge; the sealed room's pressurised drone (an ElevenLabs 20 s loop); salt
hissing as it blackens; nails tapping round every papered window, then all at once; "po po po" outside; the
voice at the door muffled through the paper; the newspaper ripped off the window (the stinger); the car at
dawn and her slow heavy steps keeping pace on the gravel. A score of a low drone, a string cluster that
swells to the door and stops dead at the tear, bowed metal when she folds. -14 LUFS with an encoded-AAC
peak check; stems as FLAC.
Run: python3 scripts/ep51_sound.py
"""
import hashlib, json, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep51-popo-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep51-popo-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(51051)
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



# key times: must match K in src/horror/ep51/Episode51.tsx
l = lambda i: L[i]
HAT_STOP, PEEK = 4.2, 5.6
CUT_GRANDPA = l('l02')['start'] - 0.35
GRANDPA_TURN = l('l02')['start'] + 0.5
CUT_SEAL = l('l02')['start'] + 3.5
CUT_SALT = l('l02')['start'] + 7.0
CUT_DOOR = l('l03')['start'] - 0.3
SHUT = l('l03')['end'] - 0.6
CUT_NIGHT = l('l03')['end'] + 0.3
SUB = l('l03')['end'] + 5.45
TAPS = [l('l04')['start'] + 3.3 + d for d in (0.6, 1.5, 2.0)]
TAPS_ALL = l('l04')['start'] + 5.1
POPO = l('l04')['end'] + 0.25
CUT_SHADOW = l('l04')['end'] + 1.0
FOLD = [l('d01')['start'] + 0.1, l('d01')['start'] + 2.6]
DROP = [l('d01')['start'] + 2.6, l('d01')['start'] + 4.2]
TILT = l('d01')['end'] + 0.35
CUT_TWO = l('l06')['start'] - 0.4
CUT_TEAR = l('l06')['end'] + 0.15
TEAR = l('l06')['end'] + 0.3
CUT_ROAD = l('l07')['start'] - 0.25
CUT_CAR = l('l07')['start'] + 4.0
LOOP = DUR - 1.8
STINGERS = [TEAR]
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}

def sfx(name, gain_db=0.0):
    path = SFX / (f'{name}.mp3' if re.match(r'ep\d', name) else f'ep51-{name}.mp3')
    SFX_USED[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    x = load(path, 2)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-12) * 0.1  # unit level: -20 dB RMS
    return x * db(gain_db)


def span(a, b, ramp=0.03):
    return env([(-10, 0), (a - ramp, 0), (a, 1), (b, 1), (b + ramp, 0), (DUR + 10, 0)])


def pan(x, p):
    x = x if x.ndim == 1 else x.mean(1)
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1)


def loop_to(x, seconds):
    n = int(seconds * SR)
    reps = int(np.ceil(n / len(x))) + 1
    return np.concatenate([x] * reps)[:n]


def xloop(x, seconds, fade_s=0.25):
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
    e = np.abs(x)
    a, r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    env_ = np.zeros_like(e)
    lvl = 0.0
    for i in range(0, len(e), 48):
        m = e[i:i + 48].max()
        lvl = a ** 48 * lvl + (1 - a ** 48) * m if m > lvl else r ** 48 * lvl + (1 - r ** 48) * m
        env_[i:i + 48] = lvl
    over = np.maximum(0, 20 * np.log10(env_ + 1e-9) - thresh_db)
    y = x * 10 ** (-over * (1 - 1 / ratio) / 20)
    y = y * 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-12)) / 20)
    c = 10 ** ((-21.0 + 12.0) / 20)
    return np.tanh(y / c) * c


def peak_cut(x, before=0.02, after=0.25):
    """the loudest moment of a clip, cut out with a short window"""
    m = x if x.ndim == 1 else x.mean(1)
    hp = int(0.01 * SR)
    ee = np.array([np.sqrt(np.mean(m[i:i + hp] ** 2)) for i in range(0, len(m) - hp, hp)])
    p0 = int(np.argmax(ee)) * hp
    c = m[max(0, p0 - int(before * SR)): p0 + int(after * SR)].copy()
    return c * np.hanning(len(c)) ** 0.3


# ------------------------------------------------------------------ voice (dry and close; the voice at the door through paper and a corridor)
voice = np.zeros((N, 2))
for lid, ln in L.items():
    v = load(VOICE / f'{lid}.wav')
    if ln['kind'] == 'door':
        v = filt(v, SR, lo=220, hi=2800)
        v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
        v = compress(v)
        v = verb(v, 1.1, 0.22, seed=31, bright=2200)
        place(voice, pan(v if v.ndim == 1 else v.mean(1), 0.35), ln['start'], gain=-2.0)
        continue
    v = filt(v, SR, lo=80, hi=11000)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = compress(v)
    v = verb(v, 0.5, 0.03, seed=30, bright=3000)
    place(voice, v, ln['start'], gain=-1.0)
speech = np.zeros(N)
for ln in L.values():
    speech = np.maximum(speech, env([(0, 0), (ln['start'] - 0.1, 0), (ln['start'], 1), (ln['end'], 1), (ln['end'] + 0.25, 0), (DUR, 0)]))
duck = 1 - speech * (1 - db(-9))

OUT.mkdir(parents=True, exist_ok=True)


def wrap(x):
    """Fold a bed longer than the episode back onto its start, so it runs on across the loop seam."""
    y = x[:N].copy()
    y[:len(x) - N] += x[N:]
    return y


day = np.clip(span(-10, CUT_SEAL, 0.002) + (T >= LOOP), 0, 1)
dusk = span(CUT_SEAL, CUT_NIGHT, 0.002)
night = span(CUT_NIGHT, CUT_ROAD, 0.002)
dawn = span(CUT_ROAD, LOOP, 0.002)
hush = span(PEEK + 0.55, PEEK + 2.6, 0.04)  # the cicadas stop dead when she looks over the hedge
tearhush = span(TEAR + 0.4, CUT_ROAD, 0.05)

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
cic = sfx('cicadas-1')
cbed = wrap(xloop(filt(cic.mean(1), SR, lo=900, hi=12000), DUR + 3, 0.6))
amb += cbed * (db(-11) * day * (1 - hush) * (0.75 + 0.25 * duck))[:, None]
amb += cbed * (db(-24) * dusk)[:, None]  # far through the walls as they seal the room
rm = sfx('room-2')
rbed = wrap(xloop(rm, DUR + 3, 0.8))
amb += rbed * (db(-13) * night * (1 - 0.85 * tearhush) * (0.7 + 0.3 * duck))[:, None]
amb += rbed * (db(-26) * dusk)[:, None]
car = sfx('car-4')
kbed = wrap(xloop(filt(car.mean(1), SR, lo=60, hi=9000), DUR + 3, 0.5))
amb += kbed * (db(-14) * dawn * (0.7 + 0.3 * duck))[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# the hat brushing along the hedge top as she walks (leaves), from the left to the centre
for i, at in enumerate(np.arange(-1.6, HAT_STOP, 0.62)):
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    br = filt(rng.standard_normal(n), SR, lo=1800, hi=7000) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.02
    place(fx, pan(br, -0.6 + 0.6 * min(1, (at + 1.6) / 5.8)), at if at >= 0 else at + DUR)
# "po po po" at the peek (in the hush), and outside the sealed room before the door
po = sfx('popo-2')
pm = fade(po.mean(1), 0.02, 0.3)
place(fx, pan(verb(filt(pm, SR, lo=120, hi=2600), 1.2, 0.25, seed=5101, bright=2000), -0.1), PEEK + 0.7, -12.0)
place(fx, pan(verb(filt(fade(pm[: int(1.15 * SR)], 0.02, 0.25), SR, lo=120, hi=1800), 0.9, 0.3, seed=5102, bright=1500), 0.4), POPO - 0.2, -9.0)
# Grandpa's breath catching
n = int(0.6 * SR)
tt = np.arange(n) / SR
place(fx, pan(filt(rng.standard_normal(n), SR, lo=500, hi=3000) * np.sin(np.pi * tt / tt[-1]) ** 3 * 0.02, 0.1), GRANDPA_TURN + 0.6)
# paper pressed onto the window and taped (a rustle), the salt poured
n = int(2.4 * SR)
tt = np.arange(n) / SR
rus = filt(rng.standard_normal(n), SR, lo=1200, hi=6000) * (0.5 + 0.5 * np.abs(np.sin(tt * 7))) * np.sin(np.pi * tt / tt[-1]) * 0.03
place(fx, pan(rus, -0.2), CUT_SEAL + 0.4)
sl = sfx('salt-2')
place(fx, pan(fade(xloop(sl, 2.0, 0.2).mean(1), 0.1, 0.3), 0.2), CUT_SALT + 0.2, -8.0)
# the sliding door running in its groove, and its clack shut
n = int(1.0 * SR)
tt = np.arange(n) / SR
slide = filt(rng.standard_normal(n), SR, lo=150, hi=1400) * np.sin(np.pi * tt / tt[-1]) * 0.05
place(fx, pan(slide, 0.5), SHUT - 1.0)
n = int(0.25 * SR)
tt = np.arange(n) / SR
clack = (filt(rng.standard_normal(n), SR, lo=300, hi=3000) * np.exp(-tt * 40) * 0.5 + np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 30) * 0.3)
place(fx, pan(clack, 0.5), SHUT)
# the salt hissing as it turns, under the silent stretch
place(fx, pan(fade(xloop(sl, TAPS[0] - CUT_NIGHT - 1.0, 0.2).mean(1), 1.5, 0.5), -0.2), CUT_NIGHT + 1.0, -16.0)
# nails on the glass behind the paper: one, another window, the first again; then every window at once
def nail(at, p, g=0.0):
    n = int(0.06 * SR)
    tt = np.arange(n) / SR
    k = filt(rng.standard_normal(n), SR, lo=2000, hi=9000) * np.exp(-tt * 120) * 0.35 + np.sin(2 * np.pi * 2300 * tt) * np.exp(-tt * 90) * 0.08
    place(fx, pan(filt(k, SR, lo=1500, hi=7000), p), at, g)
for at, p in zip(TAPS, (-0.3, -0.8, -0.3)):
    for j in range(3):
        nail(at + j * 0.11, p)
tp = sfx('taps-3')
for j in range(30):
    nail(TAPS_ALL + j * 0.028 + 0.01 * rng.standard_normal(), rng.uniform(-1, 1), -2.0 + 2 * rng.standard_normal())
place(fx, pan(fade(tp.mean(1)[: int(0.9 * SR)], 0.01, 0.2), 0.0), TAPS_ALL, -6.0)
# the hallway lamp's hum behind the door
lamp = np.sin(2 * np.pi * qf(100) * T) * 0.004 + np.sin(2 * np.pi * qf(200) * T) * 0.002
fx += pan(lamp * span(CUT_SHADOW, CUT_TWO, 0.002), 0.5)
# a floorboard taking her weight as she folds
n = int(0.8 * SR)
tt = np.arange(n) / SR
creak = filt(np.sin(2 * np.pi * (220 + 60 * np.sin(tt * 9)) * tt) * (0.5 + 0.5 * rng.standard_normal(n) * 0.2), SR, lo=150, hi=1200) * np.sin(np.pi * tt / tt[-1]) * 0.04
place(fx, pan(creak, 0.5), FOLD[0] + 0.3)
place(fx, pan(creak, 0.5), DROP[0] + 0.2, -3.0)
# the newspaper ripped off the window: the stinger, then near-silence and her slow breath on the glass
te = sfx('tear-4')
place(fx, te, TEAR - 0.02, -1.0)
n = int(1.6 * SR)
tt = np.arange(n) / SR
bth = filt(rng.standard_normal(n), SR, lo=250, hi=2000) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.012
place(fx, pan(bth, 0.0), TEAR + 0.6)
# her steps on the gravel beside the car, slow and heavy, one every 1.21 s (her stride in the picture)
for at in np.arange(CUT_ROAD + 0.3, LOOP, np.pi / 2.6):
    n = int(0.4 * SR)
    tt = np.arange(n) / SR
    thud = np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 14) * 0.25 + filt(rng.standard_normal(n), SR, lo=900, hi=5000) * np.exp(-tt * 18) * 0.05
    place(fx, pan(thud, -0.5 if at > CUT_CAR else -0.3), at, -3.0)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the score
mus = np.zeros((N, 2))
d_e = env([(-10, 0.2), (CUT_GRANDPA, 0.35), (CUT_SEAL, 0.5), (CUT_NIGHT, 0.8), (TAPS[0], 1.1), (CUT_SHADOW, 1.2), (DROP[1], 1.6), (TEAR - 0.02, 1.7), (TEAR, 0.0), (CUT_ROAD, 0.0), (CUT_ROAD + 0.5, 0.5), (LOOP, 0.2), (DUR + 10, 0.2)])
mus += st(hs.drone_mid(T, qf, d_e, root=41.2) * 1.4)
str_e = env([(-10, 0.0), (CUT_NIGHT, 0.0), (TAPS[0], 0.7), (CUT_SHADOW, 0.9), (DROP[1], 1.6), (CUT_TWO, 1.2), (TEAR - 0.02, 1.8), (TEAR, 0.0), (CUT_ROAD + 0.5, 0.0), (CUT_CAR, 0.6), (LOOP - 0.1, 0.8), (LOOP, 0.0), (DUR + 10, 0.0)])
trem = env([(-10, 0.0), (CUT_SHADOW, 0.3), (CUT_TWO, 0.9), (DUR + 10, 0.9)])
mus += st(hs.strings(T, qf, [82.41, 87.31, 123.47, 130.81], str_e, trem, SR, seed=5108) * 2.0)
place(mus, st(hs.metal_bow(SR, 2.6, 640.0, seed=5109)), FOLD[0] + 0.2, -9.0)
place(mus, st(hs.metal_bow(SR, 2.2, 610.0, seed=5110)), TILT, -8.0)
place(mus, st(hs.riser(SR, 3.6, 120.0, 700.0, seed=5111)), TEAR - 3.6, -10.0)
place(mus, hs.stinger(SR, seed=5112, size=1.2), TEAR, -5.0)
place(mus, st(hs.heartbeat(SR, CUT_TWO, TEAR - 0.1, 70, 118, gain=0.3, seed=5113)), CUT_TWO)
mus = np.stack([filt(mus[:, 0], SR, lo=100, hi=12000), filt(mus[:, 1], SR, lo=100, hi=12000)], 1)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(3.5)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep51-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep51PoPoPo',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (ElevenLabs library voice)', 'credits': json.loads((ROOT / 'docs/production/ep51-popo/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep51-popo/prompt.json',
                       'door_voice': {'path': 'public/assets/audio/eleven-takes/ep51-door-voice-1.mp3', 'voice_id': 'S9V0fuqWOqX0i8Kb8ctu', 'voice_name': 'Alden - Tired Old Man (ElevenLabs library voice)'}},
    'original_synthesis': [
        'SCORE: a mid-band drone (root 41.2 Hz), a string cluster (E2 F2 B2 C3) that swells through the night to the door and stops dead at the tear, bowed metal when she folds and when her head tips, a riser into the tear, a heartbeat under Grandpa shaking his head, a synthesized stinger with the tear (scripts/horror_score.py); loop-quantised',
        'the leaves brushing as the hat glides, the cicadas cut dead at the peek, paper rustle, the sliding door and its clack, nail taps on glass (layered over the ElevenLabs taps), the hallway lamp hum, floorboard creaks, her breath on the glass, her heavy steps on the gravel (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'uHNGTmumzm2eTXu7RR4R', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': 'first run without duration set (7 prompts x 4 variations, 1-16 s, about 476 credits; all kept, the short ones as ep51-short-*); second run with duration_seconds and loop set (cicadas 15 s loop, room 20 s loop, po po po 6 s, taps 6 s, car 15 s loop; 20 variations, about 828 credits)',
                       'reused': 'none (no Episode 41 drone, riser, stinger, neck crack or music box)',
                       'note': 'picked by measurement (RMS, range), not by listening'},
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
