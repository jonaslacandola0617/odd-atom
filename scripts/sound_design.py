"""Synthesize this pilot's original score and sound effects. Requires numpy.
No samples, copyrighted music, network services, or random runtime behavior.
"""
from pathlib import Path
import json
import subprocess
import tempfile
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio'
SR = 48000
SECONDS = 12
RNG = np.random.default_rng(617)
music = np.zeros((SR * SECONDS, 2), dtype=np.float64)
sfx = np.zeros_like(music)

def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)

def place(target, sound, time, gain=1, pan=0):
    offset = round(time * SR)
    n = min(len(sound), len(target) - offset)
    if n <= 0:
        return
    target[offset:offset+n, 0] += sound[:n] * gain * np.sqrt((1 - pan) / 2)
    target[offset:offset+n, 1] += sound[:n] * gain * np.sqrt((1 + pan) / 2)

def bell(note, duration=.7):
    t = np.arange(round(duration * SR)) / SR
    f = hz(note)
    a = (1 - np.exp(-t * 180)) * np.exp(-t * 5)
    return (.8 * np.sin(2 * np.pi * f * t) + .18 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 8) + .07 * np.sin(2 * np.pi * f * 3.99 * t) * np.exp(-t * 13)) * a

# Warm sustained harmony, with slowly moving detuned partials.
for i, chord in enumerate([[48, 55, 62, 63], [44, 51, 58, 60], [41, 48, 55, 56], [43, 50, 57, 60]]):
    t = np.arange(round(3.2 * SR)) / SR
    env = np.minimum(1, t / .32) * np.minimum(1, np.maximum(0, 3.2 - t) / .55)
    for j, note in enumerate(chord):
        f = hz(note)
        tone = (.6 * np.sin(2 * np.pi * f * t) + .22 * np.sin(2 * np.pi * f * 1.002 * t) + .12 * np.sin(2 * np.pi * f * 2 * t)) * env
        place(music, tone, i * 3, .018, -.6 + j * .4)

notes = [72, 79, 75, 86, 79, 74, 72, 79, 70, 75, 79, 82, 72, 75, 79, 77, 74, 79, 83, 86]
times = [.28, .78, 1.28, 1.78, 2.28, 3.28, 3.78, 4.28, 4.78, 5.28, 5.78, 6.28, 6.78, 7.28, 7.78, 8.28, 8.78, 9.28, 10.28, 10.78]
for i, (time, note) in enumerate(zip(times, notes)):
    b = bell(note)
    place(music, b, time, .075 if i % 4 == 0 else .042, np.sin(i * 1.7) * .6)
    place(music, b, time + .19, .01, -.65 * np.sin(i * 1.7))

# Soft heartbeat-like pulse, without a loud trailer-style impact bed.
for beat in range(24):
    t = np.arange(round(.2 * SR)) / SR
    if beat % 2 == 0:
        phase = 2 * np.pi * (48 * t + 3.5 * (1 - np.exp(-t * 28)))
        place(music, np.sin(phase) * np.exp(-t * 23), beat * .5, .075)
    n = RNG.normal(0, 1, len(t))
    high = n - np.convolve(n, np.ones(9) / 9, mode='same')
    place(music, high * np.exp(-t * 75), beat * .5 + .25, .008, .35)

def whoosh(duration, up=True):
    t = np.arange(round(duration * SR)) / SR
    f = np.linspace(260, 1650, len(t)) if up else np.linspace(1500, 160, len(t))
    phase = np.cumsum(f) / SR * 2 * np.pi
    noise = RNG.normal(0, 1, len(t))
    smooth = np.convolve(noise, np.ones(13) / 13, mode='same')
    env = np.sin(np.pi * t / duration) ** 2
    return (smooth * .65 + np.sin(phase) * .05) * env

for i, time in enumerate([.0, 2.37, 3.47, 5.80, 8.10, 10.12]):
    place(sfx, whoosh(.27, i % 2 == 0), time, .22, -.35 if i % 2 else .35)

for time, note in [(2.5, 79), (2.58, 84), (5.95, 86), (10.25, 79), (10.36, 84), (10.49, 91)]:
    place(sfx, bell(note, .55), time, .11)

# Tiny bird reaction: original two-note electronic chirp.
for time in [1.58, 10.85]:
    t = np.arange(round(.12 * SR)) / SR
    f = 900 + 1200 * np.sin(np.pi * t / .12)
    place(sfx, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / .12) ** 2, time, .035, -.5)

# Speech-aware music ducking with a soft envelope.
duck = np.ones(SR * SECONDS)
for line in json.loads((ROOT / 'src/narration-timing.json').read_text()):
    t = np.arange(SR * SECONDS) / SR
    before = np.clip((t - (line['start'] - .1)) / .1, 0, 1)
    after = np.clip(((line['end'] + .18) - t) / .18, 0, 1)
    duck *= 1 - np.minimum(before, after) * .26
music *= duck[:, None]
envelope = np.minimum(1, np.arange(SR * SECONDS) / (SR * .08)) * np.minimum(1, np.arange(SR * SECONDS)[::-1] / (SR * .18))

OUT.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    for name, samples, target_lufs in [('music', music, -29), ('sfx', sfx, -26)]:
        raw = Path(tmp) / f'{name}.wav'
        samples *= envelope[:, None]
        with wave.open(str(raw), 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(samples, -1, 1) * 32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-af', f'loudnorm=I={target_lufs}:TP=-8:LRA=8', '-ar', str(SR), str(OUT / f'{name}.wav')], check=True)
        print(f'Created {name}.wav', flush=True)
