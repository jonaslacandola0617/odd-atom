# Episode 4: "Rules for the Night Shift" (v1)

**Delivery:** `assets/videos/ep04-night-v1/ep04-rules-for-the-night-shift.mp4` (1080×1920, 30 fps, 1,673 frames, 55.79 s container, H.264 two-pass 6.2 Mbit/s tuned for grain, AAC 192k; 44.4 MB; sha256 `65661ba2f9b2fb3742a7859639f3ad36dc4726b79b99905e56bf45c4f620b24e`) with its poster `ep04-rules-for-the-night-shift-poster.png` (the filled log, frame 1330). It has **no user approval** yet.

**Source:** `Ep04RulesForTheNightShift` in `src/horror/ep04/` (`world.tsx`: the station room, the hut, the anemometer, the cable car, the ridge, the footprints and the snow; `Episode04.tsx`: the shot list, the rule sheet, monitor, log and clock textures, the peephole, captions and the tape layer). The worker reuses `Human` from `src/horror/ep01/world.tsx`. The story is the **original** script #7 in `docs/stories/season-1-shorts.md`, the next in the season's release order (8 → 1 → 6 → **7**), cut to 11 rules lines and one line at the door.

## Story told by the picture

The voice reads the rules. The picture shows each rule being tested on one night at Kestrel Ridge.

| # | Time (s) | Shot | What the picture says |
|---|---|---|---|
| A | 0.0 | The rule sheet taped by the monitor, the north window beside it, snow lashing the glass | **Hook on frame 0**: "You are alone up here until morning. Follow these rules." Rule 7 is already on the sheet |
| B | 4.3 | From the station: the red cable car going down into the storm | The last way off the mountain leaves |
| C | 7.2 | Insert: a hand writes 22:00, −14.2 in the log | Rule one |
| D | 9.3 | The anemometer on the roof spinning fast while the snow falls straight down | Rule two: wind on a calm night |
| E | 12.0 | Over the shoulder: the monitor reads WIND 84 KM/H, flashing; the worker looks up at the ceiling | "Do not go up to check." |
| F1–F2 | 14.4 | The wall phone's bell shakes; tilt down the coiled cord to its cut end | Rule three: it rings with no line |
| G | 19.6 | Through the east window: smooth snow under the door lamp; footprints appear one by one, walking towards the door | Rule four |
| H | 25.3 | Wide: the worker hits the switch; the tubes die | "Turn off every light." |
| I | 26.6 | Dark room from the corner: the worker crouched, the door shaking with knocks, light under it | Rule five: "Knocking is fine." |
| J | 29.3 | The red clock: 04:00 | Rule six |
| K | 31.4 | The worker crosses to the door; more knocks; the peephole and the gap glow | "Someone will say they are the morning shift." |
| L | 34.3 | **Peephole**: snow, the prints ending at the step, nobody | The voice outside, which is the rules voice: "Morning shift. Open the door." |
| M | 37.9 | Insert: the hand on the bolt lets go | "Do not open." |
| N | 41.7 | Profile: the worker's face at the door | "Especially if you recognise the voice." |
| O | 45.0 | Insert, slow push down: every row of the log is filled to 07:00, in the same hand; the last row reads **+37.0** | Rule seven |
| P | 50.6 | Behind the worker at the desk in the dark: the dim monitor, the clock | "Do not turn around." The cut comes before anything is visible |
| A | 54.3 | The hook's own push-in on the sheet, lights on, snow on the glass | **Loop**: the night starts again |

## Viral standard

- **Hook (frame 0):** the rule sheet and a second-person first line.
- **Length:** 55.8 s.
- **Seamless loop:** the last 1.45 s are the hook's camera move on "negative" time, with the lights on and the sheet unmarked, so the last frame flows into frame 0. In sound, the wind, drone and room tone end at their frame-0 levels. The mix measures −22.9 dB in both the first and the last quarter-second.
- **Hidden rewatch details:**
  1. **Rule 7 is on the sheet from frame 0:** "DON'T TURN AROUND", in red.
  2. **The last row of the log** reads **+37.0**: body temperature, on a −16° night.
  3. **A figure in the dark monitor** for four frames at 52.3 s, behind the chair, with a single creak.
  4. **The clock in the last shot reads 03:59**: before the knock, as if the night has started over.
- **The twist in sound:** the voice at the door is the rules voice itself.
- **Open question:** who wrote the log?

## Cinematography

