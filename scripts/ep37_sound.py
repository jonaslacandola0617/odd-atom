"""Episode 37 "Pitong Biyernes" (Season 4, Siquijor folk belief: the barang and the healers) sound.

Sound language, at insect scale: chitin scraping inside the bamboo (huge, close; it runs across the loop
seam), the cork knocking, tiny steps on wood, the shell snapping open, the wings' drone; Good Friday dusk
(the sea, no bells); the flight; a sleeper's breath; under the skin; the healers' cauldron and fire on the
mountain; the medicine poured; in the silence, a click of wings inside him; the cough. A loop-quantised
eerie score. -14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep37_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep37-barang-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep37-barang-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(37037)
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









# key times: must match K in src/horror/ep37/Episode37.tsx
l = lambda i: L[i]
CORK = (0.6, 3.6)
ANTENNAE = l('l01')['end'] + 0.2
CUT_TABLE = l('l02')['start'] - 0.3
CUT_SILL = l('l03')['start'] - 0.3
WINGS = l('l03')['end'] + 0.1
TAKEOFF = l('l03')['end'] + 0.45
CUT_FLIGHT = l('l04')['start'] - 0.3
UNDER = l('l05')['start'] - 0.6
CUT_FACE = l('l05')['start'] - 0.3
LAND = l('l05')['start'] + 0.3
IN_EAR = l('l05')['end'] + 0.25
CUT_ARM = l('l06')['start'] - 0.3
RIPPLE = (l('l06')['start'] + 2.6, l('l06')['end'] + 0.6)
CUT_MOUNTAIN = l('l07')['start'] - 0.3
CUT_BOTTLE = l('l07')['end'] + 0.3
CLICK = l('l07')['end'] + 1.3
COUGH = l('l08')['end'] + 0.35
CUT_MAT = l('l08')['end'] + 0.6
LOOP = DUR - 1.7
STINGERS = [ANTENNAE, IN_EAR, COUGH]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep37-{name}.mp3'
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
lamp = span(-1, CUT_SILL, 0.002) + span(LOOP, DUR + 1, 0.002)  # the table under the lamp
dusk = span(CUT_SILL, CUT_FLIGHT, 0.002)
road = span(CUT_FLIGHT, CUT_FACE, 0.002)
room = span(CUT_FACE, CUT_MOUNTAIN, 0.002) + span(CUT_BOTTLE, LOOP, 0.002)
mountain = span(CUT_MOUNTAIN, CUT_BOTTLE, 0.002)
silence = span(CUT_BOTTLE + 0.7, COUGH - 0.05, 0.05)  # the room holds its breath

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
# the lamp's hiss and a room at night; crickets outside
amb += st(unit(filt(rng.standard_normal(N), SR, lo=1500, hi=6000)) * 0.004 * lamp)
amb += st(unit(filt(rng.standard_normal(N), SR, lo=90, hi=900)) * 0.008 * np.clip(lamp + room, 0, 1) * (1 - 0.8 * silence) * duck)
cr = np.zeros(N)
for f0 in (4400, 5200):
    cr += np.sin(2 * np.pi * qf(f0) * T) * (np.sin(2 * np.pi * qf(rng.uniform(12, 16)) * T) > 0.5)
amb += st(cr * 0.0025 * np.clip(lamp + road + 0.6 * room * (1 - silence), 0, 1) * duck)
# Good Friday dusk: the sea below, a little wind; no bells
sea = filt(rng.standard_normal(N), SR, lo=120, hi=1800) * (0.6 + 0.4 * np.sin(2 * np.pi * qf(0.12) * T) ** 2)
amb += st(unit(sea) * 0.018 * np.clip(dusk + 0.5 * mountain, 0, 1) * duck)
amb += st(unit(filt(rng.standard_normal(N), SR, lo=300, hi=3000)) * 0.008 * np.clip(dusk + mountain + road, 0, 1) * duck)
# the mountain: the cauldron bubbling and the fire, looped
c2 = sfx('cauldron-2')
amb += xloop(c2, DUR) * (db(-16) * mountain * (0.5 + 0.5 * duck))[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# chitin scraping inside the tube: huge and close; it runs across the loop seam
s2 = sfx('scrape-2')
scr = xloop(s2, DUR)
scr_e = span(-1, CUT_TABLE + 0.4, 0.15) + span(LOOP, DUR + 1, 0.002)
fx += scr * (db(-5) * scr_e * (0.4 + 0.6 * duck))[:, None]


def tick(at, gain=0.02, f0=3200):
    n = int(0.02 * SR)
    tt = np.arange(n) / SR
    x = filt(rng.standard_normal(n), SR, lo=f0 * 0.6, hi=min(9000, f0 * 2.2)) * np.exp(-tt * 300)
    place(fx, pan(x * gain, rng.uniform(-0.3, 0.3)), at)


def knock(at, gain=0.05):
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 420 * tt) * 0.6 + filt(rng.standard_normal(n), SR, lo=300, hi=2500)) * np.exp(-tt * 60)
    place(fx, st(x * gain), at)


# the cork knocking as it lifts and jiggles
for at in np.arange(CORK[0], CORK[1], 0.2):
    knock(at + rng.uniform(-0.03, 0.03), 0.045 * (0.5 + 0.5 * float(duck[int(at * SR)])))
# its tiny steps on the wood
for at in np.arange(CUT_TABLE + 0.3, CUT_SILL - 0.2, 0.07):
    tick(at, 0.012 * (0.4 + 0.6 * float(duck[int(at * SR)])))
for at in np.arange(LAND, IN_EAR - 0.1, 0.08):
    tick(at, 0.014 * (0.4 + 0.6 * float(duck[int(at * SR)])), 2600)
# the shell snapping open; the wings: drone at take-off, through the flight, at the landing
for at in (WINGS - 0.1, WINGS + 0.05):
    tick(at, 0.06, 1800)
b2 = sfx('buzz-2')
bz = xloop(b2, CUT_FACE - TAKEOFF + 0.2)
bz_e = env([(0, 0), (TAKEOFF, 0), (TAKEOFF + 0.2, 0.8), (CUT_FLIGHT, 0.6), (CUT_FLIGHT + 0.1, 1.0), (UNDER, 1.0), (UNDER + 0.25, 0.3), (CUT_FACE, 0.0), (DUR, 0)])
seg_ = bz * (bz_e[int(TAKEOFF * SR):int(TAKEOFF * SR) + len(bz)] * (0.5 + 0.5 * duck[int(TAKEOFF * SR):int(TAKEOFF * SR) + len(bz)]))[:, None]
place(fx, seg_, TAKEOFF, -4)
place(fx, b2[:int(0.9 * SR)] * np.linspace(1, 0, int(0.9 * SR))[:, None], LAND - 0.6, -8)
# the sleeper breathing, slow; held in the silence
br = np.zeros(N)
for s0 in np.arange(CUT_FACE, LOOP, 3.6):
    n = int(2.2 * SR)
    tt = np.arange(n) / SR
    x = filt(rng.standard_normal(n), SR, lo=200, hi=1600) * np.sin(np.pi * tt / tt[-1]) ** 2
    i = int(s0 * SR)
    br[i:i + n] += x[:max(0, min(n, N - i))]
fx += st(br * 0.012 * room * (1 - silence) * duck)
# under the skin: a slow wet creak while the ripple moves
n = int((RIPPLE[1] - RIPPLE[0]) * SR)
tt = np.arange(n) / SR
x = filt(rng.standard_normal(n), SR, lo=80, hi=600) * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * tt)) * np.sin(np.pi * tt / tt[-1])
place(fx, st(x * 0.03), RIPPLE[0])
# a rooster far off: morning
n = int(1.1 * SR)
tt = np.arange(n) / SR
f = 600 + 350 * np.sin(np.pi * np.minimum(1, tt / 0.9)) - 300 * (tt > 0.8) * (tt - 0.8) / 0.3
rooster = filt(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + np.sin(2 * np.pi * np.cumsum(f) / SR), SR, lo=400, hi=3000) * np.sin(np.pi * tt / tt[-1]) ** 0.5
place(fx, pan(verb(rooster * 0.012, 1.5, 0.35, seed=7), 0.5), CUT_ARM + 0.2)
# the medicine poured (glugs)
for k in range(5):
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * (300 + 200 * tt / 0.12 + 40 * k) * tt) * np.exp(-tt * 25)
    place(fx, st(x * 0.03), CUT_BOTTLE + 0.9 + k * 0.17)
# in the silence: a click of wings, from inside him (two dry clicks, muffled)
for at in (CLICK, CLICK + 0.09, CLICK + 0.6):
    n = int(0.015 * SR)
    x = filt(rng.standard_normal(n), SR, lo=900, hi=3500) * np.exp(-np.arange(n) / SR * 400)
    place(fx, st(x * 0.08), at)
# the cough
c4 = sfx('cough-4')
place(fx, c4, COUGH - 0.05, -4)
# the beetle on its back, legs scrabbling on the banig, until the loop
for at in np.arange(CUT_MAT + 0.1, LOOP, 0.06):
    tick(at, 0.012, 2400)
hit(COUGH, 0.2, 41)
write(OUT / 'stem-foley-fx.wav', fx)
# ------------------------------------------------------------------ the score (eerie, low; loop-quantised; it drops out in the silence)
mus = np.zeros((N, 2))
lv = 0.85
drone_e = env([(0, lv), (CUT_TABLE, 0.8), (CUT_SILL, 0.6), (CUT_FLIGHT, 1.1), (CUT_FACE, 1.3), (CUT_ARM, 1.2), (CUT_MOUNTAIN, 0.7), (CUT_BOTTLE, 0.9), (CUT_BOTTLE + 0.7, 0.15), (COUGH, 0.15), (COUGH + 0.1, 1.4), (LOOP, lv), (DUR, lv)])
mus += st(hs.drone_mid(T, qf, drone_e, root=41.2) * 1.8)
str_e = env([(0, 0.6), (CUT_TABLE, 0.5), (CUT_SILL, 0.4), (CUT_FLIGHT, 0.9), (CUT_FACE, 1.2), (CUT_ARM, 1.3), (CUT_MOUNTAIN, 0.5), (CUT_BOTTLE, 0.6), (CUT_BOTTLE + 0.7, 0.05), (COUGH, 0.05), (COUGH + 0.1, 1.2), (LOOP, 0.6), (DUR, 0.6)])
trem = env([(0, 0.5), (CUT_SILL, 0.2), (CUT_FLIGHT, 0.8), (CUT_ARM, 1.0), (CUT_MOUNTAIN, 0.2), (COUGH, 0.2), (COUGH + 0.1, 0.8), (LOOP, 0.5), (DUR, 0.5)])
mus += st(hs.strings(T, qf, [82.41, 87.31, 123.47], str_e, trem, SR, seed=3701) * 2.3)
# an original music-box figure of seven notes (seven Fridays)
THEME = [329.63, 311.13, 293.66, 0, 329.63, 349.23, 311.13, 246.94]
place(mus, hs.music_box(SR, THEME, 0.5, 0.96, seed=3703), CUT_TABLE + 0.6, -2.0)
place(mus, st(hs.metal_bow(SR, 4.0, 1180.0, seed=3704)), CUT_FLIGHT + 0.6, 0.0)
place(mus, st(hs.heartbeat(SR, CUT_FACE, CUT_MOUNTAIN, 62, 92, gain=0.55, seed=3705)), CUT_FACE)
place(mus, st(hs.reverse_swell(SR, [82.41, 123.47, 164.81], 0.8, seed=3706)), COUGH - 0.8, -4.0)
place(mus, hs.stinger(SR, seed=3707, size=0.6), ANTENNAE)
place(mus, hs.stinger(SR, seed=3708, size=1.0), IN_EAR)
place(mus, hs.stinger(SR, seed=3709, size=1.2), COUGH)
mus *= (1 - speech * (1 - db(-6)))[:, None]
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
take = ROOT / 'public/assets/audio/eleven-takes/ep37-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep37PitongBiyernes',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep37-barang/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep37-barang/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, an original seven-note music-box figure, bowed metal under the flight, a heartbeat from the face to the arm, a reversed swell into the cough, stingers (scripts/horror_score.py); loop-quantised; it drops almost to nothing in the silence before the cough',
        'the lamp hiss, room tone, crickets; the sea and wind at dusk (no bells: Good Friday); the cork knocking; tiny steps on wood and skin; the shell snapping open; the sleeper breathing; a wet creak under the skin; a far rooster; the medicine poured; two clicks of wings inside him; legs scrabbling on the banig; a low hit (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': '8392ieR7Wy214gWEniE8', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (about 68 credits per prompt); picked by measurement, not by listening'},
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
