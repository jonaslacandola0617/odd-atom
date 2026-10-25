# Music at 85% of typical active SFX

The user requested music at 80–90% of SFX. This revision applies a fixed **+4.65 dB** to the existing v5 scene-mood music, targeting a median simultaneous music/SFX RMS amplitude ratio of 0.85 in active SFX windows. No additional ducking, new music or narration is introduced. The unchanged v4 effects and atmosphere and original Knox recording feed the final mix. The final safety limiter remains. Source FLAC music cues remain under `../singularity-v4/music-cues/`.

Rebuild with `npm run sound:singularity-v6`; settings and source hashes: `docs/production/singularity/music-85-percent/sound-design.json`. RMS amplitude percentages are not perceived-loudness percentages.
