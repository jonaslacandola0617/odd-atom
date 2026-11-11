"""Episode 12 "Tik-Tik" (original, built on the Philippine tiktik belief): Taglish narration lines + timeline, built from the REAL line
durations of one ElevenLabs take before the picture is locked.

Narrator (user's choice, 2026-11-11): ElevenLabs library voice "Juanito" (u1CVBnSUn9JiL8ssgd2v),
eleven_v4, Taglish, one performance with [long pause] between lines (prompt in
docs/production/ep12-tiktik/prompt.json). The take is split with scripts/eleven_split.py; pauses
inside a line are capped at 0.45 s; TEMPO fits the episode under 60 s.
Without the take, `--provisional` writes a timeline from estimated line lengths (syllables / 4.2
per second, Taglish) so the picture can be blocked; it is marked provisional.

Writes WAVs to public/assets/audio/ep12-tiktik-v1/voice/ and src/data/ep12-tiktik-v1-timeline.json.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import eleven_split as es

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep12-tiktik-v1/voice'
OUT.mkdir(parents=True, exist_ok=True)
TAKE = ROOT / 'public/assets/audio/eleven-takes/ep12-take1.mp3'
SR = es.SR
TEMPO = 1.0
SYL_PER_S = 4.2

# every line of the take, in order (the split needs all of them)
TAKE_LINES = [
    'Pag humihina ang tunog, hindi siya lumalayo. Lumalapit siya.',
    'Sabi ng lola ko, nangangaso raw siya tuwing pista, habang malakas ang videoke at walang nakakarinig sa mga aso.',
    'Nagtali siya ng bawang sa bintana. Nagbuhos siya ng asin sa pasimano.',
    'Tapos narinig namin. Tik-tik. Malakas. "Malayo pa," sabi niya.',
    'Tik... tik. Mahina na.',
    'tik.',
    'Tumigil ang videoke, sa gitna ng kanta.',
    'Hindi gumalaw si Lola. Nakatingin siya sa bubong.',
    'Kinaumagahan, nakakalat ang asin sa pasimano.',
    'Mula sa loob.',
]

# (id, take index, gap before, what the picture does in the gap)
PLAN = [
    ('l01', 0, 0.15, 'hook: one dim bulb in a wooden barrio house, the child asleep on a banig, the dark gap under the roof'),
    ('l02', 1, 0.7, 'the barrio street during the fiesta: banderitas, the videoke glow far off, a sari-sari store'),
    ('l03', 2, 0.6, "Lola's hands tie garlic at the jalousie window; salt poured along the sill"),
    ('l04', 3, 0.8, 'the roofs from the street, the moon, coconut trees; the TIK-TIK far away'),
    ('l05', 4, 1.0, 'inside: the bulb sways; Lola looks up'),
    ('l06', 5, 1.4, 'the camera tilts up to the gap between the wall and the roof'),
    ('l07', 6, 1.6, 'outside: the videoke screen goes dark mid-song; the dogs stop'),
    ('l08', 7, 0.9, 'inside, behind Lola: she stares at the roof'),
    ('l09', 8, 3.4, 'held silence; a long tongue lowers from the roof gap; the bulb flickers; the face in the gap (stinger in silence); black; a rooster'),
    ('l10', 9, 0.7, 'dawn: the sill; the salt scattered inward, across the floor'),
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
(ROOT / 'src/data/ep12-tiktik-v1-timeline.json').write_text(json.dumps(doc, indent=2) + '\n')
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} {l['id']:5} {l['text'][:70]}")
print('total', total, 's')
