"""Episode 8 "Room Zero" sound, to the horror standard (Episode 6).

- Narrator: the ElevenLabs fiction-voice take (scripts/ep08_voice.py), close, a dark small room.
- Score (scripts/horror_score.py): mid-band drone, tremolo string clusters, the detuned
  music-box theme, reversed swells and stingers in silence (the thermal reveal, the figure
  behind the wall, the door), a heartbeat, a riser into the knocks, bowed metal. The music
  drops out for the knocks and the answer.
- The house and the camera: cold room tone, wind outside, creaks; the thermal camera's
  sensor hiss and a beep each time it comes up (the hook and the loop both start on it).
- Foley: van and front door, footsteps on the stairs, clipboard, tape measure, three knocks,
  two answering knocks through the wall with plaster dust, a breath behind it, pen on paper,
  the van leaving, a phone message tone and shutter clicks.
Ducks 7 dB under speech; presence in the phone band; -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep08_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep08-room-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep08-room-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(8008)
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



# key times: must match K in src/horror/ep08/Episode08.tsx
REVEAL, FIGURE, DOOR = 24.75, 41.5, 54.0
KNOCKS = [37.4, 37.65, 37.9]
ANSWER = [38.25, 38.6]
LOOP_ON = DUR - 1.6
STINGERS = [REVEAL, FIGURE, DOOR]
# the shot modes, in order (Episode08 SHOTS)
SHOTS = [(0, 'thermal'), (L['l02']['start'] - 0.6, 'day'), (8.3, 'thermal'), (L['l03']['start'] - 0.5, 'cold'), (REVEAL, 'thermal'),
         (L['l06']['start'] - 0.8, 'day'), (L['l07']['start'] - 0.6, 'cold'), (L['l08']['start'], 'thermal'), (L['l09']['start'], 'day'),
         (L['l10']['start'], 'evening'), (L['l11']['start'], 'photo'), (LOOP_ON, 'thermal')]


def zone(*names):
    pts = []
    for i, (t0, m) in enumerate(SHOTS):
        t1 = SHOTS[i + 1][0] if i + 1 < len(SHOTS) else DUR
        v = 1.0 if m in names else 0.0
        pts += [(t0, v), (t1 - 0.01, v)]
    return env(pts)


OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice: close, a dark small room
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v = filt(v, SR, lo=70)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = np.tanh(v * 1.4) / 1.4
    v = verb(v, 1.2, 0.10, seed=10, bright=3500)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
drone_e = env([(0, 0.7), (REVEAL - 0.02, 0.9), (REVEAL, 1.2), (36.0, 1.0), (KNOCKS[0] - 0.3, 0.25), (ANSWER[-1] + 0.4, 0.25), (39.4, 1.1), (FIGURE, 1.4), (43.5, 0.8), (DOOR, 1.2), (LOOP_ON, 0.7), (DUR, 0.7)])
mus += st(hs.drone_mid(T, qf, drone_e) * 1.6)
str_e = env([(0, 0.5), (8.0, 0.6), (REVEAL - 0.02, 0.8), (REVEAL + 0.1, 1.3), (30.0, 0.8), (36.0, 1.0), (KNOCKS[0] - 0.3, 0.0), (ANSWER[-1] + 0.5, 0.0), (39.6, 1.0), (FIGURE - 0.02, 1.3), (FIGURE + 0.1, 1.6), (44.0, 0.6), (DOOR, 1.4), (LOOP_ON, 0.5), (DUR, 0.5)])
trem = env([(0, 0.3), (REVEAL, 0.3), (REVEAL + 0.4, 0.9), (31.0, 0.5), (36.0, 1.0), (FIGURE + 2, 1.0), (44.0, 0.3), (DOOR, 0.9), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [220.0, 233.08, 329.63], str_e, trem, SR, seed=31) * 2.2)
mus += st(hs.strings(T, qf, [349.23, 466.16], env([(0, 0), (FIGURE - 0.02, 0), (FIGURE + 0.1, 1.2), (44.0, 0), (DOOR, 0), (DOOR + 0.1, 1.0), (LOOP_ON - 0.4, 0), (DUR, 0)]), None, SR, seed=32))
for t0, rate, det, g in [(5.4, 0.42, 1.0, -3.5), (30.4, 0.5, 0.985, -3.0), (46.9, 0.66, 0.971, -2.0)]:
    place(mus, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0)), t0, g + 4)
for hit, freqs, d in [(REVEAL, [220, 311.13, 466.16], 0.6), (FIGURE, [233.08, 329.63, 493.88], 1.2), (DOOR, [220, 311.13, 415.3], 0.45)]:
    place(mus, hs.reverse_swell(SR, freqs, d, seed=int(hit)), hit - d)
place(mus, hs.stinger(SR, seed=41, size=0.8), REVEAL)
place(mus, hs.stinger(SR, seed=42, size=1.3), FIGURE)
place(mus, hs.stinger(SR, seed=43, size=0.9), DOOR)
place(mus, hs.heartbeat(SR, 25.5, 36.8, 60, 84, gain=0.8, seed=44), 25.5)
place(mus, hs.heartbeat(SR, 39.0, FIGURE + 1.4, 74, 118, gain=1.0, seed=45), 39.0)
place(mus, hs.riser(SR, 2.2, seed=46), KNOCKS[0] - 2.2)
place(mus, st(hs.metal_bow(SR, 5.0, 1180, seed=47)), 12.0)
place(mus, st(hs.metal_bow(SR, 4.0, 1460, seed=48)), DOOR + 0.4)
# dead air for the knocks and the answer
mus *= env([(0, 1), (KNOCKS[0] - 0.25, 1), (KNOCKS[0] - 0.05, 0.05), (ANSWER[-1] + 0.5, 0.05), (39.2, 1), (DUR, 1)])[:, None]
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-5.5)
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ places
thermal, cold, day, evening, photo = zone('thermal'), zone('cold'), zone('day'), zone('evening'), zone('photo')
amb = np.zeros((N, 2))
# the empty house: a low cold room tone, inside and in the thermal shots
amb += st(filt(rng.standard_normal(N), SR, lo=60, hi=350) * 0.012 * (thermal + cold))
# the thermal camera: a faint sensor hiss and a high electronic whine (continuous through the loop)
amb += st((filt(rng.standard_normal(N), SR, lo=3000, hi=7000) * 0.5 + np.sin(2 * np.pi * qf(5900) * T) * 0.1) * 0.012 * thermal)
# outside: wind, gusting; a little traffic far off in the evening
gust = 0.6 + 0.4 * np.sin(2 * np.pi * qf(0.15) * T)
amb += np.stack([filt(rng.standard_normal(N), SR, lo=200, hi=2400), filt(rng.standard_normal(N), SR, lo=200, hi=2400)], 1) * (0.028 * gust * (day + evening * 0.5))[:, None]
amb += st(filt(rng.standard_normal(N), SR, lo=100, hi=700) * 0.01 * evening)
amb += st(filt(rng.standard_normal(N), SR, lo=80, hi=500) * 0.008 * photo)
write(OUT / 'stem-ambience.wav', amb)

# ------------------------------------------------------------------ foley
fx = np.zeros((N, 2))


def beep(f=2600, dur=0.07):
    tt = np.arange(int(dur * SR)) / SR
    return fade(np.sin(2 * np.pi * f * tt) * 0.03, min(0.004, dur / 3), min(0.01, dur / 3))


def knock(depth=1.0, muffled=False):
    n = int(1.0 * SR)
    tt = np.arange(n) / SR
    f0 = 140 / depth
    k = np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * 28) * 0.7 + filt(rng.standard_normal(n), SR, lo=200, hi=3000 if not muffled else 900) * np.exp(-tt * 70) * 0.5
    k += sum(np.sin(2 * np.pi * f * tt) * a for f, a in [(310 / depth, 0.15), (520 / depth, 0.08)]) * np.exp(-tt * 12)
    if muffled:
        k = filt(k, SR, hi=700)
    return verb(k, 0.8 if not muffled else 1.4, 0.25, seed=int(f0))


# the camera comes up: a beep each time
for t0 in [0.05, 8.35, REVEAL + 0.05, L['l08']['start'] + 0.05, LOOP_ON + 0.05]:
    place(fx, beep(), t0, -2)
place(fx, beep(3200), 8.45, -4)
# the van door, the front door
place(fx, lib('heavy_hinge'), 5.2, -12)
place(fx, lib('heavy_hinge'), L['l03']['start'] - 0.4, -14)
# footsteps on the stairs (wood under carpet), climbing
for i in range(9):
    place(fx, knock(1.9, muffled=True) * 0.25, L['l04']['start'] - 0.4 + i * 0.36, -8)
# the clipboard
place(fx, lib('paper_light_turn'), 21.25, -10)
# creaks in the empty house
place(fx, lib('wood_stress'), 15.0, -14)
place(fx, lib('wood_stress'), 33.6, -16)
# the tape measure: out, then back (a ratchet of clicks)
for i in range(30):
    place(fx, beep(5200 + (i % 3) * 300, 0.006) * 0.6, 30.45 + i * 0.08, -6)
place(fx, filt(rng.standard_normal(int(0.4 * SR)), SR, lo=2000, hi=7000) * np.linspace(0.04, 0, int(0.4 * SR)), 32.95)
# three knuckle knocks on plaster; two answers through the wall, deeper; dust; a breath
for k in KNOCKS:
    place(fx, knock(1.0), k, -3)
for k in ANSWER:
    place(fx, knock(1.8, muffled=True), k, 2)
    place(fx, lib('low_cinematic_hit'), k, -10)
place(fx, filt(rng.standard_normal(int(1.0 * SR)), SR, lo=3000, hi=8000) * np.linspace(0.02, 0, int(1.0 * SR)) * (rng.random(int(1.0 * SR)) > 0.97), ANSWER[0] + 0.1)
place(fx, filt(lib('heartbeat_breath'), SR, hi=900), ANSWER[-1] + 0.5, -10)
place(fx, lib('restrained_boom'), FIGURE, -8)
for k in STINGERS:
    place(fx, lib('low_cinematic_hit'), k, -6)
# pen on the report
place(fx, lib('pencil_marks'), 43.2, -10)
# the van starts and pulls away
tt = np.arange(int(3.0 * SR)) / SR
eng = (np.sin(2 * np.pi * (48 + 20 * tt / 3) * tt) * 0.5 + filt(rng.standard_normal(len(tt)), SR, lo=60, hi=500) * 0.4) * np.minimum(1, tt / 0.3) * np.linspace(1, 0.2, len(tt)) * 0.06
place(fx, eng, 45.2)
# the phone: a message tone, then a shutter click for each photo
place(fx, plus(beep(1318, 0.12), np.pad(beep(1760, 0.16), (int(0.13 * SR), 0))), 48.7, -2)
for t0 in [L['l11']['start'] - 0.05, DOOR + 0.02]:
    place(fx, filt(rng.standard_normal(int(0.05 * SR)), SR, lo=1500, hi=7000) * np.exp(-np.arange(int(0.05 * SR)) / SR * 80) * 0.15, t0, -4)
write(OUT / 'stem-foley-fx.wav', fx)
tvb = np.zeros((N, 2))  # no television in this episode (kept so the mix code below is shared with Episode 7)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep08-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep08RoomZero',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'tZssYepgGaQmegsMEXjK', 'voice_name': 'True - Crime & Horror Narrator', 'credits': 961,
                       'prompt': 'docs/production/ep08-room/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): A2/E3 mid-band drone; tremolo string clusters (A3-Bb3-E4, +F4/Bb4 on the scares); music-box theme (A C B D# E . A G#) clean, detuned and slow-and-flat; reversed swells into the three stingers; heartbeat 60-84 and 74-118 bpm; a riser into the knocks; bowed metal',
        'house: cold room tone, wind outside, wood creaks; the thermal camera: sensor hiss and a beep each time it comes up',
        'foley: van door, footsteps on the stairs, clipboard, tape measure out and back, three knuckle knocks, two answering knocks (deeper, through the wall) with plaster dust, a breath behind the wall, pen on paper, the van pulling away, a phone message tone, two phone shutter clicks',
        'silence: dead air between the knocks and the answer; the music drops away for the knocks',
        'loop: drone, strings, wind and the camera hiss snapped to whole cycles; the hook and the end are both the thermal camera in the hallway',
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
