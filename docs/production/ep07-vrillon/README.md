# Episode 7: "This Is the Voice of Vrillon" (v1)

**Delivery:** `assets/videos/ep07-vrillon-v1/ep07-the-voice-of-vrillon.mp4` (1080×1920, 30 fps, 1,793 frames, 59.8 s, H.264 two-pass 6.2 Mbit/s tuned for grain, AAC 192k) with its poster `ep07-the-voice-of-vrillon-poster.png` (the child staring into the lens from the TV's point of view, frame 840). Size and hash are in "Review of the encoded file". It has **no user approval** and **no listening pass**.

**Source:** `Ep07TheVoiceOfVrillon` in `src/horror/ep07/`:
- `world.tsx`: the living room of a terraced house, the terrace and the town, the hill with the transmitter mast, and the transmitter building's interior.
- `Episode07.tsx`: the shot list, the TV picture, the clock and the meters, scare timing, the red grade, captions and the tape layer.

The people reuse `Human` from `src/horror/ep01/world.tsx`. The story is the **true** script #2 in `docs/stories/season-1-shorts.md`, next in the season order (8 → 1 → 6 → 7 → 4 → 10 → **2**). It is rewritten in the second person and cut to 12 narrator lines plus one quoted line.

## Facts and their limits

Re-checked on 2026-11-10 from web-search summaries only. Fetching `en.wikipedia.org` was blocked by this environment's network policy, so no full article or primary newspaper source was read.

| Claim in the video | Status |
|---|---|
| Southern England, Saturday 26 November 1977, about 5:10 pm, during the early evening news | Consistent across summaries (Wikipedia and its Southern Television timeline, Discovery UK, mirrors) |
| Only the **sound** was replaced; the picture continued | Consistent |
| About **six minutes** | Consistent ("six minutes"; one newspaper summary says "more than six minutes") |
| One transmitter, on a hill in Hampshire | Hannington transmitter (north Hampshire), which relayed Southern's signal off-air from Rowridge; a stronger nearby signal is believed to have swamped its sound. The video says only "one transmitter … on a hill in Hampshire" |
| The quoted line "This is the voice of Vrillon, a representative of the Ashtar Galactic Command, speaking to you." | The widely reported wording. It is the only quoted line. The rest is paraphrased ("give up their weapons", "only a short time left"); the exact phrase "weapons of evil" was **not** confirmed in the summaries, so it is not used |
| The station apologised | Summaries say Southern Television, unaware at the time, apologised once viewers phoned in. The apology card on screen is dramatised wording |
| "The broadcasting authority calls it a hoax" | Summaries attribute the hoax verdict, and "a considerable amount of technical know-how", to the IBA |
| No one was ever identified | Consistent; nobody claimed responsibility. **No person is named or implied** |

A Wikipedia talk-page summary notes that contemporaneous 1977 reports may not support the name "Vrillon". The video uses it as the event is remembered.

**Before posting:** if possible, re-read the Wikipedia article's cited newspapers (*Sunday Post*, *Birmingham Post*) for the apology wording and the six-minute figure.

**Dramatisation:** the family, the room, the clock, the meters, the apology card, the second red light and the empty room are invented images. No real broadcast footage or audio is used; the newsreader on screen is a generic low-poly figure, unnamed. The case is treated as an unsolved hoax, not as proof of anything else.

## Story told by the picture

| # | Time (s) | Shot | What the picture says |
|---|---|---|---|
| A | 0.0 | The TV in the dark: the newsreader, lips moving; slow push-in | **Hook on frame 0**: "The man on your television is still talking. But that is not his voice." |
| B | 4.75 | Across the green at dusk: the terrace, TV-blue windows, a sodium lamp; the mast on the hill over the rooftops | Where and when |
| C | 9.85 | The living room from the corner: the family watching | "Families sit down to the early evening news." |
| C2 | 13.2 | ECU: the mantel clock at **5:10** | Hidden detail 1 begins |
| D | 14.64 | Past the child's head to the TV; the picture holds | "…the sound dissolves into a low hum." |
| E | 17.96 | From beside the TV: faces lifting | "And another voice comes through." |
| F | 20.06 | A slow push from behind the settee, past the family, to the glowing TV | The quoted line begins (pale-red caption) |
| F2 | 24.0 | ECU: the newsreader's mouth, still moving, out of time with the voice | The picture never changes |
| G | 27.6 | **Stinger in silence. Point of view from inside the TV:** the child stares into the lens; the mother behind | "Speaking directly to them" |
| H | 30.55 | Low wide: the family frozen; **the child is looking at the back window** | Hidden detail 2 |
| I | 33.97 | ECU: the newsreader; the picture rolls once; **2 frames: the TV shows the room itself** | "…give up their weapons." |
| I2 | 36.6 | Through the back window: the hill, the mast's red lights; **a second red light on a far hill** | Hidden detail 4 |
| J | 39.31 | Low angle up the lattice mast, its building at the foot | "On a hill in Hampshire…" |
| J2 | 40.9 | From behind the mast, down to the town's lights | "…passing it on to the homes below." |
| J3 | 42.3 | The meters inside the building: **VISION normal, SOUND pinned** | Hidden detail 3 |
| K | 43.4 | **Stinger; the sound snaps back**: the TV, the news as normal; the music drops out | "Then the news comes back…" |
| L | 44.16 | Wide from the TV side: the family has not moved | "…as if nothing had happened." |
| M | 47.39 | The apology card on the TV | "The station apologises…" |
| M2 | 49.6 | ECU: the clock at **5:16** | Six minutes exactly |
| N | 51.6 | **Stinger. Years later:** the same corner, the room empty, dust sheets; the TV is dark but **its glass still reflects three people**; for **2 frames** (55.2 s) they are back on the dust sheets | Hidden detail 5 |
| O | 56.0 | Push in on the dark TV; at 57.75 it switches itself on | "Or where it was really coming from." |
| A | 58.18 | The hook's own push-in on negative time | **Loop** |

## Viral standard

- **Hook (frame 0):** the newsreader on the CRT and a second-person first line, under 1 s.
- **Length:** 59.8 s.
- **Seamless loop:** the TV switches on at 57.75 s, and the last 1.6 s are the hook's camera move on negative time. The news murmur plays at both ends, and the drone, strings, mains hum and wind use whole cycles (`qf()`). The mix measures −21.0 dBFS in the first quarter-second and −20.7 dBFS in the last.
- **Hidden rewatch details:** five, listed in the shot table and in the publishing kit.
- **Open question:** whose voice was it, and where was it really coming from?

## Sound (`scripts/ep07_voice.py`, `scripts/ep07_sound.py`, `scripts/horror_score.py`)

- **Narrator (the new standard):** ElevenLabs `eleven_v4`, **Jack – Deep Dark Horror Narrator** (`BVPhWQykET1TSvfGzrUr`).
  - It is one take with audio tags; the prompt and credits are in `prompt.json`.
  - The take is split with `scripts/eleven_split.py`. A syllable-rate check gives 3.6–5.3 syllables/s on every line, so no line is misassigned.
  - It is tightened 1.06× to fit under 60 s, and the timeline is built from the real line durations **before** the picture.
  - The take's line "No one was ever identified." is cut for length; "no one knows whose voice it was" carries that fact.
  - Pricing was 1,942 credits for 2 takes. One take ran (971 credits); the second did not start ("free generations are busy").
- **The intruding voice:** the ElevenLabs fiction voice was requested, but the generation failed with the account's free-tier warning. The one quoted line is therefore **espeak-ng + MBROLA us2**, heard through a 1970s TV speaker: band-limited, driven, with a 5 Hz warble, a 50 Hz ring and a short slap.
  - A robotic voice is right here: it is diegetic, a voice coming out of a television.
  - Under the "six minutes" a reversed, smeared copy keeps going, too low to make out.
- **The TV:**
  - a newsreader murmur: espeak-ng `en-gb-x-rp` reading generic invented words, low-passed under 1.1 kHz, so it is not intelligible;
  - a 50 Hz mains hum with odd harmonics swells out of it and holds until the snap-back;
  - an apology-card tone;
  - the switch-on click, a rising whine and static.
- **Score (horror standard):**
  - a mid-band drone;
  - tremolo string clusters;
  - the music-box theme, clean over the town (3.5 dB down for l02), detuned at the window, and slow and flat in the empty room;
  - reversed swells and stingers at **27.6, 43.4 and 51.6 s, all in silence**;
  - heartbeats at 64→96 and 70→112 bpm;
  - a riser into the snap-back;
  - bowed metal.

  After the snap-back the music drops about 18 dB for 2 s, and only the news murmur returns.
- **Foley and places:** room tone and the gas-fire hiss; the mantel clock ticking (louder on the two clock inserts); a tea cup; wind at the mast; the building's transformer hum and tube buzz.
- **Library (Curio, user-authorised):** `steel_latch`, `cable_tension`, `low_cinematic_hit`, `restrained_boom`, `heartbeat_breath`, `radio_noise_bed`. Paths and hashes are in `public/assets/audio/ep07-vrillon-v1/PROVENANCE.json`. Stems are FLAC.
- **Mix:**
  - **−14.0 LUFS** integrated, under a soft limiter whose ceiling was lowered to −1.61 dBFS so the decoded AAC peaks at **−1.59 dBFS**.
  - **Music presence** (phone band): **−12.2 dB during speech and −4.0 dB in the gaps**, with a 7 dB duck.
  - Lines l06–l08 were lifted 0.7, 1.4 and 2.3 dB to reach at least 4.5 dB.

| Line | Voice − all others (dB) | Phone band (dB) | Voice − score (dB) |
|---|---|---|---|
| l01 | 10.9 | 10.6 | 11.4 |
| l02 | 7.1 | 5.8 | 7.5 |
| l03 | 9.1 | 10.7 | 9.6 |
| l04 | 7.7 | 8.4 | 9.2 |
| l05 (whispered) | 5.1 | 8.6 | 6.2 |
| v01 (the intruder) | 10.5 | 16.5 | 11.4 |
| l06 | 4.8 | 5.4 | 6.0 |
| l07 | 4.8 | 7.1 | 5.9 |
| l08 | 4.9 | 6.5 | 6.5 |
| l09 | 17.1 | 16.0 | 20.5 |
| l10 | 8.6 | 11.7 | 9.0 |
| l12 | 7.0 | 5.8 | 7.0 |
| l13 (whispered) | 6.8 | 8.6 | 7.7 |

**First mix:** the lines were peak-normalised, so the whispered l05 and l13 sat 3 dB *under* everything else, and the music in the gaps read −0.8 dB. The lines are now RMS-matched, the score is 3 dB down, and lifts are applied where needed.

**No listening pass was possible in this runtime**; presence and margins are measured.

## Reproduce

```
apt-get install -y espeak-ng mbrola mbrola-us2
npm run voice:ep07      # needs public/assets/audio/eleven-takes/ep07-take1.mp3
npm run sound:ep07
npm run still:ep07
npm run render:ep07
python3 scripts/caption_check.py src/data/ep07-vrillon-v1-timeline.json assets/videos/ep07-vrillon-v1/ep07-the-voice-of-vrillon.mp4 out/oddatom/ep07-captions
```

## Still review passes

1. **First pass:**
   - The TV screen sat inside the cabinet, so every TV shot was blank.
   - The town shot was black, and the mast was a hair on the horizon.
   - The meters were cropped to their middle by the portrait frame.
   - The interiors were too dark.
   - The geography had the mast east, where neither the street nor a window could frame it. It was moved **west**: the street shot looks over the rooftops to the hill, and the through-lounge's back window looks at it too.
2. **Second pass:**
   - The screen was moved in front of the bezel. The town now has an east fill light, dimmer TV windows and sodium pools.
   - The mast got a solid core and glowing beacons.
   - The meters were stacked vertically, and the rooms brightened.
   - The mouth close-ups were too close: the 64×48 picture became giant pixels. They were pulled back.
3. **Third pass:**
   - The point-of-view shot started inside the TV cabinet, behind the bezel, and crossed the screen plane, so it showed the wrong view at its start and end. It was moved in front of and above the glass, with its own cold key light.
   - The window shot was moved off the mullion.
   - The view from the mast was re-aimed so the lattice and the town's lights share the frame.

## Review of the encoded file

(Filled in after the render; see below.)

## Known limits

- The people are minimal PS1 figures. The family's fear works through framing, stillness and light, not faces.
- The far shots (the mast at 300 m, the town from the mast) are small at 180×320. They read as silhouettes and lights, not detail.
- The intruding voice is a processed synthetic voice, not the ElevenLabs fiction voice, because that generation failed.
- No listening pass; no user approval.
