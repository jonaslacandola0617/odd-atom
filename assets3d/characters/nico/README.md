# NICO (TRANSFERS lead): 3D character

## v1 (current, 2026-11-12): MakeHuman CC0 base mesh

- **Build.** `build_nico_mh.py` runs in headless Blender (`bpy` 5.3, in a
  scratchpad venv):
  `python -I build_nico_mh.py -- <mpfb_data_dir> <out_dir> [--sheet]`
  - The build is deterministic: rebuilding gives a byte-identical GLB.
  - Build plus Cycles sheet takes about 1 min on 4 CPU cores.
- **Source data (read only).** The `data/` folder of the MPFB 2.0.18 add-on, from
  extensions.blender.org: `add-on-mpfb-v2.0.18.zip`, sha256
  `c075b3e9b94b8e5556a5f03f4653602d02ea306de08126e8f55ed6dee28a2dad`. Files used:
  - `3dobjs/base.obj`: hm08 base mesh. Its header says "explicitly released as
    CC0 in september 2020".
  - `targets/macrodetails/*`, a few `targets/{nose,head}/*`, and
    `targets/expression/units/asian/*`: morph targets.
  - `rigs/standard/rig.game_engine.json` and `weights.game_engine.json`: the
    skeleton and skin weights. The weights file says `"license": "CC0"`.
  - `mesh_metadata/basemesh_vertex_groups.json`.

  The add-on's own code (GPL-3.0) is **not** run; the script parses the data
  files itself. The data is not committed here, so download the zip above to
  rebuild.
- **Our design on top of the base:**
  - the body blend: male, about 34, slightly under-muscled and a little
    heavy, 1.68 m, Asian macro;
  - small nose and head details;
  - painted skin colour (brows, soft beard shadow, lips, under-eye bags);
  - clothing shells (T-shirt and jeans) with straight hems;
  - modelled sneakers, short hair built from the scalp, wire-frame glasses, and
    iris and pupil shading.
- **Output.** `public/assets/3d/nico/nico-v1.glb` (9.5 MB):
  - 53-bone game-engine skeleton with CC0 weights;
  - 34 facial expression morph targets (blinks, brows, eyes, mouth, nose, neck);
  - about 11.7k body vertices.
  - Loads in three.js / Remotion (`src/horror/transfers/NicoLook.tsx`).
- **Sheets.**
  - `sheet-v1/turnaround-blender.png` and `sheet-v1/expressions-blender.png`:
    a neutral studio look (Cycles).
  - `look-v1/*.png` and `sheet-v1/expressions-dark-480x270.png`: our dark PS1
    look (Remotion, `node scripts/render_nico_look.cjs`, about 1.2 s a still)
    at 480×270 and 640×360.
- **Known limits.**
  - The hem and hairline edges are slightly stepped.
  - The rest pose is MakeHuman's A-pose, so the sheet's relaxed arms are a
    quick bone rotation; real poses come from animation.
  - There are no eyelashes or teeth detail beyond the base helpers.
  - The shirt is a thickened shell, not cloth simulation.
- **Status.** Not approved by the user.

## v0 (superseded): procedural blockout

`build_nico.py` and `blockout-v0/` are kept as a comparison. They are
mannequin-level and well below the reference.

## v2 TOON (current, 2026-11-12): stylized to the approved design sheet

- **Approval:** the user approved Nico's design ("nico is approved"); the
  reference is `design/nico-sheet-chatgpt-v1.png`.
- **Build:** `build_nico_toon.py` (same CC0 MakeHuman data and rig as v1, read
  only). It writes `public/assets/3d/nico/nico-v2-toon.glb` (about 1.5 MB).
- **Changes from v1:**
  - **Head:** scaled about 13% about the top of the neck, to the sheet's
    proportions. Height is 1.70 m.
  - **Face:** the inner mouth and eye-socket lining is removed and the gaps are
    filled. The face is smoothed (22 passes), so toon bands stay clean and the
    outline shell cannot poke through creases.
  - **Painted face decal:** the front of the head, lifted 1.2 mm, with planar
    UVs. Its eye and mouth positions go into the GLB extras; the mouth is placed
    from the face's own proportions, because the rig's mouth joint sits too high.
  - **No facial shape keys:** expressions are swapped pixel textures, drawn in
    `src/horror/transfers/nicoFace.ts`. The seven faces are tired, focused,
    forcedSmile, worried, fear, terror and blink, taken from the sheet.
  - **Hair:** a low scalp shell plus 90 four-sided spike clumps. The fringe
    falls forward and down, the sides fall down, the top sweeps back, plus a
    cowlick.
  - **Glasses:** thicker frames, from the sheet.
  - **Palette:** from the sheet. Skin #a8724e, T-shirt #2d4a42, jeans #24262c,
    grey sneakers, black watch.
- **Look:** `src/horror/toon.ts` provides three-band toon shading with a light
  palette snap (40 levels; at 10 levels dark colours shifted hue), plus
  **screen-space** inverted-hull outlines with a constant pixel width.
  - The first outline version pushed by a fraction of view depth. With a
    narrow lens that became about 6 px and filled the mouth area black.
- **Sheet:** `sheet-v2-toon/` at 640×360 and 480×270, made with
  `node scripts/render_nico_look.cjs --v2` (composition `NicoToonSheet`).
  It shows the turnaround and the seven expressions.
- **Status:** not yet approved as a model, though the design is approved.
