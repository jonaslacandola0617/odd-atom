"""Episode 43 "Si Jun-Jun" (Season 5: the boy on the call-center floor; retold from agents' experiences
shared online) sound.

Sound language: the 2 a.m. call floor (an ElevenLabs loop: air-con, fans, a far murmur, a few keys),
folded across the loop seam. The boy is mostly sound: small bare feet running (ElevenLabs; the hook's
run crosses the seam), one faint giggle, the old music box (reused from Episode 41's unused takes) when
he is in the monitor. The headset's beep and disconnect, the chair that rolls by itself, the cable
tugged in jerks and the headset's drop, a heartbeat under the desk, a riser, the stinger and a neck
crack when his head snaps up. A long ElevenLabs drone (reused) under a loop-quantised score.
-14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep43_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep43-junjun-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep43-junjun-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(43043)
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








# key times: must match K in src/horror/ep43/Episode43.tsx
l = lambda i: L[i]
CUT_FLOOR = l('l02')['start'] - 0.3
CUT_SENIOR = l('l03')['start'] - 0.3
CUT_POV = l('l04')['start'] - 0.3
BEHIND = l('l04')['end'] + 0.15
TURN = l('l04')['end'] + 0.75
CUT_REFLECT = l('l05')['start'] - 0.3
LIFT = l('l05')['end'] + 0.35
CUT_LEAVE = l('l06')['start'] - 0.3
CUT_NEW = l('l06')['start'] + 1.75
CUT_CABLE = l('l07')['start'] - 0.3
TUGS = [l('l07')['start'] + d for d in (0.9, 1.5, 2.0, 2.7)]
DROP = l('l07')['end'] + 0.25
CUT_UNDER = l('l07')['end'] + 0.6
SNAP = l('l08')['end'] + 0.45
LOOP = DUR - 1.7
STINGERS = [SNAP]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / (f'{name}.mp3' if name.startswith('ep4') else f'ep43-{name}.mp3')
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





reflect = span(CUT_REFLECT, CUT_LEAVE, 0.002)

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
fl = sfx('floor-3')
amb += wrap(xloop(filt(fl.mean(1), SR, lo=80, hi=9000), DUR + 3, 0.5)) * (db(-15) * (0.6 + 0.4 * duck) * (1 - 0.4 * reflect))[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
ft = sfx('feet-4')
# the hook's run: across the loop seam (it starts before the seam and runs on after it)
place(fx, pan(ft.mean(1), 0.5), DUR - 1.6, -2.0)
place(fx, pan(ft.mean(1), 0.5), -1.6, -2.0)
# behind me between calls
place(fx, pan(ft.mean(1), 0.7), BEHIND - 0.3, -4.0)
hd = sfx('headset-2')
place(fx, hd[: int(1.2 * SR)], CUT_POV + 0.15, -14.0)
place(fx, fade(hd[int(1.8 * SR):], 0.01, 0.2), l('l04')['end'] + 0.05, -14.0)


def squeak(at, dur=1.2, gain=0.006, p=0.5):
    """a castor rolling and squeaking"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(1300 + 400 * np.sin(tt * 23)) / SR) * (np.sin(tt * 31) > 0.6)
    r = filt(rng.standard_normal(n), SR, lo=200, hi=1200) * 0.6
    place(fx, pan((s * 0.5 + r) * np.sin(np.pi * tt / tt[-1]) * gain, p), at)


squeak(BEHIND + 0.2, 2.6, 0.007, 0.6)
squeak(CUT_LEAVE + 0.8, 2.4, 0.006, -0.2)
gg = sfx('giggle-2')
place(fx, pan(gg.mean(1), 0.3), LIFT + 0.05, -10.0)
cb = sfx('cable-1')
for k, at in enumerate(TUGS):
    seg = cb[int((0.3 + 0.7 * k) * SR): int((0.3 + 0.7 * k + 0.45) * SR)]
    place(fx, fade(seg, 0.005, 0.1), at - 0.02, -9.0)
