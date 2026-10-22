"""Optional voice regeneration. Requires kokoro-onnx and the official v1.0 model files.

python scripts/generate_narration.py /path/to/kokoro-model-directory
The rendered narration is retained in public/assets/audio; rendering needs no TTS service.
"""
from pathlib import Path
import json
import subprocess
import sys
import tempfile
import wave
import numpy as np
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[1]
MODEL = Path(sys.argv[1])
OUT = ROOT / 'public/assets/audio'
RATE = 24000
LINES = [
    (0.15, 2.25, "Why don't astronauts fall?"),
    (2.50, 3.35, "They do."),
    (3.60, 5.65, "Gravity still pulls them down."),
    (5.95, 10.05, "But they move sideways so fast, they keep missing Earth."),
    (10.25, 11.70, "That's an orbit."),
]

def save(path, data):
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes((np.clip(data, -1, 1) * 32767).astype('<i2').tobytes())

model = Kokoro(str(MODEL / 'kokoro-v1.0.onnx'), str(MODEL / 'voices-v1.0.bin'))
mix = np.zeros(12 * RATE, dtype=np.float32)
timings = []
with tempfile.TemporaryDirectory() as tmp:
    for i, (start, end, text) in enumerate(LINES):
        samples, sr = model.create(text, voice='am_michael', speed=1.02, lang='en-us')
        if sr != RATE:
            raise ValueError(f'Unexpected sample rate: {sr}')
        duration = len(samples) / sr
        maximum = end - start
        factor = max(1.0, duration / maximum)
        raw = Path(tmp) / f'{i}-raw.wav'
        fitted = Path(tmp) / f'{i}-fit.wav'
        save(raw, samples)
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-af', f'atempo={factor:.6f}', '-ar', str(RATE), str(fitted)], check=True)
        with wave.open(str(fitted)) as w:
            fitted_samples = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768
        fitted_samples = fitted_samples[:round(maximum * RATE)]
        offset = round(start * RATE)
        mix[offset:offset+len(fitted_samples)] += fitted_samples
        timings.append({'start': start, 'end': round(start + len(fitted_samples) / RATE, 3), 'text': text, 'speed_adjustment': round(factor, 4)})
        print(timings[-1], flush=True)
    raw_mix = Path(tmp) / 'narration.wav'
    save(raw_mix, mix)
    OUT.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw_mix), '-af', 'loudnorm=I=-16:TP=-2:LRA=7', '-ar', '48000', '-ac', '2', str(OUT / 'narration.wav')], check=True)
(ROOT / 'src/narration-timing.json').write_text(json.dumps(timings, indent=2))
