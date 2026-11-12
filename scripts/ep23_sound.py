"""Episode 23 "Backwards" sound, v2 (the rewind transitions and their sounds removed after the user's note on v1) (Season 3: the Bell Witch, Adams, Tennessee, 1817-1821).

Season 3 rule: each episode has its own sound language. This one runs BACKWARDS too: every scene
ends in a film rewind (a rising whir and a reversed swell sucked back into the previous scene), and
the score's swells are reversed. Real-sounding effects carry the scenes:
- the funeral: wind and snow, ropes creaking as the coffin goes down, then a LAUGH from nowhere
  (ElevenLabs SFX) and a gust that snuffs the lanterns (ElevenLabs SFX); the laugh echoes on under
  the next line;
- the sickroom: a candle, slow laboured breathing (synthesized), a glass vial rolling on wood;
- supper: the hearth, cutlery that stops; a chair scraping back; a whisper too low to make out
  (reversed narration, filtered, at least 12 dB under the voice);
- the children's room: a quilt sliding off a bed, then yanked across the boards (ElevenLabs SFX);
- outside, 1817: crickets; scratching dragged along the logs (ElevenLabs SFX); corn rustling, coming
  closer;
- the first night: one slow scratch into a bedpost.
Score: a low mid-band drone and tremolo strings (scripts/horror_score.py), reversed swells into
each rewind, one stinger at the laugh. Ducks 7 dB under speech; -14 LUFS with an encoded-AAC
peak check; stems as FLAC.  Run: python3 scripts/ep23_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep23-bell-v2'
VOICE = ROOT / 'public/assets/audio/ep23-bell-v1/voice'  # the split narration is unchanged from v1
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep23-bell-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(23023)
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



# key times: must match K in src/horror/ep23/Episode23.tsx
LAUGH = L['l01']['end'] + 0.25
GUST = (L['l01']['end'] + 0.55, L['l01']['end'] + 1.75)
REW = [(L['l02']['end'] + 0.15, L['l03']['start'] - 0.4), (L['l04']['end'] + 0.3, L['l05']['start'] - 0.2),
       (L['l05']['end'] + 1.4, L['l06']['start'] - 0.05), (L['l06']['end'] + 1.85, L['l07']['start'])]
VIAL = (L['l03']['end'] + 0.1, L['l04']['start'] - 0.1)
LEAN = L['l05']['end'] + 0.1
SCRAPE = L['l05']['end'] + 0.5
SLIDE = (L['l06']['start'] + 0.5, L['l06']['end'] + 0.15)
YANK = L['l06']['end'] + 0.25
MARKS = (L['l07']['start'] + 0.6, L['l07']['end'] + 0.8)
CORN = (L['l08']['start'] + 0.4, L['l08']['end'] - 0.4)
POST = L['l08']['end'] + 0.4
GROOVE = (L['l09']['start'] - 0.2, L['l09']['end'] + 0.3)
SCENES = [0, REW[0][1], REW[1][1], REW[2][1], REW[3][1], POST]
STINGERS = [LAUGH, YANK]
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep23-{name}.mp3'
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


rewinding = np.zeros(N)  # v2: no rewinds; each scene runs on to a hard cut
grave = span(0, REW[0][1], 0.01)
sick = span(REW[0][1], REW[1][1], 0.01)
table = span(REW[1][1], REW[2][1], 0.01)
kids = span(REW[2][1], REW[3][1], 0.01)
out = span(REW[3][1], POST, 0.02)
post = span(POST, DUR, 0.02)

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
for lid, l in L.items():
    v = load(VOICE / f'{lid}.wav')
    v = filt(v, SR, lo=80, hi=11000)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = compress(v)
    v = verb(v, 0.5, 0.04, seed=21, bright=3000)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ places
amb = np.zeros((N, 2))
wind = np.stack([filt(rng.standard_normal(N), SR, lo=200, hi=2500), filt(rng.standard_normal(N), SR, lo=200, hi=2500)], 1)
gusty = 0.6 + 0.4 * np.sin(2 * np.pi * qf(0.13) * T) * np.sin(2 * np.pi * qf(0.05) * T)
amb += wind * (0.02 * gusty * grave + 0.012 * out)[:, None]
room = np.stack([filt(rng.standard_normal(N), SR, lo=60, hi=500), filt(rng.standard_normal(N), SR, lo=60, hi=500)], 1)
amb += room * (0.01 * (sick + table + kids + post))[:, None]
# the hearth (supper) and a candle (sickroom, the first night): crackles
crack = (rng.random(N) < 0.0009).astype(float) * rng.standard_normal(N)
amb += st(filt(crack, SR, lo=800, hi=6000) * (0.25 * table + 0.08 * (sick + post)))
amb += st(filt(rng.standard_normal(N), SR, lo=80, hi=400) * 0.01 * table)
# crickets outside (1817)
chirp = np.sin(2 * np.pi * 4300 * T) * (np.sin(2 * np.pi * qf(28) * T) > 0.4) * (np.sin(2 * np.pi * qf(0.9) * T) > -0.2)
amb += pan(chirp * 0.004 * out, 0.4)
amb *= (1 - rewinding)[:, None]
write(OUT / 'stem-ambience.wav', amb)

# ------------------------------------------------------------------ events
fx = np.zeros((N, 2))
# the funeral: ropes creaking as the coffin goes down; the laugh; the gust; the laugh echoing on
place(fx, pan(filt(lib('wood_stress'), SR, hi=2500), 0.2), 1.0, -14)
place(fx, pan(filt(lib('cable_tension'), SR, hi=3000), -0.2), 2.8, -18)
place(fx, pan(sfx('laugh-1'), -0.3), LAUGH, -1)
place(fx, pan(verb(sfx('laugh-1').mean(1), 3.5, 0.7, seed=2301, bright=3000), 0.4), LAUGH + 0.25, -12)
place(fx, st(sfx('gust-2')), GUST[0], -2)
tail = sfx('laugh-3')[int(2.0 * SR):int(8.0 * SR)]
place(fx, pan(fade(filt(tail, SR, lo=300, hi=3000), 0.5, 1.5), 0.6), L['l02']['start'] + 1.0, -14)
# the sickroom: slow laboured breathing; the vial rolling on the sill and stopping
for k, t0 in enumerate(np.arange(REW[0][1] + 0.4, REW[1][0] - 0.5, 3.1)):
    n = int(2.2 * SR)
    tt = np.arange(n) / SR
    br = filt(rng.standard_normal(n), SR, lo=200, hi=1800) * (np.sin(np.pi * tt / 2.2) ** 2) * 0.025
    br *= 1 + 0.8 * (np.sin(2 * np.pi * 31 * tt) > 0.7) * (tt > 1.1)  # a rattle on the out-breath
    place(fx, pan(br, -0.4), t0)
n = int((VIAL[1] - VIAL[0]) * SR)
tt = np.arange(n) / SR
roll = filt(rng.standard_normal(n), SR, lo=1500, hi=7000) * (0.5 + 0.5 * np.sin(2 * np.pi * (6 + 10 * tt / tt[-1]) * tt)) * 0.03 * np.minimum(1, tt * 5)
place(fx, pan(roll, 0.5), VIAL[0])
tk = int(0.03 * SR)
place(fx, pan(filt(rng.standard_normal(tk), SR, lo=2000, hi=8000) * np.exp(-np.arange(tk) / SR * 150) * 0.12, 0.3), VIAL[1])
# supper: cutlery clinks; at the lean, everything stops; the chair scrapes back; a whisper
for t0 in np.arange(REW[1][1] + 0.6, LEAN - 0.2, 1.3):
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    place(fx, pan(np.sin(2 * np.pi * (2600 + rng.random() * 900) * tt) * np.exp(-tt * 50) * 0.03, rng.random() - 0.5), t0)
n = int(0.4 * SR)
tt = np.arange(n) / SR
scrape = filt(rng.standard_normal(n) * (1 + 0.9 * np.sign(np.sin(2 * np.pi * 21 * tt))), SR, lo=200, hi=2400) * np.sin(np.pi * tt / 0.4) * 0.12
place(fx, pan(verb(scrape, 0.8, 0.3, seed=2310, bright=2400), 0.0), SCRAPE)
wv = load(VOICE / 'l05.wav')[::-1]
whisper = filt(wv, SR, lo=1200, hi=5000)
whisper = whisper / (np.abs(whisper).max() + 1e-9) * 0.05
place(fx, pan(verb(whisper[:int(1.4 * SR)], 1.2, 0.6, seed=2311, bright=4000), -0.6), SCRAPE + 0.2)
# the children's room: the quilt slides, then is yanked across the boards
place(fx, pan(sfx('quilt-4')[:int((SLIDE[1] - SLIDE[0]) * SR)], -0.3), SLIDE[0], 6)
place(fx, pan(sfx('quilt-1'), -0.1), YANK, 4)
place(fx, st(np.sin(2 * np.pi * 60 * np.arange(int(0.4 * SR)) / SR) * np.exp(-np.arange(int(0.4 * SR)) / SR * 10) * 0.25), YANK + 0.05)
# outside, 1817: scratching along the logs, one stroke per mark; corn rustling, closer and closer
for k in range(9):
    t0 = MARKS[0] + k * (MARKS[1] - MARKS[0]) / 9
    place(fx, pan(sfx('scratch-1' if k % 2 else 'scratch-4')[:int(0.9 * SR)], -0.2 + 0.05 * k), t0, -4 + k * 0.4)
n = int((CORN[1] - CORN[0]) * SR)
tt = np.arange(n) / SR
rustle = filt(rng.standard_normal(n) * (0.5 + 0.5 * (rng.random(n) < 0.2)), SR, lo=800, hi=6000) * (tt / tt[-1]) ** 2 * 0.09
place(fx, np.stack([rustle * np.linspace(1.0, 0.6, n), rustle * np.linspace(0.3, 1.0, n)], 1), CORN[0])
# the first night: one slow scratch into the bedpost
place(fx, pan(sfx('scratch-2'), 0.1), GROOVE[0], -6)
place(fx, pan(sfx('scratch-3')[:int(1.5 * SR)], 0.1), GROOVE[0] + 1.0, -10)
# v2: no rewind whir or click; each cut lands straight in the next scene's sound
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ score: a drone and strings; reversed swells into every rewind
mus = np.zeros((N, 2))
hush = 1 - rewinding
drone_e = env([(0, 0.6), (LAUGH - 0.02, 0.7), (LAUGH, 1.4), (REW[0][0], 0.9), (REW[1][0], 0.9), (LEAN, 1.1), (REW[2][0], 1.0), (YANK, 1.3), (POST, 0.9), (DUR, 0.6)])
mus += st(hs.drone_mid(T, qf, drone_e, root=73.42) * 1.5)
str_e = env([(0, 0.3), (LAUGH, 1.0), (REW[0][0], 0.6), (LEAN, 1.0), (YANK, 1.2), (CORN[0], 0.8), (CORN[1], 1.3), (POST, 0.5), (DUR, 0.3)])
trem = env([(0, 0.2), (LAUGH, 1.0), (REW[0][0], 0.4), (CORN[0], 0.6), (CORN[1], 1.0), (POST, 0.3), (DUR, 0.2)])
mus += st(hs.strings(T, qf, [146.83, 155.56, 220.0], str_e, trem, SR, seed=2320) * 2.0)
place(mus, hs.stinger(SR, seed=2340, size=1.1), LAUGH)
place(mus, hs.riser(SR, 1.0, seed=2341), YANK - 1.0)
mus *= (1 - speech * (1 - db(-7)))[:, None] * hush[:, None]
write(OUT / 'stem-score.wav', mus)
tvb = np.zeros((N, 2))
bed = amb + fx
PRESENCE = hs.presence(voice, mus, TL['lines'], SR)

# ------------------------------------------------------------------ every line at least 4.5 dB over everything else (lift at most 8 dB)
LIFTS = {}
for lid, l in L.items():
    a, b = int(l['start'] * SR), int((l['end'] + 0.12) * SR)
    rest = (tvb + amb + mus + fx)[a:b].mean(1)
    m = 20 * np.log10(np.sqrt(np.mean(voice[a:b].mean(1) ** 2)) + 1e-12) - 20 * np.log10(np.sqrt(np.mean(rest ** 2)) + 1e-12)
    LIFTS[lid] = round(float(min(8.0, max(0.0, 4.6 - m))), 1)
    voice[a:b] *= db(LIFTS[lid])
write(OUT / 'stem-voice.wav', voice)
PRESENCE = hs.presence(voice, mus, TL['lines'], SR)

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
                    'voice_minus_score_db': round(float(rms_db(voice[a:b].mean(1)) - rms_db(mus[a:b].mean(1))), 1)})
clash = [h for h in STINGERS for l in L.values() if l['start'] - 0.05 <= h <= l['end'] + 0.1]
head = rms_db(mix[:SR // 4].mean(1))
tail = rms_db(mix[-SR // 4:].mean(1))
for stem in OUT.glob('stem-*.wav'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(stem), '-c:a', 'flac', str(stem.with_suffix('.flac'))], check=True)
    stem.unlink()
take = ROOT / 'public/assets/audio/eleven-takes/ep23-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep23Backwards',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (library voice)', 'credits': json.loads((ROOT / 'docs/production/ep23-bell/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep23-bell/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): a D2 mid-band drone, tremolo strings, reversed swells into each rewind, one stinger at the laugh, a riser into the yank',
        'places: wind and snow, rooms, hearth and candle crackle, crickets (synthesized)',
        'foley: laboured breathing, a vial rolling, cutlery, a chair scraping, corn rustling (synthesized); a whisper made from the reversed, filtered narration line 5 (v2: no rewind sounds)',
    ],
    'elevenlabs_sfx': {'flow_id': 'dxoXiHRrtfx5ejv6Y8UC', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (68 credits per prompt); variations picked by measured envelope and spectrum, not by listening'},
    'music_presence_note': 'music_presence measures the score only; voice margins are against everything',
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
