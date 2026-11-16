# Episode 51 "Po Po Po" (Season 6 opener)

`Ep51PoPoPo` / `src/horror/ep51/` (`world.tsx`, `Episode51.tsx`): 59.92 s, 1080×1920, English (Jack), the PSX models, a score of its own, a seamless loop.

**Story:** a 2ch occult-board post (2008, the "Hasshaku-sama" thread), retold in our own words (`docs/stories/season-6-world.md`). A teenager at his grandparents' farmhouse sees a white hat gliding along the top of a hedge taller than a man. His grandparents seal him in the upstairs room overnight with newspaper on the windows and salt in the corners. Something outside speaks in Grandpa's voice. At dawn the family drives him out of the valley, and she keeps pace. Our changes: Grandpa sits with him all night (so the imitation can be shown: the voice at the door is Grandpa's while Grandpa sits beside me, shaking his head); her face at the window and her stretching neck are our dramatisation.

## Uniqueness (Season 6 table)

- **Mechanism:** imitation (it borrows Grandpa's voice).
- **Entity:** a woman 2.75 m tall (`Character_Female_12`, pale, stretched), a built white dress and a wide hat with a black band; she folds at the waist and her neck stretches down to bring her head to a man's height.
- **Form:** daylight bookends (overexposed summer) and a sealed room, held locked-off through the night.
- **Scares:** (1) the hat stops, the cicadas die, her eyes over the hedge; (2) the salt blackens and nails tap every window at once; (3) the shadow folds down on the door's paper while Grandpa's voice asks to come in; (4) the newspaper tears: her sideways face, black eyes; (5) dawn, bent double beside the car, her hand at my window.
- **Look:** bleached overexposed day with a pale bloom edge; dusk sepia; yellowed-newspaper night under one bulb; cold valley mist at dawn. Serif captions; the door's voice in pale yellow italics.
- **Sound:** cicadas, the sealed-room drone, salt, nails, "po po po", the muffled door voice, the newspaper tear (the stinger), her steps on the gravel. No Episode 41 sounds.
- **Head-snap-to-lens:** not used.
- **Gore:** none (this story doesn't earn it).

## Shots

| Shot | Time | What happens |
|---|---|---|
| hook | 0–8.9 (and the loop, −1.8–0) | the hedge at midday from the engawa; the hat glides in from the left and stops; the cicadas stop; she rises to her eyes; her head tips |
| grandpa | 8.9–12.6 | Grandpa turns to the hedge; the warm light drains out of his face |
| seal | 12.6–16.1 | dusk: Grandma (tinted darker; from behind the cardigan read as skin) presses newspaper up over the window |
| salt | 16.1–18.3 | salt poured into the corner bowl |
| door | 18.3–22.2 | Grandma in the doorway; the sliding door runs shut |
| night | 22.2–34.3 | locked off in the far corner, the near bowl in the foreground: its salt turns black in silence; two frames of her shadow (subliminal); single taps, then every window pressed in at once |
| shadow | 34.3–44.0 | the paper door, lit from the hall: her shadow, head above the lintel; with the voice it folds down at the waist and the neck stretches the head down; it bobs with the words; it tips to listen |
| two | 44.0–48.2 | Grandpa beside me, shaking his head |
| tear | 48.2–50.4 | the newspaper rips off the window: her face, sideways, black eyes, a dark mouth, pressed to the glass |
| road | 50.4–54.6 | dawn mist: the van, and her bent double beside it, keeping pace |
| car | 54.6–58.1 | inside: my head bowed; at the window her hat brim and a long pale arm |

## Technique and lessons

- **Her hat and dress follow her bones in `useFrame`.** A sibling component that reads `probe` values during React render misses the frame the model arrives (only `PsxCharacter` re-renders then). Read the bones in `useFrame` (and once in a layout effect), as the PSX lessons say.
- **A white hat against an overexposed sky disappears.** Give the day sky a pale blue-grey and the hat a black band.
- **A hedge-top reveal needs the camera raised:** from 1.4 m the hedge's near face hides 0.4 m more of a figure 1.4 m behind it. The camera stands on the engawa (1.85 m).
- **Fold at the waist:** bend `Spine`, `Spine1` and `Spine2`; let the neck carry the bend (a counter-rotated neck undoes it), and level only the head. Hanging the head lower is a neck `x` plus a neck `stretch`.
- **A sideways face at a window:** the whole figure rotated 90° about z, its body outside the wall. Features (black eyes, a mouth) are placed in the face's own frame, built from `Head` and `HeadTop_End`, and offset out to the surface (her head is 1.6× normal size).
- **The shadow on the door** is a canvas drawn every frame (`drawShadow`), with lattice boxes in front.
- **The car interior** is box-built as a van, so a bent 2.75 m figure's head and hat come level with its window.
- The grain's `rng` seed stays positive (`(t + 600) * 24`).

## Sound

`scripts/ep51_sound.py` (stems as FLAC, `PROVENANCE.json`). ElevenLabs flow `uHNGTmumzm2eTXu7RR4R` (`docs/production/ep51-popo/prompt.json`; every take and variation is in Git). The first effects run had no duration set and came back 1–16 s; all are kept, and the beds were re-run with `duration_seconds` and `loop` set on the node.

**Figures:** presence −12.1 / −2.8 dB, lines ≥4.7 dB (the door voice lifted 3.8 dB), −14.0 LUFS, decoded peak −1.76 dBFS, seam −22.8 / −23.4 dBFS, no stinger inside a line.

**Voice:** Jack, both takes (1,602 credits; take 1 used; inner pauses capped at 0.22 s; no tempo change). The voice through the door: Alden, both takes (230 credits; take 1 used), band-limited and reverberant.

**Credits:** about 3,136 in all (narration 1,602, door voice 230, effects about 1,304).

## Status

Delivered; no user approval and no listening pass.

## Review of the encoded file

`assets/videos/ep51-popo-v1/ep51-po-po-po.mp4`, 47838976 bytes, SHA-256 `abe34a6d13653b19325d7f1eeefd16675bc3b314f9b268219d51769fe3b67cad`; H.264 1080×1920, 1,797 frames (59.9 s); AAC 59.88 s; −14.0 LUFS; last frame against frame 0: 1.8/255 mean difference (the loop). A contact board (one frame every 3 s) was checked for every shot.
