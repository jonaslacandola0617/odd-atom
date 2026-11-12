"""Episode 23 "Backwards" (Season 3, a real reported case: the Bell Witch, Adams, Tennessee,
1817-1821): English narration lines + timeline, built from the REAL line durations of one ElevenLabs
take before the picture is locked.

Narrator: ElevenLabs "Jack - Deep Dark Horror Narrator" (BVPhWQykET1TSvfGzrUr), eleven_v4, one
performance with [long pause] between lines (prompt in docs/production/ep23-bell/prompt.json).
The story runs BACKWARDS, scene by scene, from the funeral to the first night; the gaps hold the
on-screen events and the tape rewinds between scenes.
Writes WAVs to public/assets/audio/ep23-bell-v1/voice/ and src/data/ep23-bell-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep23-bell-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep23-take1.mp3'
SR = es.SR
TEMPO = 1.0
SYL_PER_S = 3.6

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    'December, eighteen twenty. Tennessee. They are burying John Bell.',
    'Witnesses said a voice laughed over the grave. And sang. Until the last mourner left.',
    'The morning he died, the family found a small vial no one recognised.',
    'The voice said it had given him a dose.',
    'For three years, it had talked. Visitors said it repeated sermons, word for word.',
    "It pulled the covers off the children's beds. Every night.",
    'It began in eighteen seventeen. With scratching. On the outside of the walls.',
    "Almost all of this comes from one book, written seventy years later. The family's own account has never been found.",
    'This is the first night. You know how it ends.',
]

# (id, take index, gap before, what the picture does in the gap) -- every shot moves
PLAN = [
    ('l01', 0, 0.1, 'hook: the funeral at dusk in snow; the camera tracks behind mourners with lanterns; the coffin is lowered on ropes'),
    ('l02', 1, 2.6, 'a laugh from nowhere; a gust rips across the graveyard; the lanterns go out one after another down the line; every mourner turns to look past the camera'),
    ('l03', 2, 1.3, 'REWIND (the tape runs backwards); December 1820, the sickroom: the camera creeps from the door towards the bed'),
    ('l04', 3, 1.6, 'on the windowsill a small vial rolls by itself towards the bed; the hand on the quilt twitches; the candle leans away'),
    ('l05', 4, 1.3, 'REWIND; 1819, the main room: the family at supper, the camera circling the table'),
    ('l06', 5, 1.9, 'every candle flame leans towards the empty chair; it scrapes back; on the wall, the shadow of someone sitting in it; REWIND'),
    ('l07', 6, 2.4, "1818, the children's room: from the doorway, a quilt slides off a bed, then is yanked to the floor; REWIND"),
    ('l08', 7, 1.6, '1817, outside at night: tracking along the log wall, scratches appear on the logs ahead of the camera; something moves through the corn towards the house'),
    ('l09', 8, 1.6, 'the first night inside: candlelight on a bedpost; one scratch draws itself into the wood'),
]
TAIL = 1.8


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
(ROOT / 'src/data/ep23-bell-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
