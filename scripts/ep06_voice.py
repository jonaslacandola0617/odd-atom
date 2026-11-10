"""Episode 6 "The Sound That Matched Us": the sonar operator's voice + timeline.

Fiction, so the voice is MBROLA us2 (the channel's fiction voice), here slower and lower
as a first-person recollection.  The single word "Us." and the last line are slower
still.  Writes WAVs to public/assets/audio/ep06-sonar-v1/voice/ and timing to
src/data/ep06-sonar-v1-timeline.json.  Requires: apt-get install espeak-ng mbrola mbrola-us2
"""
import json, subprocess, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep06-sonar-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
VOICE = ['espeak-ng', '-v', 'us-mbrola-2', '-s', '158', '-p', '32', '-g', '3']

# (id, text, gap before, what the picture does in the gap, kind)
LINES = [
    ('l01', 'Three hundred metres down, something behind you sounds exactly like you.', 0.3, 'hook: the waterfall display, a second trace astern', 'rules'),
    ('l02', 'Day nine. I am on sonar. A contact. Directly behind us.', 0.7, 'the submarine in black water; the red sonar room', 'rules'),
    ('l03', 'No match. So I compare it to the only thing left.', 0.5, 'headphones; the library search', 'rules'),
    ('l04', 'Us.', 0.5, 'the two signatures, side by side', 'slow'),
    ('l05', 'Same propeller. Same rattle from the loose panel we never fixed.', 0.9, 'the signatures match; the panel rattles', 'rules'),
    ('l06', 'The captain orders all stop.', 0.8, 'the telegraph to ALL STOP; the crew frozen', 'rules'),
    ('l07', 'The contact stops too.', 0.7, 'the trace on the display stops', 'rules'),
    ('l08', 'Then, through the hull, we all hear it.', 1.1, 'condensation; everyone looks up', 'rules'),
    ('l09', 'Three slow knocks. The way our cook knocks on the galley hatch.', 2.6, 'knock, knock, knock', 'rules'),
    ('l10', 'Our cook is standing right next to me.', 2.1, 'the operator turns: the cook, right there', 'rules'),
    ('l11', 'When we surface, nothing is behind us. Only a long scrape down the stern.', 1.5, 'dawn; walking aft along the hull', 'rules'),
    ('l12', 'From the outside.', 0.6, 'the end of the scrape', 'slow'),
]
TAIL = 2.0

timeline = []
t = 0.0
for lid, text, gap, beat, kind in LINES:
    wav = OUT / f'{lid}.wav'
    args = VOICE if kind == 'rules' else ['espeak-ng', '-v', 'us-mbrola-2', '-s', '110', '-p', '26', '-g', '6']
    r = subprocess.run(args + ['-w', str(wav), text], check=True, capture_output=True, text=True)
    assert 'unknown' not in r.stderr, r.stderr
    with wave.open(str(wav)) as w:
        dur = w.getnframes() / w.getframerate()
    t += gap
    timeline.append({'id': lid, 'text': text, 'start': round(t, 3), 'end': round(t + dur, 3), 'kind': kind, 'beat_before': beat})
    t += dur
total = round(t + TAIL, 3)
doc = {'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)), 'voice': 'espeak-ng + MBROLA us2, rate 158, pitch 32, word gap 3 ("Us." and the last line: rate 110, pitch 26)', 'lines': timeline}
(ROOT / 'src/data/ep06-sonar-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
