"""TRANSFERS Episode 1: turn the per-character ElevenLabs takes into one file per script line.

Each take holds one character's lines in script order, separated by [long pause] tags.
1. Bea (Cielle) and JoJo (Rey Mark) are shifted into a child's range: an asetrate/atempo pass
   raises the formants, then rubberband raises the pitch with formants preserved.
   Bea uses the user's pick "Cielle B" (formants +8%, pitch about +4 semitones in total);
   JoJo uses the smaller "A" shift (formants +12%).
2. Each multi-line take is cut from word timestamps (ElevenLabs scribe_v1 transcription of the
   take, flow XtJPkSIjDPCJz6d0shg0): SPANS holds each line's first-word start and last-word end.
   A cut is padded by up to 0.15 s but never past the midpoint of the pause to the next line.
3. Lines are written as 48 kHz mono WAV under lines/, with a manifest of script order and text.
Usage: python3 scripts/transfers_ep01_dialogue.py
"""
import json, subprocess
from pathlib import Path
import sys
import numpy as np


ROOT = Path(__file__).resolve().parents[1] / 'public/assets/audio/transfers/ep01-dialogue'
TAKES, LINES = ROOT / 'takes', ROOT / 'lines'
SR = 48000

# Script order (EP01-SCREENPLAY.md), speaker, Taglish line, English caption.
SCRIPT = [
    ('titoboy', "O, kaway kayo! Para kay Tatay Rudy 'to!", "Come on, wave! This one's for Tatay Rudy!"),
    ('lola', "Pambaon mo, anak. Huwag mong gagastusin agad, ha.", "Something for your trip, son. Don't spend it all at once."),
    ('rudy', "'Nay naman.", "Oh, Ma."),
    ('titoboy', "Pare, ikaw naman.", "Your turn, pare."),
    ('rudy', "Paano 'to? Ano'ng pipindutin ko?", "How does this work? What do I press?"),
    ('titoboy', "Wala. Basta huwag mo lang papatayin.", "Nothing. Just don't turn it off."),
    ('rudy', "Dito na lang. Picture tayo, lahat!", "I'll leave it here. Photo, everybody!"),
    ('guest', "Isa, dalawa…", "One, two…"),
    ('liza', "Nico, tumawag ulit 'yung bangko. Three months na tayong late.", "Nico, the bank called again. We're three months behind."),
    ('nico', "Alam ko. May papasok na pera, promise.", "I know. Money's coming in. I promise."),
    ('liza', "Galing saan? Diyan sa channel mo?", "From where? That channel of yours?"),
    ('nico', "Kumikita na siya, Liz. Legit.", "It's making money now, Liz."),
    ('liza', "Eighteen hundred. Sa isang buwan. Nico… ibenta na lang natin 'yung shop. Please.", "Eighteen hundred. In a month. Nico… let's sell the shop. Please."),
    ('nico', "One more month lang, Liz.", "One more month."),
    ('liza', "Pakainin mo si Bea. Bea, huwag mong hayaang magpuyat si Papa, okay?", "Feed Bea. Bea, don't let Papa stay up late, okay?"),
    ('bea', "Opo, Ma.", "Yes, Ma."),
    ('bea', "Pa, ano po 'yung \"Lumang Tape\"?", "Pa, what's \"Old Tape\"?"),
    ('nico', "Wala. Work lang.", "Nothing. Work."),
    ('bea', "Pa, may box po sa labas. Nauulanan na po.", "Pa, there's a box outside. It's getting rained on."),
    ('nico', "Walang sender.", "No sender."),
    ('bea', "Pa, iba po 'yung itsura ng pera.", "Pa, the money looks different."),
    ('nico', "Luma lang 'yan. Tatanggapin pa 'yan ng bank.", "It's just old. The bank will still take it."),
    ('nico', "Shh. Huwag mo munang sasabihin kay Mama, ha?", "Shh. Don't tell Mama yet, okay?"),
    ('bea', "…Opo.", "…Okay."),
    ('guest', "Sa labas tayo! Kasama 'yung dyip!", "Outside, everyone! With the jeep!"),
    ('bea', "Pa.", "Pa."),
    ('nico', "Hm?", "Hm?"),
    ('bea', "Sino po 'yung nakatayo sa may kusina?", "Who's that standing by the kitchen?"),
    ('nico', "…Tao ba 'yan?", "…Is that a person?"),
    ('bea', "Kanina pa po siya diyan.", "It's been there the whole time."),
    ('nico', "Kanina pa?", "The whole time?"),
    ('jojo', "Bye, Tay!", "Bye, Dad!"),
    ('bea', "Pa… ipo-post mo po ba 'yan?", "Pa… are you going to post that?"),
    ('nico', "Hindi. …I don't know.", "No. …I don't know."),
    ('bea', "Huwag na po.", "Please don't."),
    ('nico', "Matulog ka na, anak.", "Go to sleep, sweetheart."),
    ('nico', "Tape one. No label. Walang pangalan.", "Tape one. No label. No name."),
    ('nico', "Bea.", "Bea."),
]

