"""Episode 3 "Footprints in the Snow": archive narrator voice + timeline.

The same MBROLA us1 archive narrator as Episode 2: the channel's voice for true
cases (Episode 1's us2 stays the voice of fictional broadcasts).  Each line is generated
with espeak-ng, measured, and laid out on a timeline with picture-driven gaps.
Writes raw line WAVs to public/assets/audio/ep03-snow-v1/voice/ and the timing
to src/data/ep03-snow-v1-timeline.json.
Requires: apt-get install espeak-ng mbrola mbrola-us1
"""
import json, subprocess, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep03-snow-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
VOICE = ['espeak-ng', '-v', 'us-mbrola-1', '-s', '150', '-p', '28', '-g', '3']

# (id, text, gap in seconds before the line, what the picture does in the gap)
LINES = [
    ('l01', 'You find footprints in the snow, leading to your door.', 0.3, 'hook: the tracks from the forest to the door, frame 0'),
    ('l02', 'None lead away.', 0.5, 'the door: the tracks end at it'),
    ('l03', 'Bavaria, nineteen twenty two. A lonely farm called Hinterkaifeck.', 0.9, 'the farm in its clearing at dusk'),
    ('l04', 'The house keys go missing. A newspaper turns up that nobody bought.', 0.5, 'key board, an empty hook; a paper on the table'),
    ('l05', 'At night, the farmer hears footsteps in the attic.', 0.8, 'the lamp-lit room, dust from the ceiling boards'),
    ('l06', 'He searches with a lantern. He finds nothing.', 1.6, 'from the dark attic: the lantern rises through the hatch'),
    ('l07', 'Months earlier, the maid had quit. She said the house was haunted.', 0.8, 'the maid\'s chamber, bed stripped'),
    ('l08', 'On the last night of March, all six people on the farm were killed.', 1.0, 'one lit window at night; it goes dark'),
    ('l09', 'For days, smoke rose from the chimney. Someone fed the cattle.', 1.6, 'silence; the silent farm, smoke; the barn'),
    ('l10', 'Whoever did it had stayed in the house.', 0.8, 'the attic hatch, open'),
    ('l11', 'The case was never solved.', 1.0, 'the farm in falling snow'),
    ('l12', 'No one knows how long someone had been living above them.', 0.9, 'a hollow in the attic hay'),
]
TAIL = 2.3
# what espeak should say where the caption spelling would be misread
SAY = {'Hinterkaifeck': 'Hinter kye feck'}

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
(ROOT / 'src/data/ep03-snow-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']} {l['text'][:70]}")
print('total', total, 's')
