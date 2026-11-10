"""Re-score Episodes 1-5 to the horror standard (audio only; pictures unchanged).

The user noted (2026-11-10) that the earlier episodes had no audible eerie music. This
adds a new score from scripts/horror_score.py on top of each episode's existing stems
(voice, sound, old score), with stingers placed in silent gaps at each episode's scares,
heartbeats, risers, swells and a detuned music-box theme. The new score is calibrated
so that, in the phone band, it sits about 5 dB under the voice in the gaps, then backed
off until every line keeps at least 4 dB over everything else. The new mix is muxed
onto the existing MP4's video stream unchanged (-c:v copy) and delivered as a new
version; the earlier versions stay as they are.

Run: python3 scripts/rescore_horror.py [ep01 ep02 ...]
"""
import hashlib, json, shutil, subprocess, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs

ROOT = Path(__file__).resolve().parents[1]
SR = 48000

# Per-episode cue lists. Stingers sit in silent gaps next to each scare; mutes keep the
# episodes' existing dead-silence holds silent.
EPS = {
    'ep01': dict(src_audio='ep01-moon-v2', tl='ep01-moon-v2', video='assets/videos/ep01-moon-v2/ep01-viral-cut.mp4', poster='assets/videos/ep01-moon-v2/ep01-viral-cut-poster.png',
                 out='ep01-moon-v3', name='ep01-viral-cut-horror-score', loop_tail=0.9,
                 stingers=[(28.62, 1.2), (31.85, 0.7), (39.45, 0.9)], swells=[28.62, 39.45], risers=[(25.6, 28.6)],
                 hearts=[(22.6, 28.5, 70, 112), (35.6, 39.3, 92, 124)], themes=[(17.2, 0.55, 0.985)], mutes=[(46.4, 48.2)],
                 cluster=[220.0, 233.08, 329.63]),
    'ep02': dict(src_audio='ep02-mask-v1', tl='ep02-mask-v1', video='assets/videos/ep02-mask-v1/ep02-the-mask-on-channel-11.mp4', poster='assets/videos/ep02-mask-v1/ep02-the-mask-on-channel-11-poster.png',
                 out='ep02-mask-v2', name='ep02-the-mask-on-channel-11-horror-score', loop_tail=0.6,
                 stingers=[(10.92, 1.2), (30.7, 0.9)], swells=[10.92, 30.7], risers=[(8.4, 10.9)],
                 hearts=[(12.0, 17.8, 72, 92), (34.0, 43.5, 84, 116)], themes=[(22.9, 0.5, 0.985)], mutes=[(10.5, 10.9), (29.1, 29.5)],
                 cluster=[164.81, 174.61, 246.94]),
    'ep03': dict(src_audio='ep03-snow-v1', tl='ep03-snow-v1', video='assets/videos/ep03-snow-v1/ep03-footprints-in-the-snow.mp4', poster='assets/videos/ep03-snow-v1/ep03-footprints-in-the-snow-poster.png',
                 out='ep03-snow-v2', name='ep03-footprints-in-the-snow-horror-score', loop_tail=1.8,
                 stingers=[(23.45, 0.6), (38.58, 1.2), (45.62, 0.9), (52.12, 0.8)], swells=[38.58, 45.62, 52.12], risers=[(42.6, 45.6)],
                 hearts=[(18.4, 23.3, 66, 86), (40.2, 45.5, 72, 104)], themes=[(28.2, 0.55, 0.985)], mutes=[(38.7, 40.0)],
                 cluster=[146.83, 155.56, 220.0]),
    'ep04': dict(src_audio='ep04-night-v1', tl='ep04-night-v1', video='assets/videos/ep04-night-v1/ep04-rules-for-the-night-shift.mp4', poster='assets/videos/ep04-night-v1/ep04-rules-for-the-night-shift-poster.png',
                 out='ep04-night-v2', name='ep04-rules-for-the-night-shift-horror-score', loop_tail=1.45,
                 stingers=[(25.85, 0.8), (45.0, 0.7), (51.0, 1.0)], swells=[25.85, 51.0], risers=[(48.0, 51.0)],
                 hearts=[(26.5, 34.3, 76, 104), (45.4, 50.9, 92, 124)], themes=[(14.5, 0.5, 0.985)], mutes=[],
                 cluster=[246.94, 261.63, 369.99]),
    'ep05': dict(src_audio='ep05-tent-v1', tl='ep05-tent-v1', video='assets/videos/ep05-tent-v1/ep05-nine-hikers-one-cut-tent.mp4', poster='assets/videos/ep05-tent-v1/ep05-nine-hikers-one-cut-tent-poster.png',
                 out='ep05-tent-v2', name='ep05-nine-hikers-one-cut-tent-horror-score', loop_tail=1.6,
                 stingers=[(24.85, 0.6), (33.5, 0.7), (49.3, 0.8)], swells=[33.5, 49.3], risers=[(37.6, 40.6)],
                 hearts=[(13.6, 24.1, 64, 86), (46.3, 55.4, 80, 108)], themes=[(6.3, 0.6, 1.0), (34.3, 0.6, 0.971)], mutes=[],
                 cluster=[220.0, 233.08, 311.13]),
}


