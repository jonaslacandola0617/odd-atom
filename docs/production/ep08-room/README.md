# Episode 8: "Room Zero" (v1)

**Delivery:** `assets/videos/ep08-room-v1/ep08-room-zero.mp4` (1080×1920, 30 fps, 1,735 frames, 57.8 s, H.264 two-pass 6.2 Mbit/s tuned for grain, AAC 192k) with its poster `ep08-room-zero-poster.png` (the figure behind the wall in thermal, frame 1250). Size and hash are in "Review of the encoded file". It has **no user approval** and **no listening pass**.

**Source:** `Ep08RoomZero` in `src/horror/ep08/`:
- `world.tsx`: one empty two-storey house inside and out, with a normal and a thermal material set;
- `Episode08.tsx`: the shot list, the heat on the wall, the floor plan, the report, the thermal and phone UI, scare timing, captions and the tape layer.

The inspector reuses `Human` from `src/horror/ep01/world.tsx`. The story is the **original** script #9 in `docs/stories/season-1-shorts.md`, next in the season order (8 → 1 → 6 → 7 → 4 → 10 → 2 → **9**). It is rewritten with a second-person hook and cut to 12 lines.

## The world

- **The house:** x[−4,4], z[−8,6.2], with the front to the street (−z). The stairs rise from the entrance hall to an upstairs hallway that ends in a **blank wall**.
- **Room Zero:** a 2 m strip across the whole width behind that wall, with no door. Outside, its window on the east side wall has its **curtains drawn**; every other window is bare.
- **Thermal shots:** every material switches to the cold end of an ironbow palette, lit by a headlight at the camera. Heat from the room is drawn on the wall's own surface as a heat map (36×75), so the camera "sees" the room through the plaster:
  - a warm field;
  - a faint door-shaped seam and a handle-sized spot;
  - in the scare, a blurred body with its palms against the far side.
- **The thermal UI:** a crosshair, the reading, a palette bar with −2 / 38 °C and a blinking "● IR". It is diegetic: it is the inspector's camera.

## Story told by the picture

| # | Time (s) | Shot | What the picture says |
|---|---|---|---|
| A | 0.0 | **Thermal:** the cold hallway, the end wall glowing; warm footprints on the carpet; reading 37.0 °C | **Hook on frame 0**: "If a wall in your house looks like this on a thermal camera, don't knock." |
| B | 4.45 | The empty house under a grey sky; the van; the sale board | "I inspect houses…" |
| B2 | 8.3 | Thermal: the kitchen skirting, a warm mouse running | "Leaks. Wiring. Mice." |
| C | 11.26 | The cold entrance hall, frosted glass, breath | "…empty for a year… Cold as a fridge." |
| D | 18.48 | Point of view up the stairs | "Upstairs…" |
| D2 | 21.2 | The floor plan on the clipboard: **a faint erased box beyond the end wall** | "On the plans, there's nothing behind it." |
| D3 | 22.6 | Down the upstairs hallway to the blank wall; **2 frames: a pale figure stands at the end** (24.1 s) | |
| E | 24.75 | **Stinger in silence.** Thermal: the warm rectangle; the reading climbs from 4.2 to 36.8 °C, then 37.0; the footprints | "…a warm rectangle. Room sized. Thirty seven degrees." |
| F | 30.16 | The tape measure running along the east side wall | "Outside, I measure." |
| F2 | 33.0 | The east side wall: one bare window and **one with its curtains drawn** | "Two metres of house you can't reach from inside." |
| G | 35.53 | The inspector at the wall, from down the hallway: three knocks (37.4–37.9), dead air, **two knocks answer** (38.25, 38.6); dust falls from the top of the wall | "I knock on the wall." |
| G2 | 38.86 | **Thermal:** a body pressed against the far side, palms up; the reading 37.2 → 37.4; **stinger in silence** at 41.5 | "Something knocks back. Twice." |
| H | 42.85 | The report on the clipboard, written as we watch: POSSIBLE WATER DAMAGE | "I write it up as possible water damage." |
| H2 | 44.9 | The van pulls away from the house | "I don't tell the buyers." |
| I | 47.14 | Evening: the buyers' car, lit windows; **Room Zero's curtained window lit from inside** | "They moved in on Friday…" |
| J | 51.02 | The buyers' photo, on a phone: the hallway with moving boxes, the blank wall | "…why the wall is warm to the touch." |
| K | 54.0 | **Stinger in silence.** The second photo: **a door in the wall, no handle on this side** | "And why there's a door in it now." |
| A | 56.23 | The hook's own thermal push-in on negative time | **Loop** |

## Viral standard

- **Hook (frame 0):** the thermal image and a second-person warning, under 1 s.
- **Length:** 57.8 s.
- **Seamless loop:** the last 1.6 s are the hook's camera move on negative time. The thermal hiss and whine, drone, strings and wind use whole cycles (`qf()`). The mix measures −21.5 dBFS in the first quarter-second and −22.1 dBFS in the last.
- **Hidden rewatch details:** five, listed in the publishing kit.
- **Open question:** what lives in Room Zero? The pinned comment asks who the door is for.

## Sound (`scripts/ep08_voice.py`, `scripts/ep08_sound.py`, `scripts/horror_score.py`)

