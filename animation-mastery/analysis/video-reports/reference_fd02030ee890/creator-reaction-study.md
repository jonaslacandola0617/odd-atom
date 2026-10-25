# Creator reaction: a state change affects the actor and the scene

Source: `You Will Only Like Half of This Video.mp4`, video ID `reference_fd02030ee890`, SHA-256 in the archive manifest. The candidate containing the creator is `[1754,2219)` / 29.233333–36.983333 s. This note concerns the **consecutive, native-resolution interval `[2040,2160)` / 34.000000–36.000000 s**. It is a detailed case, not a claim that the rest of the film has been exhaustively interpreted.

Evidence: [five consecutive-frame sheets](../../keyframes/reference_fd02030ee890/creator-reaction/evidence.json), [first sheet](../../keyframes/reference_fd02030ee890/creator-reaction/consecutive-001.jpg), [fourth sheet](../../keyframes/reference_fd02030ee890/creator-reaction/consecutive-004.jpg), [fifth sheet](../../keyframes/reference_fd02030ee890/creator-reaction/consecutive-005.jpg), [native first crop](../../keyframes/reference_fd02030ee890/creator-reaction/native-crop-000000.png), [native last crop](../../keyframes/reference_fd02030ee890/creator-reaction/native-crop-000119.png). Crop coordinates are `[800,180,1800,1440)` in the 2560×1440 source. The top of the hair is cropped; these crops cannot establish a full-body head ratio.

## What is visibly constructed

The human has a large pink face bounded by a darker rear hair mass and a brighter violet front fringe. The front hair is an asymmetric connected silhouette with broad lobes; it is not a set of independent strands. Two dark violet filled eye shapes have no visible white sclera in these frames. Brows are thick rounded filled marks. The nose is an asymmetric vertical bean shape, the cheeks are separate pink patches, and the mouth is a small filled curved shape. There is no continuous dark outline around the face or clothing.

The shirt uses a large cyan/blue shape, a pale rounded collar band, and a darker cyan inner boundary. The bent arm meets the torso through compatible fills and overlap; the wrist terminates in one connected pink hand silhouette with several rounded digit lobes. The hand changes position substantially without visibly turning into disconnected pieces. This is an observation of the flattened result, not evidence that the source used SVG, a particular skeleton, mesh deformation or a specific path topology.

The scene contains more than a character on a flat field: a telescope, floating book/art panels, a radial light field and small particles frame the central human. Their positions support the luminous object at the chest. They do not all carry the same contrast or detail as the face and glow. The book/panel edges retreat toward the frame edges as the small luminous core diminishes.

## Coordinated motion, measured at source cadence

At f2040 (34.000 s), the luminous core is visible beside the raised hand and a cyan light wash crosses the face/hair. Over the interval, the core shrinks, the hand lowers, the brows/mouth retain a distressed expression, and the surrounding light/rays lose prominence. The arm's descent is not a single uniform slide. A blink occurs near the later, faster part of the lowering action.

[Core/hand measurements](../../motion-tracks/reference_fd02030ee890/creator-core-and-hand.json) use fixed native-pixel ROIs and color thresholds, not recovered rig controls:

| Frame / time | Bright-core mask area | Hand centroid y | Observation |
|---|---:|---:|---|
| 2040 / 34.000 s | 7,210 px | 1,117.98 px | Core and raised hand both clear |
| 2070 / 34.500 s | 2,299 px | 1,149.55 px | Core much smaller; hand has moved down about 32 px |
| 2100 / 35.000 s | 1,987 px | 1,164.10 px | Reduced hand displacement over the next half-second |
| 2130 / 35.500 s | 210 px | 1,328.83 px | Larger descent, core nearly gone |
| 2159 / 35.983 s | 0 px | outside mask | Hand has left the selected lower-frame region |

The hand mask area remains approximately 39,000 px through f2130 while its centroid moves. That supports a relatively stable visible hand size during this part of the motion; it does **not** prove a rigid hand rig. The first zero bright-core threshold sample is f2143 / 35.716667 s. Threshold disappearance is not the same as a known authored opacity reaching zero.

The [eye-mask series](../../motion-tracks/reference_fd02030ee890/creator-eye-mask.json) falls below 30% of its initial open-eye area at **f2133–2135 / 35.550–35.583333 s**. The consecutive sheets show a closing/reopening action around those frames. Those three samples are the strongest measured closure, not the entire blink duration.

## Storytelling function and what an original scene can reuse

The visible progression is **a valued light diminishes → the supporting gesture drops → the face and surrounding illumination reinforce the loss**. Without narration, the scene communicates depletion/disappointment, though it does not independently identify the speaker's specific argument about AI and creativity. The unverified ASR around 25–50 s provides that verbal context; it is not used as exact word-level timing or as a factual endorsement of the source's claims.

For a new production, animate an explanatory state variable and connect it to multiple visible consequences: prop state, hand/body response, expression and environmental lighting. Give the hand a small early displacement, a readable slow interval, then a more decisive release. Keep the actor's identity and connected silhouette consistent. This is an implementation choice derived from the observed event; it is not a recovered original easing curve.

Do not infer a general requirement that every reference character has pupil-only eyes, that every scene needs radial rays, or that all characters must be centered. Those are local design choices. Other source scenes and human designs must supply the counterexamples before the shared design guide is finalized.

Unresolved here: the actual source rig, exact shoulder/elbow pivots, hidden hand geometry, source path interpolation, whether individual background elements were parented to a camera controller, and perceptual audio relationships. These require more evidence or cannot be recovered uniquely from flattened video.
