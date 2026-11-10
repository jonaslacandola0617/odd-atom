"""Episode 2 "The Mask on Channel 11" sound: archive narrator (MBROLA us1), the TV in the
room (sports murmur, the intruder's buzz, his warped laughter and humming, static), an
original score, foley and Curio library cues.  The end flows back into the frame-0 buzz.

Inputs: voice lines from scripts/ep02_voice.py, src/data/ep02-mask-v1-timeline.json,
Curio library cues (user-authorised).  Everything else is synthesised here (seeded).
The intruder's sounds are synthesised (espeak-ng formants + pitch warping); no audio
from the real 1987 broadcast is used, and his hummed tune is an original melody.
Outputs FLAC stems, mix.m4a and PROVENANCE.json under public/assets/audio/ep02-mask-v1/.
Run: python3 scripts/ep02_sound.py
"""
import hashlib, json, subprocess, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep02-mask-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep02-mask-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(DUR * SR)
T = np.arange(N) / SR
rng = np.random.default_rng(1122)
LINES = {l['id']: l for l in TL['lines']}


def qf(f):
    """Snap a frequency to a whole number of cycles over the episode, so every
    continuous tone (and every beat between two tones) has the same phase at the
    last sample as at the first: the loop has no click and no level jump."""
    return round(f * DUR) / DUR


def db(x):
    return 10 ** (x / 20)


def st(x):
    return np.stack([x, x], 1) if x.ndim == 1 else x


def fft_filter(x, lo=None, hi=None, sr=SR, slope=1.0):
    """Zero-phase band filter with smooth (Butterworth-like) magnitude."""
    x = np.asarray(x, np.float64)
    if x.ndim == 2:
        return np.stack([fft_filter(x[:, c], lo, hi, sr, slope) for c in range(x.shape[1])], 1)
    n = len(x)
    f = np.fft.rfftfreq(n, 1 / sr)
    X = np.fft.rfft(x)
    g = np.ones_like(f)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** (4 * slope))
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (4 * slope))
    return np.fft.irfft(X * g, n)


def reverb(x, seconds, wet, seed, bright=6000):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)], 1) * np.exp(-6.9 * t / seconds)[:, None]
    ir = fft_filter(ir, hi=bright)
    ir /= np.sqrt((ir ** 2).sum() / 2)
    x = st(x)
    m = 1 << int(np.ceil(np.log2(len(x) + n)))
    out = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], m) * np.fft.rfft(ir[:, c], m), m)[: len(x)] for c in range(2)], 1)
    return x * (1 - wet) + out * wet


def place(bus, clip, at, gain=0.0):
    i = int(at * SR)
    if i >= len(bus):
        return
    clip = st(clip)
    n = min(len(clip), len(bus) - i)
    bus[i:i + n] += clip[:n] * db(gain)


def env(points):
    xs, ys = zip(*points)
    return np.interp(T, xs, ys)


def load_wav(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f64le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float64).copy()


USED = {}


def lib(name):
    path = next(LIB.rglob(f'*_{name}_v1.flac'))
    USED[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f64le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float64).reshape(-1, 2).copy()


def write(path, x):
    x = np.clip(st(x), -1, 1)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())


def tone(freqs, dur, amps=None, decay=None, phase=0.0):
    t = np.arange(int(dur * SR)) / SR
    amps = amps or [1] * len(freqs)
    y = sum(a * np.sin(2 * np.pi * f * t + phase) for f, a in zip(freqs, amps))
    if decay:
        y *= np.exp(-t / decay)
    return y


def plus(*xs):
    n = max(len(x) for x in xs)
    return sum(np.pad(x, (0, n - len(x))) for x in xs)


def fade(x, a=0.01, b=0.01):
    n = len(x)
    e = np.ones(n)
    ia, ib = int(a * SR), int(b * SR)
    if ia:
        e[:ia] = np.linspace(0, 1, ia)
    if ib:
        e[-ib:] = np.linspace(1, 0, ib)
    return x * e if x.ndim == 1 else x * e[:, None]