- **One room, one geography:** the sheet and north window, the desk and monitor, the clock above, the phone on the west wall, the door and east window on the east wall, the lamp outside over the door. The prints seen through the east window end at the step seen through the peephole.
- **Shot sizes by purpose:** inserts for every rule's evidence (log, monitor, phone cord, clock, bolt, log again), wides when the room changes state (lights off), and a point of view for the peephole.
- **Motivated light:** fluorescent tubes until the switch; afterwards only the CRT's green, the lamp outside (through the window, the gap under the door and the peephole) and cold night light.
- **Withholding:** nobody is ever seen outside or behind; the last shot cuts on the line.

## Sound (`scripts/ep04_voice.py`, `scripts/ep04_sound.py`)

- **Voice:** MBROLA **us2**, Episode 1's voice, now the channel's voice for fiction (true cases use us1). The rules are played as a recorded orientation tape: band-limited, lightly saturated, a small room. The door line is the same voice through a steel door (low-pass, outdoor wind). "Do not turn around" is close and dry.
- **Structure:** a two-note announcement chime before every numbered rule; before rule seven it is a quarter-tone flat.
- **Ambience:** a blizzard outside (muffled inside), and dead calm in the anemometer shot where only the cups squeak. Fluorescent hum until the lights go off; CRT whine; room tone.
- **Foley:** pen, the monitor alarm, an electromechanical phone bell, the switch, heavy steel knocks (8 dB under the speech they land on), footsteps on linoleum, the cable car.
- **Original score:** a beating B0/F♯1 drone and a high sine cluster that thickens through the night, falling away under the knocks.
- **Library (Curio, user-authorised):** `telemetry_ping`, `low_cinematic_hit`, `steel_latch`, `heartbeat_breath`, `suspense_riser`, `wood_stress`, `gear_ratchet`; paths and hashes are in `public/assets/audio/ep04-night-v1/PROVENANCE.json`. Stems are committed as FLAC.
- **Mix:** **−14.0 LUFS** integrated; the decoded AAC peaks at −1.45 dBFS. Voice margins from the stems:

| Line | Voice − score (dB) | Voice − all other stems (dB) |
|---|---|---|
| l01 | 12.7 | 12.6 |
| l02 | 9.3 | 8.0 |
| l03 | 7.6 | 7.2 |
| l04 | 7.3 | 5.7 |
| l05 | 8.1 | 8.1 |
| l06 | 9.2 | 5.8 |
| l07 | 9.6 | 7.4 |
| door | 8.0 | 8.0 |
| l08 | 6.8 | 6.7 |
| l09 | 11.2 | 10.5 |
| l10 | 5.1 | 5.0 |
| l11 | 5.6 | 5.5 |

In the first mix, "Knocking is fine" sat only 0.9 dB above the knocks it describes; the knocks were lowered 7 dB. **No listening pass was possible in this runtime.**

## Reproduce

```
npm run voice:ep04
npm run sound:ep04
npm run still:ep04
npm run render:ep04
python3 scripts/caption_check.py src/data/ep04-night-v1-timeline.json assets/videos/ep04-night-v1/ep04-rules-for-the-night-shift.mp4 out/oddatom/ep04-captions
```

This needs `espeak-ng mbrola mbrola-us2` and software WebGL (`gl: 'swangle'`).

## Still review passes

1. **First pass:**
   - The hook showed no window. The north window was moved beside the sheet, and the sheet was narrowed so both fit in frame 0.
   - The cable car was hidden under the ridge's snow shelf, so the shelf was shortened.
   - The east-window shot was fogged and showed no prints.
   - The camera sat inside the crouching worker.
   - The door was unlit (light now leaks under the door and through the peephole).
   - The face and final framings were too tight to read the monitor and clock.
2. **Second pass:** the hook window was half covered by an exterior wall block, now cut back. The prints were made darker and larger. The peephole was aimed down to the step. The east-window shot was aimed along the line of prints so they visibly advance on the door.

## Review of the encoded file

- **Decode and frames:** decodes with `ffmpeg -f null` without errors; 1,673 frames at 30 fps, with audio.
- **Loop:** the mean absolute luma difference between the last frame and frame 0 is 3.7/255; between frames 0 and 1–4 of the opening it is 2.3–3.1. The seam reads as the push-in continuing, plus tape noise and snow.
- **Contact sheet:** one frame every 2 s from the encoded file, inspected shot by shot.
- **Captions:** `scripts/caption_check.py` extracted all 13 caption pages (rule two pages across two screens) from the encoded file. Each was read against the script word for word: all are complete.

## Known limits

- From 0.35 s the first caption covers the bottom rows of the rule sheet, so hidden rule 7 is clearest in the first ten frames and in the loop shot.

- The anemometer reads small in its shot; the calm is carried by the straight-falling snow and the sound.
- The hand inserts (pen, bolt) are blocky PS1 hands.
- The worker's face is the minimal PS1 face used across the season.
- No listening pass; no user approval.
