# Episode 50 "Si Lola sa Panaginip": production notes

`Ep50SiLolaSaPanaginip` / `src/horror/ep50/` (`world.tsx`, `Episode50.tsx`) is 59.46 s, 1080×1920 at 30 fps, in Taglish (Juanito). The Season 5 finale. It retells, in our own words, a kind of experience families have shared online: a late grandmother who visits in dreams to warn the family, until one night the old woman in the dream is not her. No real family, street or barangay is used.

## Form: "the dream and the house"

The dream (cold, washed out, fog) cut hard against the house (dark, warm, rain).

| Shot | What happens |
|---|---|
| hook (dream) | from my pillow: an old woman at the foot of my bed, her back to me; her head comes round toward me in two snaps, the face still away |
| dream1 (dream) | Lola sits on the edge of my bed, turned to me, the rosary in her hands: "Huwag kang lalabas bukas, apo." |
| flood (house) | the morning after: from my window, the street under brown water, chest-deep, a neighbour wading |
| watch (house) | night: Lola in my doorway, watching over me |
| last (dream) | the foot of the bed again: grey hair, her back to me |
| door (house) | the sala: under the front door, the light broken by two feet; the knob turns, twice |
| turn (dream) | I come closer: her head turns round first, in snaps, past where a neck goes, and the body after; Lola's rosary, not Lola's face |
| wake (house) | the front door open on the rain |
| bed (house) | the hollow at the foot of my mattress, deepening |
| sit (house) | she is sitting there; on the stinger her head snaps round to the lens |
| loop | the hook again |

## Picture technique

- **The dream:** the same room with `fog` (0.6–4.2 m), a cold ambient and a washed CSS grade on the canvas; the house keeps the season's grade.
- **Head first:** `Stranger` turns the head with `Neck` and `Head` y (half each); when the body follows (it comes only part way round, its legs still over the edge of the bed), the head gives back what the body takes, so her face stays on me.
- **The feet under the door:** a thin lit strip on the floor in front of the door, broken by two dark boxes.
- **The dent:** a dark ellipse on the sheet at the foot of the bed that grows.
- **Cast:** Lola `Character_29_Female` (untinted, warm); the stranger `Character_31_Female`, pale (the two read alike from behind: grey hair in a bun); neighbours wading `Character_03`, `Character_05`. The room, sala and street are box-built, with the derelict shelf and couch.

## Lessons

- A night interior with ambient `#4a5470` at 1.15 renders black after the grade and vignette: about 1.8 with `#5a6480`, plus a motivated source, is the floor.
- A light strip under a door must sit on the floor in front of the door's face, not inside it, and above the caption band.
- Water seen from a window needs a high camera looking down and an opaque surface, or the waders show through.

## Sound (`scripts/ep50_sound.py`)

- **Generated:** ElevenLabs flow `KoKWpDSnj3uvRbGHTWPT`, 5 prompts × 4 variations, about 467 credits: rain on a roof (a 15 s loop), a flooded street, a front door creaking open, a mattress giving, rosary beads. All variations are in Git (`public/assets/audio/eleven-sfx/ep50-*`).
- **Picked by measurement:** rain-3 (1.5 dB range), flood-4, door-1, mattress-3, rosary-2.
- **Reused:** Episode 44's house-1, and Episode 41's drone-2, stinger-4, riser-3, musicbox-2 and neck-4.
- **The mix:**
  - the dream is the same house and rain heard low-passed and reverberant, as if under water;
  - Lola's music box, warm in the first dream, slowed and lower in the last;
  - the rosary in both dreams; the doorknob twice; the door open on the rain;
  - the mattress gives in the last dream and again in the house;
  - neck cracks on every snap of her head (the hook's cross the seam); the stinger after the last line.
- **Figures:** presence −9.6 dB in speech and −3.2 dB in the gaps; lines ≥7.0 dB over everything else (phone band ≥7.5 dB), with no lifts; −14.0 LUFS; decoded peak −2.72 dBFS; seam −24.8 / −25.0 dBFS.

## Voice

Juanito (`u1CVBnSUn9JiL8ssgd2v`), `eleven_v4`, both takes (1,568 credits; take 1 used), inner pauses capped at 0.32 s, no tempo change. Prompts are in `prompt.json`.

## Care

- Grief is treated kindly: Lola is loving and protective throughout; what comes last is not her.
- No real family, street or barangay; no named flood or year.
- Told as an experience shared online; nothing claimed as verified.

## Status

No user approval and no listening pass.
