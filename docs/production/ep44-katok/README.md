# Episode 44 "Sumunod ang Katok": production notes

`Ep44SumunodAngKatok` / `src/horror/ep44/` (`world.tsx`, `Episode44.tsx`) is 48.88 s, 1080×1920 at 30 fps, in Taglish (Juanito). It retells, in our own words, a first-person account shared online: after a grandfather's wake in the province, knocking followed the family home and came nearer, door by door. Similar accounts exist on ghost-story sites. No real family, town or house is used.

## Form: "the plan"

The house is seen straight down from above (no ceiling, a narrow lens from high up so it reads as a floor plan). The knocking climbs the plan night by night: the front door (bottom), the kitchen door (right), Mama and Papa's door (mid-hall), and mine (top). Each knock shakes its door and lights the gap under it.

| Shot | What happens |
|---|---|
| hook | the plan: me in bed; three knocks at my door, its gap lighting (the knocks straddle the loop seam) |
| wake | Lolo's wake in the province: the coffin between two candles, mourners from behind, the photo turned dark |
| n1 | the plan, night 1: three knocks at the front door |
| n2 | night 2: the kitchen door |
| n3 | night 3: Mama and Papa's door; they lift their heads |
| bed | my eyes from the pillow: the light under my door, the shadows of two feet in it; three knocks |
| knob | my hand on the knob, trembling |
| open | the door swings open into my room |
| hall | down the hall from my doorway: Lolo at the end, his back to me; his head comes round in three snaps while his body never turns; after the line he is suddenly nearer, face to me, head tipped (stinger) |
| loop | the plan again, the three knocks |

## Picture technique

- **The plan:** the camera is 13–20 m up with a 26° lens and `up` = −z, so the walls read as lines.
- **The house:** a `Wall` helper builds axis-aligned walls with door gaps and lintels.
- **Doors:** each `Door` hinges at its edge (`open`), shudders on a knock (`shake`) and has an additive glow plane plus a point light in its gap (`glow`).
- **Props:** the derelict pack (couch, shelf, vase, fridge, chair, mattresses).
- **Lolo:** `Character_29`, pale. His Neck and Head together turn about 175° while the body faces away.
- **Lying figures:** a group turned on y, holding a character rotated −π/2 about x.

## Lessons

- A top-down floor plan needs a high camera and a narrow lens: at 6–9 m with a 50° lens the walls swallowed the rooms.
- A wake framed past the coffin must keep the candles inside the portrait cone (about ±1.1 m at 4 m with 52°); pull back and widen.

## Sound (`scripts/ep44_sound.py`)

- **Generated:** ElevenLabs flow `dVySou8LXQ7oUqrMWw1o`, 2 prompts × 4 variations, about 252 credits: the house at night (a 15 s loop) and a doorknob and door opening (4 s).
- **Picked by measurement:** house-1, door-3.
- **Reused (the library first):**
  - Episode 32's knock-1 (one knock cut and placed on every door in the picture: muffled and far at first, close and dry at mine);
  - Episode 35's prayers-1 at the wake;
  - Episode 39's slippers-4 in the hall before my door;
  - Episode 41's unused drone-4, stinger-1, riser-4 and musicbox-2, and its neck-2 cracks.
- **The mix:**
  - The house loop is folded across the seam.
  - The score drops out at the wake.
  - A heartbeat runs from my bed to the door.
  - The cracks on Lolo's turn are kept low inside the last line.
  - The stinger lands in the silence after it.
- **Figures:**
  - presence −12.0 dB in speech and −4.4 dB in the gaps;
  - lines ≥8.5 dB over everything else (phone band ≥6.2 dB), with no lifts;
  - −14.0 LUFS; decoded peak −1.27 dBFS;
  - seam −20.2 / −24.6 dBFS (the hook's knocks cross it).

## Voice

Juanito, `eleven_v4`, both takes at once (1,252 credits; take 1 used, 45.0 s), inner pauses capped at 0.32 s, no tempo change. Prompts are in `prompt.json`.

## Care

- Grief is treated kindly. The last spoken thought is Mama's: he may not have said goodbye yet.
- The wake is shown with respect; the photo is turned dark, with no face.
- Lolo is never harmed or grotesque: pale and still, wrong only in the turn.
- No real family, town or house.

## Status

No user approval and no listening pass.
