"""Episode 52 "The Branch" (Season 6: a utility lineman's night call in a South Texas colonia, the lechuza
caught halfway through changing; retold from a reader-submitted account) sound.

Sound language (this episode's own; nothing from Episode 41's kit): the transformer's hum and crickets (an
ElevenLabs 15 s loop) under the whole night; dogs that bark and fall silent as the truck rolls in; a long
wrong whistle from the tree (the motif); the bucket's hydraulics; the work light's click and buzz; feathers
rustling as it turns; the skin splitting (gore foley) and blood dripping; the wings snapping open at the
lens (the stinger); the phone falling; the truck pulling away; the gallery's taps; and in the clip from the
branch, wind high in the leaves and something breathing right at the microphone. A score of a low drone, a
string cluster that tightens to the wings, a riser, bowed metal at the turn, a heartbeat under the gore.
-14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep52_sound.py
"""
import hashlib, json, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep52-branch-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep52-branch-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(52052)
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



# key times: must match K in src/horror/ep52/Episode52.tsx
l = lambda i: L[i]
CUT_STREET = l('l01')['start'] - 0.25
PARK = l('l01')['start'] + 4.9
CUT_NEIGHBOUR = l('l02')['start'] - 0.35
POINT = l('l02')['start'] + 3.0
SHIFT = l('l02')['end'] - 0.4
CUT_BUCKET = l('l03')['start'] - 1.9
RISE = [l('l03')['start'] - 1.7, l('l03')['start'] + 3.0]
LIGHT_ON = l('l03')['start'] + 1.2
TURN = [l('l03')['start'] + 4.6, l('l03')['start'] + 5.8]
CUT_LEGS = l('l04')['start'] - 0.3
CUT_GORE = l('l04')['start'] + 3.78
WINGS = [l('l04')['end'] + 0.27, l('l04')['end'] + 0.95]
DROP = l('l04')['end'] + 1.55
CUT_DRIVE = l('l05')['start'] - 0.38
CUT_GALLERY = l('l05')['start'] + 3.87
PLAY = l('l05')['start'] + 5.0
LOOP = DUR - 2.4
STINGERS = [WINGS[0]]
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}

def sfx(name, gain_db=0.0):
    path = SFX / (f'{name}.mp3' if re.match(r'ep\d', name) else f'ep52-{name}.mp3')
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


def burst(seconds, lo, hi, shape=2.0, gain=0.03):
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    return filt(rng.standard_normal(n), SR, lo=lo, hi=hi) * np.sin(np.pi * tt / tt[-1]) ** shape * gain


# ------------------------------------------------------------------ voice (dry and close)
voice = np.zeros((N, 2))
for lid, ln in L.items():
    v = load(VOICE / f'{lid}.wav')
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
    y = x[:N].copy()
    y[:len(x) - N] += x[N:]
    return y


