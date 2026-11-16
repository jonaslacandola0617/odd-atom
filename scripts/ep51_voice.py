"""Episode 51 "Po Po Po" (Season 6 opener: a teenager's summer at his grandparents' farmhouse in Japan, the too-tall woman in the white hat; retold from a 2ch post): English narration lines +
timeline, built from the REAL line durations of one ElevenLabs take before the picture is locked.

Narrator: ElevenLabs "Jack" (BVPhWQykET1TSvfGzrUr), eleven_v4, one performance with
[long pause] between lines (prompt in docs/production/ep51-popo/prompt.json). The voice through the
door is a separate ElevenLabs take ("Alden - Tired Old Man", S9V0fuqWOqX0i8Kb8ctu), placed as a
diegetic line (kind "door"). Writes WAVs to public/assets/audio/ep51-popo-v1/voice/ and
src/data/ep51-popo-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep51-popo-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / f"public/assets/audio/eleven-takes/ep51-take{2 if '--take2' in sys.argv else 1}.mp3"
SR = es.SR
TEMPO = 1.0
KEEP = 0.22
SYL_PER_S = 3.6

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    "The summer I turned fifteen, I watched a white hat drift along the top of my grandparents' hedge. That hedge is eight feet tall.",
    "When I told Grandpa, the colour left his face. By dark they had sealed me upstairs. Paper over every window. A bowl of salt in each corner.",
    '"Don\'t open that door before sunrise. Whatever you hear."',
    'Around two, the salt started turning black. Then something tapped on every window at once. On the second floor.',
    "Then, through the door, Grandpa's voice.",
    'But Grandpa was sitting right beside me. And he was shaking his head.',
    "At dawn they drove me out of the valley. She walked beside the car the whole way, bent down to my window. I didn't look. Not once.",
]
DOOR = ROOT / 'public/assets/audio/eleven-takes/ep51-door-voice-1.mp3'
DOOR_TEXT = "It's all over now. You can come out. Open the door for Grandpa."

# (id, take index (or 'door'), gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 0.3, 'hook: summer daylight, the tall hedge; a white hat glides along its top, stops where I stand, tilts'),
    ('l02', 1, 1.0, 'Grandpa turns; Grandma pastes newspaper over the window, salt bowls in the corners'),
    ('l03', 2, 0.8, 'Grandma at the sliding door, closing it on me and Grandpa'),
    ('l04', 3, 4.6, 'silent night: the sealed room, one bulb; the salt in the near bowl darkens grain by grain (the viewer sees it first)'),
    ('l05', 4, 1.6, 'the tapping runs round every papered window; the papers dent inward; "po po po" outside'),
    ('d01', 'door', 0.4, 'the door: on its paper, a shadow far too tall folds down at the waist to the height of a man'),
    ('l06', 5, 1.2, 'Grandpa beside me, his hand on my shoulder, slowly shaking his head; the shadow tilts its head to listen'),
    ('l07', 6, 2.6, 'dawn: the car on the valley road; she strides beside it, bent double, her face at my window; her smile'),
]

TAIL = 1.8


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
       'voice': 'ElevenLabs eleven_v4, Jack (BVPhWQykET1TSvfGzrUr), English, one take, split into lines, inner pauses capped at 0.22 s, no tempo change; the door voice is Alden (S9V0fuqWOqX0i8Kb8ctu), take 1',
       'lines': timeline}
(ROOT / 'src/data/ep51-popo-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