- **Narrator:** ElevenLabs `eleven_v4`, **True – Crime & Horror Narrator** (`tZssYepgGaQmegsMEXjK`), the channel's fiction voice. The prompt and credits are in `prompt.json`.
  - Pricing was 1,922 credits for 2 takes. Take 1 ran (961 credits, 63.9 s); take 2 failed with the account's free-tier "unusual activity" warning.
  - The take is split with `scripts/eleven_split.py`, with every line at 2.3–4.9 syllables/s.
  - The read was slow, so pauses *inside* a line are shortened to 0.35 s (new in `ep08_voice.py`), then the line is tightened 1.03×.
  - The timeline is built from the real line durations before any picture work.
- **Score (horror standard):**
  - a mid-band drone;
  - tremolo string clusters;
  - the music-box theme, clean over the house, detuned outside, and slow and flat in the evening;
  - reversed swells and **stingers at 24.75, 41.5 and 54.0 s, all in silence**;
  - heartbeats at 60→84 and 74→118 bpm;
  - a riser into the knocks;
  - bowed metal.

  The music drops to −26 dB for the knocks and the answer.
- **The house and the camera:** a cold room tone, wind outside, creaks. The thermal camera has a faint sensor hiss and whine, and a beep every time it comes up; the hook and the loop both start on it.
- **Foley:**
  - the van and front doors;
  - footsteps on the stairs;
  - the clipboard;
  - the tape measure's ratchet out and back;
  - three knuckle knocks on plaster, then **two answering knocks through the wall**: deeper, muffled, with a low hit and a patter of dust;
  - a muffled breath behind the wall;
  - pen on paper, the van pulling away;
  - a phone message tone and a shutter click for each photo.
- **Library (Curio, user-authorised):** `heavy_hinge`, `paper_light_turn`, `wood_stress`, `low_cinematic_hit`, `heartbeat_breath`, `restrained_boom`, `pencil_marks`. Paths and hashes are in `public/assets/audio/ep08-room-v1/PROVENANCE.json`. Stems are FLAC.
- **Mix:**
  - **−14.0 LUFS** integrated; the limiter ceiling was lowered to −2.65 dBFS, so the decoded AAC peaks at **−1.89 dBFS**.
  - **Music presence** (phone band): **−11.0 dB during speech and −3.9 dB in the gaps**, with a 7 dB duck.
  - No line needed a lift.

| Line | Voice − all others (dB) | Phone band (dB) | Voice − score (dB) |
|---|---|---|---|
| l01 | 13.6 | 15.9 | 13.8 |
| l02 | 9.8 | 9.6 | 10.6 |
| l03 | 11.3 | 14.4 | 12.2 |
| l04 | 10.1 | 12.4 | 11.4 |
| l05 | 7.5 | 9.3 | 7.9 |
| l06 | 6.7 | 7.8 | 7.0 |
| l07 | 12.3 | 14.0 | 12.3 |
| l08 (whispered) | 5.8 | 9.6 | 6.9 |
| l09 | 8.8 | 10.8 | 11.3 |
| l10 | 8.2 | 7.0 | 8.5 |
| l11 | 8.7 | 8.3 | 8.7 |
| l12 (whispered) | 8.6 | 13.5 | 9.3 |

**First mix:** the music in the gaps read −1.5 dB (too hot for the −3 to −6 aim). The score was lowered 2.5 dB.

**No listening pass was possible in this runtime**; presence and margins are measured.

## Reproduce

```
npm run voice:ep08      # needs public/assets/audio/eleven-takes/ep08-take1.mp3
npm run sound:ep08
npm run still:ep08
npm run render:ep08
python3 scripts/caption_check.py src/data/ep08-room-v1-timeline.json assets/videos/ep08-room-v1/ep08-room-zero.mp4 out/oddatom/ep08-captions
```

## Still review passes

1. **First pass:**
   - The thermal hook filled the frame with orange, so the warm rectangle had no cold hallway around it. The camera was moved back, so the end wall glows at the end of a cold corridor.
   - The door seam and handle spot were too obvious for a hidden detail.
   - The figure was a hard-edged block. It is now a blurred heat mask, at 0.3–0.42 over the field.
   - The bedroom doors swung *into* the hallway and blocked it.
   - The report sat inside the van's cab.
   - The photos were taken too close, and the new door was the same colour as the wall.
   - The east side wall was unlit.
2. **Second pass:**
   - The knock was shot from behind the inspector's eyes, against a blank wall: unreadable. It became a three-quarter shot from down the hallway with a light near the wall.
   - The tape measure was missing.
   - Two brick boxes overlapped the side windows, hiding the bare one.
   - The first photo had a floating sleeve, replaced by a mug on the boxes.
3. **Third pass:** the inspector's arm is raised to the wall for the knocks, with the rap in the elbow.

## Review of the encoded file

(Filled in after the render.)

## Known limits

- The inspector is a minimal PS1 figure. The scares come from the thermal image and the silences, not from faces.
- The thermal image is a stylised ironbow look, not a physical heat simulation. Heat shows only on the end wall, the footprints and the mouse.
- No listening pass; no user approval.
