# PSX model packs: inventory and first test (2026-11-15)

The user shared 13 archives of PS1-style models (Drive folder `124GZkGnO3AsaZA1aB5oyEBBmTX0UT2Im`), licensed and free to use and edit (their statement; the archives carry no licence files), and asked for one Season 4 episode to be recreated with them as a test. The raw packs (about 290 MB) are not in Git. The files in use are in `public/assets/models/psx/` (see its `PROVENANCE.md`).

## What's in the packs

| Archive | Contents | State in three.js |
|---|---|---|
| `Characters_psx.rar` | 79 people (FBX + PNG): civilians young and old, police, firefighters, doctors, hazmat, "Killer" and "Monster" figures | **Works.** Mixamo rigs (33–65 bones), about 900–1,400 triangles each, one texture each. The single animation is a one-frame A-pose, so every pose is set in code. |
| `Characters_Extras.rar` | 36 more people, killers and monsters | Same rig and format (not yet sheeted). |
| `female_secretary.zip`, `male_casual.zip`, `PSXJapaneseSchoolgirl.zip` | Single characters | Load; textures need re-linking (they show grey or black). |
| `PSX-Derelict-Furniture-Standard.zip` | chair, couch, fridge, mattress, shelf, vase (GLB/FBX/Blend) | **Works** (GLB with embedded textures; grim, stained look). |
| `URBAN.zip` | 483 models: prebuilt flats and a hangar, wall and fence kits (brick, stucco, plaster, drystone, picket, metal), building parts with doors and windows, street and traffic lights, bus stops, cones, barriers, vents, pipes, litter | **Works** (GLB, textures embedded or in `textures/`). |
| `OFFICE.zip` | 180 models: desks, chairs, dividers, filing cabinets, phones, water cooler, clock | GLB; not yet tested. |
| `RetroModelPack.rar`, `Street_Furniture.zip` | TV, clock, locker, table, bucket, tools; trash, barrel, flashlight, crowbar | Load, but **textures don't link** (white): they need mapping by hand. |
| `PSX_Style_Cars.zip` | 12 cars (OBJ + MTL), including a taxi and a police car | Some load textured; most render **black** (MTL paths need fixing). |
| `pots & plants.zip` | pots, sansevieria, bird of paradise, calathea | GLB; not yet sheeted. |
| `DoriHome.fbx` | One 24 MB scene | Not yet opened. |

Contact sheets: `sheet-characters.jpg` (all 79 of `Characters_psx`) and `sheet-props.jpg` (buildings, street, furniture, props, cars, single characters). They were rendered by a throwaway three.js viewer in headless Chromium.

## How they're used

`src/horror/psx/models.tsx`:
- **Loading:** `PsxCharacter` and `PsxProp` load FBX or GLB once per page, inside Remotion's `delayRender`. They replace the materials with our PS1 lambert (vertex snap, dither) and the character's own texture.
- **Posing:** `applyPose` works root to leaf from the rest pose, in the character's own space (rest pose faces +z, its left hand toward +x). Each step either rotates a bone about an axis, or **aims** it: `['aim', [x, y, z]]` turns the bone so it points toward its child along that direction, whatever angle it started at. `ARMS_DOWN` and `SIT` are built from aims.

**Lessons:**
- Remotion's `ThreeCanvas` only redraws on frame changes. A model that arrives after the first draw must call R3F's `advance()` before `continueRender`, or it never appears.
- The FBXs embed the creator's absolute Windows texture paths (harmless 404s). Load the PNG beside each FBX instead.
- Skinned bounds don't follow code poses, so `frustumCulled` is off.
- Normalise each character by its rest-pose height (the FBX units vary).
- A beige shirt reads as bare skin in a dim ward. Choose clothes by value as well as colour.
- **Pose limbs by aim, never by fixed angles.** In v1, `ARMS_DOWN` lowered each arm 0.85 rad about z from the A-pose, but the rest arms sit at a different angle, so they swung past the body and the hands came out through the stomach (the user: "why the hands sticking out of their stomach"). Aiming the upper arm and forearm at target directions fixed it in v2.

