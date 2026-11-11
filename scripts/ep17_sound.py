"""Episode 17 "The Road That Wouldn't End" sound, to the Season 2 horror standard.

- Narrator: the ElevenLabs Taglish take (Juanito, scripts/ep17_voice.py), close and dry.
- The road: a tricycle's two-stroke engine (continuous across the loop seam), the store's tinny
  radio playing the same few bars on every pass, wind in the bamboo leaves, bamboo creaking, crickets
  and frogs, rain under a clear moon.
- The stop: the engine idles and is cut; the night drops out; a deep breath in the bamboo, like a
  horse's; the handlebar turns; ONE stinger in silence when the beam finds it, and a deep, low laugh.
- After: the shirt pulled off and turned inside out; dawn with a rooster and birds.
Ducks 7 dB under speech; presence in the phone band; -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep17_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep17-road-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep17-road-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(17017)
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



# key times: must match K in src/horror/ep17/Episode17.tsx
SUB = L['l04']['end'] + 0.3
RAIN = L['l06']['start'] - 0.3
STOP = L['l08']['start'] - 0.3
BREATH = L['l08']['end'] + 0.5
REVEAL = L['l08']['end'] + 1.5
SHIRT = L['l09']['start'] - 0.25
BLACK = L['l09']['end'] + 0.1
DAWN = L['l10']['start'] - 0.3
LOOP_ON = DUR - 1.6
STINGERS = [REVEAL]
E1 = L['l05']['start'] - 0.3
E2 = L['l05']['start'] + 2.7
# the store passes: when the tricycle is level with the store (z = -20)
PASSES = [3.8, E1 + 14 / 6, E2 + 14 / 7.5]


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


dawn = span(DAWN, LOOP_ON, 0.02)
black = span(BLACK, DAWN, 0.01)
night = np.clip(1 - dawn - black, 0, 1)
stopped = span(STOP + 1.4, BLACK)
# the held silence: after the engine is cut, the night drops out until the beam finds it
hush = env([(0, 1), (STOP + 1.6, 1), (STOP + 2.0, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1), (DUR, 1)])

OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v = filt(v, SR, lo=70)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = np.tanh(v * 1.4) / 1.4
    v = verb(v, 1.0, 0.07, seed=17, bright=3500)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
drone_e = env([(0, 0.75), (E1, 0.9), (RAIN, 1.0), (STOP, 1.15), (STOP + 1.8, 1.1), (STOP + 2.0, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1.6),
                (SHIRT + 2, 1.0), (BLACK, 0.6), (DAWN, 0.45), (DAWN + 1, 0.5), (LOOP_ON, 0.75), (DUR, 0.75)])
mus += st(hs.drone_mid(T, qf, drone_e, root=69.30) * 1.6)
str_e = env([(0, 0.5), (E1, 0.75), (E2, 0.95), (RAIN, 0.9), (STOP, 1.15), (STOP + 1.8, 1.1), (STOP + 2.0, 0.0), (REVEAL - 0.02, 0.0), (REVEAL + 0.1, 1.6),
             (SHIRT + 2, 1.0), (BLACK, 0.5), (DAWN + 1, 0.35), (LOOP_ON, 0.5), (DUR, 0.5)])
trem = env([(0, 0.3), (E1, 0.6), (E2, 0.9), (REVEAL, 1.0), (DAWN, 0.2), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [138.59, 146.83, 207.65], str_e, trem, SR, seed=801) * 2.2)
mus += st(hs.strings(T, qf, [220.0, 311.13], env([(0, 0), (REVEAL - 0.02, 0), (REVEAL + 0.1, 1.2), (BLACK, 0.4), (DAWN, 0), (DUR, 0)]), None, SR, seed=802))
for t0, rate, det, g in [(L['l02']['end'] + 0.05, 0.5, 0.982, -3.5), (DAWN + 0.4, 0.62, 0.965, -3.0)]:
    place(mus, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0)), t0, g + 4)
place(mus, hs.reverse_swell(SR, [138.59, 207.65, 293.66], 0.5, seed=811), REVEAL - 0.5)
place(mus, hs.stinger(SR, seed=812, size=1.3), REVEAL)
place(mus, hs.heartbeat(SR, RAIN, STOP + 1.8, 62, 116, gain=0.95, seed=813), RAIN)
place(mus, hs.riser(SR, 1.4, seed=814), STOP - 1.2)
place(mus, st(hs.metal_bow(SR, 4.0, 980, seed=815)), DAWN + 0.2)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-3.2)
mus *= hush[:, None]
mus *= (1 - black * 0.6)[:, None]
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ the barrio road at night
amb = np.zeros((N, 2))
gust = 0.55 + 0.45 * np.sin(2 * np.pi * qf(0.12) * T) * np.sin(2 * np.pi * qf(0.041) * T)
leaves = np.stack([filt(rng.standard_normal(N), SR, lo=1200, hi=6000), filt(rng.standard_normal(N), SR, lo=1200, hi=6000)], 1)
amb += leaves * ((0.008 * night + 0.006 * dawn) * gust * hush)[:, None]
crick = np.zeros(N)
for f, rate, ph, g in [(4300, 0.8, 0.0, 1.0), (4900, 0.5, 2.0, 0.7), (3800, 0.66, 4.1, 0.6)]:
    train = (np.sin(2 * np.pi * qf(rate) * T + ph) > 0.6).astype(float)
    pulse = (np.sin(2 * np.pi * qf(28.0) * T + ph) > 0.2).astype(float)
    crick += np.sin(2 * np.pi * qf(f) * T) * train * pulse * g
frog = np.zeros(N)
for f, rate, ph in [(540, 1.2, 0.3), (630, 0.85, 2.2)]:
    gate = (np.sin(2 * np.pi * qf(rate) * T + ph) > 0.85).astype(float)
    frog += np.sign(np.sin(2 * np.pi * qf(f / 8) * T)) * np.sin(2 * np.pi * qf(f) * T) * gate
amb += st(filt(crick, SR, lo=2500, hi=7500) * 0.007 * night * hush)
amb += st(filt(frog, SR, lo=250, hi=1800) * 0.004 * night * hush)
# rain under a clear moon
rain_e = env([(0, 0), (RAIN, 0), (RAIN + 2, 1), (STOP + 0.4, 1), (STOP + 1.2, 0), (DUR, 0)])
rainn = np.stack([filt(rng.standard_normal(N), SR, lo=1500, hi=9000), filt(rng.standard_normal(N), SR, lo=1500, hi=9000)], 1)
amb += rainn * (0.016 * rain_e)[:, None]
# bamboo creaking, slow wooden groans
for k, t0 in enumerate([L['l02']['end'] + 0.2, L['l03']['start'] + 2.0, L['l03']['end'] + 0.1, L['l07']['end'] + 0.2, STOP + 2.3, STOP + 3.0]):
    n = int(0.7 * SR)
    tt = np.arange(n) / SR
    f = 180 + 60 * np.sin(np.pi * tt / 0.7)
    cr = np.sin(2 * np.pi * np.cumsum(f) / SR) * (np.sin(2 * np.pi * 26 * tt) > 0.3) * np.sin(np.pi * tt / 0.7)
    place(amb, verb(filt(cr, SR, lo=150, hi=1800) * 0.012, 1.6, 0.4, seed=860 + k, bright=2000), t0)
# dawn: a rooster and birds
for t0 in np.arange(DAWN + 0.3, LOOP_ON - 0.3, 0.6):
    n = int(0.07 * SR)
    tt = np.arange(n) / SR
    f = 3400 + 1500 * np.sin(np.pi * tt / 0.07)
    place(amb, st(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.07) * 0.010), t0 + rng.random() * 0.3)
segs = [(0.18, 700, 900), (0.16, 900, 1050), (0.55, 1050, 820)]
xs = []
for d, f0, f1 in segs:
    n = int(d * SR)
    tt = np.arange(n) / SR
    f = np.linspace(f0, f1, n) * (1 + 0.02 * np.sin(2 * np.pi * 30 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    xs.append(sum(np.sin(k * ph) / k for k in range(1, 6)) * np.sin(np.pi * tt / d) ** 0.5)
place(amb, verb(filt(np.concatenate(xs), SR, lo=500, hi=4500) * 0.035, 1.5, 0.3, seed=899, bright=4000), DAWN + 0.05)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))

# ------------------------------------------------------------------ the tricycle's two-stroke engine (continuous across the loop seam)
def two_stroke(rate):
    ph = 2 * np.pi * qf(rate) * T
    pulses = (0.5 + 0.5 * np.sin(ph)) ** 10
    buzz = filt(rng.standard_normal(N), SR, lo=900, hi=4000) * pulses * 0.35
    return filt(pulses + buzz + 0.3 * np.sign(np.sin(ph)), SR, lo=60, hi=3000)


run_e = env([(0, 1), (STOP, 1), (STOP + 1.3, 0.35), (STOP + 1.4, 0.0), (DUR, 0.0)])
run_e *= night
run_e += env([(0, 0), (LOOP_ON, 0), (LOOP_ON + 0.01, 1), (DUR, 1)])
run_e = np.minimum(run_e, 1)
idle_e = env([(0, 0), (STOP + 0.4, 0), (STOP + 1.0, 0.6), (STOP + 1.35, 0.6), (STOP + 1.4, 0.0), (DUR, 0)])
eng = (two_stroke(46.0) * run_e + two_stroke(24.0) * idle_e) * 0.12
fx += st(eng * (1 - speech * (1 - db(-4))))
# the engine cut: a last cough
n = int(0.25 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=60, hi=600) * np.exp(-tt * 12) * 0.08), STOP + 1.4)
# the store's tinny radio, the same few bars on every pass
radio = filt(hs.music_box(SR, hs.THEME_A_MINOR, 0.9, 1.0, seed=870).mean(1), SR, lo=700, hi=3200)
radio = np.tanh(radio * 4) * 0.09
for p0 in PASSES:
    seg_n = int(3.6 * SR)
    clip = radio[:seg_n] * np.sin(np.pi * np.arange(min(seg_n, len(radio))) / min(seg_n, len(radio)))
    place(fx, st(clip), p0 - 1.8)
# the subliminal: a swell and a whip, between lines
place(fx, hs.reverse_swell(SR, [207.65, 311.13], 0.3, seed=871) * 0.8, SUB - 0.3)
place(fx, lib('perspective_whip'), SUB, -10)
# in the silence: a deep breath in the bamboo, like a horse's; the handlebar turning
n = int(1.1 * SR)
tt = np.arange(n) / SR
snort = filt(rng.standard_normal(n), SR, lo=80, hi=900) * np.sin(np.pi * tt / 1.1) ** 1.5 * (1 + 0.6 * np.sin(2 * np.pi * 7 * tt)) * 0.07
place(fx, verb(snort, 1.4, 0.3, seed=880, bright=1500), BREATH)
place(fx, lib('gear_ratchet'), BREATH + 0.6, -22)
# the reveal: a low hit, a deep, low laugh like a horse breathing out
place(fx, lib('low_cinematic_hit'), REVEAL, -5)
n = int(1.4 * SR)
tt = np.arange(n) / SR
laugh = sum(np.sin(2 * np.pi * (95 + k * 9) * tt) for k in range(3)) * (np.sin(2 * np.pi * 5.5 * tt) > 0) * np.sin(np.pi * tt / 1.4) * 0.05
place(fx, verb(filt(laugh + rng.standard_normal(n) * 0.02, SR, lo=70, hi=900), 1.6, 0.35, seed=881, bright=1200), REVEAL + 0.45)
# the shirt: cloth pulled off and turned
for k, t0 in enumerate([SHIRT + 0.2, SHIRT + 0.9, SHIRT + 2.4]):
    n = int(0.45 * SR)
    tt = np.arange(n) / SR
    place(fx, st(filt(rng.standard_normal(n), SR, lo=1200, hi=7000) * np.sin(np.pi * tt / 0.45) * 0.018), t0)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep17-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep17TheRoadThatWouldntEnd',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep17-road/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep17-road/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): C#2/G#2 mid-band drone; tremolo string clusters; the music-box theme detuned; a heartbeat 62-116 bpm from the rain to the stop; a riser into the stop; one stinger in silence (the beam finds it); bowed metal at dawn',
        'the road: a two-stroke tricycle engine on whole cycles (continuous across the loop seam), idling and cut; the store radio (the music-box theme through a tinny band-pass) on every pass; leaves, bamboo creaks, crickets, frogs, rain; a rooster and birds at dawn',
        'the creature: a deep breathy snort and a low, pulsed laugh (filtered noise and low partials); cloth rustles for the shirt',
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
