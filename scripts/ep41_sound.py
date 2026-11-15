"""Episode 41 "Bilang sa Bintana" (Season 5 opener: a commuter's experience shared online, retold) sound.

Sound language: the van. Its cabin rumble (an ElevenLabs loop) never stops, folded across the loop seam;
every bump in the picture has its thump and rattle; outside, the avenue rushes by. Under it, a long
ElevenLabs horror drone and a loop-quantised synthesized score. The two women make no sound at all,
except one breath. Their heads turn in four held-then-snapped steps, each with a neck crack cut from an
ElevenLabs take, over a heartbeat that stops dead when I turn to their empty seats, where the score drops
out and only the van remains. A riser into the last window, whispers in the gaps (and across the seam),
the stinger in the silence after the last line, when her head tips to the lens.
-14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep41_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep41-uv-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep41-uv-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(41041)
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








# key times: must match K in src/horror/ep41/Episode41.tsx
l = lambda i: L[i]
CUT_EXT = l('l02')['start'] - 0.3
CUT_WIDE = l('l03')['start'] - 0.3
CUT_SIDE = l('l03')['start'] + 2.0
LUBAK = l('l03')['start'] + 2.9
CUT_PHONE = l('l04')['start'] - 0.3
BREATH = l('l04')['end'] + 0.02
CUT_WIN1 = l('l04')['end'] + 0.5
TURN0 = l('l04')['end'] + 0.85
SNAPS = [TURN0 + d for d in (0, 0.42, 0.8, 1.22)]
CUT_EMPTY = l('l05')['end'] + 0.4
TURN_AWAY = l('l05')['end'] + 0.55
CUT_AISLE = l('l07')['start'] - 0.3
CUT_HAND = l('l07')['start'] + 2.1
CUT_WIN2 = l('l07')['end'] + 0.65
TIP = l('l08')['end'] + 0.4
LOOP = DUR - 1.7
BUMPS = [1.6, 4.4, 8.0, 9.9, CUT_WIDE + 0.9, LUBAK, LUBAK + 1.5, 21.0, 27.5, 33.5, 37.0, 38.7, 44.0, 47.9]
STINGERS = [TIP]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep41-{name}.mp3'
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



ext = span(CUT_EXT, CUT_WIDE, 0.002)
inside = np.clip(1 - ext, 0, 1)
window = span(0, CUT_EXT, 0.002) + span(CUT_WIN1, CUT_EMPTY, 0.002) + span(CUT_WIN2, DUR, 0.002)
held = span(CUT_EMPTY, l('l06')['start'] - 0.15, 0.002)  # I turn: the score drops out, only the van

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
van = sfx('van-3')
vb = wrap(xloop(filt(van.mean(1), SR, lo=60, hi=8000), DUR + 3, 0.4))
# inside: the cabin rumble, a touch darker at the glass; outside: brighter, with the road rushing
amb += vb * (db(-15) * inside * (0.6 + 0.4 * duck) * (1 - 0.25 * window))[:, None]
amb += st(filt(vb.mean(1), SR, lo=300, hi=9000)) * (db(-12) * ext * (0.5 + 0.5 * duck))[:, None]
amb += st(unit(filt(rng.standard_normal(N), SR, lo=400, hi=5000)) * 0.01 * ext * duck)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def bump(at, big=1.0):
    """The van takes a pothole: a low thump, the body rattling, a seat spring."""
    n = int(0.7 * SR)
    tt = np.arange(n) / SR
    thump = np.sin(2 * np.pi * 52 * tt) * np.exp(-tt * 14) * 0.9 + filt(rng.standard_normal(n), SR, lo=80, hi=400) * np.exp(-tt * 18) * 0.5
    rattle = filt(rng.standard_normal(n), SR, lo=1500, hi=6000) * (np.sin(2 * np.pi * 23 * tt) > 0.3) * np.exp(-tt * 7) * 0.25
    g = 0.05 * big * (0.35 if CUT_EXT <= at < CUT_WIDE else 1.0)
    place(fx, st((thump + rattle) * g), at)


for b in BUMPS:
    bump(b, 1.6 if abs(b - LUBAK) < 0.01 else 1.0)
# lamps whooshing past outside (every 2 s at 11 m/s), inside only faintly
for at in np.arange(0.9, DUR, 2.0):
    n = int(0.9 * SR)
    tt = np.arange(n) / SR
    w = filt(rng.standard_normal(n), SR, lo=500, hi=3500) * np.sin(np.pi * tt / tt[-1]) ** 2
    g = 0.012 if CUT_EXT <= at < CUT_WIDE else 0.0025
    place(fx, pan(w * g, 0.7), at)
# the neck cracks: four held-then-snapped steps; each a crack cut from the ElevenLabs take
nk = sfx('neck-2')
m = nk.mean(1)
hop = int(0.01 * SR)
e = np.array([np.sqrt(np.mean(m[i:i + hop] ** 2)) for i in range(0, len(m) - hop, hop)])
peaks = []
for i in np.argsort(e)[::-1]:
    if all(abs(i - p) > 18 for p in peaks):
        peaks.append(int(i))
    if len(peaks) == 4:
        break
cracks = [nk[max(0, p * hop - int(0.02 * SR)): p * hop + int(0.22 * SR)] * np.hanning(int(0.24 * SR))[:, None][: len(nk[max(0, p * hop - int(0.02 * SR)): p * hop + int(0.22 * SR)])] for p in sorted(peaks)]
for k, at in enumerate(SNAPS):
    place(fx, pan(cracks[k % len(cracks)].mean(1), -0.3), at, 4.0)
    place(fx, pan(cracks[(k + 1) % len(cracks)].mean(1), 0.2), at + 0.06, 0.0)  # the second one, a beat behind
place(fx, pan(cracks[0].mean(1), -0.2), TIP, 5.0)  # her head tips to the lens
# her one breath (she never breathes otherwise): a slow inhale, a long exhale, close and left
n = int(1.6 * SR)
tt = np.arange(n) / SR
inh = filt(rng.standard_normal(n), SR, lo=500, hi=3000) * np.interp(tt, [0, 0.55, 0.75, 1.6], [0, 1, 0.3, 0]) ** 2
place(fx, pan(inh * 0.018, 0.35), BREATH)
# whispers: in the gap into the last window, and after the tip, running across the loop seam
wh = sfx('whispers-1')
place(fx, pan(fade(wh[: int(2.2 * SR)].mean(1), 0.3, 0.6), -0.5), CUT_WIN2 - 0.3, -6.0)
seam = fade(wh[int(1.0 * SR): int(3.6 * SR)].mean(1), 0.4, 0.4)
place(fx, pan(seam, 0.5), DUR - 1.3, -8.0)
place(fx, pan(seam, 0.5), -1.3, -8.0)
# my hand on the vinyl: a soft squeak; my turn: a rustle
n = int(0.5 * SR)
tt = np.arange(n) / SR
place(fx, st(np.sin(2 * np.pi * np.cumsum(900 + 300 * np.sin(tt * 9)) / SR) * np.exp(-tt * 9) * 0.006 + filt(rng.standard_normal(n), SR, lo=800, hi=4000) * np.exp(-tt * 6) * 0.006), CUT_HAND + 0.9)
n = int(0.45 * SR)
place(fx, st(filt(rng.standard_normal(n), SR, lo=600, hi=4000) * np.sin(np.pi * np.arange(n) / n) * 0.012), TURN_AWAY - 0.1)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the score: the ElevenLabs drone + loop-quantised synthesis
mus = np.zeros((N, 2))
dr = sfx('drone-2')
drb = wrap(xloop(dr, DUR + 3, 0.8))
drone_e = env([(0, 1.0), (CUT_EXT, 0.6), (CUT_WIDE, 0.8), (CUT_PHONE, 1.0), (CUT_WIN1, 1.2), (CUT_EMPTY - 0.01, 1.3), (CUT_EMPTY, 0.0), (l('l06')['start'] - 0.2, 0.0), (l('l06')['end'], 0.9), (CUT_WIN2, 1.3), (TIP, 1.5), (LOOP, 1.0), (DUR, 1.0)])
mus += drb * (db(-19) * drone_e)[:, None]
lv = 0.7
d_e = env([(0, lv), (CUT_EXT, 0.5), (CUT_WIDE, 0.7), (CUT_WIN1, 1.1), (CUT_EMPTY - 0.01, 1.2), (CUT_EMPTY, 0.0), (l('l06')['start'] - 0.2, 0.0), (l('l06')['end'], 0.7), (CUT_WIN2, 1.1), (TIP + 0.1, 1.5), (LOOP, lv), (DUR, lv)])
mus += st(hs.drone_mid(T, qf, d_e, root=46.25) * 1.6)
str_e = env([(0, 0.5), (CUT_WIDE, 0.6), (CUT_WIN1, 1.0), (CUT_EMPTY - 0.01, 1.1), (CUT_EMPTY, 0.0), (l('l06')['end'], 0.0), (CUT_AISLE, 0.6), (CUT_WIN2, 1.0), (TIP + 0.1, 1.5), (LOOP, 0.5), (DUR, 0.5)])
trem = env([(0, 0.4), (CUT_WIN1, 0.9), (CUT_EMPTY, 0.2), (CUT_WIN2, 0.8), (TIP, 1.0), (LOOP, 0.4), (DUR, 0.4)])
mus += st(hs.strings(T, qf, [92.5, 98.0, 138.59], str_e, trem, SR, seed=4101) * 2.2)
# the ElevenLabs music box: once, far and slow, while the van drives on
mb = sfx('musicbox-3')
place(mus, verb(pan(fade(mb[: int(7.5 * SR)].mean(1), 0.2, 1.5), -0.3), 1.8, 0.35, seed=4102, bright=5000), CUT_AISLE + 0.2, -10.0)
place(mus, st(hs.heartbeat(SR, CUT_WIN1, CUT_EMPTY, 70, 104, gain=0.55, seed=4103)), CUT_WIN1)
place(mus, st(hs.metal_bow(SR, 3.5, 1050.0, seed=4104)), CUT_PHONE + 0.3, -2.0)
rz = sfx('riser-3')
place(mus, fade(rz[: int(5.0 * SR)], 0.8, 0.05), CUT_WIN2 - 5.0, -9.0)
st2 = sfx('stinger-2')
place(mus, st2, TIP, -4.0)
place(mus, hs.stinger(SR, seed=4105, size=1.0), TIP, -6.0)
mus = np.stack([filt(mus[:, 0], SR, lo=100, hi=12000), filt(mus[:, 1], SR, lo=100, hi=12000)], 1)  # keep the score in the phone band
mus *= (1 - speech * (1 - db(-4.5)))[:, None] * (1 - held)[:, None] * db(1.0)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep41-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep41BilangSaBintana',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep41-uv/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep41-uv/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, bowed metal at the phone, a heartbeat under the head-turn that stops dead at the empty seats, a synthesized stinger doubling the ElevenLabs one (scripts/horror_score.py); loop-quantised; the score drops out while I look at the empty seats',
        'a thump and rattle for every bump in the picture, lamps whooshing past, her one breath, my hand on the vinyl, a rustle as I turn (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'uIbJVElVeRxF6juAhqKV', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': '7 prompts x 4 variations (about 812 credits): van-interior 12 s loop, horror drone bed 20 s loop, whispers 6 s, neck crack 3 s, stinger 4 s, music box 10 s, riser 6 s',
                       'note': 'long and looping takes (duration_seconds and loop set) for the beds; picked by measurement (RMS, peak, onset), not by listening'},
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
