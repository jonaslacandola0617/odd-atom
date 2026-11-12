"""Episode 21 "Watch the Chair" sound (Season 3: the Enfield poltergeist, London, 1977).

Season 3 rule: each episode has its own sound language. This one is DIEGETIC ONLY: no score at all.
Everything you hear could be on the tape of a camera left running in a back bedroom at night:
- the room tone, the mains hum, the tape hiss and the recorder's motor; a wall clock ticking;
- the children breathing under the blankets (the far bed holds its breath during the rasp);
- a dog far off, a car passing (its headlights sweep the ceiling);
- knocks inside the wall; later, knocks that answer (one; then two);
- a floorboard on the landing as a shadow crosses the light;
- four tape dropouts: a burst of noise, and UNDER it a chair leg scraping on lino (the only moments
  the chair moves);
- a low, rasping old man's voice from the far bed, too low to make out (synthesized from a pulse
  train and formant filters: no real recording, no words);
- then silence: the room tone, the hum and the clock stop for 3.4 s;
- the landing bulb fizzes out and back; a chair creaks under someone's weight; a final dropout.
The narrator (Jack, ElevenLabs) is close and dry over it. Presence is measured with the whole
non-voice bed in place of a score. -14 LUFS with an encoded-AAC peak check; stems as FLAC.
Run: python3 scripts/ep21_sound.py
"""
import hashlib, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/ep21-chair-v1'
LIB = ROOT / 'public/assets/audio/library/curio-bureau/curio_sfx_v1'
TL = json.loads((ROOT / 'src/data/ep21-chair-v1-timeline.json').read_text())
SR = 48000
DUR = TL['duration_seconds']
N = int(round(DUR * SR))
T = np.arange(N) / SR
rng = np.random.default_rng(21021)
L = {l['id']: l for l in TL['lines']}



def plus(*xs):
    n = max(len(x) for x in xs)
    return sum(np.pad(x, (0, n - len(x))) for x in xs)


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



# key times: must match K in src/horror/ep21/Episode21.tsx
DROP = 5 / 30
CAR = L['l01']['end'] + 0.3
KNOCKS = [L['l03']['end'] + d for d in (0.5, 0.9, 1.3)]
ANSWER = [L['l05']['end'] + d for d in (0.45, 1.2, 1.42)]
SHADOW = L['l05']['end'] + 1.55
RASP = (L['l06']['end'] + 0.35, L['l06']['end'] + 1.95)
SILENCE = (L['l07']['end'] + 0.3, L['l08']['start'] - 0.1)
BULB = L['l08']['end'] + 0.35
DROPS = [L['l04']['start'] - 0.65, L['l06']['start'] - 0.45, L['l07']['start'] - 0.55, DUR - 0.2]
STINGERS = [BULB + 0.3]  # the weight in the chair (no music: a creak and a settle)


def span(a, b, ramp=0.03):
    return env([(0, 0), (max(0, a - ramp), 0), (a, 1), (b, 1), (b + ramp, 0), (DUR, 0)])


def pan(x, p):
    """p -1 (left) .. 1 (right), equal power"""
    x = x if x.ndim == 1 else x.mean(1)
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1)


dropping = np.zeros(N)
for d in DROPS:
    dropping = np.maximum(dropping, span(d, d + DROP, 0.004))
quiet = span(*SILENCE, 0.05)
live = (1 - quiet) * (1 - dropping)
landing = 1 - span(BULB, BULB + 0.3, 0.004)

OUT.mkdir(parents=True, exist_ok=True)

