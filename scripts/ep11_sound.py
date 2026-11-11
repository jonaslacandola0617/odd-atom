"""Episode 11 "The Passenger on Balete Drive" sound, to the Season 2 horror standard
(docs/production/EPISODE_PLAYBOOK.md).

- Narrator: the ElevenLabs Taglish take (Juanito, scripts/ep11_voice.py), close and dry.
- Score (scripts/horror_score.py): mid-band drone, tremolo string clusters, the music-box theme
  detuned from the start, a reversed swell into ONE stinger in silence (the reveal in the mirror),
  a heartbeat rising from "Pagtingin nila sa salamin" to the reveal, a riser, bowed metal.
- Balete Drive at night (Filipino ambience): kuliglig (crickets) behind the compound walls, a tuko
  calling "to-kay" in uneven repeats, distant dogs, and a karaoke far off behind a wall that
  stops mid-song the moment the meter starts by itself (she is in the car); the crickets stop for
  the held silence before the reveal.
- The taxi: engine and road inside the cab (outside, the taxi passing), the meter's flag-down clack
  and its ticks, the rosary's beads, the dash light's electrical crackle as it flickers, a whoosh
  as she is at the side window, a whip and a seat creak as the driver turns.
- Silence: 1.3 s of near silence before the reveal (the engine sinks, everything else drops out).
Ducks 7 dB under speech; presence in the phone band; -14 LUFS with an encoded-AAC peak check;
stems as FLAC.  Run: python3 scripts/ep11_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep11-balete-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep11-balete-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(11011)
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



# key times: must match K in src/horror/ep11/Episode11.tsx (the same rules on the same timeline)
METER_ON = L['l05']['end'] + 0.75
BESIDE = L['l05']['start'] + 1.2
WINDOW = L['l05']['end'] + 0.12
SILENCE = L['l07']['end'] + 0.25
REVEAL = L['l07']['end'] + 1.55
TURN = L['l07']['end'] + 2.55
LOOP_ON = DUR - 1.6
STINGERS = [REVEAL]
# shots seen from outside the cab (src/horror/ep11/Episode11.tsx: C_lady, I_high)
OUTSIDE = [(L['l04']['start'], L['l05']['start']), (L['l08']['start'] + 3.6, L['l09']['end'] + 0.3)]


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


outside = np.minimum(1, sum(span(a, b) for a, b in OUTSIDE))
inside = 1 - outside
hush = env([(0, 1), (SILENCE - 0.05, 1), (SILENCE + 0.35, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1), (DUR, 1)])  # the held silence

OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v = filt(v, SR, lo=70)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = np.tanh(v * 1.4) / 1.4
    v = verb(v, 1.2, 0.08, seed=11, bright=3500)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
drone_e = env([(0, 0.75), (L['l04']['start'], 0.9), (METER_ON, 1.0), (L['l07']['start'], 1.15), (SILENCE, 1.15), (SILENCE + 0.4, 0.0), (REVEAL - 0.02, 0.0), (REVEAL, 1.5),
                (TURN + 1.0, 1.0), (L['l09']['start'], 0.8), (L['l10']['start'], 0.95), (LOOP_ON, 0.75), (DUR, 0.75)])
mus += st(hs.drone_mid(T, qf, drone_e, root=103.83) * 1.6)
str_e = env([(0, 0.5), (L['l03']['start'], 0.6), (L['l04']['start'], 0.8), (WINDOW, 1.1), (METER_ON, 1.0), (L['l07']['start'], 1.2), (SILENCE, 1.2), (SILENCE + 0.4, 0.0),
             (REVEAL - 0.02, 0.0), (REVEAL + 0.1, 1.5), (TURN + 2, 0.8), (L['l09']['start'], 0.5), (L['l10']['start'], 0.8), (LOOP_ON, 0.5), (DUR, 0.5)])
trem = env([(0, 0.3), (L['l04']['start'], 0.5), (METER_ON, 0.7), (L['l07']['start'], 1.0), (REVEAL, 1.0), (L['l09']['start'], 0.3), (L['l10']['start'], 0.6), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [207.65, 220.0, 311.13], str_e, trem, SR, seed=201) * 2.2)
mus += st(hs.strings(T, qf, [329.63, 466.16], env([(0, 0), (REVEAL - 0.02, 0), (REVEAL + 0.1, 1.2), (TURN + 2.5, 0.0), (DUR, 0)]), None, SR, seed=202))
# the theme, detuned from the start (a song you half-remember), slower and flatter at the end
for t0, rate, det, g in [(L['l01']['end'] + 0.1, 0.45, 0.985, -3.5), (L['l03']['start'] + 0.2, 0.5, 0.978, -3.0), (L['l09']['start'] + 0.1, 0.62, 0.968, -2.5)]:
    place(mus, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0)), t0, g + 4)
place(mus, hs.reverse_swell(SR, [207.65, 311.13, 440.0], 0.5, seed=211), REVEAL - 0.5)
place(mus, hs.stinger(SR, seed=212, size=1.25), REVEAL)
# a heart that speeds up from "Pagtingin nila sa salamin" and stops dead for the held silence
place(mus, hs.heartbeat(SR, L['l06']['start'], SILENCE, 70, 112, gain=0.95, seed=213), L['l06']['start'])
place(mus, hs.riser(SR, 1.6, seed=214), SILENCE - 1.6)
place(mus, st(hs.metal_bow(SR, 4.5, 1240, seed=215)), TURN + 0.2)
place(mus, st(hs.metal_bow(SR, 3.5, 1530, seed=216)), L['l10']['start'] + 0.3)
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-4.0)
mus *= hush[:, None]
# the loop: frame 0 opens under the first line (music ducked), so ease the tail to that level
mus *= env([(0, 1), (LOOP_ON, 1), (DUR - 0.3, db(-2.6)), (DUR, db(-2.6))])[:, None]
write(OUT / 'stem-score.wav', mus)

# ------------------------------------------------------------------ Balete Drive at night
amb = np.zeros((N, 2))
# the taxi: engine harmonics and road noise inside; outside, the same engine further off
rpm = 1 + 0.03 * np.sin(2 * np.pi * qf(0.13) * T)
eng = sum(np.sin(2 * np.pi * qf(f) * T * 1.0 + k) * a for k, (f, a) in enumerate([(47.0, 1.0), (94.0, 0.6), (141.0, 0.35), (188.0, 0.2)])) * rpm
road = filt(rng.standard_normal(N), SR, lo=90, hi=900)
cab = filt(eng * 0.022, SR, lo=60, hi=400) + road * 0.017
cab_level = inside * 1.0 + outside * 0.35
amb += st(cab * cab_level * np.maximum(hush, 0.25))
# kuliglig behind the walls: three insects as whole-cycle chirp trains
crick = np.zeros(N)
for f, rate, ph, g in [(4500, 1.1, 0.0, 1.0), (4120, 0.8, 2.1, 0.8), (5050, 1.5, 3.9, 0.6)]:
    train = (np.sin(2 * np.pi * qf(rate) * T + ph) > 0.5).astype(float)
    pulse = (np.sin(2 * np.pi * qf(31.0) * T + ph) > 0.2).astype(float)
    crick += np.sin(2 * np.pi * qf(f) * T) * train * pulse * g
crick = filt(crick, SR, lo=2500, hi=7500)
amb += st(crick * (0.006 * inside + 0.014 * outside) * hush)
# a karaoke far off behind a compound wall: a muffled sung melody over a beat, until she is in the car
kar = np.zeros(N)
notes = [261.6, 293.7, 329.6, 392.0, 329.6, 293.7, 261.6, 220.0]
step = 0.42
for i, t0 in enumerate(np.arange(0, DUR, step)):
    f = notes[i % len(notes)] * (1 + 0.01 * np.sin(i))
    n = int(step * 0.95 * SR)
    tt = np.arange(n) / SR
    tone = (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(4 * np.pi * f * tt) + 0.25 * np.sin(6 * np.pi * f * tt)) * np.minimum(1, tt * 30) * np.exp(-tt * 1.2)
    a = int(t0 * SR)
    kar[a:a + n] += tone[:max(0, min(n, N - a))]
    if i % 2 == 0:
        kick = np.sin(2 * np.pi * 60 * tt[:int(0.12 * SR)]) * np.exp(-tt[:int(0.12 * SR)] * 30)
        kar[a:a + len(kick)] += kick[:max(0, min(len(kick), N - a))] * 1.5
kar = filt(kar, SR, lo=180, hi=1400)
kar = verb(kar, 1.6, 0.4, seed=221, bright=1500)
# it stops mid-song the moment the meter starts by itself; it is playing again for the next taxi
kar *= env([(0, 1), (METER_ON - 0.02, 1), (METER_ON, 0), (L['l10']['start'] - 0.6, 0), (L['l10']['start'] + 0.6, 1), (DUR, 1)])[:, None]
amb += st(kar * 0.012)
amb *= np.maximum(hush, 0.0)[:, None]
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def tuko(gain=0.05):
    # the tokay gecko: a rising croak, then "to-kay" calls, slower each time
    out = []
    for k in range(4):
        n = int(0.22 * SR)
        tt = np.arange(n) / SR
        f = 380 + 80 * np.sin(np.pi * tt / 0.22)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.22) * (1 + 0.6 * np.sign(np.sin(2 * np.pi * 35 * tt)))
        out.append(s * 0.8)
        out.append(np.zeros(int(0.12 * SR)))
        n2 = int(0.3 * SR)
        t2 = np.arange(n2) / SR
        f2 = 300 - 60 * t2 / 0.3
        out.append(np.sin(2 * np.pi * np.cumsum(f2) / SR) * np.sin(np.pi * t2 / 0.3) * (1 + 0.6 * np.sign(np.sin(2 * np.pi * 30 * t2))))
        out.append(np.zeros(int((0.7 + 0.25 * k) * SR)))
    return verb(filt(np.concatenate(out), SR, lo=200, hi=2500) * gain, 1.4, 0.35, seed=231)


def bark(gain=0.03):
    out = []
    for k in range(3):
        n = int(0.16 * SR)
        tt = np.arange(n) / SR
        f = 520 - 200 * tt / 0.16
        out.append(filt(np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * rng.standard_normal(n), SR, lo=300, hi=1800) * np.exp(-tt * 18))
        out.append(np.zeros(int((0.25 + 0.1 * k) * SR)))
    return verb(np.concatenate(out) * gain, 2.0, 0.6, seed=232, bright=1800)


# Filipino night: a tuko calls twice, dogs far off (both before the silence; none after the turn)
place(fx, st(tuko(0.05)), 7.0)
place(fx, st(tuko(0.04)), L['l09']['start'] + 0.2)
place(fx, st(bark(0.03)), L['l03']['start'] + 1.0)
place(fx, st(bark(0.025)), L['l04']['start'] + 2.2)
# outside: the taxi passes the balete (a doppler swish) as she raises her hand
tp = np.arange(int(2.4 * SR)) / SR
swish = filt(rng.standard_normal(len(tp)), SR, lo=120, hi=1500) * np.exp(-((tp - 1.4) / 0.5) ** 2) * 0.12
place(fx, st(swish), L['l04']['start'] + 1.6)
# she is at the side window: a short reverse swell and a breath, then gone
place(fx, hs.reverse_swell(SR, [311.13, 466.16], 0.35, seed=241) * 0.8, WINDOW - 0.35)
place(fx, lib('perspective_whip'), WINDOW, -8)
# the meter starts by itself: the flag-down clack, then a soft tick at each step of the fare
place(fx, lib('steel_latch'), METER_ON, -10)
for t0 in list(np.arange(METER_ON + 2.5, TURN + 0.6, 2.5)) + list(np.arange(L['l10']['start'] + 2.5, LOOP_ON, 2.5)):
    nn = int(0.03 * SR)
    tt = np.arange(nn) / SR
    if not (SILENCE <= t0 < REVEAL):
        place(fx, st(np.sin(2 * np.pi * 2200 * tt) * np.exp(-tt * 140) * 0.025), t0)
# the rosary's beads clicking as it swings (stops while she is in the car)
for t0 in list(np.arange(0.4, METER_ON, 1.9 / 2)) + list(np.arange(L['l10']['start'] + 1.2, DUR, 1.9 / 2)):
    nn = int(0.02 * SR)
    tt = np.arange(nn) / SR
    place(fx, st(filt(rng.standard_normal(nn), SR, lo=2500, hi=7000) * np.exp(-tt * 200) * 0.02), t0 + rng.random() * 0.05)
# the dash light's electrical crackle as it flickers (from "may nakaupo" to the silence)
crk = filt(rng.standard_normal(N), SR, lo=1500, hi=6000) * (rng.random(N) < 0.004) * 0.25
crk_env = span(L['l07']['start'], SILENCE, 0.1)
fx += st(crk * crk_env)
# the reveal: a low hit under the stinger, and a breath close to the ear
place(fx, lib('low_cinematic_hit'), REVEAL, -5)
tb = np.arange(int(1.1 * SR)) / SR
breath = filt(rng.standard_normal(len(tb)), SR, lo=500, hi=3500) * np.sin(np.pi * tb / 1.1) ** 2 * 0.05
place(fx, st(breath), REVEAL + 0.1)
# the driver turns: a whip and the seat creaking
place(fx, lib('perspective_whip'), TURN, -6)
place(fx, lib('wood_stress'), TURN + 0.15, -12)
write(OUT / 'stem-foley-fx.wav', fx)
tvb = np.zeros((N, 2))
PRESENCE = hs.presence(voice, mus, TL['lines'], SR)

# ------------------------------------------------------------------ every line at least 4.5 dB over everything else (lift at most 8 dB)
LIFTS = {}
for lid, l in L.items():
    a, b = int(l['start'] * SR), int((l['end'] + 0.12) * SR)
    rest = (tvb + amb + mus + fx)[a:b].mean(1)
    m = 20 * np.log10(np.sqrt(np.mean(voice[a:b].mean(1) ** 2)) + 1e-12) - 20 * np.log10(np.sqrt(np.mean(rest ** 2)) + 1e-12)
    LIFTS[lid] = round(float(min(8.0, max(0.0, 4.6 - m))), 1)
    voice[a:b] *= db(LIFTS[lid])
write(OUT / 'stem-voice.wav', voice)
PRESENCE = hs.presence(voice, mus, TL['lines'], SR)

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
                    'voice_minus_score_db': round(float(rms_db(voice[a:b].mean(1)) - rms_db(mus[a:b].mean(1))), 1)})
clash = [h for h in STINGERS for l in L.values() if l['start'] - 0.05 <= h <= l['end'] + 0.1]
head = rms_db(mix[:SR // 4].mean(1))
tail = rms_db(mix[-SR // 4:].mean(1))
for stem in OUT.glob('stem-*.wav'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(stem), '-c:a', 'flac', str(stem.with_suffix('.flac'))], check=True)
    stem.unlink()
take = ROOT / 'public/assets/audio/eleven-takes/ep11-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep11ThePassengerOnBaleteDrive',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'u1CVBnSUn9JiL8ssgd2v', 'voice_name': 'Juanito (library voice, Filipino)', 'credits': '774 for the one take that generated (the second of the two did not start: busy)',
                       'prompt': 'docs/production/ep11-balete/prompt.json'},
    'original_synthesis': [
        'score (scripts/horror_score.py): G#2/D#3 mid-band drone; tremolo string clusters (G#3-A3-D#4, +E4/A#4 on the reveal); the music-box theme detuned from the start and slower at the end; a reversed swell into one stinger in silence (the reveal); a heartbeat 70-112 bpm that stops for the held silence; a riser; bowed metal',
        'Balete Drive: the taxi engine and road inside the cab; kuliglig (crickets) behind the walls; a far karaoke that stops mid-song when the meter starts by itself; a tuko calling twice; distant dogs',
        'foley: the taxi passing the balete; a swell and whip as she is at the side window; the meter flag-down clack and ticks; the rosary beads; the dash light crackling as it flickers; a breath at the reveal; the driver turning',
        'silence: from just after "may nakaupo na sa likod" the score, crickets and foley drop out and the engine sinks for 1.3 s before the stinger',
        'loop: drone, strings, engine and crickets snapped to whole cycles; the hook and the end are the same mirror move',
    ],
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
