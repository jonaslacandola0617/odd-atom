# Camera, layers and transitions

Evidence: [F01, A03, A05–A06, T01](EVIDENCE_INDEX.md), full-duration navigation review. A common image transform is not proof of a source camera. A flattened frame can be made by camera travel, scene scaling, layer transforms or mixtures of them.

## Separate motion models before naming a camera

F01 was first tracked using rectangular foreground/rear regions. Some rear rectangles contained foreground foliage; their raw medians mixed depth planes and were rejected as clean layer estimates. The refined rear-trunk subset retained10 candidates and 6 RANSAC inliers for f90→f110. Its native-pixel model is approximately:

```text
x' = 1.060076 x − .017049 y − 152.774
y' = .017049 x + 1.060076 y − 53.928
```

Rear inlier median residual is3.63 px. Twelve surviving foreground tracks have median residual **390.65 px** against that model, p90 **433.42 px**. Tracking was at 512×288 then expressed at native2560×1440. This supports differential layer/parallax-style movement; it does not uniquely identify a source camera or lens. See [registered comparison](../analysis/composition-diagrams/forest-registered-layer-comparison.png).

In production [controller.tsx](../engine/camera/controller.tsx) applies explicit camera position, zoom, origin and layer depth. Use `projectPoint` whenever an overlay/carrier must remain attached to a world point. Do not approximate its screen position with a second unrelated animation. A's planted feet can remain stable in local space while their screen position changes under camera framing.

## Transitions observed versus inferred

A03 contains a confirmed hard cut at f12366/206.1s from scoreboard to top-down course. That is useful and intentional; not every transition must be a morph. A06 continuously changes staging to reveal a larger array. A05 changes the connector/fragments and retracts a label within the same composition. T01's longer911–917s proxy scout changes hand surfaces into blue cosmic/figure motifs before another human scene. The scout supports the transformation relationship, but it is not a native-frame reconstruction of every edge or release.

Whole-video storyboard navigation shows many graphic scale changes, diagrams, chapter headings and live-action cuts. Sparse thumbnails cannot determine the exact wipe/mask timing between each pair. Those transitions remain in the semantic review queue. Do not write a universal catalog of source easing/pivots from them.

## Original object-driven transition C

[CarrierPortal.tsx](../engine/transitions/CarrierPortal.tsx) exposes a deterministic growing mask, while the scene owns the narrative carrier and path. C uses the plant's actual leaf-tip geometry to locate a growing dewdrop. A cubic path carries it to soil by productionf80; a ripple marks contact. Fromf85→118 the water material expands into a pool that reveals the underground explanation. The incoming scene is aligned around its water destination `(1670,570)` and scales3.4→1 during the reveal. The camera follows the authored composition, not a generic cut preset.

The first render failed because the incoming world was a small rectangular image inside a circular mask. That looked like a presentation slide. The corrected scene uses an unbounded soil field and aligned zoom, so the mask reveals material continuously without visible rectangle edges. See [iteration failures](../validation/comparison-reports/iteration-01-failures.jpg) and [encoded transition](../validation/comparison-reports/transition-encoded-sequence.jpg).

The final transition is still an original symbolic water portal, not a measured recreation of a particular source transition. Review carrier attachment, momentum, material/shape continuity, incoming scale and the viewer's next focus. Maintain direction or explain a reversal. Do not add a wipe merely to conceal an unrelated scene boundary.
