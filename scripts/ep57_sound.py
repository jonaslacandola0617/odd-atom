"""Episode 57 "The Station That Isn't" (Season 6: a woman posting to a forum from a late train that stops at a
station on no map; retold from the 2004 thread) sound.

Sound language (this episode's own; nothing from Episode 41's kit): wherever the picture is, the thread hears it
too, quietly (the train under her first posts, the platform under the next, the tracks, the car); a small
original two-note "new post" tone on every post; the empty platform's mercury-lamp hum; the rail clatter; long
stretches of near silence; drums and a small bell far off, coming nearer along the line, cut dead by one dry shout
from the tunnel; the car's engine, the indicator, and the silence when the driver stops talking.
-14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep57_sound.py
"""
import hashlib, json, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep57-station-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep57-station-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(57057)
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



# key times: must match K in src/horror/ep57/Episode57.tsx
l = lambda i: L[i]
T1 = l('l01')['end'] + 0.45
TRAIN = 14.6
T2 = 18.4
PLATFORM = 22.6
T3 = 26.0
TRACKS = 28.6
TUNNEL = l('l02')['end'] + 0.4
MAN = l('l02')['end'] + 1.9
SHOUT = l('l02')['end'] + 2.6
T4 = l('l02')['end'] + 5.3
CAR = 45.4
TURN = 48.2
TURNED = 50.0
T5 = 51.6
LOOP = DUR - 1.6
STINGERS = [SHOUT, TURNED]
POSTS = [T1 + 0.2, T1 + 2.6, T1 + 3.6, T2 + 0.2, T2 + 2.6, T3 + 0.2, T4 + 0.2, T4 + 2.6, T4 + 3.6, T4 + 5.0, T5 + 0.2,
         l('l03')['start'] + 0.15, l('l03')['start'] + 2.6, l('l03')['start'] + 3.8, l('l03')['start'] + 4.8]
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep57-{name}.mp3'
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
    v = verb(v, 0.5, 0.03, seed=57, bright=3500)
    place(voice, v, ln['start'], gain=-1.0)
speech = np.zeros(N)
for ln in L.values():
    speech = np.maximum(speech, env([(0, 0), (ln['start'] - 0.1, 0), (ln['start'], 1), (ln['end'], 1), (ln['end'] + 0.25, 0), (DUR, 0)]))
duck = 1 - speech * (1 - db(-9))
OUT.mkdir(parents=True, exist_ok=True)


def seg(a, b, lv_in, lv_thread=0.0, edges=()):
    """1 inside [a, b) when the picture is there; lv_thread in the thread shots listed in edges (pairs)"""
    e = span(a, b, 0.01)
    for (c, d) in edges:
        e = e + span(c, d, 0.01) * lv_thread
    return e * lv_in


