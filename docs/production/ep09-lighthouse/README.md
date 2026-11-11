# Episode 9: "The Lighthouse That Went Dark" (v1)

**Delivery:** `assets/videos/ep09-lighthouse-v1/ep09-the-lighthouse-that-went-dark.mp4` (1080×1920, 30 fps, 1,629 frames, 54.3 s, H.264 two-pass 6.2 Mbit/s tuned for grain, AAC 192k) with its poster `ep09-the-lighthouse-that-went-dark-poster.png` (the third man at the door, frame 1230). Size and hash are in "Review of the encoded file". It has **no user approval** and **no listening pass**.

**Source:** `Ep09TheLighthouseThatWentDark` in `src/horror/ep09/`:
- `world.tsx`: the island, the tower, the quarters and the kitchen, both landings, an animated sea, two steamers and a rowing boat;
- `Episode09.tsx`: the shot list, the stopped clock, the calendar, the storm, rain and lightning, the wave, captions and the tape layer.

The keepers reuse `Human` from `src/horror/ep01/world.tsx`. The story is the **true** script #3 in `docs/stories/season-1-shorts.md`, next in the season order (… → 2 → 9 → **3**). It is rewritten with a second-person hook and cut to 11 lines.

## Facts and their limits

Re-checked on 2026-11-11 from web-search summaries only. Wikipedia is blocked in this environment, and no primary record (the Northern Lighthouse Board files, Muirhead's report or Moore's letters) was read in full.

| Claim in the video | Status |
|---|---|
| December 1900; a steamer passing the Flannan Isles sees the light out | Consistent: the *Archtor*, 15 December 1900; reported after it docked at Leith |
| Storms keep the relief boat away until the day after Christmas | Consistent: the tender *Hesperus* arrived on 26 December (an earlier attempt around the 20th is reported as turned back) |
| No flag, no one comes down to meet it | Consistent with the standard account (the flagstaff bare, nobody at the landing) |
| "Inside, the clock has stopped" | Reported from the relief keeper's letters as quoted in secondary sources ("clocks were stopped", "fire was not lighted for some days"). The clock's hands in the video show no claimed time |
| One set of oilskins still on its hook | The standard account from the superintendent's report: two sets of oilskins were gone, one was left |
| Three keepers; all gone | Consistent. They are **not named** in the video |
| Railings at the west landing torn and bent, high above the sea | The superintendent's report as summarised: storm damage at the west landing far above the waterline |
| "The official report suggested two men went down to secure the landing … the third ran out without his coat" | The superintendent's theory, worded as a suggestion, not a fact |
| "A huge wave took them. They were never found." | The usual conclusion (accidental drowning, the bodies never recovered). It stays a theory: the video says "the official report suggested" before it |

**Not used, because they are disputed or called later inventions:**
- the dramatic "logbook entries" (crying, praying, the storm "ended");
- the overturned chair;
- the half-eaten meal.

The table holds three clean mugs and three chairs pushed in.

**Dramatisation:** the calendar crossed off to the 15th, the storm reconstruction (two lanterns going down, the third man running out), the wave and the two-frame lantern are invented images. No one is shown harmed: the wave fills the frame, and the next shot is the empty landing in the morning.

**Before posting:** if possible, read Muirhead's report or the NLB summary for the oilskins, the west-landing damage and the clock.

## Story told by the picture

| # | Time (s) | Shot | What the picture says |
|---|---|---|---|
| A | 0.0 | From the rowing boat: the island and the dark tower on the summit; the bow and the swell | **Hook on frame 0**: "You row toward a lighthouse that should be lit. It has been dark for eleven days." |
| B | 5.49 | Night: a steamer with lit portholes passes; the island's silhouette, the tower dark | The 15th |
| C | 12.07 | Storm at sea: the tender pitching, rain | "Storms keep the relief boat away…" |
| D | 16.29 | From the water: the east landing, steps up the cliff, the **bare flagstaff**, the quarters on top | "No flag. No one comes down to meet it." |
| E | 19.68 | The quarters' open door; **small stinger in silence** at 20.2 | |
| E2 | 21.0 | ECU: the clock on the wall, its hands still; **one tick, then nothing** | "Inside, the clock has stopped." |
| F | 22.91 | The coat hooks by the door: **one set of oilskins, two empty hooks** | |
| G | 26.52 | Wide kitchen: three clean mugs, three chairs pushed in, **cold grey ash in the range**, the **calendar crossed off to the 15th**, the door open to grey light | "Three keepers lived here. All three are gone." |
| H | 31.1 | **Stinger in silence.** The west landing: torn and twisted railings; tilt down the cliff to the sea | "…torn and bent, high above the sea." |
| I | 36.57 | Night storm, from offshore: two lanterns going down the west landing steps | "…two men went down to secure the landing…" |
| I2 | 40.4 | The lamp-lit kitchen: the third man runs out of the door in his shirt; his oilskins stay on the hook | "…ran out without his coat." |
| J | 43.6 | From offshore: the wave rising up the cliff; the lanterns go out as it fills the frame | "A huge wave took them." |
| J2 | 46.2 | The same view, the next morning: calm, grey, the landing empty | "They were never found." |
| K | 48.1 | **Stinger in silence.** From inside the kitchen, toward the open door at night: rain, darkness; **two frames of a lantern far down the path** (51.0 s) | "But no one knows what he saw from the doorway…" |
| A | 52.71 | The hook's own approach on negative time | **Loop** |

## Viral standard

