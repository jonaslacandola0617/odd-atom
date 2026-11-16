# Episode 49 "Bukas Pa Kagabi": production notes

`Ep49BukasPaKagabi` / `src/horror/ep49/` (`world.tsx`, `Episode49.tsx`) is 59.83 s, 1080×1920 at 30 fps, in Taglish (Juanito). It retells, in our own words, a kind of experience delivery riders have shared online: a 2 a.m. pickup at a milk tea shop that, the next day, is padlocked and has been closed for months, with the receipt still in his pocket. No real shop, brand, street or barangay is used.

## Form: "the shopfront"

One milk tea shop seen through its glass by night, cut against itself by day.

| Shot | What happens |
|---|---|
| hook | the lit shopfront at night, a queue of five facing the counter; their heads come round to the lens in two held-then-snapped steps, the bodies never turn |
| street | the dark corner from above, one shop lit; my scooter pulls up |
| queue | just inside the door, along their backs to the counter: nobody moves; once, the whole queue breathes in and out together |
| counter | the crew: her head tips in held-then-snapped steps; the sealer; she reaches the sealed cups out to me; the receipt prints |
| exit | out on the sidewalk, looking back through the glass: every head turned round to me, past where a neck goes, the bodies still facing the counter |
| lock | by day, close on the chain and padlock on the shutter |
| day | the same front, shutter down, FOR RENT, the sign dead; the guard points at it: six months |
| receipt | the receipt in my fingers against the shutter: 11/15, 02:00 AM; it turns over: "Balik ka, sir. Kulang pa ang pila." |
| glass | night again: she stands right against the glass, head bowed; on the stinger it comes up at the lens, tipped |
| loop | the hook again |

## Picture technique

- **The shop:** box-built (the packs have no shop props): glass front and door, a counter with a register and sealer, a menu board and cup shelves drawn as canvas textures (generic flavours, no brand), two tables, three tubes; shuttered neighbours, two dark storeys and the URBAN street lamp outside.
- **Day:** the same front with a rolling shutter, chain and padlock, a FOR RENT sheet and dust; the sign unlit.
- **Turned heads:** `Neck` and `Head` y rotations add up (about 175° at full turn), alternating left and right along the queue.
- **The hand-over:** the crew's `reach` brings the cup out across the counter.
- **The receipt:** two back-to-back planes with canvas textures, flipped about its long axis.
- **Cast:** the queue `Character_03`, `29_Female`, `30`, `31_Female`, `05` (tinted grey); the crew `Character_Female_12`, pale (long sleeves; `Female_09`'s camisole was swapped out for care); the guard `Character_17_Police`; me `Character_14` on a box-built scooter with a plain box (no brand).

## Lessons

- Faces turned toward a camera outside a lit shop are backlit by its tubes: add a cold fill just inside the glass, or the turn doesn't read.
- A queue seen end-on hides itself: stagger it left and right and bring the camera near the axis.
- Keep a walking-out camera off the door's mullion (a black bar filled the first exit frame).
- `rng` with a negative seed returns negative values: the grain seeded from `t` went black on the loop shot (negative time) and darkened the last 1.7 s. Seed it from `t + 600`. Episodes 40–48 share the old line; their dark loop shots hid it (seams ≤1.4/255).

## Sound (`scripts/ep49_sound.py`)

- **Generated:** ElevenLabs flow `18e3nTjfWiM9wFnn8LAP`, 6 prompts × 4 variations, about 572 credits: the shop at 2 a.m. (a 15 s loop), a day street (a 15 s loop), a scooter arriving, a cup sealer, a receipt printer, a padlock and chain on a shutter. All variations are in Git (`public/assets/audio/eleven-sfx/ep49-*`).
- **Picked by measurement:** street-2 (the steadiest, 4.8 dB range), scooter-4, sealer-3, printer-4, padlock-2, shop-4. Every shop loop has deep gaps (33–54 dB range), so shop-4 is compressed and layered over Episode 45's tube loop, Episode 42's lobby and a synthesized fridge hum.
- **Reused:** Episode 45 crloop-1, Episode 42 lobby-2 and door-3, Episode 48 roomloop-b1 (far traffic), Episode 40 cicadas-1, Episode 29 breath-4, and Episode 41's drone-2, stinger-4, riser-3, musicbox-2 and neck-4.
- **The mix:**
  - the shop is heard through the glass outside and full inside;
  - neck cracks on every snap of the queue's heads (the hook's cross the seam), quieter on the crew's tilts;
  - one breath from the whole queue at once;
  - the sealer, the printer and the glass door; the padlock by day;
  - the score drops out by day and comes back at the receipt; the stinger falls after the last line.
- **Figures:** presence −10.3 dB in speech and −3.8 dB in the gaps; lines ≥7.6 dB over everything else (phone band ≥8.4 dB), with no lifts; −14.0 LUFS; decoded peak −1.21 dBFS; seam −24.7 / −25.1 dBFS; picture seam 3.2/255 (frame 0 vs the last frame; v1's first render measured 4.4 because the grain was black on negative time, see Lessons).

## Voice

Juanito (`u1CVBnSUn9JiL8ssgd2v`), `eleven_v4`, both takes (1,576 credits; take 1 used), inner pauses capped at 0.32 s, no tempo change. Prompts are in `prompt.json`.

## Care

- No real shop, brand, street or barangay; the menu lists generic flavours.
- The queue and the crew are never claimed to be anyone real; no death or crime is implied.
- Told as an experience shared online; nothing claimed as verified.

## Status

No user approval and no listening pass.