# key times (must match K in src/horror/ep02/Episode02.tsx)
SPORTS_OFF, MASK1, LEVER, MASK1_END = 10.5, 10.9, 17.55, 17.9
TV_SHOW, BLACK2, MASK2, CAN_UP, SWAT, STATIC_ON, SUB = 25.4, 29.1, 29.5, 32.6, 39.6, 43.6, 55.3
LOOP_ON = DUR - 0.6
OUT.mkdir(parents=True, exist_ok=True)
TMP = OUT / 'tmp'
TMP.mkdir(exist_ok=True)


def espeak(text, args):
    p = TMP / 'e.wav'
    subprocess.run(['espeak-ng'] + args + ['-w', str(p), text], check=True, capture_output=True)
    return load_wav(p)


def warp(x, depth=0.06, rate=3.0, seed=0):
    """Wobbly varispeed (a stretched tape / bad link) by resampling against a modulated clock."""
    r = np.random.default_rng(seed)
    n = len(x)
    t = np.arange(n) / SR
    speed = 1 + depth * np.sin(2 * np.pi * rate * t + r.random() * 6) + depth * 0.5 * np.sin(2 * np.pi * rate * 2.7 * t)
    pos = np.cumsum(speed)
    pos = pos[pos < n - 1]
    return np.interp(pos, np.arange(n), x)


def crush(x, bits=5, hold=3):
    y = np.repeat(x[::hold], hold)[: len(x)]
    q = 2 ** bits
    return np.round(y * q) / q


def tvspeaker(x, drive=2.0):
    x = fft_filter(x, lo=280, hi=3600, slope=1.5)
    return np.tanh(x * drive) / np.tanh(drive)


# ------------------------------------------------------------------ voice: archive narrator
voice = np.zeros((N, 2))
for lid, l in LINES.items():
    v = load_wav(OUT / 'voice' / f'{lid}.wav')
    v /= np.abs(v).max() + 1e-9
    v = fft_filter(v, lo=110, hi=7000)
    v = np.tanh(v * 1.3) / np.tanh(1.3)
    v = reverb(v, 0.6, 0.12, seed=21, bright=5000)
    place(voice, v, l['start'], gain=-2.0)
write(OUT / 'stem-voice.wav', voice)

# ------------------------------------------------------------------ the TV: what is on the air
tv = np.zeros((N, 2))


def seg(a, b, fa=0.01, fb=0.01):
    return env([(0, 0), (max(0, a - 1e-3), 0), (a, 1), (b, 1), (b + 1e-3, 0), (DUR, 0)]) if a > 0 else env([(0, 1), (b, 1), (b + 1e-3, 0), (DUR, 0)])


# the intruder's carrier: a harsh 60 Hz buzz with harmonics; it is on at frame 0 and at the end
buzz_env = np.clip(seg(0, 4.4) + seg(MASK1, MASK1_END) + env([(0, 0), (LOOP_ON + 0.1, 0), (LOOP_ON + 0.12, 1), (DUR, 1)]), 0, 1)
buzz = sum(np.sign(np.sin(2 * np.pi * qf(59.94) * k * T + k)) / k ** 1.3 for k in (1, 2, 3, 5)) + 0.4 * fft_filter(rng.standard_normal(N), lo=1500, hi=5000)
buzz = tvspeaker(buzz * 0.5, 1.6) * 0.075 * (0.85 + 0.15 * np.sin(2 * np.pi * qf(0.7) * T))
tv += st(buzz * buzz_env)
# sports murmur: a generic anchor voice through the TV speaker (no real words from the broadcast)
sports_txt = 'and in the fourth quarter, the defence held on, and that was the story of the afternoon. coming up after the break, the scores from around the league.'
murmur = tvspeaker(espeak(sports_txt, ['-v', 'us-mbrola-2', '-s', '175', '-p', '45']), 1.4)
place(tv, murmur[: int((SPORTS_OFF - 4.4) * SR)] * 0.07, 4.4)
back_txt = 'well. we are back. and if you are wondering what just happened, so are we. now, on to the scores.'
murmur2 = tvspeaker(espeak(back_txt, ['-v', 'us-mbrola-2', '-s', '160', '-p', '45']), 1.4)
place(tv, murmur2[: int((TV_SHOW - 18.3) * SR)] * 0.06, 18.3)
# the sci-fi show: wind and sea, a thin theremin-like synth (original)
tt = np.arange(int((BLACK2 - TV_SHOW) * SR)) / SR
sea = fft_filter(rng.standard_normal(len(tt)), lo=150, hi=1800) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.18 * tt)) * 0.15
ther = np.sin(2 * np.pi * (520 + 40 * np.sin(2 * np.pi * 5.5 * tt) + 90 * np.sin(2 * np.pi * 0.3 * tt)) * tt) * 0.06
place(tv, tvspeaker(sea + ther, 1.2) * 0.5, TV_SHOW)
# black: the carrier drops (click and a breath of silence)
for at in (SPORTS_OFF, BLACK2):
    n = int(0.05 * SR)
    place(tv, fft_filter(rng.standard_normal(n), lo=300) * np.exp(-np.arange(n) / SR * 90) * 0.25, at)
