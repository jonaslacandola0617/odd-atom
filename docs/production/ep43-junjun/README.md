# Episode 43 "Si Jun-Jun": production notes

`Ep43SiJunJun` / `src/horror/ep43/` (`world.tsx`, `Episode43.tsx`) is 49.19 s, 1080×1920 at 30 fps, in Taglish (Juanito). It retells, in our own words, call-center agents' accounts of a small boy seen on the 2 a.m. floor, who follows an agent to a new company. The sources are a 2006 forum thread and agents' testimonies in a 2017 viral story. Nothing from the film *Sunod* is used. No real company, building or account appears.

## Form: "under the desks"

The boy is never shown whole and lit. He appears as a small figure running past in the aisle, in my dark second monitor, and under my desk.

| Shot | What happens |
|---|---|
| hook | from inside an empty desk's cave, low: a small pale figure runs past in the aisle (stop-motion, 10 steps a second) |
| floor | Floor A at 2 a.m. from a high corner: rows of cubicles, a few monitors on, agents |
| senior | from the aisle: the senior agent leans back, turns her head to me, then looks down at the floor |
| pov | my screen ON CALL; after the line, feet running behind me; I turn: a chair rolling by itself |
| reflect | the dark second monitor (the view from it, mirrored, under a tint and bezel): me, and at the desk edge by my legs his bowed head; after the line it lifts |
| leave | my cleared desk; my chair turns by itself toward the exit |
| newfloor | Floor B, another company: blue-grey dividers, brighter panels |
| cable | my headset on the desk, pulled toward the edge in four jerks, then it drops |
| under | I lean down: the cave under my desk; he sits hugging his knees; the light reaches him; after the line his head snaps up and tips toward the lens (stinger) |
| loop | the hook on negative time (his run begins before the seam) |

## Picture technique

- **The boy:** `Character_12` (white T-shirt, black shorts), tinted pale, normalised to 1.12 m. A new `['scale', s]` pose step in the kit enlarges his head bone (×1.38) for child proportions. The packs have no child model.
- **The reflection:** shot from the monitor's position looking back at me, then flipped (`translateX(width) scale(−6, 6)`), under a cold tint, a glare and a bezel. Simpler than a mirrored copy of the set, and exact for a flat mirror.
- **The desks:** the side and back panels make each under-desk space a cave that opens toward the chair, so "under the desk" reads.
- **The call screen:** drawn live (`useLiveTex` from Episode 42).
- **Props:** the office chair from the PSX OFFICE pack, tinted, because the GLB has no texture and rendered white.

## Lessons

- A camera inside a divider's plane shows a black frame, so keep cameras clear of panel planes (the senior shot moved to the aisle).
- A "behind me" turn needs its target lit and the camera to follow the moving prop.
- An under-desk shot needs the camera below desk-top height, with the chair removed.

## Sound (`scripts/ep43_sound.py`)

- **Generated:** ElevenLabs flow `USvypiF3DYNfkpU534SP`, 5 prompts × 4 variations, about 384 credits:
  - the call floor, a 15 s loop;
  - small bare feet;
  - a faint giggle;
  - headset tones;
  - a cable tug.
- **Picked by measurement:** floor-3, feet-4, giggle-2, headset-2, cable-1.
- **Reused (the library first):** Episode 41's unused musicbox-1, drone-3, stinger-4, riser-2 and whispers-3, and its neck-2 crack.
- **The mix:**
  - The floor loop is folded across the seam, and the hook's run crosses it.
  - The headset beeps and disconnects; the chair squeaks as it rolls and turns.
  - The music box plays in the reflection, with a giggle as his head lifts.
  - Four tugs on the cable, then the headset drops.
  - Whispers and a heartbeat under the desk, a riser, then the stinger and a neck crack on the snap.
- **Figures:**
  - presence −9.9 dB in speech and −3.1 dB in the gaps;
  - lines ≥6.2 dB over everything else (phone band ≥5.0 dB), with no lifts;
  - −14.0 LUFS; decoded peak −2.24 dBFS;
  - seam −20.1 / −16.8 dBFS (the run begins at the seam); last frame vs frame 0: 2.6/255.

## Voice

Juanito, `eleven_v4`, both takes at once (1,304 credits; take 1 used, 45.6 s), inner pauses capped at 0.32 s, no tempo change. Prompts are in `prompt.json`.

## Care

- A child figure: never harmed and never harming, never sexualised; his face is held lit only for the snap.
- No company, building, account or agent named.
- Retold in our own words; nothing claimed as verified.

## Status

No user approval and no listening pass.
