# PSX protagonist — pixel-atlas UV retarget

The uploaded Jim Wing model is remapped to the **replacement pixel texture** supplied through Google Drive (`1ILEojXpcWdaxXDZmyzi7Q-W1HK1cPInw`). The earlier realistic atlas is superseded and is not used in the delivered models. The supplied PNG is unchanged; this is a mesh UV edit, not a repaint of the atlas.

## Files

- `PSX_Retextured.blend`: editable Blender model, packed textures, original UV layer retained, `Attached_Atlas_UV` active. Opens with a framed material-preview view.
- `PSX_Retextured.glb`: self-contained export with the exact replacement PNG embedded. Use this import option for Blender 2.93.
- `PSX_ReviewSheet.png`: original versus remapped front view, three-quarter, back, profile, reimported head, atlas and UV diagram.
- `Attached_Texture.png`, `Attached_Atlas_UV.png`: exact user-supplied atlas and an overlay showing the actual new triangle UVs.
- `previews/`: individual renders. `glb-reimport-head.png` was rendered after importing the delivered GLB.
- `Verification.json`, `PROVENANCE.json`: file hashes, source attribution, geometry/image verification and remaining visual limitations.
- `source/`: unchanged extracted model, original texture and its license.

## Scope and mapping

The original **481 imported vertices, 744 triangles**, vertex positions, normals, transforms and A-pose are retained in the native model. The source has no armature or animations. No rig, glasses or watch has been invented. This is separate from the custom Nico v1/v2 models, which remain unchanged.

The formerly mirrored half-face map is expanded using anatomical face landmarks into distinct left/right areas of the supplied atlas. The replacement pixel image places its eyes, nose and mouth differently from the realistic image; the feature coordinates were refitted. Rear scalp, neck, shirt front/back, short-sleeve appearance, exposed arms, hands, jeans, shoe tops/sides and soles receive separate charts. Original UVs remain available as `Original_UV`.

The material retains the source's unlit presentation and uses nearest texture filtering so its painted pixel blocks remain crisp. GLB uses `KHR_materials_unlit`, nearest magnification and nearest-mipmap-nearest minification. In Blender the shader's image interpolation is `Closest`. No texture upscaling, AI generation, pixelization or recoloring was applied.

## Inspection and practical limits

Front, back, profile, three-quarter, head and reimported-head renders were inspected. Revisions corrected shoe-face stretching, fingertip background bleed, rear scalp sampling, pixel-face alignment, rear pelvis/leg chart direction and neck chart continuity.

This remains the **original model's silhouette**. Its jacket collar and sleeve volume cannot become a newly modeled T-shirt and anatomically narrower forearms through UV changes alone. The inherited hair/head shape also stays unchanged. The low triangle count visibly distorts the large painted pixels on some oblique surfaces. This is a texture-fitting result, not a new Nico likeness/modeling pass.

The atlas has no dedicated palm or shoe-side paintings, so those surfaces reuse nearby hand/shoe regions. Fine fingernails are not individually fitted to the source's simplified fingers. The watch artwork is unused because the source has no watch geometry. These limitations are visible in the supplied renders; user artistic approval is pending.

## Verification and Blender versions

**Actually tested: Blender 4.3.2.** The saved `.blend` was reopened and the exported `.glb` was imported into a fresh scene. Native geometry matches the imported original exactly. All 744 exported triangles match one-to-one, with a maximum coordinate difference of about **0.0000004 m** from float32 coordinate conversions. The GLB has 583 imported vertices because UV seams split vertex records; triangle count and surface geometry are unchanged.

The exact embedded PNG matches the supplied file byte-for-byte by SHA-256. Both UV layers are present in the native file. Matching native/exported render comparisons are recorded in `Verification.json`.

**Blender 2.93 was not available and has not been tested.** Do not try opening the 4.3 native `.blend` in 2.93; use File → Import → glTF 2.0 and select `PSX_Retextured.glb`. Reimporting GLB can expose separate vertex records at UV seams, as is normal for glTF.

## Reproduce

From the repository root, with Blender 4.3.2, Python, Pillow and NumPy installed:

```sh
mkdir -p out/psx-retarget
blender --background --threads 6 --python-exit-code 1 --python scripts/psx-retarget/inspect_model.py
python scripts/psx-retarget/islands.py
blender --background --threads 6 --python-exit-code 1 --python scripts/psx-retarget/retarget.py
blender --background --threads 6 --python-exit-code 1 --python scripts/psx-retarget/verify.py
python scripts/psx-retarget/assemble.py
```

Scripts intentionally operate on the versioned source and exact supplied atlas. Raw inspection/render intermediates stay in ignored `out/psx-retarget/`.

## Required source credit

This work is based on [“90s Survival Horror Protagonist (PSX Style)”](https://sketchfab.com/3d-models/90s-survival-horror-protagonist-psx-style-cb4302ee78264867ab1d77b2cb59eacd) by [Jim Wing](https://sketchfab.com/JimWing), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Changes: UV coordinates and material replaced to use the user's pixel atlas; original geometry retained. Retain this credit when sharing the derivative model. The source model license does not establish ownership or license of the separately supplied texture.