# the second intrusion: his sounds, synthesised and warped
mask = np.zeros((N, 2))
moan = warp(espeak('ohhhhhhhh, ohhhhhhh', ['-v', 'en', '-s', '60', '-p', '8']), 0.08, 1.6, 1)
place(mask, tvspeaker(crush(moan, 5, 2), 2.4) * 0.5, MASK2 + 0.05)
laugh = warp(espeak('ha ha ha ha ha haa', ['-v', 'en', '-s', '210', '-p', '85']), 0.1, 4.0, 2)
place(mask, tvspeaker(crush(laugh, 5, 3), 2.6) * 0.6, 30.7)
# an original hummed tune (not the cartoon theme he hummed), wobbling like a stretched tape
tune = [(392, 0.22), (440, 0.22), (494, 0.3), (392, 0.22), (330, 0.4), (294, 0.22), (330, 0.22), (392, 0.5)]
hum = []
for f, d in tune:
    tt = np.arange(int(d * SR)) / SR
    ph = 2 * np.pi * f * tt
    note = sum(np.sin(ph * k) / k ** 1.6 for k in range(1, 8)) * np.sin(np.linspace(0, np.pi, len(tt))) ** 0.4
    hum.append(note)
hum = warp(np.concatenate(hum), 0.05, 2.2, 3)
hum = fft_filter(hum, lo=200, hi=1400) * 0.5
place(mask, tvspeaker(crush(hum, 6, 2), 2.0) * 0.45, 31.95)
place(mask, tvspeaker(crush(warp(espeak('hmmmmmm', ['-v', 'en', '-s', '50', '-p', '20']), 0.1, 1.2, 4), 5, 2), 2.2) * 0.4, 34.3)
laugh2 = warp(espeak('ha haa ha', ['-v', 'en', '-s', '180', '-p', '70']), 0.14, 5.0, 5)
place(mask, tvspeaker(crush(laugh2, 4, 3), 2.8) * 0.5, 37.55)
# a can held up to the camera: a ring-pull hiss through the TV
place(mask, tvspeaker(fft_filter(rng.standard_normal(int(0.25 * SR)), lo=2500) * np.exp(-np.arange(int(0.25 * SR)) / SR * 12) * 0.5), CAN_UP + 0.4)
# the flyswatter: three light plastic thwacks from off screen, and a warped yelp-like moan
for at in (40.74, 41.71, 42.67):
    n = int(0.07 * SR)
    tt = np.arange(n) / SR
    thwack = fft_filter(rng.standard_normal(n), lo=900, hi=6000) * np.exp(-tt * 70) + np.sin(2 * np.pi * 320 * tt) * np.exp(-tt * 60) * 0.5
    place(mask, tvspeaker(thwack, 2.0) * 0.8, at)
place(mask, tvspeaker(crush(warp(espeak('ohhh', ['-v', 'en', '-s', '80', '-p', '60']), 0.15, 6, 6), 4, 3), 2.6) * 0.3, 40.85)
# duck his sounds 8 dB under the narrator so every line stays intelligible
vact = np.zeros(N)
for l in LINES.values():
    vact = np.maximum(vact, env([(0, 0), (l['start'] - 0.12, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.15, 0), (DUR, 0)]))
