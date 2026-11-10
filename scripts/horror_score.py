"""Reusable horror score toolkit (original synthesis, seeded, no samples).

Built after the user noticed (2026-11-10) that Episodes 1-5 had no audible eerie music:
their scores were mostly sub-bass drones (31-55 Hz) and very quiet pads, which phone
speakers cannot reproduce. Everything here is voiced in the band a phone actually plays
(about 110 Hz - 5 kHz) and is meant to be clearly present, not just "below the voice".

Elements
  drone_mid      a beating drone at A2/E3 with upper harmonics (audible on phones)
  strings        a bowed string ensemble: detuned saws with vibrato, optional tremolo
  music_box      an inharmonic music box with wow and per-note detune (the creepy theme)
  reverse_swell  a reversed, reverberated chord that sucks into a hit
  stinger        a dissonant hit: brass-like cluster, noise burst, low thump, metal screech
  heartbeat      lub-dub pairs with harmonics, at a tempo that can rise
  riser          a rising glissando cluster with a noise sweep (tension into a scare)
  metal_bow      bowed metal: inharmonic partials with slow beating, 1-4 kHz
  presence       measures the music against the voice in the phone band

All functions return mono or stereo numpy arrays at the caller's sample rate.
"""
import numpy as np

THEME_A_MINOR = [440.0, 523.25, 493.88, 311.13, 329.63, 0, 440.0, 415.30]  # A C B D# E . A G#: a tritone and a raised seventh


def _filt(x, sr, lo=None, hi=None, slope=1.0):
    x = np.asarray(x, np.float64)
    if x.ndim == 2:
        return np.stack([_filt(x[:, c], sr, lo, hi, slope) for c in range(x.shape[1])], 1)
    f = np.fft.rfftfreq(len(x), 1 / sr)
    X = np.fft.rfft(x)
    g = np.ones_like(f)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** (4 * slope))
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (4 * slope))
    return np.fft.irfft(X * g, len(x))


def _verb(x, sr, seconds, wet, seed, bright=5000):
    r = np.random.default_rng(seed)
    n = int(seconds * sr)
    t = np.arange(n) / sr
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)], 1) * np.exp(-6.9 * t / seconds)[:, None]
    ir = _filt(ir, sr, hi=bright)
    ir /= np.sqrt((ir ** 2).sum() / 2)
    x = np.stack([x, x], 1) if x.ndim == 1 else x
    m = 1 << int(np.ceil(np.log2(len(x) + n)))
    out = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], m) * np.fft.rfft(ir[:, c], m), m)[: len(x)] for c in range(2)], 1)
    return x * (1 - wet) + out * wet


def drone_mid(T, qf, level_env, root=110.0):
    """A2 + E3 with a slow beat, plus the 2nd-4th harmonics, so it survives on a phone."""
    f1, f2 = qf(root), qf(root * 1.4983)
    beat = qf(root + 0.35)
    x = np.sin(2 * np.pi * f1 * T) + 0.8 * np.sin(2 * np.pi * beat * T) + 0.6 * np.sin(2 * np.pi * f2 * T)
    x += 0.35 * np.sin(2 * np.pi * qf(root * 2) * T) + 0.25 * np.sin(2 * np.pi * qf(root * 3.01) * T) + 0.12 * np.sin(2 * np.pi * qf(root * 4) * T)
    return x * level_env * 0.05


def strings(T, qf, freqs, level_env, tremolo=None, sr=48000, seed=0):
    """Detuned saw ensemble (3 voices per note) with 5.5 Hz vibrato, low-passed like a section.
    tremolo: optional envelope 0..1 for a 12 Hz bowed tremolo (tension)."""
    r = np.random.default_rng(seed)
    out = np.zeros_like(T)
    for f in freqs:
        for d in (-0.006, 0.0, 0.0065):
            ph = r.random() * 6
            vib = 1 + 0.004 * np.sin(2 * np.pi * qf(5.5 + r.random() * 0.6) * T + ph)
            inst = 2 * np.pi * qf(f * (1 + d)) * np.cumsum(vib) / sr
            out += sum(np.sin(inst * k + ph) / k for k in range(1, 9))
    out = _filt(out, sr, lo=150, hi=3200)
    if tremolo is not None:
        out *= 1 - tremolo * (0.5 + 0.5 * np.sin(2 * np.pi * qf(12.0) * T)) * 0.85
    return out * level_env * (0.012 / max(1, len(freqs)) ** 0.5)


def music_box(sr, notes, rate, detune=1.0, wobble=0.004, seed=0, dur=2.6):
    """The creepy theme on an inharmonic music box; returns (signal, length_s)."""
    r = np.random.default_rng(seed)
    total = rate * len(notes) + dur
    out = np.zeros(int(total * sr))
    tt = np.arange(int(dur * sr)) / sr
    for i, f in enumerate(notes):
        if not f:
            continue
        f = f * detune * (1 + (r.random() - 0.5) * wobble * 2)
        wow = 1 + 0.003 * np.sin(2 * np.pi * 0.7 * tt + i)
        y = (np.sin(2 * np.pi * f * tt * wow) + 0.5 * np.sin(2 * np.pi * f * 2.76 * tt) + 0.25 * np.sin(2 * np.pi * f * 5.4 * tt) + 0.1 * np.sin(2 * np.pi * f * 8.93 * tt)) * np.exp(-tt / 0.6)
        a = int(i * rate * sr)
        out[a:a + len(y)] += y[: len(out) - a]
    return _verb(_filt(out, sr, lo=250, hi=6000), sr, 2.6, 0.55, seed + 3) * 0.12


