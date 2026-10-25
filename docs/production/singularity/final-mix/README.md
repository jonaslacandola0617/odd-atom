# Final audio mix and YouTube copy

[**Download the revised full MP4**](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/videos/singularity-v4/singularity-final-mix.mp4) · [Ending preview](../../../../assets/videos/singularity-v4/ending-preview.mp4) · [YouTube upload copy and Community drafts](../../../publishing/singularity/README.md) · [Reusable audio and new music cues](../../../../public/assets/audio/singularity-v4/README.md)

This is the requested audio refinement: stronger SFX, additional purposeful action cues and scene-specific background music. The full **548.633-second / 16,459-frame** picture and the map-reveal ending are copied from v3. Original Knox timing and pitch remain unchanged, and the movie still has no on-screen titles or text.

## Effects and mix priority

The existing effects receive a nominal **+6 dB** boost before speech-aware level control. The final measured gain over v3 depends on the event and overlapping speech; [the encoded-file review](delivery.json) records matched-window changes. **23 new placements** add support to the visible model-limit drawing, continuing expansion, observational framing, joint-description gap, map boundaries, speculative histories, field excitation and human-history trail. Those are existing Curio Bureau assets, not newly requested sound generations.

Across the authored cue windows, focal effects measure about **9.1 dB below the voice**, and music about **16.2 dB below focal SFX**. Music is constrained below active speech and active focal effects; it continues quietly during deliberate SFX gaps. This avoids treating a silent effects bus as a reason to mute all music. Levels are measured, not a substitute for listening approval.

[Previous mix, 30 seconds](previous-mix-30s.mp4) · [New mix, same interval](revised-mix-30s.mp4) · [Cue placements, music map and bus measurements](sound-design.json)

## Music by scene

Nine newly composed original cues use felt/plucked additive tones, detuned sustained pads and filtered air. They share a tonal center for gentle transitions, with warmer harmony for the human passage and unresolved harmony for the end. The full music stem and nine reusable FLAC source cues are committed, with hashes and provenance. No third-party music sample, speech generation or generative-service request was used.

| Time | Scene | Mood and purpose |
|---|---|---|
| 0:00–0:11 | Rewind through structure | **curious** — Invite the opening rewind without announcing an answer. |
| 0:11–0:24 | The classical extrapolation | **strain** — Build pressure as classical quantities diverge. |
| 0:24–0:36 | The description breaks | **eerie** — Let certainty fall away at the model boundary. |
| 0:36–0:50 | Separate three questions | **curious** — Separate three questions with a lighter investigative pattern. |
| 0:50–1:04 | Increasing distances and redshift | **evidence** — Support a stable comparison rather than a dramatic claim. |
| 1:04–1:25 | Light is set free | **wonder** — Open the harmony as previously trapped light travels freely. |
| 1:25–1:37 | Nuclei assemble | **evidence** — Make assembly feel orderly and legible. |
| 1:37–1:53 | Evidence reaches an instrument | **curious** — Keep the evidence-to-inference passage inquisitive. |
| 1:53–2:07 | Matter bends a geometry | **evidence** — Give predictable geometry a measured rhythmic foundation. |
| 2:07–2:26 | Reversing the classical model | **strain** — Increase tension as distances contract. |
| 2:26–2:51 | A model reaches its limits | **eerie** — Hold the unanswered limit without a victory cadence. |
| 2:51–3:13 | The invented room | **playful** — Make the tempting room metaphor approachable. |
| 3:13–3:32 | Expansion everywhere | **wonder** — Broaden the sense of spatial scale. |
| 3:32–4:02 | A region is not all existence | **wonder** — Keep the larger unseen extent open rather than enclosed. |
| 4:02–4:44 | Two descriptions must meet | **eerie** — Let the missing joint description feel unresolved. |
| 4:44–5:07 | The assumed road of time | **exploratory** — Accompany a possible history without presenting it as fact. |
| 5:07–5:31 | An event outside a map | **playful** — Lighten the map-domain analogy while the pin explores. |
| 5:31–5:52 | A finite hypothetical bounce | **exploratory** — Follow contraction and expansion with an exploratory phrase. |
| 5:52–6:06 | A picture must face evidence | **curious** — Return to inquiry as the picture must face evidence. |
| 6:06–6:28 | An expanding field patch | **wonder** — Widen the harmonic space with the expanding patch. |
| 6:28–6:54 | Disconnected hypothetical histories | **exploratory** — Keep separate histories speculative rather than triumphant. |
| 6:54–7:27 | Empty is still a framework | **eerie** — Make apparent emptiness feel unsettled before fields are revealed. |
| 7:27–7:48 | Different levels of knowledge | **evidence** — Re-establish the distinction between evidence and speculation. |
| 7:48–8:08 | Measuring, predicting and testing | **evidence** — Support careful searching and comparison. |
| 8:08–8:32 | Cosmic material, human life | **warm** — Add warmth to the connection between cosmic material and life. |
| 8:32–8:40 | Rewind with a new interpretation | **curious** — Return to the opening question with a familiar inquisitive motif. |
| 8:40–9:08 | An unfinished explanation | **question** — Leave an open fifth/add-nine and let the final page linger. |

## Publishing copy

**Recommended title: What If the Big Bang Wasn’t the Beginning?**

The [publishing folder](../../../publishing/singularity/README.md) contains a paste-ready title, two alternate titles, description, timestamps, tags, pinned comment and three Community posts. Chapters are checked against the final video and all run at least ten seconds. The launch post is intended for use with the actual uploaded video attached in YouTube. These are drafts; nothing has been published to YouTube.

## Delivery and reproduction

The complete MP4 stays below GitHub’s file limit. Higher bitrate picture with the same revised soundtrack:

1. [Part 1](../../../../assets/videos/singularity-v4/chapters/singularity-final-mix-part-1.mp4)
2. [Part 2](../../../../assets/videos/singularity-v4/chapters/singularity-final-mix-part-2.mp4)
3. [Part 3](../../../../assets/videos/singularity-v4/chapters/singularity-final-mix-part-3.mp4)
4. [Part 4](../../../../assets/videos/singularity-v4/chapters/singularity-final-mix-part-4.mp4)
5. [Part 5](../../../../assets/videos/singularity-v4/chapters/singularity-final-mix-part-5.mp4)

```sh
npm run typecheck
npm run sound:singularity-v4
npm run render:singularity-v4
npm run review:singularity-v4
```

Select `SingularityFinalMix` in Remotion Studio. The delivery command remuxes the already rendered picture, preserving its complete H.264 bitstream. Technical review checks full decoding, audio peaks, the unchanged picture/source files, five narration-sync windows, encoded music/SFX hierarchy, ending taper and the five chapter pictures.

**Review limit:** direct audio audition is unavailable in this runtime. The measurements establish levels, timing and file integrity, not a human listening pass. The prior animation-quality feedback remains recorded; this audio-only correction does not manufacture a new animation approval.
