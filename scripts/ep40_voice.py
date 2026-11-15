"""Episode 40 "Patayin ang Ilaw" (Season 4 finale: Malinta Tunnel, Corregidor; history and reported haunting): Taglish narration lines +
timeline, built from the REAL line durations of one ElevenLabs take before the picture is locked.

Narrator: ElevenLabs "Juanito" (u1CVBnSUn9JiL8ssgd2v), eleven_v4, one performance with
[long pause] between lines (prompt in docs/production/ep40-malinta/prompt.json). Writes WAVs to
public/assets/audio/ep40-malinta-v1/voice/ and src/data/ep40-malinta-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep40-malinta-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep40-take1.mp3'
SR = es.SR
TEMPO = 1.06
SYL_PER_S = 3.6

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    'Sa Malinta, may sandaling pinapapatay ang lahat ng ilaw.',
    'Corregidor. Itinayo ang tunnel na ito laban sa bomba. Noong 1942, naging ospital ito ng mga sugatang Pilipino at Amerikano.',
    'Noong 1945, may mga sundalong Hapon na nakulong sa loob, at may mga pagsabog. May mga lagusang gumuho na hindi na binuksan.',
    'Sa night tour, may isang hiling ang gabay.',
    'Patayin ang ilaw.',
    'Pagbukas ng ilaw, pareho pa rin kami. Halos.',
    'Nagbilang ang gabay. Anim kami. Pito ang sumagot.',
    'Para sa lahat ng namatay rito, sa lahat ng panig. Huwag natin silang kalimutan.',
]

# (id, take index, gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 0.5, 'hook: a lateral, six beams on the concrete; they go out one by one'),
    ('l02', 1, 1.0, 'the island at night, the tunnel mouth; cicadas; then (mid-line) the main tunnel, bed bolts in the floor'),
    ('l03', 2, 0.9, 'a lateral sealed by rubble; dust trickles down in a beam'),
    ('l04', 3, 0.9, 'the guide ahead turns and lifts a hand; the beams gather on him'),
    ('l05', 4, 1.0, 'the group from behind, six beams'),
    ('l06', 5, 9.0, 'the beams go out one by one (1.4 s); then about seven and a half seconds of black: after-images, a dim glow where no one stands'),
    ('l07', 6, 2.4, 'a beam finds, at the back of the group, an extra figure in an old helmet, head bowed; the lights die by themselves; the guide\'s beam comes back'),
    ('l08', 7, 1.8, 'the guide\'s beam counting heads: six, and a seventh'),
]
TAIL = 3.0


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
        x = tighten(take[max(0, int((a - 0.03) * SR)):int((b + 0.1) * SR)].copy())
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
       'voice': f'ElevenLabs eleven_v4, Juanito (u1CVBnSUn9JiL8ssgd2v), Taglish, one take, split into lines, inner pauses capped at 0.24 s, atempo {TEMPO}',
       'lines': timeline}
(ROOT / 'src/data/ep40-malinta-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
