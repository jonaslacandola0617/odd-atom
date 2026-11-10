"""Episode 7 "This Is the Voice of Vrillon": narration lines + timeline, built from the
REAL line durations of one ElevenLabs take, before the picture is made.

Narrator: ElevenLabs "Jack - Deep Dark Horror Narrator" (BVPhWQykET1TSvfGzrUr, eleven_v4),
the channel's true-case voice, one performance with [long pause] between lines
(prompt in docs/production/ep07-vrillon/prompt.json, take in
public/assets/audio/eleven-takes/ep07-take1.mp3). The take is split with
scripts/eleven_split.py and tightened 1.06x so the episode fits under 60 s.

The intruding voice: the ElevenLabs fiction voice was asked for, but that generation
failed with the account's free-tier warning, so the one quoted line is espeak-ng +
MBROLA us2, slowed and lowered; scripts/ep07_sound.py treats it as a distorted
broadcast. A robotic voice is right here: it is a voice coming out of a television.

Script line l11 of the take ("No one was ever identified.") is cut for length; l12
("no one knows whose voice it was") carries the same fact.

Writes WAVs to public/assets/audio/ep07-vrillon-v1/voice/ and
src/data/ep07-vrillon-v1-timeline.json.  Requires: espeak-ng mbrola mbrola-us2, ffmpeg.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep07-vrillon-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep07-take1.mp3'
SR = es.SR
TEMPO = 1.06

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    'The man on your television is still talking. But that is not his voice.',
    'Southern England. A Saturday in November, nineteen seventy seven.',
    'Ten past five. Families sit down to the early evening news.',
    'Then the sound dissolves into a low hum.',
    'And another voice comes through.',
    "For six minutes, the picture never changes. The newsreader's lips keep moving.",
    'The voice tells everyone to give up their weapons. That there is only a short time left.',
    'On a hill in Hampshire, one transmitter is passing it on to the homes below.',
    'Then the news comes back, as if nothing had happened.',
    'The station apologises. The broadcasting authority calls it a hoax.',
    'No one was ever identified.',
    'Nearly fifty years later, no one knows whose voice it was.',
    'Or where it was really coming from.',
]
VRILLON = 'This is the voice of Vrillon, a representative of the Ashtar Galactic Command, speaking to you.'

# (id, take index or 'V', gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 0.15, 'hook: the newsreader on the CRT, lips moving, the hum'),
    ('l02', 1, 0.7, 'the terraced street at dusk, the mast on the hill'),
    ('l03', 2, 0.5, 'the living room: the family, the clock at 5:10'),
    ('l04', 3, 0.7, 'the TV: the picture holds, the sound starts to go'),
    ('l05', 4, 0.5, 'the family look up'),
    ('v01', 'V', 0.7, 'push into the speaker grille'),
    ('l06', 5, 1.4, 'stinger in silence; subliminal: the room seen from inside the TV'),
    ('l07', 6, 0.5, 'the frozen family; the lips out of sync'),
    ('l08', 7, 0.6, 'the mast on the hill; the transmitter hut, the sound meter pinned'),
    ('l09', 8, 0.9, 'the sound snaps back: stinger, jolt'),
    ('l10', 9, 0.5, 'the clock at 5:16; the apology'),
    ('l12', 11, 0.9, 'stinger in silence: the TV glass, the room reflected'),
    ('l13', 12, 0.5, 'the window, the mast light'),
]
TAIL = 1.7


def tempo(x, f):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={f:.4f}', '-f', 'f64le', '-'],
                       input=x.astype('<f8').tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(p, np.float64).copy()


def write(path, x):
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


take = es.load(TAKE)
segs = es.segments(take, TAKE_LINES)
timeline, t = [], 0.0
for lid, src, gap, beat in PLAN:
    wav = OUT / f'{lid}.wav'
    if src == 'V':
        r = subprocess.run(['espeak-ng', '-v', 'us-mbrola-2', '-s', '150', '-p', '24', '-g', '4', '-w', str(wav), VRILLON], check=True, capture_output=True, text=True)
        assert 'unknown' not in r.stderr, r.stderr
        with wave.open(str(wav)) as w:
            dur = w.getnframes() / w.getframerate()
        text, kind = VRILLON, 'vrillon'
    else:
        a, b = segs[src]
        x = take[max(0, int((a - 0.03) * SR)):int((b + 0.1) * SR)].copy()
        x = tempo(x, TEMPO)
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
doc = {'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)),
       'voice': f'ElevenLabs eleven_v4, Jack - Deep Dark Horror Narrator (BVPhWQykET1TSvfGzrUr), one take split into lines, atempo {TEMPO}; '
                'the intruder line: espeak-ng + MBROLA us2, rate 150, pitch 24 (the ElevenLabs fiction-voice generation failed)',
       'lines': timeline}
(ROOT / 'src/data/ep07-vrillon-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
