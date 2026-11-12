"""Episode 27 "The Ball" (Season 3, a real place with reported hauntings: Waverly Hills Sanatorium,
Louisville, Kentucky):
English narration lines + timeline, built from the REAL line durations of one ElevenLabs take
before the picture is locked.

Narrator: ElevenLabs "Jack - Deep Dark Horror Narrator" (BVPhWQykET1TSvfGzrUr), eleven_v4, one
performance with [long pause] between lines (prompt in docs/production/ep27-ball/prompt.json).
First person: a ghost investigator (a composite, not a real person) following the ball; the facts
are told as reported and disputed. Writes WAVs to public/assets/audio/ep27-ball-v1/voice/ and
src/data/ep27-ball-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep27-ball-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep27-take1.mp3'
SR = es.SR
TEMPO = 1.0
SYL_PER_S = 3.6

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    'We set the ball down on the third floor. Nobody touched it.',
    'Waverly Hills Sanatorium. Louisville, Kentucky. A hospital for tuberculosis.',
    'Before there was a cure, thousands of patients died here.',
    "The bodies went down a tunnel under the hill, five hundred feet long, so the living wouldn't see them leave.",
    'Ghost stories say sixty-three thousand died. The records point to far fewer. Still, thousands.',
    'Investigators bring a ball up here. They say a little boy plays with it. They call him Timmy.',
    'No record of him has ever been found.',
    'Roll it back.',
]

# (id, take index, gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 0.1, 'hook: infrared, the third-floor corridor; the ball starts rolling away from us by itself'),
    ('l02', 1, 1.5, 'the ball rolls on into the dark; cut to the building on its hill at night'),
    ('l03', 2, 0.8, 'cut to the open-air porch: the ball rolls along it, past the open windows'),
    ('l04', 3, 1.6, 'cut to the tunnel: walking down the long steps'),
    ('l05', 4, 3.2, 'from behind, the ball comes bouncing down the steps, past us, into the dark'),
    ('l06', 5, 1.2, 'the third-floor corridor; the ball rolls ahead of us'),
    ('l07', 6, 2.6, 'the ball turns into a ward room; we follow; it stops against a bed frame'),
    ('l08', 7, 3.6, 'silence; the ball rolls back across the room and stops at our feet'),
]
TAIL = 7.6


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
(ROOT / 'src/data/ep27-ball-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