## First test: Episode 39 "Sino ang Susundo" (PSX)

`Ep39SinoAngSusundoPSX`: the same composition as `Ep39SinoAngSusundo` with `psx: true`. Same shots, timing, captions and **the same checked v1 mix** (`public/assets/audio/ep39-sundo-v1/mix.m4a`), so it compares picture against picture.
- **Cast:**
  - Tatay: `Character_29`, lying on the derelict mattress;
  - me: `Character_08`, seated, dozing on night 3;
  - Nanay: `Character_29_Female`, tinted pale, seated in the far chair in the hook and standing in the doorway at the end.
- **Props:** both chairs are the derelict chair.
- **Changes from v1 in PSX mode only:**
  - no blanket, and the pillow is raised for the thicker mattress;
  - the close-ups aim at the PSX head height;
  - the whisper camera is pulled back.
- **What these models can't do yet:** there's no face rig, so Tatay's night 1 smile becomes his head lifting toward the doorway, and nobody's mouth moves. The hand reach on night 4 is small.

**Delivery:** v1 `assets/videos/ep39-sundo-psx-v1/` (kept; hands through the stomach); **v2 `assets/videos/ep39-sundo-psx-v2/ep39-sino-ang-susundo-psx.mp4`** (aim-based arms: at the sides lying and standing, forearms on the thighs sitting, Tatay's reach lifts his hand off the mattress toward mine). Render with `npm run render:ep39-psx` (stills: `npm run still:ep39-psx`). It has no user approval and no listening pass (the mix is v1's, unchanged).

**Review of the encoded file:** `ep39-sino-ang-susundo-psx.mp4`, 38,902,333 bytes, SHA-256 `fcaced5dbad9dceadaca8795d10b9a5f4f746f784d815406f7200cf0d6ed320c`; H.264 1080×1920, 1,460 frames (48.67 s); AAC 48.79 s; −14.1 LUFS, sample peak −1.1 dBFS (the v1 mix); first and last frames differ by 5.0/255 on average (the loop). A contact board (one frame every 3 s) was checked for every shot.

**Review of v2:** `assets/videos/ep39-sundo-psx-v2/ep39-sino-ang-susundo-psx.mp4`, 38,913,094 bytes, SHA-256 `53f7439055d4f0361f3a1c224955357db880bfa09c243f442ac176573d5c516b`; 1,460 frames (48.67 s); −14.1 LUFS, sample peak −1.1 dBFS (the v1 mix); loop 5.0/255. A contact board (one frame every 3 s) was checked: no hands through any body in any shot.

## The horror figures (inventory, 2026-11-16)

Rendered as a contact sheet when the user asked for the packs' monsters ("Didnt we have monster/ghost characters please use them if it fits"). All are in `Characters_psx/Models/Killers/` with textures in `Characters_psx/Textures/`; copy only what an episode uses.

| Model | What it looks like | Used |
|---|---|---|
| `Character_Monster` | white, emaciated, wide staring eyes, a gaping black grin | Episode 52 (the lechuza) |
| `Character_Monster_01` | flayed brown body, a face split down one side, sores | |
| `Character_Monster_02` | white, bulging eyes, the lower face torn in strips, holes in the chest | Episode 48 |
| `Character_Monster_03` | a woman with long black hair, hollow black eyes, a slack open mouth, a dark wrapped body | Episode 51 v2 (Hasshaku-sama) |
| `Character_Monster_04` | a gaunt woman in a dark dress, a skull face with a jaw hanging open to the chest | |
| `Character_Monster_05` | long black hair over the face, a white shirt bloodied down the front | Episodes 41, 45 |
| `Character_Monster_06` | green rotting ghoul, a skull face with an open mouth | |
| `Character_Monster_07` | a skull face on a dark ragged body | |
| `Character_Monster_08` | hairy all over, no face showing | |
| `Character_Killer`, `_01` … `_10` | masked men: sack, stitched leather, pale skin mask, pig, owl, bear, clown, grinning old-man mask; several bloodied | |

Lesson: about 20 `ThreeCanvas` tiles on one page lose their WebGL contexts (the first tiles render blank); render a sheet in groups of five or so.
