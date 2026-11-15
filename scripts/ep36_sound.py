"""Episode 36 "Sunugin Mo ang Damit" (Season 4, campus legend: the UP Ikot jeep) sound.

Sound language: the jeep's diesel and its rattle under everything inside (it runs across the loop seam),
the street lamps whooshing past, a coin tapped on the roof rail before each rider gets off, their steps
down; two coins on vinyl, the vinyl sinking under no one; a breath at your ear; the brakes, the idle; a
switch, a jacket, the fire; the jeep passing in the street. A loop-quantised eerie score. -14 LUFS with an
encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep36_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep36-ikot-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep36-ikot-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(36036)
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









# key times: must match K in src/horror/ep36/Episode36.tsx
l = lambda i: L[i]
CUT_CAMPUS = l('l02')['start'] - 0.3
CUT_RIDERS = l('l03')['start'] - 0.3
LEAVE = [l('l03')['start'] + 0.3, l('l03')['start'] + 2.4, l('l03')['start'] + 4.5]
CUT_COINS = l('l04')['start'] - 0.3
COIN = l('l04')['start'] + 2.2
SINK = (l('l04')['end'] - 0.3, l('l04')['end'] + 0.25)
CUT_ALONE = l('l04')['end'] + 0.3
LOOKS = l('l04')['end'] + 1.6
CUT_DRIVER = l('l05')['start'] - 0.3
STOP = (l('l05')['start'] - 0.1, l('l05')['start'] + 0.9)
CUT_ROOM = l('l06')['end'] + 0.4
LAMP_ON = l('l06')['end'] + 1.6
OFF = (l('l06')['end'] + 2.4, l('l06')['end'] + 3.2)
CUT_BURN = l('l07')['start'] - 0.3
CUT_PASS = l('l08')['start'] - 0.3
IN_PUDDLE = l('l08')['end'] + 0.25
LOOP = DUR - 1.7
STINGERS = [LOOKS, LAMP_ON, IN_PUDDLE]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep36-{name}.mp3'
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
inside = span(-1, CUT_CAMPUS, 0.002) + span(CUT_RIDERS, CUT_ROOM, 0.002) + span(LOOP, DUR + 1, 0.002)
campus = span(CUT_CAMPUS, CUT_RIDERS, 0.002)
passing = span(CUT_PASS, LOOP, 0.002)
room = span(CUT_ROOM, CUT_BURN, 0.002)
burn = span(CUT_BURN, CUT_PASS, 0.002)
outdoors = campus + passing + room * 0.4 + burn
moving = 1 - span(STOP[0], CUT_ROOM, 0.3)  # the jeep stops for her

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
# the diesel: a recorded rattle looped, under a synthesized loop-quantised throb (idle when stopped)
d4 = sfx('diesel-4')
diesel_rec = xloop(d4, DUR)
throb = np.zeros(N)
for k, a in ((1, 1.0), (2, 0.6), (3, 0.35), (4, 0.2), (6, 0.1)):
    throb += a * np.sin(2 * np.pi * qf(26.0 * k) * T + k)
throb *= 0.6 + 0.4 * np.sin(2 * np.pi * qf(13.0) * T) ** 2
throb = filt(throb, SR, lo=40, hi=900)
rumble = filt(rng.standard_normal(N), SR, lo=60, hi=500)
in_e = inside * (0.45 + 0.55 * moving)
amb += diesel_rec * (db(-14) * in_e * (0.5 + 0.5 * duck))[:, None]
amb += st(unit(throb) * 0.03 * in_e * (0.5 + 0.5 * duck))
amb += st(unit(rumble) * 0.02 * inside * moving * (0.5 + 0.5 * duck))
# the street lamps passing the windows: a soft whoosh each sweep (2.5 s, as in the picture)
wh = np.zeros(N)
for s0 in np.arange(0.0, DUR, 2.5):
    n = int(0.9 * SR)
    tt = np.arange(n) / SR
    x = filt(rng.standard_normal(n), SR, lo=300, hi=2500) * np.sin(np.pi * tt / tt[-1]) ** 2
    i = int(s0 * SR)
    wh[i:i + n] += x[:max(0, min(n, N - i))]
amb += st(wh * 0.01 * inside * moving * duck)
# the night outside: crickets and a far road
cr = np.zeros(N)
for f0 in (4300, 5100):
    cr += np.sin(2 * np.pi * qf(f0) * T) * (np.sin(2 * np.pi * qf(rng.uniform(12, 16)) * T) > 0.5)
amb += st(cr * 0.004 * np.clip(outdoors + 0.25 * inside, 0, 1) * duck)
amb += st(unit(filt(rng.standard_normal(N), SR, lo=100, hi=1200)) * 0.006 * np.clip(outdoors, 0, 1) * duck)
# the fire, looped while it burns
f4 = sfx('fire-4')
amb += xloop(f4, DUR) * (db(-12) * burn * (0.5 + 0.5 * duck))[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def jeep_pass(a, b, z0, z1, cam_z, gain):
    """The Ikot outside: its engine louder as it nears the camera."""
    n = int((b - a) * SR)
    tt = np.arange(n) / SR
    z = z0 + (z1 - z0) * tt / (b - a)
    d = np.sqrt((z - cam_z) ** 2 + 4.0)
    g = 1 / (1 + d / 3)
    i = int(a * SR)
    x = (diesel_rec[i:i + n] * 0.5 + st(unit(throb[i:i + n]) * 0.08)) * (g * gain)[:, None]
    place(fx, x, a)


jeep_pass(CUT_CAMPUS, CUT_RIDERS, -40, -3, 5.0, 0.5)
jeep_pass(CUT_PASS, LOOP, -8, 7, 2.2, 0.5)
# the riders: a coin tapped on the rail ("para"), the jeep slows a little, steps down
c1 = sfx('coin-1')
for at in LEAVE:
    place(fx, c1[:int(0.8 * SR)] * (0.5 + 0.5 * duck[int((at - 0.7) * SR):int((at - 0.7) * SR) + int(0.8 * SR)])[:, None], at - 0.7, -13)
    for k in range(4):
        n = int(0.12 * SR)
        x = filt(rng.standard_normal(n), SR, lo=150, hi=1500) * np.exp(-np.arange(n) / SR * 30)
        place(fx, st(x * 0.03), at + 0.6 + k * 0.38)


def clink(at, gain=0.04, f0=3200):
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f0 * r * tt) * np.exp(-tt * (18 + 6 * r)) for r in (1.0, 1.52, 2.31))
    place(fx, st(x * gain), at)


# the coins: the second one drops; the vinyl sinks beside you
clink(COIN, 0.035)
clink(COIN + 0.09, 0.02, 2900)
v2 = sfx('vinyl-2')
place(fx, v2, SINK[0] - 0.1, -6)
place(fx, v2, CUT_ALONE + 0.2, -12)


def breath(at, seconds=1.6, gain=0.04, lo=300, hi=2600):
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    x = filt(rng.standard_normal(n), SR, lo=lo, hi=hi) * np.sin(np.pi * tt / seconds) ** 1.5
    place(fx, pan(x * gain, 0.6), at)


# a breath at your ear: before it looks at you; and across the loop seam
breath(LOOKS - 1.2, 1.1, 0.04)
breath(LOOP + 0.2, 1.8, 0.035)
breath(LOOP + 0.2 - DUR, 1.8, 0.035)
# the brakes (a dry squeal) and the handbrake
n = int(0.8 * SR)
tt = np.arange(n) / SR
sq = np.sin(2 * np.pi * (2400 - 600 * tt) * tt) * rng.uniform(0.6, 1, n) * np.sin(np.pi * tt / tt[-1]) * 0.006
place(fx, st(filt(sq, SR, lo=1500, hi=5000)), STOP[0])
n = int(0.25 * SR)
place(fx, st(filt(rng.standard_normal(n), SR, lo=800, hi=4000) * np.exp(-np.arange(n) / SR * 14) * 0.03), STOP[1] + 0.1)
# her room: the switch, the jacket coming off
n = int(0.03 * SR)
place(fx, st(filt(rng.standard_normal(n), SR, lo=1500, hi=7000) * 0.08), LAMP_ON - 0.02)
n = int((OFF[1] - OFF[0] + 0.3) * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=1200, hi=6000) * np.sin(np.pi * tt / tt[-1]) * 0.012), OFF[0])
# the fire catching
n = int(0.7 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=200, hi=3000) * np.sin(np.pi * np.minimum(1, tt / 0.2) / 2) * np.exp(-tt * 3) * 0.06), CUT_BURN + 0.05)
hit(IN_PUDDLE, 0.2, 41)
write(OUT / 'stem-foley-fx.wav', fx)
# ------------------------------------------------------------------ the score (eerie, low; loop-quantised)
mus = np.zeros((N, 2))
lv = 0.85
drone_e = env([(0, lv), (CUT_CAMPUS, 0.6), (CUT_RIDERS, 0.8), (CUT_COINS, 0.9), (CUT_ALONE, 1.3), (CUT_DRIVER, 1.1), (CUT_ROOM, 1.0), (LAMP_ON, 1.5), (CUT_BURN, 1.2), (CUT_PASS, 1.0), (IN_PUDDLE, 1.5), (LOOP, lv), (DUR, lv)])
mus += st(hs.drone_mid(T, qf, drone_e, root=48.99) * 1.8)
str_e = env([(0, 0.6), (CUT_CAMPUS, 0.4), (CUT_RIDERS, 0.6), (CUT_ALONE, 1.2), (CUT_DRIVER, 0.9), (CUT_ROOM, 0.8), (LAMP_ON, 1.4), (CUT_BURN, 1.0), (IN_PUDDLE, 1.4), (LOOP, 0.6), (DUR, 0.6)])
trem = env([(0, 0.5), (CUT_CAMPUS, 0.2), (CUT_RIDERS, 0.4), (CUT_ALONE, 0.9), (CUT_DRIVER, 0.6), (LAMP_ON, 1.0), (CUT_PASS, 0.6), (LOOP, 0.5), (DUR, 0.5)])
mus += st(hs.strings(T, qf, [97.99, 103.83, 146.83], str_e, trem, SR, seed=3601) * 2.3)
# an original music-box figure that circles, like the route
THEME = [293.66, 349.23, 329.63, 261.63, 293.66, 0, 293.66, 349.23, 329.63, 246.94]
place(mus, hs.music_box(SR, THEME, 0.46, 0.96, seed=3603), CUT_CAMPUS + 0.4, -2.0)
place(mus, st(hs.metal_bow(SR, 4.0, 1110.0, seed=3604)), CUT_ALONE + 0.1, 1.0)
place(mus, st(hs.heartbeat(SR, CUT_ALONE, CUT_ROOM, 66, 96, gain=0.55, seed=3605)), CUT_ALONE)
place(mus, st(hs.reverse_swell(SR, [97.99, 146.83, 195.99], 0.8, seed=3606)), LAMP_ON - 0.8)
place(mus, hs.stinger(SR, seed=3607, size=0.8), LOOKS)
place(mus, hs.stinger(SR, seed=3608, size=1.0), LAMP_ON)
place(mus, st(hs.riser(SR, 1.2, seed=3609)), IN_PUDDLE - 1.2, -4.0)
place(mus, hs.stinger(SR, seed=3610, size=1.1), IN_PUDDLE)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep36-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep36SunuginMoAngDamit',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep36-ikot/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep36-ikot/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, an original circling music-box figure, bowed metal, a heartbeat while she is alone, a reversed swell, a riser and stingers (scripts/horror_score.py); loop-quantised',
        'the jeep: a loop-quantised diesel throb under the recorded rattle (idle when it stops), road rumble, the lamps whooshing past; crickets; the riders\' steps; coins clinking; a breath at your ear (across the loop seam); the brakes and handbrake; the switch; the jacket; the fire catching; the jeep passing outside; a low hit (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'todI6x3jsNGpt5SJUHcQ', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (about 68 credits per prompt); picked by measurement, not by listening'},
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
