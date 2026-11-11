"""Episode 14 "The Guests of Dominican Hill" sound, to the Season 2 horror standard.

- Narrator: the ElevenLabs Taglish take (Juanito, scripts/ep14_voice.py), close and dry.
- The hill: pine wind and fog through the empty windows, stone-room reverb inside, sparse crickets;
  far, low booms under the war shot (kept respectful).
- The legend: three knocks behind a door; plates, cutlery and voices from the dining hall that cut
  dead when the flashlight swings in; footsteps receding down the corridor.
- The dark: the flashlight sputters out; chairs scrape in the black; the light returns on the figure
  with ONE stinger in silence. Bowed metal and birds at dawn.
Ducks 7 dB under speech; presence in the phone band; -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep14_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep14-hill-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep14-hill-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(14014)
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



# key times: must match K in src/horror/ep14/Episode14.tsx
KNOCK = L['l05']['end'] + 0.12
DARK = L['l07']['end'] + 0.3
REVEAL = L['l07']['end'] + 1.75
AFTER = L['l08']['end'] + 0.35
SUB = L['l05']['end'] + 0.55
DAWN = L['l10']['start'] - 0.3
LOOP_ON = DUR - 1.6
STINGERS = [REVEAL]
SWING_IN = L['l06']['start'] + 0.6  # the flashlight swings into the hall: the dinner sounds stop
WAR = (L['l03']['start'] - 0.35, L['l04']['start'] - 0.35)
EXT = [(L['l01']['end'] + 0.35, L['l03']['start'] - 0.35), (L['l04']['start'] - 0.35, L['l05']['start'] - 0.4), (DAWN, LOOP_ON)]


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


outside = np.minimum(1, sum(span(a, b) for a, b in EXT))
war = span(*WAR)
dawn = span(DAWN, LOOP_ON, 0.05)
inside = np.clip(1 - outside - war, 0, 1)
hush = env([(0, 1), (DARK + 0.4, 1), (DARK + 0.6, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1), (DUR, 1)])

OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v = filt(v, SR, lo=70)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = np.tanh(v * 1.4) / 1.4
    v = verb(v, 1.0, 0.07, seed=14, bright=3500)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
drone_e = env([(0, 0.75), (WAR[0], 0.6), (WAR[1], 0.75), (L['l05']['start'], 0.95), (L['l07']['start'], 1.1), (DARK, 1.2), (DARK + 0.5, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1.5),
                (AFTER, 1.1), (DAWN, 0.5), (DAWN + 1.0, 0.55), (LOOP_ON, 0.75), (DUR, 0.75)])
mus += st(hs.drone_mid(T, qf, drone_e, root=82.41) * 1.6)
str_e = env([(0, 0.5), (WAR[0], 0.4), (L['l05']['start'], 0.8), (L['l07']['start'], 1.0), (DARK, 1.2), (DARK + 0.5, 0.0), (REVEAL - 0.02, 0.0), (REVEAL + 0.1, 1.5),
             (AFTER + 1, 0.9), (DAWN + 1.5, 0.4), (LOOP_ON, 0.5), (DUR, 0.5)])
trem = env([(0, 0.3), (L['l05']['start'], 0.6), (L['l07']['start'], 0.9), (REVEAL, 1.0), (DAWN, 0.2), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [164.81, 174.61, 246.94], str_e, trem, SR, seed=501) * 2.2)
mus += st(hs.strings(T, qf, [261.63, 369.99], env([(0, 0), (REVEAL - 0.02, 0), (REVEAL + 0.1, 1.2), (AFTER + 2, 0.6), (DAWN, 0), (DUR, 0)]), None, SR, seed=502))
for t0, rate, det, g in [(L['l01']['end'] + 0.1, 0.45, 0.985, -3.5), (WAR[0] + 0.2, 0.55, 0.975, -4.0), (DAWN + 0.6, 0.66, 0.965, -3.0)]:
    place(mus, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0)), t0, g + 4)
place(mus, hs.reverse_swell(SR, [164.81, 246.94, 349.23], 0.5, seed=511), REVEAL - 0.5)
place(mus, hs.stinger(SR, seed=512, size=1.25), REVEAL)
place(mus, hs.heartbeat(SR, L['l05']['start'], DARK + 0.4, 64, 112, gain=0.95, seed=513), L['l05']['start'])
place(mus, hs.riser(SR, 1.4, seed=514), DARK - 1.0)
place(mus, st(hs.metal_bow(SR, 4.0, 1180, seed=515)), DAWN + 0.3)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-3.2)
mus *= hush[:, None]
mus *= env([(0, 1), (LOOP_ON, 1), (DUR - 0.3, db(-2.6)), (DUR, db(-2.6))])[:, None]
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ the hill and the ruin
amb = np.zeros((N, 2))
gust = 0.55 + 0.45 * np.sin(2 * np.pi * qf(0.09) * T) * np.sin(2 * np.pi * qf(0.031) * T)
pinewind = np.stack([filt(rng.standard_normal(N), SR, lo=300, hi=3200), filt(rng.standard_normal(N), SR, lo=300, hi=3200)], 1)
amb += pinewind * ((0.018 * outside + 0.009 * inside) * gust * hush)[:, None]
# a low moan through the empty windows inside
moan = np.sin(2 * np.pi * qf(176) * T + 0.8 * np.sin(2 * np.pi * qf(0.21) * T)) * (0.4 + 0.6 * gust)
amb += st(filt(moan, SR, lo=120, hi=600) * 0.004 * inside * hush)
crick = np.zeros(N)
for f, rate, ph, g in [(4300, 0.7, 0.0, 1.0), (4800, 0.45, 2.0, 0.7)]:
    train = (np.sin(2 * np.pi * qf(rate) * T + ph) > 0.7).astype(float)
    pulse = (np.sin(2 * np.pi * qf(26.0) * T + ph) > 0.2).astype(float)
    crick += np.sin(2 * np.pi * qf(f) * T) * train * pulse * g
amb += st(filt(crick, SR, lo=2500, hi=7500) * 0.006 * (outside * (1 - dawn) + inside * 0.4) * hush)
# the war: far, low booms, muffled
for t0 in [WAR[0] + 0.4, WAR[0] + 1.7, WAR[0] + 2.9]:
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    place(amb, st(filt(rng.standard_normal(n), SR, lo=40, hi=260) * np.exp(-tt * 2.5) * 0.09), t0)
# dawn birds
for t0 in np.arange(DAWN + 0.5, LOOP_ON - 0.3, 0.7):
    n = int(0.07 * SR)
    tt = np.arange(n) / SR
    f = 3600 + 1300 * np.sin(np.pi * tt / 0.07)
    place(amb, st(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.07) * 0.011), t0 + rng.random() * 0.3)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def knock(gain=0.12):
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 150 * tt) * np.exp(-tt * 40) + filt(rng.standard_normal(n), SR, lo=200, hi=2000) * np.exp(-tt * 60) * 0.5) * gain
    return verb(x, 1.8, 0.4, seed=521, bright=2000)


for k in range(3):
    place(fx, knock(0.12), KNOCK + k * 0.32)
# the dinner: plates, cutlery and murmuring voices, until the flashlight swings in
for t0 in np.arange(KNOCK + 0.9, SWING_IN, 0.21):
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    f = 2400 + rng.random() * 1800
    place(fx, verb(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 70) * 0.03, 1.6, 0.4, seed=int(t0 * 10)), t0 + rng.random() * 0.08)
tv = np.arange(int((SWING_IN - KNOCK - 0.8) * SR)) / SR
babble = sum(np.sin(2 * np.pi * (180 + 40 * k) * tv + 3 * np.sin(2 * np.pi * (3 + k) * tv)) * (np.sin(2 * np.pi * (1.3 + 0.4 * k) * tv) > 0) for k in range(4))
place(fx, verb(filt(babble, SR, lo=200, hi=1600) * 0.012, 1.8, 0.5, seed=531, bright=1600), KNOCK + 0.8)
# footsteps receding down the corridor (the priest)
for k, t0 in enumerate(np.arange(L['l07']['start'] - 0.2, DARK - 0.1, 0.55)):
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    place(fx, verb(filt(rng.standard_normal(n), SR, lo=150, hi=1500) * np.exp(-tt * 40) * 0.05 * (0.9 ** k), 1.8, 0.45, seed=540 + k, bright=1500), t0)
# the flashlight sputters and dies; its switch clicking
for k, t0 in enumerate(np.arange(DARK, DARK + 0.45, 0.09)):
    n = int(0.03 * SR)
    tt = np.arange(n) / SR
    place(fx, st(filt(rng.standard_normal(n), SR, lo=1500, hi=6000) * np.exp(-tt * 120) * 0.04), t0)
for t0 in [DARK + 0.55, DARK + 0.75, REVEAL - 0.05]:
    n = int(0.02 * SR)
    tt = np.arange(n) / SR
    place(fx, st(np.sin(2 * np.pi * 3200 * tt) * np.exp(-tt * 200) * 0.05), t0)
# in the black: chairs scraping on tile
for t0, g in [(DARK + 0.65, 0.07), (DARK + 0.95, 0.06), (DARK + 1.2, 0.08)]:
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    scrape = filt(rng.standard_normal(n) * (1 + 0.8 * np.sign(np.sin(2 * np.pi * 45 * tt))), SR, lo=300, hi=3000) * np.sin(np.pi * tt / 0.35) * g
    place(fx, verb(scrape, 1.4, 0.35, seed=int(t0 * 100), bright=2500), t0)
# the subliminal: a swell and a whip, between lines
place(fx, hs.reverse_swell(SR, [233.08, 349.23], 0.3, seed=551) * 0.8, SUB - 0.3)
place(fx, lib('perspective_whip'), SUB, -10)
# the reveal: a low hit under the stinger, one chair creaking
place(fx, lib('low_cinematic_hit'), REVEAL, -5)
place(fx, lib('wood_stress'), REVEAL + 0.25, -14)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep14-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep14GuestsOfDominicanHill',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep14-hill/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep14-hill/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): E2/B2 mid-band drone; tremolo string clusters; the music-box theme detuned; a heartbeat 64-112 bpm from the corridor to the dark; a riser; one stinger in silence (the light returns on the figure); bowed metal at dawn',
        'the hill: pine wind and fog through the empty windows; a stone-room reverb inside; sparse cold crickets; far, low booms under the war shot (kept respectful)',
        'the legend: three knocks behind a door; plates, cutlery and murmured voices from the dining hall that cut dead when the flashlight swings in; footsteps receding down the corridor',
        'the dark: the flashlight sputtering and its switch; chairs scraping on tile in the black; a single chair creak with the stinger; dawn birds',
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
