"""Original 20-second score and explanatory effects. Requires numpy and FFmpeg."""
from pathlib import Path
import subprocess
import tempfile
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/star-balance'
RATE = 48000
N = RATE * 20
music = np.zeros((N, 2), dtype=np.float64)
sfx = np.zeros_like(music)
rng = np.random.default_rng(1023)

def hz(note):
    return 440 * 2 ** ((note - 69) / 12)

def add(target, samples, start, gain, pan=0):
    offset = round(start * RATE)
    count = min(len(samples), N - offset)
    if count <= 0:
        return
    target[offset:offset+count, 0] += samples[:count] * gain * np.sqrt((1 - pan) / 2)
    target[offset:offset+count, 1] += samples[:count] * gain * np.sqrt((1 + pan) / 2)

def bell(note, length=1.3):
    t = np.arange(round(length * RATE)) / RATE
    f = hz(note)
    envelope = (1 - np.exp(-t * 120)) * np.exp(-t * 3.1)
    return (np.sin(2 * np.pi * f * t) + .16 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 3) + .06 * np.sin(2 * np.pi * f * 4.01 * t)) * envelope

for group, chord in enumerate([[45, 52, 55, 59], [41, 48, 52, 57], [38, 45, 48, 52], [43, 50, 55, 57]]):
    t = np.arange(round(5.5 * RATE)) / RATE
    env = np.minimum(1, t / .6) * np.clip((5.5 - t) / .9, 0, 1)
    for j, note in enumerate(chord):
        f = hz(note)
        signal = (np.sin(2 * np.pi * f * t) + .2 * np.sin(2 * np.pi * f * 1.002 * t) + .1 * np.sin(2 * np.pi * f * 2 * t)) * env
        add(music, signal, group * 5, .027, -.65 + j * .43)
    bass = np.sin(2 * np.pi * hz(chord[0] - 12) * t) * env
    add(music, bass, group * 5, .055)

for i, (time, note) in enumerate([(0.5, 76), (1.8, 71), (3.2, 79), (5.7, 76), (7.1, 81), (8.5, 79), (10.1, 77), (11.7, 76), (13.1, 72), (14.6, 77), (16.2, 79), (17.7, 81), (19.0, 79)]):
    tone = bell(note)
    add(music, tone, time, .045, np.sin(i * 1.3) * .6)
    add(music, tone, time + .26, .008, -np.sin(i * 1.3) * .6)

def sweep(length, low, high):
    t = np.arange(round(length * RATE)) / RATE
    phase = np.cumsum(np.linspace(low, high, len(t))) / RATE * 2 * np.pi
    noise = rng.normal(0, 1, len(t))
    noise = np.convolve(noise, np.ones(19) / 19, mode='same')
    return (noise * .8 + np.sin(phase) * .12) * np.sin(np.pi * t / length) ** 2

add(sfx, sweep(1.3, 140, 52), 3.8, .23)
add(sfx, sweep(.8, 310, 1400), 6.25, .11, .3)
add(sfx, bell(88, 1.3), 9.1, .14)
add(sfx, bell(95, 1.0), 9.23, .06, .3)
add(sfx, sweep(2.3, 190, 450), 10.65, .15, -.2)
add(sfx, bell(79, 1.7), 15.05, .065, -.2)
add(sfx, bell(83, 1.7), 15.28, .055, .2)

# A low stellar pulse becomes calmer as outward pressure appears.
for i in range(15):
    t = np.arange(round(.8 * RATE)) / RATE
    signal = np.sin(2 * np.pi * (42 * t + .4 * (1 - np.exp(-t * 9)))) * np.exp(-t * 6)
    add(sfx, signal, 3.6 + i * .82, .055 if i < 8 else .025)

OUT.mkdir(parents=True, exist_ok=True)
fade = np.minimum(1, np.arange(N) / (RATE * .2)) * np.minimum(1, np.arange(N)[::-1] / (RATE * .16))
with tempfile.TemporaryDirectory() as tmp:
    for name, samples, loudness in [('music', music, -28), ('sfx', sfx, -26)]:
        raw = Path(tmp) / f'{name}.wav'
        with wave.open(str(raw), 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(RATE)
            w.writeframes((np.clip(samples * fade[:, None], -1, 1) * 32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-af', f'loudnorm=I={loudness}:TP=-8:LRA=9', '-ar', str(RATE), str(OUT / f'{name}.wav')], check=True)
        print(f'Created original {name}.wav')
