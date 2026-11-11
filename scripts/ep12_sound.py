"""Episode 12 "Tik-Tik" sound, to the Season 2 horror standard (docs/production/EPISODE_PLAYBOOK.md).

- Narrator: the ElevenLabs Taglish take (Juanito, scripts/ep12_voice.py), close and dry.
- The tiktik itself, in the gaps between lines and never on a word: LOUD and far first (a wet
  double click thrown off the roofs, heavy distance), then softer and drier each time, until the
  last one is quiet, dry and right at the ear (the belief: the fainter it is, the closer it is).
- The barrio on a fiesta night: kuliglig and frogs, dogs barking (they stop before the videoke
  does), a videoke far off that stops mid-song, the bulb's mains hum and its crackle as it
  flickers; everything drops out for the held silence before the face.
- Score (scripts/horror_score.py): mid-band drone, tremolo clusters, the music-box theme detuned,
  a heartbeat from "Tik... tik" to the silence, a riser, ONE stinger in silence (the face), bowed
  metal at dawn.
- Dawn: a rooster in the black, then maya birds and a quiet yard.
Ducks 7 dB under speech; presence in the phone band; -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep12_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep12-tiktik-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep12-tiktik-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(12012)
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



# key times: must match K in src/horror/ep12/Episode12.tsx (the same rules on the same timeline)
VIDEOKE_OFF = L['l07']['start'] - 0.25
SILENCE = L['l08']['end'] + 0.3
REVEAL = L['l08']['end'] + 1.75
BLACK = L['l08']['end'] + 2.75
SUB = L['l06']['end'] + 0.6
DAWN = L['l09']['start']
LOOP_ON = DUR - 1.6
STINGERS = [REVEAL]


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


night = np.maximum(span(0, BLACK, 0.01), span(LOOP_ON, DUR + 1, 0.01))
dawn = span(DAWN - 0.6, LOOP_ON, 0.05)
hush = env([(0, 1), (SILENCE - 0.05, 1), (SILENCE + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1), (DUR, 1)])
blackz = span(BLACK, DAWN - 0.6, 0.02)

OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v = filt(v, SR, lo=70)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = np.tanh(v * 1.4) / 1.4
    v = verb(v, 1.0, 0.07, seed=12, bright=3500)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
drone_e = env([(0, 0.7), (L['l04']['start'], 0.85), (L['l05']['start'], 1.0), (L['l07']['start'], 1.15), (SILENCE, 1.15), (SILENCE + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1.5),
                (BLACK, 1.2), (BLACK + 0.05, 0.0), (DAWN, 0.0), (DAWN + 1.0, 0.55), (LOOP_ON, 0.65), (DUR, 0.7)])
mus += st(hs.drone_mid(T, qf, drone_e, root=98.0) * 1.6)
str_e = env([(0, 0.5), (L['l04']['start'], 0.7), (L['l05']['start'], 0.9), (L['l07']['start'], 1.15), (SILENCE, 1.2), (SILENCE + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL + 0.1, 1.5),
             (BLACK, 1.2), (BLACK + 0.05, 0.0), (DAWN + 0.8, 0.0), (DAWN + 2.0, 0.45), (LOOP_ON, 0.5), (DUR, 0.5)])
trem = env([(0, 0.3), (L['l05']['start'], 0.6), (L['l07']['start'], 1.0), (REVEAL, 1.0), (DAWN, 0.2), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [196.0, 207.65, 293.66], str_e, trem, SR, seed=301) * 2.2)
mus += st(hs.strings(T, qf, [311.13, 440.0], env([(0, 0), (REVEAL - 0.02, 0), (REVEAL + 0.1, 1.2), (BLACK, 0.8), (BLACK + 0.05, 0), (DUR, 0)]), None, SR, seed=302))
for t0, rate, det, g in [(L['l01']['end'] + 0.1, 0.45, 0.985, -3.5), (L['l03']['start'] + 0.2, 0.5, 0.975, -3.0), (DAWN + 0.6, 0.66, 0.965, -3.0)]:
    place(mus, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0)), t0, g + 4)
place(mus, hs.reverse_swell(SR, [196.0, 293.66, 415.3], 0.5, seed=311), REVEAL - 0.5)
place(mus, hs.stinger(SR, seed=312, size=1.25), REVEAL)
place(mus, hs.heartbeat(SR, L['l05']['start'], SILENCE, 68, 116, gain=0.95, seed=313), L['l05']['start'])
place(mus, hs.riser(SR, 1.6, seed=314), SILENCE - 1.6)
place(mus, st(hs.metal_bow(SR, 4.0, 1320, seed=315)), DAWN + 0.3)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-4.0)
mus *= hush[:, None]
mus *= env([(0, 1), (LOOP_ON, 1), (DUR - 0.3, db(-2.6)), (DUR, db(-2.6))])[:, None]
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ the barrio at night
amb = np.zeros((N, 2))
crick = np.zeros(N)
for f, rate, ph, g in [(4400, 1.05, 0.0, 1.0), (4050, 0.8, 2.1, 0.85), (4950, 1.45, 3.9, 0.7), (3700, 0.62, 1.2, 0.6)]:
    train = (np.sin(2 * np.pi * qf(rate) * T + ph) > 0.45).astype(float)
    pulse = (np.sin(2 * np.pi * qf(29.0) * T + ph) > 0.2).astype(float)
    crick += np.sin(2 * np.pi * qf(f) * T) * train * pulse * g
crick = filt(crick, SR, lo=2500, hi=7500)
# frogs in the yard: low croaks on a slow whole-cycle pattern
frog = np.sin(2 * np.pi * qf(310) * T) * (np.sin(2 * np.pi * qf(0.7) * T) > 0.85) * (np.sin(2 * np.pi * qf(24) * T) > 0)
frog = filt(frog, SR, lo=200, hi=1500)
inside = 1 - span(L['l01']['end'] + 0.35, L['l03']['start'], 0.02) - span(L['l04']['start'], L['l05']['start'] - 0.5, 0.02) - span(L['l07']['start'] - 0.9, L['l08']['start'], 0.02)
inside = np.clip(inside, 0, 1)
outdoor = 1 - inside
amb += st((crick * 0.010 + frog * 0.006) * (0.55 + 0.45 * outdoor) * night * hush)
# the bulb's mains hum inside (it buzzes louder as it flickers)
hum = (np.sin(2 * np.pi * qf(120) * T) + 0.4 * np.sin(2 * np.pi * qf(240) * T)) * 0.006
amb += st(filt(hum, SR, lo=100, hi=600) * inside * night * hush)
# the videoke far off: a sung melody over a beat, stopping mid-song; playing again for the loop
kar = np.zeros(N)
notes = [329.6, 392.0, 440.0, 392.0, 329.6, 293.7, 329.6, 261.6]
step = 0.38
for i, t0 in enumerate(np.arange(0, DUR, step)):
    f = notes[i % len(notes)] * (1 + 0.012 * np.sin(i * 1.3))
    n = int(step * 0.95 * SR)
    tt = np.arange(n) / SR
    vib = np.sin(2 * np.pi * 5.5 * tt) * 0.006
    tone = (np.sin(2 * np.pi * f * tt * (1 + vib)) + 0.5 * np.sin(4 * np.pi * f * tt) + 0.3 * np.sin(6 * np.pi * f * tt)) * np.minimum(1, tt * 25) * np.exp(-tt * 0.9)
    a = int(t0 * SR)
    kar[a:a + n] += tone[:max(0, min(n, N - a))]
    if i % 2 == 0:
        kick = np.sin(2 * np.pi * 58 * tt[:int(0.12 * SR)]) * np.exp(-tt[:int(0.12 * SR)] * 28)
        kar[a:a + len(kick)] += kick[:max(0, min(len(kick), N - a))] * 1.6
kar = verb(filt(kar, SR, lo=180, hi=1600), 1.8, 0.45, seed=321, bright=1600)
kar *= env([(0, 1), (VIDEOKE_OFF - 0.02, 1), (VIDEOKE_OFF, 0), (LOOP_ON - 0.02, 0), (LOOP_ON + 0.4, 1), (DUR, 1)])[:, None]
amb += kar * (0.010 * inside + 0.022 * outdoor)[:, None]
amb *= hush[:, None]
# dawn: a quiet yard, a light wind, maya birds
amb += st(filt(rng.standard_normal(N), SR, lo=300, hi=2500) * 0.006 * dawn)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def tik(near, pan=0.0):
    """One 'tik': a hard, wet double click. near=0 far (loud, thrown off the roofs), near=1 at the ear (dry)."""
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    click = filt(rng.standard_normal(n), SR, lo=1800, hi=5200) * np.exp(-tt * 260) + np.sin(2 * np.pi * 1350 * tt) * np.exp(-tt * 120) * 0.6
    x = np.concatenate([click, np.zeros(int(0.11 * SR)), click * 0.8])
    if near < 0.5:
        x = verb(filt(x, SR, lo=400, hi=3500), 2.2, 0.55, seed=int(near * 100) + 7, bright=2500)
    else:
        x = st(x)
    x = x * np.array([1 - max(0, pan), 1 + min(0, pan)])
    return x


def bark(gain=0.03, n_barks=3):
    out = []
    for k in range(n_barks):
        n = int(0.16 * SR)
        tt = np.arange(n) / SR
        f = 540 - 220 * tt / 0.16
        out.append(filt(np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * rng.standard_normal(n), SR, lo=300, hi=1800) * np.exp(-tt * 18))
        out.append(np.zeros(int((0.22 + 0.08 * k) * SR)))
    return verb(np.concatenate(out) * gain, 2.0, 0.6, seed=332, bright=1800)


# dogs all over the barrio, until just before the videoke stops; then none
for t0, g in [(1.0, 0.03), (6.5, 0.035), (9.8, 0.025), (L['l04']['start'] + 1.0, 0.04), (L['l05']['end'] + 0.1, 0.03), (L['l06']['end'] + 0.1, 0.035)]:
    if t0 < VIDEOKE_OFF - 0.6:
        place(fx, bark(g, 3 + int(t0) % 2), t0)
# the tiktik: loud and far, then softer and nearer, never on a word
place(fx, tik(0.0, 0.3), L['l03']['end'] + 0.15, 2)          # LOUD, far (before "Tapos narinig namin")
place(fx, tik(0.2, -0.2), L['l04']['end'] + 0.25, -4)        # a little softer
place(fx, tik(0.6, 0.4), L['l05']['end'] + 0.45, -12)        # soft, closer, drier
place(fx, tik(1.0, -0.6), L['l06']['end'] + 0.12, -20)       # very soft, dry, at the left ear
place(fx, tik(1.0, 0.5), SILENCE + 0.55, -24)                # in the silence, right above
place(fx, tik(1.0, 0.2), DUR - 0.7, -22)                     # the loop: it is already close at frame 0
# garlic tied at the window, salt poured on the sill
tg = np.arange(int(1.2 * SR)) / SR
place(fx, st(filt(rng.standard_normal(len(tg)), SR, lo=1500, hi=6000) * (np.sin(np.pi * tg / 1.2) ** 2) * 0.018 * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tg))), L['l03']['start'] + 0.4)
ts_ = np.arange(int(1.8 * SR)) / SR
grains = filt(rng.standard_normal(len(ts_)) * (rng.random(len(ts_)) < 0.08), SR, lo=2500, hi=9000) * 0.06 * np.sin(np.pi * ts_ / 1.8)
place(fx, st(grains), L['l03']['start'] + 2.8)
# the bulb crackling as it flickers
crk = filt(rng.standard_normal(N), SR, lo=1500, hi=6000) * (rng.random(N) < 0.004) * 0.25
fx += st(crk * span(L['l06']['start'] - 0.7, SILENCE, 0.1))
# Lola's stool creaks once as she looks up
place(fx, lib('wood_stress'), L['l08']['start'] + 0.4, -14)
# the tongue: slow wet clicks as it lowers in the silence
for k, t0 in enumerate(np.arange(SILENCE + 0.3, REVEAL - 0.1, 0.27)):
    n = int(0.04 * SR)
    tt = np.arange(n) / SR
    place(fx, st(filt(rng.standard_normal(n), SR, lo=600, hi=3000) * np.exp(-tt * 90) * 0.02), t0)
# the subliminal face: a short swell and hit, between lines
place(fx, hs.reverse_swell(SR, [233.08, 349.23], 0.3, seed=341) * 0.8, SUB - 0.3)
place(fx, lib('perspective_whip'), SUB, -10)
# the face: a low hit under the stinger, and its breath
place(fx, lib('low_cinematic_hit'), REVEAL, -5)
tb = np.arange(int(1.0 * SR)) / SR
place(fx, st(filt(rng.standard_normal(len(tb)), SR, lo=500, hi=3500) * np.sin(np.pi * tb) ** 2 * 0.05), REVEAL + 0.1)
# the rooster in the black, too early; then maya birds at dawn
tr = np.arange(int(1.6 * SR)) / SR
f_r = 600 + 500 * np.sin(np.pi * np.minimum(tr / 1.2, 1)) ** 0.6 - 200 * (tr > 1.2) * (tr - 1.2) / 0.4
rooster = filt(np.sign(np.sin(2 * np.pi * np.cumsum(f_r) / SR)) * 0.5 + np.sin(4 * np.pi * np.cumsum(f_r) / SR) * 0.3, SR, lo=400, hi=3500) * np.minimum(1, tr * 8) * np.minimum(1, (1.6 - tr) * 4) * 0.035
place(fx, verb(rooster, 2.0, 0.5, seed=351, bright=3000), BLACK + 0.08)
for t0 in np.arange(DAWN + 0.5, LOOP_ON - 0.3, 0.9):
    n = int(0.07 * SR)
    tt = np.arange(n) / SR
    f = 3800 + 1200 * np.sin(np.pi * tt / 0.07)
    place(fx, st(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.07) * 0.012), t0 + rng.random() * 0.3)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep12-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep12TikTik',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (library voice, Filipino)', 'credits': '1324 for two takes (both generated; take 1 used)',
                       'prompt': 'docs/production/ep12-tiktik/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): G2/D3 mid-band drone; tremolo string clusters (G3-G#3-D4, +D#4/A4 on the face); the music-box theme detuned; a heartbeat 68-116 bpm from "Tik... tik" to the silence; a riser; one stinger in silence (the face); bowed metal at dawn',
        'the tiktik: a hard wet double click, loud and far (heavy distance reverb) before "Tapos narinig namin", then softer and drier in each gap, very soft and dry at the left ear after "tik.", once in the silence and once at the loop seam',
        'the barrio: kuliglig and frogs; dogs barking until just before the videoke stops; a videoke far off that stops mid-song and plays again for the loop; the bulb mains hum and its crackle as it flickers',
        'foley: garlic tied at the window, salt poured on the sill, the stool creaking, wet clicks as the tongue lowers, a swell and whip on the subliminal face, a breath at the face, a rooster in the black, maya birds at dawn',
        'silence: from just after "Nakatingin siya sa bubong" the score, crickets, frogs, hum and videoke drop out for 1.45 s before the stinger',
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
