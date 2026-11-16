# Episode 52 "The Branch"

`Ep52TheBranch` / `src/horror/ep52/` (`world.tsx`, `Episode52.tsx`): 48.3 s, 1080×1920, English (Jack), the PSX models, a score of its own, a seamless loop.

**Story:** a reader-submitted account on True Horror Stories of Texas (a utility worker sent at night to cut the power to a house in a small South Texas colonia; a neighbour points him to a tree; on a branch, something like a huge owl with a man's face, its lower body still changing), told with lechuza belief as folklore. Retold in our own words (`docs/stories/season-6-world.md`); no company, town or family is named. Our dramatisation: the bucket, the phone video, the splitting skin, and the clip on his phone he never took.

## Uniqueness (Season 6 table)

- **Mechanism:** transformation, caught halfway.
- **Entity:** a man (`Character_11`, the grinning face, tinted grey-brown) with an owl's mantle growing through him: about 200 feathers placed from his bones every frame, a ruff, wings hanging from his arms that unfold far too long, talons on his toes, knees bent the wrong way, perched.
- **Form:** a found phone video (REC, timer, focus box, compression blocks, exposure pumping), ending in the phone's gallery and a clip from the branch.
- **Scares:** (1) the cold open is the worst: his face in the work light; (2) the neighbour's silent point, something shifts in the dark leaves; (3) the light clicks on: a hunched feathered back; its head swivels round: a man's face, held; (4) its legs are a man's legs; the skin of its forearm splits as quills push through, blood drips (**gore**); (5) the wings snap open at the lens; the phone falls; (6) quiet and wrong: a clip he never took, from the branch, looking down at him.
- **Look:** a phone at night: sodium orange, saturated; the work light blows it cold and bright; 8×8 compression blocks; the gallery's clean UI.
- **Sound:** the transformer and crickets, dogs that fall silent, the whistle (motif), the bucket's hydraulics, the light's click, feathers, the splitting skin, the wings (stinger), the truck, breathing at the microphone in the clip. Nothing from Episode 41.
- **Head-snap-to-lens:** not used (its head swivels smoothly, like an owl's).

## Shots

| Shot | Time | What happens |
|---|---|---|
| hook | 0–2.55 (and the loop, 45.9–48.3) | level with its face in the work light, the zoom creeping in, its head tipping |
| street | 2.55–9.8 | the phone on the dash, rolling down the dark colonia; a curtain pulled aside |
| neighbour | 9.8–15.6 | an old woman by the pole points up; the phone tilts up into the tree; something shifts |
| bucket | 15.6–21.4 | rising into the canopy; the work light clicks on: a feathered back, side-on |
| turn | 21.4–26.9 | its head swivels round to the light: a grinning man's face, held |
| legs | 26.9–31.0 | down to its legs: a man's legs, the wrong way, talons |
| gore | 31.0–35.1 | zoomed on its forearm: the skin splits, quills, blood |
| wings | 35.1–37.7 | the wings open at the lens; the phone falls; black |
| drive | 37.7–42.0 | filming back from the cab as I drive off; the boom up; it on the branch |
| gallery | 42.0–43.1 | today's clips; the last one I didn't take |
| branch | 43.1–45.9 | the clip: from the branch, down onto the truck and me looking up |

## Lessons

- **A creature seen from behind hides its pose.** Reversed knees and a hunch foreshorten away when the camera looks down its back; turn it side-on to the lens.
- **Feathers as instanced quads placed from bone positions in `useFrame`** follow any pose, open or folded; give them a dark, barred texture (pale ones read as a checkerboard under a work light).
- **A wound decal needs the arm on the camera's side** and an unlit material; draw only the wounds, so the arm's own skin shows round them.
- **Long-sleeved models can't show splitting skin:** pick a model with bare forearms.
- **Phone POVs inside a box-built truck** look at its inner faces: hide the body (or film past it) and keep the camera out of its volume.
- **Generate effects with the duration set on the node** (`creative_add_flow_node` with `model_parameters`, then run): no wasted short takes.

## Sound

`scripts/ep52_sound.py` (stems as FLAC, `PROVENANCE.json`). ElevenLabs flow `UPdz7VfqnS3TyRW1ZPzx` (`docs/production/ep52-branch/prompt.json`; every take and variation is in Git).

**Figures:** presence −11.0 / −3.4 dB, lines ≥5.8 dB with no lifts, −14.0 LUFS, decoded peak −1.39 dBFS, seam −25.4 / −23.0 dBFS, no stinger inside a line.

**Voice:** Jack, both takes (1,450 credits; take 1 used; inner pauses capped at 0.22 s; no tempo change). **Credits:** about 2,210 in all.

## Status

Delivered; no user approval and no listening pass.
