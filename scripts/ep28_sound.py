"""Episode 28 "Developing" sound (Season 3: the Brown Lady of Raynham Hall, 1936).

Sound language: NO SCORE: the photographers' world in 1936 and the darkroom.
- the darkroom: the tray rocking (ElevenLabs SFX), drips, the safelight's hum;
- the house: wind, an owl, the motor car on the gravel;
- the hall: a slow clock; the view camera's shutter and dark slide (ElevenLabs SFX); the magnesium
  flash (ElevenLabs SFX): the whoosh and pop, then the hall ringing;
- the ground glass: everything muffled under the focusing cloth; old stairs creaking (ElevenLabs
  SFX) as the shape comes down;
- the moonlit stair: wind at the window, a dress rustling, a tread;
- the end: the stop bath, the tray slowing; silence; the last flash at the lens; black.
Presence is measured with the whole non-voice bed. -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep28_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep28-brown-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep28-brown-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(28028)
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






# key times: must match K in src/horror/ep28/Episode28.tsx
l = lambda i: L[i]
CUT_EXT = l('l02')['start'] - 0.4
CUT_HALL = l('l03')['start'] - 0.4
FLASH1 = l('l03')['end'] + 0.35
CUT_GLASS = l('l04')['start'] - 0.3
VAPOUR = l('l04')['start'] + 1.6
CUT_FLASH = l('l04')['end'] + 0.25
FLASH2 = l('l05')['start'] - 0.6
LAMP_ON = l('l05')['start'] + 0.9
CUT_DARK2 = l('l06')['start'] - 0.3
TO_STOP = l('l07')['end'] + 0.2
CUT_STAIR2 = l('l08')['start'] - 0.4
LANDING = (l('l08')['start'] + 1.2, l('l08')['start'] + 2.9)
CUT_DARK3 = l('l09')['start'] - 0.5
CUT_FINAL = l('l09')['end'] + 1.9
FLASH3 = l('l09')['end'] + 2.2
BLACK = l('l09')['end'] + 2.9
STINGERS = [FLASH1, FLASH2, FLASH3]
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep28-{name}.mp3'
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


dark = span(0, CUT_EXT, 0.005) + span(CUT_DARK2, CUT_STAIR2, 0.005) + span(CUT_DARK3, CUT_FINAL, 0.005)
ext = span(CUT_EXT, CUT_HALL, 0.005)
hall = span(CUT_HALL, CUT_GLASS, 0.005) + span(CUT_FLASH, CUT_DARK2, 0.005) + span(CUT_FINAL, BLACK, 0.005)
glass = span(CUT_GLASS, CUT_FLASH, 0.005)
stair = span(CUT_STAIR2, CUT_DARK3, 0.005)
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





# ------------------------------------------------------------------ voice (dry, close)
voice = np.zeros((N, 2))
for lid, ln in L.items():
    v = load(VOICE / f'{lid}.wav')
    v = filt(v, SR, lo=80, hi=11000)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = compress(v)
    v = verb(v, 0.6, 0.04, seed=28, bright=3000)
    place(voice, v, ln['start'], gain=-1.0)
speech = np.zeros(N)
for ln in L.values():
    speech = np.maximum(speech, env([(0, 0), (ln['start'] - 0.1, 0), (ln['start'], 1), (ln['end'], 1), (ln['end'] + 0.25, 0), (DUR, 0)]))
duck = 1 - speech * (1 - db(-7))

# ------------------------------------------------------------------ places
unit = lambda x: x / (np.sqrt(np.mean(x ** 2)) + 1e-12)
amb = np.zeros((N, 2))
room = unit(np.stack([filt(rng.standard_normal(N), SR, lo=60, hi=500), filt(rng.standard_normal(N), SR, lo=60, hi=500)], 1))
gust = 0.6 + 0.4 * np.sin(2 * np.pi * qf(0.12) * T) * np.sin(2 * np.pi * qf(0.27) * T + 1)
wind = unit(np.stack([filt(rng.standard_normal(N), SR, lo=150, hi=1800), filt(rng.standard_normal(N), SR, lo=150, hi=1800)], 1)) * gust[:, None]
hum = unit(filt(np.sin(2 * np.pi * qf(100) * T) + 0.5 * np.sign(np.sin(2 * np.pi * qf(100) * T)) * 0.2, SR, lo=80, hi=1200))
amb += room * (0.03 * (hall + stair) + 0.012 * glass + 0.016 * dark)[:, None]
amb += wind * (0.04 * ext + 0.016 * stair)[:, None]
amb += st(hum * 0.01 * dark)
# the tray rocking (ElevenLabs), on the darkroom shots
tray = loop_to(np.concatenate([sfx('tray-2').mean(1), sfx('tray-4').mean(1)]), DUR)
amb += st(tray * db(-13) * dark * (1 - 0.6 * span(CUT_DARK3 + 1.5, CUT_FINAL, 1.5)))
amb *= duck[:, None]
amb[int(BLACK * SR):] = 0
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# the hall clock: a slow tick, all through the hall shots (muffled under the cloth)
for t0 in np.arange(CUT_HALL, BLACK, 1.0):
    n = int(0.03 * SR)
    tk = filt(rng.standard_normal(n), SR, lo=1500, hi=6000) * np.exp(-np.arange(n) / SR * 120) * 0.05
    g = 1.0 if (hall[min(N - 1, int(t0 * SR))] > 0.5 or stair[min(N - 1, int(t0 * SR))] > 0.5) else (0.35 if glass[min(N - 1, int(t0 * SR))] > 0.5 else 0)
    if g:
        place(fx, verb(tk, 1.2, 0.3, seed=int(t0)), t0, 20 * np.log10(g))
# darkroom drips
for t0 in np.concatenate([np.arange(0.9, CUT_EXT, 1.7), np.arange(CUT_DARK2 + 0.5, CUT_STAIR2, 1.7), np.arange(CUT_DARK3 + 0.4, CUT_FINAL, 1.7)]):
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    place(fx, verb(np.sin(2 * np.pi * (1500 - 4000 * tt) * tt) * np.exp(-tt * 60) * 0.03, 0.6, 0.3, seed=int(t0 * 10)), t0)
# the house: an owl, the motor car on the gravel
for t0, f0 in ((CUT_EXT + 0.6, 380), (CUT_EXT + 1.05, 340)):
    n = int(0.45 * SR)
    tt = np.arange(n) / SR
    place(fx, pan(np.sin(2 * np.pi * f0 * tt) * np.sin(np.pi * tt / 0.45) ** 2 * 0.03, -0.6), t0)
n = int((CUT_HALL - CUT_EXT) * SR)
tt = np.arange(n) / SR
engine = (np.sin(2 * np.pi * 34 * tt) + 0.6 * np.sin(2 * np.pi * 68 * tt) + 0.3 * np.sin(2 * np.pi * 102 * tt)) * (1 + 0.3 * np.sin(2 * np.pi * 8 * tt))
gravel = filt(rng.standard_normal(n), SR, lo=800, hi=5000) * (0.6 + 0.4 * rng.random(n))
car = (filt(engine, SR, lo=30, hi=400) * 0.025 + gravel * 0.014) * np.minimum(1, tt / 1.5) * np.minimum(1, (tt[-1] - tt) / 0.8 + 0.3)
place(fx, st(car), CUT_EXT)
# the hall: the dark slide and shutter, the flashes
place(fx, sfx('shutter-1'), FLASH1 - 1.9, -10)
place(fx, sfx('shutter-4'), FLASH1 - 0.15, -8)
place(fx, verb(sfx('flash-4').mean(1), 1.8, 0.35, seed=7), FLASH1 - 0.03, -2)
# under the cloth: the stairs creaking as the shape comes down (ElevenLabs), muffled, far
creak = sfx('stairs-2').mean(1)
creak = creak / (np.abs(creak).max() + 1e-9) * 0.5
place(fx, st(filt(creak, SR, lo=150, hi=2500)), VAPOUR + 0.4, -10)
n = int(0.4 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=500, hi=4000) * np.sin(np.pi * tt / 0.4) * 0.03), CUT_GLASS + 0.05)  # the cloth
# the second photograph: the shutter, the big flash, the hall ringing; then silence and the clock
place(fx, sfx('shutter-4'), FLASH2 - 0.12, -6)
place(fx, verb(sfx('flash-2').mean(1), 2.2, 0.4, seed=8), FLASH2 - 0.03, 0)
hit(FLASH2, 0.12, 40)
n = int(0.12 * SR)
place(fx, st(filt(rng.standard_normal(n), SR, lo=1500, hi=6000) * np.exp(-np.arange(n) / SR * 60) * 0.06), LAMP_ON)  # the lamp switch
# the moonlit stair: a tread, the dress rustling, at the landing
place(fx, st(filt(creak[int(0.0 * SR):], SR, lo=150, hi=4000)), LANDING[0] - 0.4, -4)
n = int(1.4 * SR)
tt = np.arange(n) / SR
place(fx, pan(filt(rng.standard_normal(n), SR, lo=1200, hi=6000) * np.sin(np.pi * tt / 1.4) ** 2 * 0.02, 0.2), LANDING[0] + 0.2)
# the end: the tongs; silence; the last flash at the lens; one low hit; black
place(fx, st(filt(rng.standard_normal(int(0.1 * SR)), SR, lo=2000, hi=8000) * 0.03), TO_STOP - 0.2)
place(fx, verb(sfx('flash-2').mean(1), 1.6, 0.3, seed=9), FLASH3 - 0.03, 0)
hit(FLASH3, 0.3, 44)
fx[int(BLACK * SR):] *= np.linspace(1, 0, N - int(BLACK * SR))[:, None] ** 3
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
take = ROOT / 'public/assets/audio/eleven-takes/ep28-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep28Developing',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (library voice)', 'credits': json.loads((ROOT / 'docs/production/ep28-brown/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep28-brown/prompt.json'},
    'original_synthesis': [
        'NO SCORE: shutters, the flash, footsteps on old stairs, the darkroom drip (Season 3 sound language for Episode 28)',
        'the hall clock, room tone, the muffled sound under the focusing cloth, the safelight hum, drips, the wind, an owl, the motor car, cloth, a low hit (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'vdRKYHhrYJvRj99nO6gD', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (68 credits per prompt); picked by measurement, not by listening'},
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
