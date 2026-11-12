"""Episode 24 "They Turn Their Heads" (Season 3, a real reported case: the Island of the Dolls,
Xochimilco, Mexico City): English narration lines + timeline, built from the REAL line durations of
one ElevenLabs take before the picture is locked.

Narrator: ElevenLabs "Jack - Deep Dark Horror Narrator" (BVPhWQykET1TSvfGzrUr), eleven_v4, one
performance with [long pause] between lines (prompt in docs/production/ep24-dolls/prompt.json).
One gliding first-person boat ride, there and back; the gaps hold what the picture does.
Writes WAVs to public/assets/audio/ep24-dolls-v1/voice/ and src/data/ep24-dolls-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep24-dolls-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep24-take1.mp3'
SR = es.SR
TEMPO = 1.0
SYL_PER_S = 3.6

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    "Don't look at the dolls. They're already looking at you.",
    'Xochimilco, Mexico City. For about fifty years, one man lived alone on this little island in the canals.',
    'Don Julián Santana Barrera said a girl had drowned nearby. He hung dolls in the trees, for her.',
    'Hundreds of them. He pulled them out of the canals, and out of the trash.',
    'Visitors say the dolls whisper. That their heads turn when a boat goes by.',
    'Some say the girl was real. Others say he only dreamed her. No record of her has been found.',
    'In two thousand one, he was found drowned. In the same canal, his family says.',
    'Now, on the way back. Look at the same dolls.',
    "Don't look up.",
]

# (id, take index, gap before, what the picture does in the gap) -- one gliding first-person take
PLAN = [
    ('l01', 0, 0.1, 'hook: gliding into the canal at dusk; the first dolls hang from the trees, facing the water'),
    ('l02', 1, 1.0, 'more dolls; the reeds; the fence of sticks hung with heads'),
    ('l03', 2, 0.9, 'a tree full of dolls passes close; they swing'),
    ('l04', 3, 0.8, 'the hut with dolls nailed to its walls'),
    ('l05', 4, 1.3, 'one doll near the boat turns its head, slowly, in plain sight'),
    ('l06', 5, 1.0, 'the end of the island; the boat starts to turn'),
    ('l07', 6, 1.4, 'the boat turns all the way round; black water'),
    ('l08', 7, 1.0, 'the way back, closer to the bank: the same dolls, all facing the boat; one floats beside us'),
    ('l09', 8, 1.8, 'the camera tilts down to the black water: in the reflection, a doll hangs right above us, looking down'),
]
TAIL = 2.6


def tempo(x, f):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={f:.4f}', '-f', 'f64le', '-'],
                       input=x.astype('<f8').tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(p, np.float64).copy()


def tighten(x, keep=0.45, floor_db=40):
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
       'voice': f'ElevenLabs eleven_v4, Jack - Deep Dark Horror Narrator (BVPhWQykET1TSvfGzrUr), English, one take, split into lines, inner pauses capped at 0.45 s, atempo {TEMPO}',
       'lines': timeline}
(ROOT / 'src/data/ep24-dolls-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
