# TRANSFERS: series format and character sheet (working, 2026-11-12)

## What the user chose

They chose "TRANSFERS" (see `../CONCEPTS-v2.md`):

> "I do like transfers it sounds interesting, i want a philippine setting with taglish voice and english captions, i want it to be a series real film not similar to our shorts i want it to looklike a film each video could be 4 minutes long?"

- The setting is the Philippines.
- Dialogue and voice are in Taglish, with English captions.
- It should play as a film series, not our shorts format.
- Episode length is about 4 minutes (the user asked whether that is right).

## Proposed format (for the user to confirm)

- **Episode length:** 4–6 min. Four minutes is long enough for a real scene
  structure (cold open, two or three scenes, a closing hook) and short enough
  for a weekly release. Some episodes can run longer when the story needs it.
- **Frame:** landscape 16:9, 1920×1080, so it reads as a film.
  - It would be rendered internally at 480×270 or 640×360 and nearest-upscaled,
    to keep our pixel analog look.
  - Real-world scenes are letterboxed to 2.39:1. The found tapes play full
    frame, 4:3 with VHS or Hi8 damage, so the audience always knows what it is
    watching.
- **Shorts:** each episode gets one or two vertical 45–60 s teasers, built
  around a tape's "find the figure" moment, to feed Shorts, TikTok and Reels.
- **Sound:** dialogue in Taglish with a designed voice per main character
  (ElevenLabs voice design, after the user's approval). English captions are
  burned in, with an SRT for YouTube. There is no narrator; the story is told
  through scenes and tapes.
- **Cost:** each episode will cost more ElevenLabs credits than a short, since it
  has several voices and 4+ minutes of dialogue. The real figure will be measured
  per episode and checked against the account balance first. Render time is
  still to be measured: a 4-minute episode is 7,200 frames at 30 fps.

## Main character: NICO (design sheet v1)

- **Who.** Nico, 34. He owns a struggling video-transfer shop in an old commercial
  row in a provincial city (unnamed). He is a decent, tired man with debt and a
  secret anonymous channel of "found tapes".
- **Build.** 1.68 m, lean with a small stress belly, and slightly rounded
  shoulders from years bent over decks.
- **Face.** Tanned Filipino features, a short beard shadow, tired eyes with dark
  under-eye bags, and heavy brows.
- **Glasses.** Black rectangular frames: his silhouette signature.
  - In horror shots, the screens he watches reflect in his lenses. That is how
    the audience sometimes sees a tape before he does.
- **Hair.** Short black hair, grown out and messy, with a cowlick at the crown.
- **Costume (main).**
  - A faded dark-teal T-shirt and dark jeans.
  - Worn grey rubber shoes; tsinelas at home.
  - A cheap black digital watch on his left wrist. Its alarm is a recurring
    sound.
- **Acting notes.**
  - He moves economically.
  - He touches the tapes carefully, with both hands, like a professional.
  - When he is scared he goes very still, not big.
  - He rubs his eyes under his glasses.
- **Expressions (painted face textures):**
  - neutral and tired;
  - focused (narrowed eyes);
  - forced smile with customers;
  - fear (wide eyes, mouth slack);
  - "watching" (unblinking, a screen reflected in his glasses).

The model is built procedurally in Blender (`assets3d/characters/nico/`) and
rigged. Its turnaround renders are the visual character sheet for approval.
There is no image generator here, so the model itself is the sheet.

## Nico blockout v0 (2026-11-12): below the reference bar

- **What it is.** `assets3d/characters/nico/build_nico.py` builds Nico entirely in
  headless Blender (`bpy` 5.3, in a scratchpad venv).
  - **Body:** a skin-modifier body with five-finger hands, and a shirt and
    jeans as thickened shells, so hems and cuffs are real geometry.
  - **Head:** shaped by formula, with a 64×64 nearest-filtered painted face
    (neutral, focused and fear expressions).
  - **Glasses and rig:** wire-frame glasses, and a 51-bone armature (fingers,
    jaw) with automatic weights. Every vertex is weighted.
  - **Outputs:** a GLB, plus the turnaround in `blockout-v0/` (Cycles CPU).
- **Speed.** Cycles renders a 540×960 still in about 5–9 s on 4 cores. The
  whole build, rig and six views take about 45 s. EEVEE and Workbench can't
  run here (no EGL or Vulkan).
- **Honest verdict.** It is a mannequin-level blockout, well below the
  reference's model quality:
  - the head reads as an egg on a peg neck;
  - the hair reads as a cap;
  - the nose is a spike in profile;
  - the limbs are tubes.
  - Building humans from formulas in code will not reach the bar.
- **The better route** is MakeHuman / MPFB (Blender add-on). It offers
  realistic, properly built human base meshes with body and face shape
  controls (including Asian ethnicity), a game-ready skeleton, and hair,
  eyebrows and clothes.
  - The base mesh, targets and exported models are CC0. Each extra asset's
    licence must still be checked.
  - The `makehuman` 1.3.2 wheel on PyPI has the targets (`targets.npz`) but no
    base mesh or assets.
  - GitHub, extensions.blender.org and makehumancommunity.org are blocked by
    this environment's network policy.
  - Two ways in: allow those hosts, or the user downloads the MPFB add-on and
    the MakeHuman system assets and shares them on Drive. Drive downloads work.
- **Status.** Not approved and not proposed for approval: v0 only proves the
  pipeline (build, rig, weight, export, render).
