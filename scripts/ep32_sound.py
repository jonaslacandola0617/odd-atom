"""Episode 32 "Tatlong Katok" sound (Season 4, folklore: the kumakatok).

Sound language: knocks, always in threes; a barangay at midnight; dogs that bark as the three pass and
fall silent; the crickets stop when the three stand in front of our house; an eerie loop-quantised score
(the user asked for one, and for a seamless loop). -14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep32_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep32-katok-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep32-katok-v1-timeline.json').read_text())
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









# key times: must match K in src/horror/ep32/Episode32.tsx
l = lambda i: L[i]
KNOCK0 = [0.25, 0.85, 1.45]
LIGHT0 = 2.1
CUT_CRANE = l('l02')['start'] - 0.3
CUT_DOOR = l('l03')['start'] - 2.0
KNOCK1 = [l('l03')['start'] - 1.75, l('l03')['start'] - 1.15, l('l03')['start'] - 0.55]
LIGHT1 = l('l03')['start'] + 0.4
CANDLE1 = l('l03')['end'] - 1.6
CUT_CHALK = l('l04')['start'] - 0.3
CHALK = (l('l04')['start'] + 0.1, l('l04')['end'] - 0.2)
CUT_STREET = l('l05')['start'] - 0.3
CUT_GATE = l('l05')['end'] + 0.4
STOP = l('l06')['start'] - 0.7
HOOD = l('l06')['end'] + 0.15
CUT_PASS = l('l07')['start'] - 0.3
SLATS = (l('l07')['end'] + 0.2, l('l07')['end'] + 1.0)
CUT_HALL = l('l08')['start'] - 0.4
KNOCK2 = [l('l08')['end'] + 0.25, l('l08')['end'] + 0.85, l('l08')['end'] + 1.45]
LAMP_OUT = l('l08')['end'] + 2.05
LOOP = l('l08')['end'] + 2.7
STINGERS = [KNOCK0[0], KNOCK1[0], HOOD, KNOCK2[0], LAMP_OUT]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep32-{name}.mp3'
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
inside = span(CUT_HALL, LOOP, 0.002)
outside = 1 - inside
window = span(0, CUT_CRANE, 0.002) + span(CUT_GATE, CUT_HALL, 0.002) + span(LOOP, DUR, 0.002)

# ------------------------------------------------------------------ beds: a barangay at midnight
amb = np.zeros((N, 2))
night = unit(np.stack([filt(rng.standard_normal(N), SR, lo=80, hi=900), filt(rng.standard_normal(N), SR, lo=80, hi=900)], 1))
amb += night * (0.012 * outside * duck)[:, None]
# crickets and a gecko far off; they go quiet while the three are close (the gate)
near = env([(0, 1), (STOP - 1.5, 1), (STOP, 0.15), (CUT_PASS + 1.0, 0.15), (CUT_HALL, 0.8), (DUR, 1)])
cr = np.zeros(N)
for f0 in (4300, 4800, 5500):
    cr += np.sin(2 * np.pi * qf(f0) * T) * (np.sin(2 * np.pi * qf(rng.uniform(13, 18)) * T) > 0.4) * (0.5 + 0.5 * np.sin(2 * np.pi * qf(rng.uniform(0.6, 1.1)) * T))
amb += st(cr * 0.004 * outside * near * duck)
# a far tricycle passing once, early (life in the barangay before it goes still)
n = int(5 * SR)
tt = np.arange(n) / SR
tri = filt(np.sign(np.sin(2 * np.pi * (38 + 6 * np.sin(np.pi * tt / 5)) * tt)) + 0.3 * rng.standard_normal(n), SR, lo=80, hi=1200) * np.sin(np.pi * tt / 5) ** 2
# inside the house: a fan, the fridge hum
house = filt(rng.standard_normal(N), SR, lo=200, hi=1500) * (0.6 + 0.4 * np.sin(2 * np.pi * qf(3.1) * T))
amb += st(unit(house) * 0.006 * inside)
amb += st(np.sin(2 * np.pi * qf(120) * T) * 0.004 * inside)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def breath_in(at, seconds=0.9, gain=0.05):
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    b = filt(rng.standard_normal(n), SR, lo=700, hi=5000) * np.sin(np.pi * tt / seconds) ** 2
    place(fx, st(b * gain), at)


# one clean knock, cut from the ElevenLabs take, so every knock lands on the picture
kraw = sfx('knock-1').mean(1)
pk = int(np.argmax(np.abs(kraw)))
one = kraw[max(0, pk - int(0.01 * SR)):pk + int(0.32 * SR)].copy()
one *= np.linspace(1, 0, len(one)) ** 0.5
one /= np.abs(one).max() + 1e-9


def knock(at, gain=0.5, pan_=0.0, muffled=False, room=0.15):
    x = one * gain * rng.uniform(0.9, 1.05)
    if muffled:
        x = filt(x, SR, hi=900) * 1.6
    x = verb(x, 0.9, room, seed=int(at * 100), bright=3000)
    place(fx, pan(x, pan_), at)


for k in KNOCK0:
    knock(k, 0.42, -0.3, room=0.25)
for k in KNOCK1:
    knock(k, 0.5, -0.2, room=0.25)
for k in KNOCK2:
    knock(k, 0.75, 0.0, muffled=True, room=0.3)
# the knocks wrap the loop: the end of the reel runs straight into the first knock across the street
# the dogs: they bark when the three pass, then fall silent one by one
for at, g in ((l('l01')['end'] + 0.05, -6), (l('l05')['end'] + 0.1, -8), (l('l07')['end'] + 0.05, -10)):
    d4 = sfx('dogs-4')
    place(fx, d4 * (0.35 + 0.65 * duck[int(at * SR):int(at * SR) + len(d4)])[:, None], at, g)
# their steps: slow bare feet and robes dragging, while they walk
steps = sfx('steps-3')
for a, b, g in ((l('l01')['end'] - 1.2, CUT_CRANE + 6, -17), (CUT_STREET, STOP, -15), (CUT_PASS + 0.3, CUT_HALL, -16)):
    seg = xloop(steps, b - a) * np.linspace(0.6, 1.0, int((b - a) * SR))[:, None]
    seg[-int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))[:, None]
    place(fx, seg * (0.5 + 0.5 * duck[int(a * SR):int(a * SR) + len(seg)])[:, None], a, g)
# the windows lighting: a switch click; turning to candle: a match strike
for t0 in (LIGHT0, LIGHT1):
    k = int(0.03 * SR)
    place(fx, pan(filt(rng.standard_normal(k), SR, lo=1500, hi=7000) * np.exp(-np.arange(k) / SR * 200) * 0.05, -0.4), t0)
k = int(0.5 * SR)
tt = np.arange(k) / SR
place(fx, pan(filt(rng.standard_normal(k), SR, lo=800, hi=6000) * (np.exp(-tt * 18) * 0.12 + 0.02 * np.exp(-tt * 3)), -0.4), CANDLE1)
# Nanay's chalk on our door
ch = sfx('chalk-3')[: int((CHALK[1] - CHALK[0]) * SR)]
place(fx, fade(ch, 0.02, 0.2) * (0.4 + 0.6 * duck[int(CHALK[0] * SR):int(CHALK[0] * SR) + len(ch)])[:, None], CHALK[0], -6)
# a held breath at the window as they stop; the jalousie slats closing
breath_in(STOP - 0.2, 0.7, 0.03)
n = int((SLATS[1] - SLATS[0]) * SR)
tt = np.arange(n) / SR
sl = sum(filt(rng.standard_normal(n), SR, lo=1200, hi=6000) * np.exp(-np.abs(tt - d) * 60) for d in np.linspace(0.05, (SLATS[1] - SLATS[0]) - 0.05, 6))
place(fx, st(sl * 0.05), SLATS[0])
# Lola's door: the light under it goes out; a long low hit
hit(LAMP_OUT, 0.22, 42)
write(OUT / 'stem-foley-fx.wav', fx)
# ------------------------------------------------------------------ the score (eerie, minor, slow; loop-quantised)
mus = np.zeros((N, 2))
lv = 0.65
drone_e = env([(0, lv), (CUT_CRANE, 0.8), (CUT_DOOR, 0.9), (CUT_CHALK, 1.0), (CUT_STREET, 1.0), (STOP, 1.25), (HOOD, 1.5), (CUT_PASS, 0.7), (CUT_HALL, 0.9), (KNOCK2[0], 1.3), (LAMP_OUT, 1.4), (LOOP, lv), (DUR, lv)])
mus += st(hs.drone_mid(T, qf, drone_e, root=55.0) * 1.7)
str_e = env([(0, 0.4), (CUT_DOOR, 0.6), (CUT_CHALK, 0.85), (CUT_STREET, 0.8), (STOP, 1.2), (HOOD, 1.6), (CUT_PASS, 0.55), (CUT_HALL, 0.8), (KNOCK2[0], 1.4), (LOOP, 0.4), (DUR, 0.4)])
trem = env([(0, 0.2), (CUT_CHALK, 0.6), (CUT_STREET, 0.7), (STOP, 0.9), (HOOD, 1.0), (CUT_PASS, 0.2), (CUT_HALL, 0.6), (KNOCK2[0], 1.0), (LOOP, 0.2), (DUR, 0.2)])
mus += st(hs.strings(T, qf, [110.0, 116.54, 164.81], str_e, trem, SR, seed=3201) * 2.3)
# a three-note music-box figure: three notes, like three knocks (original)
THEME = [293.66, 277.18, 220.0, 0, 293.66, 277.18, 207.65, 0, 0, 246.94, 233.08, 174.61]
place(mus, hs.music_box(SR, THEME, 0.45, 0.975, seed=3203), l('l01')['end'] + 0.1, -1.0)
place(mus, hs.music_box(SR, THEME[:7], 0.6, 0.955, seed=3204), CUT_PASS + 0.6, -3.0)
# the approach: a heartbeat as they come up our side; bowed metal as they stop
place(mus, st(hs.heartbeat(SR, CUT_STREET + 0.5, HOOD, 60, 104, gain=0.85, seed=3205)), CUT_STREET + 0.5)
place(mus, st(hs.metal_bow(SR, 4.5, 1240.0, seed=3206)), STOP - 0.5, 2.0)
# the hood looks up: a reversed swell into a stinger
place(mus, st(hs.reverse_swell(SR, [110.0, 164.81, 233.08], 0.9, seed=3207)), HOOD - 0.9)
place(mus, hs.stinger(SR, seed=3208, size=1.1), HOOD)
# the knocks from inside: a riser into the first, a stinger when the light goes out
place(mus, st(hs.riser(SR, 1.4, seed=3209)), KNOCK2[0] - 1.4, -3.0)
place(mus, hs.stinger(SR, seed=3210, size=0.9), LAMP_OUT)
mus *= (1 - speech * (1 - db(-5.5)))[:, None] * db(-3.5)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep32-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep32TatlongKatok',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep32-katok/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep32-katok/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, an original three-note music-box figure, a heartbeat on the approach, bowed metal, a reversed swell and stingers (scripts/horror_score.py); all tones loop-quantised',
        'the barangay at night, crickets that fall quiet when the three stop, a far tricycle, the house fan and hum, switch clicks, a match strike, a breath, the jalousie slats, a low hit (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'zQpcgoOGwdbkyG8RJNKB', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (about 68 credits per prompt); picked by measurement, not by listening; one knock is cut from knock-1 and placed on the picture'},
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