def load(path, ch=2):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f64le', '-ac', str(ch), '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float64).reshape(-1, ch).copy()


def write(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())


def place(bus, clip, at, gain_db=0.0):
    i = int(at * SR)
    if i >= len(bus) or i < 0:
        return
    clip = np.stack([clip, clip], 1) if clip.ndim == 1 else clip
    n = min(len(clip), len(bus) - i)
    bus[i:i + n] += clip[:n] * 10 ** (gain_db / 20)


def lufs(path):
    out = subprocess.run(['ffmpeg', '-i', str(path), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float([l for l in out.splitlines() if l.strip().startswith('I:')][-1].split()[1])


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


def run(key):
    c = EPS[key]
    tl = json.loads((ROOT / f"src/data/{c['tl']}-timeline.json").read_text())
    dur = tl['duration_seconds']
    src = ROOT / 'public/assets/audio' / c['src_audio']
    stems = {p.stem: load(p) for p in sorted(src.glob('stem-*.flac'))}
    n = min(len(s) for s in stems.values())
    stems = {k: v[:n] for k, v in stems.items()}
    voice = stems['stem-voice']
    rest = sum(v for k, v in stems.items() if k != 'stem-voice')
    T = np.arange(n) / SR
    qf = lambda f: round(f * dur) / dur
    env = lambda pts: np.interp(T, *zip(*pts))
    lines = tl['lines']
    speech = np.zeros(n)
    for l in lines:
        speech = np.maximum(speech, env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (dur, 0)]))
    # ---------------------------------------------------------------- the new score
    hits = [h for h, _ in c['stingers']]
    pts = [(0, 0.8)]
    for h in sorted(hits):
        pts += [(h - 3.0, 0.9), (h - 0.02, 1.3), (h + 0.1, 1.5), (h + 3.0, 0.9)]
    pts += [(dur - c['loop_tail'] - 0.5, 0.8), (dur, 0.8)]
    pts = sorted(p for p in pts if 0 <= p[0] <= dur)
    level = env(pts)
    trem = env([(0, 0.3)] + [(h + 0.3, 1.0) for h in hits] + [(dur - c['loop_tail'] - 0.5, 0.3), (dur, 0.3)])
    music = np.stack([hs.drone_mid(T, qf, level) * 1.6] * 2, 1)
    music += np.stack([hs.strings(T, qf, c['cluster'], level, trem, SR, seed=1) * 2.2] * 2, 1)
    for t0, rate, det in c['themes']:
        place(music, hs.music_box(SR, hs.THEME_A_MINOR, rate, det, seed=int(t0 * 10)), t0, 4)
    for h in c['swells']:
        place(music, hs.reverse_swell(SR, [x * 1.0 for x in c['cluster']], 1.4, seed=int(h * 10)), h - 1.4)
    for h, size in c['stingers']:
        place(music, hs.stinger(SR, seed=int(h * 10), size=size), h)
    for a, b, b0, b1 in c['hearts']:
        place(music, hs.heartbeat(SR, a, b, b0, b1, seed=int(a * 10)), a)
    for a, b in c['risers']:
        place(music, hs.riser(SR, b - a, seed=int(a * 10)), a)
    for a, b in c['mutes']:
        music[int(a * SR):int(b * SR)] = 0
    # adaptive ducking: 7 dB under speech, 14 dB on lines the old mix already left tight
    def rough_margin(l):
        a, b = int(l['start'] * SR), int(l['end'] * SR)
        return rms_db(voice[a:b].mean(1)) - rms_db(rest[a:b].mean(1))

    duck = np.zeros(n)
    for l in lines:
        depth = 14 if rough_margin(l) < 7 else 7
        e = env([(0, 0), (l['start'] - 0.1, 0), (l['start'], 1), (l['end'], 1), (l['end'] + 0.25, 0), (dur, 0)]) * (1 - 10 ** (-depth / 20))
        duck = np.maximum(duck, e)
    music *= (1 - duck)[:, None]
    # ---------------------------------------------------------------- calibrate presence, then protect every line
    def band(x):
        return hs._filt(x.mean(1), SR, lo=200, hi=4000)
    vb = band(voice)
    sp = speech > 0.5
    vref = rms_db(vb[sp])
    mb = band(music)
    gain = 10 ** ((vref - 5.0 - rms_db(mb[~sp])) / 20)
    def line_margin(o, l):
        a, b = int(l['start'] * SR), int(l['end'] * SR)
        return rms_db(voice[a:b].mean(1)) - rms_db(o[a:b].mean(1))

    base_margin = [line_margin(rest, l) for l in lines]
    # each line keeps 4 dB over everything, or, where the old mix was already tighter,
    # loses no more than 1 dB to the new score
    for _ in range(14):
        others = rest + music * gain
        ok = all(line_margin(others, l) >= min(4.0, m0 - 1.0) for l, m0 in zip(lines, base_margin))
        if ok:
            break
        gain *= 10 ** (-1 / 20)
    music *= gain
    # ---------------------------------------------------------------- mix, loudness, encode, peak check
    out = ROOT / 'public/assets/audio' / c['out']
    out.mkdir(parents=True, exist_ok=True)
    mix0 = voice + rest + music
    base = mix0 / np.abs(mix0).max()
    probe = out / 'probe.wav'
    m4a = out / 'mix.m4a'
    ceil_db = -1.2
    for _ in range(5):
        ceil = 10 ** (ceil_db / 20)
        g = 1.0
        for _ in range(5):
            write(probe, np.tanh(base * g / ceil) * ceil)
            g *= 10 ** ((-14.0 - lufs(probe)) / 20)
        mix = np.tanh(base * g / ceil) * ceil
        write(probe, mix)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(probe), '-c:a', 'aac', '-b:a', '192k', str(m4a)], check=True)
        peak = 20 * np.log10(np.abs(load(m4a, 1)).max())
        if peak <= -1.0:
            break
        ceil_db -= (peak + 1.0) + 0.3
    final_lufs = lufs(probe)
    probe.unlink()
    write(out / 'stem-horror-score.wav', music)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(out / 'stem-horror-score.wav'), '-c:a', 'flac', str(out / 'stem-horror-score.flac')], check=True)
    (out / 'stem-horror-score.wav').unlink()
    margins = []
    for l in lines:
        a, b = int(l['start'] * SR), int(l['end'] * SR)
        others = (rest + music)[a:b]
        margins.append({'id': l['id'], 'voice_minus_all_db': round(float(rms_db(voice[a:b].mean(1)) - rms_db(others.mean(1))), 1),
                        'phone_band_voice_minus_all_db': round(float(rms_db(band(voice[a:b])) - rms_db(band(others))), 1)})
    pres = hs.presence(voice, music, lines, SR)
    old = hs.presence(voice, stems.get('stem-score', np.zeros_like(voice)), lines, SR)
    # ---------------------------------------------------------------- mux onto the unchanged picture
    vdir = ROOT / 'assets/videos' / c['out']
    vdir.mkdir(parents=True, exist_ok=True)
    mp4 = vdir / f"{c['name']}.mp4"
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(ROOT / c['video']), '-i', str(m4a), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'copy', '-movflags', '+faststart', str(mp4)], check=True)
    shutil.copy(ROOT / c['poster'], vdir / f"{c['name']}-poster.png")
    (out / 'PROVENANCE.json').write_text(json.dumps({
        'episode': key, 'version': c['out'], 'based_on_audio': c['src_audio'], 'based_on_video': c['video'],
        'change': 'audio only: a new horror score (scripts/horror_score.py) added over the unchanged stems of ' + c['src_audio'] + '; picture copied unchanged',
        'reason': "user note 2026-11-10: no audible eerie music; make the videos scarier",
        'cues': {k: c[k] for k in ('stingers', 'swells', 'risers', 'hearts', 'themes', 'mutes', 'cluster')},
        'new_score_gain_db': round(float(20 * np.log10(gain)), 1),
        'music_presence_new_score': pres, 'music_presence_old_score': old,
        'voice_margins_db': margins, 'measured_integrated_lufs': final_lufs, 'encoded_sample_peak_dbfs': round(float(peak), 2),
        'video_sha256': hashlib.sha256(mp4.read_bytes()).hexdigest(),
        'listening_pass': 'not performed (no audio audition in this runtime)',
    }, indent=2) + '\n')
    print(key, 'LUFS', final_lufs, 'peak', round(float(peak), 2), 'presence new', pres, 'old', old['music_minus_voice_in_gaps_db'], 'worst line', min(m['voice_minus_all_db'] for m in margins))


if __name__ == '__main__':
    for k in (sys.argv[1:] or list(EPS)):
        run(k)
