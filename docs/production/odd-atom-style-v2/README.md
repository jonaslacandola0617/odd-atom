# Odd Atom style v2: Jupiter opening rebuild (style test)

**Delivery:** `assets/videos/odd-atom-style-v2/jupiter-opening-v2-23s.mp4` (1080×1920, 30 fps, 705 frames, 23.509 s, H.264 + AAC, BT.709 limited range) and poster `jupiter-opening-v2-23s-poster.png`.
sha256: MP4 `01573aba…26c0a`, poster `33e7620f…b9e1`.

**Status:** a 23-second style test, not a finished short. It has **no user approval** yet.

## What it is

The first 23.5 s of the published Odd Atom short *What if you fell into Jupiter?* (`jupiter-fall_v1.mp4`, Drive `posted/`, sha256 `55f2ca45…280a`) rebuilt with the v2 visual system in `docs/style/README.md`. Its audio is the **unchanged v1 audio** (narration, music and effects), cut at 23.5 s with a 0.4 s fade (`public/assets/audio/odd-atom-jupiter-v2/jupiter-fall-v1-opening-23s.m4a`, sha256 `d9c094c2…7e32`). Using the same audio isolates the visual change for comparison. The v1 music and effects were timed to the old pictures, so some hits will not line up with the new shots. No new voice was generated and no speech credits were used.

Captions were re-timed from the burned-in v1 captions (sampled at 4–10 fps) and regrouped into fewer, complete phrases.

Comparison: `docs/style/evidence/jupiter-before-after.jpg` (top v1, bottom v2, same timestamps in both rows).

## Shot plan

| Time | Narration | v2 picture |
|---|---|---|
| 0.0–2.7 | What if you fell into Jupiter? | Title (approved heavy rounded treatment). Astronaut floats above a huge diagonal Jupiter limb, lit from the upper left with a rim and halo; slow camera roll. |
| 2.7–5.8 | First problem: there's nothing to land on. | Camera pulls back to the whole planet. The astronaut looks down, then shrugs. A cutaway wedge opens; the interior layers blend into each other with no surface line. |
| 5.8–10.75 | Jupiter is a giant ball of gas, mostly hydrogen and helium. | Focus-locked zoom through the cutaway into the gas layer. H₂ pairs and He atoms at three depths of field (about one He per 7–9 H₂, illustrative). H₂ glow on "hydrogen", He on "helium". |
| 10.75–14.55 | No ground. Just… down. | Accelerating descent through cloud decks that darken from cream to near-black. No floor ever appears. |
| 14.6–18.4 | You'd hit the top of the atmosphere at about 60 km/s. | Head-first dive toward a curved, banded horizon. Heating glow, streaks and slight shake build from "60 km/s". |
| 18.4–23.4 | Fast enough to cross the entire United States in just over a minute. | Warm flash cut to a stylised map of the contiguous US. A glowing streak crosses from the San Francisco area to the Washington area at constant speed. |

## Technique (new reusable code)

- `src/oddatom/kit.tsx`: `GasGiant` (tilted latitude bands, rotating storms, soft terminator, rim light, night-side bounce light, atmospheric halo, interior cutaway), `Sphere`, `Starfield`, `Bokeh`, rebuilt `Astronaut` with poses, `Title`, `Caption`, keyframe/easing helpers.
- `src/OddAtomJupiter.tsx`: composition `OddAtomJupiterV2Opening`.
- Commands: `npm run still:oddatom-jupiter` (review stills to `out/oddatom/`), `npm run render:oddatom-jupiter` (final MP4 and poster). The script uses `/usr/bin/chromium` or the pre-installed headless shell under `/opt/pw-browsers`.

## Review of the encoded file

Checked by decoding the final MP4 and inspecting frames; this is not a viewer or user review.

- Full decode without errors; 705 video frames; audio present (integrated loudness −13.8 LUFS, the same as the v1 source excerpt).
- Transitions inspected frame by frame (180–215, 312–336, 432–442, 545–562). Two problems in the first encode were fixed: the zoom-through drifted off target and stalled on the planet edge, and the cut to the map had a long washed-out white fade.
- Measured on 30 sampled frames against the same span of v1: median near-black share fell from 0.64 to 0.27 and hue entropy rose from 1.0 to 1.2 bits. Hard-edge density fell (0.20 to 0.14) because v2 replaces text boxes with soft gradients and blur. The test therefore **does not** close the detail/texture gap measured against the reference (0.30).

## Known shortcomings

- The v1 astronaut face (larger eyes, blush, more expression) reads better at small size than this rebuild. The new suit has better shading, but the face needs another pass before production.
- The cloud-descent shot is the weakest: soft and murky, with little detail or texture.
- Environments are still sparse compared with the reference: no surface texture, grain or painted material detail.
- The interior cutaway, molecule ratio, map outline and cloud colours are stylised illustrations, not measured diagrams.
- Music and effects come from v1 and are not re-timed to the new picture.
- No direct audio listening pass is possible in this runtime.
