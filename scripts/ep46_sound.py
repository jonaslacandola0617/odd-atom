"""Episode 46 "Huling Biyahe Pahilaga" (Season 5: the last bus north, a woman who boards at a ravine
curve and is gone; retold from experiences shared online) sound.

Sound language: the bus at night (an ElevenLabs 20 s loop) under every moving shot, folded across the
loop seam; when the bus stops it drops to an idle (the same loop, low-passed) with cicadas outside
(Episode 40's take). Every count in the picture is one click of the conductor's punch, cut from an
ElevenLabs take and placed on the frame his arm points (the hook's clicks straddle the seam). The air
brakes and the door (ElevenLabs) at the curve and again when the crew stops the bus. Her wet steps,
held then snapped, synthesized on each step of the picture; the vinyl as she sits (Episode 36); drips
on the vinyl; the strips' crackle when she is gone; the conductor's coins (Episode 36). A whisper
(Episode 41) behind me; a neck crack and the stinger on the lunge. A loop-quantised score over
Episode 41's drone. -14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep46_sound.py
"""
import hashlib, json, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep46-bus-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep46-bus-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(46046)
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








# key times: must match K in src/horror/ep46/Episode46.tsx
l = lambda i: L[i]
HOOK_CLICKS = [-1.5, -0.9, -0.3, 0.3]
CUT_ROAD = l('l02')['start'] - 0.3
CUT_CURVE = l('l03')['start'] - 0.3
STOP = l('l03')['start'] + 3.0
CUT_BOARD = l('l04')['start'] - 0.3
SIT = l('l04')['start'] + 3.3
CUT_COLLECT = l('l05')['start'] - 0.3
GONE = l('l05')['end'] - 0.85
BRAKE = l('l05')['end'] + 0.35
CUT_STOP = l('l06')['start'] - 0.3
COUNTS = [l('l06')['start'] + 0.9 + i * 0.42 for i in range(11)]
CUT_DENT = l('l07')['start'] - 0.3
CUT_COUNT = l('l08')['start'] - 0.3
RECOUNT = [l('l08')['start'] + 0.3 + i * 0.5 for i in range(4)]
SNAP = l('l08')['end'] + 0.6
LOOP = DUR - 1.7
STINGERS = [SNAP]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / (f'{name}.mp3' if re.match(r'ep\d', name) else f'ep46-{name}.mp3')
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