- **Hook (frame 0):** the dark tower from the rowing boat and a second-person first line, under 1 s.
- **Length:** 54.3 s.
- **Seamless loop:** the last 1.6 s are the hook's camera move on negative time. Wind, swell, drone and strings use whole cycles (`qf()`). Frame 0 opens under the first line, with the music already ducked, so the score eases 2.6 dB down over the last 1.6 s. The mix measures −24.4 dBFS in the first quarter-second and −24.9 dBFS in the last.
- **Hidden rewatch details:** the cold ash in the range; three hooks with one set of oilskins; the calendar crossed off to the 15th; three mugs and three chairs pushed in; two frames of a lantern far down the path.
- **Open question:** what did he see from the doorway?

## Sound (`scripts/ep09_voice.py`, `scripts/ep09_sound.py`, `scripts/horror_score.py`)

- **Narrator:** ElevenLabs `eleven_v4`, **Jack – Deep Dark Horror Narrator** (`BVPhWQykET1TSvfGzrUr`).
  - Pricing was 1,782 credits for 2 takes. **Both takes generated** (891 credits each), the first time both have since the account warning started.
  - Both were split and checked: line lengths and syllable rates (3.1–4.9/s) agree within 0.2 s. Take 1 is used; its hook line is the shorter.
  - Pauses inside a line are capped at 0.6 s; there is no tempo change.
- **Score (horror standard):**
  - a mid-band drone;
  - tremolo string clusters;
  - the music-box theme, clean over the night steamer, detuned at the oilskins, and slow and flat in the morning;
  - reversed swells and **stingers at 20.2, 31.1 and 48.1 s, all in silence**;
  - heartbeats at 58→76 and 72→118 bpm;
  - a riser into the wave;
  - bowed metal.

  The wave's roar and the music cut dead into the quiet morning.
- **The island:** gusting wind and sea swell scaled with each shot's weather, rain in the storm and at the doorway, the night steamer's engine, thunder on each lightning flash, breakers.
- **Foley:**
  - oars and rowlocks in the hook and the loop;
  - the quarters' door;
  - **one tick of the stopped clock, then nothing**;
  - the oilskin's rustle;
  - the railings groaning;
  - a chair scraping, the door flung open, running steps;
  - the lantern's creak with the two-frame lantern.
- **Library (Curio, user-authorised):** `wood_stress`, `heavy_hinge`, `cable_tension`, `low_cinematic_hit`, `restrained_boom`, `heartbeat_breath`, `steel_latch`. Paths and hashes are in `public/assets/audio/ep09-lighthouse-v1/PROVENANCE.json`. Stems are FLAC.
- **Mix:**
  - **−14.0 LUFS**; the decoded AAC peaks at **−1.36 dBFS**.
  - **Music presence** (phone band): **−12.2 dB during speech and −3.1 dB in the gaps**, with a 7 dB duck.
  - l09 and l10 (over the storm) were lifted 3.6 and 3.5 dB, to 4.6 dB over everything else. Every other line is 7.0–11.2 dB clear. The lowest phone-band margin is 4.9 dB (l10).

**No listening pass was possible in this runtime**; presence and margins are measured.

## Reproduce

```
npm run voice:ep09      # needs public/assets/audio/eleven-takes/ep09-take1.mp3
npm run sound:ep09
npm run still:ep09
npm run render:ep09
python3 scripts/caption_check.py src/data/ep09-lighthouse-v1-timeline.json assets/videos/ep09-lighthouse-v1/ep09-the-lighthouse-that-went-dark.mp4 out/oddatom/ep09-captions
```

## Still review passes

1. **First pass:**
   - From the rowing boat, the cliff edge hid the tower. The camera moved out to 300 m with a 30° lens.
   - The west landing's railings, steps and the storm reconstruction sat inside the cliff's rock mass, so those shots came out grey or black. Both landings were moved onto the actual cliff face.
   - The wave and morning shots looked into the grass from the clifftop. They are now shot from offshore.
   - The surf boxes were oversized.
   - The night, storm and rock were too dark.
2. **Second pass:**
   - At frame 0, the rowing boat's side swung across the lens. The boat was lowered and its pitch damped.
   - The doorway shot started so close that the opening filled the frame. It now starts back in the lamp-lit kitchen, so the door is framed by the walls.

## Review of the encoded file

- **File:** 43.5 MB; sha256 `c3208744a22f273ea1573bbe0928c1aa57ca14caa4cad5c5360684925cfd40b2`.
- **Decode and frames:** decodes with `ffmpeg -f null` without errors; 1,629 frames at 30 fps (54.3 s), with audio.
- **Loudness:** −14.1 LUFS measured on the encoded file; decoded sample peak −1.38 dBFS.
- **Loop:** the last frame differs from frame 0 by 2.1/255 in mean absolute luma, within the hook's own frame-to-frame motion (1.2–2.2).
- **Contact sheet:** one frame every 2 s from the encoded file, inspected shot by shot. The weakest image is the railings, where the concrete platform dominates; the twisted rails read in the first second of the shot.
- **Captions:** `scripts/caption_check.py` extracted all 14 caption pages from the encoded file. Each was read against the script word for word: all are complete.

## Known limits

- The island is a stack of low-poly slabs: it reads as cliffs and a summit, not a surveyed Eilean Mòr.
- The keepers are minimal PS1 figures, seen only from behind or far away.
- The tender and the steamer are generic period steamers, not models of the *Hesperus* or the *Archtor*.
- No listening pass; no user approval.
