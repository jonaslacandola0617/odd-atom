"""Episode 15 "Don't Pick Up the Baby" sound, to the Season 2 horror standard.

- Narrator: the ElevenLabs Taglish take (Juanito, scripts/ep15_voice.py), close and dry.
- The road: wind in the cogon, crickets and rice-field frogs; a jeepney's diesel coming, then idling.
- The cry: a newborn's cry, synthesized (never a real infant recording), faint under the hook from
  frame 0 and continuous across the loop seam; it stops just before "At tumitigil ang iyak."
- The weight: footsteps through the grass, the bench creaking, the fluorescent tube's ping and hum.
- The silence: the engine stalls as the tube flickers; then nothing but the cloth slipping back;
  ONE stinger in silence on the face; the tube pops out; a small giggle in the black. After that the
  crickets and frogs are gone. Morning: a rooster and birds.
Ducks 7 dB under speech; presence in the phone band; -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep15_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep15-baby-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep15-baby-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(15015)
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



# key times: must match K in src/horror/ep15/Episode15.tsx
CRY_STOP = L['l06']['start'] - 0.25
FLICK = L['l06']['end'] + 0.15
OPEN = L['l06']['end'] + 1.15
REVEAL = L['l06']['end'] + 1.55
OUT_T = L['l07']['start'] - 0.45
SUB = L['l04']['end'] + 0.3
WALK = L['l04']['start'] - 0.1
LOOP_ON = DUR - 1.6
STINGERS = [REVEAL]
B_T = L['l01']['end'] + 0.3          # the wide of the road (the jeepney passes)
C1_T = L['l03']['start'] - 0.3        # in the cab
C2_T = L['l03']['start'] + 3.6        # close on the bundle
D_T = L['l04']['start'] - 0.35        # its point of view
E_T = L['l05']['start'] - 0.4         # inside under the tube
G_T = L['l07']['start'] + 0.4         # the dark jeepney
MORN = L['l08']['start'] - 0.35       # morning


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


cab = span(C1_T, C2_T)
inside = span(E_T, OUT_T)
black = span(OUT_T, G_T, 0.01)
morning = span(MORN, LOOP_ON, 0.02)
dark = span(G_T, MORN)
night_out = np.clip(1 - cab - inside - black - morning - dark, 0, 1)
# the held silence: everything but the cloth drops out after the engine dies, back with the stinger
hush = env([(0, 1), (FLICK + 0.5, 1), (FLICK + 0.9, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1), (DUR, 1)])

OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v = filt(v, SR, lo=70)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = np.tanh(v * 1.4) / 1.4
    v = verb(v, 1.0, 0.07, seed=15, bright=3500)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
drone_e = env([(0, 0.7), (C2_T, 0.8), (E_T, 0.95), (L['l06']['start'], 1.15), (FLICK + 0.4, 1.1), (FLICK + 0.8, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1.6),
                (G_T, 1.1), (MORN, 0.5), (MORN + 1.0, 0.55), (LOOP_ON, 0.7), (DUR, 0.7)])
mus += st(hs.drone_mid(T, qf, drone_e, root=73.42) * 1.6)
str_e = env([(0, 0.45), (C2_T, 0.6), (E_T, 0.85), (L['l06']['start'], 1.15), (FLICK + 0.4, 1.1), (FLICK + 0.8, 0.0), (REVEAL - 0.02, 0.0), (REVEAL + 0.1, 1.6),
             (G_T + 1, 0.9), (MORN + 1.5, 0.35), (LOOP_ON, 0.45), (DUR, 0.45)])
trem = env([(0, 0.3), (E_T, 0.6), (L['l06']['start'], 0.9), (REVEAL, 1.0), (MORN, 0.2), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [146.83, 155.56, 220.0], str_e, trem, SR, seed=601) * 2.2)
mus += st(hs.strings(T, qf, [233.08, 329.63], env([(0, 0), (REVEAL - 0.02, 0), (REVEAL + 0.1, 1.2), (G_T + 3, 0.6), (MORN, 0), (DUR, 0)]), None, SR, seed=602))
for t0, rate, det, g in [(L['l02']['end'] + 0.05, 0.5, 0.982, -3.5), (MORN + 0.4, 0.62, 0.965, -3.0)]:
    place(mus, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0)), t0, g + 4)
place(mus, hs.reverse_swell(SR, [146.83, 220.0, 311.13], 0.5, seed=611), REVEAL - 0.5)
place(mus, hs.stinger(SR, seed=612, size=1.3), REVEAL)
place(mus, hs.heartbeat(SR, E_T, FLICK + 0.5, 66, 118, gain=0.95, seed=613), E_T)
place(mus, hs.riser(SR, 1.4, seed=614), L['l06']['start'] - 1.2)
place(mus, st(hs.metal_bow(SR, 4.0, 1040, seed=615)), MORN + 0.2)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-3.2)
mus *= hush[:, None]
mus *= env([(0, 1), (LOOP_ON, 1), (DUR - 0.3, db(-2.6)), (DUR, db(-2.6))])[:, None]
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ the road at night, the fields at dawn
amb = np.zeros((N, 2))
gust = 0.55 + 0.45 * np.sin(2 * np.pi * qf(0.11) * T) * np.sin(2 * np.pi * qf(0.037) * T)
rustle = np.stack([filt(rng.standard_normal(N), SR, lo=900, hi=5000), filt(rng.standard_normal(N), SR, lo=900, hi=5000)], 1)
out_all = night_out + dark
amb += rustle * ((0.012 * out_all + 0.004 * (cab + inside) + 0.006 * morning) * gust * hush)[:, None]
crick = np.zeros(N)
for f, rate, ph, g in [(4100, 0.8, 0.0, 1.0), (4700, 0.5, 2.0, 0.7), (3900, 0.65, 4.1, 0.6)]:
    train = (np.sin(2 * np.pi * qf(rate) * T + ph) > 0.6).astype(float)
    pulse = (np.sin(2 * np.pi * qf(28.0) * T + ph) > 0.2).astype(float)
    crick += np.sin(2 * np.pi * qf(f) * T) * train * pulse * g
# rice-field frogs, low and croaking
frog = np.zeros(N)
for f, rate, ph in [(520, 1.3, 0.3), (610, 0.9, 2.2)]:
    gate = (np.sin(2 * np.pi * qf(rate) * T + ph) > 0.85).astype(float)
    frog += np.sign(np.sin(2 * np.pi * qf(f / 8) * T)) * np.sin(2 * np.pi * qf(f) * T) * gate
# after the lights die the crickets and frogs are gone: only the wind
alive = night_out + 0.5 * (cab + inside)
amb += st(filt(crick, SR, lo=2500, hi=7500) * 0.007 * alive * hush)
amb += st(filt(frog, SR, lo=250, hi=1800) * 0.004 * alive * hush)
for t0 in np.arange(MORN + 0.3, LOOP_ON - 0.3, 0.55):
    n = int(0.07 * SR)
    tt = np.arange(n) / SR
    f = 3400 + 1500 * np.sin(np.pi * tt / 0.07)
    place(amb, st(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.07) * 0.010), t0 + rng.random() * 0.3)


def rooster(at, gain=0.05):
    segs = [(0.18, 700, 900), (0.16, 900, 1050), (0.55, 1050, 820)]
    x = []
    for d, f0, f1 in segs:
        n = int(d * SR)
        tt = np.arange(n) / SR
        f = np.linspace(f0, f1, n) * (1 + 0.02 * np.sin(2 * np.pi * 30 * tt))
        ph = 2 * np.pi * np.cumsum(f) / SR
        x.append(sum(np.sin(k * ph) / k for k in range(1, 6)) * np.sin(np.pi * tt / d) ** 0.5)
    y = filt(np.concatenate(x), SR, lo=500, hi=4500) * gain
    place(amb, verb(y, 1.5, 0.3, seed=699, bright=4000), at)


rooster(L['l08']['end'] + 0.05, 0.035)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))

# ------------------------------------------------------------------ the jeepney's diesel: running, then idling, then dead
def diesel(rate):
    ph = 2 * np.pi * qf(rate) * T
    pulses = (0.5 + 0.5 * np.sin(ph)) ** 8 + 0.6 * (0.5 + 0.5 * np.sin(ph * 0.5 + 0.7)) ** 10
    clatter = filt(rng.standard_normal(N), SR, lo=600, hi=2500) * pulses * 0.25
    return filt(pulses + clatter, SR, lo=45, hi=1100)


run_e = env([(0, 0.22), (B_T, 0.3), (B_T + 1.0, 0.75), (C1_T, 0.8), (C1_T + 2.2, 0.7), (C2_T - 0.6, 0.35), (C2_T, 0.0), (DUR, 0.0)])
run_e += env([(0, 0), (LOOP_ON, 0), (LOOP_ON + 0.01, 0.2), (DUR, 0.22)])
idle_e = env([(0, 0), (C2_T - 1.0, 0), (C2_T, 0.35), (D_T, 0.35), (E_T, 0.3), (FLICK, 0.3), (FLICK + 0.01, 0.0), (DUR, 0.0)])
muffle = 1 - 0.35 * (inside)
eng = (diesel(38.0) * run_e + diesel(21.0) * idle_e) * muffle * 0.05
amb_eng = np.stack([eng, eng], 1)
fx += amb_eng
# the engine stalls with the tube's flicker: three shudders, then nothing
for k, t0 in enumerate([FLICK, FLICK + 0.16, FLICK + 0.38]):
    n = int(0.22 * SR)
    tt = np.arange(n) / SR
    place(fx, st(filt(rng.standard_normal(n), SR, lo=40, hi=400) * np.exp(-tt * 14) * 0.12 * (0.8 ** k)), t0)

# ------------------------------------------------------------------ the cry: synthesized, never a real infant recording
def cry(seconds, seed):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    out = np.zeros(n)
    t0 = 0.0
    while t0 < seconds:
        d = 0.55 + r.random() * 0.4
        m = int(d * SR)
        tt = np.arange(m) / SR
        x = tt / d
        f0 = (400 + 140 * np.sin(np.pi * np.minimum(1, x * 1.6)) - 90 * x ** 3) * (1 + 0.015 * np.sin(2 * np.pi * 9 * tt)) * (1 + 0.02 * r.standard_normal(m).cumsum() / np.sqrt(m))
        ph = 2 * np.pi * np.cumsum(f0) / SR
        y = np.zeros(m)
        for k in range(1, 13):
            fk = k * f0
            w = np.exp(-((fk - 1150) / 420) ** 2) + 0.7 * np.exp(-((fk - 2600) / 600) ** 2) + 0.3 * np.exp(-((fk - 3900) / 700) ** 2) + 0.15
            y += np.sin(k * ph) * w / k ** 0.5
        y += r.standard_normal(m) * 0.25
        a = np.minimum(1, tt / 0.05) * np.minimum(1, (d - tt) / 0.14)
        i = int(t0 * SR)
        k2 = min(m, n - i)
        out[i:i + k2] += (y * a)[:k2]
        # a short catching inhale
        g = 0.22 + r.random() * 0.3
        mi = int(0.18 * SR)
        ii = int((t0 + d + 0.03) * SR)
        if ii + mi < n:
            ti = np.arange(mi) / SR
            out[ii:ii + mi] += filt(r.standard_normal(mi), SR, lo=1500, hi=6000) * np.sin(np.pi * ti / 0.18) * 0.12
        t0 += d + g + 0.05
    return out / (np.abs(out).max() + 1e-9)


c = cry(CRY_STOP + 1.6, 1515)
c = filt(c, SR, lo=250, hi=7000)
cry_lvl = env([(0, 0.55), (B_T, 0.55), (B_T + 0.05, 0.15), (C1_T, 0.15), (C1_T + 0.05, 0.22), (C2_T, 0.22), (C2_T + 0.05, 0.85), (D_T, 0.85), (E_T, 0.8), (CRY_STOP - 0.08, 0.8), (CRY_STOP, 0.0), (DUR, 0.0)])
loop_lvl = 0.55
cry_main = c[int(1.6 * SR):]
cry_loop = c[:int(1.6 * SR)]
cb = np.zeros(N)
cb[:len(cry_main)] += cry_main[:N]
seg = cry_loop[:N - int(LOOP_ON * SR)]
cb[int(LOOP_ON * SR):int(LOOP_ON * SR) + len(seg)] += seg
lvl = cry_lvl.copy()
lvl[int(LOOP_ON * SR):] = loop_lvl
cb *= lvl * (1 - speech * (1 - db(-8)))
cryst = verb(cb * 0.36, 1.2, 0.18, seed=1516, bright=6000)
fx += st(cryst)

# ------------------------------------------------------------------ footsteps through the grass, the bench, the tube
for k, t0 in enumerate(np.arange(WALK + 0.3, L['l04']['end'] + 0.2, 0.5)):
    n = int(0.16 * SR)
    tt = np.arange(n) / SR
    place(fx, st(filt(rng.standard_normal(n), SR, lo=1200, hi=6000) * np.exp(-tt * 18) * (0.025 + k * 0.006)), t0)
place(fx, lib('wood_stress'), E_T + 0.05, -18)
for k, t0 in enumerate([E_T, E_T + 0.12, E_T + 0.31]):
    n = int(0.03 * SR)
    tt = np.arange(n) / SR
    place(fx, st(np.sin(2 * np.pi * 2900 * tt) * np.exp(-tt * 160) * 0.035), t0)
tube_on = inside * env([(0, 1), (FLICK, 1), (OPEN - 0.2, 1), (OPEN, 0.0), (REVEAL, 0.0), (REVEAL + 0.01, 1), (DUR, 1)])
hum = filt(np.sin(2 * np.pi * qf(120) * T) + 0.5 * np.sin(2 * np.pi * qf(240) * T) + 0.3 * np.sign(np.sin(2 * np.pi * qf(120) * T)), SR, lo=100, hi=3000)
fx += st(hum * 0.006 * tube_on)
for t0 in np.arange(FLICK, REVEAL - 0.5, 0.11):
    if rng.random() < 0.6:
        n = int(0.02 * SR)
        tt = np.arange(n) / SR
        place(fx, st(filt(rng.standard_normal(n), SR, lo=2000, hi=8000) * np.exp(-tt * 200) * 0.02), t0)
# in the silence: only the cloth slipping back
n = int(0.4 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=1500, hi=7000) * np.sin(np.pi * tt / 0.4) * 0.012), OPEN)
# the reveal: a low hit under the stinger and a wet, toothy breath
place(fx, lib('low_cinematic_hit'), REVEAL, -5)
n = int(0.6 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=300, hi=3000) * np.sin(np.pi * tt / 0.6) * 0.03 * (1 + 0.5 * np.sin(2 * np.pi * 11 * tt))), REVEAL + 0.35)
# the tube pops and everything goes out
n = int(0.08 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=800, hi=8000) * np.exp(-tt * 50) * 0.12), OUT_T)
# in the black, small and close: a giggle
for k in range(3):
    n = int(0.07 * SR)
    tt = np.arange(n) / SR
    f = 620 - k * 40
    place(fx, st(filt(np.sin(2 * np.pi * f * tt) * (1 + 0.6 * np.sin(2 * np.pi * 2 * f * tt)) * np.sin(np.pi * tt / 0.07) * 0.018, SR, lo=300, hi=3500)), OUT_T + 0.12 + k * 0.09)
# the subliminal: a swell and a whip, between lines
place(fx, hs.reverse_swell(SR, [207.65, 311.13], 0.3, seed=651) * 0.8, SUB - 0.3)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep15-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep15DontPickUpTheBaby',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep15-baby/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep15-baby/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): D2/A2 mid-band drone; tremolo string clusters; the music-box theme detuned; a heartbeat 66-118 bpm from the tube to the stall; a riser; one stinger in silence (the face); bowed metal at morning',
        'the road: wind in the cogon, crickets and rice-field frogs (gone after the lights die), a jeepney diesel running then idling, then stalling; morning birds and a rooster',
        'the cry: a newborn cry synthesized from formant-weighted harmonics with inhales (no real infant recording), continuous across the loop seam; footsteps in grass; bench creak; fluorescent ping, hum and flicker; cloth slipping in the silence; a toothy breath; the tube popping; a small giggle in the black',
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
