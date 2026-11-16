"""Episode 48 "Bedspace" (Season 5: one more sleeper than there are of us, in an old Manila boarding house;
retold from experiences shared online) sound.

Sound language: the boarding room at 3 a.m. (an ElevenLabs 20 s loop: fan, far traffic, sleepers),
Episode 40's cicadas for the morning; a phone-torch click on every count in the picture (synthesized);
the old bunk creaking (ElevenLabs) whenever the sixth has moved and as its head comes round; Episode
29's breath at my nape; neck cracks on the snaps and Episode 41's stinger when it comes over my
shoulder. A loop-quantised score over Episode 41's drone that drops out at the bare mattress.
-14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep48_sound.py
"""
import hashlib, json, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep48-bedspace-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep48-bedspace-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(48048)
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



# key times: must match K in src/horror/ep48/Episode48.tsx
l = lambda i: L[i]
CUT_BUILDING = l('l02')['start'] - 0.3
CUT_WAKE = l('l03')['start'] - 0.3
TORCH_ON = l('l03')['start'] + 2.4
CUT_COUNT = l('l04')['start'] - 0.3
COUNTS = [l('l04')['start'] + d for d in (0.03, 1.02, 2.03, 2.98, 3.91, 4.73)]
CUT_MORNING = l('l05')['start'] - 0.3
CUT_RECOUNT = l('l06')['start'] - 0.3
RECOUNT = [l('l06')['start'] + d for d in (0.15, 0.55, 0.95, 1.35, 1.9, 3.5, 5.2)]
CUT_BED = l('l07')['start'] - 0.3
CUT_NAPE = l('l08')['start'] - 0.3
TURNS = [l('l08')['start'] + d for d in (1.0, 2.3, 3.6)]
SNAP = l('l08')['end'] + 0.6
LOOP = DUR - 1.7
HOOK = [-1.6, -1.15, -0.7, -0.25, 0.2, 0.65]
STINGERS = [SNAP]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}

def sfx(name, gain_db=0.0):
    path = SFX / (f'{name}.mp3' if re.match(r'ep\d', name) else f'ep48-{name}.mp3')
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





