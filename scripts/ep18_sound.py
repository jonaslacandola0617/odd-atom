"""Episode 18 "The Light in the Quezon Room" sound, to the Season 2 horror standard.

- Narrator: the ElevenLabs Taglish take (Juanito, scripts/ep18_voice.py), close and dry.
- Outside: the city's hum, the river lapping, insects; a far click as the window lights (at the
  start and again just after the loop seam).
- Inside: old wood settling, the guard's steps on narra boards and his keys; the office door; the
  desk lamp's hum; heavy pacing on the floor above, moving left and right; a lighter and an exhale in
  an empty room; a child's giggle and a ball rolling out; the turn; held silence; ONE stinger in
  silence and soft steps going away; the lamp switched off.
Ducks 7 dB under speech; presence in the phone band; -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep18_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep18-palace-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep18-palace-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(18018)
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



# key times: must match K in src/horror/ep18/Episode18.tsx
LIGHT_ON = 1.0
SUB = L['l05']['end'] + 0.15
BALL = L['l07']['start'] - 0.1
TURN = L['l07']['end'] + 0.3
REVEAL = L['l07']['end'] + 1.6
OFF = L['l09']['end'] - 0.6
LOOP_ON = DUR - 1.6
STINGERS = [REVEAL]
B_T = L['l01']['end'] + 0.3
C_T = L['l02']['end'] + 0.3
D2_T = L['l04']['start'] + 2.9
E_T = L['l05']['start'] - 0.3
F_T = L['l05']['end'] + 0.3
G_T = L['l07']['start'] - 0.4
EXT2 = L['l10']['start'] - 0.3


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


out = np.minimum(1, span(0, C_T) + span(EXT2, DUR, 0.02))
inside = np.clip(1 - out, 0, 1)
office = np.minimum(1, span(D2_T, E_T) + span(L['l09']['start'] - 0.3, EXT2))
hush = env([(0, 1), (L['l07']['end'] + 0.15, 1), (L['l07']['end'] + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1), (DUR, 1)])

OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v = filt(v, SR, lo=70)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = np.tanh(v * 1.4) / 1.4
    v = verb(v, 1.0, 0.07, seed=18, bright=3500)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
drone_e = env([(0, 0.7), (C_T, 0.8), (E_T, 0.95), (G_T, 1.1), (L['l07']['end'] + 0.3, 1.1), (L['l07']['end'] + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1.6),
                (L['l08']['end'], 1.0), (EXT2, 0.6), (LOOP_ON, 0.7), (DUR, 0.7)])
mus += st(hs.drone_mid(T, qf, drone_e, root=73.42) * 1.6)
str_e = env([(0, 0.45), (C_T, 0.6), (E_T, 0.85), (G_T, 1.1), (L['l07']['end'] + 0.3, 1.1), (L['l07']['end'] + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL + 0.1, 1.6),
             (L['l08']['end'], 0.9), (EXT2, 0.4), (LOOP_ON, 0.45), (DUR, 0.45)])
trem = env([(0, 0.3), (E_T, 0.6), (G_T, 0.9), (REVEAL, 1.0), (EXT2, 0.3), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [146.83, 155.56, 220.0], str_e, trem, SR, seed=901) * 2.2)
mus += st(hs.strings(T, qf, [233.08, 329.63], env([(0, 0), (REVEAL - 0.02, 0), (REVEAL + 0.1, 1.2), (L['l08']['end'], 0.4), (EXT2, 0), (DUR, 0)]), None, SR, seed=902))
for t0, rate, det, g in [(L['l02']['end'] + 0.05, 0.5, 0.982, -3.5)]:
    place(mus, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0)), t0, g + 4)
place(mus, hs.reverse_swell(SR, [146.83, 220.0, 311.13], 0.5, seed=911), REVEAL - 0.5)
place(mus, hs.stinger(SR, seed=912, size=1.3), REVEAL)
place(mus, hs.heartbeat(SR, E_T, L['l07']['end'] + 0.3, 62, 116, gain=0.95, seed=913), E_T)
place(mus, hs.riser(SR, 1.4, seed=914), G_T - 0.6)
place(mus, st(hs.metal_bow(SR, 3.5, 1060, seed=915)), OFF)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-4.0)
mus *= hush[:, None]
mus *= env([(0, 1), (LOOP_ON, 1), (DUR - 0.3, db(-3.0)), (DUR, db(-3.0))])[:, None]
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ the palace by the river; the old hall
amb = np.zeros((N, 2))
gust = 0.55 + 0.45 * np.sin(2 * np.pi * qf(0.1) * T) * np.sin(2 * np.pi * qf(0.037) * T)
city = filt(rng.standard_normal(N), SR, lo=80, hi=600) * (0.7 + 0.3 * np.sin(2 * np.pi * qf(0.06) * T))
amb += st(city * (0.009 * out + 0.003 * inside) * hush)
lap = filt(rng.standard_normal(N), SR, lo=200, hi=1500) * (0.5 + 0.5 * np.sin(2 * np.pi * qf(0.7) * T) ** 2)
amb += st(lap * 0.006 * out)
crick = np.zeros(N)
for f, rate, ph, g in [(4400, 0.8, 0.0, 1.0), (5000, 0.55, 2.0, 0.7)]:
    train = (np.sin(2 * np.pi * qf(rate) * T + ph) > 0.6).astype(float)
    pulse = (np.sin(2 * np.pi * qf(27.0) * T + ph) > 0.2).astype(float)
    crick += np.sin(2 * np.pi * qf(f) * T) * train * pulse * g
amb += st(filt(crick, SR, lo=2500, hi=7500) * (0.007 * out + 0.002 * inside) * hush)
room = np.stack([filt(rng.standard_normal(N), SR, lo=120, hi=900), filt(rng.standard_normal(N), SR, lo=120, hi=900)], 1)
amb += room * (0.004 * inside * gust * hush)[:, None]
# old wood settling
for k, t0 in enumerate([C_T + 1.2, L['l03']['end'] + 0.1, D2_T + 1.4, G_T - 0.2, L['l08']['end'] + 0.1]):
    n = int(0.5 * SR)
    tt = np.arange(n) / SR
    cr = np.sin(2 * np.pi * np.cumsum(220 + 80 * np.sin(np.pi * tt / 0.5)) / SR) * (np.sin(2 * np.pi * 30 * tt) > 0.2) * np.sin(np.pi * tt / 0.5)
    place(amb, verb(filt(cr, SR, lo=150, hi=2000) * 0.01, 1.6, 0.45, seed=960 + k, bright=2000), t0)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def step(gain, bright=1800, seed=0):
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 110 * tt) * np.exp(-tt * 30) + filt(rng.standard_normal(n), SR, lo=150, hi=bright) * np.exp(-tt * 40) * 0.6) * gain
    return verb(x, 1.6, 0.4, seed=seed, bright=bright)


# the window switching on (far, outside), at the start and again just after the loop seam
n = int(0.03 * SR)
tt = np.arange(n) / SR
place(fx, st(np.sin(2 * np.pi * 2600 * tt) * np.exp(-tt * 200) * 0.02), LIGHT_ON)
# the guard's steps on narra boards, his keys
for k, t0 in enumerate(np.arange(C_T + 0.2, L['l03']['end'] + 0.4, 0.62)):
    place(fx, step(0.05, seed=900 + k), t0)
for k in range(5):
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    place(fx, st(np.sin(2 * np.pi * (3200 + k * 400) * tt) * np.exp(-tt * 90) * 0.012), C_T + 0.25 + k * 0.62 + 0.05)
# the office door opening; the lamp's hum
place(fx, lib('heavy_hinge'), D2_T - 0.15, -16)
hum = filt(np.sin(2 * np.pi * qf(120) * T) + 0.4 * np.sin(2 * np.pi * qf(240) * T), SR, lo=100, hi=1500)
fx += st(hum * 0.004 * office * (T < OFF))
# pacing above: slow, heavy steps back and forth, moving left to right and back
for k, t0 in enumerate(np.arange(E_T + 0.2, F_T - 0.1, 0.72)):
    pan = np.sin(k * 0.6)
    s1 = step(0.07, bright=900, seed=930 + k)
    s1[:, 0] *= 1 - 0.4 * pan
    s1[:, 1] *= 1 + 0.4 * pan
    place(fx, s1, t0)
# the empty room: a lighter, an exhale
place(fx, lib('steel_latch'), F_T + 0.15, -24)
n = int(1.0 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=500, hi=4000) * np.sin(np.pi * tt / 1.0) ** 2 * 0.015), L['l06']['end'] + 0.05)
# a child's giggle, then a ball rolling out on the boards, two small bounces
for k in range(4):
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    f = 900 - k * 50
    place(fx, verb(filt(np.sin(2 * np.pi * f * tt) * (1 + 0.6 * np.sin(2 * np.pi * 2 * f * tt)) * np.sin(np.pi * tt / 0.08) * 0.02, SR, lo=400, hi=4000), 1.8, 0.5, seed=950 + k, bright=4000), L['l06']['end'] + 0.12 + k * 0.1)
n = int(1.8 * SR)
tt = np.arange(n) / SR
roll = filt(rng.standard_normal(n), SR, lo=80, hi=700) * (1 - tt / 1.8) * (1 + 0.5 * np.sin(2 * np.pi * (8 - 3 * tt) * tt)) * 0.03
place(fx, verb(roll, 1.4, 0.35, seed=955, bright=1200), BALL)
for k, dt in enumerate([0.05, 0.3]):
    place(fx, step(0.04 / (k + 1), bright=1400, seed=957 + k), BALL + dt)
# the turn: a quick swing of cloth and light
place(fx, lib('perspective_whip'), TURN - 0.05, -16)
# the reveal: a low hit; then soft steps going away, slower than a man's
place(fx, lib('low_cinematic_hit'), REVEAL, -5)
for k, t0 in enumerate(np.arange(REVEAL + 0.6, L['l08']['start'] + 3.6, 0.95)):
    place(fx, step(0.035 * (0.85 ** k), bright=1200, seed=970 + k), t0)
# the lamp switched off
n = int(0.03 * SR)
tt = np.arange(n) / SR
place(fx, st(np.sin(2 * np.pi * 2200 * tt) * np.exp(-tt * 180) * 0.05), OFF)
# the subliminal: a swell and a whip, between lines
place(fx, hs.reverse_swell(SR, [207.65, 311.13], 0.3, seed=981) * 0.8, SUB - 0.3)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep18-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep18TheLightInTheQuezonRoom',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep18-palace/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep18-palace/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): D2/A2 mid-band drone; tremolo string clusters; the music-box theme detuned; a heartbeat 62-116 bpm from the pacing to the turn; a riser; one stinger in silence (the figure); bowed metal as the lamp goes off',
        'outside: the city hum, the river lapping, insects, a far switch click; inside: wood settling, steps on narra, keys, a lamp hum, heavy pacing above (panned), an exhale, a child giggle (short pitched pulses), a ball rolling, soft receding steps, the lamp switch',
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
