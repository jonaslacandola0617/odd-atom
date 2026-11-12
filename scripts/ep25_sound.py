"""Episode 25 "Camera Three" sound (Season 3: the Hampton Court Palace CCTV figure, 2003).

Sound language: NEAR SILENCE; the only loud sound is the doors. No score.
- CCTV shots have no sound of their own (CCTV has no microphone): we hear the control room, its
  monitors' hum (ElevenLabs SFX), and the fire-door alarm panel beeping when the doors open; the
  doors themselves are heard through the building (ElevenLabs SFX, filtered);
- when the robed figure pulls the doors shut, the alarm simply stops;
- the patrol: footsteps on boards and keys (ElevenLabs SFX), the torch clicking, the gallery's air;
  the guard pushing the doors shut; hurrying back;
- the turn: the footsteps stop; a whip of cloth; the torch clicks off; one low hit on the face; then
  silence.
Presence is measured with the whole non-voice bed. -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep25_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep25-hampton-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep25-hampton-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(25025)
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



# key times: must match K in src/horror/ep25/Episode25.tsx
BURST1 = L['l01']['end'] + 0.35
CUT_POV1 = L['l01']['end'] + 1.75
REACH = L['l03']['end'] + 0.35
SHUT1 = (L['l03']['end'] + 0.5, L['l03']['end'] + 1.3)
CUT_GRID1 = L['l04']['start'] - 0.1
CUT_CAM4 = L['l04']['end'] + 0.15
BURST2 = L['l04']['end'] + 0.45
PULL = (L['l05']['end'] - 1.6, L['l05']['end'] + 0.6)
CUT_POV2 = L['l05']['end'] + 2.0
CUT_GRID2 = L['l06']['end'] + 0.4
CUT_CAM3 = L['l09']['end'] + 0.25
CUT_TURN = L['l09']['end'] + 1.6
TORCH_OUT = L['l09']['end'] + 2.55
FACE = (L['l09']['end'] + 2.6, L['l09']['end'] + 2.8)
STINGERS = [BURST1, BURST2, FACE[0]]
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}


def sfx(name, gain_db=0.0):
    path = SFX / f'ep25-{name}.mp3'
    SFX_USED[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    x = load(path, 2)
    x = x / (np.abs(x).max() + 1e-9) * 0.5
    return x * db(gain_db)


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


def pan(x, p):
    x = x if x.ndim == 1 else x.mean(1)
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1)


cctv = np.maximum.reduce([span(0, CUT_POV1, 0.005), span(CUT_GRID1, CUT_POV2, 0.005), span(CUT_GRID2, CUT_TURN, 0.005)])
pov = 1 - cctv
black = span(FACE[1], DUR, 0.005)
alarm_on = np.maximum(span(BURST1, SHUT1[1], 0.005), span(BURST2, PULL[1], 0.005))

OUT.mkdir(parents=True, exist_ok=True)

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
for lid, l in L.items():
    v = load(VOICE / f'{lid}.wav')
    v = filt(v, SR, lo=80, hi=11000)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = compress(v)
    v = verb(v, 0.5, 0.04, seed=21, bright=3000)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ rooms
amb = np.zeros((N, 2))
hum = sfx('room-1')
hum = np.concatenate([hum] * int(np.ceil(DUR / (len(hum) / SR)) + 1))[:N]
amb += hum * (db(-20) * cctv)[:, None]
amb += st(filt(np.sin(2 * np.pi * qf(50) * T) + 0.5 * np.sin(2 * np.pi * qf(100) * T), SR, lo=40, hi=400) * 0.004 * cctv)
air = np.stack([filt(rng.standard_normal(N), SR, lo=60, hi=900), filt(rng.standard_normal(N), SR, lo=60, hi=900)], 1)
amb += air * (0.012 * pov)[:, None]
amb *= ((1 - black) * (1 - speech * (1 - db(-6))))[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
# the fire-door alarm panel in the control room: it beeps while the doors are open, and simply stops
beep = np.zeros(N)
for t0 in np.arange(0, DUR, 0.5):
    i = int(t0 * SR)
    n = int(0.12 * SR)
    beep[i:i + n] += np.sin(2 * np.pi * 2900 * np.arange(min(n, N - i)) / SR) * 0.03
fx += pan(beep * alarm_on * (0.35 + 0.65 * cctv) * (1 - speech * (1 - db(-8))), 0.3)
# the doors bursting open: loud at the hook (the scare); later heard through the building
place(fx, st(sfx('burst-1')), BURST1, -1)
place(fx, st(filt(sfx('burst-3'), SR, hi=1500)), BURST2, -6)
# the patrol: footsteps and keys, the torch clicking on, pushing the doors shut, hurrying back
steps = np.concatenate([sfx(f'steps-{i}') for i in (1, 2, 3, 1, 2, 3)])
place(fx, steps[:int((REACH - CUT_POV1) * SR)], CUT_POV1, -8)
ck = int(0.03 * SR)
place(fx, st(filt(rng.standard_normal(ck), SR, lo=2000, hi=8000) * np.exp(-np.arange(ck) / SR * 150) * 0.12), CUT_POV1 + 0.1)
place(fx, st(sfx('shut-1')), SHUT1[0], -4)
fast = np.concatenate([sfx(f'steps-{i}') for i in (2, 3, 1, 2)])
fast = fast[::1] if len(fast) else fast
place(fx, fast[:int((CUT_GRID2 - CUT_POV2 - 0.3) * SR)], CUT_POV2, -6)
place(fx, st(sfx('shut-3')), CUT_GRID2 - 0.6, -14)  # his hand on the push bar: shut
# the turn: cloth, the torch clicking off, one low hit on the face
n = int(0.3 * SR)
tt = np.arange(n) / SR
place(fx, st(filt(rng.standard_normal(n), SR, lo=600, hi=5000) * np.sin(np.pi * tt / 0.3) * 0.05), CUT_TURN)
place(fx, st(filt(rng.standard_normal(ck), SR, lo=2000, hi=8000) * np.exp(-np.arange(ck) / SR * 150) * 0.15), TORCH_OUT)
n = int(0.6 * SR)
tt = np.arange(n) / SR
place(fx, st((np.sin(2 * np.pi * 50 * tt) + 0.6 * np.sin(2 * np.pi * 100 * tt)) * np.exp(-tt * 6) * 0.45), FACE[0])
place(fx, st(filt(rng.standard_normal(int(0.3 * SR)), SR, lo=400, hi=7000) * np.exp(-np.arange(int(0.3 * SR)) / SR * 15) * 0.25), FACE[0])
fx[int(FACE[1] * SR):] *= np.linspace(1, 0, N - int(FACE[1] * SR))[:, None] ** 4
write(OUT / 'stem-foley-fx.wav', fx)
mus = np.zeros((N, 2))  # no score in this episode
tvb = np.zeros((N, 2))
bed = amb + fx
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
take = ROOT / 'public/assets/audio/eleven-takes/ep25-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep25CameraThree',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (library voice)', 'credits': json.loads((ROOT / 'docs/production/ep25-hampton/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep25-hampton/prompt.json'},
    'original_synthesis': [
        'NO SCORE: near silence; the only loud sound is the doors (Season 3 sound language for Episode 25)',
        'the fire-door alarm panel beeping (2.9 kHz) while the doors are open; mains hum; the gallery air; the torch clicks; cloth on the turn; one low hit (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'v8zP0Uv9sccfMY4LdoWe', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED, 'note': 'four prompts x four variations (68 credits per prompt); picked by measurement, not by listening'},
    'music_presence_note': 'there is no music; music_presence measures the whole non-voice bed against the voice',
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
