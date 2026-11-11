"""Episode 9 "The Lighthouse That Went Dark" sound, to the horror standard (Episode 6).

- Narrator: the ElevenLabs true-case take (Jack, scripts/ep09_voice.py), close, a dark room.
- Score (scripts/horror_score.py): mid-band drone, tremolo string clusters, the detuned
  music-box theme, reversed swells and stingers in silence (the dark doorway, the torn
  railings, the doorway at night), a heartbeat, a riser into the wave, bowed metal.
- The island: sea and wind everywhere, scaled with the weather of each shot; oars and
  rowlocks in the hook; a steamer's engine at night; the storm (wind, rain, breakers); the
  wave builds to a roar and cuts dead to the quiet morning; inside, the wind through the walls,
  one tick from the stopped clock and then nothing; the door; the lantern.
Ducks 7 dB under speech; presence in the phone band; -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep09_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep09-lighthouse-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep09-lighthouse-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(9009)
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


def tv_speaker(x, drive=2.0):
    """A small 1970s TV speaker: band-limited, a little driven, a boxy little room."""
    x = filt(x, SR, lo=280, hi=3600, slope=1.5)
    x = np.tanh(x * drive / (np.abs(x).max() + 1e-9)) * np.abs(x).max()
    return verb(x, 0.4, 0.12, seed=71, bright=3000)



# key times: must match K in src/horror/ep09/Episode09.tsx
DOOR, RAIL, RUN, WAVE, MORNING, DOORWAY, SUB = 20.2, 31.1, 40.4, 43.6, 46.2, 48.1, 51.0
LOOP_ON = DUR - 1.6
STINGERS = [DOOR, RAIL, DOORWAY]
SHOTS = [(0, 'grey'), (L['l01']['end'], 'night'), (L['l02']['end'], 'storm'), (L['l03']['end'], 'grey'), (21.0, 'inside'),
         (RAIL, 'grey'), (L['l08']['end'], 'storm'), (RUN, 'insideNight'), (WAVE, 'storm'), (MORNING, 'calm'), (DOORWAY, 'insideNight'), (LOOP_ON, 'grey')]


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
mus = np.zeros((N, 2))
drone_e = env([(0, 0.7), (DOOR, 1.0), (RAIL - 0.02, 1.0), (RAIL, 1.3), (WAVE, 1.2), (MORNING - 0.02, 1.4), (MORNING, 0.3), (DOORWAY, 1.2), (LOOP_ON, 0.7), (DUR, 0.7)])
mus += st(hs.drone_mid(T, qf, drone_e) * 1.6)
str_e = env([(0, 0.5), (6.0, 0.7), (DOOR - 0.02, 0.8), (DOOR + 0.1, 1.1), (27.0, 0.9), (RAIL - 0.02, 1.0), (RAIL + 0.1, 1.5), (40.0, 1.1), (MORNING - 0.02, 1.4), (MORNING, 0.0), (DOORWAY - 0.3, 0.0), (DOORWAY + 0.1, 1.4), (LOOP_ON, 0.5), (DUR, 0.5)])
trem = env([(0, 0.3), (DOOR, 0.3), (DOOR + 0.5, 0.8), (RAIL, 1.0), (MORNING, 1.0), (MORNING + 0.1, 0.2), (DOORWAY, 0.9), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [220.0, 233.08, 329.63], str_e, trem, SR, seed=51) * 2.2)
mus += st(hs.strings(T, qf, [349.23, 466.16], env([(0, 0), (RAIL - 0.02, 0), (RAIL + 0.1, 1.2), (36.0, 0.3), (MORNING, 0), (DOORWAY, 0), (DOORWAY + 0.1, 1.0), (LOOP_ON - 0.4, 0), (DUR, 0)]), None, SR, seed=52))
for t0, rate, det, g in [(5.6, 0.42, 1.0, -3.5), (23.0, 0.5, 0.985, -3.0), (MORNING + 0.2, 0.66, 0.971, -2.0)]:
    place(mus, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0)), t0, g + 4)
for hit, freqs, d in [(DOOR, [220, 311.13, 466.16], 0.5), (RAIL, [233.08, 329.63, 493.88], 0.9), (DOORWAY, [220, 311.13, 415.3], 0.6)]:
    place(mus, hs.reverse_swell(SR, freqs, d, seed=int(hit)), hit - d)
place(mus, hs.stinger(SR, seed=61, size=0.7), DOOR)
place(mus, hs.stinger(SR, seed=62, size=1.2), RAIL)
place(mus, hs.stinger(SR, seed=63, size=1.0), DOORWAY)
place(mus, hs.heartbeat(SR, 21.2, 30.6, 58, 76, gain=0.8, seed=64), 21.2)
place(mus, hs.heartbeat(SR, 37.0, MORNING - 0.1, 72, 120, gain=1.0, seed=65), 37.0)
place(mus, hs.riser(SR, 2.4, seed=66), MORNING - 2.4)
place(mus, st(hs.metal_bow(SR, 5.0, 1180, seed=67)), 12.5)
place(mus, st(hs.metal_bow(SR, 4.0, 1460, seed=68)), MORNING + 0.3)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-5.5)
# the loop: frame 0 opens under the first line (music already ducked), so ease the tail toward that level
mus *= env([(0, 1), (LOOP_ON, 1), (DUR - 0.3, db(-2.6)), (DUR, db(-2.6))])[:, None]
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ the island
grey, night, storm, inside, inight, calm = zone('grey'), zone('night'), zone('storm'), zone('inside'), zone('insideNight'), zone('calm')
outdoor = grey + night + storm + calm
amb = np.zeros((N, 2))
gust = 0.6 + 0.4 * np.sin(2 * np.pi * qf(0.11) * T) * np.sin(2 * np.pi * qf(0.037) * T)
wind_level = grey * 0.03 + night * 0.025 + storm * 0.07 + calm * 0.012 + (inside + inight) * 0.012
wl = np.stack([filt(rng.standard_normal(N), SR, lo=250, hi=2600), filt(rng.standard_normal(N), SR, lo=250, hi=2600)], 1)
amb += wl * (wind_level * gust)[:, None]
# the sea: a slow swell of surf, louder in the storm, a soft wash in the calm
swell = 0.5 + 0.5 * np.sin(2 * np.pi * qf(0.16) * T) ** 2
sea_level = grey * 0.05 + night * 0.04 + storm * 0.1 + calm * 0.025 + (inside + inight) * 0.01
amb += st(filt(rng.standard_normal(N), SR, lo=120, hi=1600) * swell * sea_level)
# rain in the storm and in the doorway
amb += st(filt(rng.standard_normal(N), SR, lo=2500, hi=8000) * 0.02 * (storm + inight * 0.6))
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def thud(f0=70, dur=0.6, gain=0.6):
    tt = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * 9) + filt(rng.standard_normal(len(tt)), SR, lo=60, hi=900) * np.exp(-tt * 20) * 0.5) * gain


# oars and rowlocks in the hook (and the loop)
for t0 in list(np.arange(0.4, L['l01']['end'], 2.4)) + list(np.arange(LOOP_ON + 0.4, DUR, 2.4)):
    place(fx, verb(lib('wood_stress')[: int(0.5 * SR)], 0.4, 0.2, seed=91), t0, -16)
    place(fx, filt(rng.standard_normal(int(0.5 * SR)), SR, lo=300, hi=2500) * np.linspace(0.04, 0, int(0.5 * SR)), t0 + 0.3)
# the steamer's engine in the night
tt = np.arange(N) / SR
chug = (np.sin(2 * np.pi * 52 * tt) * 0.5 + filt(rng.standard_normal(N), SR, lo=60, hi=400) * 0.5) * (0.5 + 0.5 * (np.sin(2 * np.pi * 3.2 * tt) > 0.3)) * 0.04
amb_night = chug * night
place(fx, amb_night, 0)
# the door of the quarters: hinges, then inside one tick from the stopped clock, then nothing
place(fx, lib('heavy_hinge'), DOOR - 0.15, -8)
n = int(0.04 * SR)
tk = np.arange(n) / SR
place(fx, verb(np.sin(2 * np.pi * 3100 * tk) * np.exp(-tk * 180) * 0.06, 0.4, 0.25, seed=92), 21.15, -2)
# oilskin rustle; a mug set down
place(fx, filt(rng.standard_normal(int(0.6 * SR)), SR, lo=800, hi=5000) * np.sin(np.linspace(0, np.pi, int(0.6 * SR))) * 0.03, 23.2)
# the railings: iron groaning in the wind
place(fx, lib('cable_tension'), RAIL + 0.3, -8)
place(fx, lib('low_cinematic_hit'), RAIL, -6)
# the storm: thunder on the lightning flashes, breakers on the cliff
for ft in [38.6, 42.3, 44.9, 49.6]:
    place(fx, verb(filt(rng.standard_normal(int(2.5 * SR)), SR, lo=40, hi=500) * np.exp(-np.arange(int(2.5 * SR)) / SR * 1.6) * 0.12, 2.0, 0.4, seed=int(ft)), ft + 0.4)
for bt in [38.0, 40.0, 42.0]:
    place(fx, thud(55, 1.2, 0.35), bt)
# the third man: chair scrape, the door flung open, running steps away
place(fx, filt(rng.standard_normal(int(0.4 * SR)), SR, lo=300, hi=2000) * np.linspace(0.05, 0, int(0.4 * SR)), RUN - 0.2)
place(fx, lib('heavy_hinge'), RUN + 0.2, -6)
for i in range(6):
    place(fx, thud(110, 0.15, 0.15), RUN + 0.5 + i * 0.22)
# the wave: a roar building, then dead silence into the morning
tw = np.arange(int((MORNING - WAVE) * SR)) / SR
roar = filt(rng.standard_normal(len(tw)), SR, lo=60, hi=3000) * (tw / tw[-1]) ** 2 * 0.25
place(fx, st(roar), WAVE)
place(fx, lib('restrained_boom'), MORNING - 0.25, -6)
# the doorway at night: rain on the threshold, the lantern's creak far off (with the two frames)
place(fx, lib('low_cinematic_hit'), DOORWAY, -6)
place(fx, filt(lib('heartbeat_breath'), SR, hi=1200), DOORWAY + 1.0, -14)
place(fx, verb(lib('steel_latch')[: int(0.6 * SR)] * 0.5, 1.2, 0.5, seed=93), SUB, -14)
write(OUT / 'stem-foley-fx.wav', fx)
tvb = np.zeros((N, 2))  # no television in this episode (the mix code below is shared with Episodes 7-8)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep09-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep09TheLighthouseThatWentDark',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator', 'credits': '891 per take, 2 takes; take 1 used',
                       'prompt': 'docs/production/ep09-lighthouse/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): A2/E3 mid-band drone; tremolo string clusters (A3-Bb3-E4, +F4/Bb4 on the scares); music-box theme clean, detuned and slow-and-flat; reversed swells into the three stingers; heartbeat 58-76 and 72-120 bpm; a riser into the wave; bowed metal',
        'island: wind (gusting) and sea swell scaled with each shot, rain in the storm, the night steamer engine, thunder on the lightning, breakers',
        'foley: oars and rowlocks, the quarters door, one tick of the stopped clock and then nothing, oilskin rustle, the railings groaning, a chair scrape, the door flung open, running steps, the wave roar cutting dead to the morning, the lantern creak',
        'loop: drone, strings and wind snapped to whole cycles; the hook and the end are the same grey sea, wind and oars',
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
