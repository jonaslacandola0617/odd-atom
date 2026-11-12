"""TRANSFERS Episode 1 "Bayad Na": the sound-only draft mix (dialogue + SFX + composed music).

Everything is placed on one timeline from a cue sheet that follows EP01-SCREENPLAY.md scene by
scene. The picture does not exist yet, so this mix sets the timing the picture will follow.

Sources (no new credits):
  dialogue   public/assets/audio/transfers/ep01-dialogue/lines/ (lines.json)
  SFX        sfx-v1, sfx-v2, sfx-v2-long, sfx-v3 under public/assets/audio/transfers/
  composed   here: the cassette-player party song (original, lo-fi), tape hiss, the drone layer,
             phone beeps and clicks

Chains:
  tape       1990s camcorder audio: band 150 Hz-4.8 kHz, wow, soft saturation, hiss bed
  tv         a tape played back through the shop's CRT speaker: tape, then 220 Hz-5.5 kHz and room
  call       Liza on speakerphone: 300 Hz-3.4 kHz, saturated
  phone      the phone clip played back on its own speaker (Scene 4)

Output: public/assets/audio/transfers/ep01-mix/ (mix .m4a, captions .srt,
cues.json with every placement, and report.json with loudness and dialogue margins).
Usage: python3 scripts/transfers_ep01_mix.py
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from horror_score import _filt, _verb, drone_mid  # noqa: E402

SR = 48000
REPO = Path(__file__).resolve().parents[1]
AUD = REPO / 'public/assets/audio/transfers'
DLG = AUD / 'ep01-dialogue'
OUT = AUD / 'ep01-mix'
END = 357.0
N = int(END * SR)
TARGET_LUFS, CEIL_DB = -14.0, -1.5


# ---------- io ----------
def load(p, ch=2):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-f', 'f32le', '-ac', str(ch), '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).astype(np.float64)
    return x.reshape(-1, ch) if ch == 2 else x


def sfx(name):
    for d in ('sfx-v3', 'sfx-v2-long', 'sfx-v2', 'sfx-v1'):
        p = AUD / d / f'{name}.mp3'
        if p.exists():
            return load(p)
    raise FileNotFoundError(name)


def st(x):
    return np.stack([x, x], 1) if x.ndim == 1 else x


def mono(x):
    return x.mean(1) if x.ndim == 2 else x


def db(g):
    return 10 ** (g / 20)


def peak_norm(x, to=-6.0):
    p = np.abs(x).max()
    return x * (db(to) / p) if p > 0 else x


def rms_norm(x, to=-20.0):
    r = np.sqrt(np.mean(x ** 2))
    return x * (db(to) / r) if r > 0 else x


def fade(x, a=0.01, b=0.05):
    x = x.copy()
    na, nb = int(a * SR), int(b * SR)
    if na:
        x[:na] *= np.linspace(0, 1, na)[:, None] if x.ndim == 2 else np.linspace(0, 1, na)
    if nb:
        x[-nb:] *= np.linspace(1, 0, nb)[:, None] if x.ndim == 2 else np.linspace(1, 0, nb)
    return x


def tile(x, seconds, xf=0.5):
    """Loop a bed to a length with equal-power crossfades."""
    n, k = int(seconds * SR), int(xf * SR)
    x = st(x)
    out = x.copy()
    w = np.linspace(0, np.pi / 2, k)[:, None]
    while len(out) < n:
        out = np.concatenate([out[:-k], out[-k:] * np.cos(w) + x[:k] * np.sin(w), x[k:]])
    return out[:n]


def env(points, start, n):
    """Piecewise-linear gain in dB over absolute times; points [(t, dB)], -90 means off."""
    t = start + np.arange(n) / SR
    ts, gs = zip(*points)
    return db(np.interp(t, ts, gs))


# ---------- chains ----------
def wow(x, depth_ms=1.4, rate=0.55, seed=0):
    r = np.random.default_rng(seed)
    n = len(x)
    t = np.arange(n) / SR
    d = depth_ms / 1000 * SR * (0.6 * np.sin(2 * np.pi * rate * t + r.uniform(0, 6)) + 0.4 * np.sin(2 * np.pi * 3.1 * t))
    idx = np.clip(np.arange(n) - d - depth_ms / 1000 * SR, 0, n - 1)
    i0 = idx.astype(int)
    f = idx - i0
    i1 = np.minimum(i0 + 1, n - 1)
    return x[i0] * (1 - f) + x[i1] * f


def sat(x, drive=1.6):
    return np.tanh(drive * x) / np.tanh(drive)


def tape(x, seed=0):
    y = _filt(mono(x), SR, lo=150, hi=4800)
    return sat(wow(y, seed=seed), 1.8)


def tv(x, seed=0):
    y = _filt(tape(x, seed), SR, lo=220, hi=5500)
    return _verb(y, SR, 0.35, 0.18, seed + 7)


def call(x):
    return st(sat(_filt(mono(x), SR, lo=300, hi=3400, slope=2), 2.2))


def phone_spk(x):
    return st(sat(_filt(mono(x), SR, lo=450, hi=7000, slope=1.5), 1.4))


def room(x, wet=0.07, seed=3):
    return _verb(mono(x), SR, 0.4, wet, seed)


def hiss(seconds, seed=1):
    r = np.random.default_rng(seed)
    x = _filt(r.standard_normal(int(seconds * SR)), SR, lo=1800, hi=9000)
    return st(rms_norm(x, -20))


# ---------- composed ----------
def song(seconds, bpm=100):
    """Original lo-fi pop on a cassette player: I-vi-IV-V strums, bass, a little organ line, a drum box."""
    t = np.arange(int(seconds * SR)) / SR
    out = np.zeros_like(t)
    beat = 60 / bpm
    bar = 4 * beat
    chords = [(261.6, 329.6, 392.0), (220.0, 261.6, 329.6), (174.6, 220.0, 261.6), (196.0, 246.9, 293.7)]
    roots = [130.8, 110.0, 87.3, 98.0]
    melody = [659.3, 587.3, 523.3, 587.3, 659.3, 659.3, 659.3, 0, 587.3, 587.3, 659.3, 784.0, 523.3, 0, 440.0, 392.0]

    def pluck(f, dur, amp, bright=6):
        n = int(dur * SR)
        tt = np.arange(n) / SR
        y = sum(amp / k * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * (2.5 + k * bright / 3)) for k in range(1, 7))
        return y

    def put(y, at):
        i = int(at * SR)
        if i < len(out):
            out[i:i + len(y)] += y[:len(out) - i]

    nbars = int(seconds / bar) + 1
    for b in range(nbars):
        c, r0 = chords[b % 4], roots[b % 4]
        t0 = b * bar
        for k, (off, a) in enumerate([(0, 1), (1.5, .7), (2, .9), (3, .7), (3.5, .6)]):
            for j, f in enumerate(c):
                put(pluck(f, 1.2, 0.18 * a), t0 + off * beat + j * 0.012)
        for off in (0, 2):
            put(pluck(r0, 1.0, 0.5, bright=1), t0 + off * beat)
        for k in range(4):  # melody, two notes per bar
            f = melody[(b * 4 + k) % len(melody)]
            if f and b % 2 == 0:
                n = int(beat * SR * 0.9)
                tt = np.arange(n) / SR
                put(0.12 * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.minimum(1, tt * 40) * np.exp(-tt * 2), t0 + k * beat)
        rr = np.random.default_rng(b)
        for k in range(4):
            tt = np.arange(int(0.25 * SR)) / SR
            if k in (0, 2):
                put(0.6 * np.sin(2 * np.pi * (55 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 14), t0 + k * beat)
            else:
                put(0.25 * _filt(rr.standard_normal(len(tt)), SR, lo=900, hi=5000) * np.exp(-tt * 22), t0 + k * beat)
            th = np.arange(int(0.05 * SR)) / SR
            for h in (0, 0.5):
                put(0.06 * _filt(rr.standard_normal(len(th)), SR, lo=6000) * np.exp(-th * 80), t0 + (k + h) * beat)
    y = _filt(out, SR, lo=180, hi=6000)  # a small cassette player's speaker
    y = sat(wow(y, depth_ms=2.0, rate=0.4, seed=5), 1.3)
    return st(rms_norm(y, -20))


def beeps(n=3, f=480.0):
    tt = np.arange(int(0.16 * SR)) / SR
    b = np.sin(2 * np.pi * f * tt) * np.minimum(1, tt * 200) * np.minimum(1, (0.16 - tt) * 200)
    gap = np.zeros(int(0.12 * SR))
    return np.concatenate(sum([[b, gap] for _ in range(n)], []))


def click(seed=0, bright=4000):
    r = np.random.default_rng(seed)
    tt = np.arange(int(0.02 * SR)) / SR
    return st(_filt(r.standard_normal(len(tt)), SR, lo=1200, hi=bright) * np.exp(-tt * 400))


# ---------- the timeline ----------
mix = {k: np.zeros((N, 2)) for k in ('dlg', 'amb', 'fol', 'hor', 'mus')}
cues = []


def place(layer, x, at, gain=0.0, note=''):
    x = st(x) * db(gain)
    i = int(at * SR)
    j = min(N, i + len(x))
    if j > i:
        mix[layer][i:j] += x[:j - i]
    cues.append({'t': round(at, 2), 'layer': layer, 'note': note, 'seconds': round(len(x) / SR, 2), 'gain_db': gain})


def bed(layer, x, start, end, points, note):
    n = int((end - start) * SR)
    y = tile(x, end - start) * env(points, start, n)[:, None]
    place(layer, fade(y, 0.02, 0.02), start, 0.0, note)


LINES = {m['n']: m for m in json.loads((DLG / 'lines.json').read_text())['lines']}
captions = []


def line(n, at, chain=None, gain=0.0, seed=0, cap=True, layer='dlg'):
    m = LINES[n]
    x = load(DLG / m['file'], 1)
    if chain == 'tape':
        x = st(tape(x, seed))
    elif chain == 'tv':
        x = tv(x, seed)
    elif chain == 'call':
        x = call(x)
    else:
        x = room(x)
    place(layer, x, at, gain, f"l{n:02d} {m['speaker']}")
    if cap:
        c = m['caption'] if chain not in ('tape', 'tv') else f"[{m['caption']}]"
        captions.append((at, at + len(x) / SR, c))
    return at + len(x) / SR


def fx(name, at, gain=0.0, chain=None, seed=0, lp=None, layer='fol'):
    x = peak_norm(sfx(name))
    if lp:
        x = _filt(x, SR, hi=lp)
    if chain == 'tape':
        x = st(tape(x, seed))
    elif chain == 'tv':
        x = tv(x, seed)
    elif chain == 'phone':
        x = phone_spk(x)
    place(layer, fade(x, 0.005, 0.08), at, gain, name)


def loopbed(name):
    return rms_norm(sfx(name), -20)


# COLD OPEN 0:00-0:41, the 1991 tape; hard cut to silence at 41.0, title until 44.0
CUT = 41.0
H = hiss(CUT)
bed('amb', H, 0.0, CUT, [(0, -60), (0.6, -16), (CUT, -16)], 'tape hiss')
party = st(tape(loopbed('party-camcorder-loop20'), 11))
bed('amb', party, 0.7, CUT, [(0.7, -40), (1.6, -13), (13.5, -13), (14.2, -12), (16.0, -13), (35.0, -13), (36.6, -8), (39.5, -10), (CUT, -11)], 'party chatter (tape)')
mus = song(CUT)
place('mus', st(tape(_verb(mono(mus), SR, 0.5, 0.25, 9), 12)) * env([(0, -90), (1.0, -21), (CUT, -21)], 0, len(mus))[:, None], 0.0, 0.0, 'cassette song (original), in the tape')
bed('amb', st(tape(loopbed('fan-loop20'), 13)), 0.7, CUT, [(0.7, -30), (2, -24), (CUT, -24)], 'stand fan (tape)')
bed('amb', st(tape(loopbed('camcorder-room-loop20'), 14)), 0.5, CUT, [(0.5, -30), (1, -20), (CUT, -20)], 'camcorder motor (tape)')
line(1, 2.0, 'tape', 0, 1)
line(2, 6.4, 'tape', -1, 2)
line(3, 11.0, 'tape', 0, 3)
line(4, 14.4, 'tape', -4, 4)                      # buried under the chatter on purpose
fx('camcorder-setdown-2', 17.0, -4, 'tape', 5)     # the hand-over bump
fx('cloth-lift-1', 17.3, -8, 'tape', 6)            # a hand over the mic
line(5, 18.4, 'tape', 2, 5)                        # Rudy now holds it: close and loud
line(6, 22.6, 'tape', -3, 6)                       # Tito Boy farther away
line(7, 29.0, 'tape', 1, 7)
fx('camcorder-setdown-1', 32.0, -2, 'tape', 8)
line(8, 34.4, 'tape', 1, 8)
fx('film-camera-flash-1', 36.3, -3, 'tape', 9)
fx('vhs-dropout-1', 40.4, -6, 'tape', 10)
for k in mix:                                      # all sound cuts with the tape
    mix[k][int(CUT * SR):int(44.0 * SR)] = 0

# SCENE 1 0:44-2:07, the shop at dusk, rain; Liza on speaker
S1, S1E = 44.0, 127.0
bed('amb', loopbed('rain-tin-loop20'), S1, 360, [(S1, -60), (S1 + 1.2, -10), (98, -10), (99, -6), (102.5, -6), (104, -10),
                                                 (127, -10), (128, -12), (249, -12), (251, -16), (311, -16), (318, -90), (360, -90)], 'rain on the tin roof')
bed('amb', loopbed('market-rain-loop20'), S1, 129, [(S1, -60), (S1 + 1.5, -20), (98, -20), (99, -14), (102.5, -14), (104, -20), (126, -20), (129, -32)], 'market street at dusk')
bed('amb', loopbed('fan-loop20'), S1, 360, [(S1, -60), (S1 + 1, -24), (169.5, -24), (170.5, -90), (245.5, -90), (248, -24),
                                            (293, -24), (294.2, -19), (295.5, -24), (311, -24), (312, -90), (360, -90)], 'electric fan')
fx('marker-acetate-2', 45.6, -14)
fx('cassette-2', 47.2, -10)
bed('amb', call(loopbed('hospital-phone-loop20')), 48.0, 85.6, [(48, -60), (48.3, -24), (85.4, -24), (85.6, -90)], 'hospital behind Liza (call)')
line(9, 48.5, 'call', -1)
line(10, 54.5)
line(11, 59.0, 'call', -1)
fx('keyboard-mouse-1', 61.2, -18)
line(12, 62.5)
line(13, 66.0, 'call', -1)
line(14, 75.5, gain=-2)
line(15, 78.0, 'call', -1)
line(16, 84.0, gain=0)
place('fol', call(beeps()), 85.6, -20, 'call ends')
place('fol', click(1), 86.6, -16, 'minimise click')
line(17, 88.0)
line(18, 91.0)
line(19, 94.0)
fx('tsinelas-steps-1', 97.6, -10)
fx('box-open-4', 102.4, -6)                         # the wet box down on the counter
line(20, 103.6, gain=-1)
fx('box-open-1', 105.4, -6)                         # packing tape torn off
fx('box-open-3', 106.6, -10)
fx('cloth-lift-1', 108.0, -16, lp=5000)             # notes and the envelope
fx('breath-nervous-2', 110.2, -14)                  # relief
line(21, 111.6)
line(22, 115.0)
line(23, 119.0)
line(24, 124.6, gain=-2)

# SCENE 2 2:07-4:09, night: Tape 01
crt = loopbed('crt-idle-loop20')
fx('cassette-3', 129.0, -10)
fx('vhs-insert-3', 130.8, -6)
fx('vcr-play-2', 132.8, -6)
fx('crt-on-long5', 134.6, -8)
bed('amb', crt, 136.0, 325.0, [(136, -60), (137, -22), (170, -22), (171, -19), (324.9, -17), (325.0, -90)], 'CRT whine')
place('fol', click(2), 139.4, -14, 'record click')
TH = hiss(250.0 - 140.5, 2)
bed('amb', st(_filt(mono(TH), SR, hi=5500)), 140.5, 228.0, [(140.5, -60), (141, -26), (227.5, -26), (228, -90)], 'tape hiss through the TV')
ff = mono(loopbed('party-camcorder-loop20'))[: int(12 * SR)]
ff = np.interp(np.arange(0, len(ff), 3.0), np.arange(len(ff)), ff)  # picture search: 3x
ff = ff * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 7 * np.arange(len(ff)) / SR)))
tt = np.arange(len(ff)) / SR
ff += 0.05 * np.sin(2 * np.pi * (1300 + 200 * np.sin(2 * np.pi * 0.7 * tt)) * tt)
place('amb', tv(ff, 20), 141.0, -6, 'fast-forward picture search')
bed('amb', tv(loopbed('party-camcorder-loop20'), 21), 145.0, 157.0,
    [(145, -60), (145.3, -12), (149, -12), (151, -22), (157, -90)], 'party in the tape, filing out')
bed('amb', tv(_filt(mono(loopbed('party-camcorder-loop20')), SR, hi=800), 22), 149.0, 158.0, [(149, -60), (150, -20), (155, -24), (158, -90)], 'chatter going outside (tape)')
bed('amb', tv(loopbed('fan-loop20'), 23), 150.0, 226.0, [(150, -60), (152, -26), (225, -26), (226, -90)], 'fan in the tape')
line(25, 146.0, 'tv', -2, 25)
fx('focus-hunt-long8', 158.0, -2, 'tv', 30, layer='hor')        # the entity signature
fx('tape-breath-long8', 158.6, -20, 'tv', 31, layer='hor')
line(26, 163.0, gain=0)
line(27, 164.4)
line(28, 166.2, gain=-1)
D = np.arange(int((247 - 168) * SR)) / SR
dr = drone_mid(D, lambda f: f, np.ones_like(D), root=110.0)
place('hor', rms_norm(dr, -20) * env([(168, -90), (175, -26), (195, -22), (232, -22), (247, -90)], 168, len(D)), 168.0, 0, 'drone (composed)')
bed('hor', loopbed('drone-loop20'), 168.0, 247.0, [(168, -90), (176, -28), (240, -28), (247, -90)], 'drone bed')
line(29, 175.0, gain=-2)
line(30, 177.4, gain=-1)
line(31, 179.8)
fx('vcr-rewind-long6', 182.0, -6)
fx('vcr-play-1', 188.4, -8)
line(8, 190.0, 'tv', -2, 40, cap=True)
for k, t in enumerate(np.arange(192.4, 197.6, 1.3)):
    fx('vcr-frame-step-1', t, -8)
fx('breath-nervous-long8', 197.0, -12, layer='fol')
bed('amb', tv(loopbed('party-camcorder-loop20'), 41), 204.0, 213.5, [(204, -60), (204.5, -14), (212.5, -16), (213.5, -90)], 'family back in (tape)')
line(32, 207.8, 'tv', 0, 42)
fx('light-switch-off-1', 212.6, -6, 'tv', 43)
fx('gate-goodbyes-1', 213.4, -10, 'tv', 44)
bed('amb', tv(loopbed('camcorder-room-loop20'), 45), 213.0, 226.0, [(213, -60), (214, -20), (226, -90)], 'camcorder motor in the dark (tape)')
fx('vcr-end-2', 226.0, -4)
line(33, 230.0, gain=-3)
line(34, 233.4)
line(35, 237.6, gain=-3)
line(36, 242.0, gain=-1)
fx('cloth-lift-1', 245.0, -14, lp=6000)

# SCENE 3 4:09-5:03, later: the search and the upload
fx('tape-marker-4', 251.0, -8)
fx('phone-down-1', 256.8, -10)
place('fol', click(3, 6000), 258.2, -18, 'phone record tap')
line(37, 259.4, gain=-1)
fx('phone-down-2', 264.4, -8)
fx('chair-3', 266.0, -10)
fx('keyboard-mouse-1', 268.0, -12)
for k, t in enumerate((276.5, 281.0, 284.2)):
    place('fol', click(10 + k), t, -18, 'mouse')
fx('keyboard-mouse-1', 287.6, -13)
place('fol', click(20), 297.0, -12, 'UPLOAD click')

# SCENE 4 5:03-5:57, the phone clip
place('fol', click(21, 6000), 303.6, -16, 'stop recording')
clip = rms_norm(mono(sfx('rain-tin-loop20'))[: int(20 * SR)], -20) + rms_norm(mono(sfx('fan-loop20'))[: int(20 * SR)], -20) * 0.5
place('amb', phone_spk(clip) * env([(306, -60), (306.3, -24), (318, -30), (322, -90)], 306, len(clip))[:, None], 306.0, 0, "the clip's own sound (phone)")
fx('phone-focus-long6', 309.0, -4, 'phone', layer='hor')
bed('hor', loopbed('drone-loop20'), 309.0, 325.0, [(309, -90), (316, -32), (324.9, -30), (325, -90)], 'drone at the threshold')
fx('tape-breath-long8', 328.0, 0, lp=2500, layer='hor')     # the only sound
line(38, 334.4, gain=-5)
fx('tsinelas-steps-1', 336.0, -16)
fx('cloth-lift-1', 340.0, -14, lp=6000)
fx('shutter-2', 345.0, -6)
bed('amb', _filt(loopbed('market-rain-loop20'), SR, hi=1500), 345.3, 350.0, [(345.3, -60), (345.6, -18), (348.5, -24), (350, -90)], 'rain on asphalt, far')
fx('focus-hunt-2', 353.6, -15, lp=6000, layer='hor')         # in the black


# ---------- master ----------
def lufs(x):
    p = OUT / '_tmp.wav'
    write_wav(x, p)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(p), '-af', 'ebur128', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    p.unlink()
    return float(r.rsplit('I:', 1)[1].split('LUFS')[0])


def write_wav(x, p):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f64le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le', str(p)],
                   input=np.ascontiguousarray(x).tobytes(), check=True)


def limit(x, ceil_db, look=0.004, rel=0.08):
    c = db(ceil_db)
    pk = np.abs(x).max(1)
    need = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    h = int(look * SR)
    blk = np.minimum.reduceat(need, np.arange(0, len(need), h))
    g = np.repeat(blk, h)[:len(need)]
    g = np.minimum(g, np.concatenate([g[h:], np.ones(h)]))   # look ahead one block
    k = 1 - np.exp(-256 / (rel * SR))                         # per-block release step
    out = np.empty_like(g)
    sm = 1.0
    for i in range(0, len(g), 256):
        seg = g[i:i + 256]
        m = seg.min()
        sm = m if m < sm else min(m, sm + (1 - sm) * k)
        out[i:i + 256] = np.minimum(seg, sm)
    return x * out[:, None]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    total = sum(mix.values())
    g = TARGET_LUFS - lufs(total)
    total = limit(total * db(g), CEIL_DB)
    for _ in range(2):
        g2 = TARGET_LUFS - lufs(total)
        g += g2
        total = limit(total * db(g2), CEIL_DB)
    wav = OUT / '_mix.wav'
    write_wav(total, wav)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(wav), '-c:a', 'aac', '-b:a', '256k', str(OUT / 'transfers-ep01-mix-v1.m4a')], check=True)
    wav.unlink()
    # dialogue margins: each line's RMS against everything else in the same window
    gain = db(g)
    rest = (total / 1) - mix['dlg'] * gain
    margins = []
    for c in cues:
        if c['layer'] != 'dlg':
            continue
        i, j = int(c['t'] * SR), int((c['t'] + c['seconds']) * SR)
        v = np.sqrt(np.mean((mix['dlg'][i:j] * gain) ** 2)) + 1e-12
        r = np.sqrt(np.mean(rest[i:j] ** 2)) + 1e-12
        margins.append({'cue': c['note'], 't': c['t'], 'margin_db': round(20 * np.log10(v / r), 1)})
    dec = load(OUT / 'transfers-ep01-mix-v1.m4a')
    rep = {'seconds': END, 'integrated_lufs': round(lufs(dec), 1), 'decoded_peak_dbfs': round(20 * np.log10(np.abs(dec).max()), 2),
           'dialogue_margins_db': margins, 'tightest': sorted(margins, key=lambda m: m['margin_db'])[:6]}
    (OUT / 'report.json').write_text(json.dumps(rep, indent=1))
    (OUT / 'cues.json').write_text(json.dumps(sorted(cues, key=lambda c: c['t']), indent=1, ensure_ascii=False))

    def ts(s):
        return f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{int(s % 60):02d},{int(round(s % 1 * 1000)) % 1000:03d}"
    srt = [f"{k}\n{ts(a)} --> {ts(b + 0.3)}\n{c}\n" for k, (a, b, c) in enumerate(sorted(captions), 1)]
    (OUT / 'transfers-ep01-captions-en.srt').write_text('\n'.join(srt))
    print(json.dumps({k: rep[k] for k in ('seconds', 'integrated_lufs', 'decoded_peak_dbfs', 'tightest')}, indent=1))


if __name__ == '__main__':
    main()
