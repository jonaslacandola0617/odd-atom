"""Episode 6 "The Sound That Matched Us" sound, built to a new horror standard after the
user's note that earlier episodes had no audible eerie music: a clearly present score from
scripts/horror_score.py (mid-band drone, tremolo strings, a detuned music-box theme,
reversed swells, stingers on every scare, a heartbeat that races, a riser into the
knocks, bowed metal), plus the boat: engine hum that dies at ALL STOP, sonar pings, the
rattling panel, the telegraph bell, three heavy knocks on the hull, drips, the sea at dawn.
The music ducks 7 dB under speech and its presence is measured in the phone band.

Inputs: voice lines from scripts/ep06_voice.py, src/data/ep06-sonar-v1-timeline.json,
Curio library cues (user-authorised).  Everything else is synthesised (seeded).
Outputs FLAC stems, mix.m4a and PROVENANCE.json under public/assets/audio/ep06-sonar-v1/.
Run: python3 scripts/ep06_sound.py
"""
import hashlib, json, subprocess, wave
from pathlib import Path
import numpy as np
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep06-sonar-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep06-sonar-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(DUR * SR)
T = np.arange(N) / SR
rng = np.random.default_rng(6006)
LINES = {l['id']: l for l in TL['lines']}


def qf(f):
    """Snap a frequency to a whole number of cycles over the episode, so every
    continuous tone (and every beat between two tones) has the same phase at the
    last sample as at the first: the loop has no click and no level jump."""
    return round(f * DUR) / DUR


def db(x):
    return 10 ** (x / 20)


def st(x):
    return np.stack([x, x], 1) if x.ndim == 1 else x


def fft_filter(x, lo=None, hi=None, sr=SR, slope=1.0):
    """Zero-phase band filter with smooth (Butterworth-like) magnitude."""
    x = np.asarray(x, np.float64)
    if x.ndim == 2:
        return np.stack([fft_filter(x[:, c], lo, hi, sr, slope) for c in range(x.shape[1])], 1)
    n = len(x)
    f = np.fft.rfftfreq(n, 1 / sr)
    X = np.fft.rfft(x)
    g = np.ones_like(f)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** (4 * slope))
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (4 * slope))
    return np.fft.irfft(X * g, n)


def reverb(x, seconds, wet, seed, bright=6000):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)], 1) * np.exp(-6.9 * t / seconds)[:, None]
    ir = fft_filter(ir, hi=bright)
    ir /= np.sqrt((ir ** 2).sum() / 2)
    x = st(x)
    m = 1 << int(np.ceil(np.log2(len(x) + n)))
    out = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], m) * np.fft.rfft(ir[:, c], m), m)[: len(x)] for c in range(2)], 1)
    return x * (1 - wet) + out * wet


def place(bus, clip, at, gain=0.0):
    i = int(at * SR)
    if i >= len(bus):
        return
    clip = st(clip)
    n = min(len(clip), len(bus) - i)
    bus[i:i + n] += clip[:n] * db(gain)


def env(points):
    xs, ys = zip(*points)
    return np.interp(T, xs, ys)


def load_wav(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f64le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float64).copy()


USED = {}


def lib(name):
    path = next(LIB.rglob(f'*_{name}_v1.flac'))
    USED[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f64le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float64).reshape(-1, 2).copy()


def write(path, x):
    x = np.clip(st(x), -1, 1)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())


def tone(freqs, dur, amps=None, decay=None, phase=0.0):
    t = np.arange(int(dur * SR)) / SR
    amps = amps or [1] * len(freqs)
    y = sum(a * np.sin(2 * np.pi * f * t + phase) for f, a in zip(freqs, amps))
    if decay:
        y *= np.exp(-t / decay)
    return y


def plus(*xs):
    n = max(len(x) for x in xs)
    return sum(np.pad(x, (0, n - len(x))) for x in xs)


def fade(x, a=0.01, b=0.01):
    n = len(x)
    e = np.ones(n)
    ia, ib = int(a * SR), int(b * SR)
    if ia:
        e[:ia] = np.linspace(0, 1, ia)
    if ib:
        e[-ib:] = np.linspace(1, 0, ib)
    return x * e if x.ndim == 1 else x * e[:, None]