def reverse_swell(sr, freqs, dur=1.6, seed=0):
    """A reversed reverberated chord: it swells and stops dead (place it to END on the hit)."""
    tt = np.arange(int(dur * sr)) / sr
    x = sum(np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2 * tt) for f in freqs) * np.exp(-tt / 0.25)
    x = np.concatenate([x, np.zeros(int(1.5 * sr))])
    w = _verb(_filt(x, sr, lo=200, hi=5000), sr, dur, 0.9, seed)[: len(tt)]
    w = w[::-1]
    return w / (np.abs(w).max() + 1e-9) * 0.35


def stinger(sr, seed=0, size=1.0):
    """A dissonant scare hit: cluster, noise burst, low thump, a bent metal screech."""
    r = np.random.default_rng(seed)
    n = int(2.4 * sr)
    tt = np.arange(n) / sr
    cl = sum(sum(np.sin(2 * np.pi * f * k * tt * (1 + (r.random() - 0.5) * 0.004)) / k for k in range(1, 7)) for f in (233.08, 246.94, 349.23, 369.99))
    cl = _filt(cl, sr, lo=180, hi=4000) * np.exp(-tt / 0.9) * 0.08
    burst = _filt(r.standard_normal(n), sr, lo=400, hi=8000) * np.exp(-tt / 0.08) * 0.45
    thump = (np.sin(2 * np.pi * 70 * tt) + 0.6 * np.sin(2 * np.pi * 140 * tt)) * np.exp(-tt / 0.18) * 0.5
    bend = np.sin(2 * np.pi * np.cumsum(2600 - 900 * tt / 2.4 + 60 * np.sin(2 * np.pi * 7 * tt)) / sr) * np.exp(-tt / 0.6) * 0.05
    x = (cl + burst + thump + bend) * size
    return _verb(x, sr, 1.8, 0.35, seed + 1)


def heartbeat(sr, start, end, bpm0, bpm1, gain=1.0, seed=0):
    """Lub-dub pairs from start to end with the tempo moving from bpm0 to bpm1; returns (signal, offset_s)."""
    r = np.random.default_rng(seed)
    out = np.zeros(int((end - start + 1) * sr))
    t = 0.0
    while start + t < end:
        bpm = bpm0 + (bpm1 - bpm0) * t / max(1e-6, end - start)
        for dt, a in ((0.0, 1.0), (0.16, 0.65)):
            n = int(0.18 * sr)
            tt = np.arange(n) / sr
            f = 58 + r.random() * 4
            y = (np.sin(2 * np.pi * f * tt) + 0.7 * np.sin(2 * np.pi * f * 2 * tt) + 0.35 * np.sin(2 * np.pi * f * 3 * tt)) * np.exp(-tt / 0.05) * a
            i = int((t + dt) * sr)
            out[i:i + n] += y[: len(out) - i]
        t += 60.0 / bpm
    return _filt(out, sr, hi=900) * 0.4 * gain


def riser(sr, dur, f0=180.0, f1=900.0, seed=0):
    """A rising glissando cluster with a noise sweep, ending loud; place it to END on the scare."""
    r = np.random.default_rng(seed)
    n = int(dur * sr)
    tt = np.arange(n) / sr
    k = (tt / dur) ** 2
    out = np.zeros(n)
    for ratio in (1.0, 1.059, 1.414, 1.5):
        f = f0 * ratio * (f1 / f0) ** k
        out += np.sin(2 * np.pi * np.cumsum(f) / sr)
    noise = _filt(r.standard_normal(n), sr, lo=500, hi=7000) * 0.4
    return (_filt(out, sr, lo=150, hi=5000) * 0.07 + noise * 0.05) * k ** 1.5


def metal_bow(sr, dur, f0=1180.0, seed=0):
    """Bowed metal: a few inharmonic partials beating slowly, swelling in and out."""
    r = np.random.default_rng(seed)
    n = int(dur * sr)
    tt = np.arange(n) / sr
    x = np.zeros(n)
    for ratio in (1.0, 1.37, 2.13, 2.97):
        f = f0 * ratio * (1 + (r.random() - 0.5) * 0.01)
        x += np.sin(2 * np.pi * f * tt + r.random() * 6) * (0.6 + 0.4 * np.sin(2 * np.pi * (0.3 + r.random()) * tt))
    env = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return _filt(x, sr, lo=600, hi=6000) * env * 0.012


def presence(voice, music, lines, sr):
    """Music against voice in the phone band (200 Hz - 4 kHz).
    Returns speech-window and gap-window figures in dB (music minus mean speech voice)."""
    v = _filt(voice.mean(1) if voice.ndim == 2 else voice, sr, lo=200, hi=4000)
    m = _filt(music.mean(1) if music.ndim == 2 else music, sr, lo=200, hi=4000)
    rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
    speech = np.zeros(len(v), bool)
    for l in lines:
        speech[int(l['start'] * sr):int(l['end'] * sr)] = True
    vref = rms(v[speech])
    return {
        'phone_band': '200-4000 Hz',
        'music_minus_voice_during_speech_db': round(float(rms(m[speech]) - vref), 1),
        'music_minus_voice_in_gaps_db': round(float(rms(m[~speech]) - vref), 1),
        'music_share_of_gaps_seconds': round(float((~speech).sum() / sr), 1),
    }
