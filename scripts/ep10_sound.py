"""Episode 10 "The Night the Lake Breathed Out" sound, to the horror standard (Episode 6).

- Narrator: the ElevenLabs true-case take (Jack, scripts/ep10_voice.py), close, a dark room.
- Score (scripts/horror_score.py): mid-band drone, tremolo string clusters, the detuned
  music-box theme, reversed swells into two stingers in silence (the plume, the deep layer
  letting go), heartbeats, a riser, bowed metal.  The score drops out for the held black
  before dawn.
- The crater: crickets and a soft lake lap at night; a deep rumble as the lake lifts; the mist
  whooshing over the rim; the crickets stop dead when the lamp goes out (a hidden detail);
  dawn is wind only, no insects, no birds; underwater is muffled with rising bubbles; by day the
  degassing pipe's fountain hisses; the other lake laps, and one bubble breaks its surface.
Ducks 7 dB under speech; presence in the phone band; -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep10_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep10-lake-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep10-lake-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(10010)
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



# key times: must match K in src/horror/ep10/Episode10.tsx (the same rules on the same timeline)
BULGE = L['l03']['start'] + 2.2
PLUME = L['l03']['end'] + 0.35
LAMP_OUT = L['l05']['start'] - 0.9
BLACK = L['l05']['start'] - 0.45
ERUPT = L['l08']['end'] + 0.45
RING = L['l10']['end'] + 0.2
LOOP_ON = DUR - 1.6
STINGERS = [PLUME, ERUPT]
SHOTS = [(0, 'night'), (BLACK, 'black'), (L['l05']['start'], 'dawn'), (L['l07']['start'], 'under'),
         (L['l09']['start'], 'day'), (L['l10']['start'] - 0.5, 'other'), (LOOP_ON, 'night')]


def zone(*names):
    pts = []
    for i, (t0, m) in enumerate(SHOTS):
        t1 = SHOTS[i + 1][0] if i + 1 < len(SHOTS) else DUR
        v = 1.0 if m in names else 0.0
        pts += [(t0, v), (t1 - 0.01, v)]
    return env(pts)


OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v = filt(v, SR, lo=70)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = np.tanh(v * 1.4) / 1.4
    v = verb(v, 1.4, 0.10, seed=10, bright=3500)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ score
night, black, dawn, under, day, other = zone('night'), zone('black'), zone('dawn'), zone('under'), zone('day'), zone('other')
DAWN = L['l05']['start']
mus = np.zeros((N, 2))
drone_e = env([(0, 0.7), (BULGE, 0.9), (PLUME - 0.02, 1.0), (PLUME, 1.3), (LAMP_OUT, 1.3), (BLACK - 0.02, 1.3), (BLACK, 0.0), (DAWN, 0.0), (DAWN + 1.2, 0.6),
                (L['l07']['start'], 0.9), (ERUPT - 0.02, 1.2), (ERUPT, 1.5), (L['l09']['start'], 0.6), (L['l10']['start'], 0.9), (LOOP_ON, 0.7), (DUR, 0.7)])
mus += st(hs.drone_mid(T, qf, drone_e) * 1.6)
str_e = env([(0, 0.5), (6.0, 0.6), (BULGE, 0.8), (PLUME - 0.02, 0.9), (PLUME + 0.1, 1.4), (LAMP_OUT, 1.3), (BLACK - 0.02, 1.3), (BLACK, 0.0), (DAWN + 0.6, 0.0), (DAWN + 2.0, 0.7),
             (L['l07']['start'], 0.8), (ERUPT - 0.02, 1.1), (ERUPT + 0.1, 1.5), (L['l09']['start'] + 0.5, 0.5), (L['l10']['start'], 0.9), (LOOP_ON, 0.5), (DUR, 0.5)])
trem = env([(0, 0.3), (BULGE, 0.5), (PLUME, 0.9), (BLACK, 0.9), (DAWN, 0.2), (L['l08']['start'], 0.6), (ERUPT, 1.0), (L['l09']['start'], 0.2), (L['l10']['start'], 0.6), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [220.0, 233.08, 329.63], str_e, trem, SR, seed=101) * 2.2)
mus += st(hs.strings(T, qf, [349.23, 466.16], env([(0, 0), (PLUME - 0.02, 0), (PLUME + 0.1, 1.2), (BLACK - 0.02, 0.8), (BLACK, 0), (ERUPT - 0.02, 0), (ERUPT + 0.1, 1.1),
                                                     (L['l09']['start'], 0), (LOOP_ON - 0.4, 0), (DUR, 0)]), None, SR, seed=102))
# the theme: clean over the calm lake, detuned over the empty village at dawn, slow and flat by day
for t0, rate, det, g in [(L['l01']['end'] + 0.05, 0.42, 1.0, -3.5), (L['l06']['start'] + 0.3, 0.5, 0.982, -3.0), (L['l09']['start'] + 0.2, 0.66, 0.971, -2.5)]:
    place(mus, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0)), t0, g + 4)
for hit, freqs, d in [(PLUME, [220, 311.13, 466.16], 0.6), (ERUPT, [233.08, 329.63, 493.88], 0.9)]:
    place(mus, hs.reverse_swell(SR, freqs, d, seed=int(hit)), hit - d)
place(mus, hs.stinger(SR, seed=111, size=1.1), PLUME)
place(mus, hs.stinger(SR, seed=112, size=1.2), ERUPT)
# a heart racing as the mist comes down the valley, stopping when the lamp goes out
place(mus, hs.heartbeat(SR, L['l04']['start'], LAMP_OUT, 66, 104, gain=0.9, seed=113), L['l04']['start'])
place(mus, hs.heartbeat(SR, L['l08']['start'] - 0.5, ERUPT - 0.05, 70, 112, gain=0.9, seed=114), L['l08']['start'] - 0.5)
place(mus, hs.riser(SR, 2.0, seed=115), ERUPT - 2.0)
place(mus, st(hs.metal_bow(SR, 5.0, 1180, seed=116)), L['l07']['start'] + 0.4)
place(mus, st(hs.metal_bow(SR, 4.0, 1460, seed=117)), DAWN + 1.5)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-5.5)
# the held black before dawn: nothing at all
mus *= (1 - black)[:, None]
# the loop: frame 0 opens under the first line (music already ducked), so ease the tail toward that level
mus *= env([(0, 1), (LOOP_ON, 1), (DUR - 0.3, db(-2.6)), (DUR, db(-2.6))])[:, None]
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ the crater
amb = np.zeros((N, 2))
gust = 0.6 + 0.4 * np.sin(2 * np.pi * qf(0.11) * T) * np.sin(2 * np.pi * qf(0.037) * T)
wind_level = night * 0.022 + other * 0.02 + dawn * 0.03 + day * 0.02
wl = np.stack([filt(rng.standard_normal(N), SR, lo=250, hi=2600), filt(rng.standard_normal(N), SR, lo=250, hi=2600)], 1)
amb += wl * (wind_level * gust)[:, None]
# the lake lapping at the shore (the hook, the other lake and the loop)
lap = 0.5 + 0.5 * np.sin(2 * np.pi * qf(0.42) * T) ** 2
lake_zone = np.minimum(1, env([(0, 1), (L['l01']['end'], 1), (L['l01']['end'] + 0.3, 0.4), (PLUME, 0.4), (PLUME + 0.3, 0), (DUR, 0)]) + other + zone('night') * (T >= LOOP_ON))
amb += st(filt(rng.standard_normal(N), SR, lo=300, hi=2200) * lap * 0.018 * lake_zone)
# crickets: four insects, each a chirp train gated by whole-cycle tones (continuous at the loop)
crick = np.zeros(N)
for f, rate, ph, g in [(4300, 0.9, 0.0, 1.0), (4650, 1.15, 1.7, 0.8), (3950, 0.72, 3.1, 0.7), (5100, 1.4, 4.4, 0.5)]:
    train = (np.sin(2 * np.pi * qf(rate) * T + ph) > 0.55).astype(float)
    pulse = (np.sin(2 * np.pi * qf(28.0) * T + ph) > 0.2).astype(float)
    crick += np.sin(2 * np.pi * qf(f) * T) * train * pulse * g
crick = filt(crick, SR, lo=2500, hi=7000)
# they sing in the hook, the village and the flow, and stop dead the moment the lamp goes out;
# at the other lake (tonight, somewhere) they are singing again
cr_zone = np.where(T < LAMP_OUT, 1.0, 0.0) + other + np.where(T >= LOOP_ON, 1.0, 0.0)
amb += st(crick * 0.010 * np.minimum(cr_zone, 1))
# underwater: a muffled pressure and far groans
amb += st(filt(rng.standard_normal(N), SR, lo=80, hi=600) * 0.06 * under)
# by day: the degassing pipe's fountain
amb += st(filt(rng.standard_normal(N), SR, lo=1200, hi=7000) * 0.025 * day * (0.85 + 0.15 * np.sin(2 * np.pi * 1.7 * T)))
amb *= (1 - black)[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def thud(f0=70, dur=0.6, gain=0.6):
    tt = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * 9) + filt(rng.standard_normal(len(tt)), SR, lo=60, hi=900) * np.exp(-tt * 20) * 0.5) * gain


def bubble(f0=320, f1=900, dur=0.09, gain=0.05):
    tt = np.arange(int(dur * SR)) / SR
    f = f0 + (f1 - f0) * tt / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 30) * gain


# the rumble: felt before it is heard, then the lake lifts
tr = np.arange(int(4.5 * SR)) / SR
rumble = filt(rng.standard_normal(len(tr)), SR, lo=40, hi=420) * np.sin(np.pi * np.minimum(tr / 4.5, 1)) ** 1.5 * 0.2
place(fx, st(rumble), L['l03']['start'] + 0.3)
place(fx, lib('restrained_boom'), BULGE, -10)
# the plume: the water heaving up, then the mist pouring over the rim
place(fx, lib('low_cinematic_hit'), PLUME, -6)
tm = np.arange(int(5.0 * SR)) / SR
whoosh = filt(rng.standard_normal(len(tm)), SR, lo=200, hi=1800) * np.sin(np.pi * tm / 5.0) * 0.08
place(fx, st(whoosh), PLUME + 0.4)
place(fx, st(filt(rng.standard_normal(int(6 * SR)), SR, lo=150, hi=1200) * np.sin(np.linspace(0, np.pi, int(6 * SR))) * 0.05), L['l04']['start'] + 2.4)
# the lamp: a small glass tick as the flame dies, then nothing (the crickets have stopped)
n = int(0.05 * SR)
tk = np.arange(n) / SR
place(fx, verb(np.sin(2 * np.pi * 2600 * tk) * np.exp(-tk * 120) * 0.05, 0.6, 0.3, seed=121), LAMP_OUT)
# underwater: bubbles rising through the layers; the deep layer letting go in a rush
for t0 in np.arange(L['l07']['start'] + 0.3, ERUPT, 0.37):
    place(fx, verb(bubble(260 + rng.random() * 200, 700 + rng.random() * 400, gain=0.035), 0.6, 0.3, seed=int(t0 * 10)), t0 + rng.random() * 0.2)
place(fx, lib('low_cinematic_hit'), ERUPT, -5)
te = np.arange(int(2.6 * SR)) / SR
rush = filt(rng.standard_normal(len(te)), SR, lo=120, hi=2500) * np.exp(-te * 1.2) * 0.18
place(fx, st(rush), ERUPT + 0.05)
for i in range(40):
    place(fx, bubble(300 + rng.random() * 300, 900 + rng.random() * 600, gain=0.05), ERUPT + 0.1 + rng.random() * 1.2)
# the other lake: one bubble breaks the surface (the ring)
place(fx, verb(bubble(380, 1100, 0.12, 0.09), 0.8, 0.35, seed=131), RING - 0.05)
write(OUT / 'stem-foley-fx.wav', fx)
tvb = np.zeros((N, 2))  # no television in this episode (the mix code below is shared with Episodes 7-9)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep10-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep10TheNightTheLakeBreathedOut',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator', 'credits': '945 for the one take that generated (the second of the two did not start)',
                       'prompt': 'docs/production/ep10-lake/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): A2/E3 mid-band drone; tremolo string clusters (A3-Bb3-E4, +F4/Bb4 on the scares); music-box theme clean, detuned and slow-and-flat; reversed swells into the two stingers; heartbeats 66-104 and 70-112 bpm; a riser into the eruption; bowed metal; all of it cut for the held black before dawn',
        'crater: gusting wind; the lake lapping; four synthesized crickets that stop dead when the lamp goes out; a muffled underwater pressure; the degassing pipe fountain by day',
        'foley: the rumble, the lake lifting, the plume and the mist pouring over the rim, the lamp dying, bubbles rising through the water, the deep layer letting go, one bubble on the other lake',
        'loop: drone, strings, wind, lake lap and crickets snapped to whole cycles; the hook and the end are the same night lake',
    ],
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
