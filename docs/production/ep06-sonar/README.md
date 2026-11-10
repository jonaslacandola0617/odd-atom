# Episode 6: "The Sound That Matched Us" (v1)

**Delivery:** `assets/videos/ep06-sonar-v1/ep06-the-sound-that-matched-us.mp4` with its poster `ep06-the-sound-that-matched-us-poster.png` (the cook's face in the reveal, frame 1220). Encoded-file figures and the sha256 are in the review section below. It has **no user approval** yet.

**Source:** `Ep06TheSoundThatMatchedUs` in `src/horror/ep06/` (`world.tsx`: the compartment, the submarine, the sea; `Episode06.tsx`: the shot list, the waterfall and comparison displays, scare timing, captions, the tape layer). The people reuse `Human` from `src/horror/ep01/world.tsx`. The story is the **original** script #10 in `docs/stories/season-1-shorts.md`, next in the season order (8 → 1 → 6 → 7 → 4 → **10**), cut to 12 lines.

## The user's note and what changed

> "I noticed there's no eerie or creepy background music, I think adding one will help sell it more. Make the videos more scary and horror and creepy."

**Why there was no audible music.** Measured in the phone band (200 Hz–4 kHz), the scores of Episodes 1–5 sat 17–28 dB under the voice during speech, and 21–28 dB under it in the gaps (Episode 4's gaps read −4.8 dB only because of its announcement chimes). Their drones were mostly sub-bass (31–55 Hz), which phone speakers do not reproduce, and their pads were very quiet. The mixes were tuned to stay *below* the voice, with no check that the music was actually *present*.

**The new standard** (`scripts/horror_score.py`, reusable for every episode):
- **Voiced for phones:** all score elements live in roughly 110 Hz–5 kHz. There's a mid-band drone (A2/E3 with harmonics), tremolo string clusters, a detuned music-box theme in A minor with a tritone (A C B D♯ E · A G♯), reversed swells, stingers, a mid-range heartbeat, a riser, and bowed metal.
- **Measured presence:** `presence()` reports the music against the voice in the phone band. Episode 6 measures **−10.9 dB during speech and −5.2 dB in the gaps**, 11–23 dB more present than Episodes 1–5. The music ducks 7 dB under speech and comes back up in every gap.
- **Scare timing:** each stinger hits in **silence**, not on top of a word: just after "Us.", 1.3 s before the reveal line (the voice timeline was opened up for it), and as the dents cut in. Every scare also gets a reversed swell into it, a camera jolt and a tape tear.
- **Silence as a weapon:** at ALL STOP the engine hum and most of the score drop out; only the heartbeat and bowed metal remain until the knocks. Between the knocks there is dead air.
- **Scarier pictures:**
  - a red battle-lamp grade;
  - a point-of-view reveal looking up into the cook's face from below;
  - the cook already standing beside the operator in the wide before the reveal;
  - a two-frame figure in the galley hatchway during the knocks;
  - lamps stuttering and the overhead shaking on each knock.

## Story told by the picture

| # | Time (s) | Shot | What the picture says |
|---|---|---|---|
| A | 0.0 | ECU: the sonar waterfall, one trace dead astern (BRG 180) | **Hook on frame 0**: "Three hundred metres down, something behind you sounds exactly like you." |
| B | 5.6 | Deep: the hull gliding in black water | Where we are. A second dark hull hides far astern |
| C | 8.4 | The compartment in red light: the operator at the console | "Day nine. I am on sonar." |
| D | 11.6 | The side display: LIBRARY, row after row of NO MATCH | "No match." |
| E | 15.9 | **Punch-in**: CONTACT and OWN SHIP signatures, identical; MATCH 100% flashes | "Us." Stinger after the word |
| F | 17.9 | The operator, headphones on, lit green by the display | Realisation; the heartbeat starts |
| G | 20.4 | The loose panel rattling, one screw missing | "...the loose panel we never fixed." |
| H | 23.2 | The telegraph swings to STOP; the bell rings | ALL STOP. The engine dies; silence |
| I | 26.0 | The waterfall: the trace ends | "The contact stops too." |
| J | 29.0 | Wide: the crew frozen, looking up. **The cook is already standing beside the operator** | Rewatch detail |
| K | 32.2 | Overhead and the galley hatch: three knocks shake the pipes and stutter the lamps; **a figure in the hatchway for two frames** | Knock, knock, knock |
| L | 34.7 | Push in on the round galley hatch | "The way our cook knocks on the galley hatch." |
| M | 37.5 | The operator turns his head, slowly | The heartbeat races |
| N | 39.75 | **Point of view, looking up**: the cook right there, red-lit from below, staring; water dripping from his sleeves | Stinger, 1.3 s of silence, then: "Our cook is standing right next to me." |
| O | 44.9 | Dawn: the boat surfacing | "When we surface, nothing is behind us." |
| P | 48.3 | Walking aft along the hull: long parallel gouges | "Only a long scrape down the stern." |
| Q | 51.0 | ECU: the gouges end in **three dents** | Stinger; "From the outside." |
| A | 54.2 | The hook's own push-in on the waterfall | **Loop** |

## Viral standard

- **Hook (frame 0):** the waterfall and a second-person first line.
- **Length:** 55.6 s.
- **Seamless loop:** the last 1.4 s are the hook's camera move. The waterfall is drawn from a loop-continuous timebase, so its scrolling rows and trace continue into frame 0. The drone, strings and engine hum end at their frame-0 levels; the mix measures −16.2 dB in the first quarter-second and −16.0 dB in the last.
- **Hidden rewatch details:**
  1. **A second dark hull** far astern in the deep shot.
  2. **The cook is already beside the operator** in the frozen-crew wide, before the reveal.
  3. **A figure in the galley hatchway** for two frames during the knocks: the cook, in two places at once.
  4. **Water dripping from the cook's sleeves** in the reveal.
  5. **Three dents** at the end of the scrape: the three knocks.
- **Open question:** who was standing next to him?

## Sound (`scripts/ep06_voice.py`, `scripts/ep06_sound.py`, `scripts/horror_score.py`)

- **Voice:** MBROLA **us2** (the channel's fiction voice), slower and lower as a first-person recollection; "Us." and the last line are slower still.
- **Score:** see "The new standard" above. Cue map:
  - the drone and strings are on from frame 0;
  - the music-box theme plays clean at 6 s, detuned at the galley line and slow and flat at dawn;
  - a swell and stinger land after "Us.";
  - a heartbeat runs at 62–78 bpm, then 92–132 bpm into the reveal;
  - near-silence follows ALL STOP, with bowed metal;
  - a riser leads into the knocks;
  - the biggest swell and stinger mark the reveal, with an F/B♭ cluster added;
  - a swell and stinger land on the dents.
- **Foley:** engine hum (off at ALL STOP, back on the surface), sonar pings, the rattling panel, the telegraph lever and bell, three heavy knocks with hull resonance, hull groans, drips, a breath at the reveal, the scrape, the sea and wind at dawn.
- **Library (Curio, user-authorised):** `steel_latch`, `cable_tension`, `wood_stress`, `low_cinematic_hit`, `heartbeat_breath`, `restrained_boom`; paths and hashes are in `public/assets/audio/ep06-sonar-v1/PROVENANCE.json`. Stems are committed as FLAC.
- **Mix:** **−14.4 LUFS** integrated (the post-encode peak check pulled it 0.4 dB under target); the decoded AAC peaks at −1.3 dBFS. Voice margins:

| Line | Phone band: voice − all (dB) | Voice − score (dB) | Voice − all other stems (dB) |
|---|---|---|---|
| l01 | 13.9 | 10.0 | 9.3 |
| l02 | 6.5 | 5.8 | 5.5 |
| l03 | 14.9 | 10.6 | 10.1 |
| l04 | 9.7 | 6.6 | 6.1 |
| l05 | 12.3 | 7.1 | 6.7 |
| l06 | 8.1 | 5.7 | 4.2 |
| l07 | 16.0 | 10.0 | 7.7 |
| l08 | 16.9 | 11.6 | 11.0 |
| l09 | 9.3 | 4.6 | 4.6 |
| l10 | 10.6 | 4.3 | 4.1 |
| l11 | 7.5 | 6.9 | 6.4 |
| l12 | 13.6 | 10.0 | 9.5 |

The first louder mix put the stingers on "Us." and on the reveal line (margins of 1.0 and −1.2 dB). They were moved into silence and the duck deepened from 5 to 7 dB. **No listening pass was possible in this runtime**; the presence and margins are measured.

## Reproduce

```
npm run voice:ep06
npm run sound:ep06
npm run still:ep06
npm run render:ep06
python3 scripts/caption_check.py src/data/ep06-sonar-v1-timeline.json assets/videos/ep06-sonar-v1/ep06-the-sound-that-matched-us.mp4 out/oddatom/ep06-captions
```

## Still review passes

1. **First pass:**
   - The deep shot was black.
   - Several cameras sat too close or inside a character (the panel, the telegraph and captain, the green-lit close-ups).
   - The two-frame figure was out of frame.
   - The reveal showed only the cook's torso; it became a point of view up into his face.
   - The dents were buried inside the hull radius.
2. **Second pass:** the figure was moved in front of the hatch and lit red. The gouges and dents were rebuilt on the hull's actual surface.
3. **Third pass:** the exterior shots stayed dark because their directional lights were placed relative to the submarine, while a directional light always aims at the world origin; their direction was nearly horizontal. They were re-aimed, and the hull and water were lightened.

## Known limits

- The surfacing shot reads as a hull and sail breaking a grey sea, not a dramatic breach.
- The people are minimal PS1 figures; the cook's stare works through framing and light, not detail.
- No listening pass; no user approval.
