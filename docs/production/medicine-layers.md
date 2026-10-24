# Medicine: separate raster artwork layers

[Download PNG layer package](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/scenes/medicine-layers-v1/medicine-png-layers.zip) · [Download 8-second environment-motion demonstration](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/videos/medicine-layered-environment-8s.mp4)

SVG is not required for independent animation. This delivery uses transparent PNG artwork, local masks, and Remotion transforms/texture deformation. Background objects have their own imagery and completed surfaces behind them. The approved source illustration remains unchanged.

The environment demonstration adds cloud drift behind the window mullions, trailing-vine sway, and separate windowsill foliage movement to the existing character/cell animation. The window frame, walls, bench and microscope remain anchored. It is an eight-second visual demonstration with the existing synthesized sound, no narration, titles, or new voice request. It is not a completed narrated episode, and user approval of these new layers/motion is pending.

## Package

Every PNG uses a **1672 × 941** canvas. The 14 images include:

- `environment-clean.png`: opaque completed room with the clinician, microscopy subjects, foreground foliage, hanging-vine foliage, windowsill foliage and clouds removed. The microscope, glassware, stool, pots and furniture remain part of the fixed set.
- `window-view.png`: separate alpha image of the two window panes with cloudless sunset scenery. Keep it clipped behind the fixed window frame when animating it.
- `window-clouds.png`, `hanging-vine.png`, `window-plant.png`: separate transparent environment objects, generated from the approved artwork. Their placement is adapted rather than pixel-identical extraction. Clouds are clipped to the window panes in the animation.
- `foreground-foliage.png`: original source colors isolated through the existing registered foliage mask. This retains the earlier mask's edge limitations.
- `immune-cell.png`, `microbe-upper.png`, `microbe-lower.png`, `red-cell-a.png`, `red-cell-b.png`, `red-cell-c.png`: separate alpha sprites exported from the existing generated production atlas, placed within the common canvas. The immune sprite has a completed inner well, so the two microbes can move independently without revealing holes.
- `clinician-cutout.png`: newly generated transparent character pose with no attached microscope or bench. The generator changed its framing/scale, so this is a **separate pose asset requiring registration/rigging**, not a drop-in replacement for the existing approved-art rig. The demonstration keeps the existing source-sampled clinician rig and blink assets.
- `environment-cutouts.png`: the original transparent environment extraction sheet, retained as the reproducible source for the three environment object exports. Use either the sheet or its individual exports, not both.

Combined images and individual exports are alternatives. Do not stack the extraction sheet over its exported pieces. The clean room still includes the microscope and glassware: moving those would need a corresponding clean-plate edit and their own cutouts first. This is a practical layer package, not a promise that every baked detail in the room already has an independent rig.

The existing clinician skinning, eye alternates, cells and their movement remain in [ArtworkMotion.tsx](../../src/ArtworkMotion.tsx). New local background movement is in [MedicineEnvironment.tsx](../../src/MedicineEnvironment.tsx). The PNG export component uses original image pixels or generated cutouts; it does not render traced SVG color regions. One existing geometry mask is reused for foreground foliage. No vector tracing or new vector drawing was performed for this delivery.

## Production approach

For new scenes, decide the moving parts before generation, generate the scene's approved visual reference, then request a clean environment plus alpha objects/pose sheets using that reference. Check placement, silhouettes, hidden surfaces and occlusion before animating. Do not convert the whole illustration to thousands of SVG paths. Generate pose alternatives and joint backfill only where the action needs them. This preserves image-generation artwork quality while reducing unnecessary reconstruction work; artwork generation still needs visual review and does not guarantee automatic exact registration.

## Reproduce

```sh
npm run assets:medicine-layers
npm run typecheck
npm run render:medicine-layers
```

`MedicineLayeredEnvironment` is the 240-frame, 30 fps, 1920 × 1080 Remotion composition. `MedicineLayerExport` renders native-size transparent PNG files. The previously delivered 20-second compositions and MP4s remain unchanged. Offline export uses committed artwork; image generation is not needed again.

[Environment-generation prompts](medicine-layers/generation.json) · [Character-cutout provenance](medicine-layers/character-generation.json) · [Layer manifest](../../public/assets/artwork/medicine-layers-v1/manifest.json) · [Validation](medicine-layers/validation.json)