mask *= (1 - vact * (1 - db(-8)))[:, None]
mask *= np.clip(env([(0, 0), (MASK2, 0), (MASK2 + 0.01, 1), (STATIC_ON - 0.01, 1), (STATIC_ON, 0), (DUR, 0)]), 0, 1)[:, None]
tv += mask
# station hum + flyback whine under every picture; static after the end of the intrusion
hum60 = (np.sin(2 * np.pi * qf(60) * T) * 0.5 + np.sin(2 * np.pi * qf(120) * T) * 0.3) * 0.008 + np.sin(2 * np.pi * qf(15734) * T) * 0.002
tv += st(hum60)
static_env = env([(0, 0), (STATIC_ON - 0.01, 0), (STATIC_ON, 1), (LOOP_ON + 0.1, 1), (LOOP_ON + 0.12, 0), (DUR, 0)]) + env([(0, 0), (LOOP_ON - 0.35, 0), (LOOP_ON + 0.1, 0.0), (DUR, 0)])
static = fft_filter(rng.standard_normal(N), lo=400, hi=8000) * 0.05
tv += st(static * static_env)
# hidden: the two-frame mask in the static carries a two-frame buzz
place(tv, st(buzz[int(SUB * SR):int((SUB + 0.067) * SR)] * 1.4), SUB)
# the loop: a roll as the static resolves into him
place(tv, fft_filter(rng.standard_normal(int(0.12 * SR)), lo=300, hi=6000) * np.linspace(0.08, 0.02, int(0.12 * SR)), LOOP_ON)
write(OUT / 'stem-tv.wav', tv)

# ------------------------------------------------------------------ score (original)
mus = np.zeros((N, 2))
drone = np.sin(2 * np.pi * qf(41.2) * T) + 0.7 * np.sin(2 * np.pi * qf(41.45) * T) + 0.55 * np.sin(2 * np.pi * qf(61.74) * T) + 0.2 * np.sin(2 * np.pi * qf(82.4) * T + 1)
d_env = env([(0, 0.35), (4.4, 0.4), (SPORTS_OFF - 0.01, 0.5), (SPORTS_OFF, 0.0), (MASK1, 0.0), (MASK1 + 0.02, 0.9), (13.4, 0.55), (22.6, 0.6), (27.0, 0.7), (BLACK2 - 0.01, 0.9), (BLACK2, 0), (MASK2, 0), (MASK2 + 0.02, 0.8), (33.5, 0.45), (36.4, 0.6), (43.6, 0.4), (49.0, 0.45), (53.7, 0.55), (LOOP_ON, 0.4), (DUR, 0.35)])
mus += st(drone * d_env * 0.085)


def saw(f, t):
    return sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 7))


# E3-F3-B3 cluster (minor second + tritone), joined by a C4 after the second intrusion
pad = saw(qf(164.81), T) + saw(qf(174.61), T) * 0.85 + saw(qf(246.94), T) * 0.7 + saw(qf(261.63), T) * env([(0, 0), (STATIC_ON, 0), (STATIC_ON + 1.5, 0.8), (LOOP_ON, 0.8), (LOOP_ON + 0.3, 0), (DUR, 0)])
pad = fft_filter(pad, lo=90, hi=1200)
lfo = 0.6 + 0.4 * np.sin(2 * np.pi * qf(0.06) * T)
p_env = env([(0, 0.12), (4.4, 0.3), (6.9, 0.18), (SPORTS_OFF, 0.0), (MASK1, 0.0), (MASK1 + 0.05, 0.9), (13.0, 0.4), (16.3, 0.3), (22.6, 0.45), (25.4, 0.3), (28.5, 0.55), (BLACK2, 0), (MASK2, 0), (36.4, 0.0), (36.6, 0.5), (39.4, 0.35), (43.6, 0.3), (44.4, 0.55), (49.0, 0.45), (53.7, 0.6), (LOOP_ON, 0.4), (DUR, 0.12)])
pad_st = np.stack([pad, np.roll(pad, int(0.019 * SR))], 1) * (p_env * lfo * 0.02)[:, None]
mus += reverb(pad_st, 3.2, 0.45, seed=13, bright=2600)


def chime(f, dur=2.4, a=1.0):
    return tone([f, f * 2.0, f * 3.01, f * 4.2], dur, [1, 0.35, 0.18, 0.06], decay=0.7) * a