# key times (must match K and the shot list in src/horror/ep06/Episode06.tsx)
US, STOP, KNOCKS, REVEAL, OUTSIDE = 17.06, 24.0, [32.35, 33.15, 33.95], 39.75, 51.0
DAWN = 44.9
LOOP_ON = DUR - 1.4
OUT.mkdir(parents=True, exist_ok=True)


def at(x, t0, gain_db=0.0, bus=None):
    place(bus, x, t0, gain_db)


# ------------------------------------------------------------------ voice: close recollection
voice = np.zeros((N, 2))
for lid, l in LINES.items():
    v = load_wav(OUT / 'voice' / f'{lid}.wav')
    v /= np.abs(v).max() + 1e-9
    v = fft_filter(v, lo=100, hi=7500)
    v = np.tanh(v * 1.3) / np.tanh(1.3)
    v = reverb(v, 0.45, 0.1, seed=21, bright=5000)
    place(voice, v, l['start'], gain=-2.0)
write(OUT / 'stem-voice.wav', voice)
speech = np.zeros(N)
for l in LINES.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
engine_on = env([(0, 1), (STOP, 1), (STOP + 1.2, 0), (DAWN, 0), (DAWN + 1.4, 1), (DUR, 1)])
drone_e = env([(0, 0.8), (STOP, 0.9), (STOP + 1.5, 0.15), (32.2, 0.3), (34.7, 0.9), (REVEAL, 1.2), (DAWN, 0.7), (LOOP_ON, 0.8), (DUR, 0.8)])
mus += st(hs.drone_mid(T, qf, drone_e) * 1.6)
str_e = env([(0, 0.55), (5.6, 0.7), (15.0, 0.9), (US, 1.3), (STOP, 1.1), (STOP + 1.0, 0.0), (34.5, 0.0), (36.0, 0.9), (REVEAL - 0.02, 1.3), (REVEAL + 0.1, 1.6), (DAWN, 0.6), (49.0, 0.9), (OUTSIDE, 1.4), (LOOP_ON, 0.55), (DUR, 0.55)])
trem = env([(0, 0.3), (US, 0.3), (US + 0.5, 1.0), (STOP, 1.0), (36.0, 1.0), (REVEAL + 2, 1.0), (DAWN, 0.2), (LOOP_ON, 0.3), (DUR, 0.3)])
mus += st(hs.strings(T, qf, [220.0, 233.08, 329.63], str_e, trem, SR, seed=1) * 2.2)
mus += st(hs.strings(T, qf, [349.23, 466.16], env([(0, 0), (REVEAL - 0.02, 0), (REVEAL + 0.1, 1.3), (DAWN, 0.0), (DUR, 0)]), None, SR, seed=2))
# the theme: music box, once clean, then detuned in the galley beat, then slow and flat at dawn
for t0, rate, det, g in [(6.1, 0.42, 1.0, 0.0), (35.0, 0.5, 0.985, -3.0), (DAWN + 0.6, 0.66, 0.971, -2.0)]:
    place(mus, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0)), t0, g + 4)
# reversed swells into the three scares, then the stingers
for hit, freqs, d in [(US, [220, 311.13, 466.16], 1.4), (REVEAL, [233.08, 329.63, 493.88], 1.9), (OUTSIDE, [220, 311.13, 415.3], 1.0)]:
    sw = hs.reverse_swell(SR, freqs, d, seed=int(hit))
    place(mus, sw, hit - d)
place(mus, hs.stinger(SR, seed=1, size=0.9), US)
place(mus, hs.stinger(SR, seed=2, size=1.3), REVEAL)
place(mus, hs.stinger(SR, seed=3, size=0.7), OUTSIDE)
# the heartbeat: from the match, slows in the silence, races into the reveal
hb, = [hs.heartbeat(SR, 17.0, 31.8, 62, 78, gain=0.9, seed=4)]
place(mus, hb, 17.0)
place(mus, hs.heartbeat(SR, 34.6, REVEAL + 3.0, 92, 132, gain=1.1, seed=5), 34.6)
# the riser into the knocks, the bowed metal in the silence
place(mus, hs.riser(SR, 3.0, seed=6), KNOCKS[0] - 3.0)
place(mus, st(hs.metal_bow(SR, 6.0, 1180, seed=7)), 25.5)
place(mus, st(hs.metal_bow(SR, 4.0, 1460, seed=8)), REVEAL + 0.4)
# dead air between the knocks: only the knocks
for k in KNOCKS:
    mus[int((k + 0.45) * SR):int((k + 0.8) * SR)] *= 0.15
