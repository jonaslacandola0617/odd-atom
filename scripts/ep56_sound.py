"""Episode 56 "The Music in the Forest" (Season 6: students on a village posting in East Java and the gamelan past
the forest gate; retold from a thread shared online) sound.

Sound language (this episode's own; nothing from Episode 41's kit): the humid night forest; my steps in wet
leaves; an ORIGINAL gamelan phrase, synthesized here (saron, bonang, kenong, kempul, a soft gong; a pelog-like
tuning at 72 beats a minute, the tempo my friend walks to), far off at first and nearer with every swing of the
torch, stopping dead when the torch dies; the stream; one bronze gong struck close when the torch finds him;
snakes over wet skin and cloth; and the whole ensemble crashing back in once as she comes forward.
-14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep56_sound.py
"""
import hashlib, json, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep56-forest-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep56-forest-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(56056)
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



# key times: must match K in src/horror/ep56/Episode56.tsx
l = lambda i: L[i]
MUSIC = l('l01')['end'] - 2.2
WALK = l('l01')['end'] + 0.3
SWINGS = [l('l03')['start'] - 1.4, l('l03')['start'] + 1.6, l('l03')['start'] + 4.6]
STOP = l('l04')['start'] - 1.4
GONE = l('l04')['end'] + 0.45
WALK2 = l('l04')['end'] + 0.9
GONG = l('l05')['start'] - 0.35
RISE = l('l06')['start'] + 0.6
END = l('l06')['end'] + 0.25
LOOP = DUR - 1.6
STINGERS = [GONG, END]
BEAT = 60 / 72
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep56-{name}.mp3'
    SFX_USED[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    x = load(path, 2)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-12) * 0.1  # unit level: -20 dB RMS
    return x * db(gain_db)


# ------------------------------------------------------------------ the gamelan (original, synthesized)
PELOG = [293.7, 316.5, 349.2, 411.0, 440.0, 466.2, 523.3]  # a pelog-like seven-tone set (not a tuning of any real set)


def metal(f, dur, partials, decay, seed):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    r = np.random.default_rng(seed)
    x = np.zeros(n)
    for k, (m, a) in enumerate(partials):
        x += a * np.sin(2 * np.pi * f * m * tt + r.random() * 6.28) * np.exp(-tt * decay * (1 + 0.6 * k))
    # a beating pair (the paired, detuned instruments of a gamelan shimmer)
    x += 0.5 * partials[0][1] * np.sin(2 * np.pi * (f + 4.5) * tt) * np.exp(-tt * decay)
    att = np.minimum(1, tt / 0.003)
    return x * att


def saron(f, seed):
    return metal(f, 1.6, [(1, 1.0), (2.76, 0.35), (5.4, 0.12)], 2.6, seed)


def bonang(f, seed):
    return metal(f, 1.2, [(1, 0.8), (1.98, 0.3), (3.1, 0.15)], 4.0, seed)


def kenong(f, seed):
    return metal(f, 2.6, [(1, 1.0), (2.02, 0.25), (3.0, 0.1)], 1.2, seed)


def gong(f, seed, dur=5.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + 0.6 * np.sin(2 * np.pi * (f + 1.7) * tt) + 0.3 * np.sin(2 * np.pi * f * 2.03 * tt)) * np.exp(-tt * 0.6) * np.minimum(1, tt / 0.02)


# the balungan: sixteen beats, then again (scale degrees, 0 = rest), the gong on the last beat of each pass
PHRASE = [3, 5, 6, 5, 3, 2, 1, 2, 3, 5, 3, 2, 6, 5, 3, 2]


