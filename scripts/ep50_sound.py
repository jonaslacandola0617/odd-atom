"""Episode 50 "Si Lola sa Panaginip" (Season 5 finale: a late grandmother who visits in dreams, until one
night it is not her; retold from experiences shared online) sound.

Sound language: the house at night (Episode 44's house loop) under rain on the roof (an ElevenLabs 15 s
loop); the dream is the same room heard as if under water (low-passed, a reverb tail, the rain far away)
with a music box. The flood in the morning (ElevenLabs). Rosary beads in the dream (ElevenLabs). In the
sala, the front doorknob turning twice; then the door open on the rain (ElevenLabs). The mattress giving
at the foot of the bed (ElevenLabs). Neck cracks on her head's snaps; Episode 41's stinger when she turns
to me in the house. A loop-quantised score over Episode 41's drone. -14 LUFS with an encoded-AAC peak
check; stems as FLAC.
Run: python3 scripts/ep50_sound.py
"""
import hashlib, json, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep50-lola-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep50-lola-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(50050)
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



# key times: must match K in src/horror/ep50/Episode50.tsx
l = lambda i: L[i]
HOOK_TURNS = [0.3, 0.75]
CUT_DREAM1 = l('l02')['start'] - 0.3
CUT_FLOOD = l('l03')['start'] - 0.3
WATCH = l('l03')['start'] + 4.2
CUT_LAST = l('l04')['start'] - 0.3
CUT_DOOR = l('l05')['start'] - 0.3
KNOBS = [l('l05')['start'] + d for d in (0.6, 2.2)]
CUT_TURN = l('l06')['start'] - 0.3
TURNS = [l('l06')['start'] + d for d in (1.0, 1.6, 2.2)]
BODY = l('l06')['start'] + 2.9
ROSARY = l('l06')['start'] + 4.3
CUT_WAKE = l('l07')['start'] - 0.3
CUT_BED = l('l08')['start'] - 0.3
CUT_SIT = l('l08')['end'] + 0.3
SNAP = l('l08')['end'] + 0.85
LOOP = DUR - 1.7
STINGERS = [SNAP]
SFX = ROOTSFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}

def sfx(name, gain_db=0.0):
    path = SFX / (f'{name}.mp3' if re.match(r'ep\d', name) else f'ep50-{name}.mp3')
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





dream = np.clip(span(-10, CUT_FLOOD, 0.002) + span(CUT_LAST, CUT_DOOR, 0.002) + span(CUT_TURN, CUT_WAKE, 0.002) + (T >= LOOP), 0, 1)
flood = span(CUT_FLOOD, WATCH, 0.002)
sala = span(CUT_DOOR, CUT_TURN, 0.002) + span(CUT_WAKE, CUT_BED, 0.002)
house = np.clip(1 - dream - flood, 0, 1)  # the house at night: the watch, the sala, the bed, the sit
quiet = span(CUT_SIT, SNAP - 0.05, 0.004)

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
hb = sfx('ep44-house-1')
hbed = wrap(xloop(filt(hb.mean(1), SR, lo=80, hi=8000), DUR + 3, 0.5))[:, 0]
rn = sfx('rain-3')
rbed = wrap(xloop(filt(rn.mean(1), SR, lo=150, hi=10000), DUR + 3, 0.5))[:, 0]
# the house: its loop and the rain on the roof; louder in the sala, loudest with the door open
open_door = span(CUT_WAKE, CUT_BED, 0.002)
amb += np.stack([hbed] * 2, 1) * (db(-14) * house * (1 - 0.6 * quiet) * (0.6 + 0.4 * duck))[:, None]
amb += np.stack([rbed] * 2, 1) * (db(-12) * (house + 0.35 * open_door) * (1 - 0.7 * quiet) * (0.6 + 0.4 * duck))[:, None]
# the dream: the same room, under water
dbed = verb(filt(hbed + rbed * 0.5, SR, lo=100, hi=900), 2.5, 0.5, seed=5001, bright=1200)
amb += (dbed if dbed.ndim == 2 else np.stack([dbed, dbed], 1)) * (db(-10) * dream * (0.6 + 0.4 * duck))[:, None]
fl = sfx('flood-4')
place(amb, fade(fl, 0.3, 0.5), CUT_FLOOD, -15.0)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# the rosary beads: Lola's in the first dream; the stranger's in the last
ro = sfx('rosary-2')
place(fx, pan(fade(ro.mean(1), 0.1, 0.5), 0.3), CUT_DREAM1 + 0.6, -10.0)
place(fx, pan(fade(ro.mean(1), 0.1, 0.5), -0.1), ROSARY, -8.0)
# the front doorknob turning, twice (cut from the door take's first latch sounds), then the door open
dr = sfx('door-1')
knob = fade(dr.mean(1)[: int(0.6 * SR)], 0.01, 0.2)
for at in KNOBS:
    place(fx, pan(filt(knob, SR, lo=400, hi=6000), 0.35), at, -8.0)
