# Odd Atom visual system v2: reference study and channel audit

Date: 2026-11-10. This builds on the earlier motion research in `animation-mastery/`. That work covered timing, contact and transitions. This document covers what it did not: **colour, light, depth, composition and character finish**, plus a direct audit of the channel's own published shorts.

## Sources actually inspected

| Collection | What | How it was sampled |
|---|---|---|
| Reference archive (`video-samples.zip`, sha256 `3859b43e…04a0`, same bytes as the earlier acquisition) | 5 long-form 1440p/60 videos from the channel the user named: *AI Just Crossed the Terrifying Line*, *Trees Are So Weird*, *Humanity's First Civilization*, *Why Are There No Holes Around Trees*, *You Will Only Like Half of This Video* | 30 evenly spaced frames per video (`evidence/reference-N-sheet.jpg`) plus native 2560×1440 detail crops |
| Odd Atom Drive folder `posted/` | 16 published shorts (1080×1920, 67–91 s) | 10 evenly spaced frames per video |
| Odd Atom Drive folder (root) | 5 unposted shorts (*universe-could-end*, *bathroom*, *caffeine*, *moon-gone*, *venus-survive*) | same |
| Odd Atom Drive `samples/` | 8 short reference clips | already inventoried in `animation-mastery/references/prior-uploads-manifest.json`; not re-analysed here |

Downloads stayed in the session scratchpad. No reference footage, character or artwork has been traced or reused. The reference channel's bird characters, logo and title designs are their identity and must not appear in Odd Atom videos; what transfers is technique.

## Measured difference (sampled frames)

Frames were resized to 96 px wide before measurement. The reference is landscape and Odd Atom is portrait, so treat these as indicators, not a score.

| Measure | Reference (120 frames) | Odd Atom v1 (210 frames) | Reading |
|---|---|---|---|
| Mean saturation | 0.66 | 0.67 | Same. Odd Atom is already as saturated. Saturation is not the gap. |
| Mean luminance | 0.36 | 0.33 | Similar overall brightness. |
| Hue entropy of saturated pixels (bits, 12 bins) | **1.84** | **1.07** | Reference frames combine more hue families per frame (warm subject vs cool field, accent colours). Odd Atom frames are mostly one hue family plus a yellow label. |
| Edge density (share of pixels on a visible edge) | **0.30** | **0.15** | Reference frames carry about twice the drawn structure: environments, secondary shapes, texture, foreground elements. |
| Share of near-black pixels (L < 0.15), median | 0.43 | **0.61** | Odd Atom frames are mostly empty dark field around one centred object. |

Script: kept in the session scratchpad only. It is a 40-line PIL/NumPy measurement and can be rewritten from this description.

## What the reference does (observed in the sampled frames)

### 1. Every shot has a light source, and everything responds to it
- *Trees Are So Weird*, frame ≈4:47: a white-yellow light opening behind the subject, visible diagonal light shafts, a dark navy branch whose top edge catches a pale rim, and leaves with a lighter half and a darker half (`evidence/reference-2-depth-and-light-detail.jpg`).
- The kingfisher (≈0:22) is flat-filled but every mass has one secondary shape: a darker underside, a lighter wing panel, and short rounded highlight strokes on the feathers. There are no black outlines (`evidence/reference-2-character-shading-detail.jpg`).
- AI video: screens and eyes are the light sources. Faces get a green or cyan rim from the device and fall to dark navy elsewhere.

**Odd Atom v1:** planets, the Sun, characters and props are lit evenly from nowhere. No terminator, rim or cast light. A planet "next to" the Sun is shaded the same as one in deep space.

### 2. Depth is built from layers, not from one object on a backdrop
- Foreground occluders that are **out of focus** (blurred branch and leaves in the kingfisher shot; blurred orange leaves top-left in the maple shot), a sharp midground subject, and an atmospheric background that is lighter and less saturated.
- Floating particles at several sizes and blur levels.
- Landscape establishing shots (*Trees* 0:00–1:10, *Civilization* 0:30–3:30) stack 3–5 silhouette layers with aerial perspective.