night = np.clip(1 - span(DROP + 0.6, CUT_DRIVE, 0.01) - span(CUT_GALLERY, PLAY, 0.01), 0, 1)
clip = np.clip(span(PLAY, LOOP, 0.002), 0, 1)  # the clip from the branch (heard through the phone)
high = np.clip(span(-10, CUT_STREET, 0.002) + span(CUT_BUCKET, DROP + 0.6, 0.002) + (T >= LOOP), 0, 1)  # up in the bucket

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
hm = sfx('hum-3')
hbed = wrap(xloop(hm, DUR + 3, 0.6))
amb += hbed * (db(-17) * night * (1 - clip) * (1 + 0.6 * high) * (0.7 + 0.3 * duck))[:, None]
# the transformer right beside the bucket: its 60 Hz hum, close
hum60 = (np.sin(2 * np.pi * qf(120) * T) * 0.6 + np.sin(2 * np.pi * qf(240) * T) * 0.3 + np.sin(2 * np.pi * qf(360) * T) * 0.15) * 0.006
amb += pan(hum60 * high * night, 0.3)
# the clip from the branch: wind high in the leaves, thin, as a phone speaker plays it
wind = filt(rng.standard_normal(N), SR, lo=700, hi=5000) * (0.5 + 0.5 * np.sin(2 * np.pi * qf(0.13) * T) ** 2) * 0.02
amb += pan(filt(wind + hbed.mean(1) * 0.05, SR, lo=300, hi=6000) * clip, 0.0)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# the truck rolling in: a diesel idle under the dash, stopping when it parks
idle = filt(np.sin(2 * np.pi * qf(32) * T) * (0.6 + 0.4 * np.sin(2 * np.pi * qf(8) * T)) + rng.standard_normal(N) * 0.3, SR, lo=40, hi=400) * 0.03
fx += pan(idle * span(CUT_STREET, PARK + 0.3, 0.3) * 0.5, 0.0)
dg = sfx('dogs-4')
place(fx, pan(fade(dg.mean(1), 0.05, 0.4), -0.5), CUT_STREET + 0.4, -14.0)
# the whistle from the tree: far as she points, close and dry in the hook and as it turns
wh = sfx('whistle-3')
wm = fade(wh.mean(1), 0.02, 0.4)
place(fx, pan(verb(filt(wm, SR, lo=300, hi=6000), 1.8, 0.4, seed=5201, bright=3000), 0.4), SHIFT - 0.2, -14.0)
place(fx, pan(filt(wm[: int(2.2 * SR)], SR, lo=300, hi=8000), 0.2), -2.2, -12.0)
place(fx, pan(filt(wm[: int(2.2 * SR)], SR, lo=300, hi=8000), 0.2), LOOP + 0.2, -12.0)
# the bucket going up, and the work light's click and buzz
bk = sfx('bucket-2')
place(fx, pan(fade(bk.mean(1)[: int((RISE[1] - RISE[0] + 0.6) * SR)], 0.2, 0.6), 0.0), RISE[0], -8.0)
n = int(0.05 * SR)
tt = np.arange(n) / SR
click = filt(rng.standard_normal(n), SR, lo=1000, hi=7000) * np.exp(-tt * 120) * 0.4
place(fx, pan(click, 0.2), LIGHT_ON)
buzz = (np.sin(2 * np.pi * qf(120) * T) + 0.3 * np.sign(np.sin(2 * np.pi * qf(120) * T))) * 0.003
fx += pan(filt(buzz, SR, lo=100, hi=3000) * np.clip(span(LIGHT_ON, DROP, 0.01) + span(-10, CUT_STREET, 0.002) + (T >= LOOP), 0, 1), 0.2)
# feathers rustling: when it shifts in the dark, as it turns its head, and when it settles in the hook
for at, d, g in ((SHIFT, 0.9, 0.03), (TURN[0], TURN[1] - TURN[0] + 0.3, 0.035), (CUT_LEGS + 0.6, 0.7, 0.02), (-1.6, 0.8, 0.02), (LOOP + 0.8, 0.8, 0.02)):
    place(fx, pan(burst(d, 1500, 7000, 1.0, g) * (0.6 + 0.4 * np.abs(np.sin(np.arange(int(d * SR)) / SR * 23))), 0.3), at)
# a low owl hiss as its face comes round
place(fx, pan(burst(1.2, 400, 3000, 2.0, 0.025), 0.3), TURN[1] - 0.1)
# talons tightening on the bark
for j in range(5):
    place(fx, pan(burst(0.12, 1200, 5000, 1.0, 0.05), 0.4), CUT_LEGS + 1.2 + j * 0.37)
# the skin splitting, and blood dripping off its arm onto the leaves below
sp = sfx('split-3')
place(fx, pan(fade(sp.mean(1), 0.05, 0.5), 0.3), CUT_GORE + 0.3, -6.0)
for j in range(9):
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    drip = np.sin(2 * np.pi * (900 - 2000 * tt) * tt) * np.exp(-tt * 60) * 0.05
    place(fx, pan(drip, 0.4 + 0.1 * (j % 3)), CUT_GORE + 1.0 + j * 0.41)
