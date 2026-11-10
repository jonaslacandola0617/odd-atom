"""Build the audio for HorrorGalileoTape (24 s).

New original synthesis (drone, entry rumble, thunder, tape hiss) plus cues from
the imported Curio library (public/assets/audio/library/curio-bureau, user-
authorised reuse). Writes stems, the mix and provenance under
public/assets/audio/horror-galileo-v1/.  Run: python3 scripts/horror_galileo_sound.py
"""
import hashlib, json, subprocess, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
OUT = ROOT / 'public/assets/audio/horror-galileo-v1'
SR, DUR = 48000, 24.0
N = int(SR * DUR)
rng = np.random.default_rng(1995)
t = np.arange(N) / SR


def load(name):
    path = next(LIB.rglob(f'*_{name}_v1.flac'))
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy(), path


def db(x):
    return 10 ** (x / 20)


def env(points):
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def write(path, stereo):
    s = np.clip(stereo, -1, 1)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((s * 32767).astype('<i2').tobytes())


OUT.mkdir(parents=True, exist_ok=True)

# ---- original synthesis --------------------------------------------------
lost = 21.0
alive = env([(0, 1), (lost - 0.05, 1), (lost, 0), (DUR, 0)])
drone_amp = env([(0, 0.0), (1.5, 0.5), (9.5, 0.7), (10.2, 0.4), (20, 0.9), (lost, 1.0)])
f0 = 41.2 * (1 - 0.06 * env([(0, 0), (10, 0), (21, 1)]))
phase = 2 * np.pi * np.cumsum(f0) / SR
drone = (np.sin(phase) + 0.5 * np.sin(phase * 1.498 + 0.3) + 0.25 * np.sin(phase * 2.01)) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.13 * t))
drone *= drone_amp * alive * 0.22
drone_st = np.stack([drone, np.roll(drone, 240)], 1)

wind = lowpass(rng.standard_normal(N), 380) * env([(0, 0), (10, 0), (11, 0.6), (20.5, 1.0), (lost, 1.0)]) * alive * 0.6
rumble = lowpass(rng.standard_normal(N), 90) * env([(0, 0), (5.2, 0), (9.4, 1.4), (9.6, 0.2), (10.5, 0)]) * 1.4
thunder = np.zeros(N)
for k in (15.6, 17.33):
    i = int(k * SR)
    seg = lowpass(rng.standard_normal(int(2.2 * SR)), 140) * np.exp(-np.linspace(0, 5, int(2.2 * SR)))
    thunder[i:i + len(seg)] += seg[: N - i] * 2.2
hiss = lowpass(rng.standard_normal(N), 6000) * 0.02 + rng.standard_normal(N) * 0.006
hiss *= env([(0, 1), (18, 1), (lost, 2.5), (lost + 0.3, 1.2), (DUR, 1.2)])
synth = drone_st + np.stack([wind + rumble + thunder, wind * 0.9 + rumble + thunder], 1) * 0.5 + np.stack([hiss, np.roll(hiss, 31)], 1)
write(OUT / 'stem-synth-drone-wind-rumble.wav', synth)

# ---- library cues ----------------------------------------------------------
cues = [
    ('tape_reel_start', 0.0, -6),
    ('telemetry_ping', 3.35, -10),
    ('suspense_riser', 5.0, -8),
    ('data_pulse', 7.2, -10),
    ('low_cinematic_hit', 9.5, -2),
    ('restrained_boom', 10.25, -6),
    ('cable_tension', 10.45, -9),
    ('telemetry_ping', 11.0, -14),
    ('low_cinematic_hit', 15.55, -9),
    ('low_cinematic_hit', 17.28, -11),
    ('radio_search', 18.0, -10),
    ('terminal_error', 19.6, -8),
    ('lost_signal', 20.6, -4),
    ('doubt_tick', 21.73, -10),
    ('hard_fact_punctuate', 22.73, -8),
]
fx = np.zeros((N, 2))
used = {}
for name, at, gain in cues:
    clip, path = load(name)
    i = int(at * SR)
    n = min(len(clip), N - i)
    fx[i:i + n] += clip[:n] * db(gain)
    used[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
bed, bpath = load('radio_noise_bed')
loop = np.concatenate([bed] * 4)[:N]
bed_gain = env([(0, db(-22)), (17.5, db(-22)), (20.8, db(-10)), (lost, db(-9)), (lost + 0.4, db(-20)), (DUR, db(-24))])
fx += loop * bed_gain[:, None]
used['radio_noise_bed'] = {'path': str(bpath.relative_to(ROOT)), 'sha256': hashlib.sha256(bpath.read_bytes()).hexdigest()}
write(OUT / 'stem-library-cues.wav', fx)

mix = synth + fx
mix[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))[:, None]
peak = np.abs(mix).max()
mix *= db(-1.0) / peak
write(OUT / 'mix.wav', mix)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(OUT / 'mix.wav'), '-c:a', 'aac', '-b:a', '192k', str(OUT / 'mix.m4a')], check=True)
(OUT / 'mix.wav').unlink()
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'composition': 'HorrorGalileoTape',
    'duration_seconds': DUR,
    'original_synthesis': 'drone (41 Hz stack with slow pitch fall), low-passed wind, entry rumble, two thunder bursts, tape hiss; numpy, seeded (1995)',
    'library_cues': [{'name': name, 'at_seconds': at, 'gain_db': gain, **used[name]} for name, at, gain in cues],
    'bed': {'radio_noise_bed': used['radio_noise_bed']},
    'normalised_peak_dbfs': -1.0,
    'listening_pass': 'not performed (no audio audition in this runtime)',
}, indent=2) + '\n')
print('wrote', OUT)
