# Episode 30: "What They Tell You" (v1), the Season 3 finale

**Delivery:** `assets/videos/ep30-poveglia-v1/ep30-what-they-tell-you.mp4` (1080×1920, 30 fps, 52.5 s, H.264 two-pass tuned for grain, AAC 192k) with its poster `ep30-what-they-tell-you-poster.png` (frame 45: the island at dusk, the birds lifting off the tower). Size and hash are in "Review of the encoded file". It has **no user approval** and **no listening pass**.

**The case:** Poveglia, the Venetian Lagoon, Italy (#30 in `docs/stories/season-3-world.md`). A real island, often called "the most haunted island in the world". Its legend is famous; its record is much quieter, and this episode is about the difference.

## Why this episode looks and sounds like this

- **Rules:** it is built to the motion rule and the no-gimmick-transitions rule (hard cuts only).
- **Form: an unreliable narrator.** Jack tells the legend the way tourists repeat it ("They say…"), over an **old travel film**: warm, faded, sepia, gate weave, dust and a projector flicker. **Each claim is struck by a stamped "RECORD:" card**, one per claim. At "That's what they tell you" **the sound cuts dead and the picture is today**: grey, still, no film effects. The record is told in near silence. The finale's one scare is not a monster: **the boat we came in leaves without us, and someone is standing in it, facing us.**
- **The picture tells it (the mute test):**
  1. **The approach (the hook):** from a boat at dusk, the island, its campanile and the long hospital; **the birds lift off the tower**. RECORD: *people come back; the island is closed to visitors.*
  2. **The field:** tall grass; **it parts in a line coming towards us**, with nothing in it. RECORD: *no source for this number; a quarantine station, 1793–1814.*
  3. **The hospital:** the long façade; **one shutter swings and knocks**. RECORD: *a care home for the elderly, 1922–1968.*
  4. **The tower:** a tilt up the campanile, birds circling; **the bell swings by itself** (no figure: the fall is only a legend, and it is never shown). RECORD: *legend; no record of any such doctor.*
  5. **Today (hard cut, silence):** the hospital corridor, ceiling fallen, ivy, rubble; we walk to the window at the end.
  6. **The window:** the lagoon, grey. **The boat leaves without us; someone stands in its stern, facing us.** RECORD: *empty since 1968.* One bell. Black.
- **Scare placement:** the last frame, as the slate planned, and the dead cut in the middle.
- **Sound language:** the legend is loud, the record is quiet. Bells across the water, the lagoon, the boat, the birds, the grass, a shutter and the stamps build to a wall, which **cuts dead** at "That's what they tell you". Then a hollow room, drips, the lagoon very low, the boat leaving, and one bell.

## Facts and their limits

Checked from **web-search summaries only**: Wikipedia (summary), History Walks Venice, WorldAtlas, Far Out Magazine, World Abandoned, ZME Science, Venice by Venetians.

| Claim in the video | Status |
|---|---|
| "They say…" lines: no one comes back; 160,000 plague victims burned; half the soil is human ash; a doctor who did terrible things in an asylum and fell from the bell tower | **Told as legend, and corrected.** The 160,000 figure and the ash soil have no source historians accept; no record of the doctor or of an asylum has been found (the asylum and the doctor appear to come from TV and internet retellings) |
| A quarantine station for ships, from 1793 | Consistent: the island's buildings were used as a quarantine station (lazaretto) for ships from 1793, most sources say until 1814 |
| Later, a hospital, until 1968 | Consistent: the buildings were converted in 1922 and used as a hospital/care home for the elderly until 1968 (one source says 1969) |
| The island has been empty since 1968 / closed to visitors | Consistent: abandoned since 1968; visiting is not permitted without authorisation. A 2025 concession report is unverified and not used |

**Not used:** plague pits and burial numbers (no reliable figures); any suicide detail; the claims of TV ghost-hunting shows; the 2025 concession.

## Care

- No patient is shown.
- The doctor and his fall are named only as a legend and never depicted: the tower shot shows only the bell.
- No living person is named.
- The island is closed to visitors: no visiting framing, no dares; the first RECORD card says so.

## The cut

| Time (s) | Shot | What the picture shows | Line / card |
|---|---|---|---|
| 0.0 | The approach (film) | The island from the boat; **the birds lift off** (0.4) | "They say no one who goes to Poveglia comes back." / RECORD |
| 5.0 | The field (film) | **The grass parts, coming towards us** | "…a hundred and sixty thousand… human ash." / RECORD |
| 13.7 | The hospital (film) | **A shutter swings and knocks** | "They say a doctor…" / RECORD |
| 18.8 | The tower (film) | Tilt up; **the bell swings by itself**; birds | "And that he climbed the bell tower, and fell." / RECORD |
| 24.0 | | The bells at a wall | "That's what they tell you." |
| 25.3 | Today (grey) | **The sound cuts dead**; the ruined corridor; we walk to the end window | "The record is quieter…" / "Historians can't find the doctor…" |
| 42.2 | The window | **The boat leaves without us; someone stands in it, facing us** | "The island has been empty since nineteen sixty-eight." / RECORD |
| 50.1 | | One bell | |
| 51.9 | | Black → loop | |

## Hidden rewatch details

1. **The RECORD cards never explain the grass, the shutter or the bell.** They correct every claim the narrator makes; nothing corrects what the picture shows.
2. **The boat leaving is the boat we arrived in** (same hull, same colours).
3. **The figure stands where the camera stood** in the first shot.
4. **The last card says "empty since 1968"** while someone stands in the boat under it.
5. **The last bell rings with no tower in the shot.**

**Open question (pinned comment):** if the island is empty, who's in the boat?

## Sound (`scripts/ep30_voice.py`, `scripts/ep30_sound.py`)

- **Narrator:** ElevenLabs `eleven_v4`, **Jack**, English. One call on a new flow (`m6CaQL2c4T1w0O5SY93o`) generated both takes (1,368 credits). Take 1 (42.2 s) is used. Gaps were widened for the RECORD cards; no tempo change.
- **ElevenLabs sound effects** (`eleven_text_to_sound_v2`, 4 prompts × 4 variations, 272 credits): church bells across the lagoon, a motorboat, lagoon water and a single bell strike. They were **picked by measurement, not listening** (`prompt.json`).
- **Synthesized:** the projector flutter, the wings, wind in the grass, the grass parting, the shutter, the RECORD stamps, room tone, drips and one low hit.
- **No score.**
- **Mix:**
  - **Loudness:** −14.0 LUFS; decoded AAC peak −1.62 dBFS.
  - **Bed presence** (phone band; the whole non-voice bed): −8.9 dB during speech and **−0.9 dB in the gaps**. The legend's wall of bells is meant to be loud in the gaps; after the cut the record is near silence.
  - **Line margins:** every line at least 4.8 dB over everything else, with no lifts; l06 and l07, in the silence, are about 16 dB over.
  - **Clash check:** no stinger, stamp or bell strike falls on a word.
  - **Loop seam:** −61.7 dBFS at the tail (black, the bell's decay gone) and −18.7 dBFS at the head (the bells): the loop restarts from silence into the legend.

**No listening pass was possible in this runtime.**

## Reproduce

```
npm run voice:ep30      # needs public/assets/audio/eleven-takes/ep30-take1.mp3
npm run sound:ep30      # needs public/assets/audio/eleven-sfx/ep30-*.mp3
npm run still:ep30
npm run render:ep30
python3 scripts/caption_check.py src/data/ep30-poveglia-v1-timeline.json assets/videos/ep30-poveglia-v1/ep30-what-they-tell-you.mp4 out/oddatom/ep30-captions
```

## Still review passes

1. **The hospital shot was solid black:** trees stood between the camera and the façade; the trees are now kept off that line of sight.
2. **The grass parting could not be seen:** the camera now looks down into the field, the blades are lighter, a warm low sun lights the field, and the parting is wider.
3. **The boat leaving was a speck on black water:** the lagoon of today is a lighter grey, the boat starts closer, and the lens narrows as we watch, so the standing figure reads as a silhouette.
4. **The approach's bow was out of frame:** the camera tilts lower.

## Review of the encoded file

- **File:** 41,869,462 bytes; SHA-256 `961af37a03db3438cf914bd385a5e01dff0df8220e2f397d4962458074eaaf4d`.
- **Streams:**
  - H.264 1080×1920, 1,574 frames, 52.47 s. That is 2 frames short of the 1,576-frame timeline; they fall in the closing black.
  - AAC 52.52 s: the checked `mix.m4a`, muxed with `-c copy`.
  - It decodes with no errors.
- **Loudness:** −14.1 LUFS integrated; peak −1.6 dBFS (ffmpeg ebur128).
- **Key:** mean luma, sampled twice a second, runs 0–96/255 with a median of 50. That is **brighter than the season's dark key** (≤45): the legend is a dusk travel film and the record is grey daylight, by design. Only the closing frames are black.
- **Captions:** all 10 caption cards were found on screen at their timeline times (`out/oddatom/ep30-captions`, not tracked).
- **Muted contact sheet** (every 2 s), in order:
  - the island at dusk, the birds lifting, the first RECORD card;
  - the field with the grass parting, its card;
  - the hospital façade;
  - the tower, the birds and the bell, the "LEGEND" card;
  - the grey corridor, walking to the end window;
  - the lagoon, the boat leaving with the figure standing in it, "EMPTY SINCE 1968";
  - black.

  It reads without sound.

## Known limits

- The island, the hospital, the corridor and the campanile are composites, not surveys of the real buildings.
- The figure in the boat is our dramatisation.
- The effects were chosen without listening.
- No user approval. Re-check every claim in a full source before posting.
