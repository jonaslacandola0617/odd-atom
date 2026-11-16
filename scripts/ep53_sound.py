"""Episode 53 "Two Nights in the Cold Room" (Season 6: two nights in a Nigerian hospital mortuary with my brother,
the night attendant; retold from accounts shared online) sound.

Sound language (this episode's own; nothing from Episode 41's kit): the cold room's compressor and the tubes'
ballast buzz (an ElevenLabs 15 s loop plus a synthesized 100 Hz buzz) run on the power, and so does the score:
in every blackout everything stops dead, and in the black you hear only the generator outside coughing back
into life (its tail is the tubes clicking on) and whatever moves while unseen: a sheet sliding off, stitches
tearing. The light comes back on the one sitting up with a steel tray's shriek (the stinger); on the second
night the generator tries and dies, the torch clicks on, the heads rustle under their sheets, the one beside
me rises with a tray's squeal (the second stinger), and the torch dies. Morning: a far street, a pen.
-14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep53_sound.py
"""
import hashlib, json, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep53-cold-v1'
VOICE = OUT / 'voice'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep53-cold-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(53053)
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



# key times: must match K in src/horror/ep53/Episode53.tsx
l = lambda i: L[i]
HOOK_OFF = 1.3
CUT_WIDE = l('l01')['start']
OFF1 = l('l02')['end'] + 0.45
ON1 = l('l03')['start'] - 0.3
COVER = [l('l04')['end'] - 1.3, l('l04')['end'] - 0.4]
OFF2 = l('l04')['end'] + 0.3
ON2 = l('l04')['end'] + 1.2
OFF3 = l('l04')['end'] + 2.3
ON3 = l('l05')['start'] - 0.5
LAY = [l('l06')['start'] + 2.0, l('l06')['end'] + 0.1]
NIGHT = l('l06')['end'] + 0.35
OFF4 = l('l07')['start'] - 0.2
TORCH_ON = l('l07')['end'] + 0.25
SWEEP = [l('l07')['end'] + 0.4, l('l08')['end'] - 0.3]
RISE = [l('l08')['end'] + 0.15, l('l08')['end'] + 0.85]
TORCH_DIE = l('l08')['end'] + 1.0
CUT_LEDGER = l('l09')['start'] - 0.45
CUT_MORNING = l('l09')['start'] + 3.25
LOOP = l('l09')['end'] + 0.6
HOOK_ON = DUR - 0.3  # the hook's light comes back just before the seam
STINGERS = [ON3, RISE[0]]
SFX = ROOT / 'public/assets/audio/eleven-sfx'
SFX_USED = {}

def sfx(name, gain_db=0.0):
    path = SFX / (f'{name}.mp3' if re.match(r'ep\d', name) else f'ep53-{name}.mp3')
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


# ------------------------------------------------------------------ voice (dry and close)
voice = np.zeros((N, 2))
for lid, ln in L.items():
    v = load(VOICE / f'{lid}.wav')
    v = filt(v, SR, lo=80, hi=11000)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = compress(v)
    v = verb(v, 0.6, 0.05, seed=31, bright=3500)
    place(voice, v, ln['start'], gain=-1.0)
speech = np.zeros(N)
for ln in L.values():
    speech = np.maximum(speech, env([(0, 0), (ln['start'] - 0.1, 0), (ln['start'], 1), (ln['end'], 1), (ln['end'] + 0.25, 0), (DUR, 0)]))
duck = 1 - speech * (1 - db(-9))

OUT.mkdir(parents=True, exist_ok=True)

# the power: 1 while the mains or the generator runs, 0 in every cut (the compressor, the tubes and the score stop)
power = np.clip(1 - span(HOOK_OFF, CUT_WIDE, 0.01) - span(OFF1, ON1, 0.01) - span(OFF2, ON2, 0.01) - span(OFF3, ON3, 0.01) - span(OFF4, CUT_LEDGER, 0.01) - span(LOOP, HOOK_ON, 0.01), 0, 1)
night = np.clip(1 - span(CUT_LEDGER, LOOP, 0.01), 0, 1)
day = 1 - night

