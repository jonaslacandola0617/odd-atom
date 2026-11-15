# TRANSFERS: the user's PSX/PS1 packs (inventory, licences, look test v1)

2026-11-15. The user moved the series to a PSX/PS1 survival-horror look and shared a Drive
folder of PS1-styled packs (`124GZkGnO3AsaZA1aB5oyEBBmTX0UT2Im`, 13 files, about 300 MB),
described as "licensed approved". Nothing here is approved as the series look yet.

## Licences: read this first

**The repo is public.** Only CC0 and CC-BY may be committed (CC-BY with credit). Anything
else stays out of Git and lives in the git-ignored `public/assets/3d/psx-local/` and
`assets3d/psx-local/`.

**None of the 13 downloads contains a licence file** (no txt, pdf, md or readme in any
archive; checked file by file). itch.io, CGTrader, Sketchfab, Unity and Fab are blocked
from this sandbox, so the store pages could not be opened. Web-search summaries were used
instead:

| Download | Likely source (from search summaries) | Licence found | Status |
|---|---|---|---|
| `PSX_Style_Cars_by_GGBot_(August2023).zip` | GGBot, itch.io "PSX Style Cars" (the zip carries a `GGBot - itch.io.URL`) | **CC0** on the itch.io listing; no licence file in the zip | Committable once the user confirms the CC0 listing. Not used yet. |
| `PSX-Derelict-Furniture-Standard.zip` | Daniel Jurys, itch.io "PSX Derelict Furniture" (Standard tier) | not stated in the summaries | local only |
| `RetroModelPack.rar` | probably kkryy, itch.io "Retro Model Pack Interior" (name-your-own-price) | not stated | local only |
| `male_casual.zip`, `female_secretary.zip` | Vinrax, itch.io "PSX Casual Male Character" / "PSX Secretary Character" (free) | not stated | local only |
| `PSXJapaneseSchoolgirl.zip` | not identified | none | local only |
| `Characters_psx.rar`, `Characters_Extras.rar` | not identified (similar to several itch.io PSX character packs) | none | local only |
| `URBAN.zip`, `OFFICE.zip` | not identified | none; URBAN's textures are named `TexturesCom_*` (Textures.com photos, which normally may not be redistributed as files) | local only |
| `Street Furniture.zip`, `pots & plants.zip` | not identified | none | local only |
| `DoriHome.fbx` | not identified; the FBX embeds images with author metadata | none | local only |

The user's own **eyeglasses model** (`oculos.rar`, shared in the session on 2026-11-15:
`oculos.obj`, `glasses.png`) also has no licence file, so it is also local only
(`public/assets/3d/psx-local/glasses_user.glb`).

**What the user needs to do:** for each pack, send the store page link or the licence text
(or a screenshot of the purchase page). Until then everything is used only for private
tests: the look-test renders are shared through Drive or a private page, never committed.
If a pack turns out to be CC0 or CC-BY, its models can move into the repo.

**Two more cautions**
- **Photo faces.** The human characters in `Characters_psx`, `Characters_Extras` and
  `male_casual` use photo-sourced face textures. A real person's face in our series needs
  the creator's terms to allow it. Painted replacement faces (see `CHATGPT-FACES.md`)
  remove that risk.
- **Famous-killer lookalikes.** Several `Characters_psx` "Killers" (a pig mask, a clown,
  a hockey-style mask, overalls with a sack mask) resemble famous horror-film characters.
  Our rule is to copy techniques, never characters, so they are not used.

## Inventory (872 models)

The full per-file list (triangles, bones, animations, textures) is in
`psx-inventory.json`, made with headless Blender (bpy 5.3).

