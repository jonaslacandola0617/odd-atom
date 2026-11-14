"""Episode 35 "Bantay" (Season 4, folklore: the amalanhig at the lamay) sound.

Sound language: one wake, hour by hour. At nine the room murmurs its prayers; by eleven only a few voices and
cards; by one the tuko outside; at two only the fluorescent tube and the clock. At three the clock strikes and
the tuko stops. A breath fogs the coffin glass from inside, and that breath crosses the loop seam. Then a stiff
body's joints, straight heavy steps, chairs crashing, the watcher running in zigzags; dawn with a rooster.
A loop-quantised eerie score. -14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep35_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep35-bantay-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep35-bantay-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(35035)
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









# key times: must match K in src/horror/ep35/Episode35.tsx
l = lambda i: L[i]
FOG = (0.3, 3.4)
STREAKS = (l('l01')['end'] + 0.12, l('l01')['end'] + 0.85)
CUT_NINE = l('l02')['start'] - 0.3
CUT_ELEVEN = l('l03')['start'] - 0.3
CUT_ONE = l('l04')['start'] - 0.3
CUT_TWO = l('l05')['start'] - 0.3
CLOTH = (l('l05')['start'] + 0.8, l('l05')['start'] + 1.8)
CUT_CLOCK = l('l06')['start'] - 0.3
THREE = l('l06')['end'] - 0.6
CUT_STAND = l('l06')['end'] + 0.4
CUT_TURN = l('l08')['start'] - 0.3
TURNED = l('l08')['end'] + 0.15
CUT_CHASE = l('l08')['end'] + 0.6
CHASE = (l('l08')['end'] + 0.8, l('l08')['end'] + 4.8)
CUT_DAWN = l('l08')['end'] + 5.2
LOOP = DUR - 1.7
STINGERS = [STREAKS[0], CUT_STAND, TURNED]
# the body's straight line through the middle chairs (bodyAt / chairFalls in Episode35.tsx)
def body_z(t):
    k = min(1, max(0, (t - (CHASE[0] + 0.35)) / (CHASE[1] - (CHASE[0] + 0.35))))
    return -1.95 + (3.4 + 1.95) * k
CRASHES = [CHASE[0] + 0.35 + (z - 0.35 + 1.95) / 5.35 * (CHASE[1] - CHASE[0] - 0.35) for z in (-0.7, 0.4, 1.5)]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep35-{name}.mp3'
    SFX_USED[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    x = load(path, 2)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-12) * 0.1  # unit level: -20 dB RMS
    return x * db(gain_db)


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


def pan(x, p):
    x = x if x.ndim == 1 else x.mean(1)
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1)


def noise(seconds, lo, hi):
    return filt(rng.standard_normal(int(seconds * SR)), SR, lo=lo, hi=hi)


def hit(at, gain=0.3, f=46):
    n = int(0.9 * SR)
    tt = np.arange(n) / SR
    place(fx, st((np.sin(2 * np.pi * f * tt) + 0.6 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 5) * gain), at)


def loop_to(x, seconds):
    n = int(seconds * SR)
    reps = int(np.ceil(n / len(x))) + 1
    return np.concatenate([x] * reps)[:n]


def xloop(x, seconds, fade_s=0.25):
    """Loop a clip with short crossfades, so a 2 s effect becomes a bed without clicks."""
    f = int(fade_s * SR)
    x = st(x)
    seg = x.copy()
    seg[:f] *= np.linspace(0, 1, f)[:, None]
    seg[-f:] *= np.linspace(1, 0, f)[:, None]
    hop = len(seg) - f
    n = int(seconds * SR)
    out = np.zeros((n + len(seg), 2))
    for i in range(0, n, hop):
        out[i:i + len(seg)] += seg
    return out[:n]


def compress(x, thresh_db=-24.0, ratio=3.0, att=0.005, rel=0.15):
    """A gentle feed-forward compressor, so the narration carries the loudness without the limiter
    having to squash it (there is no score to carry it in this episode)."""
    e = np.abs(x)
    a, r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    env_ = np.zeros_like(e)
    lvl = 0.0
    for i in range(0, len(e), 48):  # 1 ms blocks
        m = e[i:i + 48].max()
        lvl = a ** 48 * lvl + (1 - a ** 48) * m if m > lvl else r ** 48 * lvl + (1 - r ** 48) * m
        env_[i:i + 48] = lvl
    over = np.maximum(0, 20 * np.log10(env_ + 1e-9) - thresh_db)
    y = x * 10 ** (-over * (1 - 1 / ratio) / 20)
    y = y * 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-12)) / 20)
    c = 10 ** ((-21.0 + 12.0) / 20)  # soft-clip what remains above 12 dB over the line's RMS (plosives)
    return np.tanh(y / c) * c







# ------------------------------------------------------------------ voice (dry, close)
voice = np.zeros((N, 2))
for lid, ln in L.items():
    v = load(VOICE / f'{lid}.wav')
    v = filt(v, SR, lo=80, hi=11000)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = compress(v)
    v = verb(v, 0.6, 0.04, seed=30, bright=3000)
    place(voice, v, ln['start'], gain=-1.0)
speech = np.zeros(N)
for ln in L.values():
    speech = np.maximum(speech, env([(0, 0), (ln['start'] - 0.1, 0), (ln['start'], 1), (ln['end'], 1), (ln['end'] + 0.25, 0), (DUR, 0)]))
duck = 1 - speech * (1 - db(-9))


OUT.mkdir(parents=True, exist_ok=True)
unit = lambda x: x / (np.sqrt(np.mean(x ** 2)) + 1e-12)
night = 1 - span(CUT_DAWN, LOOP, 0.002)  # everything but the dawn shot
dawn = 1 - night
glass = span(-1, CUT_NINE, 0.002) + span(LOOP, DUR + 1, 0.002)

# ------------------------------------------------------------------ beds: a wake in a house at night
amb = np.zeros((N, 2))
room = unit(np.stack([filt(rng.standard_normal(N), SR, lo=90, hi=1200), filt(rng.standard_normal(N), SR, lo=90, hi=1200)], 1))
amb += room * (0.010 * duck)[:, None]
# the fluorescent tube: a 60 Hz hum and its buzz; louder as the room empties
tube_e = env([(0, 0.6), (CUT_NINE, 0.5), (CUT_ELEVEN, 0.8), (CUT_ONE, 1.0), (CUT_TWO, 1.0), (CUT_CLOCK, 1.0), (CUT_CHASE, 1.0), (CUT_DAWN, 0.0), (LOOP, 0.6), (DUR, 0.6)])
tube = sum(np.sin(2 * np.pi * qf(120 * k) * T) / k for k in (1, 2, 3, 5)) + 0.3 * filt(rng.standard_normal(N), SR, lo=2000, hi=6000)
amb += st(tube * 0.0035 * tube_e * (0.6 + 0.4 * duck))
# the prayers: the whole room at nine, a few voices at eleven, none after
pr = xloop(sfx('prayers-3'), DUR)
pray_e = env([(0, 0.0), (CUT_NINE - 0.01, 0.0), (CUT_NINE, 1.0), (CUT_ELEVEN - 0.01, 1.0), (CUT_ELEVEN, 0.35), (CUT_ONE - 0.01, 0.35), (CUT_ONE, 0.0), (DUR, 0.0)])
amb += pr * (db(-14) * pray_e * (0.45 + 0.55 * duck))[:, None]
# cards at eleven, at the far table
c1 = sfx('cards-1')
for at in (CUT_ELEVEN + 0.2, CUT_ELEVEN + 2.6):
    if at < CUT_ONE - 1.0:
        place(amb, pan(c1, 0.6) * (0.4 + 0.6 * duck[int(at * SR):int(at * SR) + len(c1)])[:, None], at, -20)
# the tuko outside, from eleven, louder by one; it stops at three
tk = sfx('tuko-4')
for at in (CUT_ELEVEN + 1.5, CUT_ONE + 0.5, CUT_TWO + 0.4, CUT_CLOCK - 3.2):
    place(amb, pan(tk, -0.5) * (0.35 + 0.65 * duck[int(at * SR):int(at * SR) + len(tk)])[:, None], at, -17 if at < CUT_ONE else -13)
# the clock: a tick on whole seconds, loud in its own shot; it strikes three
tick = np.zeros(N)
for s in np.arange(1.0, DUR, 1.0):
    i = int(s * SR)
    n = int(0.03 * SR)
    tick[i:i + n] += filt(rng.standard_normal(n), SR, lo=1500, hi=7000)[:n] * np.exp(-np.arange(n) / SR * 160)
tick_e = env([(0, 0.0), (CUT_TWO, 0.0), (CUT_TWO + 0.01, 0.5), (CUT_CLOCK, 0.5), (CUT_CLOCK + 0.01, 0.9), (CUT_STAND, 0.9), (CUT_STAND + 0.01, 0.7), (CUT_CHASE, 0.7), (CUT_CHASE + 0.01, 0.0), (DUR, 0.0)])
amb += st(tick * 0.05 * tick_e)
fx = np.zeros((N, 2))


def chime(at, gain=0.09):
    n = int(2.6 * SR)
    tt = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in ((523.0, 1.0, 1.4), (1046.5, 0.5, 2.5), (1413.0, 0.35, 3.2), (2190.0, 0.15, 5.0)))
    place(fx, st(verb(x * gain, 1.2, 0.2, seed=int(at * 10))), at)


for k, at in enumerate((THREE, THREE + 0.9, THREE + 1.8)):
    chime(at, 0.07 if k == 0 else 0.1)
write(OUT / 'stem-ambience.wav', amb)


def breath(at, seconds=1.6, gain=0.05, muffled=True):
    """A slow breath, muffled behind glass (synthesized)."""
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    x = filt(rng.standard_normal(n), SR, lo=250, hi=1400 if muffled else 3500) * np.sin(np.pi * tt / seconds) ** 1.5
    place(fx, st(x * gain), at)


# the hook: a breath fogs the glass from inside; it crosses the loop seam
for at in (FOG[0], FOG[0] + 1.7):
    breath(at, 1.5, 0.05)
for at in (LOOP + 0.1,):
    breath(at, 1.9, 0.05)  # runs across the seam into frame 0
    breath(at - DUR, 1.9, 0.05)
# four fingers drawn down the glass, from inside: a squeak
n = int((STREAKS[1] - STREAKS[0]) * SR)
tt = np.arange(n) / SR
sq = np.sin(2 * np.pi * (1500 + 500 * np.sin(2 * np.pi * 3 * tt)) * tt) * rng.uniform(0.5, 1, n) * np.sin(np.pi * tt / tt[-1]) * 0.012
place(fx, st(filt(sq, SR, lo=900, hi=4000)), STREAKS[0])
# 2 a.m.: the cloth over the mirror slips off
n = int((CLOTH[1] - CLOTH[0]) * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=1500, hi=7000) * np.sin(np.pi * tt / tt[-1]) * 0.012), CLOTH[0])


def creak(at, seconds=0.9, f0=110, gain=0.05):
    """A stiff joint or the coffin's wood straining (synthesized stick-slip)."""
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    f = f0 * (1 + 0.3 * np.sin(2 * np.pi * 1.7 * tt))
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * rng.uniform(0.5, 1, n)
    x = filt(x, SR, lo=150, hi=2200) * np.sin(np.pi * tt / seconds)
    place(fx, st(x * gain), at)


