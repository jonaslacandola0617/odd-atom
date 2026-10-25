# Background-music presence correction

[**Download the corrected full MP4**](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/videos/singularity-v5/singularity-music-forward.mp4) · [60-second mixed preview](../../../../assets/videos/singularity-v5/music-preview-60s.mp4) · [Music stem](../../../../public/assets/audio/singularity-v5/music.m4a)

The user could not hear the background music in v4. The previous mix's upper-level checks did not establish useful music presence: it measured roughly 25 dB below active narration and was repeatedly held down by faint effect tails. That balance was too conservative.

This revision reuses the same nine original music source cues. It raises the underlying score, follows narration at phrase scale rather than individual syllables, and ducks briefly for prominent effects instead of quiet tails. Recovery is faster, so the bed returns between contacts. A shared source-channel component makes the arrangement less vulnerable to mono cancellation. The curiosity, tension, eerie, exploratory and warm scene moods are retained; the source FLACs are unchanged.

Knox's source take, pace and pitch are unchanged. The v4 effects and atmosphere stems are reused unchanged, as are the entire picture and map-reveal ending. Only the music arrangement/level control and resulting final mix are revised.

[Previous music balance — 30 seconds](previous-music-30s.mp4) · [Corrected balance — same interval](corrected-music-30s.mp4) · [Measured final-file results](delivery.json) · [Music settings and source hashes](sound-design.json)

The encoded mono check measures a **13.0 dB music increase over v4**, with the music **11.5 dB below active narration** on median. Music meets the presence criterion in **99.2%** of the measured voiced windows. These decoded mono measurements differ from stereo source-stem measurements because this revision also changes mono anchoring.

The correction is checked for **presence as well as restraint**: encoded mono playback-band measurements compare music against the previous stem and narration in one-second voiced windows, and check prominence against stronger effects. The report also checks full decoding, peaks, original source hashes, five narration-sync windows, the ending taper and exact preservation of all picture bitstreams. Direct audio audition is unavailable here; these measurements are not a user listening pass.

The full movie remains 548.633 seconds, 1920 × 1080 at 30 fps, without on-screen titles or captions. Higher bitrate versions:

1. [Part 1](../../../../assets/videos/singularity-v5/chapters/singularity-music-forward-part-1.mp4)
2. [Part 2](../../../../assets/videos/singularity-v5/chapters/singularity-music-forward-part-2.mp4)
3. [Part 3](../../../../assets/videos/singularity-v5/chapters/singularity-music-forward-part-3.mp4)
4. [Part 4](../../../../assets/videos/singularity-v5/chapters/singularity-music-forward-part-4.mp4)
5. [Part 5](../../../../assets/videos/singularity-v5/chapters/singularity-music-forward-part-5.mp4)

```sh
npm run sound:singularity-v5
npm run render:singularity-v5
npm run review:singularity-v5
```

Select `SingularityMusicPresence` in Remotion Studio. Newly mixed audio is saved under `public/assets/audio/singularity-v5/` for reuse. Existing source music lives under `public/assets/audio/singularity-v4/music-cues/`. The [YouTube publishing drafts](../../../publishing/singularity/README.md) are unchanged; their asset pointer now selects this corrected video. Nothing has been published to YouTube.
