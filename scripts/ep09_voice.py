"""Episode 9 "The Lighthouse That Went Dark" (true: the Flannan Isles, December 1900): narration lines + timeline, built from the REAL line
durations of one ElevenLabs take, before the picture is made.

Narrator: ElevenLabs "Jack - Deep Dark Horror Narrator" (BVPhWQykET1TSvfGzrUr, eleven_v4), the
channel's true-case voice, one performance with [long pause] between lines (prompt in
docs/production/ep09-lighthouse/prompt.json). Two takes generated; take 1 is used (its line
lengths and syllable rates match take 2 within 0.2 s; its hook line is the shorter). The take
is split with scripts/eleven_split.py; pauses inside a line are capped at 0.6 s; no atempo.

Writes WAVs to public/assets/audio/ep09-lighthouse-v1/voice/ and src/data/ep09-lighthouse-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep09-lighthouse-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep09-take1.mp3'
SR = es.SR
TEMPO = 1.0

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    'You row toward a lighthouse that should be lit. It has been dark for eleven days.',
    'December, nineteen hundred. A steamer passing the Flannan Isles sees that the lamp is out.',
    'Storms keep the relief boat away until the day after Christmas.',
    'No flag. No one comes down to meet it.',
    'Inside, the clock has stopped.',
    'One set of oilskins still hangs on its hook.',
    'Three keepers lived here. All three are gone.',
    'On the west landing, iron railings are torn and bent, high above the sea.',
    'The official report suggested two men went down to secure the landing in the storm, and the third ran out without his coat.',
    'A huge wave took them. They were never found.',
    'But no one knows what he saw from the doorway, that made him run.',
]

# (id, take index, gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 0.15, 'hook: from the relief boat, the dark tower on the island'),
    ('l02', 1, 0.7, 'night: a steamer passes; the tower is dark'),
    ('l03', 2, 0.6, 'storm: the relief boat pitching'),
    ('l04', 3, 0.6, 'the east landing: the empty flagstaff, no one on the steps'),
    ('l05', 4, 1.0, 'the walk up; the door; inside'),
    ('l06', 5, 0.8, 'the coat hooks'),
    ('l07', 6, 0.8, 'three cups; three bunks'),
    ('l08', 7, 1.6, 'stinger in silence; the west landing'),
    ('l09', 8, 0.7, 'the storm: lanterns going down; a man at the door'),
    ('l10', 9, 0.8, 'the wave'),
    ('l11', 10, 1.6, 'stinger in silence; the doorway'),
]
TAIL = 1.6


def tempo(x, f):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={f:.4f}', '-f', 'f64le', '-'],
                       input=x.astype('<f8').tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(p, np.float64).copy()


def tighten(x, keep=0.6, floor_db=40):
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
       'voice': f'ElevenLabs eleven_v4, Jack - Deep Dark Horror Narrator (BVPhWQykET1TSvfGzrUr), take 1 of 2, one take split into lines, inner pauses capped at 0.6 s, atempo {TEMPO}',
       'lines': timeline}
(ROOT / 'src/data/ep09-lighthouse-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