TV = np.where(T >= LOOP, T - DUR, T)
moving = np.clip(span(-10, CUT_ROAD, 0.002) + span(CUT_BOARD, CUT_STOP, 0.002) + (T >= LOOP), 0, 1)
outside = span(CUT_ROAD, CUT_BOARD, 0.002)
idle = np.clip(1 - moving - outside, 0, 1)

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
bl = sfx('busloop-1')
bus = wrap(xloop(filt(bl.mean(1), SR, lo=50, hi=9000), DUR + 3, 0.6))
amb += bus * (db(-7) * moving * (0.55 + 0.45 * duck))[:, None]
amb += np.stack([filt(bus[:, 0], SR, lo=40, hi=700), filt(bus[:, 1], SR, lo=40, hi=700)], 1) * (db(-8) * idle * (0.6 + 0.4 * duck))[:, None]
# outside: the engine passing (filtered), the ravine's wind, the cicadas at the curve
amb += np.stack([filt(bus[:, 0], SR, lo=60, hi=1800)] * 2, 1) * (db(-11) * outside * (0.6 + 0.4 * duck))[:, None]
amb += st(unit(filt(rng.standard_normal(N), SR, lo=200, hi=1200)) * 0.006 * outside * (0.6 + 0.4 * duck))
cic = sfx('ep40-cicadas-1')
amb += xloop(filt(cic.mean(1), SR, lo=1500, hi=9000), DUR, 0.4) * (db(-19) * (outside + idle * 0.6) * (0.5 + 0.5 * duck))[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# one click of the punch, cut from the take (its loudest onset)
pr = sfx('punch-4').mean(1)
hop = int(0.005 * SR)
e = np.array([np.sqrt(np.mean(pr[i:i + hop] ** 2)) for i in range(0, len(pr) - hop, hop)])
pk = int(np.argmax(e)) * hop
click = pr[max(0, pk - int(0.004 * SR)): pk + int(0.09 * SR)].copy()
click *= np.linspace(1, 0, len(click)) ** 1.5
click /= np.abs(click).max() + 1e-9


def punch(at, gain=0.35, p=0.1):
    x = verb(click * gain * rng.uniform(0.9, 1.05), 0.4, 0.08, seed=int(abs(at) * 100) + 3, bright=6000)
    place(fx, pan(x, p), at)


for c in HOOK_CLICKS:  # the hook's count straddles the seam
    punch(c, 0.32, 0.2)
    punch(DUR + c, 0.32, 0.2)
for c in COUNTS:
    punch(c, 0.3, -0.1)
for c in RECOUNT:
    punch(c, 0.42, 0.25)
br = sfx('brakes-2')
place(fx, pan(br.mean(1), 0.4), STOP - 2.2, -9.0)
place(fx, br, BRAKE - 1.6, -10.0)
co = sfx('ep36-coin-1')
place(fx, pan(co[: int(1.5 * SR)].mean(1), -0.1), CUT_COLLECT + 1.0, -14.0)
# her wet steps down the aisle (each held step of the picture: every 0.45 s from the cut to the seat)
n = int(0.09 * SR)
for k in range(int((SIT - CUT_BOARD) / 0.45)):
    at = CUT_BOARD + k * 0.45
    sq = filt(rng.standard_normal(n), SR, lo=300, hi=2500) * np.exp(-np.arange(n) / (0.025 * SR)) * 0.09 * (0.5 + 0.5 * k / 12)
    place(fx, pan(sq, -0.05), at)
vn = sfx('ep36-vinyl-1')
place(fx, pan(vn[: int(1.2 * SR)].mean(1), -0.25), SIT, -8.0)
# drips on the vinyl while she is there, and from the backrest after
def drip(at, g=0.03):
    m = int(0.05 * SR)
    f = rng.uniform(1800, 2600)
    tt = np.arange(m) / SR
    place(fx, pan(np.sin(2 * np.pi * f * tt * (1 + 2 * tt)) * np.exp(-tt / 0.008) * g, -0.3), at)
for at in np.arange(-1.7, CUT_ROAD, 1 / 2.2):
    drip(at, 0.018)
    if at < 0:
        drip(DUR + at, 0.018)
for at in np.arange(SIT, GONE, 1 / 2.2):
    drip(at, 0.02)
for at in np.arange(CUT_DENT + 0.2, CUT_COUNT, 1 / 1.6):
    drip(at, 0.04)
for at in np.arange(CUT_COUNT, LOOP, 1 / 2.2):
    drip(at, 0.022)
# the strips crackle as she goes
m = int(0.25 * SR)
cr = filt(rng.standard_normal(m), SR, lo=800, hi=7000) * (rng.random(m) > 0.85) * 0.25 * np.exp(-np.arange(m) / (0.08 * SR))
place(fx, pan(cr, 0.0), GONE - 0.12)
wh = sfx('ep41-whispers-1')
place(fx, pan(fade(wh[: int(2.5 * SR)].mean(1), 0.3, 0.8), -0.5), l('l04')['end'] + 0.2, -14.0)
nk = sfx('ep41-neck-1')
mm = nk.mean(1)
hp = int(0.01 * SR)
ee = np.array([np.sqrt(np.mean(mm[i:i + hp] ** 2)) for i in range(0, len(mm) - hp, hp)])
p0 = int(np.argmax(ee)) * hp
crack = nk[max(0, p0 - int(0.02 * SR)): p0 + int(0.22 * SR)]
crack = crack * np.hanning(len(crack))[:, None]
place(fx, pan(crack.mean(1), -0.2), SNAP, 4.0)
# a breath behind me across the seam
n = int(1.1 * SR)
tt = np.arange(n) / SR
bth = pan(filt(rng.standard_normal(n), SR, lo=300, hi=2500) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.01, -0.3)
place(fx, bth, DUR - 0.6)
place(fx, bth, -0.6)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the score
mus = np.zeros((N, 2))
d4 = sfx('ep41-drone-1')
drb = wrap(xloop(d4, DUR + 3, 0.8))
drone_e = env([(0, 1.1), (CUT_ROAD, 0.6), (CUT_CURVE, 0.8), (CUT_BOARD, 1.0), (GONE, 0.0), (GONE + 0.5, 0.0), (CUT_STOP, 0.9), (CUT_DENT, 1.2), (SNAP + 0.1, 1.6), (LOOP, 1.1), (DUR, 1.1)])
mus += drb * (db(-18) * drone_e)[:, None]
d_e = env([(0, 0.8), (CUT_ROAD, 0.4), (CUT_BOARD, 0.8), (GONE, 0.0), (GONE + 0.5, 0.0), (CUT_STOP, 0.7), (CUT_COUNT, 1.1), (SNAP + 0.1, 1.5), (LOOP, 0.8), (DUR, 0.8)])
mus += st(hs.drone_mid(T, qf, d_e, root=38.89) * 1.6)
str_e = env([(0, 0.6), (CUT_ROAD, 0.3), (CUT_BOARD, 0.8), (GONE, 0.0), (GONE + 0.5, 0.0), (CUT_STOP, 0.6), (CUT_COUNT, 1.1), (SNAP + 0.1, 1.5), (LOOP, 0.6), (DUR, 0.6)])
trem = env([(0, 0.5), (CUT_BOARD, 0.8), (CUT_COUNT, 1.0), (LOOP, 0.5), (DUR, 0.5)])
mus += st(hs.strings(T, qf, [77.78, 82.41, 116.54], str_e, trem, SR, seed=4601) * 2.2)
mb = sfx('ep41-musicbox-1')
place(mus, verb(pan(fade(mb[: int(6.0 * SR)].mean(1), 0.3, 1.5), 0.2), 1.6, 0.3, seed=4603, bright=5000), CUT_DENT + 0.2, -13.0)
place(mus, st(hs.heartbeat(SR, CUT_COUNT, SNAP - 0.2, 70, 108, gain=0.5, seed=4604)), CUT_COUNT)
place(mus, st(hs.metal_bow(SR, 3.0, 1040.0, seed=4605)), GONE + 0.1, -4.0)
rz = sfx('ep41-riser-1')
place(mus, fade(rz[: int(4.5 * SR)], 0.8, 0.05), SNAP - 4.5, -13.0)
st1 = sfx('ep41-stinger-2')
place(mus, st1, SNAP, -4.0)
place(mus, hs.stinger(SR, seed=4606, size=1.0), SNAP, -6.0)
mus = np.stack([filt(mus[:, 0], SR, lo=100, hi=12000), filt(mus[:, 1], SR, lo=100, hi=12000)], 1)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-1.0)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep46-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep46HulingBiyahePahilaga',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep46-bus/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep46-bus/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, bowed metal when she is gone, a heartbeat through the recount, a synthesized stinger doubling the ElevenLabs one (scripts/horror_score.py); loop-quantised; it drops out when she is gone',
        'her wet steps on each held step of the picture, drips on the vinyl, the strips crackling as she goes, a breath across the seam (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'h5EIP6tIdelmGnwmnM6E', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': '3 prompts x 4 variations (about 400 credits): the bus at night 20 s loop, the ticket punch 4 s, air brakes and the door 6 s',
                       'reused': 'Episode 36 coin-1 and vinyl-1, Episode 40 cicadas-1, and Episode 41 variations (drone-1, stinger-2, riser-1, musicbox-1, whispers-1, neck-1)',
                       'note': 'picked by measurement (RMS, peak), not by listening'},
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
