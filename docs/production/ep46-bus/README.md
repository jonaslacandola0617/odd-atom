# Episode 46 "Huling Biyahe Pahilaga": production notes

`Ep46HulingBiyahePahilaga` / `src/horror/ep46/` (`world.tsx`, `Episode46.tsx`) is 53.52 s, 1080×1920 at 30 fps, in Taglish (Juanito). It retells, in our own words, a kind of experience night-bus passengers have shared online: on the last trip north, a lone woman flags the bus down at a curve by a ravine, sits down, and when the conductor comes to collect she is gone. No real bus line, crew, road or person is used.

## Form: "the count"

The conductor's ticket punch counts the riders, row by row, and every count is a click. Twenty-three of us; his count says twenty-four.

| Shot | What happens |
|---|---|
| hook | over my seat: the conductor comes up the aisle from the rear, one row a click; the last click points at her, behind me, head bowed (the clicks straddle the loop seam) |
| road | the bus on the mountain road at night, LAST TRIP, from above and behind |
| curve | low by the guardrail over the ravine: she stands under the one lamp; the bus comes in and stops, the door opens; she steps toward it in held steps |
| board | from the rear: she comes down the aisle toward the lens in held-then-snapped steps, head bowed, dripping, and sits behind me |
| collect | the conductor comes up behind her to collect; the strips flicker; the seat is empty |
| stop | the bus stopped, every light on, everyone awake: he counts every seat, a click each |
| dent | the backrest behind me: a black wet hollow where a head lay back, dripping |
| count | his eye-line onto me looking up at him; behind me she lifts her head; after the line she comes up over my seat at the lens (stinger) |
| loop | the hook again |

## Picture technique

- **The cabin:** box-built (the packs have no bus): 2+2 seats in 0.8 m rows with headrest covers, roof strips (every second one dead until the bus stops), the dash with its gauges, a street lamp's light sweeping past the windows while the bus moves.
- **The count:** the conductor's arm aims at the counted seat. Coming up from the rear (facing −z) he points with his left hand, the world direction turned into character space (x and z negated).
- **Her steps** are quantised to 0.45 s (held, then snapped); the sit is a snap.
- **The dent:** a black disc and a wet streak on the backrest, with drips that fall on a loop-safe clock.
- **Cast:** me `Character_14`, her `Character_Female_12` (navy long sleeves, pale), the conductor `Character_30`, the driver `Character_03`, eleven riders.

## Lessons

- A seat directly behind another seat is hidden from the front by the sitter in front: shoot the person behind from the aisle side, aimed at her head.
- A tint on a textured material multiplies: a dark tint over a dark texture goes black, and nothing (a wet dent) can read on it.
- `circleGeometry` faces +z: a decal on a face that looks −z must be turned round.
- The pack's long-haired young women all wear crop tops; for care she is a figure in long sleeves.

## Sound (`scripts/ep46_sound.py`)

- **Generated:** ElevenLabs flow `h5EIP6tIdelmGnwmnM6E`, 3 prompts × 4 variations, about 400 credits: the bus at night (a 20 s loop), the ticket punch (4 s), air brakes and the door (6 s). All variations are in Git (`public/assets/audio/eleven-sfx/ep46-*`).
- **Picked by measurement:** busloop-1 (the steadiest), punch-4 (no clipping; one click cut from its loudest onset), brakes-2.
- **Reused (the library first):** Episode 36's coin-1 and vinyl-1, Episode 40's cicadas-1, and Episode 41's drone-1, stinger-2, riser-1, musicbox-1, whispers-1 and neck-1.
- **The mix:**
  - The bus loop runs under every moving shot and is folded across the seam; stopped, it drops to a low-passed idle with cicadas outside.
  - One click of the punch is placed on every count in the picture.
  - The brakes and the door come at the curve, and again in the gap before the crew's stop.
  - Her wet steps fall on each held step; drips land on the vinyl.
  - The score drops out when she is gone, with a crackle from the strips.
  - The neck crack and the stinger fall in the silence after the last line.
- **Figures:**
  - presence −11.6 dB in speech and −4.8 dB in the gaps;
  - lines ≥7.7 dB over everything else (phone band ≥8.2 dB), with no lifts;
  - −14.0 LUFS; decoded peak −1.48 dBFS;
  - seam −24.4 / −22.3 dBFS.

## Voice

Juanito, `eleven_v4`, both takes at once (1,342 credits; take 1 used, 51.9 s), inner pauses capped at 0.32 s, no tempo change. Prompts are in `prompt.json`.

## Care

- No bus line, operator, route sign, crew or road is named; the sign says only LAST TRIP.
- She is never shown harming anyone; nothing is said about how she died, and no real accident is used.
- Told as an experience shared online; nothing claimed as verified.

## Status

No user approval and no listening pass.