# the "station ident" motif: clean over the city, returns slower and a quarter-tone flat in the empty room
motif = [987.77, 783.99, 659.25, 698.46, 0, 659.25]
box = np.zeros((N, 2))
for start, rate, detune, gain in [(4.6, 0.38, 1.0, 0.8), (49.3, 0.6, 0.971, 0.6)]:
    for i, f in enumerate(motif):
        if f:
            place(box, chime(f * detune * (1 + 0.003 * np.sin(i * 2.1)), a=gain), start + i * rate)
box = reverb(fft_filter(box, lo=350, hi=6000), 3.0, 0.6, seed=17, bright=5000)
mus += box * 0.045
mus[int(SPORTS_OFF * SR):int(MASK1 * SR)] *= 0.03
mus[int(BLACK2 * SR):int(MASK2 * SR)] *= 0.03
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ foley + library
fx = np.zeros((N, 2))
apt_room = fft_filter(rng.standard_normal(N), lo=60, hi=400) * 0.004
in_apt = np.ones(N)
for a, b in [(4.4, 6.9), (16.3, 19.3), (22.6, 25.4), (36.4, 39.4)]:
    in_apt[int(a * SR):int(b * SR)] = 0
fx += st(apt_room * in_apt)
# wall clock in the apartment (tick-tock), every second, only in apartment shots
k = 0.0
while k < DUR:
    if in_apt[min(N - 1, int(k * SR))]:
        tk = np.arange(int(0.03 * SR)) / SR
        place(fx, np.sin(2 * np.pi * (2700 if int(k) % 2 else 2300) * tk) * np.exp(-tk * 220) * 0.04, k)
    k += 1.0
# city at night: distant traffic, a far siren, wind at the tower
city = fft_filter(rng.standard_normal(int(2.6 * SR)), lo=80, hi=900) * 0.05
place(fx, fade(city, 0.2, 0.2), 4.4)
tt = np.arange(int(2.4 * SR)) / SR
siren = np.sin(2 * np.pi * (700 + 180 * np.sin(2 * np.pi * 0.6 * tt)) * tt) * 0.006
place(fx, fade(reverb(fft_filter(siren, hi=1500), 2.5, 0.7, seed=31), 0.5, 0.6), 4.5)
wind = lib('cavern_lowwind')
place(fx, fade(wind[: int(2.8 * SR)], 0.15, 0.3), 22.6, -3)
place(fx, fade(wind[int(1 * SR): int(5.6 * SR)], 0.2, 0.4), 44.4, -9)
# master control: room hum and the switch
mc = lib('mission_control')
place(fx, fade(mc[: int(3.0 * SR)], 0.05, 0.1), 16.3, -8)
place(fx, lib('steel_latch'), LEVER - 0.05, -2)
# transmitter room: radio noise bed, a buzzing fluorescent tube, nobody there
place(fx, fade(lib('radio_noise_bed')[: int(3.0 * SR)], 0.05, 0.1), 36.4, -10)
tt = np.arange(int(3.0 * SR)) / SR
tube = np.sign(np.sin(2 * np.pi * 120 * tt)) * 0.012 * (0.7 + 0.3 * (np.sin(2 * np.pi * 31 / (2 * np.pi) * tt * 2 * np.pi) > 0.85))
place(fx, fft_filter(tube, lo=100, hi=3000), 36.4)
# the viewer: chair creak as he leans in, as he gets up; steps backwards; his breath
place(fx, lib('wood_stress'), 13.7, -12)
place(fx, lib('wood_stress'), 33.6, -9)
for i in range(3):
    n = int(0.09 * SR)
    tt = np.arange(n) / SR
    stp = fft_filter(rng.standard_normal(n), lo=150, hi=1800) * np.exp(-tt * 45) * 0.35 + np.sin(2 * np.pi * 85 * tt) * np.exp(-tt * 40) * 0.3
    place(fx, stp, 34.55 + i * 0.55, -6)
place(fx, lib('heartbeat_breath'), 34.8, -10)
# cinematic accents: the first appearance, the riser into the second, its hit
place(fx, lib('low_cinematic_hit'), MASK1, -3)
place(fx, lib('suspense_riser'), BLACK2 - 2.75, -8)
place(fx, lib('restrained_boom'), MASK2, -6)
place(fx, lib('lost_signal'), STATIC_ON, -9)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ mix (no fade at the end: it loops)
mix = voice + tv + mus + fx