# ------------------------------------------------------------------ beds
amb = np.zeros((N, 2))
rm = sfx('room-3')
rbed = wrap(xloop(rm, DUR + 3, 0.6))
amb += rbed * (db(-15) * power * (0.55 + 0.45 * duck) * (1 - 0.5 * day))[:, None]
# the tube ballast's 100 Hz buzz with the light on (a little uneven)
bz = (np.sin(2 * np.pi * qf(100) * T) * 0.6 + np.sin(2 * np.pi * qf(200) * T) * 0.35 + np.sign(np.sin(2 * np.pi * qf(100) * T)) * 0.08) * 0.004
amb += pan(filt(bz, SR, lo=90, hi=3500) * power * night, 0.0)
# the morning: a far street through the high window
street = filt(rng.standard_normal(N), SR, lo=150, hi=1800) * (0.6 + 0.4 * np.sin(2 * np.pi * qf(0.21) * T) ** 2) * 0.012
amb += pan(street * day, -0.4)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
cut = sfx('cut-1')
cm = fade(cut.mean(1), 0.005, 0.3)
for at in (HOOK_OFF, OFF1, OFF2, OFF3, OFF4, LOOP):
    place(fx, pan(cm[: int(1.6 * SR)], 0.0), at - 0.05, -9.0)
# the generator outside: coughing back into life before each return of the light (its tail is the tubes coming on)
gen = sfx('genon-1').mean(1)
GL = len(gen) / SR
for on in (ON1, ON2, ON3):
    place(fx, pan(fade(gen, 0.05, 0.3), -0.3), on - GL + 0.6, -10.0)
place_wrap(fx, pan(fade(gen, 0.05, 0.3), -0.3), HOOK_ON - GL + 0.6, -10.0)
# the tubes clicking on with each return
n = int(0.06 * SR)
tt = np.arange(n) / SR
tclick = filt(rng.standard_normal(n), SR, lo=900, hi=8000) * np.exp(-tt * 90) * 0.25
for at in (CUT_WIDE, ON1, ON2, ON3, NIGHT, HOOK_ON):
    place(fx, pan(tclick, 0.0), at)
    place(fx, pan(tclick, 0.1), at + 0.13, -6.0)
# the second night: the generator tries, and dies
gf = sfx('genfail-2')
place(fx, pan(fade(gf.mean(1), 0.05, 0.3), -0.3), OFF4 + 0.7, -12.0)
# in the first black: a sheet slides, unseen
sh = sfx('sheet-1')
place(fx, pan(fade(sh.mean(1), 0.02, 0.4), 0.35), OFF1 + 0.8, -11.0)
# my brother covers it again
place(fx, pan(fade(sfx('sheet-3').mean(1), 0.05, 0.4)[: int(1.4 * SR)], 0.3), COVER[0], -16.0)
# my brother's steps on the tiles
for j in range(7):
    place(fx, pan(burst(0.07, 300, 3000, 1.0, 0.03), -0.2 + 0.08 * j), l('l04')['start'] - 0.1 + j * 0.45)
# in the third black: stitches tearing, slow and wet
su = sfx('sutures-4')
place(fx, pan(fade(su.mean(1), 0.05, 0.4), -0.25), OFF3 + 0.3, -12.0)
# the light comes back on it sitting up: the tray shrieks (the stinger)
tr = sfx('tray-1')
trm = tr.mean(1)[: int((l('l05')['start'] - ON3 + 0.1) * SR)]
place(fx, pan(fade(trm, 0.0, 0.3), -0.2), ON3 - 0.02, -2.0)
# he lays it down: the tray grinding under it
place(fx, pan(fade(sfx('tray-2').mean(1), 0.1, 0.5), -0.2), LAY[0] + 0.3, -16.0)
# the torch: its click, the heads turning as the beam finds them, the near one rising (the second stinger), the torch dying
n = int(0.04 * SR)
tt = np.arange(n) / SR
place(fx, pan(filt(rng.standard_normal(n), SR, lo=1500, hi=7000) * np.exp(-tt * 150) * 0.35, -0.3), TORCH_ON)
hd = sfx('heads-3')
place(fx, pan(fade(hd.mean(1), 0.05, 0.5), 0.2), SWEEP[0] + 0.2, -14.0)
place(fx, pan(sfx('sheet-4').mean(1), -0.4), RISE[0], -4.0)
place(fx, pan(fade(sfx('tray-3').mean(1), 0.0, 0.5), -0.4), RISE[0] + 0.05, -6.0)
for j in range(4):
    place(fx, pan(burst(0.05, 2000, 8000, 1.0, 0.04), -0.3), TORCH_DIE - 0.45 + j * 0.12)