# Word-timestamp spans (seconds into each take) per line number, from the scribe transcripts.
# Starts include the "Shh" (l23) and laughs (l03, l04, l05) that scribe wrote as tags.
# Bea's are on the shifted take (the shift keeps duration). Lola and JoJo have one line: whole take.
SPANS = {
    'nico': {10: (0.08, 3.60), 12: (4.714, 7.113), 14: (7.92, 9.30), 18: (10.08, 11.453), 20: (12.24, 13.14),
             22: (14.213, 16.56), 23: (17.2, 20.16), 27: (20.549, 21.16), 29: (21.973, 22.733),
             31: (23.493, 24.12), 34: (25.04, 27.28), 36: (27.84, 29.32), 37: (29.96, 33.52), 38: (34.229, 34.80)},
    'liza': {9: (0.16, 4.96), 11: (5.787, 7.876), 13: (8.80, 16.029), 15: (16.80, 22.08)},
    'titoboy': {1: (0.08, 2.84), 4: (3.12, 5.96), 6: (8.16, 10.24)},
    'bea': {16: (0.08, 1.04), 17: (2.576, 4.44), 19: (5.68, 8.76), 21: (9.76, 12.02), 24: (13.12, 13.80),
            26: (14.72, 15.16), 28: (16.40, 18.40), 30: (19.52, 20.90), 33: (22.389, 23.94), 35: (24.853, 26.00)},
    'rudy': {3: (0.0, 2.08), 5: (3.067, 6.36), 7: (7.493, 10.00)},
    'guest': {8: (0.22, 1.64), 25: (3.04, 5.28)},
}

# Lines replaced by a retake (already shifted and trimmed). l19: the user picked "Nauulanan" (B1)
# because the model stressed "nababasa" as "being read" instead of "getting wet".
RETAKES = {19: 'retakes/l19-ulan-1.wav'}

CHILD = {  # (formant ratio via asetrate, extra pitch ratio with preserved formants)
    'bea': (1.08, 1.1683),   # user's pick: Cielle B
    'jojo': (1.12, 1.1236),  # smaller "A" shift for an 8-year-old boy
}


def ff(*args):
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', *args], check=True)


def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def save(x, p):
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1',
                    '-i', '-', '-c:a', 'pcm_s16le', str(p)], input=x.astype(np.float32).tobytes(), check=True)


def split(x, n, floor_db=40, pad=0.06):
    hop = int(0.01 * SR)
    env = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, 'same')[::hop])
    db = 20 * np.log10(env + 1e-9)
    act = db > db.max() - floor_db
    idx = np.flatnonzero(act)
    first, last = idx[0], idx[-1] + 1
    gaps, i = [], first
    while i < last:  # silent runs inside the speech
        if not act[i]:
            j = i
            while j < last and not act[j]:
                j += 1
            gaps.append((j - i, i, j))
            i = j
        else:
            i += 1
    cuts = sorted(sorted(gaps, reverse=True)[:n - 1], key=lambda g: g[1])
    if len(cuts) != n - 1:
        raise SystemExit(f'expected {n - 1} gaps, found {len(cuts)}')
    bounds = [first] + [c for g in cuts for c in (g[1], g[2])] + [last]
    p = int(pad / 0.01)
    segs = []
    for k in range(n):
        a, b = bounds[2 * k], bounds[2 * k + 1]
        segs.append(x[max(0, (a - p) * hop): min(len(x), (b + p) * hop)])
    return segs, [g[0] * 0.01 for g in cuts]


def main():
    LINES.mkdir(parents=True, exist_ok=True)
    for who, (fr, pr) in CHILD.items():
        src = TAKES / f'{who}-raw.mp3'
        ff('-i', str(src), '-af', f'aresample={SR},asetrate={SR}*{fr},aresample={SR},atempo={1 / fr:.4f},'
           f'rubberband=pitch={pr}:formant=preserved', str(TAKES / f'{who}.wav'))
    order = {}
    for i, (who, _, _) in enumerate(SCRIPT):
        order.setdefault(who, []).append(i)
    manifest, report = [], {}
    for who, idxs in order.items():
        take = TAKES / (f'{who}.wav' if who in CHILD else f'{who}.mp3')
        x = load(take)
        if len(idxs) > 1:
            sp = [SPANS[who][i + 1] for i in idxs]
            dur, pad = len(x) / SR, 0.15
            cuts = []
            for k, (a, b) in enumerate(sp):
                lo = 0.0 if k == 0 else (sp[k - 1][1] + a) / 2
                hi = dur if k == len(sp) - 1 else (b + sp[k + 1][0]) / 2
                cuts.append((max(lo, a - pad), min(hi, b + pad)))
            segs = [x[int(a * SR): int(b * SR)] for a, b in cuts]
            report[who] = {'lines': len(idxs), 'cuts_s': [[round(a, 2), round(b, 2)] for a, b in cuts]}
        else:
            segs = [x]
            report[who] = {'lines': 1}
        for i, s in zip(idxs, segs):
            if i + 1 in RETAKES:
                s = load(ROOT / RETAKES[i + 1])
            peak = np.abs(s).max()
            if peak > 0:
                s = s * (10 ** (-3 / 20) / peak)  # peak-normalise each line to -3 dBFS; the mix sets levels
            name = f'l{i + 1:02d}-{who}.wav'
            save(s, LINES / name)
            manifest.append({'n': i + 1, 'speaker': who, 'file': f'lines/{name}', 'text': SCRIPT[i][1],
                             'caption': SCRIPT[i][2], 'seconds': round(len(s) / SR, 2)})
    manifest.sort(key=lambda m: m['n'])
    (ROOT / 'lines.json').write_text(json.dumps({'episode': 1, 'lines': manifest}, ensure_ascii=False, indent=1))
    print(json.dumps(report, indent=1))
    for m in manifest:
        print(f"{m['n']:02d} {m['speaker']:8s} {m['seconds']:5.2f}s  {m['text']}")


if __name__ == '__main__':
    main()
