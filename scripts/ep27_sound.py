"""Episode 27 "The Ball" sound (Season 3: Waverly Hills Sanatorium, Louisville, Kentucky).

Sound language: SILENCE-HEAVY, no score: the IR camera's fan, the building settling (ElevenLabs
SFX), the investigator's boots, and the ball on concrete (ElevenLabs SFX), which carries the story:
- the hook: it starts rolling by itself, away from us;
- the porch: wind through the open bays and crickets outside; the ball rolling;
- the tunnel: from behind us, the ball bouncing down the steps (ElevenLabs SFX), past and away;
- the ward: it rolls in and stops against the iron bed with a small hollow tap; it rolls back;
- "Roll it back": the boot nudges it into the dark; nothing; then it comes back, fast, and bumps the
  boot; the eyes get no sound at all; black and silence.
Presence is measured with the whole non-voice bed. -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep27_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep27-ball-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep27-ball-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(27027)
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





# key times: must match K in src/horror/ep27/Episode27.tsx
l = lambda i: L[i]
ROLL1 = 0.45
CUT_EXT = l('l02')['start'] - 0.3
CUT_PORCH = l('l03')['start'] - 0.3
CUT_TUN = l('l04')['start'] - 0.3
BOUNCE = l('l04')['end'] + 1.0
CUT_COR = l('l06')['start'] - 0.4
TURN = l('l06')['end'] + 0.05
TAP = l('l06')['end'] + 2.1
BACK = l('l07')['end'] + 0.7
AT_FEET = l('l07')['end'] + 3.0
KICK = l('l08')['end'] + 0.35
AWAY = l('l08')['end'] + 2.6
RET = l('l08')['end'] + 3.95
AT_FEET2 = l('l08')['end'] + 5.05
EYES = (l('l08')['end'] + 6.0, l('l08')['end'] + 7.1)
BLACK = DUR - 0.45
STINGERS = [BOUNCE - 0.8, TAP, AT_FEET2, EYES[0]]
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep27-{name}.mp3'
    SFX_USED[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    x = load(path, 2)
    x = x / (np.abs(x).max() + 1e-9) * 0.5
    return x * db(gain_db)


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


def pan(x, p):
    x = x if x.ndim == 1 else x.mean(1)
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1)


def noise(seconds, lo, hi):
    return filt(rng.standard_normal(int(seconds * SR)), SR, lo=lo, hi=hi)


def click(at, gain=0.12):
    ck = int(0.03 * SR)
    place(fx, st(filt(rng.standard_normal(ck), SR, lo=2000, hi=8000) * np.exp(-np.arange(ck) / SR * 150) * gain), at)


def hit(at, gain=0.4, f=48):
    n = int(0.9 * SR)
    tt = np.arange(n) / SR
    place(fx, st((np.sin(2 * np.pi * f * tt) + 0.6 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 5) * gain), at)




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


hook = span(0, CUT_EXT, 0.005)
ext = span(CUT_EXT, CUT_PORCH, 0.005)
porch = span(CUT_PORCH, CUT_TUN, 0.005)
tun = span(CUT_TUN, CUT_COR, 0.005)
cor = span(CUT_COR, BLACK, 0.005)
pov = hook + porch + tun + cor
OUT.mkdir(parents=True, exist_ok=True)

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




# ------------------------------------------------------------------ voice (dry, close: the investigator behind the camera)
voice = np.zeros((N, 2))
for lid, ln in L.items():
    v = load(VOICE / f'{lid}.wav')
    v = filt(v, SR, lo=80, hi=11000)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = compress(v)
    v = verb(v, 0.5, 0.04, seed=27, bright=3000)
    place(voice, v, ln['start'], gain=-1.0)
speech = np.zeros(N)
for ln in L.values():
    speech = np.maximum(speech, env([(0, 0), (ln['start'] - 0.1, 0), (ln['start'], 1), (ln['end'], 1), (ln['end'] + 0.25, 0), (DUR, 0)]))
duck = 1 - speech * (1 - db(-7))

# ------------------------------------------------------------------ places
unit = lambda x: x / (np.sqrt(np.mean(x ** 2)) + 1e-12)
amb = np.zeros((N, 2))
air = unit(np.stack([filt(rng.standard_normal(N), SR, lo=60, hi=600), filt(rng.standard_normal(N), SR, lo=60, hi=600)], 1))
gust = 0.6 + 0.4 * np.sin(2 * np.pi * qf(0.11) * T) * np.sin(2 * np.pi * qf(0.29) * T + 1)
wind = unit(np.stack([filt(rng.standard_normal(N), SR, lo=150, hi=2000), filt(rng.standard_normal(N), SR, lo=150, hi=2000)], 1)) * gust[:, None]
# crickets outside: bursts of a 4.6 kHz chirp
chirp = np.zeros(N)
for t0 in np.arange(0.0, DUR, 0.42):
    for k in range(3):
        i = int((t0 + k * 0.035 + rng.uniform(0, 0.01)) * SR)
        n = int(0.02 * SR)
        if i + n < N:
            chirp[i:i + n] += np.sin(2 * np.pi * 4600 * np.arange(n) / SR) * np.hanning(n)
crick = pan(unit(chirp), 0.5)
# the camera's fan: a faint whine and hiss, on every POV shot
fan = unit(filt(rng.standard_normal(N), SR, lo=2500, hi=7000) + 0.3 * np.sin(2 * np.pi * qf(176) * T))
bldg = sfx('building-3')
bldg = loop_to(bldg, DUR)
amb += air * (0.016 * (hook + cor) + 0.02 * tun)[:, None]
amb += wind * (0.04 * ext + 0.03 * porch)[:, None]
amb += crick * (0.01 * ext + 0.012 * porch)[:, None]
amb += st(fan * 0.004 * pov)
amb += bldg * (db(-22) * (hook + cor + tun))[:, None]
amb *= duck[:, None]
amb[int(BLACK * SR):] = 0
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# the investigator's boots on concrete (Episode 26's ElevenLabs single steps, reused, quieter)
BOOTS = [load(SFX / f'ep26-boots-{i}.mp3', 2) for i in (1, 4, 2)]
BOOTS = [b / (np.abs(b).max() + 1e-9) * 0.5 for b in BOOTS]
SFX_USED['ep26-boots (reused)'] = {'path': 'public/assets/audio/eleven-sfx/ep26-boots-{1,4,2}.mp3', 'sha256': 'see Episode 26 PROVENANCE'}


def walk(a, b, period, gain):
    k = 0
    for t0 in np.arange(a + 0.1, b, period):
        place(fx, filt(BOOTS[k % 3].mean(1), SR, lo=120, hi=6000), t0, gain + (0 if k % 2 else -2.5))
        k += 1


walk(0, CUT_EXT, 0.7, -20)
walk(CUT_PORCH, CUT_TUN, 0.62, -19)
walk(CUT_TUN, BOUNCE - 0.6, 0.66, -18)
walk(CUT_COR, TAP + 0.6, 0.6, -19)
# the ball rolling (ElevenLabs), looped for each run; level by how near it is
R = [sfx('roll-2').mean(1), sfx('roll-1').mean(1)]


def rolling(a, b, g0, g1, which=0, speed=1.0):
    x = R[which]
    if speed != 1.0:
        x = np.interp(np.arange(0, len(x), speed), np.arange(len(x)), x)
    x = loop_to(x, b - a)
    x = x * np.linspace(db(g0), db(g1), len(x))
    f = int(0.06 * SR)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    place(fx, st(x), a)


rolling(ROLL1, CUT_EXT, -6, -16)
rolling(CUT_PORCH, CUT_TUN, -14, -20, 1)
rolling(CUT_COR, TURN, -14, -12)
rolling(TURN, TAP, -10, -16, 1)
rolling(BACK, AT_FEET, -18, -6)
rolling(KICK + 0.05, AWAY, -6, -22, 1)
rolling(RET, AT_FEET2, -20, -3, 0, 1.4)
# the tunnel: from behind us, the ball bouncing down the steps, past and away (ElevenLabs)
place(fx, verb(sfx('steps-2').mean(1), 1.6, 0.35, seed=4), BOUNCE - 0.9, 0)
place(fx, verb(sfx('steps-1').mean(1), 1.8, 0.4, seed=5), BOUNCE + 0.9, -8)
hit(BOUNCE - 0.8, 0.12, 42)
# the ward: the small hollow tap against the iron bed
n = int(0.5 * SR)
tt = np.arange(n) / SR
tap = (np.sin(2 * np.pi * 880 * tt) * np.exp(-tt * 18) + 0.6 * np.sin(2 * np.pi * 1390 * tt) * np.exp(-tt * 25) + 0.3 * np.sin(2 * np.pi * 2210 * tt) * np.exp(-tt * 30)) * 0.12
place(fx, verb(tap, 1.0, 0.3, seed=6), TAP)
place(fx, st(filt(sfx('bed-4').mean(1)[int(1.15 * SR):int(1.9 * SR)], SR, lo=200, hi=8000)), TAP - 0.02, -10)
# the boot nudges it; it comes back and bumps the boot
n = int(0.25 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=300, hi=3000) * np.sin(np.pi * tt / 0.25) * 0.06), KICK - 0.1)
place(fx, st((np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 25) * 0.35) + filt(rng.standard_normal(n), SR, lo=200, hi=2000) * np.exp(-tt * 40) * 0.08), AT_FEET2)
hit(AT_FEET2, 0.14, 44)
# a far knock in the building as the ball sits in the dark (ElevenLabs, building-2's knock)
place(fx, st(filt(sfx('building-2').mean(1)[int(0.75 * SR):int(1.5 * SR)], SR, lo=100, hi=3000)), AWAY + 0.4, -12)
fx[int(BLACK * SR):] = 0
write(OUT / 'stem-foley-fx.wav', fx)
mus = np.zeros((N, 2))  # no score in this episode
tvb = np.zeros((N, 2))
bed = amb + fx
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
take = ROOT / 'public/assets/audio/eleven-takes/ep27-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep27TheBall',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (library voice)', 'credits': json.loads((ROOT / 'docs/production/ep27-ball/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep27-ball/prompt.json'},
    'original_synthesis': [
        'NO SCORE: silence-heavy; the camera fan, the building settling, the ball on concrete (Season 3 sound language for Episode 27)',
        'the camera fan, corridor air, the wind on the porch and outside, crickets, the tunnel air, water drops, the metal tap of the bed, the boot scuff, the bump, two soft low hits (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'gvoreYbflgjzJZnEPUp1', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (68 credits per prompt); picked by measurement, not by listening'},
    'music_presence_note': 'there is no music; music_presence measures the whole non-voice bed against the voice',
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
