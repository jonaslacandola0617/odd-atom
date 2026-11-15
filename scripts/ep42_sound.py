"""Episode 42 "Ikalabing-apat" (Season 5: a night guard's experience shared online, retold) sound.

Sound language: the lobby at 3 a.m. (an ElevenLabs room-tone loop: tubes, air-con, a computer fan),
folded across the loop seam. The elevator's ding and doors (one ElevenLabs take, its ding and its door
rumble cut apart). Everything on the 14th floor is heard only through the CCTV: hiss, the shaft's hum
(an ElevenLabs loop), the doors muffled to a monitor's band. Night three: a heartbeat, and a neck crack on
each snap of her head. "Kagabi": the score drops out; the floor indicator ticks down to L. Tonight: the
doors, a riser, the glass entrance opening by itself as she walks out, the stinger when her head snaps up
to the lens. A long ElevenLabs drone (reused from Episode 41's unused takes) under a loop-quantised score.
-14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep42_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep42-lift-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep42-lift-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(42042)
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








# key times: must match K in src/horror/ep42/Episode42.tsx
l = lambda i: L[i]
DING = 0.15
OPEN0 = 0.35
CUT_DESK = l('l02')['start'] - 0.3
CUT_MONITOR = l('l03')['start'] - 0.3
CUT_C1 = l('l04')['start'] - 0.3
C1_OPEN = l('l04')['start'] + 3.4
CUT_C2 = l('l05')['start'] - 0.3
C2_OPEN = CUT_C2 + 0.5
CUT_C3 = l('l06')['start'] - 0.3
SNAPS = [l('l06')['end'] + d for d in (0.25, 0.6, 0.95)]
C3_OPEN = l('l06')['end'] + 1.0
CUT_C4 = l('l07')['start'] - 0.3
CUT_COUNT = l('l07')['end'] + 0.25
CUT_END = l('l08')['start'] - 0.3
END_OPEN = l('l08')['start'] + 1.6
CUT_CCTVL = l('l08')['end'] + 0.15
TIP = l('l08')['end'] + 0.95
LOOP = DUR - 1.7
COUNT = 13
STINGERS = [TIP]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / (f'{name}.mp3' if name.startswith('ep4') else f'ep42-{name}.mp3')
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


def wrap(x):
    """Fold a bed longer than the episode back onto its start, so it runs on across the loop seam."""
    y = x[:N].copy()
    y[:len(x) - N] += x[N:]
    return y




cctv = span(CUT_C1, CUT_COUNT, 0.002) + span(CUT_CCTVL, LOOP, 0.002)
lobby = np.clip(1 - span(CUT_C1, CUT_COUNT, 0.002), 0, 1)
kagabi = span(CUT_C4, CUT_COUNT, 0.002)


def monitor(x):
    """what the CCTV's little speaker makes of a sound: band-limited, a touch of grit"""
    x = x if x.ndim == 1 else x.mean(1)
    y = filt(x, SR, lo=350, hi=3200)
    return st(np.tanh(y * 3) / 3)


# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
lb = sfx('lobby-3')
amb += wrap(xloop(filt(lb.mean(1), SR, lo=80, hi=9000), DUR + 3, 0.5)) * (db(-15) * (0.35 + 0.65 * lobby) * (0.6 + 0.4 * duck))[:, None]
sh = sfx('shaft-2')
shb = wrap(xloop(sh, DUR + 3, 0.5))
amb += monitor(shb) * (db(-16) * span(CUT_C1, CUT_COUNT, 0.002) * (0.55 + 0.45 * duck))[:, None]
amb += shb * (db(-24) * span(CUT_COUNT, CUT_END, 0.002))[:, None]  # the car coming down, through the doors
amb += st(unit(filt(rng.standard_normal(N), SR, lo=2000, hi=9000)) * 0.004 * cctv * duck)  # CCTV hiss
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
el = sfx('elevator-2')
dg = fade(el[: int(0.9 * SR)], 0.002, 0.3)
dr = fade(el[int(2.3 * SR): int(4.6 * SR)], 0.2, 0.6)


def arrive(at_ding, at_open, gain=0.0, through_monitor=False):
    if at_ding is not None:
        place(fx, monitor(dg) if through_monitor else dg, at_ding, gain)
    place(fx, monitor(dr) if through_monitor else dr, at_open - 0.2, gain - 3.0)


arrive(DING, OPEN0, -2.0)
arrive(None, C1_OPEN, -6.0, True)
place(fx, monitor(dg), C1_OPEN - 0.5, -6.0)
arrive(C2_OPEN - 0.5, C2_OPEN, -6.0, True)
arrive(C3_OPEN - 0.5, C3_OPEN, -5.0, True)
arrive(END_OPEN - 0.45, END_OPEN, -7.0)


def tick(at, gain=0.012):
    n = int(0.06 * SR)
    tt = np.arange(n) / SR
    place(fx, st(np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 70) * gain), at)


# the indicator ticking down to L (the countdown shot, and the hook's own 3, 2 before the seam)
step = (CUT_END - 0.3 - CUT_COUNT) / (COUNT - 1)
for k in range(1, COUNT):
    tick(CUT_COUNT - 0.35 + k * step)
for at in (-1.0, -0.3):
    tick(DUR + at)
