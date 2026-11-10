"""Replace the robotic MBROLA narration of Episodes 1-6 with ElevenLabs takes (audio only).

On 2026-11-10 the user connected ElevenLabs and asked to change the robotic voiceover
into an eerie one. Each episode was generated as ONE performance (eleven_v4, audio
tags, [long pause] between lines; prompts in docs/production/eleven-revoice/prompts.json).
This script:
  1. splits the take into the script lines (scripts/eleven_split.py);
  2. places each line at its ORIGINAL start time, so the burned-in captions and the
     picture stay in sync; a line longer than its slot is tightened with atempo
     (at most 1.12x);
  3. matches each line's level to the old voice line's level, so every calibration of
     the horror score (ducking, presence, margins) still holds;
  4. remixes it with the episode's other stems (sound, old score, horror score),
     re-targets -14 LUFS with an AAC peak check, and muxes it onto the existing picture
     with -c:v copy as a new version. Earlier versions are kept.

Run: python3 scripts/revoice_eleven.py ep02 ep03 ...
"""
import hashlib, json, shutil, subprocess, sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import horror_score as hs
import eleven_split as es
from rescore_horror import load, write, lufs, rms_db, SR

ROOT = Path(__file__).resolve().parents[1]
TAKES = ROOT / 'public/assets/audio/eleven-takes'
MAX_TEMPO = 1.12

EPS = {
    'ep01': dict(tl='ep01-moon-v2', stems='ep01-moon-v2', score='ep01-moon-v3', video='assets/videos/ep01-moon-v3/ep01-viral-cut-horror-score.mp4',
                 out='ep01-moon-v4', name='ep01-viral-cut-eerie-voice', chain='broadcast', fit_caption=True, stingers=[28.62, 31.85, 39.45]),
    'ep02': dict(tl='ep02-mask-v1', stems='ep02-mask-v1', score='ep02-mask-v2', video='assets/videos/ep02-mask-v2/ep02-the-mask-on-channel-11-horror-score.mp4',
                 out='ep02-mask-v3', name='ep02-the-mask-on-channel-11-eerie-voice', chain='narrator', stingers=[10.92, 30.7]),
    'ep03': dict(tl='ep03-snow-v1', stems='ep03-snow-v1', score='ep03-snow-v2', video='assets/videos/ep03-snow-v2/ep03-footprints-in-the-snow-horror-score.mp4',
                 out='ep03-snow-v3', name='ep03-footprints-in-the-snow-eerie-voice', chain='narrator', stingers=[23.45, 38.58, 45.62, 52.12]),
    'ep04': dict(tl='ep04-night-v1', stems='ep04-night-v1', score='ep04-night-v2', video='assets/videos/ep04-night-v2/ep04-rules-for-the-night-shift-horror-score.mp4',
                 out='ep04-night-v3', name='ep04-rules-for-the-night-shift-eerie-voice', chain='tape', take='ep04-take2.mp3', stingers=[25.85, 45.0, 51.0]),
    'ep05': dict(tl='ep05-tent-v1', stems='ep05-tent-v1', score='ep05-tent-v2', video='assets/videos/ep05-tent-v2/ep05-nine-hikers-one-cut-tent-horror-score.mp4',
                 out='ep05-tent-v3', name='ep05-nine-hikers-one-cut-tent-eerie-voice', chain='narrator', stingers=[24.85, 33.5, 49.3]),
    'ep06': dict(tl='ep06-sonar-v1', stems='ep06-sonar-v1', score=None, video='assets/videos/ep06-sonar-v1/ep06-the-sound-that-matched-us.mp4',
                 out='ep06-sonar-v2', name='ep06-the-sound-that-matched-us-eerie-voice', chain='narrator', stingers=[17.06, 39.75, 51.0]),
}


def tempo(x, factor):
    if factor <= 1.0005:
        return x
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={factor:.4f}', '-f', 'f64le', '-'],
                       input=x.astype('<f8').tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(p, np.float64).copy()


