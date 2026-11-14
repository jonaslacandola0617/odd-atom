"""Episode 33 "Igalaw Mo ang Daliri" sound (Season 4: the batibat and bangungot).

Sound language: his strained breathing in the paralysis POV, with the world going muffled; the house's
clock ticking on whole seconds and striking three; the tree groaning and falling; the post and floor
taking weight; a heartbeat under the toe that stops dead when he wakes; a loop-quantised eerie score.
The breathing runs across the loop seam. -14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep33_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep33-batibat-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep33-batibat-v1-timeline.json').read_text())
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









# key times: must match K in src/horror/ep33/Episode33.tsx
l = lambda i: L[i]
PRESS = (0.2, 3.6)
CUT_TREE = l('l02')['start'] - 0.3
BOW = (l('l02')['start'] + 3.0, l('l02')['end'])
FALL = (l('l03')['start'] + 0.05, l('l03')['start'] + 1.2)
CUT_POST = l('l03')['start'] + 2.6
SHIFT = l('l03')['end'] - 0.6
CUT_HOUSE = l('l04')['start'] - 0.3
CUT_SAG = l('l05')['start'] - 0.3
SAG = (l('l05')['start'] + 0.6, l('l05')['start'] + 4.2)
CUT_CLOCK = l('l05')['start'] + 5.2
THREE = l('l05')['end'] - 1.7
CHIMES = [l('l05')['end'] + 0.1, l('l05')['end'] + 0.45, l('l05')['end'] + 0.8]
CUT_POV2 = l('l06')['start'] - 0.1
EYES = l('l06')['end'] + 0.3
CUT_TOE = l('l07')['start'] - 0.3
TOE = (l('l07')['end'] + 0.15, l('l07')['end'] + 0.5)
CUT_WAKE = l('l07')['end'] + 0.6
CUT_HER = l('l08')['start'] - 0.25
LOOP = DUR - 1.8
STINGERS = [EYES, CUT_WAKE, CUT_HER]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep33-{name}.mp3'
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
field = span(CUT_TREE, CUT_POST, 0.002)
inside = 1 - field
pov = span(0, CUT_TREE, 0.002) + span(CUT_POV2, CUT_TOE, 0.002) + span(LOOP, DUR, 0.002)

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
# the house at night: a low room tone, insects outside, and the clock's tick everywhere inside
room = unit(np.stack([filt(rng.standard_normal(N), SR, lo=60, hi=500), filt(rng.standard_normal(N), SR, lo=60, hi=500)], 1))
amb += room * (0.012 * inside * duck)[:, None]
cr = np.zeros(N)
for f0 in (4100, 4600, 5200):
    cr += np.sin(2 * np.pi * qf(f0) * T) * (np.sin(2 * np.pi * qf(rng.uniform(12, 17)) * T) > 0.45) * (0.5 + 0.5 * np.sin(2 * np.pi * qf(rng.uniform(0.5, 1.0)) * T))
# in his POV the world goes muffled: the insects drop away (paralysis)
muff = 1 - 0.85 * pov
amb += st(cr * 0.0035 * inside * muff * duck)
# dusk in the field: wind in the leaves, birds going home
wind = unit(np.stack([filt(rng.standard_normal(N), SR, lo=500, hi=5000), filt(rng.standard_normal(N), SR, lo=500, hi=5000)], 1))
amb += wind * (0.02 * field * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * T)) * duck)[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def breath_in(at, seconds=0.9, gain=0.05):
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    b = filt(rng.standard_normal(n), SR, lo=700, hi=5000) * np.sin(np.pi * tt / seconds) ** 2
    place(fx, st(b * gain), at)


# the clock: a tick every second inside the house (loop-safe: whole seconds over the episode)
for k in range(int(DUR)):
    t0 = k * DUR / int(DUR)
    n = int(0.03 * SR)
    tt = np.arange(n) / SR
    g = 0.03 if CUT_CLOCK <= t0 < CUT_POV2 else 0.008
    if field[int(t0 * SR)] > 0.5:
        continue
    place(fx, pan(filt(rng.standard_normal(n), SR, lo=2000, hi=8000) * np.exp(-tt * 300) * g * (1 - 0.7 * pov[int(t0 * SR)]), 0.3), t0)
# 3:00: three slow chimes, an old clock's dull gong
for c in CHIMES:
    n = int(2.2 * SR)
    tt = np.arange(n) / SR
    ch = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in ((392.0, 1.0, 1.6), (392.0 * 2.76, 0.4, 3.0), (392.0 * 5.4, 0.15, 5.0), (196.0, 0.3, 1.2)))
    place(fx, pan(ch * 0.05, 0.3), c)
# paralysis: his strained breathing, close, in the POV shots
br = sfx('breath-2')
for a, b in ((0.0, CUT_TREE), (CUT_POV2, CUT_TOE)):
    seg = xloop(br, b - a)
    place(fx, seg * (0.35 + 0.65 * duck[int(a * SR):int(a * SR) + len(seg)])[:, None], a, -9)
# the loop: the breathing runs across the seam
seg = xloop(br, DUR - LOOP)
place(fx, seg, LOOP, -9)
# the tree: branches groaning under the weight, then it falls (the crash lands as it hits)
tr = sfx('tree-4')
place(fx, tr * (0.5 + 0.5 * duck[int((FALL[1] - 1.24) * SR):int((FALL[1] - 1.24) * SR) + len(tr)])[:, None], FALL[1] - 1.24, -10)
cr3 = sfx('creak-3')
place(fx, cr3 * 0.5, BOW[0] + 0.5, -8)
# the post and the floor take weight: in the rafters, under the net, in the POV
for at, g in ((SHIFT, -6), (SAG[0], -6), (SAG[0] + 1.8, -8), (0.6, -10), (CUT_POV2 + 1.5, -9)):
    place(fx, cr3 * (0.4 + 0.6 * duck[int(at * SR):int(at * SR) + len(cr3)])[:, None], at, g)
# the toe: a tiny creak of the banig when it moves; then the gasp awake
n = int(0.12 * SR)
place(fx, st(filt(rng.standard_normal(n), SR, lo=1500, hi=6000) * np.exp(-np.arange(n) / SR * 40) * 0.05), TOE[0] + 0.05)
gasp = sfx('breath-1')
place(fx, gasp, CUT_WAKE, -2)
hit(CUT_HER, 0.2, 41)
write(OUT / 'stem-foley-fx.wav', fx)
# ------------------------------------------------------------------ the score (eerie, slow, minor; loop-quantised)
mus = np.zeros((N, 2))
lv = 0.85
drone_e = env([(0, lv), (CUT_TREE, 0.6), (BOW[0], 0.8), (FALL[0], 1.0), (CUT_HOUSE, 0.8), (SAG[0], 1.1), (CUT_CLOCK, 0.9), (CUT_POV2, 1.3), (EYES, 1.5), (CUT_TOE, 1.0), (TOE[0], 1.4), (CUT_WAKE, 0.3), (CUT_HER, 1.3), (LOOP, lv), (DUR, lv)])
mus += st(hs.drone_mid(T, qf, drone_e, root=51.91) * 1.7)
str_e = env([(0, 0.6), (CUT_TREE, 0.4), (FALL[0], 0.7), (CUT_HOUSE, 0.6), (SAG[0], 0.9), (CUT_POV2, 1.2), (EYES, 1.6), (CUT_TOE, 0.9), (TOE[0], 1.4), (CUT_WAKE, 0.2), (CUT_HER, 1.2), (LOOP, 0.6), (DUR, 0.6)])
trem = env([(0, 0.6), (CUT_TREE, 0.2), (CUT_HOUSE, 0.3), (SAG[0], 0.6), (CUT_POV2, 0.9), (EYES, 1.0), (CUT_TOE, 0.7), (TOE[0], 1.0), (CUT_WAKE, 0.1), (CUT_HER, 0.8), (LOOP, 0.6), (DUR, 0.6)])
mus += st(hs.strings(T, qf, [103.83, 110.0, 155.56], str_e, trem, SR, seed=3301) * 2.3)
# an original lullaby on the music box, slow, out of tune: the house asleep
THEME = [261.63, 0, 311.13, 293.66, 0, 261.63, 246.94, 0, 207.65, 0, 196.0]
place(mus, hs.music_box(SR, THEME, 0.5, 0.97, seed=3303), CUT_HOUSE + 0.2, -1.0)
# bowed metal over the post
place(mus, st(hs.metal_bow(SR, 4.0, 980.0, seed=3304)), CUT_POST, 1.0)
# a heartbeat under the toe, quickening; it stops dead when he wakes
place(mus, st(hs.heartbeat(SR, CUT_TOE, CUT_WAKE, 70, 128, gain=0.95, seed=3305)), CUT_TOE)
# her eyes open: a swell into a stinger; her toe: a stinger
place(mus, st(hs.reverse_swell(SR, [103.83, 155.56, 207.65], 0.9, seed=3306)), EYES - 0.9)
place(mus, hs.stinger(SR, seed=3307, size=1.1), EYES)
place(mus, hs.stinger(SR, seed=3308, size=0.9), CUT_HER)
mus *= (1 - speech * (1 - db(-5)))[:, None] * db(-4.5)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep33-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep33IgalawMoAngDaliri',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep33-batibat/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep33-batibat/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, an original out-of-tune music-box lullaby, bowed metal, a heartbeat under the toe that stops dead on waking, a reversed swell and stingers (scripts/horror_score.py); all tones loop-quantised',
        'the house at night, insects that drop away in his POV (paralysis), the clock tick on whole seconds and its three chimes, wind and birds at dusk, the banig, a low hit (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'xOvPJ12vuHpmYtP4GLDI', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (about 68 credits per prompt); picked by measurement, not by listening'},
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