# ducking under the voice (7 dB): the music stays present in every gap
mus *= (1 - speech * (1 - db(-7)))[:, None]
write(OUT / 'stem-score.wav', mus)
PRESENCE = hs.presence(voice, mus, TL['lines'], SR)

# ------------------------------------------------------------------ the boat
amb = np.zeros((N, 2))
eng = (np.sin(2 * np.pi * qf(118) * T) * 0.5 + np.sin(2 * np.pi * qf(236) * T) * 0.25 + fft_filter(rng.standard_normal(N), lo=150, hi=900) * 0.4) * 0.03
amb += st(eng * engine_on)
amb += st(fft_filter(rng.standard_normal(N), lo=80, hi=600) * 0.006)
dawn = env([(0, 0), (DAWN - 0.01, 0), (DAWN, 1), (LOOP_ON - 0.01, 1), (LOOP_ON, 0), (DUR, 0)])
gust = 0.6 + 0.4 * np.sin(2 * np.pi * qf(0.13) * T)
amb += np.stack([fft_filter(rng.standard_normal(N), lo=200, hi=2500), fft_filter(rng.standard_normal(N), lo=200, hi=2500)], 1) * (0.03 * gust * dawn)[:, None]
amb += st(fft_filter(rng.standard_normal(N), lo=60, hi=500) * (0.6 + 0.4 * np.sin(2 * np.pi * qf(0.18) * T)) * 0.04 * dawn)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))


def ping(gain=1.0):
    n = int(0.5 * SR)
    tt = np.arange(n) / SR
    p = np.sin(2 * np.pi * 1450 * tt) * np.exp(-tt * 9)
    return reverb(p * 0.1 * gain, 2.6, 0.7, seed=31, bright=4000)


for t0 in [0.2, 3.6, 7.0, 10.4, 13.8, 26.2, 29.6]:
    place(fx, ping(1.0 if t0 < 20 else 0.7), t0, -4)
place(fx, ping(1.0), LOOP_ON + 0.5 - 0.0, -4)
# the loose panel rattling until all stop
tt = np.arange(int((STOP - 17.9) * SR)) / SR
rattle = fft_filter(rng.standard_normal(len(tt)), lo=1500, hi=6000) * ((np.sin(2 * np.pi * 19 * tt) > 0.8) * 1.0) * 0.03
place(fx, fade(rattle, 0.3, 0.05), 17.9)
# the telegraph to STOP: lever, two bell strokes
place(fx, lib('steel_latch'), STOP - 0.2, -6)
for k in (0, 0.35):
    n = int(1.2 * SR)
    tt = np.arange(n) / SR
    place(fx, (np.sin(2 * np.pi * 1320 * tt) + 0.5 * np.sin(2 * np.pi * 3170 * tt)) * np.exp(-tt * 4) * 0.08, STOP + k)
# hull groans in the silence
place(fx, lib('cable_tension'), 27.2, -10)
place(fx, lib('wood_stress'), 30.4, -12)
# three heavy knocks on the hull, with long steel resonance
for k in KNOCKS:
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    knock = np.sin(2 * np.pi * 75 * tt) * np.exp(-tt * 16) * 0.8 + fft_filter(rng.standard_normal(n), lo=80, hi=1500) * np.exp(-tt * 40) * 0.6
    ring = sum(np.sin(2 * np.pi * f * tt) * a for f, a in [(182, 0.3), (263, 0.22), (411, 0.14), (697, 0.07)]) * np.exp(-tt * 2.6)
    place(fx, reverb(knock + ring, 1.4, 0.3, seed=41), k, 2)
    place(fx, lib('low_cinematic_hit'), k, -6)
# drips at the reveal; the breath beside him
for i in range(8):
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    place(fx, np.sin(2 * np.pi * (1800 + i * 90) * tt * (1 + tt * 6)) * np.exp(-tt * 70) * 0.05, REVEAL + 0.4 + i * 0.55)
place(fx, lib('heartbeat_breath'), REVEAL + 0.9, -8)
place(fx, lib('restrained_boom'), REVEAL, -6)
# the scrape, heard as the camera walks aft
tt = np.arange(int(2.6 * SR)) / SR
scrape = fft_filter(rng.standard_normal(len(tt)), lo=1500, hi=7000) * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * tt) ** 2) * np.sin(np.linspace(0, np.pi, len(tt))) * 0.05
place(fx, scrape, 48.7)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ mix (no fade at the end: it loops)
mix = voice + amb + mus + fx


