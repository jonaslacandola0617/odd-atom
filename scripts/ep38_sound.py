"""Episode 38 "FWD: Ingat Kayo" (Season 4, Visayan urban legend: Maria Labo, told as a chain text) sound.

Sound language: an original message tone (three short rising beeps through a phone's tiny speaker,
synthesized; not any real ringtone) and the phone buzzing in the hand, on every message; keypad clicks;
a town at night where faint tones spread from window to window; a market by day, a nail file; a door
slammed and barred; a blade on a whetstone somewhere; a phone vibrating on a wooden table; then silence,
glass slats, a breath outside. The phone's buzz runs across the loop seam. A loop-quantised eerie score.
-14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep38_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep38-labo-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep38-labo-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(38038)
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









# key times: must match K in src/horror/ep38/Episode38.tsx
l = lambda i: L[i]
OPEN = 0.8
CUT_TOWN = l('l02')['start'] - 0.3
CUT_THREAD = l('l03')['start'] - 0.3
FWD = [l('l03')['start'] + 0.1, l('l03')['start'] + 1.9, l('l03')['start'] + 3.4]
CUT_MARKET = l('l04')['start'] - 0.3
CUT_COUNT = l('l05')['start'] - 0.3
CUT_NIGHT = l('l06')['start'] - 0.3
SHUT = l('l06')['end'] + 0.15
CUT_UNKNOWN = l('l07')['start'] - 0.3
MSG_OPEN = l('l07')['end'] + 0.25
CUT_WINDOW = l('l08')['start'] - 0.3
FACE = l('l08')['end'] + 0.2
LOOP = DUR - 1.7
STINGERS = [FACE]
TONES = [DUR - 0.4, FWD[0], FWD[1], FWD[2], CUT_UNKNOWN + 0.2]  # -0.4 in the picture: the loop's own message
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep38-{name}.mp3'
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
phone = span(-1, CUT_TOWN, 0.002) + span(CUT_THREAD, CUT_MARKET, 0.002) + span(CUT_COUNT, CUT_NIGHT, 0.002) + span(CUT_UNKNOWN, DUR + 1, 0.002)
town = span(CUT_TOWN, CUT_THREAD, 0.002)
market = span(CUT_MARKET, CUT_COUNT, 0.002)
night = span(CUT_NIGHT, CUT_UNKNOWN, 0.002)
window = span(CUT_WINDOW, LOOP, 0.002)
hush = span(CUT_WINDOW + 0.2, FACE + 1.2, 0.2)  # the room holds its breath

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
# our room at night: a low hum, crickets beyond the window
amb += st(unit(filt(rng.standard_normal(N), SR, lo=90, hi=900)) * 0.009 * np.clip(phone + window, 0, 1) * (1 - 0.6 * hush) * duck)
cr = np.zeros(N)
for f0 in (4300, 5000):
    cr += np.sin(2 * np.pi * qf(f0) * T) * (np.sin(2 * np.pi * qf(rng.uniform(12, 16)) * T) > 0.5)
amb += st(cr * 0.003 * np.clip(phone + town + night + window * (1 - hush), 0, 1) * duck)
# the town: wind over roofs
amb += st(unit(filt(rng.standard_normal(N), SR, lo=200, hi=2000)) * 0.01 * town * duck)
# the market, looped
m3 = sfx('market-3')
amb += xloop(m3, DUR) * (db(-12) * market * (0.45 + 0.55 * duck))[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def tone(at, gain=0.05, pan_=0.0, small=True):
    """The message tone: three short rising beeps, square-ish, through a tiny speaker (original)."""
    out = np.zeros(int(0.42 * SR))
    for k, f in enumerate((1318.5, 1760.0, 2093.0)):
        n = int(0.075 * SR)
        tt = np.arange(n) / SR
        x = np.tanh(3 * np.sin(2 * np.pi * f * tt)) * np.minimum(1, tt / 0.004) * np.minimum(1, (tt[-1] - tt) / 0.006)
        i = int(k * 0.11 * SR)
        out[i:i + n] += x
    out = filt(out, SR, lo=700, hi=4500) if small else out
    place(fx, pan(out * gain, pan_), at)


v3 = sfx('vibrate-3')


def buzz(at, seconds=0.6, gain_db=-14):
    n = int(seconds * SR)
    x = v3[:n] * np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.02 * SR))[:, None]
    place(fx, x, at, gain_db)


for k, at in enumerate(TONES):
    tone(at, 0.045)
    buzz(at, 0.6)
buzz(TONES[0] - DUR, 0.6)  # the loop's buzz, continued past the seam into frame 0


def click(at, gain=0.03):
    n = int(0.025 * SR)
    x = filt(rng.standard_normal(n), SR, lo=1500, hi=6000) * np.exp(-np.arange(n) / SR * 260)
    place(fx, st(x * gain), at)


# keypad: opening the message, scrolling the thread, scrolling the count
for at in (OPEN - 0.1, OPEN):
    click(at)
for x in FWD:
    click(x + 0.5)
for at in np.arange(CUT_COUNT + 0.2, CUT_NIGHT - 0.2, 0.33):
    click(at, 0.02)
click(MSG_OPEN - 0.05)
# the town: faint tones spreading from window to window
r2 = np.random.default_rng(380)
for k in range(24):
    at = CUT_TOWN + 0.4 + (CUT_THREAD - CUT_TOWN - 0.9) * (k / 24) ** 0.8 + r2.uniform(-0.05, 0.05)
    tone(at, 0.012 * (0.4 + 0.6 * float(duck[int(at * SR)])), r2.uniform(-0.8, 0.8))
# the market: the nail file
fl = np.zeros(N)
fl_n = filt(rng.standard_normal(N), SR, lo=2500, hi=7000) * np.abs(np.sin(2 * np.pi * qf(9 / (2 * np.pi)) * T))
fx += st(fl_n * 0.006 * market * duck)
# night: quick bare steps, the door slammed and barred
for at in np.arange(CUT_NIGHT + 0.4, SHUT - 0.2, 0.21):
    click(at, 0.02 * (0.4 + 0.6 * float(duck[int(at * SR)])))
d2 = sfx('door-2')
place(fx, d2, SHUT - 0.15, -4)
# a blade on a whetstone somewhere close: through the night and the count
w2 = sfx('whetstone-2')
for at in (CUT_COUNT + 0.8, CUT_NIGHT + 1.2, CUT_WINDOW + 0.6):
    place(fx, pan(w2, -0.4) * (0.35 + 0.65 * duck[int(at * SR):int(at * SR) + len(w2)])[:, None], at, -16)
# the window: glass slats tick; a breath outside, then her
def glass(at, gain=0.03):
    n = int(0.3 * SR)
    tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 30) for f in (2900, 4100, 5300))
    place(fx, st(x * gain), at)


glass(FACE - 0.05, 0.035)
glass(FACE + 0.12, 0.02)
n = int(1.4 * SR)
tt = np.arange(n) / SR
place(fx, pan(filt(rng.standard_normal(n), SR, lo=250, hi=2200) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.03, -0.2), FACE - 1.3)
hit(FACE, 0.22, 41)
write(OUT / 'stem-foley-fx.wav', fx)
# ------------------------------------------------------------------ the score (eerie, low; loop-quantised)
mus = np.zeros((N, 2))
lv = 0.85
drone_e = env([(0, lv), (CUT_TOWN, 0.9), (CUT_THREAD, 1.0), (CUT_MARKET, 0.6), (CUT_COUNT, 1.1), (CUT_NIGHT, 1.2), (CUT_UNKNOWN, 1.3), (CUT_WINDOW, 0.4), (FACE, 0.4), (FACE + 0.1, 1.6), (LOOP, lv), (DUR, lv)])
mus += st(hs.drone_mid(T, qf, drone_e, root=46.25) * 1.8)
str_e = env([(0, 0.6), (CUT_TOWN, 0.7), (CUT_MARKET, 0.4), (CUT_COUNT, 0.9), (CUT_NIGHT, 1.1), (CUT_UNKNOWN, 1.3), (CUT_WINDOW, 0.3), (FACE, 0.3), (FACE + 0.1, 1.5), (LOOP, 0.6), (DUR, 0.6)])
trem = env([(0, 0.5), (CUT_TOWN, 0.6), (CUT_MARKET, 0.2), (CUT_COUNT, 0.7), (CUT_NIGHT, 0.9), (CUT_WINDOW, 0.3), (FACE + 0.1, 1.0), (LOOP, 0.5), (DUR, 0.5)])
mus += st(hs.strings(T, qf, [92.5, 98.0, 138.59], str_e, trem, SR, seed=3801) * 2.3)
# an original music-box figure built on the message tone's three notes, slowed
THEME = [329.63, 440.0, 523.25, 0, 329.63, 440.0, 493.88, 0, 311.13, 415.3]
place(mus, hs.music_box(SR, THEME, 0.45, 0.96, seed=3803), CUT_TOWN + 0.5, -2.0)
place(mus, st(hs.metal_bow(SR, 4.0, 1040.0, seed=3804)), CUT_COUNT + 0.3, 0.0)
place(mus, st(hs.heartbeat(SR, CUT_UNKNOWN, FACE, 64, 100, gain=0.55, seed=3805)), CUT_UNKNOWN)
place(mus, st(hs.reverse_swell(SR, [92.5, 138.59, 185.0], 0.8, seed=3806)), FACE - 0.8, -3.0)
place(mus, hs.stinger(SR, seed=3807, size=1.2), FACE)
mus *= (1 - speech * (1 - db(-6)))[:, None]
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
take = ROOT / 'public/assets/audio/eleven-takes/ep38-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep38FwdIngatKayo',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep38-labo/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep38-labo/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, an original music-box figure on the message tone\'s three notes, bowed metal under the count, a heartbeat from the unknown number to the face, a reversed swell and a stinger at the face (scripts/horror_score.py); loop-quantised',
        'an original message tone (three short rising beeps, not any real ringtone) on every message, keypad clicks, faint tones spreading through the town, crickets, wind, the nail file, quick steps, glass slats, a breath outside, a low hit (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'tzXH3wlop0hENgRPt8ab', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (about 68 credits per prompt); picked by measurement, not by listening'},
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
