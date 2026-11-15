"""Episode 45 "Ang Humahaplos" (Season 5: a hand that strokes a student's hair in an old campus CR
at night; retold from experiences shared online) sound.

Sound language: the CR at night (an ElevenLabs 15 s loop: the tube, a drip, the vent), folded across the
loop seam; the tube's buzz synthesized and switched by the same flicker function as the picture (tube()
in src/horror/ep45/world.tsx), with a tick on every drop-out. The corridor: Episode 42's lobby tone,
thin, and Episode 25's steps. The faucet and the splashes (ElevenLabs). The last cubicle's door creaks
open in the silence after line 5, heard, not seen (ElevenLabs). Every stroke of the hand is a soft
brush on hair (synthesized, on the picture's own stroke clock, so it runs on across the seam). A woman
humming far off after "Parang nanay" (Episode 39's take). Neck cracks on each step of her head out of
the cubicle (Episode 41's take), the stinger on the last snap. A loop-quantised score over Episode 41's
drone, with Episode 41's last unused music box. -14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep45_sound.py
"""
import hashlib, json, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep45-cr-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep45-cr-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(45045)
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








# key times: must match K in src/horror/ep45/Episode45.tsx
l = lambda i: L[i]
CUT_HALL = l('l02')['start'] - 0.3
CUT_ENTER = l('l03')['start'] - 0.3
CUT_WASH = l('l04')['start'] - 0.3
SPLASH = [l('l04')['start'] + 0.35, l('l04')['start'] + 1.55]
CUT_REAL = l('l05')['start'] - 0.3
TOUCH = l('l05')['start'] + 0.5
CREAK = l('l05')['end'] + 0.45
CUT_MIRROR = l('l06')['start'] - 0.3
CUT_WIDE = l('l07')['start'] - 0.3
CUT_HER = l('l08')['start'] - 0.3
LEAN = [l('l08')['end'] - 1.6, l('l08')['end'] - 0.7, l('l08')['end'] + 0.05]
SNAP = l('l08')['end'] + 0.6
LOOP = DUR - 1.7
STROKE = 2.2
STINGERS = [SNAP]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / (f'{name}.mp3' if re.match(r'ep\d', name) else f'ep45-{name}.mp3')
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






# picture time: the loop shot runs on negative time (tv = t - DUR), so do the strokes and the tube
TV = np.where(T >= LOOP, T - DUR, T)
hall = span(CUT_HALL, CUT_ENTER, 0.002)
cr = np.clip(1 - hall, 0, 1)


def tube(t):
    """the picture's tube() (src/horror/ep45/world.tsx), vectorised: 1 on, 0.15/0.2 in a drop-out"""
    k = np.floor(t * 12)
    h = lambda n: (lambda x: x - np.floor(x))(np.sin(n * 127.1 + 311.7) * 43758.5453)
    c = np.mod(t, 2.6)
    out = np.ones_like(t)
    stut = (c > 2.1) & (c < 2.45)
    out = np.where(stut, np.where(h(k) > 0.5, 1.0, 0.15), out)
    out = np.where(~stut & (h(k * 3 + 7) > 0.96), 0.2, out)
    return out


# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
cb = sfx('crloop-1')
crl = compress(filt(cb.mean(1), SR, lo=60, hi=10000), thresh_db=-30.0, ratio=4.0, att=0.01, rel=0.4)
amb += wrap(xloop(crl, DUR + 3, 0.5)) * (db(-9) * cr * (0.55 + 0.45 * duck))[:, None]
lb = sfx('ep42-lobby-2')
amb += xloop(filt(lb.mean(1), SR, lo=120, hi=5000), DUR, 0.4) * (db(-17) * hall * (0.6 + 0.4 * duck))[:, None]
# the tube's buzz: 100 Hz and its odd harmonics, gated by the picture's flicker (smoothed 6 ms)
lv = tube(TV)
g = np.convolve(lv, np.ones(int(0.006 * SR)) / int(0.006 * SR), 'same')
buzz = sum(np.sin(2 * np.pi * f * T) / (i + 1) for i, f in enumerate([100, 300, 500, 700, 900]))
buzz = filt(buzz + 0.3 * filt(rng.standard_normal(N), SR, lo=2000, hi=6000), SR, lo=90, hi=7000)
amb += st(unit(buzz) * 0.0045 * g * cr * (0.5 + 0.5 * duck))
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# a tick on every drop-out of the tube (the starter clicking)
d = np.diff((lv > 0.5).astype(int))
for i in np.where(d != 0)[0]:
    if cr[i] > 0.5:
        n = int(0.012 * SR)
        tk = filt(rng.standard_normal(n), SR, lo=1500, hi=7000) * np.exp(-np.arange(n) / (0.002 * SR)) * 0.05
        place(fx, pan(tk, 0.15), i / SR)