def lufs(x):
    write(OUT / 'probe.wav', x)
    out = subprocess.run(['ffmpeg', '-i', str(OUT / 'probe.wav'), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    (OUT / 'probe.wav').unlink()
    return float([l for l in out.splitlines() if l.strip().startswith('I:')][-1].split()[1])


ceil = db(-1.2)
peak = np.abs(mix).max()
base = mix / peak
g = 1.0
for _ in range(5):
    y = np.tanh(base * g / ceil) * ceil
    g *= db(-14.0 - lufs(y))
mix = np.tanh(base * g / ceil) * ceil
write(OUT / 'mix.wav', mix)
final_lufs = lufs(mix)

# voice-over-bed margin per line, measured from stems with the same mix gain
def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


margins = []
for lid, l in LINES.items():
    a, b = int(l['start'] * SR), int(l['end'] * SR)
    vv = voice[a:b].mean(1)
    vb, ob = hs._filt(vv, SR, lo=200, hi=4000), hs._filt((amb + mus + fx)[a:b].mean(1), SR, lo=200, hi=4000)
    margins.append({'id': lid, 'phone_band_voice_minus_all_db': float(round(rms_db(vb) - rms_db(ob), 1)), 'voice_minus_score_db': float(round(rms_db(vv) - rms_db(mus[a:b].mean(1)), 1)), 'voice_minus_all_other_stems_db': float(round(rms_db(vv) - rms_db((amb + mus + fx)[a:b].mean(1)), 1))})
def encode_peak(x):
    write(OUT / 'mix.wav', x)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(OUT / 'mix.wav'), '-c:a', 'aac', '-b:a', '192k', str(OUT / 'mix.m4a')], check=True)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(OUT / 'mix.m4a'), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return 20 * np.log10(np.abs(np.frombuffer(raw, np.float32)).max())


# AAC can overshoot the limiter ceiling on the clipped buzz; pull the whole mix down until the
# decoded file peaks at or below -1 dBFS, and report the loudness of what is actually delivered
encoded_peak = encode_peak(mix)
while encoded_peak > -1.0:
    mix = mix * db(-1.0 - encoded_peak - 0.1)
    encoded_peak = encode_peak(mix)
final_lufs = lufs(mix)
(OUT / 'mix.wav').unlink()
for stem in OUT.glob('stem-*.wav'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(stem), '-c:a', 'flac', str(stem.with_suffix('.flac'))], check=True)
    stem.unlink()
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep06TheSoundThatMatchedUs',
    'duration_seconds': DUR,
    'voice': TL['voice'] + '; light band-limit, soft saturation, small room (archive narrator, not a TV speaker)',
    'original_synthesis': [
        'score (scripts/horror_score.py): A2/E3 mid-band drone; tremolo string clusters (A3-Bb3-E4, later +F4); a detuned music-box theme (A C B D# E . A G#) that returns slower and a quarter-tone flat; reversed swells into each scare; stingers on "Us.", the reveal and "From the outside."; a heartbeat from 58 to 132 bpm; a riser into the knocks; bowed metal in the silence',
        'boat: engine hum (on until ALL STOP, back on the surface), sonar pings, the rattling panel, the telegraph bell, three heavy knocks with hull resonance, condensation drips, the sea and wind at dawn',
        'silence: after ALL STOP the engine and most music drop away; only the heartbeat and bowed metal remain until the knocks',
        'loop: drone, strings and engine hum end at their frame-0 levels; continuous tones snapped to whole cycles',
    ],
    'library_cues': USED,
    'loudness_target_lufs': -14.0,
    'measured_integrated_lufs': final_lufs,
    'encoded_sample_peak_dbfs': round(float(encoded_peak), 2),
    'limiter': 'tanh soft limiter, ceiling -1.2 dBFS',
    'voice_margins_db': margins,
    'music_presence': PRESENCE,
    'listening_pass': 'not performed (no audio audition in this runtime)',
}, indent=2) + '\n')
print('ok', DUR, 'LUFS', final_lufs, 'encoded peak', round(float(encoded_peak), 2))
for m in margins:
    print(m)
