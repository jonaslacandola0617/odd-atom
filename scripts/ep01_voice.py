"""Episode 1 broadcast voice + timeline.

Generates each alert line with espeak-ng + MBROLA us2 (a classic diphone
text-to-speech voice, the sound of real emergency-alert systems), measures it,
and lays the lines out on a timeline with picture-driven gaps.  Writes raw
line WAVs to public/assets/audio/ep01-moon/voice/ and the timing to
src/data/ep01-moon-timeline.json.  Requires: apt-get install espeak-ng mbrola mbrola-us2
"""
import json, subprocess, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep01-moon/voice'
OUT.mkdir(parents=True, exist_ok=True)

# (id, text, gap in seconds before the line, what the picture does in the gap)
LINES = [
    ('l01', 'This is an emergency broadcast. This is not a test.', 3.6, 'cold open: late show, signal break, attention tone'),
    ('l02', 'Tonight, at ten forty two, P.M., the Moon will rise as normal.', 0.8, 'mother frozen in TV glow'),
    ('l03', 'Do not look at it.', 0.8, 'establishing street, east glow'),
    ('l04', 'Close your curtains now. Cover any windows facing east. If you are outside, keep your eyes on the ground, and go indoors.', 0.9, 'mother looks at open curtains'),
    ('l05', 'Do not take photographs. Do not use binoculars, or telescopes. Do not watch it on a screen.', 1.0, 'neighbours closing curtains'),
    ('l06', 'If someone in your home has already looked, do not let them describe what they saw.', 1.4, 'phone face down; back door'),
    ('l07', 'Do not answer, if they say it looks different.', 1.4, 'father in the yard, staring east'),
    ('l08', 'Do not answer, if they say it is closer.', 1.6, 'door handle turns'),
    ('l09', 'It is not the Moon.', 2.0, 'father silhouette in the doorway'),
    ('l10', 'The real Moon will rise, in approximately four hours. Until then, stay inside. Stay quiet. And keep listening to this channel, for further instructions.', 2.2, 'the light over the rooftops'),
    ('l11', 'If this message is coming from outside your window,', 3.0, 'father now behind the couch; TV dies'),
    ('l12', 'do not open the curtains to check.', 0.7, 'curtains glowing'),
]
TAIL = 4.5

timeline = []
t = 0.0
for lid, text, gap, beat in LINES:
    wav = OUT / f'{lid}.wav'
    subprocess.run(['espeak-ng', '-v', 'us-mbrola-2', '-s', '150', '-p', '38', '-g', '3', '-w', str(wav), text], check=True)
    with wave.open(str(wav)) as w:
        dur = w.getnframes() / w.getframerate()
    t += gap
    timeline.append({'id': lid, 'text': text, 'start': round(t, 3), 'end': round(t + dur, 3), 'beat_before': beat})
    t += dur
total = round(t + TAIL, 3)
doc = {'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)), 'voice': 'espeak-ng + MBROLA us2, rate 150, pitch 38, word gap 3', 'lines': timeline}
(ROOT / 'src/data/ep01-moon-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']} {l['text'][:60]}")
print('total', total, 's')
