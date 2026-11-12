# TRANSFERS: 20 s acting test (v1, 2026-11-12)

The user's go-ahead: "I think its good enough to run on 20s test".

- **Composition:** `TransfersActingTest` (`src/horror/transfers/ActingTest.tsx`).
- **Frame:** 1920×1080, 30 fps, 600 frames, rendered internally at 640×360 and
  upscaled 3× with nearest filtering. Real scenes are letterboxed to 2.39:1;
  the tape plays pillarboxed at 4:3.
- **Delivery:** `assets/videos/transfers-acting-test-v1/transfers-acting-test-20s.mp4`.

## Shots

| Frames | Shot | Acting and events |
|---|---|---|
| 0–149 | Nico's left side, slightly in front, slow push | He looks down at the tape, reaches, grips it (fingers curl), lifts it, carries it to the VCR and pushes it in. The VCR takes it and the screen goes from VIDEO 1 to the picture. Two blinks; breathing. |
| 150–269 | The tape, full 4:3 (PLAY, timestamp PM 9:41 OCT. 3 1997, grain, tracking band) | A handheld camera over a birthday cake by candlelight. The camera is set down on the table, tilted and left running. A still figure stands behind the table against the lit wall. |
| 270–419 | From inside the TV, at screen height | He leans in. Focused (narrowed eyes, brows down), then fear (inner brows up, eyes wide, mouth open, platysma), unblinking. His breathing quickens. |
| 420–539 | Past him to the back doorway | The figure already stands in his back doorway, lit from behind in green. He turns over his shoulder (spine twist, neck and head); his fear peaks. |
| 540–575 | The doorway, closer | The figure's head tilts. |
| 576–599 | Black | Silence after one low hit. |

## Technique

- **Character:** `public/assets/3d/nico/nico-v1.glb` (Nico v1), loaded once and
  cloned three times with SkeletonUtils: Nico; the figure in the shop; the
  figure on the tape. The figure is the same body in flat black without
  glasses, deliberately: the series' twist is that the one who films is Nico.
- **Posing.**
  - Each frame resets every bone to rest, then poses the spine, neck and head
    with world-axis rotations, so poses are pure functions of the frame.
  - The legs sit by aiming the thighs and calves.
  - Both arms use two-bone IK (law of cosines with a pole vector), so the right
    wrist really reaches the tape and the slot.
  - Fingers curl around the knuckle axis.
  - The tape is parented to the hand's grip point while held.
- **Face:** the 34 MakeHuman expression shape keys are driven per frame (blinks,
  focus, fear).
- **Look:** the PS1 material (vertex snap, Bayer dither, quantised colour) on
  everything, plus film grain and letterbox bars. The monitor picture and VCR
  display are live canvas textures.
- **Lessons:**
  - A camera next to the CRT is blocked by its box, but a camera *inside* it
    sees out, because the box's faces are culled from inside. The "screen
    watches him" angle comes free.
  - The figure needs a pale lit wall behind it to read.
  - The first still in a fresh browser can render black, so the scripts
    render a discarded warm-up.
- **Render:** `node scripts/render_transfers_test.cjs`. Review stills:
  `--stills 0,60,... --out <dir>`. About 1.5 s a still.

## Sound

- **Script:** `scripts/transfers_test_sound.py`, writing to
  `public/assets/audio/transfers/acting-test-v1/` (`mix.m4a`, four FLAC stems,
  `PROVENANCE.json`).
- **No dialogue, no score, no new generation:** it reuses Season 3 ElevenLabs SFX
  (storm and breaths) and the Curio library (archive room, latch, tape reel
  start, paper, wood stress, restrained boom).
- **Synthesized:** the CRT hum and whine, the tape and case clicks, the VCR
  motor, the PLAY relay, tape hiss and head-switch bursts, camera handling,
  near silence and the head-tilt creak.
- **Loudness:** −16 LUFS integrated rather than the shorts' −14. With no voice,
  −14 would raise the room tone into hiss. This is a judgement for the user to
  confirm. Decoded AAC peak is −2.0 dBFS.
- **No listening pass:** this runtime cannot audition audio.

## Delivery check (from the encoded MP4)

- **File:** `transfers-acting-test-20s.mp4`, H.264 1920×1080, 600 frames, 20.00 s, AAC
  (`mix.m4a` muxed with `-c copy`). Poster at 16.5 s.
- **Render time:** 148 s for 600 frames (about 0.25 s a frame at concurrency 3).
  A 4-minute episode would take about 30 min.
- **Known weaknesses seen in frames from the MP4:**
  - In shot 1 the held tape is mostly hidden by his hand.
  - Under the CRT light his skin goes pale and grey.
  - The collar edge is still slightly stepped.
  - In shot 4 his head turns over the left shoulder but not fully round to the
    doorway, so the eyeline is approximate.
  - The tape's living room is sparse.

## Status

Not approved by the user. This is a capability test, not an episode.

## User verdict (2026-11-12)

> "Well its so ugly and i hope our final series dont look like that although ig it shows that theres a possibility that we can do it. Also for the look what if we made a stylized models instead of it being realistic … i kinda want it to be in toon texture/shader … i want it to look like a pixel art animation, with toon shading we can make it looks like an art."

- **Look:** v1 is rejected as ugly. The realistic MakeHuman look is not the series look.
- **Pipeline:** v1 is kept as proof that it works (rig, IK, face keys, render speed).
- **Next direction:** stylized characters, toon shading, a pixel-art look.

## User verdict on the sound (2026-11-12)

> "Btw what i hate the most in your test is the sound effects, in horror films those are one of the most important"

- **Why it failed (diagnosis; I cannot listen in this runtime):**
  - Most effects were synthesized: clicks, thuds, motor, hiss, hum, whine.
  - The rest were borrowed sounds made for other contexts: Curio's documentary
    or editorial cues, Episode 29's storm and breaths.
  - Nothing was recorded or generated for these actions: a cassette sliding into
    a VCR, a plastic case, a cheap office chair, cloth, a nervous breath.
  - There was no designed horror layer: no tension drone, sub-bass or silence
    shaping.
  - The mix was quiet (−16 LUFS).
- **Standard from now on:** see `docs/stories/original-series/transfers/SOUND.md`.
