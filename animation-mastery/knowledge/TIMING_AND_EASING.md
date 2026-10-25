# Timing, spacing and motion paths

Evidence: [C01, A02, A04, A06, P01, H01](EVIDENCE_INDEX.md). The source cadence is60fps; our originals are30fps. Use PTS to compare durations. Small image changes, interpolation and encoding mean adjacent source frames need not be identical even during a designed reading hold.

## What is measured

C01's hand centroid descends about 31.57 px in the first half-second,14.55 px in the next, then164.73 px over the following half-second. Camera, hand shape, crop and masking can contribute, so this is not a recovered joint-speed curve. It does establish strongly unequal spacing. The core changes area on another schedule; blink closure near 35.55s overlaps the more decisive release. One generic ease applied to every property would erase that relationship.

A02 holds the furnished state at 175.5s, removes belongings in stages through roughly176.5s, then holds a human in the empty shell. Disappearance includes shrinking and sparkles; it is not simply one alpha fade of the entire room. A06 preserves the compact group until around 899.55s, expands through about 900.2s, then holds the larger array. These phase boundaries are visual brackets, not original authored keyframes.

A04's boat keeps rotating while translating, and its curved wake records the path. Native211–213s evidence establishes approach/damage/consequence. Broader proxy sampling shows the loop; a full native loop period is still unmeasured. P01 shows devices, papers and a gold object arriving with different rotations and start times. H01 provides a largely held structure that should not be given a bounce merely because an animation helper exists.

## Implemented timing tools

[curves.ts](../engine/timeline/curves.ts) evaluates pure per-property tracks and supports hold, linear, smooth, acceleration, deceleration and custom cubic curves. Each segment declares its own interpolation. `hesitantRelease` is an authored profile informed by C01's slow/release pattern; it is not a fit to an original easing function.

[paths.ts](../engine/animation/paths.ts) offers cubic sampling, an arc-length lookup, compatible contour interpolation and continuous tapered ribbons. Equal time steps on a raw Bezier do not generally yield equal spatial steps. RootWorld uses approximate arc-length sampling to stage growth by distance, then separate contact and branch phases. Tangent-relative orientation is available to callers through sampled geometry; do not rotate every object by an arbitrary sinusoid.

[dynamics.ts](../engine/animation/dynamics.ts) provides analytic damped settling and a finite gust. Use settling for a consequence with an identifiable onset and a defined decay; use a bounded gust to coordinate cloth, leaves, steam and acting. These are deterministic authored approximations, not proof of a physical solver or source spring constants. Secondary motion follows the primary action with offsets, rather than resetting all parts on one global loop.

## Production timing examples

In B, approach isf5–51; contact response begins near 52; branch growth begins68 and reaches the destination near 144; return pulses begin145. At 30 fps this creates a visible pause of roughlyhalf a second between contact and the alternative. A's body/head/shoulder/elbow have different tracks and blink intervals; see [motion library](CHARACTER_MOTION_LIBRARY.md). D delays the light and plant response relative to the gust; leaf offsets prevent a single rigid unfolding.

These timings are original choices and have not been validated with viewers. The 12-second plant recovery is stylized time compression. Future educational production must distinguish explanatory exaggeration from literal rate/force claims, and must retime for the recorded narration rather than stretching an entire composition to fit audio.
