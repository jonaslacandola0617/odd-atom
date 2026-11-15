"""Episode 36 "Sunugin Mo ang Damit" (Season 4, campus legend: the UP Ikot jeep): Taglish narration lines +
timeline, built from the REAL line durations of one ElevenLabs take before the picture is locked.

Narrator: ElevenLabs "Juanito" (u1CVBnSUn9JiL8ssgd2v), eleven_v4, one performance with
[long pause] between lines (prompt in docs/production/ep36-ikot/prompt.json). Writes WAVs to
public/assets/audio/ep36-ikot-v1/voice/ and src/data/ep36-ikot-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep36-ikot-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep36-take1.mp3'
SR = es.SR
TEMPO = 1.0
SYL_PER_S = 3.6

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    'Sa salamin, puno ang dyip. Pero ikaw lang ang nakaupo.',
    'Sa UP Diliman, may kuwento tungkol sa Ikot, ang dyip na umiikot sa kampus.',
    'Gabi na. Isa-isang bumababa ang mga pasahero. At lahat sila, lumilingon sa iyo.',
    'Bilangin mo ang barya sa upuan. Sobra ng isa.',
    'Sa huling hinto, hindi lumingon ang drayber. Mahina lang niyang sinabi,',
    'pagdating mo, sunugin mo ang damit mo.',
    'Alamat lang daw iyon. Pero buong biyahe raw, may nakakapit sa likod mo.',
    'At umiikot pa rin ang Ikot.',
]

# (id, take index, gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 0.6, 'hook: inside the jeep, the window across shows our bench full; beside her, empty'),
    ('l02', 1, 1.4, 'the campus at night: acacias, sodium lights, the Ikot in a puddle'),
    ('l03', 2, 1.2, 'stop by stop, passengers get off, each looks back at her'),
    ('l04', 3, 1.6, 'the coins on the bench: one too many'),
    ('l05', 4, 3.0, 'alone: in the window, a grey figure beside her, its head bowed on her shoulder; the jeep stops'),
    ('l06', 5, 1.0, 'the driver from behind; he does not turn'),
    ('l07', 6, 3.6, 'her room: the jacket comes off: two grey handprints on its back; then the can, the fire'),
    ('l08', 7, 1.6, 'the Ikot passes empty; in its window, her reflection, sitting'),
]
TAIL = 3.4


def tempo(x, f):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={f:.4f}', '-f', 'f64le', '-'],
                       input=x.astype('<f8').tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(p, np.float64).copy()


def tighten(x, keep=0.32, floor_db=40):
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
       'voice': f'ElevenLabs eleven_v4, Juanito (u1CVBnSUn9JiL8ssgd2v), Taglish, one take, split into lines, inner pauses capped at 0.32 s, atempo {TEMPO}',
       'lines': timeline}
(ROOT / 'src/data/ep36-ikot-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