# it stands: the coffin's wood, the joints that do not bend
creak(CUT_STAND + 0.1, 1.2, 95, 0.05)
creak(CUT_STAND + 1.5, 0.8, 140, 0.04)
# it turns, stiffly
creak(CUT_TURN + 0.15, 0.9, 120, 0.04)


def thud(at, gain=0.08, pan_=0.0):
    n = int(0.22 * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * (70 - 30 * tt) * tt) * np.exp(-tt * 22) + 0.4 * filt(rng.standard_normal(n), SR, lo=200, hi=1500) * np.exp(-tt * 40)
    place(fx, pan(x * gain, pan_), at)


# the chase: its straight heavy steps; the watcher's quick bare feet zigzagging; three chairs crash
for at in np.arange(CHASE[0] + 0.35, CHASE[1], 0.34):
    thud(at, 0.09, 0.0)
for k, at in enumerate(np.arange(CHASE[0], CHASE[1] - 0.2, 0.17)):
    n = int(0.06 * SR)
    x = filt(rng.standard_normal(n), SR, lo=600, hi=4000) * np.exp(-np.arange(n) / SR * 70)
    place(fx, pan(x * 0.05, 0.5 * np.sin(k * 0.9)), at)
for at, name, g in zip(CRASHES, ('chairs-3', 'chairs-1', 'chairs-3'), (-6, -4, -6)):
    place(fx, sfx(name), at - 0.05, g)