# neck cracks on each snap of her head (through the monitor), and on the tip (in the lobby)
nk = sfx('ep41-neck-2')
m = nk.mean(1)
hop = int(0.01 * SR)
e = np.array([np.sqrt(np.mean(m[i:i + hop] ** 2)) for i in range(0, len(m) - hop, hop)])
peaks = []
for i in np.argsort(e)[::-1]:
    if all(abs(i - p) > 18 for p in peaks):
        peaks.append(int(i))
    if len(peaks) == 4:
        break
cr = [nk[max(0, p * hop - int(0.02 * SR)): max(0, p * hop - int(0.02 * SR)) + int(0.24 * SR)] for p in sorted(peaks)]
cr = [c * np.hanning(len(c))[:, None] for c in cr]
for k, at in enumerate(SNAPS):
    place(fx, monitor(cr[k % len(cr)]), at, 2.0)
place(fx, pan(cr[3 % len(cr)].mean(1), -0.2), TIP, 5.0)
# the guard stands and steps aside (a rustle, two steps); the glass entrance opens by itself
n = int(0.5 * SR)
place(fx, st(filt(rng.standard_normal(n), SR, lo=500, hi=4000) * np.sin(np.pi * np.arange(n) / n) * 0.012), CUT_END + 0.1)
gd = sfx('door-3')
place(fx, pan(gd.mean(1), 0.6), CUT_CCTVL + 0.6, -8.0)
# whispers: before tonight's doors, and across the loop seam
wh = sfx('ep41-whispers-2')
place(fx, pan(fade(wh[: int(2.0 * SR)].mean(1), 0.3, 0.6), -0.4), CUT_END - 2.2, -4.0)
seam = fade(wh[int(1.5 * SR): int(4.0 * SR)].mean(1), 0.4, 0.4)
place(fx, pan(seam, 0.4), DUR - 1.2, -8.0)
place(fx, pan(seam, 0.4), -1.2, -8.0)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the score
mus = np.zeros((N, 2))
dr2 = sfx('ep41-drone-1')
drb = wrap(xloop(dr2, DUR + 3, 0.8))
drone_e = env([(0, 1.0), (CUT_DESK, 0.7), (CUT_C1, 1.0), (CUT_C3, 1.3), (CUT_C4 - 0.01, 1.4), (CUT_C4, 0.0), (CUT_COUNT, 0.0), (CUT_COUNT + 0.3, 1.1), (CUT_CCTVL, 1.4), (TIP + 0.1, 1.6), (LOOP, 1.0), (DUR, 1.0)])
mus += drb * (db(-18) * drone_e)[:, None]
d_e = env([(0, 0.7), (CUT_DESK, 0.5), (CUT_C1, 0.8), (CUT_C3, 1.1), (CUT_C4 - 0.01, 1.2), (CUT_C4, 0.0), (CUT_COUNT, 0.0), (CUT_COUNT + 0.3, 0.9), (TIP + 0.1, 1.5), (LOOP, 0.7), (DUR, 0.7)])
mus += st(hs.drone_mid(T, qf, d_e, root=49.0) * 1.6)
str_e = env([(0, 0.5), (CUT_C1, 0.7), (CUT_C3, 1.1), (CUT_C4 - 0.01, 1.2), (CUT_C4, 0.0), (CUT_COUNT, 0.0), (CUT_COUNT + 0.3, 0.8), (TIP + 0.1, 1.5), (LOOP, 0.5), (DUR, 0.5)])
trem = env([(0, 0.4), (CUT_C3, 1.0), (CUT_C4, 0.2), (CUT_COUNT, 0.6), (TIP, 1.0), (LOOP, 0.4), (DUR, 0.4)])
mus += st(hs.strings(T, qf, [98.0, 103.83, 146.83], str_e, trem, SR, seed=4201) * 2.2)
place(mus, st(hs.metal_bow(SR, 3.5, 990.0, seed=4204)), CUT_MONITOR + 0.4, -2.0)
place(mus, st(hs.heartbeat(SR, CUT_C3, CUT_C4, 72, 108, gain=0.55, seed=4203)), CUT_C3)
rz = sfx('ep41-riser-1')
place(mus, fade(rz[: int(5.0 * SR)], 0.8, 0.05), CUT_CCTVL - 5.0, -13.0)
st3 = sfx('ep41-stinger-3')
place(mus, st3, TIP, -4.0)
place(mus, hs.stinger(SR, seed=4205, size=1.0), TIP, -6.0)
mus = np.stack([filt(mus[:, 0], SR, lo=100, hi=12000), filt(mus[:, 1], SR, lo=100, hi=12000)], 1)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(1.0)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep42-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep42Ikalabingapat',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep42-lift/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep42-lift/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, bowed metal at the monitor, a heartbeat under night three, a synthesized stinger doubling the ElevenLabs one (scripts/horror_score.py); loop-quantised; it drops out for "Kagabi" and returns with the countdown',
        'CCTV hiss and a muffled monitor band for everything on the 14th floor, the floor indicator ticking down, a rustle when the guard stands (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'FMahe5qlmOqjxHibXC7L', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': '4 prompts x 4 variations (about 532 credits): elevator arrival 5 s, elevator shaft 15 s loop, lobby night tone 15 s loop, glass door 5 s',
                       'reused': 'unused Episode 41 variations (drone-1, stinger-3, riser-1, whispers-2) and its neck-crack take (neck-2)',
                       'note': 'picked by measurement (RMS, peak, onset), not by listening'},
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
