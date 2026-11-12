# Original series: capability assessment (2026-11-12)

The user asked whether our system can render animation at the quality of a
reference video (Drive file `15GGUpCQyLE-EL4ED0TYwfUH9c24s_kIE`,
`Screen_Recording_20261112_195518_Facebook.mp4`, 268 MB), and suggested a 3D
model library for characters, sets, props, SFX and VFX.

## The reference video (studied 2026-11-12, after the user re-shared it)

**What it is.** A 104 s phone screen recording (1080×2280, variable frame rate,
AAC stereo) of a Facebook Reels feed. It shows about six consecutive reels by
one creator, plus an ad.

**The content is cute character comedy, not horror:**
- a chameleon and a mouse at a party ("you're ruining the party!");
- a ghost given a Halloween treat bucket by a human hand ("happy halloween, ghost!");
- a hedgehog-like creature going home through a dark cave to a lamp-lit burrow
  ("found my way home");
- a penguin in a cowboy hat with snowmen ("rhythm heaven");
- a cat at a sushi counter ("sushi with lady brown").

The footage stays in the scratchpad and is not in Git. We copy techniques only,
never the creator's characters or designs.

What we saw, from contact sheets at 1 fps and full-resolution crops:

- **Resolution and "pixel" look.** The frame is rendered at full phone
  resolution, and edges and geometry are smooth. The pixel feel comes only from
  low-resolution, nearest-filtered textures: the feathers, the painted faces,
  the pumpkin bucket, and the leaves. That is the opposite of our approach,
  where the whole frame is 180×320 upscaled 6×.
- **Models.** Rounded, smooth-shaded, stylized animals with simple 2D-painted
  faces on 3D heads. The faces swap expressions (content, crying, squinting,
  grinning). The sets are dense: autumn trees, benches, a kitchen, a cave
  burrow with posters, a TV, string lights.
- **Lighting and rendering.**
  - Warm golden-hour key light with cast soft shadows, and dappled leaf shadows
    on the ground.
  - Bloom on lamps, god rays, and strong depth of field (blurred backgrounds).
  - Wet-ground reflections, a translucent plastic bucket, and coloured club
    lights (disco ball, spotlights).
  - The cave reel is near-black with rim light and floating dust: proof that the
    look survives darkness.
- **Animation.** The characters are fully rigged and act: squash and stretch,
  arms grabbing and holding props (a snack bag, a pumpkin bucket), head turns,
  dancing, a chopping knife, a sliding fish. The timing is snappy and cartoony,
  with held poses for comic beats.
- **Camera and editing.**
  - Moving cameras: low-angle push-ins, close-ups on faces and props, and a top
    shot looking straight down.
  - A human hand POV.
  - Fast cuts on action. Each reel runs about 10–20 s.
- **Text.** Big white rounded captions with a dark outline, used sparingly as
  dialogue punchlines ("stop eating them!", "AHHH", "lost").
- **Sound.** Present, but not auditioned: this container cannot listen.
- **Engine (inferred, not confirmed).** Probably Blender (EEVEE) or a game
  engine with post-processing, rendered on a GPU.

**What this means for us.** The gap is not just characters. It is a different
rendering approach: full resolution with pixel-art textures, real soft shadows,
depth of field, bloom and reflections. Rigged, expressive characters are the
biggest missing piece. Our horror tone can stay; the reference's tone is cute.

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
- **Speed.** Rendering uses software WebGL on 4 CPU cores, with no GPU.
  - The reference look needs full or half resolution, shadow maps, depth of
    field, bloom and reflections, and every one of those is far more expensive
    in software than our 180×320 frames. three.js can do all of them
    (postprocessing, `Reflector`, soft shadows), but we have not measured how
    slowly.
  - Blender Cycles runs on CPU headless, but it would likely take many seconds
    to minutes per frame. EEVEE needs a GPU or a slow software OpenGL.
  - The test below must measure render time. A likely compromise is rendering at
    540×960 and upscaling 2×.

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

- Two looks would be tested side by side on the same shot:
  (a) our current 180×320 PS1 look, and
  (b) a reference-style look: half or full resolution, smooth geometry,
  nearest-filtered pixel textures, soft shadows, depth of field and bloom.
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
- Compare the test against the reference on rendering, lighting and acting, with
  measured seconds per frame for each look.
