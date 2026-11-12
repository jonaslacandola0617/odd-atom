"""Episode 21 "Watch the Chair" (Season 3, a real reported case: the Enfield poltergeist, London,
1977): English narration lines + timeline, built from the REAL line durations of one ElevenLabs take
before the picture is locked.

Narrator (Season 3 rule: reported cases): ElevenLabs "Jack - Deep Dark Horror Narrator"
(BVPhWQykET1TSvfGzrUr), eleven_v4, one performance with [long pause] between lines (prompt in
docs/production/ep21-chair/prompt.json). The take is split with scripts/eleven_split.py; pauses
inside a line are capped at 0.45 s. The gaps are picture time in a single locked-off take: the
knocks, the tape dropouts (the only moments the chair moves) and the long silences.
Without the take, `--provisional` writes a timeline from estimated line lengths.

Writes WAVs to public/assets/audio/ep21-chair-v1/voice/ and src/data/ep21-chair-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep21-chair-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep21-take1.mp3'
SR = es.SR
TEMPO = 1.0
SYL_PER_S = 3.6

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    'Watch the chair. Not the bed. The chair.',
    'Enfield, north London. August, nineteen seventy-seven. A council house. A mother, and four children.',
    'It started with knocking. Inside the walls.',
    'A police officer came, at about one in the morning. She said she watched a chair slide across the floor. By itself.',
    'Investigators taped this house for over a year. On the tapes, knocks seem to answer questions.',
    "And there is a voice. A deep, old man's voice. It came from one of the girls.",
    'Skeptics said the children faked it. Years later, one of the girls said they had faked a little. Once or twice.',
    "You were watching the chair. Weren't you?",
]

# (id, take index, gap before, what the picture does in the gap) -- ONE locked-off take throughout
PLAN = [
    ('l01', 0, 0.1, 'hook: the dark back bedroom from a tripod; the chair by the window; two beds; the landing light through the door'),
    ('l02', 1, 1.0, 'a car passes outside: its headlights sweep the ceiling through the curtains'),
    ('l03', 2, 0.8, 'the clock on the wall; breathing under a blanket'),
    ('l04', 3, 2.6, 'three knocks inside the wall above the far bed; the picture frame jumps; then the first tape dropout: the chair is nearer the bed'),
    ('l05', 4, 1.6, 'the clock now reads one o clock'),
    ('l06', 5, 3.0, 'knocks answer: one, then a pause, then two; a shadow crosses the landing light; second dropout: the chair nearer, turning'),
    ('l07', 6, 3.0, 'a low rasp from the far bed, too low to make out; the blanket there does not rise; third dropout: the chair at the foot of the bed, facing it'),
    ('l08', 7, 3.6, 'silence: even the room tone drops; nothing moves for too long'),
]
TAIL = 2.0


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
(ROOT / 'src/data/ep21-chair-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