n = int(0.3 * SR)
tt = np.arange(n) / SR
place(fx, st((np.sin(2 * np.pi * 140 * tt) * np.exp(-tt * 30) + filt(rng.standard_normal(n), SR, lo=300, hi=3000) * np.exp(-tt * 40) * 0.5) * 0.05), DROP + 0.18)
# his head snapping up
nk = sfx('ep41-neck-2')
m = nk.mean(1)
hop = int(0.01 * SR)
e = np.array([np.sqrt(np.mean(m[i:i + hop] ** 2)) for i in range(0, len(m) - hop, hop)])
p0 = int(np.argmax(e))
cr = nk[max(0, p0 * hop - int(0.02 * SR)): max(0, p0 * hop - int(0.02 * SR)) + int(0.24 * SR)]
cr = cr * np.hanning(len(cr))[:, None]
place(fx, pan(cr.mean(1), -0.1), SNAP, 4.0)
# whispers into the cave, and a breath across the seam
wh = sfx('ep41-whispers-3')
place(fx, pan(fade(wh[: int(2.0 * SR)].mean(1), 0.3, 0.6), -0.3), CUT_UNDER + 0.1, -5.0)
n = int(1.1 * SR)
tt = np.arange(n) / SR
br = pan(filt(rng.standard_normal(n), SR, lo=300, hi=2500) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.012, 0.3)
place(fx, br, DUR - 0.5)
place(fx, br, -0.5)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the score
mus = np.zeros((N, 2))
dr3 = sfx('ep41-drone-3')
drb = wrap(xloop(dr3, DUR + 3, 0.8))
drone_e = env([(0, 1.0), (CUT_FLOOR, 0.7), (CUT_POV, 1.0), (CUT_REFLECT, 0.4), (CUT_LEAVE, 1.0), (CUT_CABLE, 1.2), (CUT_UNDER, 1.4), (SNAP + 0.1, 1.6), (LOOP, 1.0), (DUR, 1.0)])
mus += drb * (db(-18) * drone_e)[:, None]
d_e = env([(0, 0.7), (CUT_FLOOR, 0.5), (CUT_POV, 0.8), (CUT_REFLECT, 0.3), (CUT_LEAVE, 0.8), (CUT_UNDER, 1.1), (SNAP + 0.1, 1.5), (LOOP, 0.7), (DUR, 0.7)])
mus += st(hs.drone_mid(T, qf, d_e, root=43.65) * 1.6)
str_e = env([(0, 0.5), (CUT_POV, 0.8), (CUT_REFLECT, 0.2), (CUT_LEAVE, 0.7), (CUT_UNDER, 1.1), (SNAP + 0.1, 1.5), (LOOP, 0.5), (DUR, 0.5)])
trem = env([(0, 0.4), (CUT_POV, 0.8), (CUT_REFLECT, 0.2), (CUT_CABLE, 0.9), (SNAP, 1.0), (LOOP, 0.4), (DUR, 0.4)])
mus += st(hs.strings(T, qf, [87.31, 92.5, 130.81], str_e, trem, SR, seed=4301) * 2.2)
mb = sfx('ep41-musicbox-1')
place(mus, verb(pan(fade(mb[: int(6.5 * SR)].mean(1), 0.3, 1.5), -0.2), 1.6, 0.3, seed=4302, bright=5000), CUT_REFLECT + 0.1, -11.0)
place(mus, st(hs.metal_bow(SR, 3.0, 1040.0, seed=4304)), LIFT - 0.4, -4.0)
place(mus, st(hs.heartbeat(SR, CUT_UNDER, SNAP, 70, 104, gain=0.55, seed=4303)), CUT_UNDER)
rz = sfx('ep41-riser-2')
place(mus, fade(rz[: int(4.5 * SR)], 0.8, 0.05), SNAP - 4.5, -12.0)
st4 = sfx('ep41-stinger-4')
place(mus, st4, SNAP, -4.0)
place(mus, hs.stinger(SR, seed=4305, size=1.0), SNAP, -6.0)
mus = np.stack([filt(mus[:, 0], SR, lo=100, hi=12000), filt(mus[:, 1], SR, lo=100, hi=12000)], 1)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-1.5)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep43-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep43SiJunJun',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep43-junjun/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep43-junjun/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, bowed metal at the reflection, a heartbeat under the desk, a synthesized stinger doubling the ElevenLabs one (scripts/horror_score.py); loop-quantised; it thins to the music box at the reflection',
        'a chair rolling and a chair turning (castor squeaks), the tugs and the headset dropping, a breath across the loop seam (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'USvypiF3DYNfkpU534SP', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': '5 prompts x 4 variations (about 384 credits): call-center floor 15 s loop, small feet running 4 s, faint giggle 3 s, headset tones 3 s, cable tug 4 s',
                       'reused': 'unused Episode 41 variations (musicbox-1, drone-3, stinger-4, riser-2, whispers-3) and its neck-crack take (neck-2)',
                       'note': 'picked by measurement (RMS, peak), not by listening'},
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