**Odd Atom v1:** one plane. Radial sunbursts or a flat dark field behind a centred object. No foreground, no defocus, no atmosphere.

### 3. Colour is scripted per scene around one contrast
- Warm subject on cool field or cool subject on warm field: yellow-orange sky behind teal-navy branches; magenta-violet trunk cross-section on deep indigo; green-lit people in a navy room.
- Explanatory diagrams sit on a near-empty dark field with only 1–2 accent colours (*Trees* tracheid/vessel comparison, ring diagram). The scene changes palette when the subject changes, not every few seconds.

**Odd Atom v1:** the background colour changes almost every sentence (violet → blue → magenta → orange → teal in the first 30 s of *glass rain*), but each frame is a single hue plus yellow labels. This reads as busy and flat at once.

### 4. Composition uses scale, cropping and off-centre placement
- Subjects are often cropped by the frame: a huge planet limb, a trunk filling one side, a character in the lower third with the environment above.
- Scale contrast tells the story: a tiny human against a 40 m tree, with a single measuring line.
- Diagrams are centred; story shots usually are not.

**Odd Atom v1:** nearly every shot puts one object at screen centre with a label pill above and the caption below. The template repeats in all 21 shorts.

### 5. Text is rare and purposeful
- Labels are small, attached to their object with a leader line, and appear only when naming something new (Lignin/Cellulose, Tracheids/Vessels, Crown/Trunk).
- Big typography is reserved for chapter cards.

**Odd Atom v1:** stacked yellow stat boxes, hazard-tape "PLOT TWIST / HOSTILE / BLOCKED" banners, pill labels and captions often appear together.

### 6. Characters are constructed, not assembled
- Few shapes, but each has a clear silhouette, a secondary shading shape, small highlight shapes and an expressive pose. Faces are simple dots-and-curves but heads tilt, arms gesture and bodies lean.
- Characters live inside a lit environment and pick up its colour.

**Odd Atom v1:** the recurring kid and astronaut are small, mostly frontal, in the same neutral standing pose, and slide or bob rather than act. Their colours never change with the scene light.

### 7. Motion is continuous camera travel through one world
Covered in depth in `animation-mastery/knowledge/`. The relevant summary: the reference moves the camera through a scene (push-in, pull-back, zoom-through into a detail) far more often than it cuts between unrelated cards. The channel audit shows Odd Atom v1 mostly hard-cuts between centred cards.

## Odd Atom visual system v2 (the standard going forward)

Original to Odd Atom; it borrows principles, not designs.

1. **Light first.** Choose one key light per shot. Every round body gets: a lit hemisphere toward the light, a soft terminator, a crisp rim on the lit edge, a faint coloured bounce on the night edge and an atmospheric halo if it has an atmosphere. Implemented by `GasGiant` and `Sphere` in `src/oddatom/kit.tsx`.
2. **Three depths minimum.** Background (gradient field, nebula or sky, stars), sharp midground subject, and either blurred foreground elements or bokeh particles. `Starfield`, `Bokeh`, CSS blur layers.
3. **One colour contrast per scene.** Warm against cool. Keep the background family for the whole beat. Accent colour only on the thing being explained.
4. **Move the camera, not the cards.** Prefer push-ins, pull-backs, zoom-throughs and match cuts inside one world. Use hard cuts only for deliberate jumps in scale or place.
5. **Off-centre story shots, centred diagrams.** Crop big objects with the frame edge; use scale contrast.
6. **Text budget.** Title on the first frame (approved heavy rounded treatment with outline passes and offset shadow), plain captions with a thin dark edge, and at most one small attached label when a new name is introduced. No stat boxes, hazard tape or progress bars.
7. **Characters act.** At least one readable pose change per beat (look down, shrug, dive), with shading shapes and scene-coloured light.
8. **Accuracy.** Pictures must agree with the narration (day/night side, scale). Simplified maps and cutaways are stylised and should not be described as measured.

## First demonstration

`OddAtomJupiterV2Opening` rebuilds the first 23.5 s of the published *What if you fell into Jupiter?* short with this system, on top of the published v1 audio so the two can be compared directly. See `docs/production/odd-atom-style-v2/README.md`.
