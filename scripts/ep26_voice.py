"""Episode 26 "Post Three" (Season 3, a real reported case: the Castle of Good Hope, Cape Town):
English narration lines + timeline, built from the REAL line durations of one ElevenLabs take
before the picture is locked.

Narrator: ElevenLabs "Jack - Deep Dark Horror Narrator" (BVPhWQykET1TSvfGzrUr), eleven_v4, one
performance with [long pause] between lines (prompt in docs/production/ep26-castle/prompt.json).
First person: a night guard's radio log (a composite guard, not a real person); the facts are
told as reported. Writes WAVs to public/assets/audio/ep26-castle-v1/voice/ and
src/data/ep26-castle-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep26-castle-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep26-take2.mp3'
SR = es.SR
TEMPO = 1.05
SYL_PER_S = 3.6

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    'Control, this is Post Three. Someone is running in the corridor.',
    'The Castle of Good Hope. Cape Town. The oldest colonial building in South Africa.',
    'I walk it alone. Two till dawn.',
    "The guards before me said, you'll hear footsteps. And when you stop... they take two more.",
    'Seventeen twenty-nine. Governor van Noodt sentenced seven soldiers to hang. One of them, the story goes, cursed him from the gallows.',
    'The same day, the governor was found dead, in his chair. History says it was his heart.',
    'Guards have reported a tall man, leaning over the battlements.',
    'And a woman in grey, running through the corridors.',
    'When they dug here, they found the remains of a woman. No one knows who she was.',
    "Control, Post Three. Dungeon's clear. I'm coming up.",
]

# (id, take index, gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 0.1, 'hook: torch POV down a vaulted corridor; a grey figure runs across the far end'),
    ('l02', 1, 1.3, 'she is gone; cut to the castle from above at night, the pentagon of bastions, the mountain'),
    ('l03', 3, 1.3, 'a window lights by itself; cut to the courtyard, walking'),
    ('l04', 4, 3.2, 'he stops; two more steps behind him; the torch swings round: a door across the yard closing'),
    ('l05', 5, 0.6, "the governor's room: the desk, the ledger, the chair pushed in"),
    ('l06', 6, 2.1, 'the chair slides back from the desk by itself; cut to the ramparts in the wind'),
    ('l07', 7, 2.2, 'a tall figure leaning over the battlements ahead; the torch flickers; gone; cut to the corridor'),
    ('l08', 8, 0.5, 'the long corridor; far end'),
    ('l09', 9, 3.0, 'she runs at him from the end; the torch dies; she passes; cut to the dungeon steps'),
]
TAIL = 5.2


def tempo(x, f):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={f:.4f}', '-f', 'f64le', '-'],
                       input=x.astype('<f8').tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(p, np.float64).copy()


def tighten(x, keep=0.32, floor_db=40):
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
    if PROVISIONAL:
        import re
        syl = sum(max(1, len(re.findall(r'[aeiouy]+', w.lower()))) for w in re.findall(r'[A-Za-z]+', TAKE_LINES[src]))
        dur = syl / SYL_PER_S
        text, kind = TAKE_LINES[src], 'narrator'
    else:
        a, b = segs[src]
        x = tighten(take[max(0, int((a - 0.03) * SR)):int((b + 0.1) * SR)].copy())
        x = tempo(x, TEMPO) if TEMPO != 1.0 else x
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
doc = {'provisional': PROVISIONAL, 'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)),
       'voice': f'ElevenLabs eleven_v4, Jack - Deep Dark Horror Narrator (BVPhWQykET1TSvfGzrUr), English, one take, split into lines, inner pauses capped at 0.32 s, atempo {TEMPO}',
       'lines': timeline}
(ROOT / 'src/data/ep26-castle-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