def compress(x, thresh_db=-24.0, ratio=3.0, att=0.005, rel=0.15):
    """A gentle feed-forward compressor, so the narration carries the loudness without the limiter
    having to squash it (there is no score to carry it in this episode)."""
    e = np.abs(x)
    a, r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    env_ = np.zeros_like(e)
    lvl = 0.0
    for i in range(0, len(e), 48):  # 1 ms blocks
        m = e[i:i + 48].max()
        lvl = a ** 48 * lvl + (1 - a ** 48) * m if m > lvl else r ** 48 * lvl + (1 - r ** 48) * m
        env_[i:i + 48] = lvl
    over = np.maximum(0, 20 * np.log10(env_ + 1e-9) - thresh_db)
    y = x * 10 ** (-over * (1 - 1 / ratio) / 20)
    y = y * 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-12)) / 20)
    c = 10 ** ((-21.0 + 12.0) / 20)  # soft-clip what remains above 12 dB over the line's RMS (plosives)
    return np.tanh(y / c) * c


# ------------------------------------------------------------------ voice (dry, close)
voice = np.zeros((N, 2))
for lid, l in L.items():
    v = load(OUT / 'voice' / f'{lid}.wav')
    v = filt(v, SR, lo=80, hi=11000)
    v *= 10 ** ((-21.0 - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) / 20)
    v = compress(v)
    v = verb(v, 0.5, 0.04, seed=21, bright=3000)
    place(voice, v, l['start'], gain=-1.0)
speech = np.zeros(N)
for l in L.values():
    speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (DUR, 0)]))

# ------------------------------------------------------------------ the room (no score)
amb = np.zeros((N, 2))
room = np.stack([filt(rng.standard_normal(N), SR, lo=40, hi=380), filt(rng.standard_normal(N), SR, lo=40, hi=380)], 1)
amb += room * (0.032 * live)[:, None]
hum = sum(np.sin(2 * np.pi * qf(50 * k) * T) / k for k in (1, 2, 3, 5)) * 0.004
amb += st(hum * live)
hiss = np.stack([filt(rng.standard_normal(N), SR, lo=2500, hi=11000), filt(rng.standard_normal(N), SR, lo=2500, hi=11000)], 1)
amb += hiss * (0.009 * (1 - dropping) * (1 - 0.6 * quiet))[:, None]
motor = filt(np.sin(2 * np.pi * qf(1380) * T + 0.8 * np.sin(2 * np.pi * qf(0.7) * T)), SR, lo=800, hi=3000) * 0.0025
amb += pan(motor * live, 0.4)
bulb_hum = filt(np.sin(2 * np.pi * qf(100) * T) + 0.4 * np.sin(2 * np.pi * qf(200) * T), SR, lo=80, hi=1200) * 0.003
amb += pan(bulb_hum * landing * (1 - dropping), -0.7)
# the wall clock: tick, tock (it stops in the silence and never restarts)
tick_n = int(0.012 * SR)
tt = np.arange(tick_n) / SR
for k, t0 in enumerate(np.arange(0.35, SILENCE[0], 1.0)):
    f = 3200 if k % 2 else 2600
    c = filt(rng.standard_normal(tick_n), SR, lo=f * 0.6, hi=f * 1.4) * np.exp(-tt * 500) * 0.13
    place(amb, pan(verb(c, 0.4, 0.3, seed=2100 + k % 7, bright=6000), -0.25), t0)
# breathing under the blankets: near (right), far (left; held during the rasp)
for period, ph, side, hold in ((4.2, 0.0, 0.55, False), (3.7, 1.3, -0.6, True)):
    ph_t = (2 * np.pi * T / period + ph)
    b = filt(rng.standard_normal(N), SR, lo=300, hi=2200) * (np.maximum(0, np.sin(ph_t)) ** 3) * 0.018
    if hold:
        b *= 1 - span(RASP[0] - 0.2, RASP[1] + 0.3, 0.15)
    amb += pan(b * live, side)
# a dog far off; a car passing (right to left)
for t0 in (L['l02']['start'] + 1.6, L['l02']['start'] + 2.2, L['l04']['end'] + 0.6):
    n = int(0.2 * SR)
    tt = np.arange(n) / SR
    bark = filt(np.sign(np.sin(2 * np.pi * 420 * tt * (1 - 0.3 * tt))) * np.sin(np.pi * tt / 0.2) + 0.5 * rng.standard_normal(n) * np.sin(np.pi * tt / 0.2), SR, lo=300, hi=1400) * 0.016
    place(amb, pan(verb(bark, 2.0, 0.7, seed=2150, bright=1500), 0.6), t0)
