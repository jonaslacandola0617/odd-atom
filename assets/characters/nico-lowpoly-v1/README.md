# Nico — editable low-poly character

[Native Blender model](Nico_LowPoly.blend) · [GLB](Nico_LowPoly.glb) · [Review sheet](Nico_ReviewSheet.png) · [Complete download](Nico_Delivery.zip)

**5,952 triangles, 40 mesh objects; Blender 4.3.2 actually tested.** Metres; +Z up, −Y forward, +X is Nico's anatomical left. Height is 1.750 m. The cheap digital watch is on +X / left. Both soles have lowest Z = 0. Arms and shoes are mirrored; hands have a thumb and four separately formed fingers. No rig, weights or animation is included.

## Versions and import

The native file was saved and reopened in **Blender 4.3.2**. It is not a Blender 2.93-native save. **For Blender 2.93 LTS, use File → Import → glTF 2.0 and select `Nico_LowPoly.glb`.** Blender 2.93 was unavailable and has not been tested; no 2.93 compatibility pass is claimed. The actual GLB was imported into a new empty Blender 4.3.2 scene and rendered again. Its dimensions and triangle count match the reopened native asset.

glTF stores repeated vertices at hard-normal and UV boundaries. This is normal for rendering, but editing/rigging benefits from welding coincident positions. The optional **`Nico_Import_GLB.py`** helper imports the adjacent GLB, restores welded topology and retains the original per-corner faceted normals and UVs. Open the helper in Blender's Scripting workspace and run it; it deletes no existing objects and saves no file automatically. Alternatively merge by distance manually, then restore flat/custom normals as appropriate. The helper uses 2.93-compatible API calls but, like the file, was only executed in 4.3.2. Both raw import and the welded editable import are recorded in `verification.json`.

All five PNG maps are packed in the `.blend` and embedded as binary image buffers in the GLB. The GLB needs no external texture directory or required material extensions. Materials use opaque base color, roughness and exported normals. Separate original maps are also supplied under `textures/` for painting.

## Design and construction

The original turnaround supplied in chat guided identity and proportions; the T-pose drawings guided stance. The three earlier render sheets were reviewed visually. No earlier editable Nico meshes were present locally and no donor geometry was retained. This is an original geometric reconstruction, not a traced illustration or image-generation output.

The head has a compact cranium, cheek/jaw planes, a recessed short neck and a modeled nose. Rectangular glasses have real rim depth, bridge and temples, without a printed frame texture or duplicate outline shell. The heavy eyelid and eyebrow pieces remain editable; stubble and under-eye color are painted.

Hair is a **single closed manifold scalp mesh** with seven broad directional reliefs and a small swept crown displacement. The reliefs taper into the base, so there are no hair cards, detached blades or free-standing fin. The fringe, temple recesses, sideburn shapes and nape are geometric. A restrained painted charcoal map adds tone only after the form is established. Crown and side silhouettes were checked with untextured renders.

Arms and hands are connected meshes with elbow/wrist/finger loops and a branched thumb web. The T-shirt has a joined torso/sleeve mesh and a collar band, with modest forward belly volume. The jeans have a continuous pelvis/crotch and knee rows. Shoe soles are flat; laces, wear and denim seams are painted. Flat polygon shading preserves the facets. No subdivision, automatic decimation or global smoothing was used. Small one-segment chamfers construct the watch case edges and are applied in the editable mesh.

`NICO • editable geometry` contains the character. `REVIEW • cameras and neutral lights` contains the excluded studio setup; its objects are hidden in the viewport, but available for rendering. The native file opens framed on Nico. The GLB contains only the character.

## Visual revisions and inspection

The first clay crown was too high and was lowered together with the underlying skull. A forward nose root and disconnected-looking bridge were brought into the face/frame construction. The first separate hair relief patches read too much like plates, so they were replaced by relief in one continuous surface. Raised sleeve corners were leveled into the shoulder line. Visible back-hem clipping was corrected by giving the shirt enough rear clearance over the jeans. The shoes were mirrored as a left/right pair, and stray upper sclera wedges were removed to keep the eyes tired rather than wide open.

Final front/profile/three-quarter clay heads, four full-body angles at matching scale, a larger head close-up, an elevated rear hair view, left hand/watch detail, shoes and a small screen-size preview are supplied in `review/`. The composite sheet uses these actual Blender renders. The GLB reimport render is separate. The verification file binds checks to the final model hashes.

## Remaining limits

The neutral face is a deliberately angular interpretation; no expression library, eyelid animation or facial blendshapes is included. Joint loops are prepared for rigging, but extreme bend deformation is untested because this pass intentionally has no rig. Fine stubble, shallow hair relief and shoe paint naturally lose visibility in the small screen-size image; glasses and the overall head/clothing silhouette remain the primary identity cues. The hidden body is not modeled underneath the shirt and jeans. Refer to `visual-review.json` for the final observed visual findings; user design approval remains pending.

## Reproduce

```bash
python scripts/nico/make_textures.py
blender --background --threads 6 --python scripts/nico/build_nico.py -- --head-only
# Inspect the three clay heads before proceeding.
blender --background --threads 6 --python scripts/nico/build_nico.py
blender --background --threads 6 --python scripts/nico/verify_nico.py -- --render-import
python scripts/nico/make_review_sheet.py
```

The scripts use Blender's Python API and Pillow for original texture painting and review-sheet composition. All model construction remains editable geometry; the generated source is in `scripts/nico/`.
