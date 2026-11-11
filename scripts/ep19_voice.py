"""Episode 19 "Santelmo" (folklore and science): Taglish narration lines + timeline, built from the REAL line
durations of one ElevenLabs take before the picture is locked.

Narrator (user's choice, 2026-11-11): ElevenLabs library voice "Juanito" (u1CVBnSUn9JiL8ssgd2v),
eleven_v4, Taglish, one performance with [long pause] between lines (prompt in
docs/production/ep19-santelmo/prompt.json). The take is split with scripts/eleven_split.py; pauses
inside a line are capped at 0.45 s; TEMPO fits the episode under 60 s.
Without the take, `--provisional` writes a timeline from estimated line lengths (syllables / 4.2
per second, Taglish) so the picture can be blocked; it is marked provisional.

Writes WAVs to public/assets/audio/ep19-santelmo-v1/voice/ and src/data/ep19-santelmo-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep19-santelmo-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep19-take1.mp3'
SR = es.SR
TEMPO = 1.0
SYL_PER_S = 4.2

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    "Kapag may liwanag na sumusunod sa'yo sa palayan, huwag mo itong sundan.",
    'Santelmo ang tawag dito ng mga magsasaka.',
    'Isang bola ng apoy, lumulutang sa palayan. Sa ilog. Sa dagat.',
    "May totoong liwanag na kilala ng siyensya, ang St. Elmo's fire. Kumakapit ito sa palo ng barko kapag may bagyo.",
    "Pero hindi ito sumusunod sa'yo pauwi.",
    'Sabi ng matatanda, kaluluwa raw ang santelmo. Isang nalunod, na hindi na natagpuan.',
    'Dinadala ka nito sa tubig.',
    'Dahil gusto nito ng kasama.',
    'Baligtarin mo ang damit mo, sabi nila. Nawawala ka sa paningin nito.',
    'Kadalasan.',
]

# (id, take index, gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 0.15, 'hook: dark rice paddies; a ball of fire above the palay keeping pace with the camera'),
    ('l02', 1, 0.7, 'the pilapil, a farmer and his flashlight; the light keeping pace'),
    ('l03', 2, 0.6, 'a wide: paddies under clouds, a nipa hut, the canal, the pump; the light far over the field'),
    ('l04', 3, 0.7, 'a ship in a storm, a glow clinging to its mast (St. Elmo\'s fire)'),
    ('l05', 4, 0.6, 'back on the pilapil: he stops, it stops; he walks, it walks'),
    ('l06', 5, 0.7, 'it drifts over the canal; its reflection, and a second glow under the water'),
    ('l07', 6, 0.6, 'the frogs stop; it splits into three'),
    ('l08', 7, 3.0, 'silence; it comes close at face height; inside the fire, four frames of a drowned face (stinger in silence)'),
    ('l09', 8, 1.1, 'he turns his shirt inside out; the light shrinks, drifts back and sinks into the canal'),
    ('l10', 9, 1.7, 'dawn: a scorched circle in the palay; far off, a fourth light'),
]
TAIL = 1.6


def tempo(x, f):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={f:.4f}', '-f', 'f64le', '-'],
                       input=x.astype('<f8').tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(p, np.float64).copy()


def tighten(x, keep=0.45, floor_db=40):
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
doc = {'provisional': PROVISIONAL, 'fps': 30, 'duration_seconds': total, 'duration_frames': int(round(total * 30)),
       'voice': f'ElevenLabs eleven_v4, Juanito (u1CVBnSUn9JiL8ssgd2v), Taglish, one take, split into lines, inner pauses capped at 0.45 s, atempo {TEMPO}',
       'lines': timeline}
(ROOT / 'src/data/ep19-santelmo-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
