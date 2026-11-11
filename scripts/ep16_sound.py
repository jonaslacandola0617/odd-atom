"""Episode 16 "Ward Three" sound, to the Season 2 horror standard.

- Narrator: the ElevenLabs Taglish take (Juanito, scripts/ep16_voice.py), close and dry.
- The hospital: a draught moaning through broken windows, dripping water, whispers on empty floors,
  a far scream; outside, crickets, the city's hum to the south and far dogs.
- The legend: a wheelchair turning (also across the loop seam); seven pebbles clicking on the tile;
  the camcorder's tape and motor, breathing, the camera swinging away and back; held silence; ONE
  stinger in silence when she lifts her head, the camcorder overloading; the tape tearing.
- After: running through the grass, the car door, the engine and road; brakes; a breath behind.
Ducks 7 dB under speech; presence in the phone band; -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep16_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep16-ward-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep16-ward-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(16016)
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



# key times: must match K in src/horror/ep16/Episode16.tsx
PEB0 = L['l05']['start'] - 0.1
PEBBLES = [PEB0 + d for d in [0, 0.9, 1.5, 2.6, 3.1, 3.9, 4.6]]
BEHIND = L['l05']['start'] + 4.2
SUB = L['l05']['end'] + 0.25
VF = L['l07']['start'] - 0.3
AWAY1 = L['l08']['start'] - 0.3
BACK1 = L['l08']['start'] + 0.8
AWAY2 = L['l08']['end'] - 0.3
BACK2 = L['l08']['end'] + 0.5
REVEAL = L['l08']['end'] + 1.55
TEAR = L['l08']['end'] + 2.3
RUN = L['l08']['end'] + 2.65
CROSS = L['l09']['start'] + 3.3
BACKSEAT = L['l10']['start'] - 0.3
LOOP_ON = DUR - 1.6
STINGERS = [REVEAL]
B_T = L['l01']['end'] + 0.3
C_T = L['l03']['start'] - 0.3
D_T = L['l04']['start'] - 0.3
F_T = L['l05']['end'] + 0.3


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


ext = np.minimum(1, span(B_T, D_T) + span(F_T, VF) + span(RUN, CROSS))
vf = span(VF, TEAR, 0.01)
tear = span(TEAR, RUN, 0.01)
car = span(CROSS, LOOP_ON, 0.02)
inside = np.clip(1 - ext - vf - tear - car, 0, 1)
# the held silence before she lifts her head
hush = env([(0, 1), (L['l08']['end'] + 0.2, 1), (L['l08']['end'] + 0.45, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1), (DUR, 1)])

OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v = filt(v, SR, lo=70)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = np.tanh(v * 1.4) / 1.4
    v = verb(v, 1.0, 0.07, seed=16, bright=3500)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
drone_e = env([(0, 0.75), (D_T, 0.85), (PEB0, 1.0), (VF, 1.0), (AWAY1, 1.2), (L['l08']['end'] + 0.3, 1.2), (L['l08']['end'] + 0.45, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1.6),
                (RUN, 1.2), (CROSS, 0.9), (BACKSEAT, 1.1), (LOOP_ON, 0.75), (DUR, 0.75)])
mus += st(hs.drone_mid(T, qf, drone_e, root=77.78) * 1.6)
str_e = env([(0, 0.5), (D_T, 0.6), (PEB0, 0.85), (VF, 0.9), (AWAY1, 1.2), (L['l08']['end'] + 0.3, 1.2), (L['l08']['end'] + 0.45, 0.0), (REVEAL - 0.02, 0.0), (REVEAL + 0.1, 1.6),
             (RUN + 1, 1.0), (CROSS, 0.7), (BACKSEAT, 1.0), (LOOP_ON, 0.5), (DUR, 0.5)])
trem = env([(0, 0.3), (PEB0, 0.6), (AWAY1, 1.0), (REVEAL, 1.0), (CROSS, 0.5), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [155.56, 164.81, 233.08], str_e, trem, SR, seed=701) * 2.2)
mus += st(hs.strings(T, qf, [246.94, 349.23], env([(0, 0), (REVEAL - 0.02, 0), (REVEAL + 0.1, 1.2), (RUN + 2, 0.6), (CROSS, 0.2), (BACKSEAT, 0.7), (LOOP_ON, 0), (DUR, 0)]), None, SR, seed=702))
for t0, rate, det, g in [(L['l02']['end'] + 0.05, 0.5, 0.982, -3.5), (BACKSEAT + 0.1, 0.6, 0.96, -3.0)]:
    place(mus, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0)), t0, g + 4)
place(mus, hs.reverse_swell(SR, [155.56, 233.08, 329.63], 0.5, seed=711), REVEAL - 0.5)
place(mus, hs.stinger(SR, seed=712, size=1.3), REVEAL)
place(mus, hs.heartbeat(SR, VF, L['l08']['end'] + 0.4, 64, 120, gain=0.95, seed=713), VF)
place(mus, hs.riser(SR, 1.4, seed=714), L['l08']['start'] - 1.3)
place(mus, st(hs.metal_bow(SR, 3.5, 1120, seed=715)), BACKSEAT - 0.2)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-3.2)
mus *= hush[:, None]
mus *= (1 - tear * 0.85)[:, None]
mus *= env([(0, 1), (LOOP_ON, 1), (DUR - 0.3, db(1.5)), (DUR, db(1.5))])[:, None]
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ the hospital, the grass, the road
amb = np.zeros((N, 2))
gust = 0.55 + 0.45 * np.sin(2 * np.pi * qf(0.1) * T) * np.sin(2 * np.pi * qf(0.033) * T)
air = np.stack([filt(rng.standard_normal(N), SR, lo=250, hi=2600), filt(rng.standard_normal(N), SR, lo=250, hi=2600)], 1)
amb += air * ((0.006 * inside + 0.005 * vf + 0.012 * ext) * gust * hush)[:, None]
# a draught moaning through broken windows, inside
moan = np.sin(2 * np.pi * qf(196) * T + 0.9 * np.sin(2 * np.pi * qf(0.17) * T)) * (0.4 + 0.6 * gust)
amb += st(filt(moan, SR, lo=120, hi=700) * 0.004 * (inside + vf) * hush)
crick = np.zeros(N)
for f, rate, ph, g in [(4200, 0.75, 0.0, 1.0), (4800, 0.5, 2.0, 0.7)]:
    train = (np.sin(2 * np.pi * qf(rate) * T + ph) > 0.65).astype(float)
    pulse = (np.sin(2 * np.pi * qf(27.0) * T + ph) > 0.2).astype(float)
    crick += np.sin(2 * np.pi * qf(f) * T) * train * pulse * g
amb += st(filt(crick, SR, lo=2500, hi=7500) * 0.007 * (ext + 0.3 * inside + 0.4 * car) * hush)
# the city's hum to the south (Angeles), far traffic
city = filt(rng.standard_normal(N), SR, lo=80, hi=500) * (0.7 + 0.3 * np.sin(2 * np.pi * qf(0.05) * T))
amb += st(city * 0.006 * (ext + 0.5 * car))
# water dripping inside
for t0 in np.arange(0.3, DUR, 1.37):
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    place(amb, st(np.sin(2 * np.pi * (1800 - 6000 * tt) * tt) * np.exp(-tt * 70) * 0.012 * float(np.interp(t0, T, inside + vf))), t0)
# far dogs barking in the exterior shots
for t0 in [B_T + 1.2, B_T + 1.6, F_T + 2.2, RUN + 1.0]:
    n = int(0.18 * SR)
    tt = np.arange(n) / SR
    bark = filt(np.sin(2 * np.pi * (420 + 300 * np.exp(-tt * 20)) * tt) * (1 + 0.5 * np.sign(np.sin(2 * np.pi * 90 * tt))) * np.exp(-tt * 14), SR, lo=300, hi=2500)
    place(amb, verb(bark * 0.012, 2.0, 0.6, seed=int(t0 * 10), bright=2000), t0)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))

# ------------------------------------------------------------------ the wheelchair turning (in the hook, and again across the loop)
for k in range(6):
    u = -1.0 + k * 1.05
    at = u if u >= 0 else DUR + u
    sq = lib('wheel_roll')
    n = int(0.5 * SR)
    tt = np.arange(n) / SR
    squeak = np.sin(2 * np.pi * (1300 + 300 * np.sin(np.pi * tt / 0.5)) * tt) * np.sin(np.pi * tt / 0.5) ** 2 * 0.012
    clip = verb(squeak, 1.6, 0.4, seed=800 + k, bright=4000)
    place(fx, clip, at)
    place(fx, sq[: int(0.5 * SR)], at, -22)

# ------------------------------------------------------------------ voices and a scream
for k, t0 in enumerate(np.arange(D_T + 0.3, L['l04']['end'] + 0.6, 1.9)):
    n = int(1.2 * SR)
    tt = np.arange(n) / SR
    wh = filt(rng.standard_normal(n), SR, lo=1500, hi=5000) * (0.5 + 0.5 * np.sin(2 * np.pi * (4 + k) * tt)) * np.sin(np.pi * tt / 1.2)
    place(fx, verb(wh * 0.006, 2.4, 0.6, seed=820 + k, bright=4000), t0)
n = int(1.3 * SR)
tt = np.arange(n) / SR
scream = sum(np.sin(2 * np.pi * k * (900 + 250 * np.sin(np.pi * tt / 1.3)) * tt) / k for k in range(1, 5)) * np.sin(np.pi * tt / 1.3) ** 0.7
place(fx, verb(filt(scream, SR, lo=600, hi=3500) * 0.006, 3.0, 0.8, seed=830, bright=2500), L['l04']['end'] + 0.02)

# ------------------------------------------------------------------ pebbles on the tile: seven thrown
for k, t0 in enumerate(PEBBLES):
    for j, (dt, g) in enumerate([(0, 1.0), (0.09, 0.45), (0.15, 0.2)]):
        n = int(0.025 * SR)
        tt = np.arange(n) / SR
        click = filt(rng.standard_normal(n), SR, lo=2000, hi=9000) * np.exp(-tt * 260) * 0.09 * g
        place(fx, verb(click, 1.4, 0.35, seed=840 + k * 3 + j, bright=6000), t0 + dt)
# the flashlight swings: cloth and a breath
place(fx, lib('perspective_whip'), BEHIND - 0.1, -16)

# ------------------------------------------------------------------ outside: the hunters; the camcorder
place(fx, lib('tape_reel_start'), VF - 0.25, -14)
motor = filt(np.sin(2 * np.pi * qf(960) * T) + 0.3 * rng.standard_normal(N), SR, lo=600, hi=5000)
fx += st(motor * 0.0018 * vf * hush)
for k in range(4):
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    br = filt(rng.standard_normal(n), SR, lo=300, hi=2500) * np.sin(np.pi * tt / 0.6) ** 2 * 0.012
    place(fx, st(br), VF + 0.4 + k * 1.3)
for t0 in [AWAY1, BACK1, AWAY2, BACK2]:
    place(fx, lib('perspective_whip'), t0 - 0.05, -20)
# the reveal: a low hit, the camcorder's audio overloading
place(fx, lib('low_cinematic_hit'), REVEAL, -5)
n = int(0.7 * SR)
tt = np.arange(n) / SR
place(fx, st(np.tanh(filt(rng.standard_normal(n), SR, lo=800, hi=5000) * 6) * np.sin(np.pi * tt / 0.7) * 0.02), REVEAL + 0.2)
# the tape tears
place(fx, lib('lost_signal'), TEAR, -6)
n = int(0.35 * SR)
tt = np.arange(n) / SR
warble = np.sin(2 * np.pi * (900 + 600 * np.sin(2 * np.pi * 13 * tt)) * tt) * 0.5 + rng.standard_normal(n)
place(fx, st(filt(warble, SR, lo=300, hi=7000) * np.exp(-tt * 3) * 0.06), TEAR)
# running through the grass, panting, the car door, the engine
for k, t0 in enumerate(np.arange(RUN + 0.1, CROSS - 0.7, 0.24)):
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    place(fx, st(filt(rng.standard_normal(n), SR, lo=900, hi=6000) * np.exp(-tt * 22) * 0.03), t0 + rng.random() * 0.05)
place(fx, lib('steel_latch'), CROSS - 0.6, -10)
eng = filt(np.sin(2 * np.pi * qf(45) * T) + 0.5 * np.sin(2 * np.pi * qf(90) * T) + 0.3 * rng.standard_normal(N), SR, lo=50, hi=900)
road = filt(rng.standard_normal(N), SR, lo=100, hi=1200)
fx += st((eng * 0.012 + road * 0.008 * env([(0, 0), (CROSS, 0), (CROSS + 1, 1), (BACKSEAT - 0.6, 1), (BACKSEAT, 0), (DUR, 0)])) * car)
# brakes as the car stops, then a breath from the back seat
n = int(0.6 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(np.sin(2 * np.pi * 2600 * tt) * (1 + 0.4 * rng.standard_normal(n)), SR, lo=1500, hi=5000) * np.sin(np.pi * tt / 0.6) * 0.008), BACKSEAT - 0.7)
n = int(0.9 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=300, hi=2200) * np.sin(np.pi * tt / 0.9) ** 2 * 0.02), L['l10']['end'] + 0.0)
# the subliminal: a swell and a whip, between lines
place(fx, hs.reverse_swell(SR, [233.08, 349.23], 0.3, seed=851) * 0.8, SUB - 0.3)
place(fx, lib('perspective_whip'), SUB, -10)
write(OUT / 'stem-foley-fx.wav', fx)
tvb = np.zeros((N, 2))
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
take = ROOT / 'public/assets/audio/eleven-takes/ep16-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep16WardThree',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep16-ward/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep16-ward/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): D#2/A#2 mid-band drone; tremolo string clusters; the music-box theme detuned; a heartbeat 64-120 bpm through the viewfinder; a riser into "Huwag mong aalisin"; one stinger in silence (she lifts her head); bowed metal for the back seat',
        'the hospital: draught moan, drips, whispers on empty floors, a far scream; outside: crickets, the city hum, far dogs',
        'the legend: wheelchair squeaks (across the loop seam), seven pebble clicks with bounces, the camcorder motor, breathing, the camcorder overloading, a tape warble; running in grass, engine and road, brakes, a breath from the back seat',
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