def lufs(x):
    write(OUT / 'probe.wav', x)
    out = subprocess.run(['ffmpeg', '-i', str(OUT / 'probe.wav'), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    (OUT / 'probe.wav').unlink()
    return float([l for l in out.splitlines() if l.strip().startswith('I:')][-1].split()[1])


ceil = db(-1.2)
peak = np.abs(mix).max()
base = mix / peak
g = 1.0
for _ in range(5):
    y = np.tanh(base * g / ceil) * ceil
    g *= db(-14.0 - lufs(y))
mix = np.tanh(base * g / ceil) * ceil
write(OUT / 'mix.wav', mix)
final_lufs = lufs(mix)

# voice-over-bed margin per line, measured from stems with the same mix gain
def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


margins = []
for lid, l in LINES.items():
    a, b = int(l['start'] * SR), int(l['end'] * SR)
    vv = voice[a:b].mean(1)
    margins.append({'id': lid, 'voice_minus_score_db': float(round(rms_db(vv) - rms_db(mus[a:b].mean(1)), 1)), 'voice_minus_all_other_stems_db': float(round(rms_db(vv) - rms_db((tv + mus + fx)[a:b].mean(1)), 1))})
def encode_peak(x):
    write(OUT / 'mix.wav', x)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(OUT / 'mix.wav'), '-c:a', 'aac', '-b:a', '192k', str(OUT / 'mix.m4a')], check=True)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(OUT / 'mix.m4a'), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return 20 * np.log10(np.abs(np.frombuffer(raw, np.float32)).max())


# AAC can overshoot the limiter ceiling on the clipped buzz; pull the whole mix down until the
# decoded file peaks at or below -1 dBFS, and report the loudness of what is actually delivered
encoded_peak = encode_peak(mix)
while encoded_peak > -1.0:
    mix = mix * db(-1.0 - encoded_peak - 0.1)
    encoded_peak = encode_peak(mix)
final_lufs = lufs(mix)
(OUT / 'mix.wav').unlink()
for stem in OUT.glob('stem-*.wav'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(stem), '-c:a', 'flac', str(stem.with_suffix('.flac'))], check=True)
    stem.unlink()
for p in TMP.glob('*'):
    p.unlink()
TMP.rmdir()
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep02MaskOnChannel11',
    'duration_seconds': DUR,
    'voice': TL['voice'] + '; light band-limit, soft saturation, small room (archive narrator, not a TV speaker)',
    'original_synthesis': [
        'TV: intruder carrier buzz (59.94 Hz square harmonics + noise) on at frame 0 and again at the loop point; generic sports-anchor murmur (espeak-ng us2, invented words); sci-fi show wind/sea and theremin-like tone; static; flyback whine',
        "intruder's sounds: espeak-ng formant moans/laughter warped by modulated varispeed, bit-crushed and band-limited; an ORIGINAL hummed melody (not the cartoon theme heard in 1987); a ring-pull hiss; three flyswatter thwacks heard through the TV",
        'score: E1/B1 beating drone; E3-F3-B3 cluster pad joined by C4 after the intrusion; a six-note chime "station ident" motif, which returns slower and a quarter-tone flat',
        'foley: apartment room tone, wall clock, city traffic and a far siren, fluorescent tube buzz, three backward footsteps',
        'no audio from the real 1987 broadcasts is used',
        'loop: drone/pad/hum/buzz end at their frame-0 levels; the static rolls into the frame-0 buzz',
    ],
    'library_cues': USED,
    'loudness_target_lufs': -14.0,
    'measured_integrated_lufs': final_lufs,
    'encoded_sample_peak_dbfs': round(float(encoded_peak), 2),
    'limiter': 'tanh soft limiter, ceiling -1.2 dBFS',
    'voice_margins_db': margins,
    'listening_pass': 'not performed (no audio audition in this runtime)',
}, indent=2) + '\n')
print('ok', DUR, 'LUFS', final_lufs, 'encoded peak', round(float(encoded_peak), 2))
for m in margins:
    print(m)
