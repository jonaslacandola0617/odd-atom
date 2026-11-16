"""Episode 53 "Two Nights in the Cold Room" (Season 6: two nights in a Nigerian hospital mortuary's cold room
with my brother, the night attendant; retold in our own words from accounts shared online): English narration
lines + timeline, built from the REAL line durations of one ElevenLabs take.

Narrator: ElevenLabs "Jack" (BVPhWQykET1TSvfGzrUr), eleven_v4, one performance with [long pause] between
lines (prompt in docs/production/ep53-cold/prompt.json). Writes WAVs to public/assets/audio/ep53-cold-v1/voice/
and src/data/ep53-cold-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep53-cold-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / f"public/assets/audio/eleven-takes/ep53-take{2 if '--take2' in sys.argv else 1}.mp3"
SR = es.SR
TEMPO = 1.03
KEEP = 0.22
SYL_PER_S = 3.6

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    "My brother works nights in a hospital mortuary. I stayed with him for two nights, in the cold room.",
    "The power cuts out all the time. Then it's black, until the generator comes back.",
    "The first time it came back, one of the sheets had slipped.",
    "My brother covered it again without looking. He said, you don't look at them when the light is off.",
    "The third time, one of them was sitting up. By the door. The stitches down its chest had pulled open.",
    "He said it was gas. Bodies do that. He laid it back down... and his hands were shaking.",
    "The second night, the generator didn't come back. I turned on my torch.",
    "Every covered head in that room had turned toward me.",
    "In the morning, he counted the register twice. Fourteen brought in. Fifteen in the room.",
]

# (id, take index, gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 1.7, 'hook: the light surges back on a sheeted body sitting upright on the near tray, facing the lens; black'),
    ('l02', 1, 0.7, 'the cold room, locked wide: trays of covered dead, my brother at the desk, me on a chair'),
    ('l03', 2, 2.8, 'the power dies; black; the generator coughs and the light surges back green, then cyan'),
    ('l04', 3, 0.6, 'a sheet has slipped: a grey arm hangs off a tray; my brother walks over and covers it'),
    ('l05', 4, 3.9, 'black again; back: nothing changed; black again; back: one sits up by the door, chest open (stinger)'),
    ('l06', 5, 0.9, 'he lays it down, hands on its shoulders'),
    ('l07', 6, 1.4, 'the second night; the power dies; the generator fails'),
    ('l08', 7, 2.0, 'my torch sweeps the trays: every covered head is turned to me'),
    ('l09', 8, 1.8, 'morning: the register; the room in grey daylight, a fifteenth body on the floor'),
]

TAIL = 2.8


def tempo(x, f):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={f:.4f}', '-f', 'f64le', '-'],
                       input=x.astype('<f8').tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(p, np.float64).copy()


def tighten(x, keep=0.24, floor_db=40):
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


PROVISIONAL = '--provisional' in sys.argv
if not PROVISIONAL:
    take = es.load(TAKE)
    segs = es.segments(take, TAKE_LINES)
timeline, t = [], 0.0
for lid, src, gap, beat in PLAN:
    wav = OUT / f'{lid}.wav'
    if src == 'door':
        pass
    elif PROVISIONAL:
        import re
        syl = sum(max(1, len(re.findall(r'[aeiouy]+', w.lower()))) for w in re.findall(r'[A-Za-z]+', TAKE_LINES[src]))
        dur = syl / SYL_PER_S
        text, kind = TAKE_LINES[src], 'narrator'
    else:
        a, b = segs[src]
        x = tighten(take[max(0, int((a - 0.03) * SR)):int((b + 0.1) * SR)].copy(), keep=KEEP)
        x = tempo(x, TEMPO) if TEMPO != 1.0 else x
        n = int(0.01 * SR)
        x[:n] *= np.linspace(0, 1, n)
        x[-int(0.04 * SR):] *= np.linspace(1, 0, int(0.04 * SR))
        write(wav, x / (np.abs(x).max() + 1e-9) * 0.9)
        dur = len(x) / SR - 0.1 / TEMPO  # the tail pad is breath, not speech
        text, kind = TAKE_LINES[src], 'narrator'
    t += gap
    if src == 'door':
        x = es.load(DOOR)
        x = x[max(0, int(np.argmax(np.abs(x) > 0.02)) - int(0.03 * SR)):]
        x = x[:len(x) - int(np.argmax(np.abs(x[::-1]) > 0.02)) + int(0.12 * SR)]
        write(wav, x / (np.abs(x).max() + 1e-9) * 0.9)
        dur = len(x) / SR
        timeline.append({'id': lid, 'text': DOOR_TEXT, 'start': round(t, 3), 'end': round(t + dur, 3), 'kind': 'door', 'beat_before': beat})
        t += dur
        continue
    timeline.append({'id': lid, 'text': text, 'start': round(t, 3), 'end': round(t + dur, 3), 'kind': kind, 'beat_before': beat})
    t += dur
total = round(t + TAIL, 3)
doc = {'provisional': PROVISIONAL, 'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)),
       'voice': 'ElevenLabs eleven_v4, Jack (BVPhWQykET1TSvfGzrUr), English, one take, split into lines, inner pauses capped at 0.22 s, atempo 1.03',
       'lines': timeline}
(ROOT / 'src/data/ep53-cold-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
