# Quality gates and honest limits

Technical success, visual integrity, reference equivalence and user approval are separate claims. See [delivery](../validation/quality-audits/delivery.json), [geometry](../validation/quality-audits/engine-geometry.json), [pixel determinism](../validation/quality-audits/pixel-determinism.json), [visual audit](../validation/quality-audits/visual-audit.md) and [remaining work](../remaining-work.json).

## Required evidence before accepting a result

**Artwork:** inspect a final-size frame and selected native crops. Check silhouette, face/hair identity, color planes, material finish, overlap and useful detail density against the appropriate source family. The user's approved master art must keep its hash. A new scene/angle still needs review; reusing an approved atlas does not approve the full animation.

**Motion:** inspect consecutive frames at maximum deformation, contact, reversal and settle. Verify the cause/action/result relationship. Different properties need useful offsets and spacing; background motion must establish place or support the event. A continuous camera push over one flattened image does not establish object animation.

**Composition:** identify attention order and comparison anchors. Check incoming information, occlusion, negative space and the next shot's focus. A06's population reveal, A02's stable room shell and F01's destination opening are concrete checks, not a mandate for one layout.

**Technical:** check positive mesh triangles, stable contacts, correct pivot spaces, prop rigidity, unique scene IDs, no clipping/transparency gaps, deterministic frame evaluation, expected frame count/duration, full decode and audio headroom. Geometry tests are necessary for the new extreme gesture because an actual fold was found. Do not add mirrored tests that merely assert constants unrelated to a plausible failure.

**Sound:** source listening and final listening are separate from amplitude/spectral/ASR analysis. Inspect narration intelligibility, useful sound-event timing, ambience, musical change and ending tail through actual audition. This runtime cannot award that listening pass. Existing source cues have provenance; no model/API credit use should be hidden.

## Failures corrected in this iteration

The first renders had clustered/empty soil, pointed star-like flower petals, an unmotivated curtain placement, a rectangular miniature incoming scene inside the mask, and a folded arm at the stronger gesture. The corrections are documented with preserved evidence: improved seeded distribution/ground context; rounded overlapping petals; cloth anchored at the real window; unbounded aligned incoming world; opt-in continuous arm bend preserving the approved default. These are specific improvements, not proof of mastery.

## Differences still unresolved

Our B has cleaner/sparser soil, a more diagrammatic branch junction and less organic contact complexity than source R01; its detour is a different story. The source character range is much wider than Mira's tested performance. Close-up walking, running, jumping, turns, hand variants, shared-object release, richer expressions and source-quality across-angle consistency are not validated. The terrace still contains static painted scenery. The 12-second flower fable compresses time and has a watching character rather than a character-caused solution. No audience test proves silent comprehension. No direct audio audition has occurred. Full shot semantics and transition timing across 65.6 minutes remain incomplete.

Do not erase these differences with a numeric similarity score. Pixel MSE between different original people/scenes is not artistic equivalence. Use geometric measurements for proportions/registration, timestamps for timing, masks/flow for constrained movement hypotheses, and perceptual inspection for drawing, acting and story clarity. A final “pass” belongs to the user; this research session preserves a reproducible foundation and reviewable tests without claiming permanent model retraining.
