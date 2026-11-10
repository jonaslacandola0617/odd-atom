"""Episode 2 "The Mask on Channel 11": archive narrator voice + timeline.

A second MBROLA voice (us1, a female diphone voice) so the true-story archive
narrator is distinct from Episode 1's us2 alert voice.  (us3 was tried and
rejected: it lacks the O2 phoneme and silently drops vowels in 'gone', 'on', 'off'.)  Each line is generated
with espeak-ng, measured, and laid out on a timeline with picture-driven gaps.
Writes raw line WAVs to public/assets/audio/ep02-mask-v1/voice/ and the timing
to src/data/ep02-mask-v1-timeline.json.
Requires: apt-get install espeak-ng mbrola mbrola-us1
"""
import json, subprocess, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep02-mask-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
VOICE = ['espeak-ng', '-v', 'us-mbrola-1', '-s', '150', '-p', '28', '-g', '3']

# (id, text, gap in seconds before the line, what the picture does in the gap)
LINES = [
    ('l01', 'This face cut into your television. Twice.', 0.35, 'hook: the mask on the CRT from frame 0'),
    ('l02', 'Chicago, nineteen eighty seven. The Sunday night sports news.', 0.8, 'skyline and tower beacon; living room, clock 9:14'),
    ('l03', 'A man in a rubber mask. No voice. Just a buzz.', 2.2, 'screen goes black; the mask appears'),
    ('l04', 'Engineers switch the signal. Twenty five seconds, and he is gone.', 0.7, 'viewer leans in; the anchor returns'),
    ('l05', 'Two hours later, he comes back. On channel eleven.', 1.2, 'the tower at night; clock 11:15; listings'),
    ('l06', 'This time, he speaks.', 1.7, 'sci-fi show; it goes black; the mask'),
    ('l07', 'For ninety seconds, nobody can stop him.', 3.4, 'warped laugh, the hum, the soda can; viewer stands'),
    ('l08', 'The last thing anyone sees is a hand from off screen, with a flyswatter.', 0.7, 'empty transmitter room; the swatting shadow'),
    ('l09', 'Investigators searched. No one was ever charged.', 1.4, 'static; the tower in the dark'),
    ('l10', 'Nearly forty years later, no one knows who was under the mask.', 0.6, 'the empty living room'),
    ('l11', 'Or how easily he got into yours.', 0.5, 'push into the static'),
]
TAIL = 2.4

timeline = []
t = 0.0
for lid, text, gap, beat in LINES:
    wav = OUT / f'{lid}.wav'
    subprocess.run(VOICE + ['-w', str(wav), text], check=True)
    with wave.open(str(wav)) as w:
        dur = w.getnframes() / w.getframerate()
    t += gap
    timeline.append({'id': lid, 'text': text, 'start': round(t, 3), 'end': round(t + dur, 3), 'beat_before': beat})
    t += dur
total = round(t + TAIL, 3)
doc = {'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)), 'voice': 'espeak-ng + MBROLA us1, rate 150, pitch 28, word gap 3', 'lines': timeline}
(ROOT / 'src/data/ep02-mask-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']} {l['text'][:70]}")
print('total', total, 's')
