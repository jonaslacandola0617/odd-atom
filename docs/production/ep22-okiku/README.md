# Episode 22: "Eighty-Eight Years" (v1)

**Delivery:** `assets/videos/ep22-okiku-v1/ep22-eighty-eight-years.mp4` (1080×1920, 30 fps, 55.58 s, H.264 two-pass tuned for grain, AAC 192k) with its poster `ep22-eighty-eight-years-poster.png` (frame 30: 1938, the back of her head). Size and hash are in "Review of the encoded file". It has **no user approval** and **no listening pass**.

**The case:** the Okiku doll at Mannenji temple, Iwamizawa, Hokkaido, Japan (#22 in `docs/stories/season-3-world.md`). A real, reported case: a doll kept at a temple whose hair is reported to grow.

## Why this episode looks and sounds like this (Season 3: no shared template)

- **Form:** a **time-lapse from one fixed position**, one "photograph" a year from 1938 to now. The camera is set up again each year, a few millimetres off; the candles, offerings and exposure change from year to year; a year stamp burns in the corner.
- **Scare mechanism: none in the usual sense.** Nothing jumps and nothing is withheld. Over the whole episode, **her hair grows** (a bob in 1938, trimmed once in 1980, longer than ever now) and **her head turns**, a little a year, from the wall to the lens, until she is looking at you over her shoulder. The narration points at it only at the end: "Look where she was facing, at the start. … Look where she's facing now."
- **Scare placement:** the realisation at the end, then breath on the **inside** of the glass.
- **Sound language: one instrument.** A temple bell struck in the gaps as the years run on, and silence.
- **Visual language:** a fixed temple-altar frame in candlelight, a glass case lined with pale silk so the black hair reads in silhouette, warm sepia grading, per-year grain and exposure.

## Facts and their limits

Checked from **web-search summaries only** (Oddity Central, Mythlok, The Ghost in My Machine, All About Japan, blogs and fan wikis); no primary temple statement or Japanese-language source was read.

| Claim in the video | Status |
|---|---|
| Hokkaido, Japan, 1938: a family moving away left a doll at a temple; she is called Okiku | Consistent: the Suzuki family left the doll at Mannenji, Iwamizawa, in 1938 when they moved (one source says to Sakhalin) |
| The story is that she belonged to a little girl who died young | Reported story (told as a story in the video) |
| The priests noticed her hair was growing | Reported (the temple's account as relayed) |
| The temple says it has grown about 25 cm; when it is trimmed, it grows back | Reported in the summaries (about 25 cm; trimmed periodically, said to grow back) |
| Some say it is a child's hair; that has never been shown | Accurate: a test is claimed in one source; no independent confirmation was found |
| Skeptics say old hair can relax and stretch, or that someone is doing it | Consistent with skeptics' explanations (fibres relaxing; human intervention) |

**Not used:** the 1918 purchase and the brother's name (one low-quality source); any date for the girl's death; the "1955 discovery" date. **The head turning is the episode's own dramatisation, not a reported claim**, and the narration does not claim it: it says only "look".

## Care

- The girl the doll is named after is **never shown**, and her death is one gentle line, told as the story.
- The doll is an **original design** (a generic ichimatsu-style doll), not the real doll's likeness and not any film doll.
- The skeptics' explanation is in the narration. No visiting framing; the temple is not named on screen.

## The frame, year by year (one fixed camera)

| Time (s) | Year | What the frame shows | Line |
|---|---|---|---|
| 0.0 | 1938 | The doll in her glass case on the altar, a black bob, **turned away to the wall**; two candles, incense, offerings | "Her hair was short. Once." (hook, frame 0) |
| 3.1 | 1938 → | **The bell**; the years begin to run, one photograph a year | "Hokkaido, Japan. Nineteen thirty-eight…" |
| 13.1 | 1949 | The bell | "The story is that she belonged to a little girl who died young." |
| 18.4 | 1961 | The bell; her hair is past her chin | "Then the priests noticed her hair. It was growing." |
| 23.6 | 1974 | The bell | "The temple says it has grown about twenty-five centimetres…" |
| about 24.6 | 1976 | **A visitor's photograph is pinned to the pillar**; in it, she already faces the camera | |
| about 26.7 | 1980 | **The trim:** scissors and a cut lock on paper on the altar, for one year; the hair is short again | |
| 30.9 | 1988 | The bell; her face has come round into profile | "Some say it is a child's hair…" |
| 36.4 | 2001 | The bell | "Skeptics say old hair can relax and stretch…" |
| 43.4 | 2014 | The last bell; she is almost facing the lens | "Eighty-eight years. Look where she was facing, at the start." |
| 49.3 | 2020s | **Candlelight comes into her eyes** | |
| 51.5 | 2026 | The counter stops at the present; **she is looking at you over her shoulder**; no bell | "Look where she's facing now." (whispered) |
| 53.4 | 2026 | **Breath fogs the inside of the glass** at her face, and fades | |
| 55.6 | → 1938 | Loop: back to the short-haired doll, facing the wall | |

## Hidden rewatch details

1. **The trim year (1980):** scissors and a cut lock of hair on the altar for a single frame-year.
2. **The photograph on the pillar** (from 1976): in it she faces the camera, years before she does.
3. **The candles never burn out in 88 years**: a different stub every year, always lit.
4. **Her eyes catch the light** only in the last years.
5. **The fog is on the inside of the glass.**

**Open question (pinned comment):** what year did she start turning?

## Picture standard

- **Dark key:** the frame measured 15–16/255 mean luma before the silk lining, and about 30–40/255 with it (the lit silk behind her is the point; still under 45).
- **Restraint and realism:** a real-scale altar, a 40 cm doll in a case, candlelight from below; no motion except time.

## Sound (`scripts/ep22_voice.py`, `scripts/ep22_sound.py`)

- **Narrator:** ElevenLabs `eleven_v4`, **Jack – Deep Dark Horror Narrator** (`BVPhWQykET1TSvfGzrUr`), English, on the user's Starter account.
  - **Takes:** one call on a new flow (`H4IWqJsMVIH9qNzkFMBn`) generated **both takes** at once (1,402 credits). Take 1 (43.81 s) is used; take 2 (45.64 s) is kept.
  - **Processing:** split into 9 lines; pauses inside a line capped at 0.45 s; no tempo change; the same gentle compressor and plosive soft-clip as Episode 21.
- **One instrument:** a temple bell (bonsho), synthesized from inharmonic partial pairs that beat slowly, with a wooden striker's thump, struck seven times in the gaps, ducked 7 dB under speech; its pitch drifts a little across the decades. Under it, a near-silent hall tone. At the end, one soft breath as the glass fogs.
- **No library cues, no real recordings.** Stems are FLAC; provenance is in `public/assets/audio/ep22-okiku-v1/PROVENANCE.json`.
- **Mix:**
  - **−14.0 LUFS**; the decoded AAC peaks at **−3.95 dBFS** (limiter ceiling −1.2 dBFS).
  - **Presence** (phone band; the bell is the only music): **−13.6 dB during speech and −3.2 dB in the gaps**.
  - **Line margins:** every line is at least 9.6 dB over everything else (no lifts).
  - **Loop seam:** −42.9 dBFS in the first quarter-second (the first whisper begins), −55.8 dBFS in the last (near silence after the breath). Both sides are near silence.

**No listening pass was possible in this runtime**; presence and margins are measured.

## Reproduce

```
npm run voice:ep22      # needs public/assets/audio/eleven-takes/ep22-take1.mp3
npm run sound:ep22
npm run still:ep22
npm run render:ep22     # muxes the checked mix.m4a over the picture (-c copy), then deletes its bundle
python3 scripts/caption_check.py src/data/ep22-okiku-v1-timeline.json assets/videos/ep22-okiku-v1/ep22-eighty-eight-years.mp4 out/oddatom/ep22-captions
```

## Still review passes

1. **Too tight, and a "face" behind her:** the case filled the frame, and the hanging scroll sat right behind her head, reading as a second face (two dark blocks on a pale square). The camera moved back; the scroll moved to the left and its characters were made finer and darker.
2. **Incense smoke cut through the doll** as a grey line; the burner moved off-centre.
3. **The long hair hid inside the kimono** and then, once moved out, **was lost against the dark case**: the case is now lined with pale silk, so the black hair reads in silhouette and its growth is the clearest thing in the frame.
4. **The hair flared out like wings**; the flare was reduced.
5. **The bottom third was black** (the unlit altar front); the camera moved closer and lower, and the candles' glow now reaches the altar cloth.

## Review of the encoded file

(Filled in after the render.)

## Known limits

- The temple, the altar and the doll are composites and an original design; they do not reproduce Mannenji or the real doll.
- The head turning is a dramatisation, said only as "look".
- No listening pass; no user approval. Re-check every claim in a full source before posting.