place(fx, pan(fade(dr.mean(1), 0.05, 0.6), 0.3), CUT_WAKE + 0.05, -11.0)
# the mattress giving at the foot of the bed: in the last dream, and in the house as the dent deepens
mt = sfx('mattress-3')
place(fx, pan(fade(mt.mean(1), 0.05, 0.4), 0.0), CUT_LAST + 0.4, -10.0)
place(fx, pan(fade(mt.mean(1), 0.05, 0.4), 0.0), CUT_BED + 0.6, -6.0)
# neck cracks: the hook's two snaps (and across the seam), the turn's three, the house's one
nk = sfx('ep41-neck-4')
mm = nk.mean(1)
hp = int(0.01 * SR)
ee = np.array([np.sqrt(np.mean(mm[i:i + hp] ** 2)) for i in range(0, len(mm) - hp, hp)])
p0 = int(np.argmax(ee)) * hp
crack = nk[max(0, p0 - int(0.02 * SR)): p0 + int(0.22 * SR)]
crack = crack * np.hanning(len(crack))[:, None]
c1 = crack.mean(1)
for at in HOOK_TURNS:
    place(fx, pan(filt(c1, SR, lo=200, hi=2500), 0.0), at, -10.0)
    place(fx, pan(filt(c1, SR, lo=200, hi=2500), 0.0), at - DUR, -10.0)
for at in TURNS:
    place(fx, pan(filt(c1, SR, lo=200, hi=3000), 0.0), at, -8.0)
place(fx, pan(c1, 0.0), SNAP, 1.0)
n = int(1.1 * SR)
tt = np.arange(n) / SR
bth = pan(filt(rng.standard_normal(n), SR, lo=300, hi=2500) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.01, -0.4)
place(fx, bth, DUR - 0.6)
place(fx, bth, -0.6)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the score
mus = np.zeros((N, 2))
d4 = sfx('ep41-drone-2')
drb = wrap(xloop(d4, DUR + 3, 0.8))
drone_e = env([(0, 1.0), (CUT_DREAM1, 0.4), (CUT_FLOOD, 0.3), (CUT_LAST, 0.9), (CUT_DOOR, 1.0), (CUT_TURN, 1.3), (CUT_WAKE, 0.9), (CUT_SIT, 0.2), (SNAP + 0.1, 1.6), (LOOP, 1.0), (DUR, 1.0)])
mus += drb * (db(-18) * drone_e)[:, None]
d_e = env([(0, 0.8), (CUT_DREAM1, 0.3), (CUT_FLOOD, 0.2), (CUT_LAST, 0.8), (CUT_DOOR, 0.9), (CUT_TURN, 1.2), (CUT_WAKE, 0.8), (CUT_SIT, 0.1), (SNAP + 0.1, 1.5), (LOOP, 0.8), (DUR, 0.8)])
mus += st(hs.drone_mid(T, qf, d_e, root=36.71) * 1.6)
str_e = env([(0, 0.6), (CUT_DREAM1, 0.3), (CUT_FLOOD, 0.2), (CUT_LAST, 0.8), (CUT_DOOR, 0.9), (CUT_TURN, 1.2), (CUT_WAKE, 0.8), (CUT_SIT, 0.1), (SNAP + 0.1, 1.5), (LOOP, 0.6), (DUR, 0.6)])
trem = env([(0, 0.5), (CUT_TURN, 0.9), (LOOP, 0.5), (DUR, 0.5)])
mus += st(hs.strings(T, qf, [73.42, 77.78, 110.0], str_e, trem, SR, seed=5001) * 2.2)
# the music box: Lola's tune, warm in the first dream; the same tune, slower and lower, in the last
mb = sfx('ep41-musicbox-2')
place(mus, verb(pan(fade(mb[: int(5.5 * SR)].mean(1), 0.3, 1.5), 0.2), 1.6, 0.3, seed=5003, bright=5000), CUT_DREAM1 + 0.2, -13.0)
slow = np.interp(np.arange(0, int(6.0 * SR) * 0.85, 0.85), np.arange(int(6.0 * SR)), mb[: int(6.0 * SR)].mean(1))
place(mus, verb(pan(fade(slow, 0.3, 1.5), -0.2), 2.0, 0.4, seed=5004, bright=3000), CUT_LAST + 0.3, -14.0)
place(mus, st(hs.heartbeat(SR, CUT_TURN, CUT_WAKE - 0.2, 64, 100, gain=0.35, seed=5005)), CUT_TURN)
place(mus, st(hs.metal_bow(SR, 3.0, 990.0, seed=5006)), TURNS[-1] + 0.1, -7.0)
rz = sfx('ep41-riser-3')
place(mus, fade(rz[: int(4.5 * SR)], 0.8, 0.05), SNAP - 4.5, -14.0)
st1 = sfx('ep41-stinger-4')
place(mus, st1, SNAP, -6.5)
place(mus, hs.stinger(SR, seed=5007, size=1.0), SNAP, -6.0)
mus = np.stack([filt(mus[:, 0], SR, lo=100, hi=12000), filt(mus[:, 1], SR, lo=100, hi=12000)], 1)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(0.8)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep50-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep50SiLolaSaPanaginip',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (ElevenLabs library voice, Filipino)', 'credits': json.loads((ROOT / 'docs/production/ep50-lola/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep50-lola/prompt.json'},
    'original_synthesis': [
        'SCORE: a mid-band drone, a detuned string cluster with tremolo, bowed metal after her head turns, a heartbeat through the last dream, a synthesized stinger doubling the ElevenLabs one (scripts/horror_score.py); loop-quantised; quiet in the first dream and the flood',
        'the dream bed (the house and rain, low-passed and reverberant), the music box slowed for the last dream, a breath across the seam (synthesized or processed)',
    ],
    'elevenlabs_sfx': {'flow_id': 'KoKWpDSnj3uvRbGHTWPT', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': '5 prompts x 4 variations (about 467 credits): rain on a roof 15 s loop, a flooded street 8 s, a front door creaking open 5 s, a mattress giving 3 s, rosary beads 4 s',
                       'reused': 'Episode 44 house-1, and Episode 41 variations (drone-2, stinger-4, riser-3, musicbox-2, neck-4)',
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
