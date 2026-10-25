"""Set the existing music to 85% of typical active SFX RMS amplitude.

Percent refers to measured RMS amplitude, not perceived loudness or a UI slider.
Use a fixed calibrated gain: do not add another gate/sidechain to suppress music.
"""
from pathlib import Path
import hashlib
import json
import subprocess

import numpy as np

R = Path(__file__).resolve().parents[1]
SR = 8000
T = json.loads((R / 'src/data/singularity-narration.json').read_text())
F = T['durationInFrames'] + 360
D = F / 30
BASE = R / 'public/assets/audio/singularity-v4'
PREVIOUS = R / 'public/assets/audio/singularity-v5/music.m4a'
DEST = R / 'public/assets/audio/singularity-v6'
DOC = R / 'docs/production/singularity/music-85-percent'
OUT = R / 'out/singularity-v6'
for folder in [DEST, DOC, OUT]:
    folder.mkdir(parents=True, exist_ok=True)


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def run(args):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', *map(str, args)], check=True)


def mono(p):
    return np.frombuffer(subprocess.check_output([
        'ffmpeg', '-v', 'error', '-i', str(p), '-ar', str(SR),
        '-ac', '1', '-f', 'f32le', '-'
    ]), np.float32)


def rms(s, hop=1600):
    n = len(s) // hop
    return np.sqrt(np.mean(s[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-15)


effects = rms(mono(BASE / 'effects.m4a'))
old_music = rms(mono(PREVIOUS))
n = min(len(effects), len(old_music))
active = effects[:n] > 10 ** (-31 / 20)
assert active.sum() > 400
target = .85
old_ratio = float(np.median(old_music[:n][active] / effects[:n][active]))
gain = target / old_ratio
gain_db = float(20 * np.log10(gain))
assert 1 < gain < 4
# Encode once from the prior mono-safe scene-mood music arrangement. Fixed gain
# preserves that arrangement and its ending taper; no new ducking is applied.
wav = OUT / 'music.wav'
run(['-i', PREVIOUS, '-af', f'volume={gain:.10f}', '-ar', '48000',
     '-c:a', 'pcm_s24le', wav])
run(['-i', wav, '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
     DEST / 'music.m4a'])
new_music = rms(mono(DEST / 'music.m4a'))
measured_ratio = float(np.median(new_music[:n][active] / effects[:n][active]))
assert .80 <= measured_ratio <= .90, measured_ratio

graph = (
    f'[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,volume=.92,'
    f'apad,atrim=duration={D}[voice];'
    '[voice][1:a][2:a][3:a]amix=inputs=4:normalize=0,'
    f'alimiter=limit=.8414:level=0:latency=1,apad,atrim=duration={D}[mix]'
)
run(['-i', R / 'public' / T['audioFile'], '-i', BASE / 'effects.m4a',
     '-i', BASE / 'atmosphere.m4a', '-i', wav, '-filter_complex', graph,
     '-map', '[mix]', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
     '-movflags', '+faststart', DEST / 'final-mix.m4a'])
record = {
    'frames': F, 'seconds': D,
    'request': 'User still cannot hear music; make it 80–90% of the SFX.',
    'target_music_to_active_sfx_rms_amplitude_ratio': target,
    'measured_music_to_active_sfx_rms_amplitude_ratio': measured_ratio,
    'measurement': 'Median simultaneous music/SFX RMS amplitude ratio in 200ms mono 8kHz decoded windows with SFX above -31dBFS. Not a perceived-loudness percentage or UI slider value.',
    'active_sfx_windows': int(active.sum()),
    'previous_music_to_active_sfx_ratio': old_ratio,
    'music_fixed_gain': gain, 'music_fixed_gain_db': gain_db,
    'additional_ducking': False,
    'previous_music_source': str(PREVIOUS.relative_to(R / 'public')),
    'previous_music_source_sha256': sha(PREVIOUS),
    'effects_source': 'assets/audio/singularity-v4/effects.m4a',
    'effects_source_sha256': sha(BASE / 'effects.m4a'),
    'atmosphere_source': 'assets/audio/singularity-v4/atmosphere.m4a',
    'atmosphere_source_sha256': sha(BASE / 'atmosphere.m4a'),
    'source_voice_sha256': T['audioSha256'],
    'voice_gain': .92, 'voice_speed': 1, 'voice_pitch_shift': 0,
    'music_moods': json.loads((R / 'docs/production/singularity/music-presence/sound-design.json').read_text())['music_moods'],
    'new_music_or_voice_generation_requests': 0,
    'review_limit': 'Direct audio audition unavailable. Measurements are not a listening approval.'
}
(DOC / 'sound-design.json').write_text(json.dumps(record, indent=2) + '\n')
(DEST / 'README.md').write_text(
    '# Music at 85% of typical active SFX\n\n'
    'The user requested music at 80–90% of SFX. This revision applies a fixed '
    f'**+{gain_db:.2f} dB** to the existing v5 scene-mood music, targeting a median '
    'simultaneous music/SFX RMS amplitude ratio of 0.85 in active SFX windows. '
    'No additional ducking, new music or narration is introduced. The unchanged '
    'v4 effects and atmosphere and original Knox recording feed the final mix. '
    'The final safety limiter remains. Source FLAC music cues remain under '
    '`../singularity-v4/music-cues/`.\n\n'
    'Rebuild with `npm run sound:singularity-v6`; settings and source hashes: '
    '`docs/production/singularity/music-85-percent/sound-design.json`. '
    'RMS amplitude percentages are not perceived-loudness percentages.\n'
)
print(f'Music gain: +{gain_db:.2f} dB; decoded active SFX ratio: {measured_ratio:.4f}', flush=True)
