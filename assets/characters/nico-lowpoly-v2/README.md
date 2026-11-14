# Nico v2 — hair silhouette and visible likeness revision

[Blender model](Nico_LowPoly.blend) · [GLB](Nico_LowPoly.glb) · [Comparison sheet](Nico_ComparisonSheet.png) · [96 px head](Nico_Head_96px.png) · [Complete bundle](Nico_v2_Delivery.zip)

The actual delivered v1 `.blend` was opened and revised. **Every file in `nico-lowpoly-v1` is unchanged**, verified by hashes in `construction.json`. V1's hair silhouette was rejected by the user as cap-like; it remains a historical comparison, not an approved hair baseline. V2 is pending user design review.

## What changed

The old 577-vertex scalp-shaped outer mesh was removed. A new close-fitting cover supports **seven broad closed locks**: an off-center main sweep, two unequal overlapping fringe sections, two descending rear masses, a short nape mass and one bent crown lock. Each has a wide seated root, raised middle and a short flattened end. The hook is swept sideways into the mass, rather than a tall upright fin. The scalp cover steps around the ear and has modest uneven lengths at the narrower nape. All hair objects remain separately editable under the `Nico_Hair_v2_` names.

The jaw corners ease inward to the chin; the existing connected neck tapers upward with a sloped jaw underside. The quiet mouth follows that small face deformation. Lower denim is wider and has an additional row and a small break above the sneakers. Glasses, eyes/heavy lids, brows, ears, shirt, hands, watch, sneakers and other original meshes are unchanged; the scope check is in `verification.json`.

**5,732 triangles, 47 mesh objects, unrigged T-pose.** Flat polygon shading, no subdivision or automatic decimation. Five original detail maps remain packed in the `.blend` and embedded in the GLB. Hair locks are closed overlapping solids, not cards; their hidden roots deliberately enter the cover/head to keep them seated.

## Reference and actual render evidence

The exact [original turnaround](references/Nico_Original_Turnaround.png) was downloaded from the user's Google Drive link without changing its bytes; `references/source.json` records the source and SHA-256. It is embedded in the comparison sheet beside solid hair masks. The reference was interpreted as a drawing guide rather than copied strand for strand.

V1 and v2 were rendered from their actual saved files with the same four cameras, 0.410 m orthographic head framing, neutral untextured material values and inherited identical studio lights. Views: front, profile, back and elevated three-quarter. Solid whole-head silhouettes and solid hair masks are supplied separately under `review/`; the latter use a white head/ear occluder and hide the frames/brows so those cannot cut false holes through the black hair. The finished head is also supplied at **exactly 96 pixels high**, cropped using projected actual mesh bounds rather than enlarged from a small screenshot. Three finished body angles show the trouser change in context.

Initial trials had overly thick column-like locks and an upright cowlick. Subsequent gray/silhouette checks led to fewer flatter masses, a sideways hook, forward lift and a tighter rear cover. A visible small scalp breakthrough in an intermediate back mask was fixed geometrically. No enclosed white scalp patches remain in the four final diagnostic masks; this is a view-specific check, not an all-angle proof. Refer to `hair-mask-check.json` and the final visual audit.

## Versions and verification

**Blender 4.3.2 is the version actually tested.** The native file was saved and reopened there; the actual GLB was reimported into a fresh scene, checked and rendered. Triangle counts and bounds match. All native meshes and the restored editable import are closed/manifold with no zero-area faces. No rig, weighting or extreme bend tests are included.

For Blender 2.93 LTS, import `Nico_LowPoly.glb` with File → Import → glTF 2.0. **2.93 itself was not available for execution and has not been tested; the native file is not a 2.93-native save.** The optional `Nico_Import_GLB.py` imports the adjacent GLB and welds coincident hardware vertices while preserving authored per-corner normals and UVs; it deletes no existing objects and saves no file automatically. Its API usage is intended for 2.93 but only execution in 4.3.2 is verified. Raw glTF repeats vertices at hard-normal/UV boundaries by design.

The remaining artistic difference is a more geometric, less wispy interpretation than the drawn turnaround. Fine strand and stubble detail is subdued at 96 px. User likeness/hair approval remains pending. The important silhouette changes and the actual geometry are shown for review rather than treated as a technical-test artistic pass.

## Reproduce from repository root

```bash
blender --background --threads 6 --python-exit-code 1 --python scripts/nico/revise_nico_v2.py
blender --background --threads 6 --python-exit-code 1 --python scripts/nico/render_nico_v2.py -- --quick
# Inspect gray and silhouette outputs, revise source controls if necessary.
blender --background --threads 6 --python-exit-code 1 --python scripts/nico/render_nico_v2.py
blender --background --threads 6 --python-exit-code 1 --python scripts/nico/verify_nico_v2.py -- --render-import
python scripts/nico/assemble_nico_v2.py
```

The revision script always starts from the original v1 `.blend`, avoiding accumulation of edits. It saves/exports exclusively into v2 and validates the preserved v1 file hashes.