n = int(3.6 * SR)
tt = np.arange(n) / SR
car = filt(rng.standard_normal(n), SR, lo=120, hi=900) * np.exp(-((tt - 1.6) / 0.9) ** 2) * 0.07
p_car = np.stack([car * np.cos((0.5 + 0.5 * np.tanh((tt - 1.6) * 2)) * np.pi / 2 + 0 * tt)[::-1] * 0 + car * np.sin((1 - (0.5 + 0.5 * np.tanh((tt - 1.6) * 2))) * np.pi / 2), car * np.cos((1 - (0.5 + 0.5 * np.tanh((tt - 1.6) * 2))) * np.pi / 2)], 1)
place(amb, p_car, CAR - 0.8)
amb *= (1 - quiet)[:, None]
amb += hiss * (0.0035 * quiet)[:, None]  # only the tape's own hiss survives the silence
write(OUT / 'stem-ambience.wav', amb)

# ------------------------------------------------------------------ events
fx = np.zeros((N, 2))


def knock(gain, seed):
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 92 * tt) + 0.6 * np.sin(2 * np.pi * 184 * tt)) * np.exp(-tt * 28) + filt(rng.standard_normal(n), SR, lo=400, hi=1600) * np.exp(-tt * 90) * 0.8
    x = filt(x, SR, hi=1300) * gain
    return pan(verb(x, 0.6, 0.25, seed=seed, bright=1800), -0.55)


for k, t0 in enumerate(KNOCKS):
    place(fx, knock(0.55, 2200 + k), t0)
for k, t0 in enumerate(ANSWER):
    place(fx, knock(0.6, 2210 + k), t0)
# a floorboard on the landing, under the shadow
place(fx, pan(filt(lib('wood_stress'), SR, hi=1500), -0.85), SHADOW + 0.1, -10)
# the rasp from the far bed: a low pulse train through vowel formants, breathy, two phrases, no words
n = int((RASP[1] - RASP[0]) * SR)
tt = np.arange(n) / SR
f0 = 72 * (1 + 0.05 * np.sin(2 * np.pi * 3.1 * tt)) * (1 + 0.02 * rng.standard_normal(n).cumsum() / np.sqrt(np.arange(1, n + 1)))
phase = np.cumsum(f0) / SR
pulse = (np.mod(phase, 1.0) < 0.12).astype(float) + 0.25 * rng.standard_normal(n)
voc = sum(filt(pulse, SR, lo=f * 0.8, hi=f * 1.25) * a for f, a in ((480, 1.0), (980, 0.6), (2400, 0.25)))
e = np.interp(tt, [0, 0.12, 0.6, 0.75, 0.9, 1.05, 1.45, 1.6], [0, 1, 0.8, 0, 0, 0.9, 0.7, 0])
rasp = filt(voc * e, SR, lo=90, hi=3200) * 0.38
place(fx, pan(verb(rasp, 0.5, 0.15, seed=2230, bright=2500), -0.5), RASP[0])
# the dropouts: a burst of tape noise, and under it a chair leg scraping on the lino
for k, d in enumerate(DROPS):
    n = int((DROP + 0.04) * SR)
    tt = np.arange(n) / SR
    burst = filt(rng.standard_normal(n) * (0.75 + 0.25 * np.sin(2 * np.pi * 60 * tt)), SR, lo=300, hi=6000) * np.exp(-tt * 3) * (0.11 if k < 3 else 0.13)
    place(fx, st(fade(burst, 0.008, 0.02)), d)
    if k < 3:
        n2 = int(0.32 * SR)
        t2 = np.arange(n2) / SR
        scrape = filt(rng.standard_normal(n2) * (1 + 0.9 * np.sign(np.sin(2 * np.pi * 24 * t2))), SR, lo=250, hi=2600) * np.sin(np.pi * t2 / 0.32) * 0.11
        place(fx, pan(verb(scrape, 0.7, 0.3, seed=2240 + k, bright=2600), -0.1), d - 0.06)
