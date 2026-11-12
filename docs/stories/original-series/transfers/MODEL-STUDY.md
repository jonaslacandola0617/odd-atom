# Character model study (2026-11-12)

After "still ugly" on Nico v3, the user shared reference models to study how good stylized characters are built.
The models were studied in the sandbox only: none is committed, rendered into a video or used.
Two are fan models of other studios' characters, and the licences of the others are unchecked.

## What was studied

| Reference | How it is built | What it teaches |
|---|---|---|
| Drive: "reze" GLB (fan model of an existing anime character) | anime/VRoid-style: 73k tris, rigged, 6+2 face shape keys, 4096² cel textures with shadows painted in | flat cel colour with painted shadow shapes; a simple face and big eyes in the texture |
| Drive: "tanya" (stylized cheerleader, Sketchfab-type pack) | hand-sculpted stylized: 132k tris, PBR textures (diffuse, normal and roughness up to 4096²), unrigged | appeal comes from designed shapes: big head, clean planes, sculpted hair clumps, painted eyes and brows |
| Drive: "Hi3D_Untitled_allparts" | AI image-to-3D output (the Hi3D tool): one 2,000,000-tri mesh, 8192² baked texture, no rig | a single image can become a clean stylized model with good shape and face fidelity; it needs decimation, a rig and a texture cleanup |
| The user's private art repo (WildSignal creatures, houses, trees, engine frames) | low-poly (2–10k tris) models; textures nearest-sampled at 256–512²; **light and deep shadow painted into the texture** ("painted form"), with restrained engine light; rendered natively at 640×360 or 480×270 with no anti-aliasing, coloured cast shadows and a lavender ambient | the pixel-art look the user wants: simple chunky silhouettes, painted shading (not computed bands on bumpy geometry) and a native low-resolution render |

The Mai Shiranui zip (an existing fighting-game character) and the "peter" zip (a Ready Player Me avatar, see
ASSET-SOURCING.md) were not opened for this study.

## Why Nico v1–v3 looked ugly, by comparison

- Each started from an **anatomical** base (MakeHuman or Quaternius) and was pushed toward the sheet. The good references
  are **designed shapes**: oversized head and eyes, simplified hands, hair as a few big sculpted clumps, no anatomy
  noise. Toon light on anatomy noise makes blotches.
- Shading was **computed** (toon bands) on the geometry. WildSignal and the cel references **paint** the light and
  shadow into the texture, so every frame reads as a drawing.
- Faces were decals on a realistic skull. In the references the head is built around the painted face.

## Proposed route (pending the user)

1. Make one clean picture of Nico for image-to-3D: a front A-pose, full body, plain background, from the approved
   sheet (ChatGPT), then generate the model in the image-to-3D tool the user has (the Hi3D file suggests access).
2. Here: decimate it to about 15–25k tris; repaint the texture as painted form (flat colours, two or three painted
   shadow shapes, nearest-sampled at 512–1024²); add a skeleton and weights; swap faces in the texture per expression.
3. Render natively at 640×360 (or 480×270) with no anti-aliasing, nearest textures, one warm key and coloured
   shadows, darkened for horror. No outlines (the user's rule).
4. Check the tool's terms on output ownership before committing anything to this public repo.

## Follow-up: building, not generating (user, 2026-11-12)

The user did not generate the Hi3D model and does not want image-to-3D; the request is that Claude learns from the
references and builds the characters. The construction lessons, from clay and wire renders of the references:

- **Head:** the cheerleader and the anime model both have an egg-shaped skull, a nearly flat face, a tiny nose, and
  eyes, brows and mouth painted on (no modelled lips or sockets).
- **Hair:** many separate pieces rooted on the scalp. The anime model has a few big pointed shell locks (5,580 vertices,
  177 pieces); the cheerleader has hundreds of sculpted clumps (545).
- **Body and clothes:** the body is simple (about 10k vertices on the cheerleader); each garment is its own shell.

**Nico v4 head test:** `assets3d/characters/nico/build_nico_head_v4.py` writes `public/assets/3d/nico/nico-v4-head.glb`.
- It has a designed skull and face laid out in the sheet's own pixels, about 70 separate pointed locks plus a scalp
  cap, thick 3D frames on the sheet's lens rectangles, and the sheet's seven painted faces.
- Stills are in `assets3d/characters/nico/head-v4/` (`node scripts/render_nico_look.cjs --v4head`), with
  `compare-sheet-vs-v4-head.png`.
- Not yet reviewed. The known differences from the sheet:
  - the sheet's head is rounder, and its hair wraps the sides with the ears showing;
  - the sheet's frames are thinner;
  - its side profile has a defined brow, nose and chin.
