# Music at 85% of typical active SFX

[**Download full MP4**](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/videos/singularity-v6/singularity-music-85-percent.mp4) · [60-second preview](../../../../assets/videos/singularity-v6/music-preview-60s.mp4) · [Music stem](../../../../public/assets/audio/singularity-v6/music.m4a)

The user still could not hear the v5 music and requested 80–90% of the SFX. This revision applies a fixed **+4.65 dB** to the existing music, calibrated to a median simultaneous music/SFX RMS amplitude ratio of **85%** in active SFX windows. V5 measured about 50% under the same definition. There is no additional ducking. The nine source cues and scene moods are retained.

The calibration uses 200ms mono 8kHz decoded windows with SFX above −31dBFS, excluding silence and faint tails. This defines a typical active-effect signal level; it does not mean music follows every individual effect, or that perceived loudness can be expressed as this percentage. The music remains continuous through gaps. The safety limiter remains on the final sum.

The original Knox take, gain, speed and pitch are retained, along with the existing effects and atmosphere. All picture frames and the ending are preserved bit for bit. The movie remains 548.633 seconds, 1920 × 1080 at 30 fps, with optional subtitles as a separate file.

[Previous balance—30 seconds](previous-music-30s.mp4) · [New balance—same interval](corrected-music-30s.mp4) · [Measured delivery results](delivery.json) · [Gain, calibration and source hashes](sound-design.json)

The measured music/SFX ratio is **84.9%**, with music **6.9 dB below narration** on median. The final audio peak is **-1.3 dBFS** and all five sync windows show zero lag.

The review checks actual-file decoding, peaks, voice sync, full picture preservation and source hashes, plus the requested music/SFX ratio. It also verifies the final MP4 carries the exact new mixed audio stream. Direct audio audition is unavailable in this environment; these checks do not constitute listening approval. User review is pending. The earlier full-animation review remains not passed.

Higher bitrate chapters:

1. [Part 1](../../../../assets/videos/singularity-v6/chapters/singularity-music-85-percent-part-1.mp4)
2. [Part 2](../../../../assets/videos/singularity-v6/chapters/singularity-music-85-percent-part-2.mp4)
3. [Part 3](../../../../assets/videos/singularity-v6/chapters/singularity-music-85-percent-part-3.mp4)
4. [Part 4](../../../../assets/videos/singularity-v6/chapters/singularity-music-85-percent-part-4.mp4)
5. [Part 5](../../../../assets/videos/singularity-v6/chapters/singularity-music-85-percent-part-5.mp4)

```sh
npm run sound:singularity-v6
npm run render:singularity-v6
npm run review:singularity-v6
```

Select `SingularityMusic85Percent` in Remotion Studio. Reusable revised stems are under `public/assets/audio/singularity-v6/`. The [YouTube drafts](../../../publishing/singularity/README.md) now point to this video. No posts have been published.