# the landing bulb fizzes out, and back; a chair creaks under someone's weight; a low settle
for t0 in (BULB, BULB + 0.3):
    n = int(0.09 * SR)
    tt = np.arange(n) / SR
    place(fx, pan(filt(rng.standard_normal(n) * (rng.random(n) < 0.3), SR, lo=1500, hi=8000) * np.exp(-tt * 30) * 0.05, -0.7), t0)
place(fx, pan(lib('wood_stress'), 0.0), STINGERS[0] - 0.02, 1)
n = int(0.4 * SR)
tt = np.arange(n) / SR
place(fx, st(np.sin(2 * np.pi * 58 * tt) * np.exp(-tt * 9) * 0.5), STINGERS[0])
write(OUT / 'stem-foley-fx.wav', fx)
tvb = np.zeros((N, 2))
mus = np.zeros((N, 2))  # no score in this episode
bed = amb + fx
PRESENCE = hs.presence(voice, bed, TL['lines'], SR)

# ------------------------------------------------------------------ every line at least 4.5 dB over everything else (lift at most 8 dB)
LIFTS = {}
for lid, l in L.items():
    a, b = int(l['start'] * SR), int((l['end'] + 0.12) * SR)
    rest = (tvb + amb + mus + fx)[a:b].mean(1)
    m = 20 * np.log10(np.sqrt(np.mean(voice[a:b].mean(1) ** 2)) + 1e-12) - 20 * np.log10(np.sqrt(np.mean(rest ** 2)) + 1e-12)
    LIFTS[lid] = round(float(min(8.0, max(0.0, 4.6 - m))), 1)
    voice[a:b] *= db(LIFTS[lid])
write(OUT / 'stem-voice.wav', voice)
PRESENCE = hs.presence(voice, bed, TL['lines'], SR)

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
                    'voice_minus_bed_db': round(float(rms_db(voice[a:b].mean(1)) - rms_db(bed[a:b].mean(1))), 1)})
clash = [h for h in STINGERS for l in L.values() if l['start'] - 0.05 <= h <= l['end'] + 0.1]
head = rms_db(mix[:SR // 4].mean(1))
tail = rms_db(mix[-SR // 4:].mean(1))
for stem in OUT.glob('stem-*.wav'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(stem), '-c:a', 'flac', str(stem.with_suffix('.flac'))], check=True)
    stem.unlink()
take = ROOT / 'public/assets/audio/eleven-takes/ep21-take1.mp3'
(OUT / 'PROVENANCE.json').write_text(json.dumps({
    'episode': 'Ep21WatchTheChair',
    'duration_seconds': DUR,
    'voice': TL['voice'],
    'narration_take': {'path': str(take.relative_to(ROOT)), 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(), 'provider': 'ElevenLabs connector, eleven_v4',
                       'voice_id': 'BVPhWQykET1TSvfGzrUr', 'voice_name': 'Jack - Deep Dark Horror Narrator (library voice)', 'credits': json.loads((ROOT / 'docs/production/ep21-chair/prompt.json').read_text())['narration'].get('takes'),
                       'prompt': 'docs/production/ep21-chair/prompt.json'},
    'original_synthesis': [
        'NO SCORE: the episode is diegetic only (Season 3 sound language for Episode 21)',
        'the room: room tone, 50 Hz mains hum, tape hiss, the recorder motor, the landing bulb hum, a wall clock (it stops in the silence)',
        'the children breathing under blankets (filtered noise); a far dog; a passing car',
        'knocks inside the wall and knocks that answer (synthesized thumps through a wall filter)',
        'four tape dropouts with a chair leg scraping under each; the bulb fizzing out and back; a low settle',
        'the rasp: a 72 Hz pulse train through vowel formants with breath noise, two phrases, no words; not a recording of the real case',
    ],
    'music_presence_note': 'there is no music; music_presence measures the whole non-voice bed (ambience + foley) against the voice',
    'real_recordings_used': False,
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