# steps: the corridor, then in through the door
stp = sfx('ep25-steps-2').mean(1)
walk = np.clip(span(CUT_HALL + 0.2, CUT_ENTER, 0.2) * db(-10) + span(CUT_ENTER, CUT_WASH - 0.6, 0.2) * db(-7), 0, None)
fx += xloop(filt(stp, SR, lo=120, hi=8000), DUR, 0.3) * walk[:, None]
fc = sfx('faucet-1')
place(fx, pan(fc.mean(1), -0.3), SPLASH[0] - 0.4, -7.0)
sc = sfx('stall-3')
place(fx, verb(pan(sc.mean(1), 0.45), 1.2, 0.2, seed=4501, bright=4000), CREAK, -7.0)
# the strokes: a soft brush on hair while the hand moves (the picture's stroke velocity)
touch = np.where(TV < CUT_HALL, 1.0, np.clip((TV - TOUCH) / 0.3, 0, 1))
vel = np.abs(np.sin(2 * np.pi * TV / STROKE))
hair = filt(rng.standard_normal(N), SR, lo=1800, hi=7500)
fx += st(unit(hair) * 0.006 * vel ** 1.5 * touch * (0.55 + 0.45 * duck))
# the humming, far off in the tiles, after "Parang nanay"
hm = sfx('ep39-humming-3').mean(1)
hum = verb(filt(xloop(hm, 13.0, 0.35), SR, lo=250, hi=3500), 2.2, 0.45, seed=4502, bright=2500)
seg = fade(hum[: int(6.5 * SR)], 0.8, 1.6)
place(fx, pan(seg, 0.4), l('l05')['end'] - 0.2, -13.0)
seg2 = fade(hum[int(7 * SR): int(12 * SR)], 0.8, 1.6)
place(fx, pan(seg2, 0.5), l('l07')['end'] - 0.2, -15.0)
# her head out of the cubicle: a neck crack on each step, a big one on the snap
nk = sfx('ep41-neck-3')
m = nk.mean(1)
hop = int(0.01 * SR)
e = np.array([np.sqrt(np.mean(m[i:i + hop] ** 2)) for i in range(0, len(m) - hop, hop)])
peaks = []
for i in np.argsort(e)[::-1]:
    if all(abs(i - p) > 18 for p in peaks):
        peaks.append(int(i))
    if len(peaks) == 4:
        break
crk = [nk[max(0, p * hop - int(0.02 * SR)): max(0, p * hop - int(0.02 * SR)) + int(0.24 * SR)] for p in sorted(peaks)]
crk = [c * np.hanning(len(c))[:, None] for c in crk]
for k, at in enumerate(LEAN):
    place(fx, pan(crk[k % len(crk)].mean(1), 0.35), at, -8.0)
place(fx, pan(crk[3 % len(crk)].mean(1), 0.2), SNAP, 4.0)
# a breath at my ear across the seam
n = int(1.1 * SR)
tt = np.arange(n) / SR
br = pan(filt(rng.standard_normal(n), SR, lo=300, hi=2500) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.01, 0.3)
place(fx, br, DUR - 0.6)
place(fx, br, -0.6)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the score
mus = np.zeros((N, 2))
d4 = sfx('ep41-drone-3')
drb = wrap(xloop(d4, DUR + 3, 0.8))
drone_e = env([(0, 1.1), (CUT_HALL, 0.5), (CUT_ENTER, 0.6), (CUT_WASH, 0.8), (CUT_REAL, 1.0), (CREAK, 1.2), (CUT_WIDE, 1.4), (SNAP + 0.1, 1.6), (LOOP, 1.1), (DUR, 1.1)])
mus += drb * (db(-18) * drone_e)[:, None]
d_e = env([(0, 0.8), (CUT_HALL, 0.4), (CUT_WASH, 0.6), (CUT_REAL, 0.8), (CUT_WIDE, 1.1), (SNAP + 0.1, 1.5), (LOOP, 0.8), (DUR, 0.8)])
mus += st(hs.drone_mid(T, qf, d_e, root=43.65) * 1.6)
str_e = env([(0, 0.6), (CUT_HALL, 0.3), (CUT_WASH, 0.5), (CUT_REAL, 0.8), (CUT_WIDE, 1.1), (SNAP + 0.1, 1.5), (LOOP, 0.6), (DUR, 0.6)])
trem = env([(0, 0.5), (CUT_REAL, 0.6), (CUT_WIDE, 1.0), (LOOP, 0.5), (DUR, 0.5)])
mus += st(hs.strings(T, qf, [87.31, 92.5, 130.81], str_e, trem, SR, seed=4501) * 2.2)
mb = sfx('ep41-musicbox-4')
place(mus, verb(pan(fade(mb[: int(6.0 * SR)].mean(1), 0.3, 1.5), -0.2), 1.6, 0.3, seed=4503, bright=5000), CUT_WIDE + 0.2, -13.0)
place(mus, st(hs.heartbeat(SR, CUT_WIDE, CUT_HER + 2.0, 70, 104, gain=0.5, seed=4504)), CUT_WIDE)
place(mus, st(hs.metal_bow(SR, 3.0, 1180.0, seed=4505)), CREAK + 0.6, -4.0)
rz = sfx('ep41-riser-2')
place(mus, fade(rz[: int(4.5 * SR)], 0.8, 0.05), SNAP - 4.5, -13.0)
st1 = sfx('ep41-stinger-3')
place(mus, st1, SNAP, -4.0)
place(mus, hs.stinger(SR, seed=4506, size=1.0), SNAP, -6.0)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep45-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep45AngHumahaplos',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep45-cr/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep45-cr/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, bowed metal after the creak, a heartbeat through the mirror wide, a synthesized stinger doubling the ElevenLabs one (scripts/horror_score.py); loop-quantised',
        'the tube buzz gated by the picture\'s own flicker function with a tick on every drop-out, a soft brush on hair on every stroke of the hand (on the picture\'s stroke clock, across the seam), a breath across the seam (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'a8s0O25d4u0Cc6XrG5TQ', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': '3 prompts x 4 variations (about 320 credits): the CR at night 15 s loop, faucet and splashes 5 s, a cubicle door creaking open 4 s',
                       'reused': 'Episode 25 steps-2, Episode 39 humming-3, Episode 42 lobby-2, and unused Episode 41 variations (drone-3, stinger-3, riser-2, musicbox-4, neck-3)',
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