# the wings snapping open at the lens (the stinger), then the phone falling, hitting the street, and dark
wg = sfx('wings-1')
place(fx, wg, WINGS[0] - 0.03, -1.0)
place(fx, pan(burst(0.6, 300, 4000, 1.0, 0.05), 0.0), DROP)
n = int(0.3 * SR)
tt = np.arange(n) / SR
thud = np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 20) * 0.3 + filt(rng.standard_normal(n), SR, lo=800, hi=6000) * np.exp(-tt * 30) * 0.1
place(fx, pan(thud, 0.0), DROP + 0.6)
# pulling away
tk = sfx('truck-2')
place(fx, pan(fade(tk.mean(1), 0.05, 0.6), 0.0), CUT_DRIVE + 0.05, -12.0)
# the gallery: two soft taps
for at in (CUT_GALLERY + 0.5, PLAY - 0.15):
    n = int(0.03 * SR)
    tt = np.arange(n) / SR
    place(fx, pan(np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 200) * 0.05, 0.0), at)
# in the clip: something breathing right at the microphone
for j, at in enumerate(np.arange(PLAY + 0.3, LOOP, 1.55)):
    place(fx, pan(filt(burst(1.1, 250, 2200, 2.0, 0.03), SR, lo=300, hi=3000), 0.0), at)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the score
mus = np.zeros((N, 2))
d_e = env([(-10, 0.6), (CUT_STREET, 0.25), (CUT_NEIGHBOUR, 0.4), (CUT_BUCKET, 0.7), (TURN[1], 1.3), (CUT_GORE, 1.4), (WINGS[0] - 0.02, 1.8), (WINGS[0], 0.0), (CUT_DRIVE, 0.0), (CUT_DRIVE + 0.3, 0.6), (CUT_GALLERY, 0.2), (PLAY, 0.5), (LOOP, 0.6), (DUR + 10, 0.6)])
mus += st(hs.drone_mid(T, qf, d_e, root=38.89) * 1.4)
str_e = env([(-10, 0.6), (CUT_STREET, 0.0), (CUT_BUCKET, 0.0), (LIGHT_ON, 0.6), (TURN[1], 1.2), (WINGS[0] - 0.02, 1.8), (WINGS[0], 0.0), (PLAY, 0.0), (PLAY + 1.0, 0.7), (LOOP, 0.6), (DUR + 10, 0.6)])
trem = env([(-10, 0.6), (CUT_GORE, 1.0), (DUR + 10, 1.0)])
mus += st(hs.strings(T, qf, [69.30, 73.42, 103.83, 155.56], str_e, trem, SR, seed=5208) * 2.0)
place(mus, st(hs.metal_bow(SR, 2.4, 760.0, seed=5209)), TURN[1] - 0.2, -9.0)
place(mus, st(hs.riser(SR, 3.2, 140.0, 820.0, seed=5210)), WINGS[0] - 3.2, -10.0)
place(mus, hs.stinger(SR, seed=5211, size=1.2), WINGS[0], -7.0)
place(mus, st(hs.heartbeat(SR, CUT_GORE, WINGS[0] - 0.1, 76, 128, gain=0.32, seed=5212)), CUT_GORE)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep52-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep52TheBranch',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (ElevenLabs library voice)', 'credits': json.loads((ROOT / 'docs/production/ep52-branch/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep52-branch/prompt.json'},

    'original_synthesis': [
        'SCORE: a mid-band drone (root 38.9 Hz), a string cluster (C#2 D2 G#2 D#3) that tightens to the wings and stops dead on them, bowed metal as its face comes round, a riser and a synthesized stinger at the wings, a heartbeat under the gore (scripts/horror_score.py); loop-quantised',
        'the diesel idle, the transformer close by, the work light click and buzz, feathers rustling, an owl hiss, talons on bark, blood dripping, the phone falling and landing, gallery taps, wind in the leaves and breathing at the microphone in the clip (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'UPdz7VfqnS3TyRW1ZPzx', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': '7 prompts x 4 variations, duration set on the node (about 760 credits): transformer hum and crickets 15 s loop, the whistle 5 s, wings 3 s, skin splitting 5 s, bucket hydraulics 8 s, truck pulling away 8 s, dogs 7 s',
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
