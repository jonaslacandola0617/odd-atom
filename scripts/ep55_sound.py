"""Episode 55 "The Lift" (Season 6: a taxi driver's night on a hill road in Himachal; retold from a driver's
account shared online and churel/chudail folklore) sound.

Sound language (this episode's own; nothing from Episode 41's kit): the diesel taxi and the wind up the ghats,
louder with the speed; the hillside at night when the car stands; her brass ankle bells at a running rhythm (the
motif, and the loop joins on them); brakes and a skid; the impact and the bones breaking; the bones grinding as
she gets up; the dashcam's G-sensor beep; her palm on the glass; long nails on the vinyl of my seat.
-14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep55_sound.py
"""
import hashlib, json, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep55-lift-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep55-lift-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(55055)
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



# key times: must match K in src/horror/ep55/Episode55.tsx
l = lambda i: L[i]
HIT = l('l04')['end'] + 0.12
CUT_FRONT = l('l01')['end'] + 0.6
SLOW = l('l02')['start'] + 1.4
STOP = l('l02')['end'] + 1.0
GO = HIT - np.sqrt(2 * (8.0 - 2.1) / 4.58)
CUT_REAR = HIT + 0.9
STOP_REAR = HIT + 1.2
RISE0 = l('l05')['start'] + 0.4
RISE1 = l('l05')['start'] + 3.8
RUN = l('l05')['end'] - 0.9
CUT_CABIN = l('l05')['end'] + 0.7
RAMP = l('l06')['start']
WINDOW = l('l06')['start'] + 2.6
SLAM = l('l06')['end'] + 0.15
CUT_DAWN = l('l06')['end'] + 1.2
CUT_SEAT = l('l07')['end'] + 0.8
TAP = l('l08')['start'] + 1.2
LEAN = l('l08')['end'] + 0.25
LOOP = DUR - 1.6
STINGERS = [HIT, SLAM, LEAN]
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def speed(t):
    """km/h, as the picture's readout"""
    if t < CUT_FRONT: return 55
    if t < SLOW: return 42
    if t < STOP:
        x = min(1, max(0, (t - SLOW) / (STOP - SLOW)))
        return 42 * (1 - x * x * (3 - 2 * x))
    if t < GO: return 0
    if t < HIT: return 4.58 * (t - GO) * 3.6
    if t < STOP_REAR: return 4.58 * (HIT - GO) * 3.6 * (1 - (t - HIT) / (STOP_REAR - HIT))
    if t < RUN + 0.2: return 0
    if t < RAMP: return 55 * (t - RUN - 0.2) / (RAMP - RUN - 0.2)
    if t < CUT_DAWN:
        x = min(1, max(0, (t - RAMP) / 2.4))
        return 55 + 25 * x * x * (3 - 2 * x)
    if t < CUT_SEAT: return 38
    return 32


def sfx(name, gain_db=0.0):
    path = SFX / f'ep55-{name}.mp3'
    SFX_USED[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    x = load(path, 2)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-12) * 0.1  # unit level: -20 dB RMS
    return x * db(gain_db)


def span(a, b, ramp=0.03):
    return env([(-10, 0), (a - ramp, 0), (a, 1), (b, 1), (b + ramp, 0), (DUR + 10, 0)])


def pan(x, p):
    x = x if x.ndim == 1 else x.mean(1)
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1)


def xloop(x, seconds, fade_s=0.25):
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
    e = np.abs(x)
    a, r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    env_ = np.zeros_like(e)
    lvl = 0.0
    for i in range(0, len(e), 48):
        m = e[i:i + 48].max()
        lvl = a ** 48 * lvl + (1 - a ** 48) * m if m > lvl else r ** 48 * lvl + (1 - r ** 48) * m
        env_[i:i + 48] = lvl
    over = np.maximum(0, 20 * np.log10(env_ + 1e-9) - thresh_db)
    y = x * 10 ** (-over * (1 - 1 / ratio) / 20)
    y = y * 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-12)) / 20)
    c = 10 ** ((-21.0 + 12.0) / 20)
    return np.tanh(y / c) * c


def burst(seconds, lo, hi, shape=2.0, gain=0.03):
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    return filt(rng.standard_normal(n), SR, lo=lo, hi=hi) * np.sin(np.pi * tt / tt[-1]) ** shape * gain


def wrap(x):
    y = x[:N].copy()
    y[:len(x) - N] += x[N:]
    return y


