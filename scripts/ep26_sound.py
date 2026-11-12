"""Episode 26 "Post Three" sound (Season 3: the Castle of Good Hope, Cape Town).

Sound language: DIEGETIC, no score: the radio (squelch, key clicks, the message tone), boots on
stone (ElevenLabs SFX), the wind off the bay and the sea, and silence where the picture frightens:
- the hook: her running steps far down the corridor, and the radio picking something up;
- the courtyard: his steps stop; two more sound behind him; a door closes and latches;
- the governor's room: a page turns; the chair scrapes back by itself;
- the ramparts: the wind drops dead when the tall man straightens;
- the corridor: she runs at him (ElevenLabs SFX); the torch dies; she passes in the dark;
- the dungeon: water; the door slams (ElevenLabs SFX); the torch dies; control's message tone; a
  breath close by; one low hit; black and silence.
Presence is measured with the whole non-voice bed. -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep26_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep26-castle-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep26-castle-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(26026)
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




# key times: must match K in src/horror/ep26/Episode26.tsx
l = lambda i: L[i]
HOOK_RUN = (0.25, 1.45)
CUT_EXT = l('l01')['end'] + 1.0
WINDOW = l('l02')['end'] + 0.25
CUT_YARD = l('l03')['start'] - 0.5
STOP = l('l03')['start'] + 3.1
STEPS2 = (l('l03')['end'] + 0.35, l('l03')['end'] + 0.9)
TURN_YARD = (l('l03')['end'] + 1.25, l('l03')['end'] + 1.95)
DOOR = (l('l03')['end'] + 1.55, l('l03')['end'] + 2.55)
CUT_GOV = l('l04')['start'] - 0.45
PAGE = (l('l04')['end'] - 0.6, l('l04')['end'] + 0.2)
CHAIR = (l('l05')['end'] + 0.25, l('l05')['end'] + 0.85)
CUT_RAMP = l('l06')['start'] - 0.55
RISE = (l('l06')['end'] + 0.15, l('l06')['end'] + 1.0)
GONE = (l('l06')['end'] + 1.0, l('l06')['end'] + 1.45)
CUT_COR = l('l07')['start'] - 0.5
APPEAR = l('l08')['end'] + 0.3
RUN = (l('l08')['end'] + 0.55, l('l08')['end'] + 1.75)
COR_OUT = (l('l08')['end'] + 1.48, l('l08')['end'] + 2.15)
CUT_DUN = l('l09')['start'] - 0.25
SLAM = l('l09')['end'] + 0.45
TURN_DUN = (l('l09')['end'] + 0.55, l('l09')['end'] + 1.05)
TORCH_OUT = l('l09')['end'] + 1.35
RAISE = (l('l09')['end'] + 1.45, l('l09')['end'] + 2.05)
MSG = l('l09')['end'] + 2.25
HAND = (l('l09')['end'] + 3.1, l('l09')['end'] + 4.0)
BLACK = DUR - 0.4
STINGERS = [DOOR[1], CHAIR[0], RISE[0], RUN[0], SLAM, HAND[0]]
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep26-{name}.mp3'
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


hook = span(0, CUT_EXT, 0.005)
ext = span(CUT_EXT, CUT_YARD, 0.005)
yard = span(CUT_YARD, CUT_GOV, 0.005)
gov = span(CUT_GOV, CUT_RAMP, 0.005)
ramp = span(CUT_RAMP, CUT_COR, 0.005)
cor = span(CUT_COR, CUT_DUN, 0.005)
dun = span(CUT_DUN, BLACK, 0.005)
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



# ------------------------------------------------------------------ voice (dry, close; he is speaking into the radio on l01 and l09)
voice = np.zeros((N, 2))
for lid, ln in L.items():
    v = load(VOICE / f'{lid}.wav')
    v = filt(v, SR, lo=80, hi=11000)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = compress(v)
    v = verb(v, 0.6, 0.05, seed=26, bright=3000)
    place(voice, v, ln['start'], gain=-1.0)
speech = np.zeros(N)
for ln in L.values():
    speech = np.maximum(speech, env([(0, 0), (ln['start'] - 0.1, 0), (ln['start'], 1), (ln['end'], 1), (ln['end'] + 0.25, 0), (DUR, 0)]))
duck = 1 - speech * (1 - db(-7))

# ------------------------------------------------------------------ places
amb = np.zeros((N, 2))
air = np.stack([filt(rng.standard_normal(N), SR, lo=60, hi=700), filt(rng.standard_normal(N), SR, lo=60, hi=700)], 1)
gust = 0.6 + 0.4 * np.sin(2 * np.pi * qf(0.13) * T) * np.sin(2 * np.pi * qf(0.31) * T + 1)
wind = np.stack([filt(rng.standard_normal(N), SR, lo=150, hi=2200), filt(rng.standard_normal(N), SR, lo=150, hi=2200)], 1) * gust[:, None]
sea = np.stack([filt(rng.standard_normal(N), SR, lo=80, hi=1200), filt(rng.standard_normal(N), SR, lo=80, hi=1200)], 1) * (0.5 + 0.5 * np.sin(2 * np.pi * qf(0.09) * T) ** 2)[:, None]
unit = lambda x: x / (np.sqrt(np.mean(x ** 2)) + 1e-12)
air, wind, sea = unit(air), unit(wind), unit(sea)
amb += air * (0.02 * (hook + cor) + 0.02 * gov + 0.012 * dun)[:, None]
amb += wind * (0.05 * ext + 0.025 * yard + 0.06 * ramp * (1 - span(RISE[0], GONE[1], 0.25)))[:, None]  # on the ramparts the wind drops dead when he straightens
amb += sea * (0.03 * ext + 0.035 * ramp)[:, None]
cave = lib('cavern_lowwind')
cave = np.concatenate([cave] * int(np.ceil(DUR / (len(cave) / SR)) + 1))[:N]
amb += cave * (db(-24) * dun)[:, None]
amb *= duck[:, None]
amb[int(BLACK * SR):] = 0
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# his boots on stone (ElevenLabs single steps, alternating), wherever he walks
B = [sfx('boots-1'), sfx('boots-4'), sfx('boots-2')]


def walk(a, b, period, gain, dry=True):
    k = 0
    for t0 in np.arange(a + 0.08, b, period):
        s = B[k % 3]
        place(fx, s if dry else verb(s.mean(1), 1.2, 0.3, seed=k), t0, gain + (0 if k % 2 else -2.5))
        k += 1


walk(0, CUT_EXT, 0.56, -10)
walk(CUT_YARD, STOP, 0.56, -9)
walk(CUT_GOV, CUT_GOV + 3, 0.7, -12)
walk(CUT_RAMP, RISE[0], 0.56, -11)
walk(CUT_COR, APPEAR, 0.66, -12)
walk(CUT_DUN, CUT_DUN + 1.6, 0.42, -9)
# the radio: key clicks and squelch around his two calls; the receive squelch when she is near
for ln in (L['l01'], L['l09']):
    click(ln['start'] - 0.12, 0.08)
    place(fx, st(filt(sfx('radio-3')[int(1.4 * SR):int(2.3 * SR)].mean(1), SR, lo=500, hi=6000)), ln['end'] + 0.08, -14)
place(fx, st(filt(sfx('radio-2').mean(1), SR, lo=600, hi=6000)[:int(1.2 * SR)]), HOOK_RUN[0], -18)
place(fx, st(filt(sfx('radio-2').mean(1), SR, lo=600, hi=6000)[:int(1.4 * SR)]), APPEAR, -15)
# 1. the hook: her running steps, far down the corridor
place(fx, verb(filt(sfx('run-2').mean(1), SR, lo=300, hi=4000), 1.6, 0.35, seed=3), HOOK_RUN[0] - 0.1, -6)
# 2. from above: nothing but wind and the sea; the window lights in silence
# 3. the courtyard: he stops; two more steps behind him (wetter, further); his turn; the door
for i, t0 in enumerate(STEPS2):
    place(fx, verb(filt(B[i].mean(1), SR, lo=120, hi=3000), 1.4, 0.4, seed=40 + i), t0, -9)
place(fx, st(noise(0.35, 600, 5000) * np.sin(np.pi * np.arange(int(0.35 * SR)) / SR / 0.35) * 0.04), TURN_YARD[0])
place(fx, verb(lib('heavy_hinge').mean(1), 1.0, 0.25, seed=5), DOOR[0], -12)
place(fx, verb(lib('steel_latch').mean(1), 1.0, 0.3, seed=6), DOOR[1] - 0.05, -6)
place(fx, st(filt(sfx('slam-1').mean(1), SR, hi=1800)), DOOR[1] - 0.08, -12)
# 4. the governor's room: the page turns by itself; the chair scrapes back
place(fx, lib('paper_light_turn'), PAGE[0], -10)
n = int((CHAIR[1] - CHAIR[0]) * SR)
tt = np.arange(n) / SR
judder = (np.sin(2 * np.pi * 23 * tt) > 0.2) * 0.6 + 0.4
scrape = filt(rng.standard_normal(n), SR, lo=250, hi=2500) * judder * np.sin(np.pi * tt / tt[-1]) * 0.22
place(fx, verb(scrape, 0.8, 0.2, seed=8), CHAIR[0])
place(fx, lib('wood_stress'), CHAIR[0] - 0.05, -10)
# 5. the ramparts: the wind drops; the torch flickers
for t0 in (GONE[0], GONE[0] + 0.12, GONE[0] + 0.26, GONE[1]):
    click(t0, 0.1)
hit(RISE[0], 0.18, 44)
# 6. the corridor: silence when she appears; she runs at him; the torch dies; she passes in the dark
place(fx, filt(sfx('run-2'), SR, lo=200, hi=5000), RUN[0] - 0.15, -2)
place(fx, pan(sfx('run-1'), -0.6), COR_OUT[0] + 0.15, -2)
place(fx, pan(sfx('run-3'), 0.7), COR_OUT[0] + 0.4, -6)
n = int(0.5 * SR)
tt = np.arange(n) / SR
whoosh = filt(rng.standard_normal(n), SR, lo=300, hi=4000) * np.sin(np.pi * tt / 0.5) ** 2 * 0.12
place(fx, np.stack([whoosh * np.linspace(1, 0.2, n), whoosh * np.linspace(0.2, 1, n)], 1), COR_OUT[0] + 0.2)
click(COR_OUT[0], 0.12)
click(COR_OUT[1], 0.1)
hit(RUN[0], 0.22, 52)
# 7. the dungeon: water dropping; the door slams behind him; the torch dies; the message; the hand
for t0 in np.arange(CUT_DUN + 0.7, BLACK - 0.3, 1.9):
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    drop = np.sin(2 * np.pi * (1400 - 4000 * tt) * tt) * np.exp(-tt * 60) * 0.03
    place(fx, verb(drop, 1.2, 0.5, seed=int(t0 * 10)), t0)
place(fx, sfx('slam-3'), SLAM - 0.02, 0)
hit(SLAM, 0.3, 40)
for t0 in (TORCH_OUT - 0.28, TORCH_OUT - 0.17, TORCH_OUT - 0.06, TORCH_OUT):
    click(t0, 0.1)
place(fx, st(filt(sfx('radio-4').mean(1), SR, lo=500, hi=6000)[:int(0.9 * SR)]), MSG - 0.5, -12)
n = int(0.09 * SR)
tt = np.arange(n) / SR
for k, f in enumerate((1200, 1600)):
    place(fx, st(np.sin(2 * np.pi * f * tt) * np.minimum(1, np.minimum(tt, tt[-1] - tt) / 0.005) * 0.05), MSG + k * 0.13)
# a breath, very close, as the hand comes to rest; one low hit
n = int(1.1 * SR)
tt = np.arange(n) / SR
breath = filt(rng.standard_normal(n), SR, lo=300, hi=3500) * np.sin(np.pi * tt / 1.1) ** 1.5 * 0.05
place(fx, np.stack([breath, breath * 0.6], 1), HAND[0] - 0.3)
hit(HAND[0], 0.35, 46)
fx[int(BLACK * SR):] *= 0
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
take = ROOT / 'public/assets/audio/eleven-takes/ep26-take2.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep26PostThree',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (library voice)', 'credits': json.loads((ROOT / 'docs/production/ep26-castle/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep26-castle/prompt.json'},
    'original_synthesis': [
        'NO SCORE: radio squelch, boots on stone and the wind off the bay (Season 3 sound language for Episode 26)',
        'the corridor and dungeon air, the wind on the ramparts and over the castle, the sea, water drops, the radio key clicks and the message tone, torch clicks, cloth, the page, the chair scraping, a breath, low hits (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'zpapeHc6ecmvVW0Ey4SU', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (68 credits per prompt); picked by measurement, not by listening'},
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
