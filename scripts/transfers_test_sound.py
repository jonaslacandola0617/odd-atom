"""TRANSFERS 20 s acting test: sound (no dialogue, no score, no new generation).

Sound language: the shop at night (room tone, rain on the window, the CRT and its hum); the tape picked up,
latched and spooling; the tape's own world (hiss, handling, the camera set down); Nico's breathing; a chair
creak on the turn; then everything drops out to near silence; one low hit on the cut to black.
Sources: the imported Curio library and ElevenLabs SFX already generated for Season 3 (no new credits),
plus synthesis. Run: python3 scripts/transfers_test_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/transfers/acting-test-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
SFXD = ROOT / 'public/assets/audio/eleven-sfx'
SR, FPS = 48000, 30
DUR = 600 / FPS
N = int(DUR * SR)
T = np.arange(N) / SR
rng = np.random.default_rng(7031)
fr = lambda f: f / FPS          # frame -> seconds (must match src/horror/transfers/ActingTest.tsx)
S2, S3, S4, S5, BLACK = fr(150), fr(270), fr(420), fr(540), fr(576)
filt = hs._filt
db = lambda x: 10 ** (x / 20)
st = lambda x: np.stack([x, x], 1) if x.ndim == 1 else x


def env(points):
    xs, ys = zip(*points)
    return np.interp(T, xs, ys)


def load(path, ch=2):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f64le', '-ac', str(ch), '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float64).copy()
    return x.reshape(-1, 2) if ch == 2 else x


USED = {}
def src(path):
    path = Path(path)
    USED[path.name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    x = load(path)
    return x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.1      # unit level: -20 dB RMS
lib = lambda name: src(next(LIB.rglob(f'*_{name}_v1.flac')))
sfx = lambda name: src(SFXD / f'{name}.mp3')


def place(bus, clip, at, gain=0.0):
    i = int(at * SR); clip = st(clip)
    if i < 0: clip, i = clip[-i:], 0
    n = min(len(clip), len(bus) - i)
    if n > 0: bus[i:i + n] += clip[:n] * db(gain)


def fade(x, a=0.01, b=0.01):
    e = np.ones(len(x)); ia, ib = int(a * SR), int(b * SR)
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ib: e[-ib:] = np.linspace(1, 0, ib)
    return x * (e if x.ndim == 1 else e[:, None])


def bed_of(x, seconds):
    f = int(0.25 * SR); x = st(x); seg = x.copy()
    seg[:f] *= np.linspace(0, 1, f)[:, None]; seg[-f:] *= np.linspace(1, 0, f)[:, None]
    hop = len(seg) - f; n = int(seconds * SR); out = np.zeros((n + len(seg), 2))
    for i in range(0, n, hop): out[i:i + len(seg)] += seg
    return out[:n]


def noise(seconds, lo, hi):
    return filt(rng.standard_normal(int(seconds * SR)), SR, lo=lo, hi=hi)


def click(dur=0.03, lo=1500, hi=7000, decay=120):
    n = int(dur * SR); t = np.arange(n) / SR
    return filt(rng.standard_normal(n), SR, lo=lo, hi=hi) * np.exp(-t * decay)


def thud(f=70, dur=0.35, decay=14):
    t = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + 0.4 * filt(rng.standard_normal(len(t)), SR, lo=60, hi=400)) * np.exp(-t * decay)


shop = env([(0, 1), (S2 - 0.02, 1), (S2, 0), (S3 - 0.02, 0), (S3, 1), (S4 + 2.6, 1), (S4 + 2.75, 0), (DUR, 0)])
tape = env([(0, 0), (S2 - 0.01, 0), (S2, 1), (S3 - 0.01, 1), (S3, 0), (DUR, 0)])

amb = np.zeros((N, 2)); fx = np.zeros((N, 2)); body = np.zeros((N, 2)); tp = np.zeros((N, 2))
# ---------------------------------------------------------------- the shop at night
room = bed_of(lib('archive_room'), DUR)
amb += room * db(-6) * shop[:, None]
rain = bed_of(sfx('ep29-storm-1'), DUR)
rain = np.stack([filt(rain[:, 0], SR, lo=150, hi=1600), filt(rain[:, 1], SR, lo=150, hi=1600)], 1)
amb += rain * db(-14) * shop[:, None]
hum = (np.sin(2 * np.pi * 60 * T) * 0.5 + np.sin(2 * np.pi * 120 * T) * 0.3 + np.sin(2 * np.pi * 180 * T) * 0.15) * 0.02
whine = np.sin(2 * np.pi * 7860 * T) * 0.0025 * env([(0, 0), (fr(132), 0), (fr(140), 1), (DUR, 1)])   # CRT whine (audible band)
amb += st(hum + whine) * shop[:, None]
# the tape on the CRT speaker under the close-up (small, band-limited)
spk = filt(rng.standard_normal(N), SR, lo=400, hi=3000) * 0.006 * env([(0, 0), (S3, 0), (S3 + 0.1, 1), (S4 + 2.6, 1), (S4 + 2.75, 0), (DUR, 0)])
amb += st(spk)
# ---------------------------------------------------------------- the tape: picked up, latched, spooled
place(fx, click(0.05, 800, 5000, 60) * 0.5, fr(56))                     # plastic case lifted off the desk
place(fx, lib('paper_light_turn')[: int(0.4 * SR)], fr(60), -16)          # fingers on the label
place(fx, click(0.06, 600, 4000, 50) * 0.6, fr(118))                     # case meets the slot flap
place(fx, lib('steel_latch'), fr(134), -6)                                # VCR takes the tape
motor = filt(rng.standard_normal(int(1.2 * SR)), SR, lo=200, hi=1200) * 0.05 + np.sin(2 * np.pi * 95 * np.arange(int(1.2 * SR)) / SR) * 0.03
place(fx, fade(motor, 0.05, 0.3), fr(138))
place(fx, lib('tape_reel_start'), fr(141), -10)
place(fx, click(0.02, 2000, 8000, 200) * 0.4, fr(144))                   # PLAY relay
# ---------------------------------------------------------------- the tape's own sound
hiss = filt(rng.standard_normal(N), SR, lo=1500, hi=9000) * 0.02 + filt(rng.standard_normal(N), SR, lo=80, hi=300) * 0.01
tp += st(hiss) * tape[:, None]
place(tp, filt(rng.standard_normal(int(0.12 * SR)), SR, lo=300, hi=6000) * 0.25, S2)                  # head-switch burst
for k, t0 in enumerate([0.4, 0.9, 1.35]):                                                              # handling
    place(tp, thud(110 + 20 * k, 0.2, 22) * 0.12, S2 + t0)
place(tp, thud(80, 0.45, 10) * 0.35, S2 + fr(55 + 12))                                                # camera set down on the table
room_tape = filt(rng.standard_normal(N), SR, lo=120, hi=900) * 0.008
tp += st(room_tape) * tape[:, None]
place(tp, filt(rng.standard_normal(int(0.1 * SR)), SR, lo=300, hi=6000) * 0.2, S3 - 0.08)             # tape cut
# ---------------------------------------------------------------- Nico
place(body, lib('wood_stress')[: int(0.8 * SR)], fr(290), -18)   # chair as he leans in
for t0, g in [(fr(345), -16), (fr(380), -13), (fr(405), -11), (fr(428), -12)]:   # breathing rising
    place(body, fade(sfx('ep29-breath-1')[: int(1.2 * SR)], 0.02, 0.3), t0, g)
place(body, lib('wood_stress')[: int(1.0 * SR)], fr(448), -12)              # chair creak on the turn
place(body, fade(sfx('ep29-breath-2')[: int(0.8 * SR)], 0.01, 0.2), fr(499), -9)                      # sharp in-breath when he sees it
# ---------------------------------------------------------------- the doorway: near silence, one hit on the cut to black
near = filt(rng.standard_normal(N), SR, lo=200, hi=2500) * 0.003 * env([(0, 0), (S4 + 2.7, 0), (S4 + 2.8, 1), (BLACK, 1), (BLACK + 0.01, 0), (DUR, 0)])
amb += st(near)
creak = click(0.12, 300, 2000, 25) * 0.15
place(fx, creak, fr(548))                     # the head starts to tilt
place(fx, lib('restrained_boom'), BLACK, -2)

mix = amb + fx + body + tp
mix[int(BLACK * SR) + int(1.6 * SR):] *= 0                               # silence in the black after the hit tail


def write(path, x):
    x = np.clip(st(x), -1, 1)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())


def lufs(x):
    write(OUT / 'probe.wav', x)
    out = subprocess.run(['ffmpeg', '-i', str(OUT / 'probe.wav'), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    (OUT / 'probe.wav').unlink()
    return float([l for l in out.splitlines() if l.strip().startswith('I:')][-1].split()[1])


def encode_peak(x):
    write(OUT / 'mix.wav', x)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(OUT / 'mix.wav'), '-c:a', 'aac', '-b:a', '192k', str(OUT / 'mix.m4a')], check=True)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(OUT / 'mix.m4a'), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return 20 * np.log10(np.abs(np.frombuffer(raw, np.float32)).max())


OUT.mkdir(parents=True, exist_ok=True)
TARGET = -16.0   # no dialogue: a dynamic film mix; -14 would lift the room tone into hiss
base = mix / np.abs(mix).max(); ceil_db = -1.2
for _ in range(6):
    ceil = db(ceil_db); g = 1.0
    for _ in range(5): g *= db(TARGET - lufs(np.tanh(base * g / ceil) * ceil))
    out_mix = np.tanh(base * g / ceil) * ceil
    peak = encode_peak(out_mix)
    if peak <= -1.0: break
    ceil_db -= (peak + 1.0) + 0.3
final = lufs(out_mix)
(OUT / 'mix.wav').unlink()
gain = g / np.abs(mix).max()
for name, stem in [('ambience', amb), ('fx', fx), ('nico', body), ('tape', tp)]:
    write(OUT / f'stem-{name}.wav', stem * gain)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(OUT / f'stem-{name}.wav'), '-c:a', 'flac', str(OUT / f'stem-{name}.flac')], check=True)
    (OUT / f'stem-{name}.wav').unlink()
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'piece': 'TransfersActingTest (20 s, no dialogue)', 'duration_seconds': DUR,
    'sources': USED, 'new_generation': 'none (no ElevenLabs credits spent; reused Season 3 SFX and the Curio library)',
    'synthesized': ['CRT hum and whine', 'tape case clicks', 'VCR motor', 'PLAY relay', 'tape hiss and head-switch bursts', 'camera handling and set-down thuds', 'doorway near-silence', 'head-tilt creak'],
    'loudness_target_lufs': TARGET, 'measured_integrated_lufs': final, 'encoded_sample_peak_dbfs': round(float(peak), 2),
    'limiter': f'tanh soft limiter, ceiling {ceil_db:.2f} dBFS',
    'listening_pass': 'not performed (no audio audition in this runtime)',
}, indent=2) + '\n')
print('ok LUFS', final, 'peak', round(float(peak), 2))
