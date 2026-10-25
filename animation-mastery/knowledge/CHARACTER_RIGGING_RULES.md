# Connected character rigging

Evidence: [C01, D01, T01, W01](EVIDENCE_INDEX.md). Goal: preserve the continuous illustrated silhouette through an action. No reference proves a particular source skeleton, SVG tree or mesh package. Our choice is driven by the approved raster art and the motions we actually tested.

## Registration and coordinates

The existing character adapter is [MotionCharacters.tsx](../../src/MotionCharacters.tsx). Source atlas regions, local mesh coordinates and anchors must be treated as one registration. Scene placement is a separate transform: the new garden places Mira at `(620,990)` with scale `1.22`; the acting-only composition places her at `(860,990)`. Character-local ground anchors must remain constant during planted acting, even when the scene camera changes screen positions.

Order deformation and transforms explicitly: connected local skin deformation → local limb/head/prop controls → actor placement → layer depth/camera. Do not apply a camera move to a hand but omit the object it grips. `miraHandAnchor(pose,true)` evaluates the same extended skin transform used by the character; steam is born at that resulting cup position.

## Extended bend and the failure it fixes

The stronger original wind action reaches elbow −20°. A linear blend of elbow rotation folded part of the arm at that pose; the first rendered gesture therefore failed. [bendSkin.ts](../engine/animation/bendSkin.ts) implements a separate periodic angular-sector weight: rise from φ−75° to φ−30°, full weight around the forearm, fall from φ+30° to φ+105°. It avoids the `atan2` branch seam. Shoulder-side points stay fixed; the cup's corners receive the same rigid transform rather than different blend amounts.

`skinMode="extended"` opts the new A/D studies into this deformation. The default approved mode remains unchanged. Do not replace its math globally or silently widen the envelope. [engine-geometry.json](../validation/quality-audits/engine-geometry.json) covers **401,280 triangles** over the actual new poses: minimum signed-area ratio **0.370456**, local foot displacement **0**, maximum cup-edge length error about **9.95×10⁻¹⁴**. The old default regression separately passes **501,600 triangles**. Positive area is a useful fold guard; it does not prove seamless texture registration or attractive posing.

## Hierarchy, joints and contacts

[constraints.ts](../engine/animation/constraints.ts) resolves local parent/child matrices with unique-ID/cycle checks and offers a two-bone solver with unreachable-target clamping. These helpers are available; the Mira study uses the connected registered skin rather than replacing it with two rigid rectangles.

For a newly drawn arm, put the pivot inside an overlapping shoulder mass, continue sleeve/skin behind the adjacent layer, and keep enough hidden material for maximum bend. Forearm and upper arm should meet as a continuous contour, using compatible fills, connected deformation or authored pose variants. Use a hand swap when the contact shape changes materially. Do not stretch a mitten into a grasp or rely on one-pixel overlap at render resolution.

An object handoff requires three explicit phases: holder contact, shared contact, receiver contact after release. T01 supplies approach/contact evidence only; the later proxy scout becomes a visual transformation. Our present studies do not prove a two-person handoff rig. Likewise, W01 does not validate IK foot plants in a close-up walk. Keep these gaps in the asset/rig catalog.

## Review envelope

Render neutral, anticipation, maximum extension, overlap reversal and settle frames at final resolution, plus consecutive frames at the highest bend/contact change. Inspect shoulder fill continuity, elbow silhouette, wrist/cup attachment, face registration, hair/neck overlap and planted feet. Geometry checks run before rendering; visual inspection runs on the **encoded MP4**, because render setup/encoding can introduce problems absent from source previews. Preserve a failed example and explain the correction rather than deleting the evidence.
