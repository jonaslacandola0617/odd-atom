# Sound and visible-action study

Scope: the eight existing user-uploaded portrait references, with 12 selected action intervals and an audit of the v2 film’s separate effects stem. No new long-form episode was accessed. The user will supply long-form material for a later animation study.

**Access limit:** this runtime does not support direct audio audition. These are measurements of the mixed tracks aligned with observed visual actions, not a listening audit, stem separation, or an identification of particular reference SFX. Mid includes speech/music/effects; side can include music and imperfectly centered speech. Waveforms are normalized independently and cannot establish a professional mix ratio.

## Evidence

| Visible event | Timed evidence | Measured off-center energy candidates |
|---|---|---|
| takeoff / 25.32–26.85s | [Visual/action + waveform sheet](takeoff.jpg) · [mixed A/V excerpt](takeoff.mp4) | 25.62s, 26.16s, 26.4s, 26.54s, 26.7s |
| receptor-fit / 14.6–17.2s | [Visual/action + waveform sheet](receptor-fit.jpg) | 14.98s, 15.3s, 15.54s, 15.76s, 16.66s |
| pruning / 61.15–64.2s | [Visual/action + waveform sheet](pruning.jpg) · [mixed A/V excerpt](pruning.mp4) | 61.59s, 62.07s, 63.27s, 63.57s, 63.95s |
| fluid-loss / 40.2–44.0s | [Visual/action + waveform sheet](fluid-loss.jpg) | 41.3s, 42.54s, 42.7s, 43.42s, 43.78s |
| fear-rhyme / 55.1–61.4s | [Visual/action + waveform sheet](fear-rhyme.jpg) | 55.22s, 55.52s, 55.84s, 57.8s, 58.28s |
| collision / 25.0–28.6s | [Visual/action + waveform sheet](collision.jpg) · [mixed A/V excerpt](collision.mp4) | 25.84s, 26.04s, 26.4s, 26.8s, 27.1s |
| research-focus / 42.0–46.2s | [Visual/action + waveform sheet](research-focus.jpg) · [mixed A/V excerpt](research-focus.mp4) | 42.04s, 42.2s, 42.38s, 42.54s, 43.16s |
| compression / 10.8–15.7s | [Visual/action + waveform sheet](compression.jpg) | 11.28s, 12.0s, 13.46s, 13.76s, 15.62s |
| repair-worker / 51.7–54.1s | [Visual/action + waveform sheet](repair-worker.jpg) · [mixed A/V excerpt](repair-worker.mp4) | 51.76s, 53.04s, 53.36s, 53.52s, 54.02s |
| orbital-ring / 44.4–50.6s | [Visual/action + waveform sheet](orbital-ring.jpg) · [mixed A/V excerpt](orbital-ring.mp4) | 45.06s, 46.94s, 48.96s, 49.74s, 50.5s |
| aurora-reveal / 55.1–58.9s | [Visual/action + waveform sheet](aurora-reveal.jpg) · [mixed A/V excerpt](aurora-reveal.mp4) | 55.72s, 55.96s, 57.46s, 58.16s, 58.48s |
| water-control / 15.0–18.4s | [Visual/action + waveform sheet](water-control.jpg) · [mixed A/V excerpt](water-control.mp4) | 15.54s, 15.98s, 16.2s, 17.4s |

Candidate energy changes do not all coincide with the three sampled visual frames. For example, the ambient-water control contains a substantial side-energy spike despite no major foreground contact at the sampled frames. It would be misleading to label every peak an impact, or to infer an isolated effect’s level from this mixed signal. The supplied A/V excerpts let the user audition the actual reference mixes.

## Concrete problem in our previous mix

The v2 film has separate committed voice/effect tracks, so their event-window levels can be compared directly. Across voiced cue windows, the median effect was **29.8 dB below the simultaneous voice**. Its source also uses a small set of short airy/tonal cues at a common low amplitude. This supports the user’s report that the sound is faint and mostly small ting-like accents. It does not establish an ideal target for every scene.

## Decisions for the correction

- Structure important events as approach, contact/change, and aftermath. Let a sustained texture carry buildup rather than attaching a chime only after the edit.
- Choose sound by the material/action/scale: paper and drawing for map motion, strain for a contracting model, separate impacts for falling pieces, mechanical details and search texture for instruments.
- Keep background motion quieter than focal contact. Use stereo position to follow movement and use speech-aware level control; never alter Knox’s pace or pitch.
- Use recurring low tension around model limits, and remove musical energy briefly around the final question. Silence is part of the arrangement.
- End with an action and a tail after the voice, not a question immediately followed by file termination.

These are production choices informed by visible action timing, our isolated-stem audit and standard sound-design practice. They are **not claims that the exact reference-layer choices were heard or isolated**.

## Existing assets first

The user supplied their Curio Bureau audio repository during this work. Its complete audio directory is copied, with original catalogs and hashes, under [the reusable library](../../../public/assets/audio/library/curio-bureau/README.md). The revision reuses those existing files rather than generating another collection. Designed/synthesized source cues are not represented as authentic field recordings. Library QA/approval records do not pass the new film mix.

[Measurement data and limits](study.json) · [Revision sound placement](../../../docs/production/singularity/sound-ending/sound-design.json)

Reproduce measurements with `npm run study:sound` while the uploaded reference files are available under `/workspace/attachments/`.
