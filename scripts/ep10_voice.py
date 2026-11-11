"""Episode 10 "The Night the Lake Breathed Out" (true: Lake Nyos, Cameroon, 21 August 1986): narration lines + timeline, built from the REAL line
durations of one ElevenLabs take, before the picture is made.

Narrator: ElevenLabs "Jack - Deep Dark Horror Narrator" (BVPhWQykET1TSvfGzrUr, eleven_v4), the
channel's true-case voice, one performance with [long pause] between lines (prompt in
docs/production/ep10-lake/prompt.json). The take is split with scripts/eleven_split.py; pauses
inside a line are capped at 0.6 s; no atempo.
Without the take (ElevenLabs busy), `--provisional` writes a timeline from estimated line
lengths (syllables / 3.8 per second) so the picture can be blocked; it is marked provisional
and is replaced as soon as the take exists.

Writes WAVs to public/assets/audio/ep10-lake-v1/voice/ and src/data/ep10-lake-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep10-lake-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep10-take1.mp3'
SR = es.SR
TEMPO = 1.0

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    'Look at this lake. Calm. Blue. In one night, it breathed out.',
    'Cameroon, August, nineteen eighty six. Villages sleep in the valleys below Lake Nyos.',
    'Late at night, people hear a deep rumble. Some see a white mist rise from the water.',
    'The mist is carbon dioxide, heavier than air. It pours over the rim and down the valleys, like water.',
    'By morning, the valleys are silent.',
    'One thousand, seven hundred and forty six people died that night. Many in their homes.',
    'For years, gas from deep below had gathered at the bottom of the lake, held down by the weight of the water.',
    'That night, something disturbed it. Scientists still debate what.',
    'Today, pipes draw the gas up from the bottom, so it cannot build up like that again.',
    'But other lakes on Earth are still holding their breath.',
]

# (id, take index, gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 0.15, 'hook: the crater lake at night, still, stars on the water'),
    ('l02', 1, 0.7, 'the valley at night: huts, lamps in windows, crickets'),
    ('l03', 2, 0.6, 'the rumble; the lake surface lifts'),
    ('l04', 3, 1.6, 'stinger in silence: the white plume rises'),
    ('l05', 4, 1.6, 'the mist reaches the village; a lamp goes out; the crickets stop; black'),
    ('l06', 5, 1.2, 'dawn: empty paths, doors open, cold ash'),
    ('l07', 6, 1.2, 'down through the water'),
    ('l08', 7, 0.6, 'the deep layer'),
    ('l09', 8, 1.6, 'stinger in silence: the deep layer lets go; then today, the degassing raft'),
    ('l10', 9, 0.9, 'another lake at night, calm; one bubble'),
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
        dur = syl / 3.8
        text, kind = TAKE_LINES[src], 'narrator'
    else:
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
doc = {'provisional': PROVISIONAL, 'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)),
       'voice': f'ElevenLabs eleven_v4, Jack - Deep Dark Horror Narrator (BVPhWQykET1TSvfGzrUr), take 1 of 2, one take split into lines, inner pauses capped at 0.6 s, atempo {TEMPO}',
       'lines': timeline}
(ROOT / 'src/data/ep10-lake-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
