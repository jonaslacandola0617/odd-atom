"""Episode 49 "Bukas Pa Kagabi" (Season 5: a rider served at a milk tea shop that had been closed for months; retold from experiences shared online): Taglish narration lines +
timeline, built from the REAL line durations of one ElevenLabs take before the picture is locked.

Narrator: ElevenLabs "Juanito" (u1CVBnSUn9JiL8ssgd2v), eleven_v4, one performance with
[long pause] between lines (prompt in docs/production/ep49-milktea/prompt.json). Writes WAVs to
public/assets/audio/ep49-milktea-v1/voice/ and src/data/ep49-milktea-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep49-milktea-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep49-take1.mp3'
SR = es.SR
TEMPO = 1.0
SYL_PER_S = 3.6

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    "Bukas pa 'yung milk tea shop kagabi. Pero anim na buwan na pala itong sarado.",
    'Rider ako. Alas-dos ng madaling-araw, may booking: dalawang milk tea, sa shop sa kanto.',
    'Bukas ang ilaw. May pila. Lahat nakaharap sa counter. Walang gumagalaw. Walang nagsasalita.',
    'Ngumiti ang crew. Hindi siya kumukurap. Inabot niya ang order ko, at ang resibo.',
    'Paglabas ko, lumingon ako. Nakatingin silang lahat sa akin. Pero nakaharap pa rin ang katawan nila sa counter.',
    'Kinabukasan, dumaan ako. Naka-kandado. Maalikabok. Anim na buwan na raw sarado, sabi ng guard.',
    'Pero nasa bulsa ko pa ang resibo. Petsa kagabi. Alas-dos.',
    'Sa likod, may sulat-kamay: "Balik ka, sir. Kulang pa ang pila."',
]

# (id, take index, gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 0.4, 'hook: the lit shopfront at night from my scooter; the queue inside turns its heads to me at once, bodies still'),
    ('l02', 1, 1.0, 'the dark corner, one shop lit; my scooter pulls up'),
    ('l03', 2, 1.2, 'inside, behind the queue: backs, still; nobody moves'),
    ('l04', 3, 1.2, 'the crew at the counter: the smile, the sealer, the receipt'),
    ('l05', 4, 1.2, 'walking out, I look back: every head turned round to me, the bodies still facing the counter'),
    ('l06', 5, 1.6, 'day: the same shopfront, shutter down, padlocked, dust; the guard'),
    ('l07', 6, 1.2, 'my hand: the receipt from my pocket, the date'),
    ('l08', 7, 1.4, 'night again: the shop lit, the queue with a gap for me; the crew at the glass, her head snaps to the lens'),
]

TAIL = 3.3


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
    if PROVISIONAL:
        import re
        syl = sum(max(1, len(re.findall(r'[aeiouy]+', w.lower()))) for w in re.findall(r'[A-Za-z]+', TAKE_LINES[src]))
        dur = syl / SYL_PER_S
        text, kind = TAKE_LINES[src], 'narrator'
    else:
        a, b = segs[src]
        x = tighten(take[max(0, int((a - 0.03) * SR)):int((b + 0.1) * SR)].copy(), keep=0.32)
        x = tempo(x, TEMPO) if TEMPO != 1.0 else x
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
doc = {'provisional': PROVISIONAL, 'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)),
       'voice': f'ElevenLabs eleven_v4, Juanito (u1CVBnSUn9JiL8ssgd2v), Taglish, one take, split into lines, inner pauses capped at 0.32 s, no tempo change',
       'lines': timeline}
(ROOT / 'src/data/ep49-milktea-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
