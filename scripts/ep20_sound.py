"""Episode 20 "The Theatre by the Bay" sound, to the Season 2 horror standard (the finale).

- Narrator: the ElevenLabs Taglish take (Juanito, scripts/ep20_voice.py), close and dry, at 1.05x.
- The theatre: a big, low room tone; the thump of a seat folding down by itself (in the hook and at
  every loop), then twelve more, one by one.
- Outside: the bay lapping, wind, far traffic. 1981: a generator and the work lights' buzz, the empty
  scaffold clanking and creaking as it sways, then a cut to total silence. NO crash and no voices:
  the accident is never sounded.
- The festival: a far, muffled band. The lobby: hammering far above, a trowel scraping concrete,
  slow footsteps on the stairs.
- The reveal: held silence; ONE stinger in silence; a seat creaking as one head turns; the lights
  clunking out; a held, warmer chord under the last line, for the workers.
Ducks 7 dB under speech; presence in the phone band; -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep20_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep20-theatre-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep20-theatre-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(20020)
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



# key times: must match K in src/horror/ep20/Episode20.tsx
FOLD = 1.2
BLACK = L['l04']['end'] + 0.15
SITE = L['l05']['start'] + 0.5
SUB = L['l06']['end'] + 0.25
FOLDS = L['l08']['start']
FOLDS_END = L['l08']['end'] + 0.2
REVEAL = L['l08']['end'] + 1.5
TURN = L['l08']['end'] + 2.6
OUT_T = L['l09']['end'] + 0.3
HAT_GONE = L['l10']['start'] + 2.2
LOOP_ON = DUR - 1.6
STINGERS = [REVEAL]
B_T = L['l01']['end'] + 0.3
C_T = L['l03']['start'] - 0.3
F_T = L['l05']['end'] + 0.3
G_T = L['l07']['start'] - 0.3
H_T = L['l08']['start'] - 0.3


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


theatre = np.minimum(1, span(0, B_T) + span(H_T, OUT_T) + span(OUT_T + 0.5, DUR))
outside = span(B_T, C_T)
site81 = span(C_T, BLACK, 0.005)
black = span(BLACK, SITE, 0.005)
site_after = span(SITE, F_T)
fest = span(F_T, G_T)
lobby = span(G_T, H_T)
hush = env([(0, 1), (L['l08']['end'] + 0.15, 1), (L['l08']['end'] + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1), (DUR, 1)])

OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v = filt(v, SR, lo=70)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = np.tanh(v * 1.4) / 1.4
    v = verb(v, 1.0, 0.07, seed=20, bright=3500)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ score (it falls silent with the scaffold; it never plays over the accident)
mus = np.zeros((N, 2))
drone_e = env([(0, 0.75), (C_T, 0.9), (BLACK - 0.02, 1.0), (BLACK, 0.0), (SITE, 0.0), (SITE + 1.5, 0.55), (G_T, 0.85), (H_T, 1.0), (L['l08']['end'] + 0.3, 1.15), (L['l08']['end'] + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1.6),
                (OUT_T, 0.9), (LOOP_ON, 0.75), (DUR, 0.75)])
mus += st(hs.drone_mid(T, qf, drone_e, root=61.74) * 1.6)
str_e = env([(0, 0.5), (C_T, 0.7), (BLACK - 0.02, 0.8), (BLACK, 0.0), (SITE + 1.5, 0.4), (G_T, 0.7), (H_T, 1.0), (L['l08']['end'] + 0.3, 1.15), (L['l08']['end'] + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL + 0.1, 1.6),
             (OUT_T, 0.8), (LOOP_ON, 0.5), (DUR, 0.5)])
trem = env([(0, 0.3), (G_T, 0.6), (H_T, 0.9), (REVEAL, 1.0), (OUT_T, 0.3), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [123.47, 130.81, 185.0], str_e, trem, SR, seed=1101) * 2.2)
# a held, warmer chord under the last line (for the workers), resolving into the loop's level
mus += st(hs.strings(T, qf, [196.0, 246.94, 293.66], env([(0, 0), (REVEAL - 0.02, 0), (REVEAL + 0.1, 1.0), (OUT_T, 0.5), (L['l10']['start'], 0.9), (LOOP_ON - 0.2, 0.0), (DUR, 0)]), None, SR, seed=1102))
place(mus, hs.music_box(SR, hs.THEME_A_MINOR, 0.5, 0.982, seed=1103), L['l01']['end'] + 0.05, 0.5)
place(mus, hs.reverse_swell(SR, [123.47, 185.0, 261.63], 0.5, seed=1111), REVEAL - 0.5)
place(mus, hs.stinger(SR, seed=1112, size=1.3), REVEAL)
place(mus, hs.heartbeat(SR, G_T, L['l08']['end'] + 0.3, 62, 118, gain=0.95, seed=1113), G_T)
place(mus, hs.riser(SR, 1.4, seed=1114), L['l08']['start'] - 0.8)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-2.4)
mus *= hush[:, None]
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ places
amb = np.zeros((N, 2))
gust = 0.55 + 0.45 * np.sin(2 * np.pi * qf(0.1) * T) * np.sin(2 * np.pi * qf(0.037) * T)
# the empty theatre: a big low room tone
room = np.stack([filt(rng.standard_normal(N), SR, lo=60, hi=500), filt(rng.standard_normal(N), SR, lo=60, hi=500)], 1)
amb += room * (0.012 * theatre * hush)[:, None]
# outside by the bay: water lapping, wind, far traffic
lap = filt(rng.standard_normal(N), SR, lo=200, hi=1500) * (0.5 + 0.5 * np.sin(2 * np.pi * qf(0.6) * T) ** 2)
amb += st(lap * 0.012 * (outside + site_after + fest))
wind = np.stack([filt(rng.standard_normal(N), SR, lo=300, hi=3000), filt(rng.standard_normal(N), SR, lo=300, hi=3000)], 1)
amb += wind * ((0.008 * (outside + site_after + fest) + 0.004 * site81) * gust)[:, None]
city = filt(rng.standard_normal(N), SR, lo=80, hi=600)
amb += st(city * 0.008 * (outside + fest + site81))
# 1981: a generator, the work lights buzzing
gen = filt(np.sin(2 * np.pi * qf(60) * T) + 0.5 * np.sign(np.sin(2 * np.pi * qf(30) * T)) + 0.3 * rng.standard_normal(N), SR, lo=50, hi=900)
amb += st(gen * 0.014 * site81)
buzz = filt(np.sin(2 * np.pi * qf(120) * T) + 0.4 * np.sin(2 * np.pi * qf(240) * T), SR, lo=100, hi=2000)
amb += st(buzz * 0.005 * site81)
# the festival: a far brass band, muffled across the grounds
band = filt(hs.music_box(SR, hs.THEME_A_MINOR, 0.8, 1.0, seed=1199).mean(1), SR, lo=200, hi=1200)
place(amb, st(np.tanh(band * 3) * 0.025), F_T + 0.2)
# the lobby: hammering far above, a trowel scraping concrete, slow footsteps on the stairs
for k, t0 in enumerate(np.arange(G_T + 0.4, H_T - 0.2, 0.9)):
    n = int(0.06 * SR)
    tt = np.arange(n) / SR
    place(amb, verb(np.sin(2 * np.pi * 900 * tt) * np.exp(-tt * 70) * 0.03, 2.4, 0.6, seed=1200 + k, bright=3000), t0)
for k, t0 in enumerate(np.arange(G_T + 1.0, H_T - 0.3, 1.6)):
    n = int(0.7 * SR)
    tt = np.arange(n) / SR
    scrape = filt(rng.standard_normal(n) * (1 + 0.6 * np.sign(np.sin(2 * np.pi * 38 * tt))), SR, lo=900, hi=5000) * np.sin(np.pi * tt / 0.7) * 0.03
    place(amb, verb(scrape, 2.0, 0.55, seed=1220 + k, bright=4000), t0)
for k, t0 in enumerate(np.arange(G_T + 0.7, H_T - 0.3, 0.75)):
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 110 * tt) * np.exp(-tt * 30) + filt(rng.standard_normal(n), SR, lo=150, hi=1500) * np.exp(-tt * 40) * 0.6) * 0.04
    place(amb, verb(x, 2.2, 0.55, seed=1240 + k, bright=1500), t0)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def thump(gain, seed):
    n = int(0.2 * SR)
    tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 140 * tt) * np.exp(-tt * 35) + filt(rng.standard_normal(n), SR, lo=300, hi=3000) * np.exp(-tt * 60) * 0.6) * gain
    return verb(x, 2.0, 0.45, seed=seed, bright=2500)


# the hook seat folding down by itself (and the same seat at the start of every loop)
place(fx, thump(0.12, 1300), FOLD + 0.15)
# seats folding down one by one, as if people are taking them
n_f = 12
for k in range(n_f):
    place(fx, thump(0.09 + 0.01 * (k % 3), 1310 + k), FOLDS + (k + 0.6) * (FOLDS_END - FOLDS) / n_f)
# 1981: the scaffold clanking, creaking as it sways; then nothing (no crash: the cut to black is silence)
for k, t0 in enumerate(np.arange(C_T + 0.6, BLACK - 0.1, 0.8)):
    n = int(0.1 * SR)
    tt = np.arange(n) / SR
    place(fx, verb(np.sin(2 * np.pi * (1200 + k * 90) * tt) * np.exp(-tt * 40) * 0.025, 1.6, 0.4, seed=1330 + k, bright=4000), t0)
place(fx, lib('wood_stress'), L['l04']['start'] - 0.2, -12)
place(fx, lib('cable_tension'), L['l04']['start'] + 1.0, -14)
fx *= (1 - black)[:, None]
# the reveal: a low hit; a seat creaking as one head turns; the lights clunking out; the hat's scrape
place(fx, lib('low_cinematic_hit'), REVEAL, -5)
place(fx, lib('wood_stress'), TURN, -18)
place(fx, lib('steel_latch'), OUT_T, -10)
n = int(0.5 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=1500, hi=6000) * np.sin(np.pi * tt / 0.5) * 0.012), HAT_GONE - 0.2)
# the subliminal: a swell and a whip, between lines
place(fx, hs.reverse_swell(SR, [207.65, 311.13], 0.3, seed=1351) * 0.8, SUB - 0.3)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep20-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep20TheTheatreByTheBay',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep20-theatre/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep20-theatre/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): B1/F#2 mid-band drone; tremolo string clusters; the music-box theme detuned; a heartbeat 62-118 bpm from the stairs to the silence; a riser into the folding seats; one stinger in silence (the rows); a held, warmer chord under the last line; the score falls silent with the scaffold and never plays over the accident',
        'places: the theatre room tone, the bay, wind and traffic, a generator and work-light buzz (1981), a far muffled band (the festival, the music-box theme band-passed), hammering, a trowel and footsteps (the lobby)',
        'foley: seat thumps (synthesized), scaffold clanks; no crash, no voices',
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