| Pack | Type | Models | Triangles (min / median / max) | Rig and animation | Textures |
|---|---|---|---|---|---|
| Characters_psx | characters: 32 male, 34 female, 13 killers and monsters | 79 FBX + `.blend` | 822 / 980 / 1,386 | all rigged (Mixamo, 33–65 bones), one Mixamo take each | 512×512, one atlas per character, photo faces |
| Characters_Extras | characters, 34 more | 71 FBX (35 rigged, 35 static) | 1,282 / 1,352 / 48,396 (one outlier) | Mixamo | 512×512 |
| PSXJapaneseSchoolgirl | character | 1 FBX | 1,882 | 65 bones, no animation | 512×512, painted face |
| male_casual | character | 1 FBX | 952 | 25 bones, no animation | 256×256, photo face |
| female_secretary | character | 1 FBX | 932 | 28 bones, no animation | 256×256 |
| DoriHome | environment: a whole furnished flat (living/dining room, kitchen, bath, two bedrooms) | 1 FBX, 180 meshes | 25,872 total | none | 27 images, mostly 1024×1024 (scaled to 256 for PS1) |
| URBAN | environment kit: building parts, prebuilt flats, roads, bus stops, barriers, fences, pipes, vents, litter, traffic lights | 483 GLB (+ same in FBX) | 2 / 84 / 2,848 | 2 with animations | 128–1024 |
| OFFICE | props: desks, chairs, couches, computers (CRT monitor, towers), lamps, cabinets, binders, stationery | 179 GLB (+ FBX) | 1 / 98 / 752 | none | 64–256 |
| PSX Derelict Furniture | props: chair, couch, fridge, mattress, shelf, vase | 6 GLB/FBX/blend | 12 / 224 / 348 | none | 128–256 |
| RetroModelPack | props: TV, clock, table, metal locker, knife, scythe, shovel, bucket, burner, plate, cutting board, slate, pillar, sheet metal, mat | 15 FBX + blend | 12 / 176 / 538 | none | one PNG each |
| Street Furniture | props: box, cardboard, barrel, bottles, crowbar, flashlight, floppy, garbage bag, gas mask, hammer, lock, trash can, air conditioner | 13 FBX + blend | 2 / 256 / 766 | none | 256 |
| pots & plants | props: 5 pots, 5 plants | 10 GLB/FBX | 40 / 96 / 144 | none | 30–512 |
| GGBot PSX Cars | vehicles: 8 cars, wheel, shadow, 16 sound effects | 12 OBJ + blend | 2 / 440 / 476 | none | 48–128 |

Not usable for TRANSFERS as they are: the Japanese-blazer schoolgirl uniform (it needs a
Filipino public-school uniform, see below), the police, firefighter, doctor and hazmat
uniforms (US-style), and the "Killers".

## Look test v1

`TransfersPsxTest` (`src/horror/transfers/psx/PsxTest.tsx`), 13 s, 1920×1080, 30 fps.
Rendered by `node scripts/render_transfers_psx.cjs --stills --sheets --clip`, with sound
added by `python3 scripts/transfers_psx_test_sound.py`. The renders are local only
(`assets3d/psx-local/renders/`) and shared privately.

- **Shots:** (1) the shop at night, wide; (2) Nico lit by the CRT, his face swapping
  neutral → focused → fear; (3) the 1991 tape (4:3, date stamp, focus hunt, a still tall
  figure in the black doorway, digital push); (4) a push past sleeping Bea towards the
  shop's dark back doorway; black.
- **The PSX look** (`src/horror/psx.ts`): 320×180 internal (240×180 for the 4:3 tape),
  6× nearest upscale; vertex snapping to the pixel grid; affine (perspective-incorrect)
  texture mapping; 15-bit colour with a 4×4 Bayer dither; nearest textures with no mipmaps;
  fog; no anti-aliasing; motivated point lights only (desk lamp, CRT, street light, a
  fluorescent tube in the tape).
- **Built from the packs:** the shop's desk, chair, CRT monitor, PC, keyboard, desk lamp,
  bookcases, file cabinet, wall clock, mug, boxes, fridge, air conditioner, street light and
  trash can (OFFICE, RetroModelPack, Street Furniture, Derelict Furniture, URBAN); the tape
  room is DoriHome's living room (its standing fan, couches, painting and a doorway whose
  door is hidden) with our banner "INGAT, TATAY RUDY!"; the figure is a `Characters_psx`
  body rendered as a near-black silhouette with longer forearms. Walls, floor, the half-down
  shutter, the street, rain, the bench, the tapes on the shelves and the CRT picture are ours.
