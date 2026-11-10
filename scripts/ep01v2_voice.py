"""Episode 1 viral cut (v2): broadcast voice + timeline.

Generates each alert line with espeak-ng + MBROLA us2 (a classic diphone
text-to-speech voice, the sound of real emergency-alert systems), measures it,
and lays the lines out on a timeline with picture-driven gaps.  Writes raw
line WAVs to public/assets/audio/ep01-moon-v2/voice/ and the timing to
src/data/ep01-moon-v2-timeline.json.  Requires: apt-get install espeak-ng mbrola mbrola-us2
"""
import json, subprocess, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep01-moon-v2/voice'
OUT.mkdir(parents=True, exist_ok=True)

# (id, text, gap in seconds before the line, what the picture does in the gap)
LINES = [
    ('l01', 'If you are seeing this, close your curtains. Now.', 0.45, 'hook: alert card + tone from frame 0'),
    ('l02', 'Tonight, at ten forty two, the Moon will rise. Do not look at it.', 0.9, 'neighbours close curtains; she closes ours'),
    ('l03', 'Do not take photographs. Do not watch it on a screen.', 0.7, 'clock 10:39; she glances at the curtains'),
    ('l04', 'If someone in your home has already looked, do not let them describe what they saw.', 0.9, 'phone: MARK look at this'),
    ('l05', 'Do not answer, if they say it is closer.', 3.2, 'kitchen dolly: Mark in the yard'),
    ('l06', 'It is not the Moon.', 2.6, 'handle turns; Mark in the doorway'),
    ('l07', 'Stay inside. Keep listening, for further instructions.', 2.6, 'the light over the rooftops; Mark behind her'),
    ('l08', 'If this message is coming from outside your window,', 3.0, 'TV dies'),
    ('l09', 'do not open the curtains to check.', 0.5, 'shadow on the curtains'),
]
TAIL = 3.4

timeline = []
t = 0.0
for lid, text, gap, beat in LINES:
    wav = OUT / f'{lid}.wav'
    subprocess.run(['espeak-ng', '-v', 'us-mbrola-2', '-s', '158', '-p', '36', '-g', '2', '-w', str(wav), text], check=True)
    with wave.open(str(wav)) as w:
        dur = w.getnframes() / w.getframerate()
    t += gap
    timeline.append({'id': lid, 'text': text, 'start': round(t, 3), 'end': round(t + dur, 3), 'beat_before': beat})
    t += dur
total = round(t + TAIL, 3)
doc = {'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)), 'voice': 'espeak-ng + MBROLA us2, rate 158, pitch 36, word gap 2', 'lines': timeline}
(ROOT / 'src/data/ep01-moon-v2-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']} {l['text'][:60]}")
print('total', total, 's')
