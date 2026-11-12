# Original series: capability assessment (2026-11-12)

The user asked whether our system can render animation at the quality of a
reference video (Drive file `15GGUpCQyLE-EL4ED0TYwfUH9c24s_kIE`,
`Screen_Recording_20261112_195518_Facebook.mp4`, 268 MB), and suggested a 3D
model library for characters, sets, props, SFX and VFX.

## The reference video has NOT been studied

- The file is private on its owner's Drive (visibility `PRIVATE`). A direct
  download returns Google's sign-in page.
- The Drive connector refuses files over 10 MB, and returns no transcript.
- So nothing below describes the reference. Its resolution, pixelation,
  lighting, rigging, acting, VFX, editing and sound are unknown here. To study it,
  the user can do either of these:
  1. set the file to "Anyone with the link: Viewer" (then it downloads directly), or
  2. upload several clips of 10 MB or less each, or a few screenshots.

## What the current pipeline does well

Remotion + @remotion/three (three 0.169, react-three-fiber 9), the PS1 shader
helpers (`src/horror/ps1.ts`), 180×320 upscaled 6×, and software WebGL
(`gl: 'swangle'`).

- Low-resolution pixel 3D with a consistent palette, grading and analog damage
  (VHS, CCTV, infrared, film print, phone camera).
- Motivated lighting: torches, flashes, practicals, fog, darkness with one lit
  reveal. Lessons are in `docs/production/EPISODE_PLAYBOOK.md` and AGENTS.md.
- Camera language: handheld, dolly, tilt, push-in, POV, mirrored reflections,
  multi-camera CCTV walls.
- Sets built in code. A set can be reused exactly, so continuity between
  episodes is cheap.
- Sound: ElevenLabs narration (Jack, Juanito), ElevenLabs SFX, synthesized
  foley, measured mixes at −14 LUFS.

## What it cannot do yet (honest)

- **Characters that act.** Every figure so far is primitive boxes and cylinders,
  posed or slid along a path. None has a skeleton, a walk cycle, weight shifts,
  hands that grip, or a face that changes expression. Films like *Evil Dead Rise*
  and *The Grudge* are built on bodies moving wrong (posture, contortion, crawling,
  a head turning). That is the biggest gap.
- **Organic models.** We can't build hair, cloth, skin detail or realistic faces.
  There is no image generator here, so textures are procedural or drawn in code.
- **Simulation.** There is no cloth, hair, fluid or soft-body simulation. Smoke,
  fog, dust and rain are particle or shader fakes. At our resolution that is
  usually enough.
- **Speed.** Rendering uses software WebGL on 4 CPU cores. Skinned characters
  and denser sets will render slower than Seasons 1–3. We have not measured how
  much slower; the test below will.

## What it would take: a reusable 3D asset library

1. **Blender, headless.** `bpy` 5.3 (Blender as a Python module) is on PyPI and
   reachable from this container. It has not been installed or tested yet.
   - With it we could build characters, sets and props as Python scripts, so
     every asset can be rebuilt, versioned and reused.
   - We could add an armature (skeleton), weight-paint it automatically, and give
     faces a few shape keys (blink, jaw, brow, a "wrong" smile).
   - Actions such as walk, turn, crawl, grab, sit, stand and recoil would be
     authored as keyframes with IK.
   - Each asset exports as GLB.
2. **In Remotion:** load the GLB with three's `GLTFLoader` and drive its
   `AnimationMixer` from the frame number (`mixer.setTime(frame / fps)`), so
   renders stay deterministic. The PS1 material is swapped in at load time,
   keeping our look.
3. **Library layout:** `assets3d/<kind>/<name>/` holding the build script, the
   `.glb`, a model sheet (front, side, back) and a provenance note, with
   versioned names. One model sheet per character keeps each character the same
   in every episode.
4. **Outside assets (optional), only with their terms checked:** CC0 libraries
   such as Poly Haven, ambientCG, Kenney and Quaternius (which has rigged
   low-poly characters). This container's network policy may block them.
   Mixamo needs an Adobe account and comes with Adobe's terms, so it is the
   user's call. No ripped game or film models.
5. **VFX kit:** volumetric-looking fog cards, dust motes, breath, rain and drips,
   flicker and practical-light rigs, shadow-only figures, screen-space grain and
   lens damage. Most of this exists across episode folders; it would be gathered
   into one shared module.
6. **SFX library:** keep every ElevenLabs SFX we generate in
   `public/assets/audio/` with reusable names (doors, steps, breaths, knocks,
   bodies, creatures), so the series builds its own sound identity.
7. **Disk:** about 21 GB is free. GLBs are small. Renders and bundles are the
   cost, and the render scripts already delete their bundle.

## Proposed proof-of-quality test (before any season)

- One original rigged character from the chosen series, in one set, 15–20 s,
  portrait.
- In one shot it walks in (a real walk cycle), stops, turns its head towards a
  sound, and then does one wrong, physical thing. Examples: its head keeps
  turning past where a human's would stop; it drops to all fours; its shoulders
  rise as if pulled on strings.
- With one VFX layer (dust or fog in a practical light).
- Delivered with a model sheet still, the GLB and a measured render time.
- No ElevenLabs credits until the user approves the test. The sound would be
  synthesized or reused from library effects already generated.
- If the reference becomes viewable, compare the test with it shot for shot.