def place_wrap(bus, clip, at, gain=0.0):
    """place a clip that may run past the end: the overflow comes back at the start (the loop)"""
    tmp = np.zeros((N + len(clip) + SR, 2))
    i = int(at * SR)
    tmp[i:i + len(clip)] += st(clip) * db(gain)
    bus += wrap(tmp)



# ------------------------------------------------------------------ voice: the narrator dry and close
voice = np.zeros((N, 2))
for lid, ln in L.items():
    v = load(VOICE / f'{lid}.wav')
    v = filt(v, SR, lo=80, hi=11000)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = compress(v)
    v = verb(v, 0.4, 0.03, seed=55, bright=3500)
    place(voice, v, ln['start'], gain=-1.0)
speech = np.zeros(N)
for ln in L.values():
    speech = np.maximum(speech, env([(0, 0), (ln['start'] - 0.1, 0), (ln['start'], 1), (ln['end'], 1), (ln['end'] + 0.25, 0), (DUR, 0)]))
duck = 1 - speech * (1 - db(-9))

OUT.mkdir(parents=True, exist_ok=True)
tv = np.where(T >= LOOP, T - DUR, T)  # the loop shot plays the hook on negative time
v_kmh = np.array([speed(x) for x in tv[::480]])
v_kmh = np.interp(np.arange(N), np.arange(0, N, 480), v_kmh)
moving = np.clip(v_kmh / 30, 0, 1)
fast = np.clip((v_kmh - 30) / 50, 0, 1)
cabin = span(CUT_CABIN, CUT_DAWN, 0.005) + span(CUT_SEAT, LOOP, 0.005)
rear = span(-1, CUT_FRONT, 0.005) + span(CUT_REAR, CUT_CABIN, 0.005) + span(LOOP, DUR + 1, 0.005)

