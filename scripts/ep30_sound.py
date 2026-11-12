"""Episode 30 "What They Tell You" sound (Season 3 finale: Poveglia, the Venetian Lagoon).

Sound language: THE LEGEND IS LOUD; THE RECORD IS QUIET. No score.
- the legend (the old travel film): church bells across the lagoon (ElevenLabs SFX), the water,
  the boat, a projector flutter; the birds lift off; the grass parts; a shutter knocks; the bell in
  the tower swings by itself; each claim is stamped by a RECORD card (a dry thump). The bells build
  to a wall under "That's what they tell you" and cut dead;
- today: a hollow room, drips, the lagoon very low; the boat leaving without us (ElevenLabs SFX);
  one bell in the silence, ringing into the black.
Presence is measured with the whole non-voice bed. -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep30_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep30-poveglia-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep30-poveglia-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(30030)
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








# key times: must match K and CARDS in src/horror/ep30/Episode30.tsx
l = lambda i: L[i]
BIRDS = 0.4
CUT_FIELD = l('l02')['start'] - 0.3
PART = (l('l02')['start'] + 0.3, l('l03')['start'] - 0.3)
CUT_HOSP = l('l03')['start'] - 0.3
CUT_TOWER = l('l04')['start'] - 0.3
BELL = l('l04')['start'] + 0.6
CUT_RUIN = l('l05')['end'] + 0.35
AT_WINDOW = l('l08')['start'] - 0.6
BOAT = (l('l08')['start'] + 0.2, DUR - 0.8)
BELL_ONCE = DUR - 2.4
BLACK = DUR - 0.6
CARDS = [l('l01')['end'] + 0.2, l('l02')['end'] + 0.2, l('l03')['end'] + 0.15, l('l04')['end'] + 0.2, l('l08')['end'] + 0.3]
BELL_STRIKES = [l('l04')['end'] + 0.65, l('l05')['start'] - 0.7]
STINGERS = [CUT_RUIN, BELL_ONCE] + CARDS + BELL_STRIKES
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep30-{name}.mp3'
    SFX_USED[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    x = load(path, 2)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.1  # unit level: -20 dB RMS
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


film = span(0, CUT_RUIN, 0.002)
now = span(CUT_RUIN, BLACK, 0.002)
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
    v = verb(v, 0.6, 0.04, seed=30, bright=3000)
    place(voice, v, ln['start'], gain=-1.0)
speech = np.zeros(N)
for ln in L.values():
    speech = np.maximum(speech, env([(0, 0), (ln['start'] - 0.1, 0), (ln['start'], 1), (ln['end'], 1), (ln['end'] + 0.25, 0), (DUR, 0)]))
duck = 1 - speech * (1 - db(-9))

# ------------------------------------------------------------------ the legend: bells and water, building to a wall; cut dead
unit = lambda x: x / (np.sqrt(np.mean(x ** 2)) + 1e-12)
amb = np.zeros((N, 2))
bells = xloop(np.concatenate([sfx('bells-4'), sfx('bells-1')]), DUR)
water = xloop(sfx('water-1'), DUR)
build = env([(0, 0.55), (CUT_FIELD, 0.5), (CUT_TOWER, 0.65), (l('l04')['end'], 1.0), (CUT_RUIN, 1.6), (DUR, 1.6)])
amb += bells * (0.55 * build * film * duck)[:, None]
amb += water * (0.35 * film * duck)[:, None]
# the projector: a soft 18 fps flutter under the old film
proj = filt(rng.standard_normal(N), SR, lo=900, hi=5000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * qf(18) * T)))
amb += st(unit(proj) * 0.012 * film)
# the boat we arrive in
place(amb, xloop(sfx('boat-3'), CUT_FIELD) * (duck[:int(CUT_FIELD * SR)])[:, None], 0, -6)
# wind in the grass, in the field
grass = unit(np.stack([filt(rng.standard_normal(N), SR, lo=1500, hi=7000), filt(rng.standard_normal(N), SR, lo=1500, hi=7000)], 1))
gw = span(CUT_FIELD, CUT_HOSP, 0.002) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * T))
amb += grass * (0.03 * gw * duck)[:, None]
# today: almost nothing; a hollow room tone and the lagoon, very low; drips
room = unit(np.stack([filt(rng.standard_normal(N), SR, lo=60, hi=400), filt(rng.standard_normal(N), SR, lo=60, hi=400)], 1))
amb += room * (0.012 * now)[:, None]
lag = env([(0, 0), (CUT_RUIN + 1.2, 0), (CUT_RUIN + 3.5, 0.12), (AT_WINDOW, 0.25), (BLACK, 0.3), (BLACK + 0.002, 0), (DUR, 0)])
amb += water * (lag * duck)[:, None]
for t0 in np.arange(CUT_RUIN + 1.5, BLACK - 0.5, 1.3):
    t0 += rng.uniform(0, 0.7)
    n = int(0.06 * SR)
    tt = np.arange(n) / SR
    d = np.sin(2 * np.pi * (1500 - 4000 * tt) * tt) * np.exp(-tt * 70) * 0.025
    place(amb, pan(d, rng.uniform(-0.6, 0.6)), t0)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# birds lifting off the tower: wing flutters
for i in range(10):
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    w = filt(rng.standard_normal(n), SR, lo=600, hi=4000) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * tt)) * np.sin(np.pi * tt / 0.25) * 0.05
    place(fx, pan(w, rng.uniform(-0.7, 0.7)), BIRDS + i * 0.07 + rng.uniform(0, 0.05))
# the grass parting, coming towards us: a swish that grows louder
n = int((PART[1] - PART[0]) * SR)
tt = np.arange(n) / SR
sw = filt(rng.standard_normal(n), SR, lo=800, hi=6000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 1.6 * tt))) * np.linspace(0.2, 1, n) ** 2 * 0.06
seg = speech[int(PART[0] * SR):int(PART[0] * SR) + n]
place(fx, st(sw * (1 - 0.6 * seg)), PART[0])
# the shutter on its hinge: creaks with the swing, and a knock against the wall
for t0 in np.arange(CUT_HOSP + 0.4, CUT_TOWER - 0.3, 1.65):
    n = int(0.5 * SR)
    tt = np.arange(n) / SR
    cr = filt(np.sign(np.sin(2 * np.pi * (240 + 90 * np.sin(2 * np.pi * 3 * tt)) * tt)) * rng.uniform(0.6, 1, n), SR, lo=300, hi=3000) * np.sin(np.pi * tt / 0.5) * 0.02
    place(fx, pan(cr, 0.3), t0)
    k = int(0.08 * SR)
    place(fx, pan(filt(rng.standard_normal(k), SR, lo=150, hi=1200) * np.exp(-np.arange(k) / SR * 50) * 0.08, 0.3), t0 + 0.55)
# the bell in the tower swinging by itself: its strikes rise out of the wall
for b in BELL_STRIKES:
    place(fx, sfx('bell-1'), b, -2)
# the RECORD stamps: a dry rubber-stamp thump
for c in CARDS:
    k = int(0.12 * SR)
    tt = np.arange(k) / SR
    place(fx, st((filt(rng.standard_normal(k), SR, lo=100, hi=2500) * np.exp(-tt * 45) * 0.18 + np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 30) * 0.12)), c)
# the cut to today: one low hit in the sudden silence
hit(CUT_RUIN + 0.02, 0.22, 40)
# the boat leaving without us (an engine moving away)
boat = xloop(sfx('boat-4'), BOAT[1] - BOAT[0] + 0.6)
boat *= np.linspace(1, 0.15, len(boat))[:, None]
boat[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))[:, None]
place(fx, boat * (0.6 + 0.4 * (1 - speech[int(BOAT[0] * SR):int(BOAT[0] * SR) + len(boat)]))[:, None], BOAT[0], 2)
# one bell, in the silence; it rings into the black
place(fx, sfx('bell-3'), BELL_ONCE, 4)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep30-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep30WhatTheyTellYou',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (library voice)', 'credits': json.loads((ROOT / 'docs/production/ep30-poveglia/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep30-poveglia/prompt.json'},
    'original_synthesis': [
        'NO SCORE: the bells and the lagoon build to a wall under the legend and cut dead at the record (Season 3 sound language for Episode 30)',
        'the film projector, wind in the grass, the grass parting, the shutter, the RECORD stamps, room tone, drips, low hits (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'm6CaQL2c4T1w0O5SY93o', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (68 credits per prompt); picked by measurement, not by listening'},
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