- **640×360 (user, 2026-11-15: "can you try to use 640x360 resolution"):** the internal
  resolution is now a prop (`lw`, 320 or 640; the tape follows at 4:3, the vertex snap follows
  the pixel grid). `node scripts/render_transfers_psx.cjs --res 640 --stills --clip` writes
  `*-640` files. At 640×360 the edges, glasses and dither are finer and the wobble calmer;
  textures are unchanged, so close-ups still show texture pixels. 81.5 s for 390 frames.
- **Render time:** about 72–74 s for the 390 frames (0.19 s a frame) at `concurrency: 2`
  with software WebGL; stills take 1.2–2.5 s each. A 5-minute episode at this rate is about
  28 minutes.
- **Sound:** existing TRANSFERS libraries only (rain-tin, fan, CRT idle, VHS dropout,
  fluorescent hum, tape breath, the focus hunt, a nervous breath, CRT off). No credits.
  −16.8 LUFS integrated, peak −2.0 dBFS. A test bed, not a mix.

### What worked
- The PSX look itself: dither, wobble, affine warp and dark motivated light read as a PS1
  survival-horror game straight away. The 4:3 tape in DoriHome's living room, with the still
  figure in the doorway, is the strongest frame.
- The packs' props drop in with no rework once their textures are nearest-filtered.
- Restyling textures by script: recolouring by region and colour class while keeping the
  shading (shirt, jeans, hair, skin and shoes for Nico; skirt and blouse for Bea).
- Face swapping: whole-texture swaps (`setFace`), as PS1 games did, work and cost nothing
  at render time.
- The user's eyeglasses model on Nico's head bone (it replaced my box frames). **Fit
  (after the user's "isnt properly sitting … the frames look big"):** `fitGlasses` in
  `PsxTest.tsx` measures the head instead of guessing. It finds the pupils on the mesh from
  their texture position, sizes the frame to 1.18 × his eye spacing (`GLASSES_SIZE`), sets
  the frame's back face 5 mm off the eyes and drops it 5 mm so the bridge rests on the nose
  root. The arms end inside his low-poly head, as in PS1 games. Check views:
  `node scripts/render_transfers_psx.cjs --glasses` (front, 3/4, both profiles, at 320 and
  960 wide).

### What did not work (yet)
- **Nico's beard.** The base has a full photo beard; lifting it towards skin leaves a heavy
  "beard shadow" patch. A painted face is needed.
- **Nico's hair.** The base hair is short and neat. Low-poly cone clumps for spiky hair read
  as a paper crown and were dropped. Better: a ChatGPT-painted hair texture on the existing
  cap, or a small hair mesh modelled in Blender.
- **Nico's build.** The pack body is athletic; Nico is lean with a small belly. It needs
  light mesh edits (shoulders, arms, waist) in Blender.
- **Procedural expressions.** Warping a 56×74-texel photo face changes too little: focused,
  worried, smile and shh are barely visible at PS1 resolution; fear and sleepy read. The
  painted faces from ChatGPT are the real fix.
- **Bea.** The colours changed (white blouse, navy skirt, warmer skin), but the mesh is a
  Japanese blazer uniform (lapels, a vest, an open front) on teen proportions, and her face
  is East Asian. She needs a different base or mesh edits (sleeves, collar, a shorter
  body), plus a painted face.
- **Bench pose.** Sleeping Bea under the jacket reads only as a dark shape; the back-doorway
  shot needs more fill light.
- **Why ChatGPT and Gemini failed before:** they repaint a whole texture atlas as a picture
  and do not keep the UV layout, so the paint lands on the wrong polygons. The fix is to
  give them only the face square in its exact layout and paste the result back with a mask
  (see `CHATGPT-FACES.md`).

## Files

- Code (committed): `src/horror/psx.ts`, `src/horror/transfers/psx/PsxTest.tsx`,
  `src/horror/transfers/psx/faces.ts`, `scripts/render_transfers_psx.cjs`,
  `scripts/transfers_psx_test_sound.py`, `assets3d/characters/psx/convert_packs.py`,
  `restyle_textures.py`, `face_templates.py`.
- Local only (git-ignored): the converted GLBs, restyled textures and expression textures in
  `public/assets/3d/psx-local/`; renders and face templates in `assets3d/psx-local/`.
- To rebuild after a fresh clone: download the packs from Drive, unpack each into its own
  folder, then run `convert_packs.py`, `restyle_textures.py` and `face_templates.py templates`
  on that folder.
