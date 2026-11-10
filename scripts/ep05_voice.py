"""Episode 5 "Nine Hikers, One Cut Tent": archive narrator voice + timeline.

The same MBROLA us1 archive narrator as Episode 2: the channel's voice for true
cases (Episode 1's us2 stays the voice of fictional broadcasts).  Each line is generated
with espeak-ng, measured, and laid out on a timeline with picture-driven gaps.
Writes raw line WAVs to public/assets/audio/ep05-tent-v1/voice/ and the timing
to src/data/ep05-tent-v1-timeline.json.
Requires: apt-get install espeak-ng mbrola mbrola-us1
"""
import json, subprocess, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep05-tent-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
VOICE = ['espeak-ng', '-v', 'us-mbrola-1', '-s', '150', '-p', '28', '-g', '3']

# (id, text, gap in seconds before the line, what the picture does in the gap)
LINES = [
    ('l01', 'Imagine cutting your own tent open, and running into the snow in your socks.', 0.3, 'hook: inside the tent, a blade through the canvas, frame 0'),
    ('l02', 'February, nineteen fifty nine. Nine experienced hikers camp on a slope in the northern Urals.', 0.6, 'the slope at dusk, nine torches, the tent'),
    ('l03', 'Weeks later, searchers find the tent. Cut open, from the inside.', 0.6, 'the tent half buried, slashed canvas'),
    ('l04', 'Footprints lead down the slope. Socks. Bare feet.', 0.5, 'prints going downhill, toward the trees'),
    ('l05', 'Some are found by a small fire, under a cedar tree.', 0.9, 'the cedar, the dead fire, branches broken high up'),
    ('l06', 'Others lie in a ravine. They are not found until May.', 0.5, 'the ravine, thawing'),
    ('l07', 'The file closes with three words: a compelling natural force.', 0.8, 'the case file'),
    ('l08', 'In twenty twenty one, scientists showed how a delayed slab avalanche could explain the tent.', 0.6, 'a slab breaks above the tent'),
    ('l09', 'Not everyone is convinced.', 0.5, 'the tent alone in the wind'),
    ('l10', 'Whatever happened that night, nine people decided the frozen dark was safer than their tent.', 0.9, 'back inside the tent'),
]
TAIL = 2.0
# what espeak should say where the caption spelling would be misread
SAY = {}

timeline = []
t = 0.0
for lid, text, gap, beat in LINES:
    wav = OUT / f'{lid}.wav'
    spoken = text
    for k, v in SAY.items():
        spoken = spoken.replace(k, v)
    r = subprocess.run(VOICE + ['-w', str(wav), spoken], check=True, capture_output=True, text=True)
    assert 'unknown' not in r.stderr, r.stderr  # a voice missing a phoneme drops sounds silently
    with wave.open(str(wav)) as w:
        dur = w.getnframes() / w.getframerate()
    t += gap
    timeline.append({'id': lid, 'text': text, 'start': round(t, 3), 'end': round(t + dur, 3), 'beat_before': beat})
    t += dur
total = round(t + TAIL, 3)
doc = {'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)), 'voice': 'espeak-ng + MBROLA us1, rate 150, pitch 28, word gap 3', 'lines': timeline}
(ROOT / 'src/data/ep05-tent-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']} {l['text'][:70]}")
print('total', total, 's')