# ------------------------------------------------------------------ beds: each place, and the thread hearing it quietly
amb = np.zeros((N, 2))
plat = wrap(xloop(sfx('platform-2'), DUR + 3, 0.6))
plat_e = span(-1, T1, 0.01) + span(PLATFORM, T3, 0.01) + span(LOOP, DUR + 1, 0.01) + 0.35 * (span(T2, PLATFORM, 0.01) + span(T3, TRACKS, 0.01))
amb += plat * (db(-14) * plat_e * (0.85 + 0.15 * duck))[:, None]
train = wrap(xloop(sfx('train-1'), DUR + 3, 0.6))
# the train under her first posts; on screen; slowing to a stop under the second thread
train_e = 0.35 * span(T1, TRAIN, 0.01) + span(TRAIN, T2, 0.01) * env([(-10, 1), (T2 - 1.2, 1), (T2, 0.5), (DUR + 10, 0.5)])
amb += train * (db(-14) * train_e * (0.85 + 0.15 * duck))[:, None]
car = wrap(xloop(sfx('car-3'), DUR + 3, 0.6))
car_e = 0.35 * span(T4 + 3.6, CAR, 0.01) + span(CAR, T5, 0.01) * env([(-10, 1), (TURN, 1), (TURN + 0.6, 0.45), (DUR + 10, 0.45)]) + 0.3 * span(T5, LOOP, 0.01)
amb += car * (db(-15) * car_e * (0.85 + 0.15 * duck))[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# her steps on the ballast while she walks the line
steps = wrap(xloop(sfx('ballast-1'), DUR + 3, 0.3))
fx += steps * (db(-14) * (span(TRACKS, MAN, 0.02) + 0.35 * span(T3 + 0.4, TRACKS, 0.02)))[:, None]
# the drums and the bell, far off and coming nearer along the line; cut dead by the shout
dr = wrap(xloop(sfx('drums-1'), DUR + 3, 0.6))
dr_e = env([(-10, 0), (T3 + 1.5, 0), (TRACKS, 0.25), (l('l02')['start'], 0.45), (TUNNEL, 0.9), (SHOUT - 0.02, 1.15), (SHOUT, 0), (DUR + 10, 0)])
dr_far = np.stack([filt(dr[:, 0], SR, lo=120, hi=3500), filt(dr[:, 1], SR, lo=120, hi=3500)], 1)
fx += dr_far * (db(-13) * dr_e * (0.8 + 0.2 * duck))[:, None]
# the shout (the stinger), then nothing
place(fx, pan(fade(sfx('shout-2').mean(1)[: int(1.4 * SR)], 0.0, 0.05), 0.0), SHOUT, -4.0)
# the "new post" tone on every post (two soft notes, original)
for at in POSTS:
    n = int(0.22 * SR)
    tt = np.arange(n) / SR
    tone = (np.sin(2 * np.pi * 1318.5 * tt) * (tt < 0.09) + np.sin(2 * np.pi * 987.8 * tt) * (tt >= 0.09)) * np.exp(-(tt % 0.09) * 30) * 0.035
    place(fx, pan(tone, 0.1), at)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the score: low, sparse, silent in the long stretches
mus = np.zeros((N, 2))
d_e = env([(-10, 0.7), (T1, 0.4), (TRAIN, 0.6), (T2, 0.3), (PLATFORM, 0.0), (TRACKS, 0.0), (TUNNEL, 0.8), (SHOUT, 0.0), (T4, 0.5), (CAR, 0.6), (TURN, 1.3), (TURNED, 0.0), (T5, 0.5), (LOOP, 0.7), (DUR + 10, 0.7)])
mus += st(hs.drone_mid(T, qf, d_e, root=41.2 * 1.2) * 0.8)
str_e = env([(-10, 0.3), (T1, 0.0), (TUNNEL - 1, 0.0), (SHOUT - 0.1, 1.0), (SHOUT, 0.0), (TURN - 0.5, 0.0), (TURNED - 0.1, 1.2), (TURNED, 0.0), (T5 + 3, 0.0), (DUR, 0.3), (DUR + 10, 0.3)])
mus += st(hs.strings(T, qf, [123.47, 130.81, 185.0, 261.63], str_e, env([(-10, 1), (DUR + 10, 1)]), SR, seed=5708) * 1.0)
place(mus, hs.stinger(SR, seed=5711, size=1.0), SHOUT, -9.0)
place(mus, hs.stinger(SR, seed=5713, size=1.3), TURNED, -6.0)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep57-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep57TheStationThatIsnt',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (ElevenLabs library voice)', 'credits': json.loads((ROOT / 'docs/production/ep57-station/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep57-station/prompt.json'},

    'original_synthesis': [
        'SCORE: a mid-band drone and a string cluster, silent through the long stretches on the platform and the line, tightening to the shout and to the driver turning, a synthesized stinger at each (scripts/horror_score.py); loop-quantised',
        'the "new post" tone: two soft sine notes (original), on every post',
    ],
    'elevenlabs_sfx': {'flow_id': 'wZZL3Cd6pftFY0nBvzmw', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': '6 prompts x 4 variations, duration and loop set on the node (about 972 credits): platform at night 15 s loop, train interior 15 s loop, drums and bell far off 15 s loop, a shout from a tunnel 3 s, steps on ballast 10 s loop, car on a mountain road 15 s loop',
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
