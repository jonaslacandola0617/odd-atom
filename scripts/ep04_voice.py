"""Episode 4 "Rules for the Night Shift": the rule-sheet voice + timeline.

Fiction, so the voice is Episode 1's MBROLA us2 (the channel's voice for fictional
broadcasts and notices).  The rules are read in that voice; at 4 a.m. the SAME voice
speaks again, muffled, from outside the door (the 'door' line), which is the twist of
rule six: "especially if you recognise the voice".  Writes WAVs to
public/assets/audio/ep04-night-v1/voice/ and timing to src/data/ep04-night-v1-timeline.json.
Requires: apt-get install espeak-ng mbrola mbrola-us2
"""
import json, subprocess, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep04-night-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
VOICE = ['espeak-ng', '-v', 'us-mbrola-2', '-s', '160', '-p', '40', '-g', '3']

# (id, text, gap before, what the picture does in the gap, kind)
LINES = [
    ('l01', 'You are alone up here until morning. Follow these rules.', 0.35, 'hook: the rule sheet by the monitor, snow on the window', 'rules'),
    ('l02', 'One. Record the temperature every hour.', 0.6, 'the cable car leaves; the station alone on the ridge', 'rules'),
    ('l03', 'Two. The wind sensor reports wind on calm nights. Do not go up to check.', 0.5, 'pen on the log; the cups spinning on a still night', 'rules'),
    ('l04', 'Three. If the phone rings, let it ring. There is no phone line.', 0.8, 'the phone, its cord cut, rings', 'rules'),
    ('l05', 'Four. If you see footprints to the door, turn off every light.', 1.0, 'through the east window: smooth snow, then prints', 'rules'),
    ('l06', 'Five. Knocking is fine.', 1.4, 'dark room; knocking', 'rules'),
    ('l07', 'Six. At four a.m., someone will say they are the morning shift.', 0.9, 'the clock: 04:00; knocking', 'rules'),
    ('door', 'Morning shift. Open the door.', 0.6, 'the same voice, outside the door', 'door'),
    ('l08', 'The morning shift arrives at seven. Do not open.', 0.5, 'the peephole: only snow', 'rules'),
    ('l09', 'Especially if you recognise the voice.', 0.4, 'the hand off the bolt', 'rules'),
    ('l10', 'Seven. If you do not remember writing tonight\'s log, you did not write it.', 1.1, 'the log, every row filled', 'rules'),
    ('l11', 'Do not turn around.', 1.0, 'behind the worker: the dark', 'rules'),
]
TAIL = 2.0

timeline = []
t = 0.0
for lid, text, gap, beat, kind in LINES:
    wav = OUT / f'{lid}.wav'
    args = VOICE if kind == 'rules' else ['espeak-ng', '-v', 'us-mbrola-2', '-s', '132', '-p', '34', '-g', '4']
    if lid == 'l11':
        args = ['espeak-ng', '-v', 'us-mbrola-2', '-s', '118', '-p', '30', '-g', '6']
    r = subprocess.run(args + ['-w', str(wav), text], check=True, capture_output=True, text=True)
    assert 'unknown' not in r.stderr, r.stderr
    with wave.open(str(wav)) as w:
        dur = w.getnframes() / w.getframerate()
    t += gap
    timeline.append({'id': lid, 'text': text if kind == 'rules' else f'"{text}"', 'start': round(t, 3), 'end': round(t + dur, 3), 'kind': kind, 'beat_before': beat})
    t += dur
total = round(t + TAIL, 3)
doc = {'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)), 'voice': 'espeak-ng + MBROLA us2, rate 160, pitch 40, word gap 3 (door line: rate 132, pitch 34; last line: rate 118, pitch 30)', 'lines': timeline}
(ROOT / 'src/data/ep04-night-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
