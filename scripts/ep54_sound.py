"""Episode 54 "Monitor" (Season 6: a babysitter's night with twins asleep upstairs and the baby monitor beside him;
retold from accounts shared online) sound.

Sound language (this episode's own; nothing from Episode 41's kit): the monitor's hiss and crackle carry most of
the episode, close when it is in my hands; the house in winter (furnace, wind) downstairs; the sound-level LEDs
tick as they light in a silent room; the voice comes through the tiny speaker (band-limited, driven); the pan
motor whirs out and back; a burst of static on the refresh where it is bent over the crib; my feet on the
stairs, the door, the light; and at the end, both units in one room: feedback and static as it is behind me.
-14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep54_sound.py
"""
import hashlib, json, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep54-monitor-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep54-monitor-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(54054)
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



# key times: must match K in src/horror/ep54/Episode54.tsx
l = lambda i: L[i]
CUT_COUCH = l('l01')['start'] + 0.4
CUT_MON = l('l01')['end'] - 1.6
LEDS = l('s01')['start'] - 1.1
PAN_OUT = [l('l02')['end'] + 0.4, l('l02')['end'] + 1.3]
PAN_BACK = [l('l02')['end'] + 2.2, l('l02')['end'] + 3.1]
BENT = l('l02')['end'] + 2.75
CUT_STAIRS = l('l03')['end'] + 0.35
DOOR = l('l03')['end'] + 1.75
CUT_HAND = l('l04')['start'] + 3.85
BEHIND = l('l04')['end'] + 0.3
LOOP = DUR - 1.4
STINGERS = [PAN_BACK[1] - 0.05, BEHIND]
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}

def sfx(name, gain_db=0.0):
    path = SFX / (f'{name}.mp3' if re.match(r'ep\d', name) else f'ep54-{name}.mp3')
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



# ------------------------------------------------------------------ voice: the narrator dry and close; the speaker line through the monitor
voice = np.zeros((N, 2))
for lid, ln in L.items():
    v = load(VOICE / f'{lid}.wav')
    if ln.get('kind') == 'speaker':
        # a tiny speaker: band-limited, a little driven, with the hiss under it
        v = filt(v, SR, lo=380, hi=3200)
        v = np.tanh(v / (np.abs(v).max() + 1e-9) * 2.2)
        v = v + filt(rng.standard_normal(len(v)), SR, lo=1500, hi=6000) * 0.04
    else:
        v = filt(v, SR, lo=80, hi=11000)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = compress(v)
    v = verb(v, 0.5, 0.03, seed=32, bright=3500)
    place(voice, v, ln['start'], gain=-1.0 if ln.get('kind') != 'speaker' else -2.0)
speech = np.zeros(N)
for ln in L.values():
    speech = np.maximum(speech, env([(0, 0), (ln['start'] - 0.1, 0), (ln['start'], 1), (ln['end'], 1), (ln['end'] + 0.25, 0), (DUR, 0)]))
duck = 1 - speech * (1 - db(-9))

OUT.mkdir(parents=True, exist_ok=True)