def gamelan(t0, t1, seed=56):
    """the ensemble from t0 to t1 (absolute seconds), with the phrase locked to the beat grid from MUSIC"""
    out = np.zeros(N + 6 * SR)
    r = np.random.default_rng(seed)
    k0 = int(np.ceil((t0 - MUSIC) / BEAT))
    k1 = int((t1 - MUSIC) / BEAT)
    for k in range(k0, k1 + 1):
        at = MUSIC + k * BEAT
        if at < 0 or at >= DUR:
            continue
        deg = PHRASE[k % 16]
        f = PELOG[deg - 1] / 2
        i = int(at * SR)
        s1 = saron(f, r.integers(1 << 30)) * 0.5
        out[i:i + len(s1)] += s1[:len(out) - i]
        # the bonang plays twice as fast, an octave up, anticipating
        for h in (0, 0.5):
            j = int((at + h * BEAT) * SR)
            b1 = bonang(PELOG[(deg + (1 if h else 0)) % 7], r.integers(1 << 30)) * 0.22
            out[j:j + len(b1)] += b1[:len(out) - j]
        if k % 4 == 3:
            kn = kenong(PELOG[deg - 1] / 4 * 2, r.integers(1 << 30)) * 0.35
            out[i:i + len(kn)] += kn[:len(out) - i]
        if k % 8 == 7:
            kp = kenong(PELOG[deg - 1] / 4, r.integers(1 << 30)) * 0.4
            out[i:i + len(kp)] += kp[:len(out) - i]
        if k % 16 == 15:
            g = gong(PELOG[0] / 8, 1) * 0.5
            out[i:i + len(g)] += g[:len(out) - i]
    return out[:N]


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
    v = verb(v, 0.6, 0.04, seed=56, bright=3500)
    place(voice, v, ln['start'], gain=-1.0)
speech = np.zeros(N)
for ln in L.values():
    speech = np.maximum(speech, env([(0, 0), (ln['start'] - 0.1, 0), (ln['start'], 1), (ln['end'], 1), (ln['end'] + 0.25, 0), (DUR, 0)]))
