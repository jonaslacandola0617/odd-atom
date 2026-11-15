# Episode 42 "Ikalabing-apat": production notes

`Ep42Ikalabingapat` / `src/horror/ep42/` (`world.tsx`, `Episode42.tsx`) is 52.85 s, 1080×1920 at 30 fps, in Taglish (Juanito). It retells, in our own words, night-shift security guards' accounts of an elevator that comes down from an empty floor every night (from a SunStar Cebu feature quoting guards). No real building, agency or company is used.

## Form: "the monitor"

The lobby is shown in colour. The 14th floor is seen only through its CCTV: grey, scanlined, with the on-screen display (channel, night, 03:00 clock, REC) and 8 fps, so everything on it moves in stop-motion.

| Shot | What happens |
|---|---|
| hook | from the desk: the indicator reaches L, a ding, the doors open on an empty, lit car |
| desk | the guard (`Character_17_Police`) lit by his monitor; he looks up at the elevator |
| monitor | the status screen: ELEV 1 at **14**, the floor list 16, 15, 14, 12 (no 13), "14F SARADO" |
| c1 | CCTV 14F, night 1: the doors open on the empty corridor |
| c2 | night 2: someone at the far end of the corridor, a little nearer each second |
| c3 | night 3: she stands at the doors, back to the camera; after the line her head turns round to the camera in three snaps, past where a neck goes; the doors open |
| c4 | last night: empty; the corridor's indicator counts down from 14 |
| count | the lobby indicator ticking 14 → L |
| end | the guard stands aside by the doors, head bowed; the doors open on the empty car |
| cctvL | the lobby camera: she walks out of the car past him; her head snaps up and tilts toward the lens (stinger) |
| loop | the hook on negative time (the indicator's 3, 2 before the ding) |

**Hidden details:**
- the building has no 13th floor, so the "fourteenth" is really the thirteenth;
- on night 2 she steps nearer between seconds;
- the 14F camera's clock never passes 03:00.

## Picture technique

- **The CCTV:** the scene time is quantised to 1/8 s and the CSS filter is grayscale, with a scanline overlay. The on-screen display is drawn on the caption canvas.
- **Live canvas textures:** `useLiveTex` draws the red LED floor indicator and the guard's status screen. Readable text needs about 96×72 texels and the camera far enough back to fit the whole screen (at 40° on a portrait frame, a 0.44 m screen needs about 1 m).
- **The elevator:** one `Elevator` component with sliding doors and a lit car, used in both sets (rotated into the 14F corridor's side wall).
- **Office props:** from the PSX OFFICE pack (desk, chair, desk lamp, wall clock, water cooler), scaled from their GLB bounds before the first still.

## Sound (`scripts/ep42_sound.py`)

- **Generated:** ElevenLabs flow `FMahe5qlmOqjxHibXC7L`, 4 prompts × 4 variations, about 532 credits:
  - elevator arrival, 5 s;
  - elevator shaft, a 15 s loop;
  - lobby night tone, a 15 s loop;
  - glass door, 5 s.
- **Picked by measurement:** elevator-2 (its ding and its door rumble cut apart), shaft-2, lobby-3, door-3.
- **Reused (the library first):** Episode 41's unused drone-1, stinger-3, riser-1 and whispers-2, and its neck-2 cracks.
- **The mix:**
  - The lobby loop is folded across the seam.
  - Everything on the 14th floor goes through a "monitor" band (350 Hz–3.2 kHz with a little grit) over CCTV hiss and the shaft loop.
  - A heartbeat runs under night 3, with a neck crack on each snap.
  - The score drops out for "Kagabi".
  - The indicator ticks down to L.
  - The glass entrance opens by itself as she walks out.
  - The stinger lands on the snap.
- **Figures:**
  - presence −8.2 dB in speech and −3.4 dB in the gaps;
  - lines ≥4.6 dB over everything else (lifts: l01 +0.8, l08 +0.5);
  - −14.0 LUFS; decoded peak −1.06 dBFS;
  - no stinger inside speech.
- **The seam:** last frame vs frame 0: 5.19/255 (the indicator stepping to L). Audio −12.4 / −22.2 dBFS. The hook's ding falls 0.15 s after the seam, inside the first measured quarter-second. The beds run continuously across it.

## Voice

Juanito, `eleven_v4`, both takes at once (1,368 credits; take 1 used, 49.4 s), inner pauses capped at 0.32 s, no tempo change. Prompts are in `prompt.json`.

## Care

- Our own words; no real building, agency, company or guard.
- Nothing claimed as verified.
- She is a figure, never a real person; no harm shown.
- The guard is calm and decent.

## Status

No user approval and no listening pass.
