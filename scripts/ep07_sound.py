"""Episode 7 "This Is the Voice of Vrillon" sound, to the horror standard (Episode 6).

- Narrator: the ElevenLabs true-case take (scripts/ep07_voice.py), close, with a dark room.
- The intruding voice: one quoted line (MBROLA us2) heard through a 1970s TV speaker:
  band-limited, driven, a slow warble and a 50 Hz mains buzz under it. Under the
  narration of the "six minutes" an unintelligible, reversed smear of it keeps going,
  low, so the message is felt, not heard. No real broadcast audio is used.
- The TV: a muffled newsreader murmur (espeak-ng en-gb-x-rp reading generic words, low-passed
  so it is not intelligible) that dissolves into a low buzzing hum; the hum holds until
  the sound snaps back; the TV clicks and whines when it switches itself on at the end.
- Score (scripts/horror_score.py): mid-band drone, tremolo string clusters, a detuned
  music-box theme (clean over the town, detuned at the window, slow and flat in the empty
  room), reversed swells and stingers in silence (after the quoted line, at the snap-back,
  at the empty room), a heartbeat, a riser into the snap-back, bowed metal.
- Foley: room tone and the gas fire, the mantel clock ticking, wind and cable groans at
  the mast, the transmitter hut's hum and fluorescent buzz, the TV switching on.
Ducks 7 dB under speech; presence is measured in the phone band; -14 LUFS with an
encoded-AAC peak check; stems as FLAC.  Run: python3 scripts/ep07_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep07-vrillon-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep07-vrillon-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(7007)
L = {l['id']: l for l in TL['lines']}

# key times: must match K in src/horror/ep07/Episode07.tsx
HUM = L['l04']['start']
INTRUDE = L['v01']['start']
POV, BACK, EMPTY = 27.6, 43.4, 51.6
APOLOGY = L['l10']['start']
TV_ON = 57.75
LOOP_ON = DUR - 1.6
WINDOW, MASTS, HUT = 36.6, L['l08']['start'], 42.3
STINGERS = [POV, BACK, EMPTY]


def qf(f):
    """Whole number of cycles over the episode: continuous tones meet themselves at the loop."""
    return round(f * DUR) / DUR


def db(x):
    return 10 ** (x / 20)


def st(x):
    return np.stack([x, x], 1) if x.ndim == 1 else x


filt = hs._filt


def verb(x, seconds, wet, seed, bright=6000):
    return hs._verb(x, SR, seconds, wet, seed, bright)


def place(bus, clip, at, gain=0.0):
    i = int(at * SR)
    if i >= len(bus) or i + len(clip) <= 0:
        return
    clip = st(clip)
    if i < 0:
        clip, i = clip[-i:], 0
    n = min(len(clip), len(bus) - i)
    bus[i:i + n] += clip[:n] * db(gain)


def env(points):
    xs, ys = zip(*points)
    return np.interp(T, xs, ys)


def load(path, ch=1):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f64le', '-ac', str(ch), '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float64).copy()
    return x.reshape(-1, 2) if ch == 2 else x


USED = {}


def lib(name):
    path = next(LIB.rglob(f'*_{name}_v1.flac'))
    USED[name] = {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    return load(path, 2)


def write(path, x):
    x = np.clip(st(x), -1, 1)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())


def fade(x, a=0.01, b=0.01):
    e = np.ones(len(x))
    ia, ib = int(a * SR), int(b * SR)
    if ia:
        e[:ia] = np.linspace(0, 1, ia)
    if ib:
        e[-ib:] = np.linspace(1, 0, ib)
    return x * e if x.ndim == 1 else x * e[:, None]


def tv_speaker(x, drive=2.0):
    """A small 1970s TV speaker: band-limited, a little driven, a boxy little room."""
    x = filt(x, SR, lo=280, hi=3600, slope=1.5)
    x = np.tanh(x * drive / (np.abs(x).max() + 1e-9)) * np.abs(x).max()
    return verb(x, 0.4, 0.12, seed=71, bright=3000)


OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v /= np.abs(v).max() + 1e-9
    if l['kind'] == 'vrillon':
        # the intruder through the TV: warble, ring of the mains, band-limited and driven
        tt = np.arange(len(v)) / SR
        v = v * (0.85 + 0.15 * np.sin(2 * np.pi * 5.0 * tt))
        v = v + 0.25 * v * np.sin(2 * np.pi * 50 * tt)
        d = int(0.011 * SR)
        v = v + 0.5 * np.concatenate([np.zeros(d), v[:-d]])
        v = tv_speaker(v, 2.6)
        place(voice, v, l['start'], gain=-1.0)
    else:
        v = filt(v, SR, lo=70)
        v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)  # equal loudness, whispers included
        v = np.tanh(v * 1.4) / 1.4
        v = verb(v, 1.4, 0.10, seed=10, bright=3500)
        place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ the television
tvb = np.zeros((N, 2))
news_txt = ('Good evening. Here is the news. Talks continued today in the capital, where ministers met for a second day. '
            'In the north, the weather turned colder, with snow on higher ground. Prices in the shops rose again this month, '
            'and the government said it would publish new figures next week. Now the rest of the news.')
mw = OUT / 'tv-murmur.wav'
subprocess.run(['espeak-ng', '-v', 'en-gb-x-rp', '-s', '160', '-p', '38', '-w', str(mw), news_txt], check=True, capture_output=True)
murmur = load(mw)
mw.unlink()
murmur = filt(murmur / (np.abs(murmur).max() + 1e-9), SR, lo=300, hi=1100, slope=1.5)  # through a wall of tweed: not intelligible
murmur = np.tile(murmur, int(np.ceil(DUR / (len(murmur) / SR))) + 1)[:N]
news_on = env([(0, 1), (HUM, 1), (HUM + 1.6, 0), (BACK - 0.01, 0), (BACK, 1), (APOLOGY, 1), (APOLOGY + 0.3, 0), (TV_ON + 0.3, 0), (TV_ON + 0.5, 1), (DUR, 1)])
tvb += st(tv_speaker(murmur, 1.4) [:, 0] * 0.08 * news_on)
# the hum: mains buzz with odd harmonics, swelling up out of the news and holding until the snap-back
hum_e = env([(0, 0), (HUM, 0), (HUM + 1.8, 1), (INTRUDE, 1), (BACK - 0.02, 1), (BACK, 0), (DUR, 0)])
buzz = sum(np.sin(2 * np.pi * qf(50 * k) * T) / k ** 0.7 for k in (1, 3, 5, 7, 9, 11)) + filt(rng.standard_normal(N), SR, lo=300, hi=2500) * 0.25
tvb += st(filt(buzz, SR, lo=90, hi=3000) * 0.035 * hum_e)
# under the six minutes: the voice goes on, reversed and smeared, too low to make out
vr = load(OUT / 'voice' / 'v01.wav')
smear = verb(filt(vr[::-1], SR, lo=300, hi=2400), 1.2, 0.6, seed=73)[:, 0]
for k, t0 in enumerate([L['v01']['end'] + 1.6, L['v01']['end'] + 1.6 + len(smear) / SR * 0.92]):
    place(tvb, tv_speaker(smear, 2.0) * 0.12, t0)
tvb[int(BACK * SR):int((APOLOGY + 0.5) * SR)] *= 0  # nothing of it after the snap-back
place(tvb, tv_speaker(murmur[:int((BACK + 0.0 - BACK + APOLOGY - BACK) * SR)], 1.4) * 0.08, BACK)
# the apology card: a quiet tone, as the station holds the card
place(tvb, fade(np.sin(2 * np.pi * 1000 * np.arange(int(2.5 * SR)) / SR) * 0.012, 0.05, 0.3), APOLOGY + 0.4)
# off at the empty room: nothing. On at the end: click, a rising whine, static that resolves into the news
place(tvb, lib('steel_latch'), TV_ON - 0.05, -8)
tt = np.arange(int((DUR - TV_ON) * SR)) / SR
whine = np.sin(2 * np.pi * np.cumsum(2400 + 1800 * np.minimum(1, tt / 0.6)) / SR) * np.minimum(1, tt / 0.3) * 0.012
place(tvb, whine, TV_ON)
place(tvb, filt(rng.standard_normal(int(0.5 * SR)), SR, lo=500, hi=6000) * np.linspace(0.08, 0, int(0.5 * SR)), TV_ON + 0.05)
write(OUT / 'stem-tv.wav', tvb)

# ------------------------------------------------------------------ score
mus = np.zeros((N, 2))
drone_e = env([(0, 0.7), (HUM, 0.8), (INTRUDE, 1.1), (POV, 1.3), (BACK - 0.02, 1.0), (BACK, 0.2), (BACK + 1.6, 0.6), (EMPTY, 0.9), (LOOP_ON, 0.7), (DUR, 0.7)])
mus += st(hs.drone_mid(T, qf, drone_e) * 1.6)
str_e = env([(0, 0.5), (5.0, 0.7), (HUM, 0.8), (INTRUDE, 1.0), (POV - 0.02, 1.2), (POV + 0.1, 1.5), (35.0, 1.0), (BACK - 0.02, 1.3), (BACK, 0.0), (BACK + 2.0, 0.0), (APOLOGY, 0.5), (EMPTY, 1.3), (LOOP_ON, 0.5), (DUR, 0.5)])
trem = env([(0, 0.25), (HUM, 0.3), (INTRUDE, 1.0), (BACK, 1.0), (BACK + 0.1, 0.2), (EMPTY, 0.8), (LOOP_ON, 0.25), (DUR, 0.25)])
mus += st(hs.strings(T, qf, [220.0, 233.08, 329.63], str_e, trem, SR, seed=11) * 2.2)
mus += st(hs.strings(T, qf, [349.23, 466.16], env([(0, 0), (POV - 0.02, 0), (POV + 0.1, 1.2), (36.0, 0.4), (BACK, 0), (EMPTY, 0), (EMPTY + 0.1, 1.0), (55.0, 0), (DUR, 0)]), None, SR, seed=12))
# the theme: clean over the town, detuned at the window, slow and flat in the empty room
for t0, rate, det, g in [(5.6, 0.42, 1.0, -3.5), (WINDOW + 0.1, 0.5, 0.985, -3.0), (EMPTY + 1.2, 0.66, 0.971, -2.0)]:
    place(mus, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0)), t0, g + 4)
for hit, freqs, d in [(POV, [220, 311.13, 466.16], 1.2), (BACK, [233.08, 329.63, 493.88], 0.85), (EMPTY, [220, 311.13, 415.3], 0.8)]:
    place(mus, hs.reverse_swell(SR, freqs, d, seed=int(hit)), hit - d)
place(mus, hs.stinger(SR, seed=21, size=1.2), POV)
place(mus, hs.stinger(SR, seed=22, size=1.0), BACK)
place(mus, hs.stinger(SR, seed=23, size=0.8), EMPTY)
place(mus, hs.heartbeat(SR, 18.4, POV - 0.1, 64, 96, gain=0.9, seed=24), 18.4)
place(mus, hs.heartbeat(SR, 30.5, BACK - 0.1, 70, 112, gain=1.0, seed=25), 30.5)
place(mus, hs.riser(SR, 2.4, seed=26), BACK - 2.4)
place(mus, st(hs.metal_bow(SR, 5.0, 1180, seed=27)), 21.5)
place(mus, st(hs.metal_bow(SR, 4.5, 1460, seed=28)), EMPTY + 0.6)
# dead air after the snap-back: the music drops out, only the news murmur returns
mus *= env([(0, 1), (BACK + 0.35, 1), (BACK + 0.6, 0.12), (BACK + 2.2, 0.12), (BACK + 3.4, 1), (DUR, 1)])[:, None]
mus *= (1 - speech * (1 - db(-7)))[:, None] * db(-3.0)
write(OUT / 'stem-score.wav', mus)
PRESENCE = hs.presence(voice, mus, TL['lines'], SR)

# ------------------------------------------------------------------ places and foley
amb = np.zeros((N, 2))
shots = [(0, 'room'), (L['l02']['start'] - 0.7, 'dusk'), (L['l03']['start'] - 0.5, 'room'), (MASTS, 'dusk'), (HUT, 'hut'), (BACK, 'room'), (EMPTY, 'empty'), (LOOP_ON, 'room')]
def zone(name):
    pts = []
    for i, (t0, m) in enumerate(shots):
        t1 = shots[i + 1][0] if i + 1 < len(shots) else DUR
        v = 1.0 if m == name else 0.0
        pts += [(t0, v), (t1 - 0.01, v)]
    return env(pts)
room, dusk, hut, empty = zone('room'), zone('dusk'), zone('hut'), zone('empty')
# room tone with the gas fire's hiss
amb += st(filt(rng.standard_normal(N), SR, lo=1500, hi=6000) * 0.004 * room)
amb += st(filt(rng.standard_normal(N), SR, lo=80, hi=400) * 0.008 * (room + empty))
# outside: wind, gusting
gust = 0.6 + 0.4 * np.sin(2 * np.pi * qf(0.17) * T)
amb += np.stack([filt(rng.standard_normal(N), SR, lo=200, hi=2200), filt(rng.standard_normal(N), SR, lo=200, hi=2200)], 1) * (0.03 * gust * dusk)[:, None]
# the hut: transformer hum and the fluorescent tube
amb += st((np.sin(2 * np.pi * qf(100) * T) * 0.5 + np.sin(2 * np.pi * qf(200) * T) * 0.3 + filt(rng.standard_normal(N), SR, lo=3000, hi=7000) * 0.4) * 0.02 * hut)
write(OUT / 'stem-ambience.wav', amb)

fx = np.zeros((N, 2))
def tick(gain=1.0):
    n = int(0.04 * SR)
    tt = np.arange(n) / SR
    return verb(np.sin(2 * np.pi * 3100 * tt) * np.exp(-tt * 180) * 0.05 * gain + filt(rng.standard_normal(n), SR, lo=2000, hi=8000) * np.exp(-tt * 300) * 0.04 * gain, 0.3, 0.2, seed=81)
for s in range(int(DUR)):
    m = room[min(N - 1, int(s * SR))] + empty[min(N - 1, int(s * SR))]
    if m > 0.5:
        loud = 1.6 if (C0 := 13.2) <= s < 15.3 or 49.6 <= s < 51.6 else 1.0
        place(fx, tick(loud), s + 0.02, -4)
# a tea cup set down as the family settles
place(fx, verb(np.sin(2 * np.pi * 2350 * np.arange(int(0.3 * SR)) / SR) * np.exp(-np.arange(int(0.3 * SR)) / SR * 25) * 0.03, 0.5, 0.2, seed=82), 11.4)
# mast: the cable groan; hut: a relay clicks
place(fx, lib('cable_tension'), MASTS + 0.3, -10)
place(fx, lib('steel_latch'), HUT + 0.4, -12)
# the stingers' weight
for k in STINGERS:
    place(fx, lib('low_cinematic_hit'), k, -6)
place(fx, lib('restrained_boom'), POV, -8)
place(fx, lib('heartbeat_breath'), POV + 0.6, -10)
place(fx, lib('radio_noise_bed')[: int(3.0 * SR)] * np.linspace(0, 1, int(3.0 * SR))[:, None] ** 2, HUM - 1.0, -16)
write(OUT / 'stem-foley-fx.wav', fx)

# ------------------------------------------------------------------ every line at least 4.5 dB over everything else (lift at most 8 dB)
LIFTS = {}
for lid, l in L.items():
    a, b = int(l['start'] * SR), int((l['end'] + 0.12) * SR)
    rest = (tvb + amb + mus + fx)[a:b].mean(1)
    m = 20 * np.log10(np.sqrt(np.mean(voice[a:b].mean(1) ** 2)) + 1e-12) - 20 * np.log10(np.sqrt(np.mean(rest ** 2)) + 1e-12)
    LIFTS[lid] = round(float(min(8.0, max(0.0, 4.6 - m))), 1)
    voice[a:b] *= db(LIFTS[lid])
write(OUT / 'stem-voice.wav', voice)
PRESENCE = hs.presence(voice, mus, TL['lines'], SR)

# ------------------------------------------------------------------ mix (no fade at the end: it loops)
mix = voice + tvb + amb + mus + fx


def lufs(x):
    write(OUT / 'probe.wav', x)
    out = subprocess.run(['ffmpeg', '-i', str(OUT / 'probe.wav'), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    (OUT / 'probe.wav').unlink()
    return float([l for l in out.splitlines() if l.strip().startswith('I:')][-1].split()[1])


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


def encode_peak(x):
    write(OUT / 'mix.wav', x)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(OUT / 'mix.wav'), '-c:a', 'aac', '-b:a', '192k', str(OUT / 'mix.m4a')], check=True)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(OUT / 'mix.m4a'), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return 20 * np.log10(np.abs(np.frombuffer(raw, np.float32)).max())


# loudness to -14 LUFS under a soft limiter; if the decoded AAC overshoots -1 dBFS, lower
# the limiter ceiling (not the loudness) and try again
base = mix / np.abs(mix).max()
ceil_db = -1.2
for _ in range(6):
    ceil = db(ceil_db)
    g = 1.0
    for _ in range(5):
        g *= db(-14.0 - lufs(np.tanh(base * g / ceil) * ceil))
    out_mix = np.tanh(base * g / ceil) * ceil
    encoded_peak = encode_peak(out_mix)
    if encoded_peak <= -1.0:
        break
    ceil_db -= (encoded_peak + 1.0) + 0.3
mix = out_mix
final_lufs = lufs(mix)
(OUT / 'mix.wav').unlink()

others = tvb + amb + mus + fx
band = lambda x: filt(x.mean(1), SR, lo=200, hi=4000)
margins = []
for lid, l in L.items():
    a, b = int(l['start'] * SR), int(l['end'] * SR)
    margins.append({'id': lid, 'voice_minus_all_db': round(float(rms_db(voice[a:b].mean(1)) - rms_db(others[a:b].mean(1))), 1),
                    'phone_band_voice_minus_all_db': round(float(rms_db(band(voice[a:b])) - rms_db(band(others[a:b]))), 1),
                    'voice_minus_score_db': round(float(rms_db(voice[a:b].mean(1)) - rms_db(mus[a:b].mean(1))), 1)})
clash = [h for h in STINGERS for l in L.values() if l['start'] - 0.05 <= h <= l['end'] + 0.1]
head = rms_db(mix[:SR // 4].mean(1))
tail = rms_db(mix[-SR // 4:].mean(1))
for stem in OUT.glob('stem-*.wav'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(stem), '-c:a', 'flac', str(stem.with_suffix('.flac'))], check=True)
    stem.unlink()
take = ROOT / 'public/assets/audio/eleven-takes/ep07-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep07TheVoiceOfVrillon',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator', 'credits': 971,
                       'prompt': 'docs/production/ep07-vrillon/prompt.json'},
    'intruder_line': 'espeak-ng + MBROLA us2 (the ElevenLabs fiction-voice generation failed with the account free-tier warning); TV-speaker chain with warble, 50 Hz ring and a short slap',
    'tv': 'muffled newsreader murmur (espeak-ng en-gb-x-rp reading generic invented words, low-passed under 1.1 kHz, not intelligible); mains hum 50 Hz with odd harmonics; a reversed smear of the intruder line under the six minutes; apology-card tone; switch-on click, whine and static',
    'original_synthesis': [
        'score (scripts/horror_score.py): A2/E3 mid-band drone; tremolo string clusters (A3-Bb3-E4, +F4/Bb4 on the scares); music-box theme (A C B D# E . A G#) clean, detuned, slow and flat; reversed swells into the three stingers; heartbeat 64-96 and 70-112 bpm; a riser into the snap-back; bowed metal',
        'foley: room tone and gas-fire hiss, the mantel clock ticking (louder on the clock inserts), a tea cup, wind at the mast, hut transformer hum and tube buzz',
        'silence: after the snap-back the music drops to -18 dB for about 2 s and only the news murmur returns',
        'loop: drone, strings, mains hum and wind snapped to whole cycles; the news murmur plays at both ends',
    ],
    'real_broadcast_audio_used': False,
    'library_cues': USED,
    'stingers': STINGERS, 'stingers_inside_speech': clash,
    'loudness_target_lufs': -14.0,
    'measured_integrated_lufs': final_lufs,
    'encoded_sample_peak_dbfs': round(float(encoded_peak), 2),
    'loop_seam_rms_dbfs': {'first_quarter_second': round(float(head), 1), 'last_quarter_second': round(float(tail), 1)},
    'limiter': f'tanh soft limiter, ceiling {ceil_db:.2f} dBFS (lowered until the decoded AAC peaks at or below -1 dBFS)',
    'line_lifts_db': LIFTS,
    'voice_margins_db': margins,
    'music_presence': PRESENCE,
    'listening_pass': 'not performed (no audio audition in this runtime)',
}, indent=2, ensure_ascii=False) + '\n')
print('ok', DUR, 'LUFS', final_lufs, 'encoded peak', round(float(encoded_peak), 2), 'presence', PRESENCE['music_minus_voice_during_speech_db'], PRESENCE['music_minus_voice_in_gaps_db'], 'seam', round(head, 1), round(tail, 1), 'clash', clash)
for m in margins:
    print(m)