# ------------------------------------------------------------------ beds: the taxi at speed; the hillside when it stands
amb = np.zeros((N, 2))
taxi = wrap(xloop(sfx('taxi-3'), DUR + 3, 0.6))
amb += taxi * (db(-17) * (0.15 + 0.85 * moving) * (0.8 + 0.5 * fast) * (0.85 + 0.15 * duck))[:, None]
# wind past the glass, rising with the speed
wind = filt(rng.standard_normal(N), SR, lo=300, hi=2600) * 0.02 * (0.2 + 1.3 * fast) ** 1.5
amb += pan(wind * (0.85 + 0.15 * duck), -0.2)
hills = wrap(xloop(sfx('hills-2'), DUR + 3, 0.6))
amb += hills * (db(-17) * (1 - moving) * (0.9 + 0.1 * duck))[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# her ankle bells: running behind the car (the hook and the loop), after she gets up, and beside my window
bell_e = env([(-10, 1), (CUT_FRONT - 0.05, 1), (CUT_FRONT, 0), (RUN - 0.1, 0), (RUN, 0.8), (CUT_CABIN, 1.0), (WINDOW - 1.6, 0.6), (WINDOW, 1.2), (SLAM, 1.3), (CUT_DAWN - 0.02, 1.3), (CUT_DAWN, 0), (LOOP - 0.02, 0), (LOOP, 1), (DUR + 10, 1)])
bells = wrap(xloop(sfx('bells-1'), DUR + 3, 0.3))
fx += bells * (db(-14) * bell_e * (0.75 + 0.25 * duck))[:, None]
# a few bells as she stands on the verge and walks out (only her steps)
for k in range(9):
    at = STOP + 0.5 + k * 0.78
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    ring = sum(np.sin(2 * np.pi * f0 * tt + p0) for f0, p0 in [(4200, 0), (5300, 1.3), (6100, 2.1)]) * np.exp(-tt * 18) * 0.012
    place(fx, pan(ring, -0.1), at)
# the brakes as I stop for her; the skid after the hit
br = sfx('brakes-2')
place(fx, pan(fade(br.mean(1), 0.05, 0.3), 0.0), STOP - 2.0, -14.0)
place(fx, pan(fade(sfx('brakes-3').mean(1)[: int(1.4 * SR)], 0.0, 0.3), 0.0), HIT + 0.08, -6.0)
# the impact (the stinger), the G-sensor's beep
place(fx, pan(fade(sfx('impact-2').mean(1)[: int(1.5 * SR)], 0.0, 0.4), 0.0), HIT - 0.03, 1.0)
for k in range(3):
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    place(fx, pan(np.sin(2 * np.pi * 2400 * tt) * 0.05 * np.minimum(1, (n - np.arange(n)) / 200), 0.3), HIT + 0.35 + k * 0.16)
# her bones as she gets up, twice; and once more as she drops onto all fours
bn = sfx('bones-1')
place(fx, pan(fade(bn.mean(1), 0.02, 0.3), 0.0), RISE0 + 0.3, -9.0)
place(fx, pan(fade(sfx('bones-3').mean(1), 0.02, 0.3), 0.0), RISE0 + 2.4, -10.0)
# her palm and face on the glass beside me (the stinger): a hard flat slap and the glass ringing
n = int(0.6 * SR)
tt = np.arange(n) / SR
slap = filt(rng.standard_normal(n), SR, lo=200, hi=5000) * np.exp(-tt * 40) * 0.5 + np.sin(2 * np.pi * 1870 * tt) * np.exp(-tt * 7) * 0.03
place(fx, pan(slap, -0.5), SLAM, -2.0)
# her nails on my seat
place(fx, pan(fade(sfx('nails-2').mean(1), 0.02, 0.3), 0.15), TAP, -10.0)
place(fx, pan(fade(sfx('nails-4').mean(1)[: int(2.0 * SR)], 0.02, 0.3), 0.15), LEAN - 0.4, -6.0)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the score
mus = np.zeros((N, 2))
d_e = env([(-10, 0.9), (CUT_FRONT, 0.5), (STOP, 0.9), (GO, 1.2), (HIT, 0.0), (CUT_REAR, 0.0), (RISE0, 0.9), (RUN, 1.3), (CUT_CABIN, 1.0), (SLAM, 1.6), (CUT_DAWN, 0.4), (CUT_SEAT, 0.6), (LEAN, 1.5), (LOOP, 0.9), (DUR + 10, 0.9)])
mus += st(hs.drone_mid(T, qf, d_e, root=36.71) * 1.2)
str_e = env([(-10, 0.6), (CUT_FRONT, 0.0), (STOP, 0.5), (HIT - 0.1, 1.2), (HIT, 0.0), (RISE0, 0.6), (RUN, 1.2), (CUT_CABIN, 0.8), (SLAM, 1.5), (CUT_DAWN, 0.0), (CUT_SEAT, 0.3), (LEAN, 1.4), (LOOP, 0.6), (DUR + 10, 0.6)])
trem = env([(-10, 0.6), (STOP, 1.0), (DUR + 10, 1.0)])
mus += st(hs.strings(T, qf, [110.0, 116.54, 164.81, 233.08], str_e, trem, SR, seed=5508) * 1.6)
place(mus, st(hs.metal_bow(SR, 3.0, 660.0, seed=5509)), STOP + 0.3, -14.0)
place(mus, hs.stinger(SR, seed=5511, size=1.0), HIT, -8.0)
place(mus, hs.stinger(SR, seed=5513, size=1.2), SLAM, -7.0)
place(mus, hs.stinger(SR, seed=5517, size=1.4), LEAN, -6.0)
mus = np.stack([filt(mus[:, 0], SR, lo=100, hi=12000), filt(mus[:, 1], SR, lo=100, hi=12000)], 1)
mus *= (1 - speech * (1 - db(-3.5)))[:, None] * db(1.0)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep55-take2.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep55TheLift',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (ElevenLabs library voice)', 'credits': json.loads((ROOT / 'docs/production/ep55-lift/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep55-lift/prompt.json'},

    'original_synthesis': [
        'SCORE: a mid-band drone (root 36.71 Hz) and a string cluster that drop out dead at the impact and come back as she gets up, bowed metal as she walks out, a synthesized stinger at the impact, at her palm on the glass and as her face comes out from behind my seat (scripts/horror_score.py); loop-quantised',
        'the wind past the glass (filtered noise, rising with the speed), the bells as she walks (struck partials), the G-sensor beep, her palm on the glass (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': '7vtshxktumFRFK2EHMoJ', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': '7 prompts x 4 variations, duration and loop set on the node (about 784 credits): diesel taxi 20 s loop, ankle bells running 10 s loop, impact 3 s, bones 4 s, nails 4 s, hillside at night 15 s loop, brakes 3 s',
                       'reused': 'none (no Episode 41 drone, riser, stinger, neck crack or music box)',
                       'note': 'picked by measurement (RMS, range), not by listening'},
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
