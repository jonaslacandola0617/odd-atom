# Working Remotion architecture

Entry: [MasteryStudies.tsx](../../src/MasteryStudies.tsx), registered in [Root.tsx](../../src/Root.tsx). The four compositions render deterministically from frame number. The current implementation deliberately mixes registered raster art and connected deformation with procedural vector props, masks and paths. It does not require re-drawing every approved illustration in SVG.

## Modules and coordinate contract

| Module | Implemented responsibility | Practical limit |
|---|---|---|
| `engine/timeline/curves.ts` | Pure per-property keyframe interpolation with segment-specific timing | No visual authoring editor or recovered source curves |
| `engine/animation/paths.ts` | Cubics, distance lookup, continuous ribbons, compatible contour morphs | Morphs require compatible topology; hidden correspondence is not solved |
| `engine/animation/dynamics.ts` | Finite gust, analytic damped settling, seeded distribution | Authored response functions, not full physics |
| `engine/animation/constraints.ts` | Hierarchical matrices, unique IDs/cycle guards, two-bone IK | Helpers do not constitute a validated walk/hand-off rig |
| `engine/animation/bendSkin.ts` | Extended continuous arm-sector deformation | Tested on actual A/D pose envelope only |
| `engine/animation/acting.ts` | Wind/cup and garden reactions, blink/expression schedules | Two original performances; limited drawing variants |
| `engine/renderer/Layers.tsx` | Named z-sorted layers with explicit depth | Caller authors useful content/occlusion |
| `engine/camera/controller.tsx` | Position, zoom, origin, layer depth and pure point projection | 2D simulated camera, no source camera reconstruction |
| `engine/transitions/CarrierPortal.tsx` | Frame-addressed growing reveal mask | Scene must supply causal carrier/path/alignment |
| `engine/export/render.cjs` | Still and H264/AAC video export | Requires local Chromium, existing assets and dependencies |

World coordinates are1920×1080, origin top-left, x right/y down. Character coordinates are local to registered source skins. Scene placement and camera transforms are explicit. Layer IDs and SVG definitions are unique per scene instance; avoid cross-scene mask/filter collisions. Never use wall clock, unseeded randomness or previous rendered frame state.

## Hybrid asset strategy

The approved character atlas, expression/blink overlays and terrace plate remain unchanged. The character adapter now accepts optional pose/blink overrides, optional steam and an opt-in extended bend. Existing defaults preserve old behavior. New procedural plant, cloth, roots/rock/water and texture marks are separately addressable. The background plate still contains static painted material; independence is available only for prepared layers and new overlays.

Use a connected skin for modest body/limb deformation and authored alternatives for silhouette-changing poses, faces, hands or angles. SVG/procedural paths work well for a root, diagram connection or reveal. New frame-by-frame sprites can be introduced for actions that require redraws; the current deliverable does not already contain a validated sprite-action library. WebGL/skeletal-only architecture would not solve missing illustration or hidden surfaces. Our existing Remotion/Canvas mesh adapter preserves the approved finish more reliably within its tested range.

## Reproduce the studies

```bash
npm ci
npm run typecheck
npm run research:test
npm run mastery:sound
npm run mastery:geometry
npm run mastery:render
npm run mastery:review
npm run mastery:determinism
# Open Remotion Studio and select MasteryCharacterActing / MasteryVisualExplanation /
# MasterySceneTransition / MasteryShortNarrative.
npm run dev
```

Render one study with `npm run mastery:render -- --kind transition`. Export source stills with `npm run mastery:still`. Encoded review boards are separate from source stills and require actual visual inspection. Running the technical review script resets its artifact to “visual review pending”; use the persisted human/model visual audit only when its movie hashes still match.

## Audio and export

`study_sound.py` reuses original project library cues/music and preserves mixes plus effects/atmosphere/music stems. It makes no external generation requests. Event placements and source hashes are in [sound-design.json](../validation/animation-tests/sound-design.json). The music/SFX target uses the user's current.85 relative RMS preference; this is a mix calibration, not perceived loudness equivalence. No narration is generated. No reference soundtrack is copied. Direct audition remains pending.

Actual deliverables are1080p30 H264/yuv420p with 48 kHz stereo AAC. Geometry, full decode, source-art hashes, durations/frame counts and clipping checks pass. A repeated peak frame rendered before/after another frame has identical decoded RGBA in this runtime. That establishes a practical determinism sample, not guaranteed cross-platform bit identity.