device = np.clip(1 - span(CUT_COUCH, CUT_MON, 0.005) - span(CUT_STAIRS, CUT_HAND, 0.005), 0, 1)  # the monitor in my hands, close
down = np.clip(1 - span(CUT_STAIRS, LOOP, 0.005), 0, 1)  # downstairs (the living room)
up = 1 - down

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
hs_ = sfx('house-2')
amb += wrap(xloop(hs_, DUR + 3, 0.6)) * (db(-16) * (0.5 + 0.5 * down) * (0.85 + 0.15 * duck))[:, None]
# the monitor's hiss: soft noise and digital crackle, close when it is in my hands, quieter on the couch
hiss = filt(rng.standard_normal(N), SR, lo=1200, hi=9000) * 0.016
crack = (rng.random(N) > 0.9993) * rng.standard_normal(N) * 0.25
hiss = hiss + filt(crack, SR, lo=2000, hi=8000)
amb += pan(hiss * (0.35 + 0.65 * device) * (0.92 + 0.08 * duck), 0.0)
amb += wrap(xloop(sfx('hiss-3'), DUR + 3, 0.5)) * (db(-30) * device)[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# the sound-level LEDs: a tick each time they light (from LEDS to the end of the whisper)
f = 0
for i in range(int((LEDS) * 12), int((l('s01')['end'] + 0.4) * 12)):
    at = i / 12
    if rng.random() > 0.45:
        n = int(0.012 * SR)
        tt = np.arange(n) / SR
        place(fx, pan(np.sin(2 * np.pi * 3200 * tt) * np.exp(-tt * 600) * 0.05, 0.1), at)
# the pan: the motor whirs out and back
pm = sfx('pan-4')
place(fx, pan(fade(pm.mean(1), 0.02, 0.2), 0.15), PAN_OUT[0] - 0.05, -8.0)
# the refresh where it is bent over the crib: a burst of static (the stinger)
st_ = sfx('static-2')
place(fx, pan(fade(st_.mean(1)[: int(0.9 * SR)], 0.0, 0.25), 0.0), STINGERS[0], -3.0)
# up the stairs; the door; the light
place(fx, pan(fade(sfx('stairs-4').mean(1), 0.02, 0.2), 0.0), CUT_STAIRS + 0.02, -6.0)
dl = sfx('door-3')
place(fx, pan(fade(dl.mean(1), 0.0, 0.2), 0.2), DOOR - 0.05, -6.0)
# between two refreshes it is behind me: both units in one room: feedback, and the static
fb = sfx('feedback-3')
place(fx, pan(fade(fb.mean(1)[: int(1.9 * SR)], 0.0, 0.3), 0.0), BEHIND, -5.0)
place(fx, pan(fade(sfx('static-3').mean(1)[: int(0.6 * SR)], 0.0, 0.2), 0.0), BEHIND, -6.0)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the score
mus = np.zeros((N, 2))
d_e = env([(-10, 0.6), (CUT_COUCH, 0.4), (LEDS, 0.8), (PAN_OUT[0], 1.1), (STINGERS[0], 1.5), (CUT_STAIRS, 1.2), (CUT_HAND, 0.6), (BEHIND, 1.6), (LOOP, 0.6), (DUR + 10, 0.6)])
mus += st(hs.drone_mid(T, qf, d_e, root=41.2) * 1.2)
nd = sfx('drone-3')
mus += wrap(xloop(nd, DUR + 3, 0.8)) * (db(-20) * env([(-10, 0.8), (CUT_COUCH, 0.5), (LEDS, 0.9), (CUT_STAIRS, 0.0), (CUT_HAND, 0.6), (DUR + 10, 0.8)]))[:, None]
str_e = env([(-10, 0.5), (CUT_COUCH, 0.0), (LEDS, 0.5), (PAN_OUT[0], 1.0), (STINGERS[0], 1.4), (CUT_STAIRS, 0.0), (CUT_HAND, 0.4), (BEHIND, 1.5), (LOOP, 0.5), (DUR + 10, 0.5)])
trem = env([(-10, 0.5), (PAN_OUT[0], 1.0), (DUR + 10, 1.0)])
mus += st(hs.strings(T, qf, [87.31, 92.50, 130.81, 185.00], str_e, trem, SR, seed=5408) * 1.6)
place(mus, st(hs.metal_bow(SR, 2.6, 880.0, seed=5409)), l('s01')['start'] - 0.3, -13.0)
place(mus, hs.stinger(SR, seed=5411, size=1.1), STINGERS[0], -7.0)
place(mus, hs.stinger(SR, seed=5413, size=1.3), BEHIND, -6.0)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep54-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep54Monitor',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (ElevenLabs library voice)', 'credits': json.loads((ROOT / 'docs/production/ep54-monitor/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep54-monitor/prompt.json'},

    'original_synthesis': [
        'SCORE: a mid-band drone (root 41.2 Hz) and a high string cluster that tighten to the pan and to the end, bowed metal under the whisper, a synthesized stinger at each refresh where it has moved (scripts/horror_score.py); loop-quantised',
        'the monitor hiss (filtered noise with digital crackle), the LED ticks, the speaker band on the whisper (synthesized processing of the ElevenLabs take)',
    ],
    'elevenlabs_sfx': {'flow_id': '3JiSPiXPisi0ASA1us0u', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': '8 prompts x 4 variations, duration set on the node (about 840 credits): monitor hiss 15 s loop (all four takes nearly silent; synthesized instead), winter house 15 s loop, pan motor 3 s, feedback squeal 3 s, stairs run 3 s, door and light 2 s, static burst 2 s, nursery drone 20 s loop',
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
