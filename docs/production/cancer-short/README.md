# Cancer’s Strangest Trick — 76-second production test

The finished asset is [cancer-76s.mp4](../../../assets/videos/cancer-short-v1/cancer-76s.mp4), a portrait 1080×1920/30 fps H264/AAC short. It contains a complete narrated story, embedded phrase captions, music, event-timed effects and a closing visual/sound tail. This is an original production test for review, not a public social upload.

[Storyboard and narration timing](storyboard.md) · [Spoken script](narration.txt) · [Science/art direction](science-and-art-direction.md) · [Sound design and source hashes](sound-design.json) · [Delivery checks](delivery.json) · [Upload metadata draft](youtube-draft.md).

## Voice and sound

Cancer required new narration. One ElevenLabs request used the project's existing **George** voice with **eleven_v3** and explicit performance directions. The original MP3, provider alignment and generation settings are retained under `public/assets/audio/cancer-short-v1/`. Independent overlapping offline ASR recovered the script; this is a content check, not a direct listening review. Only long inter-word pauses were shortened, with a recorded mapping; word speed and pitch are unchanged. The previous Knox source stays unchanged.

The narration ends at 74.543s, leaving 1.457s of closing picture and sound within the 76-second master. Music changes through curious, eerie, strained, warm and questioning moods. There are 34 effect placements, including four new original reusable organic cues. Existing Curio Bureau effects and original project music are reused. Music is about 8.29 dB below typical active narration; its measured amplitude is approximately 90% of typical active SFX. These signal measurements do not substitute for listening. Narration/effects/music/atmosphere/final stems and the new cue sources are committed for reuse.

## Visual construction and revision

New cell membranes/cytoplasm and nuclei are independently registered illustrated components. Remotion performs deformation, pose transitions, clone accumulation, receptor/contact changes, cytotoxic granules, tissue/blood travel, antibody blocking, response contrast and object-located reveals. The approved medicine source supplies the brief clinician view with preserved body pixels, local blink/focus and prepared environment motion.

The first artwork review found a star-like extreme division, a doubled camouflage edge and a portrait with an image edge/close-up matte seams. Corrected versions retain the original cell silhouettes, use a single surface color transform, replace the extreme division with gentler daughter poses and a narrowing bridge, and retain the clinician's original body image. Captions use measured safe widths and balanced lines. [Initial division/disguise](review/initial-division-and-disguise.jpg) and [initial framing](review/initial-portrait-framing.jpg) are preserved as failed comparisons. Final encoded comparisons are in [review/](review/).

The new cell-skin geometry passes 273,600 triangle checks with minimum signed-area ratio 0.8082. That is a fold guard, not an artistic score or proof of source-quality equivalence. See [geometry-check.json](geometry-check.json). Scientific/visual simplifications are recorded separately in the science document.

[Encoded visual audit](visual-audit.md) records actual inspected frames and remaining differences. A hash-bound review record prevents a different movie from inheriting that review.

## Reproduce

```bash
npm ci
# FFmpeg/FFprobe, Chromium and Python/Pillow/NumPy/SciPy are required.
# If OpenCV is absent, install it in the ignored project analysis directory:
python -m pip install --target .cache/motion-study opencv-python-headless
npm run prepare:cancer
npm run sound:cancer
npm run typecheck
npm run check:cancer
npm run still:cancer
npm run render:cancer
npm run review:cancer
```

The existing raw narration is sufficient for reproduction. `npm run narrate:cancer` is credit-using generation only when the versioned original is absent; it preserves an existing recording. Do not regenerate it routinely or overwrite an approved version. Image-generation source assets are committed, so no image generation is needed to re-render.

`review:cancer` checks the actual MP4 and produces complete-duration navigation, specific action strips and all join boards. A new render needs visual inspection; technical execution does not automatically renew any artistic review. User artistic approval remains pending. Direct audio audition is unavailable in this runtime, so no listening approval is claimed.