# the screen door bangs as the watcher gets out
thud(CHASE[1] - 0.1, 0.12, 0.3)
creak(CHASE[1] - 0.05, 0.4, 260, 0.03)
hit(TURNED, 0.2, 41)
# dawn: a rooster far off, morning birds
n = int(1.1 * SR)
tt = np.arange(n) / SR
f = 600 + 350 * np.sin(np.pi * np.minimum(1, tt / 0.9)) - 300 * (tt > 0.8) * (tt - 0.8) / 0.3
rooster = filt(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + np.sin(2 * np.pi * np.cumsum(f) / SR), SR, lo=400, hi=3000) * np.sin(np.pi * tt / tt[-1]) ** 0.5
place(fx, pan(verb(rooster * 0.02, 1.5, 0.35, seed=7), 0.4), CUT_DAWN + 0.3)
birds = np.zeros(N)
for f0, r0 in ((3200, 2.3), (4100, 3.7)):
    birds += np.sin(2 * np.pi * (f0 + 400 * np.sin(2 * np.pi * 9 * T)) * T) * (np.sin(2 * np.pi * r0 * T) > 0.85)
amb_d = st(birds * 0.003 * dawn)
fx += amb_d
write(OUT / 'stem-foley-fx.wav', fx)
# ------------------------------------------------------------------ the score (eerie, low; loop-quantised)
mus = np.zeros((N, 2))
lv = 0.85
drone_e = env([(0, lv), (CUT_NINE, 0.6), (CUT_ELEVEN, 0.8), (CUT_ONE, 0.9), (CUT_TWO, 1.1), (CUT_CLOCK, 1.0), (CUT_STAND, 1.1), (CUT_TURN, 1.4), (CUT_CHASE, 1.7), (CUT_DAWN, 0.5), (LOOP, lv), (DUR, lv)])
mus += st(hs.drone_mid(T, qf, drone_e, root=43.65) * 1.8)
str_e = env([(0, 0.6), (CUT_NINE, 0.35), (CUT_ELEVEN, 0.55), (CUT_ONE, 0.7), (CUT_TWO, 0.8), (CUT_STAND, 0.9), (CUT_TURN, 1.3), (CUT_CHASE, 1.6), (CUT_DAWN, 0.4), (LOOP, 0.6), (DUR, 0.6)])
trem = env([(0, 0.5), (CUT_NINE, 0.15), (CUT_ONE, 0.4), (CUT_TWO, 0.7), (CUT_STAND, 1.0), (CUT_DAWN, 0.2), (LOOP, 0.5), (DUR, 0.5)])
mus += st(hs.strings(T, qf, [87.31, 92.5, 130.81], str_e, trem, SR, seed=3501) * 2.3)
# an original music-box lullaby, slowing like a wake's last hour
THEME = [261.63, 311.13, 293.66, 261.63, 0, 233.08, 261.63, 196.0, 0, 207.65]
place(mus, hs.music_box(SR, THEME, 0.5, 0.96, seed=3503), CUT_ELEVEN + 0.3, -2.0)
place(mus, st(hs.metal_bow(SR, 4.5, 980.0, seed=3504)), CUT_TWO + 0.2, 1.0)
place(mus, st(hs.heartbeat(SR, CUT_STAND, CUT_DAWN, 70, 120, gain=0.55, seed=3505)), CUT_STAND)
place(mus, st(hs.reverse_swell(SR, [87.31, 130.81, 174.61], 0.8, seed=3506)), CUT_STAND - 0.8)
place(mus, hs.stinger(SR, seed=3507, size=0.6), STREAKS[0])
place(mus, hs.stinger(SR, seed=3509, size=0.9), CUT_STAND)
place(mus, st(hs.riser(SR, 1.0, seed=3510)), TURNED - 1.0, -4.0)
place(mus, hs.stinger(SR, seed=3511, size=1.2), TURNED)
mus *= (1 - speech * (1 - db(-6)))[:, None] * (1 - 0.6 * dawn)[:, None]
write(OUT / 'stem-score.wav', mus)
tvb = np.zeros((N, 2))
bed = amb + fx + mus
PRESENCE = hs.presence(voice, bed, TL['lines'], SR)

