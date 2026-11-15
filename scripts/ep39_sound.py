"""Episode 39 "Sino ang Susundo" (Season 4, Filipino belief: the sundo, the loved one who comes for the dying) sound.

Sound language: a public ward at night: an oxygen concentrator breathing beside Tatay's bed (it runs
across the loop seam), the IV dripping, a fluorescent tube's hum, a far monitor, coughing; a woman
humming far down the corridor, only in the gaps; soft slippers coming closer before the reveal; the other
chair scraping nearer on night three; the tube flickering when Nanay is in the doorway. A loop-quantised
eerie score. -14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep39_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep39-sundo-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep39-sundo-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(39039)
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








# key times: must match K in src/horror/ep39/Episode39.tsx
l = lambda i: L[i]
CUT_WARD = l('l02')['start'] - 0.3
CUT_N1 = l('l03')['start'] - 0.3
SMILE = l('l03')['start'] + 1.0
CUT_N2 = l('l04')['start'] - 0.3
SHADOW = l('l04')['start'] + 2.6
CUT_N3 = l('l05')['start'] - 0.3
SLIDE = (l('l05')['end'] - 0.4, l('l05')['end'] + 0.4)
CUT_N4 = l('l06')['start'] - 0.3
REACH = l('l06')['start'] + 1.4
CUT_WHISPER = l('l07')['start'] - 0.3
CUT_TURN = l('l07')['end'] + 0.4
TURNED = l('l07')['end'] + 1.0
LOOP = DUR - 1.7
STINGERS = [TURNED]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep39-{name}.mp3'
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
hush = span(CUT_TURN, TURNED + 0.9, 0.15)  # the ward holds its breath before Nanay

# ------------------------------------------------------------------ beds
def wrap(x):
    """Fold a bed longer than the episode back onto its start, so it runs on across the loop seam."""
    y = x[:N].copy()
    y[:len(x) - N] += x[N:]
    return y


amb = np.zeros((N, 2))
# the tube's hum: mains and its harmonics, loop-quantised; it drops out when the tube flickers
flick = 1 - span(TURNED - 0.1, TURNED + 0.15, 0.005)
hum = sum(np.sin(2 * np.pi * qf(f) * T) * a for f, a in ((120, 1.0), (240, 0.5), (360, 0.25), (480, 0.12)))
amb += st(hum * 0.004 * flick * duck)
# the ward far off (looped), thinning in the hush
w3 = sfx('ward-3')
amb += wrap(xloop(w3, DUR + 4)) * (db(-17) * (0.5 + 0.5 * duck) * (1 - 0.8 * hush))[:, None]
# the oxygen concentrator beside the bed: a slow breathing cycle, continuous across the seam
o3 = sfx('oxygen-3')
ox = wrap(xloop(o3, DUR + 5, 0.4))
cyc = 0.65 + 0.35 * np.sin(2 * np.pi * qf(1 / 3.2) * T) ** 2
amb += ox * (db(-15) * cyc * (0.55 + 0.45 * duck))[:, None]
# a filtered hiss that breathes with it, so the cycle reads on phones
amb += st(unit(filt(rng.standard_normal(N), SR, lo=1500, hi=6000)) * 0.004 * cyc * duck)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# the IV drip: one drop every 1.6 s (a whole number over the episode), louder in the shadow shot
period = DUR / round(DUR / 1.6)
def drip(at, gain=0.02):
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    f = 1800 * np.exp(-tt * 9) + 900
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 40)
    place(fx, pan(x * gain, 0.15), at)
n2 = span(CUT_N2, CUT_N3, 0.002)
for at in np.arange(0.3, DUR, period):
    drip(at, 0.012 * (0.5 + 0.5 * float(duck[int(at * SR)])) * (1 + 1.2 * float(n2[int(at * SR)])) * (1 - 0.7 * float(hush[int(at * SR)])))
# the humming, far down the corridor, only between lines
hm = sfx('humming-3')
hm = verb(filt(hm.mean(1), SR, lo=250, hi=3000), 1.8, 0.4, seed=3901, bright=2500)
for at in (CUT_N1 + 0.05, CUT_N3 - 1.9, CUT_N4 - 0.8):
    seg = hm[:int(2.0 * SR)] * np.sin(np.pi * np.arange(int(2.0 * SR)) / int(2.0 * SR))[:, None] ** 0.5
    i = int(at * SR)
    seg = seg * (1 - speech[i:i + len(seg)])[:, None] ** 2
    place(fx, seg, at, -15)
# night 3: the other chair scrapes nearer (soft, low, under the line's tail)
n = int((SLIDE[1] - SLIDE[0]) * SR)
tt = np.arange(n) / SR
sc = filt(rng.standard_normal(n), SR, lo=180, hi=1400) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * tt)) * np.sin(np.pi * tt / tt[-1])
place(fx, pan(sc * 0.035, -0.5), SLIDE[0])
# night 4: Tatay's hand finds mine (cloth)
n = int(0.5 * SR)
place(fx, pan(filt(rng.standard_normal(n), SR, lo=800, hi=5000) * np.sin(np.pi * np.arange(n) / n) * 0.006, 0.3), REACH)
# slippers come closer down the corridor, then stop, before the turn
s4 = sfx('slippers-4')
place(fx, pan(filt(s4.mean(1), SR, lo=200, hi=4000), 0.0), CUT_TURN - 1.6, -12)
# the turn: a fabric rustle as I turn; the tube ticks and buzzes; a low hit
n = int(0.4 * SR)
place(fx, st(filt(rng.standard_normal(n), SR, lo=600, hi=4000) * np.sin(np.pi * np.arange(n) / n) * 0.008), CUT_TURN + 0.1)
n = int(0.25 * SR)
tt = np.arange(n) / SR
bz = np.sign(np.sin(2 * np.pi * 120 * tt)) * filt(rng.standard_normal(n), SR, lo=2000, hi=6000) * 0.3 + np.sin(2 * np.pi * 240 * tt)
place(fx, st(filt(bz, SR, lo=150, hi=6000) * np.exp(-tt * 6) * 0.03), TURNED - 0.1)
hit(TURNED, 0.24, 41)
# a breath at the ear across the loop seam (the hook is the far chair with someone in it)
n = int(1.2 * SR)
tt = np.arange(n) / SR
br = pan(filt(rng.standard_normal(n), SR, lo=300, hi=2500) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.02, 0.5)
place(fx, br, DUR - 0.6)
place(fx, br, -0.6)
write(OUT / 'stem-foley-fx.wav', fx)
# ------------------------------------------------------------------ the score (eerie, low; loop-quantised)
mus = np.zeros((N, 2))
lv = 0.8
drone_e = env([(0, lv), (CUT_WARD, 0.8), (CUT_N1, 0.9), (CUT_N2, 1.0), (CUT_N3, 1.1), (CUT_N4, 1.2), (CUT_WHISPER, 1.3), (CUT_TURN, 0.3), (TURNED, 0.3), (TURNED + 0.1, 1.6), (LOOP, lv), (DUR, lv)])
mus += st(hs.drone_mid(T, qf, drone_e, root=43.65) * 1.8)
str_e = env([(0, 0.5), (CUT_N1, 0.6), (CUT_N2, 0.8), (CUT_N3, 1.0), (CUT_N4, 1.1), (CUT_WHISPER, 1.3), (CUT_TURN, 0.2), (TURNED, 0.2), (TURNED + 0.1, 1.5), (LOOP, 0.5), (DUR, 0.5)])
trem = env([(0, 0.4), (CUT_N2, 0.6), (CUT_N4, 0.8), (CUT_TURN, 0.2), (TURNED + 0.1, 1.0), (LOOP, 0.4), (DUR, 0.4)])
mus += st(hs.strings(T, qf, [87.31, 92.5, 130.81], str_e, trem, SR, seed=3901) * 2.3)
# an original music-box lullaby, slow, like the humming heard from far off
THEME = [392.0, 349.23, 311.13, 0, 392.0, 349.23, 293.66, 0, 261.63, 293.66, 311.13]
place(mus, hs.music_box(SR, THEME, 0.5, 0.95, seed=3903), CUT_WARD + 0.4, -2.0)
place(mus, hs.music_box(SR, THEME[:7], 0.62, 0.93, seed=3908), CUT_N4 + 0.2, -5.0)
place(mus, st(hs.metal_bow(SR, 4.0, 980.0, seed=3904)), CUT_N3 + 0.3, 0.0)
place(mus, st(hs.heartbeat(SR, CUT_N4, TURNED, 60, 96, gain=0.55, seed=3905)), CUT_N4)
place(mus, st(hs.reverse_swell(SR, [87.31, 130.81, 174.61], 0.8, seed=3906)), TURNED - 0.8, -3.0)
place(mus, hs.stinger(SR, seed=3907, size=1.2), TURNED)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep39-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep39SinoAngSusundo',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep39-sundo/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep39-sundo/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, an original slow music-box lullaby (twice), bowed metal under night three, a heartbeat from night four to the doorway, a reversed swell and a stinger when Nanay is in the doorway (scripts/horror_score.py); loop-quantised',
        'the tube hum (it drops out when the tube flickers), the IV drip on a loop-quantised period, a breathing hiss with the concentrator, the chair scraping nearer, cloth, a fabric rustle, the tube buzz, a low hit, a breath across the loop seam (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'kBXifU3jE0k2CWVgyMlV', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (about 68 credits per prompt); picked by measurement, not by listening'},
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
