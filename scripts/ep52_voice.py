"""Episode 52 "The Branch" (Season 6: a utility lineman's night call in a South Texas colonia, the lechuza caught halfway through changing; retold from a reader-submitted account): English narration lines +
timeline, built from the REAL line durations of one ElevenLabs take before the picture is locked.

Narrator: ElevenLabs "Jack" (BVPhWQykET1TSvfGzrUr), eleven_v4, one performance with
[long pause] between lines (prompt in docs/production/ep52-branch/prompt.json). The voice through the
door is a separate ElevenLabs take ("Alden - Tired Old Man", S9V0fuqWOqX0i8Kb8ctu), placed as a
diegetic line (kind "door"). Writes WAVs to public/assets/audio/ep52-branch-v1/voice/ and
src/data/ep52-branch-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep52-branch-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / f"public/assets/audio/eleven-takes/ep52-take{2 if '--take2' in sys.argv else 1}.mp3"
SR = es.SR
TEMPO = 1.0
KEEP = 0.22
SYL_PER_S = 3.6

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    "Two in the morning, I got a work order to cut the power to one house. Last street in the colonia.",
    "A neighbour was waiting by the pole. She didn't say a word. She just pointed up, into the tree.",
    "I went up in the bucket, filming. I thought it was the biggest owl I'd ever seen. Then it turned to the light. It had a man's face.",
    "It wasn't finished changing. Those were still a man's legs. And everywhere the feathers were coming through... the skin was splitting open.",
    "I drove off with the bucket still up. On my phone there's a second video. I didn't take it. It's from the branch. Looking down at my truck.",
]

# (id, take index, gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 2.8, 'hook: the phone at branch height in the work light: a man\'s face among feathers, tipping its head'),
    ('l02', 1, 1.2, 'the colonia street; then the neighbour under the sodium lamp, pointing up into the tree'),
    ('l03', 2, 2.2, 'the bucket rising into the canopy; the work light swings onto a hunched feathered back'),
    ('l04', 3, 2.0, 'its head swivels round to the light: a man\'s face, held'),
    ('l05', 4, 3.0, 'the arms unfold into wings far too long; the phone falls'),
]

TAIL = 2.4


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
       'voice': 'ElevenLabs eleven_v4, Jack (BVPhWQykET1TSvfGzrUr), English, one take, split into lines, inner pauses capped at 0.22 s, no tempo change',
       'lines': timeline}
(ROOT / 'src/data/ep52-branch-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
