# Episode 41 "Bilang sa Bintana": production notes

`Ep41BilangSaBintana` / `src/horror/ep41/` (`world.tsx`, `cast.tsx`, `Episode41.tsx`) is 50.17 s, 1080×1920 at 30 fps, in Taglish (Juanito). It is the Season 5 opener and the first full episode built with the user's PSX models. It is a commuter's experience shared online (a night UV Express; from a Kami.com.ph roundup of passengers' accounts), retold in our own words. No real person, operator, route, terminal or plate is used.

## Form: "the count in the window"

One night ride, cut between the van and its dark left window, where the reflection keeps a different count.

| Shot | From | What happens |
|---|---|---|
| hook | the glass, at a grazing angle | my face in the window; beside me two pale women, heads turned to me, the nearer one with long hair over her face |
| ext | the avenue | the van alone under sodium lamps (PSX car pack van, URBAN street lights and buildings) |
| wide → side | the front, then the sliding door | everyone sways at the "lubak" bump; the two women stay perfectly still |
| phone | my eyes | an original little runner game on my phone; at the edge, her pale hand on her thigh; one breath |
| win1 | the glass | their heads turn toward me in four held-then-snapped steps, past where a neck can go |
| empty | my eyes, turning | the two seats are empty, still dented; the score drops out |
| aisle → hand | my seat | the van drives on, nobody looks up; my hand on the warm vinyl |
| win2 | the glass | they are in it, nearer, at my shoulder; the nearer one's head tips to the lens (stinger) |
| loop | the glass | the hook, on negative time |

## Picture technique

- **The reflection** is a mirrored copy of the cabin (`Reflection`: scale x −1 about the left-window plane) with its own occupants, behind a dark tint pane with lamp glints sweeping across.
- **The window camera** stands just behind the second bench's backrest, 0.14 m from the glass, aimed 46–52° toward the rear. The rear bench is a line along x, so from any camera looking straight at the glass the heads stack behind my own reflection. Only a grazing view spreads them across the frame.
- **The road:** `road(t, lag)` turns the bump list into a jolt and a roll. Every rider takes it through spine, neck and head (each with a small lag), and so does the camera. The two women ignore it.
- **The bone probe:** `PsxCharacter` now has a `probe` prop that returns bones' world positions after posing. The phone and the phone-POV camera follow my hands and head through it. They read it in `useFrame`, because a loading model re-renders only itself.
- **Kit additions:** OBJ loading and a `tex` override on `PsxProp`, for the car pack.

## Lessons

- **Pose a model detached from its parents** (`obj.parent = null` around `applyPose`). Under the mirrored reflection group (scale x −1), the world matrix has no clean rotation, so "character space" came out wrong. Stills hid it, because on a page's first frame the model isn't in the scene yet. The first full render had my reflected head thrown back and a broken loop seam. Fixed in the kit, then checked with a sequential render of the last 125 frames (last frame vs frame 0: 1.7/255).

- **A reflection of people sitting in a row** needs a grazing view along the glass, or your own reflection hides them.
- **Keep the window camera out of objects:** behind any backrest (the mirrored backrest otherwise fills the frame), and clear of window pillars (move the pillar if the steeper aim needs it).
- **Read probed positions in `useFrame`, not during render:** a stale camera rendered the floor.
- **A POV camera** must sit in front of the face mesh (head bone + about 0.17 m up and forward), or it renders the inside of the head.
- **A per-vertex-lit cabin needs** ambient about 1.6 and lighter vinyl to read at all; the PALE tint (with emissive) keeps the women readable in the glass.

## Sound (`scripts/ep41_sound.py`)

**New this episode:** long and looping ElevenLabs effects, generated with `duration_seconds` and `loop` set. Earlier episodes used 1–4 s takes.

- **Generated:** flow `uIbJVElVeRxF6juAhqKV`, 7 prompts × 4 variations, about 812 credits:
  - van interior, a 12 s loop;
  - a horror drone bed, a 20 s loop;
  - whispers;
  - a neck crack;
  - a stinger;
  - a music box;
  - a riser.
- **Picked by measurement:** van-3, drone-2, whispers-1, neck-2, stinger-2, musicbox-3, riser-3.
- **The library was checked first:** the Curio cues are editorial or science sounds. None was needed here.
- **The mix:**
  - The van loop is folded across the loop seam.
  - The 20 s drone is the BGM layer under the loop-quantised `horror_score` (drone, strings, bowed metal, heartbeat).
  - Every bump in the picture has a thump and rattle.
  - Four neck cracks are cut from one take, one per snapped step, with the second woman a beat behind.
  - The score drops out dead while I look at the empty seats.
  - The riser leads into the last window; the ElevenLabs stinger, doubled by a synthesized one, lands in the silence after line 8.
  - Whispers run across the seam.
- **Figures:**
  - presence −11.3 dB in speech and −3.2 dB in the gaps;
  - lines ≥6.4 dB over everything else (phone band ≥4.7 dB), with no lifts;
  - −14.0 LUFS; decoded peak −1.1 dBFS;
  - seam −22.6 / −22.5 dBFS;
  - no stinger inside speech.

## Voice

Juanito, `eleven_v4`, both takes at once (1,204 credits; take 1 used, 46.8 s), inner pauses capped at 0.32 s, no tempo change. The prompt and the SFX nodes are in `prompt.json`; the timeline is `src/data/ep41-uv-v1-timeline.json` (`scripts/ep41_voice.py`).

## Care

- Retold in our own words; no real person or identifiable place, operator, route or plate.
- The posts say "batay sa mga karanasang ibinahagi online", and nothing is claimed as verified.
- No harm is shown.
- `Character_Monster_05` appears only in the reflection, as a figure, never as a real person.

## Status

No user approval and no listening pass (no audio audition in this runtime).

Render with `node scripts/render_ep41.cjs` (stills: `--stills --frames …`).
