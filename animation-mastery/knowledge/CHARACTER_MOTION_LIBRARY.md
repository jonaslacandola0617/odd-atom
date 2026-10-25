# Measured motion cases and original performances

Use [evidence cases](EVIDENCE_INDEX.md), not this document alone, when adapting timing. Source cadence is 60 fps; original studies are 30 fps. Convert durations through seconds/PTS, never copy a source frame number onto the production timeline.

## Observed performances

**C01: a prop loses its value and the body responds.** At f2040/34s the core mask is 7,210 px and hand centroid y is 1117.98. At 2070/34.5s:2,299 px/y1149.55. At 2100/35s:1,987/y1164.10. At 2130/35.5s:210/y1328.83. That is modest displacement, a slower interval, then a much larger release. First zero-core threshold is2143/35.7167s; strongest eye-mask closure is2133–2135. These are image measurements with fixed ROIs, not recovered keyframes. The value for production is the phased relationship among attention, prop, hand and light—not a universal two-second arm drop.

**W01: small-scale locomotion.** At 770–771s two people cycle limbs at left on a sparse terrain diagram with little net travel. The scene makes people read as active and supplies scale. It does not provide sufficient close-up evidence for exact knee/ankle mechanics or a measured complete step period. Running, jumping, sitting and full turnarounds remain unvalidated in our current library.

**T01: deliberate reach.** At 909–911s the upper-right hand approaches the bright tablet, overlaps its edge and establishes shared proximity/contact while the lower-left hand remains. Hand shape and overlap communicate intention. No native release is contained here. Follow the longer scout before proposing a handoff reconstruction.

**E01: group activity.** At 416–418s the fire/sparks stay active while perimeter people become visible and inner people retain a warm focus. Small poses are offset rather than one whole-crowd sway. We have not separated every person's motion or counted exact gesture periods.

## Implemented original action A: protect a cup from a gust

Code: [acting.ts](../engine/animation/acting.ts); rendered test [A](../../assets/videos/animation-mastery/v1/A-character-acting-4s.mp4). Initial condition is a standing person holding a cup. A finite gust is visible in cloth/leaves; the character braces and lifts/protects the cup, then recovers and smiles. Key property events are authored independently:

| Control | Production frames at 30 fps | Value/role |
|---|---|---|
| Body lean |17→24→34→46→63→92|0.3° →1.8° anticipation →−4.3° peak →1.5° recoil →−.25° →0°|
| Head |Track evaluated at `frame−3`|Delayed head trajectory; does not duplicate the torso curve|
| Shoulder |21→27→39→66→92|0→1.4→−3.5→.6→.3 degrees|
| Elbow |24→34→47→72→92|0→−20→−5.3→−1.3→−1.2 degrees|
| Blink |[29,33), [67,71)|Anticipation/response closures; original choices, not source measurements|
| Expression |f69 onward|Registered happy alternative|

Feet remain locally fixed. Wrist counter-rotation reduces the cup tilt without deforming it. The encoded f23–46 contact sheet was inspected: the new sector bend removes the folded-arm failure and keeps a connected upper-arm/forearm silhouette. Expression range is still modest; this is not a general action library.

## Implemented original action D: witness a change

[D](../../assets/videos/animation-mastery/v1/D-a-little-light-12s.mp4) uses the same character identity and a shifted gust action. Additional head beats occur near 145–248; blink212–216 precedes the smile at 216. The environment carries the main cause: cloth uncovers a window, light reaches the plant, leaves lift at offsets and a bud opens. This is a **time-compressed illustrative fable**, not a real-time claim about plant recovery. The character does not physically open the curtain; do not describe a hand/object interaction that was not implemented.

## Adding a new action

Author the story beat first, then assign initial pose, attention/anticipation, action/contact, extension, follow-through, settle and final readable pose. Some actions should hold or stop abruptly; do not add a spring to every control. Specify missing drawings before asking the rig for a new angle or extreme reach. Name the tested action envelope in the catalog and keep unresolved locomotion/hand/angle work explicit.