def colour(x, chain, lid):
    """The voice's place in each world. Narrators stay close and clean with a dark room;
    the Episode 1 alert is a TV broadcast; the Episode 4 rules are a tape, and the door
    line is the same voice heard through a door."""
    x = hs._filt(x, SR, lo=70)
    if chain == 'broadcast':
        x = hs._filt(x, SR, lo=260, hi=4800)
        x = np.tanh(x * 2.2 / (np.abs(x).max() + 1e-9)) * np.abs(x).max()
        return hs._verb(x, SR, 0.5, 0.10, seed=11)
    if chain == 'tape':
        if lid == 'door':
            x = hs._filt(x, SR, lo=120, hi=900)
            return hs._verb(x, SR, 0.9, 0.35, seed=13, bright=1200)
        x = hs._filt(x, SR, lo=160, hi=6500)
        return hs._verb(x, SR, 0.6, 0.10, seed=12)
    return hs._verb(x, SR, 1.4, 0.10, seed=10, bright=3500)


def run(key):
    c = EPS[key]
    tl = json.loads((ROOT / f"src/data/{c['tl']}-timeline.json").read_text())
    lines, dur = tl['lines'], tl['duration_seconds']
    take_path = TAKES / c.get('take', f'{key}-take1.mp3')
    take = es.load(take_path)
    segs = es.segments(take, [l['text'] for l in lines])
    src = ROOT / 'public/assets/audio' / c['stems']
    stems = {p.stem: load(p) for p in sorted(src.glob('stem-*.flac'))}
    if c['score']:
        stems['stem-horror-score'] = load(ROOT / 'public/assets/audio' / c['score'] / 'stem-horror-score.flac')
    n = min(len(s) for s in stems.values())
    stems = {k: v[:n] for k, v in stems.items()}
    old_voice = stems.pop('stem-voice')
    rest = sum(stems.values())
    voice = np.zeros((n, 2))
    placed = []
    for i, (l, (a, b)) in enumerate(zip(lines, segs)):
        nxt = lines[i + 1]['start'] if i + 1 < len(lines) else dur - 0.1
        slot = nxt - l['start'] - 0.15
        if c.get('fit_caption'):  # also end the speech inside the caption's 0.35 s hold
            slot = min(slot, l['end'] + 0.30 - l['start'])
        seg = take[max(0, int((a - 0.03) * SR)):int((b + 0.12) * SR)].copy()
        f = max(1.0, min(MAX_TEMPO, len(seg) / SR / slot))
        seg = tempo(seg, f)
        fade = int(0.04 * SR)
        seg[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
        seg[-fade:] *= np.linspace(1, 0, fade)
        seg = colour(seg, c['chain'], l['id'])
        s0 = int(l['start'] * SR)
        oa, ob = s0, int(l['end'] * SR)
        target = rms_db(old_voice[oa:ob].mean(1))
        core = seg[:int((len(seg) / SR - 0.12) * SR)].mean(1)
        seg *= 10 ** ((target - rms_db(core)) / 20)
        m = min(len(seg), n - s0)
        voice[s0:s0 + m] += seg[:m]
        end = l['start'] + m / SR
        placed.append({'id': l['id'], 'start': l['start'], 'end': round(end, 3), 'old_end': l['end'], 'take_seconds': round(b - a, 2),
                       'tempo': round(f, 3), 'overruns_slot': end > nxt})
    # lift any line that sits under 4.5 dB over everything else (at most +3 dB)
    for p in placed:
        a, b = int(p['start'] * SR), int(p['end'] * SR)
        m = rms_db(voice[a:b].mean(1)) - rms_db(rest[a:b].mean(1))
        p['lift_db'] = round(float(min(3.0, max(0.0, 4.5 - m))), 1)
        if p['lift_db'] > 0:
            voice[a:b] *= 10 ** (p['lift_db'] / 20)
    # stingers must stay out of speech
    clash = [h for h in c['stingers'] for p in placed if p['start'] - 0.05 <= h <= p['end'] - 0.1]
    new_lines = [dict(id=p['id'], start=p['start'], end=p['end']) for p in placed]
    # ------------------------------------------------------------- mix, loudness, encode, peak check
    out = ROOT / 'public/assets/audio' / c['out']
    out.mkdir(parents=True, exist_ok=True)
    mix0 = voice + rest
    base = mix0 / np.abs(mix0).max()
    probe, m4a = out / 'probe.wav', out / 'mix.m4a'
    ceil_db = -1.2
    for _ in range(5):
        ceil = 10 ** (ceil_db / 20)
        g = 1.0
        for _ in range(5):
            write(probe, np.tanh(base * g / ceil) * ceil)
            g *= 10 ** ((-14.0 - lufs(probe)) / 20)
        write(probe, np.tanh(base * g / ceil) * ceil)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(probe), '-c:a', 'aac', '-b:a', '192k', str(m4a)], check=True)
        peak = 20 * np.log10(np.abs(load(m4a, 1)).max())
        if peak <= -1.0:
            break
        ceil_db -= (peak + 1.0) + 0.3
    final_lufs = lufs(probe)
    probe.unlink()
    write(out / 'stem-voice.wav', voice)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(out / 'stem-voice.wav'), '-c:a', 'flac', str(out / 'stem-voice.flac')], check=True)
    (out / 'stem-voice.wav').unlink()
    band = lambda x: hs._filt(x.mean(1), SR, lo=200, hi=4000)
    margins = []
    for p in placed:
        a, b = int(p['start'] * SR), int(p['end'] * SR)
        margins.append({'id': p['id'], 'voice_minus_all_db': round(float(rms_db(voice[a:b].mean(1)) - rms_db(rest[a:b].mean(1))), 1),
                        'phone_band_voice_minus_all_db': round(float(rms_db(band(voice[a:b])) - rms_db(band(rest[a:b]))), 1)})
    music = stems.get('stem-horror-score', stems.get('stem-score'))
    pres = hs.presence(voice, music, new_lines, SR)
    head = rms_db(mix0[:SR // 4].mean(1)) - rms_db(mix0.mean(1))
    tail = rms_db(mix0[-SR // 4:].mean(1)) - rms_db(mix0.mean(1))
    # ------------------------------------------------------------- mux onto the unchanged picture
    vdir = ROOT / 'assets/videos' / c['out']
    vdir.mkdir(parents=True, exist_ok=True)
    mp4 = vdir / f"{c['name']}.mp4"
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(ROOT / c['video']), '-i', str(m4a), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'copy', '-movflags', '+faststart', str(mp4)], check=True)
    poster = sorted((ROOT / c['video']).parent.glob('*poster.png'))[0]
    shutil.copy(poster, vdir / f"{c['name']}-poster.png")
    prompts = json.loads((ROOT / 'docs/production/eleven-revoice/prompts.json').read_text())
    pr = prompts['prompts'][key]
    (out / 'PROVENANCE.json').write_text(json.dumps({
        'episode': key, 'version': c['out'], 'based_on_video': c['video'], 'other_stems_from': [c['stems']] + ([c['score']] if c['score'] else []),
        'change': 'audio only: the MBROLA narration is replaced by an ElevenLabs take placed on the original line start times; picture copied unchanged (-c:v copy)',
        'reason': 'user, 2026-11-10: ElevenLabs connected; change the robotic voiceover into an eerie one for Episodes 1-6',
        'voice': {'provider': 'ElevenLabs (connector, eleven_v4)', 'voice_id': prompts['voices'][pr['voice']][0], 'voice_name': prompts['voices'][pr['voice']][1],
                  'prompt': pr['text'], 'take': str(take_path.relative_to(ROOT)), 'take_sha256': hashlib.sha256(take_path.read_bytes()).hexdigest(), 'chain': c['chain']},
        'lines': placed, 'stingers_inside_speech': clash, 'voice_margins_db': margins, 'music_presence': pres,
        'loop_seam_db_vs_mean': {'first_quarter_second': round(float(head), 1), 'last_quarter_second': round(float(tail), 1)},
        'measured_integrated_lufs': final_lufs, 'encoded_sample_peak_dbfs': round(float(peak), 2),
        'video_sha256': hashlib.sha256(mp4.read_bytes()).hexdigest(),
        'listening_pass': 'not performed (no audio audition in this runtime)',
    }, indent=2, ensure_ascii=False) + '\n')
    print(key, 'LUFS', final_lufs, 'peak', round(float(peak), 2), 'presence', pres['music_minus_voice_during_speech_db'], pres['music_minus_voice_in_gaps_db'],
          'worst', min(m['voice_minus_all_db'] for m in margins), 'clash', clash, 'tempo', [p['tempo'] for p in placed if p['tempo'] > 1], 'overrun', [p['id'] for p in placed if p['overruns_slot']])


if __name__ == '__main__':
    for k in (sys.argv[1:] or list(EPS)):
        run(k)
