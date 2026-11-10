"""Episode 8 "Room Zero" (original): narration lines + timeline, built from the REAL line
durations of one ElevenLabs take, before the picture is made.

Narrator: ElevenLabs "True - Crime & Horror Narrator" (tZssYepgGaQmegsMEXjK, eleven_v4), the
channel's fiction voice, one performance with [long pause] between lines (prompt in
docs/production/ep08-room/prompt.json, take in public/assets/audio/eleven-takes/ep08-take1.mp3).
The take is split with scripts/eleven_split.py. Pauses INSIDE a line longer than 0.35 s are
shortened to 0.35 s (the read is slow and deliberate: "Leaks. Wiring. Mice."), then a light
atempo, so the episode fits under 60 s with room for the knocks.

Writes WAVs to public/assets/audio/ep08-room-v1/voice/ and src/data/ep08-room-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep08-room-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep08-take1.mp3'
SR = es.SR
TEMPO = 1.03

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    "If a wall in your house looks like this on a thermal camera, don't knock.",
    'I inspect houses. The camera shows me what walls are hiding. Leaks. Wiring. Mice.',
    'Last month, a house that had been empty for a year. Power off. Heating off. Cold as a fridge.',
    "Upstairs, the hallway ends in a blank wall. On the plans, there's nothing behind it.",
    "On my camera, there's a warm rectangle. Room sized. Thirty seven degrees.",
    "Outside, I measure. Two metres of house you can't reach from inside.",
    'I knock on the wall.',
    'Something knocks back. Twice.',
    "I write it up as possible water damage. I don't tell the buyers.",
    'They moved in on Friday. This morning, they sent me a photo.',
    'They want to know why the wall is warm to the touch.',
    "And why there's a door in it now.",
]

# (id, take index, gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 0.15, 'hook: the thermal camera on the blank wall, a warm rectangle'),
    ('l02', 1, 0.6, 'the van at the empty house; the camera in a gloved hand'),
    ('l03', 2, 0.5, 'frosted rooms, breath'),
    ('l04', 3, 0.6, 'the stairs; the hallway; the blank wall'),
    ('l05', 4, 0.7, 'the camera comes up: thermal'),
    ('l06', 5, 0.8, 'outside: the tape measure along the side wall'),
    ('l07', 6, 0.6, 'back at the wall, the hand raised'),
    ('l08', 7, 1.7, 'three knocks; silence; two knocks answer through the wall'),
    ('l09', 8, 1.6, 'stinger in silence; the van pulling away'),
    ('l10', 9, 0.6, 'the report screen'),
    ('l11', 10, 0.6, 'the phone: the photo'),
    ('l12', 11, 0.5, 'the photo: a door in the wall'),
]
TAIL = 1.6


def tempo(x, f):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={f:.4f}', '-f', 'f64le', '-'],
                       input=x.astype('<f8').tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(p, np.float64).copy()


def tighten(x, keep=0.35, floor_db=40):
    """Shorten silent runs inside a line to `keep` seconds (cross-faded), leaving the words untouched."""
    hop = int(0.01 * SR)
    fr = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, 'same')[::hop])
    act = 20 * np.log10(fr + 1e-9) > 20 * np.log10(fr.max() + 1e-9) - floor_db
    out, i, n = [], 0, len(act)
    cuts = []
    k = 0
    while k < n:
        if not act[k]:
            j = k
            while j < n and not act[j]:
                j += 1
            if k > 0 and j < n and (j - k) / 100 > keep:
                cuts.append((k * hop + int(keep / 2 * SR), j * hop - int(keep / 2 * SR)))
            k = j
        else:
            k += 1
    pos = 0
    f = int(0.01 * SR)
    for a, b in cuts:
        seg = x[pos:a].copy()
        if out:
            seg[:f] *= np.linspace(0, 1, f)
        seg[-f:] *= np.linspace(1, 0, f)
        out.append(seg)
        pos = b
    tail = x[pos:].copy()
    if out:
        tail[:f] *= np.linspace(0, 1, f)
    out.append(tail)
    return np.concatenate(out)


def write(path, x):
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


take = es.load(TAKE)
segs = es.segments(take, TAKE_LINES)
timeline, t = [], 0.0
for lid, src, gap, beat in PLAN:
    wav = OUT / f'{lid}.wav'
    if True:
        a, b = segs[src]
        x = tighten(take[max(0, int((a - 0.03) * SR)):int((b + 0.1) * SR)].copy())
        x = tempo(x, TEMPO)
        n = int(0.01 * SR)
        x[:n] *= np.linspace(0, 1, n)
        x[-int(0.04 * SR):] *= np.linspace(1, 0, int(0.04 * SR))
        write(wav, x / (np.abs(x).max() + 1e-9) * 0.9)
        dur = len(x) / SR - 0.1 / TEMPO  # the tail pad is breath, not speech
        text, kind = TAKE_LINES[src], 'narrator'
    t += gap
    timeline.append({'id': lid, 'text': text, 'start': round(t, 3), 'end': round(t + dur, 3), 'kind': kind, 'beat_before': beat})
    t += dur
total = round(t + TAIL, 3)
doc = {'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)),
       'voice': f'ElevenLabs eleven_v4, True - Crime & Horror Narrator (tZssYepgGaQmegsMEXjK), one take split into lines, inner pauses cut to 0.35 s, atempo {TEMPO}',
       'lines': timeline}
(ROOT / 'src/data/ep08-room-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
