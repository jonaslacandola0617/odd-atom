"""Split a whole-episode ElevenLabs take into its script lines.

The take is generated as one performance with [long pause] tags between lines. Lines are
cut at silent runs, chosen by dynamic programming: long silences are preferred, and each
segment's length should match its share of the script's characters.
Usage: python3 scripts/eleven_split.py take.mp3 timeline.json  -> prints JSON segments
"""
import json, re, subprocess, sys
import numpy as np

SR = 48000


def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-f', 'f64le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float64)


def segments(x, texts, floor_db=42, min_gap=0.22):
    hop = int(0.01 * SR)
    fr = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, 'same')[::hop])
    db = 20 * np.log10(fr + 1e-9)
    act = db > db.max() - floor_db
    first, last = int(np.argmax(act)), len(act) - int(np.argmax(act[::-1]))
    runs, i = [], first
    while i < last:
        if not act[i]:
            j = i
            while j < last and not act[j]:
                j += 1
            if (j - i) / 100 >= min_gap:
                runs.append((i, j))
            i = j
        else:
            i += 1
    w = np.array([len(re.sub(r'[^A-Za-z0-9]', '', t)) + 4 for t in texts], float)
    speech = (last - first) - 0.9 * 100 * (len(texts) - 1)
    exp = w / w.sum() * speech
    N, R = len(texts), len(runs)
    starts = [first] + [b for _, b in runs]
    ends = [a for a, _ in runs] + [last]
    INF = 1e18
    # dp over (segment k ends at boundary e); boundary indices: run r means the segment ends at runs[r][0]
    best = {}
    def cost(k, s_i, e_i):
        d = ends[e_i] - starts[s_i]
        if d <= 0:
            return INF
        return 6.0 * np.log(d / exp[k]) ** 2
    # state: segment k starts at starts[s]; choose end e >= s
    dp = np.full((N + 1, R + 2), INF)
    back = np.zeros((N + 1, R + 2), int)
    dp[0][0] = 0
    for k in range(N):
        for s in range(R + 1):
            if dp[k][s] >= INF:
                continue
            for e in range(s, R + 1):
                if k == N - 1 and e != R:
                    continue
                if k < N - 1 and e == R:
                    continue
                gap_bonus = -np.log1p((runs[e][1] - runs[e][0]) / 100) * 4 if e < R else 0
                v = dp[k][s] + cost(k, s, e) + gap_bonus
                if v < dp[k + 1][e + 1]:
                    dp[k + 1][e + 1] = v
                    back[k + 1][e + 1] = s
    segs, e = [], R + 1
    for k in range(N, 0, -1):
        s = back[k][e]
        segs.append((starts[s] / 100, ends[e - 1] / 100))
        e = s
    return segs[::-1]


if __name__ == '__main__':
    x = load(sys.argv[1])
    tl = json.load(open(sys.argv[2]))
    print(json.dumps([[round(a, 2), round(b, 2)] for a, b in segments(x, [l['text'] for l in tl['lines']])]))
