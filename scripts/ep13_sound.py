"""Episode 13 "Half of Her" sound, to the Season 2 horror standard (docs/production/EPISODE_PLAYBOOK.md).

- Narrator: the ElevenLabs Taglish take (Juanito, scripts/ep13_voice.py), close and dry.
- Wings: big leathery beats when she unfolds in the grove, crosses the moon, passes the capiz and
  flies back before dawn ("Mauuna mong maririnig ang mga pakpak").
- The barrio at night: kuliglig, frogs, banana leaves, a tuko, dogs far off; the insects and frogs
  stop dead as the wings pass over the hut. Inside: the gasera's hiss, the wife's slow breathing.
- Score (scripts/horror_score.py): drone, tremolo clusters, the detuned music box, a heartbeat from
  the wings to the silence, a riser, ONE stinger in silence (her face in the broken capiz), bowed
  metal at dawn.
- The run: the bamboo ladder, grass, breath; the salt poured; a far shriek in the gap before the
  last line (her end is off-screen, as sound); dawn: a rooster and birds.
Ducks 7 dB under speech; presence in the phone band; -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep13_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep13-half-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep13-half-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(13013)
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



# key times: must match K in src/horror/ep13/Episode13.tsx (the same rules on the same timeline)
mid = lambda l: (l['start'] + l['end']) / 2
SPLIT = L['l04']['start'] + 0.6
LEAN = mid(L['l06']) + 0.3
SILENCE = L['l07']['end'] + 0.25
REVEAL = L['l07']['end'] + 1.6
RUN = L['l08']['start'] - 0.25
POUR = L['l08']['end'] - 1.6
SCREAM = L['l09']['end'] + 0.35
DAWN = L['l10']['start'] - 0.4
SUB = L['l06']['end'] + 0.35
LOOP_ON = DUR - 1.6
STINGERS = [REVEAL]
DAY = (L['l03']['start'] - 0.3, L['l04']['start'] - 0.4)
INSIDE = [(mid(L['l05']) + 0.4, RUN), (L['l10']['end'] + 0.1, LOOP_ON)]
WINGS_PASS = L['l06']['start'] + 0.2  # the wings pass outside the capiz: the insects stop here


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


day = span(*DAY)
inside = np.minimum(1, sum(span(a, b) for a, b in INSIDE))
dawn = span(DAWN, LOOP_ON, 0.05)
predawn = span(L['l09']['start'] - 0.2, DAWN, 0.05)
night = np.clip(1 - day - dawn - predawn, 0, 1)
outdoor = np.clip(1 - inside, 0, 1)
hush = env([(0, 1), (SILENCE - 0.05, 1), (SILENCE + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1), (DUR, 1)])
insects_on = np.maximum(env([(0, 1), (WINGS_PASS - 0.02, 1), (WINGS_PASS, 0), (DUR, 0)]), span(LOOP_ON, DUR + 1, 0.3))

OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v = filt(v, SR, lo=70)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = np.tanh(v * 1.4) / 1.4
    v = verb(v, 1.0, 0.07, seed=13, bright=3500)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
drone_e = env([(0, 0.7), (DAY[0], 0.7), (DAY[0] + 0.1, 0.35), (DAY[1], 0.35), (DAY[1] + 0.1, 0.9), (L['l06']['start'], 1.05), (SILENCE, 1.2), (SILENCE + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1.5),
                (RUN + 1.5, 1.2), (SCREAM, 1.3), (SCREAM + 0.6, 0.3), (DAWN, 0.3), (DAWN + 1.0, 0.55), (LOOP_ON, 0.65), (DUR, 0.7)])
mus += st(hs.drone_mid(T, qf, drone_e, root=92.5) * 1.6)
str_e = env([(0, 0.5), (DAY[0], 0.5), (DAY[0] + 0.1, 0.2), (DAY[1], 0.2), (DAY[1] + 0.2, 0.8), (L['l06']['start'], 1.0), (SILENCE, 1.2), (SILENCE + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL + 0.1, 1.5),
             (RUN + 2, 1.2), (SCREAM + 0.6, 0.2), (DAWN + 1.5, 0.4), (LOOP_ON, 0.5), (DUR, 0.5)])
trem = env([(0, 0.3), (L['l04']['start'], 0.6), (L['l06']['start'], 0.9), (REVEAL, 1.0), (RUN, 1.0), (DAWN, 0.2), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [185.0, 196.0, 277.18], str_e, trem, SR, seed=401) * 2.2)
mus += st(hs.strings(T, qf, [293.66, 415.3], env([(0, 0), (REVEAL - 0.02, 0), (REVEAL + 0.1, 1.2), (RUN + 3, 0.8), (SCREAM, 0.0), (DUR, 0)]), None, SR, seed=402))
for t0, rate, det, g in [(L['l01']['end'] + 0.1, 0.45, 0.985, -3.5), (L['l03']['start'] + 0.1, 0.5, 1.0, -4.0), (DAWN + 0.8, 0.66, 0.965, -3.0)]:
    place(mus, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0)), t0, g + 4)
place(mus, hs.reverse_swell(SR, [185.0, 277.18, 392.0], 0.5, seed=411), REVEAL - 0.5)
place(mus, hs.stinger(SR, seed=412, size=1.25), REVEAL)
place(mus, hs.heartbeat(SR, L['l06']['start'], SILENCE, 66, 118, gain=0.95, seed=413), L['l06']['start'])
place(mus, hs.heartbeat(SR, RUN, SCREAM - 0.05, 110, 128, gain=0.8, seed=414), RUN)
place(mus, hs.riser(SR, 1.6, seed=415), SILENCE - 1.6)
place(mus, st(hs.metal_bow(SR, 4.0, 1250, seed=416)), DAWN + 0.3)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-4.0)
mus *= hush[:, None]
mus *= env([(0, 1), (LOOP_ON, 1), (DUR - 0.3, db(-2.6)), (DUR, db(-2.6))])[:, None]
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ the barrio
amb = np.zeros((N, 2))
crick = np.zeros(N)
for f, rate, ph, g in [(4400, 1.05, 0.0, 1.0), (4050, 0.8, 2.1, 0.85), (4950, 1.45, 3.9, 0.7), (3700, 0.62, 1.2, 0.6)]:
    train = (np.sin(2 * np.pi * qf(rate) * T + ph) > 0.45).astype(float)
    pulse = (np.sin(2 * np.pi * qf(29.0) * T + ph) > 0.2).astype(float)
    crick += np.sin(2 * np.pi * qf(f) * T) * train * pulse * g
crick = filt(crick, SR, lo=2500, hi=7500)
frog = filt(np.sin(2 * np.pi * qf(290) * T) * (np.sin(2 * np.pi * qf(0.66) * T) > 0.85) * (np.sin(2 * np.pi * qf(22) * T) > 0), SR, lo=200, hi=1500)
leaves = filt(rng.standard_normal(N), SR, lo=500, hi=4000) * (0.5 + 0.5 * np.sin(2 * np.pi * qf(0.13) * T) ** 2)
amb += st((crick * 0.011 + frog * 0.007) * insects_on * night * (0.45 + 0.55 * outdoor) * hush)
amb += st(leaves * 0.006 * night * outdoor * hush)
# inside: the gasera's hiss and the wife's slow breathing
gas = filt(rng.standard_normal(N), SR, lo=2000, hi=8000) * 0.003
breath_env = np.maximum(0, np.sin(2 * np.pi * qf(0.22) * T)) ** 3
breath = filt(rng.standard_normal(N), SR, lo=300, hi=1800) * breath_env * 0.006
amb += st((gas + breath) * inside * hush)
# by day: birds and a light breeze
for t0 in np.arange(DAY[0] + 0.2, DAY[1], 0.55):
    n = int(0.06 * SR)
    tt = np.arange(n) / SR
    f = 4200 + 900 * np.sin(np.pi * tt / 0.06)
    place(amb, st(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.06) * 0.012), t0 + rng.random() * 0.2)
amb += st(filt(rng.standard_normal(N), SR, lo=300, hi=2500) * 0.005 * (day + dawn))
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def flap(gain=0.08, near=1.0):
    """One leathery wing beat: a low thump, a membrane flutter, a whoosh."""
    n = int(0.42 * SR)
    tt = np.arange(n) / SR
    thump = np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 18)
    flutter = filt(rng.standard_normal(n), SR, lo=150, hi=1400) * np.exp(-((tt - 0.1) / 0.08) ** 2) * (1 + 0.5 * np.sin(2 * np.pi * 38 * tt))
    whoosh = filt(rng.standard_normal(n), SR, lo=300, hi=2500) * np.sin(np.pi * tt / 0.42) ** 2 * 0.5
    x = (thump * 0.8 + flutter + whoosh) * gain
    return verb(x, 1.2 if near > 0.5 else 2.2, 0.15 if near > 0.5 else 0.45, seed=int(gain * 1000) + 5, bright=2500)


def beats(t0, t1, period, gain, near=1.0):
    for t in np.arange(t0, t1, period):
        place(fx, flap(gain, near), t)


def bark(gain=0.03):
    out = []
    for k in range(3):
        n = int(0.16 * SR)
        tt = np.arange(n) / SR
        f = 540 - 220 * tt / 0.16
        out.append(filt(np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * rng.standard_normal(n), SR, lo=300, hi=1800) * np.exp(-tt * 18))
        out.append(np.zeros(int((0.22 + 0.08 * k) * SR)))
    return verb(np.concatenate(out) * gain, 2.0, 0.6, seed=432, bright=1800)


place(fx, bark(0.03), 2.0)
place(fx, bark(0.025), L['l02']['start'] + 1.5)
# the separation: a deep breath and cloth, then the wings unfold and beat (no gore)
tb = np.arange(int(1.4 * SR)) / SR
place(fx, st(filt(rng.standard_normal(len(tb)), SR, lo=200, hi=1600) * np.sin(np.pi * tb / 1.4) ** 2 * 0.05), SPLIT - 0.4)
beats(SPLIT + 1.2, L['l04']['end'] + 0.7, 0.5, 0.08)
# crossing the moon towards the hut
beats(L['l05']['start'] - 0.3, mid(L['l05']) + 0.4, 0.55, 0.06, near=0)
# "Mauuna mong maririnig ang mga pakpak": the wings pass right outside the capiz
beats(L['l06']['start'] - 0.4, L['l06']['start'] + 1.6, 0.48, 0.12)
# the gasera flame: a soft gutter as it leans
tg = np.arange(int(0.8 * SR)) / SR
place(fx, st(filt(rng.standard_normal(len(tg)), SR, lo=800, hi=4000) * np.sin(np.pi * tg / 0.8) * 0.02), LEAN - 0.1)
# the subliminal face: a swell and a whip, between lines
place(fx, hs.reverse_swell(SR, [233.08, 349.23], 0.3, seed=441) * 0.8, SUB - 0.3)
place(fx, lib('perspective_whip'), SUB, -10)
# the tongue: slow wet clicks in the silence
for t0 in np.arange(SILENCE + 0.2, REVEAL - 0.1, 0.26):
    n = int(0.04 * SR)
    tt = np.arange(n) / SR
    place(fx, st(filt(rng.standard_normal(n), SR, lo=600, hi=3000) * np.exp(-tt * 90) * 0.022), t0)
# the face: a low hit under the stinger, a hiss
place(fx, lib('low_cinematic_hit'), REVEAL, -5)
th = np.arange(int(0.9 * SR)) / SR
place(fx, st(filt(rng.standard_normal(len(th)), SR, lo=1500, hi=6000) * np.sin(np.pi * th / 0.9) * 0.05), REVEAL + 0.15)
# the run: bamboo rungs, then feet in the grass, breath
for k, t0 in enumerate(np.arange(RUN + 0.1, RUN + 1.0, 0.24)):
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    place(fx, st(np.sin(2 * np.pi * (380 + 40 * k) * tt) * np.exp(-tt * 70) * 0.05 + filt(rng.standard_normal(n), SR, lo=500, hi=3000) * np.exp(-tt * 90) * 0.02), t0)
for t0 in np.arange(RUN + 1.1, POUR, 0.3):
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    place(fx, st(filt(rng.standard_normal(n), SR, lo=800, hi=5000) * np.exp(-tt * 25) * 0.03), t0)
tr = np.arange(int((POUR - RUN) * SR)) / SR
place(fx, st(filt(rng.standard_normal(len(tr)), SR, lo=300, hi=1500) * (np.maximum(0, np.sin(2 * np.pi * 1.6 * tr)) ** 4) * 0.02), RUN + 0.3)
# the salt poured on the open waist
ts_ = np.arange(int(1.4 * SR)) / SR
place(fx, st(filt(rng.standard_normal(len(ts_)) * (rng.random(len(ts_)) < 0.1), SR, lo=2500, hi=9000) * 0.07 * np.sin(np.pi * ts_ / 1.4)), POUR + 0.2)
# she comes back too late: wings far, then a shriek far off, then nothing
beats(L['l09']['start'] - 0.1, SCREAM - 0.2, 0.5, 0.06, near=0)
tsc = np.arange(int(1.3 * SR)) / SR
fs = 900 + 700 * np.sin(np.pi * np.minimum(tsc / 0.5, 1)) - 500 * np.maximum(0, tsc - 0.5)
shriek = filt(np.sin(2 * np.pi * np.cumsum(fs) / SR) + 0.6 * np.sin(4 * np.pi * np.cumsum(fs) / SR) + 0.3 * rng.standard_normal(len(tsc)), SR, lo=500, hi=4000) * np.minimum(1, tsc * 10) * np.exp(-tsc * 2.2) * 0.06
place(fx, verb(shriek, 2.6, 0.6, seed=451, bright=3000), SCREAM)
# dawn: a rooster, birds
trr = np.arange(int(1.6 * SR)) / SR
f_r = 600 + 500 * np.sin(np.pi * np.minimum(trr / 1.2, 1)) ** 0.6 - 200 * (trr > 1.2) * (trr - 1.2) / 0.4
rooster = filt(np.sign(np.sin(2 * np.pi * np.cumsum(f_r) / SR)) * 0.5 + np.sin(4 * np.pi * np.cumsum(f_r) / SR) * 0.3, SR, lo=400, hi=3500) * np.minimum(1, trr * 8) * np.minimum(1, (1.6 - trr) * 4) * 0.03
place(fx, verb(rooster, 2.0, 0.5, seed=461, bright=3000), DAWN + 0.1)
for t0 in np.arange(DAWN + 0.8, LOOP_ON - 0.3, 0.8):
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
take = ROOT / 'public/assets/audio/eleven-takes/ep13-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep13HalfOfHer',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep13-half/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep13-half/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): F#2/C#3 mid-band drone; tremolo string clusters; the music-box theme detuned; a heartbeat 66-118 bpm from the wings to the silence; a riser; one stinger in silence (her face in the capiz); bowed metal at dawn',
        'wings: leathery beats (low thumps with a membrane flutter and a whoosh) as she unfolds, crosses the moon, passes outside the capiz, and flies back at predawn',
        'the barrio: kuliglig, frogs, banana leaves in the wind, a tuko, dogs far off; the insects and frogs stop dead as the wings pass the hut; inside: the gasera hiss and the wife breathing slowly',
        'foley: a deep breath and cloth as she separates (no gore); wet clicks as the tongue lowers; the bamboo ladder, grass and breath as he runs; salt poured; a far shriek in the gap before the last line, then nothing; a rooster and birds at dawn',
        'silence: from just after "Huwag kang titingala" everything drops out for 1.35 s before the stinger',
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