place(fx, pan(tclick, -0.3), TORCH_DIE, -3.0)
# the morning: his pen down the column
for j in range(10):
    place(fx, pan(burst(0.12, 2500, 9000, 1.0, 0.015), 0.1), CUT_LEDGER + 0.4 + j * 0.27)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ the score: it runs on the power too
mus = np.zeros((N, 2))
d_e = env([(-10, 0.6), (CUT_WIDE, 0.35), (ON1, 0.6), (ON3, 1.4), (NIGHT, 0.7), (OFF4, 0.0), (TORCH_ON, 0.9), (RISE[0], 1.6), (TORCH_DIE, 0.0), (CUT_LEDGER, 0.25), (LOOP, 0.0), (HOOK_ON, 0.6), (DUR + 10, 0.6)])
pw_score = np.clip(power + span(TORCH_ON, TORCH_DIE, 0.01), 0, 1)
mus += st(hs.drone_mid(T, qf, d_e, root=36.71) * 1.3) * pw_score[:, None]
cd = sfx('drone-1')
mus += wrap(xloop(cd, DUR + 3, 0.8)) * (db(-19) * pw_score * env([(-10, 0.7), (CUT_WIDE, 0.5), (ON3, 1.0), (CUT_LEDGER, 0.4), (DUR + 10, 0.7)]))[:, None]
str_e = env([(-10, 0.5), (CUT_WIDE, 0.0), (ON1, 0.4), (ON3, 1.2), (NIGHT, 0.5), (TORCH_ON, 0.8), (RISE[0], 1.5), (TORCH_DIE, 0.0), (DUR + 10, 0.5)])
trem = env([(-10, 0.5), (ON3, 1.0), (TORCH_ON, 1.0), (DUR + 10, 1.0)])
mus += st(hs.strings(T, qf, [65.41, 69.30, 98.00, 146.83], str_e, trem, SR, seed=5308) * 1.8) * pw_score[:, None]
place(mus, fade(hs.stinger(SR, seed=5311, size=1.2)[: int((l('l05')['start'] - ON3 + 0.2) * SR)], 0.0, 0.3), ON3, -6.0)
place(mus, hs.stinger(SR, seed=5313, size=1.0), RISE[0], -7.0)
place(mus, st(hs.metal_bow(SR, 3.0, 640.0, seed=5309)), SWEEP[0], -12.0)
place(mus, st(hs.heartbeat(SR, TORCH_ON, RISE[0] - 0.05, 70, 118, gain=0.3, seed=5312)), TORCH_ON)
mus = np.stack([filt(mus[:, 0], SR, lo=100, hi=12000), filt(mus[:, 1], SR, lo=100, hi=12000)], 1)
mus *= (1 - speech * (1 - db(-8)))[:, None] * db(-3.0)
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
take = ROOT / 'public/assets/audio/eleven-takes/ep53-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep53TwoNightsInTheColdRoom',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (ElevenLabs library voice)', 'credits': json.loads((ROOT / 'docs/production/ep53-cold/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep53-cold/prompt.json'},

    'original_synthesis': [
        'SCORE: a mid-band drone (root 36.7 Hz) and a string cluster that tighten through the first night and stop dead in every blackout, a synthesized stinger at the one sitting up and at the one that rises toward me, bowed metal under the torch, a heartbeat while the torch searches (scripts/horror_score.py); loop-quantised',
        'the tube ballast buzz and its click when the light returns, the torch click and its dying flicker, a pen on paper, a far morning street (synthesized)',
    ],
    'elevenlabs_sfx': {'flow_id': 'SuHzrmyga31E9t0PiTA2', 'model': 'eleven_text_to_sound_v2', 'used': SFX_USED,
                       'generated': '9 prompts x 4 variations, duration set on the node (about 860 credits): cold room 15 s loop, power cut 3 s, generator restart 5 s, generator failing 4 s, sheet sliding 3 s, tray squeal 3 s, sutures tearing 3 s, heads turning under sheets 3 s, cold drone 20 s loop',
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