# ------------------------------------------------------------------ every line at least 4.5 dB over everything else (lift at most 8 dB)
LIFTS = {}
for lid, l in L.items():
    a, b = int(l['start'] * SR), int((l['end'] + 0.12) * SR)
    rest = (tvb + amb + mus + fx)[a:b].mean(1)
    m = 20 * np.log10(np.sqrt(np.mean(voice[a:b].mean(1) ** 2)) + 1e-12) - 20 * np.log10(np.sqrt(np.mean(rest ** 2)) + 1e-12)
    LIFTS[lid] = round(float(min(8.0, max(0.0, 4.6 - m))), 1)
    voice[a:b] *= db(LIFTS[lid])
write(OUT / 'stem-voice.wav', voice)
PRESENCE = hs.presence(voice, bed, TL['lines'], SR)

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
                    'voice_minus_bed_db': round(float(rms_db(voice[a:b].mean(1)) - rms_db(bed[a:b].mean(1))), 1)})
clash = [h for h in STINGERS for l in L.values() if l['start'] - 0.05 <= h <= l['end'] + 0.1]
head = rms_db(mix[:SR // 4].mean(1))
tail = rms_db(mix[-SR // 4:].mean(1))
for stem in OUT.glob('stem-*.wav'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(stem), '-c:a', 'flac', str(stem.with_suffix('.flac'))], check=True)
    stem.unlink()
take = ROOT / 'public/assets/audio/eleven-takes/ep35-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep35Bantay',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep35-bantay/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep35-bantay/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, an original slowing music-box lullaby, bowed metal, a heartbeat from the moment it stands, a reversed swell, a riser and stingers (scripts/horror_score.py); loop-quantised',
        'the wake: room tone, the fluorescent tube, the clock ticking on whole seconds and striking three; the breath behind the coffin glass (across the loop seam), fingers on the glass, the cloth slipping off the mirror, stiff creaks, its heavy straight steps, the watcher running, the door, a low hit, a far rooster and morning birds (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'ca5s2GetYsp9lHxp7QWQ', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (about 68 credits per prompt); picked by measurement, not by listening'},
    'music_presence_note': 'music_presence measures the whole non-voice bed (score, ambience, effects) against the voice',
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
