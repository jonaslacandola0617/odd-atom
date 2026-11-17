"""Episode 55 "The Lift" (Season 6: a taxi driver's night on a hill road in Himachal; retold in our own words from a
driver's account shared online and churel/chudail folklore): English narration lines + timeline, built from the
REAL line durations of one ElevenLabs take.

Narrator: ElevenLabs "Jack" (BVPhWQykET1TSvfGzrUr), eleven_v4, one performance with [long pause] between lines.
Prompts in docs/production/ep55-lift/prompt.json. Writes WAVs to public/assets/audio/ep55-lift-v1/voice/ and
src/data/ep55-lift-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep55-lift-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / f"public/assets/audio/eleven-takes/ep55-take{1 if '--take1' in sys.argv else 2}.mp3"
SR = es.SR
TEMPO = 1.07
KEEP = 0.16
SYL_PER_S = 3.6

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    "Two in the morning, coming down the ghat road, there was something in my mirror. On all fours. And it was keeping up.",
    "An hour before, on a bend above the village, a woman in a shawl had waved me down.",
    "Alone. No bag.",  # not used (time)
    "She walked into my headlights, and I saw her feet. The heels were at the front. Her toes pointed back, down the road.",
    "I didn't stop. I put my foot down. I hit her.",
    "In the camera, she gets up. The bones of her shins are through the skin. Her knees bend backwards. And she runs.",
    "Sixty. Seventy. Eighty, on a mountain road. I looked left. She was at my window, keeping pace.",
    "The old drivers call her the chudail. They say never stop for her, and never look back.",
    "I didn't. I made it down by dawn.",  # not used (time)
    "Then I watched the cabin camera. All the way down, a hand was resting on the back of my seat.",
]

# (id, take index, gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 1.4, 'hook: the cabin camera, through the back window, red in the tail lights: something on all fours on the road behind, gaining'),
    ('l02', 1, 1.3, 'the front dashcam: the ghat road, switchbacks, pines, the crash barrier; a figure on the bend waving'),
    ('l03', 3, 3.0, 'the taxi slows; she walks into the headlights; her feet: heels forward, toes back (the viewer sees it first)'),
    ('l04', 4, 1.8, 'I floor it; she stands in the beam; the impact: the windscreen cracks, blood across it'),
    ('l05', 5, 2.0, 'the cabin camera through the back window: she lies in the red light; bones through her shins; her knees bend backwards; she rises and runs'),
    ('l06', 6, 1.5, 'the speed climbs; the cabin camera: at the passenger window, keeping pace, hair streaming'),
    ('l07', 7, 1.8, 'the front dashcam: she is gone; the road; dawn coming up over the ridge, the town below'),
    ('l08', 9, 1.4, 'the cabin camera at dawn, played back: me driving, alone; a pale hand with long nails resting on the top of my seat'),
]

TAIL = 3.2


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
        timeline.append({'id': lid, 'text': DOOR_TEXT, 'start': round(t, 3), 'end': round(t + dur, 3), 'kind': 'speaker', 'beat_before': beat})
        t += dur
        continue
    timeline.append({'id': lid, 'text': text, 'start': round(t, 3), 'end': round(t + dur, 3), 'kind': kind, 'beat_before': beat})
    t += dur
total = round(t + TAIL, 3)
doc = {'provisional': PROVISIONAL, 'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)),
       'voice': 'ElevenLabs eleven_v4, Jack (BVPhWQykET1TSvfGzrUr), English, one take, split into lines, inner pauses capped at 0.16 s, atempo 1.07 to fit 60 s; take 2 (the shorter); two sentences left out for time',
       'lines': timeline}
(ROOT / 'src/data/ep55-lift-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