duck = 1 - speech * (1 - db(-9))
OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ beds: the forest; the stream at the end
amb = np.zeros((N, 2))
jungle = wrap(xloop(sfx('jungle-1'), DUR + 3, 0.6))
# the insects thin out as the music gets near, and fall silent while she is in the light
ins = env([(-10, 1), (MUSIC, 1), (SWINGS[0], 0.75), (STOP, 0.35), (GONE, 0.2), (GONE + 0.4, 0.8), (END, 0.8), (LOOP, 1), (DUR + 10, 1)])
amb += jungle * (db(-19) * ins * (0.85 + 0.15 * duck))[:, None]
stream = wrap(xloop(sfx('stream-3'), DUR + 3, 0.6))
amb += stream * (db(-19) * env([(-10, 0), (WALK2, 0), (GONG - 0.5, 1), (LOOP - 0.3, 1), (LOOP, 0), (DUR + 10, 0)]))[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# my steps in the wet leaves while I walk (the walk the picture plays)
walking = env([(-10, 0.25), (WALK - 0.2, 0.25), (WALK, 1), (STOP - 0.1, 1), (STOP, 0), (WALK2, 0), (WALK2 + 0.1, 1), (GONG - 0.6, 1), (GONG - 0.4, 0), (LOOP, 0), (LOOP + 0.01, 0.25), (DUR + 10, 0.25)])
steps = wrap(xloop(sfx('steps-2'), DUR + 3, 0.3))
fx += steps * (db(-15) * walking * (0.8 + 0.2 * duck))[:, None]
# the gong, struck close, as the torch finds him (the stinger)
place(fx, pan(fade(sfx('gong-3').mean(1)[: int(3.2 * SR)], 0.0, 1.2), 0.0), GONG, -5.0)
# the snakes coming out from under the sarong
place(fx, pan(fade(sfx('snakes-2').mean(1), 0.1, 0.4), 0.1), l('l05')['start'] + 2.6, -9.0)
place(fx, pan(fade(sfx('snakes-3').mean(1), 0.1, 0.4), -0.1), RISE - 0.4, -12.0)
# the torch's switch flickering as it dies on her
for k in range(4):
    n = int(0.02 * SR)
    tt = np.arange(n) / SR
    place(fx, pan(filt(rng.standard_normal(n), SR, lo=1500, hi=7000) * np.exp(-tt * 200) * 0.2, 0.2), GONE - 0.25 + k * 0.09)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the gamelan and the score
mus = np.zeros((N, 2))
gm = gamelan(MUSIC - 0.01, GONE)
# far away at first (through the trees: dark, wet), nearer with every swing, stopping dead when the torch dies
near = env([(-10, 0), (MUSIC, 0.0), (WALK, 0.15), (SWINGS[0], 0.35), (SWINGS[1], 0.55), (SWINGS[2], 0.75), (STOP, 0.9), (GONE, 1.0), (DUR + 10, 1)])
far = filt(gm, SR, lo=150, hi=2200)
close = filt(gm, SR, lo=120, hi=9000)
g_mix = far * (1 - near) * 0.9 + close * near
g_mix = verb(g_mix, 2.2, 0.35 - 0.2 * 0.5, seed=5601, bright=4000)
g_mix = g_mix[:N] if g_mix.ndim == 1 else g_mix[:N].mean(1)
g_level = env([(-10, 0), (MUSIC - 0.01, 0), (MUSIC, db(-19)), (SWINGS[0], db(-15)), (STOP, db(-11)), (GONE - 0.01, db(-10)), (GONE, 0), (DUR + 10, 0)])
mus += pan(g_mix * g_level * (0.75 + 0.25 * duck), 0.15)
# the crash: the whole ensemble on one stroke, close, as she comes forward
crash = np.zeros(N + 6 * SR)
r2 = np.random.default_rng(5699)
i = int(END * SR)
for deg in (1, 3, 5, 6):
    for fn, g0 in ((saron, 0.5), (bonang, 0.3)):
        x = fn(PELOG[deg - 1] / (2 if fn is saron else 1), r2.integers(1 << 30)) * g0
        crash[i:i + len(x)] += x
gg = gong(PELOG[0] / 8, 7) * 0.9
crash[i:i + len(gg)] += gg
mus += pan(verb(crash[:N], 1.6, 0.2, seed=5602, bright=6000)[:N].mean(1) if verb(crash[:N], 1.6, 0.2, seed=5602, bright=6000).ndim > 1 else verb(crash[:N], 1.6, 0.2, seed=5602, bright=6000)[:N], 0.0) * db(-7)
# a low drone and a string cluster underneath, of their own (silent when the music stops)
d_e = env([(-10, 0.5), (MUSIC, 0.6), (SWINGS[0], 0.9), (STOP, 1.3), (GONE, 0.0), (GONG - 0.3, 0.0), (GONG, 1.2), (RISE, 1.0), (END, 1.6), (LOOP, 0.5), (DUR + 10, 0.5)])
mus += st(hs.drone_mid(T, qf, d_e, root=36.71 * 1.5) * 0.7)
str_e = env([(-10, 0.3), (SWINGS[0], 0.6), (STOP, 1.1), (GONE, 0.0), (GONG, 0.0), (RISE, 0.9), (END, 1.4), (LOOP, 0.3), (DUR + 10, 0.3)])
mus += st(hs.strings(T, qf, [146.83, 155.56, 220.0, 311.13], str_e, env([(-10, 1), (DUR + 10, 1)]), SR, seed=5608) * 0.9)
place(mus, hs.stinger(SR, seed=5611, size=1.0), GONG, -10.0)
place(mus, hs.stinger(SR, seed=5613, size=1.3), END, -7.0)
mus = np.stack([filt(mus[:, 0], SR, lo=90, hi=12000), filt(mus[:, 1], SR, lo=90, hi=12000)], 1)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep56-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep56TheMusicInTheForest',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (ElevenLabs library voice)', 'credits': json.loads((ROOT / 'docs/production/ep56-forest/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep56-forest/prompt.json'},

    'original_synthesis': [
        'THE GAMELAN: an original sixteen-beat phrase on a pelog-like seven-tone set at 72 beats a minute (saron, bonang at double time, kenong, kempul, a soft gong every sixteen beats), synthesized from inharmonic partials with paired-instrument beating; far (dark, wet) at first, nearer with every swing of the torch; stops dead when the torch dies; one full-ensemble stroke at the end. Not a transcription of any real piece.',
        'SCORE: a mid-band drone and a string cluster that tighten with the music and die with it (scripts/horror_score.py); a synthesized stinger under the gong and the last stroke; loop-quantised',
        'the torch switch flickering (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'BoVFiRL9l7kX81Lmck7B', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': '5 prompts x 4 variations, duration and loop set on the node (about 680 credits): jungle at night 15 s loop, steps in wet leaves 10 s loop, stream 15 s loop, snakes 5 s, a bronze gong 6 s',
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
