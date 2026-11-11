"""Episode 19 "Santelmo" sound, to the Season 2 horror standard.

- Narrator: the ElevenLabs Taglish take (Juanito, scripts/ep19_voice.py), close and dry.
- The paddies: a frog chorus over the flooded field (on whole cycles), crickets, wind in the palay,
  the canal trickling, steps on the wet pilapil; the frogs stop dead before "Dinadala ka nito sa
  tubig."
- The santelmo: a crackling, breathing fire, continuous across the loop seam; a whoosh as it splits.
- The storm at sea: wind, rain, waves, thunder, straining timbers, and the hiss and buzz of St.
  Elmo's fire on the masts.
- The reveal: held silence; ONE stinger in silence; a drowned groan and bubbles. Then the shirt, the
  light hissing and sinking into the canal; dawn with a rooster and birds.
Ducks 7 dB under speech; presence in the phone band; -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep19_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep19-santelmo-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep19-santelmo-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(19019)
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



# key times: must match K in src/horror/ep19/Episode19.tsx
STOP = L['l05']['start'] + 0.5
GO = L['l05']['start'] + 1.9
SUB = L['l05']['end'] + 0.25
FROGS = L['l07']['start'] - 0.2
SPLIT = L['l07']['start'] + 0.6
CLOSE = L['l07']['end'] + 0.3
REVEAL = L['l07']['end'] + 1.5
SINK = L['l09']['start'] + 2.6
LOOP_ON = DUR - 1.6
STINGERS = [REVEAL]
B_T = L['l01']['end'] + 0.3
SHIP_T = L['l04']['start'] - 0.3
E_T = L['l05']['start'] - 0.3
DAWN = L['l09']['end'] + 0.3


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


storm = span(SHIP_T, E_T, 0.02)
dawn = span(DAWN, LOOP_ON, 0.02)
night = np.clip(1 - storm - dawn, 0, 1)
frogs_on = np.clip(night - span(FROGS, DAWN, 0.08), 0, 1)
hush = env([(0, 1), (L['l07']['end'] + 0.15, 1), (L['l07']['end'] + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1), (DUR, 1)])
walking = np.clip(span(0, SHIP_T) + span(LOOP_ON, DUR) + span(E_T, STOP) + span(GO, L['l05']['end'] + 0.4), 0, 1)

OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v = filt(v, SR, lo=70)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = np.tanh(v * 1.4) / 1.4
    v = verb(v, 1.0, 0.07, seed=19, bright=3500)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
drone_e = env([(0, 0.75), (SHIP_T, 0.9), (E_T, 0.85), (FROGS, 1.1), (L['l07']['end'] + 0.3, 1.15), (L['l07']['end'] + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1.6),
                (SINK, 0.9), (DAWN, 0.5), (LOOP_ON, 0.75), (DUR, 0.75)])
mus += st(hs.drone_mid(T, qf, drone_e, root=65.41) * 1.6)
str_e = env([(0, 0.5), (SHIP_T, 0.7), (E_T, 0.7), (FROGS, 1.1), (L['l07']['end'] + 0.3, 1.15), (L['l07']['end'] + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL + 0.1, 1.6),
             (SINK, 0.8), (DAWN + 0.5, 0.35), (LOOP_ON, 0.5), (DUR, 0.5)])
trem = env([(0, 0.3), (E_T, 0.6), (FROGS, 0.9), (REVEAL, 1.0), (DAWN, 0.2), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [130.81, 138.59, 196.0], str_e, trem, SR, seed=1001) * 2.2)
mus += st(hs.strings(T, qf, [207.65, 293.66], env([(0, 0), (REVEAL - 0.02, 0), (REVEAL + 0.1, 1.2), (SINK + 1, 0.3), (DAWN, 0), (DUR, 0)]), None, SR, seed=1002))
place(mus, hs.music_box(SR, hs.THEME_A_MINOR, 0.5, 0.982, seed=1003), L['l02']['end'] + 0.05, 0.5)
place(mus, hs.reverse_swell(SR, [130.81, 196.0, 277.18], 0.5, seed=1011), REVEAL - 0.5)
place(mus, hs.stinger(SR, seed=1012, size=1.3), REVEAL)
place(mus, hs.heartbeat(SR, E_T, L['l07']['end'] + 0.3, 62, 118, gain=0.95, seed=1013), E_T)
place(mus, hs.riser(SR, 1.4, seed=1014), FROGS - 0.4)
place(mus, st(hs.metal_bow(SR, 3.0, 1020, seed=1015)), SINK)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-2.1)
mus *= hush[:, None]
mus *= env([(0, 1), (LOOP_ON, 1), (DUR - 0.3, db(0.0)), (DUR, db(0.0))])[:, None]
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ the paddies at night; the storm at sea; dawn
amb = np.zeros((N, 2))
gust = 0.55 + 0.45 * np.sin(2 * np.pi * qf(0.11) * T) * np.sin(2 * np.pi * qf(0.043) * T)
breeze = np.stack([filt(rng.standard_normal(N), SR, lo=600, hi=4000), filt(rng.standard_normal(N), SR, lo=600, hi=4000)], 1)
amb += breeze * ((0.007 * night + 0.006 * dawn) * gust * hush)[:, None]
# a frog chorus over the flooded field (several voices, whole cycles), stopping dead before "Dinadala"
frog = np.zeros(N)
for f, rate, ph, g in [(520, 1.3, 0.3, 1.0), (610, 0.9, 2.2, 0.8), (450, 1.7, 4.0, 0.7), (700, 1.1, 1.0, 0.6), (380, 0.7, 5.1, 0.6)]:
    gate = (np.sin(2 * np.pi * qf(rate) * T + ph) > 0.55).astype(float)
    frog += np.sign(np.sin(2 * np.pi * qf(f / 9) * T + ph)) * np.sin(2 * np.pi * qf(f) * T) * gate * g
amb += st(filt(frog, SR, lo=250, hi=2200) * 0.026 * frogs_on * hush)
crick = np.zeros(N)
for f, rate, ph, g in [(4300, 0.8, 0.0, 1.0), (4900, 0.5, 2.0, 0.7)]:
    train = (np.sin(2 * np.pi * qf(rate) * T + ph) > 0.6).astype(float)
    pulse = (np.sin(2 * np.pi * qf(28.0) * T + ph) > 0.2).astype(float)
    crick += np.sin(2 * np.pi * qf(f) * T) * train * pulse * g
amb += st(filt(crick, SR, lo=2500, hi=7500) * 0.014 * frogs_on * hush)
trickle = filt(rng.standard_normal(N), SR, lo=1500, hi=6000) * (0.5 + 0.5 * np.sin(2 * np.pi * qf(3.3) * T) ** 2)
amb += st(trickle * 0.003 * night * hush)
# the storm: wind, rain, waves, thunder, timbers
stormn = np.stack([filt(rng.standard_normal(N), SR, lo=300, hi=5000), filt(rng.standard_normal(N), SR, lo=300, hi=5000)], 1)
amb += stormn * (0.03 * storm * (0.7 + 0.3 * gust))[:, None]
for t0 in [SHIP_T + 1.25, SHIP_T + 5.15]:
    n = int(2.2 * SR)
    tt = np.arange(n) / SR
    place(amb, st(filt(rng.standard_normal(n), SR, lo=40, hi=900) * (np.exp(-tt * 2.2) + 0.6 * np.exp(-((tt - 0.15) * 12) ** 2)) * 0.2), t0)
place(amb, lib('wood_stress'), SHIP_T + 3.0, -14)
# dawn: a rooster and birds
for t0 in np.arange(DAWN + 0.3, LOOP_ON - 0.2, 0.55):
    n = int(0.07 * SR)
    tt = np.arange(n) / SR
    f = 3400 + 1500 * np.sin(np.pi * tt / 0.07)
    place(amb, st(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.07) * 0.010), t0 + rng.random() * 0.3)
segs = [(0.18, 700, 900), (0.16, 900, 1050), (0.5, 1050, 820)]
xs = []
for d, f0, f1 in segs:
    n = int(d * SR)
    tt = np.arange(n) / SR
    f = np.linspace(f0, f1, n) * (1 + 0.02 * np.sin(2 * np.pi * 30 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    xs.append(sum(np.sin(k * ph) / k for k in range(1, 6)) * np.sin(np.pi * tt / d) ** 0.5)
place(amb, verb(filt(np.concatenate(xs), SR, lo=500, hi=4500) * 0.03, 1.5, 0.3, seed=1099, bright=4000), DAWN + 0.1)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))

# ------------------------------------------------------------------ the santelmo: a crackling, breathing fire (continuous across the loop seam)
fire_e = env([(0, 0.6), (SHIP_T, 0.6), (SHIP_T + 0.02, 0.0), (E_T, 0.0), (E_T + 0.02, 0.7), (FROGS, 0.8), (CLOSE, 0.8), (L['l07']['end'] + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1.6),
              (L['l08']['start'] + 0.9, 1.0), (SINK, 0.5), (SINK + 1.0, 0.0), (DUR, 0.0)])
fire_e += env([(0, 0), (LOOP_ON, 0), (LOOP_ON + 0.02, 0.6), (DUR, 0.6)])
roar = filt(rng.standard_normal(N), SR, lo=150, hi=1400) * (0.6 + 0.4 * np.sin(2 * np.pi * qf(2.3) * T) * np.sin(2 * np.pi * qf(0.7) * T))
crackle = np.zeros(N)
idx = rng.random(N) < 0.0012
crackle[idx] = rng.standard_normal(idx.sum()) * 4
crackle = filt(crackle, SR, lo=1500, hi=8000)
fx += st((roar * 0.08 + crackle * 0.12) * fire_e)
# steps on the wet pilapil while he walks
for k, t0 in enumerate(np.arange(0.2, DUR, 0.56)):
    if np.interp(t0, T, walking) > 0.5:
        n = int(0.1 * SR)
        tt = np.arange(n) / SR
        place(fx, st(filt(rng.standard_normal(n), SR, lo=300, hi=2500) * np.exp(-tt * 30) * 0.03), t0)
# St. Elmo's fire: the hiss and buzz of a corona discharge on the masts
fx += st(filt(rng.standard_normal(N) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * qf(100) * T))), SR, lo=3000, hi=9000) * 0.004 * storm)
# it splits into three: a soft tearing whoosh
place(fx, lib('perspective_whip'), SPLIT - 0.05, -14)
# the reveal: a low hit, a drowned groan with bubbles
place(fx, lib('low_cinematic_hit'), REVEAL, -5)
n = int(1.6 * SR)
tt = np.arange(n) / SR
groan = filt(np.sin(2 * np.pi * (110 + 25 * np.sin(np.pi * tt / 1.6)) * tt) * (1 + 0.5 * rng.standard_normal(n)), SR, lo=80, hi=700) * np.sin(np.pi * tt / 1.6) * 0.04
place(fx, verb(groan, 1.8, 0.4, seed=1110, bright=800), REVEAL + 0.3)
for k in range(9):
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    f = 300 + rng.random() * 500
    place(fx, st(np.sin(2 * np.pi * f * (1 + 3 * tt) * tt) * np.exp(-tt * 40) * 0.02), REVEAL + 0.2 + rng.random() * 1.2)
# the shirt; the light sinking into the canal with a hiss and a plop
for t0 in [L['l09']['start'] + 0.1, L['l09']['start'] + 1.6]:
    n = int(0.45 * SR)
    tt = np.arange(n) / SR
    place(fx, st(filt(rng.standard_normal(n), SR, lo=1200, hi=7000) * np.sin(np.pi * tt / 0.45) * 0.018), t0)
n = int(0.9 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=2000, hi=9000) * np.exp(-tt * 4) * 0.03), SINK + 0.4)
n = int(0.12 * SR)
tt = np.arange(n) / SR
place(fx, st(np.sin(2 * np.pi * (220 + 600 * tt) * tt) * np.exp(-tt * 30) * 0.05), SINK + 0.85)
# the subliminal: a swell and a whip, between lines
place(fx, hs.reverse_swell(SR, [207.65, 311.13], 0.3, seed=1121) * 0.8, SUB - 0.3)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep19-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep19Santelmo',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep19-santelmo/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep19-santelmo/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): C2/G2 mid-band drone; tremolo string clusters; the music-box theme detuned; a heartbeat 62-118 bpm from the stop to the silence; a riser as the frogs stop; one stinger in silence (the face in the fire); bowed metal as the light sinks',
        'the paddies: a frog chorus on whole cycles (stopping dead), crickets, wind in the palay, a canal trickle, steps on the pilapil; the storm: wind, rain, waves, thunder, the corona hiss of St. Elmo\'s fire; dawn birds and a rooster',
        'the santelmo: filtered-noise roar and random crackle (continuous across the loop seam); a drowned groan and bubbles at the reveal; a hiss and a plop as it sinks',
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
