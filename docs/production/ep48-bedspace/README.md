# Episode 48 "Bedspace": production notes

`Ep48Bedspace` / `src/horror/ep48/` (`world.tsx`, `Episode48.tsx`) is 58.94 s, 1080×1920 at 30 fps, in Taglish (Juanito). It retells, in our own words, a kind of experience boarders have shared online: five students renting bedspace in an old Manila boarding house count six sleepers at 3 a.m. No real building, school or landlord is used.

## Form: "the count from the corner"

A ceiling-corner camera where all three double-decks' open sides face it; the phone torch counts the sleepers, one pool of light per count.

| Shot | What happens |
|---|---|
| hook | from the ceiling corner, the torch counts five, then a sixth: a figure facing the wall on the bunk above mine |
| building | the old building at night, one window lit |
| wake | 3 a.m., close on my bunk: I wake and lift the phone; the torch comes on |
| count | my count, standing, a click and a pool of light on every word: four friends, my empty bed, the sixth above it |
| morning | daylight: the upper bunk's mattress bare and dusty; the four stare at it |
| recount | from the corner again: four, me, the upper bunk empty, still six |
| bed | close on my bunk: something lies behind me, facing the wall, its face hidden |
| nape | its head turns round to my nape in held-then-snapped steps; on the stinger it comes over my shoulder at the lens |
| loop | the hook again |

## Picture technique

- **The room:** three double-decks (A along the left wall, mine below and the sixth above; C and D along the back wall), a window, a fan, dust motes; a box-built building outside.
- **The torch:** `Torch` is an additive cone and a point light; the count is driven by key times measured from the spoken numbers in `voice/l04.wav`.
- **Lying figures:** a group with the character rotated −π/2 about x, plus a roll group for lying on a side. The head bone sits 0.87 h from the feet (measured with the probe), not 0.93 h.
- **Cast:** me `Character_10`; the four friends `Character_12`, `Character_11`, `Character_08`, `Character_05`; the sixth `Character_Monster_02`, pale.

## Lessons

- Box pillows hid the lying heads again (as in Episode 47): leave them off any bunk shot close-up.
- Measure where a lying head ends up before framing it: the 0.93 h guess put the faces out of frame.
- A camera beside a lower bunk, raised to look over the sleeper, shows the figure behind; level with the sleeper, my head hides it.
- `Character_11`'s face texture grins, so he is a friend, not me.

## Sound (`scripts/ep48_sound.py`)

- **Generated:** on the old account (flow `hGPDgw0ks4oe2SVkpIjf`), four bunk creaks and one boarding-room loop before the credits ran out; on the new account (flow `58XmqiblL5aw1dUC52LC`), the room loop again (20 s, four variations). All are in Git (`public/assets/audio/eleven-sfx/ep48-*`).
- **Picked by measurement:** roomloop-b1 (the steadiest), all four creaks.
- **Reused:** Episode 29's breath-4, Episode 40's cicadas-1 (the morning), and Episode 41's drone-2, stinger-4, riser-3, musicbox-2 and neck-4.
- **The mix:**
  - one torch click on every count in the picture, panned to where it points (the hook's clicks fall before the seam);
  - the bunk creaks before the empty upper bunk is shown, as it lies behind me, and on each turn of its head;
  - its breath at my nape; neck cracks on every snap;
  - the score drops out at the bare mattress (a music box only), and the stinger falls after the last line.
- **Figures:** presence −12.6 dB in speech and −3.9 dB in the gaps; lines ≥4.9 dB with no lifts; −14.0 LUFS; decoded peak −1.3 dBFS; seam −23.5 / −25.3 dBFS.

## Voice

Juanito (`u1CVBnSUn9JiL8ssgd2v`), `eleven_v4`, both takes on the new account (1,474 credits; take 1 used, 56.96 s), no tempo change. Prompts are in `prompt.json`.

## Care

- No real boarding house, school, landlord or street.
- The sixth is a pack horror figure, never a real person; no death or crime is implied.
- Told as an experience shared online; nothing claimed as verified.

## Status

No user approval and no listening pass.