building = span(CUT_BUILDING, CUT_WAKE, 0.002)
morning = span(CUT_MORNING, CUT_RECOUNT, 0.002)
night = np.clip(1 - building - morning, 0, 1)
# the near silence from the bed shot to the stinger: only the room and the breath
close = span(CUT_BED, SNAP - 0.05, 0.004)

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
rb = sfx('roomloop-b1')
rbed = wrap(xloop(filt(rb.mean(1), SR, lo=60, hi=9000), DUR + 3, 0.5))
amb += np.stack([rbed[:, 0], rbed[:, 0]], 1) * (db(-9.5) * night * (1 - 0.5 * close) * (0.6 + 0.4 * duck))[:, None]
amb += np.stack([filt(rbed[:, 0], SR, lo=60, hi=1200)] * 2, 1) * (db(-12) * building)[:, None]
cic = sfx('ep40-cicadas-1')
cbed = xloop(filt(cic.mean(1), SR, lo=1500, hi=9000), DUR, 0.4)
amb += cbed * (db(-16) * morning * (0.5 + 0.5 * duck))[:, None]
amb += np.stack([filt(rbed[:, 0], SR, lo=200, hi=4000)] * 2, 1) * (db(-18) * morning)[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# the phone torch: one click per count, panned to where it points
def click(at, p=0.0, g=0.0):
    m = int(0.025 * SR)
    c = filt(rng.standard_normal(m), SR, lo=1800, hi=9000) * np.exp(-np.arange(m) / (0.003 * SR)) * 0.25
    place(fx, pan(c, p), at, g)
for k, at in enumerate(HOOK):
    click(at % DUR if at < 0 else at, 0.6 - 0.25 * k, -3.0)
click(TORCH_ON, 0.0, -2.0)
for k, at in enumerate(COUNTS):
    click(at - 0.05, 0.6 - 0.25 * k, -3.0)
for k, at in enumerate(RECOUNT):
    click(at - 0.05, 0.6 - 0.2 * k, -4.0)
# the sheets as I sit up
n = int(0.8 * SR)
sh = filt(rng.standard_normal(n), SR, lo=400, hi=5000) * np.sin(np.pi * np.arange(n) / n) ** 2 * 0.02
place(fx, pan(sh, -0.3), CUT_WAKE + 0.5)
# the bunk: it creaked when it moved (heard before the empty upper bunk), as it lies behind me, and as its head comes round
cr = [sfx(f'creak-{i}') for i in (1, 2, 3, 4)]
place(fx, pan(fade(cr[0].mean(1), 0.05, 0.6), -0.6), RECOUNT[5] - 0.6, -12.0)
place(fx, pan(fade(cr[1][: int(2.5 * SR)].mean(1), 0.2, 0.8), -0.5), CUT_BED + 0.4, -15.0)
for k, at in enumerate(TURNS):
    c = cr[(k + 2) % 4][: int(1.4 * SR)].mean(1)
    place(fx, pan(fade(c, 0.05, 0.5), -0.4), at - 0.35, -14.0 + 2 * k)
# its breath at my nape, between the turns
br = sfx('ep29-breath-4')
b1 = fade(br.mean(1), 0.1, 0.4)
place(fx, pan(b1, -0.3), CUT_BED + 2.2, -10.0)
place(fx, pan(b1, -0.3), CUT_NAPE + 0.2, -6.0)
# neck cracks on the snaps, the last one loudest
nk = sfx('ep41-neck-4')
mm = nk.mean(1)
hp = int(0.01 * SR)
ee = np.array([np.sqrt(np.mean(mm[i:i + hp] ** 2)) for i in range(0, len(mm) - hp, hp)])
p0 = int(np.argmax(ee)) * hp
crack = nk[max(0, p0 - int(0.02 * SR)): p0 + int(0.22 * SR)]
crack = crack * np.hanning(len(crack))[:, None]
for at in TURNS:
    place(fx, pan(crack.mean(1), -0.3), at, -4.0)
place(fx, pan(crack.mean(1), 0.2), SNAP, 1.0)
n = int(1.1 * SR)
tt = np.arange(n) / SR
bth = pan(filt(rng.standard_normal(n), SR, lo=300, hi=2500) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.01, -0.4)
place(fx, bth, DUR - 0.6)
place(fx, bth, -0.6)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the score
mus = np.zeros((N, 2))
d4 = sfx('ep41-drone-2')
drb = wrap(xloop(d4, DUR + 3, 0.8))
drone_e = env([(0, 1.0), (CUT_BUILDING, 0.6), (CUT_WAKE, 0.8), (CUT_COUNT, 1.0), (CUT_MORNING, 0.0), (CUT_RECOUNT, 0.0), (CUT_RECOUNT + 0.5, 1.0), (CUT_BED, 1.2), (SNAP + 0.1, 1.6), (LOOP, 1.0), (DUR, 1.0)])
mus += drb * (db(-18) * drone_e)[:, None]
d_e = env([(0, 0.8), (CUT_BUILDING, 0.4), (CUT_WAKE, 0.6), (CUT_COUNT, 0.9), (CUT_MORNING, 0.0), (CUT_RECOUNT, 0.0), (CUT_RECOUNT + 0.5, 0.9), (CUT_BED, 1.1), (SNAP + 0.1, 1.5), (LOOP, 0.8), (DUR, 0.8)])
mus += st(hs.drone_mid(T, qf, d_e, root=36.71) * 1.6)
str_e = env([(0, 0.6), (CUT_BUILDING, 0.3), (CUT_WAKE, 0.5), (CUT_COUNT, 0.9), (CUT_MORNING, 0.0), (CUT_RECOUNT, 0.0), (CUT_RECOUNT + 0.5, 0.9), (CUT_BED, 1.1), (SNAP + 0.1, 1.5), (LOOP, 0.6), (DUR, 0.6)])
trem = env([(0, 0.5), (CUT_BED, 0.9), (LOOP, 0.5), (DUR, 0.5)])
mus += st(hs.strings(T, qf, [73.42, 77.78, 110.0], str_e, trem, SR, seed=4801) * 2.2)
mb = sfx('ep41-musicbox-2')
place(mus, verb(pan(fade(mb[: int(5.5 * SR)].mean(1), 0.3, 1.5), 0.2), 1.6, 0.3, seed=4803, bright=5000), CUT_MORNING + 0.4, -15.0)
place(mus, st(hs.heartbeat(SR, CUT_BED, SNAP - 0.1, 66, 104, gain=0.5, seed=4804)), CUT_BED)
place(mus, st(hs.metal_bow(SR, 3.0, 990.0, seed=4805)), RECOUNT[5], -6.0)
rz = sfx('ep41-riser-3')
place(mus, fade(rz[: int(4.5 * SR)], 0.8, 0.05), SNAP - 4.5, -13.0)
st1 = sfx('ep41-stinger-4')
place(mus, st1, SNAP, -6.5)
place(mus, hs.stinger(SR, seed=4806, size=1.0), SNAP, -6.0)
mus = np.stack([filt(mus[:, 0], SR, lo=100, hi=12000), filt(mus[:, 1], SR, lo=100, hi=12000)], 1)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(0.8)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep48-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep48Bedspace',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep48-bedspace/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep48-bedspace/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, bowed metal at the empty upper bunk, a heartbeat from the bed shot to the snap, a synthesized stinger doubling the ElevenLabs one (scripts/horror_score.py); loop-quantised; it drops out at the bare mattress',
        'a phone-torch click on every count, the sheets, a breath across the seam (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': '58XmqiblL5aw1dUC52LC', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': 'old account flow hGPDgw0ks4oe2SVkpIjf: a bunk creak 4 s (4 variations) and the boarding room 20 s loop (1 of 4; the rest failed on quota); new account flow 58XmqiblL5aw1dUC52LC: the boarding room 20 s loop again (4 variations, about 268 credits)',
                       'reused': 'Episode 29 breath-4, Episode 40 cicadas-1, and Episode 41 variations (drone-2, stinger-4, riser-3, musicbox-2, neck-4)',
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
